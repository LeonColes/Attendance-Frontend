<!--
 * @Author: weisheng
 * @Date: 2025-04-16 14:00:00
 * @LastEditTime: 2025-04-16 14:00:00
 * @LastEditors: weisheng
 * @Description: 所有课程页面 - 显示其他类型的课程
 * @FilePath: \wot-demo\src\pages\all-courses\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getCourseList } from '@/api/course'
import type { PageQueryParams } from '@/api/attendance'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

const userStore = useUserStore()
const loading = ref(false)
const allCourses = ref<any[]>([])

// 用户角色相关计算属性
const isTeacher = computed(() => userStore.role === 'TEACHER')
const isStudent = computed(() => userStore.role === 'STUDENT')

// 其他类型课程
const otherCourses = computed(() => {
  return allCourses.value.filter(course => 
    course.status !== 'ACTIVE' && course.status !== 'COMPLETED'
  )
})

// 初始化数据
onMounted(() => {
  // 设置标题
  getSafeUni().setNavigationBarTitle({
    title: '其他课程'
  })
  
  // 加载数据
  loadCourses()
})

// 扩展分页查询参数接口，支持排序和过滤
interface ExtendedPageQueryParams extends PageQueryParams {
  sort?: Array<{ field: string; direction: string }>;
  filters?: Record<string, any>;
}

// 加载课程数据
async function loadCourses() {
  try {
    loading.value = true
    
    const courseResponse = await getCourseList({
      page: 0,
      size: 50, // 加载更多数据以确保能获取所有类型的课程
      sort: [
        {
          field: "startDate",
          direction: "DESC"
        }
      ]
    } as ExtendedPageQueryParams)
    
    if (courseResponse && courseResponse.code === 200) {
      // 根据返回数据结构适配
      const responseData = courseResponse.data
      if ('courses' in responseData && Array.isArray(responseData.courses)) {
        allCourses.value = responseData.courses
      } else if ('items' in responseData && Array.isArray(responseData.items)) {
        allCourses.value = responseData.items
      } else {
        allCourses.value = []
      }
      
      console.log('所有课程:', allCourses.value)
      console.log('其他类型课程:', otherCourses.value)
    }
  } catch (e) {
    console.error('加载课程数据失败', e)
    getSafeUni().showToast({
      title: '数据加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 格式化日期时间显示
function formatDateTime(dateTimeStr: string) {
  if (!dateTimeStr) return ''
  
  const date = new Date(dateTimeStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  
  return `${month}-${day} ${hour}:${minute}`
}

// 导航到课程详情页面
function navigateToCourseDetail(courseId: string) {
  getSafeUni().navigateTo({
    url: `/pages/course-detail/index?id=${courseId}`
  })
}

// 获取课程状态文本
function getCourseStatusText(status: string) {
  switch (status) {
    case 'ACTIVE':
      return '进行中'
    case 'COMPLETED':
      return '已结束'
    case 'PENDING':
      return '未开始'
    case 'DRAFT':
      return '草稿'
    case 'CANCELLED':
      return '已取消'
    default:
      return '未知状态'
  }
}

// 获取课程状态对应的颜色类
function getCourseStatusClass(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'status-active'
    case 'COMPLETED':
      return 'status-completed'
    case 'PENDING':
      return 'status-pending'
    case 'DRAFT':
      return 'status-draft'
    case 'CANCELLED':
      return 'status-cancelled'
    default:
      return ''
  }
}
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 返回按钮 -->
    <!-- @ts-ignore -->
    <view class="back-button" @click="getSafeUni().navigateBack()">
      <wd-icon name="arrow-left" size="36rpx" color="#fff" />
    </view>
    
    <!-- 页面内容 -->
    <!-- @ts-ignore -->
    <view class="content-wrapper">
      <!-- 加载状态 -->
      <!-- @ts-ignore -->
      <view v-if="loading" class="loading-container">
        <wd-loading color="#ffffff" size="60px" />
        <!-- @ts-ignore -->
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 内容区域 -->
      <!-- @ts-ignore -->
      <view v-else>
        <!-- 页面标题 -->
        <!-- @ts-ignore -->
        <view class="page-header">
          <!-- @ts-ignore -->
          <text class="page-title">其他类型课程</text>
          <!-- @ts-ignore -->
          <text class="page-subtitle">显示未开始及其他类型的课程</text>
        </view>
        
        <!-- 课程列表 -->
        <!-- @ts-ignore -->
        <view v-if="otherCourses.length > 0" class="course-list">
          <!-- @ts-ignore -->
          <view 
            v-for="course in otherCourses"
            :key="course.id"
            class="course-card"
            @click="navigateToCourseDetail(course.id)"
          >
            <!-- 课程内容 -->
            <!-- @ts-ignore -->
            <view class="course-info">
              <!-- @ts-ignore -->
              <text class="course-name">{{ course.name }}</text>
              <!-- @ts-ignore -->
              <text class="course-desc">{{ course.description || '暂无描述' }}</text>
              
              <!-- 课程元数据 -->
              <!-- @ts-ignore -->
              <view class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="classroom" size="28rpx" color="#666" />
                  <!-- @ts-ignore -->
                  <text>{{ isTeacher ? '我创建的' : course.creatorFullName || '未知' }}</text>
                </view>
                
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="calendar" size="28rpx" color="#666" />
                  <!-- @ts-ignore -->
                  <text>{{ course.startDate ? formatDateTime(course.startDate).split(' ')[0] : '未设置' }}</text>
                </view>
              </view>
            </view>
            
            <!-- 课程状态 -->
            <!-- @ts-ignore -->
            <view class="course-status-container">
              <!-- @ts-ignore -->
              <view 
                class="course-status" 
                :class="getCourseStatusClass(course.status)"
              >
                {{ getCourseStatusText(course.status) }}
              </view>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <!-- @ts-ignore -->
        <view v-else class="empty-state">
          <wd-icon name="info" size="120rpx" color="#ffffff" />
          <!-- @ts-ignore -->
          <text class="empty-text">没有其他类型的课程</text>
          <!-- @ts-ignore -->
          <wd-button 
            type="info" 
            @click="getSafeUni().navigateBack()"
          >
            返回首页
          </wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  padding-bottom: 40rpx;
}

.back-button {
  position: fixed;
  top: 40rpx;
  left: 30rpx;
  z-index: 100;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.content-wrapper {
  padding: 140rpx 30rpx 30rpx;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
}

.loading-text {
  margin-top: 30rpx;
  color: #fff;
  font-size: 28rpx;
}

.page-header {
  margin-bottom: 40rpx;
  
  .page-title {
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 10rpx;
    display: block;
  }
  
  .page-subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
    display: block;
  }
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.course-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
  
  .course-info {
    padding: 30rpx;
    
    .course-name {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 12rpx;
      display: block;
    }
    
    .course-desc {
      font-size: 26rpx;
      color: #666;
      margin-bottom: 24rpx;
      display: block;
      line-height: 1.4;
    }
    
    .course-meta {
      display: flex;
      justify-content: space-between;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 24rpx;
        color: #666;
      }
    }
  }
  
  .course-status-container {
    padding: 20rpx 30rpx;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    text-align: right;
    
    .course-status {
      display: inline-block;
      font-size: 24rpx;
      color: #fff;
      padding: 6rpx 20rpx;
      border-radius: 20rpx;
      
      &.status-active {
        background: #52c41a;
      }
      
      &.status-completed {
        background: #8c8c8c;
      }
      
      &.status-pending {
        background: #faad14;
      }
      
      &.status-draft {
        background: #1890ff;
      }
      
      &.status-cancelled {
        background: #f5222d;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  text-align: center;
  
  .empty-text {
    margin: 30rpx 0;
    font-size: 32rpx;
    color: #fff;
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "其他课程"
  }
}
</route> 