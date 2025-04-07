<!--
 * @Author: weisheng
 * @Date: 2025-04-06 10:00:00
 * @LastEditTime: 2025-04-13 14:30:00
 * @LastEditors: weisheng
 * @Description: 应用主入口
 * @FilePath: \wot-demo\src\App.vue
 * 记得注释
-->
<script lang="ts" setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import CustomNavBar from './components/CustomNavBar.vue'

onLaunch(() => {
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<template>
  <view>
    <router-view />
  </view>
</template>

<style lang="scss">
@import './uni.scss';

/* 全局样式 */
page {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #333;
  background-color: #f5f7fa;
}

/* 去掉所有元素的默认外边距 */
view, text, navigator, button, image {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 超出文本省略号 */
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 多行文本省略号 */
.multi-ellipsis-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
