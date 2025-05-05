<!--
 * @Author: weisheng
 * @Date: 2025-04-06 10:00:00
 * @LastEditTime: 2025-04-13 14:30:00
 * @LastEditors: weisheng
 * @Description: 应用主入口
 * @FilePath: \wot-demo\src\App.vue
 * 记得注释
-->
<script lang="ts" setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store/theme'
import { ref, watch, computed } from 'vue'
import { setupPageChangeListener } from '@/utils/themeUtils'

const themeStore = useThemeStore()
const isAppReady = ref(false)

// 计算WOT主题模式
const wotTheme = computed(() => themeStore.isDarkMode ? 'dark' : 'light')

// 计算WOT主题变量
const themeVars = computed(() => {
  // 橙色系主题
  return {
    colorTheme: '#ff6b00', // 主题色
    colorSuccess: '#67c23a', // 成功色
    colorWarning: '#e6a23c', // 警告色
    colorDanger: '#f56c6c', // 危险色
    buttonPrimaryBgColor: '#ff6b00', // 主按钮背景色
    buttonDangerBgColor: '#f56c6c', // 危险按钮背景色
    iconDefaultSize: '32px', // 默认图标大小
    switchOnColor: '#ff6b00', // 开关打开颜色
    switchOnDisabledColor: '#ffbd80', // 开关打开禁用颜色
    // 其他WOT Design Uni支持的变量可以在这里添加
  }
})

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 当主题变化时，设置页面切换监听
watch(() => themeStore.themeMode, (newTheme) => {
  if (isAppReady.value) {
    console.log('主题变更为:', newTheme)
    // 设置页面切换监听，确保各页面保持主题一致
    setupPageChangeListener(newTheme)
  }
})

onLaunch(() => {
  console.log('App Launch')
  
  // 加载并应用主题设置
  try {
    themeStore.loadThemeSettings()
    
    // 如果支持深色模式，检查系统主题
    if (themeStore.supportsDarkMode && themeStore.followSystemTheme) {
      // 尝试获取系统主题
      getSafeUni().getSystemInfo({
        success: (res) => {
          // @ts-ignore
          const systemTheme = res.theme || 'light'
          
          if (systemTheme === 'dark' && !themeStore.isDarkMode) {
            themeStore.setTheme('dark', true)
          } else if (systemTheme === 'light' && themeStore.isDarkMode) {
            themeStore.setTheme('light', true)
          }
        }
      })
    }
    
    // 应用当前主题到UI
    themeStore.updateSystemUITheme()
    
    // 设置页面切换监听，确保各页面保持主题一致
    setupPageChangeListener(themeStore.themeMode)
    
    isAppReady.value = true
  } catch (e) {
    console.error('主题初始化失败', e)
  }
})

onShow(() => {
  console.log('App Show')
  
  // App显示时重新应用主题，确保一致性
  if (isAppReady.value) {
    themeStore.updateSystemUITheme()
  }
})

onHide(() => {
  console.log('App Hide')
})
</script>

<template>
  <wd-config-provider :theme="wotTheme" :theme-vars="themeStore.themeVars">
    <view :class="{'dark-theme': themeStore.isDarkMode}">
      <router-view />
    </view>
  </wd-config-provider>
</template>

<style lang="scss">
@import './uni.scss';
@import './styles/theme.scss';

/* 全局样式 */
page {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text-color-primary);
  background-color: var(--background-color-secondary);
  transition: background-color 0.3s, color 0.3s;
}

/* 修复默认头像路径 - 微信小程序环境中直接设置占位背景色，不使用背景图 */
image[src="/static/default-avatar.png"] {
  background-color: #FF8800;
  border-radius: 50%;
}

/* 去掉所有元素的默认外边距 */
view, text, navigator, button, image {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 超出文本省略号 */
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 多行文本省略号 */
.multi-ellipsis-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* WOT暗黑模式支持类 */
.wot-theme-dark {
  background-color: #121212 !important;
  color: #e5eaf3 !important;
}
</style>
