/*
 * @Author: weisheng
 * @Date: 2024-11-01 11:44:38
 * @LastEditTime: 2025-01-13 17:00:24
 * @LastEditors: 810505339
 * @Description:
 * @FilePath: \wot-demo\pages.config.ts
 * 记得注释
 */
import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'

export default defineUniPages({
  pages: [],
  globalStyle: {
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff',
    navigationStyle: 'default',
  },
  tabBar: {
    height: '0',
    color: '#bfbfbf',
    selectedColor: '#0165FF',
    list: [{
      pagePath: 'pages/index',
      text: '首页',
    }, {
      pagePath: 'pages/my/index',
      text: '我的',
    }],
  },
})
