<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import { getTaskDetail } from '@/api/task'

// 用户信息
const userStore = useUserStore()
const isTeacher = ref(false)

// 页面数据
const loading = ref(true)
const taskId = ref('')
const taskDetails = ref<any>(null)
const showAnimations = ref(false)

// 初始化数据
onLoad((options: any) => {
  if (options?.id) {
    taskId.value = options.id
    loadTaskDetails()
  }

  // 确定用户角色
  isTeacher.value = userStore.userInfo?.role === 'teacher'

  // 延迟显示动画效果
  setTimeout(() => {
    showAnimations.value = true
  }, 100)
})

// 加载任务详情
async function loadTaskDetails() {
  try {
    loading.value = true
    const response = await getTaskDetail(taskId.value)
    taskDetails.value = response
  }
  catch (error) {
    console.error('加载任务详情失败', error)
    uni.showToast({
      title: '获取数据失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

// 导航到签到页面
function navigateToCheckIn() {
  uni.navigateTo({
    url: `/pages/check-in/index?id=${taskId.value}`,
  })
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="container">
    <view class="content-wrapper">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <wd-loading color="#6a11cb" size="60px" />
        <text class="loading-text">
          加载中...
        </text>
      </view>

      <!-- 任务详情 -->
      <view
        v-else-if="taskDetails"
        class="task-detail"
        :class="{ 'animate-in': showAnimations }"
      >
        <view class="task-card">
          <view class="task-header">
            <text class="task-title">
              {{ taskDetails.title }}
            </text>
            <view
              class="task-status"
              :class="{
                'status-active': taskDetails.status === 'ACTIVE',
                'status-completed': taskDetails.status === 'COMPLETED',
                'status-created': taskDetails.status === 'CREATED',
              }"
            >
              <text>
                {{
                  taskDetails.status === 'ACTIVE' ? '进行中'
                  : taskDetails.status === 'COMPLETED' ? '已结束'
                    : taskDetails.status === 'CREATED' ? '未开始'
                      : '未知状态'
                }}
              </text>
            </view>
          </view>

          <view class="task-details">
            <view class="task-item">
              <text class="item-label">
                创建人:
              </text>
              <text class="item-value">
                {{ taskDetails.creatorName }}
              </text>
            </view>
            <view class="task-item">
              <text class="item-label">
                签到时间:
              </text>
              <text class="item-value">
                {{ new Date(taskDetails.startTime).toLocaleString() }} 至
                {{ new Date(taskDetails.endTime).toLocaleString() }}
              </text>
            </view>
            <view class="task-item">
              <text class="item-label">
                签到类型:
              </text>
              <text class="item-value">
                {{
                  taskDetails.checkInType === 'QR_CODE' ? '二维码签到'
                  : taskDetails.checkInType === 'LOCATION' ? '位置签到'
                    : taskDetails.checkInType === 'GPS' ? 'GPS签到'
                      : taskDetails.checkInType === 'WIFI' ? 'Wi-Fi签到'
                        : taskDetails.checkInType === 'AUTOMATIC' ? '自动签到'
                          : '手动签到'
                }}
              </text>
            </view>
            <view class="task-item">
              <text class="item-label">
                签到地点:
              </text>
              <text class="item-value">
                {{ taskDetails.locationRequirement || '无地点要求' }}
              </text>
            </view>
            <view v-if="taskDetails.description" class="task-item description">
              <text class="item-label">
                任务说明:
              </text>
              <text class="item-value">
                {{ taskDetails.description }}
              </text>
            </view>
          </view>
        </view>

        <!-- 任务操作区域 -->
        <view
          class="task-actions"
          :class="{ 'animate-in-delay': showAnimations }"
        >
          <wd-button
            type="default"
            class="btn-animate"
            @click="goBack"
          >
            返回
          </wd-button>

          <wd-button
            v-if="taskDetails.status === 'ACTIVE'"
            type="primary"
            class="btn-primary"
            @click="navigateToCheckIn"
          >
            前往签到
          </wd-button>
        </view>

        <!-- 任务统计卡片 -->
        <view
          class="task-stats-card"
          :class="{ 'animate-in-delay-2': showAnimations }"
        >
          <view class="stats-header">
            <text class="stats-title">
              签到统计
            </text>
          </view>
          <view class="stats-content">
            <view class="stats-item">
              <view class="stats-icon">
                <wd-icon name="user" size="50rpx" color="#6a11cb" />
              </view>
              <view class="stats-info">
                <text class="stats-value">
                  {{ taskDetails.participantCount || 0 }}
                </text>
                <text class="stats-label">
                  参与人数
                </text>
              </view>
            </view>
            <view class="stats-item">
              <view class="stats-icon">
                <wd-icon name="check-in" size="50rpx" color="#52c41a" />
              </view>
              <view class="stats-info">
                <text class="stats-value">
                  {{ taskDetails.checkInCount || 0 }}
                </text>
                <text class="stats-label">
                  已签到
                </text>
              </view>
            </view>
            <view class="stats-item">
              <view class="stats-icon">
                <wd-icon name="time" size="50rpx" color="#faad14" />
              </view>
              <view class="stats-info">
                <text class="stats-value">
                  {{ taskDetails.lateCount || 0 }}
                </text>
                <text class="stats-label">
                  迟到
                </text>
              </view>
            </view>
            <view class="stats-item">
              <view class="stats-icon">
                <wd-icon name="close" size="50rpx" color="#f5222d" />
              </view>
              <view class="stats-info">
                <text class="stats-value">
                  {{ taskDetails.absentCount || 0 }}
                </text>
                <text class="stats-label">
                  缺勤
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 无效任务 -->
      <view
        v-else
        class="error-container"
        :class="{ 'animate-in': showAnimations }"
      >
        <wd-icon
          name="warning"
          size="120rpx"
          color="#ff4d4f"
          class="animate-shake"
        />
        <text class="error-text">
          无效的任务
        </text>
        <wd-button
          type="primary"
          class="btn-animate"
          @click="goBack"
        >
          返回
        </wd-button>
      </view>
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

.task-detail {
  width: 100%;
}

.task-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5rpx);
    box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.15);
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 20rpx;
    margin-bottom: 20rpx;

    .task-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      flex: 1;
    }

    .task-status {
      padding: 10rpx 20rpx;
      border-radius: 16rpx;
      font-size: 28rpx;
      transition: all 0.3s ease;

      &.status-active {
        background-color: rgba(82, 196, 26, 0.1);
        color: #52c41a;
      }

      &.status-completed {
        background-color: rgba(144, 147, 153, 0.1);
        color: #909399;
      }

      &.status-created {
        background-color: rgba(250, 173, 20, 0.1);
        color: #faad14;
      }
    }
  }

  .task-details {
    .task-item {
      display: flex;
      margin-bottom: 16rpx;

      .item-label {
        width: 160rpx;
        font-size: 30rpx;
        color: #666;
      }

      .item-value {
        flex: 1;
        font-size: 30rpx;
        color: #333;
      }

      &.description {
        flex-direction: column;

        .item-label {
          margin-bottom: 10rpx;
        }

        .item-value {
          line-height: 1.5;
        }
      }
    }
  }
}

.task-actions {
  display: flex;
  justify-content: space-between;
  margin: 40rpx 0;

  .wd-button {
    min-width: 240rpx;
    box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
    }
  }

  .btn-primary {
    background: linear-gradient(45deg, #6a11cb, #2575fc);
  }
}

.task-stats-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);

  .stats-header {
    margin-bottom: 30rpx;

    .stats-title {
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
  }

  .stats-content {
    display: flex;
    flex-wrap: wrap;

    .stats-item {
      width: 50%;
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;

      .stats-icon {
        width: 80rpx;
        height: 80rpx;
        background-color: rgba(106, 17, 203, 0.1);
        border-radius: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;
      }

      .stats-info {
        .stats-value {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
          display: block;
        }

        .stats-label {
          font-size: 24rpx;
          color: #666;
        }
      }
    }
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;

  .error-text {
    margin: 40rpx 0;
    font-size: 32rpx;
    color: #666;
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

.animate-shake {
  animation: shake 0.8s ease;
}

.btn-animate {
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.15);
  }
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

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-10rpx);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(10rpx);
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "任务详情"
  }
}
</route>
