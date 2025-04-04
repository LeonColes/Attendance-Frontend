import { get, post, put } from '@/utils/request'

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  CREATED = 'CREATED', // 已创建
  ACTIVE = 'ACTIVE', // 进行中
  COMPLETED = 'COMPLETED', // 已完成
  CANCELLED = 'CANCELLED', // 已取消
}

/**
 * 签到类型枚举
 */
export enum CheckInType {
  QR_CODE = 'QR_CODE', // 二维码签到
  LOCATION = 'LOCATION', // 位置签到
  GPS = 'GPS', // GPS签到
  MANUAL = 'MANUAL', // 手动签到
  WIFI = 'WIFI', // WIFI签到
  AUTOMATIC = 'AUTOMATIC', // 自动签到
}

/**
 * 任务详情
 */
export interface Task {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: TaskStatus
  locationRequirement: string
  checkInType: CheckInType
  createdAt: string
  updatedAt: string
  creatorId: string
  creatorName: string
}

/**
 * 创建任务参数
 */
export interface CreateTaskParams {
  title: string
  description: string
  startTime: string
  endTime: string
  locationRequirement: string
  checkInType: CheckInType
}

/**
 * 签到记录
 */
export interface CheckInRecord {
  id: string
  userId: string
  userName: string
  taskId: string
  taskTitle: string
  checkInTime: string
  checkInLocation: string
  checkOutTime: string | null
  checkOutLocation: string | null
  checkInType: string
  status: string
  ipAddress: string
  deviceInfo: string
  remark: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 创建签到任务（教师）
 */
export function createTask(params: CreateTaskParams) {
  return post<Task>('/api/tasks', params)
}

/**
 * 获取任务详情
 */
export function getTaskDetail(taskId: string) {
  return get<Task>('/api/tasks', { taskId })
}

/**
 * 获取我创建的任务列表（教师）
 */
export function getMyTasks() {
  return get<Task[]>('/api/tasks/my-tasks')
}

/**
 * 发起签到（教师）
 */
export function activateTask(taskId: string) {
  return put<Task>(`/api/tasks/activate?taskId=${taskId}`)
}

/**
 * 关闭签到（教师）
 */
export function completeTask(taskId: string) {
  return put<Task>(`/api/tasks/complete?taskId=${taskId}`)
}

/**
 * 获取活跃的签到任务（学生）
 */
export function getActiveTasks() {
  return get<Task[]>('/api/tasks/active')
}

/**
 * 学生签到
 */
export function studentCheckIn(
  taskId: string,
  checkInLocation: string,
  ipAddress: string,
  deviceInfo: string,
) {
  return post<CheckInRecord>(`/api/records/sign-in?taskId=${taskId}&checkInLocation=${encodeURIComponent(checkInLocation)}&ipAddress=${encodeURIComponent(ipAddress)}&deviceInfo=${encodeURIComponent(deviceInfo)}`)
}

/**
 * 获取签到记录（教师）
 */
export function getTaskRecords(taskId: string) {
  return get<CheckInRecord[]>('/api/records', { taskId })
}

/**
 * 获取签到统计（教师）
 */
export function getTaskStatistics(taskId: string) {
  return get('/api/records/statistics', { taskId })
}

/**
 * 获取学生签到记录
 * @param page 页码
 * @param limit 每页数量
 * @returns 签到记录列表
 */
export async function getStudentCheckInRecords(page = 1, limit = 10) {
  return get<{
    records: CheckInRecord[]
    total: number
  }>(`/api/records?page=${page}&limit=${limit}`)
}
