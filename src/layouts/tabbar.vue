<!--
 * @Author: weisheng
 * @Date: 2024-11-01 12:31:47
 * @LastEditTime: 2024-11-14 19:02:06
 * @LastEditors: weisheng
 * @Description:
 * @FilePath: \wot-demo\src\layouts\tabbar.vue
 * 记得注释
-->
<template>
  <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
    <slot />
    <wd-notify />
    <wd-toast />
    <wd-message-box />
    <privacy-popup />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { useTheme } from '@/composables/theme/theme'

const { themeVars, theme } = useTheme()
</script>

<script lang="ts">
export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>
