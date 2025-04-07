/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, getUserInfo } from '@/api/user'
import type { LoginParams, UserInfo, AuthResponse } from '@/api/user'
import { setToken, removeToken } from '@/utils/request'

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
        token.value = data.accessToken || ''
        userId.value = data.userId
        username.value = data.username
        fullName.value = data.fullName || data.username
        role.value = data.role
        userInfo.value = {
          userId: data.userId,
          username: data.username,
          fullName: data.fullName || data.username,
          role: data.role
        }
        
        // 更新登录状态
        isLoggedIn.value = true
        
        // 保存令牌到本地存储
        setToken(data)
        
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
      // 尝试从localStorage获取用户信息
      const savedUserInfo = getSafeUni().getStorageSync('userInfo')
      
      if (savedUserInfo) {
        try {
          const userInfoData = JSON.parse(savedUserInfo)
          // 更新用户信息
          userId.value = userInfoData.userId
          username.value = userInfoData.username
          fullName.value = userInfoData.fullName || userInfoData.username
          role.value = userInfoData.role
          userInfo.value = userInfoData
          
          // 更新登录状态
          isLoggedIn.value = true
          
          return true
        } catch (e) {
          console.error('解析用户信息失败:', e)
        }
      }
      
      // 如果没有缓存或解析失败，则请求用户信息
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
        
        // 保存用户信息到本地存储
        getSafeUni().setStorageSync('userInfo', JSON.stringify(data))
        
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
    // 获取存储的用户信息
    const savedUserInfo = getSafeUni().getStorageSync('userInfo')
    
    if (savedUserInfo) {
      try {
        const userInfoData = JSON.parse(savedUserInfo)
        // 更新用户信息
        userId.value = userInfoData.userId
        username.value = userInfoData.username
        fullName.value = userInfoData.fullName || userInfoData.username
        role.value = userInfoData.role
        userInfo.value = userInfoData
        
        // 更新登录状态
        isLoggedIn.value = true
        
        return true
      } catch (e) {
        console.error('解析用户信息失败:', e)
        clearUserInfo()
        return false
      }
    }
    
    clearUserInfo()
    return false
  }
  
  // 登出
  function logout() {
    clearUserInfo()
    removeToken()
    getSafeUni().removeStorageSync('userInfo')
    
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
    clearUserInfo
  }
})
