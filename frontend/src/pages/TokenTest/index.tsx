import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message, Typography, Descriptions } from 'antd';
import { authApi, userApi } from '../../services';
import { useUserStore } from '../../utils/store';

const { Title, Text, Paragraph } = Typography;

const TokenTest: React.FC = () => {
  const { user, token } = useUserStore();
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    checkTokenStatus();
  }, []);

  const checkTokenStatus = () => {
    const localToken = localStorage.getItem('access_token');
    const localUser = localStorage.getItem('user_info');
    
    setTestResults({
      storeToken: token,
      localToken: localToken,
      storeUser: user,
      localUser: localUser ? JSON.parse(localUser) : null,
      timestamp: new Date().toLocaleString()
    });
  };

  const testLogin = async () => {
    try {
      console.log('开始测试登录...');

      // 清除旧的token
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');

      const response = await authApi.login({
        username: 'admin',
        password: 'admin123'
      });
      console.log('登录响应:', response);
      message.success('登录测试成功');

      // 手动存储新token
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user_info', JSON.stringify(response.user));

      console.log('✅ 新token已存储:', response.access_token.substring(0, 50) + '...');

      checkTokenStatus();
    } catch (error: any) {
      console.error('登录测试失败:', error);
      message.error(`登录测试失败: ${error.message}`);
    }
  };

  const testUserApi = async () => {
    try {
      console.log('开始测试用户API...');
      const users = await userApi.getUsers();
      console.log('用户API响应:', users);
      message.success(`用户API测试成功，获取到 ${users.length} 个用户`);
    } catch (error: any) {
      console.error('用户API测试失败:', error);
      message.error(`用户API测试失败: ${error.response?.data?.detail || error.message}`);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    checkTokenStatus();
    message.info('存储已清空');
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Token 测试页面</Title>
      
      <Card title="当前状态" style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Store中的Token">
            {testResults.storeToken ? 
              <Text code>{testResults.storeToken.substring(0, 50)}...</Text> : 
              <Text type="secondary">无</Text>
            }
          </Descriptions.Item>
          <Descriptions.Item label="LocalStorage中的Token">
            {testResults.localToken ? 
              <Text code>{testResults.localToken.substring(0, 50)}...</Text> : 
              <Text type="secondary">无</Text>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Store中的用户">
            {testResults.storeUser ? 
              <Text>{testResults.storeUser.username} ({testResults.storeUser.role})</Text> : 
              <Text type="secondary">无</Text>
            }
          </Descriptions.Item>
          <Descriptions.Item label="LocalStorage中的用户">
            {testResults.localUser ? 
              <Text>{testResults.localUser.username} ({testResults.localUser.role})</Text> : 
              <Text type="secondary">无</Text>
            }
          </Descriptions.Item>
          <Descriptions.Item label="检查时间">
            <Text type="secondary">{testResults.timestamp}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="测试操作">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            <Text strong>说明：</Text>
            <br />
            1. 点击"测试登录"来获取新的token
            <br />
            2. 点击"测试用户API"来验证token是否有效
            <br />
            3. 查看浏览器控制台获取详细日志
          </Paragraph>
          
          <Space>
            <Button type="primary" onClick={testLogin}>
              测试登录
            </Button>
            <Button onClick={testUserApi}>
              测试用户API
            </Button>
            <Button onClick={checkTokenStatus}>
              刷新状态
            </Button>
            <Button danger onClick={clearStorage}>
              清空存储
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default TokenTest;
