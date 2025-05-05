<!--
 * @Author: weisheng
 * @Date: 2025-04-07 13:15:00
 * @LastEditTime: 2025-04-07 13:15:00
 * @LastEditors: weisheng
 * @Description: 课程详情页面
 * @FilePath: \wot-demo\src\pages\course-detail\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, computed, reactive, onMounted, watch, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'
import { CheckInType, getCheckinList, deleteCheckin, getCheckinRecordList } from '@/api/attendance'
import { getCourseMemberList, getCourseQRCode, deleteCourse, removeCourseMember, getCourseDetail } from '@/api/courses'
import type { PageQueryParams } from '@/api/attendance'
import { onShow } from '@dcloudio/uni-app'
import { formatDateTime, formatDate } from '@/utils/dateTime'
import * as XLSX from 'xlsx'

// 腾讯地图API配置 - 与位置签到页面使用相同的Key
const QQ_MAP_KEY = 'G7VBZ-BF63Q-EEZ52-2XSLD-YYVA7-VJFB4' // 请替换为实际的key
const QQ_MAP_SECRET_KEY = 'Yb88cxWRzZ96IjO0Q3XYllP6C6oj40xc' // 请替换为实际的secretKey

// 为window.uni声明类型，解决TypeScript错误
declare global {
  interface Window {
    uni: typeof uni;
  }
}

const userStore = useUserStore()
const themeStore = useThemeStore()
const loading = ref(false)
const courseId = ref('')
const courseDetail = ref<any>({})
const checkinList = ref<any[]>([])
const activeTab = ref('checkins') // 默认显示签到任务标签页
const currentPage = ref(0)
const pageSize = ref(10)
const hasMoreData = ref(true)
const membersList = ref<any[]>([])
const attendanceStats = ref<any>(null)

// 添加二维码相关状态
const qrCodeUrl = ref('')
const showQRCode = ref(false)
const qrCodeLoading = ref(false)

// 添加操作相关状态
const showDeleteConfirm = ref(false)
const showOperations = ref(false)

// 用户角色相关计算属性
const isTeacher = computed(() => userStore.userInfo?.role === 'TEACHER')
const isStudent = computed(() => userStore.userInfo?.role === 'STUDENT')

// 添加删除状态
const isDeletingCourse = ref(false)

// 添加地址解析进度状态
const showAddressResolution = ref(false)
const addressResolutionProgress = ref(0)
const addressResolutionCount = ref(0)
const addressResolutionTotal = ref(0)

// 获取uni对象的安全包装器
function getSafeUni() {
  return uni as any
}

// 初始化
onMounted(() => {
  // 设置导航栏标题
  getSafeUni().setNavigationBarTitle({
    title: '课程详情'
  })

  // 应用当前主题到导航栏
  themeStore.updateSystemUITheme();
  
  // 从路由参数获取课程信息
  const query = getSafeUni().getLaunchOptionsSync().query || {}
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const options = (page as any)?.options || query || {}

  // 尝试解析路由中的课程和签到数据
  if (options.courseData) {
    try {
      const parsedData = JSON.parse(decodeURIComponent(options.courseData))
      // 设置课程信息
      courseDetail.value = parsedData.course
      courseId.value = parsedData.course.id

      // 设置签到数据
      if (parsedData.checkinData) {
        checkinList.value = parsedData.checkinData.items || []
      }

    } catch (e) {
      console.error('解析课程数据失败:', e)
      tryParseOldFormat(options)
    }
  } else {
    tryParseOldFormat(options)
  }
})

// 在页面每次显示时加载最新数据
onShow(() => {
  // 应用当前主题到导航栏
  themeStore.updateSystemUITheme();
  
  if (courseId.value) {
    // 立即加载所有数据，不等待标签页切换
    loadCheckinList(true)
    loadCourseMembers(true)
    loadCourseAttendanceStats()

    // 如果是教师，且二维码窗口正在显示，才加载二维码
    if (isTeacher.value && showQRCode.value) {
      loadCourseQRCode()
    }
  }
})

// 尝试解析旧格式的路由参数
function tryParseOldFormat(options) {
  // 尝试解析路由中的课程信息（旧格式）
  if (options.courseInfo) {
    try {
      const parsedInfo = JSON.parse(decodeURIComponent(options.courseInfo))
      courseDetail.value = parsedInfo
      courseId.value = parsedInfo.id

      // 加载所有数据
      loadCheckinList(true)
      loadCourseMembers(true)
      loadCourseAttendanceStats()

      // 如果是教师，自动获取课程二维码
      if (isTeacher.value) {
        loadCourseQRCode()
      }

    } catch (e) {
      console.error('解析课程信息失败:', e)
      // 显示错误并返回
      getSafeUni().showToast({
        title: '课程数据错误',
        icon: 'none'
      })
      setTimeout(() => {
        getSafeUni().navigateBack()
      }, 1500)
    }
  } else {
    // 显示错误并返回
    getSafeUni().showToast({
      title: '缺少课程数据',
      icon: 'none'
    })
    setTimeout(() => {
      getSafeUni().navigateBack()
    }, 1500)
  }
}

// 加载签到任务列表
async function loadCheckinList(refresh = false) {
  try {
    if (refresh) {
      currentPage.value = 0
      hasMoreData.value = true
      checkinList.value = []
    }

    if (!hasMoreData.value) return

    loading.value = true

    const response = await getCheckinList(courseId.value, {
      page: currentPage.value,
      size: pageSize.value,
      sort: [
        {
          field: "checkinStartTime",
          direction: "DESC"
        }
      ],
      filters: {}
    } as PageQueryParams)

    if (response && response.code === 200) {
      const newItems = response.data.items || []

      if (refresh) {
        checkinList.value = newItems
      } else {
        checkinList.value = [...checkinList.value, ...newItems]
      }

      hasMoreData.value = newItems.length === pageSize.value
      currentPage.value++
    }
  } catch (e) {
    console.error('获取签到任务列表失败:', e)
    getSafeUni().showToast({
      title: '获取签到列表失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 加载课程成员列表 - 修复返回数据结构判断逻辑
async function loadCourseMembers(showLoading: boolean = false) {
  try {
    if (showLoading) {
      loading.value = true
    }

    const params: PageQueryParams = {
      page: 0,
      size: 100,
      sort: [
        {
          field: "joinedAt",
          direction: "DESC"
        }
      ],
      filters: {}
    }

    const response = await getCourseMemberList(courseId.value, params)

    if (response && response.code === 200) {
      console.log('成员列表API响应:', response.data)

      // 修复数据结构判断逻辑，优先检查最常见的数据结构
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          // 直接是数组的情况
          membersList.value = response.data.map((user: any) => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName || user.username,
            role: user.role || 'STUDENT',
            joinTime: user.joinTime || new Date().toISOString(),
            avatarUrl: user.avatarUrl
          }))
        } else if (response.data.users && Array.isArray(response.data.users)) {
          // users 字段包含用户数组
          membersList.value = response.data.users.map((user: any) => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName || user.username,
            role: user.role || 'STUDENT',
            joinTime: user.joinTime || new Date().toISOString(),
            avatarUrl: user.avatarUrl
          }))
        } else if ((response.data as any).items && Array.isArray((response.data as any).items)) {
          // items 字段包含用户数组
          membersList.value = (response.data as any).items.map((user: any) => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName || user.username,
            role: user.role || 'STUDENT',
            joinTime: user.joinTime || new Date().toISOString(),
            avatarUrl: user.avatarUrl
          }))
        } else if ((response.data as any).list && Array.isArray((response.data as any).list)) {
          // list 字段包含用户数组
          membersList.value = (response.data as any).list.map((user: any) => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName || user.username,
            role: user.role || 'STUDENT',
            joinTime: user.joinTime || new Date().toISOString(),
            avatarUrl: user.avatarUrl
          }))
        } else {
          // 其他未知结构，尝试直接使用
          membersList.value = []
          console.warn('未知的成员列表数据结构:', response.data)
        }
      } else {
        membersList.value = []
      }

      console.log('成员列表加载成功，共' + membersList.value.length + '名成员:', membersList.value)

      // 成员加载后更新统计数据
      if (activeTab.value === 'stats') {
        loadCourseAttendanceStats()
      }
    } else {
      console.error('获取成员列表失败:', response)
      getSafeUni().showToast({
        title: '获取成员列表失败',
        icon: 'none'
      })
    }
  } catch (e) {
    console.error('获取成员列表异常:', e)
    getSafeUni().showToast({
      title: '获取成员列表失败',
      icon: 'none'
    })
  } finally {
    if (showLoading) {
      loading.value = false
    }
  }
}

// 加载课程签到统计
async function loadCourseAttendanceStats() {
  try {
    if (!courseId.value) {
      console.error('课程ID为空，无法加载考勤统计')
      return
    }

    loading.value = true

    // 从签到列表和成员列表中动态计算考勤统计数据
    if (checkinList.value.length > 0 && membersList.value.length > 0) {
      // 计算总签到任务数
      const totalCheckins = checkinList.value.length

      // 构造模拟的出勤数据
      // 实际项目中应该从API获取出勤记录来计算
      const studentUsers = membersList.value.filter(member => member.role !== 'TEACHER')
      const totalStudents = studentUsers.length

      // 为每个学生生成随机出勤数据（实际项目应该从API获取）
      const attendanceByStudent = studentUsers.map(student => {
        // 生成随机出勤率，范围在40%到100%之间
        const randomRate = Math.floor(Math.random() * 61) + 40
        // 计算签到和缺勤次数
        const checkedIn = Math.floor(totalCheckins * randomRate / 100)
        const missed = totalCheckins - checkedIn

        return {
          userId: student.id,
          userName: student.fullName || student.username,
          username: student.username,
          attendanceRate: randomRate,
          checkedIn,
          missed,
          role: student.role
        }
      })

      // 计算平均出勤率
      const averageAttendance = attendanceByStudent.length > 0
        ? attendanceByStudent.reduce((sum, student) => sum + student.attendanceRate, 0) / attendanceByStudent.length
        : 0

      // 生成统计数据
      attendanceStats.value = {
        courseInfo: {
          id: courseId.value,
          name: courseDetail.value.name,
          totalStudents
        },
        statistics: {
          totalCheckins,
          averageAttendance: parseFloat(averageAttendance.toFixed(1)),
          perfectAttendance: attendanceByStudent.filter(s => s.attendanceRate >= 90).length,
          lowAttendance: attendanceByStudent.filter(s => s.attendanceRate < 60).length
        },
        attendanceByStudent
      }

      console.log('考勤统计数据生成完成:', attendanceStats.value)
    } else {
      // 如果签到列表或成员列表为空，显示空状态
      attendanceStats.value = {
        courseInfo: {
          id: courseId.value,
          name: courseDetail.value.name,
          totalStudents: membersList.value.filter(m => m.role !== 'TEACHER').length
        },
        statistics: {
          totalCheckins: checkinList.value.length,
          averageAttendance: 0,
          perfectAttendance: 0,
          lowAttendance: 0
        },
        attendanceByStudent: []
      }
    }

    // 模拟数据加载延迟
    await new Promise(resolve => setTimeout(resolve, 300))

  } catch (e) {
    console.error('获取课程签到统计失败:', e)
    attendanceStats.value = null
  } finally {
    loading.value = false
  }
}

// 切换标签页
function switchTab(tab: 'checkins' | 'members') {
  activeTab.value = tab
  
  // 当切换到成员标签并且尚未加载数据时自动加载
  if (tab === 'members' && membersList.value.length === 0) {
    loadCourseMembers()
  }
}

// 获取签到类型显示文本
function getCheckinTypeText(type: CheckInType) {
  switch (type) {
    case CheckInType.QR_CODE:
      return '二维码签到'
    case CheckInType.LOCATION:
      return '位置签到'
    case CheckInType.WIFI:
      return 'WiFi签到'
    default:
      return '未知类型'
  }
}

// 添加兼容iOS的日期解析函数
function parseDateSafely(dateString: string): Date {
  if (!dateString) return new Date();

  try {
    // 检查是否为兼容格式 (ISO格式或包含T的标准格式)
    if (dateString.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return new Date(dateString);
    }

    // 尝试转换 "yyyy-MM-dd HH:mm:ss" 格式为 "yyyy/MM/dd HH:mm:ss" (iOS兼容格式)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
      return new Date(dateString.replace(/-/g, '/'));
    }

    // 尝试解析为ISO格式 "yyyy-MM-ddTHH:mm:ss"
    const parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (parts) {
      return new Date(`${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:${parts[6]}`);
    }

    // 最后尝试直接使用Date构造函数
    return new Date(dateString);
  } catch (e) {
    console.error('日期解析失败:', dateString, e);
    // 返回当前时间作为fallback
    return new Date();
  }
}

// 修改计算签到状态的函数，使用安全的日期解析
function getCheckinStatus(checkin: any) {
  if (!checkin) return '';

  const now = new Date().getTime();

  // 使用安全的日期解析函数
  const startTime = parseDateSafely(checkin.startTime).getTime();
  const endTime = parseDateSafely(checkin.endTime).getTime();

  if (now < startTime) {
    return 'not-started';
  } else if (now > endTime) {
    return 'ended';
  } else {
    return 'in-progress';
  }
}

// 导航到创建签到页面
function navigateToCreateCheckin() {
  getSafeUni().navigateTo({
    url: `/pages/create-checkin/index?courseId=${courseId.value}`
  })
}

// 导航到签到详情页面
function navigateToCheckinDetail(checkinId) {
  // 确保参数存在
  if (!checkinId) {
    getSafeUni().showToast({
      title: '缺少签到ID',
      icon: 'none',
      duration: 1500
    })
    return
  }

  console.log('正在跳转到二维码页面，签到ID:', checkinId)

  // 将参数添加到URL中
  getSafeUni().navigateTo({
    url: `/pages/checkin-qrcode/index?checkinId=${encodeURIComponent(checkinId)}`,
    fail: (err) => {
      console.error('跳转失败:', err)
      getSafeUni().showToast({
        title: '页面跳转失败',
        icon: 'none',
        duration: 1500
      })
    }
  })
}

// 导航到课程统计页面
function navigateToCourseStatistics() {
  getSafeUni().navigateTo({
    url: `/pages/course-statistics/index?courseId=${courseId.value}`
  })
}

// 复制课程码
function copyCourseCode() {
  if (!courseDetail.value.code) {
    getSafeUni().showToast({
      title: '课程码不存在',
      icon: 'none'
    })
    return
  }

  getSafeUni().setClipboardData({
    data: courseDetail.value.code,
    success: () => {
      getSafeUni().showToast({
        title: '课程码已复制',
        icon: 'success'
      })
    }
  })
}

// 返回上一页
function goBack() {
  getSafeUni().navigateBack()
}

// 获取排序后的学生列表（按出勤率从高到低）
function getSortedStudents() {
  if (!attendanceStats.value || !attendanceStats.value.attendanceByStudent) {
    return []
  }

  // 过滤出学生（非教师），并按出勤率降序排序
  return [...attendanceStats.value.attendanceByStudent]
    .filter(student => !student.role || student.role !== 'TEACHER')
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
}

// 获取出勤率类
function getAttendanceRateClass(attendanceRate: number) {
  if (attendanceRate >= 90) {
    return 'excellent'
  } else if (attendanceRate < 60) {
    return 'warning'
  } else {
    return 'normal'
  }
}

// 添加获取课程二维码的函数 - 修复二维码渲染问题
async function loadCourseQRCode() {
  if (!courseId.value || !isTeacher.value) return
  try {
    // 显示加载状态并清除之前的URL
    qrCodeLoading.value = true
    qrCodeUrl.value = '' // 清空之前的URL
    const response = await getCourseQRCode(courseId.value)
    if (typeof response === 'string') qrCodeUrl.value = response
    else if(response instanceof ArrayBuffer) qrCodeUrl.value = `data:image/png;base64,${uni.arrayBufferToBase64(response)}`
    else qrCodeUrl.value = `data:image/png;base64,${response}` 
  } catch (e) {
    console.error('Base64转换失败:', e)
    throw new Error('二维码数据转换失败')
  }
  console.log('二维码加载完成', qrCodeUrl.value)
  qrCodeLoading.value = false;
}

// 显示二维码弹窗
function openQRCodeModal() {
  showQRCode.value = true
  // 打开弹窗时自动加载二维码
  // 先重置状态
  qrCodeUrl.value = ''
  qrCodeLoading.value = false
  // 延迟一小段时间再加载，以确保弹窗已完全打开
  setTimeout(() => {
    console.log('弹窗已打开，开始加载二维码')
    loadCourseQRCode()
  }, 100)
}

// 关闭二维码弹窗
function closeQRCodeModal() {
  showQRCode.value = false

  // 清除二维码状态，延迟执行以等待弹窗关闭动画完成
  setTimeout(() => {
    qrCodeUrl.value = ''
    qrCodeLoading.value = false
  }, 300)
}

// 处理签到列表项点击
function handleCheckinClick(checkin: any) {
  console.log('点击签到项:', {
    id: checkin.id,
    name: checkin.name,
    type: checkin.checkinType,
    status: checkin.status
  })

  if (checkin.checkinType === 'QR_CODE') {
    // 检查用户角色，学生不能查看二维码签到详情
    if (userStore.role === 'STUDENT') {
      console.log('学生不能查看二维码签到详情')
      uni.showToast({
        title: '学生不能查看二维码签到详情',
        icon: 'none'
      })
      return
    }

    console.log('跳转到二维码签到页面，签到ID:', checkin.id)
    uni.navigateTo({
      url: `/pages/checkin-qrcode/index?checkinId=${checkin.id}`,
      success: () => {
        console.log('成功跳转到二维码签到页面')
      },
      fail: (err) => {
        console.error('跳转到二维码签到页面失败:', err)
      }
    })
  } else if (checkin.checkinType === 'LOCATION') {
    // 检查用户角色，教师不能进行位置签到
    if (userStore.role === 'TEACHER') {
      console.log('教师不能进行位置签到')
      uni.showToast({
        title: '教师不能进行位置签到',
        icon: 'none'
      })
      return
    }

    // 直接跳转到位置签到页面，不预先获取位置
    uni.navigateTo({
      url: `/pages/location-checkin/index?checkinId=${checkin.id}`,
      success: () => {
        console.log('成功跳转到位置签到页面')
      },
      fail: (err) => {
        console.error('跳转到位置签到页面失败:', err)
      }
    })
  } else {
    console.error('不支持的签到类型:', checkin.checkinType)
    uni.showToast({
      title: '不支持的签到类型',
      icon: 'none'
    })
  }
}

// 添加Watch监听成员和签到列表变化时自动更新统计
watch([membersList, checkinList], () => {
  // 仅当统计标签页激活时自动刷新
  if (activeTab.value === 'stats' && isTeacher.value) {
    loadCourseAttendanceStats()
  }
})

// 删除课程
function handleDeleteCourse() {
  // 设置删除状态
  isDeletingCourse.value = true

  getSafeUni().showModal({
    title: '提示',
    content: '确定要删除该课程吗？此操作不可恢复！',
    confirmColor: '#f56c6c',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteCourse(courseId.value)
          getSafeUni().showToast({
            title: '课程已删除',
            icon: 'success'
          })
          setTimeout(() => {
            getSafeUni().navigateBack()
          }, 1500)
        } catch (error) {
          console.error('删除课程失败:', error)
          getSafeUni().showToast({
            title: '删除失败，请重试',
            icon: 'none'
          })
        }
      }
      // 无论成功失败，操作完成后重置状态
      isDeletingCourse.value = false
    }
  })
}

// 删除签到任务
function handleDeleteCheckin(checkin) {
  getSafeUni().showModal({
    title: '提示',
    content: '确定要删除该签到任务吗？',
    confirmColor: '#f56c6c',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteCheckin(checkin.id)
          getSafeUni().showToast({
            title: '签到任务已删除',
            icon: 'success'
          })
          // 重新加载签到列表
          loadCheckinList(true)
        } catch (error) {
          console.error('删除签到任务失败:', error)
          getSafeUni().showToast({
            title: '删除失败，请重试',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 移除课程成员
function handleRemoveMember(member) {
  getSafeUni().showModal({
    title: '提示',
    content: '确定要移除该成员吗？',
    confirmColor: '#f56c6c',
    editable: true,
    placeholderText: '请输入移除原因(可选)',
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeCourseMember(courseId.value, member.id, res.content)
          getSafeUni().showToast({
            title: '成员已移除',
            icon: 'success'
          })
          // 重新加载成员列表
          loadCourseMembers(true)
        } catch (error) {
          console.error('移除成员失败:', error)
          getSafeUni().showToast({
            title: '移除失败，请重试',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 添加操作处理函数
function handleOpenDeleteConfirm() {
  showOperations.value = false
  showDeleteConfirm.value = true
}

function handleOpenQRCode() {
  showOperations.value = false
  openQRCodeModal()
}

// 修改handleExportData函数，添加引导提示
async function handleExportData() {
  try {
    // 关闭操作菜单（如果打开的话）
    showOperations.value = false
    
    console.log('点击了统计页面的导出按钮，显示引导提示')
    
    // 显示提示，引导用户使用签到任务列表中的导出功能
    getSafeUni().showModal({
      title: '导出考勤数据',
      content: '请前往"签到任务"标签页，在具体的签到任务卡片上使用导出按钮，可以导出该任务的考勤统计数据。',
      showCancel: false,
      confirmText: '我知道了',
      success: () => {
        // 自动切换到签到任务标签
        switchTab('checkins')
      }
    })
  } catch (error) {
    console.error('处理导出引导提示异常:', error)
  }
}

// 导出签到任务数据到Excel
async function exportAttendanceToExcel(checkinTask) {
  try {
    // 显示状态提示
    getSafeUni().showLoading({
      title: '准备导出数据...'
    })
    
    console.log('开始导出签到数据, 任务:', { id: checkinTask.id, name: checkinTask.name })
    
    // 使用getTaskAttendanceRecords函数获取签到记录
    console.log('调用getTaskAttendanceRecords获取数据')
    const result = await getTaskAttendanceRecords(checkinTask.id)
    
    if (!result.success) {
      console.error('获取签到数据失败:', result.error)
      getSafeUni().hideLoading()
      getSafeUni().showToast({
        title: result.error || '获取签到数据失败',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    const data = result.data
    console.log('获取到签到数据:', data)
    const records = data.records || []
    const checkinInfo = data.checkinInfo || {}
    const statistics = data.statistics || {}
    
    // 修改判断逻辑：只有在没有记录且没有学生统计信息时才提示无可导出数据
    if (records.length === 0 && (!statistics || !statistics.totalStudents || statistics.totalStudents === 0)) {
      console.log('无可导出的签到记录')
      getSafeUni().hideLoading()
      getSafeUni().showToast({
        title: '没有可导出的签到记录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 显示地址解析进度弹窗
    const addressModal = {
      show: ref(true),
      progress: ref(0),
      total: ref(0),
      isComplete: ref(false)
    }
    
    // 打开地址解析进度弹窗
    getSafeUni().showModal({
      title: '地址解析',
      content: '是否解析GPS坐标为详细地址？这将使导出时间延长。',
      success: async (res) => {
        if (res.confirm) {
          // 用户确认解析地址
          try {
            // 使用自定义UI组件显示进度
            const recordsWithAddress = await startAddressResolution(records)
            
            // 继续导出Excel流程，使用解析后的记录
            continueExportProcess(recordsWithAddress, checkinInfo, statistics, checkinTask)
          } catch (e) {
            console.error('地址解析过程中发生错误:', e)
            // 使用原始记录继续导出
            continueExportProcess(records, checkinInfo, statistics, checkinTask)
          }
        } else {
          // 用户取消，使用原始记录继续导出
          continueExportProcess(records, checkinInfo, statistics, checkinTask)
        }
      }
    })
  } catch (error) {
    console.error('导出Excel失败:', error)
    getSafeUni().hideLoading()
    getSafeUni().showToast({
      title: '导出失败: ' + ((error as Error)?.message || '未知错误'),
      icon: 'none',
      duration: 3000
    })
  }
}

// 继续Excel导出流程
async function continueExportProcess(records, checkinInfo, statistics, checkinTask) {
  try {
    // 准备Excel数据
    console.log('开始生成Excel文件')
    getSafeUni().showLoading({
      title: '生成Excel文件...'
    })
    
    // 创建签到信息工作表
    const infoWs = XLSX.utils.aoa_to_sheet([
      ['签到任务信息'], // 标题
      ['任务名称', checkinInfo.name || checkinTask.name || ''],
      ['描述', checkinInfo.description || ''],
      ['开始时间', formatDateTime(checkinInfo.checkinStartTime || checkinTask.checkinStartTime || '')],
      ['结束时间', formatDateTime(checkinInfo.checkinEndTime || checkinTask.checkinEndTime || '')],
      ['签到类型', formatCheckinType(checkinInfo.checkinType || checkinTask.checkinType || '')],
      ['任务状态', formatStatus(checkinInfo.status || checkinTask.status || '')],
      ['创建时间', formatDateTime(checkinInfo.createdAt || '')],
      ['', ''], // 空行
      ['统计数据'], // 统计数据标题
      ['学生总数', statistics.totalStudents || 0],
      ['出勤人数', statistics.presentCount || 0],
      ['缺勤人数', statistics.absentCount || 0],
      ['迟到人数', statistics.lateCount || 0],
      ['出勤率', `${statistics.attendanceRate || 0}%`]
    ])
    
    // 设置合并单元格 - 标题行
    infoWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // 签到任务信息标题
      { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } }  // 统计数据标题
    ]
    
    // 设置列宽
    infoWs['!cols'] = [
      { wch: 15 }, // 标题列
      { wch: 40 }  // 内容列
    ]
    
    // 创建表格标题行
    const detailHeaders = [
      'ID', '姓名', '用户名', '签到状态', '签到时间', '设备信息', '位置'
    ]
    
    // 创建详细记录工作表 - 即使没有记录也创建表格
    let detailData: Array<string[]> = []
    
    if (records.length > 0) {
      // 有记录时，转换数据为表格行
      const detailRows = records.map(record => [
        record.userId || '',
        record.fullName || '',
        record.username || '',
        formatAttendanceStatus(record.status),
        record.checkInTime ? formatDateTime(record.checkInTime) : '未签到',
        record.device || '',
        record.location || ''
      ])
      
      // 添加表头
      detailData = [detailHeaders, ...detailRows]
    } else {
      // 没有记录时，只添加表头和提示行
      detailData = [
        detailHeaders,
        ['', '', '', '无签到记录', '', '', '']
      ]
    }
    
    // 创建详细记录工作表
    const detailWs = XLSX.utils.aoa_to_sheet(detailData)
    
    // 设置列宽 - 增加位置列宽度，以容纳更多地址信息
    detailWs['!cols'] = [
      { wch: 15 }, // ID
      { wch: 10 }, // 姓名
      { wch: 15 }, // 用户名
      { wch: 10 }, // 签到状态
      { wch: 20 }, // 签到时间
      { wch: 25 }, // 设备信息
      { wch: 45 }  // 位置 - 增加宽度
    ]
    
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, infoWs, '签到信息')
    XLSX.utils.book_append_sheet(wb, detailWs, '签到记录')
    
    // 如果有缺勤学生，添加缺勤学生表
    if (statistics.absentStudents && statistics.absentStudents.length > 0) {
      const absentHeaders = ['ID', '姓名', '用户名']
      const absentRows = statistics.absentStudents.map(student => [
        student.userId || '',
        student.fullName || '',
        student.username || ''
      ])
      
      const absentWs = XLSX.utils.aoa_to_sheet([absentHeaders, ...absentRows])
      
      // 设置列宽
      absentWs['!cols'] = [
        { wch: 15 }, // ID
        { wch: 10 }, // 姓名
        { wch: 15 }  // 用户名
      ]
      
      // 添加缺勤学生表
      XLSX.utils.book_append_sheet(wb, absentWs, '缺勤学生')
    }
    
    // 生成Excel文件
    const excelFileName = `${checkinInfo.name || checkinTask.name || '签到'}_${formatDate(new Date())}.xlsx`
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    
    // 改进文件保存逻辑，兼容多平台
    try {
      // 判断平台
      // #ifdef H5
      // 在H5端，使用文件页面实现下载
      createAndDownloadExcelInH5(excelFileName, wbout)
      
      getSafeUni().hideLoading()
      getSafeUni().showToast({
        title: 'Excel导出成功',
        icon: 'success'
      })
      // #endif
      
      // #ifdef MP-WEIXIN || MP
      // 在小程序中使用文件系统API
      console.log('微信小程序环境，准备使用文件系统API')
      const mpFs = uni.getFileSystemManager()
      const filePath = `${getSafeUni().env.USER_DATA_PATH}/${excelFileName}`
      
      console.log('准备写入文件:', filePath)
      mpFs.writeFile({
        filePath: filePath,
        data: wbout,
        encoding: 'base64',
        success: function(writeRes) {
          console.log('文件写入成功:', writeRes)
          getSafeUni().hideLoading()
          getSafeUni().showToast({
            title: 'Excel生成成功',
            icon: 'success'
          })
          
          console.log('准备保存文件到本地')
          // 使用推荐的getFileSystemManager().saveFile方法
          mpFs.saveFile({
            tempFilePath: filePath,
            success: function(res) {
              const savedFilePath = res.savedFilePath
              console.log('文件保存成功:', savedFilePath)
              getSafeUni().showModal({
                title: '文件已保存',
                content: `文件已保存至本地，可在"文件管理"中查看`,
                showCancel: false
              })
            },
            fail: function(err) {
              console.error('保存文件失败:', err)
              
              // 保存失败时，尝试直接打开文件
              getSafeUni().showModal({
                title: '文件已生成',
                content: '文件已生成但无法自动保存，您可以点击"确定"尝试直接打开',
                success: function(res) {
                  if (res.confirm) {
                    // 尝试打开文件
                    getSafeUni().openDocument({
                      filePath: filePath,
                      showMenu: true,
                      success: function() {
                        console.log('打开文档成功')
                      },
                      fail: function(openErr) {
                        console.error('打开文档失败:', openErr)
                        getSafeUni().showToast({
                          title: '无法打开文件',
                          icon: 'none'
                        })
                      }
                    })
                  }
                }
              })
            }
          })
        },
        fail: function(err) {
          console.error('写入文件失败:', err)
          getSafeUni().hideLoading()
          getSafeUni().showToast({
            title: '生成Excel文件失败: ' + (err.errMsg || '未知错误'),
            icon: 'none',
            duration: 3000
          })
        }
      })
      // #endif
      
      // #ifdef APP-PLUS
      // 在APP中使用plus API
      const appFilePath = `_doc/${excelFileName}`
      
      // 写入文件 - 使用更简单的方式
      try {
        const tempFilePath = `${plus.io.convertLocalFileSystemURL('_www')}/${excelFileName}`
        let dtask = plus.downloader.createDownload(
          'data:application/octet-stream;base64,' + wbout,
          { filename: tempFilePath },
          function(d, status) {
            if (status === 200) {
              getSafeUni().hideLoading()
              getSafeUni().showToast({
                title: 'Excel生成成功',
                icon: 'success'
              })
              
              // 打开文件
              plus.runtime.openFile(tempFilePath)
            } else {
              getSafeUni().hideLoading()
              getSafeUni().showToast({
                title: '生成Excel文件失败',
                icon: 'none'
              })
            }
          }
        )
        dtask.start()
      } catch (e) {
        console.error('APP平台保存文件失败:', e)
        getSafeUni().hideLoading()
        getSafeUni().showToast({
          title: '生成Excel文件失败',
          icon: 'none'
        })
      }
      // #endif
      
      // 其他平台的通用处理
      // #ifndef H5 || MP-WEIXIN || MP || APP-PLUS
      getSafeUni().hideLoading()
      getSafeUni().showToast({
        title: 'Excel生成成功，但当前平台不支持自动保存',
        icon: 'none',
        duration: 3000
      })
      // #endif
    } catch (error) {
      console.error('保存Excel文件失败:', error)
      getSafeUni().hideLoading()
      getSafeUni().showToast({
        title: '生成Excel文件失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('导出Excel失败:', error)
    getSafeUni().hideLoading()
    getSafeUni().showToast({
      title: '导出失败: ' + ((error as Error)?.message || '未知错误'),
      icon: 'none',
      duration: 3000
    })
  }
}

function confirmDeleteCourse() {
  showDeleteConfirm.value = false
  deleteCourse(courseId.value).then(() => {
    getSafeUni().showToast({
      title: '课程已删除',
      icon: 'success'
    })
    setTimeout(() => {
      getSafeUni().navigateBack()
    }, 1500)
  }).catch(error => {
    console.error('删除课程失败:', error)
    getSafeUni().showToast({
      title: '删除失败，请重试',
      icon: 'none'
    })
  })
}

// 格式化考勤状态文本
function formatAttendanceStatus(status) {
  switch (status) {
    case 'PRESENT':
    case 'NORMAL':
      return '已签到'
    case 'LATE':
      return '迟到'
    case 'ABSENT':
      return '缺勤'
    default:
      return status || '未知'
  }
}

// 获取特定签到任务的所有学生签到记录
async function getTaskAttendanceRecords(checkinId) {
  try {
    // 显示加载状态
    getSafeUni().showLoading({
      title: '获取数据中...'
    })
    
    console.log('开始获取签到记录，签到ID:', checkinId)
    
    if (!checkinId) {
      console.error('签到ID为空，无法获取记录')
      getSafeUni().hideLoading()
      return {
        success: false,
        error: '签到ID为空，无法获取记录'
      }
    }
    
    // 获取全部记录，设置较大的size
    console.log('调用API：getCheckinRecordList，参数:', { checkinId, page: 0, size: 100 })
    const response = await getCheckinRecordList(checkinId, { page: 0, size: 100 })
    console.log('API响应:', response)
    
    if (response && response.code === 200) {
      console.log('获取签到记录成功，数据:', response.data)
      return {
        success: true,
        data: response.data
      }
    } else {
      console.error('获取签到记录失败，响应:', response)
      return {
        success: false,
        error: response?.message || '获取签到记录失败'
      }
    }
  } catch (error) {
    console.error('获取签到记录异常:', error)
    return {
      success: false,
      error: (error as Error)?.message || '获取签到记录异常'
    }
  } finally {
    getSafeUni().hideLoading()
  }
}

// 格式化签到类型显示文本
function formatCheckinType(type) {
  switch (type) {
    case 'QR_CODE':
      return '二维码签到'
    case 'LOCATION':
      return '位置签到'
    case 'WIFI':
      return 'WiFi签到'
    case 'MANUAL':
      return '手动签到'
    default:
      return type || '未知'
  }
}

// 格式化状态显示文本
function formatStatus(status) {
  switch (status) {
    case 'ACTIVE':
      return '进行中'
    case 'ENDED':
      return '已结束'
    case 'CANCELLED':
      return '已取消'
    case 'COMPLETED':
      return '已完成'
    default:
      return status || '未知'
  }
}

// H5平台 - 创建临时文件页面并下载
function createAndDownloadExcelInH5(fileName, base64Data) {
  // 创建二进制数据
  const binary = atob(base64Data)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i) & 0xFF
  }
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  // 创建下载链接
  const url = URL.createObjectURL(blob)
  
  // 创建临时页面元素
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.zIndex = '9999'
  container.style.background = 'rgba(255,255,255,0.9)'
  container.style.display = 'flex'
  container.style.flexDirection = 'column'
  container.style.justifyContent = 'center'
  container.style.alignItems = 'center'
  container.style.padding = '20px'
  
  // 添加标题
  const title = document.createElement('h2')
  title.textContent = '考勤统计导出'
  title.style.marginBottom = '20px'
  container.appendChild(title)
  
  // 添加说明
  const description = document.createElement('p')
  description.textContent = '您的Excel文件已准备就绪，点击下面的按钮下载。'
  description.style.marginBottom = '30px'
  description.style.textAlign = 'center'
  container.appendChild(description)
  
  // 添加按钮组
  const buttonContainer = document.createElement('div')
  buttonContainer.style.display = 'flex'
  buttonContainer.style.gap = '10px'
  
  // 下载按钮
  const downloadBtn = document.createElement('a')
  downloadBtn.href = url
  downloadBtn.download = fileName
  downloadBtn.style.padding = '10px 20px'
  downloadBtn.style.background = '#4caf50'
  downloadBtn.style.color = 'white'
  downloadBtn.style.textDecoration = 'none'
  downloadBtn.style.borderRadius = '4px'
  downloadBtn.style.fontWeight = 'bold'
  downloadBtn.textContent = '下载Excel文件'
  buttonContainer.appendChild(downloadBtn)
  
  // 关闭按钮
  const closeBtn = document.createElement('button')
  closeBtn.style.padding = '10px 20px'
  closeBtn.style.background = '#f44336'
  closeBtn.style.color = 'white'
  closeBtn.style.border = 'none'
  closeBtn.style.borderRadius = '4px'
  closeBtn.style.fontWeight = 'bold'
  closeBtn.style.cursor = 'pointer'
  closeBtn.textContent = '关闭'
  closeBtn.onclick = () => {
    document.body.removeChild(container)
    URL.revokeObjectURL(url)
  }
  buttonContainer.appendChild(closeBtn)
  
  container.appendChild(buttonContainer)
  
  // 添加到页面
  document.body.appendChild(container)
  
  // 自动下载
  setTimeout(() => {
    downloadBtn.click()
  }, 500)
}

// 处理单个签到任务的导出
async function handleExportSingleCheckin(checkinTask) {
  try {
    console.log('开始导出单个签到任务:', { id: checkinTask.id, name: checkinTask.name })
    // 显示状态提示
    getSafeUni().showLoading({
      title: '准备导出数据...'
    })
    
    // 直接调用导出函数
    await exportAttendanceToExcel(checkinTask)
  } catch (error) {
    console.error('导出单个签到任务异常:', error)
    getSafeUni().hideLoading()
    getSafeUni().showToast({
      title: '导出操作异常: ' + ((error as Error)?.message || '未知错误'),
      icon: 'none',
      duration: 3000
    })
  }
}

// 页面初始化
onLoad((options) => {
  // 从路由参数获取课程ID
  if (options && options.id) {
    courseId.value = options.id
    // 加载课程详情
    getCourseDetail(courseId.value)
    // 加载签到任务列表
    loadCheckinList()
    // 加载成员列表
    loadCourseMembers()
  }
  
  // 设置导航栏标题
  getSafeUni().setNavigationBarTitle({
    title: '课程详情'
  })
  
  // 应用当前主题到页面和导航栏
  themeStore.updateSystemUITheme()
})

// 根据坐标获取地址信息
async function getAddressByCoordinates(latitude: number, longitude: number): Promise<string> {
  try {
    console.log(`开始解析坐标: ${latitude},${longitude}`)
    
    // 构建参数
    const params: Record<string, string> = {
      key: QQ_MAP_KEY,
      location: `${latitude},${longitude}`,
      output: 'json'
    }
    
    // 计算签名
    const sig = calculateMapSignature(params, QQ_MAP_SECRET_KEY)
    
    // 构建请求URL
    let requestUrl = 'https://apis.map.qq.com/ws/geocoder/v1?'
    for (const key of Object.keys(params)) {
      requestUrl += `${key}=${encodeURIComponent(params[key])}&`
    }
    requestUrl += `sig=${sig}`
    
    // 发送请求
    return new Promise((resolve, reject) => {
      uni.request({
        url: requestUrl,
        success: (res: any) => {
          if (res.statusCode === 200 && res.data && res.data.status === 0 && res.data.result) {
            const address = res.data.result.address || '未知地址'
            console.log(`解析成功: ${address}`)
            resolve(address)
          } else {
            console.error('地址解析失败:', res.data)
            // 返回原始坐标
            resolve(`${latitude},${longitude}(解析失败)`)
          }
        },
        fail: (err) => {
          console.error('地址请求失败:', err)
          // 返回原始坐标
          resolve(`${latitude},${longitude}(请求失败)`)
        }
      })
    })
  } catch (e) {
    console.error('地址解析异常:', e)
    // 返回原始坐标
    return `${latitude},${longitude}(解析异常)`
  }
}

// 批量解析多个坐标
async function batchResolveAddresses(records: any[], updateProgress?: (progress: number, total: number) => void): Promise<any[]> {
  const total = records.length
  const result = [...records]
  let resolvedCount = 0
  
  // 存储需要解析的记录索引和坐标
  const coordinatesToResolve: { index: number, lat: number, lng: number }[] = []
  
  // 找出所有包含坐标的记录
  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    const location = record.location || ''
    
    // 检查是否包含坐标信息 (格式如: "30.123,114.456,其他信息")
    const match = location.match(/^([\d.]+),([\d.]+)/)
    if (match) {
      const [, lat, lng] = match
      coordinatesToResolve.push({
        index: i,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      })
    }
  }
  
  console.log(`找到${coordinatesToResolve.length}条需要解析的坐标`)
  
  // 如果没有需要解析的坐标，直接返回
  if (coordinatesToResolve.length === 0) {
    return result
  }
  
  // 批量解析坐标
  for (const item of coordinatesToResolve) {
    try {
      // 解析地址
      const address = await getAddressByCoordinates(item.lat, item.lng)
      
      // 更新记录中的位置信息，保留原始坐标
      const originalLocation = result[item.index].location
      result[item.index].location = `${address} [${originalLocation}]`
      
      // 更新进度
      resolvedCount++
      if (updateProgress) {
        updateProgress(resolvedCount, coordinatesToResolve.length)
      }
      
      // 添加适当延迟，避免API请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (e) {
      console.error(`解析第${item.index}条记录坐标失败:`, e)
    }
  }
  
  return result
}

// 计算腾讯地图API签名
function calculateMapSignature(params: Record<string, string>, secretKey: string): string {
  // 1. 对请求参数按键名升序排序
  const sortedKeys = Object.keys(params).sort()
  
  // 2. 构建请求字符串 - 不进行URL编码
  let queryString = ''
  for (const key of sortedKeys) {
    queryString += `${key}=${params[key]}&`
  }
  queryString = queryString.slice(0, -1) // 移除末尾的&

  // 3. 拼接路径、参数和密钥
  const signStr = `/ws/geocoder/v1?${queryString}${secretKey}`
  
  // 4. 计算MD5并转换为小写
  return md5(signStr).toLowerCase()
}

// MD5函数实现
function md5(str: string): string {
  function rotateLeft(lValue: number, iShiftBits: number): number {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX: number, lY: number): number {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }

  function F(x: number, y: number, z: number): number {
    return (x & y) | ((~x) & z);
  }

  function G(x: number, y: number, z: number): number {
    return (x & z) | (y & (~z));
  }

  function H(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }

  function I(x: number, y: number, z: number): number {
    return y ^ (x | (~z));
  }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] || 0) | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = (lWordArray[lWordCount] || 0) | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    
    return lWordArray;
  }

  function wordToHex(lValue: number): string {
    let WordToHexValue = '';
    let WordToHexValue_temp = '';
    let lByte;
    
    for (let lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = '0' + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    
    return WordToHexValue;
  }

  let x = convertToWordArray(str);
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;
  let S11 = 7;
  let S12 = 12;
  let S13 = 17;
  let S14 = 22;
  let S21 = 5;
  let S22 = 9;
  let S23 = 14;
  let S24 = 20;
  let S31 = 4;
  let S32 = 11;
  let S33 = 16;
  let S34 = 23;
  let S41 = 6;
  let S42 = 10;
  let S43 = 15;
  let S44 = 21;
  let k = 0;
  
  while (k < x.length) {
    let AA = a;
    let BB = b;
    let CC = c;
    let DD = d;
    
    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);

    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);

    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);

    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
    
    k += 16;
  }
  
  const result = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  return result.toLowerCase();
}

// 修改updateProgress函数，使用UI组件显示进度
function updateAddressResolutionProgress(current, total) {
  addressResolutionCount.value = current
  addressResolutionTotal.value = total
  addressResolutionProgress.value = Math.round((current / total) * 100)
}

// 修改batchResolveAddresses调用
async function startAddressResolution(records) {
  try {
    // 显示进度UI
    showAddressResolution.value = true
    addressResolutionCount.value = 0
    addressResolutionTotal.value = 0
    addressResolutionProgress.value = 0
    
    // 批量解析地址
    const recordsWithAddress = await batchResolveAddresses(records, updateAddressResolutionProgress)
    
    // 隐藏进度UI
    showAddressResolution.value = false
    
    return recordsWithAddress
  } catch (e) {
    console.error('地址解析过程中发生错误:', e)
    showAddressResolution.value = false
    return records // 出错时返回原始记录
  }
}

// 格式化签到时间
function formatCheckinTime(startTime, endTime) {
  if (!startTime) return '未设置时间'

  // 格式化开始时间
  const start = formatDateTimeSimple(startTime)
  
  // 如果没有结束时间，只显示开始时间
  if (!endTime) return `${start} 开始`
  
  // 格式化结束时间
  const end = formatDateTimeSimple(endTime)
  return `${start} ~ ${end}`
}

// 添加简化的日期时间格式化函数
function formatDateTimeSimple(dateStr) {
  if (!dateStr) return '';
  
  try {
    // 将字符串解析为日期对象
    const date = parseDateSafely(dateStr);
    
    // 提取时间部分 - 只显示小时和分钟
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // 提取日期 - 只显示月和日
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // 组合显示
    return `${month}-${day} ${hours}:${minutes}`;
  } catch (e) {
    console.error('格式化日期时间失败:', e);
    return dateStr;
  }
}

// 格式化签到状态
function formatCheckinStatus(status) {
  switch (status) {
    case 'NOT_STARTED':
      return '未开始'
    case 'ACTIVE':
      return '进行中'
    case 'COMPLETED':
      return '已结束'
    default:
      return '未知状态'
  }
}

// 获取签到类型图标
function getCheckinTypeIcon(type) {
  switch (type) {
    case 'QR_CODE':
      return 'scan'
    case 'LOCATION':
      return 'location'
    case 'PASSWORD':
      return 'lock'
    default:
      return 'time'
  }
}

// 处理查看签到详情
function handleViewCheckin(checkin) {
  // 原来的handleCheckinClick方法的实现...
  if (checkin) {
    navigateToCheckinDetail(checkin)
  }
}

// 处理头像加载错误
function handleAvatarError(e) {
  // 当头像加载失败时，设置为默认头像
  e.target.src = 'static/default-avatar.png'
}
</script>

<template>
  <view class="container" :class="{'wot-theme-dark': themeStore.isDarkMode}">
    <!-- 加载中 -->
    <!-- @ts-ignore -->
    <view v-if="loading" class="loading-container">
      <wd-loading color="#ff6b00" size="80rpx" />
      <text>加载课程信息中...</text>
    </view>

    <!-- 主要内容 -->
    <!-- @ts-ignore -->
    <view v-else class="content-container">
      <!-- 课程信息卡片 -->
      <wd-card 
        title="课程详情" 
        custom-class="course-card" 
        custom-style="margin: 0 0 20rpx 0;"
      >
        <template #default>
          <!-- 课程基本信息 -->
          <view class="course-info">
            <!-- 教师信息 -->
            <view class="info-item">
              <wd-icon name="user" size="32rpx" color="#ff6b00" />
              <text class="info-label">教师</text>
              <text class="info-value">{{ courseDetail.creatorFullName || courseDetail.creatorUsername || '未知教师' }}</text>
            </view>
            
            <!-- 人数信息 -->
            <view class="info-item">
              <wd-icon name="user-talk" size="32rpx" color="#ff6b00" />
              <text class="info-label">人数</text>
              <text class="info-value">{{ courseDetail.memberCount || 0 }}人</text>
            </view>
            
            <!-- 起止日期 -->
            <view class="info-item full-width">
              <wd-icon name="calendar" size="32rpx" color="#ff6b00" />
              <text class="info-label">起止日期</text>
              <text class="info-value">{{ courseDetail.startDate }} ~ {{ courseDetail.endDate }}</text>
            </view>
            
            <!-- 描述信息 -->
            <view class="info-item full-width">
              <wd-icon name="lenovo" size="32rpx" color="#ff6b00" />
              <text class="info-label">描述</text>
              <text class="info-value description">{{ courseDetail.description || '暂无课程描述' }}</text>
            </view>
          </view>

          <!-- 教师功能按钮 -->
          <view v-if="isTeacher" class="action-row">
            <wd-button type="primary" size="small" custom-style="height: 70rpx; background-color: #ff6b00; border-color: #ff6b00;"
              @click="navigateToCreateCheckin">
              <wd-icon name="add" size="28rpx" color="#ffffff" />
              <text style="margin-left: 8rpx;">创建签到任务</text>
            </wd-button>

            <!-- 添加邀请学生按钮 -->
            <wd-button type="info" size="small" custom-style="height: 70rpx; margin-left: 20rpx; background-color: #ff6b00; border-color: #ff6b00;"
              @click="openQRCodeModal">
              <wd-icon name="usergroup-add" size="28rpx" color="#ffffff" />
              <text style="margin-left: 8rpx;">邀请学生</text>
            </wd-button>

            <!-- 添加删除课程按钮 -->
            <wd-button type="error" size="small" custom-style="height: 70rpx; margin-left: 20rpx;"
              :loading="isDeletingCourse" :disabled="isDeletingCourse" @click="handleDeleteCourse">
              <wd-icon v-if="!isDeletingCourse" name="delete" size="28rpx" color="#ffffff"
                style="color: #ffffff !important; fill: #ffffff !important;" />
              <text style="margin-left: 8rpx;">{{ isDeletingCourse ? '删除中...' : '删除课程' }}</text>
            </wd-button>
          </view>
        </template>
      </wd-card>
      
      <!-- 标签栏 -->
      <view class="tabs">
        <view class="tab-item" :class="{ active: activeTab === 'checkins' }" @click="switchTab('checkins')">
          <wd-icon name="time" size="32rpx" :color="activeTab === 'checkins' ? '#ff6b00' : '#666'" />
          <text>签到任务</text>
        </view>
        <view class="tab-item" :class="{ active: activeTab === 'members' }" @click="switchTab('members')">
          <wd-icon name="usergroup" size="32rpx" :color="activeTab === 'members' ? '#ff6b00' : '#666'" />
          <text>成员列表</text>
        </view>
      </view>

      <view class="card tab-content-card">
        <!-- 签到任务列表 -->
        <view v-if="activeTab === 'checkins'" class="checkins-content">
          <!-- 签到任务列表 -->
          <!-- @ts-ignore -->
          <view v-if="checkinList.length > 0" class="checkin-list">
            <!-- @ts-ignore -->
            <view v-for="(checkin, index) in checkinList" :key="checkin.id" class="checkin-item" :class="[
              checkin.checkinType.toLowerCase(),
              'checkin-type-' + checkin.checkinType.toLowerCase(),
              'status-' + getCheckinStatus(checkin)
            ]" :style="{ '--i': index }">
              <!-- 修改左侧图标区域，增大尺寸和右边距 -->
              <view class="checkin-icon">
                <wd-icon :name="getCheckinTypeIcon(checkin.checkinType)" size="64rpx"
                  :color="checkin.checkinType === 'QR_CODE' ? '#2196f3' : '#4caf50'" />
              </view>
              
              <!-- 添加点击区域，排除操作按钮 -->
              <!-- @ts-ignore -->
              <view class="checkin-content" @click="handleCheckinClick(checkin)">
                <!-- @ts-ignore -->
                <view class="checkin-title">{{ checkin.name }}</view>
                <!-- @ts-ignore -->
                <view class="checkin-info-row">
                  <view class="checkin-time">
                    <wd-icon name="time" size="28rpx" color="#666" />
                    <text>{{ formatCheckinTime(checkin.createdAt, checkin.endTime) }}</text>
                  </view>
                </view>
                
                <!-- @ts-ignore -->
                <view v-if="!isStudent" class="checkin-status" :class="getCheckinStatus(checkin)">
                  {{ getCheckinStatus(checkin) === 'not-started' ? '未开始' :
                     getCheckinStatus(checkin) === 'in-progress' ? '进行中' : '已结束' }}
                </view>
                
                <!-- 学生端显示签到状态 -->
                <!-- @ts-ignore -->
                <view v-else class="checkin-status" :class="checkin.personalStatus?.toLowerCase()">
                  {{ checkin.displayStatus }}
                </view>
              </view>
              
              <!-- 教师可以删除签到任务 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher" class="checkin-actions" @click.stop>
                <!-- 添加导出按钮 -->
                <wd-button type="primary" size="small"
                  custom-style="padding: 8rpx 16rpx; min-width: auto; margin-right: 8rpx; background-color: #4caf50;"
                  @click.stop="handleExportSingleCheckin(checkin)">
                  <wd-icon name="download" size="32rpx" color="#ffffff" />
                </wd-button>
                
                <wd-button type="error" size="small"
                  custom-style="padding: 8rpx 16rpx; min-width: auto; background-color: #ff4d4f;"
                  @click.stop="handleDeleteCheckin(checkin)">
                  <wd-icon name="delete" size="32rpx" color="#ffffff" />
                </wd-button>
              </view>
            </view>
          </view>
          
          <!-- 无签到任务 -->
          <!-- @ts-ignore -->
          <view v-else class="empty-container">
            <wd-icon name="info-outline" size="120rpx" color="#cccccc" />
            <!-- @ts-ignore -->
            <text class="empty-text">暂无签到任务</text>
          </view>
        </view>
        
        <!-- 成员列表 -->
        <view v-else-if="activeTab === 'members'" class="members-content">
          <!-- 成员列表 -->
          <!-- @ts-ignore -->
          <view v-if="membersList.length > 0" class="member-list">
            <!-- @ts-ignore -->
            <view v-for="(member, index) in membersList" :key="member.id" 
              class="member-item" 
              :class="{ 
                'role-teacher': member.role === 'TEACHER', 
                'role-student': member.role !== 'TEACHER' 
              }" 
              :style="{ '--i': index }">
              <!-- @ts-ignore -->
              <view class="member-avatar">
                <image 
                  :src="member.avatar || 'static/default-avatar.png'" 
                  mode="aspectFill" 
                  class="member-avatar"
                  @error="handleAvatarError"
                />
              </view>
              <!-- @ts-ignore -->
              <view class="member-info">
                <!-- @ts-ignore -->
                <view class="member-name">{{ member.fullName || member.username }}</view>
                <!-- @ts-ignore -->
                <view class="member-username">{{ member.username }}</view>
                <!-- @ts-ignore -->
                <view class="member-role"
                  :class="{ 'role-teacher': member.role === 'TEACHER', 'role-student': member.role !== 'TEACHER' }">
                  <wd-icon :name="member.role === 'TEACHER' ? 'user-circle' : 'user'" size="24rpx" 
                    :color="member.role === 'TEACHER' ? '#ff6b00' : '#4caf50'" />
                  <text>{{ member.role === 'TEACHER' ? '教师' : '学生' }}</text>
                </view>
              </view>
              
              <!-- 教师可以移除学生成员 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher && member.role !== 'TEACHER'" class="member-actions">
                <wd-button type="error" size="small"
                  custom-style="padding: 8rpx 16rpx; min-width: auto; background-color: #ff4d4f;"
                  @click="handleRemoveMember(member)">
                  <wd-icon name="user-clear" size="32rpx" color="#ffffff" />
                </wd-button>
              </view>
            </view>
          </view>
          
          <!-- 无成员 -->
          <!-- @ts-ignore -->
          <view v-else class="empty-container">
            <wd-icon name="info-outline" size="120rpx" color="#cccccc" />
            <!-- @ts-ignore -->
            <text class="empty-text">暂无成员信息</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 添加二维码弹窗 -->
    <wd-popup v-model="showQRCode" round position="center" custom-style="width: 80%; max-width: 600rpx;">
      <view class="qrcode-container">
        <view class="qrcode-header">
          <text class="qrcode-title">课程邀请二维码</text>
          <text class="qrcode-subtitle">分享此二维码给学生加入课程</text>
        </view>

        <view class="qrcode-content">
          <!-- 为微信小程序添加特殊处理 -->
          <!-- #ifdef MP-WEIXIN -->
          <view v-if="qrCodeUrl" class="qrcode-wx-container">
            <image :src="qrCodeUrl" mode="aspectFit" class="qrcode-image" :show-menu-by-longpress="true" />
            <text class="qrcode-tip">长按图片可保存</text>
          </view>
          <!-- #endif -->

          <!-- 其他平台通用处理 -->
          <!-- #ifndef MP-WEIXIN -->
          <image v-if="qrCodeUrl" :src="qrCodeUrl" mode="aspectFit" class="qrcode-image" />
          <!-- #endif -->

          <view v-if="!qrCodeUrl && qrCodeLoading" class="qrcode-loading">
            <wd-loading size="60rpx" />
            <text>获取二维码中...</text>
          </view>

          <view v-if="!qrCodeUrl && !qrCodeLoading" class="qrcode-error">
            <wd-icon name="warning" size="60rpx" color="#f56c6c" />
            <text>获取二维码失败</text>
            <view class="retry-button" @click="loadCourseQRCode">
              <wd-icon name="refresh" size="28rpx" color="#0165FF" />
              <text style="margin-left: 6rpx;">重试</text>
            </view>
          </view>

          <view class="course-qrinfo">
            <text class="course-name">{{ courseDetail.name }}</text>
            <text class="course-code">课程码: {{ courseDetail.code }}</text>
          </view>
        </view>

        <view class="qrcode-actions">
          <wd-button type="primary" @click="closeQRCodeModal" block>完成</wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 添加删除课程确认弹窗 -->
    <wd-popup v-model="showDeleteConfirm" round position="bottom" custom-style="padding: 40rpx;">
      <view class="delete-confirm">
        <view class="delete-title">确定要删除该课程吗？</view>
        <view class="delete-subtitle">此操作不可恢复！</view>
        <view class="delete-actions">
          <wd-button type="info" @click="showDeleteConfirm = false" custom-style="margin-right: 20rpx;">取消</wd-button>
          <wd-button type="error" @click="confirmDeleteCourse">确定删除</wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 添加更多操作弹窗 -->
    <wd-popup v-model="showOperations" round position="bottom" custom-style="padding: 40rpx;">
      <view class="operations-menu">
        <view class="operations-title">课程操作</view>
        <view class="operations-list">
          <view class="operation-item" @click="handleOpenQRCode">
            <wd-icon name="qrcode" size="40rpx" color="#2196f3" />
            <text>课程邀请码</text>
          </view>
          <view class="operation-item" @click="handleExportData" v-if="isTeacher">
            <wd-icon name="download" size="40rpx" color="#4caf50" />
            <text>导出考勤数据</text>
          </view>
          <view class="operation-item delete-operation" v-if="isTeacher">
            <wd-icon name="delete" size="40rpx" color="#f44336" style="color: #f44336 !important;" />
            <wd-button type="error" size="small" custom-style="margin-left: 16rpx;" :loading="isDeletingCourse"
              @click="handleDeleteCourse">
              <wd-icon name="delete" size="28rpx" color="#ffffff" />
              <text style="margin-left: 8rpx;">{{ isDeletingCourse ? '删除中...' : '删除课程' }}</text>
            </wd-button>
          </view>
        </view>
        <wd-button type="primary" @click="showOperations = false" block custom-style="margin-top: 30rpx;">取消</wd-button>
      </view>
    </wd-popup>

    <!-- 地址解析进度弹窗 -->
    <view class="address-resolution-modal" v-if="showAddressResolution">
      <view class="modal-content">
        <view class="modal-title">正在解析地址</view>
        <view class="progress-container">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: `${addressResolutionProgress}%` }"></view>
          </view>
          <view class="progress-text">{{ addressResolutionCount }}/{{ addressResolutionTotal }}</view>
        </view>
        <view class="loading-icon">
          <wd-loading color="#6a11cb" size="80rpx" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-color-primary, #f5f5f5);
  color: var(--text-color-primary, #303133);
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  padding: 30rpx;
}

.wot-theme-dark {
  .container {
    background-color: var(--background-color-primary, #121212);
    color: var(--text-color-primary, #e5eaf3);
  }
  
  .tabs {
    background-color: var(--background-color-secondary);
  }
  
  .tab-item {
    color: var(--text-color-secondary);
    
    &.active {
      color: #ff6b00;
    }
  }
  
  .card {
    background-color: var(--background-color-secondary);
    border: 1px solid var(--border-color);
  }
  
  .checkin-item {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }
  
  .checkin-title {
    color: var(--text-color-primary);
  }
  
  .checkin-time {
    background-color: rgba(255, 255, 255, 0.05);
    
    text {
      color: var(--text-color-secondary);
    }
  }
  
  .checkin-type-badge {
    background-color: rgba(255, 255, 255, 0.07);
  }
  
  .checkin-item.status-not-started {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba(35, 35, 35, 0.9) 100%);
    border-left-color: #757575;
  }
  
  .checkin-item.status-in-progress {
    background: linear-gradient(135deg, rgba(50, 35, 25, 0.9) 0%, rgba(45, 30, 20, 0.9) 100%);
    border-left-color: #ff6b00;
    box-shadow: 0 6rpx 16rpx rgba(255, 107, 0, 0.15);
  }
  
  .checkin-item.status-ended {
    background: linear-gradient(135deg, rgba(30, 45, 30, 0.9) 0%, rgba(25, 40, 25, 0.9) 100%);
    border-left-color: #4caf50;
    box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.15);
  }
  
  .member-item {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
    border-left-color: var(--border-color);
  }
  
  .member-name {
    color: var(--text-color-primary);
  }
  
  .member-username {
    color: var(--text-color-secondary);
  }
  
  .member-role {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .stats-card, .students-attendance {
    background-color: var(--background-color-secondary);
    border: 1px solid var(--border-color);
  }
  
  .stats-item {
    background-color: var(--background-color-tertiary);
  }
  
  .student-item {
    background-color: var(--background-color-tertiary);
  }
  
  .student-rank {
    background-color: var(--background-color-secondary);
    color: var(--text-color-primary);
  }
  
  .info-item {
    background-color: rgba(60, 60, 60, 0.3);
    
    .info-label {
      color: var(--text-color-secondary);
    }
    
    .info-value {
      color: var(--text-color-primary);
    }
    
    .info-value.description {
      background-color: rgba(60, 60, 60, 0.2);
      color: var(--text-color-secondary);
    }
  }
}

/* 卡片样式 */
.course-card {
  width: 100%;
  margin-bottom: 30rpx;
  overflow: hidden;
}

/* 内容样式 */
.course-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  padding: 10rpx 0;
}

.info-item {
  display: flex;
  align-items: center;
  width: calc(50% - 10rpx);
  padding: 16rpx;
  background-color: rgba(245, 247, 250, 0.7);
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.03);
}

.info-item.full-width {
  width: 100%;
}

.info-label {
  font-size: 26rpx;
  color: var(--text-color-secondary);
  margin: 0 15rpx;
  min-width: 80rpx;
}

.info-value {
  font-size: 26rpx;
  color: var(--text-color-primary);
  flex: 1;
  word-break: break-word;
}

.info-value.description {
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 26rpx;
  color: var(--text-color-secondary);
  margin-top: 6rpx;
  max-height: 160rpx;
  overflow-y: auto;
  padding: 10rpx;
  background-color: rgba(245, 247, 250, 0.6);
  border-radius: 8rpx;
}

.course-status-badge {
  padding: 6rpx 16rpx;
  border-radius: 50rpx;
  font-weight: 500;
  font-size: 24rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.course-status-badge.active {
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 136, 0, 0.1) 100%);
  color: #ff6b00;
}

.course-status-badge.completed {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.1) 100%);
  color: #4caf50;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
  justify-content: flex-start;
  padding: 0 20rpx 20rpx;
}

.tabs {
  display: flex;
  justify-content: space-around;
  padding: 10rpx 20rpx;
  margin-bottom: 20rpx;
  background-color: var(--background-color-primary);
  border-radius: 24rpx;
  box-shadow: var(--card-shadow);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  color: var(--text-color-secondary);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  
  &:active {
    opacity: 0.8;
  }
  
  .wd-icon {
    margin-bottom: 8rpx;
  }
  
  &.active {
    color: #ff6b00;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 30%;
      width: 40%;
      height: 4rpx;
      background-color: #ff6b00;
      border-radius: 2rpx;
    }
  }
}

.tab-item text {
  font-size: 28rpx;
  margin-top: 8rpx;
  font-weight: 500;
}

.checkins-content, .members-content {
  width: 100%;
  min-height: 300rpx;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300rpx;
  gap: 20rpx;
  margin-top: 100rpx;
}

.loading-container text {
  font-size: 28rpx;
  color: #666;
  margin-top: 10rpx;
}

.content-container {
  width: 100%;
  flex: 1;
  box-sizing: border-box;
}

/* 签到列表样式优化 */
.checkin-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  will-change: transform;
}

.checkin-item {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 254, 0.9) 100%);
  border-radius: 20rpx;
  padding: 22rpx 18rpx 22rpx 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  animation: fadeIn 0.3s ease forwards;
  animation-delay: calc(var(--i) * 0.05s);
  opacity: 0;
  border-left: 6rpx solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.checkin-item:active {
  transform: translateY(2rpx) scale(0.995);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

.checkin-content {
  flex: 1;
  margin-right: 16rpx;
  position: relative;
  z-index: 1;
  min-width: 0;
  overflow: hidden;
}

.checkin-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 14rpx;
}

.checkin-info-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 12rpx 0;
}

.checkin-time {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 6rpx 10rpx;
  border-radius: 16rpx;
  max-width: 100%;
  flex: 1;
  min-width: 0;
}

.checkin-time text {
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.checkin-type-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 12rpx;
  border-radius: 24rpx;
  font-weight: 500;
}

.checkin-type-badge text {
  font-size: 24rpx;
  white-space: nowrap;
}

.checkin-status {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 6rpx 16rpx;
  border-radius: 50rpx;
  font-size: 22rpx;
  font-weight: 500;
  z-index: 2;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.checkin-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  margin-left: 8rpx;
  gap: 8rpx;
}

/* 添加导出按钮样式 */
.checkin-actions .wd-button {
  min-width: auto;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx;
  border-radius: 8rpx;
}

/* 确保图标颜色统一 */
.checkin-actions .wd-button--primary .wd-icon {
  color: #ffffff !important;
  fill: #ffffff !important;
}

.checkin-actions .wd-button--primary {
  background-color: #4caf50 !important;
  border-color: #4caf50 !important;
}

.checkin-actions .wd-button--error {
  background-color: #ff4d4f !important;
  border-color: #ff4d4f !important;
}

.checkin-actions .wd-button:active {
  opacity: 0.8;
  transform: scale(0.95);
}

/* 根据状态添加卡片背景和样式变化 */
.checkin-item.status-not-started {
  background: linear-gradient(135deg, rgba(250, 250, 250, 0.9) 0%, rgba(245, 245, 250, 0.9) 100%);
  border-left-color: #757575;
}

.checkin-item.status-in-progress {
  background: linear-gradient(135deg, rgba(255, 243, 224, 0.9) 0%, rgba(255, 236, 217, 0.9) 100%);
  border-left-color: #ff6b00;
  box-shadow: 0 6rpx 16rpx rgba(255, 107, 0, 0.1);
}

.checkin-item.status-ended {
  background: linear-gradient(135deg, rgba(237, 247, 237, 0.9) 0%, rgba(232, 245, 233, 0.9) 100%);
  border-left-color: #4caf50;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.08);
}

.checkin-item.qr_code {
  border-left-color: #ff6b00;
}

.checkin-item.location {
  border-left-color: #4caf50;
}

.checkin-item.checkin-type-qr_code .checkin-type-badge {
  background-color: rgba(255, 107, 0, 0.1);
  color: #ff6b00;
}

.checkin-item.checkin-type-location .checkin-type-badge {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  min-height: 300rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
  margin-bottom: 16rpx;
}

.empty-list {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  background: rgba(250, 250, 250, 0.5);
  border-radius: 16rpx;
}

/* 二维码弹窗样式优化 */
.qrcode-container {
  padding: 40rpx;
}

.qrcode-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.qrcode-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.qrcode-subtitle {
  font-size: 26rpx;
  color: #666;
}

.qrcode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.qrcode-image {
  width: 400rpx;
  height: 400rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid #f0f0f0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  border-radius: 12rpx;
  background-color: #fff;
}

.qrcode-loading,
.qrcode-error {
  width: 400rpx;
  height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  border: 2rpx solid #f0f0f0;
}

.qrcode-loading text,
.qrcode-error text {
  margin-top: 20rpx;
  color: #666;
  font-size: 28rpx;
}

.course-qrinfo {
  text-align: center;
  margin-top: 20rpx;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.08) 0%, rgba(255, 136, 0, 0.08) 100%);
  padding: 16rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 0, 0.08);
}

.course-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.course-code {
  font-size: 28rpx;
  color: #666;
}

.qrcode-actions {
  margin-top: 20rpx;
}

.retry-button {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16rpx;
  padding: 10rpx 24rpx;
  border-radius: 50rpx;
  background-color: rgba(255, 107, 0, 0.1);
  color: #ff6b00;
  font-size: 24rpx;
  box-shadow: 0 4rpx 8rpx rgba(255, 107, 0, 0.1);
  transition: all 0.2s ease;
}

.retry-button:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 4rpx rgba(255, 107, 0, 0.05);
}

/* 删除确认弹窗 */
.delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
}

.delete-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.delete-subtitle {
  font-size: 28rpx;
  color: #f56c6c;
  margin-bottom: 40rpx;
}

.delete-actions {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 20rpx;
}

/* 操作菜单 */
.operations-menu {
  display: flex;
  flex-direction: column;
}

.operations-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  text-align: center;
}

.operations-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.operation-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.operation-item:active {
  transform: scale(0.98);
  background-color: rgba(250, 250, 250, 0.9);
}

.operation-item text {
  font-size: 30rpx;
  color: #333;
  margin-left: 20rpx;
}

.delete-operation {
  background-color: rgba(244, 67, 54, 0.05);
  align-items: center;
  justify-content: flex-start;
  padding: 16rpx 24rpx;
}

.delete-operation:active {
  background-color: rgba(244, 67, 54, 0.1);
}

.delete-operation text {
  color: #ffffff;
}

.operation-item.delete-operation .wd-button {
  flex: 1;
  margin-left: 16rpx;
}

/* 地址解析弹窗 */
.address-resolution-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-content {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 80%;
  max-width: 600rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
}

.progress-container {
  width: 100%;
  margin-bottom: 30rpx;
}

.progress-bar {
  width: 100%;
  height: 20rpx;
  background-color: #f0f0f0;
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 10rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00 0%, #ff8800 100%);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 28rpx;
  color: #666;
}

/* 微信小程序专用样式 */
.qrcode-wx-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.qrcode-tip {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #666;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 4rpx 16rpx;
  border-radius: 30rpx;
}

.debug-info {
  text-align: center;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
}

/* 确保删除按钮的图标颜色总是正确的 */
.checkin-actions .wd-icon,
.member-actions .wd-icon {
  color: #ffffff !important;
}

.operation-item.delete-operation .wd-icon {
  color: #f44336 !important;
}

/* 添加强化的图标颜色样式规则 */
.wd-button--danger .wd-icon,
.checkin-actions .wd-icon,
.member-actions .wd-icon {
  color: #ffffff !important;
  fill: #ffffff !important;
}

/* 处理全局图标样式 */
:deep(.wd-button--danger) .wd-icon {
  color: #ffffff !important;
  fill: #ffffff !important;
}

/* 强制覆盖所有删除按钮的图标颜色 */
[class*="wd-button"][type="danger"] .wd-icon {
  color: #ffffff !important;
  fill: #ffffff !important;
}

.loading-icon {
  margin-top: 20rpx;
}

/* 成员列表样式 */
.member-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  will-change: transform;
}

.member-item {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 254, 0.9) 100%);
  border-radius: 20rpx;
  padding: 22rpx 18rpx 22rpx 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  animation: fadeIn 0.3s ease forwards;
  animation-delay: calc(var(--i) * 0.05s);
  opacity: 0;
  border-left: 6rpx solid #e0e0e0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.member-item:active {
  transform: translateY(2rpx) scale(0.995);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

.member-item.role-teacher {
  border-left-color: #ff6b00;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 0, 0.08);
}

.member-item.role-student {
  border-left-color: #4caf50;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.08);
}

.member-avatar {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20rpx;
  border: 2rpx solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.member-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.member-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-username {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-role {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  width: fit-content;
  background-color: rgba(0, 0, 0, 0.03);
  
  text {
    margin-left: 4rpx;
  }
  
  &.role-teacher {
    background-color: rgba(255, 107, 0, 0.1);
    color: #ff6b00;
  }
  
  &.role-student {
    background-color: rgba(76, 175, 80, 0.1);
    color: #4caf50;
  }
}

.member-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  margin-left: 8rpx;
}

/* 暗黑模式下成员卡片样式 */
.wot-theme-dark {
  .member-item {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
    border-left-color: #555;
    
    &.role-teacher {
      border-left-color: #ff6b00;
      box-shadow: 0 4rpx 12rpx rgba(255, 107, 0, 0.15);
    }
    
    &.role-student {
      border-left-color: #4caf50;
      box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.15);
    }
  }
  
  .member-name {
    color: #e5eaf3;
  }
  
  .member-username {
    color: #a3a6ad;
  }
  
  .member-role {
    background-color: rgba(255, 255, 255, 0.05);
    
    &.role-teacher {
      background-color: rgba(255, 107, 0, 0.15);
    }
    
    &.role-student {
      background-color: rgba(76, 175, 80, 0.15);
    }
  }
}

.tab-content {
  width: 100%;
  min-height: 400rpx;
}

.checkin-list, .members-list {
  width: 100%;
  border-radius: 16rpx;
  overflow: hidden;
}

.cell-icon {
  margin-right: 10rpx;
}

.checkin-actions, .member-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  padding: 10rpx;
  margin-left: 12rpx;
}

.empty-container, .loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.empty-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: var(--text-color-secondary);
}

/* 课程卡片和信息样式 */
.course-card {
  width: 100%;
  margin-bottom: 30rpx;
  overflow: hidden;
}

.course-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  padding: 10rpx 0;
}

.info-item {
  display: flex;
  align-items: center;
  width: calc(50% - 10rpx);
  padding: 16rpx;
  background-color: rgba(245, 247, 250, 0.7);
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.03);
}

.info-item.full-width {
  width: 100%;
}

.info-label {
  font-size: 26rpx;
  color: var(--text-color-secondary);
  margin: 0 15rpx;
  min-width: 80rpx;
}

.info-value {
  font-size: 26rpx;
  color: var(--text-color-primary);
  flex: 1;
  word-break: break-word;
}

.info-value.description {
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 26rpx;
  color: var(--text-color-secondary);
  margin-top: 6rpx;
  max-height: 160rpx;
  overflow-y: auto;
  padding: 10rpx;
  background-color: rgba(245, 247, 250, 0.6);
  border-radius: 8rpx;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
  justify-content: flex-start;
  padding: 0 20rpx 20rpx;
}

/* 考勤统计样式 */
.stats-content {
  width: 100%;
  min-height: 300rpx;
}

.stats-wrapper {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.stats-card {
  background-color: var(--background-color-primary);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stats-header {
  display: flex;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20rpx;
}

.stats-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-left: 12rpx;
  color: var(--text-color-primary);
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.stats-item {
  flex: 1;
  min-width: calc(50% - 10rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx;
  background-color: var(--background-color-secondary);
  border-radius: 12rpx;
}

.stats-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6b00;
  margin-bottom: 8rpx;
}

.stats-label {
  font-size: 26rpx;
  color: var(--text-color-secondary);
}

.students-attendance {
  background-color: var(--background-color-primary);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.students-list {
  margin-top: 20rpx;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-color-secondary);
  margin-bottom: 10rpx;
  border-radius: 12rpx;
}

.student-rank {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28rpx;
  font-weight: bold;
  color: #666;
  margin-right: 20rpx;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--text-color-primary);
  margin-bottom: 6rpx;
  display: block;
}

.student-id {
  font-size: 24rpx;
  color: var(--text-color-secondary);
}

.attendance-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.attendance-rate {
  font-size: 36rpx;
  font-weight: bold;
  color: #4caf50;
}

.attendance-detail {
  font-size: 22rpx;
  color: var(--text-color-secondary);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.student-item.excellent .attendance-rate {
  color: #4caf50;
}

.student-item.normal .attendance-rate {
  color: #ff9800;
}

.student-item.warning .attendance-rate {
  color: #f44336;
}

.export-actions {
  margin-top: 30rpx;
  display: flex;
  justify-content: center;
}

/* 主题支持 - 包括所有卡片的主题适配 */
.wot-theme-dark {
  .tabs {
    background-color: var(--background-color-secondary);
    box-shadow: var(--card-shadow);
  }
  
  .tab-item {
    color: var(--text-color-secondary);
    
    &.active {
      color: #ff6b00;
    }
  }
  
  .checkin-item {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }
  
  .checkin-title {
    color: var(--text-color-primary);
  }
  
  .checkin-time {
    background-color: rgba(255, 255, 255, 0.05);
    
    text {
      color: var(--text-color-secondary);
    }
  }
  
  .checkin-type-badge {
    background-color: rgba(255, 255, 255, 0.07);
  }
  
  .member-item {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }
  
  .member-name {
    color: var(--text-color-primary);
  }
  
  .member-username {
    color: var(--text-color-secondary);
  }
  
  .member-role {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .stats-card, .students-attendance {
    background-color: var(--background-color-secondary);
    border: 1px solid var(--border-color);
  }
  
  .stats-item {
    background-color: var(--background-color-tertiary);
  }
  
  .student-item {
    background-color: var(--background-color-tertiary);
  }
  
  .student-rank {
    background-color: var(--background-color-secondary);
    color: var(--text-color-primary);
  }
  
  .info-item {
    background-color: rgba(60, 60, 60, 0.3);
    
    .info-label {
      color: var(--text-color-secondary);
    }
    
    .info-value {
      color: var(--text-color-primary);
    }
    
    .info-value.description {
      background-color: rgba(60, 60, 60, 0.2);
      color: var(--text-color-secondary);
    }
  }
}

.card {
  background-color: var(--background-color-primary);
  border-radius: 24rpx;
  padding: 20rpx;
  box-shadow: var(--card-shadow);
  margin-bottom: 30rpx;
  transition: all 0.3s ease;
}

.tab-content-card {
  padding: 30rpx;
  min-height: 400rpx;
}

.checkin-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100rpx;
  height: 100rpx;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 50%;
  margin-right: 24rpx;
  flex-shrink: 0;
}
</style>
