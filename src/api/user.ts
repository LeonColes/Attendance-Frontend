/**
 * 用户相关 API
 */
import { post, get } from '@/utils/request'

// 用户注册接口参数
export interface RegisterParams {
  username: string
  password: string
  fullName: string
  email: string
  role: 'STUDENT' | 'TEACHER'
}

// 登录参数类型
export interface LoginParams {
  username: string
  password: string
}

// 认证响应类型
export interface AuthResponse {
  accessToken: string
  tokenType: string
  userId: string
  username: string
  fullName: string
  role: string
}

// 用户信息类型
export interface UserInfo {
  userId: string
  username: string
  fullName?: string
  role: string
  avatar?: string
  email?: string
  phone?: string
  department?: string
  createdAt?: string
  updatedAt?: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 用户注册
 * @param params 注册参数
 * @returns 包含用户信息的响应
 */
export function register(params: RegisterParams) {
  return post<UserInfo>('/api/auth/register', params)
}

/**
 * 用户登录
 * @param params 登录参数
 */
export function login(params: LoginParams) {
  return post<AuthResponse>('/api/auth/login', params)
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return get<UserInfo>('/api/users/current')
}

/**
 * 修改用户信息
 * @param params 用户信息
 */
export function updateUserInfo(params: Partial<UserInfo>) {
  return post<null>('/api/users/update', params)
}

/**
 * 修改密码
 * @param params 密码信息
 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export function changePassword(params: ChangePasswordParams) {
  return post<null>('/api/users/change-password', params)
} 