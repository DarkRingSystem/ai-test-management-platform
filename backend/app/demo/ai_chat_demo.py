import asyncio
from datetime import datetime
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import ModelClientStreamingChunkEvent
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional, Dict
import uuid
import re
from pydantic import BaseModel, Field
from backend.app.core.llms import _deepseek_model_client

router = APIRouter()


class ChatRequest(BaseModel):
    """普通聊天请求模型"""
    content: str = Field(..., min_length=1, description="用户消息内容")
    session_id: Optional[str] = Field(None, description="会话 ID")
    file_ids: Optional[list[str]] = Field(None, description="已解析文件的 ID 列表")
    is_feedback: bool = Field(default=False, description="是否为反馈消息")
    target_agent: Optional[str] = Field(None, description="目标智能体名称（用于反馈）")
    stream: Optional[bool] =  Field(default=False, description="是否为流式消息")
    additional_context: Optional[str] = Form(None, description="附加上下文信息")

    class Config:
        json_schema_extra = {
            "example": {
                "content": "你好，请介绍一下量子计算",
                "session_id": "conv_123",
                "file_ids": ["file_123", "file_456"],
                "is_feedback": False,
                "target_agent": None,
                "stream": True,
                "additional_context": "今天是个好天气"
            }
        }

class ChatResponse(BaseModel):
    id: str
    content: str
    conversation_id: str
    timestamp: str

@router.post("/chat/stream", summary="普通流式聊天消息")
async def send_stream_message(request:ChatRequest):
    """用户开始与AI聊天"""

    try:
        # 校验字段
        if not request.message:
            raise HTTPException(status_code=400, detail="消息不能为空")
        
        # 生成会话ID
        session_id = str(uuid.uuid4())

        # 记录当前时间
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 存储会话信息
        active_sessions[session_id] = {
            "start_time": current_time,
            "additional_context": ChatRequest.additional_context,
            "status": "processing"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI死了，会话失败: {str(e)}")

    async def creat_assassistant_agent(session_id: str):
        """创建智能体"""
        try:
            model_client = _deepseek_model_client()
            agent = AssistantAgent(
                name="deepseek-normal-chat",
                model_client=model_client,
                system_message="你是一个专业的AI助手",
                reflect_on_tool_use=True,
                model_client_stream=True,
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"智能体创建失败: {str(e)}")
        return agent
    
    async def run_agent(agent: creat_assassistant_agent, session_id: str):
        """运行智能体,获取流式输出"""
        try:
            stream = ""
            async for event in agent.run_stream(task="你好"):
                if isinstance(event,ModelClientStreamingChunkEvent):
                    stream += event.content
                yield f"data: {stream}\n\n"
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"智能体运行失败: {str(e)}")