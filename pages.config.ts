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
      "path": "pages/checkin-qrcode/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "签到二维码"
      }
    },
    {
      "path": "pages/course-detail/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "课程详情"
      }
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
      "style": {
        "navigationBarTitleText": "位置签到"
      }
    },
    {
      "path": "pages/login/index",
      "type": "page",
      "style": {
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/register/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "注册"
      }
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
    backgroundColor: '#ffffff',
    list: [{
      pagePath: 'pages/index',
      text: '课程',
      iconPath: 'static/tabbar/course.png',
      selectedIconPath: 'static/tabbar/course-active.png',
    }, {
      pagePath: 'pages/settings/index',
      text: '设置',
      iconPath: 'static/tabbar/settings.png',
      selectedIconPath: 'static/tabbar/settings-active.png'
    }],
  },
  "subPackages": [],
  "darkmode": true,
  "themeLocation": "theme.json"
})
