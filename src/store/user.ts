import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, type LoginParams, type LoginResponseData, type BaseResponse } from '@/api/auth'
import { setToken, getToken, removeToken } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  // 用户信息状态
  const token = ref<string>('')
  const userId = ref<string>('')
  const username = ref<string>('')
  const fullName = ref<string>('')
  const role = ref<string>('')
  const isLoggedIn = ref<boolean>(false)

  /**
   * 设置用户登录状态
   */
  function setLoginState(data: LoginResponseData) {
    token.value = data.accessToken
    userId.value = data.userId
    username.value = data.username
    fullName.value = data.fullName
    role.value = data.role
    isLoggedIn.value = true

    // 存储到本地存储，使用与请求模块相同的键名
    setToken(data.accessToken) // 使用accessToken而非token
    uni.setStorageSync('user_info', {
      userId: data.userId,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
    })
  }

  /**
   * 登录操作
   */
  async function loginAction(params: LoginParams) {
    try {
      const response = await login(params)
      if (response && response.data) {
        setLoginState(response.data)
        return response.data
      }
      throw new Error('登录失败：未获取到用户数据')
    } 
    catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  /**
   * 恢复登录状态
   */
  function restoreLoginState() {
    const storedToken = getToken() // 使用request模块的getToken函数
    const storedUserInfo = uni.getStorageSync('user_info')
    
    if (storedToken && storedUserInfo) {
      token.value = storedToken
      userId.value = storedUserInfo.userId
      username.value = storedUserInfo.username
      fullName.value = storedUserInfo.fullName
      role.value = storedUserInfo.role
      isLoggedIn.value = true
      return true
    }
    
    return false
  }

  /**
   * 登出操作
   */
  function logout() {
    // 清除内存中的状态
    token.value = ''
    userId.value = ''
    username.value = ''
    fullName.value = ''
    role.value = ''
    isLoggedIn.value = false

    // 清除存储
    removeToken() // 使用request模块的removeToken函数
    uni.removeStorageSync('user_info')

    // 返回登录页
    uni.reLaunch({
      url: '/pages/login/index'
    })
  }

  /**
   * 检查用户是否已登录
   */
  function checkLogin(): boolean {
    // 如果内存中没有登录状态，尝试从本地存储恢复
    if (!isLoggedIn.value) {
      return restoreLoginState()
    }
    return isLoggedIn.value
  }

  /**
   * 获取用户角色
   */
  function getUserRole(): string {
    if (!isLoggedIn.value) {
      restoreLoginState()
    }
    return role.value
  }

  return {
    // 状态
    token,
    userId,
    username,
    fullName,
    role,
    isLoggedIn,
    
    // 方法
    login: loginAction,
    logout,
    checkLogin,
    getUserRole,
    restoreLoginState,
  }
})
