/**
 * 用户相关 API
 */
import request from '@/utils/request'

// 登录参数类型
export interface LoginParams {
  username: string
  password: string
}

// 用户信息类型
export interface UserInfo {
  userId: string
  username: string
  fullName?: string
  role: 'teacher' | 'student' | string
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
 * 用户登录
 * @param params 登录参数
 */
export function login(params: LoginParams): Promise<ApiResponse<UserInfo & { token: string }>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      const response: ApiResponse<UserInfo & { token: string }> = {
        code: 200,
        message: '登录成功',
        data: {
          userId: '12345',
          username: params.username,
          fullName: params.username === 'teacher' ? '张教授' : '李同学',
          role: params.username === 'teacher' ? 'teacher' : 'student',
          token: 'mock-token-' + Math.random().toString(36).substring(2),
          avatar: '/static/images/avatar.png'
        }
      }
      resolve(response)
    }, 500)
  })
}

/**
 * 获取用户信息
 */
export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟从缓存或本地存储获取已登录用户信息
      const role = uni.getStorageSync('user_role') || 'student'
      
      const response: ApiResponse<UserInfo> = {
        code: 200,
        message: '获取成功',
        data: {
          userId: '12345',
          username: role === 'teacher' ? 'teacher' : 'student',
          fullName: role === 'teacher' ? '张教授' : '李同学',
          role: role,
          avatar: '/static/images/avatar.png',
          email: role === 'teacher' ? 'teacher@example.com' : 'student@example.com',
          department: role === 'teacher' ? '计算机科学系' : '计算机科学专业',
          createdAt: '2025-01-01 00:00:00',
          updatedAt: '2025-01-01 00:00:00'
        }
      }
      resolve(response)
    }, 300)
  })
}

/**
 * 修改用户信息
 * @param params 用户信息
 */
export function updateUserInfo(params: Partial<UserInfo>): Promise<ApiResponse<null>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      const response: ApiResponse<null> = {
        code: 200,
        message: '修改成功',
        data: null
      }
      resolve(response)
    }, 300)
  })
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

export function changePassword(params: ChangePasswordParams): Promise<ApiResponse<null>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      const response: ApiResponse<null> = {
        code: 200,
        message: '修改成功',
        data: null
      }
      resolve(response)
    }, 300)
  })
} 