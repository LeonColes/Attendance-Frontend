<!--
 * @Author: weisheng
 * @Date: 2025-04-07 13:15:00
 * @LastEditTime: 2025-04-07 13:15:00
 * @LastEditors: weisheng
 * @Description: 课程详情页面
 * @FilePath: \wot-demo\src\pages\course-detail\index.vue
 * 记得注释
-->
<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { CheckInType, getCheckinList } from '@/api/attendance'
import { getCourseDetail } from '@/api/course'
import type { PageQueryParams } from '@/api/attendance'

// 为window.uni声明类型，解决TypeScript错误
declare global {
  interface Window {
    uni: typeof uni;
  }
}

const userStore = useUserStore()
const loading = ref(false)
const courseId = ref('')
const courseDetail = ref<any>({})
const checkinList = ref<any[]>([])
const activeTab = ref('info') // 'info', 'checkins', 'members'
const currentPage = ref(0)
const pageSize = ref(10)
const hasMoreData = ref(true)

// 用户角色相关计算属性
const isTeacher = computed(() => userStore.role === 'TEACHER')
const isStudent = computed(() => userStore.role === 'STUDENT')

// 获取系统信息
function getSystemInfo() {
  try {
    // 使用推荐的新API
    const windowInfo = uni.getWindowInfo()
    const deviceInfo = uni.getDeviceInfo()
    return {
      platform: deviceInfo.platform,
      model: deviceInfo.model,
      windowWidth: windowInfo.windowWidth,
      windowHeight: windowInfo.windowHeight,
      statusBarHeight: windowInfo.statusBarHeight,
      safeArea: windowInfo.safeArea
    }
  } catch (e) {
    console.error('获取系统信息失败:', e)
    // 如果新API不可用，回退到旧API
    return uni.getSystemInfoSync()
  }
}

// 初始化
onMounted(() => {
  // 从路由参数获取课程ID
  const query = uni.getLaunchOptionsSync().query || {}
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const options = page?.options || query || {}
  courseId.value = options.id || ''
  
  if (!courseId.value) {
    uni.showToast({
      title: '缺少课程ID',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }
  
  loadCourseDetail()
})

// 加载课程详情
async function loadCourseDetail() {
  try {
    loading.value = true
    
    const response = await getCourseDetail(courseId.value)
    
    if (response && response.code === 200) {
      courseDetail.value = response.data
      
      // 设置页面标题
      uni.setNavigationBarTitle({
        title: courseDetail.value.name || '课程详情'
      })
      
      // 加载签到任务
      if (activeTab.value === 'checkins') {
        loadCheckinList()
      }
    }
  } catch (e) {
    console.error('获取课程详情失败:', e)
    uni.showToast({
      title: '获取课程详情失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 加载签到任务列表
async function loadCheckinList(refresh = false) {
  try {
    if (refresh) {
      currentPage.value = 0
      hasMoreData.value = true
      checkinList.value = []
    }
    
    if (!hasMoreData.value) return
    
    loading.value = true
    
    const response = await getCheckinList(courseId.value, {
      page: currentPage.value,
      size: pageSize.value,
      sort: [
        {
          field: "checkinStartTime",
          direction: "DESC"
        }
      ],
      filters: {}
    } as PageQueryParams)
    
    if (response && response.code === 200) {
      const newItems = response.data.items || []
      
      if (refresh) {
        checkinList.value = newItems
      } else {
        checkinList.value = [...checkinList.value, ...newItems]
      }
      
      hasMoreData.value = newItems.length === pageSize.value
      currentPage.value++
    }
  } catch (e) {
    console.error('获取签到任务列表失败:', e)
    uni.showToast({
      title: '获取签到列表失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 切换标签
function switchTab(tab: string) {
  activeTab.value = tab
  
  if (tab === 'checkins' && checkinList.value.length === 0) {
    loadCheckinList(true)
  }
}

// 下拉刷新
function onRefresh() {
  if (activeTab.value === 'info') {
    loadCourseDetail()
  } else if (activeTab.value === 'checkins') {
    loadCheckinList(true)
  }
}

// 获取签到类型显示文本
function getCheckinTypeText(type: CheckInType) {
  switch (type) {
    case CheckInType.QR_CODE:
      return '二维码签到'
    case CheckInType.LOCATION:
      return '位置签到'
    case CheckInType.WIFI:
      return 'WiFi签到'
    default:
      return '未知类型'
  }
}

// 格式化日期时间显示
function formatDateTime(dateTimeStr: string) {
  if (!dateTimeStr) return ''
  
  const date = new Date(dateTimeStr)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 计算签到状态
function getCheckinStatus(checkin: any) {
  if (!checkin) return ''
  
  const now = new Date().getTime()
  const startTime = new Date(checkin.checkinStartTime).getTime()
  const endTime = new Date(checkin.checkinEndTime).getTime()
  
  if (now < startTime) {
    return 'not-started'
  } else if (now > endTime) {
    return 'ended'
  } else {
    return 'in-progress'
  }
}

// 导航到创建签到页面
function navigateToCreateCheckin() {
  uni.navigateTo({
    url: `/pages/create-checkin/index?courseId=${courseId.value}`
  })
}

// 导航到签到详情页面
function navigateToCheckinDetail(checkinId: string) {
  uni.navigateTo({
    url: `/pages/checkin-detail/index?id=${checkinId}&courseId=${courseId.value}`
  })
}

// 导航到课程统计页面
function navigateToCourseStatistics() {
  uni.navigateTo({
    url: `/pages/course-statistics/index?courseId=${courseId.value}`
  })
}

// 复制课程码
function copyCourseCode() {
  if (!courseDetail.value.courseCode) {
    uni.showToast({
      title: '课程码不存在',
      icon: 'none'
    })
    return
  }
  
  uni.setClipboardData({
    data: courseDetail.value.courseCode,
    success: () => {
      uni.showToast({
        title: '课程码已复制',
        icon: 'success'
      })
    }
  })
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <!-- @ts-ignore -->
  <view class="container">
    <!-- 自定义导航栏 -->
    <wd-navbar :title="courseDetail.name || '课程详情'" left-text="返回" @click-left="goBack" />
    
    <!-- 加载状态 -->
    <!-- @ts-ignore -->
    <view v-if="loading && !courseDetail.id" class="loading-container">
      <wd-loading color="#ffffff" size="60px" />
      <!-- @ts-ignore -->
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 内容区域 -->
    <template v-else>
      <scroll-view
        scroll-y
        class="page-scroll"
        refresher-enabled
        @refresherrefresh="onRefresh"
      >
        <!-- @ts-ignore -->
        <view class="content-wrapper">
          <!-- 课程基本信息卡片 -->
          <!-- @ts-ignore -->
          <view class="course-header-card">
            <!-- @ts-ignore -->
            <view class="course-title-container">
              <!-- @ts-ignore -->
              <text class="course-title">{{ courseDetail.name }}</text>
              <!-- @ts-ignore -->
              <view 
                class="course-status" 
                :class="`status-${courseDetail.status?.toLowerCase() || 'active'}`"
              >
                {{ courseDetail.status === 'ACTIVE' ? '进行中' : courseDetail.status === 'COMPLETED' ? '已结束' : '未开始' }}
              </view>
            </view>
            
            <!-- @ts-ignore -->
            <view class="course-subtitle">
              <!-- @ts-ignore -->
              <text>{{ courseDetail.description || '暂无课程描述' }}</text>
            </view>
            
            <!-- @ts-ignore -->
            <view class="course-meta-info">
              <!-- @ts-ignore -->
              <view class="info-item">
                <wd-icon name="classroom" size="36rpx" color="#6a11cb" />
                <!-- @ts-ignore -->
                <text>{{ courseDetail.creatorFullName || '未知' }}</text>
              </view>
              
              <!-- @ts-ignore -->
              <view class="info-item">
                <wd-icon name="person" size="36rpx" color="#6a11cb" />
                <!-- @ts-ignore -->
                <text>{{ courseDetail.memberCount || 0 }}人</text>
              </view>
              
              <!-- @ts-ignore -->
              <view v-if="isTeacher" class="course-code-container" @click="copyCourseCode">
                <!-- @ts-ignore -->
                <text class="course-code-label">课程码:</text>
                <!-- @ts-ignore -->
                <text class="course-code">{{ courseDetail.courseCode || '- - -' }}</text>
                <wd-icon name="copy" size="30rpx" color="#6a11cb" />
              </view>
            </view>
          </view>
          
          <!-- 标签栏 -->
          <!-- @ts-ignore -->
          <view class="tabs-container">
            <wd-tabs v-model="activeTab" sticky>
              <wd-tab title="课程信息" name="info" />
              <wd-tab title="签到任务" name="checkins" />
              <wd-tab title="课程成员" name="members" />
            </wd-tabs>
          </view>
          
          <!-- 标签内容区域 -->
          <!-- @ts-ignore -->
          <view class="tab-content">
            <!-- 课程信息标签内容 -->
            <!-- @ts-ignore -->
            <view v-if="activeTab === 'info'" class="info-content">
              <!-- 基本信息卡片 -->
              <!-- @ts-ignore -->
              <view class="info-card">
                <!-- @ts-ignore -->
                <view class="card-title">
                  <wd-icon name="info" size="40rpx" color="#6a11cb" />
                  <!-- @ts-ignore -->
                  <text>基本信息</text>
                </view>
                
                <!-- @ts-ignore -->
                <view class="info-list">
                  <!-- @ts-ignore -->
                  <view class="info-row">
                    <!-- @ts-ignore -->
                    <text class="info-label">开始时间</text>
                    <!-- @ts-ignore -->
                    <text class="info-value">{{ formatDateTime(courseDetail.startDate) || '未设置' }}</text>
                  </view>
                  
                  <!-- @ts-ignore -->
                  <view class="info-row">
                    <!-- @ts-ignore -->
                    <text class="info-label">结束时间</text>
                    <!-- @ts-ignore -->
                    <text class="info-value">{{ formatDateTime(courseDetail.endDate) || '未设置' }}</text>
                  </view>
                  
                  <!-- @ts-ignore -->
                  <view class="info-row">
                    <!-- @ts-ignore -->
                    <text class="info-label">上课地点</text>
                    <!-- @ts-ignore -->
                    <text class="info-value">{{ courseDetail.location || '未设置' }}</text>
                  </view>
                  
                  <!-- @ts-ignore -->
                  <view class="info-row">
                    <!-- @ts-ignore -->
                    <text class="info-label">创建时间</text>
                    <!-- @ts-ignore -->
                    <text class="info-value">{{ formatDateTime(courseDetail.createdAt) || '未知' }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 教师操作区 -->
              <!-- @ts-ignore -->
              <view v-if="isTeacher" class="teacher-actions">
                <wd-button type="info" block @click="navigateToCreateCheckin">创建签到任务</wd-button>
                <wd-button plain block style="margin-top: 20rpx;" @click="navigateToCourseStatistics">查看考勤统计</wd-button>
              </view>
            </view>
            
            <!-- 签到任务标签内容 -->
            <!-- @ts-ignore -->
            <view v-else-if="activeTab === 'checkins'" class="checkins-content">
              <!-- 签到列表 -->
              <!-- @ts-ignore -->
              <view v-if="checkinList.length > 0" class="checkin-list">
                <!-- @ts-ignore -->
                <view
                  v-for="(checkin, index) in checkinList"
                  :key="checkin.id"
                  class="checkin-card"
                  @click="navigateToCheckinDetail(checkin.id)"
                >
                  <!-- @ts-ignore -->
                  <view class="checkin-header">
                    <!-- @ts-ignore -->
                    <view class="checkin-info">
                      <!-- @ts-ignore -->
                      <text class="checkin-name">{{ checkin.name }}</text>
                      <!-- @ts-ignore -->
                      <text class="checkin-time">{{ formatDateTime(checkin.checkinStartTime) }}</text>
                    </view>
                    
                    <!-- @ts-ignore -->
                    <view class="checkin-status" :class="`status-${getCheckinStatus(checkin).toLowerCase()}`">
                      {{ getCheckinStatus(checkin) }}
                    </view>
                  </view>
                  
                  <!-- @ts-ignore -->
                  <view class="checkin-content">
                    <!-- @ts-ignore -->
                    <view class="checkin-type">
                      <wd-tag type="primary" size="small">{{ getCheckinTypeText(checkin.checkinType) }}</wd-tag>
                    </view>
                    
                    <!-- @ts-ignore -->
                    <view class="checkin-stats">
                      <!-- @ts-ignore -->
                      <text>已签到: {{ checkin.attendCount || 0 }}人</text>
                      <!-- @ts-ignore -->
                      <text>总人数: {{ checkin.totalCount || 0 }}人</text>
                    </view>
                  </view>
                </view>
                
                <!-- 加载更多 -->
                <!-- @ts-ignore -->
                <view v-if="hasMoreData" class="load-more" @click="loadCheckinList">
                  <!-- @ts-ignore -->
                  <text>加载更多</text>
                </view>
                <!-- @ts-ignore -->
                <view v-else class="no-more">
                  <!-- @ts-ignore -->
                  <text>—— 已经到底了 ——</text>
                </view>
              </view>
              
              <!-- 空状态 -->
              <!-- @ts-ignore -->
              <view v-else class="empty-state">
                <wd-icon name="task" size="120rpx" color="#c0c4cc" />
                <!-- @ts-ignore -->
                <text class="empty-text">暂无签到任务</text>
                
                <!-- @ts-ignore -->
                <view v-if="isTeacher" class="empty-action">
                  <wd-button type="info" @click="navigateToCreateCheckin">创建第一个签到任务</wd-button>
                </view>
              </view>
            </view>
            
            <!-- 课程成员标签内容 -->
            <!-- @ts-ignore -->
            <view v-else class="members-content">
              <!-- 成员列表（待实现）-->
              <!-- @ts-ignore -->
              <view class="empty-state">
                <wd-icon name="person" size="120rpx" color="#c0c4cc" />
                <!-- @ts-ignore -->
                <text class="empty-text">成员列表功能开发中</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  
  .loading-text {
    margin-top: 30rpx;
    color: #fff;
    font-size: 28rpx;
  }
}

.page-scroll {
  height: calc(100vh - 44px);
}

.content-wrapper {
  padding: 30rpx;
  padding-bottom: 60rpx;
}

/* 课程头部卡片 */
.course-header-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  
  .course-title-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .course-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
    
    .course-status {
      font-size: 24rpx;
      color: #fff;
      padding: 4rpx 16rpx;
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
    }
  }
  
  .course-subtitle {
    margin-bottom: 20rpx;
    
    text {
      font-size: 28rpx;
      color: #666;
    }
  }
  
  .course-meta-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    
    .info-item {
      display: flex;
      align-items: center;
      margin-right: 30rpx;
      margin-bottom: 10rpx;
      
      text {
        font-size: 26rpx;
        color: #555;
        margin-left: 10rpx;
      }
    }
    
    .course-code-container {
      display: flex;
      align-items: center;
      background-color: rgba(106, 17, 203, 0.05);
      padding: 8rpx 16rpx;
      border-radius: 8rpx;
      margin-left: auto;
      
      .course-code-label {
        font-size: 24rpx;
        color: #666;
        margin-right: 8rpx;
      }
      
      .course-code {
        font-size: 24rpx;
        font-weight: bold;
        color: #6a11cb;
        margin-right: 8rpx;
      }
    }
  }
}

/* 标签栏 */
.tabs-container {
  margin-bottom: 20rpx;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  border-radius: 16rpx;
  overflow: hidden;
}

/* 标签内容区 */
.tab-content {
  padding-bottom: 40rpx;
}

/* 课程信息内容 */
.info-content {
  .info-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
    
    .card-title {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
      padding-bottom: 20rpx;
      border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
      
      text {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-left: 16rpx;
      }
    }
    
    .info-list {
      .info-row {
        display: flex;
        margin-bottom: 16rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .info-label {
          width: 160rpx;
          font-size: 28rpx;
          color: #666;
        }
        
        .info-value {
          flex: 1;
          font-size: 28rpx;
          color: #333;
        }
      }
    }
  }
  
  .teacher-actions {
    margin-top: 40rpx;
  }
}

/* 签到列表内容 */
.checkins-content {
  .checkin-list {
    margin-bottom: 40rpx;
  }
  
  .checkin-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
    
    .checkin-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16rpx;
      
      .checkin-info {
        .checkin-name {
          display: block;
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .checkin-time {
          font-size: 24rpx;
          color: #666;
        }
      }
      
      .checkin-status {
        font-size: 24rpx;
        color: #fff;
        padding: 4rpx 16rpx;
        border-radius: 20rpx;
        
        &.status-in-progress {
          background: #52c41a;
        }
        
        &.status-ended {
          background: #8c8c8c;
        }
        
        &.status-not-started {
          background: #faad14;
        }
      }
    }
    
    .checkin-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .checkin-stats {
        text-align: right;
        
        text {
          display: block;
          font-size: 24rpx;
          color: #666;
          
          &:first-child {
            color: #6a11cb;
            font-weight: bold;
          }
        }
      }
    }
  }
  
  .load-more, .no-more {
    text-align: center;
    padding: 30rpx 0;
    
    text {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  
  .empty-text {
    margin: 30rpx 0;
    font-size: 28rpx;
    color: #fff;
  }
  
  .empty-action {
    margin-top: 20rpx;
  }
}
</style>

<route lang="json">
{
  "style": {
    "navigationBarTitleText": "课程详情",
    "navigationStyle": "custom"
  }
}
</route> 