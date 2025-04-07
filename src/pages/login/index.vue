<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const loading = ref(false)

// 设备信息相关
const statusBarHeight = ref(0)
const safeAreaInsetTop = ref(0)

// 获取设备信息
function getDeviceInfo() {
  try {
    // 使用推荐的新API
    const windowInfo = uni.getWindowInfo()
    const deviceInfo = uni.getDeviceInfo()
    
    return {
      // 状态栏高度
      statusBarHeight: windowInfo.statusBarHeight || 20,
      // 安全区域顶部高度
      safeAreaTop: windowInfo.safeAreaInsets?.top || 0
    }
  } catch (e) {
    console.error('获取设备信息失败:', e)
    // 如果新API不可用，回退到旧API
    const sysInfo = uni.getSystemInfoSync()
    return {
      statusBarHeight: sysInfo.statusBarHeight || 20,
      safeAreaTop: sysInfo.safeArea?.top || 0
    }
  }
}

// 获取设备信息
onMounted(() => {
  const deviceInfo = getDeviceInfo()
  // 状态栏高度
  statusBarHeight.value = deviceInfo.statusBarHeight
  // 安全区域顶部高度
  safeAreaInsetTop.value = deviceInfo.safeAreaTop
})

const formData = reactive({
  username: '',
  password: '',
})

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni;
}

// 登录操作
async function handleLogin() {
  // 校验表单
  if (!formData.username.trim()) {
    getSafeUni().showToast({
      title: '请输入用户名',
      icon: 'none'
    })
    return
  }
  
  if (!formData.password.trim()) {
    getSafeUni().showToast({
      title: '请输入密码',
      icon: 'none'
    })
    return
  }
  
  try {
    loading.value = true
    
    // 调用登录API
    await userStore.login(formData)
    
    // 处理登录成功
    getSafeUni().showToast({
      title: '登录成功',
      icon: 'success'
    })
    // 跳转到首页
    uni.reLaunch({
      url: '/pages/index'
    })
  } catch (error) {
    console.error('登录失败', error)
    getSafeUni().showToast({
      title: '登录失败，请检查用户名和密码',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 跳转到注册页面
function goToRegister() {
  getSafeUni().navigateTo({
    url: '/pages/register/index'
  })
}
</script>

<template>
  <view class="page-container">
    <view class="wave-bg">
      <view class="wave wave1" />
      <view class="wave wave2" />
      <view class="wave wave3" />
    </view>

    <view class="content-wrapper" :style="{ paddingTop: `${safeAreaInsetTop + 30}px` }">
      <view class="logo-container animate__fadeInDown">
        <image class="logo" src="/static/logo.png" mode="aspectFit" />
        <view class="title">
          智能考勤助手
        </view>
        <view class="subtitle">
          便捷、智能的考勤管理系统
        </view>
      </view>

      <view class="form-container animate__fadeInUp">
        <wd-toast />

        <view class="form-item">
          <view class="input-label">
            <wd-icon name="person" custom-class="label-icon" />
            <text>用户名</text>
          </view>
          <view class="input-wrapper">
            <wd-input
              v-model="formData.username"
              placeholder="请输入用户名"
              clearable
              width="100%"
              custom-class="custom-input"
            />
          </view>
        </view>

        <view class="form-item">
          <view class="input-label">
            <wd-icon name="lock" custom-class="label-icon" />
            <text>密码</text>
          </view>
          <view class="input-wrapper">
            <wd-input
              v-model="formData.password"
              placeholder="请输入密码"
              show-password
              clearable
              width="100%"
              custom-class="custom-input"
            />
          </view>
        </view>

        <view class="form-item button-item">
          <wd-button type="primary" block :loading="loading" custom-class="login-btn" @click="handleLogin">
            登录
          </wd-button>
        </view>

        <view class="form-links">
          <text class="link" @click="goToRegister">
            注册账号
          </text>
          <text class="link">
            忘记密码
          </text>
        </view>
      </view>

      <view class="footer">
        <text>© 2025 智能考勤助手</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
@keyframes animate-wave {
  0% {
    transform: translateX(0) translateZ(0) scaleY(1);
  }
  50% {
    transform: translateX(-25%) translateZ(0) scaleY(0.8);
  }
  100% {
    transform: translateX(-50%) translateZ(0) scaleY(1);
  }
}

.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
}

.wave-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background-repeat: repeat-x;
  background-position: 0 bottom;
  transform-origin: center bottom;
}

.wave1 {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255, 255, 255, 0.1)" fill-opacity="1" d="M0,64L48,96C96,128,192,192,288,202.7C384,213,480,171,576,133.3C672,96,768,64,864,74.7C960,85,1056,139,1152,154.7C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
  animation: animate-wave 25s linear infinite;
  z-index: 1;
}

.wave2 {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255, 255, 255, 0.2)" fill-opacity="1" d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,165.3C672,160,768,192,864,197.3C960,203,1056,181,1152,170.7C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
  animation: animate-wave 20s linear reverse infinite;
  opacity: 0.8;
  z-index: 2;
}

.wave3 {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255, 255, 255, 0.3)" fill-opacity="1" d="M0,192L48,176C96,160,192,128,288,117.3C384,107,480,117,576,138.7C672,160,768,192,864,186.7C960,181,1056,139,1152,117.3C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
  animation: animate-wave 15s linear infinite;
  opacity: 0.6;
  z-index: 3;
}

.content-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: 30px;
}

.logo-container {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
  animation-duration: 1s;
  animation-fill-mode: both;

  .logo {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
    background-color: white;
    padding: 20rpx;
  }

  .title {
    margin-top: 30rpx;
    font-size: 48rpx;
    font-weight: bold;
    color: white;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
  }

  .subtitle {
    margin-top: 20rpx;
    font-size: 30rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.form-container {
  width: 85%;
  max-width: 650rpx;
  padding: 50rpx 40rpx;
  border-radius: 24rpx;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-delay: 0.2s;

  .form-item {
    margin-bottom: 40rpx;
    position: relative;
  }

  .input-label {
    display: flex;
    align-items: center;
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 16rpx;
    padding-left: 8rpx;

    .label-icon {
      color: #6a11cb;
      margin-right: 10rpx;
      font-size: 32rpx;
    }
  }

  .input-wrapper {
    position: relative;
    width: 100%;
  }

  .input-icon {
    position: absolute;
    left: 20rpx;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    color: #6a11cb;
  }

  .custom-input {
    padding: 0 30rpx !important;
    border-radius: 16rpx !important;
    height: 100rpx !important;
    background-color: #f5f7fa !important;
    transition: all 0.3s ease;
    font-size: 32rpx !important;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05) !important;
    width: 100% !important;
    box-sizing: border-box !important;

    &:focus {
      box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2);
    }
  }

  .password-icon {
    position: absolute;
    right: 20rpx;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    color: #666;
    padding: 16rpx;
    cursor: pointer;
  }

  .button-item {
    margin-top: 50rpx;
  }

  .login-btn {
    height: 96rpx !important;
    border-radius: 50rpx !important;
    background: linear-gradient(45deg, #6a11cb, #2575fc) !important;
    border: none !important;
    box-shadow: 0 8rpx 16rpx rgba(37, 117, 252, 0.3) !important;
    font-size: 34rpx !important;
    font-weight: bold !important;
    transition: all 0.3s ease;
    letter-spacing: 8rpx;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 4rpx 8rpx rgba(37, 117, 252, 0.3) !important;
    }
  }

  .form-links {
    display: flex;
    justify-content: space-between;
    margin-top: 40rpx;
    padding: 0 16rpx;

    .link {
      color: #6a11cb;
      font-size: 30rpx;
      position: relative;
      transition: all 0.3s ease;

      &:after {
        content: '';
        position: absolute;
        width: 0;
        height: 2rpx;
        bottom: -4rpx;
        left: 0;
        background-color: #6a11cb;
        transition: width 0.3s ease;
      }

      &:hover:after, &:active:after {
        width: 100%;
      }
    }
  }
}

.footer {
  margin-top: 80rpx;
  color: rgba(255, 255, 255, 0.7);
  font-size: 26rpx;
}

// 添加简单的动画类
.animate__fadeInDown {
  animation-name: fadeInDown;
}

.animate__fadeInUp {
  animation-name: fadeInUp;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate3d(0, -50px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 50px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>
