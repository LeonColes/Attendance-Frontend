<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useUserStore } from '@/store/user'
import CustomNavBar from '@/components/CustomNavBar.vue'
import { exportAttendanceData, getAttendanceRecords } from '@/api/attendance'
import { getCourseDetails } from '@/api/course'

// 用户信息
const userStore = useUserStore()
const isTeacher = computed(() => userStore.user?.role === 'teacher')

// 页面参数
const courseId = ref<string>('')
const course = ref<any>(null)

// 页面状态
const loading = ref(false)
const exportLoading = ref(false)
const currentTab = ref<'all' | 'present' | 'absent' | 'late'>('all')
const pageNumber = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const attendanceRecords = ref<any[]>([])
const attendanceStats = ref<{
  total: number
  present: number
  absent: number
  late: number
  leaveEarly: number
  leave: number
} | null>(null)

// 初始化页面数据
onLoad((options: any) => {
  if (options.courseId) {
    courseId.value = options.courseId
    loadCourseDetails()
    loadAttendanceRecords()
  }
  else {
    uni.showToast({
      title: '无效的课程ID',
      icon: 'error',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

// 加载课程详情
async function loadCourseDetails() {
  try {
    const res = await getCourseDetails(courseId.value)
    course.value = res.data
  }
  catch (error) {
    console.error('获取课程详情失败', error)
    uni.showToast({
      title: '获取课程详情失败',
      icon: 'error',
    })
  }
}

// 加载考勤记录
async function loadAttendanceRecords(refresh = false) {
  try {
    if (refresh) {
      pageNumber.value = 1
    }

    loading.value = true

    const params: any = {
      courseId: courseId.value,
      page: pageNumber.value,
      limit: pageSize.value,
    }

    // 根据当前标签筛选
    if (currentTab.value !== 'all') {
      params.status = currentTab.value
    }

    const res = await getAttendanceRecords(params)

    if (refresh) {
      attendanceRecords.value = res.data.records || []
    }
    else {
      attendanceRecords.value = [...attendanceRecords.value, ...(res.data.records || [])]
    }

    totalItems.value = res.data.total || 0
    attendanceStats.value = res.data.stats || null
  }
  catch (error) {
    console.error('获取考勤记录失败', error)
    uni.showToast({
      title: '获取考勤记录失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false

    // 停止下拉刷新
    if (refresh) {
      uni.stopPullDownRefresh()
    }
  }
}

// 下拉刷新
function onPullDownRefresh() {
  loadAttendanceRecords(true)
}

// 上拉加载更多
function onReachBottom() {
  if (attendanceRecords.value.length < totalItems.value) {
    pageNumber.value++
    loadAttendanceRecords()
  }
}

// 切换标签
function changeTab(tab: 'all' | 'present' | 'absent' | 'late') {
  if (currentTab.value !== tab) {
    currentTab.value = tab
    loadAttendanceRecords(true)
  }
}

// 导出考勤数据
async function exportData() {
  try {
    exportLoading.value = true

    const res = await exportAttendanceData({
      courseId: courseId.value,
    })

    // 存储下载的文件
    const filePath = `${uni.env.USER_DATA_PATH}/考勤记录_${course.value?.name || courseId.value}.xlsx`

    uni.getFileSystemManager().writeFile({
      filePath,
      data: res,
      encoding: 'binary',
      success: () => {
        // 保存文件到本地
        uni.saveFile({
          tempFilePath: filePath,
          success: (res) => {
            const savedFilePath = res.savedFilePath

            // 打开文件
            uni.openDocument({
              filePath: savedFilePath,
              showMenu: true,
              success: () => {
                uni.showToast({
                  title: '导出成功',
                  icon: 'success',
                })
              },
              fail: () => {
                uni.showToast({
                  title: '文件打开失败',
                  icon: 'none',
                })
              },
            })
          },
          fail: () => {
            uni.showToast({
              title: '文件保存失败',
              icon: 'none',
            })
          },
        })
      },
      fail: () => {
        uni.showToast({
          title: '文件保存失败',
          icon: 'none',
        })
      },
    })
  }
  catch (error) {
    console.error('导出考勤数据失败', error)
    uni.showToast({
      title: '导出考勤数据失败',
      icon: 'error',
    })
  }
  finally {
    exportLoading.value = false
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page-container">
    <!-- 导航栏 -->
    <CustomNavBar :title="course?.name || '考勤记录'" @back="goBack" />

    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 课程信息 -->
      <view v-if="course" class="course-info">
        <view class="course-name">
          {{ course.name }}
        </view>
        <view class="course-code">
          {{ course.code }}
        </view>
        <view class="course-time">
          {{ course.schedule }}
        </view>
      </view>

      <!-- 考勤统计 -->
      <view v-if="attendanceStats" class="stats-card">
        <view class="stats-title">
          考勤统计
        </view>
        <view class="stats-content">
          <view class="stats-item">
            <view class="stats-value">
              {{ attendanceStats.total || 0 }}
            </view>
            <view class="stats-label">
              总计
            </view>
          </view>
          <view class="stats-item">
            <view class="stats-value">
              {{ attendanceStats.present || 0 }}
            </view>
            <view class="stats-label">
              出勤
            </view>
          </view>
          <view class="stats-item">
            <view class="stats-value">
              {{ attendanceStats.absent || 0 }}
            </view>
            <view class="stats-label">
              缺勤
            </view>
          </view>
          <view class="stats-item">
            <view class="stats-value">
              {{ attendanceStats.late || 0 }}
            </view>
            <view class="stats-label">
              迟到
            </view>
          </view>
          <view class="stats-item">
            <view class="stats-value">
              {{ attendanceStats.leaveEarly || 0 }}
            </view>
            <view class="stats-label">
              早退
            </view>
          </view>
          <view class="stats-item">
            <view class="stats-value">
              {{ attendanceStats.leave || 0 }}
            </view>
            <view class="stats-label">
              请假
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view v-if="isTeacher" class="action-bar">
        <wd-button type="primary" :loading="exportLoading" @click="exportData">
          <wd-icon name="download" size="28rpx" /> 导出考勤数据
        </wd-button>
      </view>

      <!-- 标签页 -->
      <view class="tabs">
        <view
          class="tab-item"
          :class="{ active: currentTab === 'all' }"
          @click="changeTab('all')"
        >
          全部
        </view>
        <view
          class="tab-item"
          :class="{ active: currentTab === 'present' }"
          @click="changeTab('present')"
        >
          出勤
        </view>
        <view
          class="tab-item"
          :class="{ active: currentTab === 'absent' }"
          @click="changeTab('absent')"
        >
          缺勤
        </view>
        <view
          class="tab-item"
          :class="{ active: currentTab === 'late' }"
          @click="changeTab('late')"
        >
          迟到
        </view>
      </view>

      <!-- 考勤记录列表 -->
      <view class="records-list">
        <!-- 正在加载 -->
        <view v-if="loading && pageNumber === 1" class="loading-container">
          <wd-loading color="#6a11cb" size="60px" />
          <text class="loading-text">
            正在加载...
          </text>
        </view>

        <!-- 记录列表 -->
        <block v-else>
          <view
            v-for="(record, index) in attendanceRecords"
            :key="index"
            class="record-item"
          >
            <view class="student-info">
              <view class="avatar">
                {{ record.studentName?.substring(0, 1) || 'S' }}
              </view>
              <view class="info">
                <view class="name">
                  {{ record.studentName }}
                </view>
                <view class="id">
                  {{ record.studentId }}
                </view>
              </view>
            </view>

            <view class="attendance-info">
              <view
                class="status"
                :class="{
                  'status-present': record.status === 'present',
                  'status-absent': record.status === 'absent',
                  'status-late': record.status === 'late',
                  'status-leave-early': record.status === 'leaveEarly',
                  'status-leave': record.status === 'leave',
                }"
              >
                {{
                  record.status === 'present' ? '出勤'
                  : record.status === 'absent' ? '缺勤'
                    : record.status === 'late' ? '迟到'
                      : record.status === 'leaveEarly' ? '早退'
                        : record.status === 'leave' ? '请假' : '未知'
                }}
              </view>
              <view class="time">
                {{ record.checkInTime || '未签到' }}
              </view>
              <view v-if="record.checkInMethod" class="method">
                {{
                  record.checkInMethod === 'qrcode' ? '二维码签到'
                  : record.checkInMethod === 'location' ? '位置签到'
                    : record.checkInMethod === 'bluetooth' ? '蓝牙签到'
                      : record.checkInMethod === 'wifi' ? 'Wi-Fi签到'
                        : record.checkInMethod === 'face' ? '人脸签到'
                          : record.checkInMethod === 'manual' ? '手动签到' : '其他方式'
                }}
              </view>
            </view>
          </view>

          <!-- 加载更多 -->
          <view v-if="loading" class="loading-more">
            <wd-loading color="#6a11cb" size="40rpx" />
            <text>加载更多...</text>
          </view>

          <!-- 无数据 -->
          <view v-if="!loading && attendanceRecords.length === 0" class="empty-data">
            <wd-icon name="file-text" size="120rpx" color="#cccccc" />
            <text>暂无考勤记录</text>
          </view>
        </block>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  padding: 30rpx;
}

.course-info {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .course-name {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }

  .course-code {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 10rpx;
  }

  .course-time {
    font-size: 28rpx;
    color: #666;
  }
}

.stats-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .stats-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }

  .stats-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    .stats-item {
      width: 33%;
      text-align: center;
      margin-bottom: 20rpx;

      .stats-value {
        font-size: 40rpx;
        font-weight: bold;
        color: #6a11cb;
        margin-bottom: 5rpx;
      }

      .stats-label {
        font-size: 28rpx;
        color: #666;
      }
    }
  }
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 30rpx;

  .wd-button {
    display: flex;
    align-items: center;

    .wd-icon {
      margin-right: 10rpx;
    }
  }
}

.tabs {
  display: flex;
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .tab-item {
    flex: 1;
    text-align: center;
    font-size: 28rpx;
    color: #666;
    padding: 24rpx 0;
    position: relative;

    &.active {
      color: #6a11cb;
      font-weight: bold;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background-color: #6a11cb;
        border-radius: 3rpx;
      }
    }
  }
}

.records-list {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  min-height: 400rpx;

  .record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .student-info {
      display: flex;
      align-items: center;

      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 40rpx;
        background-color: #6a11cb;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        font-weight: bold;
        margin-right: 20rpx;
      }

      .info {
        .name {
          font-size: 32rpx;
          color: #333;
          margin-bottom: 5rpx;
        }

        .id {
          font-size: 28rpx;
          color: #999;
        }
      }
    }

    .attendance-info {
      text-align: right;

      .status {
        font-size: 28rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
        border-radius: 10rpx;
        padding: 6rpx 16rpx;
        display: inline-block;

        &.status-present {
          background-color: rgba(82, 196, 26, 0.1);
          color: #52c41a;
        }

        &.status-absent {
          background-color: rgba(245, 34, 45, 0.1);
          color: #f5222d;
        }

        &.status-late {
          background-color: rgba(250, 140, 22, 0.1);
          color: #fa8c16;
        }

        &.status-leave-early {
          background-color: rgba(24, 144, 255, 0.1);
          color: #1890ff;
        }

        &.status-leave {
          background-color: rgba(146, 84, 222, 0.1);
          color: #9254de;
        }
      }

      .time {
        font-size: 26rpx;
        color: #666;
        margin-bottom: 5rpx;
      }

      .method {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.loading-container, .empty-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;

  .loading-text, text {
    margin-top: 30rpx;
    font-size: 28rpx;
    color: #999;
  }
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx 0;

  text {
    margin-left: 20rpx;
    font-size: 28rpx;
    color: #999;
  }
}
</style>
