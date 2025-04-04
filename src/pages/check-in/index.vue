<script lang="ts" setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useUserStore } from '@/store/user'
import CustomNavBar from '@/components/CustomNavBar.vue'
import { CheckInMethod, checkIn, getAttendanceSessionDetails } from '@/api/attendance'

// 用户信息
const userStore = useUserStore()

// 页面状态
const loading = ref(false)
const submitting = ref(false)
const sessionId = ref<string>('')
const sessionDetails = ref<any>(null)
const selectedMethod = ref<CheckInMethod | null>(null)
const qrCodeValue = ref<string>('')
const location = ref<{ latitude: number, longitude: number } | null>(null)

// 初始化页面数据
onLoad((options) => {
  if (options.sessionId) {
    sessionId.value = options.sessionId
    loadSessionDetails()
  }
  else {
    uni.showToast({
      title: '无效的签到会话',
      icon: 'error',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

// 每次显示页面时更新
onShow(() => {
  if (sessionId.value) {
    loadSessionDetails()
  }
})

// 检查签到方法是否可用
const availableMethods = computed(() => {
  if (!sessionDetails.value)
    return []

  const methods: CheckInMethod[] = []

  // 检查支持的签到方式
  if (sessionDetails.value.method === CheckInMethod.QR_CODE || sessionDetails.value.method === 'all') {
    methods.push(CheckInMethod.QR_CODE)
  }

  if (sessionDetails.value.method === CheckInMethod.LOCATION || sessionDetails.value.method === 'all') {
    methods.push(CheckInMethod.LOCATION)
  }

  if (sessionDetails.value.method === CheckInMethod.BLUETOOTH || sessionDetails.value.method === 'all') {
    methods.push(CheckInMethod.BLUETOOTH)
  }

  if (sessionDetails.value.method === CheckInMethod.WIFI || sessionDetails.value.method === 'all') {
    methods.push(CheckInMethod.WIFI)
  }

  if (sessionDetails.value.method === CheckInMethod.FACE || sessionDetails.value.method === 'all') {
    methods.push(CheckInMethod.FACE)
  }

  return methods
})

// 获取签到会话详情
async function loadSessionDetails() {
  try {
    loading.value = true
    const res = await getAttendanceSessionDetails(sessionId.value)
    sessionDetails.value = res.data

    // 如果只有一种签到方式，自动选择
    if (availableMethods.value.length === 1) {
      selectedMethod.value = availableMethods.value[0]
    }
  }
  catch (error) {
    console.error('获取签到会话详情失败', error)
    uni.showToast({
      title: '获取签到会话失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

// 选择签到方式
function selectMethod(method: CheckInMethod) {
  selectedMethod.value = method

  // 根据方式初始化相关数据
  if (method === CheckInMethod.QR_CODE) {
    scanQrCode()
  }
  else if (method === CheckInMethod.LOCATION) {
    getLocation()
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
  if (!selectedMethod.value || !sessionId.value) {
    uni.showToast({
      title: '请选择签到方式',
      icon: 'none',
    })
    return
  }

  try {
    submitting.value = true

    const params: any = {
      sessionId: sessionId.value,
      method: selectedMethod.value,
    }

    // 根据不同签到方式添加不同参数
    if (selectedMethod.value === CheckInMethod.QR_CODE && qrCodeValue.value) {
      params.qrCodeContent = qrCodeValue.value
    }
    else if (selectedMethod.value === CheckInMethod.LOCATION && location.value) {
      params.location = location.value
    }

    const res = await checkIn(params)

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
  <view class="page-container">
    <!-- 导航栏 -->
    <CustomNavBar title="课程签到" @back="goBack" />

    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <wd-loading color="#6a11cb" size="60px" />
        <text class="loading-text">
          加载中...
        </text>
      </view>

      <!-- 签到内容 -->
      <block v-else-if="sessionDetails">
        <view class="session-card">
          <view class="session-header">
            <text class="session-name">
              {{ sessionDetails.courseName }}
            </text>
            <text class="session-teacher">
              {{ sessionDetails.teacherName }}
            </text>
          </view>
          <view class="session-body">
            <view class="session-info-item">
              <wd-icon name="clock" size="40rpx" color="#6a11cb" />
              <text>{{ sessionDetails.startTime }} - {{ sessionDetails.endTime }}</text>
            </view>
            <view v-if="sessionDetails.location" class="session-info-item">
              <wd-icon name="location" size="40rpx" color="#6a11cb" />
              <text>{{ sessionDetails.location.address || '位置信息' }}</text>
            </view>
          </view>
          <view class="session-status">
            <view class="status-label">
              签到状态
            </view>
            <view class="status-value">
              进行中
            </view>
          </view>
        </view>

        <!-- 选择签到方式 -->
        <view v-if="!selectedMethod" class="checkin-methods">
          <view class="section-title">
            选择签到方式
          </view>

          <view class="methods-grid">
            <view
              v-for="method in availableMethods"
              :key="method"
              class="method-item"
              @click="selectMethod(method)"
            >
              <view class="method-icon">
                <wd-icon
                  :name="
                    method === 'qrcode' ? 'qrcode'
                    : method === 'location' ? 'location'
                      : method === 'bluetooth' ? 'bluetooth'
                        : method === 'wifi' ? 'wifi'
                          : method === 'face' ? 'face-recognition'
                            : 'help'
                  "
                  size="60rpx"
                  color="#6a11cb"
                />
              </view>
              <text class="method-name">
                {{
                  method === 'qrcode' ? '二维码签到'
                  : method === 'location' ? '位置签到'
                    : method === 'bluetooth' ? '蓝牙签到'
                      : method === 'wifi' ? 'Wi-Fi签到'
                        : method === 'face' ? '人脸签到'
                          : '其他方式'
                }}
              </text>
            </view>
          </view>
        </view>

        <!-- 位置签到界面 -->
        <view v-else-if="selectedMethod === 'location'" class="checkin-form">
          <view class="section-title">
            位置签到
          </view>

          <view class="location-map">
            <map
              style="width: 100%; height: 400rpx;"
              :latitude="location?.latitude || 0"
              :longitude="location?.longitude || 0"
              :markers="[{
                id: 1,
                latitude: location?.latitude || 0,
                longitude: location?.longitude || 0,
                title: '当前位置',
              }]"
              :circles="sessionDetails.location ? [{
                latitude: sessionDetails.location.latitude,
                longitude: sessionDetails.location.longitude,
                radius: sessionDetails.location.range,
                fillColor: '#6a11cb20',
                strokeColor: '#6a11cb',
              }] : []"
              scale="16"
            />
          </view>

          <view class="form-tips">
            <text>您当前位置已获取，点击下方按钮完成签到</text>
          </view>

          <view class="form-actions">
            <wd-button type="default" size="large" @click="selectedMethod = null">
              更换签到方式
            </wd-button>
            <wd-button type="primary" size="large" :loading="submitting" @click="submitCheckIn">
              确认签到
            </wd-button>
          </view>
        </view>

        <!-- 其他签到方式 -->
        <view v-else class="checkin-form">
          <view class="section-title">
            {{
              selectedMethod === 'qrcode' ? '二维码签到'
              : selectedMethod === 'bluetooth' ? '蓝牙签到'
                : selectedMethod === 'wifi' ? 'Wi-Fi签到'
                  : selectedMethod === 'face' ? '人脸签到'
                    : '其他方式'
            }}
          </view>

          <view class="form-tips">
            <text>请按提示完成签到操作</text>
          </view>

          <view class="form-actions">
            <wd-button type="default" size="large" @click="selectedMethod = null">
              更换签到方式
            </wd-button>
            <wd-button
              v-if="selectedMethod !== 'qrcode'"
              type="primary"
              size="large"
              :loading="submitting"
              @click="submitCheckIn"
            >
              确认签到
            </wd-button>
          </view>
        </view>
      </block>

      <!-- 无效的签到会话 -->
      <view v-else class="error-container">
        <wd-icon name="warning" size="120rpx" color="#ff4d4f" />
        <text class="error-text">
          无效的签到会话
        </text>
        <wd-button type="primary" @click="goBack">
          返回
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
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

.session-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .session-header {
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 20rpx;
    margin-bottom: 20rpx;

    .session-name {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 10rpx;
    }

    .session-teacher {
      font-size: 28rpx;
      color: #666;
    }
  }

  .session-body {
    margin-bottom: 20rpx;

    .session-info-item {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;

      .wd-icon {
        margin-right: 20rpx;
      }

      text {
        font-size: 30rpx;
        color: #333;
      }
    }
  }

  .session-status {
    background-color: #f9f9f9;
    border-radius: 16rpx;
    padding: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .status-label {
      font-size: 28rpx;
      color: #666;
    }

    .status-value {
      font-size: 30rpx;
      font-weight: bold;
      color: #6a11cb;
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
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .methods-grid {
    display: flex;
    flex-wrap: wrap;

    .method-item {
      width: 33.33%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 40rpx;

      .method-icon {
        width: 120rpx;
        height: 120rpx;
        border-radius: 60rpx;
        background-color: rgba(106, 17, 203, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20rpx;
      }

      .method-name {
        font-size: 28rpx;
        color: #333;
        text-align: center;
      }
    }
  }
}

.checkin-form {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .form-tips {
    margin: 40rpx 0;
    text-align: center;
    font-size: 30rpx;
    color: #666;
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 40rpx;

    .wd-button {
      width: 48%;
    }
  }
}

.location-map {
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
</style>
