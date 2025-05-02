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
  globalStyle: {
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff',
    navigationStyle: 'default',
  },
  "pages": [
    {
      "path": "pages/index",
      "type": "home",
      "navigationBarTitleText": "课程考勤"
    },
    {
      "path": "pages/checkin-detail/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "签到详情"
      }
    },
    {
      "path": "pages/checkin-location/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "位置签到"
      }
    },
    {
      "path": "pages/checkin-qrcode/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "签到二维码"
      }
    },
    {
      "path": "pages/course-detail/index",
      "type": "page"
    },
    {
      "path": "pages/create-checkin/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "创建签到"
      }
    },
    {
      "path": "pages/create-course/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "创建课程"
      }
    },
    {
      "path": "pages/join-course/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "加入课程"
      }
    },
    {
      "path": "pages/location-checkin/index",
      "type": "page",
      "navigationBarTitleText": "位置签到"
    },
    {
      "path": "pages/login/index",
      "type": "page"
    },
    {
      "path": "pages/my/index",
      "type": "page",
      "layout": "tabbar",
      "name": "my",
      "style": {
        "navigationBarTitleText": "个人中心"
      }
    },
    {
      "path": "pages/register/index",
      "type": "page"
    },
    {
      "path": "pages/scanner/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "扫码签到"
      }
    }
  ],
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
