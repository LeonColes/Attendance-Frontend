import { post, get } from '@/utils/request'

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
 * 获取我的课程列表
 * @param params 分页参数
 */
export function getCourseList(params: PageQueryParams) {
  return post<{
    totalItems: number
    items: Course[]
    totalPages: number
    currentPage: number
  }>('/courses/list', params)
}

/**
 * 创建课程（仅教师）
 * @param params 课程创建参数
 */
export function createCourse(params: CourseCreateParams) {
  return post<Course>('/courses/create', params)
}

/**
 * 加入课程（通过邀请码）
 * @param code 课程邀请码
 */
export function joinCourse(code: string) {
  return post<{
    id: string
    userId: string
    courseId: string
    role: string
    joinTime: string
  }>(`/courses/members/join?code=${code}`)
} 