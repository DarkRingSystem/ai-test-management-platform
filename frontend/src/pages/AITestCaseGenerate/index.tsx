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
  MenuProps,
  Upload,
  Tag,
  Row,
  Col
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClearOutlined,
  CopyOutlined,
  MoreOutlined,
  ThunderboltOutlined,
  UploadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  DownloadOutlined,
  RedoOutlined,
  UpOutlined,
  DownOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useUserStore } from '../../utils/store';
import testCaseTeamChatService from '../../services/testCaseTeamChat';
import './index.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;
const { Dragger } = Upload;

// 智能体名称映射
const getAgentDisplayName = (agentName: string): string => {
  const agentNames: Record<string, string> = {
    'test_case_generator': '测试用例生成专家',
    'test_case_reviewer': '测试用例评审专家',
    'test_case_optimizer': '测试用例优化专家',
    'system': '系统'
  };
  return agentNames[agentName] || agentName;
};

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  files?: UploadedFile[];
  agentName?: string;
}

interface UploadedFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  content?: string;
}

const AITestCaseGenerate: React.FC = () => {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 会话数据存储键名（支持匿名用户）
  const getStorageKey = (key: string) => `ai_testcase_${user?.id || 'anonymous'}_${key}`;

  // 保存会话数据到localStorage
  const saveSessionData = () => {
    localStorage.setItem(getStorageKey('messages'), JSON.stringify(messages));
    localStorage.setItem(getStorageKey('sessionId'), sessionId || '');
  };

  // 从localStorage恢复会话数据
  const restoreSessionData = () => {
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
  };

  // 清理会话数据
  const clearSessionData = () => {
    localStorage.removeItem(getStorageKey('messages'));
    localStorage.removeItem(getStorageKey('sessionId'));
  };

  // 组件挂载时恢复会话数据（支持匿名用户）
  useEffect(() => {
    restoreSessionData();
  }, []);

  // 监听messages和sessionId变化，自动保存
  useEffect(() => {
    if (messages.length > 0 || sessionId) {
      saveSessionData();
    }
  }, [messages, sessionId]);

  // 检查是否在底部
  const checkIfAtBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 100; // 100px的阈值
      const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
      setIsAtBottom(atBottom);
      return atBottom;
    }
    return true;
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 处理滚动事件
  const handleScroll = () => {
    checkIfAtBottom();
  };

  // 智能滚动：只有在底部时才自动滚动
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // 初始化时检查是否在底部
  useEffect(() => {
    const timer = setTimeout(() => {
      checkIfAtBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) {
      message.warning('请输入内容或上传文件');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const agentMessages = new Map<string, string>(); // 存储每个智能体的消息ID
      const agentAccumulatedContent = new Map<string, string>(); // 存储每个智能体的累积内容

      // 使用新的团队聊天服务
      await testCaseTeamChatService.sendStreamMessage(
        {
          content: currentInput,
          session_id: sessionId || undefined,
          stream: true,
          additional_context: uploadedFiles.length > 0 ? `用户上传了${uploadedFiles.length}个文件` : undefined,
          file_ids: uploadedFiles.map(f => f.uid)
        },
        (chunk) => {
          // 更新会话ID
          if (chunk.session_id && !sessionId) {
            setSessionId(chunk.session_id);
            saveSessionData();
          }

          // 根据消息类型处理
          if (chunk.type === 'status') {
            // 跳过状态消息，不显示"🤖 AI测试用例生成团队正在协作中..."
            // 状态消息不再显示给用户
          } else if (chunk.type === 'agent_start' && chunk.agent_name) {
            // 智能体开始消息 - 创建新的智能体消息
            const newAgentMessage: ChatMessage = {
              id: `${Date.now()}-${chunk.agent_name}-${Math.random()}`,
              content: '', // 开始时内容为空
              type: 'assistant',
              timestamp: new Date(),
              isStreaming: true,
              agentName: chunk.agent_name
            };

            setMessages(prev => [...prev, newAgentMessage]);
            agentMessages.set(chunk.agent_name, newAgentMessage.id);
            agentAccumulatedContent.set(chunk.agent_name, ''); // 重置累积内容
          } else if (chunk.type === 'chunk' && chunk.agent_name && chunk.agent_name !== 'system') {
            // 智能体chunk消息 - 累积每个chunk的内容
            const existingMessageId = agentMessages.get(chunk.agent_name);

            // 累积内容
            const currentAccumulated = agentAccumulatedContent.get(chunk.agent_name) || '';
            const newAccumulated = currentAccumulated + chunk.content;
            agentAccumulatedContent.set(chunk.agent_name, newAccumulated);

            if (existingMessageId) {
              // 更新现有智能体的消息内容（使用累积的内容）
              setMessages(prev => prev.map(msg =>
                msg.id === existingMessageId
                  ? { ...msg, content: newAccumulated, isStreaming: true }
                  : msg
              ));
            } else {
                // 如果没有现有消息，创建新的智能体消息（使用累积的内容）
                const newAgentMessage: ChatMessage = {
                  id: `${Date.now()}-${chunk.agent_name}-${Math.random()}`,
                  content: newAccumulated,
                  type: 'assistant',
                  timestamp: new Date(),
                  isStreaming: true,
                  agentName: chunk.agent_name
                };

                // 记录智能体消息ID
                agentMessages.set(chunk.agent_name, newAgentMessage.id);

                setMessages(prev => [...prev, newAgentMessage]);
              }
          } else if (chunk.type === 'agent_done' && chunk.agent_name) {
            // 智能体完成消息 - 只更新流式状态，保持现有内容
            const existingMessageId = agentMessages.get(chunk.agent_name);
            if (existingMessageId) {
              setMessages(prev => prev.map(msg =>
                msg.id === existingMessageId
                  ? { ...msg, isStreaming: false } // 只更新流式状态，不改变内容
                  : msg
              ));
            }
          }

          // 处理完成标记
          if (chunk.done || chunk.type === 'done') {
            // 标记所有消息为完成状态
            setMessages(prev => prev.map(msg =>
              msg.isStreaming ? { ...msg, isStreaming: false } : msg
            ));
          }
        },
        (error) => {
          console.error('Stream error:', error);
          message.error('AI响应出错，请重试');
          setIsLoading(false);
        },
        () => {
          // 完成流式响应
          setIsLoading(false);
          setMessages(prev => prev.map(msg =>
            msg.isStreaming ? { ...msg, isStreaming: false } : msg
          ));
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请重试');
      setIsLoading(false);
    }
  };

  // 清空对话
  const handleClearChat = async () => {
    try {
      // 如果有会话ID，先清除服务器端的团队会话
      if (sessionId) {
        await testCaseTeamChatService.clearSession(sessionId);
      }
    } catch (error) {
      console.warn('清除服务器端会话失败:', error);
    }

    setMessages([]);
    setSessionId(null);
    setUploadedFiles([]);
    clearSessionData();
  };

  // 复制消息内容
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 重发消息
  const handleResendMessage = (messageToResend: ChatMessage) => {
    if (messageToResend.type === 'user') {
      // 重发用户消息
      setInputValue(messageToResend.content);
      if (messageToResend.files && messageToResend.files.length > 0) {
        setUploadedFiles(messageToResend.files);
      }
      // 自动聚焦到输入框
      setTimeout(() => {
        textAreaRef.current?.focus();
      }, 100);
    } else {
      // 重发AI消息 - 找到对应的用户消息并重发
      const messageIndex = messages.findIndex(msg => msg.id === messageToResend.id);
      if (messageIndex > 0) {
        const previousUserMessage = messages[messageIndex - 1];
        if (previousUserMessage.type === 'user') {
          handleResendMessage(previousUserMessage);
        }
      }
    }
  };

  // 下载消息为MD格式
  const handleDownloadAsMarkdown = (messageContent: ChatMessage) => {
    const timestamp = messageContent.timestamp.toLocaleString();
    const agentName = messageContent.agentName ? ` - ${getAgentDisplayName(messageContent.agentName)}` : '';
    const messageType = messageContent.type === 'user' ? '用户' : `AI助手${agentName}`;

    let markdownContent = `# ${messageType} - ${timestamp}\n\n`;

    // 添加文件信息（如果有）
    if (messageContent.files && messageContent.files.length > 0) {
      markdownContent += `## 附件文件\n\n`;
      messageContent.files.forEach(file => {
        markdownContent += `- ${file.name} (${formatFileSize(file.size)})\n`;
      });
      markdownContent += `\n`;
    }

    // 添加消息内容
    markdownContent += `## 内容\n\n${messageContent.content}\n`;

    // 创建下载
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${messageType}_${timestamp.replace(/[:/\s]/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('已下载为Markdown文件');
  };

  // 切换消息折叠状态
  const toggleMessageCollapse = (messageId: string) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // 停止生成
  const handleStopGeneration = async () => {
    try {
      // 停止前端流式请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // 停止后端团队对话
      if (sessionId) {
        await testCaseTeamChatService.stopSession(sessionId);
      }

      setIsLoading(false);
      // 停止所有流式消息的状态
      setMessages(prev => prev.map(msg =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      ));
      message.success('已停止生成');
    } catch (error) {
      console.error('停止生成失败:', error);
      setIsLoading(false);
      setMessages(prev => prev.map(msg =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      ));
      message.error('停止生成失败，但已停止前端显示');
    }
  };



  // 文件上传处理
  const handleFileUpload = (file: any) => {
    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过10MB');
      return false;
    }

    // 检查文件类型
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'application/xml',
      'text/xml',
      'application/yaml',
      'text/yaml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ];

    const allowedExtensions = ['.txt', '.md', '.json', '.xml', '.yaml', '.yml', '.doc', '.docx', '.pdf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      message.error('不支持的文件类型，请上传文本、文档或配置文件');
      return false;
    }

    // 检查是否已经上传了相同的文件
    if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
      message.warning('该文件已经上传过了');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const uploadedFile: UploadedFile = {
        uid: file.uid,
        name: file.name,
        size: file.size,
        type: file.type,
        content: e.target?.result as string
      };
      setUploadedFiles(prev => [...prev, uploadedFile]);
      message.success(`文件 "${file.name}" 上传成功`);
    };

    reader.onerror = () => {
      message.error(`文件 "${file.name}" 读取失败`);
    };

    // 根据文件类型选择读取方式
    if (file.type.startsWith('text/') || allowedExtensions.includes(fileExtension)) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsDataURL(file);
    }

    return false; // 阻止默认上传行为
  };

  // 删除上传的文件
  const handleRemoveFile = (uid: string) => {
    setUploadedFiles(prev => prev.filter(file => file.uid !== uid));
  };

  // 消息操作菜单
  const getMessageActions = (message: ChatMessage): MenuProps['items'] => [
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制',
      onClick: () => handleCopyMessage(message.content)
    },
    {
      key: 'resend',
      icon: <RedoOutlined />,
      label: '重发',
      onClick: () => handleResendMessage(message),
      disabled: isLoading // 正在加载时禁用重发
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: '下载为MD',
      onClick: () => handleDownloadAsMarkdown(message)
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
    "根据需求文档生成完整的测试用例",
    "为登录功能生成边界值测试用例",
    "生成API接口的自动化测试用例",
    "创建性能测试场景和用例"
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
            <span>AI 测试用例生成</span>
            <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>
              智能生成高质量测试用例
            </Text>
            {sessionId && (
              <Text type="success" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                • 会话已连接
              </Text>
            )}
          </Space>
        }
        extra={
          <Space>
            {isLoading && (
              <Tooltip title="停止生成">
                <Button
                  type="text"
                  danger
                  icon={<StopOutlined />}
                  onClick={handleStopGeneration}
                />
              </Tooltip>
            )}
            <Tooltip title="清空对话">
              <Button
                type="text"
                icon={<ClearOutlined />}
                onClick={handleClearChat}
                disabled={messages.length === 0}
              />
            </Tooltip>
          </Space>
        }
        className="chat-card"
        styles={{
          body: { 
            padding: 0,
            height: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* 消息列表 */}
        <div
          className="messages-container"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="empty-state">
              <Empty
                image={<RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />}
                description={
                  <div>
                    <Text type="secondary">开始与AI助手对话，生成高质量测试用例</Text>
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        💡 支持上传需求文档、接口文档等文件
                      </Text>
                    </div>
                  </div>
                }
              />
              
              {/* 快捷提示 */}
              <div className="quick-prompts">
                <Text type="secondary" style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
                  快捷提示：
                </Text>
                <Space wrap>
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      size="small"
                      type="text"
                      icon={<ThunderboltOutlined />}
                      onClick={() => handleQuickPrompt(prompt)}
                      style={{ 
                        border: '1px dashed #d9d9d9',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </Space>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className={`message-item ${message.type}`}>
                  <div className="message-avatar">
                    <Avatar
                      size={32}
                      icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      style={{
                        backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a'
                      }}
                    />
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <Text strong style={{ fontSize: '12px' }}>
                        {message.type === 'user'
                          ? user?.full_name || '匿名用户'
                          : message.agentName
                            ? `AI 助手 - ${getAgentDisplayName(message.agentName)}`
                            : 'AI 助手'
                        }
                      </Text>
                      <Text type="secondary" style={{ fontSize: '11px', marginLeft: 8 }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Text>

                      {/* 折叠按钮 - 只对AI助手消息显示 */}
                      {message.type === 'assistant' && (
                        <Button
                          type="text"
                          size="small"
                          icon={collapsedMessages.has(message.id) ? <DownOutlined /> : <UpOutlined />}
                          onClick={() => toggleMessageCollapse(message.id)}
                          style={{ marginLeft: 8, opacity: 0.6 }}
                          title={collapsedMessages.has(message.id) ? '展开' : '折叠'}
                        />
                      )}

                      <Dropdown
                        menu={{ items: getMessageActions(message) }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          style={{ marginLeft: 'auto', opacity: 0.6 }}
                        />
                      </Dropdown>
                    </div>
                    
                    {/* 显示上传的文件 */}
                    {message.files && message.files.length > 0 && !collapsedMessages.has(message.id) && (
                      <div className="message-files" style={{ marginBottom: 8 }}>
                        <Space wrap>
                          {message.files.map((file) => (
                            <Tag
                              key={file.uid}
                              icon={<FileTextOutlined />}
                              color="blue"
                              title={`${file.name} (${formatFileSize(file.size)})`}
                            >
                              {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                              <Text type="secondary" style={{ fontSize: '10px', marginLeft: 4 }}>
                                ({formatFileSize(file.size)})
                              </Text>
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                    {/* 消息内容 - 支持折叠 */}
                    {!collapsedMessages.has(message.id) ? (
                      <div className={`message-text ${message.isStreaming ? 'streaming' : ''}`}>
                        <Paragraph
                          style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {message.content}
                        </Paragraph>
                      </div>
                    ) : (
                      <div className="message-text collapsed">
                        <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                          内容已折叠，点击展开查看...
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message-item assistant">
                  <div className="message-avatar">
                    <Avatar
                      size={32}
                      icon={<RobotOutlined />}
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <Text strong style={{ fontSize: '12px' }}>AI 助手</Text>
                    </div>
                    <div className="message-text">
                      <Space>
                        <Spin size="small" />
                        <Text type="secondary">正在生成测试用例...</Text>
                      </Space>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <Divider style={{ margin: 0 }} />

        {/* 输入区域 */}
        <div className="input-area">
          {/* 文件上传区域 */}
          {uploadedFiles.length > 0 && (
            <div style={{ padding: '8px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  已上传文件 ({uploadedFiles.length}):
                </Text>
              </div>
              <Row gutter={[8, 8]}>
                {uploadedFiles.map((file) => (
                  <Col key={file.uid}>
                    <Tag
                      closable
                      onClose={() => handleRemoveFile(file.uid)}
                      icon={<FileTextOutlined />}
                      color="blue"
                      title={`${file.name} (${formatFileSize(file.size)})`}
                      style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      <span style={{ display: 'inline-block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <Text type="secondary" style={{ fontSize: '10px', marginLeft: 4 }}>
                        ({formatFileSize(file.size)})
                      </Text>
                    </Tag>
                  </Col>
                ))}
              </Row>
            </div>
          )}
          
          <div style={{ padding: '16px' }}>
            {/* 拖拽上传区域 */}
            {messages.length === 0 && uploadedFiles.length === 0 && (
              <div style={{ marginBottom: 16 }}>
                <Dragger
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                  multiple
                  accept=".txt,.md,.doc,.docx,.pdf,.json,.xml,.yaml,.yml"
                  style={{ marginBottom: 16 }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持需求文档、接口文档、用例模板等文件格式
                  </p>
                </Dragger>
              </div>
            )}

            <Space.Compact style={{ width: '100%' }}>
              <Upload
                beforeUpload={handleFileUpload}
                showUploadList={false}
                multiple
                accept=".txt,.md,.doc,.docx,.pdf,.json,.xml,.yaml,.yml"
              >
                <Button icon={<UploadOutlined />} title="上传文件">
                  上传
                </Button>
              </Upload>

              <TextArea
                ref={textAreaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="请输入您的需求，或上传相关文档..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1 }}
                disabled={isLoading}
              />

              {isLoading ? (
                <Button
                  type="default"
                  danger
                  icon={<StopOutlined />}
                  onClick={handleStopGeneration}
                >
                  停止生成
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() && uploadedFiles.length === 0}
                >
                  发送
                </Button>
              )}
            </Space.Compact>

            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              支持上传：需求文档、接口文档、用例模板等文件 | 按 Enter 发送，Shift + Enter 换行
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AITestCaseGenerate;
