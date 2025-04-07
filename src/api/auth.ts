import { post } from '@/utils/request'

/**
 * 基础响应类型
 */
export interface BaseResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 用户注册接口参数
 */
export interface RegisterParams {
  username: string
  password: string
  fullName: string
  email?: string
  phone?: string
  role?: string
}

/**
 * 登录接口参数
 */
export interface LoginParams {
  username: string
  password: string
}

/**
 * 用户基本信息
 */
export interface UserInfo {
  id: string
  username: string
  fullName: string
  email?: string
  phone?: string
  role: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  accessToken: string
  tokenType: string
  userId: string
  username: string
  fullName: string
  role: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  code: number
  message: string
  data: LoginResponseData
}

/**
 * 用户注册
 * @param params 注册参数
 */
export function register(params: RegisterParams) {
  return post<UserInfo>('/auth/register', params)
}

/**
 * 用户登录
 * @param params 登录参数
 */
export function login(params: LoginParams) {
  return post<LoginResponseData>('/auth/login', params)
}

/**
 * 退出登录
 */
export function logout() {
  return post('/auth/logout')
}
