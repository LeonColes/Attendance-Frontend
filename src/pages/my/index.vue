<!--
 * @Author: weisheng
 * @Date: 2025-04-07 12:00:00
 * @LastEditTime: 2025-04-07 12:00:00
 * @LastEditors: weisheng
 * @Description: 个人中心页面
 * @FilePath: \wot-demo\src\pages\my\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

// 界面数据
const userStore = useUserStore()
const darkMode = ref(false)

// 计算属性
const roleName = computed(() => {
  const role = userStore.role
  if (role === 'TEACHER') return '教师'
  if (role === 'STUDENT') return '学生'
  return '未知角色'
})

// 生命周期
onShow(() => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    getSafeUni().redirectTo({
      url: '/pages/login/index'
    })
    return
  }
  
  // 加载主题设置
  loadThemeSetting()
})

// 初始化
onMounted(() => {
  // 设置导航栏标题
  getSafeUni().setNavigationBarTitle({
    title: '个人中心'
  })
})

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 加载主题设置
function loadThemeSetting() {
  try {
    const savedTheme = getSafeUni().getStorageSync('app_theme')
    darkMode.value = savedTheme === 'dark'
    updateTheme()
  } catch (e) {
    console.error('加载主题设置失败', e)
  }
}

// 通用导航函数
function navigateTo(url: string) {
  getSafeUni().navigateTo({ url })
}

// 切换主题
function toggleTheme() {
  darkMode.value = !darkMode.value
  updateTheme()
  
  // 保存主题设置
  getSafeUni().setStorageSync('app_theme', darkMode.value ? 'dark' : 'light')
}

// 更新主题
function updateTheme() {
  console.log('主题已更新为:', darkMode.value ? 'dark' : 'light')
}

// 退出登录
function logout() {
  getSafeUni().showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        getSafeUni().redirectTo({
          url: '/pages/login/index'
        })
      }
    }
  })
}

// 前往个人信息编辑页面
function goToProfile() {
  navigateTo('/pages/profile/index')
}

// 前往关于页面
function goToAbout() {
  getSafeUni().navigateTo({
    url: '/pages/about/index'
  })
}

// 前往设置页面
function goToSettings() {
  getSafeUni().navigateTo({
    url: '/pages/settings/index'
  })
}
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <!-- 个人信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image class="avatar" :src="userStore.userInfo?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ userStore.fullName || '未登录' }}</text>
          <text class="role">{{ roleName }}</text>
        </view>
      </view>
      
      <view class="theme-toggle" @click="toggleTheme">
        <wd-icon :name="darkMode ? 'sunny' : 'moon'" size="48rpx" color="#6a11cb" />
      </view>
    </view>
    
    <!-- 核心菜单 -->
    <view class="menu-card">
      <view class="menu-item" @click="goToProfile">
        <wd-icon name="person-setting" size="42rpx" color="#6a11cb" />
        <text class="menu-text">个人信息</text>
        <wd-icon name="arrow-right" size="32rpx" class="arrow-icon" />
      </view>
      
      <view class="menu-item" @click="goToSettings">
        <wd-icon name="setting" size="42rpx" color="#6a11cb" />
        <text class="menu-text">应用设置</text>
        <wd-icon name="arrow-right" size="32rpx" class="arrow-icon" />
      </view>
      
      <view class="menu-item" @click="goToAbout">
        <wd-icon name="info" size="42rpx" color="#6a11cb" />
        <text class="menu-text">关于我们</text>
        <wd-icon name="arrow-right" size="32rpx" class="arrow-icon" />
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <view class="logout-button" @click="logout">
      <wd-icon name="exit" size="36rpx" color="#f56c6c" />
      <text>退出登录</text>
    </view>
    
    <!-- 版本信息 -->
    <view class="version-info">
      <text>智能考勤 v1.0.0</text>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #7f7fd5 0%, #86a8e7 50%, #91eae4 100%);
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  color: #333;
  transition: all 0.4s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &.dark-mode {
    background: linear-gradient(135deg, #141e30 0%, #243b55 100%);
    color: #eee;
    
    .user-card, .menu-card, .logout-button {
      background-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.25);
    }
    
    .menu-item {
      border-bottom-color: rgba(255, 255, 255, 0.08);
      
      &:active {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }
    
    .menu-text, .name {
      color: #fff;
    }
    
    .role, .arrow-icon, .version-info text {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .theme-toggle {
      background-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.2);
    }
    
    .logout-button {
      color: #ff8a8a;
      border: 1px solid rgba(255, 138, 138, 0.3);
      
      &:active {
        background-color: rgba(255, 138, 138, 0.1);
      }
    }
  }
}

/* 卡片基础样式 */
.user-card, .menu-card, .logout-button {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 28rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 700rpx;
  box-sizing: border-box;
  backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;
  
  &:active {
    transform: translateY(2rpx);
  }
}

/* 用户卡片 */
.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx;
  margin-top: 20rpx;
  
  .user-info {
    display: flex;
    align-items: center;
    
    .avatar {
      width: 130rpx;
      height: 130rpx;
      border-radius: 50%;
      margin-right: 30rpx;
      border: 4rpx solid #fff;
      box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
    }
    
    .info {
      .name {
        font-size: 38rpx;
        font-weight: bold;
        margin-bottom: 12rpx;
        display: block;
      }
      
      .role {
        font-size: 26rpx;
        color: #666;
        background-color: rgba(106, 17, 203, 0.1);
        padding: 6rpx 16rpx;
        border-radius: 30rpx;
        display: inline-block;
      }
    }
  }
  
  .theme-toggle {
    width: 90rpx;
    height: 90rpx;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
    
    &:active {
      transform: scale(0.95);
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}

/* 菜单卡片 */
.menu-card {
  padding: 0;
  overflow: hidden;
  border-radius: 24rpx;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 34rpx 40rpx;
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
    transition: background-color 0.2s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background-color: rgba(0, 0, 0, 0.03);
    }
    
    wd-icon:first-child {
      margin-right: 24rpx;
    }
    
    .menu-text {
      flex: 1;
      font-size: 32rpx;
    }
    
    .arrow-icon {
      color: #bbb;
    }
  }
}

/* 退出按钮 */
.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  text-align: center;
  font-size: 32rpx;
  color: #f56c6c;
  font-weight: bold;
  border: 1px solid rgba(245, 108, 108, 0.3);
  margin-top: 40rpx;
  
  wd-icon {
    margin-right: 12rpx;
  }
  
  &:active {
    background-color: rgba(245, 108, 108, 0.05);
  }
}

/* 版本信息 */
.version-info {
  text-align: center;
  padding: 30rpx 0;
  width: 100%;
  margin-top: auto;
  
  text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>

<route lang="json">
{
  "layout": "tabbar",
  "name": "my",
  "style": {
    "navigationBarTitleText": "个人中心"
  }
}
</route>
