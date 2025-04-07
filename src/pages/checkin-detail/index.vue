<!--
 * @Author: weisheng
 * @Date: 2025-04-08 10:00:00
 * @LastEditTime: 2025-04-08 10:00:00
 * @LastEditors: weisheng
 * @Description: 签到详情页面
 * @FilePath: \wot-demo\src\pages\checkin-detail\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { 
  CheckInType, 
  getCheckinQRCode as getCheckinQRCodeApi, 
  getCheckinRecordList, 
  getCheckinList
} from '@/api/attendance'

const userStore = useUserStore()
const loading = ref(false)
const checkinId = ref('')
const courseId = ref('')
const errorMessage = ref('')
const qrCodeUrl = ref('')
const countdown = ref('')
const statsLoading = ref(false)
const attendanceStats = reactive({
  totalStudents: 0,
  presentCount: 0,
  absentCount: 0,
  attendanceRate: 0
})
const refreshTimer = ref<NodeJS.Timeout | null>(null)
const countdownTimer = ref<NodeJS.Timeout | null>(null)
const checkinInfo = reactive({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  status: '',
  checkinType: ''
})

// 计算剩余时间
const isActive = computed(() => {
  if (!checkinInfo.status) return false
  return checkinInfo.status === 'ACTIVE'
})

// 更新倒计时
function updateCountdown() {
  if (!checkinInfo.endTime) return
  
  const endTime = new Date(checkinInfo.endTime).getTime()
  const now = new Date().getTime()
  const diff = endTime - now
  
  if (diff <= 0) {
    countdown.value = '已结束'
    if (countdownTimer.value) {
      clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
    return
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  countdown.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 自动刷新签到状态
async function refreshCheckinStatus() {
  try {
    const taskResponse = await getCheckinList(courseId.value, { page: 1, size: 10 })
    if (taskResponse && taskResponse.code === 200) {
      const tasks = taskResponse.data.items || []
      const currentTask = tasks.find(task => task.id === checkinId.value)
      
      if (currentTask) {
        checkinInfo.status = currentTask.status || ''
        
        // 如果签到已结束，停止刷新
        if (currentTask.status === 'ENDED') {
          if (refreshTimer.value) {
            clearInterval(refreshTimer.value)
            refreshTimer.value = null
          }
          
          // 签到结束后加载统计数据
          loadAttendanceStats()
        }
      }
    }
  } catch (e) {
    console.error('刷新签到状态失败:', e)
  }
}

// 加载签到统计数据
async function loadAttendanceStats() {
  try {
    statsLoading.value = true
    
    const response = await getCheckinRecordList(checkinId.value, { page: 1, size: 100 })
    
    if (response && response.code === 200) {
      const data = response.data
      const records = data.records || []
      
      attendanceStats.totalStudents = data.totalItems || 0
      attendanceStats.presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length
      attendanceStats.absentCount = attendanceStats.totalStudents - attendanceStats.presentCount
      
      if (attendanceStats.totalStudents > 0) {
        attendanceStats.attendanceRate = Math.round((attendanceStats.presentCount / attendanceStats.totalStudents) * 100)
      }
    }
  } catch (e) {
    console.error('加载签到统计失败:', e)
  } finally {
    statsLoading.value = false
  }
}

// 加载签到详情
async function loadCheckinDetail() {
  try {
    loading.value = true
    errorMessage.value = ''
    
    console.log('开始加载签到详情, ID:', checkinId.value, '课程ID:', courseId.value)
    
    // 直接加载二维码
    await loadQRCode()
    
    // 设置一些基本信息
    checkinInfo.title = '签到二维码'
    checkinInfo.description = '请学生扫描二维码进行签到'
    
    // 结束加载状态
    loading.value = false
  } catch (e) {
    console.error('加载签到详情失败:', e)
    errorMessage.value = '加载签到详情失败，请稍后再试'
    
    uni.showToast({
      title: '加载签到详情失败',
      icon: 'none'
    })
    loading.value = false
  }
}

// 加载二维码
async function loadQRCode() {
  try {
    console.log('开始加载二维码, ID:', checkinId.value)
    
    console.log('发起二维码请求...')
    const response = await getCheckinQRCodeApi(checkinId.value)
    console.log('二维码响应:', response ? '响应成功' : '响应失败')
    
    if (response && response.code === 200) {
      console.log('二维码数据长度:', response.data ? response.data.byteLength : '无数据')
      // 直接处理ArrayBuffer数据
      const base64 = uni.arrayBufferToBase64(response.data)
      qrCodeUrl.value = `data:image/png;base64,${base64}`
      console.log('二维码数据已转换为base64:', qrCodeUrl.value)
    } else {
      console.error('获取二维码失败:', response)
      throw new Error(response?.message || '获取二维码失败')
    }
  } catch (e) {
    console.error('获取二维码失败:', e)
    errorMessage.value = '获取二维码失败，请稍后再试'
  }
}

// 分享二维码
function shareQRCode() {
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none'
  })
}

// 返回签到列表
function goBack() {
  uni.navigateBack()
}

// 获取系统信息
function getSystemInfo() {
  try {
    // 使用新API替代已弃用的getSystemInfoSync
    const deviceInfo = uni.getDeviceInfo()
    const windowInfo = uni.getWindowInfo()
    const appBaseInfo = uni.getAppBaseInfo()
    
    return {
      platform: deviceInfo.platform,
      model: deviceInfo.model,
      brand: deviceInfo.brand,
      system: deviceInfo.system,
      windowWidth: windowInfo.windowWidth,
      windowHeight: windowInfo.windowHeight,
      statusBarHeight: windowInfo.statusBarHeight,
      safeArea: windowInfo.safeArea,
      appLanguage: appBaseInfo.language,
      appVersion: appBaseInfo.version
    }
  } catch (e) {
    console.error('获取系统信息失败:', e)
    // 在新API不可用的情况下，尝试使用旧API（带警告但可用）
    const fallbackInfo = uni.getSystemInfoSync()
    return {
      platform: fallbackInfo.platform,
      model: fallbackInfo.model, 
      brand: fallbackInfo.brand,
      system: fallbackInfo.system
    }
  }
}

// 初始化
onMounted(async () => {
  try {
    // 获取路由参数的安全方法
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const query = currentPage ? (currentPage as any)?.options : {}
    
    // 从多个可能的来源获取参数
    checkinId.value = query.id || uni.getLaunchOptionsSync().query?.id || ''
    
    console.log('签到二维码页参数:', {id: checkinId.value})
    
    if (!checkinId.value) {
      uni.showToast({
        title: '缺少签到ID',
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    // 加载签到详情
    await loadCheckinDetail()
  } catch (e) {
    console.error('初始化失败:', e)
    uni.showToast({
      title: '加载失败',
      icon: 'none',
      duration: 1500
    })
  }
})

// 清理定时器
onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
})
</script>

<template>
  <view class="container">
    <!-- 自定义导航栏 -->
    <wd-navbar title="签到二维码" left-text="返回" @click-left="goBack" />
    
    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <wd-loading size="48rpx" />
      <text>加载中...</text>
    </view>
    
    <!-- 错误信息 -->
    <view v-else-if="errorMessage" class="error-container">
      <wd-icon name="warning" size="48rpx" color="#f56c6c" />
      <text>{{ errorMessage }}</text>
    </view>
    
    <!-- 内容区域 -->
    <view v-else class="content-wrapper">
      <!-- 教师端二维码卡片 -->
      <view v-if="userStore.role === 'TEACHER'" class="qrcode-card">
        <view class="card-header">
          <text class="card-title">签到二维码</text>
          <text class="card-subtitle">请学生扫描二维码进行签到</text>
        </view>
        
        <view class="qrcode-content">
          <image 
            v-if="qrCodeUrl" 
            :src="qrCodeUrl" 
            mode="aspectFit" 
            class="qrcode-image"
            @error="(e) => console.error('图片加载失败:', e)"
          />
          <view v-else class="error">
            <wd-icon name="warning" size="48rpx" color="#f56c6c" />
            <text>二维码加载失败</text>
          </view>
        </view>
        
        <!-- 按钮区域 -->
        <view v-if="qrCodeUrl" class="button-group">
          <wd-button 
            block 
            type="primary" 
            icon="share"
            @click="shareQRCode"
          >
            分享二维码
          </wd-button>
        </view>
      </view>
      
      <!-- 学生端提示 -->
      <view v-else class="info-card">
        <view class="card-header">
          <text class="card-title">无权限查看</text>
          <text class="card-subtitle">仅教师可查看签到二维码</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  
  text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #fff;
  }
}

.error-container {
  text {
    color: #f56c6c;
  }
}

.content-wrapper {
  padding: 30rpx;
  padding-top: 40rpx;
}

.info-card, .qrcode-card, .stats-card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  
  .card-header {
    margin-bottom: 40rpx;
    text-align: center;
    
    .card-title {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }
    
    .card-subtitle {
      font-size: 28rpx;
      color: #666;
    }
  }
}

.info-content {
  .info-item {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .info-text {
      margin-left: 16rpx;
      font-size: 28rpx;
      color: #333;
    }
  }
}

.qrcode-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400rpx;
  margin-bottom: 30rpx;
  
  .qrcode-image {
    width: 400rpx;
    height: 400rpx;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  }
  
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    text {
      margin-top: 20rpx;
      font-size: 28rpx;
      color: #f56c6c;
    }
  }
}

.stats-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200rpx;
  
  text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #666;
  }
}

.stats-content {
  .stats-row {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .stats-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30rpx;
    padding: 20rpx;
    
    .stats-value {
      font-size: 48rpx;
      font-weight: bold;
      color: #2575fc;
      margin-bottom: 10rpx;
    }
    
    .stats-label {
      font-size: 24rpx;
      color: #666;
    }
  }
}

.button-group {
  margin-top: 40rpx;
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "签到详情",
    "navigationStyle": "custom"
  }
}
</route> 