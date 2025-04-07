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
const isTeacher = computed(() => userStore.userInfo?.role === 'teacher')
const isStudent = computed(() => userStore.userInfo?.role === 'student')

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
    
    // 模拟API调用获取课程列表
    // 实际应用中，应该调用真实的API
    const response = mockFetchCourses()
    
    if (response && response.code === 200) {
      const courses = response.data || []
      
      // 根据课程状态分类
      activeCourses.value = courses.filter((course: any) => course.status === 'active')
      completedCourses.value = courses.filter((course: any) => course.status === 'completed')
      otherCourses.value = courses.filter((course: any) => 
        course.status !== 'active' && course.status !== 'completed'
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
function viewCourseDetail(courseId: string) {
  getSafeUni().navigateTo({
    url: `/pages/course-detail/index?id=${courseId}`
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

// 模拟API调用获取课程列表
function mockFetchCourses() {
  // 老师的课程数据
  const teacherCourses = [
    {
      id: '1',
      name: '高等数学（上）',
      description: '本课程介绍微积分的基本概念和应用',
      cover: '/static/images/course1.jpg',
      startDate: '2025-04-01',
      endDate: '2025-06-30',
      status: 'active',
      students: 45,
      checkins: 8
    },
    {
      id: '2',
      name: '线性代数',
      description: '学习矩阵运算和向量空间等基础内容',
      cover: '/static/images/course2.jpg',
      startDate: '2025-03-01',
      endDate: '2025-06-15',
      status: 'active',
      students: 38,
      checkins: 12
    },
    {
      id: '3',
      name: '概率论与数理统计',
      description: '概率论基础知识与统计学方法',
      cover: '/static/images/course3.jpg',
      startDate: '2025-09-01',
      endDate: '2025-12-30',
      status: 'not_started',
      students: 0,
      checkins: 0
    },
    {
      id: '4',
      name: '离散数学',
      description: '离散结构的性质与应用',
      cover: '/static/images/course4.jpg',
      startDate: '2024-09-01',
      endDate: '2024-12-30',
      status: 'completed',
      students: 42,
      checkins: 16
    },
    {
      id: '5',
      name: '高等数学（下）',
      description: '多元微积分与常微分方程',
      cover: '/static/images/default-course.jpg',
      startDate: '2024-08-15',
      endDate: '2024-01-15',
      status: 'completed',
      students: 40,
      checkins: 15
    }
  ]
  
  // 学生的课程数据
  const studentCourses = [
    {
      id: '1',
      name: '高等数学（上）',
      description: '本课程介绍微积分的基本概念和应用',
      cover: '/static/images/default-course.jpg',
      teacher: '张教授',
      startDate: '2025-04-01',
      endDate: '2025-06-30',
      status: 'active',
      attendance: 8,
      totalCheckins: 8
    },
    {
      id: '2',
      name: '线性代数',
      description: '学习矩阵运算和向量空间等基础内容',
      cover: '/static/images/default-course.jpg',
      teacher: '李教授',
      startDate: '2025-03-01',
      endDate: '2025-06-15',
      status: 'active',
      attendance: 10,
      totalCheckins: 12
    },
    {
      id: '3',
      name: '概率论与数理统计',
      description: '概率论基础知识与统计学方法',
      cover: '/static/images/default-course.jpg',
      teacher: '王教授',
      startDate: '2025-09-01',
      endDate: '2025-12-30',
      status: 'not_started',
      attendance: 0,
      totalCheckins: 0
    },
    {
      id: '4',
      name: '离散数学',
      description: '离散结构的性质与应用',
      cover: '/static/images/default-course.jpg',
      teacher: '刘教授',
      startDate: '2024-09-01',
      endDate: '2024-12-30',
      status: 'completed',
      attendance: 15,
      totalCheckins: 16
    },
    {
      id: '5',
      name: '高等数学（下）',
      description: '多元微积分与常微分方程',
      cover: '/static/images/default-course.jpg',
      teacher: '赵教授',
      startDate: '2024-08-15',
      endDate: '2024-01-15',
      status: 'completed',
      attendance: 14,
      totalCheckins: 15
    }
  ]
  
  // 根据用户角色返回不同数据
  return {
    code: 200,
    message: '获取成功',
    data: isTeacher.value ? teacherCourses : studentCourses
  }
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
            @click="viewCourseDetail(course.id)"
          >
            <!-- @ts-ignore -->
            <view class="course-card-cover">
              <image :src="'https://picsum.photos/500/300?random=' + course.id" mode="aspectFill" />
              <!-- @ts-ignore -->
              <view class="course-status active">进行中</view>
            </view>
            
            <!-- @ts-ignore -->
            <view class="course-card-content">
              <!-- @ts-ignore -->
              <view class="course-name">{{ course.name }}</view>
              <!-- @ts-ignore -->
              <view class="course-desc">{{ course.description }}</view>
              
              <!-- 教师视图 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher" class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="people" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.students }}人</text>
                </view>
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="check2" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.checkins }}次考勤</text>
                </view>
              </view>
              
              <!-- 学生视图 -->
              <!-- @ts-ignore -->
              <view v-else-if="isStudent" class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="user" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.teacher }}</text>
                </view>
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="check-circle" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>已签到{{ course.attendance }}/{{ course.totalCheckins }}次</text>
                </view>
              </view>
              
              <!-- @ts-ignore -->
              <view class="course-time">
                <wd-icon name="calendar" size="28rpx" color="#999" />
                <!-- @ts-ignore -->
                <text>{{ formatDate(course.startDate) }} 至 {{ formatDate(course.endDate) }}</text>
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
          <wd-button 
            v-if="isTeacher" 
            type="primary" 
            @click="createCourse" 
            custom-style="margin-top: 40rpx;"
          >
            创建课程
          </wd-button>
          <wd-button 
            v-else-if="isStudent" 
            type="primary" 
            @click="joinCourse" 
            custom-style="margin-top: 40rpx;"
          >
            加入课程
          </wd-button>
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
            @click="viewCourseDetail(course.id)"
          >
            <!-- @ts-ignore -->
            <view class="course-card-cover">
              <image :src="'https://picsum.photos/500/300?random=' + course.id" mode="aspectFill" />
              <!-- @ts-ignore -->
              <view class="course-status completed">已结课</view>
            </view>
            
            <!-- @ts-ignore -->
            <view class="course-card-content">
              <!-- @ts-ignore -->
              <view class="course-name">{{ course.name }}</view>
              <!-- @ts-ignore -->
              <view class="course-desc">{{ course.description }}</view>
              
              <!-- 教师视图 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher" class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="people" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.students }}人</text>
                </view>
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="check2" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.checkins }}次考勤</text>
                </view>
              </view>
              
              <!-- 学生视图 -->
              <!-- @ts-ignore -->
              <view v-else-if="isStudent" class="course-meta">
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="user" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>{{ course.teacher }}</text>
                </view>
                <!-- @ts-ignore -->
                <view class="meta-item">
                  <wd-icon name="check-circle" size="28rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>已签到{{ course.attendance }}/{{ course.totalCheckins }}次</text>
                </view>
              </view>
              
              <!-- @ts-ignore -->
              <view class="course-time">
                <wd-icon name="calendar" size="28rpx" color="#999" />
                <!-- @ts-ignore -->
                <text>{{ formatDate(course.startDate) }} 至 {{ formatDate(course.endDate) }}</text>
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
    
    .course-desc {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 20rpx;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    
    .course-meta {
      display: flex;
      margin-bottom: 16rpx;
      
      .meta-item {
        display: flex;
        align-items: center;
        margin-right: 30rpx;
        
        text {
          font-size: 26rpx;
          color: #333;
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
