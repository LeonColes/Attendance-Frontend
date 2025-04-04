<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'
import type { CheckInType } from '@/api/task'
import { createTask } from '@/api/task'

// 用户信息
const _userStore = useUserStore()

// 页面状态
const loading = ref(false)
const showAnimations = ref(false)
const formData = ref({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  locationRequirement: '',
  checkInType: 'MANUAL' as CheckInType,
})

// 检查表单是否有效
const isFormValid = computed(() => {
  return (
    formData.value.title.trim() !== ''
    && formData.value.startTime.trim() !== ''
    && formData.value.endTime.trim() !== ''
  )
})

// 签到类型选项
const checkInTypeOptions = [
  { value: 'LOCATION', label: '位置签到' },
  { value: 'GPS', label: 'GPS签到' },
  { value: 'QR_CODE', label: '二维码签到' },
  { value: 'WIFI', label: 'Wi-Fi签到' },
  { value: 'MANUAL', label: '手动签到' },
  { value: 'AUTOMATIC', label: '自动签到' },
]

// 初始化动画
onMounted(() => {
  setTimeout(() => {
    showAnimations.value = true
  }, 100)
})

// 选择日期和时间
function selectDateTime(type: 'start' | 'end') {
  // 使用标准时间选择器API
  const now = new Date()

  uni.showToast({
    title: '请选择日期时间',
    icon: 'none',
  })

  // 模拟设置日期，实际产品中应配置真实日期选择器
  setTimeout(() => {
    const date = new Date().toISOString()
    if (type === 'start') {
      formData.value.startTime = date
    }
    else {
      // 设置结束时间为当前时间+2小时
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      formData.value.endTime = endTime.toISOString()
    }
  }, 500)
}

// 提交表单
async function handleSubmit() {
  if (!isFormValid.value) {
    uni.showToast({
      title: '请填写必要的信息',
      icon: 'error',
    })
    return
  }

  try {
    loading.value = true
    await createTask({
      title: formData.value.title,
      description: formData.value.description,
      startTime: formData.value.startTime,
      endTime: formData.value.endTime,
      locationRequirement: formData.value.locationRequirement,
      checkInType: formData.value.checkInType,
    })

    uni.showToast({
      title: '创建成功',
      icon: 'success',
    })

    // 创建成功后返回
    setTimeout(() => {
      goBack()
    }, 1500)
  }
  catch (error) {
    console.error('创建任务失败', error)
    uni.showToast({
      title: '创建失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="container">
    <view class="content-wrapper">
      <view
        class="form-container"
        :class="{ 'animate-in': showAnimations }"
      >
        <view class="form-group">
          <view class="form-label">
            <text class="required">
              *
            </text>
            <text>任务标题</text>
          </view>
          <view class="form-input">
            <wd-input
              v-model="formData.title"
              placeholder="输入签到任务标题"
              border
              :maxlength="50"
            />
          </view>
        </view>

        <view class="form-group">
          <view class="form-label">
            <text>任务描述</text>
          </view>
          <view class="form-input">
            <wd-textarea
              v-model="formData.description"
              placeholder="输入签到任务的相关描述信息"
              :maxlength="200"
              :auto-height="true"
            />
          </view>
        </view>

        <view class="form-group">
          <view class="form-label">
            <text class="required">
              *
            </text>
            <text>开始时间</text>
          </view>
          <view class="form-input">
            <wd-button
              type="default"
              class="date-picker-btn"
              @click="selectDateTime('start')"
            >
              <view class="btn-content">
                <wd-icon name="calendar" color="#6a11cb" size="32rpx" />
                <text class="btn-text">
                  {{ formData.startTime || '选择开始时间' }}
                </text>
              </view>
            </wd-button>
          </view>
        </view>

        <view class="form-group">
          <view class="form-label">
            <text class="required">
              *
            </text>
            <text>结束时间</text>
          </view>
          <view class="form-input">
            <wd-button
              type="default"
              class="date-picker-btn"
              @click="selectDateTime('end')"
            >
              <view class="btn-content">
                <wd-icon name="calendar" color="#6a11cb" size="32rpx" />
                <text class="btn-text">
                  {{ formData.endTime || '选择结束时间' }}
                </text>
              </view>
            </wd-button>
          </view>
        </view>

        <view class="form-group">
          <view class="form-label">
            <text>地点要求</text>
          </view>
          <view class="form-input">
            <wd-input
              v-model="formData.locationRequirement"
              placeholder="输入签到地点要求（可选）"
              border
              :maxlength="100"
            />
          </view>
        </view>

        <view class="form-group">
          <view class="form-label">
            <text>签到类型</text>
          </view>
          <view class="form-input">
            <wd-radio-group v-model="formData.checkInType">
              <wd-cell-group>
                <wd-cell
                  v-for="option in checkInTypeOptions"
                  :key="option.value"
                  :title="option.label"
                >
                  <template #right>
                    <wd-radio :value="option.value" />
                  </template>
                </wd-cell>
              </wd-cell-group>
            </wd-radio-group>
          </view>
        </view>
      </view>

      <view
        class="form-actions"
        :class="{ 'animate-in-delay': showAnimations }"
      >
        <wd-button
          type="primary"
          class="submit-btn"
          :loading="loading"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          创建任务
        </wd-button>

        <wd-button
          type="default"
          class="cancel-btn"
          @click="goBack"
        >
          取消
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;

  // 页面背景渐变
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200rpx;
    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    z-index: -1;
  }
}

.content-wrapper {
  width: 100%;
  padding: 30rpx;
  box-sizing: border-box;
}

.form-container {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 30rpx;

  &:last-child {
    margin-bottom: 0;
  }

  .form-label {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    font-size: 30rpx;
    color: #333;
    font-weight: 500;

    .required {
      color: #f5222d;
      margin-right: 8rpx;
    }
  }

  .form-input {
    width: 100%;

    .date-picker-btn {
      width: 100%;
      height: 80rpx;
      background-color: #f5f7fa;
      border: 1px solid #e8e8e8;

      .btn-content {
        display: flex;
        align-items: center;
        justify-content: flex-start;

        .btn-text {
          margin-left: 10rpx;
          color: #333;
        }
      }
    }
  }
}

.form-actions {
  display: flex;
  flex-direction: column;

  .submit-btn {
    width: 100%;
    height: 90rpx;
    margin-bottom: 20rpx;
    background: linear-gradient(45deg, #6a11cb, #2575fc);
    border-radius: 45rpx;
    box-shadow: 0 8rpx 16rpx rgba(106, 17, 203, 0.3);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 4rpx 8rpx rgba(106, 17, 203, 0.2);
    }

    &.button-disabled {
      background: #ccc;
      box-shadow: none;
    }
  }

  .cancel-btn {
    width: 100%;
    height: 90rpx;
    border-radius: 45rpx;
    border: 1px solid #dcdfe6;
    transition: all 0.3s ease;

    &:active {
      background-color: #f5f7fa;
    }
  }
}

// 动画类
.animate-in {
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.animate-in-delay {
  animation: fadeInUp 0.6s ease 0.3s forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "创建签到任务"
  }
}
</route>
