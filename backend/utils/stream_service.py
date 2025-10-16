"""
流式处理服务模块
负责处理 SSE 流式响应
"""
from typing import AsyncGenerator, Any
from utils.token_counter import get_token_counter

class SSEMessage(BaseModel):
    """SSE 消息模型"""
    type: Literal["status", "chunk", "message", "tool_call", "tool_result", "done", "error", "tokens", "token_usage", "agent_start", "agent_message", "agent_done", "feedback_request"]
    content: str | dict | list
    tokens: Optional[TokenUsage] = Field(None, description="Token 使用统计")
    token_usage: Optional[Dict[str, Any]] = Field(None, description="Token 使用详情")
    agent_name: Optional[str] = Field(None, description="智能体名称")
    agent_role: Optional[str] = Field(None, description="智能体角色")
    available_agents: Optional[list[str]] = Field(None, description="可用的智能体列表")
    session_id: Optional[str] = Field(None, description="会话 ID")

    def to_sse_format(self) -> str:
        """转换为 SSE 格式"""
        import json
        return f"data: {json.dumps(self.model_dump())}\n\n"

class StreamService:
    """流式处理服务类"""

    def __init__(self):
        """初始化流式处理服务"""
        self.user_message_seen = False
        self.message_count = 0
        self.full_response = ""
        self.token_counter = get_token_counter()
    
    async def process_stream(
        self, 
        event_stream: AsyncGenerator[Any, None],
        user_message: str
    ) -> AsyncGenerator[str, None]:
        """
        处理事件流并生成 SSE 响应
        
        参数:
            event_stream: AutoGen 事件流
            user_message: 用户消息（用于过滤）
            
        生成:
            SSE 格式的字符串
        """
        try:
            # 发送初始状态
            yield self._create_status_message("thinking")
            
            # 重置状态
            self._reset_state()
            
            # 处理事件流
            async for event in event_stream:
                self.message_count += 1
                event_type = self._get_event_type(event)
                
                # 根据事件类型处理
                if event_type == 'TextMessage':
                    async for sse_msg in self._handle_text_message(event, user_message):
                        yield sse_msg
                
                elif event_type == 'ModelClientStreamingChunkEvent':
                    async for sse_msg in self._handle_streaming_chunk(event):
                        yield sse_msg
                
                elif event_type == 'ToolCallRequestEvent':
                    async for sse_msg in self._handle_tool_call(event):
                        yield sse_msg
                
                elif event_type == 'ToolCallExecutionEvent':
                    async for sse_msg in self._handle_tool_result(event):
                        yield sse_msg
            
            # 计算并发送 token 统计
            input_tokens = self.token_counter.count_tokens(user_message)
            output_tokens = self.token_counter.count_tokens(self.full_response)
            total_tokens = input_tokens + output_tokens

            token_usage = TokenUsage(
                total=total_tokens,
                input=input_tokens,
                output=output_tokens
            )

            # 发送 token 统计
            token_message = SSEMessage(
                type="tokens",
                content="",
                tokens=token_usage
            )
            yield token_message.to_sse_format()

            # 发送完成信号
            yield self._create_done_message()

        except Exception as e:
            yield self._create_error_message(str(e))

        finally:
            # 发送最终事件以关闭流
            yield "data: [DONE]\n\n"
    
    def _reset_state(self) -> None:
        """重置内部状态"""
        self.user_message_seen = False
        self.message_count = 0
        self.full_response = ""
    
    def _get_event_type(self, event: Any) -> str:
        """
        获取事件类型
        
        参数:
            event: AutoGen 事件
            
        返回:
            事件类型字符串
        """
        return getattr(event, 'type', type(event).__name__)
    
    async def _handle_text_message(
        self, 
        event: Any, 
        user_message: str
    ) -> AsyncGenerator[str, None]:
        """
        处理文本消息事件
        
        参数:
            event: 文本消息事件
            user_message: 用户消息
            
        生成:
            SSE 格式的字符串
        """
        content = getattr(event, 'content', '')
        source = getattr(event, 'source', '')
        
        # 过滤用户消息
        if self._is_user_message(source, content, user_message):
            self.user_message_seen = True
            return
        
        # 这是 AI 的回复
        if content and content != self.full_response:
            message = SSEMessage(type="message", content=content)
            yield message.to_sse_format()
            self.full_response = content
    
    async def _handle_streaming_chunk(self, event: Any) -> AsyncGenerator[str, None]:
        """
        处理流式文本块事件
        
        参数:
            event: 流式文本块事件
            
        生成:
            SSE 格式的字符串
        """
        chunk_content = getattr(event, 'content', '')
        if chunk_content:
            self.full_response += chunk_content
            message = SSEMessage(type="chunk", content=chunk_content)
            yield message.to_sse_format()
    
    async def _handle_tool_call(self, event: Any) -> AsyncGenerator[str, None]:
        """
        处理工具调用事件
        
        参数:
            event: 工具调用事件
            
        生成:
            SSE 格式的字符串
        """
        tools = getattr(event, 'content', [])
        if tools:
            tool_info = [
                {
                    'name': getattr(t, 'name', ''),
                    'args': getattr(t, 'arguments', '')
                }
                for t in tools
            ]
            message = SSEMessage(type="tool_call", content=tool_info)
            yield message.to_sse_format()
    
    async def _handle_tool_result(self, event: Any) -> AsyncGenerator[str, None]:
        """
        处理工具结果事件
        
        参数:
            event: 工具结果事件
            
        生成:
            SSE 格式的字符串
        """
        results = getattr(event, 'content', [])
        if results:
            result_info = [
                {
                    'name': getattr(r, 'name', ''),
                    'result': getattr(r, 'content', '')
                }
                for r in results
            ]
            message = SSEMessage(type="tool_result", content=result_info)
            yield message.to_sse_format()
    
    def _is_user_message(self, source: str, content: str, user_message: str) -> bool:
        """
        判断是否为用户消息
        
        参数:
            source: 消息来源
            content: 消息内容
            user_message: 用户输入的消息
            
        返回:
            True 如果是用户消息，否则 False
        """
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
    
    def _create_status_message(self, status: str) -> str:
        """创建状态消息"""
        message = SSEMessage(type="status", content=status)
        return message.to_sse_format()
    
    def _create_done_message(self) -> str:
        """创建完成消息"""
        message = SSEMessage(
            type="done",
            content=self.full_response or "响应完成"
        )
        return message.to_sse_format()
    
    def _create_error_message(self, error: str) -> str:
        """创建错误消息"""
        message = SSEMessage(type="error", content=f"错误: {error}")
        return message.to_sse_format()

