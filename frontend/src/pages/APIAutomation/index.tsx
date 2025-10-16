import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Table,
  Tag,
  Input,
  Select,
  Form,
  message,
  Modal,
  Drawer,
  Tree,
  Upload,
  Divider
} from 'antd';
import {
  ApiOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  SettingOutlined,
  BugOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useUserStore } from '../../utils/store';
import './index.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { TreeNode } = Tree;

interface APITest {
  id: string;
  name: string;
  method: string;
  url: string;
  description: string;
  headers: Record<string, string>;
  body?: string;
  expectedStatus: number;
  expectedResponse?: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  lastRun?: Date;
  duration?: number;
  error?: string;
  folderId?: string;
}

interface TestFolder {
  id: string;
  name: string;
  parentId?: string;
  children?: TestFolder[];
}

const APIAutomation: React.FC = () => {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState('tests');
  const [apiTests, setApiTests] = useState<APITest[]>([
    {
      id: '1',
      name: '用户登录接口',
      method: 'POST',
      url: '/api/v1/auth/login',
      description: '测试用户登录功能',
      headers: { 'Content-Type': 'application/json' },
      body: '{"username": "testuser", "password": "password123"}',
      expectedStatus: 200,
      status: 'pending',
      folderId: 'auth'
    },
    {
      id: '2',
      name: '获取用户信息',
      method: 'GET',
      url: '/api/v1/users/profile',
      description: '获取当前用户信息',
      headers: { 'Authorization': 'Bearer token' },
      expectedStatus: 200,
      status: 'pending',
      folderId: 'user'
    }
  ]);
  
  const [folders, setFolders] = useState<TestFolder[]>([
    { id: 'auth', name: '认证相关' },
    { id: 'user', name: '用户管理' },
    { id: 'order', name: '订单管理' }
  ]);

  const [selectedTest, setSelectedTest] = useState<APITest | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [form] = Form.useForm();

  // 执行单个API测试
  const handleRunTest = async (test: APITest) => {
    setApiTests(prev => prev.map(t => 
      t.id === test.id ? { ...t, status: 'running' } : t
    ));

    try {
      // TODO: 这里将调用实际的API测试
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isSuccess = Math.random() > 0.3;
      const result = {
        status: isSuccess ? 'passed' as const : 'failed' as const,
        duration: Math.random() * 2000 + 500,
        lastRun: new Date(),
        error: isSuccess ? undefined : '响应状态码不匹配：期望200，实际404'
      };

      setApiTests(prev => prev.map(t => 
        t.id === test.id ? { ...t, ...result } : t
      ));

      message.success(`测试 "${test.name}" 执行完成`);
    } catch (error) {
      setApiTests(prev => prev.map(t => 
        t.id === test.id ? { 
          ...t, 
          status: 'failed',
          error: '网络请求失败',
          lastRun: new Date()
        } : t
      ));
      message.error(`测试 "${test.name}" 执行失败`);
    }
  };

  // 批量执行测试
  const handleRunAllTests = async () => {
    for (const test of apiTests) {
      await handleRunTest(test);
    }
  };

  // 新建/编辑测试
  const handleSaveTest = (values: any) => {
    if (selectedTest) {
      // 编辑
      setApiTests(prev => prev.map(t => 
        t.id === selectedTest.id ? { ...t, ...values } : t
      ));
      message.success('测试用例已更新');
    } else {
      // 新建
      const newTest: APITest = {
        id: Date.now().toString(),
        ...values,
        status: 'pending' as const
      };
      setApiTests(prev => [...prev, newTest]);
      message.success('测试用例已创建');
    }
    
    setEditModalVisible(false);
    setSelectedTest(null);
    form.resetFields();
  };

  // 删除测试
  const handleDeleteTest = (testId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个测试用例吗？',
      onOk: () => {
        setApiTests(prev => prev.filter(t => t.id !== testId));
        message.success('测试用例已删除');
      }
    });
  };

  // 查看测试详情
  const handleViewDetail = (test: APITest) => {
    setSelectedTest(test);
    setDetailDrawerVisible(true);
  };

  // 导入Postman集合
  const handleImportPostman = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const collection = JSON.parse(e.target?.result as string);
        // TODO: 解析Postman集合并转换为测试用例
        message.success('Postman集合导入成功');
      } catch (error) {
        message.error('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'blue';
      case 'POST': return 'green';
      case 'PUT': return 'orange';
      case 'DELETE': return 'red';
      case 'PATCH': return 'purple';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'processing';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'running': return <ApiOutlined />;
      default: return <ApiOutlined />;
    }
  };

  const columns = [
    {
      title: '测试名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: APITest) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method: string) => (
        <Tag color={getMethodColor(method)}>{method}</Tag>
      )
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '最后执行',
      dataIndex: 'lastRun',
      key: 'lastRun',
      width: 150,
      render: (date?: Date) => 
        date ? date.toLocaleString() : '-'
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration?: number) => 
        duration ? `${duration.toFixed(0)}ms` : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: APITest) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleRunTest(record)}
            loading={record.status === 'running'}
          >
            执行
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedTest(record);
              form.setFieldsValue(record);
              setEditModalVisible(true);
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewDetail(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteTest(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="api-automation-container">
      <Card
        title={
          <Space>
            <ApiOutlined style={{ color: '#1890ff' }} />
            <span>接口自动化测试</span>
          </Space>
        }
        extra={
          <Space>
            <Upload
              beforeUpload={handleImportPostman}
              showUploadList={false}
              accept=".json"
            >
              <Button icon={<UploadOutlined />}>
                导入Postman
              </Button>
            </Upload>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedTest(null);
                form.resetFields();
                setEditModalVisible(true);
              }}
            >
              新建测试
            </Button>
            <Button
              icon={<PlayCircleOutlined />}
              onClick={handleRunAllTests}
            >
              执行全部
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="测试用例" key="tests">
            <Table
              dataSource={apiTests}
              columns={columns}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
            />
          </TabPane>
          
          <TabPane tab="测试集合" key="collections">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card title="测试集合" size="small">
                  <Tree
                    showIcon
                    defaultExpandAll
                  >
                    {folders.map(folder => (
                      <TreeNode
                        key={folder.id}
                        title={folder.name}
                        icon={<FolderOutlined />}
                      >
                        {apiTests
                          .filter(test => test.folderId === folder.id)
                          .map(test => (
                            <TreeNode
                              key={test.id}
                              title={test.name}
                              icon={<ApiOutlined />}
                              isLeaf
                            />
                          ))}
                      </TreeNode>
                    ))}
                  </Tree>
                </Card>
              </Col>
              <Col xs={24} md={16}>
                <Card title="集合详情" size="small">
                  <Text type="secondary">选择左侧集合查看详情</Text>
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab="环境配置" key="environments">
            <Card title="环境变量" size="small">
              <Form layout="vertical">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="基础URL">
                      <Input placeholder="http://localhost:8000" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="认证Token">
                      <Input.Password placeholder="Bearer token" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item>
                  <Button type="primary">保存配置</Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* 新建/编辑测试模态框 */}
      <Modal
        title={selectedTest ? '编辑测试' : '新建测试'}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedTest(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTest}
        >
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                label="测试名称"
                name="name"
                rules={[{ required: true, message: '请输入测试名称' }]}
              >
                <Input placeholder="输入测试名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="请求方法"
                name="method"
                rules={[{ required: true, message: '请选择请求方法' }]}
              >
                <Select placeholder="选择方法">
                  <Option value="GET">GET</Option>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="DELETE">DELETE</Option>
                  <Option value="PATCH">PATCH</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="请求URL"
            name="url"
            rules={[{ required: true, message: '请输入请求URL' }]}
          >
            <Input placeholder="/api/v1/..." />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={2} placeholder="测试描述" />
          </Form.Item>

          <Form.Item
            label="请求头"
            name="headers"
          >
            <TextArea
              rows={3}
              placeholder='{"Content-Type": "application/json"}'
            />
          </Form.Item>

          <Form.Item
            label="请求体"
            name="body"
          >
            <TextArea
              rows={4}
              placeholder='{"key": "value"}'
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="期望状态码"
                name="expectedStatus"
                initialValue={200}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="所属集合"
                name="folderId"
              >
                <Select placeholder="选择集合">
                  {folders.map(folder => (
                    <Option key={folder.id} value={folder.id}>
                      {folder.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 测试详情抽屉 */}
      <Drawer
        title={`测试详情 - ${selectedTest?.name}`}
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedTest && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={getMethodColor(selectedTest.method)}>
                {selectedTest.method}
              </Tag>
              <Tag color={getStatusColor(selectedTest.status)} icon={getStatusIcon(selectedTest.status)}>
                {selectedTest.status.toUpperCase()}
              </Tag>
            </Space>

            <Title level={5}>请求URL</Title>
            <Text code>{selectedTest.url}</Text>

            <Divider />

            <Title level={5}>描述</Title>
            <Text>{selectedTest.description}</Text>

            <Divider />

            <Title level={5}>请求头</Title>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              {JSON.stringify(selectedTest.headers, null, 2)}
            </pre>

            {selectedTest.body && (
              <>
                <Divider />
                <Title level={5}>请求体</Title>
                <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  {selectedTest.body}
                </pre>
              </>
            )}

            <Divider />

            <Title level={5}>期望状态码</Title>
            <Text>{selectedTest.expectedStatus}</Text>

            {selectedTest.error && (
              <>
                <Divider />
                <Title level={5}>错误信息</Title>
                <Text type="danger">{selectedTest.error}</Text>
              </>
            )}

            {selectedTest.lastRun && (
              <>
                <Divider />
                <Title level={5}>执行信息</Title>
                <Space direction="vertical">
                  <Text>最后执行: {selectedTest.lastRun.toLocaleString()}</Text>
                  {selectedTest.duration && (
                    <Text>执行耗时: {selectedTest.duration.toFixed(0)}ms</Text>
                  )}
                </Space>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default APIAutomation;
