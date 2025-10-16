import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

// 用户状态接口
interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// 用户状态管理
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      
      setUser: (user: User) => set({ user }),
      
      setToken: (token: string) => set({ token }),
      
      login: (user: User, token: string) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_info', JSON.stringify(user));
        set({ user, token, isLoggedIn: true });
      },
      
      logout: () => {
        // 获取当前用户ID用于清理AI聊天数据
        const currentState = useUserStore.getState();
        const userId = currentState.user?.id;

        // 清理用户相关的localStorage数据
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');

        // 清理所有AI相关的会话数据
        if (userId) {
          // 清理AI聊天会话数据
          localStorage.removeItem(`ai_chat_${userId}_messages`);
          localStorage.removeItem(`ai_chat_${userId}_sessionId`);

          // 清理AI测试用例生成会话数据
          localStorage.removeItem(`ai_testcase_${userId}_messages`);
          localStorage.removeItem(`ai_testcase_${userId}_sessionId`);
        }

        // 额外清理：遍历所有localStorage项，清理任何AI相关的数据
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('ai_chat_') || key.startsWith('ai_testcase_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        set({ user: null, token: null, isLoggedIn: false });
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn
      })
    }
  )
);

// 应用状态接口
interface AppState {
  collapsed: boolean;
  theme: 'light' | 'dark';
  primaryColor: string;
  setCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setPrimaryColor: (color: string) => void;
}

// 应用状态管理
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      collapsed: false,
      theme: 'light',
      primaryColor: '#1890ff',
      
      setCollapsed: (collapsed: boolean) => set({ collapsed }),
      setTheme: (theme: 'light' | 'dark') => set({ theme }),
      setPrimaryColor: (color: string) => set({ primaryColor: color })
    }),
    {
      name: 'app-storage'
    }
  )
);
