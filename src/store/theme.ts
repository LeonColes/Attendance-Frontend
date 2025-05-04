/**
 * 主题状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed, watch, reactive } from 'vue'
import { applyThemeToPage, watchSystemThemeChange } from '@/utils/themeUtils'
import type { ConfigProviderThemeVars } from 'wot-design-uni'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 主题存储键
const THEME_STORAGE_KEY = 'app_theme'

// 判断是否支持深色模式
const hasDarkModeSupport = () => {
  // 微信小程序的情况
  // @ts-ignore
  if (uni.canIUse && uni.canIUse('onThemeChange')) {
    return true
  }
  // 其他平台通过媒体查询判断
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined
  }
  return false
}

// 默认浅色主题变量
const defaultLightThemeVars: Partial<ConfigProviderThemeVars> = {
  colorTheme: '#4f46e5', // 主题色 - 靛蓝色
  colorSuccess: '#10b981', // 成功色 - 翡翠绿
  colorWarning: '#f59e0b', // 警告色 - 琥珀色
  colorDanger: '#ef4444', // 危险色 - 鲜红色
  buttonPrimaryColor: '#ffffff', // 主按钮文字颜色
  buttonPrimaryBgColor: '#4f46e5', // 主按钮背景色
}

// 默认深色主题变量 - 继承浅色主题的基础上进行覆盖
const defaultDarkThemeVars: Partial<ConfigProviderThemeVars> = {
  ...defaultLightThemeVars,
  colorTheme: '#6366f1', // 深色模式下稍亮一些的主题色
}

export const useThemeStore = defineStore('theme', () => {
  // 当前主题模式，默认为light
  const themeMode = ref<'light' | 'dark'>('light')
  
  // 是否为深色模式
  const isDarkMode = computed(() => themeMode.value === 'dark')
  
  // 系统是否支持深色模式
  const supportsDarkMode = ref(hasDarkModeSupport())
  
  // 是否跟随系统主题
  const followSystemTheme = ref(false)
  
  // 当前主题变量
  const themeVars = computed<Partial<ConfigProviderThemeVars>>(() => 
    isDarkMode.value ? defaultDarkThemeVars : defaultLightThemeVars
  )
  
  // 当主题改变时，应用主题到页面
  watch(themeMode, (newTheme) => {
    applyThemeToPage(newTheme)
  })
  
  // 加载主题设置
  function loadThemeSettings() {
    try {
      // 获取保存的主题设置
      const savedSettings = getSafeUni().getStorageSync(THEME_STORAGE_KEY)
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          themeMode.value = settings.theme || 'light'
          followSystemTheme.value = settings.followSystem || false
        } catch (e) {
          // 如果JSON解析失败，尝试作为简单字符串处理
          themeMode.value = savedSettings as 'light' | 'dark'
        }
      } else if (supportsDarkMode.value) {
        // 如果没有保存的设置，但系统支持深色模式，默认跟随系统
        followSystemTheme.value = true
        syncWithSystemTheme()
      }
      
      // 应用当前主题
      updateSystemUITheme()
      
      // 监听系统主题变化
      if (supportsDarkMode.value) {
        watchSystemThemeChange((theme) => {
          if (followSystemTheme.value) {
            themeMode.value = theme
            updateSystemUITheme()
          }
        })
      }
    } catch (e) {
      console.error('加载主题设置失败', e)
    }
  }
  
  // 同步系统主题
  function syncWithSystemTheme() {
    if (!supportsDarkMode.value) return
    
    // 尝试获取系统当前主题
    try {
      getSafeUni().getSystemInfo({
        success: (res) => {
          // @ts-ignore
          if (res.theme) {
            // @ts-ignore
            themeMode.value = res.theme === 'dark' ? 'dark' : 'light'
          }
        }
      })
    } catch (e) {
      console.error('获取系统主题失败', e)
    }
  }
  
  // 切换主题
  function toggleTheme() {
    themeMode.value = themeMode.value === 'light' ? 'dark' : 'light'
    followSystemTheme.value = false // 手动切换时关闭跟随系统
    saveThemeSettings()
    updateSystemUITheme()
  }
  
  // 设置主题
  function setTheme(theme: 'light' | 'dark', followSystem = false) {
    themeMode.value = theme
    followSystemTheme.value = followSystem
    
    if (followSystem && supportsDarkMode.value) {
      syncWithSystemTheme()
    }
    
    saveThemeSettings()
    updateSystemUITheme()
  }
  
  // 保存主题设置
  function saveThemeSettings() {
    try {
      const settings = {
        theme: themeMode.value,
        followSystem: followSystemTheme.value
      }
      getSafeUni().setStorageSync(THEME_STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.error('保存主题设置失败', e)
    }
  }
  
  // 更新系统UI元素的主题
  function updateSystemUITheme() {
    try {
      // 使用工具函数应用主题
      applyThemeToPage(themeMode.value)
    } catch (e) {
      console.error('更新系统UI主题失败', e)
    }
  }
  
  // 切换是否跟随系统主题
  function toggleFollowSystem() {
    followSystemTheme.value = !followSystemTheme.value
    
    if (followSystemTheme.value && supportsDarkMode.value) {
      syncWithSystemTheme()
    }
    
    saveThemeSettings()
    updateSystemUITheme()
  }
  
  return {
    themeMode,
    isDarkMode,
    supportsDarkMode,
    followSystemTheme,
    themeVars,
    loadThemeSettings,
    toggleTheme,
    setTheme,
    updateSystemUITheme,
    toggleFollowSystem
  }
}) 