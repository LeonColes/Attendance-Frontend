<!--
 * @Author: weisheng
 * @Date: 2025-04-07 12:45:00
 * @LastEditTime: 2025-04-07 12:45:00
 * @LastEditors: weisheng
 * @Description: 创建课程页面
 * @FilePath: \wot-demo\src\pages\create-course\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/store/user'
import { createCourse } from '@/api/course'

const userStore = useUserStore()
const loading = ref(false)
const errorMessage = ref('')

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  location: ''
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

// 表单校验
function validateForm() {
  if (!formData.name) {
    errorMessage.value = '请输入课程名称'
    return false
  }
  
  if (!formData.startDate) {
    errorMessage.value = '请选择开始日期'
    return false
  }
  
  if (!formData.endDate) {
    errorMessage.value = '请选择结束日期'
    return false
  }
  
  // 检查结束日期是否大于开始日期
  const startTime = new Date(formData.startDate).getTime()
  const endTime = new Date(formData.endDate).getTime()
  
  if (endTime <= startTime) {
    errorMessage.value = '结束日期必须大于开始日期'
    return false
  }
  
  return true
}

// 提交表单创建课程
async function submitForm() {
  if (!validateForm()) {
    return
  }
  
  try {
    loading.value = true
    errorMessage.value = ''
    
    // 调用创建课程API
    const response = await createCourse({
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
      creatorId: userStore.userId
    })
    
    if (response && response.code === 200) {
      uni.showToast({
        title: '创建课程成功',
        icon: 'success'
      })
      
      // 返回到主页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index'
        })
      }, 1500)
    } else {
      errorMessage.value = response?.message || '创建课程失败'
    }
  } catch (e) {
    console.error('创建课程失败:', e)
    errorMessage.value = '创建课程失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 自定义导航栏 -->
    <wd-navbar title="创建课程" left-text="返回" @click-left="goBack" />
    
    <!-- 内容区域 -->
    <!-- @ts-ignore -->
    <view class="content-wrapper">
      <!-- @ts-ignore -->
      <view class="form-card">
        <!-- @ts-ignore -->
        <view class="card-header">
          <!-- @ts-ignore -->
          <text class="card-title">创建新课程</text>
          <!-- @ts-ignore -->
          <text class="card-subtitle">请填写课程的详细信息</text>
        </view>
        
        <!-- 表单区域 -->
        <!-- @ts-ignore -->
        <view class="form-content">
          <!-- 课程名称 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text class="required">*</text>
              <!-- @ts-ignore -->
              <text>课程名称</text>
            </view>
            <wd-input
              v-model="formData.name"
              placeholder="请输入课程名称"
              clearable
            />
          </view>
          
          <!-- 课程描述 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text>课程描述</text>
            </view>
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入课程描述（选填）"
              show-count
              maxlength="200"
              autosize
            />
          </view>
          
          <!-- 开始日期 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text class="required">*</text>
              <!-- @ts-ignore -->
              <text>开始日期</text>
            </view>
            <wd-datetime-picker
              v-model="formData.startDate"
              type="date"
              placeholder="请选择开始日期"
              title="选择开始日期"
            />
          </view>
          
          <!-- 结束日期 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text class="required">*</text>
              <!-- @ts-ignore -->
              <text>结束日期</text>
            </view>
            <wd-datetime-picker
              v-model="formData.endDate"
              type="date"
              placeholder="请选择结束日期"
              title="选择结束日期"
            />
          </view>
          
          <!-- 上课地点 -->
          <!-- @ts-ignore -->
          <view class="form-item">
            <!-- @ts-ignore -->
            <view class="form-label">
              <!-- @ts-ignore -->
              <text>上课地点</text>
            </view>
            <wd-input
              v-model="formData.location"
              placeholder="请输入上课地点（选填）"
              clearable
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
          <wd-button block type="info" :loading="loading" @click="submitForm">创建课程</wd-button>
        </view>
        
        <!-- 提示信息 -->
        <!-- @ts-ignore -->
        <view class="form-tips">
          <!-- @ts-ignore -->
          <text>创建课程后，学生可以通过课程码加入</text>
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
  
  .form-tips {
    margin-top: 20rpx;
    text-align: center;
    
    text {
      font-size: 26rpx;
      color: #999;
    }
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "创建课程",
    "navigationStyle": "custom"
  }
}
</route> 