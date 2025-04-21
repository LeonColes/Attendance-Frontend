<!--
 * @Author: weisheng
 * @Date: 2025-04-08 10:00:00
 * @LastEditTime: 2025-04-08 10:00:00
 * @LastEditors: weisheng
 * @Description: 位置签到页面
 * @FilePath: \wot-demo\src\pages\location-checkin\index.vue
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
          <text class="coordinates" v-if="location.latitude && location.longitude">经纬度: {{ location.latitude }}, {{ location.longitude }}</text>
          <text class="error-msg" v-if="locationError">{{ locationError }}</text>
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
        {{ locationError ? '使用默认位置签到' : '确认签到' }}
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
const courseId = ref('')
const locationError = ref('')
const location = reactive({
  latitude: 0,
  longitude: 0,
  address: ''
})

// 获取位置信息
function getLocation() {
  locationError.value = ''
  
  try {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        location.latitude = res.latitude
        location.longitude = res.longitude
        location.address = '位置获取成功'
        
        // 获取地址信息（可选）
        uni.request({
          url: `https://restapi.amap.com/v3/geocode/regeo?key=YOUR_AMAP_KEY&location=${res.longitude},${res.latitude}`,
          success: (res: any) => {
            if (res.statusCode === 200 && res.data && res.data.regeocode) {
              location.address = res.data.regeocode.formatted_address
            }
          }
        })
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        locationError.value = '获取位置失败，将使用默认位置签到'
        
        // 使用默认位置
        location.latitude = 39.908823
        location.longitude = 116.397470
        location.address = '默认位置 (北京市天安门)'
      }
    })
  } catch (e) {
    console.error('获取位置异常:', e)
    locationError.value = '获取位置异常，将使用默认位置签到'
    
    // 使用默认位置
    location.latitude = 39.908823
    location.longitude = 116.397470
    location.address = '默认位置 (北京市天安门)'
  }
}

// 提交签到
async function submitLocationCheckin() {
  try {
    loading.value = true
    
    // 获取设备信息
    const deviceInfo = uni.getSystemInfoSync()
    
    // 使用当前位置或默认位置
    const locationStr = `${location.latitude},${location.longitude}`
    
    // 准备签到数据
    const checkinData = {
      checkinId: checkinId.value || 'cf29f64b-778f-4f26-ba9f-9829d9ae4a4d',
      verifyMethod: CheckInType.LOCATION,
      location: locationStr,
      device: JSON.stringify({
        type: deviceInfo.platform || 'iPhone',
        model: deviceInfo.model || '测试设备'
      }),
      verifyData: ''
    }
    
    console.log('提交签到数据:', checkinData)
    
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

// 初始化
onMounted(() => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const query = currentPage ? (currentPage as any)?.options : {}
  
  // 处理签到ID
  if (query.id) {
    checkinId.value = query.id
  } else if (query.checkinData) {
    try {
      const checkinData = JSON.parse(decodeURIComponent(query.checkinData))
      checkinId.value = checkinData.id
    } catch (e) {
      console.error('解析签到数据失败:', e)
      checkinId.value = 'cf29f64b-778f-4f26-ba9f-9829d9ae4a4d'
    }
  } else {
    // 使用默认ID
    checkinId.value = 'cf29f64b-778f-4f26-ba9f-9829d9ae4a4d'
  }
  
  courseId.value = query.courseId || ''
  
  // 获取位置信息
  getLocation()
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 30rpx;
}

.location-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.05);
  
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
        display: block;
        font-size: 28rpx;
        color: #666;
        margin-bottom: 10rpx;
      }
      
      .coordinates {
        font-size: 24rpx;
        color: #999;
      }
      
      .error-msg {
        display: block;
        font-size: 26rpx;
        color: #f56c6c;
        margin-top: 10rpx;
      }
    }
    
    .refresh-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20rpx 0;
      
      text {
        font-size: 28rpx;
        color: #6a11cb;
        margin-left: 10rpx;
      }
    }
  }
}

.checkin-btn {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 30rpx;
  background-color: #fff;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.05);
}
</style>

<route lang="json">
{
  "navigationBarTitleText": "位置签到"
}
</route> 