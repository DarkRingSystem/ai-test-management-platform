import request from './request';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  content: string;  // 修改为 content 以匹配后端
  session_id?: string;  // 修改为 session_id 以匹配后端
  stream?: boolean;
  additional_context?: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  conversation_id: string;
  timestamp: string;
}

export interface StreamChatResponse {
  id: string;
  content: string;
  conversation_id?: string;
  session_id?: string;
  timestamp: string;
  done: boolean;
  type?: 'status' | 'chunk' | 'message' | 'agent_start' | 'agent_message' | 'agent_done' | 'done' | 'error';
  agent_name?: string;
}

class AIChatService {
  /**
   * 发送聊天消息
   */
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('http://localhost:8000/api/v1/ai-chat/message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '发送消息失败');
    }

    return response.json();
  }

  /**
   * 发送流式聊天消息
   */
  async sendStreamMessage(
    data: ChatRequest,
    onMessage: (chunk: StreamChatResponse) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      // 获取令牌，优先从 localStorage 获取，如果没有则从 sessionStorage 获取
      const token = localStorage.getItem('access_token') ||
                   localStorage.getItem('token') ||
                   sessionStorage.getItem('access_token') ||
                   sessionStorage.getItem('token');

      if (!token) {
        throw new Error('未找到认证令牌，请重新登录');
      }

      const response = await fetch('http://localhost:8000/api/v1/ai-chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }

            try {
              const chunk: StreamChatResponse = JSON.parse(data);

              // 处理不同类型的消息
              if (chunk.type === 'error') {
                onError?.(new Error(chunk.content));
                return;
              }

              if (chunk.type === 'done') {
                onComplete?.();
                return;
              }

              onMessage(chunk);
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      onError?.(error as Error);
    }
  }

  /**
   * 获取对话历史
   */
  async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`http://localhost:8000/api/v1/ai-chat/conversation/${conversationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '获取对话历史失败');
    }

    return response.json();
  }

  /**
   * 创建新对话
   */
  async createConversation(): Promise<{ conversation_id: string }> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('http://localhost:8000/api/v1/ai-chat/conversation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '创建对话失败');
    }

    return response.json();
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`http://localhost:8000/api/v1/ai-chat/conversation/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '删除对话失败');
    }
  }

  /**
   * 获取用户的对话列表
   */
  async getConversations(): Promise<Array<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    message_count: number;
  }>> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('http://localhost:8000/api/v1/ai-chat/conversations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '获取对话列表失败');
    }

    return response.json();
  }

  /**
   * 模拟流式响应（用于开发测试）
   */
  async simulateStreamResponse(
    message: string,
    onMessage: (chunk: StreamChatResponse) => void,
    onComplete?: () => void
  ): Promise<void> {
    const responses = [
      "我是API测试平台的AI助手，很高兴为您服务！",
      "我可以帮助您解答关于API测试、自动化测试、性能测试等相关问题。",
      "如果您需要帮助编写测试用例、分析测试结果或优化测试流程，请随时告诉我。",
      "您还可以询问关于测试最佳实践、工具推荐或技术问题的建议。"
    ];

    // 根据用户输入选择合适的响应
    let response = responses[0];
    if (message.includes('测试用例') || message.includes('test case')) {
      response = "关于测试用例编写，我建议遵循以下原则：\n\n1. **明确性**: 每个测试用例应该有清晰的目标\n2. **可重复性**: 测试结果应该是可重现的\n3. **独立性**: 测试用例之间不应该相互依赖\n4. **完整性**: 覆盖正常流程和异常情况\n\n您想了解哪个方面的详细信息？";
    } else if (message.includes('性能测试') || message.includes('performance')) {
      response = "性能测试是确保API在各种负载条件下正常工作的关键步骤：\n\n📊 **主要指标**:\n- 响应时间 (Response Time)\n- 吞吐量 (Throughput)\n- 并发用户数 (Concurrent Users)\n- 错误率 (Error Rate)\n\n🛠️ **推荐工具**:\n- JMeter\n- LoadRunner\n- K6\n- Artillery\n\n需要我详细介绍某个工具的使用方法吗？";
    } else if (message.includes('自动化') || message.includes('automation')) {
      response = "API自动化测试可以大大提高测试效率：\n\n🔧 **常用框架**:\n- Postman + Newman\n- REST Assured (Java)\n- Requests + Pytest (Python)\n- SuperTest (Node.js)\n\n✨ **最佳实践**:\n1. 数据驱动测试\n2. 环境配置管理\n3. 断言策略\n4. 报告生成\n5. CI/CD集成\n\n您想深入了解哪个方面？";
    }

    const words = response.split('');
    let currentContent = '';
    const conversationId = Date.now().toString();
    const messageId = Date.now().toString();

    for (let i = 0; i < words.length; i++) {
      currentContent += words[i];
      
      const chunk: StreamChatResponse = {
        id: messageId,
        content: currentContent,
        conversation_id: conversationId,
        timestamp: new Date().toISOString(),
        done: i === words.length - 1
      };

      onMessage(chunk);

      // 模拟打字效果
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    onComplete?.();
  }
}

export const aiChatService = new AIChatService();
export default aiChatService;
