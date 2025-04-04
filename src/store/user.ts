import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginParams, UserInfo } from '@/api/auth'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { getToken, removeToken, setToken } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>(getToken())
  const isLoggedIn = ref<boolean>(!!token.value)

  /**
   * 登录
   * @param loginParams 登录参数
   */
  async function login(loginParams: LoginParams) {
    try {
      const { data } = await loginApi(loginParams)
      token.value = data.token
      userInfo.value = data.user
      isLoggedIn.value = true

      // 保存token
      setToken(data.token)

      return data
    }
    catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      if (token.value) {
        await logoutApi()
      }
    }
    catch (error) {
      console.error('退出登录失败:', error)
    }
    finally {
      resetUserState()
      uni.showToast({
        title: '退出登录成功',
        icon: 'success',
      })
    }
  }

  /**
   * 重置用户状态
   */
  function resetUserState() {
    userInfo.value = null
    token.value = ''
    isLoggedIn.value = false
    removeToken()
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    login,
    logout,
    resetUserState,
  }
})
