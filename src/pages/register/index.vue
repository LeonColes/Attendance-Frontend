<script lang="ts" setup>
import { reactive, ref } from 'vue'
// 改用uni.showToast
// import { useToast } from 'wot-design-uni'
import { registerStudent, registerTeacher } from '@/api/auth'

// const toast = useToast()
const loading = ref(false)
const role = ref('student')
const confirmPassword = ref('')

const formData = reactive({
  username: '',
  password: '',
  fullName: '',
  email: '',
})

// 表单验证
function validateForm() {
  if (!formData.username) {
    uni.showToast({
      title: '请输入用户名',
      icon: 'none',
    })
    return false
  }

  if (!formData.password) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none',
    })
    return false
  }

  if (formData.password !== confirmPassword.value) {
    uni.showToast({
      title: '两次密码输入不一致',
      icon: 'none',
    })
    return false
  }

  if (!formData.fullName) {
    uni.showToast({
      title: '请输入姓名',
      icon: 'none',
    })
    return false
  }

  if (!formData.email) {
    uni.showToast({
      title: '请输入邮箱',
      icon: 'none',
    })
    return false
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    uni.showToast({
      title: '邮箱格式不正确',
      icon: 'none',
    })
    return false
  }

  return true
}

// 处理注册
async function handleRegister() {
  if (!validateForm())
    return

  try {
    loading.value = true

    if (role.value === 'student') {
      await registerStudent(formData)
    }
    else {
      await registerTeacher(formData)
    }

    uni.showToast({
      title: '注册成功',
      icon: 'success',
    })

    // 跳转到登录页
    goLogin()
  }
  catch (error: any) {
    console.error('注册失败:', error)
    uni.showToast({
      title: error.message || '注册失败，请重试',
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

// 跳转到登录页
function goLogin() {
  uni.redirectTo({
    url: '/pages/login/index',
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

    <view class="content-wrapper">
      <view class="header animate__fadeInDown">
        <wd-navbar title="用户注册" left-text="返回" custom-class="custom-navbar" title-class="navbar-title" @click-left="goBack" />
      </view>

      <view class="form-container animate__fadeInUp">
        <wd-toast />

        <view class="page-title">
          创建您的账号
        </view>

        <view class="role-selector">
          <view class="selector-label">
            选择角色
          </view>
          <wd-radio-group v-model="role" custom-class="radio-group">
            <wd-radio value="student" label="student" custom-class="custom-radio">
              <view class="radio-content">
                <wd-icon name="person" custom-class="radio-icon" />
                <text>学生</text>
              </view>
            </wd-radio>
            <wd-radio value="teacher" label="teacher" custom-class="custom-radio">
              <view class="radio-content">
                <wd-icon name="tutorial" custom-class="radio-icon" />
                <text>教师</text>
              </view>
            </wd-radio>
          </wd-radio-group>
        </view>

        <view class="form-item">
          <wd-icon name="person" custom-class="input-icon" />
          <wd-input v-model="formData.username" placeholder="请输入用户名" clearable custom-class="custom-input" />
        </view>

        <view class="form-item">
          <wd-icon name="lock" custom-class="input-icon" />
          <wd-input v-model="formData.password" type="text" password placeholder="请输入密码" clearable custom-class="custom-input" />
        </view>

        <view class="form-item">
          <wd-icon name="check" custom-class="input-icon" />
          <wd-input v-model="confirmPassword" type="text" password placeholder="请确认密码" clearable custom-class="custom-input" />
        </view>

        <view class="form-item">
          <wd-icon name="tickets" custom-class="input-icon" />
          <wd-input v-model="formData.fullName" placeholder="请输入姓名" clearable custom-class="custom-input" />
        </view>

        <view class="form-item">
          <wd-icon name="mail" custom-class="input-icon" />
          <wd-input v-model="formData.email" placeholder="请输入邮箱" clearable custom-class="custom-input" />
        </view>

        <view class="form-item">
          <wd-button type="primary" block :loading="loading" custom-class="register-btn" @click="handleRegister">
            注册
          </wd-button>
        </view>

        <view class="form-links">
          <text class="link" @click="goLogin">
            已有账号，去登录
          </text>
        </view>
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
  background-color: transparent;
  display: flex;
  flex-direction: column;
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
  width: 100%;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.header {
  animation-duration: 1s;
  animation-fill-mode: both;
  position: sticky;
  top: 0;
  z-index: 100;
}

.custom-navbar {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.1) !important;
}

.navbar-title {
  color: white !important;
  font-weight: bold !important;
}

.form-container {
  flex: 1;
  margin: 30rpx;
  padding: 40rpx;
  border-radius: 24rpx;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  animation-duration: 1s;
  animation-fill-mode: both;

  .page-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #6a11cb;
    text-align: center;
    margin-bottom: 30rpx;
  }

  .role-selector {
    margin: 30rpx 0;

    .selector-label {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 16rpx;
    }

    .radio-group {
      display: flex;
      justify-content: space-around;
    }

    .custom-radio {
      padding: 20rpx 30rpx !important;
      background-color: #f5f7fa !important;
      border-radius: 16rpx !important;
      margin: 0 10rpx !important;
      transition: all 0.3s ease;

      &.is-checked {
        background-color: rgba(106, 17, 203, 0.1) !important;
        box-shadow: 0 4rpx 16rpx rgba(106, 17, 203, 0.1) !important;
      }
    }

    .radio-content {
      display: flex;
      flex-direction: column;
      align-items: center;

      .radio-icon {
        font-size: 44rpx !important;
        margin-bottom: 10rpx;
        color: #6a11cb;
      }
    }
  }

  .form-item {
    margin-bottom: 30rpx;
    position: relative;
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
    padding-left: 60rpx !important;
    border-radius: 50rpx !important;
    height: 90rpx !important;
    background-color: #f5f7fa !important;
    transition: all 0.3s ease;

    &:focus {
      box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2);
    }
  }

  .register-btn {
    height: 90rpx !important;
    border-radius: 50rpx !important;
    background: linear-gradient(45deg, #6a11cb, #2575fc) !important;
    border: none !important;
    box-shadow: 0 8rpx 16rpx rgba(37, 117, 252, 0.3) !important;
    font-size: 32rpx !important;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 4rpx 8rpx rgba(37, 117, 252, 0.3) !important;
    }
  }

  .form-links {
    display: flex;
    justify-content: center;
    margin-top: 20rpx;

    .link {
      color: #6a11cb;
      font-size: 28rpx;
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

      &:hover:after {
        width: 100%;
      }
    }
  }
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
