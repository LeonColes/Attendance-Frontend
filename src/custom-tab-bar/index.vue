<!--
 * @Author: weisheng
 * @Date: 2025-04-07 13:15:00
 * @LastEditTime: 2025-04-07 13:15:00
 * @LastEditors: weisheng
 * @Description: 自定义底部导航栏
 * @FilePath: \wot-demo\src\custom-tab-bar\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'

// 安全获取uni对象  
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

const active = ref(0)
const tabBar = [
  {
    pagePath: '/pages/index',
    iconPath: '/static/tab-home.png',
    selectedIconPath: '/static/tab-home-active.png',
    text: '首页',
    icon: 'home'
  },
  {
    pagePath: '/pages/my/index',
    iconPath: '/static/tab-my.png',
    selectedIconPath: '/static/tab-my-active.png',
    text: '我的',
    icon: 'user'
  }
]

// 同步当前页面路径
function syncActivePage() {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const route = `/${currentPage.route}`
    
    tabBar.forEach((item, index) => {
      if (item.pagePath === route) {
        active.value = index
      }
    })
  }
}

// 切换tab页面
function switchTab(index: number) {
  if (active.value === index) return
  
  active.value = index
  getSafeUni().switchTab({
    url: tabBar[index].pagePath
  })
}

onMounted(() => {
  syncActivePage()
})
</script>

<template>
  <view class="custom-tab-bar">
    <view 
      v-for="(item, index) in tabBar" 
      :key="index" 
      class="tab-item" 
      :class="{ active: active === index }"
      @click="switchTab(index)"
    >
      <wd-icon :name="item.icon" size="48rpx" :color="active === index ? '#6a11cb' : '#999'" />
      <text :class="{ 'active-text': active === index }">{{ item.text }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background-color: #ffffff;
  display: flex;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 10rpx;
  
  text {
    font-size: 24rpx;
    color: #999;
    margin-top: 6rpx;
  }
  
  .active-text {
    color: #6a11cb;
  }
}
</style> 