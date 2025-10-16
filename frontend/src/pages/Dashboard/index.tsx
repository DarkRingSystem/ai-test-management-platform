import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Space,
  Table,
  Tag,
  Progress,
  List,
  Avatar,
  Button,
  DatePicker,
  Select,
  Statistic,
  Badge,
  Tooltip,
  Divider
} from 'antd';
import {
  BugOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  FireOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { StatCard, PieChart, LineChart, BarChart, BarChart3D, DefectTimeChart } from '../../components/Charts';
import { useUserStore } from '../../utils/store';
import { formatDateTime } from '../../utils';
import dayjs from 'dayjs';
import './index.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 模拟测试数据
const mockData = {
  stats: {
    totalTestCases: 1248,
    executedCases: 1154,
    totalDefects: 89,
    passRate: 92.5,
    automationRate: 78.3,
    testCoverage: 85.7,
    avgExecutionTime: 2.4,
    activeTesters: 12
  },
  trends: {
    testCases: { value: 12.3, isUp: true },
    defects: { value: 5.2, isUp: false },
    passRate: { value: 2.1, isUp: true },
    coverage: { value: 3.8, isUp: true }
  },
  testCaseStatus: [
    { name: '通过', value: 1154, color: '#52c41a' },
    { name: '失败', value: 67, color: '#ff4d4f' },
    { name: '阻塞', value: 15, color: '#faad14' },
    { name: '跳过', value: 12, color: '#d9d9d9' }
  ],
  defectSeverity: [
    {
      name: '严重',
      value: 12,
      color: '#ff4d4f',
      icon: '🔥',
      description: '系统崩溃、数据丢失等严重问题'
    },
    {
      name: '主要',
      value: 28,
      color: '#faad14',
      icon: '⚠️',
      description: '功能无法正常使用'
    },
    {
      name: '次要',
      value: 35,
      color: '#1890ff',
      icon: '🔍',
      description: '功能可用但存在问题'
    },
    {
      name: '轻微',
      value: 14,
      color: '#52c41a',
      icon: '💡',
      description: '界面优化、文案错误等'
    }
  ],
  weeklyTrend: {
    xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    data: [
      { name: '执行用例', data: [145, 152, 138, 167, 172, 125, 115] },
      { name: '通过用例', data: [132, 140, 128, 154, 159, 115, 106] },
      { name: '发现缺陷', data: [8, 12, 10, 13, 13, 10, 9] }
    ]
  },
  testProgress: [
    {
      name: '电商平台测试',
      progress: 85,
      status: 'active',
      passRate: 92,
      defects: 15,
      priority: 'high'
    },
    {
      name: '移动应用测试',
      progress: 92,
      status: 'success',
      passRate: 96,
      defects: 8,
      priority: 'high'
    },
    {
      name: '管理系统测试',
      progress: 67,
      status: 'normal',
      passRate: 88,
      defects: 22,
      priority: 'medium'
    },
    {
      name: '数据平台测试',
      progress: 45,
      status: 'exception',
      passRate: 75,
      defects: 35,
      priority: 'low'
    }
  ],
  recentActivities: [
    {
      id: 1,
      user: '张三',
      action: '执行了自动化测试',
      target: 'TC-001: 用户登录功能测试',
      time: '2024-01-15 14:30:00',
      type: 'test',
      status: 'success'
    },
    {
      id: 2,
      user: '李四',
      action: '发现了严重缺陷',
      target: 'BUG-089: 支付页面显示异常',
      time: '2024-01-15 13:45:00',
      type: 'bug',
      status: 'error'
    },
    {
      id: 3,
      user: '王五',
      action: '完成了性能测试',
      target: 'TP-005: 第三方接口测试',
      time: '2024-01-15 12:20:00',
      type: 'performance',
      status: 'success'
    },
    {
      id: 4,
      user: '赵六',
      action: '更新了测试计划',
      target: '电商平台测试计划',
      time: '2024-01-15 11:15:00',
      type: 'plan',
      status: 'info'
    }
  ],
  qualityMetrics: {
    bugDensity: 0.71,
    testEfficiency: 94.2,
    defectRemovalRate: 89.5,
    testCaseReusability: 76.8
  },
  defectTimeData: [
    { date: '09-23', severe: 2, major: 5, minor: 8, trivial: 3, total: 18 },
    { date: '09-24', severe: 1, major: 7, minor: 12, trivial: 5, total: 25 },
    { date: '09-25', severe: 3, major: 6, minor: 9, trivial: 4, total: 22 },
    { date: '09-26', severe: 2, major: 8, minor: 11, trivial: 6, total: 27 },
    { date: '09-27', severe: 4, major: 9, minor: 13, trivial: 7, total: 33 },
    { date: '09-28', severe: 1, major: 6, minor: 10, trivial: 4, total: 21 },
    { date: '09-29', severe: 2, major: 7, minor: 8, trivial: 5, total: 22 }
  ]
};

const Dashboard: React.FC = () => {
  const { user } = useUserStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  // 根据时间跨度生成缺陷数据
  const generateDefectTimeData = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
    const data = [];
    let current = startDate.clone();

    while (current.isBefore(endDate) || current.isSame(endDate)) {
      // 模拟不同严重程度的缺陷数量（随机但有规律）
      const dayOfWeek = current.day();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // 工作日缺陷更多，周末较少
      const multiplier = isWeekend ? 0.3 : 1;

      const severe = Math.floor((Math.random() * 3 + 1) * multiplier);
      const major = Math.floor((Math.random() * 5 + 4) * multiplier);
      const minor = Math.floor((Math.random() * 8 + 6) * multiplier);
      const trivial = Math.floor((Math.random() * 4 + 2) * multiplier);

      data.push({
        date: current.format('MM-DD'),
        severe,
        major,
        minor,
        trivial,
        total: severe + major + minor + trivial
      });

      current = current.add(1, 'day');
    }

    return data;
  };

  const defectTimeData = generateDefectTimeData(dateRange[0], dateRange[1]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'test': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'bug': return <BugOutlined style={{ color: '#ff4d4f' }} />;
      case 'performance': return <ThunderboltOutlined style={{ color: '#722ed1' }} />;
      case 'plan': return <DashboardOutlined style={{ color: '#1890ff' }} />;
      default: return <InfoCircleOutlined />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  return (
    <div className="dashboard" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '24px' }}>
      {/* 炫酷欢迎区域 */}
      <Card
        className="welcome-card mb-24"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size="small">
              <Title level={2} style={{ margin: 0, background: 'linear-gradient(45deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                <RocketOutlined style={{ marginRight: 8, color: '#667eea' }} />
                {getGreeting()}，{user?.full_name || user?.username}！
              </Title>
              <Text style={{ fontSize: '16px', color: '#000000' }}>
                <ClockCircleOutlined style={{ marginRight: 8, color: '#000000' }} />
                今天是 {dayjs().format('YYYY年MM月DD日 dddd')}，让我们开始高效的测试工作！
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                format="YYYY-MM-DD"
                style={{ borderRadius: '8px' }}
              />
              <Button
                type="primary"
                icon={<LineChartOutlined />}
                style={{
                  borderRadius: '8px',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  border: 'none'
                }}
              >
                导出报告
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 核心测试指标卡片 */}
      <Row gutter={[24, 24]} className="mb-24">
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>测试用例总数</span>}
              value={mockData.stats.totalTestCases}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
              suffix={
                <Tag color="green" style={{ marginLeft: 8 }}>
                  +{mockData.trends.testCases.value}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>发现缺陷</span>}
              value={mockData.stats.totalDefects}
              prefix={<BugOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
              suffix={
                <Tag color="orange" style={{ marginLeft: 8 }}>
                  -{mockData.trends.defects.value}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>测试通过率</span>}
              value={mockData.stats.passRate}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>自动化率</span>}
              value={mockData.stats.automationRate}
              precision={1}
              suffix="%"
              prefix={<RocketOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 测试质量指标 */}
      <Row gutter={[24, 24]} className="mb-24">
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="测试覆盖率"
              value={mockData.stats.testCoverage}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
            <Progress percent={mockData.stats.testCoverage} strokeColor="#52c41a" showInfo={false} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="平均执行时间"
              value={mockData.stats.avgExecutionTime}
              precision={1}
              suffix="h"
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
            />
            <Progress percent={75} strokeColor="#1890ff" showInfo={false} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="活跃测试人员"
              value={mockData.stats.activeTesters}
              valueStyle={{ color: '#722ed1', fontSize: '20px' }}
            />
            <div style={{ marginTop: 8 }}>
              <Badge count={mockData.stats.activeTesters} style={{ backgroundColor: '#722ed1' }} />
              <span style={{ marginLeft: 8, color: '#666' }}>在线</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="缺陷密度"
              value={mockData.qualityMetrics.bugDensity}
              precision={2}
              suffix="/KLOC"
              valueStyle={{ color: '#faad14', fontSize: '20px' }}
            />
            <Progress percent={30} strokeColor="#faad14" showInfo={false} />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[24, 24]} className="mb-24">
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <LineChartOutlined style={{ marginRight: 8, color: '#667eea' }} />
                测试执行趋势分析
              </span>
            }
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          >
            <LineChart
              data={mockData.weeklyTrend.data}
              xAxisData={mockData.weeklyTrend.xAxis}
              height={350}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <EyeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                用例执行状态
              </span>
            }
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          >
            <PieChart
              data={mockData.testCaseStatus}
              height={350}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mb-24">
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <FireOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                缺陷严重程度分布
              </span>
            }
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ flex: 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <BarChart3D
                data={mockData.defectSeverity.map(item => ({
                  name: item.name,
                  value: item.value,
                  color: item.color,
                  icon: item.icon,
                  description: item.description
                }))}
                height={220}
              />
            </div>

            {/* 时间序列缺陷图表 */}
            <div style={{ marginTop: '24px' }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>📈</span>
                缺陷趋势分析 ({dateRange[0].format('MM-DD')} 至 {dateRange[1].format('MM-DD')})
              </div>
              <DefectTimeChart
                data={defectTimeData}
                height={280}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <SafetyCertificateOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                测试进度概览
              </span>
            }
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ flex: 1 }}
          >
            <List
              dataSource={mockData.testProgress}
              renderItem={(item) => (
                <List.Item style={{ padding: '16px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Badge
                        color={getPriorityColor(item.priority)}
                        style={{ marginTop: '8px' }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                        <Space>
                          <Tag color="blue">通过率 {item.passRate}%</Tag>
                          <Tag color="orange">缺陷 {item.defects}</Tag>
                        </Space>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: '8px' }}>
                        <Progress
                          percent={item.progress}
                          status={item.status as any}
                          strokeColor={{
                            '0%': '#667eea',
                            '100%': '#764ba2',
                          }}
                          trailColor="#f0f0f0"
                          strokeWidth={8}
                        />
                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                          优先级: {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近活动和质量指标 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                最近测试活动
              </span>
            }
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ flex: 1 }}
          >
            <List
              dataSource={mockData.recentActivities}
              renderItem={(item) => (
                <List.Item style={{ padding: '16px 0', borderRadius: '8px' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={getActivityIcon(item.type)}
                        style={{
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          border: 'none'
                        }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Text strong style={{ color: '#333' }}>{item.user}</Text>
                          <Text>{item.action}</Text>
                          <Badge
                            status={item.status as any}
                            text={
                              <Text
                                type="secondary"
                                style={{
                                  background: '#f5f5f5',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              >
                                {item.target}
                              </Text>
                            }
                          />
                        </Space>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {formatDateTime(item.time)}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
                质量指标
              </span>
            }
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ flex: 1 }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>测试效率</Text>
                  <Text strong>{mockData.qualityMetrics.testEfficiency}%</Text>
                </div>
                <Progress
                  percent={mockData.qualityMetrics.testEfficiency}
                  strokeColor="#52c41a"
                  trailColor="#f0f0f0"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>缺陷移除率</Text>
                  <Text strong>{mockData.qualityMetrics.defectRemovalRate}%</Text>
                </div>
                <Progress
                  percent={mockData.qualityMetrics.defectRemovalRate}
                  strokeColor="#1890ff"
                  trailColor="#f0f0f0"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>用例复用率</Text>
                  <Text strong>{mockData.qualityMetrics.testCaseReusability}%</Text>
                </div>
                <Progress
                  percent={mockData.qualityMetrics.testCaseReusability}
                  strokeColor="#722ed1"
                  trailColor="#f0f0f0"
                />
              </div>

              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #667eea20, #764ba220)',
                  border: '1px solid #667eea30',
                  borderRadius: '8px'
                }}
              >
                <Statistic
                  title="今日测试完成度"
                  value={87}
                  suffix="%"
                  valueStyle={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
