<!--
 * @Author: weisheng
 * @Date: 2025-04-06 10:00:00
 * @LastEditTime: 2025-04-13 14:30:00
 * @LastEditors: weisheng
 * @Description: 首页
 * @FilePath: \wot-demo\src\pages\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { getCourseList } from '@/api/courses'
import { getCheckinList } from '@/api/attendance'

// 安全获取uni对象
function getSafeUni() {
  return typeof window !== 'undefined' && window.uni ? window.uni : uni
}

// 声明 uni 全局属性类型
declare global {
  interface Window {
    uni: typeof uni
  }
}

const userStore = useUserStore()
const activeTab = ref<'active' | 'completed'>('active')
const activeCourseCount = ref(0)
const completedCourseCount = ref(0)
const coursesLoading = ref(true)
const allCoursesLoading = ref(true)
const activeCourses = ref<any[]>([])
const completedCourses = ref<any[]>([])
const otherCourses = ref<any[]>([])

// 计算属性：用户身份
const isTeacher = computed(() => userStore.userInfo?.role === 'TEACHER')
const isStudent = computed(() => userStore.userInfo?.role === 'STUDENT')

// 获取系统信息
function getSystemInfo() {
  try {
    // 使用推荐的新API
    if (typeof getSafeUni().getWindowInfo === 'function' && 
        typeof getSafeUni().getDeviceInfo === 'function') {
      const windowInfo = getSafeUni().getWindowInfo()
      const deviceInfo = getSafeUni().getDeviceInfo()
      
      return {
        platform: deviceInfo.platform,
        model: deviceInfo.model,
        windowWidth: windowInfo.windowWidth,
        windowHeight: windowInfo.windowHeight,
        statusBarHeight: windowInfo.statusBarHeight,
        safeArea: windowInfo.safeAreaInsets ? {
          top: windowInfo.safeAreaInsets.top,
          right: windowInfo.safeAreaInsets.right,
          bottom: windowInfo.safeAreaInsets.bottom,
          left: windowInfo.safeAreaInsets.left
        } : undefined
      }
    } else {
      // 如果新API不可用，尝试使用老的API，但要捕获可能的错误
      try {
        return getSafeUni().getSystemInfoSync()
      } catch (e) {
        console.error('获取系统信息失败:', e)
        // 返回默认值
        return {
          platform: 'unknown',
          model: 'unknown',
          windowWidth: 375,
          windowHeight: 667,
          statusBarHeight: 20,
          safeArea: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      }
    }
  } catch (e) {
    console.error('获取系统信息失败:', e)
    // 如果所有方法都失败，返回默认值
    return {
      platform: 'unknown',
      model: 'unknown',
      windowWidth: 375,
      windowHeight: 667,
      statusBarHeight: 20,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 }
    }
  }
}

// 初始化
onMounted(async () => {
  // 检查登录状态
  await checkLoginStatus()
  
  // 加载课程数据
  loadCourseData()
})

// 检查登录状态
async function checkLoginStatus() {
  try {
    const token = getSafeUni().getStorageSync('token')
    
    if (!token) {
      // 没有token，跳转到登录页
      redirectToLogin()
      return false
    }
    
    // 已有token，检查是否有用户信息
    if (!userStore.isLoggedIn) {
      // 尝试获取用户信息
      const success = await userStore.getUserInfo()
      
      if (!success) {
        // 获取用户信息失败，可能是token已过期
        console.log('自动登录失败，token可能已过期')
        redirectToLogin()
        return false
      }
    }
    
    return true
  } catch (e) {
    console.error('检查登录状态失败:', e)
    redirectToLogin()
    return false
  }
}

// 重定向到登录页
function redirectToLogin() {
  getSafeUni().redirectTo({
    url: '/pages/login/index'
  })
}

// 加载课程数据
async function loadCourseData() {
  // 确保已登录
  const isLoggedIn = await checkLoginStatus()
  if (!isLoggedIn) return
  
  try {
    coursesLoading.value = true
    
    // 调用真实API获取课程列表
    const response = await getCourseList({
      page: 0,
      size: 50,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
      filters: {}
    })
    
    if (response && response.code === 200) {
      const courses = response.data.courses || []
      console.log('获取到课程数据:', courses)
      
      // 根据课程状态分类
      activeCourses.value = courses.filter((course) => course.status === 'ACTIVE')
      completedCourses.value = courses.filter((course) => course.status === 'COMPLETED')
      otherCourses.value = courses.filter((course) => 
        course.status !== 'ACTIVE' && course.status !== 'COMPLETED'
      )
      
      // 更新计数
      activeCourseCount.value = activeCourses.value.length
      completedCourseCount.value = completedCourses.value.length
    } else {
      showToast('获取课程列表失败')
    }
  } catch (error) {
    console.error('加载课程数据失败:', error)
    showToast('加载课程失败，请重试')
  } finally {
    coursesLoading.value = false
    setTimeout(() => {
      allCoursesLoading.value = false
    }, 500)
  }
}

// 显示提示
function showToast(title: string) {
  getSafeUni().showToast({
    title,
    icon: 'none'
  })
}

// 切换标签
function switchTab(tab: 'active' | 'completed') {
  activeTab.value = tab
}

// 刷新课程数据
function refreshCourses() {
  loadCourseData()
}

// 创建课程（老师）
function createCourse() {
  getSafeUni().navigateTo({
    url: '/pages/create-course/index'
  })
}

// 加入课程（学生）
function joinCourse() {
  getSafeUni().navigateTo({
    url: '/pages/join-course/index'
  })
}

// 查看课程详情
function viewCourseDetail(course) {
  // 获取课程的签到任务
  getCheckinList(course.id, {
    page: 0,
    size: 50,
    sort: [{ field: 'createdAt', direction: 'DESC' }],
    filters: {}
  }).then(response => {
    if (response && response.code === 200) {
      // 将课程基本信息和签到数据一起通过路由传递给详情页
      const courseData = encodeURIComponent(JSON.stringify({
        course: {
          id: course.id,
          name: course.name,
          description: course.description,
          creatorId: course.creatorId,
          creatorFullName: course.creatorFullName,
          creatorUsername: course.creatorUsername,
          code: course.code,
          status: course.status,
          memberCount: course.memberCount || 0,
          startDate: course.startDate,
          endDate: course.endDate
        },
        checkinData: response.data
      }))
      
      getSafeUni().navigateTo({
        url: `/pages/course-detail/index?courseData=${courseData}`
      })
    } else {
      // 如果获取签到数据失败，仅传递课程信息
      const courseInfo = encodeURIComponent(JSON.stringify({
        id: course.id,
        name: course.name,
        description: course.description,
        creatorId: course.creatorId,
        creatorFullName: course.creatorFullName,
        creatorUsername: course.creatorUsername,
        code: course.code,
        status: course.status,
        memberCount: course.memberCount || 0,
        startDate: course.startDate,
        endDate: course.endDate
      }))
      
      getSafeUni().navigateTo({
        url: `/pages/course-detail/index?courseInfo=${courseInfo}`
      })
    }
  }).catch(error => {
    console.error('获取签到数据失败:', error)
    // 出错时仅传递课程信息
    const courseInfo = encodeURIComponent(JSON.stringify({
      id: course.id,
      name: course.name,
      description: course.description,
      creatorId: course.creatorId,
      creatorFullName: course.creatorFullName,
      creatorUsername: course.creatorUsername,
      code: course.code,
      status: course.status,
      memberCount: course.memberCount || 0,
      startDate: course.startDate,
      endDate: course.endDate
    }))
    
    getSafeUni().navigateTo({
      url: `/pages/course-detail/index?courseInfo=${courseInfo}`
    })
  })
}

// 查看所有课程
function viewAllCourses() {
  getSafeUni().navigateTo({
    url: '/pages/all-courses/index'
  })
}

// 打开扫码页
function openScanner() {
  getSafeUni().navigateTo({
    url: '/pages/scanner/index'
  })
}

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 标题栏 -->
    <!-- @ts-ignore -->
    <view class="header">
      <!-- @ts-ignore -->
      <view class="header-title">
        <!-- @ts-ignore -->
        <text>我的课程</text>
      </view>
      
      <!-- 课程操作按钮 -->
      <!-- @ts-ignore -->
      <view class="header-action">
        <template v-if="isTeacher">
          <wd-button 
            size="small" 
            type="primary" 
            custom-style="height: 64rpx; padding: 0 24rpx; font-size: 28rpx;"
            @click="createCourse"
          >
            创建课程
          </wd-button>
        </template>
        <template v-else-if="isStudent">
          <wd-button 
            size="small" 
            type="primary" 
            custom-style="height: 64rpx; padding: 0 24rpx; font-size: 28rpx;"
            @click="joinCourse"
          >
            加入课程
          </wd-button>
        </template>
      </view>
    </view>
    
    <!-- Tab栏 -->
    <!-- @ts-ignore -->
    <view class="tab-container">
      <!-- @ts-ignore -->
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'active' }"
        @click="switchTab('active')"
      >
        <!-- @ts-ignore -->
        <text class="tab-text">进行中</text>
        <!-- @ts-ignore -->
        <text class="tab-count">{{ activeCourseCount }}</text>
      </view>
      
      <!-- @ts-ignore -->
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'completed' }"
        @click="switchTab('completed')"
      >
        <!-- @ts-ignore -->
        <text class="tab-text">已结课</text>
        <!-- @ts-ignore -->
        <text class="tab-count">{{ completedCourseCount }}</text>
      </view>
      
      <!-- 查看全部按钮 -->
      <!-- @ts-ignore -->
      <view v-if="otherCourses.length > 0" class="tab-action" @click="viewAllCourses">
        <!-- @ts-ignore -->
        <text>查看全部</text>
        <wd-icon name="arrow-right" size="28rpx" color="#666" />
      </view>
    </view>
    
    <!-- 课程列表 -->
    <!-- @ts-ignore -->
    <view class="course-list-container">
      <!-- 加载中 -->
      <!-- @ts-ignore -->
      <view v-if="coursesLoading" class="loading-container">
        <wd-loading color="#6a11cb" size="80rpx" />
      </view>
      
      <!-- 进行中的课程 -->
      <template v-else-if="activeTab === 'active'">
        <!-- @ts-ignore -->
        <view v-if="activeCourses.length > 0" class="course-list">
          <!-- @ts-ignore -->
          <view
            v-for="course in activeCourses"
            :key="course.id"
            class="course-card"
            @click="viewCourseDetail(course)"
          >
            <!-- @ts-ignore -->
            <view class="course-card-cover">
              <image :src="'https://picsum.photos/500/300?random=' + course.id.slice(0, 8)" mode="aspectFill" />
              <!-- @ts-ignore -->
              <view class="course-status active">进行中</view>
            </view>
            
            <!-- @ts-ignore -->
            <view class="course-card-content">
              <!-- @ts-ignore -->
              <view class="course-name">{{ course.name }}</view>
              
              <!-- 教师视图 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher" class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="people" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.memberCount || 0 }}人</text>
                </view>
              </view>
              
              <!-- 学生视图 -->
              <!-- @ts-ignore -->
              <view v-else-if="isStudent" class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="user" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.creatorFullName || course.creatorUsername || '未知教师' }}</text>
                </view>
              </view>
              
              <!-- @ts-ignore -->
              <view class="course-time">
                <wd-icon name="calendar" size="28rpx" color="#999" />
                <!-- @ts-ignore -->
                <text>{{ formatDate(course.startDate) }} ~ {{ formatDate(course.endDate) }}</text>
              </view>

              <!-- 点击查看详情提示 -->
              <!-- @ts-ignore -->
              <view class="view-details">
                <wd-icon name="arrow-right" size="28rpx" color="#6a11cb" />
                <text>查看详情</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 无进行中课程 -->
        <!-- @ts-ignore -->
        <view v-else class="empty-container">
          <wd-icon name="info-outline" size="120rpx" color="#cccccc" />
          <!-- @ts-ignore -->
          <text class="empty-text">暂无进行中的课程</text>
          
          <!-- 引导按钮 -->
          <!-- @ts-ignore -->
          <view class="action-button-container">
            <wd-button
              v-if="isTeacher"
              type="primary"
              size="medium"
              custom-style="margin-top: 40rpx;"
              @click="createCourse"
            >
              创建课程
            </wd-button>
            <wd-button
              v-else-if="isStudent"
              type="primary"
              size="medium"
              custom-style="margin-top: 40rpx;"
              @click="joinCourse"
            >
              加入课程
            </wd-button>
          </view>
        </view>
      </template>
      
      <!-- 已结课的课程 -->
      <template v-else-if="activeTab === 'completed'">
        <!-- @ts-ignore -->
        <view v-if="completedCourses.length > 0" class="course-list">
          <!-- @ts-ignore -->
          <view
            v-for="course in completedCourses"
            :key="course.id"
            class="course-card"
            @click="viewCourseDetail(course)"
          >
            <!-- @ts-ignore -->
            <view class="course-card-cover">
              <image :src="'https://picsum.photos/500/300?random=' + course.id.slice(0, 8)" mode="aspectFill" />
              <!-- @ts-ignore -->
              <view class="course-status completed">已结课</view>
            </view>
            
            <!-- @ts-ignore -->
            <view class="course-card-content">
              <!-- @ts-ignore -->
              <view class="course-name">{{ course.name }}</view>
              
              <!-- 教师视图 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher" class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="people" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.memberCount || 0 }}人</text>
                </view>
              </view>
              
              <!-- 学生视图 -->
              <!-- @ts-ignore -->
              <view v-else-if="isStudent" class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="user" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.creatorFullName || course.creatorUsername || '未知教师' }}</text>
                </view>
              </view>
              
              <!-- @ts-ignore -->
              <view class="course-time">
                <wd-icon name="calendar" size="28rpx" color="#999" />
                <!-- @ts-ignore -->
                <text>{{ formatDate(course.startDate) }} ~ {{ formatDate(course.endDate) }}</text>
              </view>

              <!-- 点击查看详情提示 -->
              <!-- @ts-ignore -->
              <view class="view-details">
                <wd-icon name="arrow-right" size="28rpx" color="#6a11cb" />
                <text>查看详情</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 无已结课课程 -->
        <!-- @ts-ignore -->
        <view v-else class="empty-container">
          <wd-icon name="info-outline" size="120rpx" color="#cccccc" />
          <!-- @ts-ignore -->
          <text class="empty-text">暂无已结课的课程</text>
        </view>
      </template>
    </view>
  </view>
  
  <!-- 扫码按钮 -->
  <!-- @ts-ignore -->
  <view class="scan-btn" @click="openScanner">
    <wd-icon name="scan" size="48rpx" color="white" />
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  width: 100%;
  max-width: 700rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx 20rpx;
  box-sizing: border-box;
  
  &-title {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
  }
  
  &-action {
    display: flex;
    align-items: center;
  }
}

.tab-container {
  width: 100%;
  max-width: 700rpx;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
  position: relative;
  
  .tab-item {
    display: flex;
    align-items: center;
    margin-right: 40rpx;
    padding-bottom: 16rpx;
    border-bottom: 6rpx solid transparent;
    
    &.active {
      border-bottom-color: #6a11cb;
      
      .tab-text, .tab-count {
        color: #6a11cb;
        font-weight: bold;
      }
    }
    
    .tab-text {
      font-size: 30rpx;
      color: #666;
    }
    
    .tab-count {
      font-size: 26rpx;
      color: #999;
      background-color: #f0f0f0;
      border-radius: 20rpx;
      padding: 4rpx 16rpx;
      margin-left: 10rpx;
    }
  }
  
  .tab-action {
    position: absolute;
    right: 30rpx;
    display: flex;
    align-items: center;
    
    text {
      font-size: 26rpx;
      color: #666;
      margin-right: 4rpx;
    }
  }
}

.course-list-container {
  width: 100%;
  max-width: 700rpx;
  flex: 1;
  padding: 0 30rpx;
  box-sizing: border-box;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
}

.course-list {
  padding: 20rpx 0;
}

.course-card {
  background-color: #fff;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.05);
  
  &-cover {
    height: 240rpx;
    position: relative;
    
    image {
      width: 100%;
      height: 100%;
    }
    
    .course-status {
      position: absolute;
      top: 20rpx;
      right: 20rpx;
      font-size: 24rpx;
      color: #fff;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      
      &.active {
        background-color: #2575fc;
      }
      
      &.completed {
        background-color: #52c41a;
      }
    }
  }
  
  &-content {
    padding: 24rpx;
    
    .course-name {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }
    
    .course-meta {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
      .meta-item {
        display: flex;
        align-items: center;
        margin-right: 20rpx;
        
        text {
          font-size: 26rpx;
          color: #666;
          margin-left: 6rpx;
        }
      }
    }
    
    .course-time {
      display: flex;
      align-items: center;
      
      text {
        font-size: 26rpx;
        color: #999;
        margin-left: 6rpx;
      }
    }

    .view-details {
      display: flex;
      align-items: center;
      margin-top: 10rpx;
      
      text {
        font-size: 26rpx;
        color: #6a11cb;
        margin-left: 6rpx;
      }
    }
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .empty-image {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 30rpx;
    color: #999;
  }
}

.scan-btn {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(106, 17, 203, 0.3);
}
</style>


<route type="home" lang="json">
  {
    "layout": "tabbar",
    "name": "home",
    "style": {
      "navigationBarTitleText": "智能考勤"
    }
  }
  </route>
