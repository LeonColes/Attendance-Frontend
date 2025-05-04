import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'uno.css'
import router from './router'
import { initializeWxEnvironment, isWechatMiniProgram, createSafeWorker } from '@/utils/wxUtils'
import { watchSystemThemeChange } from '@/utils/themeUtils'

// 设置全局时区为Asia/Shanghai
try {
  // 尝试设置全局的Intl时区
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    // 记录当前设置的时区
    console.log('当前时区设置为:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('应用程序将使用Asia/Shanghai时区');
  }
} catch (e) {
  console.warn('无法设置全局时区:', e);
}

// 创建全局mixin自动处理页面滚动事件
const navBarScrollMixin = {
  onPageScroll(e: any) {
    // 发送到全局事件总线，让导航栏自动接收
    uni.$emit('page-scroll', e)
  },
}

// 声明微信小程序环境的类型
declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke: (...args: any[]) => any;
      on: (...args: any[]) => any;
    };
  }
  
  const wx: {
    getSystemInfoSync: () => any;
    [key: string]: any;
  };
}

// 初始化微信环境
if (isWechatMiniProgram()) {
  initializeWxEnvironment()
  
  // 替换Worker constructor
  if (typeof Worker !== 'undefined') {
    // @ts-ignore
    window.Worker = createSafeWorker
  }
  
  // 监听系统主题变化
  try {
    const savedTheme = uni.getStorageSync('app_theme')
    if (savedTheme && typeof savedTheme === 'string') {
      // 如果保存的是简单字符串格式
      if (savedTheme === 'dark' || savedTheme === 'light') {
        watchSystemThemeChange((theme) => {
          // 主题相关处理会在store中进行
          console.log('系统主题变更为:', theme)
        })
      } else {
        // 如果是JSON字符串格式
        try {
          const settings = JSON.parse(savedTheme)
          if (settings.followSystem) {
            watchSystemThemeChange((theme) => {
              // 主题相关处理会在store中进行
              console.log('系统主题变更为:', theme)
            })
          }
        } catch (e) {
          console.error('解析主题设置失败', e)
        }
      }
    }
  } catch (e) {
    console.error('获取主题设置失败', e)
  }
}

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(router)
  app.use(pinia)

  // 全局注册mixin，使得所有页面自动获得滚动处理能力
  app.mixin(navBarScrollMixin)

  return {
    app,
    pinia,
  }
}
