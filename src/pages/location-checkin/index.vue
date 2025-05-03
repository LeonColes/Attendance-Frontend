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
    <!-- 全屏地图 -->
    <view class="map-fullscreen">
      <map
        id="location-map"
        class="location-map"
        :latitude="location.latitude"
        :longitude="location.longitude"
        :markers="mapMarkers"
        :show-location="true"
        :show-compass="true"
        :enable-zoom="true"
        :enable-rotate="false"
        :enable-poi="true"
        scale="16"
      ></map>
      
      <!-- 地图控件 -->
      <view class="map-controls">
        <view class="map-control-item" @click="moveToLocation">
          <wd-icon name="location" size="44rpx" color="#6a11cb" />
        </view>
      </view>
    </view>
    
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-info" :class="{ 'status-error': locationError }">
        {{ locationError ? locationError : (location.address ? '位置获取成功' : '正在获取位置...') }}
      </view>
    </view>
    
    <!-- 位置信息浮动卡片 -->
    <view class="location-card">
      <view class="card-header">
        <view class="location-icon">
          <wd-icon name="location" size="48rpx" color="#6a11cb" />
        </view>
        <view class="location-details">
          <text class="location-title">当前位置</text>
          <text class="location-subtitle">{{ locationSubtitle }}</text>
        </view>
        <view class="refresh-btn" @click="getLocation">
          <wd-icon name="refresh" size="40rpx" color="#6a11cb" />
        </view>
      </view>
      
      <view class="card-content">
        <view class="address-box">
          <text class="address">{{ location.address || '正在获取位置...' }}</text>
          <text class="coordinates" v-if="location.latitude && location.longitude">
            经纬度: {{ formatCoordinates(location.latitude, location.longitude) }}
          </text>
        </view>
        
        <view class="location-actions">
          <view class="action-item" @click="copyLocationInfo">
            <wd-icon name="copy" size="32rpx" color="#666" />
            <text>复制位置</text>
          </view>
          <view class="action-item" @click="shareLocation">
            <wd-icon name="share" size="32rpx" color="#666" />
            <text>分享位置</text>
          </view>
        </view>
      </view>
      
      <!-- 签到按钮 -->
      <view class="checkin-action">
        <wd-button 
          type="primary" 
          round
          block 
          :loading="loading"
          @click="submitLocationCheckin"
        >
          {{ locationError ? '使用默认位置签到' : '确认签到' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
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
  address: '',
  accuracy: 0,
  updatedAt: 0
})

// 计算位置副标题
const locationSubtitle = computed(() => {
  if (locationError.value) {
    return '位置获取失败';
  }
  
  if (!location.updatedAt) {
    return '正在定位中...';
  }
  
  // 计算位置更新时间
  const now = Date.now();
  const diff = now - location.updatedAt;
  if (diff < 60000) {
    return '刚刚更新';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前更新`;
  } else {
    return `${Math.floor(diff / 3600000)}小时前更新`;
  }
});

// 格式化坐标显示
function formatCoordinates(latitude: number, longitude: number): string {
  if (!latitude || !longitude) return '';
  
  // 格式化为更易读的形式，保留6位小数
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

// 地图标记点
const mapMarkers = computed(() => {
  if (!location.latitude || !location.longitude) return [];
  
  // 定义标记点类型
  interface MapMarker {
    id: number;
    latitude: number;
    longitude: number;
    width: number;
    height: number;
    callout: {
      content: string;
      color: string;
      fontSize: number;
      borderRadius: number;
      bgColor: string;
      padding: number;
      display: string;
    }
  }
  
  // 创建标记点数组并添加当前位置标记
  const markers: MapMarker[] = [{
    id: 1,
    latitude: location.latitude,
    longitude: location.longitude,
    width: 40,
    height: 40,
    callout: {
      content: location.address || '当前位置',
      color: '#FFFFFF',
      fontSize: 14,
      borderRadius: 8,
      bgColor: '#6a11cb',
      padding: 10,
      display: 'ALWAYS'
    }
  }];
  
  return markers;
});

// 移动地图到当前位置
function moveToLocation() {
  try {
    const mapContext = uni.createMapContext('location-map');
    mapContext.moveToLocation({
      latitude: location.latitude,
      longitude: location.longitude
    });
  } catch (e) {
    console.error('移动地图位置失败:', e);
  }
}

// 复制位置信息
function copyLocationInfo() {
  const locationText = location.address 
    ? `${location.address} (${location.latitude}, ${location.longitude})` 
    : `位置坐标: ${location.latitude}, ${location.longitude}`;
  
  uni.setClipboardData({
    data: locationText,
    success: () => {
      uni.showToast({
        title: '位置信息已复制',
        icon: 'success'
      });
    }
  });
}

// 分享位置
function shareLocation() {
  uni.showModal({
    title: '位置分享',
    content: '即将开放此功能，敬请期待！',
    showCancel: false
  });
}

// 获取位置信息
function getLocation() {
  locationError.value = ''
  
  try {
    uni.showLoading({
      title: '获取位置中...',
      mask: true
    });
    
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        location.latitude = res.latitude
        location.longitude = res.longitude
        location.address = '位置获取成功'
        location.accuracy = res.accuracy || 0
        location.updatedAt = Date.now()
        
        // 获取地址信息（可选）
        uni.request({
          url: `https://restapi.amap.com/v3/geocode/regeo?key=YOUR_AMAP_KEY&location=${res.longitude},${res.latitude}`,
          success: (res: any) => {
            if (res.statusCode === 200 && res.data && res.data.regeocode) {
              location.address = res.data.regeocode.formatted_address
              
              // 更新地图位置
              moveToLocation()
            }
            uni.hideLoading();
          },
          fail: () => {
            uni.hideLoading();
          }
        })
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        locationError.value = '获取位置失败，将使用默认位置签到'
        
        // 使用默认位置
        location.latitude = 30.4851
        location.longitude = 114.3072
        location.address = '默认位置 (武昌首义学院)'
        location.updatedAt = Date.now()
        
        // 更新地图位置
        moveToLocation()
        uni.hideLoading();
      }
    })
  } catch (e) {
    console.error('获取位置异常:', e)
    locationError.value = '获取位置异常，将使用默认位置签到'
    
    // 使用默认位置
    location.latitude = 30.4851
    location.longitude = 114.3072
    location.address = '默认位置 (武昌首义学院)'
    location.updatedAt = Date.now()
    // 30.4851, 114.3072
    // 更新地图位置
    moveToLocation()
    uni.hideLoading();
  }
}

// 提交签到
async function submitLocationCheckin() {
  try {
    loading.value = true
    
    // 获取设备信息
    const deviceInfo = uni.getSystemInfoSync()
    
    // 使用当前位置，并确保包含地址信息
    const locationStr = `${location.latitude},${location.longitude},${location.address || '未知地点'}`
    
    // 准备签到数据
    const checkinData = {
      checkinId: checkinId.value,
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
  console.log('query', query)
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
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.map-fullscreen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.location-map {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  right: 30rpx;
  bottom: 480rpx;
  z-index: 10;
}

.map-control-item {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 20rpx;
}

.status-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  padding: 20rpx;
  display: flex;
  justify-content: center;
}

.status-info {
  padding: 10rpx 30rpx;
  background-color: rgba(76, 175, 80, 0.8);
  color: #fff;
  border-radius: 50rpx;
  font-size: 26rpx;
  max-width: 80%;
  text-align: center;
}

.status-error {
  background-color: rgba(244, 67, 54, 0.8);
}

.location-card {
  position: fixed;
  left: 30rpx;
  right: 30rpx;
  bottom: 50rpx;
  z-index: 10;
  background: #FFFFFF;
  border-radius: 30rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.location-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(106, 17, 203, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.location-details {
  flex: 1;
}

.location-title {
  display: block;
  font-weight: bold;
  font-size: 34rpx;
  color: #333;
}

.location-subtitle {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.refresh-btn {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  margin-bottom: 30rpx;
}

.address-box {
  margin-bottom: 24rpx;
  padding: 20rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
}

.address {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  line-height: 1.6;
}

.coordinates {
  font-size: 24rpx;
  color: #999;
}

.location-actions {
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
}

.action-item text {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.checkin-action {
  margin-top: 20rpx;
}
</style>

<route lang="json">
{
  "navigationBarTitleText": "位置签到",
  "navigationStyle": "custom"
}
</route> 