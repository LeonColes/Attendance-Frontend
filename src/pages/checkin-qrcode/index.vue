<!--
 * @Author: weisheng
 * @Date: 2025-04-07 13:00:00
 * @LastEditTime: 2025-04-07 13:00:00
 * @LastEditors: weisheng
 * @Description: 二维码签到页面
 * @FilePath: \wot-demo\src\pages\checkin-qrcode\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { getCheckinQRCode as getCheckinQRCodeApi } from '@/api/attendance'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'

const userStore = useUserStore()
const themeStore = useThemeStore()
const loading = ref(false)
const checkinId = ref('')
const errorMessage = ref('')
const qrCodeUrl = ref('')

// 加载二维码
async function loadQRCode() {
  try {
    console.log('开始加载二维码, ID:', checkinId.value)
    loading.value = true
    
    // 获取二维码数据
    const response = await getCheckinQRCodeApi(checkinId.value)
    console.log('获取到二维码响应:', response)
    
    // 判断响应是否为ArrayBuffer类型
    if (response instanceof ArrayBuffer) {
      console.log('二维码数据是ArrayBuffer，开始转换')
      // 直接处理ArrayBuffer数据
      const base64 = uni.arrayBufferToBase64(response)
      qrCodeUrl.value = `data:image/png;base64,${base64}`
      console.log('二维码URL已设置')
    } else if (response && response.code === 200 && response.data) {
      console.log('二维码数据有效，开始转换')
      // 处理标准响应对象中的数据
      const base64 = uni.arrayBufferToBase64(response.data)
      qrCodeUrl.value = `data:image/png;base64,${base64}`
      console.log('二维码URL已设置')
    } else {
      console.error('二维码响应无效:', response)
      throw new Error('获取二维码失败')
    }
  } catch (e) {
    console.error('获取二维码失败:', e)
    errorMessage.value = '获取二维码失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(async () => {
  try {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    const options = (page as any)?.options || {}
    console.log('页面参数:', options)
    
    // 兼容两种参数名：id 和 checkinId
    checkinId.value = options.checkinId || options.id || ''
    console.log('签到ID:', checkinId.value)
    
    if (!checkinId.value) {
      console.error('签到ID为空')
      uni.showToast({
        title: '签到ID不能为空',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    await loadQRCode()
  } catch (e) {
    console.error('初始化失败:', e)
    errorMessage.value = '初始化失败，请稍后再试'
  }
})

watch(() => loading.value, () => {
  if(loading.value) {
    setTimeout(() => {
      loadQRCode()
    }, 5000)
  }
})

// 返回上一页
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="container" :class="{'wot-theme-dark': themeStore.isDarkMode}">
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
      <view v-if="userStore.userInfo?.role === 'TEACHER'" class="qrcode-card">
        <view class="card-header">
          <text class="card-title">签到二维码</text>
          <text class="card-subtitle">请扫描二维码进行签到</text>
        </view>
        
        <view class="qrcode-content">
          <image 
            v-if="qrCodeUrl" 
            :src="qrCodeUrl" 
            mode="aspectFit" 
            class="qrcode-image"
          />
          <view v-else-if="loading" class="loading">
            <wd-loading size="48rpx" />
            <text>加载中...</text>
          </view>
          <view v-else class="error">
            <wd-icon name="warning" size="48rpx" color="#f56c6c" />
            <text>加载失败</text>
          </view>
        </view>
        
        <!-- 错误信息 -->
        <view v-if="errorMessage" class="error-message">
          <text>{{ errorMessage }}</text>
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
  transition: background 0.3s ease;
}

.wot-theme-dark .container {
  background: linear-gradient(135deg, #2b1e40 0%, #0f2c56 100%);
}

.content-wrapper {
  padding: 30rpx;
  padding-top: 40rpx;
}

.qrcode-card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
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

.wot-theme-dark .qrcode-card {
  background-color: rgba(30, 30, 30, 0.95);
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.3);
  
  .card-title {
    color: #e5eaf3 !important;
  }
  
  .card-subtitle {
    color: #a3a6ad !important;
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
  
  .loading, .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    text {
      margin-top: 20rpx;
      font-size: 28rpx;
      color: #666;
    }
  }
  
  .error {
    text {
      color: #f56c6c;
    }
  }
}

.error-message {
  margin-bottom: 20rpx;
  text-align: center;
  
  text {
    color: #f56c6c;
    font-size: 26rpx;
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "签到二维码"
  }
}
</route> 