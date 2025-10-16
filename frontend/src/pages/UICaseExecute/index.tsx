import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Select,
  Input,
  message,
  Modal,
  Drawer,
  Timeline,
  Statistic,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useUserStore } from '../../utils/store';
import './index.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  steps: TestStep[];
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface TestStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  screenshot?: string;
}

interface ExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  running: number;
  duration: number;
}

const UICaseExecute: React.FC = () => {
  const { user } = useUserStore();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executionSummary, setExecutionSummary] = useState<ExecutionSummary>({
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    running: 0,
    duration: 0
  });
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // 初始化测试用例数据
  useEffect(() => {
    const mockTestCases: TestCase[] = [
      {
        id: '1',
        name: '用户登录功能测试',
        description: '验证用户登录功能的正常流程',
        status: 'pending',
        priority: 'high',
        category: '功能测试',
        steps: [
          { id: '1', description: '打开登录页面', status: 'pending' },
          { id: '2', description: '输入用户名', status: 'pending' },
          { id: '3', description: '输入密码', status: 'pending' },
          { id: '4', description: '点击登录按钮', status: 'pending' },
          { id: '5', description: '验证登录成功', status: 'pending' }
        ]
      },
      {
        id: '2',
        name: '登录表单验证测试',
        description: '验证登录表单的输入验证功能',
        status: 'pending',
        priority: 'medium',
        category: '表单验证',
        steps: [
          { id: '1', description: '打开登录页面', status: 'pending' },
          { id: '2', description: '不输入信息直接点击登录', status: 'pending' },
          { id: '3', description: '验证错误提示', status: 'pending' }
        ]
      },
      {
        id: '3',
        name: '密码重置功能测试',
        description: '验证密码重置功能',
        status: 'pending',
        priority: 'low',
        category: '功能测试',
        steps: [
          { id: '1', description: '点击忘记密码链接', status: 'pending' },
          { id: '2', description: '输入邮箱地址', status: 'pending' },
          { id: '3', description: '点击发送重置邮件', status: 'pending' },
          { id: '4', description: '验证成功提示', status: 'pending' }
        ]
      }
    ];

    setTestCases(mockTestCases);
    updateExecutionSummary(mockTestCases);
  }, []);

  // 更新执行统计
  const updateExecutionSummary = (cases: TestCase[]) => {
    const summary = cases.reduce((acc, testCase) => {
      acc.total++;
      switch (testCase.status) {
        case 'passed':
          acc.passed++;
          break;
        case 'failed':
          acc.failed++;
          break;
        case 'skipped':
          acc.skipped++;
          break;
        case 'running':
          acc.running++;
          break;
      }
      if (testCase.duration) {
        acc.duration += testCase.duration;
      }
      return acc;
    }, { total: 0, passed: 0, failed: 0, skipped: 0, running: 0, duration: 0 });

    setExecutionSummary(summary);
  };

  // 执行测试用例
  const handleExecuteTests = async () => {
    if (selectedCases.length === 0) {
      message.warning('请选择要执行的测试用例');
      return;
    }

    setExecuting(true);
    
    // 模拟执行过程
    for (const caseId of selectedCases) {
      const testCase = testCases.find(c => c.id === caseId);
      if (!testCase) continue;

      // 设置为运行状态
      setTestCases(prev => prev.map(c => 
        c.id === caseId ? { ...c, status: 'running' as const } : c
      ));

      // 模拟执行步骤
      for (let i = 0; i < testCase.steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setTestCases(prev => prev.map(c => 
          c.id === caseId 
            ? {
                ...c,
                steps: c.steps.map((step, index) => 
                  index === i 
                    ? { ...step, status: 'running' as const }
                    : index < i 
                      ? { ...step, status: 'passed' as const, duration: Math.random() * 2000 + 500 }
                      : step
                )
              }
            : c
        ));
      }

      // 完成执行
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isSuccess = Math.random() > 0.3; // 70% 成功率
      const finalStatus: 'passed' | 'failed' = isSuccess ? 'passed' : 'failed';
      const error = isSuccess ? undefined : '断言失败：预期结果与实际结果不符';

      setTestCases(prev => prev.map(c =>
        c.id === caseId
          ? {
              ...c,
              status: finalStatus,
              duration: Math.random() * 5000 + 2000,
              error,
              steps: c.steps.map(step => ({
                ...step,
                status: isSuccess ? ('passed' as const) : ('failed' as const),
                duration: step.duration || Math.random() * 1000 + 200,
                error: isSuccess ? undefined : '步骤执行失败'
              }))
            }
          : c
      ));
    }

    setExecuting(false);
    message.success('测试执行完成');
  };

  // 停止执行
  const handleStopExecution = () => {
    setExecuting(false);
    setTestCases(prev => prev.map(c => 
      c.status === 'running' ? { ...c, status: 'skipped' as const } : c
    ));
    message.info('测试执行已停止');
  };

  // 重置测试结果
  const handleResetTests = () => {
    setTestCases(prev => prev.map(c => ({
      ...c,
      status: 'pending' as const,
      duration: undefined,
      error: undefined,
      steps: c.steps.map(step => ({
        ...step,
        status: 'pending' as const,
        duration: undefined,
        error: undefined
      }))
    })));
    setSelectedCases([]);
    message.success('测试结果已重置');
  };

  // 查看测试详情
  const handleViewDetail = (testCase: TestCase) => {
    setSelectedCase(testCase);
    setDetailDrawerVisible(true);
  };

  // 导出测试报告
  const handleExportReport = () => {
    const report = {
      summary: executionSummary,
      cases: testCases,
      exportTime: new Date().toISOString(),
      exportBy: user?.full_name
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('测试报告已导出');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'processing';
      case 'skipped': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'running': return <ClockCircleOutlined />;
      case 'skipped': return <ExclamationCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // 过滤测试用例
  const filteredTestCases = testCases.filter(testCase => {
    const matchesStatus = filterStatus === 'all' || testCase.status === filterStatus;
    const matchesSearch = testCase.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         testCase.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 表格列定义
  const columns = [
    {
      title: '测试用例',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TestCase) => (
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
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration?: number) => 
        duration ? `${(duration / 1000).toFixed(2)}s` : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: TestCase) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  useEffect(() => {
    updateExecutionSummary(testCases);
  }, [testCases]);

  return (
    <div className="ui-case-execute-container">
      {/* 执行统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="总计"
              value={executionSummary.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="通过"
              value={executionSummary.passed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="失败"
              value={executionSummary.failed}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="跳过"
              value={executionSummary.skipped}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="运行中"
              value={executionSummary.running}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="总耗时"
              value={`${(executionSummary.duration / 1000).toFixed(1)}s`}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 执行控制 */}
      <Card
        title="测试执行控制"
        extra={
          <Space>
            <Search
              placeholder="搜索测试用例"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待执行</Option>
              <Option value="running">运行中</Option>
              <Option value="passed">已通过</Option>
              <Option value="failed">已失败</Option>
              <Option value="skipped">已跳过</Option>
            </Select>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecuteTests}
            loading={executing}
            disabled={selectedCases.length === 0}
          >
            执行选中用例
          </Button>
          <Button
            icon={<StopOutlined />}
            onClick={handleStopExecution}
            disabled={!executing}
          >
            停止执行
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetTests}
            disabled={executing}
          >
            重置结果
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportReport}
          >
            导出报告
          </Button>
        </Space>

        {executing && (
          <Alert
            message="测试执行中"
            description="正在执行选中的测试用例，请耐心等待..."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          dataSource={filteredTestCases}
          columns={columns}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedCases,
            onChange: (selectedRowKeys) => setSelectedCases(selectedRowKeys as string[]),
            getCheckboxProps: () => ({ disabled: executing })
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 测试详情抽屉 */}
      <Drawer
        title={`测试详情 - ${selectedCase?.name}`}
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedCase && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color={getStatusColor(selectedCase.status)} icon={getStatusIcon(selectedCase.status)}>
                  {selectedCase.status.toUpperCase()}
                </Tag>
                <Tag color={getPriorityColor(selectedCase.priority)}>
                  {selectedCase.priority.toUpperCase()}
                </Tag>
                <Tag>{selectedCase.category}</Tag>
              </Space>
            </div>

            <Text type="secondary">{selectedCase.description}</Text>

            {selectedCase.error && (
              <Alert
                message="执行错误"
                description={selectedCase.error}
                type="error"
                style={{ margin: '16px 0' }}
              />
            )}

            <Title level={5} style={{ marginTop: 24 }}>执行步骤</Title>
            <Timeline>
              {selectedCase.steps.map((step) => (
                <Timeline.Item
                  key={step.id}
                  color={getStatusColor(step.status)}
                  dot={getStatusIcon(step.status)}
                >
                  <div>
                    <Text>{step.description}</Text>
                    {step.duration && (
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        ({(step.duration / 1000).toFixed(2)}s)
                      </Text>
                    )}
                    {step.error && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="danger" style={{ fontSize: '12px' }}>
                          {step.error}
                        </Text>
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UICaseExecute;
