import { del, get, post, put } from '@/utils/request'

/**
 * 签到记录状态枚举
 */
export enum AttendanceStatus {
  PRESENT = 'present', // 已签到
  ABSENT = 'absent', // 缺席
  LATE = 'late', // 迟到
  LEAVE = 'leave', // 请假
  PENDING = 'pending', // 待签到
}

/**
 * 签到方式枚举
 */
export enum CheckInMethod {
  QR_CODE = 'qrcode', // 二维码签到
  LOCATION = 'location', // 位置签到
  GPS = 'gps', // GPS定位签到
  WIFI = 'wifi', // Wi-Fi签到
  MANUAL = 'manual', // 手动签到（教师代签）
  AUTOMATIC = 'automatic', // 自动签到
}

/**
 * 签到会话信息
 */
export interface AttendanceSession {
  id: string
  courseId: string
  courseName: string
  teacherId: string
  teacherName: string
  title: string
  startTime: string
  endTime: string
  duration: number // 签到持续时间（分钟）
  method: CheckInMethod
  locationRequired?: boolean
  location?: {
    latitude: number
    longitude: number
    range: number // 签到有效范围（米）
  }
  wifiSSID?: string
  bluetoothId?: string
  qrCodeContent?: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'completed' | 'canceled'
}

/**
 * 考勤记录
 */
export interface AttendanceRecord {
  id: string
  sessionId: string
  courseId: string
  courseName: string
  studentId: string
  studentName: string
  checkInTime?: string
  checkOutTime?: string
  status: AttendanceStatus
  method: CheckInMethod
  ipAddress?: string
  location?: {
    latitude: number
    longitude: number
  }
  device?: string
  comment?: string
  createdAt: string
  updatedAt: string
}

/**
 * 考勤统计
 */
export interface AttendanceStatistics {
  total: number
  present: number
  absent: number
  late: number
  leave: number
  attendanceRate: number // 出勤率
}

/**
 * 创建签到会话参数
 */
export interface CreateSessionParams {
  courseId: string
  title?: string
  startTime?: string
  endTime?: string
  duration?: number
  method: CheckInMethod
  locationRequired?: boolean
  location?: {
    latitude: number
    longitude: number
    range: number
  }
  wifiSSID?: string
  bluetoothId?: string
}

/**
 * 学生签到参数
 */
export interface CheckInParams {
  sessionId: string
  method: CheckInMethod
  location?: {
    latitude: number
    longitude: number
  }
  wifiSSID?: string
  bluetoothId?: string
  qrCodeContent?: string
  faceImage?: string
}

/**
 * 查询签到会话列表
 * @param params 查询参数
 */
export function getAttendanceSessions(params?: {
  courseId?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  return get<{
    total: number
    list: AttendanceSession[]
  }>('/api/attendance/sessions', params)
}

/**
 * 获取签到会话详情
 * @param sessionId 签到会话ID
 */
export function getAttendanceSessionDetails(sessionId: string) {
  return get<AttendanceSession>(`/api/attendance/sessions/${sessionId}`)
}

/**
 * 创建签到会话（教师）
 * @param params 会话参数
 */
export function createAttendanceSession(params: CreateSessionParams) {
  return post<AttendanceSession>('/api/attendance/sessions', params)
}

/**
 * 结束签到会话（教师）
 * @param sessionId 签到会话ID
 */
export function endAttendanceSession(sessionId: string) {
  return put<AttendanceSession>(`/api/attendance/sessions/${sessionId}/end`)
}

/**
 * 取消签到会话（教师）
 * @param sessionId 签到会话ID
 */
export function cancelAttendanceSession(sessionId: string) {
  return put<AttendanceSession>(`/api/attendance/sessions/${sessionId}/cancel`)
}

/**
 * 学生签到
 * @param params 签到参数
 */
export function checkIn(params: CheckInParams) {
  return post<AttendanceRecord>('/api/attendance/check-in', params)
}

/**
 * 查询考勤记录（教师可查询全部，学生只能查询自己的）
 * @param params 查询参数
 */
export function getAttendanceRecords(params?: {
  sessionId?: string
  courseId?: string
  studentId?: string
  status?: AttendanceStatus
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  return get<{
    total: number
    list: AttendanceRecord[]
  }>('/api/attendance/records', params)
}

/**
 * 获取考勤记录详情
 * @param recordId 考勤记录ID
 */
export function getAttendanceRecord(recordId: string) {
  return get<AttendanceRecord>(`/api/attendance/records/${recordId}`)
}

/**
 * 修改考勤状态（教师）
 * @param recordId 考勤记录ID
 * @param status 新状态
 * @param comment 备注
 */
export function updateAttendanceStatus(recordId: string, status: AttendanceStatus, comment?: string) {
  return put<AttendanceRecord>(`/api/attendance/records/${recordId}/status`, { status, comment })
}

/**
 * 获取考勤统计
 * @param params 查询参数
 */
export function getAttendanceStatistics(params?: {
  courseId?: string
  studentId?: string
  startDate?: string
  endDate?: string
}) {
  return get<AttendanceStatistics>('/api/attendance/statistics', params)
}

/**
 * 学生请假申请
 * @param params 请假参数
 */
export function applyLeave(params: {
  courseId: string
  sessionId?: string
  reason: string
  startDate: string
  endDate: string
  attachment?: string
}) {
  return post('/api/attendance/leave', params)
}

/**
 * 获取当前可签到的会话（学生）
 */
export function getActiveSessionsForStudent() {
  return get<AttendanceSession[]>('/api/tasks/active')
}

/**
 * 获取教师管理的活跃签到会话
 * @param teacherId 教师ID
 */
export function getTeacherActiveSessions(teacherId?: string) {
  return get<AttendanceSession[]>('/api/tasks/my-tasks', { teacherId })
}

/**
 * 教师代签（为学生手动签到）
 */
export function manualCheckIn(params: {
  sessionId: string
  studentId: string
  status: AttendanceStatus
  comment?: string
}) {
  return post<AttendanceRecord>('/api/attendance/manual-check-in', params)
}

/**
 * 批量修改考勤状态（教师）
 */
export function batchUpdateAttendance(params: {
  sessionId: string
  records: Array<{
    studentId: string
    status: AttendanceStatus
  }>
}) {
  return put('/api/attendance/batch-update', params)
}

/**
 * 导出考勤数据
 */
export function exportAttendanceData(params: {
  courseId?: string
  startDate?: string
  endDate?: string
  format?: 'excel' | 'csv' | 'pdf'
}) {
  return get<ArrayBuffer>('/api/attendance/export', params, {
    responseType: 'arraybuffer',
    showLoading: true,
  })
}
