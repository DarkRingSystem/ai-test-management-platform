import request from './request';
import { LoginData, LoginResponse, User } from '../types';
import { encryptLoginData } from '../utils/encryption';

// 认证相关API
export const authApi = {
  // 用户登录
  login: async (data: LoginData): Promise<LoginResponse> => {
    console.log('🔐 加密登录数据...');
    const encryptedData = encryptLoginData(data);
    console.log('- 原始密码长度:', data.password.length);
    console.log('- 加密后密码长度:', encryptedData.password.length);

    // 直接访问后端接口
    const response = await fetch('http://localhost:8000/api/v1/auth/login/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encryptedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '登录失败');
    }

    return response.json();
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:8000/api/v1/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '获取用户信息失败');
    }

    return response.json();
  },

  // 刷新token
  refreshToken: async (): Promise<LoginResponse> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:8000/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '刷新令牌失败');
    }

    return response.json();
  },

  // 登出（前端处理）
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    window.location.href = '/login';
  }
};
