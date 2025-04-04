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
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { getAttendanceStatistics } from '@/api/attendance'
import { TaskStatus, activateTask, completeTask, getActiveTasks, getMyTasks } from '@/api/task'
import CustomNavBar from '@/components/CustomNavBar.vue'

// 用户信息
const userStore = useUserStore()
// 暂时不需要区分角色
/*
const isTeacher = computed(() => userStore.userInfo?.role === 'teacher')
const isStudent = computed(() => userStore.userInfo?.role === 'student')
*/

// 页面数据
const loading = ref(false)
const refreshing = ref(false)
const todayCourses = ref<any[]>([])
const attendanceStats = ref({
  total: 0,
  present: 0,
  absent: 0,
  late: 0,
  leave: 0,
  attendanceRate: 0,
})
const activeSessions = ref<any[]>([])
const showAnimations = ref(false)

// 初始化数据
onMounted(() => {
  // 直接加载首页数据，token失效会由请求拦截器处理
  loadHomeData()

  // 设置导航栏按钮点击事件
  // @ts-expect-error - 小程序API类型定义问题
  uni.onNavigationBarButtonTap((e: { index: number, text: string }) => {
    if (e.text === '退出') {
      handleLogout()
    }
  })

  // 延迟显示动画效果
  setTimeout(() => {
    showAnimations.value = true
  }, 100)
})

// 加载首页数据
async function loadHomeData() {
  try {
    loading.value = true

    // 暂时不区分角色，同时加载所有任务
    /*
    if (isStudent.value) {
      // 学生身份：加载活跃的签到任务
      const response = await getActiveTasks()
      activeSessions.value = Array.isArray(response) ? response : (response?.data || [])
      todayCourses.value = Array.isArray(response) ? response : (response?.data || [])
    }
    else if (isTeacher.value) {
      // 教师身份：加载我创建的任务
      const response = await getMyTasks()
      todayCourses.value = Array.isArray(response) ? response : (response?.data || [])
    }
    */

    // 同时加载所有类型的任务
    const activeTasksResponse = await getActiveTasks()
    const myTasksResponse = await getMyTasks()

    // 合并任务并去重
    const activeTasksData = Array.isArray(activeTasksResponse) ? activeTasksResponse : (activeTasksResponse?.data || [])
    const myTasksData = Array.isArray(myTasksResponse) ? myTasksResponse : (myTasksResponse?.data || [])

    // 使用Set去重（假设每个任务有唯一ID）
    const allTasksMap = new Map()

    // 添加活跃任务
    activeTasksData.forEach((task) => {
      allTasksMap.set(task.id, task)
    })

    // 添加我的任务
    myTasksData.forEach((task) => {
      allTasksMap.set(task.id, task)
    })

    // 转换回数组
    const allTasks = Array.from(allTasksMap.values())

    // 设置任务数据
    activeSessions.value = activeTasksData
    todayCourses.value = allTasks

    // 设置出勤统计（这里可以是模拟数据或默认值）
    attendanceStats.value = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      attendanceRate: 0,
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
  }
}

// 处理下拉刷新
function onRefresh() {
  refreshing.value = true
  loadHomeData()
}

// 导航到签到页面
function navigateToCheckIn(taskId: string) {
  uni.navigateTo({
    url: `/pages/check-in/index?taskId=${taskId}`,
  })
}

// 导航到任务详情页面
function navigateToTaskDetail(taskId: string) {
  uni.navigateTo({
    url: `/pages/task-detail/index?taskId=${taskId}`,
  })
}

// 导航到创建任务页面
function navigateToCreateTask() {
  uni.navigateTo({
    url: '/pages/create-task/index',
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

// 启动签到任务
async function handleActivateTask(taskId: string, event: Event) {
  event.stopPropagation()

  try {
    uni.showLoading({ title: '激活中...' })
    await activateTask(taskId)
    uni.showToast({
      title: '签到任务已激活',
      icon: 'success',
    })
    loadHomeData()
  }
  catch (error) {
    console.error('激活任务失败', error)
    uni.showToast({
      title: '激活失败',
      icon: 'error',
    })
  }
  finally {
    uni.hideLoading()
  }
}

// 结束签到任务
async function handleCompleteTask(taskId: string, event: Event) {
  event.stopPropagation()

  try {
    uni.showLoading({ title: '处理中...' })
    await completeTask(taskId)
    uni.showToast({
      title: '签到任务已关闭',
      icon: 'success',
    })
    loadHomeData()
  }
  catch (error) {
    console.error('关闭任务失败', error)
    uni.showToast({
      title: '关闭失败',
      icon: 'error',
    })
  }
  finally {
    uni.hideLoading()
  }
}

// 退出登录
function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await userStore.logout()
        uni.reLaunch({
          url: '/pages/login/index',
        })
      }
    },
  })
}
</script>

<template>
  <view class="container">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="智能考勤系统"
      :show-back-button="false"
      background-color="#6a11cb"
      scrolled-background-color="rgba(106, 17, 203, 0.95)"
      :enable-scroll-effect="true"
    >
      <template #right>
        <wd-icon name="setting" size="44rpx" color="#fff" @click="handleLogout" />
      </template>
    </CustomNavBar>

    <!-- 页面内容 -->
    <scroll-view
      scroll-y
      class="page-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="content-wrapper">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <wd-loading color="#6a11cb" size="60px" />
          <text class="loading-text">
            加载中...
          </text>
        </view>

        <!-- 统一的用户信息显示 -->
        <view
          class="section user-header"
          :class="{ 'animate-in': showAnimations }"
        >
          <view class="user-info">
            <image class="avatar" :src="userStore.userInfo?.avatar || '/static/default-avatar.png'" mode="aspectFill" />
            <view class="welcome">
              <text class="greeting">
                你好，{{ userStore.userInfo?.fullName }}
              </text>
              <text class="subtitle">
                欢迎使用智能考勤系统
              </text>
            </view>
          </view>
        </view>

        <!-- 考勤状态卡片 -->
        <view
          class="section attendance-status-card"
          :class="{ 'animate-in-delay': showAnimations }"
        >
          <view class="card-header">
            <text class="card-title">
              考勤统计
            </text>
            <text class="card-action" @click="navigateToAttendanceStatistics">
              查看详情
            </text>
          </view>
          <view class="attendance-stats">
            <view
              class="stat-item"
              :class="{ 'animate-in-delay-100': showAnimations }"
            >
              <text class="stat-value animate-count">
                {{ attendanceStats.total }}
              </text>
              <text class="stat-label">
                总课程
              </text>
            </view>
            <view
              class="stat-item"
              :class="{ 'animate-in-delay-200': showAnimations }"
            >
              <text class="stat-value animate-count">
                {{ attendanceStats.present }}
              </text>
              <text class="stat-label">
                已签到
              </text>
            </view>
            <view
              class="stat-item"
              :class="{ 'animate-in-delay-300': showAnimations }"
            >
              <text class="stat-value animate-count">
                {{ attendanceStats.absent }}
              </text>
              <text class="stat-label">
                缺勤
              </text>
            </view>
            <view
              class="stat-item"
              :class="{ 'animate-in-delay-400': showAnimations }"
            >
              <text class="stat-value animate-count">
                {{ attendanceStats.late }}
              </text>
              <text class="stat-label">
                迟到
              </text>
            </view>
            <view
              class="stat-item attendance-rate"
              :class="{ 'animate-in-delay-500': showAnimations }"
            >
              <text class="stat-value animate-count">
                {{ attendanceStats.attendanceRate }}%
              </text>
              <text class="stat-label">
                出勤率
              </text>
            </view>
          </view>
        </view>

        <!-- 可签到任务 -->
        <view
          v-if="activeSessions.length > 0"
          class="section quick-checkin"
          :class="{ 'animate-in-delay-2': showAnimations }"
        >
          <view class="card-header">
            <text class="card-title">
              可签到任务
            </text>
          </view>
          <view class="session-list">
            <view
              v-for="(task, index) in activeSessions"
              :key="task.id"
              class="session-item"
              :class="{
                'animate-in-delay-100': index === 0 && showAnimations,
                'animate-in-delay-200': index === 1 && showAnimations,
                'animate-in-delay-300': index === 2 && showAnimations,
                'animate-in-delay-400': index >= 3 && showAnimations,
              }"
              @click="navigateToTaskDetail(task.id)"
            >
              <view class="session-info">
                <text class="session-name">
                  {{ task.title }}
                </text>
                <text class="session-time">
                  {{ new Date(task.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                  -
                  {{ new Date(task.endTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' }) }}
                </text>
                <text class="session-teacher">
                  创建人: {{ task.creatorName }}
                </text>
                <text class="session-detail">
                  签到类型: {{
                    task.checkInType === 'QR_CODE' ? '二维码'
                    : task.checkInType === 'LOCATION' ? '位置'
                      : task.checkInType === 'GPS' ? 'GPS'
                        : task.checkInType === 'WIFI' ? 'Wi-Fi'
                          : task.checkInType === 'AUTOMATIC' ? '自动'
                            : '手动'
                  }}
                </text>
              </view>
              <view class="checkin-btn">
                <wd-button
                  type="primary"
                  size="small"
                  class="shine-button"
                  @click.stop="navigateToCheckIn(task.id)"
                >
                  签到
                </wd-button>
              </view>
            </view>
          </view>
        </view>

        <!-- 所有任务列表 -->
        <view
          class="section today-courses"
          :class="{ 'animate-in-delay-3': showAnimations }"
        >
          <view class="card-header">
            <text class="card-title">
              所有任务
            </text>
            <view class="card-actions">
              <text
                class="card-action"
                @click="navigateToCreateTask"
              >
                创建任务
              </text>
              <text
                class="card-action"
                @click="navigateToAttendanceRecords"
              >
                查看记录
              </text>
            </view>
          </view>
          <view v-if="todayCourses.length === 0" class="empty-tip">
            <wd-icon
              name="rest"
              size="80rpx"
              color="#ccc"
              class="animate-float"
            />
            <text>暂无签到任务</text>
          </view>
          <view v-else class="course-list">
            <view
              v-for="(task, index) in todayCourses"
              :key="task.id"
              class="course-item"
              :class="{
                'animate-in-delay-100': index === 0 && showAnimations,
                'animate-in-delay-200': index === 1 && showAnimations,
                'animate-in-delay-300': index === 2 && showAnimations,
                'animate-in-delay-400': index >= 3 && showAnimations,
              }"
              @click="navigateToTaskDetail(task.id)"
            >
              <view class="course-time">
                <text>{{ new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</text>
                <text class="divider">
                  -
                </text>
                <text>{{ new Date(task.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</text>
              </view>
              <view class="course-info">
                <text class="course-name">
                  {{ task.title }}
                </text>
                <text class="course-location">
                  {{ task.locationRequirement }}
                </text>
                <text class="course-detail">
                  {{ task.description }}
                </text>
              </view>
              <view class="course-status" :class="{ 'status-active': task.status === 'ACTIVE' }">
                <text>
                  {{
                    task.status === 'ACTIVE' ? '可签到'
                    : task.status === 'COMPLETED' ? '已结束'
                      : task.status === 'CREATED' ? '未开始'
                        : '未知状态'
                  }}
                </text>
              </view>
              <view v-if="task.status === 'CREATED'" class="action-btn">
                <wd-button
                  type="primary"
                  size="small"
                  class="btn-animate"
                  @click.stop="handleActivateTask(task.id, $event)"
                >
                  激活
                </wd-button>
              </view>
              <view v-if="task.status === 'ACTIVE'" class="action-btn">
                <wd-button
                  type="warning"
                  size="small"
                  class="btn-animate"
                  @click.stop="handleCompleteTask(task.id, $event)"
                >
                  结束
                </wd-button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 浮动操作按钮 -->
    <view
      class="floating-button"
      :class="{ 'animate-in-pop': showAnimations }"
      @click="navigateToCreateTask"
    >
      <wd-icon name="plus" size="50rpx" color="#ffffff" />
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

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;

  .wd-icon {
    margin-bottom: 20rpx;
  }
}

// 浮动操作按钮
.floating-button {
  position: fixed;
  right: 40rpx;
  bottom: 40rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(106, 17, 203, 0.4);
  z-index: 100;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &.animate-in-pop {
    transform: scale(1);
  }

  &:active {
    transform: scale(0.9);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    border-radius: inherit;
    animation: pulse 2s infinite;
    z-index: -1;
  }
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
    "navigationBarTitleText": "home"
  }
}
</route>
