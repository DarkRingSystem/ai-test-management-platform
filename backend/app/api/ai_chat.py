import uuid
import os
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import ModelClientStreamingChunkEvent

from utils.sse_stream_service import SSEStreamService
from app.utils.deps import get_current_user
from app.models.user import User
from app.core.config import settings
from app.core.llms import _deepseek_model_client

router = APIRouter()

# 全局会话存储
active_sessions: Dict[str, Dict] = {}

# 存储会话历史记录的字典
session_histories: Dict[str, List[Dict]] = {}


def load_prompt_from_file(filename: str) -> str:
    """
    从文件中加载提示词

    Args:
        filename: 提示词文件名（不包含路径）

    Returns:
        str: 提示词内容

    Raises:
        HTTPException: 当文件不存在或读取失败时
    """
    try:
        # 构建文件路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompts_dir = os.path.join(current_dir, "..", "prompts")
        file_path = os.path.join(prompts_dir, filename)

        # 规范化路径
        file_path = os.path.normpath(file_path)

        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=500,
                detail=f"提示词文件不存在: {filename}"
            )

        # 读取文件内容
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()

        if not content:
            raise HTTPException(
                status_code=500,
                detail=f"提示词文件为空: {filename}"
            )

        print(f"✅ 成功加载提示词文件: {filename}")
        return content

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 加载提示词文件失败: {filename}, 错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"加载提示词文件失败: {str(e)}"
        )

def get_session_history(session_id: str) -> List[Dict]:
    """获取会话历史记录"""
    return session_histories.get(session_id, [])

def add_to_session_history(session_id: str, role: str, content: str):
    """添加消息到会话历史记录"""
    if session_id not in session_histories:
        session_histories[session_id] = []

    session_histories[session_id].append({
        "role": role,
        "content": content,
        "timestamp": datetime.now().isoformat()
    })


class ChatRequest(BaseModel):
    """AI聊天请求模型"""
    content: str = Field(min_length=1, description="用户消息内容")
    session_id: Optional[str] = Field(default=None, description="会话 ID")
    stream: Optional[bool] = Field(default=True, description="是否为流式消息")
    additional_context: Optional[str] = Field(default=None, description="附加上下文信息")

    model_config = {
        "json_schema_extra": {
            "example": {
                "content": "你好，请介绍一下API测试的最佳实践",
                "session_id": "conv_123",
                "stream": True,
                "additional_context": "用户正在学习API测试"
            }
        }
    }

class ChatResponse(BaseModel):
    id: str
    content: str
    conversation_id: str
    timestamp: str

class StreamChatResponse(BaseModel):
    id: str
    content: str
    conversation_id: str
    timestamp: str
    done: bool

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

# 基本都以流式聊天，暂时不使用该接口
@router.post("/message", response_model=ChatResponse, summary="发送聊天消息")
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    发送聊天消息到AI助手（非流式），使用 autogen
    """
    try:
        # 创建模型客户端
        model_client = _deepseek_model_client()

        # 从文件加载系统消息
        system_message = load_prompt_from_file("api_test_assistant.txt")

        if request.additional_context:
            system_message += f"\n\n当前上下文：{request.additional_context}"

        # 创建 AssistantAgent
        agent = AssistantAgent(
            name="api_test_assistant",
            model_client=model_client,
            system_message=system_message,
            reflect_on_tool_use=True,
        )

        # 运行智能体获取响应
        response = await agent.run(task=request.content)
        response_content = response.messages[-1].content if response.messages else "抱歉，我无法处理您的请求。"

        conversation_id = request.session_id or str(int(datetime.now().timestamp()))
        message_id = str(int(datetime.now().timestamp() * 1000))

        return ChatResponse(
            id=message_id,
            content=response_content,
            conversation_id=conversation_id,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI助手响应失败: {str(e)}")

# AI智能助手流式聊天接口
@router.post("/stream", summary="发送流式聊天消息")
async def send_stream_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    发送流式聊天消息到AI助手，使用 autogen 框架
    """
    try:
        # 校验字段
        if not request.content:
            raise HTTPException(status_code=400, detail="消息不能为空")

        # 生成会话ID
        session_id = request.session_id or str(uuid.uuid4())

        # 记录当前时间
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 存储会话信息
        active_sessions[session_id] = {
            "start_time": current_time,
            "additional_context": request.additional_context,
            "status": "processing",
            "user_id": current_user.id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"会话初始化失败: {str(e)}")

    async def create_assistant_agent():
        """创建AI助手智能体"""
        try:
            model_client = _deepseek_model_client()

            # 从文件加载系统消息
            system_message = load_prompt_from_file("api_test_assistant.txt")

            # 如果有附加上下文，添加到系统消息中
            if request.additional_context:
                system_message += f"\n\n当前上下文：{request.additional_context}"

            agent = AssistantAgent(
                name="api_test_assistant",
                model_client=model_client,
                system_message=system_message,
                reflect_on_tool_use=True,
                model_client_stream=True,
            )
            return agent
        except Exception as e:
            print(f"❌ 智能体创建失败: {str(e)}")
            print(f"❌ 错误类型: {type(e)}")
            import traceback
            print(f"❌ 错误堆栈: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"智能体创建失败: {str(e)}")

    async def run_agent_stream():
        """运行智能体并获取流式输出"""
        try:
            agent = await create_assistant_agent()

            # 创建SSE流式服务
            sse_service = SSEStreamService()

            # 发送状态消息
            yield sse_service.create_status_message("🤖 AI助手正在思考中...")

            # 累积响应内容
            accumulated_content = ""

            # 运行智能体并获取流式响应
            async for event in agent.run_stream(task=request.content):
                if isinstance(event, ModelClientStreamingChunkEvent):
                    # 发送每个chunk
                    if event.content:
                        accumulated_content += event.content
                        yield sse_service.create_chunk_message(event.content, "api_test_assistant")

            # 发送完成消息
            yield sse_service.create_done_message(accumulated_content)

            # 保存对话历史记录
            add_to_session_history(session_id, "user", request.content)
            add_to_session_history(session_id, "assistant", accumulated_content)

            # 更新会话状态
            if session_id in active_sessions:
                active_sessions[session_id]["status"] = "completed"
                active_sessions[session_id]["end_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        except HTTPException:
            raise
        except Exception as e:
            # 更新会话状态为错误
            if session_id in active_sessions:
                active_sessions[session_id]["status"] = "error"
                active_sessions[session_id]["error"] = str(e)
            print(f"❌ 智能体运行失败: {str(e)}")
            print(f"❌ 错误类型: {type(e)}")
            import traceback
            print(f"❌ 错误堆栈: {traceback.format_exc()}")

            # 发送错误消息
            sse_service = SSEStreamService()
            yield sse_service.create_error_message(f"智能体运行失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"智能体运行失败: {str(e)}")

    return StreamingResponse(
        run_agent_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )



@router.get("/sessions", summary="获取活跃会话列表")
async def get_active_sessions(
    current_user: User = Depends(get_current_user)
):
    """
    获取当前用户的活跃会话列表
    """
    user_sessions = {
        session_id: session_data
        for session_id, session_data in active_sessions.items()
        if session_data.get("user_id") == current_user.id
    }
    return {"active_sessions": user_sessions}

@router.get("/conversations", response_model=List[ConversationResponse], summary="获取对话列表")
async def get_conversations(
    current_user: User = Depends(get_current_user)
):
    """
    获取用户的对话列表（从活跃会话中生成）
    """
    conversations = []
    for session_id, session_data in active_sessions.items():
        if session_data.get("user_id") == current_user.id:
            conversations.append(ConversationResponse(
                id=session_id,
                title=f"会话 {session_id[:8]}",
                created_at=session_data.get("start_time", datetime.now().isoformat()),
                updated_at=session_data.get("end_time", session_data.get("start_time", datetime.now().isoformat())),
                message_count=1
            ))
    return conversations

@router.post("/conversation", summary="创建新对话")
async def create_conversation(
    current_user: User = Depends(get_current_user)
):
    """
    创建新的对话会话
    """
    session_id = str(uuid.uuid4())
    active_sessions[session_id] = {
        "start_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "created",
        "user_id": current_user.id
    }
    return {"conversation_id": session_id}

@router.get("/conversation/{conversation_id}", summary="获取对话历史")
async def get_conversation_history(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取指定对话的历史记录
    """
    if conversation_id in active_sessions:
        session_data = active_sessions[conversation_id]
        if session_data.get("user_id") == current_user.id:
            return {"session_id": conversation_id, "session_data": session_data}
    return {"message": "对话不存在或无权限访问"}

@router.delete("/conversation/{conversation_id}", summary="删除对话")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除指定的对话会话
    """
    if conversation_id in active_sessions:
        session_data = active_sessions[conversation_id]
        if session_data.get("user_id") == current_user.id:
            del active_sessions[conversation_id]
            return {"message": "对话已删除"}
    return {"message": "对话不存在或无权限删除"}


