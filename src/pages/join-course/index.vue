<!--
 * @Author: weisheng
 * @Date: 2025-04-12 14:00:00
 * @LastEditTime: 2025-04-12 14:00:00
 * @LastEditors: weisheng
 * @Description: 加入课程页面
 * @FilePath: \wot-demo\src\pages\join-course\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'
import { joinCourse } from '@/api/courses'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

const userStore = useUserStore()
const themeStore = useThemeStore()
const loading = ref(false)
const courseCode = ref('')
const formData = ref({
  courseCode: ''
})

// 获取URL参数
onMounted(() => {
  // 获取页面传参
  const query = getSafeUni().getLaunchOptionsSync().query
  if (query && query.code) {
    formData.value.courseCode = query.code
    courseCode.value = query.code
  }
})

// 每次页面显示时应用当前主题
onShow(() => {
  themeStore.updateSystemUITheme()
})

// 表单验证规则
const rules = {
  courseCode: [
    { required: true, message: '请输入课程邀请码' },
    { pattern: /^[A-Za-z0-9]{6,10}$/, message: '课程码格式不正确' }
  ]
}

// 加入课程
async function handleJoin() {
  try {
    if (!formData.value.courseCode.trim()) {
      getSafeUni().showToast({
        title: '请输入课程邀请码',
        icon: 'none'
      })
      return
    }
    
    loading.value = true
    const response = await joinCourse(formData.value.courseCode)
    
    if (response && response.code === 200) {
      getSafeUni().showToast({
        title: '成功加入课程',
        icon: 'success'
      })
      
      // 延迟返回首页 - 改用navigateBack避免switchTab超时问题
      setTimeout(() => {
        getSafeUni().navigateBack()
      }, 1500)
    } else {
      getSafeUni().showToast({
        title: response.message || '加入课程失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('加入课程失败', error)
    getSafeUni().showToast({
      title: '加入课程失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 打开扫码页面
function handleScan() {
  // 显示加载提示
  getSafeUni().showLoading({
    title: '正在启动扫码...'
  })
  
  getSafeUni().scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success: (res) => {
      getSafeUni().hideLoading()
      try {
        console.log('扫码结果:', res.result)
        // 提示用户扫码成功
        getSafeUni().showToast({
          title: '扫码成功',
          icon: 'success',
          duration: 1000
        })
        
        // 处理扫码结果
        const code = extractCourseCodeFromQR(res.result)
        if (code) {
          formData.value.courseCode = code
          courseCode.value = code
          
          // 显示加入中提示
          getSafeUni().showLoading({
            title: '正在加入课程...'
          })
          
          // 自动加入课程
          setTimeout(() => {
            handleJoin()
          }, 800)
        } else {
          getSafeUni().showToast({
            title: '无效的课程二维码',
            icon: 'none'
          })
        }
      } catch (e) {
        console.error('处理扫码结果失败', e)
        getSafeUni().showToast({
          title: '二维码解析失败',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      getSafeUni().hideLoading()
      console.error('扫码失败', err)
      getSafeUni().showToast({
        title: '扫码取消或失败',
        icon: 'none'
      })
    },
    complete: () => {
      // 确保加载提示被关闭
      getSafeUni().hideLoading()
    }
  })
}

// 从二维码提取课程码
function extractCourseCodeFromQR(qrContent: string): string {
  try {
    // 支持多种格式的二维码
    if (qrContent.includes('course=')) {
      // URL格式 例如：https://example.com/join?course=ABC123
      const regex = /course=([A-Za-z0-9]+)/
      const match = qrContent.match(regex)
      return match ? match[1] : ''
    } else if (qrContent.includes('code=')) {
      // URL格式 例如：http://localhost:8080/api/courses/members/join?code=MYHU7J
      const regex = /code=([A-Za-z0-9]+)/
      const match = qrContent.match(regex)
      return match ? match[1] : ''
    } else if (/^[A-Za-z0-9]{6,10}$/.test(qrContent)) {
      // 纯文本格式 例如：ABC123
      return qrContent
    } else {
      // 尝试解析JSON
      try {
        const data = JSON.parse(qrContent)
        return data.course || data.courseCode || data.code || ''
      } catch {
        return ''
      }
    }
  } catch (e) {
    console.error('提取课程码失败', e)
    return ''
  }
}

// 返回上一页
function goBack() {
  getSafeUni().navigateBack()
}
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container" :class="{'dark-container': themeStore.isDarkMode}">
    <!-- 导航栏 -->
    <!-- @ts-ignore -->
    <view class="navbar" :class="{'dark-navbar': themeStore.isDarkMode}">
      <!-- @ts-ignore -->
      <view class="back-icon" @click="goBack">
        <wd-icon name="arrow-left" size="36rpx" :color="themeStore.isDarkMode ? '#ffffff' : '#6a11cb'" />
      </view>
      <!-- @ts-ignore -->
      <view class="navbar-title">加入课程</view>
      <!-- @ts-ignore -->
      <view class="placeholder"></view>
    </view>
    
    <!-- 表单区域 -->
    <!-- @ts-ignore -->
    <view class="form-container" :class="{'dark-form': themeStore.isDarkMode}">
      <!-- 头部图片 -->
      <!-- @ts-ignore -->
      <view class="header-image">
        <image src="/static/images/join-course.png" mode="aspectFit" />
      </view>
      
      <!-- 表单标题 -->
      <!-- @ts-ignore -->
      <view class="form-title">
        <!-- @ts-ignore -->
        <text class="title">输入邀请码，加入课程</text>
        <!-- @ts-ignore -->
        <text class="subtitle">请输入6-10位课程邀请码</text>
      </view>
      
      <!-- 表单内容 -->
      <wd-form :rules="rules" label-width="0">
        <!-- 课程码输入 -->
        <wd-form-item prop="courseCode">
          <!-- @ts-ignore -->
          <view class="input-container" :class="{'dark-input': themeStore.isDarkMode}">
            <wd-input
              v-model="formData.courseCode"
              placeholder="请输入课程邀请码"
              placeholder-class="placeholder"
              clearable
              :custom-style="{ padding: '28rpx 24rpx' }"
            />
          </view>
        </wd-form-item>
        
        <!-- 扫码按钮单独一行 -->
        <wd-button
          block
          type="info"
          custom-style="margin-top: 20rpx; margin-bottom: 20rpx;"
          @click="handleScan"
        >
          <view class="scan-button-content">
            <wd-icon name="scan" size="36rpx" color="#ffffff" custom-style="margin-right: 10rpx;" />
            扫码加入课程
          </view>
        </wd-button>
        
        <!-- 加入按钮 -->
        <wd-button
          block
          type="primary"
          :loading="loading"
          custom-style="margin-top: 20rpx;"
          @click="handleJoin"
        >
          加入课程
        </wd-button>
      </wd-form>
      
      <!-- 提示信息 -->
      <!-- @ts-ignore -->
      <view class="tips-container">
        <!-- @ts-ignore -->
        <text class="tips-title">如何获取课程邀请码?</text>
        <!-- @ts-ignore -->
        <view class="tips-item">
          <wd-icon name="checked" size="32rpx" color="#ff6b00" />
          <!-- @ts-ignore -->
          <text>向课程老师获取邀请码</text>
        </view>
        <!-- @ts-ignore -->
        <view class="tips-item">
          <wd-icon name="checked" size="32rpx" color="#ff6b00" />
          <!-- @ts-ignore -->
          <text>扫描课程二维码</text>
        </view>
        <!-- @ts-ignore -->
        <view class="tips-item">
          <wd-icon name="checked" size="32rpx" color="#ff6b00" />
          <!-- @ts-ignore -->
          <text>从班级群获取邀请链接</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: var(--background-color-primary);
  position: relative;
  transition: all 0.3s ease;
}

.dark-container {
  background-color: var(--background-color-primary);
}

/* 自定义导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 90rpx;
  padding: 0 30rpx;
  background-color: var(--background-color-primary);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  
  .navbar-title {
    font-size: 36rpx;
    font-weight: bold;
    color: var(--text-color-primary);
  }
  
  .back-icon {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder {
    width: 60rpx;
  }
}

.dark-navbar {
  background-color: var(--background-color-primary);
  border-bottom: 1px solid var(--border-color);
  
  .navbar-title {
    color: var(--text-color-primary);
  }
}

/* 表单容器 */
.form-container {
  padding: 40rpx 30rpx;
  background-color: var(--background-color-primary);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin: 20rpx;
  transition: all 0.3s ease;
}

.dark-form {
  background-color: var(--background-color-secondary);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
}

/* 头部图片 */
.header-image {
  text-align: center;
  margin-bottom: 40rpx;
  
  image {
    width: 300rpx;
    height: 300rpx;
  }
}

/* 表单标题 */
.form-title {
  text-align: center;
  margin-bottom: 40rpx;
  
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: var(--text-color-primary);
    display: block;
    margin-bottom: 12rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: var(--text-color-secondary);
  }
}

/* 输入框容器 */
.input-container {
  background-color: var(--background-color-tertiary);
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.dark-input {
  background-color: var(--background-color-tertiary);
}

/* 扫码按钮内容 */
.scan-button-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 占位符样式 */
.placeholder {
  color: var(--text-color-tertiary);
}

/* 提示区域 */
.tips-container {
  margin-top: 80rpx;
  
  .tips-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .tips-item {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    text {
      font-size: 26rpx;
      color: #666;
      margin-left: 12rpx;
    }
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "加入课程"
  }
}
</route> 