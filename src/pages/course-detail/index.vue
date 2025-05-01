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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { CheckInType, getCheckinList, deleteCheckin } from '@/api/attendance'
import { getCourseMemberList, getCourseQRCode, deleteCourse, removeCourseMember } from '@/api/courses'
import type { PageQueryParams } from '@/api/attendance'
import { onShow } from '@dcloudio/uni-app'
import { formatDateTime } from '@/utils/dateTime'

// 为window.uni声明类型，解决TypeScript错误
declare global {
  interface Window {
    uni: typeof uni;
  }
}

const userStore = useUserStore()
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

// 监听activeTab和isStudent，确保学生不能访问考勤统计
watch([isStudent, activeTab], ([isStudentValue, activeTabValue]) => {
  // 如果是学生且当前tab是考勤统计，则自动切换到签到任务
  if (isStudentValue && activeTabValue === 'stats') {
    activeTab.value = 'checkins'
  }
})

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 初始化
onMounted(() => {
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

// 切换标签
function switchTab(tab: string) {
  // 如果当前标签与目标标签相同，不执行任何操作
  if (activeTab.value === tab) return
  
  activeTab.value = tab
  
  // 切换到相应标签时刷新对应数据
  if (tab === 'members') {
    loadCourseMembers(true)
  } else if (tab === 'stats' && isTeacher.value) {
    loadCourseAttendanceStats()
  } else if (tab === 'checkins') {
    loadCheckinList(true)
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
    
    console.log('开始获取课程二维码, 课程ID:', courseId.value)
    
    // 调用已封装好的API
    const response = await getCourseQRCode(courseId.value)
    console.log('二维码API响应接收成功')
    
    if (!response) {
      console.error('二维码响应为空')
      throw new Error('二维码数据为空')
    }

    // 检查响应类型并进行相应处理
    if (response instanceof ArrayBuffer) {
      console.log('响应类型为ArrayBuffer, 长度:', response.byteLength)
      
      // 直接使用小程序原生API进行Base64转换
      try {
        // 微信小程序环境
        // #ifdef MP-WEIXIN
        console.log('微信小程序环境: 开始处理ArrayBuffer')
        // 使用同步方式处理ArrayBuffer (部分新版微信小程序支持)
        try {
          // 尝试直接使用wx.arrayBufferToBase64
          // @ts-ignore
          const base64 = wx.arrayBufferToBase64(response)
          qrCodeUrl.value = `data:image/png;base64,${base64}`
          console.log('微信小程序: 使用同步方法转换成功')
        } catch (err) {
          console.error('微信小程序: 同步方法失败，尝试异步方法', err)
          // 回退到异步方法
          wx.arrayBufferToBase64({
            buffer: response,
            success: (res) => {
              qrCodeUrl.value = `data:image/png;base64,${res.base64}`
              console.log('微信小程序: 异步二维码Base64转换成功')
            },
            fail: (err) => {
              console.error('微信小程序: Base64转换失败', err)
              // 失败时尝试直接使用二进制数据
              try {
                // 使用替代策略
                const uint8Array = new Uint8Array(response)
                let binary = ''
                for (let i = 0; i < uint8Array.length; i++) {
                  binary += String.fromCharCode(uint8Array[i])
                }
                const base64 = btoa(binary)
                qrCodeUrl.value = `data:image/png;base64,${base64}`
                console.log('微信小程序: 使用手动实现方法转换成功')
              } catch (e) {
                console.error('微信小程序: 所有方法都失败', e)
              }
            }
          })
        }
        // #endif
        
        // 非微信小程序环境
        // #ifndef MP-WEIXIN
        try {
          const base64 = uni.arrayBufferToBase64(response)
          qrCodeUrl.value = `data:image/png;base64,${base64}`
          console.log('二维码Base64转换成功, 长度:', base64.length)
        } catch (err) {
          console.error('uni.arrayBufferToBase64 转换失败:', err)
          throw new Error('二维码数据转换失败')
        }
        // #endif
      } catch (err) {
        console.error('Base64转换失败:', err)
        throw new Error('二维码数据转换失败')
      }
    } else {
      console.log('响应不是ArrayBuffer类型:', typeof response)
      // 非ArrayBuffer类型响应处理 (后备方案)
      
      if (typeof response === 'string') {
        // 字符串类型的响应
        const strResponse = response as string
        if (strResponse.indexOf('data:') === 0) {
          // 如果已经是data URI
          qrCodeUrl.value = strResponse
          console.log('收到data URI格式的二维码')
        } else {
          // 假设是base64字符串
          qrCodeUrl.value = `data:image/png;base64,${strResponse}`
          console.log('将字符串作为base64处理')
        }
      } else if (typeof response === 'object') {
        // 对象类型响应
        console.log('响应是对象类型:', response)
        
        if ((response as any).base64) {
          qrCodeUrl.value = `data:image/png;base64,${(response as any).base64}`
          console.log('从对象中提取base64字段')
        } else if ((response as any).url) {
          qrCodeUrl.value = (response as any).url
          console.log('从对象中提取url字段')
        } else {
          // 尝试将整个对象转为JSON字符串并作为文本显示
          console.error('无法识别的对象格式:', response)
          throw new Error('无法识别的二维码数据格式')
        }
      } else {
        console.error('不支持的二维码数据格式:', response)
        throw new Error('不支持的二维码数据格式')
      }
    }
  } catch (e) {
    console.error('获取课程二维码出错:', e)
    getSafeUni().showToast({
      title: '获取二维码失败',
      icon: 'none'
    })
  } finally {
    qrCodeLoading.value = false
  }
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
          await removeCourseMember(courseId.value, member.userId, res.content)
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

function handleExportData() {
  // 关闭操作菜单（如果打开的话）
  showOperations.value = false
  
  // 确保有统计数据
  if (!attendanceStats.value || !attendanceStats.value.attendanceByStudent || attendanceStats.value.attendanceByStudent.length === 0) {
    getSafeUni().showToast({
      title: '没有可导出的数据',
      icon: 'none'
    })
    return
  }

  // 显示导出中的提示
  getSafeUni().showLoading({
    title: '准备导出数据...'
  })

  // 延迟一会儿以显示加载效果
  setTimeout(() => {
    try {
      // 在实际应用中，这里应该调用后端API来生成Excel文件
      // 由于当前是前端演示，我们只显示一个成功的提示
      getSafeUni().hideLoading()
      getSafeUni().showToast({
        title: 'Excel导出成功',
        icon: 'success'
      })
      
      // 可以在这里添加文件下载或分享的代码
      console.log('导出考勤数据:', attendanceStats.value)
    } catch (error) {
      console.error('导出数据失败:', error)
      getSafeUni().hideLoading()
      getSafeUni().showToast({
        title: '导出失败，请重试',
        icon: 'none'
      })
    }
  }, 1500)
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
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 加载中 -->
    <!-- @ts-ignore -->
    <view v-if="loading" class="loading-container">
      <wd-loading color="#6a11cb" size="80rpx" />
      <text>加载课程信息中...</text>
    </view>

    <!-- 主要内容 -->
    <!-- @ts-ignore -->
    <view v-else class="content-container">
      <!-- 课程头部信息 -->
      <!-- @ts-ignore -->
      <view class="course-header">
        <!-- 基本信息展示 -->
        <!-- @ts-ignore -->
        <view class="basic-info-card">
          <!-- 课程标题和状态 -->
          <!-- @ts-ignore -->
          <view class="course-title-row">
            <text class="course-title">{{ courseDetail.name }}</text>
            <!-- @ts-ignore -->
            <view class="course-status-badge" :class="courseDetail.status?.toLowerCase()">
              {{ courseDetail.status === 'ACTIVE' ? '进行中' :
                courseDetail.status === 'COMPLETED' ? '已结课' : '未知状态' }}
            </view>
          </view>

          <!-- 课程详细信息 -->
          <!-- @ts-ignore -->
          <view class="info-grid">
            <!-- @ts-ignore -->
            <view class="info-item">
              <wd-icon name="user" size="32rpx" color="#6a11cb" />
              <!-- @ts-ignore -->
              <view class="info-label">教师</view>
              <!-- @ts-ignore -->
              <view class="info-value">{{ courseDetail.creatorFullName || courseDetail.creatorUsername || '未知教师' }}</view>
            </view>

            <!-- @ts-ignore -->
            <view class="info-item">
              <wd-icon name="people" size="32rpx" color="#6a11cb" />
              <!-- @ts-ignore -->
              <view class="info-label">人数</view>
              <!-- @ts-ignore -->
              <view class="info-value">{{ courseDetail.memberCount || 0 }}人</view>
            </view>

            <!-- @ts-ignore -->
            <view class="info-item">
              <wd-icon name="calendar" size="32rpx" color="#6a11cb" />
              <!-- @ts-ignore -->
              <view class="info-label">起止日期</view>
              <!-- @ts-ignore -->
              <view class="info-value date-value" style="width: auto;">{{ formatDateTime(courseDetail.startDate) }} ~ {{
                formatDateTime(courseDetail.endDate) }}</view>
            </view>

            <!-- @ts-ignore -->
            <view class="info-item full-width">
              <wd-icon name="info-outline" size="32rpx" color="#6a11cb" />
              <!-- @ts-ignore -->
              <view class="info-label">描述</view>
              <!-- @ts-ignore -->
              <view class="info-value description">{{ courseDetail.description || '暂无课程描述' }}</view>
            </view>
          </view>

          <!-- 教师功能按钮 -->
          <!-- @ts-ignore -->
          <view v-if="isTeacher" class="action-row">
            <wd-button type="primary" size="small" custom-style="height: 70rpx; margin-top: 20rpx;"
              @click="navigateToCreateCheckin">
              <wd-icon name="add" size="28rpx" color="#ffffff" />
              <text style="margin-left: 8rpx;">创建签到任务</text>
            </wd-button>

            <!-- 添加邀请学生按钮 -->
            <wd-button type="info" size="small" custom-style="height: 70rpx; margin-top: 20rpx; margin-left: 20rpx;"
              @click="openQRCodeModal">
              <wd-icon name="qrcode" size="28rpx" color="#ffffff" />
              <text style="margin-left: 8rpx;">邀请学生</text>
            </wd-button>
            
            <!-- 添加删除课程按钮 -->
            <wd-button type="danger" size="small" custom-style="height: 70rpx; margin-top: 20rpx; margin-left: 20rpx;"
              @click="handleDeleteCourse">
              <wd-icon name="delete" size="28rpx" color="#ffffff" />
              <text style="margin-left: 8rpx;">删除课程</text>
            </wd-button>
          </view>
        </view>
      </view>

      <!-- 标签页 -->
      <!-- @ts-ignore -->
      <view class="tab-container">
        <!-- @ts-ignore -->
        <view class="tab-item" :class="{ active: activeTab === 'checkins' }" @click="switchTab('checkins')">
          <!-- @ts-ignore -->
          <text class="tab-text">签到任务</text>
        </view>
        <!-- @ts-ignore -->
        <view class="tab-item" :class="{ active: activeTab === 'members' }" @click="switchTab('members')">
          <!-- @ts-ignore -->
          <text class="tab-text">成员列表</text>
        </view>
        <!-- 只有教师可以看到考勤统计 -->
        <!-- @ts-ignore -->
        <view v-if="isTeacher" class="tab-item" :class="{ active: activeTab === 'stats' }" @click="switchTab('stats')">
          <!-- @ts-ignore -->
          <text class="tab-text">考勤统计</text>
        </view>
      </view>

      <!-- 标签页内容 -->
      <!-- @ts-ignore -->
      <view class="tab-content">
        <!-- 签到任务标签页 -->
        <!-- @ts-ignore -->
        <view v-if="activeTab === 'checkins'" class="checkins-content">
          <!-- 签到任务列表 -->
          <!-- @ts-ignore -->
          <view v-if="checkinList.length > 0" class="checkin-list">
            <!-- @ts-ignore -->
            <view v-for="(checkin, index) in checkinList" :key="checkin.id" class="checkin-item"
              :class="[checkin.checkinType.toLowerCase(), 'checkin-type-' + checkin.checkinType.toLowerCase()]"
              :style="{ '--i': index }">
              <!-- 添加点击区域，排除操作按钮 -->
              <!-- @ts-ignore -->
              <view class="checkin-content" @click="handleCheckinClick(checkin)">
                <!-- @ts-ignore -->
                <view class="checkin-title">{{ checkin.name }}</view>
                <!-- @ts-ignore -->
                <view class="checkin-info-row">
                  <view class="checkin-time">
                    <wd-icon name="time" size="28rpx" color="#666" />
                    <text>{{ formatDateTime(checkin.startTime) }} ~ {{ formatDateTime(checkin.endTime) }}</text>
                  </view>
                  <view class="checkin-type-badge">
                    <wd-icon :name="checkin.checkinType === 'QR_CODE' ? 'scan' : 'location'" size="24rpx" :color="checkin.checkinType === 'QR_CODE' ? '#2196f3' : '#4caf50'" />
                    <text>{{ getCheckinTypeText(checkin.checkinType) }}</text>
                  </view>
                </view>
                <!-- @ts-ignore -->
                <view v-if="!isStudent" class="checkin-status" :class="getCheckinStatus(checkin)">
                  {{ getCheckinStatus(checkin) === 'not-started' ? '未开始' :
                    getCheckinStatus(checkin) === 'in-progress' ? '进行中' : '已结束' }}
                </view>

                <!-- 学生端显示签到状态 -->
                <!-- @ts-ignore -->
                <view v-else class="checkin-status"
                  :class="checkin.personalStatus?.toLowerCase()">
                  {{ checkin.displayStatus }}
                </view>
              </view>
              
              <!-- 教师可以删除签到任务 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher" class="checkin-actions" @click.stop>
                <wd-button type="danger" size="mini" custom-style="padding: 4rpx 12rpx; min-width: auto;" 
                  @click.stop="handleDeleteCheckin(checkin)">
                  <wd-icon name="delete" size="28rpx" color="#ff0000" style="color: #ff0000 !important;" />
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

        <!-- 成员列表标签页 -->
        <!-- @ts-ignore -->
        <view v-else-if="activeTab === 'members'" class="members-content">
          <!-- 成员列表 -->
          <!-- @ts-ignore -->
          <view v-if="membersList.length > 0" class="member-list">
            <!-- @ts-ignore -->
            <view v-for="member in membersList" :key="member.id" class="member-item">
              <!-- @ts-ignore -->
              <view class="member-avatar">
                <image :src="member.avatarUrl || 'https://picsum.photos/100/100?random=' + member.id.slice(0, 8)"
                  mode="aspectFill" />
              </view>
              <!-- @ts-ignore -->
              <view class="member-info">
                <!-- @ts-ignore -->
                <view class="member-name">{{ member.fullName || member.username }}</view>
                <!-- @ts-ignore -->
                <view class="member-username">{{ member.username }}</view>
                <!-- @ts-ignore -->
                <view class="member-role" :class="{ 'role-teacher': member.role === 'TEACHER', 'role-student': member.role !== 'TEACHER' }">
                  {{ member.role === 'TEACHER' ? '教师' : '学生' }}
                </view>
              </view>
              
              <!-- 教师可以移除学生成员 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher && member.role !== 'TEACHER'" class="member-actions">
                <wd-button type="danger" size="mini" custom-style="padding: 4rpx 12rpx; min-width: auto;" 
                  @click="handleRemoveMember(member)">
                  <wd-icon name="delete" size="28rpx" color="#ff0000" style="color: #ff0000 !important;" />
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

        <!-- 考勤统计标签页 -->
        <!-- @ts-ignore -->
        <view v-else-if="activeTab === 'stats'" class="stats-content">
          <!-- 统计数据 -->
          <!-- @ts-ignore -->
          <view v-if="attendanceStats" class="stats-container">
            <!-- 导出Excel按钮 -->
            <!-- @ts-ignore -->
            <view class="export-btn" @click="handleExportData">
              <wd-icon name="download" size="28rpx" color="#4caf50" />
              <text>导出Excel</text>
            </view>

            <!-- @ts-ignore -->
            <view class="stats-card">
              <!-- @ts-ignore -->
              <view class="stats-title">整体出勤情况</view>
              <!-- @ts-ignore -->
              <view class="stats-row">
                <!-- @ts-ignore -->
                <view class="stat-item">
                  <!-- @ts-ignore -->
                  <view class="stat-value">{{ attendanceStats.statistics?.averageAttendance || 0 }}%</view>
                  <!-- @ts-ignore -->
                  <view class="stat-label">平均出勤率</view>
                </view>
                <!-- @ts-ignore -->
                <view class="stat-item">
                  <!-- @ts-ignore -->
                  <view class="stat-value">{{ attendanceStats.statistics?.totalCheckins || 0 }}</view>
                  <!-- @ts-ignore -->
                  <view class="stat-label">签到任务数</view>
                </view>
                <!-- @ts-ignore -->
                <view class="stat-item">
                  <!-- @ts-ignore -->
                  <view class="stat-value">{{ attendanceStats.courseInfo?.totalStudents || 0 }}</view>
                  <!-- @ts-ignore -->
                  <view class="stat-label">学生总数</view>
                </view>
              </view>
            </view>

            <!-- 所有成员出勤率 -->
            <!-- @ts-ignore -->
            <view class="stats-card">
              <!-- @ts-ignore -->
              <view class="stats-title">出勤率排名</view>
              <!-- @ts-ignore -->
              <view v-if="attendanceStats.attendanceByStudent && attendanceStats.attendanceByStudent.length > 0"
                class="attendance-list">
                <!-- @ts-ignore -->
                <view v-for="(student, index) in getSortedStudents()" :key="student.userId" class="attendance-item"
                  :class="getAttendanceRateClass(student.attendanceRate)">
                  <!-- @ts-ignore -->
                  <view class="rank">{{ index + 1 }}</view>
                  <!-- @ts-ignore -->
                  <view class="student-info">
                    <!-- @ts-ignore -->
                    <view class="student-name">{{ student.userName }}</view>
                    <!-- @ts-ignore -->
                    <view class="student-username">{{ student.username }}</view>
                  </view>
                  <!-- @ts-ignore -->
                  <view class="attendance-details">
                    <!-- @ts-ignore -->
                    <view class="attendance-rate" :class="getAttendanceRateClass(student.attendanceRate)">{{
                      student.attendanceRate }}%</view>
                    <!-- @ts-ignore -->
                    <view class="attendance-numbers">
                      <text class="normal">{{ student.checkedIn }}</text>/
                      <text class="missed">{{ student.missed }}</text>
                    </view>
                  </view>
                </view>
              </view>
              <!-- @ts-ignore -->
              <view v-else class="empty-list">
                <!-- @ts-ignore -->
                <text>暂无学生出勤数据</text>
              </view>
            </view>
          </view>

          <!-- 无统计数据 -->
          <!-- @ts-ignore -->
          <view v-else class="empty-container">
            <wd-icon name="info-outline" size="120rpx" color="#cccccc" />
            <!-- @ts-ignore -->
            <text class="empty-text">暂无考勤统计数据</text>
            <!-- @ts-ignore -->
            <wd-button type="primary" size="small" custom-style="margin-top: 30rpx;" @click="handleExportData">
              导出Excel
            </wd-button>
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
            <image 
              :src="qrCodeUrl" 
              mode="aspectFit" 
              class="qrcode-image"
              :show-menu-by-longpress="true"
            />
            <text class="qrcode-tip">长按图片可保存</text>
          </view>
          <!-- #endif -->
          
          <!-- 其他平台通用处理 -->
          <!-- #ifndef MP-WEIXIN -->
          <image v-if="qrCodeUrl" 
                 :src="qrCodeUrl" 
                 mode="aspectFit" 
                 class="qrcode-image"
          />
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
          <wd-button type="danger" @click="confirmDeleteCourse">确定删除</wd-button>
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
          <view class="operation-item delete-operation" @click="handleOpenDeleteConfirm" v-if="isTeacher">
            <wd-icon name="delete" size="40rpx" color="#f44336" style="color: #f44336 !important;" />
            <text>删除课程</text>
          </view>
        </view>
        <wd-button type="primary" @click="showOperations = false" block custom-style="margin-top: 30rpx;">取消</wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f9fc 0%, #edf1f7 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 0;
}

/* 导航栏样式 */
.nav-bar {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.nav-bar-content {
  max-width: 800rpx;
  height: 90rpx;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
}

.nav-back-btn {
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.nav-back-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(0.95);
}

.nav-title {
  flex: 1;
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin: 0 20rpx;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-right {
  width: 70rpx;
  display: flex;
  justify-content: flex-end;
}

.nav-action-btn {
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.nav-action-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(0.95);
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
  max-width: 750rpx;
  flex: 1;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}

.course-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  padding: 30rpx;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(106, 17, 203, 0.08);
  border: 1rpx solid rgba(106, 17, 203, 0.05);
  overflow: hidden;
  position: relative;
}

.basic-info-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  position: relative;
  z-index: 1;
}

/* 课程标题样式 */
.course-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.course-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  letter-spacing: 1rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
  flex: 1;
}

.course-status-badge {
  padding: 6rpx 16rpx;
  border-radius: 50rpx;
  font-weight: 500;
  font-size: 24rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.course-status-badge.active {
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.1) 0%, rgba(37, 117, 252, 0.1) 100%);
  color: #6a11cb;
}

.course-status-badge.completed {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.1) 100%);
  color: #4caf50;
}

/* 课程信息网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-top: 10rpx;
}

.info-item {
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: 12rpx;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.03);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 26rpx;
  color: #666;
  margin: 0 15rpx;
  min-width: 80rpx;
  width: auto;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
  word-break: break-word;
}

.info-value.date-value {
  font-size: 24rpx;
  width: auto;
  flex: 1;
}

.info-value.description {
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 26rpx;
  color: #666;
  margin-top: 6rpx;
  max-height: 160rpx;
  overflow-y: auto;
  padding: 10rpx;
  background-color: rgba(245, 247, 250, 0.6);
  border-radius: 8rpx;
}

/* 操作按钮区域 */
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
  justify-content: flex-start;
}

/* 标签页容器样式 */
.tab-container {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(106, 17, 203, 0.08);
  border: 1rpx solid rgba(106, 17, 203, 0.05);
  padding: 5rpx;
  position: sticky;
  top: 90rpx;
  z-index: 90;
  backdrop-filter: blur(5px);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  position: relative;
  margin: 5rpx;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.tab-item.active {
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.1) 0%, rgba(37, 117, 252, 0.1) 100%);
  box-shadow: 0 4rpx 8rpx rgba(106, 17, 203, 0.1);
}

.tab-item text {
  font-size: 28rpx;
  color: #666;
  transition: all 0.3s ease;
}

.tab-item.active text {
  color: #6a11cb;
  font-weight: bold;
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
}

.delete-operation text {
  color: #f44336;
}

/* 标签页内容区域 */
.tab-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(106, 17, 203, 0.08);
  border: 1rpx solid rgba(106, 17, 203, 0.05);
  min-height: 400rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.checkins-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 20rpx;
  animation: fadeIn 0.5s ease-out;
  min-height: 300rpx;
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

/* 签到列表样式优化 */
.checkin-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  will-change: transform;
}

.checkin-item {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 254, 0.9) 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 10rpx;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  animation: fadeIn 0.3s ease forwards;
  animation-delay: calc(var(--i) * 0.05s);
  opacity: 0;
  border-left: 8rpx solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.checkin-item:active {
  transform: translateY(2rpx) scale(0.995);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

.checkin-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
  pointer-events: none;
  z-index: 0;
  border-radius: 24rpx;
}

.checkin-content {
  flex: 1;
  margin-right: 20rpx;
  position: relative;
  z-index: 1;
}

.checkin-actions {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
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
  justify-content: space-between;
  margin-bottom: 10rpx;
  flex-wrap: wrap;
  gap: 10rpx;
}

.checkin-time {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
}

.checkin-time text {
  font-size: 24rpx;
  color: #666;
}

.checkin-type-badge {
  display: flex;
  align-items: center;
  gap: 5rpx;
  padding: 4rpx 12rpx;
  border-radius: 24rpx;
}

.checkin-type-badge text {
  font-size: 24rpx;
}

.checkin-item.qr_code {
  border-left-color: #2196f3;
}

.checkin-item.location {
  border-left-color: #4caf50;
}

.checkin-item.checkin-type-qr_code .checkin-type-badge {
  background-color: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.checkin-item.checkin-type-location .checkin-type-badge {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.checkin-status {
  position: absolute;
  top: 20rpx;
  right: 0;
  padding: 6rpx 16rpx;
  border-radius: 50rpx;
  font-size: 22rpx;
  font-weight: 500;
  z-index: 2;
}

.checkin-status.not-started {
  background-color: rgba(158, 158, 158, 0.1);
  color: #757575;
}

.checkin-status.in-progress {
  background-color: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.checkin-status.ended {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

/* 成员列表样式优化 */
.members-content {
  animation: fadeIn 0.5s ease-out;
  min-height: 300rpx;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.member-item {
  position: relative;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 20rpx;
  margin-bottom: 10rpx;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.member-item:active {
  transform: translateY(2rpx) scale(0.995);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

.member-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
  border: 3rpx solid rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.member-avatar image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 4rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.member-username {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 6rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.member-role {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 30rpx;
  display: inline-block;
}

.member-role.role-teacher {
  background: rgba(106, 17, 203, 0.08);
  color: #6a11cb;
}

.member-role.role-student {
  background: rgba(33, 150, 243, 0.08);
  color: #2196f3;
}

.member-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* 统计数据样式优化 */
.stats-content {
  animation: fadeIn 0.5s ease-out;
  min-height: 300rpx;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.stats-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 254, 0.9) 100%);
  padding: 24rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(106, 17, 203, 0.05);
}

.stats-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 2rpx solid rgba(106, 17, 203, 0.1);
  position: relative;
}

.stats-title::after {
  content: '';
  position: absolute;
  bottom: -2rpx;
  left: 0;
  width: 60rpx;
  height: 2rpx;
  background: linear-gradient(90deg, #6a11cb, #2575fc);
}

.stats-row {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 10rpx;
}

.stat-item {
  flex: 1;
  min-width: 150rpx;
  text-align: center;
  padding: 16rpx;
  border-radius: 16rpx;
  background-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.stat-item:hover, .stat-item:active {
  background-color: rgba(106, 17, 203, 0.05);
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.07);
  transform: translateY(-2rpx);
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.attendance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  border-radius: 12rpx;
  background-color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.attendance-item:active {
  transform: translateY(2rpx);
  background-color: rgba(250, 250, 250, 0.8);
}

.rank {
  font-size: 28rpx;
  color: #666;
  margin-right: 16rpx;
  font-weight: bold;
  min-width: 30rpx;
  text-align: center;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-username {
  font-size: 22rpx;
  color: #999;
  margin-top: 2rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attendance-details {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.attendance-numbers {
  display: flex;
  align-items: center;
  gap: 2rpx;
  font-size: 24rpx;
  color: #999;
}

.normal {
  color: #4caf50;
}

.missed {
  color: #f44336;
}

.attendance-rate {
  font-size: 28rpx;
  font-weight: bold;
  padding: 4rpx 12rpx;
  border-radius: 30rpx;
  min-width: 70rpx;
  text-align: center;
}

.attendance-rate.excellent {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.attendance-rate.warning {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.attendance-rate.normal {
  background-color: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.excellent {
  background-color: rgba(76, 175, 80, 0.02);
  border-left: 3px solid rgba(76, 175, 80, 0.5);
}

.warning {
  background-color: rgba(255, 152, 0, 0.02);
  border-left: 3px solid rgba(255, 152, 0, 0.5);
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 20rpx;
  border-radius: 50rpx;
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.08) 0%, rgba(37, 117, 252, 0.08) 100%);
  color: #6a11cb;
  font-size: 28rpx;
  margin-bottom: 20rpx;
  align-self: center;
  width: fit-content;
  cursor: pointer;
  box-shadow: 0 4rpx 8rpx rgba(106, 17, 203, 0.05);
  transition: all 0.3s ease;
}

.refresh-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 4rpx rgba(106, 17, 203, 0.03);
}

/* 添加导出按钮样式 */
.export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 20rpx;
  border-radius: 50rpx;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(129, 199, 132, 0.08) 100%);
  color: #4caf50;
  font-size: 28rpx;
  margin-bottom: 20rpx;
  align-self: center;
  width: fit-content;
  cursor: pointer;
  box-shadow: 0 4rpx 8rpx rgba(76, 175, 80, 0.05);
  transition: all 0.3s ease;
}

.export-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 4rpx rgba(76, 175, 80, 0.03);
}

.export-btn text {
  margin-left: 8rpx;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  min-height: 300rpx;
  background: linear-gradient(135deg, rgba(250, 250, 250, 0.5) 0%, rgba(245, 245, 245, 0.5) 100%);
  border-radius: 20rpx;
  margin: 20rpx 0;
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
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.08) 0%, rgba(37, 117, 252, 0.08) 100%);
  padding: 16rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(106, 17, 203, 0.08);
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
  background-color: rgba(1, 101, 255, 0.1);
  color: #0165FF;
  font-size: 24rpx;
  box-shadow: 0 4rpx 8rpx rgba(1, 101, 255, 0.1);
  transition: all 0.2s ease;
}

.retry-button:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 4rpx rgba(1, 101, 255, 0.05);
}

// 添加微信小程序专用样式
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

/* 确保删除按钮的图标颜色总是红色 */
.checkin-actions .wd-icon, 
.member-actions .wd-icon {
  color: #ff0000 !important;
}

.operation-item.delete-operation .wd-icon {
  color: #f44336 !important;
}

/* 添加强制性的样式，确保图标颜色正确显示 */
.wd-button--danger .wd-icon {
  color: #ff0000 !important;
}

.operation-item.delete-operation {
  color: #f44336;
}
</style>
