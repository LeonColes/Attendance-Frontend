<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps({
  selected: {
    type: String,
    default: 'student',
  },
})

const emit = defineEmits(['update:selected'])

function selectRole(role: string) {
  emit('update:selected', role)
}
</script>

<template>
  <view class="role-selector-container">
    <view class="roles-wrapper">
      <view 
        class="role-card" 
        :class="{ 'active': props.selected === 'student' }"
        @click="selectRole('student')"
      >
        <view class="role-icon-wrapper">
          <wd-icon name="person" size="52rpx" class="role-icon" />
        </view>
        <view class="role-name">学生</view>
        <view class="role-description">加入课程、扫码签到、查看个人出勤记录</view>
        <view v-if="props.selected === 'student'" class="selected-indicator">
          <wd-icon name="check2" size="40rpx" color="#fff" />
        </view>
      </view>
      
      <view 
        class="role-card" 
        :class="{ 'active': props.selected === 'teacher' }"
        @click="selectRole('teacher')"
      >
        <view class="role-icon-wrapper">
          <wd-icon name="tutorial" size="52rpx" class="role-icon" />
        </view>
        <view class="role-name">教师</view>
        <view class="role-description">创建课程、发起签到、管理学生出勤数据</view>
        <view v-if="props.selected === 'teacher'" class="selected-indicator">
          <wd-icon name="check2" size="40rpx" color="#fff" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.role-selector-container {
  width: 100%;
  margin: 30rpx 0;
}

.roles-wrapper {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  width: 100%;
}

.role-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 30rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &.active {
    background-color: rgba(255, 255, 255, 1);
    box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.1);
    transform: translateY(-4rpx);
    border: 2rpx solid #ff6b00;
  }
}

.role-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #ff8800 0%, #ff6b00 100%);
  border-radius: 50%;
  margin-bottom: 20rpx;
}

.role-icon {
  color: #ffffff;
}

.role-name {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
  color: #333;
}

.role-description {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.selected-indicator {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 60rpx;
  height: 60rpx;
  background-color: #ff6b00;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style> 