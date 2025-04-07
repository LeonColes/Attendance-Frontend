import { post, get } from '@/utils/request'
import { PageQueryParams } from './attendance'

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
    items: Course[]
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
    items: {
      id: string
      userId: string
      username: string
      fullName: string
      role: string
      joinTime: string
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
 * 生成新的邀请码（教师）
 * @param courseId 课程ID
 */
export function refreshInviteCode(courseId: string) {
  return post<{ code: string }>(`/api/courses/refresh-code?id=${courseId}`)
} 