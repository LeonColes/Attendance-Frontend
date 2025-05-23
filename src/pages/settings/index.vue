<!--
 * @Author: weisheng
 * @Date: 2025-04-08 14:00:00
 * @LastEditTime: 2025-04-08 14:00:00
 * @LastEditors: weisheng
 * @Description: 个人中心与设置页面
 * @FilePath: \wot-demo\src\pages\settings\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'

// 获取状态管理
const userStore = useUserStore()
const themeStore = useThemeStore()

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
  
  // 每次页面显示时应用当前主题
  themeStore.updateSystemUITheme()
})

// 初始化
onMounted(() => {
  // 设置导航栏标题
  getSafeUni().setNavigationBarTitle({
    title: '我的'
  })
})

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 切换主题
function toggleTheme() {
  themeStore.toggleTheme()
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

// 前往关于页面
function goToAbout() {
  // getSafeUni().navigateTo({
  //   url: '/pages/about/index'
  // })
  getSafeUni().showToast({
    title: 'leoncole@yeah.net',
    icon: 'none'
  })
}
</script>

<template>
  <view class="container" :class="{'wot-theme-dark': themeStore.isDarkMode}">
    <!-- 个人信息卡片 -->
    <view class="card user-card">
      <view class="user-info">
        <image class="avatar" :src="userStore.userInfo?.avatar || 'static/default-avatar.png'" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ userStore.fullName || '未登录' }}</text>
          <text class="role">{{ roleName }}</text>
        </view>
      </view>
      
      <view class="theme-toggle" @click="toggleTheme">
        <wd-icon :name="themeStore.isDarkMode ? 'sunny' : 'moon'" size="48rpx" color="#ff6b00" />
      </view>
    </view>
    
    <!-- 主题设置卡片 -->
    <view class="card settings-card">
      <view class="section-title">主题设置</view>
      
      <!-- 主题跟随系统 -->
      <view class="setting-item" v-if="themeStore.supportsDarkMode">
        <view class="setting-label">跟随系统主题</view>
        <wd-switch 
          :modelValue="themeStore.followSystemTheme" 
          @update:modelValue="themeStore.toggleFollowSystem"
          activeColor="#ff6b00"
        />
      </view>
      
      <!-- 手动选择主题 -->
      <view class="setting-item" :class="{ 'disabled': themeStore.followSystemTheme }">
        <view class="setting-label">深色模式</view>
        <wd-switch 
          :disabled="themeStore.followSystemTheme"
          :modelValue="themeStore.isDarkMode" 
          @update:modelValue="themeStore.toggleTheme"
          activeColor="#ff6b00"
        />
      </view>
      
      <!-- 主题模式说明 -->
      <view class="setting-tips">
        <text v-if="themeStore.followSystemTheme">当前使用系统主题设置，将自动跟随系统切换明暗模式</text>
        <text v-else>当前使用{{ themeStore.isDarkMode ? '深色' : '浅色' }}主题</text>
      </view>
    </view>
    
    <!-- 关于应用 -->
    <view class="card about-card">
      <view class="section-title">关于应用</view>
      
      <!-- 版本信息 -->
      <view class="setting-item" @click="goToAbout">
        <view class="setting-label">关于我们</view>
        <view class="setting-value">
          <text>v1.0.0</text>
          <wd-icon name="arrow-right" size="32rpx" class="arrow-icon" />
        </view>
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <view class="logout-button-wrapper">
      <wd-button type="error" size="large" class="logout-button" icon="exit" @click="logout">
        退出登录
      </wd-button>
    </view>
    
    <!-- 版本信息 -->
    <view class="version-info">
      <text>智能考勤 v1.0.0</text>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  padding: 30rpx;
  min-height: 100vh;
  background-color: var(--background-color-primary);
  transition: all 0.3s ease;
}

.card {
  margin-bottom: 30rpx;
  background-color: var(--background-color-primary);
  border-radius: 24rpx;
  padding: 20rpx;
  box-shadow: var(--card-shadow);
  width: 100%;
  box-sizing: border-box;
  backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  padding: 20rpx;
  color: var(--text-color-primary);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 10rpx;
}

/* 用户卡片 */
.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx;
  
  .user-info {
    display: flex;
    align-items: center;
    
    .avatar {
      width: 130rpx;
      height: 130rpx;
      border-radius: 50%;
      margin-right: 30rpx;
      border: 4rpx solid var(--background-color-primary);
      box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
    }
    
    .info {
      .name {
        font-size: 38rpx;
        font-weight: bold;
        margin-bottom: 12rpx;
        display: block;
        color: var(--text-color-primary);
      }
      
      .role {
        font-size: 26rpx;
        color: var(--text-color-secondary);
        background-color: var(--background-color-tertiary);
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
    background-color: var(--background-color-tertiary);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    box-shadow: var(--card-shadow);
    
    &:active {
      transform: scale(0.95);
      background-color: var(--hover-color);
    }
  }
}

/* 设置项和菜单项共有样式 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 20rpx;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
  
  &.disabled {
    opacity: 0.6;
  }
  
  .setting-label {
    font-size: 30rpx;
    color: var(--text-color-primary);
  }
  
  .setting-value {
    display: flex;
    align-items: center;
    color: var(--text-color-secondary);
    font-size: 28rpx;
    
    .arrow-icon {
      margin-left: 10rpx;
    }
  }
}

/* 主题模式提示 */
.setting-tips {
  padding: 20rpx;
  font-size: 24rpx;
  color: var(--text-color-secondary);
  text-align: center;
  background-color: var(--background-color-tertiary);
  border-radius: 8rpx;
  margin: 20rpx;
}

/* 退出登录按钮 */
.logout-button-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 80rpx;
  padding: 0 50rpx;
}

.logout-button {
  width: 100%;
}

/* 版本信息 */
.version-info {
  margin-top: 60rpx;
  text-align: center;
  font-size: 24rpx;
  color: var(--text-color-secondary);
  padding-bottom: 30rpx;
}

/* 暗黑模式覆盖样式 */
.wot-theme-dark {
  .card {
    background-color: var(--background-color-secondary);
    border: 1px solid var(--border-color);
  }
  
  .theme-toggle {
    background-color: var(--background-color-tertiary);
  }
  
  .setting-tips {
    background-color: var(--background-color-secondary);
  }
}

/* 添加浅色模式明确样式 */
.wot-theme-light {
  .card {
    background-color: #ffffff;
    border: 1px solid #e4e7ed;
  }
  
  .theme-toggle {
    background-color: #f5f5f5;
  }
  
  .setting-tips {
    background-color: #f5f5f5;
  }
}
</style>

<route lang="json">
{
  "layout": "tabbar",
  "name": "settings",
  "style": {
    "navigationBarTitleText": "我的"
  }
}
</route> 