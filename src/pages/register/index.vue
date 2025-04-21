<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { register, type RegisterParams } from '@/api/user'

const loading = ref(false)
const confirmPassword = ref('')

// 设备信息相关
const statusBarHeight = ref(0)
const navBarHeight = ref(90)
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
  // 导航栏总高度 = 状态栏高度 + 固定高度(44px)
  navBarHeight.value = statusBarHeight.value + 44
})

const formData = reactive({
  username: '',
  password: '',
  fullName: '',
  email: '',
  role: 'student' as 'student' | 'teacher'
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

  // 电子邮箱可选
  if (formData.email) {
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      uni.showToast({
        title: '邮箱格式不正确',
        icon: 'none',
      })
      return false
    }
  }

  return true
}

// 处理注册
async function handleRegister() {
  if (!validateForm())
    return

  try {
    loading.value = true
    
    // 使用统一的注册接口，传入角色参数
    const response = await register({
      ...formData,
      role: formData.role === 'student' ? 'STUDENT' : 'TEACHER',
    })

    // 检查响应状态
    if (response && response.code === 200) {
      uni.showToast({
        title: '注册成功',
        icon: 'success',
      })

      // 跳转到登录页
      goLogin()
    } else {
      uni.showToast({
        title: response?.message || '注册失败，请重试',
        icon: 'none',
      })
    }
  }
  catch (error: any) {
    console.error('注册失败:', error)
    uni.showToast({
      title: error.message || '注册失败，请重试',
      icon: 'none',
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

<script lang="ts">
export default {
  // 不需要单独引用mixin，因为已经在main.ts中全局注册了滚动事件处理
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
      <view class="form-container animate__fadeInUp">
        <wd-toast />

        <view class="page-title">
          创建您的账号
        </view>

        <view class="role-selector">
          <view class="selector-label">
            选择角色
          </view>
          <view class="role-cards">
            <view
              class="role-card"
              :class="{ active: formData.role === 'student' }"
              @click="formData.role = 'student'"
            >
              <view class="role-icon-container">
                <wd-icon name="person" class="role-icon" />
              </view>
              <view class="role-name">
                学生
              </view>
            </view>

            <view
              class="role-card"
              :class="{ active: formData.role === 'teacher' }"
              @click="formData.role = 'teacher'"
            >
              <view class="role-icon-container">
                <wd-icon name="tutorial" class="role-icon" />
              </view>
              <view class="role-name">
                教师
              </view>
            </view>
          </view>
        </view>

        <view class="form-section">
          <view class="section-title">
            账号信息
          </view>

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

          <view class="form-item">
            <view class="input-label">
              <wd-icon name="check" custom-class="label-icon" />
              <text>确认密码</text>
            </view>
            <view class="input-wrapper">
              <wd-input
                v-model="confirmPassword"
                placeholder="请确认密码"
                show-password
                clearable
                width="100%"
                custom-class="custom-input"
              />
            </view>
          </view>
        </view>

        <view class="form-section">
          <view class="section-title">
            个人信息
          </view>

          <view class="form-item">
            <view class="input-label">
              <wd-icon name="tickets" custom-class="label-icon" />
              <text>姓名</text>
            </view>
            <view class="input-wrapper">
              <wd-input
                v-model="formData.fullName"
                placeholder="请输入姓名"
                clearable
                width="100%"
                custom-class="custom-input"
              />
            </view>
          </view>

          <view class="form-item">
            <view class="input-label">
              <wd-icon name="mail" custom-class="label-icon" />
              <text>邮箱</text>
            </view>
            <view class="input-wrapper">
              <wd-input
                v-model="formData.email"
                placeholder="请输入邮箱"
                clearable
                width="100%"
                custom-class="custom-input"
              />
            </view>
          </view>
        </view>

        <view class="form-item button-item">
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
    margin-bottom: 40rpx;
  }

  .form-section {
    margin-bottom: 40rpx;
    padding: 30rpx;
    background-color: rgba(255, 255, 255, 0.6);
    border-radius: 16rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

    .section-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #444;
      margin-bottom: 20rpx;
      position: relative;
      padding-left: 20rpx;

      &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 30rpx;
        background: linear-gradient(to bottom, #6a11cb, #2575fc);
        border-radius: 4rpx;
      }
    }
  }

  .role-selector {
    margin-bottom: 40rpx;

    .selector-label {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
      margin-bottom: 20rpx;
      text-align: center;
    }

    .role-cards {
      display: flex;
      justify-content: space-evenly;
      margin: 0 20rpx;

      .role-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 180rpx;
        padding: 30rpx 20rpx;
        background-color: #f5f7fa;
        border-radius: 16rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        border: 2rpx solid transparent;

        &.active {
          background-color: rgba(106, 17, 203, 0.1);
          border-color: #6a11cb;
          transform: translateY(-4rpx);
          box-shadow: 0 8rpx 24rpx rgba(106, 17, 203, 0.2);

          .role-icon-container {
            background: linear-gradient(45deg, #6a11cb, #2575fc);

            .role-icon {
              color: white;
            }
          }

          .role-name {
            color: #6a11cb;
            font-weight: bold;
          }
        }

        .role-icon-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          background-color: #eaedf2;
          margin-bottom: 16rpx;
          transition: all 0.3s ease;

          .role-icon {
            font-size: 40rpx;
            color: #6a11cb;
          }
        }

        .role-name {
          font-size: 28rpx;
          color: #444;
          transition: all 0.3s ease;
        }
      }
    }
  }

  .form-item {
    margin-bottom: 30rpx;
    position: relative;

    &:last-child {
      margin-bottom: 0;
    }
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

  .custom-input {
    padding: 0 30rpx !important;
    border-radius: 16rpx !important;
    height: 100rpx !important;
    background-color: white !important;
    transition: all 0.3s ease;
    font-size: 32rpx !important;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05) !important;
    width: 100% !important;
    box-sizing: border-box !important;

    &:focus {
      box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2) !important;
    }
  }

  .button-item {
    margin-top: 50rpx;
  }

  .register-btn {
    height: 100rpx !important;
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
    justify-content: center;
    margin-top: 40rpx;

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
