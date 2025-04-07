import { post, get } from '@/utils/request'
import type { PageQueryParams } from './attendance'

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
}

/**
 * 获取课程列表
 * @param params 分页参数
 */
export function getCourseList(params: PageQueryParams) {
  return post<{
    totalItems: number
    courses: Course[]
    totalPages: number
    currentPage: number
  }>('/api/courses/list', params)
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
export function getCourseQRCode(courseId: string): Promise<ArrayBuffer> {
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
    
    uni.request({
      url: `http://localhost:8080/api/courses/qrcode?courseId=${courseId}`,
      method: 'GET',
      header: {
        'Authorization': authHeader
      },
      responseType: 'arraybuffer',
      success: (res) => {
        console.log('二维码请求成功:', res.statusCode);
        if (res.statusCode === 200 && res.data) {
          resolve(res.data as ArrayBuffer);
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('二维码请求失败:', err);
        reject(err);
      }
    });
  });
} 