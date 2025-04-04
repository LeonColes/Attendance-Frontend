import { del, get, post, put } from '@/utils/request'

/**
 * 课程基本信息
 */
export interface Course {
  id: string
  code: string
  name: string
  description?: string
  credits: number
  semester: string
  teacherId: string
  teacherName: string
  startDate: string
  endDate: string
  schedule: CourseSchedule[]
  location?: string
  coverImage?: string
  status: 'active' | 'inactive' | 'completed'
  createdAt: string
  updatedAt: string
}

/**
 * 课程计划安排
 */
export interface CourseSchedule {
  dayOfWeek: number // 0-6，表示周日到周六
  startTime: string // 格式: "HH:MM"
  endTime: string // 格式: "HH:MM"
  location?: string
  building?: string
  room?: string
}

/**
 * 课程学生
 */
export interface CourseStudent {
  id: string
  studentId: string
  studentName: string
  courseId: string
  joinDate: string
  status: 'active' | 'inactive' | 'dropped'
  attendanceRate?: number
  createdAt: string
  updatedAt: string
}

/**
 * 创建课程参数
 */
export interface CreateCourseParams {
  code: string
  name: string
  description?: string
  credits: number
  semester: string
  startDate: string
  endDate: string
  schedule: CourseSchedule[]
  location?: string
  coverImage?: string
}

/**
 * 查询课程列表
 */
export function getCourses(params?: {
  teacherId?: string
  semester?: string
  status?: string
  keyword?: string
  page?: number
  limit?: number
}) {
  return get<{
    total: number
    list: Course[]
  }>('/api/courses', params)
}

/**
 * 获取课程详情
 */
export function getCourseDetails(courseId: string) {
  return get<Course>(`/api/courses/${courseId}`)
}

/**
 * 创建课程（教师）
 */
export function createCourse(params: CreateCourseParams) {
  return post<Course>('/api/courses', params)
}

/**
 * 更新课程信息（教师）
 */
export function updateCourse(courseId: string, params: Partial<CreateCourseParams>) {
  return put<Course>(`/api/courses/${courseId}`, params)
}

/**
 * 删除课程（教师）
 */
export function deleteCourse(courseId: string) {
  return del<boolean>(`/api/courses/${courseId}`)
}

/**
 * 获取课程学生列表
 */
export function getCourseStudents(courseId: string, params?: {
  status?: string
  keyword?: string
  page?: number
  limit?: number
}) {
  return get<{
    total: number
    list: CourseStudent[]
  }>(`/api/courses/${courseId}/students`, params)
}

/**
 * 添加学生到课程（教师）
 */
export function addStudentToCourse(courseId: string, studentIds: string[]) {
  return post<boolean>(`/api/courses/${courseId}/students`, { studentIds })
}

/**
 * 从课程移除学生（教师）
 */
export function removeStudentFromCourse(courseId: string, studentId: string) {
  return del<boolean>(`/api/courses/${courseId}/students/${studentId}`)
}

/**
 * 学生加入课程
 */
export function joinCourse(courseCode: string) {
  return post<CourseStudent>('/api/courses/join', { courseCode })
}

/**
 * 获取学生课程列表
 */
export function getStudentCourses(params?: {
  studentId?: string
  semester?: string
  status?: string
  page?: number
  limit?: number
}) {
  return get<{
    total: number
    list: Course[]
  }>('/api/courses/student', params)
}

/**
 * 获取教师课程列表
 */
export function getTeacherCourses(params?: {
  teacherId?: string
  semester?: string
  status?: string
  page?: number
  limit?: number
}) {
  return get<{
    total: number
    list: Course[]
  }>('/api/courses/teacher', params)
}

/**
 * 获取当前学期
 */
export function getCurrentSemester() {
  return get<{
    id: string
    name: string
    startDate: string
    endDate: string
    current: boolean
  }>('/api/courses/semester/current')
}

/**
 * 获取学期列表
 */
export function getSemesters() {
  return get<Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    current: boolean
  }>>('/api/courses/semesters')
}

/**
 * 获取课程日程表
 */
export function getCourseSchedule(params?: {
  startDate?: string
  endDate?: string
  courseId?: string
}) {
  return get<Array<{
    date: string
    dayOfWeek: number
    courses: Array<{
      id: string
      courseId: string
      courseName: string
      startTime: string
      endTime: string
      location: string
      hasAttendance: boolean
      attendanceStatus?: string
    }>
  }>>('/api/courses/schedule', params)
}

/**
 * 导入课程学生名单
 */
export function importCourseStudents(courseId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return post<{
    total: number
    success: number
    failed: number
    errors?: string[]
  }>(`/api/courses/${courseId}/students/import`, formData, {
    header: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
