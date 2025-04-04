<script lang="ts" setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { CheckInType, getTaskDetail, studentCheckIn } from '@/api/task'

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
const submittedSuccess = ref(false)
const error = ref(false)
const errorMessage = ref('')

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
    error.value = false

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

    submittedSuccess.value = true
    uni.showToast({
      title: '签到成功',
      icon: 'success',
    })
  }
  catch (err: any) {
    console.error('签到失败', err)
    error.value = true
    errorMessage.value = err?.message || '签到失败，请重试'
    uni.showToast({
      title: '签到失败',
      icon: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

// 返回上一页
function handleBack() {
  uni.navigateBack()
}

// 重试
function tryAgain() {
  error.value = false
  errorMessage.value = ''
  loadTaskDetails()
}
</script>

<template>
  <view class="container">
    <!-- 页面内容 -->
    <scroll-view scroll-y class="content-wrapper">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <wd-loading color="#6a11cb" size="60px" />
        <text class="loading-text">
          加载中...
        </text>
      </view>

      <!-- 签到任务卡片 -->
      <view
        v-if="taskDetails && !loading"
        class="check-in-card"
        :class="{ 'animate-in': showAnimations }"
      >
        <view class="task-info">
          <text class="task-title">
            {{ taskDetails.title }}
          </text>
          <text class="task-time">
            {{ new Date(taskDetails.startTime).toLocaleString() }} - {{ new Date(taskDetails.endTime).toLocaleString() }}
          </text>
          <text class="task-creator">
            创建者: {{ taskDetails.creatorName }}
          </text>
          <text class="task-location">
            位置: {{ taskDetails.locationRequirement || '无要求' }}
          </text>
        </view>

        <!-- 签到状态图标 -->
        <view class="checkin-status" :class="{ 'animate-in-delay': showAnimations }">
          <wd-icon v-if="submitting" name="loading" size="120rpx" color="#6a11cb" />
          <wd-icon
            v-else
            name="location"
            size="120rpx"
            :color="selectedMethod ? '#52c41a' : '#6a11cb'"
          />
          <text class="status-text">
            {{ submitting ? '正在签到...' : '请选择签到方式' }}
          </text>
        </view>

        <!-- 签到方式选择 -->
        <view
          v-if="!submitting && availableMethods.length > 0"
          class="check-methods"
          :class="{ 'animate-in-delay-2': showAnimations }"
        >
          <text class="method-title">
            可用签到方式:
          </text>
          <view class="method-list">
            <view
              v-for="(method, index) in availableMethods"
              :key="method"
              class="method-item"
              :class="{
                'selected': selectedMethod === method,
                'animate-in-delay-100': index === 0 && showAnimations,
                'animate-in-delay-200': index === 1 && showAnimations,
                'animate-in-delay-300': index >= 2 && showAnimations,
              }"
              @click="selectMethod(method)"
            >
              <wd-icon
                :name="
                  method === 'QR_CODE' ? 'qr-code'
                  : method === 'LOCATION' || method === 'GPS' ? 'location'
                    : method === 'WIFI' ? 'wifi'
                      : method === 'AUTOMATIC' ? 'upload'
                        : 'edit'
                "
                size="56rpx"
                :color="selectedMethod === method ? '#fff' : '#6a11cb'"
              />
              <text class="method-name">
                {{
                  method === 'QR_CODE' ? '扫码签到'
                  : method === 'LOCATION' ? '位置签到'
                    : method === 'GPS' ? 'GPS签到'
                      : method === 'WIFI' ? 'WIFI签到'
                        : method === 'AUTOMATIC' ? '自动签到'
                          : '手动签到'
                }}
              </text>
            </view>
          </view>
        </view>

        <!-- 位置信息显示 -->
        <view
          v-if="(selectedMethod === 'LOCATION' || selectedMethod === 'GPS') && location"
          class="location-info"
          :class="{ 'animate-in-delay-3': showAnimations }"
        >
          <text class="location-title">
            当前位置:
          </text>
          <text class="location-coords">
            经度: {{ location.longitude.toFixed(6) }}, 纬度: {{ location.latitude.toFixed(6) }}
          </text>
          <wd-button
            type="primary"
            class="submit-btn"
            @click="submitCheckIn"
          >
            确认签到
          </wd-button>
        </view>

        <!-- 签到按钮 -->
        <view
          v-if="!submitting && (selectedMethod === 'MANUAL') && !location"
          class="submit-section"
          :class="{ 'animate-in-delay-3': showAnimations }"
        >
          <wd-button
            type="primary"
            size="large"
            class="submit-btn"
            @click="submitCheckIn"
          >
            立即签到
          </wd-button>
        </view>

        <!-- 成功状态 -->
        <view
          v-if="!submitting && submittedSuccess"
          class="success-section"
          :class="{ 'animate-in-delay-3': showAnimations }"
        >
          <wd-icon name="check-circle" size="120rpx" color="#52c41a" />
          <text class="success-text">
            签到成功
          </text>
          <wd-button
            type="primary"
            size="medium"
            @click="handleBack"
          >
            返回
          </wd-button>
        </view>
      </view>

      <!-- 失败状态 -->
      <view v-if="error" class="error-container" :class="{ 'animate-in': showAnimations }">
        <wd-icon name="error" size="120rpx" color="#f5222d" />
        <text class="error-text">
          {{ errorMessage }}
        </text>
        <wd-button
          type="primary"
          size="medium"
          @click="tryAgain"
        >
          重试
        </wd-button>
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
  position: relative;
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
  height: 60vh;

  .loading-text, .error-text {
    margin-top: 40rpx;
    font-size: 32rpx;
    color: #666;
    margin-bottom: 40rpx;
  }
}

.check-in-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);

  .task-info {
    margin-bottom: 40rpx;

    .task-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 20rpx;
    }

    .task-time, .task-creator, .task-location {
      font-size: 28rpx;
      color: #666;
      display: block;
      margin-bottom: 10rpx;
    }
  }

  .checkin-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 50rpx;

    .status-text {
      margin-top: 20rpx;
      font-size: 32rpx;
      color: #333;
    }
  }

  .check-methods {
    margin-bottom: 50rpx;

    .method-title {
      font-size: 32rpx;
      font-weight: bold;
      display: block;
      margin-bottom: 20rpx;
      color: #333;
    }

    .method-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;

      .method-item {
        width: 200rpx;
        height: 200rpx;
        border-radius: 20rpx;
        background-color: #f0f0f0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-bottom: 20rpx;
        transition: all 0.3s ease;

        &.selected {
          background: linear-gradient(135deg, #6a11cb, #2575fc);
          transform: scale(1.05);
          box-shadow: 0 10rpx 20rpx rgba(106, 17, 203, 0.3);

          .method-name {
            color: white;
          }
        }

        &:active {
          transform: scale(0.95);
        }

        .method-name {
          margin-top: 20rpx;
          font-size: 28rpx;
          color: #333;
        }
      }
    }
  }

  .location-info, .submit-section, .success-section {
    text-align: center;

    .location-title {
      font-size: 32rpx;
      font-weight: bold;
      display: block;
      margin-bottom: 10rpx;
      color: #333;
    }

    .location-coords {
      font-size: 28rpx;
      color: #666;
      display: block;
      margin-bottom: 30rpx;
    }

    .submit-btn {
      margin-top: 20rpx;
      background: linear-gradient(135deg, #6a11cb, #2575fc);
    }

    .success-text {
      font-size: 36rpx;
      font-weight: bold;
      color: #52c41a;
      display: block;
      margin: 30rpx 0;
    }
  }
}

// 动画类
.animate-in {
  animation: fadeIn 0.6s ease forwards;
  opacity: 0;
}

.animate-in-delay {
  animation: fadeIn 0.6s ease 0.2s forwards;
  opacity: 0;
}

.animate-in-delay-2 {
  animation: fadeIn 0.6s ease 0.4s forwards;
  opacity: 0;
}

.animate-in-delay-3 {
  animation: fadeIn 0.6s ease 0.6s forwards;
  opacity: 0;
}

.animate-in-delay-100 {
  animation: fadeIn 0.6s ease 0.1s forwards;
  opacity: 0;
}

.animate-in-delay-200 {
  animation: fadeIn 0.6s ease 0.2s forwards;
  opacity: 0;
}

.animate-in-delay-300 {
  animation: fadeIn 0.6s ease 0.3s forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "签到"
  }
}
</route>
