import { post, get } from '@/utils/request'
import { ApiResponse } from '@/api/user'

/**
 * 课程状态枚举
 */
export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * 课程信息
 */
export interface Course {
  id: string
  name: string
  description: string
  creatorId: string
  creatorFullName: string
  code: string
  status: string
  memberCount: number
  startDate: string
  endDate: string
}

/**
 * 分页查询参数
 */
export interface PageQueryParams {
  page: number
  size: number
}

/**
 * 创建课程参数
 */
export interface CourseCreateParams {
  name: string
  description?: string
  startDate: string
  endDate: string
}

/**
 * 课程相关 API
 */
export interface CourseInfo {
  id: string
  name: string
  description?: string
  cover?: string
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'not_started' | string
  creatorId?: string
  creatorName?: string
  memberCount?: number
  checkinCount?: number
  createdAt?: string
  updatedAt?: string
}

// 课程列表请求参数
export interface CourseListParams {
  page?: number
  size?: number
  status?: string
  keyword?: string
}

/**
 * 获取课程列表
 */
export function getCourseList(params?: CourseListParams): Promise<ApiResponse<{ items: CourseInfo[], total: number }>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      const response: ApiResponse<{ items: CourseInfo[], total: number }> = {
        code: 200,
        message: '获取成功',
        data: {
          items: [
            {
              id: '1',
              name: '高等数学（上）',
              description: '本课程介绍微积分的基本概念和应用',
              cover: '/static/images/course1.jpg',
              startDate: '2025-04-01',
              endDate: '2025-06-30',
              status: 'active',
              creatorId: '12345',
              creatorName: '张教授',
              memberCount: 45,
              checkinCount: 8,
              createdAt: '2025-03-15',
              updatedAt: '2025-03-15'
            },
            {
              id: '2',
              name: '线性代数',
              description: '学习矩阵运算和向量空间等基础内容',
              cover: '/static/images/course2.jpg',
              startDate: '2025-03-01',
              endDate: '2025-06-15',
              status: 'active',
              creatorId: '12345',
              creatorName: '李教授',
              memberCount: 38,
              checkinCount: 12,
              createdAt: '2025-02-15',
              updatedAt: '2025-02-15'
            }
          ],
          total: 2
        }
      }
      resolve(response)
    }, 300)
  })
}

/**
 * 获取课程详情
 */
export function getCourseDetail(id: string): Promise<ApiResponse<CourseInfo>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      const response: ApiResponse<CourseInfo> = {
        code: 200,
        message: '获取成功',
        data: {
          id,
          name: '高等数学（上）',
          description: '本课程介绍微积分的基本概念和应用，包括极限、连续、导数、积分等内容。通过本课程的学习，学生将掌握微积分的基本理论和方法，能够运用微积分知识解决实际问题。',
          cover: '/static/images/course1.jpg',
          startDate: '2025-04-01',
          endDate: '2025-06-30',
          status: 'active',
          creatorId: '12345',
          creatorName: '张教授',
          memberCount: 45,
          checkinCount: 8,
          createdAt: '2025-03-15',
          updatedAt: '2025-03-15'
        }
      }
      resolve(response)
    }, 300)
  })
}

/**
 * 创建课程
 */
export interface CreateCourseParams {
  name: string
  description?: string
  startDate: string
  endDate: string
  cover?: string
}

export function createCourse(params: CreateCourseParams): Promise<ApiResponse<{ id: string, code: string }>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      const response: ApiResponse<{ id: string, code: string }> = {
        code: 200,
        message: '创建成功',
        data: {
          id: Math.random().toString(36).substring(2, 10),
          code: 'CODE' + Math.random().toString(36).substring(2, 7).toUpperCase()
        }
      }
      resolve(response)
    }, 500)
  })
}

/**
 * 加入课程
 */
export function joinCourse(params: { code: string }): Promise<ApiResponse<{ courseId: string }>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      const response: ApiResponse<{ courseId: string }> = {
        code: 200,
        message: '加入成功',
        data: {
          courseId: Math.random().toString(36).substring(2, 10)
        }
      }
      resolve(response)
    }, 500)
  })
}

/**
 * 退出课程
 */
export function quitCourse(courseId: string): Promise<ApiResponse<null>> {
  // 实际应用中应调用真实接口
  return new Promise((resolve) => {
    setTimeout(() => {
      const response: ApiResponse<null> = {
        code: 200,
        message: '退出成功',
        data: null
      }
      resolve(response)
    }, 300)
  })
} 