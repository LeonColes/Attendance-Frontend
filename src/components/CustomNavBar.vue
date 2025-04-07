<script lang="ts" setup>
/**
 * 自定义导航栏组件
 *
 * 特性：
 * 1. 支持滚动时渐变效果：从透明到有背景色
 * 2. 自动适配状态栏高度和安全区域
 * 3. 支持自定义背景色、标题色、返回按钮等
 * 4. 内置监听页面滚动事件，无需页面额外处理
 *
 * 使用方式：
 * <CustomNavBar
 *   title="页面标题"
 *   @back="handleBack"
 * />
 *
 * 注意：需要在main.ts中添加全局mixin实现自动滚动监听
 */

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// 组件属性定义
const props = defineProps({
  // 标题
  title: {
    type: String,
    default: '',
  },
  // 背景颜色（初始状态）
  backgroundColor: {
    type: String,
    default: '#6a11cb', // 默认导航栏背景颜色
  },
  // 滚动时的背景颜色
  scrolledBackgroundColor: {
    type: String,
    default: '#6a11cb', // 滚动时的导航栏背景颜色
  },
  // 标题颜色
  titleColor: {
    type: String,
    default: '#ffffff', // 默认白色
  },
  // 图标颜色
  iconColor: {
    type: String,
    default: '#ffffff', // 默认白色
  },
  // 是否启用滚动渐变效果
  enableScrollEffect: {
    type: Boolean,
    default: true, // 默认启用滚动渐变效果
  },
  // 是否显示返回按钮
  showBackButton: {
    type: Boolean,
    default: true,
  },
  // 模糊效果强度
  blurStrength: {
    type: Number,
    default: 10, // 默认10px
  },
  // 是否固定在顶部
  fixed: {
    type: Boolean,
    default: true,
  },
  // 是否在滚动时显示阴影
  showShadowOnScroll: {
    type: Boolean,
    default: true,
  },
  // 滚动触发阈值
  scrollThreshold: {
    type: Number,
    default: 100, // 默认100px
  },
})

// 事件
const emit = defineEmits(['back', 'right-action'])

// 设备信息相关
const statusBarHeight = ref(0)
const navBarHeight = ref(90)
const safeAreaInsetTop = ref(0)

// 滚动相关
const scrollTop = ref(0)
const headerOpacity = computed(() => {
  if (!props.enableScrollEffect)
    return 1

  // 确定透明度变化的阈值
  const threshold = props.scrollThreshold
  if (scrollTop.value <= 0)
    return 0
  if (scrollTop.value >= threshold)
    return 1
  return scrollTop.value / threshold
})

// 计算背景颜色
const navBarBackgroundColor = computed(() => {
  if (!props.enableScrollEffect)
    return props.backgroundColor

  if (headerOpacity.value <= 0)
    return props.backgroundColor
  if (headerOpacity.value >= 1)
    return props.scrolledBackgroundColor

  // 混合颜色
  return props.scrolledBackgroundColor
})

// 计算模糊效果
const backdropFilterBlur = computed(() => {
  if (!props.enableScrollEffect || headerOpacity.value <= 0)
    return 'none'

  return `blur(${headerOpacity.value * props.blurStrength}px)`
})

// 计算阴影
const boxShadow = computed(() => {
  if (!props.showShadowOnScroll || headerOpacity.value <= 0)
    return 'none'

  const shadowOpacity = headerOpacity.value * 0.2 // 最大0.2的阴影透明度
  return `0 2px 10px rgba(0, 0, 0, ${shadowOpacity})`
})

// 页面滚动事件处理
function onPageScroll(e: any) {
  if (props.enableScrollEffect) {
    scrollTop.value = e.scrollTop || 0
  }
}

// 处理返回按钮点击
function handleBack() {
  emit('back')
}

// 处理右侧按钮点击
function handleRightAction() {
  emit('right-action')
}

// 获取设备信息并监听滚动事件
onMounted(() => {
  try {
    // 使用新API替代已弃用的getSystemInfoSync
    let sysInfo
    // 优先使用新API
    if (typeof uni.getWindowInfo === 'function') {
      const windowInfo = uni.getWindowInfo()
      const deviceInfo = uni.getDeviceInfo()
      sysInfo = {
        ...windowInfo,
        ...deviceInfo,
        statusBarHeight: windowInfo.statusBarHeight || 20,
        safeArea: windowInfo.safeAreaInsets
          ? {
              top: windowInfo.safeAreaInsets.top,
              bottom: windowInfo.safeAreaInsets.bottom,
              left: windowInfo.safeAreaInsets.left,
              right: windowInfo.safeAreaInsets.right,
            }
          : undefined,
      }
    }
    else {
      // 兼容旧版本
      sysInfo = uni.getSystemInfoSync()
    }

    // 状态栏高度
    statusBarHeight.value = sysInfo.statusBarHeight || 20
    // 安全区域顶部高度
    if (sysInfo.safeArea) {
      safeAreaInsetTop.value = sysInfo.safeArea.top
    }
    // 导航栏总高度 = 状态栏高度 + 固定高度(44px)
    navBarHeight.value = statusBarHeight.value + 44
  }
  catch (error) {
    console.error('获取设备信息失败', error)
    // 使用默认值
    statusBarHeight.value = 20
    navBarHeight.value = 64
  }

  // 监听滚动事件
  uni.$on('page-scroll', onPageScroll)
})

// 组件销毁前取消监听
onBeforeUnmount(() => {
  uni.$off('page-scroll', onPageScroll)
})

defineExpose({
  navBarHeight,
})
</script>

<template>
  <view
    class="custom-nav-bar"
    :class="{ 'is-fixed': fixed }"
    :style="{
      height: `${navBarHeight}px`,
      backgroundColor: navBarBackgroundColor,
      backdropFilter: backdropFilterBlur,
      boxShadow,
    }"
  >
    <view class="nav-content" :style="{ paddingTop: `${statusBarHeight}px` }">
      <view v-if="showBackButton" class="left-area" @click="handleBack">
        <wd-icon name="arrow-left" size="44rpx" :color="iconColor" />
      </view>
      <view v-else class="left-area" />

      <view class="title-area" :style="{ color: titleColor }">
        {{ title }}
      </view>

      <view class="right-area" @click="handleRightAction">
        <slot name="right">
          <!-- 默认为空区域，可通过插槽自定义 -->
        </slot>
      </view>
    </view>
  </view>

  <!-- 导航栏占位，防止内容被固定导航栏遮挡 -->
  <view v-if="fixed" class="nav-placeholder" :style="{ height: `${navBarHeight}px` }" />
</template>

<style lang="scss" scoped>
.custom-nav-bar {
  width: 100%;
  z-index: 1000;
  transition: background-color 0.3s, backdrop-filter 0.3s, box-shadow 0.3s;

  &.is-fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 30rpx;
}

.left-area {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 44px;
}

.title-area {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 20rpx;
}

.right-area {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 44px;
}
</style>
