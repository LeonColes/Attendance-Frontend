import { post } from '@/utils/request'

/**
 * 学生注册接口参数
 */
export interface StudentRegisterParams {
  username: string
  password: string
  fullName: string
  email: string
}

/**
 * 教师注册接口参数
 */
export interface TeacherRegisterParams {
  username: string
  password: string
  fullName: string
  email: string
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
  email: string
  role: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string
  user: UserInfo
}

/**
 * 学生注册
 * @param params 注册参数
 */
export function registerStudent(params: StudentRegisterParams) {
  return post<UserInfo>('/api/auth/register/student', params)
}

/**
 * 教师注册
 * @param params 注册参数
 */
export function registerTeacher(params: TeacherRegisterParams) {
  return post<UserInfo>('/api/auth/register/teacher', params)
}

/**
 * 用户登录
 * @param params 登录参数
 */
export function login(params: LoginParams) {
  return post<LoginResponse>('/api/auth/login', params)
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return post<UserInfo>('/api/auth/userinfo')
}

/**
 * 退出登录
 */
export function logout() {
  return post('/api/auth/logout')
}
