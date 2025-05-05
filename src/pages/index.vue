<!--
 * @Author: weisheng
 * @Date: 2025-04-06 10:00:00
 * @LastEditTime: 2025-04-13 14:30:00
 * @LastEditors: weisheng
 * @Description: 首页
 * @FilePath: \wot-demo\src\pages\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { getCourseList } from '@/api/courses'
import { getCheckinList, submitCheckin, CheckInType } from '@/api/attendance'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { formatDate } from '@/utils/dateTime'
import { useThemeStore } from '@/store/theme'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 声明 uni 全局属性类型
declare global {
  interface Window {
    uni: typeof uni
  }
}

const userStore = useUserStore()
const themeStore = useThemeStore()
const activeTab = ref<'active' | 'all'>('active')
const activeCourseCount = ref(0)
const allCourseCount = ref(0)
const coursesLoading = ref(true)
const allCoursesLoading = ref(true)
const activeCourses = ref<any[]>([])
const allCourses = ref<any[]>([])
const otherCourses = ref<any[]>([])

// 分页加载相关
const courses = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasMoreCourses = ref(true)
const currentPage = ref(0)

// 计算属性：用户身份
const isTeacher = computed(() => userStore.userInfo?.role === 'TEACHER')
const isStudent = computed(() => userStore.userInfo?.role === 'STUDENT')

// 初始化
onMounted(async () => {
  // 检查登录状态
  await checkLoginStatus()
})

// 在uni-app的onShow生命周期中加载数据
onShow(() => {
  checkLoginStatus().then(isLoggedIn => {
    if (isLoggedIn) {
      loadCourseData()
    }
  })
  themeStore.updateSystemUITheme()
})

// 检查登录状态
async function checkLoginStatus() {
  try {
    const token = getSafeUni().getStorageSync('token')

    if (!token) {
      // 没有token，跳转到登录页
      redirectToLogin()
      return false
    }

    // 已有token，检查是否有用户信息
    if (!userStore.isLoggedIn) {
      // 尝试获取用户信息
      const success = await userStore.getUserInfo()

      if (!success) {
        // 获取用户信息失败，可能是token已过期
        console.log('自动登录失败，token可能已过期')
        redirectToLogin()
        return false
      }
    }

    return true
  } catch (e) {
    console.error('检查登录状态失败:', e)
    redirectToLogin()
    return false
  }
}

// 重定向到登录页
function redirectToLogin() {
  getSafeUni().navigateTo({
    url: '/pages/login/index'
  })
}

// 加载课程数据
async function loadCourseData() {
  // 确保已登录
  const isLoggedIn = await checkLoginStatus()
  if (!isLoggedIn) return

  try {
    loading.value = true
    coursesLoading.value = true

    // 调用真实API获取课程列表
    const response = await getCourseList({
      page: 0,
      size: 50,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
      filters: {}
    })

    if (response && typeof response === 'object' && 'code' in response && response.code === 200) {
      // 使用类型断言处理响应数据
      const apiResponse = response as { code: number; data: any; message: string }
      const data = apiResponse.data || {}
      
      // 确保courses是数组
      courses.value = Array.isArray(data.courses) ? data.courses : []
      console.log('获取到课程数据:', courses.value)

      // 根据课程状态分类
      activeCourses.value = courses.value.filter((course) => course.status === 'ACTIVE')
      allCourses.value = courses.value // 所有课程

      // 更新计数
      activeCourseCount.value = activeCourses.value.length
      allCourseCount.value = allCourses.value.length
      
      // 更新分页状态
      hasMoreCourses.value = data.totalItems > courses.value.length
      currentPage.value = data.currentPage || 0
    } else {
      console.error('获取课程数据失败:', response)
      getSafeUni().showToast({
        title: '获取课程数据失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('加载课程数据错误:', error)
    getSafeUni().showToast({
      title: '网络错误，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
    coursesLoading.value = false
    refreshing.value = false
  }
}

// 显示提示
function showToast(title: string) {
  getSafeUni().showToast({
    title,
    icon: 'none'
  })
}

// 切换标签
function switchTab(tab: 'active' | 'all') {
  activeTab.value = tab
}

// 加载更多课程
function loadMoreCourses() {
  if (!hasMoreCourses.value || loading.value) return
  
  currentPage.value++
  // 这里添加加载更多课程的逻辑
  showToast('加载更多课程')
}

// 下拉刷新
function onRefresh() {
  refreshing.value = true
  loadCourseData().finally(() => {
    refreshing.value = false
  })
}

// 刷新数据
function refreshData() {
  loadCourseData()
}

// 创建课程（老师）
function createCourse() {
  getSafeUni().navigateTo({
    url: '/pages/create-course/index'
  })
}

// 加入课程（学生）
function goToJoin() {
  getSafeUni().navigateTo({
    url: '/pages/join-course/index'
  })
}

// 查看课程详情
function goToCourseDetail(course) {
  // 获取课程的签到任务
  getCheckinList(course.id, {
    page: 0,
    size: 50,
    sort: [{ field: 'createdAt', direction: 'DESC' }],
    filters: {}
  }).then(response => {
    if (response && response.code === 200) {
      // 将课程基本信息和签到数据一起通过路由传递给详情页
      const courseData = encodeURIComponent(JSON.stringify({
        course: {
          id: course.id,
          name: course.name,
          description: course.description,
          creatorId: course.creatorId,
          creatorFullName: course.creatorFullName,
          creatorUsername: course.creatorUsername,
          code: course.code,
          status: course.status,
          memberCount: course.memberCount || 0,
          startDate: course.startDate,
          endDate: course.endDate
        },
        checkinData: response.data
      }))

      getSafeUni().navigateTo({
        url: `/pages/course-detail/index?courseData=${courseData}`
      })
    } else {
      // 如果获取签到数据失败，仅传递课程信息
      const courseInfo = encodeURIComponent(JSON.stringify({
        id: course.id,
        name: course.name,
        description: course.description,
        creatorId: course.creatorId,
        creatorFullName: course.creatorFullName,
        creatorUsername: course.creatorUsername,
        code: course.code,
        status: course.status,
        memberCount: course.memberCount || 0,
        startDate: course.startDate,
        endDate: course.endDate
      }))

      getSafeUni().navigateTo({
        url: `/pages/course-detail/index?courseInfo=${courseInfo}`
      })
    }
  }).catch(error => {
    console.error('获取签到数据失败:', error)
    // 出错时仅传递课程信息
    const courseInfo = encodeURIComponent(JSON.stringify({
      id: course.id,
      name: course.name,
      description: course.description,
      creatorId: course.creatorId,
      creatorFullName: course.creatorFullName,
      creatorUsername: course.creatorUsername,
      code: course.code,
      status: course.status,
      memberCount: course.memberCount || 0,
      startDate: course.startDate,
      endDate: course.endDate
    }))

    getSafeUni().navigateTo({
      url: `/pages/course-detail/index?courseInfo=${courseInfo}`
    })
  })
}

// 审批课程
function approveCourse(course) {
  // 实现课程审批逻辑
  showToast('审批课程' + course.id)
}

// 拒绝课程
function rejectCourse(course) {
  // 实现拒绝课程逻辑
  showToast('拒绝课程' + course.id)
}

// 格式化日期
function formatDay(schedule) {
  if (!schedule) return '未设置'
  
  // 如果有startDate字段，尝试格式化显示日期
  if (typeof schedule === 'object' && schedule.startDate) {
    try {
      const date = new Date(schedule.startDate)
      return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'
    } catch (e) {
      console.error('日期格式化失败:', e)
    }
  }
  
  // 处理字符串格式的日期
  if (typeof schedule === 'string' && schedule.includes('-')) {
    try {
      const dateParts = schedule.split('-')
      if (dateParts.length >= 3) {
        return `${dateParts[0]}年${dateParts[1]}月${dateParts[2].substring(0, 2)}日`
      }
    } catch (e) {
      console.error('日期字符串格式化失败:', e)
    }
  }
  
  return '每周一三五' // 默认显示
}

// 格式化时间
function formatTime(schedule) {
  if (!schedule) return '未设置'
  
  // 处理有上课时间信息的情况
  if (typeof schedule === 'object' && schedule.startTime && schedule.endTime) {
    return `${schedule.startTime}-${schedule.endTime}`
  }
  
  // 处理字符串格式的时间
  if (typeof schedule === 'string' && schedule.includes(':')) {
    try {
      const timeParts = schedule.split(' ')
      if (timeParts.length >= 2) {
        return timeParts[1]
      }
    } catch (e) {
      console.error('时间字符串格式化失败:', e)
    }
  }
  
  return '10:00-11:40' // 默认显示
}

// 打开扫码页面 - 专门用于学生签到
function openScanner() {
  // 只有学生可以使用签到扫码功能
  if (!isStudent.value) {
    getSafeUni().showToast({
      title: '只有学生可以使用该功能',
      icon: 'none'
    })
    return
  }

  getSafeUni().scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success: (res) => {
      try {
        console.log('扫码结果:', res.result)
        // 提示用户扫码成功
        getSafeUni().showToast({
          title: '扫码成功',
          icon: 'success',
          duration: 1000
        })

        // 尝试从二维码获取签到码和任务ID
        processCheckInQRCode(res.result)
      } catch (e) {
        console.error('处理扫码结果失败', e)
        getSafeUni().showToast({
          title: '二维码解析失败',
          icon: 'none',
          duration: 1500
        })
      }
    },
    fail: (err) => {
      console.error('扫码失败', err)
      getSafeUni().showToast({
        title: '扫码取消或失败',
        icon: 'none'
      })
    }
  })
}

// 处理签到二维码
async function processCheckInQRCode(qrContent) {
  // 获取设备信息
  const deviceInfo = getSafeUni().getSystemInfoSync()
  const deviceModel = deviceInfo.model || '设备不明'

  // 准备API调用参数
  const params = {
    checkinId: qrContent,                   // 使用checkinId而非taskId
    verifyMethod: CheckInType.QR_CODE,                 // 使用扫码结果作为verifyData
    device: deviceModel,                    // 设备信息
  }
  console.log('签到API参数:', params)

  try {
    // 使用封装好的 API 进行签到
    const response = await submitCheckin(params)
    if (response.code === 200) {
      getSafeUni().showToast({
        title: response.message,
        icon: 'success',
        duration: 1500
      })
    } else {
      getSafeUni().showToast({
        title: response.message || '签到失败',
        icon: 'error'
      })
    }
  } catch (error) {
    console.error('签到失败:', error)
    getSafeUni().hideLoading()
    getSafeUni().showToast({
      title: '签到失败，请重试',
      icon: 'none'
    })
  }
  // 延迟后刷新当前页面
  setTimeout(() => {
    // 刷新当前页面数据
    refreshData()
  }, 1000)
}

</script>

<template>
  <view class="container" :class="{'wot-theme-dark': themeStore.isDarkMode}">
    <view class="header">
      <view class="header-title">我的课程</view>
      <view class="header-action">
        <view 
          class="search-button" 
          v-if="isTeacher" 
          @click="createCourse"
        >
          <wd-icon name="add" size="40rpx" />
        </view>
        <view 
          class="search-button" 
          v-if="isStudent" 
          @click="openScanner"
        >
          <wd-icon name="scan" size="40rpx" />
        </view>
        <view 
          class="search-button" 
          v-if="isStudent" 
          @click="goToJoin"
        >
          <wd-icon name="add" size="40rpx" />
        </view>
        <view class="search-button" @click="refreshData">
          <wd-icon name="refresh" size="40rpx" />
        </view>
      </view>
    </view>
    
    <view class="tab-container">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'active' }" 
        @click="switchTab('active')"
      >
        进行中
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'all' }" 
        @click="switchTab('all')"
      >
        全部
      </view>
    </view>
    
    <!-- 内容区 -->
    <scroll-view 
      class="content-container" 
      scroll-y 
      @scrolltolower="loadMoreCourses"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 加载中 -->
      <view class="loading-container" v-if="loading && !courses.length">
        <wd-loading color="#ff6b00" />
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 无数据 -->
      <view class="empty-container" v-else-if="!loading && !courses.length">
        <wd-icon name="setting-o" size="120rpx" color="#CCCCCC" />
        <text class="empty-text">暂无{{ isTeacher ? '教授' : '参与'}}的课程</text>
        <wd-button 
          v-if="isStudent" 
          type="primary" 
          size="small" 
          @click="goToJoin"
        >
          加入课程
        </wd-button>
      </view>
      
      <!-- 课程列表 -->
      <view class="course-list" v-else>
        <view 
          class="course-card"
          v-for="(course, index) in activeTab === 'active' ? activeCourses : allCourses" 
          :key="course.id" 
          @click="goToCourseDetail(course)"
        >
          <view 
            class="course-card-bg" 
            :style="{ 
              opacity: themeStore.isDarkMode ? 0.85 : 0.95 
            }"
          ></view>
          <view class="course-card-content">
            <view class="course-name">{{ course.name }}</view>
            <view class="course-detail">
              <view class="course-detail-item">
                <wd-icon name="calendar" size="32rpx" color="#ffffff" />
                <text>{{ course.startDate ? formatDay(course.startDate) : '未设置' }}</text>
              </view>
              <view class="course-detail-item">
                <wd-icon name="time" size="32rpx" color="#ffffff" />
                <text>{{ course.endDate ? formatDay(course.endDate) : '未设置' }}</text>
              </view>
            </view>
            <view class="course-description" v-if="course.description">
              <wd-icon name="info" size="32rpx" color="#ffffff" />
              <text>{{ course.description }}</text>
            </view>
            <view class="course-teacher" v-if="isStudent && course.creatorFullName">
              <wd-icon name="user" size="32rpx" color="#ffffff" />
              <text>{{ course.creatorFullName || '未知教师' }}</text>
            </view>
            <view class="course-members" v-if="isTeacher && course.memberCount">
              <wd-icon name="user-group" size="32rpx" color="#ffffff" />
              <text>{{ course.memberCount || 0 }}人</text>
            </view>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="hasMoreCourses && !loading">
          <wd-button 
            size="small" 
            type="info" 
            @click="loadMoreCourses"
          >
            加载更多
          </wd-button>
        </view>
        
        <view class="loading-more" v-if="loading && courses.length">
          <wd-loading color="#ff6b00" />
          <text>加载中...</text>
        </view>
        
        <view class="no-more" v-if="!hasMoreCourses && courses.length && !loading">
          <text>—— 已经到底了 ——</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: var(--background-color-primary, #f5f5f5);
  color: var(--text-color-primary, #303133);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.wot-theme-dark {
  .header-title {
    color: #ffffff !important;
  }
  
  .tab-item {
    color: #a3a6ad !important;
    
    &.active {
      color: #ffffff !important;
      &::after {
        background-color: #ff8800 !important;
      }
    }
  }
  
  .empty-text, .loading-text, .no-more text {
    color: #a3a6ad !important;
  }
}

.header {
  width: 100%;
  max-width: 700rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx 20rpx;
  box-sizing: border-box;

  &-title {
    font-size: 40rpx;
    font-weight: bold;
    color: var(--text-color-primary, #303133);
  }

  &-action {
    display: flex;
    align-items: center;
  }
}

.search-button {
  width: 70rpx;
  height: 70rpx;
  background-color: rgba(255, 107, 0, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
  transition: all 0.2s ease;
  
  &:active {
    background-color: rgba(255, 107, 0, 0.2);
  }
  
  .wd-icon {
    color: #ff6b00;
  }
}

.tab-container {
  width: 100%;
  max-width: 700rpx;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}

.tab-item {
  position: relative;
  padding: 16rpx 30rpx;
  font-size: 30rpx;
  color: var(--text-color-secondary, #606266);
  transition: all 0.3s ease;
  
  &.active {
    color: var(--primary-color, #ff6b00);
    font-weight: bold;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 30rpx;
      right: 30rpx;
      height: 6rpx;
      background-color: var(--primary-color, #ff6b00);
      border-radius: 3rpx;
    }
  }
}

.content-container {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 20rpx 30rpx;
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading-text, .empty-text {
  margin-top: 30rpx;
  font-size: 28rpx;
  color: var(--text-color-tertiary, #909399);
}

.empty-container wd-button {
  margin-top: 30rpx;
}

.course-list {
  width: 100%;
}

.course-card {
  position: relative;
  width: 100%;
  border-radius: 20rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.15);
  }
}

.wot-theme-dark .course-card {
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.25);
}

.course-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  transition: all 0.4s ease;
  background-size: cover;
  background-position: center;
  opacity: 0.95;
  background-image: linear-gradient(135deg, #6366F1 0%, #3B82F6 100%);
}

.wot-theme-dark .course-card-bg {
  opacity: 0.85;
  background-image: linear-gradient(135deg, #4338CA 0%, #2563EB 100%);
}

.course-card-content {
  position: relative;
  z-index: 2;
  padding: 30rpx;
  color: #ffffff;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%);
  height: 100%;
}

.wot-theme-dark .course-card-content {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%);
}

.course-name {
  font-size: 38rpx;
  font-weight: bold;
  margin-bottom: 24rpx;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-detail {
  display: flex;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
  gap: 16rpx;
}

.course-detail-item {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 8rpx 16rpx;
  border-radius: 30rpx;
  backdrop-filter: blur(5rpx);
  
  text {
    margin-left: 8rpx;
    font-size: 24rpx;
    font-weight: 500;
  }
}

.course-teacher, .course-members, .course-description, .course-code {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  
  text {
    margin-left: 10rpx;
    font-size: 26rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400rpx;
  }
}

.course-description {
  margin-top: 14rpx;
  margin-bottom: 14rpx;
  padding: 10rpx 16rpx;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  backdrop-filter: blur(5rpx);
  
  text {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
  }
}

.course-code {
  margin-top: 14rpx;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
  display: inline-flex;
  backdrop-filter: blur(5rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  
  text {
    font-weight: 500;
  }
}

.course-status {
  position: relative;
  z-index: 2;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5rpx);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.wot-theme-dark .course-status {
  background-color: rgba(30, 30, 30, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.load-more, .loading-more, .no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx 0;
}

.loading-more {
  text {
    margin-left: 16rpx;
    font-size: 26rpx;
    color: var(--text-color-tertiary, #909399);
  }
}

.no-more {
  font-size: 26rpx;
  color: var(--text-color-tertiary, #909399);
}
</style>

<route lang="json">{
  "navigationBarTitleText": "课程考勤"
}</route>
