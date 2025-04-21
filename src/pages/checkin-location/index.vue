<!--
 * @Author: weisheng
 * @Date: 2025-04-08 10:00:00
 * @LastEditTime: 2025-04-08 10:00:00
 * @LastEditors: weisheng
 * @Description: 位置签到页面
 * @FilePath: \wot-demo\src\pages\checkin-location\index.vue
 * 记得注释
-->
<template>
  <view class="container">
    <!-- 位置信息卡片 -->
    <view class="location-card">
      <view class="card-header">
        <text class="title">当前位置</text>
      </view>
      
      <view class="card-content">
        <view class="location-info">
          <text class="address">{{ location.address || '正在获取位置...' }}</text>
          <text class="coordinates">经纬度: {{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}</text>
        </view>
        
        <view class="refresh-btn" @click="getLocation">
          <wd-icon name="refresh" size="48rpx" color="#6a11cb" />
          <text>刷新位置</text>
        </view>
      </view>
    </view>
    
    <!-- 签到按钮 -->
    <view class="checkin-btn">
      <wd-button 
        type="primary" 
        block 
        :loading="loading"
        @click="submitLocationCheckin"
      >
        确认签到
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { submitCheckin, CheckInType } from '@/api/attendance'

const userStore = useUserStore()
const loading = ref(false)
const checkinId = ref('')
const errorMessage = ref('')
const location = reactive({
  latitude: 0,
  longitude: 0,
  address: ''
})

// 初始化
onMounted(() => {
  // 获取路由参数
  const query = uni.getLaunchOptionsSync().query || {}
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const options = (page as any)?.options || query || {}
  
  // 获取签到ID
  checkinId.value = options.id || options.checkinId || ''
  
  if (!checkinId.value) {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    return
  }
  
  // 不在页面加载时获取位置，等用户点击按钮再获取
  // 显示提示信息
  uni.showToast({
    title: '请点击刷新位置按钮获取位置',
    icon: 'none',
    duration: 2000
  })
})

// 获取位置信息
function getLocation() {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      location.latitude = res.latitude
      location.longitude = res.longitude
      
      // 获取地址信息（可选，如果有高德/百度地图API key）
      try {
        uni.request({
          url: `https://restapi.amap.com/v3/geocode/regeo?key=YOUR_AMAP_KEY&location=${res.longitude},${res.latitude}`,
          success: (res) => {
            if (res.statusCode === 200 && res.data) {
              const responseData = res.data as any
              if (responseData.regeocode) {
                location.address = responseData.regeocode.formatted_address
              }
            }
          }
        })
      } catch (error) {
        console.error('获取地址信息失败:', error)
        location.address = '无法获取详细地址'
      }
    },
    fail: (err) => {
      console.error('获取位置失败:', err)
      uni.showToast({
        title: '获取位置失败，请检查定位权限',
        icon: 'none'
      })
    }
  })
}

// 提交签到
async function submitLocationCheckin() {
  if (location.latitude === 0 || location.longitude === 0) {
    uni.showToast({
      title: '位置未获取，请先获取位置',
      icon: 'none'
    })
    return
  }
  
  try {
    loading.value = true
    
    // 获取设备信息
    const deviceInfo = uni.getDeviceInfo()
    
    // 准备签到数据
    const checkinData = {
      checkinId: checkinId.value,
      verifyMethod: CheckInType.LOCATION,
      location: `${location.latitude},${location.longitude}`,
      device: JSON.stringify({
        type: deviceInfo.platform,
        model: deviceInfo.model
      }),
      verifyData: ''
    }
    
    // 提交签到
    const response = await submitCheckin(checkinData)
    
    if (response && response.code === 200) {
      uni.showToast({
        title: '签到成功',
        icon: 'success'
      })
      
      // 延迟后返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      throw new Error(response?.message || '签到失败')
    }
  } catch (e: any) {
    console.error('签到失败:', e)
    uni.showToast({
      title: e.message || '签到失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #f0f2f5 0%, #f8f9fa 100%);
}

.location-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;
  
  .card-header {
    margin-bottom: 20rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .card-content {
    .location-info {
      margin-bottom: 20rpx;
      
      .address {
        font-size: 28rpx;
        color: #333;
        display: block;
        margin-bottom: 10rpx;
        line-height: 1.4;
      }
      
      .coordinates {
        font-size: 24rpx;
        color: #666;
        display: block;
      }
    }
    
    .refresh-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20rpx;
      border-radius: 12rpx;
      background: rgba(106, 17, 203, 0.05);
      margin-top: 20rpx;
      
      text {
        margin-left: 10rpx;
        color: #6a11cb;
        font-size: 28rpx;
      }
    }
  }
}

.checkin-btn {
  margin-top: auto;
  padding-bottom: 30rpx;
}
</style> 