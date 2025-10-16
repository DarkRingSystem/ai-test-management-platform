// API响应基础结构
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页参数
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

// 分页响应
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// 搜索参数
export interface SearchParams {
  search?: string;
}

// 排序参数
export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// 通用查询参数
export interface QueryParams extends PaginationParams, SearchParams, SortParams {
  [key: string]: any;
}

// HTTP方法枚举
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// 请求配置
export interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: any;
  params?: any;
  headers?: Record<string, string>;
}

// 错误响应
export interface ErrorResponse {
  detail: string;
  code?: string;
  field?: string;
}
