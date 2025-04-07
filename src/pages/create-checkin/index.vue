<!--
 * @Author: weisheng
 * @Date: 2025-04-07 13:00:00
 * @LastEditTime: 2025-04-07 13:00:00
 * @LastEditors: weisheng
 * @Description: 创建签到页面
 * @FilePath: \wot-demo\src\pages\create-checkin\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { CheckInType, createCheckin } from '@/api/attendance'

// 为window.uni声明类型，解决TypeScript错误
declare global {
  interface Window {
    uni: typeof uni;
  }
}

const userStore = useUserStore()
const loading = ref(false)
const courseId = ref('')
const errorMessage = ref('')

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  checkinType: CheckInType.QR_CODE,
  locationRequired: false,
  location: {
    latitude: 0,
    longitude: 0,
    radius: 100, // 默认100米范围
    address: ''
  }
})

// 使用临时变量存储半径值，避免类型问题
const radiusValue = ref(100)

// 监听radiusValue的变化
watch(radiusValue, (newValue) => {
  formData.location.radius = Number(newValue)
})

// 获取系统信息
function getSystemInfo() {
  try {
    // 使用推荐的新API
    const windowInfo = uni.getWindowInfo()
    const deviceInfo = uni.getDeviceInfo()
    return {
      platform: deviceInfo.platform,
      model: deviceInfo.model,
      windowWidth: windowInfo.windowWidth,
      windowHeight: windowInfo.windowHeight,
      statusBarHeight: windowInfo.statusBarHeight,
      safeArea: windowInfo.safeArea
    }
  } catch (e) {
    console.error('获取系统信息失败:', e)
    // 如果新API不可用，回退到旧API
    return uni.getSystemInfoSync()
  }
}

// 初始化
onMounted(() => {
  // 从路由参数获取课程ID
  const query = uni.getLaunchOptionsSync().query || {}
  
  // 尝试从query中获取课程ID
  courseId.value = query.courseId || ''
  
  // 如果从query中无法获取，尝试从当前页面获取
  if (!courseId.value) {
    try {
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      // @ts-ignore 忽略类型检查
      const options = page?.options || {}
      courseId.value = options.courseId || ''
    } catch (e) {
      console.error('获取页面参数失败:', e)
    }
  }
  
  if (!courseId.value) {
    uni.showToast({
      title: '缺少课程ID',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  
  // 初始化时间
  const now = new Date()
  const later = new Date(now.getTime() + 30 * 60 * 1000) // 默认30分钟后结束
  
  formData.startTime = formatDateTime(now)
  formData.endTime = formatDateTime(later)
})

// 格式化日期时间
function formatDateTime(date: Date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 选择位置
function chooseLocation() {
  uni.chooseLocation({
    success: (res) => {
      formData.location.latitude = res.latitude
      formData.location.longitude = res.longitude
      formData.location.address = res.address
      
      uni.showToast({
        title: '位置已设置',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '选择位置失败',
        icon: 'none'
      })
    }
  })
}

// 表单校验
function validateForm() {
  if (!formData.name) {
    errorMessage.value = '请输入签到名称'
    return false
  }
  
  if (!formData.startTime) {
    errorMessage.value = '请选择开始时间'
    return false
  }
  
  if (!formData.endTime) {
    errorMessage.value = '请选择结束时间'
    return false
  }
  
  // 检查结束时间是否大于开始时间
  const startTime = new Date(formData.startTime).getTime()
  const endTime = new Date(formData.endTime).getTime()
  
  if (endTime <= startTime) {
    errorMessage.value = '结束时间必须大于开始时间'
    return false
  }
  
  // 如果选择位置签到，验证位置信息
  if (formData.checkinType === CheckInType.LOCATION && formData.locationRequired) {
    if (formData.location.latitude === 0 || formData.location.longitude === 0) {
      errorMessage.value = '请选择签到位置'
      return false
    }
  }
  
  return true
}

// 提交表单创建签到
async function submitForm() {
  if (!validateForm()) {
    return
  }
  
  try {
    loading.value = true
    errorMessage.value = ''
    
    // 准备API参数
    const checkinParams = {
      courseId: courseId.value,
      title: formData.name,
      description: formData.description || '',
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      checkInType: formData.checkinType,
      verifyParams: '{}' // 默认空对象字符串
    }
    
    // 如果是位置签到，添加位置信息到verifyParams
    if (formData.checkinType === CheckInType.LOCATION && formData.locationRequired) {
      const locationParams = {
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        radius: 100, // 使用固定值，避免类型问题
        address: formData.location.address
      }
      checkinParams.verifyParams = JSON.stringify(locationParams)
    }
    
    console.log('创建签到任务，参数:', checkinParams)
    
    // 调用创建签到API
    const response = await createCheckin(checkinParams)
    
    if (response && response.code === 200) {
      console.log('创建签到成功:', response.data)
      
      uni.showToast({
        title: '创建签到成功',
        icon: 'success'
      })
      
      // 返回到课程详情页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      throw new Error(response?.message || '创建签到失败')
    }
  } catch (e) {
    console.error('创建签到失败:', e)
    errorMessage.value = '创建签到失败，请稍后再试'
    
    uni.showToast({
      title: '创建签到失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 修改半径值handler
function handleRadiusChange(value: string | number) {
  formData.location.radius = Number(value);
}
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 自定义导航栏 -->
    <wd-navbar title="创建签到" left-text="返回" @click-left="goBack" />
    
    <!-- 内容区域 -->
    <!-- @ts-ignore -->
    <view class="content-wrapper">
      <!-- @ts-ignore -->
      <view class="form-card">
        <!-- 表单标题 -->
        <!-- @ts-ignore -->
        <view class="card-header">
          <!-- @ts-ignore -->
          <text class="card-title">创建签到任务</text>
          <!-- @ts-ignore -->
          <text class="card-subtitle">请填写签到任务的详细信息</text>
        </view>
        
        <!-- 表单区域 -->
        <!-- @ts-ignore -->
        <view class="form-content">
          <!-- 签到名称 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text class="required">*</text>
              <!-- @ts-ignore -->
              <text>签到名称</text>
            </view>
            <wd-input
              v-model="formData.name"
              placeholder="请输入签到名称"
              clearable
            />
          </view>
          
          <!-- 签到类型 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text class="required">*</text>
              <!-- @ts-ignore -->
              <text>签到类型</text>
            </view>
            <wd-radio-group v-model="formData.checkinType">
              <wd-radio :value="CheckInType.QR_CODE">二维码签到</wd-radio>
              <wd-radio :value="CheckInType.LOCATION">位置签到</wd-radio>
              <wd-radio :value="CheckInType.WIFI">WiFi签到</wd-radio>
            </wd-radio-group>
          </view>
          
          <!-- 位置设置（仅当选择位置签到时显示） -->
          <!-- @ts-ignore -->
          <view v-if="formData.checkinType === CheckInType.LOCATION" class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text>位置设置</text>
            </view>
            <wd-switch 
              v-model="formData.locationRequired" 
              active-value="true"
              inactive-value="false"
            >
              <!-- @ts-ignore -->
              <text slot="active">启用位置验证</text>
              <!-- @ts-ignore -->
              <text slot="inactive">不启用位置验证</text>
            </wd-switch>
            
            <!-- @ts-ignore -->
            <view v-if="formData.locationRequired" class="location-settings">
              <!-- @ts-ignore -->
              <view class="location-info">
                <!-- @ts-ignore -->
                <text v-if="formData.location.address">{{ formData.location.address }}</text>
                <!-- @ts-ignore -->
                <text v-else class="placeholder">尚未设置位置</text>
              </view>
              
              <!-- @ts-ignore -->
              <view class="radius-setting">
                <!-- @ts-ignore -->
                <text>有效半径：{{ formData.location.radius }}米</text>
                <wd-slider v-model="radiusValue" :min="50" :max="500" :step="50" />
              </view>
              
              <wd-button block plain @click="chooseLocation">选择位置</wd-button>
            </view>
          </view>
          
          <!-- 开始时间 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text class="required">*</text>
              <!-- @ts-ignore -->
              <text>开始时间</text>
            </view>
            <wd-datetime-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="请选择开始时间"
              title="选择开始时间"
            />
          </view>
          
          <!-- 结束时间 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text class="required">*</text>
              <!-- @ts-ignore -->
              <text>结束时间</text>
            </view>
            <wd-datetime-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="请选择结束时间"
              title="选择结束时间"
            />
          </view>
        </view>
        
        <!-- 错误信息 -->
        <!-- @ts-ignore -->
        <view v-if="errorMessage" class="error-message">
          <!-- @ts-ignore -->
          <text>{{ errorMessage }}</text>
        </view>
        
        <!-- 按钮区域 -->
        <!-- @ts-ignore -->
        <view class="button-group">
          <wd-button block type="info" :loading="loading" @click="submitForm">创建签到</wd-button>
        </view>
      </view>
      
      <!-- 提示信息 -->
      <!-- @ts-ignore -->
      <view class="tips-card">
        <!-- @ts-ignore -->
        <view class="tips-header">
          <wd-icon name="info" size="40rpx" color="#2575fc" />
          <!-- @ts-ignore -->
          <text class="tips-title">签到类型说明</text>
        </view>
        
        <!-- @ts-ignore -->
        <view class="tips-content">
          <!-- @ts-ignore -->
          <text>1. 二维码签到：学生扫描二维码进行签到</text>
          <!-- @ts-ignore -->
          <text>2. 位置签到：学生需要在指定位置范围内签到</text>
          <!-- @ts-ignore -->
          <text>3. WiFi签到：学生需要连接指定WiFi网络签到</text>
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

.content-wrapper {
  padding: 30rpx;
  padding-top: 40rpx;
}

.form-card {
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
  
  .form-content {
    margin-bottom: 30rpx;
  }
  
  .form-item {
    margin-bottom: 30rpx;
    
    .form-label {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
      .required {
        color: #f56c6c;
        margin-right: 8rpx;
      }
      
      text {
        font-size: 28rpx;
        color: #333;
      }
    }
    
    .location-settings {
      margin-top: 20rpx;
      
      .location-info {
        background-color: #f5f5f5;
        padding: 20rpx;
        border-radius: 8rpx;
        margin-bottom: 20rpx;
        
        text {
          font-size: 26rpx;
          color: #333;
          
          &.placeholder {
            color: #999;
          }
        }
      }
      
      .radius-setting {
        margin-bottom: 20rpx;
        
        text {
          display: block;
          font-size: 26rpx;
          color: #333;
          margin-bottom: 10rpx;
        }
      }
    }
  }
  
  .error-message {
    margin-bottom: 20rpx;
    text {
      color: #f56c6c;
      font-size: 26rpx;
    }
  }
  
  .button-group {
    margin-top: 40rpx;
  }
}

.tips-card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  
  .tips-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .tips-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-left: 16rpx;
    }
  }
  
  .tips-content {
    display: flex;
    flex-direction: column;
    
    text {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 10rpx;
      line-height: 1.5;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "创建签到",
    "navigationStyle": "custom"
  }
}
</route> 