import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'uno.css'
import router from './router'
import { initializeWxEnvironment, isWechatMiniProgram, createSafeWorker } from '@/utils/wxUtils'

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
