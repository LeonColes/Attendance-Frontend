/**
 * 主题工具函数
 */
import themeConfig from '@/theme.json'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 缓存上次应用的主题设置
const themeCache = {
  currentTheme: '',
  navTextStyle: '',
  navBgColor: '',
  lastApplyTime: 0,
  preloadedMode: ''
}

/**
 * 预加载主题，但不立即应用
 * 用于页面切换前准备主题设置
 * @param mode 主题模式
 */
export function preloadTheme(mode: 'light' | 'dark') {
  themeCache.preloadedMode = mode
  console.log(`预加载${mode}主题设置`)
  
  // 预先加载主题资源，但不立即应用，减少切换时的闪烁
  const themeValues = themeConfig[mode]
  
  // 预加载导航栏颜色
  const frontColor = themeValues.navTxtStyle === 'white' ? '#ffffff' : '#000000'
  themeCache.navTextStyle = frontColor
  themeCache.navBgColor = themeValues.navBgColor
}

/**
 * 将主题配置应用到CSS变量
 * @param mode 主题模式 'light' | 'dark'
 */
export function applyThemeToPage(mode: 'light' | 'dark') {
  console.log(`应用${mode}主题到页面`)
  
  // 获取主题配置
  const themeValues = themeConfig[mode]
  
  // 防抖控制 - 避免短时间内多次应用主题导致闪烁
  const now = Date.now()
  if (themeCache.currentTheme === mode && now - themeCache.lastApplyTime < 1000) { // 增加到1000ms
    console.log('主题应用过于频繁，跳过本次更新')
    return
  }
  
  // 更新缓存时间
  themeCache.lastApplyTime = now
  themeCache.currentTheme = mode
  
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
  
  // 设置导航栏 - 仅当颜色发生变化时才设置，避免闪烁
  const frontColor = themeValues.navTxtStyle === 'white' ? '#ffffff' : '#000000'
  if (themeCache.navTextStyle !== frontColor || themeCache.navBgColor !== themeValues.navBgColor) {
    themeCache.navTextStyle = frontColor
    themeCache.navBgColor = themeValues.navBgColor
    
    try {
      getSafeUni().setNavigationBarColor({
        frontColor: frontColor,
        backgroundColor: themeValues.navBgColor,
        animation: {
          duration: 50,  // 进一步减少动画时间避免抖动
          timingFunc: 'easeIn'
        }
      })
    } catch (e) {
      console.error('设置导航栏样式失败', e)
    }
  }
  
  // 设置TabBar - 增强检测逻辑
  try {
    // 检查是否为TabBar页面 - 多种方法综合判断
    let isTabBarPage = false;
    
    // 方法1: 通过路径判断
    let currentPath = '';
    try {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        // @ts-ignore
        currentPath = (currentPage.route || '').toLowerCase();
        // 直接检查常见TabBar页面路径
        isTabBarPage = currentPath.includes('pages/index') || 
                       currentPath.includes('pages/settings');
      }
    } catch (e) {
      console.error('获取当前页面路径失败', e);
    }
    
    // 方法2: 通过页面配置判断
    if (!isTabBarPage) {
      try {
        const curPage = getCurrentPages().pop();
        if (curPage) {
          // @ts-ignore - 检查页面的$page或route对象中是否有tabBar相关配置
          const pageConfig = curPage.$page || curPage.$vm?.$options || {};
          
          // 检查是否有layout='tabbar'标记
          // @ts-ignore
          isTabBarPage = isTabBarPage || 
                         pageConfig.layout === 'tabbar' || 
                         pageConfig.$vm?.$options?.layout === 'tabbar';
        }
      } catch (e) {
        console.error('检查页面tabBar配置失败', e);
      }
    }
    
    // 方法3: 通过route配置判断
    if (!isTabBarPage) {
      try {
        const curPage = getCurrentPages().pop();
        // @ts-ignore
        if (curPage && curPage.route) {
          // 在pages.json中定义的tabBar页面
          const tabBarPages = ['/pages/index', '/pages/settings/index'];
          // @ts-ignore
          isTabBarPage = tabBarPages.some(page => curPage.route.includes(page));
        }
      } catch (e) {
        console.error('通过route检查tabBar配置失败', e);
      }
    }
    
    // 只在TabBar页面设置TabBar样式
    if (isTabBarPage) {
      try {
        getSafeUni().setTabBarStyle({
          color: themeValues.tabFontColor,
          selectedColor: themeValues.tabSelectedColor,
          backgroundColor: themeValues.tabBgColor,
          borderStyle: themeValues.tabBorderStyle
        });
        console.log('成功设置TabBar样式');
      } catch (e) {
        console.error('设置TabBar样式失败', e);
      }
    } else {
      console.log('当前不是TabBar页面，跳过setTabBarStyle调用');
    }
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
  
  // 清除预加载标记
  themeCache.preloadedMode = ''
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
      // 预加载主题设置
      preloadTheme(themeMode)
      
      // 监听页面显示事件 - 使用更长延迟
      // @ts-ignore
      const onPageShow = () => {
        console.log('页面显示，应用当前主题')
        // 延迟应用主题，等待页面完成动画
        setTimeout(() => {
          applyThemeToPage(themeMode)
        }, 500) // 增加延迟时间
      }
      
      // 监听页面切换事件
      try {
        // @ts-ignore - uni-app类型定义不完整
        if (uni.onAppRoute) {
          // @ts-ignore
          uni.onAppRoute((route) => {
            console.log('页面路由切换:', route)
            // 预加载主题
            preloadTheme(themeMode)
            
            // 显著增加延迟时间，确保页面动画完全结束后再应用主题
            setTimeout(() => {
              console.log('页面切换动画完成，应用主题')
              applyThemeToPage(themeMode)
            }, 600) // 增加延迟时间避免抖动
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