<script lang="ts" setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { CheckInType, getTaskDetail, studentCheckIn } from '@/api/task'
import CustomNavBar from '@/components/CustomNavBar.vue'

// 用户信息
const _userStore = useUserStore()

// 页面状态
const loading = ref(false)
const submitting = ref(false)
const taskId = ref<string>('')
const taskDetails = ref<any>(null)
const selectedMethod = ref<CheckInType | null>(null)
const qrCodeValue = ref<string>('')
const location = ref<{ latitude: number, longitude: number } | null>(null)
const showAnimations = ref(false)

// 初始化页面数据
onLoad((options: any) => {
  if (options?.taskId) {
    taskId.value = options.taskId
    loadTaskDetails()
  }
  else {
    uni.showToast({
      title: '无效的签到任务',
      icon: 'error',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }

  // 延迟显示动画效果，实现进入页面的渐入效果
  setTimeout(() => {
    showAnimations.value = true
  }, 100)
})

// 每次显示页面时更新
onShow(() => {
  if (taskId.value) {
    loadTaskDetails()
  }
})

// 检查签到方法是否可用
const availableMethods = computed(() => {
  if (!taskDetails.value)
    return []

  const methods: CheckInType[] = []

  // 检查支持的签到方式
  if (taskDetails.value.checkInType === CheckInType.QR_CODE) {
    methods.push(CheckInType.QR_CODE)
  }
  else if (taskDetails.value.checkInType === CheckInType.LOCATION) {
    methods.push(CheckInType.LOCATION)
  }
  else if (taskDetails.value.checkInType === CheckInType.GPS) {
    methods.push(CheckInType.GPS)
  }
  else if (taskDetails.value.checkInType === CheckInType.WIFI) {
    methods.push(CheckInType.WIFI)
  }
  else if (taskDetails.value.checkInType === CheckInType.MANUAL) {
    methods.push(CheckInType.MANUAL)
  }
  else if (taskDetails.value.checkInType === CheckInType.AUTOMATIC) {
    methods.push(CheckInType.AUTOMATIC)
  }

  return methods
})

// 获取签到任务详情
async function loadTaskDetails() {
  try {
    loading.value = true
    const res = await getTaskDetail(taskId.value)
    taskDetails.value = res

    // 如果只有一种签到方式，自动选择
    if (availableMethods.value.length === 1) {
      selectedMethod.value = availableMethods.value[0]
    }
  }
  catch (error) {
    console.error('获取签到任务详情失败', error)
    uni.showToast({
      title: '获取签到任务失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

// 选择签到方式
function selectMethod(method: CheckInType) {
  selectedMethod.value = method

  // 根据方式初始化相关数据
  if (method === CheckInType.QR_CODE) {
    scanQrCode()
  }
  else if (method === CheckInType.LOCATION || method === CheckInType.GPS) {
    getLocation()
  }
  else if (method === CheckInType.AUTOMATIC) {
    // 自动签到直接提交
    submitCheckIn()
  }
}

// 扫描二维码
function scanQrCode() {
  uni.scanCode({
    success: (res) => {
      qrCodeValue.value = res.result
      if (qrCodeValue.value) {
        submitCheckIn()
      }
    },
    fail: () => {
      uni.showToast({
        title: '扫码失败',
        icon: 'error',
      })
      selectedMethod.value = null
    },
  })
}

// 获取定位
function getLocation() {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      location.value = {
        latitude: res.latitude,
        longitude: res.longitude,
      }
    },
    fail: () => {
      uni.showToast({
        title: '获取位置失败',
        icon: 'error',
      })
      selectedMethod.value = null
    },
  })
}

// 提交签到
async function submitCheckIn() {
  if (!selectedMethod.value || !taskId.value) {
    uni.showToast({
      title: '请选择签到方式',
      icon: 'none',
    })
    return
  }

  try {
    submitting.value = true

    // 获取设备信息 - 避免使用已弃用的API
    const sysInfo = uni.getSystemInfoSync() // 临时使用，后续升级
    const deviceInfo = JSON.stringify({
      platform: sysInfo.platform,
      brand: sysInfo.brand,
      model: sysInfo.model,
    })

    // 获取IP地址（模拟）
    const ipAddress = '192.168.1.1' // 实际情况中应通过网络请求获取

    // 准备位置信息
    const checkInLocation = location.value
      ? `${location.value.latitude},${location.value.longitude}`
      : taskDetails.value.locationRequirement || ''

    await studentCheckIn(
      taskId.value,
      checkInLocation,
      ipAddress,
      deviceInfo,
    )

    uni.showToast({
      title: '签到成功',
      icon: 'success',
    })

    // 延迟返回上一页
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  catch (error: any) {
    console.error('签到失败', error)
    uni.showToast({
      title: error.message || '签到失败',
      icon: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="container">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="签到"
      background-color="#6a11cb"
      scrolled-background-color="rgba(106, 17, 203, 0.95)"
      :enable-scroll-effect="true"
      @back="goBack"
    >
      <template #right>
        <wd-icon name="help" size="44rpx" color="#fff" />
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

      <!-- 任务详情 -->
      <view
        v-else-if="taskDetails"
        class="checkin-container"
        :class="{ 'animate-in': showAnimations }"
      >
        <view class="task-card">
          <view class="task-header">
            <text class="task-title">
              {{ taskDetails.title }}
            </text>
            <view class="task-status" :class="{ 'status-active': taskDetails.status === 'ACTIVE' }">
              <text>
                {{ taskDetails.status === 'ACTIVE' ? '进行中' : taskDetails.status === 'COMPLETED' ? '已结束' : '未开始' }}
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
                {{ new Date(taskDetails.startTime).toLocaleString() }} 至 {{ new Date(taskDetails.endTime).toLocaleString() }}
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

        <!-- 签到方式选择 -->
        <view
          v-if="taskDetails.status === 'ACTIVE'"
          class="checkin-methods"
          :class="{ 'animate-in-delay': showAnimations }"
        >
          <text class="section-title">
            选择签到方式
          </text>
          <view class="methods-list">
            <view
              v-for="(method, index) in availableMethods"
              :key="method"
              class="method-item"
              :class="{
                'active': selectedMethod === method,
                'animate-bounce': showAnimations,
                'delay-100': index === 0,
                'delay-200': index === 1,
                'delay-300': index === 2,
              }"
              @click="selectMethod(method)"
            >
              <view class="method-icon">
                <wd-icon
                  :name="
                    method === 'QR_CODE' ? 'qrcode'
                    : method === 'LOCATION' || method === 'GPS' ? 'location'
                      : method === 'WIFI' ? 'wifi'
                        : method === 'MANUAL' ? 'edit'
                          : 'check'
                  "
                  size="70rpx"
                  :color="selectedMethod === method ? '#fff' : '#6a11cb'"
                />
              </view>
              <text class="method-name">
                {{
                  method === 'QR_CODE' ? '二维码签到'
                  : method === 'LOCATION' ? '位置签到'
                    : method === 'GPS' ? 'GPS签到'
                      : method === 'WIFI' ? 'Wi-Fi签到'
                        : method === 'AUTOMATIC' ? '自动签到'
                          : '手动签到'
                }}
              </text>
            </view>
          </view>
        </view>

        <!-- 提交按钮 -->
        <view
          v-if="taskDetails.status === 'ACTIVE'"
          class="submit-area"
          :class="{ 'animate-in-delay-2': showAnimations }"
        >
          <view v-if="location && (selectedMethod === 'LOCATION' || selectedMethod === 'GPS')" class="location-info">
            <text>当前位置: {{ location.latitude }}, {{ location.longitude }}</text>
          </view>
          <wd-button
            v-if="selectedMethod && selectedMethod !== 'QR_CODE' && selectedMethod !== 'AUTOMATIC'"
            type="primary"
            :loading="submitting"
            class="animate-pulse-subtle"
            @click="submitCheckIn"
          >
            确认签到
          </wd-button>
        </view>

        <!-- 任务已结束或未开始的提示 -->
        <view
          v-if="taskDetails.status !== 'ACTIVE'"
          class="status-message"
          :class="{ 'animate-in-delay': showAnimations }"
        >
          <wd-icon
            :name="taskDetails.status === 'COMPLETED' ? 'time-out' : 'time'"
            size="120rpx"
            :color="taskDetails.status === 'COMPLETED' ? '#ff4d4f' : '#faad14'"
            class="animate-bounce-subtle"
          />
          <text class="status-text">
            {{ taskDetails.status === 'COMPLETED' ? '签到已结束' : '签到未开始' }}
          </text>
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
          无效的签到任务
        </text>
        <wd-button
          type="primary"
          class="animate-in-delay"
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
  display: flex;
  flex-direction: column;
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

.content-wrapper {
  flex: 1;
  padding: 30rpx;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;

  .loading-text, .error-text {
    margin-top: 30rpx;
    font-size: 32rpx;
    color: #666;
  }

  .wd-button {
    margin-top: 40rpx;
  }
}

.checkin-container {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);

  .task-card {
    .task-header {
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 20rpx;
      margin-bottom: 20rpx;

      .task-title {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 10rpx;
      }

      .task-status {
        font-size: 28rpx;
        color: #666;
        padding: 10rpx 20rpx;
        border-radius: 16rpx;
        background-color: rgba(106, 17, 203, 0.1);

        &.status-active {
          background-color: rgba(106, 17, 203, 0.1);
        }
      }
    }

    .task-details {
      margin-bottom: 20rpx;

      .task-item {
        display: flex;
        align-items: center;
        margin-bottom: 16rpx;

        .item-label {
          margin-right: 20rpx;
          font-size: 30rpx;
          color: #666;
        }

        .item-value {
          font-size: 30rpx;
          color: #333;
        }
      }
    }
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.checkin-methods {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 30rpx;

  .methods-list {
    display: flex;
    flex-wrap: wrap;

    .method-item {
      width: 33.33%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 40rpx;
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.95);
      }

      .method-icon {
        width: 140rpx;
        height: 140rpx;
        border-radius: 70rpx;
        background-color: rgba(106, 17, 203, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20rpx;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 10rpx 20rpx rgba(106, 17, 203, 0.2);
        }
      }

      .method-name {
        font-size: 28rpx;
        color: #333;
        text-align: center;
      }

      &.active {
        .method-icon {
          background-color: #6a11cb;
          box-shadow: 0 10rpx 20rpx rgba(106, 17, 203, 0.3);
        }

        .method-name {
          color: #6a11cb;
          font-weight: bold;
        }
      }
    }
  }
}

.submit-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40rpx;

  .location-info {
    font-size: 28rpx;
    color: #666;
  }

  .wd-button {
    width: 48%;
    font-weight: bold;
    box-shadow: 0 10rpx 20rpx rgba(106, 17, 203, 0.2);
  }
}

.status-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;

  .status-text {
    margin-top: 30rpx;
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

.animate-bounce {
  animation: bounce 2s infinite;
}

.animate-bounce-subtle {
  animation: bounceSubtle 3s infinite;
}

.animate-pulse-subtle {
  animation: pulseSubtle 2s infinite;
}

.animate-shake {
  animation: shake 0.8s ease;
}

.delay-100 {
  animation-delay: 0.1s;
}

.delay-200 {
  animation-delay: 0.2s;
}

.delay-300 {
  animation-delay: 0.3s;
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

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20rpx);
  }
  60% {
    transform: translateY(-10rpx);
  }
}

@keyframes bounceSubtle {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10rpx);
  }
  60% {
    transform: translateY(-5rpx);
  }
}

@keyframes pulseSubtle {
  0% {
    transform: scale(1);
    box-shadow: 0 10rpx 20rpx rgba(106, 17, 203, 0.2);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 15rpx 25rpx rgba(106, 17, 203, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 10rpx 20rpx rgba(106, 17, 203, 0.2);
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
