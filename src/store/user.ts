/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, getUserInfo } from '@/api/user'
import type { LoginParams, UserInfo } from '@/api/user'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const token = ref('')
  const userId = ref('')
  const username = ref('')
  const fullName = ref('')
  const role = ref('')
  const userInfo = ref<UserInfo | null>(null)
  
  // 计算属性：是否已登录
  const isLoggedIn = ref(false)
  
  // 登录
  async function loginAction(params: LoginParams) {
    try {
      const response = await login(params)
      
      if (response && response.code === 200) {
        const data = response.data
        
        // 存储令牌和用户信息
        token.value = data.token
        userId.value = data.userId
        username.value = data.username
        fullName.value = data.fullName || data.username
        role.value = data.role
        userInfo.value = data
        
        // 更新登录状态
        isLoggedIn.value = true
        
        // 保存令牌到本地存储
        getSafeUni().setStorageSync('token', data.token)
        
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }
  
  // 获取用户信息
  async function getUserInfoAction() {
    try {
      // 获取存储的令牌
      const savedToken = getSafeUni().getStorageSync('token')
      
      if (!savedToken) {
        clearUserInfo()
        return false
      }
      
      token.value = savedToken
      
      // 请求用户信息
      const response = await getUserInfo()
      
      if (response && response.code === 200) {
        const data = response.data
        
        // 更新用户信息
        userId.value = data.userId
        username.value = data.username
        fullName.value = data.fullName || data.username
        role.value = data.role
        userInfo.value = data
        
        // 更新登录状态
        isLoggedIn.value = true
        
        return true
      } else {
        clearUserInfo()
        return false
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      clearUserInfo()
      return false
    }
  }
  
  // 检查登录状态
  function checkLogin() {
    // 获取存储的令牌
    const savedToken = getSafeUni().getStorageSync('token')
    
    if (!savedToken) {
      clearUserInfo()
      return false
    }
    
    token.value = savedToken
    isLoggedIn.value = true
    
    return true
  }
  
  // 登出
  function logout() {
    clearUserInfo()
    clearToken()
    
    // 跳转到登录页
    getSafeUni().reLaunch({
      url: '/pages/login/index'
    })
  }
  
  // 清除用户信息
  function clearUserInfo() {
    token.value = ''
    userId.value = ''
    username.value = ''
    fullName.value = ''
    role.value = ''
    userInfo.value = null
    isLoggedIn.value = false
  }
  
  // 清除令牌
  function clearToken() {
    getSafeUni().removeStorageSync('token')
  }
  
  return {
    token,
    userId,
    username,
    fullName,
    role,
    userInfo,
    isLoggedIn,
    login: loginAction,
    getUserInfo: getUserInfoAction,
    checkLogin,
    logout,
    clearUserInfo,
    clearToken
  }
})
