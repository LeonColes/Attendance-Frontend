<template>
  <view class="scanner-container">
    <!-- 导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: `${safeAreaInsetTop}px`, height: `${44 + safeAreaInsetTop}px` }">
      <view class="nav-bar-left" @click="goBack">
        <wd-icon name="arrow-left" size="44rpx" color="#fff" />
      </view>
      <view class="nav-bar-title">
        <text>扫码签到</text>
      </view>
    </view>
    
    <!-- 扫描区域 -->
    <view class="scan-area">
      <view class="scan-frame">
        <view class="corner top-left"></view>
        <view class="corner top-right"></view>
        <view class="corner bottom-left"></view>
        <view class="corner bottom-right"></view>
        <view v-if="scanning" class="scan-line"></view>
      </view>
      <view class="scan-tip">
        <text>{{ scanning ? '请对准签到二维码' : '点击下方按钮重新扫描' }}</text>
      </view>
    </view>
    
    <!-- 结果显示 -->
    <view v-if="!scanning" class="result-area">
      <view v-if="processing" class="processing">
        <wd-loading color="#fff" size="60rpx" />
        <text>正在签到中...</text>
      </view>
      
      <view v-else-if="scanSuccess" class="success-result">
        <view class="success-icon">
          <wd-icon name="check2" size="100rpx" color="#52c41a" />
        </view>
        <text class="success-text">签到成功</text>
      </view>
      
      <view v-else-if="scanError" class="error-result">
        <view class="error-icon">
          <wd-icon name="error" size="100rpx" color="#f5222d" />
        </view>
        <text class="error-text">{{ errorMessage }}</text>
        <wd-button type="primary" size="small" class="rescan-btn" @click="reScan">重新扫描</wd-button>
      </view>
    </view>
    
    <!-- 底部按钮 -->
    <view class="bottom-area">
      <wd-button 
        v-if="!scanning && !scanSuccess" 
        type="primary" 
        block
        @click="reScan"
      >
        重新扫描
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { submitCheckin, CheckInType } from '@/api/attendance'

// 扫描状态
const scanning = ref(false)
const processing = ref(false)
const scanResult = ref('')
const scanSuccess = ref(false)
const scanError = ref(false)
const errorMessage = ref('')

// 设备信息
const statusBarHeight = ref(0)
const safeAreaInsetTop = ref(0)

// 初始化参数
onMounted(() => {
  // 获取设备信息
  const deviceInfo = getDeviceInfo()
  statusBarHeight.value = deviceInfo.statusBarHeight || 20
  if (deviceInfo.safeArea) {
    safeAreaInsetTop.value = deviceInfo.safeArea.top
  }
  
  // 自动开始扫描
  startScan()
})

// 获取设备信息
function getDeviceInfo() {
  try {
    // 使用推荐的新API
    const windowInfo = uni.getWindowInfo()
    const deviceInfo = uni.getDeviceInfo()
    const appBaseInfo = uni.getAppBaseInfo()
    
    return {
      platform: deviceInfo.platform,
      model: deviceInfo.model,
      brand: deviceInfo.brand,
      system: deviceInfo.system
    }
  } catch (e) {
    console.error('获取设备信息失败:', e)
    // 如果新API不可用，回退到旧API
    const sysInfo = uni.getSystemInfoSync()
    return {
      platform: sysInfo.platform,
      model: sysInfo.model,
      brand: sysInfo.brand,
      system: sysInfo.system
    }
  }
}

// 开始扫描
function startScan() {
  scanning.value = true
  scanResult.value = ''
  scanSuccess.value = false
  scanError.value = false
  errorMessage.value = ''
  
  // 调用扫码API
  uni.scanCode({
    scanType: ['qrCode'],
    success: handleScanSuccess,
    fail: handleScanFail,
    complete: () => {
      scanning.value = false
    }
  })
}

// 处理扫码成功
async function handleScanSuccess(res: any) {
  try {
    scanResult.value = res.result
    processing.value = true
    
    // 解析扫码结果
    const checkinData = parseQRCode(res.result)
    
    if (!checkinData.checkinId) {
      throw new Error('无效的二维码')
    }
    
    // 提交签到
    await submitCheckin({
      checkinId: checkinData.checkinId,
      verifyMethod: CheckInType.QR_CODE,
      device: `${uni.getSystemInfoSync().platform}/${uni.getSystemInfoSync().model}`,
      verifyData: res.result
    })
    
    // 签到成功
    scanSuccess.value = true
    uni.showToast({
      title: '签到成功',
      icon: 'success'
    })
    
    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } 
  catch (error: any) {
    scanError.value = true
    errorMessage.value = error.message || '签到失败'
    
    uni.showToast({
      title: errorMessage.value,
      icon: 'error'
    })
  }
  finally {
    processing.value = false
  }
}

// 处理扫码失败
function handleScanFail(error: any) {
  scanError.value = true
  errorMessage.value = error.errMsg || '扫码失败'
  
  uni.showToast({
    title: errorMessage.value,
    icon: 'error'
  })
}

// 解析二维码内容
function parseQRCode(qrContent: string): { checkinId: string, timestamp?: string } {
  try {
    // 尝试解析JSON
    const jsonData = JSON.parse(qrContent)
    return jsonData
  } 
  catch (e) {
    // 非JSON格式，假定是纯文本ID
    return { checkinId: qrContent }
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 重新扫描
function reScan() {
  startScan()
}
</script>

<script lang="ts">
export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss" scoped>
.scanner-container {
  position: relative;
  min-height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  position: relative;
  z-index: 100;
  
  &-left {
    width: 44rpx;
    height: 44rpx;
  }
  
  &-title {
    flex: 1;
    text-align: center;
    color: #fff;
    font-size: 36rpx;
    font-weight: 500;
    margin-right: 44rpx;
  }
}

.scan-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  
  .scan-frame {
    width: 500rpx;
    height: 500rpx;
    position: relative;
    margin-bottom: 40rpx;
    
    .corner {
      position: absolute;
      width: 60rpx;
      height: 60rpx;
      border-color: #fff;
      
      &.top-left {
        top: 0;
        left: 0;
        border-top: 6rpx solid;
        border-left: 6rpx solid;
      }
      
      &.top-right {
        top: 0;
        right: 0;
        border-top: 6rpx solid;
        border-right: 6rpx solid;
      }
      
      &.bottom-left {
        bottom: 0;
        left: 0;
        border-bottom: 6rpx solid;
        border-left: 6rpx solid;
      }
      
      &.bottom-right {
        bottom: 0;
        right: 0;
        border-bottom: 6rpx solid;
        border-right: 6rpx solid;
      }
    }
    
    .scan-line {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 6rpx;
      background: linear-gradient(to right, transparent, #2575fc, transparent);
      animation: scan-animation 2s linear infinite;
    }
  }
  
  .scan-tip {
    color: #fff;
    font-size: 28rpx;
    text-align: center;
  }
}

.result-area {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80%;
  
  .processing, .success-result, .error-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 20rpx;
    padding: 40rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
    
    text {
      margin-top: 20rpx;
      font-size: 32rpx;
      color: #333;
    }
  }
  
  .success-icon, .error-icon {
    width: 150rpx;
    height: 150rpx;
    border-radius: 50%;
    background-color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  }
  
  .success-text {
    color: #52c41a !important;
    font-weight: bold;
  }
  
  .error-text {
    color: #f5222d !important;
    text-align: center;
    margin-bottom: 30rpx;
  }
  
  .rescan-btn {
    margin-top: 20rpx;
  }
}

.bottom-area {
  padding: 40rpx;
  margin-bottom: env(safe-area-inset-bottom);
}

@keyframes scan-animation {
  0% {
    top: 0;
  }
  50% {
    top: calc(100% - 6rpx);
  }
  100% {
    top: 0;
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationStyle": "custom",
    "backgroundColor": "#000000"
  }
}
</route> 