import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Tooltip,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { userApi } from '../../services';
import { useUserStore } from '../../utils/store';
import {
  User,
  UserCreate,
  UserUpdate,
  UserPasswordUpdate,
  UserRole,
  UserStatus,
  UserRoleLabels,
  UserStatusLabels,
  UserStatusColors
} from '../../types';
import { formatDateTime } from '../../utils';
import './index.css';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const UserManagement: React.FC = () => {
  const { user: currentUser } = useUserStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | undefined>();
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // 表单实例
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 检查token是否存在
      const token = localStorage.getItem('access_token');

      console.log('🔍 UserManagement fetchUsers Debug:');
      console.log('- Token exists:', !!token);
      console.log('- Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
      console.log('- Current user:', currentUser);

      if (!token) {
        console.log('❌ No token found, redirecting to login');
        message.error('请先登录');
        window.location.href = '/login';
        return;
      }

      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus) params.status = selectedStatus;

      console.log('📡 Calling userApi.getUsers() with params:', params);
      const data = await userApi.getUsers(params);
      console.log('✅ Users fetched successfully:', data.length, 'users');
      setUsers(data);
    } catch (error: any) {
      console.error('❌ 获取用户列表失败:', error);
      console.log('- Error response:', error.response);
      console.log('- Error status:', error.response?.status);
      console.log('- Error data:', error.response?.data);

      if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        message.error('权限不足，需要管理员权限');
      } else {
        message.error('获取用户列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchText, selectedRole, selectedStatus]);

  // 创建用户
  const handleCreate = async (values: UserCreate) => {
    try {
      await userApi.createUser(values);
      message.success('用户创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('创建用户失败:', error);
    }
  };

  // 更新用户
  const handleUpdate = async (values: UserUpdate) => {
    if (!editingUser) return;
    
    try {
      await userApi.updateUser(editingUser.id, values);
      message.success('用户更新成功');
      setEditModalVisible(false);
      setEditingUser(null);
      editForm.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('更新用户失败:', error);
    }
  };

  // 更新密码
  const handlePasswordUpdate = async (values: any) => {
    if (!editingUser) return;

    try {
      // 只发送必要的字段，排除确认密码字段
      const { old_password, new_password } = values;
      await userApi.updatePassword(editingUser.id, { old_password, new_password });
      message.success('密码更新成功');
      setPasswordModalVisible(false);
      setEditingUser(null);
      passwordForm.resetFields();
    } catch (error) {
      console.error('密码更新失败:', error);
    }
  };

  // 删除用户
  const handleDelete = async (user: User) => {
    try {
      await userApi.deleteUser(user.id);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  // 打开编辑模态框
  const openEditModal = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      description: user.description
    });
    setEditModalVisible(true);
  };

  // 打开密码修改模态框
  const openPasswordModal = (user: User) => {
    setEditingUser(user);
    setPasswordModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.full_name || record.username}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole) => (
        <Tag color="blue">{UserRoleLabels[role]}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: UserStatus) => (
        <Tag color={UserStatusColors[status]}>{UserStatusLabels[status]}</Tag>
      )
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone) => phone || '-'
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 150,
      render: (lastLogin) => lastLogin ? formatDateTime(lastLogin) : '从未登录'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (createdAt) => formatDateTime(createdAt)
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑用户">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="修改密码">
            <Button
              type="text"
              icon={<KeyOutlined />}
              onClick={() => openPasswordModal(record)}
            />
          </Tooltip>
          {record.username !== 'admin' && (
            <Popconfirm
              title="确定要删除这个用户吗？"
              description="删除后无法恢复，请谨慎操作。"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除用户">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="user-management">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                用户管理
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                新建用户
              </Button>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="搜索用户名、姓名或邮箱"
                allowClear
                onSearch={setSearchText}
                onChange={(e) => !e.target.value && setSearchText('')}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择角色"
                allowClear
                style={{ width: '100%' }}
                onChange={setSelectedRole}
              >
                {Object.entries(UserRoleLabels).map(([key, label]) => (
                  <Option key={key} value={key}>{label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择状态"
                allowClear
                style={{ width: '100%' }}
                onChange={setSelectedStatus}
              >
                {Object.entries(UserStatusLabels).map(([key, label]) => (
                  <Option key={key} value={key}>{label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={2}>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loading}
              >
                刷新
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            total: users.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 创建用户模态框 */}
      <Modal
        title="新建用户"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3位字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位字符' }
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="真实姓名"
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                initialValue={UserRole.TESTER}
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  {Object.entries(UserRoleLabels).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                initialValue={UserStatus.ACTIVE}
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  {Object.entries(UserStatusLabels).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入用户描述" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="真实姓名"
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  {Object.entries(UserRoleLabels).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  {Object.entries(UserStatusLabels).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入用户描述" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditModalVisible(false);
                setEditingUser(null);
                editForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
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
          setEditingUser(null);
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
                setEditingUser(null);
                passwordForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                更新密码
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
