import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { ErrorResponse } from '../types';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加认证token
    const token = localStorage.getItem('access_token');
    console.log('🔍 Request Interceptor Debug:');
    console.log('- URL:', config.url);
    console.log('- Method:', config.method);
    console.log('- Token exists:', !!token);
    console.log('- Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');

    // 确保headers对象存在
    if (!config.headers) {
      config.headers = {} as any;
    }

    if (token) {
      // 强制设置Authorization头部，使用多种方式确保不被丢失
      const authHeader = `Bearer ${token}`;
      config.headers.Authorization = authHeader;
      config.headers['Authorization'] = authHeader;
      config.headers.authorization = authHeader;

      // 如果是AxiosHeaders对象，使用set方法
      if (config.headers.set) {
        config.headers.set('Authorization', authHeader);
      }

      // 强制设置到headers对象的所有可能属性
      Object.defineProperty(config.headers, 'Authorization', {
        value: authHeader,
        writable: true,
        enumerable: true,
        configurable: true
      });

      console.log('- Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
      console.log('- Headers after setting auth:', Object.keys(config.headers));
    } else {
      console.log('- No token found, Authorization header not added');
    }

    console.log('- Final headers:', config.headers);
    console.log('---');

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;
      const errorMsg = (data as ErrorResponse)?.detail || '请求失败';

      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');

          // 清理用户相关的localStorage数据
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_info');

          // 清理所有AI聊天会话数据（通过前缀匹配）
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('ai_chat_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));

          window.location.href = '/login';
          break;
        case 403:
          message.error(`权限不足: ${errorMsg}`);
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 422:
          // 表单验证错误
          if (Array.isArray(data.detail)) {
            const errors = data.detail.map((item: any) => item.msg).join(', ');
            message.error(errors);
          } else {
            message.error(errorMsg);
          }
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(errorMsg);
      }
    } else {
      message.error('网络连接失败');
    }

    return Promise.reject(error);
  }
);

export default request;
