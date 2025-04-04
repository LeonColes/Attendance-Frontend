<script lang="ts" setup>
import { reactive, ref } from 'vue'
// 在组件内部使用useToast是允许的，但为安全起见，我们暂时改用uni.showToast
// import { useToast } from 'wot-design-uni'
import { useUserStore } from '@/store/user'

// const toast = useToast()
const userStore = useUserStore()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
})

// 处理登录
async function handleLogin() {
  // 表单验证
  if (!formData.username) {
    uni.showToast({
      title: '请输入用户名',
      icon: 'none',
    })
    return
  }

  if (!formData.password) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none',
    })
    return
  }

  try {
    loading.value = true
    await userStore.login(formData)
    uni.showToast({
      title: '登录成功',
      icon: 'success',
    })

    // 跳转到首页
    uni.switchTab({
      url: '/pages/index',
    })
  }
  catch (error: any) {
    console.error('登录失败:', error)
    uni.showToast({
      title: error.message || '登录失败，请重试',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

// 跳转到注册页面
function goRegister() {
  uni.navigateTo({
    url: '/pages/register/index',
  })
}
</script>

<template>
  <view class="page-container">
    <view class="logo-container">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <view class="title">
        智能考勤助手
      </view>
    </view>

    <view class="form-container">
      <wd-toast />

      <view class="form-item">
        <wd-input v-model="formData.username" placeholder="请输入用户名" clearable />
      </view>

      <view class="form-item">
        <wd-input v-model="formData.password" type="text" password placeholder="请输入密码" clearable />
      </view>

      <view class="form-item">
        <wd-button type="primary" block :loading="loading" @click="handleLogin">
          登录
        </wd-button>
      </view>

      <view class="form-links">
        <text class="link" @click="goRegister">
          注册账号
        </text>
        <text class="link">
          忘记密码
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.page-container {
  min-height: 100vh;
  padding: 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f7f8fa;
}

.logo-container {
  margin-top: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;

  .logo {
    width: 180rpx;
    height: 180rpx;
  }

  .title {
    margin-top: 20rpx;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.form-container {
  width: 100%;
  padding: 30rpx;
  border-radius: 16rpx;
  background-color: #fff;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);

  .form-item {
    margin-bottom: 30rpx;
  }

  .form-links {
    display: flex;
    justify-content: space-between;
    margin-top: 20rpx;

    .link {
      color: #3a74f1;
      font-size: 28rpx;
    }
  }
}
</style>
