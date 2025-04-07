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
import { createCourse, type Course } from '@/api/courses'
import CustomNavBar from '@/components/CustomNavBar.vue'

const userStore = useUserStore()
const loading = ref(false)
const errorMessage = ref('')

// 设置日期范围
const minDate = new Date('2025-01-01').getTime()
const maxDate = new Date('2035-01-01').getTime()

// 日期选择器
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  startDate: minDate,
  endDate: minDate,
  type: 'COURSE'
})

// 格式化日期显示
function formatDate(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

// 设置开始日期
function confirmStartDate(value) {
  formData.startDate = value
  showStartDatePicker.value = false
}

// 设置结束日期
function confirmEndDate(value) {
  formData.endDate = value
  showEndDatePicker.value = false
}

// 取消日期选择
function cancelDatePicker() {
  showStartDatePicker.value = false
  showEndDatePicker.value = false
}

// 提交表单创建课程
async function submitForm() {
  if (!validateForm()) {
    return
  }
  
  try {
    loading.value = true
    errorMessage.value = ''
    
    // 调用创建课程API，使用类型断言添加type字段
    const response = await createCourse({
      name: formData.name,
      description: formData.description,
      startDate: new Date(formData.startDate).toISOString().split('T')[0],
      endDate: new Date(formData.endDate).toISOString().split('T')[0],
      type: formData.type
    } as any)
    
    if (response && response.code === 200) {
      uni.showToast({
        title: '创建课程成功',
        icon: 'success'
      })
      
      // 创建成功后直接返回到主页
      setTimeout(() => {
        navigateToHome()
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

// 导航到首页
function navigateToHome() {
  // 尝试返回上一页
  uni.navigateBack({
    delta: 1,
    fail: () => {
      // 如果返回失败，使用特定平台的导航方法
      // #ifdef MP-WEIXIN
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index'
        })
      }, 50)
      // #endif
      
      // #ifndef MP-WEIXIN
      uni.switchTab({
        url: '/pages/index'
      })
      // #endif
    }
  })
}

// 返回上一页
function goBack() {
  uni.navigateBack({
    fail: () => {
      // 如果返回失败，使用特定平台的导航方法
      // #ifdef MP-WEIXIN
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index'
        })
      }, 50)
      // #endif
      
      // #ifndef MP-WEIXIN
      uni.switchTab({
        url: '/pages/index'
      })
      // #endif
    }
  })
}
</script>

<template>
  <view class="container">
    <!-- 自定义导航栏 -->
    <CustomNavBar 
      title="创建课程" 
      @back="goBack"
      :title-color="'#FFFFFF'"
      :background-color="'rgba(106, 17, 203, 0.98)'"
      :scrolled-background-color="'rgba(106, 17, 203, 1)'"
    />
    
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <view class="page-title">
        <text class="title-text">创建新课程</text>
        <text class="subtitle-text">填写以下信息开始您的教学之旅</text>
      </view>
      
      <view class="form-card">
        <!-- 课程名称 -->
        <view class="form-item">
          <view class="form-item-title">
            <wd-icon name="edit" size="38rpx" color="#6a11cb" />
            <text>课程名称</text>
            <text class="required">*</text>
          </view>
          <wd-input
            v-model="formData.name"
            placeholder="请输入课程名称"
            clearable
            custom-class="name-input"
          />
        </view>
        
        <!-- 课程描述 -->
        <view class="form-item">
          <view class="form-item-title">
            <wd-icon name="info" size="38rpx" color="#6a11cb" />
            <text>课程描述</text>
          </view>
          <wd-textarea
            v-model="formData.description"
            placeholder="请输入课程描述（选填）"
            show-count
            :maxlength="200"
            autosize
            custom-class="desc-textarea"
          />
        </view>
        
        <!-- 日期选择区域 -->
        <view class="form-item date-row">
          <!-- 开始日期 -->
          <view class="date-item">
            <view class="form-item-title">
              <wd-icon name="calendar-check" size="38rpx" color="#6a11cb" />
              <text>开始日期</text>
              <text class="required">*</text>
            </view>
            <view class="date-input" @click="showStartDatePicker = true">
              <text>{{ formatDate(formData.startDate) }}</text>
              <wd-icon name="arrow-down" size="28rpx" color="#999" />
            </view>
          </view>
          
          <!-- 结束日期 -->
          <view class="date-item">
            <view class="form-item-title">
              <wd-icon name="calendar-check" size="38rpx" color="#6a11cb" />
              <text>结束日期</text>
              <text class="required">*</text>
            </view>
            <view class="date-input" @click="showEndDatePicker = true">
              <text>{{ formatDate(formData.endDate) }}</text>
              <wd-icon name="arrow-down" size="28rpx" color="#999" />
            </view>
          </view>
        </view>
        
        <!-- 错误信息 -->
        <view v-if="errorMessage" class="error-message">
          <wd-icon name="warning" size="32rpx" color="#f56c6c" />
          <text>{{ errorMessage }}</text>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <view class="button-container">
        <!-- 提示信息 -->
        <view class="form-tips">
          <wd-icon name="info" size="28rpx" color="#fff" />
          <text>创建课程后，学生可以通过课程详情页的邀请二维码加入</text>
        </view>
        
        <wd-button 
          block 
          type="primary" 
          :loading="loading" 
          @click="submitForm"
          custom-class="submit-button"
        >
          <view class="button-content">
            <wd-icon name="add" size="36rpx" color="#FFFFFF" class="button-icon" />
            <text>创建课程</text>
          </view>
        </wd-button>
      </view>
    </view>
    
    <!-- 开始日期选择弹出层 -->
    <wd-popup v-model="showStartDatePicker" position="bottom">
      <wd-datetime-picker-view
        v-model="formData.startDate"
        type="date"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="confirmStartDate"
        @cancel="cancelDatePicker"
        title="选择开始日期"
        confirm-button-text="确定"
        cancel-button-text="取消"
      />
    </wd-popup>
    
    <!-- 结束日期选择弹出层 -->
    <wd-popup v-model="showEndDatePicker" position="bottom">
      <wd-datetime-picker-view
        v-model="formData.endDate"
        type="date"
        :min-date="formData.startDate"
        :max-date="maxDate"
        @confirm="confirmEndDate"
        @cancel="cancelDatePicker"
        title="选择结束日期"
        confirm-button-text="确定"
        cancel-button-text="取消"
      />
    </wd-popup>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(145deg, #6a11cb 0%, #2575fc 100%);
  position: relative;
}

.content-wrapper {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.page-title {
  margin: 40rpx 20rpx 60rpx;
  
  .title-text {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 16rpx;
    text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
  }
  
  .subtitle-text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.form-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 36rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .form-item-title {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    wd-icon {
      margin-right: 12rpx;
    }
    
    text {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
    }
    
    .required {
      color: #f56c6c;
      margin-left: 8rpx;
    }
  }
}

.date-row {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.date-item {
  flex: 1;
}

.date-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  border: 1px solid #e0e0e0;
  
  text {
    font-size: 28rpx;
    color: #333;
  }
}

.error-message {
  background-color: #fff6f6;
  border-left: 4rpx solid #f56c6c;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  margin-top: 30rpx;
  display: flex;
  align-items: center;
  
  text {
    color: #f56c6c;
    font-size: 28rpx;
    margin-left: 12rpx;
  }
}

.button-container {
  margin-top: auto;
  padding: 30rpx 0 60rpx;
}

.form-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  
  text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-left: 8rpx;
  }
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  
  .button-icon {
    margin-right: 10rpx;
  }
}

:deep(.submit-button) {
  background-image: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border: none;
  height: 100rpx;
  font-size: 36rpx;
  font-weight: bold;
  border-radius: 50rpx;
  box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.2);
}

:deep(.name-input),
:deep(.desc-textarea) {
  background-color: rgba(106, 17, 203, 0.05);
  border: 1px solid rgba(106, 17, 203, 0.1);
  border-radius: 16rpx;
  font-size: 30rpx;
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