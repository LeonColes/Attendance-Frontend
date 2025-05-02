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
import { getCheckinList, submitCheckin, CheckInType } from '@/api/attendance'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { formatDate } from '@/utils/dateTime'

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
const activeTab = ref<'active' | 'all'>('active')
const activeCourseCount = ref(0)
const allCourseCount = ref(0)
const coursesLoading = ref(true)
const allCoursesLoading = ref(true)
const activeCourses = ref<any[]>([])
const allCourses = ref<any[]>([])
const otherCourses = ref<any[]>([])

// 计算属性：用户身份
const isTeacher = computed(() => userStore.userInfo?.role === 'TEACHER')
const isStudent = computed(() => userStore.userInfo?.role === 'STUDENT')

// 初始化
onMounted(async () => {
  // 检查登录状态
  await checkLoginStatus()
})

// 在uni-app的onShow生命周期中加载数据
onShow(() => {
  checkLoginStatus().then(isLoggedIn => {
    if (isLoggedIn) {
      loadCourseData()
    }
  })
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
  getSafeUni().navigateTo({
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

    if (response && typeof response === 'object' && 'code' in response && response.code === 200) {
      // 使用类型断言处理响应数据
      const apiResponse = response as { code: number; data: any }
      const data = apiResponse.data || {}
      const courses = data.courses || []
      console.log('获取到课程数据:', courses)

      // 根据课程状态分类
      activeCourses.value = courses.filter((course) => course.status === 'ACTIVE')
      allCourses.value = courses // 所有课程

      // 更新计数
      activeCourseCount.value = activeCourses.value.length
      allCourseCount.value = allCourses.value.length
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
function switchTab(tab: 'active' | 'all') {
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

// 打开扫码页面 - 专门用于学生签到
function openScanner() {
  // 只有学生可以使用签到扫码功能
  if (!isStudent.value) {
    getSafeUni().showToast({
      title: '只有学生可以使用该功能',
      icon: 'none'
    })
    return
  }

  getSafeUni().scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success: (res) => {
      try {
        console.log('扫码结果:', res.result)
        // 提示用户扫码成功
        getSafeUni().showToast({
          title: '扫码成功',
          icon: 'success',
          duration: 1000
        })

        // 尝试从二维码获取签到码和任务ID
        processCheckInQRCode(res.result)
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
      getSafeUni().showToast({
        title: '扫码取消或失败',
        icon: 'none'
      })
    }
  })
}

// 处理签到二维码
async function processCheckInQRCode(qrContent) {
  // 获取设备信息
  const deviceInfo = getSafeUni().getSystemInfoSync()
  const deviceModel = deviceInfo.model || '设备不明'

  // 准备API调用参数
  const params = {
    checkinId: qrContent,                   // 使用checkinId而非taskId
    verifyMethod: CheckInType.QR_CODE,                 // 使用扫码结果作为verifyData
    device: deviceModel,                    // 设备信息
  }
  console.log('签到API参数:', params)

  try {
    // 使用封装好的 API 进行签到
    const response = await submitCheckin(params)
    if (response.code === 200) {
      getSafeUni().showToast({
        title: response.message,
        icon: 'success',
        duration: 1500
      })
    } else {
      getSafeUni().showToast({
        title: response.message || '签到失败',
        icon: 'error'
      })
    }
  } catch (error) {
    console.error('签到失败:', error)
    getSafeUni().hideLoading()
    getSafeUni().showToast({
      title: '签到失败，请重试',
      icon: 'none'
    })
  }
  // 延迟后刷新当前页面
  setTimeout(() => {
    // 刷新当前页面数据
    refreshCourses()
  }, 1000)
}

</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 页面头部 -->
    <!-- @ts-ignore -->
    <view class="header">
      <text class="header-title">我的课程</text>
      <!-- @ts-ignore -->
      <view class="header-action">
        <!-- 教师端：创建课程 -->
        <wd-button v-if="isTeacher" type="primary" size="small" custom-style="margin-left: 20rpx;" icon="add"
          @click="createCourse">
          创建课程
        </wd-button>

        <!-- 学生端：加入课程 -->
        <wd-button v-if="isStudent" type="primary" size="small" custom-style="margin-left: 20rpx;" icon="add"
          @click="joinCourse">
          加入课程
        </wd-button>
      </view>
    </view>

    <!-- 标签页 -->
    <!-- @ts-ignore -->
    <view class="tab-container">
      <!-- @ts-ignore -->
      <view class="tab-item" :class="{ active: activeTab === 'active' }" @click="switchTab('active')">
        <!-- @ts-ignore -->
        <text class="tab-text">进行中</text>
        <!-- @ts-ignore -->
        <text class="tab-count">{{ activeCourseCount }}</text>
      </view>

      <!-- @ts-ignore -->
      <view class="tab-item" :class="{ active: activeTab === 'all' }" @click="switchTab('all')">
        <!-- @ts-ignore -->
        <text class="tab-text">全部</text>
        <!-- @ts-ignore -->
        <text class="tab-count">{{ allCourseCount }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <!-- @ts-ignore -->
    <view v-if="coursesLoading || allCoursesLoading" class="loading-container">
      <wd-loading color="#6a11cb" size="80rpx" />
      <text>加载中...</text>
    </view>

    <!-- 课程内容区域 -->
    <!-- @ts-ignore -->
    <view v-else class="content-area">
      <!-- 进行中的课程 -->
      <template v-if="activeTab === 'active'">
        <!-- @ts-ignore -->
        <view v-if="activeCourses.length > 0" class="course-list">
          <!-- @ts-ignore -->
          <view v-for="course in activeCourses" :key="course.id" class="course-card" @click="viewCourseDetail(course)">
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
            <wd-button v-if="isTeacher" type="primary" size="medium" custom-style="margin-top: 40rpx;"
              @click="createCourse">
              创建课程
            </wd-button>
            <wd-button v-else-if="isStudent" type="primary" size="medium" custom-style="margin-top: 40rpx;"
              @click="joinCourse">
              加入课程
            </wd-button>
          </view>
        </view>
      </template>

      <!-- 全部课程 -->
      <template v-else-if="activeTab === 'all'">
        <!-- @ts-ignore -->
        <view v-if="allCourses.length > 0" class="course-list">
          <!-- @ts-ignore -->
          <view v-for="course in allCourses" :key="course.id" class="course-card" @click="viewCourseDetail(course)">
            <!-- @ts-ignore -->
            <view class="course-card-cover">
              <image :src="'https://picsum.photos/500/300?random=' + course.id.slice(0, 8)" mode="aspectFill" />
              <!-- 根据课程状态显示不同标签 -->
              <!-- @ts-ignore -->
              <view class="course-status" :class="{
                'active': course.status === 'ACTIVE',
                'completed': course.status === 'COMPLETED',
                'created': course.status === 'CREATED',
                'ended': course.status === 'ENDED',
                'canceled': course.status === 'CANCELED'
              }">
                {{ course.status === 'ACTIVE' ? '进行中' :
                  course.status === 'COMPLETED' ? '已结课' :
                    course.status === 'CREATED' ? '未开始' :
                      course.status === 'ENDED' ? '已结束' :
                        course.status === 'CANCELED' ? '已取消' : '未知状态' }}
              </view>
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

        <!-- 无全部课程 -->
        <!-- @ts-ignore -->
        <view v-else class="empty-container">
          <wd-icon name="info-outline" size="120rpx" color="#cccccc" />
          <!-- @ts-ignore -->
          <text class="empty-text">暂无课程</text>
        </view>
      </template>
    </view>

    <!-- 只对学生显示扫码按钮 -->
    <!-- @ts-ignore -->
    <view v-if="isStudent" class="scan-btn" @click="openScanner">
      <wd-icon name="scan" size="48rpx" color="white" />
    </view>
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

      .tab-text,
      .tab-count {
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
      color: #666;
      margin-left: 10rpx;
      background: rgba(106, 17, 203, 0.1);
      padding: 2rpx 10rpx;
      border-radius: 30rpx;
    }
  }
}

.content-area {
  width: 100%;
  max-width: 700rpx;
  padding: 0 30rpx;
  box-sizing: border-box;
  flex: 1;
}

.course-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-bottom: 100rpx;
}

.loading-container {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  gap: 20rpx;

  text {
    font-size: 28rpx;
    color: #999;
  }
}

.course-card {
  width: 100%;
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  }

  &-cover {
    width: 100%;
    height: 200rpx;
    position: relative;

    image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .course-status {
      position: absolute;
      right: 20rpx;
      top: 20rpx;
      padding: 6rpx 16rpx;
      border-radius: 30rpx;
      font-size: 24rpx;
      color: #fff;
      background-color: rgba(0, 0, 0, 0.5);

      &.active {
        background-color: rgba(52, 152, 219, 0.8);
      }

      &.completed {
        background-color: rgba(46, 204, 113, 0.8);
      }

      &.created {
        background-color: rgba(155, 89, 182, 0.8);
      }

      &.ended {
        background-color: rgba(52, 73, 94, 0.8);
      }

      &.canceled {
        background-color: rgba(231, 76, 60, 0.8);
      }
    }
  }

  &-content {
    padding: 20rpx 30rpx 30rpx;

    .course-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 16rpx;
    }

    .course-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20rpx;
      margin-bottom: 16rpx;

      .meta-item {
        display: flex;
        align-items: center;
        font-size: 26rpx;
        color: #666;

        text {
          margin-left: 8rpx;
        }
      }
    }

    .course-time {
      display: flex;
      align-items: center;
      font-size: 26rpx;
      color: #999;
      margin-bottom: 16rpx;

      text {
        margin-left: 8rpx;
      }
    }

    .view-details {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      font-size: 26rpx;
      color: #6a11cb;

      text {
        margin-left: 8rpx;
      }
    }
  }
}

.empty-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;

  .empty-text {
    font-size: 30rpx;
    color: #999;
    margin: 30rpx 0;
  }

  .action-button-container {
    display: flex;
    gap: 20rpx;
  }
}

.scan-btn {
  position: fixed;
  right: 40rpx;
  bottom: 80rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  box-shadow: 0 8rpx 16rpx rgba(106, 17, 203, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:active {
    transform: scale(0.95);
    box-shadow: 0 4rpx 8rpx rgba(106, 17, 203, 0.3);
  }
}

.more-courses {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 30rpx 0 60rpx;
}
</style>

<route lang="json">{
  "navigationBarTitleText": "课程考勤"
}</route>
