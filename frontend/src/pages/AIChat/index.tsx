import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Avatar,
  Typography,
  Spin,
  message,
  Divider,
  Empty,
  Tooltip,
  Dropdown,
  MenuProps
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClearOutlined,
  CopyOutlined,
  MoreOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useUserStore } from '../../utils/store';
import { aiChatService } from '../../services';
import './index.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const AIChat: React.FC = () => {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null); // 添加会话ID状态
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  // 会话数据存储键名
  const getStorageKey = (key: string) => `ai_chat_${user?.id}_${key}`;

  // 保存会话数据到localStorage
  const saveSessionData = () => {
    if (user?.id) {
      localStorage.setItem(getStorageKey('messages'), JSON.stringify(messages));
      localStorage.setItem(getStorageKey('sessionId'), sessionId || '');
    }
  };

  // 从localStorage恢复会话数据
  const restoreSessionData = () => {
    if (user?.id) {
      try {
        const savedMessages = localStorage.getItem(getStorageKey('messages'));
        const savedSessionId = localStorage.getItem(getStorageKey('sessionId'));

        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          // 恢复时间戳为Date对象
          const messagesWithDates = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        }

        if (savedSessionId) {
          setSessionId(savedSessionId);
        }
      } catch (error) {
        console.error('恢复会话数据失败:', error);
      }
    }
  };

  // 清理会话数据
  const clearSessionData = () => {
    if (user?.id) {
      localStorage.removeItem(getStorageKey('messages'));
      localStorage.removeItem(getStorageKey('sessionId'));
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 组件挂载时恢复会话数据
  useEffect(() => {
    if (user?.id) {
      restoreSessionData();
    }
  }, [user?.id]);

  // 监听用户登出，清理会话数据
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setSessionId(null);
    }
  }, [user]);

  // 监听messages和sessionId变化，自动保存
  useEffect(() => {
    if (user?.id && (messages.length > 0 || sessionId)) {
      saveSessionData();
    }
  }, [messages, sessionId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 生成消息ID
  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const assistantMessageId = generateMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    // 添加用户消息和空的助手消息
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setIsLoading(true);
    setStreamingMessageId(assistantMessageId);

    try {
      // 使用AI聊天服务进行流式响应
      await aiChatService.sendStreamMessage(
        {
          content: userMessage.content,
          session_id: sessionId || undefined, // 传递会话ID，null转为undefined
          stream: true
        },
        (chunk) => {
          // 从第一个chunk中获取会话ID
          if ((chunk.conversation_id || chunk.session_id) && !sessionId) {
            setSessionId(chunk.conversation_id || chunk.session_id || '');
          }

          // 处理不同类型的消息
          if (chunk.type === 'status') {
            // 状态消息，更新助手消息内容
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: chunk.content }
                : msg
            ));
          } else if (chunk.type === 'chunk') {
            // chunk消息，累积内容
            setMessages(prev => prev.map(msg => {
              if (msg.id === assistantMessageId) {
                const currentContent = msg.content || '';
                return { ...msg, content: currentContent + chunk.content };
              }
              return msg;
            }));
          } else {
            // 兼容旧格式（累积内容）
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: chunk.content }
                : msg
            ));
          }
        },
        (error) => {
          console.error('Stream error:', error);
          message.error('AI响应出错，请重试');
        },
        () => {
          // 完成流式响应
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          ));
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请重试');
      
      // 移除失败的助手消息
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };



  // 清空对话
  const handleClearChat = () => {
    setMessages([]);
    setSessionId(null); // 重置会话ID，开始新的会话
    clearSessionData(); // 清理localStorage中的会话数据
  };

  // 复制消息内容
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  // 消息操作菜单
  const getMessageActions = (message: ChatMessage): MenuProps['items'] => [
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制',
      onClick: () => handleCopyMessage(message.content)
    }
  ];

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 快捷提示
  const quickPrompts = [
    "如何编写高质量的API测试用例？",
    "性能测试的关键指标有哪些？",
    "推荐一些API自动化测试工具",
    "如何设计有效的测试数据？"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
    textAreaRef.current?.focus();
  };

  return (
    <div className="ai-chat-container">
      <Card 
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI 智能助手</span>
            <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>
              专业的API测试顾问
            </Text>
            {sessionId && (
              <Text type="success" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                • 会话已连接
              </Text>
            )}
          </Space>
        }
        extra={
          <Tooltip title="清空对话">
            <Button 
              type="text" 
              icon={<ClearOutlined />} 
              onClick={handleClearChat}
              disabled={messages.length === 0}
            />
          </Tooltip>
        }
        className="chat-card"
      >
        {/* 消息列表 */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-container">
              <Empty
                image={<RobotOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
                description={
                  <div>
                    <Text strong>欢迎使用AI智能助手！</Text>
                    <br />
                    <Text type="secondary">我可以帮助您解答API测试相关问题</Text>
                  </div>
                }
              />
              
              <Divider>快速开始</Divider>
              
              <div className="quick-prompts">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    type="dashed"
                    size="small"
                    onClick={() => handleQuickPrompt(prompt)}
                    style={{ margin: '4px', textAlign: 'left' }}
                  >
                    <ThunderboltOutlined /> {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`message-item ${message.type}`}>
                <div className="message-avatar">
                  <Avatar
                    size="small"
                    icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a'
                    }}
                    src={message.type === 'user' ? user?.avatar : undefined}
                  />
                </div>
                
                <div className="message-content">
                  <div className="message-header">
                    <Text strong style={{ fontSize: '12px' }}>
                      {message.type === 'user' ? (user?.full_name || user?.username) : 'AI助手'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px', marginLeft: '8px' }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                  </div>
                  
                  <div className="message-body">
                    <Paragraph 
                      style={{ margin: 0, whiteSpace: 'pre-wrap' }}
                      copyable={false}
                    >
                      {message.content}
                      {message.isStreaming && <span className="cursor">|</span>}
                    </Paragraph>
                    
                    {!message.isStreaming && message.content && (
                      <div className="message-actions">
                        <Dropdown 
                          menu={{ items: getMessageActions(message) }}
                          trigger={['click']}
                          placement="bottomRight"
                        >
                          <Button type="text" size="small" icon={<MoreOutlined />} />
                        </Dropdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && streamingMessageId && (
            <div className="typing-indicator">
              <Spin size="small" />
              <Text type="secondary" style={{ marginLeft: '8px' }}>AI正在思考...</Text>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="input-container">
          <div className="input-wrapper">
            <TextArea
              ref={textAreaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题... (Shift+Enter 换行，Enter 发送)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isLoading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              loading={isLoading}
              className="send-button"
            >
              发送
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIChat;
