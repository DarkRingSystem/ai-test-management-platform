// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  TEST_MANAGER = 'test_manager',
  TESTER = 'tester',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  LOCKED = 'locked'
}

// 用户基础信息
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  is_superuser: boolean;
  last_login?: string;
  login_count: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// 用户创建数据
export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  description?: string;
}

// 用户更新数据
export interface UserUpdate {
  full_name?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  description?: string;
}

// 用户密码更新数据
export interface UserPasswordUpdate {
  old_password: string;
  new_password: string;
}

// 登录数据
export interface LoginData {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// 用户角色标签映射
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: '系统管理员',
  [UserRole.PROJECT_MANAGER]: '项目经理',
  [UserRole.TEST_MANAGER]: '测试经理',
  [UserRole.TESTER]: '测试工程师',
  [UserRole.DEVELOPER]: '开发工程师',
  [UserRole.VIEWER]: '只读用户'
};

// 用户状态标签映射
export const UserStatusLabels: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: '激活',
  [UserStatus.INACTIVE]: '未激活',
  [UserStatus.SUSPENDED]: '暂停',
  [UserStatus.LOCKED]: '锁定'
};

// 用户状态颜色映射
export const UserStatusColors: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.INACTIVE]: 'default',
  [UserStatus.SUSPENDED]: 'warning',
  [UserStatus.LOCKED]: 'error'
};
