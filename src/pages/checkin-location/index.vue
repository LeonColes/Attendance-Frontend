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
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="title">位置签到</text>
      <text class="subtitle">请确认您的位置信息正确</text>
    </view>
    
    <!-- 位置信息卡片 -->
    <view class="location-card">
      <view class="card-header">
        <wd-icon name="location" size="40rpx" color="#6a11cb" />
        <text class="title">当前位置</text>
      </view>
      
      <view class="card-content">
        <view class="location-info">
          <text class="address">{{ location.address || '正在获取位置...' }}</text>
          <text class="coordinates" v-if="location.latitude && location.longitude">经纬度: {{ location.latitude }}, {{ location.longitude }}</text>
          <text class="error-msg" v-if="locationError">{{ locationError }}</text>
        </view>
        
        <view class="refresh-btn" @click="getLocation">
          <wd-icon name="refresh" size="36rpx" color="#6a11cb" />
          <text>刷新位置</text>
        </view>
      </view>
    </view>
    
    <!-- 签到任务信息 -->
    <view class="checkin-info" v-if="checkinInfo">
      <view class="card-header">
        <wd-icon name="time" size="40rpx" color="#6a11cb" />
        <text class="title">签到任务信息</text>
      </view>
      
      <view class="card-content">
        <view class="info-row">
          <text class="label">任务名称：</text>
          <text class="value">{{ checkinInfo.name || '未知任务' }}</text>
        </view>
        
        <view class="info-row">
          <text class="label">开始时间：</text>
          <text class="value">{{ formatDateTime(checkinInfo.startTime) || '未知' }}</text>
        </view>
        
        <view class="info-row">
          <text class="label">结束时间：</text>
          <text class="value">{{ formatDateTime(checkinInfo.endTime) || '未知' }}</text>
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
import { submitCheckin, CheckInType, getCheckinDetail } from '@/api/attendance'
import { formatDateTime } from '@/utils/dateTime'

const userStore = useUserStore()
const loading = ref(false)
const checkinId = ref('')
const courseId = ref('')
const locationError = ref('')
const checkinInfo = ref<any>(null)
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

// 获取签到任务详情
async function getCheckinTaskInfo() {
  if (!checkinId.value) return
  
  try {
    const response = await getCheckinDetail(checkinId.value)
    if (response && response.code === 200 && response.data) {
      checkinInfo.value = response.data
    }
  } catch (e) {
    console.error('获取签到任务详情失败:', e)
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
  console.log('签到参数:', query)
  
  // 处理签到ID
  if (query.checkinId) {
    checkinId.value = query.checkinId
  } else if (query.checkinData) {
    try {
      const checkinData = JSON.parse(decodeURIComponent(query.checkinData))
      checkinId.value = checkinData.checkinId
    } catch (e) {
      console.error('解析签到数据失败:', e)
    }
  } else {
    console.error('签到ID不存在')
  }
  
  courseId.value = query.courseId || ''
  
  // 获取位置信息
  getLocation()
  
  // 获取签到任务信息
  getCheckinTaskInfo()
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
  padding: 30rpx;
}

.page-header {
  text-align: center;
  margin-bottom: 40rpx;
  
  .title {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: #666;
  }
}

.location-card,
.checkin-info {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 6rpx 16rpx rgba(106, 17, 203, 0.08);
  border: 1rpx solid rgba(106, 17, 203, 0.05);
  
  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-left: 15rpx;
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
        padding: 10rpx;
        background-color: rgba(245, 247, 250, 0.6);
        border-radius: 8rpx;
      }
      
      .coordinates {
        font-size: 24rpx;
        color: #999;
        display: block;
        margin-top: 10rpx;
      }
      
      .error-msg {
        display: block;
        font-size: 26rpx;
        color: #f56c6c;
        margin-top: 10rpx;
        padding: 10rpx;
        background-color: rgba(245, 67, 54, 0.05);
        border-radius: 8rpx;
      }
    }
    
    .refresh-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 15rpx 0;
      background: linear-gradient(135deg, rgba(106, 17, 203, 0.05) 0%, rgba(37, 117, 252, 0.05) 100%);
      border-radius: 40rpx;
      
      text {
        font-size: 28rpx;
        color: #6a11cb;
        margin-left: 10rpx;
      }
    }
    
    .info-row {
      display: flex;
      margin-bottom: 16rpx;
      
      .label {
        width: 150rpx;
        font-size: 28rpx;
        color: #666;
      }
      
      .value {
        flex: 1;
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
      }
    }
  }
}

.checkin-btn {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 50rpx;
  padding: 0 40rpx;
  z-index: 10;
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "位置签到"
  }
}
</route> 