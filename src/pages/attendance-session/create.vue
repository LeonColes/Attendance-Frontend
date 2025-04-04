<script lang="ts" setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
</script>

<template>
  <view class="page-container">
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <text>建设中...</text>
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
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
