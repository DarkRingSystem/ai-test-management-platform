import uuid
import os
from datetime import datetime
from typing import Optional, List, Dict, AsyncGenerator
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import SourceMatchTermination, TextMentionTermination, ExternalTermination
from autogen_agentchat.messages import ModelClientStreamingChunkEvent

from app.core.llms import _deepseek_model_client
from utils.sse_stream_service import SSEStreamService

router = APIRouter()

# 全局会话存储
active_sessions: Dict[str, Dict] = {}

# 团队会话存储
team_sessions: Dict[str, RoundRobinGroupChat] = {}

# 外部终止控制存储
external_terminations: Dict[str, ExternalTermination] = {}


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





class TestCaseTeamRequest(BaseModel):
    """AI测试用例团队聊天请求模型"""
    content: str = Field(min_length=1, description="用户消息内容")
    session_id: Optional[str] = Field(default=None, description="会话 ID")
    stream: Optional[bool] = Field(default=True, description="是否为流式消息")
    additional_context: Optional[str] = Field(default=None, description="附加上下文信息")
    file_ids: Optional[List[str]] = Field(default=None, description="已解析文件的 ID 列表")
    is_feedback: bool = Field(default=False, description="是否为反馈消息")
    target_agent: Optional[str] = Field(default=None, description="目标智能体名称（用于反馈）")

    model_config = {
        "json_schema_extra": {
            "example": {
                "content": "请为用户登录功能设计测试用例",
                "session_id": "conv_123",
                "file_ids": ["file_123", "file_456"],
                "stream": True,
                "additional_context": "这是一个Web应用的登录功能",
                "is_feedback": False,
                "target_agent": None
            }
        }
    }


class TestCaseTeamResponse(BaseModel):
    id: str
    content: str
    session_id: str
    timestamp: str
    agent_name: Optional[str] = None
    done: bool


async def create_test_case_generator_agent(session_id: str, additional_context: Optional[str] = None) -> AssistantAgent:
    """创建测试用例生成智能体"""
    try:
        model_client = _deepseek_model_client()

        # 从文件加载系统消息
        system_message = load_prompt_from_file("test_case_generator.txt")



        # 如果有附加上下文，添加到系统消息中
        if additional_context:
            system_message += f"\n\n当前上下文：{additional_context}"

        agent1 = AssistantAgent(
            name="test_case_generator",
            model_client=model_client,
            system_message=system_message,
            reflect_on_tool_use=True,
            model_client_stream=True,
        )
        return agent1
    except Exception as e:
        print(f"❌ 测试用例生成智能体创建失败: {str(e)}")
        print(f"❌ 错误类型: {type(e)}")
        import traceback
        print(f"❌ 错误堆栈: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"智能体创建失败: {str(e)}")


async def create_test_case_reviewer_agent(session_id: str, additional_context: Optional[str] = None) -> AssistantAgent:
    """创建测试用例评审智能体"""
    try:
        model_client = _deepseek_model_client()

        # 从文件加载系统消息
        system_message = load_prompt_from_file("test_case_reviewer.txt")



        # 如果有附加上下文，添加到系统消息中
        if additional_context:
            system_message += f"\n\n当前上下文：{additional_context}"

        agent2 = AssistantAgent(
            name="test_case_reviewer",
            model_client=model_client,
            system_message=system_message,
            reflect_on_tool_use=True,
            model_client_stream=True,
        )
        return agent2
    except Exception as e:
        print(f"❌ 测试用例评审智能体创建失败: {str(e)}")
        print(f"❌ 错误类型: {type(e)}")
        import traceback
        print(f"❌ 错误堆栈: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"智能体创建失败: {str(e)}")


async def create_test_case_optimizer_agent(session_id: str, additional_context: Optional[str] = None) -> AssistantAgent:
    """创建测试用例优化智能体"""
    try:
        model_client = _deepseek_model_client()

        # 从文件加载系统消息
        system_message = load_prompt_from_file("test_case_optimizer.txt")



        # 如果有附加上下文，添加到系统消息中
        if additional_context:
            system_message += f"\n\n当前上下文：{additional_context}"

        agent3 = AssistantAgent(
            name="test_case_optimizer",
            model_client=model_client,
            system_message=system_message,
            reflect_on_tool_use=True,
            model_client_stream=True,
        )
        return agent3
    except Exception as e:
        print(f"❌ 测试用例优化智能体创建失败: {str(e)}")
        print(f"❌ 错误类型: {type(e)}")
        import traceback
        print(f"❌ 错误堆栈: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"智能体创建失败: {str(e)}")



async def run_team_stream(
    team: RoundRobinGroupChat,
    user_message: str,
    session_id: str
) -> AsyncGenerator[str, None]:
    """运行团队流式对话"""
    try:
        print(f"🚀 开始团队流式对话，会话ID: {session_id}")

        # 创建SSE流式服务
        sse_service = SSEStreamService(session_id)

        # 发送状态消息
        yield sse_service.create_status_message("🤖 AI测试用例生成团队正在协作中...")

        # 累积响应内容（用于保存历史记录）
        accumulated_content = ""
        current_agent = None

        # 运行团队并获取流式响应
        async for event in team.run_stream(task=user_message):
            # 处理模型客户端流式chunk事件
            if isinstance(event, ModelClientStreamingChunkEvent):
                if hasattr(event, 'content') and hasattr(event, 'source'):
                    agent_name = event.source
                    chunk_content = event.content

                    # 跳过用户消息
                    if agent_name == 'user':
                        continue

                    # 检测智能体切换
                    if current_agent != agent_name:
                        if current_agent is not None:
                            # 发送前一个智能体完成消息
                            yield sse_service.create_agent_done_message(current_agent, "")

                        # 发送新智能体开始消息
                        yield sse_service.create_agent_start_message(agent_name)
                        current_agent = agent_name

                    # 发送chunk消息
                    if chunk_content:
                        accumulated_content += chunk_content
                        yield sse_service.create_chunk_message(chunk_content, agent_name)

            # 处理任务结果（对话结束）
            elif hasattr(event, '__class__') and 'TaskResult' in str(type(event)):
                # 发送最后一个智能体完成消息
                if current_agent:
                    yield sse_service.create_agent_done_message(current_agent, "")

                # 发送完成消息
                yield sse_service.create_done_message("测试用例生成完成")
                break

        print(f"✅ 团队流式对话完成，会话ID: {session_id}")

    except Exception as e:
        print(f"❌ 团队流式对话运行失败: {str(e)}")
        import traceback
        print(f"❌ 错误堆栈: {traceback.format_exc()}")

        # 使用SSE服务创建错误消息
        sse_service = SSEStreamService(session_id)
        yield sse_service.create_error_message(f"团队对话运行失败: {str(e)}")


@router.post("/stream", response_class=StreamingResponse, summary="AI测试用例团队流式对话")
async def testcase_team_stream(
    request_data: TestCaseTeamRequest,
    request: Request
):
    """
    AI测试用例团队流式对话
    
    支持三个智能体的轮询对话：
    1. test_case_generator - 测试用例生成专家
    2. test_case_reviewer - 测试用例评审专家  
    3. test_case_optimizer - 测试用例优化专家
    
    参数:
        request: 包含消息的聊天请求
        
    返回:
        包含 SSE 格式数据的 StreamingResponse
    """
    try:
        # 获取客户端IP地址
        client_ip = "unknown"
        if request.client:
            client_ip = request.client.host

        print(f"🌐 客户端IP地址: {client_ip}")

        # 校验字段
        if not request_data.content:
            raise HTTPException(status_code=400, detail="消息不能为空")

        # 生成会话ID
        session_id = request_data.session_id or str(uuid.uuid4())

        # 记录当前时间
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 存储会话信息
        active_sessions[session_id] = {
            "start_time": current_time,
            "additional_context": request_data.additional_context,
            "status": "processing",
            "user_id": "anonymous"  # 不需要用户认证
        }

        # 为每次请求创建新的团队实例（避免AutoGen团队状态冲突）
        print(f"🔧 创建团队会话: {session_id}")
        print(f"📝 用户消息: {request_data.content}")

        # 创建智能体团队
        generator_agent = await create_test_case_generator_agent(session_id, request_data.additional_context)
        reviewer_agent = await create_test_case_reviewer_agent(session_id, request_data.additional_context)
        optimizer_agent = await create_test_case_optimizer_agent(session_id, request_data.additional_context)
        print(f"✅ 智能体创建完成")

        # 创建终止条件 - 使用更合理的终止条件
        # 1. 当提到"测试用例生成完成"或"APPROVE"时终止
        # 2. 或者达到最大消息数量时终止（设置较大的值以适应流式输出）
        # 3. 添加更多可能的终止关键词
        text_termination = SourceMatchTermination("test_case_reviewer")

        # 创建外部终止条件，用于手动停止
        external_termination = ExternalTermination()
        external_terminations[session_id] = external_termination

        # 组合终止条件：文本终止 OR 外部终止
        termination_condition = text_termination | external_termination

        # 创建团队（每次都创建新实例）
        team = RoundRobinGroupChat(
            participants=[generator_agent, reviewer_agent, optimizer_agent],
            termination_condition=termination_condition
        )

        # 更新团队会话存储
        team_sessions[session_id] = team

        # 运行团队流式对话
        return StreamingResponse(
            run_team_stream(team, request_data.content, session_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # 禁用 Nginx 缓冲
                "Transfer-Encoding": "chunked",  # 启用分块传输
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 团队会话处理失败: {str(e)}")
        import traceback
        print(f"❌ 错误堆栈: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"团队会话处理失败: {str(e)}")


@router.post("/session/{session_id}/stop", summary="停止团队对话")
async def stop_team_session(
    session_id: str
):
    """停止指定的团队会话（不清除会话，可以恢复）"""
    try:
        # 触发外部终止条件
        if session_id in external_terminations:
            external_terminations[session_id].set()
            return {"message": "团队对话已停止", "session_id": session_id}
        else:
            raise HTTPException(status_code=404, detail="会话不存在或已结束")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 停止团队会话失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"停止团队会话失败: {str(e)}")


@router.delete("/session/{session_id}", summary="清除团队会话")
async def clear_team_session(
    session_id: str
):
    """清除指定的团队会话"""
    try:
        # 清除团队会话
        if session_id in team_sessions:
            del team_sessions[session_id]

        # 清除活动会话
        if session_id in active_sessions:
            del active_sessions[session_id]

        # 清除外部终止条件
        if session_id in external_terminations:
            del external_terminations[session_id]

        return {"message": "团队会话已清除", "session_id": session_id}

    except Exception as e:
        print(f"❌ 清除团队会话失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"清除团队会话失败: {str(e)}")
