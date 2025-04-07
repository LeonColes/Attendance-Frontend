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
import { useUserStore } from '@/store/user'
import { joinCourse } from '@/api/course'
import type { FormItemRule } from 'wot-design-uni'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

const userStore = useUserStore()
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

// 表单验证规则
const rules = {
  courseCode: [
    { required: true, message: '请输入课程邀请码' },
    { pattern: /^[A-Za-z0-9]{6,10}$/, message: '课程码格式不正确' }
  ] as FormItemRule[]
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
    const response = await joinCourse({ code: formData.value.courseCode })
    
    if (response && response.code === 200) {
      getSafeUni().showToast({
        title: '成功加入课程',
        icon: 'success'
      })
      
      // 延迟返回首页
      setTimeout(() => {
        getSafeUni().switchTab({
          url: '/pages/index'
        })
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
  getSafeUni().scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success: (res) => {
      try {
        // 处理扫码结果
        const code = extractCourseCodeFromQR(res.result)
        if (code) {
          formData.value.courseCode = code
          courseCode.value = code
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
      console.error('扫码失败', err)
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
  <view class="container">
    <!-- 导航栏 -->
    <!-- @ts-ignore -->
    <view class="navbar">
      <!-- @ts-ignore -->
      <view class="back-icon" @click="goBack">
        <wd-icon name="arrow-left" size="36rpx" color="#6a11cb" />
      </view>
      <!-- @ts-ignore -->
      <view class="navbar-title">加入课程</view>
      <!-- @ts-ignore -->
      <view class="placeholder"></view>
    </view>
    
    <!-- 表单区域 -->
    <!-- @ts-ignore -->
    <view class="form-container">
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
          <view class="input-container">
            <wd-input
              v-model="formData.courseCode"
              placeholder="请输入课程邀请码"
              placeholder-class="placeholder"
              clearable
              :custom-style="{ padding: '28rpx 24rpx' }"
            />
            <!-- 扫码按钮 -->
            <!-- @ts-ignore -->
            <view class="scan-btn" @click="handleScan">
              <wd-icon name="scan" size="48rpx" color="#6a11cb" />
            </view>
          </view>
        </wd-form-item>
        
        <!-- 提交按钮 -->
        <wd-button
          block
          type="primary"
          :loading="loading"
          custom-style="margin-top: 60rpx;"
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
          <wd-icon name="checked" size="32rpx" color="#6a11cb" />
          <!-- @ts-ignore -->
          <text>向课程老师获取邀请码</text>
        </view>
        <!-- @ts-ignore -->
        <view class="tips-item">
          <wd-icon name="checked" size="32rpx" color="#6a11cb" />
          <!-- @ts-ignore -->
          <text>扫描课程二维码</text>
        </view>
        <!-- @ts-ignore -->
        <view class="tips-item">
          <wd-icon name="checked" size="32rpx" color="#6a11cb" />
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
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  padding-bottom: 80rpx;
}

/* 导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 30rpx 20rpx;
}

.back-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.navbar-title {
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
}

.placeholder {
  width: 80rpx;
}

/* 表单区域 */
.form-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx 40rpx 80rpx;
  margin: 20rpx 0 0;
  min-height: 80vh;
}

.header-image {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
  
  image {
    width: 400rpx;
    height: 300rpx;
  }
}

.form-title {
  text-align: center;
  margin-bottom: 60rpx;
  
  .title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }
  
  .subtitle {
    display: block;
    font-size: 26rpx;
    color: #666;
  }
}

.input-container {
  position: relative;
  margin-bottom: 30rpx;
  
  .scan-btn {
    position: absolute;
    right: 20rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 80rpx;
    height: 80rpx;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.placeholder {
  font-size: 28rpx;
  color: #999;
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
    "navigationStyle": "custom",
    "navigationBarTitleText": "加入课程"
  }
}
</route> 