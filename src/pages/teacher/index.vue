<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const userData = ref(userStore.userInfo || {})

const stats = ref({
  totalCourses: 3,
  totalStudents: 120,
  activeCheckins: 1,
  avgAttendanceRate: 86.5,
})

const activeCheckin = ref({
  id: 'checkin-456',
  courseId: 'course-789',
  courseName: '计算机网络',
  startTime: '2025-04-06 14:00',
  endTime: '2025-04-06 14:30',
  checkedInCount: 32,
  totalCount: 42,
  checkinRate: 76.2,
})

const myCourses = ref([
  {
    id: 'course-789',
    name: '计算机网络',
    description: '计算机网络基础课程',
    studentCount: 42,
    nextClass: '今天 14:00-15:30',
    hasActiveCheckin: true,
  },
  {
    id: 'course-101',
    name: '数据结构',
    description: '数据结构与算法分析',
    studentCount: 38,
    nextClass: '明天 10:00-11:30',
    hasActiveCheckin: false,
  },
  {
    id: 'course-202',
    name: '高等数学',
    description: '微积分与线性代数基础',
    studentCount: 46,
    nextClass: '后天 08:00-09:30',
    hasActiveCheckin: false,
  },
])

const recentActivities = ref([
  {
    id: 'activity-1',
    type: 'CHECKIN_CREATED',
    courseName: '计算机网络',
    time: '2025-04-06 13:55',
    description: '第四次课签到已创建',
  },
  {
    id: 'activity-2',
    type: 'STUDENT_JOINED',
    courseName: '数据结构',
    time: '2025-04-05 10:30',
    description: '新学生加入了课程',
  },
  {
    id: 'activity-3',
    type: 'CHECKIN_COMPLETED',
    courseName: '高等数学',
    time: '2025-04-04 09:35',
    description: '第三次课签到已结束，出勤率89%',
  },
])

function viewCheckinDetail(checkinId: string) {
  uni.navigateTo({
    url: `/pages/checkin/detail?id=${checkinId}`,
  })
}

function createNewCourse() {
  uni.navigateTo({
    url: '/pages/course/create',
  })
}

function createCheckin(courseId: string) {
  uni.navigateTo({
    url: `/pages/checkin/create?courseId=${courseId}`,
  })
}

function viewCourseDetail(courseId: string) {
  uni.navigateTo({
    url: `/pages/course/detail?id=${courseId}`,
  })
}

function viewAllCourses() {
  uni.navigateTo({
    url: '/pages/course/list',
  })
}
</script>

<template>
  <view class="page-container">
    <!-- 页眉区域 -->
    <view class="header-container">
      <view class="user-info">
        <image class="avatar" src="/static/default-avatar.png" mode="aspectFill" />
        <view class="greeting">
          <text class="greeting-text">{{ userData.fullName || '老师' }}，你好！</text>
          <text class="role-label">教师端</text>
        </view>
      </view>
      <view class="action-buttons">
        <view class="action-button messages">
          <wd-icon name="notice" size="46rpx" />
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-container">
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-value">{{ stats.totalCourses }}</text>
          <text class="stat-label">课程数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.totalStudents }}</text>
          <text class="stat-label">学生数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.activeCheckins }}</text>
          <text class="stat-label">活跃签到</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.avgAttendanceRate }}%</text>
          <text class="stat-label">平均出勤率</text>
        </view>
      </view>
    </view>

    <!-- 活跃签到任务 -->
    <view v-if="activeCheckin" class="active-checkin">
      <view class="section-title">
        <text>活跃签到任务</text>
      </view>
      <view class="checkin-card" @click="viewCheckinDetail(activeCheckin.id)">
        <view class="checkin-header">
          <text class="course-name">{{ activeCheckin.courseName }}</text>
          <view class="status-badge">
            <text>进行中</text>
          </view>
        </view>
        <view class="checkin-time">
          <wd-icon name="time" size="32rpx" color="#666" />
          <text class="time-text">{{ activeCheckin.startTime }} - {{ activeCheckin.endTime }}</text>
        </view>
        <view class="checkin-progress">
          <view class="progress-header">
            <text class="progress-text">签到进度</text>
            <text class="progress-value">{{ activeCheckin.checkedInCount }}/{{ activeCheckin.totalCount }}</text>
          </view>
          <view class="progress-bar-wrapper">
            <view class="progress-bar-bg">
              <view 
                class="progress-bar-fill" 
                :style="{ width: `${activeCheckin.checkinRate}%` }"
              />
            </view>
          </view>
          <text class="rate-text">签到率 {{ activeCheckin.checkinRate }}%</text>
        </view>
        <view class="view-details">
          <text>查看详情</text>
          <wd-icon name="arrow-right" size="24rpx" />
        </view>
      </view>
    </view>

    <!-- 快捷功能区 -->
    <view class="quick-actions">
      <view class="section-title">
        <text>快捷功能</text>
      </view>
      <view class="actions-grid">
        <view class="action-item" @click="createNewCourse">
          <view class="action-icon-wrapper create-course">
            <wd-icon name="addition" size="60rpx" color="#fff" />
          </view>
          <text class="action-name">创建课程</text>
        </view>
        <view class="action-item">
          <view class="action-icon-wrapper create-checkin">
            <wd-icon name="qrcode" size="60rpx" color="#fff" />
          </view>
          <text class="action-name">发起签到</text>
        </view>
        <view class="action-item">
          <view class="action-icon-wrapper stats">
            <wd-icon name="chart" size="60rpx" color="#fff" />
          </view>
          <text class="action-name">考勤统计</text>
        </view>
        <view class="action-item">
          <view class="action-icon-wrapper export">
            <wd-icon name="download" size="60rpx" color="#fff" />
          </view>
          <text class="action-name">导出数据</text>
        </view>
      </view>
    </view>

    <!-- 我的课程 -->
    <view class="my-courses">
      <view class="section-header">
        <text class="section-title">我的课程</text>
        <text class="view-all" @click="viewAllCourses">查看全部</text>
      </view>
      <view class="courses-list">
        <view 
          v-for="course in myCourses" 
          :key="course.id" 
          class="course-card"
          @click="viewCourseDetail(course.id)"
        >
          <view class="course-card-header">
            <text class="course-name">{{ course.name }}</text>
            <view v-if="course.hasActiveCheckin" class="active-indicator">
              <text>签到中</text>
            </view>
          </view>
          <view class="course-description">
            <text>{{ course.description }}</text>
          </view>
          <view class="course-info">
            <view class="student-count">
              <wd-icon name="person" size="24rpx" color="#666" />
              <text>{{ course.studentCount }}名学生</text>
            </view>
            <text class="next-class">{{ course.nextClass }}</text>
          </view>
          <view class="course-actions">
            <wd-button 
              type="primary" 
              size="small" 
              custom-class="checkin-btn"
              @click.stop="createCheckin(course.id)"
            >
              发起签到
            </wd-button>
          </view>
        </view>
      </view>
    </view>

    <!-- 最近活动 -->
    <view class="recent-activities">
      <view class="section-header">
        <text class="section-title">最近活动</text>
        <text class="view-all">查看全部</text>
      </view>
      <view class="activities-list">
        <view 
          v-for="activity in recentActivities" 
          :key="activity.id" 
          class="activity-item"
        >
          <view 
            class="activity-icon" 
            :class="{
              'checkin-created': activity.type === 'CHECKIN_CREATED',
              'student-joined': activity.type === 'STUDENT_JOINED',
              'checkin-completed': activity.type === 'CHECKIN_COMPLETED'
            }"
          >
            <wd-icon 
              :name="activity.type === 'CHECKIN_CREATED' ? 'check2' : 
                    activity.type === 'STUDENT_JOINED' ? 'addition' : 'circle-check'" 
              size="32rpx" 
              color="#fff"
            />
          </view>
          <view class="activity-content">
            <view class="activity-header">
              <text class="activity-course">{{ activity.courseName }}</text>
              <text class="activity-time">{{ activity.time }}</text>
            </view>
            <text class="activity-description">{{ activity.description }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f5f7fa;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.user-info {
  display: flex;
  align-items: center;
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    margin-right: 20rpx;
    border: 4rpx solid #fff;
    box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
  }
  
  .greeting {
    display: flex;
    flex-direction: column;
    
    .greeting-text {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 6rpx;
    }
    
    .role-label {
      font-size: 24rpx;
      color: #666;
      background-color: #f0f5ff;
      padding: 4rpx 12rpx;
      border-radius: 20rpx;
      width: fit-content;
    }
  }
}

.action-buttons {
  display: flex;
  
  .action-button {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 20rpx;
    box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
  }
}

.stats-container {
  margin-bottom: 30rpx;
}

.stats-card {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 8rpx 20rpx rgba(37, 117, 252, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  
  .stat-value {
    font-size: 40rpx;
    font-weight: bold;
    margin-bottom: 6rpx;
  }
  
  .stat-label {
    font-size: 24rpx;
    opacity: 0.9;
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.active-checkin {
  margin-bottom: 30rpx;
}

.checkin-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  
  .course-name {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .status-badge {
    background-color: #52c41a;
    color: #fff;
    font-size: 22rpx;
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
  }
}

.checkin-time {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  
  .time-text {
    font-size: 26rpx;
    color: #666;
    margin-left: 8rpx;
  }
}

.checkin-progress {
  margin-bottom: 20rpx;
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10rpx;
    
    .progress-text {
      font-size: 26rpx;
      color: #666;
    }
    
    .progress-value {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
    }
  }
  
  .progress-bar-wrapper {
    margin-bottom: 10rpx;
  }
  
  .progress-bar-bg {
    width: 100%;
    height: 12rpx;
    background-color: #f0f2f5;
    border-radius: 6rpx;
    overflow: hidden;
  }
  
  .progress-bar-fill {
    height: 100%;
    background-color: #52c41a;
    border-radius: 6rpx;
  }
  
  .rate-text {
    font-size: 24rpx;
    color: #52c41a;
  }
}

.view-details {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 24rpx;
  color: #2575fc;
}

.quick-actions {
  margin-bottom: 30rpx;
}

.actions-grid {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.action-item {
  width: 23%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
  
  .action-icon-wrapper {
    width: 120rpx;
    height: 120rpx;
    border-radius: 30rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10rpx;
    
    &.create-course {
      background: linear-gradient(135deg, #6a11cb, #2575fc);
    }
    
    &.create-checkin {
      background: linear-gradient(135deg, #42b883, #347474);
    }
    
    &.stats {
      background: linear-gradient(135deg, #ff9a44, #fc6076);
    }
    
    &.export {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }
  }
  
  .action-name {
    font-size: 24rpx;
    color: #333;
    margin-top: 6rpx;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  
  .view-all {
    font-size: 24rpx;
    color: #2575fc;
  }
}

.my-courses {
  margin-bottom: 30rpx;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.course-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
  
  .course-name {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .active-indicator {
    background-color: #ff9500;
    color: #fff;
    font-size: 22rpx;
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
  }
}

.course-description {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.course-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  
  .student-count {
    display: flex;
    align-items: center;
    
    text {
      font-size: 24rpx;
      color: #666;
      margin-left: 6rpx;
    }
  }
  
  .next-class {
    font-size: 24rpx;
    color: #999;
  }
}

.course-actions {
  display: flex;
  justify-content: flex-end;
  
  .checkin-btn {
    font-size: 24rpx;
  }
}

.recent-activities {
  margin-bottom: 30rpx;
}

.activities-list {
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  border-bottom: 2rpx solid #f0f2f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.activity-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16rpx;
  flex-shrink: 0;
  
  &.checkin-created {
    background-color: #1890ff;
  }
  
  &.student-joined {
    background-color: #52c41a;
  }
  
  &.checkin-completed {
    background-color: #722ed1;
  }
}

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6rpx;
  
  .activity-course {
    font-size: 26rpx;
    font-weight: 500;
    color: #333;
  }
  
  .activity-time {
    font-size: 22rpx;
    color: #999;
  }
}

.activity-description {
  font-size: 24rpx;
  color: #666;
}
</style> 