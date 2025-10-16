import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Space,
  Divider
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  KeyOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useUserStore } from '../../utils/store';
import { userApi } from '../../services';
import {
  UserUpdate,
  UserPasswordUpdate,
  UserRoleLabels,
  UserStatusLabels,
  UserStatusColors
} from '../../types';
import { formatDateTime } from '../../utils';
import './index.css';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user, setUser } = useUserStore();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  if (!user) {
    return <div>用户信息加载中...</div>;
  }

  // 更新个人信息
  const handleUpdate = async (values: UserUpdate) => {
    setLoading(true);
    try {
      const updatedUser = await userApi.updateUser(user.id, values);
      setUser(updatedUser);
      message.success('个人信息更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
    } catch (error) {
      console.error('更新个人信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新密码
  const handlePasswordUpdate = async (values: any) => {
    setLoading(true);
    try {
      const { old_password, new_password } = values;
      await userApi.updatePassword(user.id, { old_password, new_password });
      message.success('密码更新成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error('密码更新失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑模态框
  const openEditModal = () => {
    editForm.setFieldsValue({
      full_name: user.full_name,
      phone: user.phone,
      description: user.description
    });
    setEditModalVisible(true);
  };

  return (
    <div className="profile-page">
      <Row gutter={[24, 24]}>
        {/* 基本信息卡片 */}
        <Col xs={24} lg={8}>
          <Card className="profile-card">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={120}
                src={user.avatar}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginBottom: 16 }}
              />
              <Title level={3} style={{ margin: 0 }}>
                {user.full_name || user.username}
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                {UserRoleLabels[user.role]}
              </Text>
            </div>

            <Divider />

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>
                  <MailOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  邮箱
                </Text>
                <br />
                <Text copyable>{user.email}</Text>
              </div>

              {user.phone && (
                <div>
                  <Text strong>
                    <PhoneOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    手机号
                  </Text>
                  <br />
                  <Text copyable>{user.phone}</Text>
                </div>
              )}

              <div>
                <Text strong>
                  <CalendarOutlined style={{ marginRight: 8, color: '#faad14' }} />
                  注册时间
                </Text>
                <br />
                <Text>{formatDateTime(user.created_at)}</Text>
              </div>

              <div>
                <Text strong>状态</Text>
                <br />
                <Tag color={UserStatusColors[user.status]}>
                  {UserStatusLabels[user.status]}
                </Tag>
              </div>
            </Space>

            <Divider />

            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={openEditModal}
              >
                编辑资料
              </Button>
              <Button
                icon={<KeyOutlined />}
                onClick={() => setPasswordModalVisible(true)}
              >
                修改密码
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 详细信息卡片 */}
        <Col xs={24} lg={16}>
          <Card title="详细信息" className="details-card">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="用户名" span={1}>
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label="真实姓名" span={1}>
                {user.full_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱地址" span={1}>
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="手机号码" span={1}>
                {user.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户角色" span={1}>
                <Tag color="blue">{UserRoleLabels[user.role]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="账户状态" span={1}>
                <Tag color={UserStatusColors[user.status]}>
                  {UserStatusLabels[user.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="超级用户" span={1}>
                <Tag color={user.is_superuser ? 'red' : 'default'}>
                  {user.is_superuser ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="登录次数" span={1}>
                {user.login_count} 次
              </Descriptions.Item>
              <Descriptions.Item label="最后登录" span={2}>
                {user.last_login ? formatDateTime(user.last_login) : '从未登录'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间" span={1}>
                {formatDateTime(user.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={1}>
                {formatDateTime(user.updated_at)}
              </Descriptions.Item>
              <Descriptions.Item label="个人描述" span={2}>
                {user.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 统计信息卡片 */}
          <Card title="使用统计" style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
                    {user.login_count}
                  </Title>
                  <Text type="secondary">登录次数</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ color: '#52c41a', margin: 0 }}>
                    0
                  </Title>
                  <Text type="secondary">创建项目</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ color: '#faad14', margin: 0 }}>
                    0
                  </Title>
                  <Text type="secondary">测试用例</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 编辑个人信息模态框 */}
      <Modal
        title="编辑个人信息"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="full_name"
            label="真实姓名"
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="description"
            label="个人描述"
          >
            <Input.TextArea rows={4} placeholder="请输入个人描述" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                更新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordUpdate}
        >
          <Form.Item
            name="old_password"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                }
              })
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                更新密码
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
