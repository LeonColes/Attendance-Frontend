/**
 * 主题工具函数
 */
import themeConfig from '@/theme.json'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

/**
 * 将主题配置应用到CSS变量
 * @param mode 主题模式 'light' | 'dark'
 */
export function applyThemeToPage(mode: 'light' | 'dark') {
  console.log(`应用${mode}主题到页面`)
  
  // 获取主题配置
  const themeValues = themeConfig[mode]
  
  // 全局设置主题（微信小程序专用API）
  try {
    // @ts-ignore
    if (wx && wx.setTheme) {
      // @ts-ignore
      wx.setTheme({
        theme: mode,
        success: () => {
          console.log(`设置全局主题为${mode}成功`)
        },
        fail: (err) => {
          console.error(`设置全局主题为${mode}失败`, err)
        }
      })
    }
  } catch (e) {
    console.error('设置全局主题失败', e)
  }
  
  // 设置页面样式 - 微信小程序专用API
  // @ts-ignore - uni-app类型定义不完整，但API确实存在于微信小程序环境
  if (uni.canIUse && uni.canIUse('setPageStyle')) {
    try {
      // @ts-ignore
      uni.setPageStyle({
        style: {
          backgroundColor: themeValues.bgColor,
          backgroundColorTop: themeValues.bgColorTop,
          backgroundColorBottom: themeValues.bgColorBottom,
          textStyle: themeValues.bgTxtStyle
        }
      })
    } catch (e) {
      console.error('设置页面样式失败', e)
    }
  }
  
  // 设置导航栏
  try {
    getSafeUni().setNavigationBarColor({
      frontColor: themeValues.navTxtStyle === 'white' ? '#ffffff' : '#000000',
      backgroundColor: themeValues.navBgColor,
      animation: {
        duration: 300,
        timingFunc: 'easeIn'
      }
    })
  } catch (e) {
    console.error('设置导航栏样式失败', e)
  }
  
  // 设置TabBar
  try {
    getSafeUni().setTabBarStyle({
      color: themeValues.tabFontColor,
      selectedColor: themeValues.tabSelectedColor,
      backgroundColor: themeValues.tabBgColor,
      borderStyle: themeValues.tabBorderStyle
    })
  } catch (e) {
    console.error('设置TabBar样式失败', e)
  }
  
  // 更新主题样式变量
  if (mode === 'dark') {
    applyDarkMode()
  } else {
    applyLightMode()
  }
  
  // 设置CSS变量到每个页面的根元素
  applyThemeCSSVariables(mode)
}

/**
 * 应用暗黑模式样式
 */
function applyDarkMode() {
  // 在微信小程序环境中
  // @ts-ignore
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    try {
      // 使用微信小程序setPageMeta API
      // @ts-ignore
      if (wx.canIUse && wx.canIUse('setPageMeta')) {
        // @ts-ignore
        wx.setPageMeta({
          pageStyle: 'page { --theme-mode: dark; background-color: #121212; color: #e5eaf3; }'
        })
      }
      
      // 备用方法 - 通过页面样式属性设置
      // @ts-ignore
      if (uni.canIUse && uni.canIUse('setPageMeta')) {
        // @ts-ignore
        uni.setPageMeta({
          pageStyle: 'page { --theme-mode: dark; background-color: #121212; color: #e5eaf3; }'
        })
      }
    } catch (e) {
      console.error('应用dark模式失败', e)
    }
  }
  
  // 在H5环境中
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark')
  }
}

/**
 * 应用浅色模式样式
 */
function applyLightMode() {
  // 在微信小程序环境中
  // @ts-ignore
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    try {
      // 使用微信小程序setPageMeta API
      // @ts-ignore
      if (wx.canIUse && wx.canIUse('setPageMeta')) {
        // @ts-ignore
        wx.setPageMeta({
          pageStyle: 'page { --theme-mode: light; background-color: #ffffff; color: #303133; }'
        })
      }
      
      // 备用方法 - 通过页面样式属性设置
      // @ts-ignore
      if (uni.canIUse && uni.canIUse('setPageMeta')) {
        // @ts-ignore
        uni.setPageMeta({
          pageStyle: 'page { --theme-mode: light; background-color: #ffffff; color: #303133; }'
        })
      }
    } catch (e) {
      console.error('应用light模式失败', e)
    }
  }
  
  // 在H5环境中
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * 获取CSS变量映射对象
 * @param mode 主题模式 'light' | 'dark'
 */
export function getThemeCSSVariables(mode: 'light' | 'dark') {
  const themeValues = themeConfig[mode]
  
  return {
    '--theme-bg-color': themeValues.bgColor,
    '--theme-bg-color-top': themeValues.bgColorTop,
    '--theme-bg-color-bottom': themeValues.bgColorBottom,
    '--theme-nav-bg-color': themeValues.navBgColor,
    '--theme-tab-bg-color': themeValues.tabBgColor,
    '--theme-tab-selected-color': themeValues.tabSelectedColor,
    '--theme-tab-font-color': themeValues.tabFontColor,
    '--text-color-primary': mode === 'dark' ? '#e5eaf3' : '#303133',
    '--text-color-secondary': mode === 'dark' ? '#a3a6ad' : '#606266',
    '--text-color-tertiary': mode === 'dark' ? '#808286' : '#909399',
    '--background-color-primary': mode === 'dark' ? '#121212' : '#ffffff',
    '--background-color-secondary': mode === 'dark' ? '#1e1e1e' : '#f9f9f9',
    '--background-color-tertiary': mode === 'dark' ? '#2c2c2c' : '#f5f5f5',
    '--border-color': mode === 'dark' ? '#3e3e3e' : '#e4e7ed',
    '--divider-color': mode === 'dark' ? '#4e4e4e' : '#dcdfe6'
  }
}

/**
 * 将CSS变量应用到页面根元素
 */
function applyThemeCSSVariables(mode: 'light' | 'dark') {
  const variables = getThemeCSSVariables(mode)
  
  // 在微信小程序环境中
  try {
    // @ts-ignore
    if (wx && wx.canIUse && wx.canIUse('setPageMeta')) {
      let cssText = 'page {'
      
      // 遍历CSS变量并构建样式字符串
      Object.entries(variables).forEach(([key, value]) => {
        cssText += `${key}: ${value}; `
      })
      
      cssText += '}'
      
      // @ts-ignore
      wx.setPageMeta({
        pageStyle: cssText
      })
    }
  } catch (e) {
    console.error('应用CSS变量失败', e)
  }
  
  // 在H5环境中
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    
    // 遍历CSS变量并应用到:root
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }
}

/**
 * 监听系统主题变化
 * @param callback 回调函数
 */
export function watchSystemThemeChange(callback: (theme: 'light' | 'dark') => void) {
  // @ts-ignore - uni-app类型定义不完整，但API确实存在于微信小程序环境
  if (uni.canIUse && uni.canIUse('onThemeChange')) {
    // @ts-ignore
    uni.onThemeChange(({ theme }) => {
      callback(theme === 'dark' ? 'dark' : 'light')
    })
  }
}

/**
 * 监听页面切换，确保在Tab页面之间切换时保持主题一致
 * @param themeMode 当前主题模式
 */
export function setupPageChangeListener(themeMode: 'light' | 'dark') {
  // 在微信小程序环境中
  // @ts-ignore
  if (typeof wx !== 'undefined') {
    try {
      // 监听页面显示事件
      // @ts-ignore
      const onPageShow = () => {
        console.log('页面显示，应用当前主题')
        applyThemeToPage(themeMode)
      }
      
      // 监听页面切换事件
      try {
        // @ts-ignore - uni-app类型定义不完整
        if (uni.onAppRoute) {
          // @ts-ignore
          uni.onAppRoute((route) => {
            console.log('页面路由切换:', route)
            setTimeout(() => {
              applyThemeToPage(themeMode)
            }, 50) // 短暂延迟确保页面准备就绪
          })
        } else {
          console.log('onAppRoute API不可用，无法监听页面路由切换')
        }
      } catch (e) {
        console.error('设置路由监听失败', e)
      }
      
      // 获取当前页面
      const pages = getCurrentPages()
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        // @ts-ignore
        if (currentPage.onShow) {
          // @ts-ignore
          const originalOnShow = currentPage.onShow
          // @ts-ignore
          currentPage.onShow = function() {
            originalOnShow.call(this)
            onPageShow()
          }
        } else {
          // @ts-ignore
          currentPage.onShow = onPageShow
        }
      }
    } catch (e) {
      console.error('设置页面切换监听失败', e)
    }
  }
} 