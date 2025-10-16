// 导出所有类型定义
export * from './user';
export * from './api';

// 菜单项类型
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
}

// 面包屑项类型
export interface BreadcrumbItem {
  title: string;
  path?: string;
}

// 表格列配置
export interface TableColumn {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

// 表单字段配置
export interface FormField {
  name: string;
  label: string;
  type: 'input' | 'password' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'upload';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  rules?: any[];
}

// 统计卡片数据
export interface StatCard {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

// 图表数据
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}
