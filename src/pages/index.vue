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
import CustomNavBar from '@/components/CustomNavBar.vue'
import { getTodayCourses } from '@/api/course'
import { getActiveSessionsForStudent, getAttendanceStatistics, getTeacherActiveSessions } from '@/api/attendance'

// 用户信息
const userStore = useUserStore()
const isTeacher = computed(() => userStore.userInfo?.role === 'teacher')
const isStudent = computed(() => userStore.userInfo?.role === 'student')

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

// 初始化数据
onMounted(async () => {
  // 确保用户已登录并获取用户信息
  if (!userStore.userInfo && userStore.token) {
    try {
      await userStore.fetchUserInfo()
    }
    catch (error) {
      console.error('获取用户信息失败', error)
      uni.redirectTo({ url: '/pages/login/index' })
      return
    }
  }

  // 加载首页数据
  loadHomeData()
})

// 加载首页数据
async function loadHomeData() {
  try {
    loading.value = true

    // 获取今日课程
    const coursesRes = await getTodayCourses()
    todayCourses.value = coursesRes.data || []

    // 获取考勤统计
    const statsRes = await getAttendanceStatistics()
    attendanceStats.value = statsRes.data || {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      attendanceRate: 0,
    }

    // 根据角色获取活跃签到会话
    if (isStudent.value) {
      const sessionRes = await getActiveSessionsForStudent()
      activeSessions.value = sessionRes.data || []
    }
    else if (isTeacher.value) {
      const sessionRes = await getTeacherActiveSessions()
      activeSessions.value = sessionRes.data || []
    }
  }
  catch (error) {
    console.error('加载首页数据失败', error)
    uni.showToast({
      title: '加载数据失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

// 处理下拉刷新
function onRefresh() {
  refreshing.value = true
  loadHomeData()
}

// 学生签到
function navigateToCheckIn(sessionId: string) {
  uni.navigateTo({
    url: `/pages/check-in/index?sessionId=${sessionId}`,
  })
}

// 教师发起签到
function navigateToCreateSession(courseId?: string) {
  uni.navigateTo({
    url: courseId ? `/pages/create-session/index?courseId=${courseId}` : '/pages/create-session/index',
  })
}

// 查看课程详情
function navigateToCourseDetail(courseId: string) {
  uni.navigateTo({
    url: `/pages/course-detail/index?id=${courseId}`,
  })
}

// 查看考勤记录
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
    <!-- 导航栏 -->
    <CustomNavBar
      :title="isTeacher ? '教师主页' : '学生主页'"
      :show-back-button="false"
    >
      <template #right>
        <view class="nav-action" @click="handleLogout">
          <wd-icon name="exit" size="44rpx" color="#ffffff" />
        </view>
      </template>
    </CustomNavBar>

    <!-- 内容区域 -->
    <scroll-view
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      class="content-scroll"
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

        <!-- 学生首页 -->
        <block v-else-if="isStudent">
          <view class="section student-header">
            <view class="user-info">
              <image class="avatar" :src="userStore.userInfo?.avatar || '/static/default-avatar.png'" mode="aspectFill" />
              <view class="welcome">
                <text class="greeting">
                  你好，{{ userStore.userInfo?.fullName }}
                </text>
                <text class="subtitle">
                  今天也要认真上课哦～
                </text>
              </view>
            </view>
          </view>

          <!-- 考勤状态卡片 -->
          <view class="section attendance-status-card">
            <view class="card-header">
              <text class="card-title">
                考勤统计
              </text>
              <text class="card-action" @click="navigateToAttendanceStatistics">
                查看详情
              </text>
            </view>
            <view class="attendance-stats">
              <view class="stat-item">
                <text class="stat-value">
                  {{ attendanceStats.total }}
                </text>
                <text class="stat-label">
                  总课程
                </text>
              </view>
              <view class="stat-item">
                <text class="stat-value">
                  {{ attendanceStats.present }}
                </text>
                <text class="stat-label">
                  已签到
                </text>
              </view>
              <view class="stat-item">
                <text class="stat-value">
                  {{ attendanceStats.absent }}
                </text>
                <text class="stat-label">
                  缺勤
                </text>
              </view>
              <view class="stat-item">
                <text class="stat-value">
                  {{ attendanceStats.late }}
                </text>
                <text class="stat-label">
                  迟到
                </text>
              </view>
              <view class="stat-item attendance-rate">
                <text class="stat-value">
                  {{ attendanceStats.attendanceRate }}%
                </text>
                <text class="stat-label">
                  出勤率
                </text>
              </view>
            </view>
          </view>

          <!-- 快速签到区域 -->
          <view v-if="activeSessions.length > 0" class="section quick-checkin">
            <view class="card-header">
              <text class="card-title">
                可签到课程
              </text>
            </view>
            <view class="session-list">
              <view
                v-for="session in activeSessions"
                :key="session.id"
                class="session-item"
                @click="navigateToCheckIn(session.id)"
              >
                <view class="session-info">
                  <text class="session-name">
                    {{ session.courseName }}
                  </text>
                  <text class="session-time">
                    {{ session.startTime }} - {{ session.endTime }}
                  </text>
                  <text class="session-teacher">
                    {{ session.teacherName }}
                  </text>
                </view>
                <view class="checkin-btn">
                  <wd-button type="primary" size="small">
                    签到
                  </wd-button>
                </view>
              </view>
            </view>
          </view>

          <!-- 今日课程 -->
          <view class="section today-courses">
            <view class="card-header">
              <text class="card-title">
                今日课程
              </text>
              <text class="card-action" @click="navigateToAttendanceRecords">
                查看记录
              </text>
            </view>
            <view v-if="todayCourses.length === 0" class="empty-tip">
              <wd-icon name="rest" size="80rpx" color="#ccc" />
              <text>今天没有课程安排</text>
            </view>
            <view v-else class="course-list">
              <view
                v-for="course in todayCourses"
                :key="course.id"
                class="course-item"
                @click="navigateToCourseDetail(course.courseId)"
              >
                <view class="course-time">
                  <text>{{ course.startTime }}</text>
                  <text class="divider">
                    -
                  </text>
                  <text>{{ course.endTime }}</text>
                </view>
                <view class="course-info">
                  <text class="course-name">
                    {{ course.courseName }}
                  </text>
                  <text class="course-location">
                    {{ course.location }}
                  </text>
                  <text class="course-teacher">
                    {{ course.teacherName }}
                  </text>
                </view>
                <view class="course-status" :class="[course.attendanceStatus]">
                  <text>
                    {{
                      course.hasAttendance
                        ? (course.attendanceStatus === 'present' ? '已签到'
                          : course.attendanceStatus === 'absent' ? '缺勤'
                            : course.attendanceStatus === 'late' ? '迟到'
                              : course.attendanceStatus === 'leave' ? '请假'
                                : '待签到')
                        : '未开始'
                    }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </block>

        <!-- 教师首页 -->
        <block v-else-if="isTeacher">
          <view class="section teacher-header">
            <view class="user-info">
              <image class="avatar" :src="userStore.userInfo?.avatar || '/static/default-avatar.png'" mode="aspectFill" />
              <view class="welcome">
                <text class="greeting">
                  你好，{{ userStore.userInfo?.fullName }}
                </text>
                <text class="subtitle">
                  祝您教学顺利！
                </text>
              </view>
            </view>
          </view>

          <!-- 考勤管理卡片 -->
          <view class="section attendance-manage-card">
            <view class="card-header">
              <text class="card-title">
                考勤管理
              </text>
              <text class="card-action" @click="navigateToAttendanceStatistics">
                查看统计
              </text>
            </view>
            <view class="manage-btns">
              <view class="manage-btn" @click="navigateToCreateSession()">
                <view class="btn-icon">
                  <wd-icon name="plus" size="60rpx" color="#6a11cb" />
                </view>
                <text class="btn-text">
                  发起签到
                </text>
              </view>
              <view class="manage-btn" @click="navigateToAttendanceRecords()">
                <view class="btn-icon">
                  <wd-icon name="check-list" size="60rpx" color="#2575fc" />
                </view>
                <text class="btn-text">
                  签到记录
                </text>
              </view>
              <view class="manage-btn">
                <view class="btn-icon">
                  <wd-icon name="download" size="60rpx" color="#11cb69" />
                </view>
                <text class="btn-text">
                  导出数据
                </text>
              </view>
            </view>
          </view>

          <!-- 活跃签到会话 -->
          <view v-if="activeSessions.length > 0" class="section active-sessions">
            <view class="card-header">
              <text class="card-title">
                进行中的签到
              </text>
            </view>
            <view class="session-list">
              <view
                v-for="session in activeSessions"
                :key="session.id"
                class="session-item"
                @click="navigateToCourseDetail(session.courseId)"
              >
                <view class="session-info">
                  <text class="session-name">
                    {{ session.courseName }}
                  </text>
                  <text class="session-time">
                    {{ session.startTime }} - {{ session.endTime }}
                  </text>
                  <text class="session-detail">
                    签到方式: {{
                      session.method === 'qrcode' ? '二维码'
                      : session.method === 'location' ? '位置'
                        : session.method === 'bluetooth' ? '蓝牙'
                          : session.method === 'wifi' ? 'Wi-Fi'
                            : session.method === 'face' ? '人脸'
                              : '手动'
                    }}
                  </text>
                </view>
                <view class="checkin-btn">
                  <wd-button type="primary" size="small">
                    查看
                  </wd-button>
                </view>
              </view>
            </view>
          </view>

          <!-- 今日课程 -->
          <view class="section today-courses">
            <view class="card-header">
              <text class="card-title">
                今日课程
              </text>
            </view>
            <view v-if="todayCourses.length === 0" class="empty-tip">
              <wd-icon name="rest" size="80rpx" color="#ccc" />
              <text>今天没有课程安排</text>
            </view>
            <view v-else class="course-list">
              <view
                v-for="course in todayCourses"
                :key="course.id"
                class="course-item"
                @click="navigateToCourseDetail(course.courseId)"
              >
                <view class="course-time">
                  <text>{{ course.startTime }}</text>
                  <text class="divider">
                    -
                  </text>
                  <text>{{ course.endTime }}</text>
                </view>
                <view class="course-info">
                  <text class="course-name">
                    {{ course.courseName }}
                  </text>
                  <text class="course-location">
                    {{ course.location }}
                  </text>
                </view>
                <view class="course-action">
                  <wd-button
                    type="primary"
                    size="small"
                    @click.stop="navigateToCreateSession(course.courseId)"
                  >
                    发起签到
                  </wd-button>
                </view>
              </view>
            </view>
          </view>
        </block>

        <!-- 未知角色 -->
        <block v-else>
          <view class="error-container">
            <wd-icon name="warning" size="120rpx" color="#ff4d4f" />
            <text class="error-text">
              无法识别用户角色
            </text>
            <wd-button type="primary" @click="handleLogout">
              退出登录
            </wd-button>
          </view>
        </block>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.nav-action {
  width: 80rpx;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-scroll {
  flex: 1;
  width: 100%;
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
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.student-header, .teacher-header {
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
  }

  .card-action {
    font-size: 28rpx;
    color: #6a11cb;
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
    padding: 20rpx;
    background-color: #f9f9f9;
    border-radius: 16rpx;
    margin-bottom: 20rpx;

    &:last-child {
      margin-bottom: 0;
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
  }
}

.course-list {
  .course-item {
    display: flex;
    padding: 20rpx;
    background-color: #f9f9f9;
    border-radius: 16rpx;
    margin-bottom: 20rpx;

    &:last-child {
      margin-bottom: 0;
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

      &.present {
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

    .course-action {
      width: 160rpx;
      display: flex;
      align-items: center;
      justify-content: center;
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

.manage-btns {
  display: flex;
  justify-content: space-around;

  .manage-btn {
    display: flex;
    flex-direction: column;
    align-items: center;

    .btn-icon {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      background-color: rgba(106, 17, 203, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20rpx;

      &:nth-child(2) {
        background-color: rgba(37, 117, 252, 0.1);
      }

      &:nth-child(3) {
        background-color: rgba(17, 203, 105, 0.1);
      }
    }

    .btn-text {
      font-size: 28rpx;
      color: #333;
    }
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
