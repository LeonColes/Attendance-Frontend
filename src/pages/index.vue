<!--
 * @Author: weisheng
 * @Date: 2024-11-01 11:44:38
 * @LastEditTime: 2025-01-13 16:52:01
 * @LastEditors: 810505339
 * @Description:
 * @FilePath: \wot-demo\src\pages\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { CheckInStatus, getCheckinList } from '@/api/attendance'
import { getCourseList } from '@/api/course'

// 用户信息
const userStore = useUserStore()
const role = computed(() => userStore.role)
const isTeacher = computed(() => role.value === 'TEACHER')
const isStudent = computed(() => role.value === 'STUDENT')

// 页面数据
const loading = ref(false)
const refreshing = ref(false)
const courseList = ref<any[]>([])
const attendanceStats = ref({
  total: 0,
  present: 0,
  absent: 0,
  late: 0,
  attendanceRate: 0,
})
const activeSessions = ref<any[]>([])
const showAnimations = ref(true)
const fabExpanded = ref(false)
const fabTimer = ref<any>(null)
const isScrollingDown = ref(false) // 是否向下滚动
const lastScrollTop = ref(0) // 上次滚动位置
const scrollThreshold = 50 // 滚动阈值

// 初始化数据
onMounted(() => {
  // 直接加载首页数据，token失效会由请求拦截器处理
  loadHomeData()

  // 延迟显示动画效果
  setTimeout(() => {
    showAnimations.value = true
  }, 100)
})

// 注册页面滚动事件处理
uni.$on('page-scroll', onPageScroll)

// 组件卸载时清理事件监听
onUnmounted(() => {
  uni.$off('page-scroll', onPageScroll)
  if (fabTimer.value !== null) {
    clearTimeout(fabTimer.value)
  }
})

// 处理页面滚动
function onPageScroll(e: any) {
  const scrollTop = e.scrollTop

  // 判断是否滚动超过阈值
  if (Math.abs(scrollTop - lastScrollTop.value) > scrollThreshold) {
    isScrollingDown.value = scrollTop > lastScrollTop.value
    lastScrollTop.value = scrollTop
  }

  // 如果滚动到顶部，始终显示悬浮球
  if (scrollTop < 50) {
    isScrollingDown.value = false
  }
}

// 获取系统信息 
function getSystemInfo() {
  try {
    // 使用推荐的新API
    const windowInfo = uni.getWindowInfo()
    const deviceInfo = uni.getDeviceInfo()
    const systemInfo = uni.getSystemInfoSync() // 保留部分兼容性
    
    return {
      // 设备信息
      platform: deviceInfo.platform || systemInfo.platform,
      model: deviceInfo.model || systemInfo.model,
      // 窗口信息
      screenWidth: windowInfo.screenWidth || systemInfo.screenWidth,
      screenHeight: windowInfo.screenHeight || systemInfo.screenHeight,
      windowWidth: windowInfo.windowWidth || systemInfo.windowWidth,
      windowHeight: windowInfo.windowHeight || systemInfo.windowHeight,
      statusBarHeight: windowInfo.statusBarHeight || systemInfo.statusBarHeight,
      safeArea: windowInfo.safeArea || systemInfo.safeArea,
    }
  } catch (e) {
    console.error('获取系统信息失败:', e)
    // 如果新API不可用，回退到旧API
    return uni.getSystemInfoSync()
  }
}

// 加载首页数据
async function loadHomeData() {
  try {
    loading.value = true

    // 获取课程列表
    const coursesResponse = await getCourseList({ page: 0, size: 10 })
    if (coursesResponse && coursesResponse.data) {
      courseList.value = coursesResponse.data.items || []
      
      // 如果有课程，获取第一个课程的签到任务
      if (courseList.value.length > 0) {
        const firstCourse = courseList.value[0]
        const checkinsResponse = await getCheckinList(firstCourse.id, { page: 0, size: 10 })
        
        if (checkinsResponse && checkinsResponse.data) {
          // 获取活跃签到任务
          activeSessions.value = checkinsResponse.data.items.filter(
            checkin => checkin.status === CheckInStatus.ACTIVE
          ) || []
          
          // 计算出勤统计数据
          if (isTeacher.value) {
            // 教师端统计数据
            attendanceStats.value = {
              total: activeSessions.value.length,
              present: 0,
              absent: 0,
              late: 0,
              attendanceRate: 0,
            }
          } else {
            // 学生端统计数据
            attendanceStats.value = {
              total: activeSessions.value.length,
              present: 0,
              absent: 0,
              late: 0,
              attendanceRate: 0,
            }
          }
        }
      }
    }
  }
  catch (error) {
    console.error('加载首页数据失败', error)
    uni.showToast({
      title: '获取数据失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

// 导航到创建签到任务页面并显示动画效果
function navigateToCreateCheckin() {
  // 显示按钮展开动画
  fabExpanded.value = true

  // 短暂延迟后跳转，让用户看到动画效果
  setTimeout(() => {
    fabExpanded.value = false
    uni.navigateTo({
      url: '/pages/create-checkin/index',
    })
  }, 300)
}

// 处理下拉刷新
function onRefresh() {
  refreshing.value = true
  loadHomeData()
}

// 导航到签到页面
function navigateToCheckIn(checkinId: string) {
  uni.navigateTo({
    url: `/pages/check-in/index?checkinId=${checkinId}`,
  })
}

// 导航到签到任务详情页面
function navigateToCheckinDetail(checkinId: string) {
  uni.navigateTo({
    url: `/pages/checkin-detail/index?checkinId=${checkinId}`,
  })
}

// 导航到签到记录页面
function navigateToAttendanceRecords() {
  uni.navigateTo({
    url: '/pages/attendance-records/index',
  })
}

// 查看考勤统计
function navigateToAttendanceStatistics() {
  uni.navigateTo({
    url: '/pages/attendance-statistics/index',
  })
}

// 扫描签到二维码
function scanQRCode() {
  uni.navigateTo({
    url: '/pages/scanner/index',
  })
}

// 悬浮按钮
function toggleFab() {
  fabExpanded.value = !fabExpanded.value
}

// 导航到创建课程页面
function navigateToCreateCourse() {
  uni.navigateTo({
    url: '/pages/create-course/index',
  })
}

// 导航到加入课程页面
function navigateToJoinCourse() {
  uni.navigateTo({
    url: '/pages/join-course/index',
  })
}

// 导航到扫描二维码页面
function navigateToScanCode() {
  uni.navigateTo({
    url: '/pages/scanner/index',
  })
}
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 页面内容 -->
    <scroll-view
      scroll-y
      class="page-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- @ts-ignore -->
      <view class="content-wrapper">
        <!-- 加载状态 -->
        <!-- @ts-ignore -->
        <view v-if="loading" class="loading-container">
          <wd-loading color="#6a11cb" size="60px" />
          <!-- @ts-ignore -->
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 页面内容区域 -->
        <block v-else>
          <!-- 头部统计卡片 -->
          <!-- @ts-ignore -->
          <view
            class="stats-card"
            :class="{ 'animate__animated animate__fadeInUp': showAnimations }"
          >
            <!-- @ts-ignore -->
            <view class="stats-header">
              <!-- @ts-ignore -->
              <text class="stats-title">考勤统计</text>
              <!-- @ts-ignore -->
              <text
                class="stats-action"
                @click="navigateToAttendanceStatistics"
              >
                查看更多 >
              </text>
            </view>
            <!-- @ts-ignore -->
            <view class="stats-body">
              <view class="stat-item attendance-rate">
                <text class="stat-value">{{ attendanceStats.attendanceRate }}%</text>
                <text class="stat-label">出勤率</text>
              </view>
              <view class="stats-divider" />
              <view class="stats-detail">
                <view class="detail-item">
                  <text class="detail-value">{{ attendanceStats.present }}</text>
                  <text class="detail-label">出席</text>
                </view>
                <view class="detail-item">
                  <text class="detail-value">{{ attendanceStats.late }}</text>
                  <text class="detail-label">迟到</text>
                </view>
                <view class="detail-item">
                  <text class="detail-value">{{ attendanceStats.absent }}</text>
                  <text class="detail-label">缺勤</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 活跃签到任务 -->
          <view
            v-if="activeSessions.length > 0"
            class="active-sessions-section"
            :class="{ 'animate__animated animate__fadeInUp': showAnimations }"
          >
            <view class="section-header">
              <text class="section-title">进行中的签到</text>
              <view class="section-badge">
                <text>{{ activeSessions.length }}</text>
              </view>
            </view>
            <view class="active-sessions-list">
              <view
                v-for="session in activeSessions"
                :key="session.id"
                class="checkin-card"
                @click="navigateToCheckinDetail(session.id)"
              >
                <view class="card-header">
                  <view class="card-title">
                    <text>{{ session.name }}</text>
                  </view>
                  <view class="card-status" :class="session.status.toLowerCase()">
                    <text>{{ session.displayStatus || session.status }}</text>
                  </view>
                </view>
                
                <view class="card-content">
                  <view class="checkin-detail">
                    <wd-icon name="calendar-o" class="detail-icon" />
                    <text class="detail-text">{{ session.checkinStartTime }}</text>
                  </view>
                  
                  <view class="checkin-detail">
                    <wd-icon name="clock-o" class="detail-icon" />
                    <text class="detail-text">剩余：30分钟</text>
                  </view>
                  
                  <view class="checkin-detail">
                    <wd-icon name="class-o" class="detail-icon" />
                    <text class="detail-text">{{ session.checkinType }}</text>
                  </view>
                </view>
                
                <view class="card-footer">
                  <wd-button 
                    type="primary" 
                    size="small" 
                    custom-class="action-btn scan-btn"
                    @click.stop="navigateToCheckIn(session.id)"
                  >
                    {{ isTeacher ? '查看签到码' : '签到' }}
                  </wd-button>
                </view>
              </view>
            </view>
          </view>

          <!-- 今日课程/签到任务列表 -->
          <view
            class="today-courses-section"
            :class="{ 'animate__animated animate__fadeInUp': showAnimations }"
          >
            <view class="section-header">
              <text class="section-title">签到任务</text>
              <text
                class="section-action"
                @click="navigateToAttendanceRecords"
              >
                查看记录
              </text>
            </view>

            <!-- 无数据提示 -->
            <view v-if="courseList.length === 0" class="empty-state">
              <wd-icon name="computer" size="120rpx" color="#c0c4cc" />
              <text class="empty-text">今日暂无签到任务</text>
              <wd-button
                type="primary"
                size="small"
                @click="navigateToCreateCheckin"
              >
                {{ userStore.isTeacher ? '创建课程' : '加入课程' }}
              </wd-button>
            </view>

            <!-- 任务列表 -->
            <view v-else class="courses-list">
              <view
                v-for="course in courseList"
                :key="course.id"
                class="course-card"
                @click="navigateToCheckinDetail(course.id)"
              >
                <view class="course-header">
                  <view class="course-title">{{ course.name }}</view>
                  <view class="course-status" :class="course.status.toLowerCase()">
                    {{ course.status === 'ACTIVE' ? '活跃' : '未开始' }}
                  </view>
                </view>
                
                <view class="course-info">
                  <view class="info-row">
                    <wd-icon name="user-o" size="32rpx" color="#555"></wd-icon>
                    <text class="info-text">{{ course.memberCount || 0 }}名学生</text>
                  </view>
                  
                  <view class="info-row">
                    <wd-icon name="calendar-o" size="32rpx" color="#555"></wd-icon>
                    <text class="info-text">{{ course.startDate }} - {{ course.endDate }}</text>
                  </view>
                  
                  <view class="info-row">
                    <wd-icon name="tutorial" size="32rpx" color="#555"></wd-icon>
                    <text class="info-text">{{ course.creatorFullName }}</text>
                  </view>
                </view>
                
                <view class="course-actions">
                  <wd-button 
                    type="primary" 
                    size="small"
                    custom-class="action-btn"
                    @click.stop="navigateToCheckinDetail(course.id)"
                  >
                    {{ isTeacher ? '管理签到' : '查看签到' }}
                  </wd-button>
                </view>
              </view>
            </view>
          </view>
        </block>
      </view>
    </scroll-view>

    <!-- 悬浮按钮 -->
    <!-- @ts-ignore -->
    <view
      class="floating-action-button"
      :class="{
        expanded: fabExpanded,
        'slide-out': isScrollingDown
      }"
      @click="toggleFab"
    >
      <wd-icon name="add" size="48rpx" color="#fff" class="fab-icon" />
      
      <!-- 悬浮菜单 -->
      <!-- @ts-ignore -->
      <view v-if="fabExpanded" class="fab-menu">
        <!-- @ts-ignore -->
        <view v-if="userStore.isTeacher" class="fab-menu-item" @click.stop="navigateToCreateCourse">
          <wd-icon name="add-circle" size="40rpx" color="#6a11cb" />
          <!-- @ts-ignore -->
          <text class="fab-menu-text">创建课程</text>
        </view>
        
        <!-- @ts-ignore -->
        <view v-if="userStore.isTeacher" class="fab-menu-item" @click.stop="navigateToCreateCheckin">
          <wd-icon name="check-circle" size="40rpx" color="#6a11cb" />
          <!-- @ts-ignore -->
          <text class="fab-menu-text">创建签到</text>
        </view>
        
        <!-- @ts-ignore -->
        <view v-if="!userStore.isTeacher" class="fab-menu-item" @click.stop="navigateToJoinCourse">
          <wd-icon name="share" size="40rpx" color="#6a11cb" />
          <!-- @ts-ignore -->
          <text class="fab-menu-text">加入课程</text>
        </view>
        
        <!-- @ts-ignore -->
        <view v-if="!userStore.isTeacher" class="fab-menu-item" @click.stop="navigateToScanCode">
          <wd-icon name="scan" size="40rpx" color="#6a11cb" />
          <!-- @ts-ignore -->
          <text class="fab-menu-text">扫码签到</text>
        </view>
      </view>
      
      <!-- 背景蒙层 -->
      <!-- @ts-ignore -->
      <view 
        v-if="fabExpanded" 
        class="fab-backdrop" 
        @click.stop="toggleFab"
      ></view>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;

  // 页面背景渐变
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 300rpx;
    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    z-index: -1;
  }
}

.page-scroll {
  flex: 1;
  width: 100%;
  padding-bottom: 160rpx; // 为浮动按钮留出空间
}

.content-wrapper {
  padding: 30rpx;
  padding-bottom: 100rpx;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;

  .loading-text, .error-text {
    margin-top: 30rpx;
    font-size: 32rpx;
    color: #666;
  }

  .wd-button {
    margin-top: 40rpx;
  }
}

.section {
  margin-bottom: 40rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5rpx);
    box-shadow: 0 15rpx 30rpx rgba(0, 0, 0, 0.12);
  }
}

.user-header {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  padding: 50rpx 30rpx;

  .user-info {
    display: flex;
    align-items: center;

    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      border: 4rpx solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.2);
    }

    .welcome {
      margin-left: 30rpx;

      .greeting {
        font-size: 36rpx;
        font-weight: bold;
        display: block;
        margin-bottom: 10rpx;
      }

      .subtitle {
        font-size: 28rpx;
        opacity: 0.8;
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;

  .card-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -10rpx;
      left: 0;
      width: 60rpx;
      height: 6rpx;
      background: linear-gradient(to right, #6a11cb, #2575fc);
      border-radius: 3rpx;
    }
  }

  .card-action {
    font-size: 28rpx;
    color: #6a11cb;
    padding: 10rpx 20rpx;
    border-radius: 100rpx;
    background-color: rgba(106, 17, 203, 0.1);
    margin-left: 20rpx;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
      background-color: rgba(106, 17, 203, 0.2);
    }
  }
}

.attendance-stats {
  display: flex;
  flex-wrap: wrap;

  .stat-item {
    width: 33.33%;
    text-align: center;
    margin-bottom: 20rpx;

    .stat-value {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }

    .stat-label {
      font-size: 24rpx;
      color: #666;
    }

    &.attendance-rate {
      width: 100%;
      margin-top: 10rpx;

      .stat-value {
        font-size: 48rpx;
        color: #6a11cb;
      }
    }
  }
}

.session-list {
  .session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
    background-color: #f9f9f9;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.08);
    }

    &:active {
      transform: scale(0.98);
    }

    .session-info {
      flex: 1;

      .session-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 10rpx;
      }

      .session-time, .session-teacher, .session-detail {
        font-size: 26rpx;
        color: #666;
        display: block;
        margin-bottom: 6rpx;
      }
    }

    .checkin-btn .shine-button {
      background: linear-gradient(45deg, #6a11cb, #2575fc);
      box-shadow: 0 8rpx 16rpx rgba(106, 17, 203, 0.25);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        box-shadow: 0 10rpx 20rpx rgba(106, 17, 203, 0.4);
      }

      &:active {
        transform: scale(0.95);
      }

      &::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.3) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        transform: rotate(30deg);
        animation: shine 3s infinite;
      }
    }
  }
}

.course-list {
  .course-item {
    display: flex;
    padding: 24rpx;
    background-color: #f9f9f9;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      transform: translateX(10rpx);
      box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.08);
    }

    .course-time {
      width: 160rpx;
      font-size: 26rpx;
      color: #666;
      text-align: center;

      .divider {
        display: block;
        margin: 10rpx 0;
      }
    }

    .course-info {
      flex: 1;
      padding: 0 20rpx;

      .course-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 10rpx;
      }

      .course-location, .course-teacher {
        font-size: 26rpx;
        color: #666;
        display: block;
        margin-bottom: 6rpx;
      }
    }

    .course-status {
      width: 120rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26rpx;
      color: #666;

      &.present, &.status-active {
        color: #52c41a;
      }

      &.absent {
        color: #f5222d;
      }

      &.late {
        color: #faad14;
      }

      &.leave {
        color: #1890ff;
      }
    }

    .action-btn {
      width: 120rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .btn-animate {
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.15);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #909399;
  margin: 30rpx 0;
}

/* 悬浮按钮样式 */
.floating-action-button {
  position: fixed;
  right: 40rpx;
  bottom: 40rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.2);
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.floating-action-button.expanded {
  transform: rotate(45deg);
}

.floating-action-button.slide-out {
  transform: translateY(200rpx);
}

.fab-menu {
  position: absolute;
  bottom: 140rpx;
  right: 0;
  width: 300rpx;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 20rpx;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.3s both;
}

.fab-menu-text {
  margin-left: 20rpx;
  color: #333;
  font-size: 28rpx;
}

.fab-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 998;
}

// 动画类
.animate-in {
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.animate-in-delay {
  animation: fadeInUp 0.6s ease 0.2s forwards;
  opacity: 0;
}

.animate-in-delay-2 {
  animation: fadeInUp 0.6s ease 0.4s forwards;
  opacity: 0;
}

.animate-in-delay-3 {
  animation: fadeInUp 0.6s ease 0.6s forwards;
  opacity: 0;
}

.animate-in-delay-100 {
  animation: fadeInUp 0.6s ease 0.1s forwards;
  opacity: 0;
}

.animate-in-delay-200 {
  animation: fadeInUp 0.6s ease 0.2s forwards;
  opacity: 0;
}

.animate-in-delay-300 {
  animation: fadeInUp 0.6s ease 0.3s forwards;
  opacity: 0;
}

.animate-in-delay-400 {
  animation: fadeInUp 0.6s ease 0.4s forwards;
  opacity: 0;
}

.animate-in-delay-500 {
  animation: fadeInUp 0.6s ease 0.5s forwards;
  opacity: 0;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-count {
  animation: countUp 2s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

@keyframes countUp {
  from {
    transform: translateY(20rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  20%, 100% {
    left: 100%;
  }
}

@keyframes pulse {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 0;
    transform: scale(1.5);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}
</style>

<route type="home" lang="json">
{
  "layout": "tabbar",
  "name": "home",
  "style": {
    "navigationBarTitleText": "智能考勤"
  }
}
</route>
