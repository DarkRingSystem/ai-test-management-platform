import request from './request';
import { User, UserCreate, UserUpdate, UserPasswordUpdate, UserRole, UserStatus, QueryParams } from '../types';
import {
  encryptUserCreateData,
  encryptUserUpdateData,
  encryptPasswordUpdateData,
  decryptUserData
} from '../utils/encryption';

// 用户管理API
export const userApi = {
  // 获取用户列表
  getUsers: async (params?: QueryParams & {
    role?: UserRole;
    status?: UserStatus;
  }): Promise<User[]> => {
    const token = localStorage.getItem('access_token');
    console.log('🔍 userApi.getUsers Debug:');
    console.log('- Token exists:', !!token);
    console.log('- Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');

    if (!token) {
      console.log('❌ No token found in userApi.getUsers');
      throw new Error('No authentication token found');
    }

    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `http://localhost:8000/api/v1/users/?${queryParams.toString()}`;
    console.log('📡 Making request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '获取用户列表失败');
    }

    const users = await response.json();
    // 解密用户数据用于显示
    return Array.isArray(users) ? users.map((user: User) => decryptUserData(user)) : users;
  },

  // 获取用户详情
  getUser: async (id: number): Promise<User> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`http://localhost:8000/api/v1/users/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '获取用户详情失败');
    }

    const user = await response.json();
    return decryptUserData(user);
  },

  // 创建用户
  createUser: async (data: UserCreate): Promise<User> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🔐 加密用户创建数据...');
    const encryptedData = encryptUserCreateData(data);

    const response = await fetch('http://localhost:8000/api/v1/users/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(encryptedData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '创建用户失败');
    }

    const user = await response.json();
    return decryptUserData(user);
  },

  // 更新用户信息
  updateUser: async (id: number, data: UserUpdate): Promise<User> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🔐 加密用户更新数据...');
    const encryptedData = encryptUserUpdateData(data);

    const response = await fetch(`http://localhost:8000/api/v1/users/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(encryptedData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '更新用户失败');
    }

    const user = await response.json();
    return decryptUserData(user);
  },

  // 更新用户密码
  updatePassword: async (id: number, data: UserPasswordUpdate): Promise<{ message: string }> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🔐 加密密码更新数据...');
    const encryptedData = encryptPasswordUpdateData(data);

    const response = await fetch(`http://localhost:8000/api/v1/users/${id}/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(encryptedData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '更新密码失败');
    }

    return response.json();
  },

  // 删除用户
  deleteUser: async (id: number): Promise<{ message: string }> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`http://localhost:8000/api/v1/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '删除用户失败');
    }

    return response.json();
  }
};
