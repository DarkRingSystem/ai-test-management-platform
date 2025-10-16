"""
SSE流式响应服务模块
负责处理 Server-Sent Events (SSE) 协议的流式响应
支持 ai_chat 和 team_chat 的统一流式输出
"""
from typing import AsyncGenerator, Any, Optional, Dict, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import json
import uuid


class SSEMessage(BaseModel):
    """SSE 消息模型"""
    type: Literal["status", "chunk", "message", "agent_start", "agent_message", "agent_done", "done", "error"]
    content: str
    session_id: Optional[str] = Field(None, description="会话 ID")
    agent_name: Optional[str] = Field(None, description="智能体名称")
    timestamp: Optional[str] = Field(None, description="时间戳")
    done: bool = Field(False, description="是否完成")
    id: Optional[str] = Field(None, description="消息 ID")

    def to_sse_format(self) -> str:
        """转换为 SSE 格式"""
        return f"data: {self.model_dump_json()}\n\n"


class SSEStreamService:
    """SSE流式处理服务类"""

    def __init__(self, session_id: Optional[str] = None):
        """初始化SSE流式处理服务"""
        self.session_id = session_id or str(uuid.uuid4())
        self.user_message_seen = False
        self.message_count = 0
        self.agent_accumulated_content: Dict[str, str] = {}
        
    def _reset_state(self) -> None:
        """重置内部状态"""
        self.user_message_seen = False
        self.message_count = 0
        self.agent_accumulated_content.clear()
    
    def _get_event_type(self, event: Any) -> str:
        """获取事件类型"""
        return getattr(event, 'type', type(event).__name__)
    
    def _is_user_message(self, source: str, content: str, user_message: str) -> bool:
        """判断是否为用户消息"""
        # 检查来源
        if source == 'user':
            return True
        
        # 检查内容是否与用户输入相同
        if content == user_message:
            return True
        
        # 检查是否为第一条消息
        if not self.user_message_seen and self.message_count == 1:
            return True
        
        return False
    
    def create_status_message(self, status: str) -> str:
        """创建状态消息"""
        message = SSEMessage(
            type="status",
            content=status,
            session_id=self.session_id,
            timestamp=datetime.now().isoformat(),
            id=str(uuid.uuid4())
        )
        return message.to_sse_format()
    
    def create_chunk_message(self, content: str, agent_name: Optional[str] = None) -> str:
        """创建chunk消息"""
        message = SSEMessage(
            type="chunk",
            content=content,
            session_id=self.session_id,
            agent_name=agent_name,
            timestamp=datetime.now().isoformat(),
            id=str(uuid.uuid4())
        )
        return message.to_sse_format()
    
    def create_message(self, content: str, agent_name: Optional[str] = None) -> str:
        """创建完整消息"""
        message = SSEMessage(
            type="message",
            content=content,
            session_id=self.session_id,
            agent_name=agent_name,
            timestamp=datetime.now().isoformat(),
            id=str(uuid.uuid4())
        )
        return message.to_sse_format()
    
    def create_agent_start_message(self, agent_name: str) -> str:
        """创建智能体开始消息"""
        message = SSEMessage(
            type="agent_start",
            content=f"智能体 {agent_name} 开始工作...",
            session_id=self.session_id,
            agent_name=agent_name,
            timestamp=datetime.now().isoformat(),
            id=str(uuid.uuid4())
        )
        return message.to_sse_format()
    
    def create_agent_done_message(self, agent_name: str, content: str) -> str:
        """创建智能体完成消息"""
        message = SSEMessage(
            type="agent_done",
            content=content,
            session_id=self.session_id,
            agent_name=agent_name,
            timestamp=datetime.now().isoformat(),
            id=str(uuid.uuid4())
        )
        return message.to_sse_format()
    
    def create_done_message(self, content: str = "") -> str:
        """创建完成消息"""
        message = SSEMessage(
            type="done",
            content=content or "响应完成",
            session_id=self.session_id,
            timestamp=datetime.now().isoformat(),
            done=True,
            id=str(uuid.uuid4())
        )
        return message.to_sse_format()
    
    def create_error_message(self, error: str) -> str:
        """创建错误消息"""
        message = SSEMessage(
            type="error",
            content=f"错误: {error}",
            session_id=self.session_id,
            timestamp=datetime.now().isoformat(),
            id=str(uuid.uuid4())
        )
        return message.to_sse_format()
    
    async def process_single_agent_stream(
        self, 
        event_stream: AsyncGenerator[Any, None],
        user_message: str
    ) -> AsyncGenerator[str, None]:
        """
        处理单智能体事件流（用于 ai_chat）
        
        参数:
            event_stream: AutoGen 事件流
            user_message: 用户消息（用于过滤）
            
        生成:
            SSE 格式的字符串
        """
        try:
            # 发送初始状态
            yield self.create_status_message("AI正在思考中...")
            
            # 重置状态
            self._reset_state()
            
            accumulated_content = ""
            
            # 处理事件流
            async for event in event_stream:
                self.message_count += 1
                event_type = self._get_event_type(event)
                
                if event_type == 'ModelClientStreamingChunkEvent':
                    chunk_content = getattr(event, 'content', '')
                    if chunk_content:
                        accumulated_content += chunk_content
                        # 发送chunk消息
                        yield self.create_chunk_message(chunk_content)
                
                elif event_type == 'TextMessage':
                    content = getattr(event, 'content', '')
                    source = getattr(event, 'source', '')
                    
                    # 过滤用户消息
                    if self._is_user_message(source, content, user_message):
                        self.user_message_seen = True
                        continue
                    
                    # 发送完整消息
                    if content and content != accumulated_content:
                        yield self.create_message(content)
                        accumulated_content = content
            
            # 发送完成信号
            yield self.create_done_message(accumulated_content)

        except Exception as e:
            yield self.create_error_message(str(e))

        finally:
            # 发送最终事件以关闭流
            yield "data: [DONE]\n\n"
    
    async def process_team_stream(
        self, 
        event_stream: AsyncGenerator[Any, None],
        user_message: str
    ) -> AsyncGenerator[str, None]:
        """
        处理多智能体团队事件流（用于 team_chat）
        
        参数:
            event_stream: AutoGen Teams 事件流
            user_message: 用户消息（用于过滤）
            
        生成:
            SSE 格式的字符串
        """
        try:
            # 发送初始状态
            yield self.create_status_message("🤖 AI测试用例生成团队正在协作中...")
            
            # 重置状态
            self._reset_state()
            
            # 处理事件流
            async for event in event_stream:
                self.message_count += 1
                event_type = self._get_event_type(event)
                
                # 检查是否是 TaskResult（最终结果）
                if event_type == 'TaskResult':
                    print(f"🏁 团队对话结束，消息总数: {self.message_count}")
                    yield self.create_done_message()
                    yield "data: [DONE]\n\n"
                    return
                
                # 处理 ModelClientStreamingChunkEvent（真正的流式输出）
                elif event_type == 'ModelClientStreamingChunkEvent':
                    if hasattr(event, 'content') and hasattr(event, 'source'):
                        agent_name = event.source
                        chunk_content = event.content

                        # 跳过用户消息
                        if agent_name == 'user':
                            continue

                        # 发送chunk消息
                        yield self.create_chunk_message(chunk_content, agent_name)
                
                # 处理 TextMessage 类型的消息（完整消息）
                elif event_type == 'TextMessage' and hasattr(event, 'content') and hasattr(event, 'source'):
                    # 跳过用户消息（已经显示过了）
                    if event.source == 'user':
                        continue
                    
                    # 发送智能体完整消息
                    if event.content and event.content.strip():
                        yield self.create_agent_done_message(event.source, event.content)
            
            # 如果没有收到 TaskResult，发送默认完成信号
            yield self.create_done_message()

        except Exception as e:
            yield self.create_error_message(str(e))

        finally:
            # 发送最终事件以关闭流
            yield "data: [DONE]\n\n"
