import React, { useState, useRef } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  Form,
  Upload,
  Tag,
  Divider,
  List,
  Avatar,
  message,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  RobotOutlined,
  UploadOutlined,
  DownloadOutlined,
  CopyOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useUserStore } from '../../utils/store';
import './index.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TestCase {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
}

interface TestStep {
  id: string;
  action: string;
  element: string;
  value?: string;
  description: string;
}

const UICaseGenerate: React.FC = () => {
  const { user } = useUserStore();
  const [form] = Form.useForm();
  const [generatedCases, setGeneratedCases] = useState<TestCase[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);

  // 生成测试用例
  const handleGenerateTestCases = async (values: any) => {
    setGenerating(true);
    
    try {
      // TODO: 这里将调用UI自动化用例生成的API
      // 暂时模拟生成结果
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockTestCases: TestCase[] = [
        {
          id: '1',
          name: '用户登录功能测试',
          description: '验证用户登录功能的正常流程',
          steps: [
            {
              id: '1',
              action: 'navigate',
              element: 'login_page',
              description: '打开登录页面'
            },
            {
              id: '2',
              action: 'input',
              element: 'username_field',
              value: 'testuser',
              description: '输入用户名'
            },
            {
              id: '3',
              action: 'input',
              element: 'password_field',
              value: 'password123',
              description: '输入密码'
            },
            {
              id: '4',
              action: 'click',
              element: 'login_button',
              description: '点击登录按钮'
            }
          ],
          expectedResult: '用户成功登录，跳转到主页面',
          priority: 'high',
          category: '功能测试',
          tags: ['登录', '认证', '核心功能']
        },
        {
          id: '2',
          name: '登录表单验证测试',
          description: '验证登录表单的输入验证功能',
          steps: [
            {
              id: '1',
              action: 'navigate',
              element: 'login_page',
              description: '打开登录页面'
            },
            {
              id: '2',
              action: 'click',
              element: 'login_button',
              description: '不输入任何信息直接点击登录'
            }
          ],
          expectedResult: '显示用户名和密码必填的错误提示',
          priority: 'medium',
          category: '表单验证',
          tags: ['验证', '错误处理']
        }
      ];

      setGeneratedCases(mockTestCases);
      message.success(`成功生成 ${mockTestCases.length} 个测试用例`);
    } catch (error) {
      console.error('生成测试用例失败:', error);
      message.error('生成测试用例失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 删除测试用例
  const handleDeleteCase = (caseId: string) => {
    setGeneratedCases(prev => prev.filter(c => c.id !== caseId));
    if (selectedCase?.id === caseId) {
      setSelectedCase(null);
    }
    message.success('测试用例已删除');
  };

  // 复制测试用例
  const handleCopyCase = (testCase: TestCase) => {
    const caseText = `
测试用例：${testCase.name}
描述：${testCase.description}
优先级：${testCase.priority}
分类：${testCase.category}

测试步骤：
${testCase.steps.map((step, index) => 
  `${index + 1}. ${step.description} (${step.action}: ${step.element}${step.value ? ` = ${step.value}` : ''})`
).join('\n')}

预期结果：${testCase.expectedResult}
    `.trim();

    navigator.clipboard.writeText(caseText).then(() => {
      message.success('测试用例已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 导出测试用例
  const handleExportCases = () => {
    const exportData = {
      cases: generatedCases,
      exportTime: new Date().toISOString(),
      exportBy: user?.full_name
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ui_test_cases_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('测试用例已导出');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  return (
    <div className="ui-case-generate-container">
      <Row gutter={[24, 24]}>
        {/* 左侧：生成配置 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                <span>用例生成配置</span>
              </Space>
            }
            className="config-card"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerateTestCases}
            >
              <Form.Item
                label="应用类型"
                name="appType"
                rules={[{ required: true, message: '请选择应用类型' }]}
              >
                <Select placeholder="选择应用类型">
                  <Option value="web">Web应用</Option>
                  <Option value="mobile">移动应用</Option>
                  <Option value="desktop">桌面应用</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="测试场景"
                name="scenario"
                rules={[{ required: true, message: '请输入测试场景' }]}
              >
                <TextArea
                  placeholder="描述要测试的功能场景，如：用户登录、商品购买、表单提交等"
                  rows={4}
                />
              </Form.Item>

              <Form.Item
                label="页面元素"
                name="elements"
              >
                <TextArea
                  placeholder="描述页面中的关键元素，如：用户名输入框、密码输入框、登录按钮等"
                  rows={3}
                />
              </Form.Item>

              <Form.Item
                label="测试类型"
                name="testTypes"
              >
                <Select
                  mode="multiple"
                  placeholder="选择测试类型"
                  defaultValue={['functional']}
                >
                  <Option value="functional">功能测试</Option>
                  <Option value="ui">界面测试</Option>
                  <Option value="validation">表单验证</Option>
                  <Option value="navigation">导航测试</Option>
                  <Option value="responsive">响应式测试</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="优先级"
                name="priority"
                initialValue="medium"
              >
                <Select>
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="页面截图"
                name="screenshots"
              >
                <Upload
                  listType="picture-card"
                  accept="image/*"
                  beforeUpload={() => false}
                  maxCount={5}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传截图</div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={generating}
                  block
                  size="large"
                  icon={<RobotOutlined />}
                >
                  {generating ? '正在生成...' : '生成测试用例'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧：生成结果 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <span>生成的测试用例</span>
                <Text type="secondary">({generatedCases.length})</Text>
              </Space>
            }
            extra={
              generatedCases.length > 0 && (
                <Space>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportCases}
                  >
                    导出
                  </Button>
                </Space>
              )
            }
            className="results-card"
          >
            {generating ? (
              <div className="generating-state">
                <Spin size="large" />
                <Title level={4} style={{ marginTop: 16 }}>
                  正在生成测试用例...
                </Title>
                <Text type="secondary">
                  AI正在分析您的需求并生成相应的测试用例
                </Text>
              </div>
            ) : generatedCases.length === 0 ? (
              <Empty
                description="暂无生成的测试用例"
                image={<FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {/* 用例列表 */}
                <Col xs={24} md={10}>
                  <List
                    dataSource={generatedCases}
                    renderItem={(testCase) => (
                      <List.Item
                        className={`case-item ${selectedCase?.id === testCase.id ? 'selected' : ''}`}
                        onClick={() => setSelectedCase(testCase)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              icon={<FileTextOutlined />}
                              style={{ backgroundColor: '#1890ff' }}
                            />
                          }
                          title={
                            <Space>
                              <Text ellipsis style={{ maxWidth: 150 }}>
                                {testCase.name}
                              </Text>
                              <Tag color={getPriorityColor(testCase.priority)}>
                                {testCase.priority}
                              </Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <Text type="secondary" ellipsis>
                                {testCase.description}
                              </Text>
                              <div style={{ marginTop: 4 }}>
                                <Tag>{testCase.category}</Tag>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {testCase.steps.length} 步骤
                                </Text>
                              </div>
                            </div>
                          }
                        />
                        <Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCase(testCase);
                            }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCase(testCase.id);
                            }}
                          />
                        </Space>
                      </List.Item>
                    )}
                  />
                </Col>

                {/* 用例详情 */}
                <Col xs={24} md={14}>
                  {selectedCase ? (
                    <div className="case-detail">
                      <div className="case-header">
                        <Title level={4}>{selectedCase.name}</Title>
                        <Space>
                          <Tag color={getPriorityColor(selectedCase.priority)}>
                            {selectedCase.priority}
                          </Tag>
                          <Tag>{selectedCase.category}</Tag>
                        </Space>
                      </div>

                      <Paragraph>{selectedCase.description}</Paragraph>

                      <Divider />

                      <Title level={5}>测试步骤</Title>
                      <List
                        size="small"
                        dataSource={selectedCase.steps}
                        renderItem={(step, index) => (
                          <List.Item>
                            <Space>
                              <Text strong>{index + 1}.</Text>
                              <div>
                                <Text>{step.description}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {step.action}: {step.element}
                                  {step.value && ` = ${step.value}`}
                                </Text>
                              </div>
                            </Space>
                          </List.Item>
                        )}
                      />

                      <Divider />

                      <Title level={5}>预期结果</Title>
                      <Paragraph>{selectedCase.expectedResult}</Paragraph>

                      <Divider />

                      <Title level={5}>标签</Title>
                      <Space wrap>
                        {selectedCase.tags.map((tag) => (
                          <Tag key={tag} color="blue">{tag}</Tag>
                        ))}
                      </Space>
                    </div>
                  ) : (
                    <Empty
                      description="请选择一个测试用例查看详情"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UICaseGenerate;
