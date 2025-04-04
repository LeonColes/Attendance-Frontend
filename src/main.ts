import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'uno.css'
import router from './router'

// 创建全局mixin自动处理页面滚动事件
const navBarScrollMixin = {
  onPageScroll(e: any) {
    // 发送到全局事件总线，让导航栏自动接收
    uni.$emit('page-scroll', e)
  },
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
