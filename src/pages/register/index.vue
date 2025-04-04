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
    <view class="header">
      <wd-navbar title="用户注册" left-text="返回" @click-left="goBack" />
    </view>

    <view class="form-container">
      <wd-toast />

      <view class="role-selector">
        <wd-radio-group v-model="role">
          <wd-radio value="student" label="student">
            学生
          </wd-radio>
          <wd-radio value="teacher" label="teacher">
            教师
          </wd-radio>
        </wd-radio-group>
      </view>

      <view class="form-item">
        <wd-input v-model="formData.username" placeholder="请输入用户名" clearable />
      </view>

      <view class="form-item">
        <wd-input v-model="formData.password" type="text" password placeholder="请输入密码" clearable />
      </view>

      <view class="form-item">
        <wd-input v-model="confirmPassword" type="text" password placeholder="请确认密码" clearable />
      </view>

      <view class="form-item">
        <wd-input v-model="formData.fullName" placeholder="请输入姓名" clearable />
      </view>

      <view class="form-item">
        <wd-input v-model="formData.email" placeholder="请输入邮箱" clearable />
      </view>

      <view class="form-item">
        <wd-button type="primary" block :loading="loading" @click="handleRegister">
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
</template>

<style lang="scss">
.page-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.form-container {
  flex: 1;
  padding: 30rpx;

  .role-selector {
    margin: 30rpx 0;
    display: flex;
    justify-content: center;
  }

  .form-item {
    margin-bottom: 30rpx;
  }

  .form-links {
    display: flex;
    justify-content: center;
    margin-top: 20rpx;

    .link {
      color: #3a74f1;
      font-size: 28rpx;
    }
  }
}
</style>
