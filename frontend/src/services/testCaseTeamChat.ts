import request from './request';

export interface TeamChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  agentName?: string;
}

export interface TeamChatRequest {
  content: string;
  session_id?: string;
  stream?: boolean;
  additional_context?: string;
  file_ids?: string[];
  is_feedback?: boolean;
  target_agent?: string;
}

export interface TeamChatResponse {
  id: string;
  content: string;
  session_id: string;
  timestamp: string;
  agent_name?: string;
  done: boolean;
  type?: 'status' | 'chunk' | 'message' | 'agent_start' | 'agent_message' | 'agent_done' | 'done' | 'error';
}

class TestCaseTeamChatService {
  /**
   * 发送团队流式聊天消息
   */
  async sendStreamMessage(
    data: TeamChatRequest,
    onMessage: (chunk: TeamChatResponse) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      // 无需认证，直接发送请求到后端端口
      const response = await fetch('http://localhost:8000/api/v1/ai-testcase-team/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
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
              const chunk: TeamChatResponse = JSON.parse(data);
              onMessage(chunk);
            } catch (error) {
              console.error('Error parsing SSE data:', error, 'Raw data:', data);
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
   * 停止团队对话（不清除会话）
   */
  async stopSession(sessionId: string): Promise<void> {
    // 直接发送请求到后端端口
    const response = await fetch(`http://localhost:8000/api/v1/ai-testcase-team/session/${sessionId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 清除团队会话
   */
  async clearSession(sessionId: string): Promise<void> {
    // 直接发送请求到后端端口
    const response = await fetch(`http://localhost:8000/api/v1/ai-testcase-team/session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }


}

export default new TestCaseTeamChatService();
