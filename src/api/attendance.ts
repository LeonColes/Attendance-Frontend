import { post, get } from '@/utils/request'

/**
 * 签到任务状态枚举
 */
export enum CheckInStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * 签到类型枚举
 */
export enum CheckInType {
  QR_CODE = 'QR_CODE',
  LOCATION = 'LOCATION',
  WIFI = 'WIFI',
}

/**
 * 签到记录状态枚举
 */
export enum RecordStatus {
  NORMAL = 'NORMAL',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
}

/**
 * 签到任务创建参数
 */
export interface CheckinCreateParams {
  courseId: string
  title: string
  description?: string
  startTime: string
  endTime: string
  checkInType: CheckInType
  verifyParams?: Record<string, any>
}

/**
 * 签到任务信息
 */
export interface CheckinTask {
  id: string
  name: string
  description?: string
  type: string
  status: string
  checkinStartTime: string
  checkinEndTime: string
  checkinType: string
  parentCourseId: string
  creatorId?: string
  personalStatus?: string
  displayStatus?: string
}

/**
 * 签到记录信息
 */
export interface CheckinRecord {
  id: string
  userId: string
  courseId: string
  status: string
  checkInTime: string
  device: string
  location?: string
  verifyMethod: string
  displayStatus: string
}

/**
 * 签到统计信息
 */
export interface CheckinStatistics {
  totalStudents: number
  presentCount: number
  absentCount: number
  normalCount: number
  lateCount: number
  attendanceRate: number
}

/**
 * 提交签到参数
 */
export interface CheckinSubmitParams {
  checkinId: string
  verifyMethod: CheckInType
  device: string
  location?: string
  verifyData: string
}

/**
 * 分页查询参数
 */
export interface PageQueryParams {
  page: number
  size: number
}

/**
 * 创建签到任务
 * @param params 签到任务参数
 */
export function createCheckin(params: CheckinCreateParams) {
  return post<CheckinTask>('/courses/attendance/create', params)
}

/**
 * 获取签到任务列表
 * @param courseId 课程ID
 * @param params 分页参数
 */
export function getCheckinList(courseId: string, params: PageQueryParams) {
  return post<{
    totalItems: number
    items: CheckinTask[]
    totalPages: number
    currentPage: number
  }>(`/courses/attendance/list?courseId=${courseId}`, params)
}

/**
 * 获取签到二维码（教师）
 * @param checkinId 签到任务ID
 */
export function getCheckinQRCode(checkinId: string) {
  return get<Blob>(`/courses/attendance/qrcode?checkinId=${checkinId}`, {
    responseType: 'blob',
  })
}

/**
 * 提交签到（学生）
 * @param params 签到参数
 */
export function submitCheckin(params: CheckinSubmitParams) {
  return post<CheckinRecord>('/courses/attendance/check-in', params)
}

/**
 * 获取学生签到状态列表（学生查看自己的签到状态）
 * @param courseId 课程ID
 * @param params 分页参数
 */
export function getStudentCheckinStatus(courseId: string, params: PageQueryParams) {
  return post<{
    totalItems: number
    records: {
      checkinId: string
      checkinName: string
      status: string
      checkInTime: string
      startTime: string
      endTime: string
      checkinType: string
      displayStatus: string
    }[]
    totalPages: number
    currentPage: number
    courseInfo: {
      id: string
      name: string
      description: string
    }
    personalStats: {
      totalCheckins: number
      attendedCount: number
      normalCount: number
      lateCount: number
      absentCount: number
      attendanceRate: number
    }
  }>(`/courses/attendance/record/status?courseId=${courseId}`, params)
}

/**
 * 获取签到记录列表（教师查看签到记录）
 * @param checkinId 签到任务ID
 * @param params 分页参数
 */
export function getCheckinRecordList(checkinId: string, params: PageQueryParams) {
  return post<{
    totalItems: number
    records: {
      userId: string
      username: string
      fullName: string
      status: string
      checkInTime: string
      device: string
      location: string | null
    }[]
    totalPages: number
    currentPage: number
    checkinInfo: {
      id: string
      name: string
      description: string
      status: string
      checkinStartTime: string
      checkinEndTime: string
    }
    statistics: CheckinStatistics
  }>(`/courses/attendance/record/list?checkinId=${checkinId}`, params)
}

/**
 * 获取签到统计数据（教师）
 * @param checkinId 签到任务ID
 * @param params 分页参数
 */
export function getCheckinStatistics(checkinId: string, params: PageQueryParams) {
  return post<{
    statistics: {
      checkinId: string
      title: string
      description: string
      startTime: string
      endTime: string
      status: string
      checkinType: string
      totalStudents: number
      presentCount: number
      absentCount: number
      normalCount: number
      lateCount: number
      attendanceRate: number
      absentStudents: {
        userId: string
        username: string
        fullName: string
      }[]
      presentStudents: {
        userId: string
        username: string
        fullName: string
        status: string
        checkInTime: string
      }[]
      timeDistribution: Record<string, number>
    }
    checkinInfo: {
      id: string
      name: string
      description: string
      creatorId: string
      type: string
      status: string
      checkinStartTime: string
      checkinEndTime: string
    }
  }>(`/courses/attendance/record/statistics?checkinId=${checkinId}`, params)
}
