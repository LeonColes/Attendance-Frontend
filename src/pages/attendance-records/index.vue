<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { getTaskRecords } from '@/api/task'
import CustomNavBar from '@/components/CustomNavBar.vue'

// 用户信息
const _userStore = useUserStore()

// 页面状态
const loading = ref(true)
const records = ref<any[]>([])
const showAnimations = ref(false)
const taskId = ref('')

// 初始化
onMounted(() => {
  const options = uni.getLaunchOptionsSync()
  if (options.query && options.query.taskId) {
    taskId.value = options.query.taskId as string
    loadRecords()
  }

  // 延迟显示动画效果
  setTimeout(() => {
    showAnimations.value = true
  }, 100)
})

// 加载考勤记录
async function loadRecords() {
  try {
    loading.value = true
    const response = await getTaskRecords(taskId.value)
    records.value = Array.isArray(response) ? response : (response?.data || [])
  }
  catch (error) {
    console.error('获取考勤记录失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

// 格式化时间
function formatTime(timestamp: string) {
  if (!timestamp)
    return '未记录'

  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

// 格式化日期
function formatDate(timestamp: string) {
  if (!timestamp)
    return '未记录'

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 获取考勤状态标签
function getStatusLabel(record: any) {
  if (record.status === 'PRESENT')
    return '已签到'
  if (record.status === 'LATE')
    return '迟到'
  if (record.status === 'ABSENT')
    return '缺勤'
  return '未知状态'
}

// 获取考勤状态样式
function getStatusClass(record: any) {
  if (record.status === 'PRESENT')
    return 'status-present'
  if (record.status === 'LATE')
    return 'status-late'
  if (record.status === 'ABSENT')
    return 'status-absent'
  return ''
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 导出考勤记录
function exportRecords() {
  uni.showToast({
    title: '导出功能开发中',
    icon: 'none',
  })
}
</script>

<template>
  <view class="container">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="考勤记录"
      background-color="#6a11cb"
      scrolled-background-color="rgba(106, 17, 203, 0.95)"
      :enable-scroll-effect="true"
      @back="goBack"
    >
      <template #right>
        <view class="nav-action" @click="exportRecords">
          <wd-icon name="download" size="40rpx" color="#fff" />
        </view>
      </template>
    </CustomNavBar>

    <view class="content-wrapper">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <wd-loading color="#6a11cb" size="60px" />
        <text class="loading-text">
          加载中...
        </text>
      </view>

      <!-- 记录列表 -->
      <block v-else>
        <!-- 记录统计卡片 -->
        <view
          class="stats-card"
          :class="{ 'animate-in': showAnimations }"
        >
          <view class="stats-item">
            <text class="stats-value">
              {{ records.length }}
            </text>
            <text class="stats-label">
              总人数
            </text>
          </view>
          <view class="stats-item">
            <text class="stats-value">
              {{ records.filter(r => r.status === 'PRESENT').length }}
            </text>
            <text class="stats-label">
              已签到
            </text>
          </view>
          <view class="stats-item">
            <text class="stats-value">
              {{ records.filter(r => r.status === 'LATE').length }}
            </text>
            <text class="stats-label">
              迟到
            </text>
          </view>
          <view class="stats-item">
            <text class="stats-value">
              {{ records.filter(r => r.status === 'ABSENT').length }}
            </text>
            <text class="stats-label">
              缺勤
            </text>
          </view>
        </view>

        <!-- 记录搜索与筛选 -->
        <view
          class="filter-bar"
          :class="{ 'animate-in-delay': showAnimations }"
        >
          <wd-input
            placeholder="搜索学号或姓名"
            prefix-icon="search"

            clearable border
            class="search-input"
          />
          <wd-button type="default" size="small" class="filter-btn">
            <view class="btn-content">
              <wd-icon name="filter" size="28rpx" color="#666" />
              <text>筛选</text>
            </view>
          </wd-button>
        </view>

        <!-- 记录表格头部 -->
        <view
          class="records-table"
          :class="{ 'animate-in-delay-2': showAnimations }"
        >
          <view class="table-header">
            <view class="th student-info">
              学生信息
            </view>
            <view class="th check-time">
              签到时间
            </view>
            <view class="th status">
              状态
            </view>
          </view>

          <!-- 记录列表 -->
          <view class="table-body">
            <view
              v-if="records.length === 0"
              class="empty-state"
            >
              <wd-icon name="info" size="60rpx" color="#909399" />
              <text>暂无考勤记录</text>
            </view>

            <view
              v-for="(record, index) in records"
              :key="record.id"
              class="table-row"
              :class="{ 'animate-in-item': showAnimations }"
              :style="{ animationDelay: `${0.1 + index * 0.05}s` }"
            >
              <view class="td student-info">
                <view class="student-avatar">
                  <text>{{ record.studentName ? record.studentName.substring(0, 1) : 'U' }}</text>
                </view>
                <view class="student-detail">
                  <text class="student-name">
                    {{ record.studentName }}
                  </text>
                  <text class="student-id">
                    {{ record.studentId }}
                  </text>
                </view>
              </view>

              <view class="td check-time">
                <text class="time">
                  {{ formatTime(record.checkInTime) }}
                </text>
                <text class="date">
                  {{ formatDate(record.checkInTime) }}
                </text>
              </view>

              <view class="td status">
                <view
                  class="status-tag"
                  :class="getStatusClass(record)"
                >
                  {{ getStatusLabel(record) }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </block>
    </view>
  </view>
</template>

<style lang="scss">
.container {
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
    height: 200rpx;
    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    z-index: -1;
  }

  .nav-action {
    padding: 0 20rpx;
    height: 100%;
    display: flex;
    align-items: center;
  }
}

.content-wrapper {
  width: 100%;
  padding: 30rpx;
  box-sizing: border-box;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;

  .loading-text {
    margin-top: 20rpx;
    font-size: 30rpx;
    color: #666;
  }
}

.stats-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;

  .stats-item {
    text-align: center;

    .stats-value {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 8rpx;
    }

    .stats-label {
      font-size: 24rpx;
      color: #666;
    }

    &:nth-child(1) .stats-value {
      color: #6a11cb;
    }

    &:nth-child(2) .stats-value {
      color: #52c41a;
    }

    &:nth-child(3) .stats-value {
      color: #faad14;
    }

    &:nth-child(4) .stats-value {
      color: #f5222d;
    }
  }
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;

  .search-input {
    flex: 1;
    margin-right: 20rpx;
  }

  .filter-btn {
    .btn-content {
      display: flex;
      align-items: center;

      text {
        margin-left: 8rpx;
      }
    }
  }
}

.records-table {
  background-color: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .table-header {
    display: flex;
    font-weight: bold;
    background-color: #f5f7fa;

    .th {
      padding: 24rpx 20rpx;
      font-size: 28rpx;
      color: #606266;
      text-align: left;

      &.student-info {
        flex: 2;
      }

      &.check-time {
        flex: 1;
      }

      &.status {
        flex: 1;
        text-align: center;
      }
    }
  }

  .table-body {
    .empty-state {
      padding: 60rpx 20rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      text {
        margin-top: 20rpx;
        font-size: 28rpx;
        color: #909399;
      }
    }

    .table-row {
      display: flex;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.3s ease;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: #f9f9f9;
      }

      .td {
        padding: 20rpx;
        font-size: 28rpx;

        &.student-info {
          flex: 2;
          display: flex;
          align-items: center;

          .student-avatar {
            width: 60rpx;
            height: 60rpx;
            border-radius: 30rpx;
            background-color: rgba(106, 17, 203, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16rpx;

            text {
              font-size: 28rpx;
              color: #6a11cb;
              font-weight: bold;
            }
          }

          .student-detail {
            .student-name {
              display: block;
              font-size: 28rpx;
              color: #333;
              margin-bottom: 6rpx;
            }

            .student-id {
              font-size: 24rpx;
              color: #909399;
            }
          }
        }

        &.check-time {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;

          .time {
            font-size: 28rpx;
            color: #333;
            margin-bottom: 6rpx;
          }

          .date {
            font-size: 24rpx;
            color: #909399;
          }
        }

        &.status {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;

          .status-tag {
            padding: 6rpx 16rpx;
            border-radius: 12rpx;
            font-size: 24rpx;
            text-align: center;

            &.status-present {
              background-color: rgba(82, 196, 26, 0.1);
              color: #52c41a;
            }

            &.status-late {
              background-color: rgba(250, 173, 20, 0.1);
              color: #faad14;
            }

            &.status-absent {
              background-color: rgba(245, 34, 45, 0.1);
              color: #f5222d;
            }
          }
        }
      }
    }
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

.animate-in-item {
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
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
</style>
