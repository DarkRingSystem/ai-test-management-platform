import React from 'react';
import { Card, Descriptions, Button, Space, message } from 'antd';
import { useUserStore } from '../../utils/store';
import { userApi } from '../../services';

const Debug: React.FC = () => {
  const { user, token } = useUserStore();

  const testUserApi = async () => {
    try {
      console.log('开始测试用户API...');
      const token = localStorage.getItem('access_token');
      console.log('当前token:', token ? `${token.substring(0, 20)}...` : '无');

      const users = await userApi.getUsers();
      console.log('Users:', users);
      message.success(`成功获取 ${users.length} 个用户`);
    } catch (error: any) {
      console.error('获取用户失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      message.error(`获取用户失败: ${error.response?.data?.detail || error.message}`);
    }
  };

  const checkLocalStorage = () => {
    const localToken = localStorage.getItem('access_token');
    const localUser = localStorage.getItem('user_info');
    
    console.log('LocalStorage token:', localToken);
    console.log('LocalStorage user:', localUser);
    console.log('Store token:', token);
    console.log('Store user:', user);
    
    message.info('检查控制台日志');
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="调试信息">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Store中的Token">
            {token ? `${token.substring(0, 20)}...` : '无'}
          </Descriptions.Item>
          <Descriptions.Item label="LocalStorage中的Token">
            {localStorage.getItem('access_token') ? 
              `${localStorage.getItem('access_token')?.substring(0, 20)}...` : '无'}
          </Descriptions.Item>
          <Descriptions.Item label="当前用户">
            {user ? `${user.username} (${user.role})` : '无'}
          </Descriptions.Item>
          <Descriptions.Item label="用户ID">
            {user?.id || '无'}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16 }}>
          <Space>
            <Button onClick={checkLocalStorage}>
              检查存储状态
            </Button>
            <Button type="primary" onClick={testUserApi}>
              测试用户API
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Debug;
