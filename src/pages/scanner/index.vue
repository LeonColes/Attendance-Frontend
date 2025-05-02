<!--
 * @Author: weisheng
 * @Date: 2025-04-08 12:30:00
 * @LastEditTime: 2025-04-13 10:30:00
 * @LastEditors: weisheng
 * @Description: 扫描二维码页面
 * @FilePath: \wot-demo\src\pages\scanner\index.vue
 * 记得注释
-->
<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 状态栏占位 -->
    <!-- @ts-ignore -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 返回按钮 -->
    <!-- @ts-ignore -->
    <view class="navbar">
      <!-- @ts-ignore -->
      <view class="back-icon" @click="goBack">
        <wd-icon name="arrow-left" size="36rpx" color="#ffffff" />
      </view>
      <!-- @ts-ignore -->
      <view class="title">扫码签到</view>
    </view>
    
    <!-- 加载中 -->
    <!-- @ts-ignore -->
    <view v-if="loading" class="loading-container">
      <wd-loading color="#ffffff" size="48rpx" />
      <!-- @ts-ignore -->
      <text class="loading-text">初始化扫描器...</text>
    </view>
    
    <!-- 错误提示 -->
    <!-- @ts-ignore -->
    <view v-if="scannerError && !loading" class="error-container">
      <!-- @ts-ignore -->
      <text class="error-text">{{ scannerError }}</text>
      <wd-button type="primary" size="medium" @click="handleScan">
        使用系统扫码
      </wd-button>
    </view>
    
    <!-- 扫描区域 -->
    <!-- @ts-ignore -->
    <view v-show="!loading && !scannerError && !showResult" class="scanner-container">
      <!-- @ts-ignore -->
      <view id="scanner" class="scanner-view"></view>
      
      <!-- 扫描指引 -->
      <!-- @ts-ignore -->
      <view class="scanner-guide">
        <!-- @ts-ignore -->
        <view class="scanner-frame"></view>
        <!-- @ts-ignore -->
        <text class="guide-text">请将二维码放入框内</text>
      </view>
    </view>
    
    <!-- 扫描结果显示 -->
    <!-- @ts-ignore -->
    <view v-if="showResult" class="result-container">
      <view class="result-card">
        <!-- 加载状态 -->
        <view v-if="resultStatus === 'processing'" class="status-processing">
          <wd-loading color="#6a11cb" size="60rpx" />
          <text class="status-text">正在处理签到...</text>
        </view>
        
        <!-- 成功状态 -->
        <view v-else-if="resultStatus === 'success'" class="status-success">
          <wd-icon name="success" size="80rpx" color="#52c41a" />
          <text class="status-title">签到成功</text>
          <text class="status-info">我们已记录您的签到信息</text>
          
          <wd-button type="primary" custom-style="margin-top: 40rpx;" @click="goBack">
            返回首页
          </wd-button>
        </view>
        
        <!-- 失败状态 -->
        <view v-else-if="resultStatus === 'error'" class="status-error">
          <wd-icon name="warning" size="80rpx" color="#f5222d" />
          <text class="status-title">签到失败</text>
          <text class="status-info">{{ resultMessage }}</text>
          
          <view class="button-group">
            <wd-button type="info" custom-style="margin-right: 20rpx;" @click="resetScanner">
              重新扫码
            </wd-button>
            <wd-button type="primary" @click="goBack">
              返回
            </wd-button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 手动扫码按钮 -->
    <!-- @ts-ignore -->
    <view v-if="!loading && !showResult" class="footer" :style="{ paddingBottom: safeAreaInsetBottom + 'px' }">
      <wd-button block type="primary" @click="handleScan">
        点击使用系统扫码
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { submitCheckin, CheckInType } from '@/api/attendance'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 系统信息
const statusBarHeight = ref(0)
const safeAreaInsetBottom = ref(0)
const loading = ref(true)
const scanResult = ref('')
const scannerError = ref('')
let timer: number | NodeJS.Timeout | null = null

// 扫描结果状态
const showResult = ref(false)
const resultStatus = ref('')  // processing, success, error
const resultMessage = ref('')

// 获取系统信息
function getDeviceInfo() {
  try {
    // 使用新API
    const windowInfo = getSafeUni().getWindowInfo()
    const deviceInfo = getSafeUni().getDeviceInfo()
    const appBaseInfo = getSafeUni().getAppBaseInfo()
    
    return {
      platform: appBaseInfo.platform,
      model: deviceInfo.model,
      statusBarHeight: windowInfo.statusBarHeight,
      safeArea: windowInfo.safeArea,
      safeAreaInsets: windowInfo.safeAreaInsets
    }
  } catch (e) {
    console.error('获取设备信息失败，回退到旧API:', e)
    // 兼容处理
    return getSafeUni().getSystemInfoSync()
  }
}

// 初始化处理
onMounted(() => {
  try {
    const systemInfo = getDeviceInfo()
    statusBarHeight.value = systemInfo.statusBarHeight || 0
    safeAreaInsetBottom.value = systemInfo.safeArea?.bottom || 0
    
    // 延迟初始化扫描器，确保DOM已加载
    timer = setTimeout(() => {
      initScanner()
    }, 1000)
  } catch (error) {
    console.error('初始化失败:', error)
    scannerError.value = '初始化扫描器失败'
    loading.value = false
  }
})

// 在组件卸载时清理资源
onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
  // 释放扫描器
  stopScan()
})

// 初始化扫描器
function initScanner() {
  // 检查平台环境
  const appBaseInfo = getSafeUni().getAppBaseInfo()
  
  // 如果是微信小程序，使用原生扫码
  if (appBaseInfo.platform === 'mp-weixin') {
    loading.value = false
    // 需要用户点击按钮触发
    return
  }
  
  // 网页版尝试使用HTML5 Qrcode
  try {
    // 安全获取document
    if (typeof document === 'undefined') {
      useNativeScanner()
      return
    }
    
    // 检查扫描器容器是否存在
    const scannerContainer = document.getElementById('scanner')
    if (!scannerContainer) {
      console.error('scanner元素不存在')
      scannerError.value = '扫描器初始化失败：找不到扫描元素'
      loading.value = false
      return
    }
    
    // 动态加载HTML5 Qrcode库
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode/dist/html5-qrcode.min.js'
    script.onload = () => {
      startScan()
    }
    script.onerror = () => {
      console.error('加载HTML5 Qrcode库失败')
      scannerError.value = '扫描器加载失败'
      loading.value = false
    }
    document.head.appendChild(script)
  } catch (error) {
    console.error('初始化扫描器失败:', error)
    scannerError.value = '初始化扫描器失败，请尝试使用原生扫码'
    loading.value = false
    // 回退到原生扫码
    useNativeScanner()
  }
}

// 启动扫描 (网页环境)
function startScan() {
  try {
    if (typeof window === 'undefined' || !window.Html5Qrcode) {
      useNativeScanner()
      return
    }
    
    const scannerElement = document.getElementById('scanner')
    if (!scannerElement) {
      return
    }
    
    const html5QrCode = new window.Html5Qrcode('scanner', { formatsToSupport: [window.Html5QrcodeSupportedFormats.QR_CODE] })
    const config = { fps: 10, qrbox: 250 }
    
    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText: string) => {
        // 获取扫描结果
        scanResult.value = decodedText
        processQRCode(decodedText)
        // 停止扫描
        html5QrCode.stop()
      },
      (errorMessage: string) => {
        // 扫描过程中的错误处理
        console.log(errorMessage)
      }
    ).catch(() => {
      // 启动扫描失败，使用原生扫码
      useNativeScanner()
    })
    
    loading.value = false
  } catch (error) {
    console.error('启动扫描失败:', error)
    useNativeScanner()
  }
}

// 停止扫描
function stopScan() {
  try {
    if (typeof window !== 'undefined' && window.Html5Qrcode) {
      const html5QrCode = new window.Html5Qrcode('scanner')
      html5QrCode.stop().catch(error => {
        console.error('停止扫描失败:', error)
      })
    }
  } catch (error) {
    console.error('停止扫描时出错:', error)
  }
}

// 使用平台原生扫码
function useNativeScanner() {
  getSafeUni().scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success: function(res) {
      processQRCode(res.result)
    },
    fail: function(error) {
      console.error('扫码失败:', error)
      scannerError.value = '扫码失败，请重试'
      loading.value = false
    }
  })
}

// 触发原生扫码（按钮事件）
function handleScan() {
  useNativeScanner()
}

// 处理扫描结果
function processQRCode(result: string) {
  try {
    if (!result) {
      showToast('无效的二维码')
      return
    }
    
    // 更新界面状态
    showResult.value = true
    resultStatus.value = 'processing'
    
    // 尝试振动反馈
    try {
      getSafeUni().vibrateShort({
        success: () => {
          console.log('振动反馈成功')
        }
      })
    } catch (e) {}
    
    // 检查是否是考勤二维码
    if (isAttendanceQRCode(result)) {
      // 处理考勤二维码
      handleAttendanceQRCode(result)
    } else if (isCourseQRCode(result)) {
      // 处理课程二维码
      handleCourseQRCode(result)
    } else {
      // 未知格式
      resultStatus.value = 'error'
      resultMessage.value = '未知的二维码格式'
    }
  } catch (error) {
    console.error('处理二维码失败:', error)
    resultStatus.value = 'error'
    resultMessage.value = '处理二维码失败'
  }
}

// 判断是否是考勤二维码
function isAttendanceQRCode(qrContent: string): boolean {
  return qrContent.includes('checkin=') || 
         qrContent.includes('attendance=') || 
         /^\d+$/.test(qrContent)
}

// 判断是否是课程二维码
function isCourseQRCode(qrContent: string): boolean {
  return qrContent.includes('course=') || 
         /^[A-Za-z0-9]{6,10}$/.test(qrContent)
}

// 处理考勤二维码
function handleAttendanceQRCode(qrContent: string) {
  const checkInId = extractCheckInIdFromQR(qrContent)
  
  if (!checkInId) {
    showToast('无法识别的考勤二维码')
    return
  }
  
  // 提交考勤
  submitCheckIn(checkInId)
}

// 从二维码提取考勤ID
function extractCheckInIdFromQR(qrContent: string): string {
  try {
    // 支持多种格式的二维码
    if (qrContent.includes('checkin=')) {
      // URL格式 例如：https://example.com/checkin?checkin=123
      const regex = /checkin=(\d+)/
      const match = qrContent.match(regex)
      return match ? match[1] : ''
    } else if (qrContent.includes('attendance=')) {
      // URL格式 例如：https://example.com/attendance?attendance=123
      const regex = /attendance=(\d+)/
      const match = qrContent.match(regex)
      return match ? match[1] : ''
    } else if (/^\d+$/.test(qrContent)) {
      // 纯数字格式 例如：123456
      return qrContent
    } else {
      // 尝试解析JSON
      try {
        const data = JSON.parse(qrContent)
        return data.checkin || data.attendance || data.checkInId || ''
      } catch {
        return ''
      }
    }
  } catch (e) {
    console.error('提取考勤ID失败', e)
    return ''
  }
}

// 处理课程二维码
function handleCourseQRCode(qrContent: string) {
  const courseCode = extractCourseCodeFromQR(qrContent)
  
  if (!courseCode) {
    showToast('无法识别的课程二维码')
    return
  }
  
  // 跳转到课程确认页面
  getSafeUni().navigateTo({
    url: `/pages/join-course/index?code=${courseCode}`
  })
}

// 从二维码提取课程码
function extractCourseCodeFromQR(qrContent: string): string {
  try {
    // 支持多种格式的二维码
    if (qrContent.includes('course=')) {
      // URL格式 例如：https://example.com/join?course=ABC123
      const regex = /course=([A-Za-z0-9]+)/
      const match = qrContent.match(regex)
      return match ? match[1] : ''
    } else if (/^[A-Za-z0-9]{6,10}$/.test(qrContent)) {
      // 纯文本格式 例如：ABC123
      return qrContent
    } else {
      // 尝试解析JSON
      try {
        const data = JSON.parse(qrContent)
        return data.course || data.courseCode || data.code || ''
      } catch {
        return ''
      }
    }
  } catch (e) {
    console.error('提取课程码失败', e)
    return ''
  }
}

// 提交考勤
async function submitCheckIn(checkInId: string) {
  try {
    // 显示处理状态
    showResult.value = true
    resultStatus.value = 'processing'
    
    // 准备设备信息
    const deviceInfo = getDeviceInfo()
    const deviceData = {
      type: deviceInfo.platform || 'unknown',
      model: deviceInfo.model || '测试设备'
    }
    
    // 准备签到参数 - 确保与API要求匹配
    const checkinParams: any = {
      checkinId: checkInId,
      verifyMethod: 'QR_CODE',
      // 将设备信息转为字符串
      device: JSON.stringify(deviceData),
      // 添加空的verifyData字段
      verifyData: checkInId
    }
    
    console.log('签到API参数:', checkinParams)
    
    // 调用API提交考勤
    const response = await submitCheckin(checkinParams)
    
    if (response && response.code === 200) {
      // 更新成功状态
      resultStatus.value = 'success'
      
      // 尝试再次振动反馈
      try {
        getSafeUni().vibrateLong()
      } catch (e) {}
      
      // 延迟返回首页
      setTimeout(() => {
        // #ifdef MP-WEIXIN
        // 微信小程序中使用reLaunch避免switchTab超时问题
        getSafeUni().reLaunch({
          url: '/pages/index'
        })
        // #endif
        
        // #ifndef MP-WEIXIN
        // 简化导航，只使用单一方法，不使用备选方案
        getSafeUni().switchTab({
          url: '/pages/index'
        })
        // #endif
      }, 2500)
    } else {
      // 更新失败状态
      resultStatus.value = 'error'
      resultMessage.value = response?.message || '签到失败'
    }
  } catch (error) {
    console.error('提交考勤失败:', error)
    // 更新失败状态
    resultStatus.value = 'error'
    resultMessage.value = '提交考勤失败，请重试'
  }
}

// 重置扫描器
function resetScanner() {
  showResult.value = false
  resultStatus.value = ''
  resultMessage.value = ''
  scanResult.value = ''
  
  // 重新初始化扫描器
  initScanner()
}

// 显示提示信息
function showToast(title: string) {
  getSafeUni().showToast({
    title,
    icon: 'none'
  })
}

// 返回上一页
function goBack() {
  getSafeUni().navigateBack()
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #000;
  position: relative;
}

.status-bar {
  width: 100%;
}

.navbar {
  display: flex;
  align-items: center;
  padding: 30rpx;
  
  .back-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .title {
    flex: 1;
    text-align: center;
    color: #fff;
    font-size: 36rpx;
    font-weight: bold;
    padding-right: 80rpx;
  }
}

.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .loading-text {
    color: #fff;
    margin-top: 30rpx;
    font-size: 28rpx;
  }
}

.error-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70%;
  
  .error-text {
    color: #fff;
    margin-bottom: 40rpx;
    font-size: 30rpx;
    text-align: center;
  }
}

.scanner-container {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.scanner-view {
  width: 100%;
  height: 100%;
}

.scanner-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .scanner-frame {
    width: 500rpx;
    height: 500rpx;
    border: 4rpx solid #ffffff;
    border-radius: 20rpx;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 60rpx;
      height: 60rpx;
      border-top: 8rpx solid #2575fc;
      border-left: 8rpx solid #2575fc;
      border-top-left-radius: 16rpx;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 60rpx;
      height: 60rpx;
      border-top: 8rpx solid #2575fc;
      border-right: 8rpx solid #2575fc;
      border-top-right-radius: 16rpx;
    }
  }
  
  .scanner-frame::before,
  .scanner-frame::after {
    box-sizing: border-box;
  }
  
  .guide-text {
    color: #fff;
    margin-top: 30rpx;
    font-size: 30rpx;
  }
}

.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40rpx;
}

.result-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 100;
  padding: 30rpx;
}

.result-card {
  width: 100%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  .status-processing,
  .status-success,
  .status-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30rpx 0;
  }
  
  .status-text {
    margin-top: 30rpx;
    font-size: 32rpx;
    color: #333;
  }
  
  .status-title {
    margin-top: 30rpx;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  
  .status-info {
    margin-top: 16rpx;
    font-size: 28rpx;
    color: #666;
  }
  
  .button-group {
    display: flex;
    margin-top: 40rpx;
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "扫码签到"
  }
}
</route> 