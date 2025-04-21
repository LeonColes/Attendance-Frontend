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
import { CheckInType, getCheckinList } from '@/api/attendance'
import { getCourseMemberList, getCourseQRCode } from '@/api/courses'
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

    // 如果是教师，自动获取课程二维码
    if (isTeacher.value) {
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

// 加载课程成员列表
async function loadCourseMembers(showLoading: boolean = false) {
  try {
    if (showLoading) {
      loading.value = true
    }

    const params: PageQueryParams = {
      page: 0,
      size: 100 // 获取足够多的成员数据
    }

    const response = await getCourseMemberList(courseId.value, params)

    if (response && response.code === 200) {
      // 检查数据结构，适配 users 字段
      if (response.data.users && Array.isArray(response.data.users)) {
        membersList.value = response.data.users.map((user: any) => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role || 'STUDENT',
          joinTime: user.joinTime || new Date().toISOString(),
          avatarUrl: user.avatarUrl
        }))
      } else if ((response.data as any).items && Array.isArray((response.data as any).items)) {
        // 原来的结构，使用类型断言
        membersList.value = (response.data as any).items
      } else {
        membersList.value = []
      }

      console.log('成员列表加载成功:', membersList.value)
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
  activeTab.value = tab
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

// 计算签到状态
function getCheckinStatus(checkin: any) {
  if (!checkin) return ''

  const now = new Date().getTime()
  const startTime = new Date(checkin.checkinStartTime).getTime()
  const endTime = new Date(checkin.checkinEndTime).getTime()

  if (now < startTime) {
    return 'not-started'
  } else if (now > endTime) {
    return 'ended'
  } else {
    return 'in-progress'
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

// 添加获取课程二维码的函数
async function loadCourseQRCode() {
  if (!courseId.value || !isTeacher.value) return

  try {
    qrCodeLoading.value = true
    // 调用已封装好的API
    const response = await getCourseQRCode(courseId.value)
    if (!response) {
      console.error('二维码数据为空')
      getSafeUni().showToast({
        title: '获取二维码失败',
        icon: 'none'
      })
      return
    }

    // 使用 uni.arrayBufferToBase64 直接转换
    const base64 = uni.arrayBufferToBase64(response)
    qrCodeUrl.value = `data:image/png;base64,${base64}`

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
}

// 关闭二维码弹窗
function closeQRCodeModal() {
  showQRCode.value = false
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
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 加载中 -->
    <!-- @ts-ignore -->
    <view v-if="loading" class="loading-container">
      <wd-loading color="#6a11cb" size="80rpx" />
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
          <!-- @ts-ignore -->
          <view class="info-row">
            <wd-icon name="user" size="32rpx" color="#6a11cb" />
            <!-- @ts-ignore -->
            <view class="info-label">教师</view>
            <!-- @ts-ignore -->
            <view class="info-value">{{ courseDetail.creatorFullName || courseDetail.creatorUsername || '未知教师' }}</view>
          </view>

          <!-- @ts-ignore -->
          <view class="info-row">
            <wd-icon name="people" size="32rpx" color="#6a11cb" />
            <!-- @ts-ignore -->
            <view class="info-label">人数</view>
            <!-- @ts-ignore -->
            <view class="info-value">{{ courseDetail.memberCount || 0 }}人</view>
          </view>

          <!-- @ts-ignore -->
          <view class="info-row">
            <wd-icon name="calendar" size="32rpx" color="#6a11cb" />
            <!-- @ts-ignore -->
            <view class="info-label">时间</view>
            <!-- @ts-ignore -->
            <view class="info-value">{{ formatDateTime(courseDetail.startDate) }} ~ {{
              formatDateTime(courseDetail.endDate) }}</view>
          </view>

          <!-- 移动详细信息到此处 -->
          <!-- @ts-ignore -->
          <view class="info-row">
            <wd-icon name="info-outline" size="32rpx" color="#6a11cb" />
            <!-- @ts-ignore -->
            <view class="info-label">描述</view>
            <!-- @ts-ignore -->
            <view class="info-value description">{{ courseDetail.description || '暂无课程描述' }}</view>
          </view>

          <!-- @ts-ignore -->
          <view class="info-row">
            <wd-icon name="info" size="32rpx" color="#6a11cb" />
            <!-- @ts-ignore -->
            <view class="info-label">状态</view>
            <!-- @ts-ignore -->
            <view class="info-value status" :class="courseDetail.status?.toLowerCase()">
              {{ courseDetail.status === 'ACTIVE' ? '进行中' :
                courseDetail.status === 'COMPLETED' ? '已结课' : '未知状态' }}
            </view>
          </view>

          <!-- 添加创建签到按钮 -->
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
          </view>
        </view>
      </view>

      <!-- 标签页 -->
      <!-- @ts-ignore -->
      <view class="tab-container">
        <!-- 移除 "详细信息" 标签页 -->
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
            <view v-for="checkin in checkinList" :key="checkin.id" class="checkin-item"
              @click="handleCheckinClick(checkin)">
              <!-- @ts-ignore -->
              <view class="checkin-title">{{ checkin.name }}</view>
              <!-- @ts-ignore -->
              <view class="checkin-time">
                <wd-icon name="time" size="28rpx" color="#666" />
                <!-- @ts-ignore -->
                <text>{{ formatDateTime(checkin.checkinStartTime || checkin.startTime) }} ~ {{
                  formatDateTime(checkin.checkinEndTime || checkin.endTime) }}</text>
              </view>
              <!-- @ts-ignore -->
              <view class="checkin-type">
                <wd-icon name="scan" size="28rpx" color="#666" />
                <!-- @ts-ignore -->
                <text>{{ getCheckinTypeText(checkin.checkinType) }}</text>
              </view>
              <!-- @ts-ignore -->
              <view class="checkin-status" :class="getCheckinStatus(checkin)">
                {{ getCheckinStatus(checkin) === 'not-started' ? '未开始' :
                  getCheckinStatus(checkin) === 'in-progress' ? '进行中' : '已结束' }}
              </view>

              <!-- 学生端显示签到状态 -->
              <!-- @ts-ignore -->
              <view v-if="isStudent && checkin.attendanceStatus" class="attendance-status"
                :class="checkin.attendanceStatus.toLowerCase()">
                {{ checkin.attendanceStatus === 'CHECKED_IN' ? '已签到' :
                  checkin.attendanceStatus === 'LATE' ? '迟到' :
                    checkin.attendanceStatus === 'ABSENT' ? '缺勤' :
                      checkin.attendanceStatus === 'NOT_STARTED' ? '未开始' : '未签到' }}
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
                <view class="member-role">{{ member.role === 'TEACHER' ? '教师' : '学生' }}</view>
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
            <!-- 刷新按钮 -->
            <!-- @ts-ignore -->
            <view class="refresh-btn" @click="loadCourseAttendanceStats">
              <wd-icon name="refresh" size="28rpx" color="#6a11cb" />
              <text>刷新数据</text>
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
            <wd-button type="primary" size="small" custom-style="margin-top: 30rpx;" @click="loadCourseAttendanceStats">
              刷新数据
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
          <image v-if="qrCodeUrl" :src="qrCodeUrl" mode="aspectFit" class="qrcode-image" />
          <view v-else-if="qrCodeLoading" class="qrcode-loading">
            <wd-loading size="60rpx" />
            <text>获取二维码中...</text>
          </view>
          <view v-else class="qrcode-error">
            <wd-icon name="warning" size="60rpx" color="#f56c6c" />
            <text>获取二维码失败</text>
          </view>
          <!-- {{ qrCodeUrl }} -->
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
  </view>
</template>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20rpx;
  /* 减少顶部间距 */
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
}

.content-container {
  width: 100%;
  max-width: 700rpx;
  flex: 1;
  padding: 0 30rpx;
  box-sizing: border-box;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.course-header {
  background-color: #fff;
  padding: 25rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.basic-info-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
}

.info-label {
  font-size: 28rpx;
  color: #666;
  margin: 0 15rpx;
  min-width: 80rpx;
  width: auto;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.info-value.description {
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 26rpx;
  color: #666;
  margin-top: 6rpx;
  max-height: 120rpx;
  overflow-y: auto;
}

.info-value.code {
  color: #6a11cb;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.info-value.status {
  padding: 6rpx 16rpx;
  border-radius: 50rpx;
  display: inline-block;
}

.info-value.status.active {
  background-color: rgba(106, 17, 203, 0.1);
  color: #6a11cb;
}

.info-value.status.completed {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.tab-container {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  padding: 10rpx 20rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  position: relative;
  border-bottom: 6rpx solid transparent;
}

.tab-item.active {
  border-bottom-color: #6a11cb;
}

.tab-item text {
  font-size: 28rpx;
  color: #666;
}

.tab-item.active text {
  color: #6a11cb;
  font-weight: bold;
}

.tab-content {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  min-height: 600rpx;
}

.checkins-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.checkin-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.checkin-item {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 10rpx;
  position: relative;
}

.checkin-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.checkin-time,
.checkin-type {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.checkin-time text,
.checkin-type text {
  font-size: 26rpx;
  color: #666;
}

.checkin-status {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 50rpx;
  font-size: 24rpx;
}

.checkin-status.not-started {
  background-color: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.checkin-status.in-progress {
  background-color: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.checkin-status.ended {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.attendance-status {
  position: absolute;
  bottom: 20rpx;
  right: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 50rpx;
  font-size: 24rpx;
}

.attendance-status.checked_in,
.attendance-status.normal {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.attendance-status.late {
  background-color: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.attendance-status.absent,
.attendance-status.missed {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.attendance-status.not_started,
.attendance-status.pending {
  background-color: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 10rpx;
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20rpx;
}

.member-avatar image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}

.member-username {
  font-size: 22rpx;
  color: #999;
  margin-top: 2rpx;
  margin-bottom: 2rpx;
}

.member-role {
  font-size: 24rpx;
  color: #666;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.stats-card {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 10rpx;
}

.stats-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 2rpx solid #eee;
}

.stats-row {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #6a11cb;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.attendance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 0;
  border-bottom: 2rpx solid #eee;
}

.rank {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.student-info {
  flex: 1;
}

.student-username {
  font-size: 22rpx;
  color: #999;
  margin-top: 2rpx;
  margin-bottom: 2rpx;
}

.attendance-details {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.attendance-numbers {
  display: flex;
  align-items: center;
  gap: 5rpx;
}

.normal {
  font-size: 26rpx;
  color: #666;
}

.missed {
  font-size: 26rpx;
  color: #999;
}

.attendance-rate {
  font-size: 28rpx;
  font-weight: bold;
  padding: 4rpx 12rpx;
  border-radius: 30rpx;
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
  background-color: rgba(76, 175, 80, 0.05);
}

.warning {
  background-color: rgba(255, 152, 0, 0.05);
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 20rpx;
  border-radius: 50rpx;
  background-color: rgba(106, 17, 203, 0.1);
  color: #6a11cb;
  font-size: 28rpx;
  margin-bottom: 20rpx;
  cursor: pointer;
}

.refresh-btn:hover {
  background-color: rgba(106, 17, 203, 0.2);
}

.empty-list {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
}

.student-name {
  font-size: 28rpx;
  color: #333;
}

// 添加二维码弹窗样式
.qrcode-container {
  padding: 40rpx;

  .qrcode-header {
    text-align: center;
    margin-bottom: 30rpx;

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
  }

  .qrcode-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40rpx;

    .qrcode-image {
      width: 400rpx;
      height: 400rpx;
      margin-bottom: 20rpx;
      border: 1rpx solid #eee;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
      border-radius: 12rpx;
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

      text {
        margin-top: 20rpx;
        color: #666;
        font-size: 28rpx;
      }
    }

    .course-qrinfo {
      text-align: center;
      margin-top: 20rpx;
      background-color: rgba(106, 17, 203, 0.05);
      padding: 16rpx 30rpx;
      border-radius: 30rpx;

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
    }
  }

  .qrcode-actions {
    margin-top: 20rpx;
  }
}
</style>