import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Space,
  Divider
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { authApi } from '../../services';
import { useUserStore } from '../../utils/store';
import { LoginData } from '../../types';
import './index.css';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUserStore();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onFinish = async (values: LoginData) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      login(response.user, response.access_token);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-content">
          <Card className="login-card">
            <div className="login-header">
              <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
                API智能测试平台
              </Title>
              <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
                AI赋能的API测试管理解决方案
              </Text>
            </div>

            <Divider />

            <Form
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3位字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<LoginOutlined />}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <div className="login-demo">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                演示账户：
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
                <Text code style={{ fontSize: '12px' }}>
                  管理员: admin / admin123
                </Text>
                <Text code style={{ fontSize: '12px' }}>
                  项目经理: project_manager / pm123456
                </Text>
                <Text code style={{ fontSize: '12px' }}>
                  测试工程师: tester / test123456
                </Text>
              </Space>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
