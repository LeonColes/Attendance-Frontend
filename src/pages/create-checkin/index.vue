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
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'
import { CheckInType, createCheckin } from '@/api/attendance'

// 为window.uni声明类型，解决TypeScript错误
declare global {
  interface Window {
    uni: typeof uni;
  }
}

const userStore = useUserStore()
const themeStore = useThemeStore()
const loading = ref(false)
const courseId = ref('')
const errorMessage = ref('')

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  checkinType: CheckInType.QR_CODE,
  location: {
    latitude: 0,
    longitude: 0,
    radius: 100, // 默认100米范围
    address: ''
  }
})

// 计算是否显示预览信息
const showDateTimePreview = computed(() => {
  return formData.startDate && formData.startTime && formData.endDate && formData.endTime;
});

// 计算完整的开始时间预览
const startTimePreview = computed(() => {
  if (!formData.startDate || !formData.startTime) return '';
  try {
    const date = new Date(`${formData.startDate}T${formData.startTime}:00`);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${formData.startTime}`;
  } catch (e) {
    return `${formData.startDate} ${formData.startTime}`;
  }
});

// 计算完整的结束时间预览
const endTimePreview = computed(() => {
  if (!formData.endDate || !formData.endTime) return '';
  try {
    const date = new Date(`${formData.endDate}T${formData.endTime}:00`);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${formData.endTime}`;
  } catch (e) {
    return `${formData.endDate} ${formData.endTime}`;
  }
});

// 计算完整的开始和结束时间字符串，用于API调用
const computedStartTime = computed(() => {
  if (!formData.startDate || !formData.startTime) return '';
  return `${formData.startDate}T${formData.startTime}:00`;
});

const computedEndTime = computed(() => {
  if (!formData.endDate || !formData.endTime) return '';
  return `${formData.endDate}T${formData.endTime}:00`;
});

// 使用临时变量存储半径值，避免类型问题
const radiusValue = ref(100)

// 签到类型选项
const checkinTypeOptions = [
  { label: '二维码签到', value: CheckInType.QR_CODE },
  { label: '位置签到', value: CheckInType.LOCATION }
]

// 监听radiusValue的变化
watch(radiusValue, (newValue) => {
  formData.location.radius = Number(newValue)
})

// 监听签到类型变化
watch(() => formData.checkinType, (newType) => {
  // 如果切换到位置签到，直接显示位置设置部分
  if (newType === CheckInType.LOCATION) {
    // 无需设置locationRequired
  }
})

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
  
  initFormData();
})

// 初始化表单数据
function initFormData() {
  try {
    // 初始化时间 - 开始时间为当前时间+5分钟（给用户更多准备时间）
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); 
    
    // 结束时间为开始时间+45分钟
    const future = new Date(now.getTime());
    future.setMinutes(future.getMinutes() + 45);
    
    // 设置日期和时间
    formData.startDate = formatDateForPicker(now);
    formData.startTime = formatTimeForPicker(now);
    formData.endDate = formatDateForPicker(future);
    formData.endTime = formatTimeForPicker(future);
  } catch (err) {
    console.error('初始化日期失败:', err);
  }
}

// 日期时间格式化函数
function formatDateForPicker(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeForPicker(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 简单字符串转换，将ISO格式转为后端需要的格式，不进行时区转换
function convertToBackendFormat(isoString: string): string {
  if (!isoString) return '';
  // 只是替换"T"为空格，从 "YYYY-MM-DDThh:mm:ss" 到 "YYYY-MM-DD hh:mm:ss"
  return isoString.replace('T', ' ');
}

// 日期选择器变更处理函数
function onStartDateChange(e: any) {
  formData.startDate = e.detail.value;
}

function onStartTimeChange(e: any) {
  formData.startTime = e.detail.value;
}

function onEndDateChange(e: any) {
  formData.endDate = e.detail.value;
}

function onEndTimeChange(e: any) {
  formData.endTime = e.detail.value;
}

// 选择位置
function chooseLocation() {
  try {
    // 显示加载提示
    uni.showLoading({
      title: '正在准备位置服务...'
    });
    
    // 直接尝试选择位置，如果权限未授权会自动弹出授权请求
    uni.chooseLocation({
      success: (res) => {
        uni.hideLoading();
        if (res.latitude && res.longitude) {
          formData.location.latitude = res.latitude;
          formData.location.longitude = res.longitude;
          formData.location.address = res.address || '已选择位置';
          
          console.log('位置选择成功:', res);
          
          // 显示成功提示并添加振动反馈
          uni.showToast({
            title: '位置已设置',
            icon: 'success'
          });
          
          // 尝试振动反馈
          try {
            uni.vibrateShort({
              success: () => {
                console.log('振动反馈成功');
              },
              fail: () => {}
            });
          } catch (error) {}
        } else {
          uni.showToast({
            title: '获取位置信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        uni.hideLoading();
        console.error('选择位置失败:', err);
        
        // 检查是否是因为权限问题
        if (err.errMsg && (
          err.errMsg.includes('authorize') || 
          err.errMsg.includes('permission') || 
          err.errMsg.includes('auth') ||
          err.errMsg.includes('deny')
        )) {
          // 打开设置页面引导用户授权
          uni.showModal({
            title: '需要位置权限',
            content: '请在设置中允许获取位置信息',
            confirmText: '去设置',
            success(res) {
              if (res.confirm) {
                uni.openSetting({
                  success(settingRes) {
                    console.log('设置结果:', settingRes);
                    if (settingRes.authSetting && settingRes.authSetting['scope.userLocation']) {
                      uni.showToast({
                        title: '授权成功，请重新选择位置',
                        icon: 'none',
                        duration: 2000
                      });
                      
                      // 短暂延迟后重试
                      setTimeout(() => {
                        chooseLocation();
                      }, 1000);
                    }
                  }
                });
              }
            }
          });
        } else if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消
          uni.showToast({
            title: '已取消选择位置',
            icon: 'none'
          });
        } else {
          // 其他错误
          uni.showToast({
            title: '选择位置失败，请重试',
            icon: 'none'
          });
        }
      },
      complete: () => {
        uni.hideLoading();
      }
    });
  } catch (err) {
    uni.hideLoading();
    console.error('选择位置错误', err);
    uni.showToast({
      title: '位置服务异常，请重试',
      icon: 'none'
    });
  }
}

// 表单校验
function validateForm() {
  if (!formData.name) {
    errorMessage.value = '请输入签到名称';
    return false;
  }
  
  if (!formData.startDate || !formData.startTime) {
    errorMessage.value = '请选择开始时间';
    return false;
  }
  
  if (!formData.endDate || !formData.endTime) {
    errorMessage.value = '请选择结束时间';
    return false;
  }
  
  // 检查结束时间是否大于开始时间
  const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
  const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`);
  
  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    errorMessage.value = '日期格式不正确';
    return false;
  }
  
  if (endDateTime <= startDateTime) {
    errorMessage.value = '结束时间必须大于开始时间';
    return false;
  }
  
  // 如果选择位置签到，验证位置信息
  if (formData.checkinType === CheckInType.LOCATION) {
    if (formData.location.latitude === 0 || formData.location.longitude === 0) {
      errorMessage.value = '请选择签到位置';
      return false;
    }
  }
  
  return true;
}

// 提交表单创建签到
async function submitForm() {
  if (!validateForm()) {
    return;
  }
  
  try {
    loading.value = true;
    errorMessage.value = '';
    
    // 准备API参数
    const checkinParams = {
      courseId: courseId.value,
      title: formData.name,
      description: formData.description || '',
      startTime: convertToBackendFormat(computedStartTime.value),
      endTime: convertToBackendFormat(computedEndTime.value),
      checkInType: formData.checkinType,
      verifyParams: '{}' // 默认空对象字符串
    };
    
    // 如果是位置签到，添加位置信息到verifyParams
    if (formData.checkinType === CheckInType.LOCATION) {
      const locationParams = {
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        radius: formData.location.radius,
        address: formData.location.address || '未命名位置'
      };
      checkinParams.verifyParams = JSON.stringify(locationParams);
      console.log('位置签到参数:', locationParams);
    }
    
    console.log('创建签到任务，参数:', checkinParams);
    
    // 调用创建签到API
    const response = await createCheckin(checkinParams);
    
    if (response && response.code === 200) {
      console.log('创建签到成功:', response.data);
      
      uni.showToast({
        title: '创建签到成功',
        icon: 'success'
      });
      
      // 返回到课程详情页
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      throw new Error(response?.message || '创建签到失败');
    }
  } catch (e) {
    console.error('创建签到失败:', e);
    errorMessage.value = '创建签到失败，请稍后再试';
    
    uni.showToast({
      title: '创建签到失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
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
  <view class="container" :class="{'wot-theme-dark': themeStore.isDarkMode}">
    <view class="header">
      <view class="title">创建签到任务</view>
      <view class="subtitle">请设置签到参数</view>
    </view>
    
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <view class="form-card">
        <!-- 签到名称 -->
        <view class="form-item">
          <view class="form-item-title">
            <wd-icon name="edit" size="38rpx" color="#6a11cb" />
            <text>签到名称</text>
            <text class="required">*</text>
          </view>
          <wd-input
            v-model="formData.name"
            placeholder="请输入签到名称"
            clearable
            custom-class="name-input"
          />
        </view>
        
        <!-- 签到描述 -->
        <view class="form-item">
          <view class="form-item-title">
            <wd-icon name="info" size="38rpx" color="#6a11cb" />
            <text>签到描述</text>
          </view>
          <wd-textarea
            v-model="formData.description"
            placeholder="请输入签到描述（选填）"
            show-count
            :maxlength="200"
            autosize
            custom-class="desc-textarea"
          />
        </view>
        
        <!-- 签到类型 -->
        <view class="form-item">
          <view class="form-item-title">
            <wd-icon name="setting" size="38rpx" color="#6a11cb" />
            <text>签到方式</text>
            <text class="required">*</text>
          </view>
          <view class="type-selector">
            <view 
              v-for="option in checkinTypeOptions" 
              :key="option.value"
              class="type-option"
              :class="{ active: formData.checkinType === option.value }"
              @click="formData.checkinType = option.value"
            >
              <wd-icon :name="option.value === CheckInType.QR_CODE ? 'qrcode' : 'location'" size="40rpx" 
                      :color="formData.checkinType === option.value ? '#fff' : '#666'" />
              <text>{{ option.label }}</text>
            </view>
          </view>
        </view>
        
        <!-- 位置签到设置 - 仅当选择位置签到时显示 -->
        <view v-if="formData.checkinType === CheckInType.LOCATION" class="form-item location-section">
          <view class="form-item-title">
            <wd-icon name="location" size="38rpx" color="#6a11cb" />
            <text>位置设置</text>
            <text class="required">*</text>
          </view>
          
          <view class="location-wrapper">
            <view class="location-info">
              <view v-if="formData.location.address" class="location-address">
                <wd-icon name="success" size="32rpx" color="#52c41a" />
                <text>{{ formData.location.address }}</text>
              </view>
              <view v-else class="location-address no-location">
                <wd-icon name="warn" size="32rpx" color="#faad14" />
                <text>尚未设置位置</text>
              </view>
              
              <wd-button 
                block 
                type="primary" 
                custom-style="margin-top: 20rpx; margin-bottom: 20rpx;"
                @click="chooseLocation"
              >
                <wd-icon name="location" size="28rpx" color="#FFFFFF" />
                <text style="margin-left: 8rpx;">{{ formData.location.address ? '重新选择位置' : '选择签到位置' }}</text>
              </wd-button>
            </view>
            
            <view class="radius-selector">
              <view class="radius-header">
                <text class="radius-label">签到范围</text>
                <text class="radius-value">{{ formData.location.radius }}米</text>
              </view>
              <wd-slider v-model="radiusValue" :min="50" :max="500" :step="10" />
              <text class="radius-hint">提示：设置合适的签到范围，太小可能导致学生无法签到，太大则降低签到的准确性</text>
            </view>
          </view>
        </view>
        
        <!-- 时间设置 -->
        <view class="form-item">
          <view class="form-item-title">
            <wd-icon name="time" size="38rpx" color="#6a11cb" />
            <text>开始时间</text>
            <text class="required">*</text>
          </view>
          <view class="datetime-picker-container">
            <view class="datetime-picker-group">
              <picker
                mode="date"
                :value="formData.startDate"
                start="2025-01-01"
                end="2035-12-31"
                @change="onStartDateChange"
              >
                <view class="datetime-picker-view">
                  <view class="picker-label">日期</view>
                  <view class="picker-value">
                    <text>{{ formData.startDate || '选择日期' }}</text>
                    <wd-icon name="calendar" size="32rpx" color="#6a11cb" />
                  </view>
                </view>
              </picker>
              
              <picker
                mode="time"
                :value="formData.startTime"
                @change="onStartTimeChange"
              >
                <view class="datetime-picker-view">
                  <view class="picker-label">时间</view>
                  <view class="picker-value">
                    <text>{{ formData.startTime || '选择时间' }}</text>
                    <wd-icon name="clock" size="32rpx" color="#6a11cb" />
                  </view>
                </view>
              </picker>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <view class="form-item-title">
            <wd-icon name="time" size="38rpx" color="#6a11cb" />
            <text>结束时间</text>
            <text class="required">*</text>
          </view>
          <view class="datetime-picker-container">
            <view class="datetime-picker-group">
              <picker
                mode="date"
                :value="formData.endDate"
                start="2025-01-01"
                end="2035-12-31"
                @change="onEndDateChange"
              >
                <view class="datetime-picker-view">
                  <view class="picker-label">日期</view>
                  <view class="picker-value">
                    <text>{{ formData.endDate || '选择日期' }}</text>
                    <wd-icon name="calendar" size="32rpx" color="#6a11cb" />
                  </view>
                </view>
              </picker>
              
              <picker
                mode="time"
                :value="formData.endTime"
                @change="onEndTimeChange"
              >
                <view class="datetime-picker-view">
                  <view class="picker-label">时间</view>
                  <view class="picker-value">
                    <text>{{ formData.endTime || '选择时间' }}</text>
                    <wd-icon name="clock" size="32rpx" color="#6a11cb" />
                  </view>
                </view>
              </picker>
            </view>
          </view>
        </view>
        
        <!-- 时间预览 -->
        <view v-if="showDateTimePreview" class="time-preview">
          <view class="time-preview-header">
            <wd-icon name="info" size="32rpx" color="#36a2eb" />
            <text>签到时间预览</text>
          </view>
          <view class="time-preview-content">
            <view class="preview-item">
              <text class="label">开始：</text>
              <text class="value">{{ startTimePreview }}</text>
            </view>
            <view class="preview-item">
              <text class="label">结束：</text>
              <text class="value">{{ endTimePreview }}</text>
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
          <text>创建签到后，学生可以在课程详情页进行签到</text>
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
            <text>创建签到</text>
          </view>
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(145deg, #6a11cb 0%, #2575fc 100%);
  position: relative;
  transition: all 0.3s ease;
  
  // 暗黑模式样式
  &.wot-theme-dark {
    background: linear-gradient(145deg, #1e1e2e 0%, #1a2341 100%);
    
    .form-card {
      background: rgba(32, 33, 44, 0.95);
      box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(80, 80, 100, 0.2);
      
      .form-item-title {
        text {
          color: #e0e0e0;
        }
        
        .required {
          color: #ff6b6b;
        }
      }
    }
    
    .input-field {
      background-color: rgba(60, 60, 75, 0.8);
      border-color: rgba(80, 80, 100, 0.4);
      
      text {
        color: #e0e0e0;
      }
    }
    
    .error-message {
      background-color: rgba(100, 40, 40, 0.3);
      border-left-color: #ff6b6b;
      
      text {
        color: #ff8a8a;
      }
    }
    
    .location-display {
      background-color: rgba(50, 50, 65, 0.8);
      border-color: rgba(80, 80, 100, 0.4);
      
      text {
        color: #e0e0e0;
      }
    }
    
    .form-tips {
      text {
        color: rgba(220, 220, 240, 0.9);
      }
    }
    
    .submit-button {
      background: linear-gradient(45deg, #5a24b0, #2367e0) !important;
      box-shadow: 0 8rpx 16rpx rgba(20, 30, 100, 0.4) !important;
    }
    
    .radius-slider {
      .slider-track {
        background-color: rgba(60, 60, 75, 0.8);
      }
      
      .slider-value {
        color: #e0e0e0;
      }
    }
    
    .tab-group {
      .tab-item {
        background-color: rgba(50, 50, 65, 0.5);
        color: #a0a0a0;
        
        &.active {
          background-color: rgba(106, 17, 203, 0.3);
          color: #ffffff;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
        }
      }
    }
  }
}

.header {
  width: 100%;
  padding: 40rpx 40rpx 20rpx;
  
  .title {
    font-size: 48rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 12rpx;
    text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
  }
  
  .subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.content-wrapper {
  padding: 30rpx;
  padding-top: 10rpx;
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

.type-selector {
  display: flex;
  justify-content: space-around;
  gap: 20rpx;
  margin-top: 20rpx;
  
  .type-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30rpx 20rpx;
    background-color: #f5f7fa;
    border-radius: 16rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
    gap: 16rpx;
    
    &.active {
      background: linear-gradient(45deg, #6a11cb, #2575fc);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-4rpx);
      box-shadow: 0 8rpx 24rpx rgba(106, 17, 203, 0.2);
      
      text {
        color: #fff;
        font-weight: bold;
      }
    }
    
    text {
      font-size: 28rpx;
      color: #333;
      transition: all 0.3s ease;
    }
  }
}

.location-section {
  background-color: rgba(245, 247, 250, 0.5);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 20rpx;
  
  .location-wrapper {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }
  
  .location-info {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }
  
  .location-address {
    display: flex;
    align-items: center;
    gap: 8rpx;
    
    wd-icon {
      margin-right: 8rpx;
    }
  }
  
  .no-location {
    color: #faad14;
  }
  
  .radius-selector {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-top: 20rpx;
    background-color: #f8f9fa;
    padding: 20rpx;
    border-radius: 12rpx;
    
    .radius-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;
      
      .radius-label {
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
      }
      
      .radius-value {
        font-size: 24rpx;
        color: #666;
        background-color: rgba(106, 17, 203, 0.1);
        padding: 4rpx 12rpx;
        border-radius: 20rpx;
      }
    }
  }
}

.radius-hint {
  font-size: 22rpx;
  color: #999;
  margin-top: 12rpx;
  line-height: 1.4;
}

.location-address {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 1px solid #e8e8e8;
  
  text {
    font-size: 28rpx;
    margin-left: 12rpx;
    word-break: break-all;
    flex: 1;
  }
  
  &.no-location {
    border: 1px dashed #faad14;
    background-color: rgba(250, 173, 20, 0.05);
    
    text {
      color: #faad14;
    }
  }
}

.datetime-picker-container {
  width: 100%;
  margin-top: 16rpx;
}

.datetime-picker-group {
  display: flex;
  gap: 20rpx;
}

.datetime-picker-view {
  flex: 1;
  background-color: #f8f9fa;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.99);
    background-color: #f0f2f5;
  }
  
  .picker-label {
    font-size: 24rpx;
    color: #888;
    margin-bottom: 8rpx;
  }
  
  .picker-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    text {
      font-size: 32rpx;
      color: #333;
      font-weight: 500;
    }
  }
}

.wot-theme-dark {
  .datetime-picker-view {
    background-color: rgba(50, 50, 65, 0.8);
    border-color: rgba(80, 80, 100, 0.4);
    
    &:active {
      background-color: rgba(60, 60, 75, 0.8);
    }
    
    .picker-label {
      color: #a0a0a0;
    }
    
    .picker-value text {
      color: #e0e0e0;
    }
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

.submit-button {
  height: 100rpx !important;
  border-radius: 50rpx !important;
  background: linear-gradient(45deg, #6a11cb, #2575fc) !important;
  border: none !important;
  box-shadow: 0 8rpx 16rpx rgba(37, 117, 252, 0.3) !important;
  
  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    
    .button-icon {
      margin-right: 12rpx;
    }
    
    text {
      font-size: 32rpx;
      font-weight: bold;
    }
  }
}

:deep(.wd-textarea) {
  border-radius: 12rpx !important;
  background-color: #f8f9fa !important;
  padding: 20rpx !important;

  // 暗黑模式适配
  .wot-theme-dark & {
    background-color: rgba(50, 50, 65, 0.8) !important;
    color: #e0e0e0 !important;
    
    .wd-textarea__textarea::placeholder {
      color: rgba(200, 200, 220, 0.5) !important;
    }
  }
}

:deep(.wd-input) {
  border-radius: 12rpx !important;
  background-color: #f8f9fa !important;
  padding: 12rpx 20rpx !important;
  
  // 暗黑模式适配
  .wot-theme-dark & {
    background-color: rgba(50, 50, 65, 0.8) !important;
    color: #e0e0e0 !important;
    
    .wd-input__inner::placeholder {
      color: rgba(200, 200, 220, 0.5) !important;
    }
  }
}

.time-preview {
  margin-top: 30rpx;
  padding: 20rpx;
  background-color: rgba(54, 162, 235, 0.1);
  border-radius: 16rpx;
  border-left: 6rpx solid #36a2eb;
  
  .time-preview-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    text {
      margin-left: 10rpx;
      font-size: 28rpx;
      color: #36a2eb;
      font-weight: 500;
    }
  }
  
  .time-preview-content {
    padding-left: 42rpx;
  }
  
  .preview-item {
    display: flex;
    align-items: center;
    margin-bottom: 10rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .label {
      font-size: 28rpx;
      color: #666;
      width: 100rpx;
    }
    
    .value {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
    }
  }
}

.wot-theme-dark .time-preview {
  background-color: rgba(54, 162, 235, 0.15);
  border-left-color: rgba(54, 162, 235, 0.8);
  
  .time-preview-header text {
    color: rgba(54, 162, 235, 0.9);
  }
  
  .preview-item {
    .label {
      color: #a0a0a0;
    }
    
    .value {
      color: #e0e0e0;
    }
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "创建签到"
  }
}
</route> 