import { post, get } from '@/utils/request'
import type { ApiResponse } from '@/api/user'
import type { PageQueryParams } from './attendance'

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
  creatorUsername: string
  code: string
  status: string
  memberCount: number
  startDate: string
  endDate: string
  type: string
  createdAt: string
  updatedAt: string
}

/**
 * 课程成员信息
 */
export interface CourseMember {
  id: string
  userId: string
  courseId: string
  role: string
  joinTime: string
}

/**
 * 创建课程参数
 */
export interface CourseCreateParams {
  name: string
  description: string
  startDate: string
  endDate: string
  cover?: string
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

/**
 * 课程列表请求参数
 */
export interface CourseListParams {
  page?: number
  size?: number
  status?: string
  keyword?: string
}

/**
 * 获取课程列表
 * @param params 分页参数
 */
export function getCourseList(params: PageQueryParams | CourseListParams) {
  // 兼容两种不同的参数格式和返回值结构
  if ('keyword' in params || 'status' in params) {
    // 使用模拟数据模式 (原course.ts的实现方式)
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
        resolve(response as any)
      }, 300)
    })
  } else {
    // 使用真实API实现 (原courses.ts的实现方式)
    return post<{
      totalItems: number
      courses: Course[]
      totalPages: number
      currentPage: number
    }>('/api/courses/list', params)
  }
}

/**
 * 创建课程（教师）
 * @param params 课程参数
 */
export function createCourse(params: CourseCreateParams) {
  return post<Course>('/api/courses/create', params)
}

/**
 * 通过邀请码加入课程（学生）
 * @param code 邀请码
 */
export function joinCourse(code: string) {
  return post<CourseMember>(`/api/courses/members/join?code=${code}`)
}

/**
 * 获取课程详情
 * @param courseId 课程ID
 */
export function getCourseDetail(courseId: string) {
  return get<{
    course: Course
    isMember: boolean
    memberRole: string
    memberCount: number
    teacherInfo: {
      id: string
      fullName: string
    }
  }>(`/api/courses/detail?id=${courseId}`)
}

/**
 * 获取课程成员列表
 * @param courseId 课程ID
 * @param params 分页参数
 */
export function getCourseMemberList(courseId: string, params: PageQueryParams) {
  return post<{
    totalItems: number
    users: {
      id: string
      userId: string
      username: string
      fullName: string
      role: string
      email: string
      phone: string | null
      avatarUrl: string | null
      bio: string | null
      enabled: boolean
      createdAt: string
      updatedAt: string
    }[]
    totalPages: number
    currentPage: number
  }>(`/api/courses/members/list?courseId=${courseId}`, params)
}

/**
 * 移除课程成员（教师）
 * @param courseId 课程ID
 * @param userId 用户ID
 */
export function removeCourseMember(courseId: string, userId: string) {
  return post<void>(`/api/courses/members/remove?courseId=${courseId}&userId=${userId}`)
}

/**
 * 退出课程（学生）
 * @param courseId 课程ID
 */
export function leaveCourse(courseId: string) {
  return post<void>(`/api/courses/members/leave?courseId=${courseId}`)
}

/**
 * 退出课程（别名，兼容性保留）
 */
export function quitCourse(courseId: string) {
  return leaveCourse(courseId)
}

/**
 * 更新课程信息（教师）
 * @param courseId 课程ID
 * @param params 更新参数
 */
export function updateCourse(courseId: string, params: Partial<CourseCreateParams>) {
  return post<Course>(`/api/courses/update?id=${courseId}`, params)
}

/**
 * 获取课程邀请二维码（教师）
 * @param courseId 课程ID
 */
export function getCourseQRCode(courseId: string): Promise<any> {
  console.log('调用 getCourseQRCode, courseId:', courseId)
  
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');
    let authHeader = '';
    
    try {
      const parsedToken = JSON.parse(token);
      authHeader = `${parsedToken.tokenType || 'Bearer'} ${parsedToken.accessToken || ''}`;
    } catch (e) {
      console.error('解析token失败', e);
    }
    
    // 请求选项
    const requestOptions: UniApp.RequestOptions = {
      url: `http://localhost:8080/api/courses/qrcode?courseId=${courseId}`,
      method: 'GET',
      header: {
        'Authorization': authHeader
      },
      responseType: 'arraybuffer' as any,
      success: (res: any) => {
        console.log('二维码请求成功:', res.statusCode);
        if (res.statusCode === 200 && res.data) {
          console.log('二维码数据类型:', typeof res.data);
          
          // 微信小程序特殊处理（数据可能已经是ArrayBuffer）
          // #ifdef MP-WEIXIN
          if (res.data instanceof ArrayBuffer) {
            resolve(res.data);
          } else {
            console.warn('微信小程序: 响应不是ArrayBuffer类型, 尝试转换');
            // 可能是不同的数据类型，尝试处理
            if (typeof res.data === 'object') {
              // 如果是对象，包装后返回
              resolve(res.data);
            } else {
              // 其他情况转为字符串
              resolve(res.data);
            }
          }
          // #endif
          
          // 非微信小程序环境
          // #ifndef MP-WEIXIN
          resolve(res.data);
          // #endif
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('二维码请求失败:', err);
        reject(err);
      }
    };
    
    // 发送请求
    uni.request(requestOptions);
  });
} 