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
const loading = ref(false)
const attendanceStats = ref({
  totalCount: 0,
  normalCount: 0,
  lateCount: 0,
  absentCount: 0,
  attendanceRate: 0
})

// 计算属性
const isTeacher = computed(() => userStore.role === 'TEACHER')
const isStudent = computed(() => userStore.role === 'STUDENT')
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
  
  // 加载用户数据
  loadUserData()
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

// 加载用户数据
function loadUserData() {
  loading.value = true
  
  // 模拟加载数据
  setTimeout(() => {
    // 这里应该是从服务器获取数据
    attendanceStats.value = {
      totalCount: 25,
      normalCount: 20,
      lateCount: 3,
      absentCount: 2,
      attendanceRate: 92
    }
    
    loading.value = false
  }, 500)
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
  // 小程序环境中不使用document对象
  // 在小程序中可以通过样式类或状态变量控制主题
  // darkMode.value已经绑定到了模板中的class条件
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
        getSafeUni().navigateTo({
          url: '/pages/login/index',
          fail: (err) => {
            console.error('导航到登录页失败:', err)
            // 备选方案
            getSafeUni().redirectTo({
              url: '/pages/login/index'
            })
          }
        })
      }
    }
  })
}

// 前往个人信息编辑页面
function goToProfile() {
  getSafeUni().navigateTo({
    url: '/pages/profile/index'
  })
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
  <!-- @ts-ignore -->
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <!-- 个人信息卡片 -->
    <!-- @ts-ignore -->
    <view class="user-card">
      <!-- @ts-ignore -->
      <view class="user-info">
        <image class="avatar" src="https://picsum.photos/200?random=1" mode="aspectFill" />
        <!-- @ts-ignore -->
        <view class="info">
          <!-- @ts-ignore -->
          <text class="name">{{ userStore.fullName || '未登录' }}</text>
          <!-- @ts-ignore -->
          <text class="role">{{ roleName }}</text>
        </view>
      </view>
      
      <!-- @ts-ignore -->
      <view class="theme-toggle" @click="toggleTheme">
        <wd-icon :name="darkMode ? 'sunny' : 'moon'" size="48rpx" color="#6a11cb" />
      </view>
    </view>
    
    <!-- 考勤统计卡片 -->
    <!-- @ts-ignore -->
    <view class="stats-card">
      <!-- @ts-ignore -->
      <view class="stats-header">
        <!-- @ts-ignore -->
        <text class="stats-title">考勤统计</text>
      </view>
      
      <!-- @ts-ignore -->
      <view class="stats-content">
        <!-- @ts-ignore -->
        <view class="stat-item highlight">
          <!-- @ts-ignore -->
          <text class="stat-value">{{ attendanceStats.attendanceRate }}%</text>
          <!-- @ts-ignore -->
          <text class="stat-label">出勤率</text>
        </view>
        
        <!-- @ts-ignore -->
        <view class="stats-grid">
          <!-- @ts-ignore -->
          <view class="stat-item">
            <!-- @ts-ignore -->
            <text class="stat-value">{{ attendanceStats.totalCount }}</text>
            <!-- @ts-ignore -->
            <text class="stat-label">总次数</text>
          </view>
          
          <!-- @ts-ignore -->
          <view class="stat-item">
            <!-- @ts-ignore -->
            <text class="stat-value">{{ attendanceStats.normalCount }}</text>
            <!-- @ts-ignore -->
            <text class="stat-label">正常</text>
          </view>
          
          <!-- @ts-ignore -->
          <view class="stat-item">
            <!-- @ts-ignore -->
            <text class="stat-value">{{ attendanceStats.lateCount }}</text>
            <!-- @ts-ignore -->
            <text class="stat-label">迟到</text>
          </view>
          
          <!-- @ts-ignore -->
          <view class="stat-item">
            <!-- @ts-ignore -->
            <text class="stat-value">{{ attendanceStats.absentCount }}</text>
            <!-- @ts-ignore -->
            <text class="stat-label">缺勤</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 菜单列表 -->
    <!-- @ts-ignore -->
    <view class="menu-list">
      <!-- @ts-ignore -->
      <view class="menu-item" @click="goToProfile">
        <view class="menu-icon">
          <wd-icon name="person-setting" size="48rpx" />
        </view>
        <!-- @ts-ignore -->
        <text class="menu-text">个人信息</text>
        <wd-icon name="arrow-right" size="36rpx" class="arrow-icon" />
      </view>
      
      <!-- @ts-ignore -->
      <view class="menu-item" @click="goToSettings">
        <view class="menu-icon">
          <wd-icon name="setting" size="48rpx" />
        </view>
        <!-- @ts-ignore -->
        <text class="menu-text">应用设置</text>
        <wd-icon name="arrow-right" size="36rpx" class="arrow-icon" />
      </view>
      
      <!-- @ts-ignore -->
      <view class="menu-item" @click="goToAbout">
        <view class="menu-icon">
          <wd-icon name="info" size="48rpx" />
        </view>
        <!-- @ts-ignore -->
        <text class="menu-text">关于应用</text>
        <wd-icon name="arrow-right" size="36rpx" class="arrow-icon" />
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <!-- @ts-ignore -->
    <view class="logout-button" @click="logout">
      <!-- @ts-ignore -->
      <text>退出登录</text>
    </view>
    
    <!-- 版本信息 -->
    <!-- @ts-ignore -->
    <view class="version-info">
      <!-- @ts-ignore -->
      <text>智能考勤 v1.0.0</text>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  padding: 30rpx;
  box-sizing: border-box;
  color: #333;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &.dark-mode {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #eee;
    
    .user-card, .stats-card, .menu-list, .logout-button {
      background-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.2);
    }
    
    .menu-item, .stats-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    
    .menu-text, .stats-title, .user-name {
      color: #fff;
    }
    
    .arrow-icon, .stat-label, .user-meta text {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .logout-button {
      background-color: rgba(255, 255, 255, 0.1);
      color: #fff;
      
      &:active {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
    
    .version-info {
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

/* 用户卡片 */
.user-card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 700rpx;
  box-sizing: border-box;
  
  .user-info {
    display: flex;
    align-items: center;
    
    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-right: 30rpx;
      flex-shrink: 0;
    }
    
    .info {
      .name {
        font-size: 36rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
        display: block;
      }
      
      .role {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
  
  .theme-toggle {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    
    &:active {
      transform: scale(0.95);
      background-color: rgba(0, 0, 0, 0.1);
    }
  }
}

/* 统计卡片 */
.stats-card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  max-width: 700rpx;
  box-sizing: border-box;
  
  .stats-header {
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
    
    .stats-title {
      font-size: 32rpx;
      font-weight: bold;
      text-align: center;
      display: block;
    }
  }
  
  .stats-content {
    padding: 20rpx;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20rpx 0;
      
      .stat-value {
        font-size: 36rpx;
        font-weight: bold;
        margin-bottom: 8rpx;
      }
      
      .stat-label {
        font-size: 24rpx;
        color: #666;
      }
      
      &.highlight {
        margin-bottom: 20rpx;
        
        .stat-value {
          font-size: 60rpx;
          color: #6a11cb;
        }
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      width: 100%;
    }
  }
}

/* 菜单列表 */
.menu-list {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  max-width: 700rpx;
  box-sizing: border-box;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .menu-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 60rpx;
      margin-right: 20rpx;
      color: #6a11cb;
    }
    
    .menu-text {
      flex: 1;
      font-size: 30rpx;
    }
    
    .arrow-icon {
      color: #999;
    }
  }
}

/* 退出按钮 */
.logout-button {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  text-align: center;
  font-size: 32rpx;
  color: #f56c6c;
  font-weight: bold;
  width: 100%;
  max-width: 700rpx;
  box-sizing: border-box;
  
  &:active {
    background-color: rgba(255, 255, 255, 0.7);
  }
}

/* 版本信息 */
.version-info {
  text-align: center;
  padding: 20rpx 0;
  width: 100%;
  
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
