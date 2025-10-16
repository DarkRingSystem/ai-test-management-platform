import uuid
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import ModelClientStreamingChunkEvent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import ExternalTermination, TextMentionTermination


from app.utils.deps import get_current_user
from app.models.user import User
from app.core.config import settings
from app.core.llms import _deepseek_model_client
from backend.app.api.ai_chat import load_prompt_from_file


router = APIRouter()

class ChatRequest(BaseModel):
    """AI聊天请求模型"""
    content: str = Field(min_length=1, description="用户消息内容")
    session_id: Optional[str] = Field(default=None, description="会话 ID")
    stream: Optional[bool] = Field(default=True, description="是否为流式消息")
    additional_context: Optional[str] = Field(default=None, description="附加上下文信息")
    file_ids: Optional[list[str]] = Field(None, description="已解析文件的 ID 列表")
    is_feedback: bool = Field(default=False, description="是否为反馈消息")
    target_agent: Optional[str] = Field(None, description="目标智能体名称（用于反馈）")

    model_config = {
        "json_schema_extra": {
            "example": {
                "content": "你好，请介绍一下API测试的最佳实践",
                "session_id": "conv_123",
                "file_ids": ["file_123", "file_456"],
                "stream": True,
                "additional_context": "用户正在学习API测试",
                 "is_feedback": False,
                "target_agent": None
            }
        }
    }

@router.post("/api/chat/testcase/stream")
async def chat_testcase_team(
        request: ChatRequest,
        current_user: User = Depends(get_current_user)
):

    """
    测试用例团队模式的流式聊天响应

    支持两种模式：
    1. 新对话：不传 session_id，创建新的团队会话
    2. 继续对话：传 session_id 和 is_feedback=True，继续之前的会话

    参数:
        request: 包含消息的聊天请求

    返回:
        包含 SSE 格式数据的 StreamingResponse
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
        raise HTTPException(status_code=500, detail=f"团队会话初始化失败: {str(e)}")

    # 创建智能体团队成员

    async def create_test_case_generator_agent():
        """创建第一个智能体测试用例生成智能体"""
        try:
            model_client = _deepseek_model_client()

            # 从文件加载系统消息
            system_message = load_prompt_from_file("test_case_generator.txt")

            # 获取会话历史记录
            history = get_session_history(session_id)
            if history:
                system_message += "\n\n以下是我们之前的对话历史："
                for msg in history[-10:]:  # 只取最近10条记录
                    role = "用户" if msg["role"] == "user" else "助手"
                    system_message += f"\n{role}: {msg['content']}"
                system_message += "\n\n请基于以上对话历史来回答用户的新问题。"

            # 如果有附加上下文，添加到系统消息中
            if request.additional_context:
                system_message += f"\n\n当前上下文：{request.additional_context}"

            test_case_generator_agent = AssistantAgent(
                name="test_case_generator",
                model_client=model_client,
                system_message=system_message,
                reflect_on_tool_use=True,
                model_client_stream=True,
            )
            return test_case_generator_agent
        except Exception as e:
            print(f"❌ 智能体创建失败: {str(e)}")
            print(f"❌ 错误类型: {type(e)}")
            import traceback
            print(f"❌ 错误堆栈: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"智能体创建失败: {str(e)}")

    async def create_test_case_reviewer_agent():
        """创建第二个智能体测试用例评审智能体"""
        try:
            model_client = _deepseek_model_client()

            # 从文件加载系统消息
            system_message = load_prompt_from_file("test_case_reviewer.txt")

            # 获取会话历史记录
            history = get_session_history(session_id)
            if history:
                system_message += "\n\n以下是我们之前的对话历史："
                for msg in history[-10:]:  # 只取最近10条记录
                    role = "用户" if msg["role"] == "user" else "助手"
                    system_message += f"\n{role}: {msg['content']}"
                system_message += "\n\n请基于以上对话历史来回答用户的新问题。"

            # 如果有附加上下文，添加到系统消息中
            if request.additional_context:
                system_message += f"\n\n当前上下文：{request.additional_context}"

            test_case_reviewer_agent = AssistantAgent(
                name="test_case_reviewer",
                model_client=model_client,
                system_message=system_message,
                reflect_on_tool_use=True,
                model_client_stream=True,
            )
            return test_case_reviewer_agent
        except Exception as e:
            print(f"❌ 智能体创建失败: {str(e)}")
            print(f"❌ 错误类型: {type(e)}")
            import traceback
            print(f"❌ 错误堆栈: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"智能体创建失败: {str(e)}")

    async def create_test_case_optimizer_agent():
        """创建第三个智能体测试用例优化智能体"""
        try:
            model_client = _deepseek_model_client()

            # 从文件加载系统消息
            system_message = load_prompt_from_file("test_case_optimizer.txt")

            # 获取会话历史记录
            history = get_session_history(session_id)
            if history:
                system_message += "\n\n以下是我们之前的对话历史："
                for msg in history[-10:]:  # 只取最近10条记录
                    role = "用户" if msg["role"] == "user" else "助手"
                    system_message += f"\n{role}: {msg['content']}"
                system_message += "\n\n请基于以上对话历史来回答用户的新问题。"

            # 如果有附加上下文，添加到系统消息中
            if request.additional_context:
                system_message += f"\n\n当前上下文：{request.additional_context}"

            test_case_reviewer_agent = AssistantAgent(
                name="test_case_optimizer",
                model_client=model_client,
                system_message=system_message,
                reflect_on_tool_use=True,
                model_client_stream=True,
            )
            return test_case_reviewer_agent
        except Exception as e:
            print(f"❌ 智能体创建失败: {str(e)}")
            print(f"❌ 错误类型: {type(e)}")
            import traceback
            print(f"❌ 错误堆栈: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"智能体创建失败: {str(e)}")

    text_termination = TextMentionTermination("APPROVE")

    chat_testcase_team = RoundRobinGroupChat([create_test_case_generator_agent, create_test_case_reviewer_agent], termination_condition=text_termination)
