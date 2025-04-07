<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const userData = ref(userStore.userInfo || {})

const stats = ref({
  attendanceRate: 95.8,
  joinedCourses: 5,
  pendingCheckins: 1,
  totalCheckins: 42,
})

const pendingCheckin = ref({
  id: 'checkin-123',
  courseId: 'course-456',
  courseName: '计算机网络',
  teacherName: '王老师',
  startTime: '14:00',
  endTime: '14:30',
  remainingMinutes: 15,
})

const recentCourses = ref([
  {
    id: 'course-456',
    name: '计算机网络',
    teacher: '王老师',
    activeCheckin: true,
    nextClass: '今天 14:00-15:30',
  },
  {
    id: 'course-789',
    name: '高等数学',
    teacher: '李老师',
    activeCheckin: false,
    nextClass: '明天 08:00-09:30',
  },
  {
    id: 'course-101',
    name: '数据结构',
    teacher: '张老师',
    activeCheckin: false,
    nextClass: '后天 10:00-11:30',
  },
])

const checkinRecords = ref([
  {
    id: 'record-1',
    courseName: '计算机网络',
    checkInTime: '2025-04-01 13:58',
    status: 'NORMAL',
    displayStatus: '已签到',
  },
  {
    id: 'record-2',
    courseName: '高等数学',
    checkInTime: '2025-03-30 08:12',
    status: 'LATE',
    displayStatus: '迟到',
  },
  {
    id: 'record-3',
    courseName: '数据结构',
    checkInTime: '2025-03-29 10:05',
    status: 'NORMAL',
    displayStatus: '已签到',
  },
])

function openScanner() {
  uni.navigateTo({
    url: '/pages/scanner/index',
  })
}

function viewCourseDetail(courseId: string) {
  uni.navigateTo({
    url: `/pages/course/detail?id=${courseId}`,
  })
}

function viewAllRecords() {
  uni.navigateTo({
    url: '/pages/records/index',
  })
}

function joinCourse() {
  uni.navigateTo({
    url: '/pages/course/join',
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
          <text class="greeting-text">{{ userData.fullName || '同学' }}，你好！</text>
          <text class="role-label">学生端</text>
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
          <text class="stat-value">{{ stats.attendanceRate }}%</text>
          <text class="stat-label">出勤率</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.joinedCourses }}</text>
          <text class="stat-label">已加入课程</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.pendingCheckins }}</text>
          <text class="stat-label">待签到</text>
        </view>
      </view>
    </view>

    <!-- 待签到提醒 -->
    <view v-if="pendingCheckin" class="pending-checkin">
      <view class="section-title">
        <text>待签到提醒</text>
      </view>
      <view class="checkin-card">
        <view class="checkin-info">
          <wd-icon name="time" size="40rpx" color="#ff9500" class="checkin-icon" />
          <view class="course-info">
            <text class="course-name">{{ pendingCheckin.courseName }}</text>
            <text class="teacher-name">{{ pendingCheckin.teacherName }}</text>
          </view>
        </view>
        <view class="checkin-time">
          <text class="time-label">签到时间：</text>
          <text class="time-value">{{ pendingCheckin.startTime }} - {{ pendingCheckin.endTime }}</text>
        </view>
        <view class="checkin-countdown">
          <text class="countdown-value">剩余 {{ pendingCheckin.remainingMinutes }} 分钟</text>
        </view>
        <view class="checkin-actions">
          <wd-button type="primary" size="small" @click="openScanner">立即签到</wd-button>
        </view>
      </view>
    </view>

    <!-- 快捷功能区 -->
    <view class="quick-actions">
      <view class="section-title">
        <text>快捷功能</text>
      </view>
      <view class="actions-grid">
        <view class="action-item" @click="openScanner">
          <view class="action-icon-wrapper scan">
            <wd-icon name="qrcode" size="60rpx" color="#fff" />
          </view>
          <text class="action-name">扫码签到</text>
        </view>
        <view class="action-item" @click="joinCourse">
          <view class="action-icon-wrapper join">
            <wd-icon name="addition" size="60rpx" color="#fff" />
          </view>
          <text class="action-name">加入课程</text>
        </view>
        <view class="action-item">
          <view class="action-icon-wrapper location">
            <wd-icon name="location" size="60rpx" color="#fff" />
          </view>
          <text class="action-name">位置签到</text>
        </view>
        <view class="action-item">
          <view class="action-icon-wrapper wifi">
            <wd-icon name="wifi" size="60rpx" color="#fff" />
          </view>
          <text class="action-name">WiFi签到</text>
        </view>
      </view>
    </view>

    <!-- 我的课程 -->
    <view class="my-courses">
      <view class="section-header">
        <text class="section-title">我的课程</text>
        <text class="view-all">查看全部</text>
      </view>
      <view class="courses-list">
        <view 
          v-for="course in recentCourses" 
          :key="course.id" 
          class="course-card"
          @click="viewCourseDetail(course.id)"
        >
          <view class="course-card-header">
            <text class="course-name">{{ course.name }}</text>
            <view v-if="course.activeCheckin" class="active-indicator">
              <text>签到中</text>
            </view>
          </view>
          <view class="course-info">
            <text class="teacher-name">{{ course.teacher }}</text>
            <text class="next-class">{{ course.nextClass }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 最近签到记录 -->
    <view class="recent-records">
      <view class="section-header">
        <text class="section-title">最近签到记录</text>
        <text class="view-all" @click="viewAllRecords">查看全部</text>
      </view>
      <view class="records-list">
        <view 
          v-for="record in checkinRecords" 
          :key="record.id" 
          class="record-item"
        >
          <view class="record-course">
            <text>{{ record.courseName }}</text>
          </view>
          <view class="record-time">
            <text>{{ record.checkInTime }}</text>
          </view>
          <view 
            class="record-status" 
            :class="{ 
              'status-normal': record.status === 'NORMAL',
              'status-late': record.status === 'LATE',
              'status-absent': record.status === 'ABSENT'
            }"
          >
            <text>{{ record.displayStatus }}</text>
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
      background-color: #e6f7ff;
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

.pending-checkin {
  margin-bottom: 30rpx;
}

.checkin-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.checkin-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  
  .checkin-icon {
    margin-right: 20rpx;
  }
  
  .course-info {
    display: flex;
    flex-direction: column;
    
    .course-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 4rpx;
    }
    
    .teacher-name {
      font-size: 24rpx;
      color: #666;
    }
  }
}

.checkin-time {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
  
  .time-value {
    font-weight: 500;
    color: #333;
  }
}

.checkin-countdown {
  margin-bottom: 20rpx;
  
  .countdown-value {
    font-size: 28rpx;
    font-weight: 500;
    color: #ff4d4f;
  }
}

.checkin-actions {
  display: flex;
  justify-content: flex-end;
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
    
    &.scan {
      background: linear-gradient(135deg, #42b883, #347474);
    }
    
    &.join {
      background: linear-gradient(135deg, #ff7eb3, #ff758c);
    }
    
    &.location {
      background: linear-gradient(135deg, #ffa41b, #ff5151);
    }
    
    &.wifi {
      background: linear-gradient(135deg, #00b4db, #0083b0);
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
  margin-bottom: 16rpx;
  
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

.course-info {
  display: flex;
  justify-content: space-between;
  
  .teacher-name {
    font-size: 26rpx;
    color: #666;
  }
  
  .next-class {
    font-size: 24rpx;
    color: #999;
  }
}

.recent-records {
  margin-bottom: 30rpx;
}

.records-list {
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 2rpx solid #f0f2f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  .record-course {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    flex: 1;
  }
  
  .record-time {
    font-size: 24rpx;
    color: #999;
    flex: 1;
    text-align: center;
  }
  
  .record-status {
    font-size: 24rpx;
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
    width: 100rpx;
    text-align: center;
    
    &.status-normal {
      background-color: #e6f7ff;
      color: #1890ff;
    }
    
    &.status-late {
      background-color: #fff7e6;
      color: #fa8c16;
    }
    
    &.status-absent {
      background-color: #fff1f0;
      color: #f5222d;
    }
  }
}
</style> 