import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'uno.css'
import router from './router'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(router)
  app.use(pinia)

  return {
    app,
    pinia,
  }
}
