import { post, get } from '@/utils/request'
import { getToken } from '@/utils/request'

/**
 * 分页查询参数
 */
export interface PageQueryParams {
  page: number
  size: number
  sort?: Array<{
    field: string
    direction: string
  }>
  filters?: Record<string, any>
}

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
  MANUAL = 'MANUAL',
}

/**
 * 签到记录状态枚举
 */
export enum RecordStatus {
  NORMAL = 'NORMAL',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
  CHECKED_IN = 'CHECKED_IN',
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  MISSED = 'MISSED',
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
  verifyParams?: string
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
  attendanceStatus?: string
  createdAt: string
  updatedAt: string
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
  absentStudents: {
    userId: string
    username: string
    fullName: string
  }[]
  presentStudents: string[]
  title: string
  startTime: string
  endTime: string
  status: string
  checkinType: string
}

/**
 * 提交签到参数
 */
export interface CheckinSubmitParams {
  checkinId: string
  verifyMethod: CheckInType
  device: string
  location?: string
  verifyData?: string
}

/**
 * 创建签到任务
 * @param params 签到任务参数
 */
export function createCheckin(params: CheckinCreateParams) {
  return post<CheckinTask>('/api/courses/attendance/create', params);
}

/**
 * 获取签到任务列表
 * @param courseId 课程ID
 * @param params 分页参数
 */
export function getCheckinList(courseId: string, params: PageQueryParams) {
  return post(`/api/courses/attendance/list?courseId=${courseId}`, params)
}

/**
 * 获取签到二维码（教师）
 * @param checkinId 签到任务ID
 */
export function getCheckinQRCode(checkinId: string) {
  return get<ArrayBuffer>(`/api/courses/attendance/qrcode?checkinId=${checkinId}`, undefined, {
    responseType: 'arraybuffer'
  } as any)
}

/**
 * 提交签到（学生）
 * @param params 签到参数
 */
export function submitCheckin(params: CheckinSubmitParams) {
  return post<CheckinRecord>('/api/courses/attendance/check-in', params)
}

/**
 * 获取学生签到状态列表（学生查看自己的签到状态）
 * @param courseId 课程ID
 * @param params 分页参数
 */
export function getStudentCheckinStatus(courseId: string, params: PageQueryParams) {
  return post(`/api/courses/attendance/record/status?courseId=${courseId}`, params)
}

/**
 * 获取签到记录列表（教师查看签到记录）
 * @param checkinId 签到任务ID
 * @param params 分页参数
 */
export function getCheckinRecordList(checkinId: string, params: PageQueryParams) {
  return post(`/api/courses/attendance/record/list?checkinId=${checkinId}`, params)
}

/**
 * 获取签到任务详情
 * @param checkinId 签到任务ID
 */
export function getCheckinDetail(checkinId: string) {
  return get<CheckinTask>(`/api/courses/attendance/detail?id=${checkinId}`)
}

/**
 * 删除签到任务（教师）
 * @param checkinId 签到任务ID
 */
export function deleteCheckin(checkinId: string) {
  return post<void>(`/api/courses/attendance/delete?checkinId=${checkinId}`)
}
