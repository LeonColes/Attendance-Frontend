# 考勤管理系统API文档与前端设计需求

## 目录
1. [系统概述](#系统概述)
2. [用户角色与流程](#用户角色与流程)
3. [API接口详细说明](#api接口详细说明)
4. [接口关系流程图](#接口关系流程图)
5. [首页设计需求](#首页设计需求)
6. [UI/UX建议](#uiux建议)

## 系统概述

考勤管理系统是一个面向教育机构的智能考勤解决方案，支持多种签到方式（二维码、位置、WiFi），提供直观的数据统计和分析功能。系统分为教师端和学生端两大模块，通过JWT令牌进行身份验证和权限管理。

**核心功能**：
- 教师创建和管理课程
- 教师发起考勤任务
- 学生通过多种方式签到
- 实时统计与数据分析

## 用户角色与流程

### 教师角色流程
1. 登录系统
2. 查看/创建课程
3. 在课程中创建签到任务
4. 生成签到二维码并展示给学生
5. 实时查看签到情况和统计数据

### 学生角色流程
1. 登录系统
2. 查看已加入的课程
3. 通过二维码、位置或WiFi方式完成签到
4. 查看个人签到记录

## API接口详细说明

### 认证接口

#### 登录接口
- **URL:** `/auth/login`
- **方法:** `POST`
- **描述:** 用户登录获取JWT令牌
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "username": "teacher",
  "password": "password123"
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "userId": "7ec09936-ea6d-4a9a-826a-3921652cd50b",
    "username": "teacher",
    "fullName": "王老师",
    "role": "TEACHER"
  }
}
```

### 课程接口

#### 获取我的课程列表
- **URL:** `/courses/list`
- **方法:** `POST`
- **描述:** 获取当前用户相关的课程列表（教师查看创建的课程，学生查看加入的课程）
- **权限:** 所有已登录用户
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/courses/list' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "page": 0,
  "size": 10
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "totalItems": 2,
    "items": [
      {
        "id": "92864727-7591-4d4a-9ebb-f53a2a4acf96",
        "name": "计算机网络",
        "description": "计算机网络基础课程",
        "creatorId": "7ec09936-ea6d-4a9a-826a-3921652cd50b",
        "creatorFullName": "王老师",
        "code": "XYZ123",
        "status": "ACTIVE",
        "memberCount": 42,
        "startDate": "2025-03-01",
        "endDate": "2025-07-01"
      },
      {
        "id": "8b59174a-32e6-49ae-b2c3-02b8375eff48",
        "name": "数据结构",
        "description": "数据结构与算法分析",
        "creatorId": "7ec09936-ea6d-4a9a-826a-3921652cd50b",
        "creatorFullName": "王老师",
        "code": "ABC456",
        "status": "ACTIVE",
        "memberCount": 38,
        "startDate": "2025-03-01",
        "endDate": "2025-07-01"
      }
    ],
    "totalPages": 1,
    "currentPage": 0
  }
}
```

#### 创建课程（仅教师）
- **URL:** `/courses/create`
- **方法:** `POST`
- **描述:** 创建新课程
- **权限:** 教师或管理员
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/courses/create' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "高等数学",
  "description": "微积分与线性代数基础",
  "startDate": "2025-09-01",
  "endDate": "2026-01-15"
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "课程创建成功",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "高等数学",
    "description": "微积分与线性代数基础",
    "creatorId": "7ec09936-ea6d-4a9a-826a-3921652cd50b",
    "code": "DEF789",
    "status": "ACTIVE",
    "memberCount": 0,
    "startDate": "2025-09-01",
    "endDate": "2026-01-15"
  }
}
```

#### 加入课程（通过邀请码）
- **URL:** `/courses/members/join`
- **方法:** `POST`
- **描述:** 学生通过邀请码加入课程
- **权限:** 所有已登录用户
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/courses/members/join?code=DEF789' \
--header 'Authorization: Bearer {token}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "成功加入课程",
  "data": {
    "id": "5e8f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f8f",
    "userId": "8a6a3a18-268a-4496-9852-a2e5925604f7",
    "courseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "role": "STUDENT",
    "joinTime": "2025-04-10T10:15:30"
  }
}
```

### 签到任务接口

#### 创建签到任务（仅教师）
- **URL:** `/courses/attendance/create`
- **方法:** `POST`
- **描述:** 为课程创建新的签到任务
- **权限:** 教师或管理员
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/courses/attendance/create' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "courseId": "92864727-7591-4d4a-9ebb-f53a2a4acf96",
  "title": "第四次课签到",
  "description": "计算机网络第四次课签到",
  "startTime": "2025-04-12T14:00:00",
  "endTime": "2025-04-12T14:30:00",
  "checkInType": "QR_CODE",
  "verifyParams": {}
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "签到任务创建成功",
  "data": {
    "id": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
    "name": "第四次课签到",
    "description": "计算机网络第四次课签到",
    "type": "CHECKIN",
    "status": "ACTIVE",
    "checkinStartTime": "2025-04-12T14:00:00",
    "checkinEndTime": "2025-04-12T14:30:00",
    "checkinType": "QR_CODE",
    "parentCourseId": "92864727-7591-4d4a-9ebb-f53a2a4acf96"
  }
}
```

#### 获取签到任务列表
- **URL:** `/courses/attendance/list`
- **方法:** `POST`
- **描述:** 获取课程的签到任务列表（老师查看所有任务，学生查看自己的签到状态）
- **权限:** 所有已登录用户
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/courses/attendance/list?courseId=92864727-7591-4d4a-9ebb-f53a2a4acf96' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "page": 0,
  "size": 10
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "totalItems": 3,
    "items": [
      {
        "id": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
        "name": "第四次课签到",
        "description": "计算机网络第四次课签到",
        "creatorId": "7ec09936-ea6d-4a9a-826a-3921652cd50b",
        "type": "CHECKIN",
        "status": "ACTIVE",
        "checkinStartTime": "2025-04-12T14:00:00",
        "checkinEndTime": "2025-04-12T14:30:00",
        "checkinType": "QR_CODE",
        "personalStatus": "ABSENT",
        "displayStatus": "未签到"
      }
      // 其他签到任务...
    ],
    "totalPages": 1,
    "currentPage": 0
  }
}
```

#### 获取签到二维码（仅教师）
- **URL:** `/courses/attendance/qrcode`
- **方法:** `GET`
- **描述:** 获取签到任务的二维码图片
- **权限:** 签到任务创建者或管理员
- **Curl示例:**
```bash
curl --location --request GET 'http://localhost:8080/courses/attendance/qrcode?checkinId=d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8' \
--header 'Authorization: Bearer {token}' \
--output qrcode.png
```
- **成功响应:** 二维码图片数据（PNG格式）

### 签到记录接口

#### 提交签到（学生）
- **URL:** `/courses/attendance/check-in`
- **方法:** `POST`
- **描述:** 学生提交签到
- **权限:** 所有已登录用户
- **Curl示例 (二维码签到):**
```bash
curl --location --request POST 'http://localhost:8080/courses/attendance/check-in' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "checkinId": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
  "verifyMethod": "QR_CODE",
  "device": "Mobile/Chrome/Android",
  "verifyData": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8"
}'
```
- **Curl示例 (位置签到):**
```bash
curl --location --request POST 'http://localhost:8080/courses/attendance/check-in' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "checkinId": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
  "verifyMethod": "LOCATION",
  "location": "118.901,32.112",
  "device": "Mobile/Chrome/Android",
  "verifyData": "accuracy:15.2"
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "签到成功",
  "data": {
    "id": "e5f71d23-9b2a-4c89-b5e3-7f6a48c01234",
    "userId": "8a6a3a18-268a-4496-9852-a2e5925604f7",
    "courseId": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
    "status": "NORMAL",
    "checkInTime": "2025-04-12T14:05:23",
    "device": "Mobile/Chrome/Android",
    "location": null,
    "verifyMethod": "QR_CODE",
    "displayStatus": "已签到"
  }
}
```

#### 学生查看签到状态
- **URL:** `/courses/attendance/record/status`
- **方法:** `POST`
- **描述:** 学生查看自己在课程中的所有签到状态
- **权限:** 所有已登录用户
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/courses/attendance/record/status?courseId=92864727-7591-4d4a-9ebb-f53a2a4acf96' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "page": 0,
  "size": 10
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "totalItems": 3,
    "records": [
      {
        "checkinId": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
        "checkinName": "第四次课签到",
        "status": "NORMAL",
        "checkInTime": "2025-04-12T14:05:23",
        "startTime": "2025-04-12T14:00:00",
        "endTime": "2025-04-12T14:30:00",
        "checkinType": "QR_CODE",
        "displayStatus": "已签到"
      },
      {
        "checkinId": "9bfd110c-0e95-4272-bfc2-8e193f502318",
        "checkinName": "第三次课签到",
        "status": "LATE",
        "checkInTime": "2025-04-05T14:21:45",
        "startTime": "2025-04-05T14:00:00",
        "endTime": "2025-04-05T14:30:00",
        "checkinType": "QR_CODE",
        "displayStatus": "迟到"
      },
      {
        "checkinId": "4748f8b3-b80d-49a2-80e4-ba8059ec2a85",
        "checkinName": "第二次课签到",
        "status": "ABSENT",
        "checkInTime": null,
        "startTime": "2025-04-02T15:00:00",
        "endTime": "2025-04-02T15:30:00",
        "checkinType": "LOCATION",
        "displayStatus": "缺勤"
      }
    ],
    "totalPages": 1,
    "currentPage": 0,
    "courseInfo": {
      "id": "92864727-7591-4d4a-9ebb-f53a2a4acf96",
      "name": "计算机网络",
      "description": "计算机网络基础课程"
    },
    "personalStats": {
      "totalCheckins": 3,
      "attendedCount": 2,
      "normalCount": 1,
      "lateCount": 1,
      "absentCount": 1,
      "attendanceRate": 66.67
    }
  }
}
```

#### 教师查看签到记录列表
- **URL:** `/courses/attendance/record/list`
- **方法:** `POST`
- **描述:** 教师查看特定签到任务的所有学生签到记录
- **权限:** 签到任务创建者或管理员
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/courses/attendance/record/list?checkinId=d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "page": 0,
  "size": 10
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "totalItems": 4,
    "records": [
      {
        "userId": "8a6a3a18-268a-4496-9852-a2e5925604f7",
        "username": "student",
        "fullName": "李同学",
        "status": "NORMAL",
        "checkInTime": "2025-04-12T14:05:23",
        "device": "Mobile/Chrome/Android",
        "location": null
      },
      {
        "userId": "c44eb619-85c3-4250-be24-38d190418214",
        "username": "qian",
        "fullName": "钱同学",
        "status": "LATE",
        "checkInTime": "2025-04-12T14:25:12",
        "device": "Mobile/Safari/iOS",
        "location": null
      },
      {
        "userId": "d35c1a48-07ad-4ae9-8b6d-17d6cb8c667e",
        "username": "sun",
        "fullName": "孙同学",
        "status": "ABSENT",
        "checkInTime": null,
        "device": null,
        "location": null
      },
      {
        "userId": "f9eb3ea7-6247-4b46-b64d-6fef306fe523",
        "username": "zhao",
        "fullName": "赵同学",
        "status": "ABSENT",
        "checkInTime": null,
        "device": null,
        "location": null
      }
    ],
    "totalPages": 1,
    "currentPage": 0,
    "checkinInfo": {
      "id": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
      "name": "第四次课签到",
      "description": "计算机网络第四次课签到",
      "status": "ACTIVE",
      "checkinStartTime": "2025-04-12T14:00:00",
      "checkinEndTime": "2025-04-12T14:30:00"
    },
    "statistics": {
      "totalStudents": 4,
      "presentCount": 2,
      "absentCount": 2,
      "normalCount": 1,
      "lateCount": 1,
      "attendanceRate": 50
    }
  }
}
```

####
 教师查看签到统计数据
- **URL:** `/courses/attendance/record/statistics`
- **方法:** `POST`
- **描述:** 教师查看签到任务的统计数据
- **权限:** 签到任务创建者或管理员
- **Curl示例:**
```bash
curl --location --request POST 'http://localhost:8080/courses/attendance/record/statistics?checkinId=d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8' \
--header 'Authorization: Bearer {token}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "page": 0,
  "size": 10
}'
```
- **成功响应:**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "statistics": {
      "checkinId": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
      "title": "第四次课签到",
      "description": "计算机网络第四次课签到",
      "startTime": "2025-04-12T14:00:00",
      "endTime": "2025-04-12T14:30:00",
      "status": "ACTIVE",
      "checkinType": "QR_CODE",
      "totalStudents": 4,
      "presentCount": 2,
      "absentCount": 2,
      "normalCount": 1,
      "lateCount": 1,
      "attendanceRate": 50,
      "absentStudents": [
        {
          "userId": "d35c1a48-07ad-4ae9-8b6d-17d6cb8c667e",
          "username": "sun",
          "fullName": "孙同学"
        },
        {
          "userId": "f9eb3ea7-6247-4b46-b64d-6fef306fe523",
          "username": "zhao",
          "fullName": "赵同学"
        }
      ],
      "presentStudents": [
        {
          "userId": "8a6a3a18-268a-4496-9852-a2e5925604f7",
          "username": "student",
          "fullName": "李同学",
          "status": "NORMAL",
          "checkInTime": "2025-04-12T14:05:23"
        },
        {
          "userId": "c44eb619-85c3-4250-be24-38d190418214",
          "username": "qian",
          "fullName": "钱同学",
          "status": "LATE",
          "checkInTime": "2025-04-12T14:25:12"
        }
      ],
      "timeDistribution": {
        "0-5分钟": 1,
        "6-10分钟": 0,
        "11-15分钟": 0,
        "16-20分钟": 0,
        "21-30分钟": 1,
        "未签到": 2
      }
    },
    "checkinInfo": {
      "id": "d7a8fbc6-d428-4d1a-99b8-8a235f7c14a8",
      "name": "第四次课签到",
      "description": "计算机网络第四次课签到",
      "creatorId": "7ec09936-ea6d-4a9a-826a-3921652cd50b",
      "type": "CHECKIN",
      "status": "ACTIVE",
      "checkinStartTime": "2025-04-12T14:00:00",
      "checkinEndTime": "2025-04-12T14:30:00"
    }
  }
}
```

## 接口关系流程图

### 教师端流程图

```
登录 (/auth/login)
   │
   ▼
获取课程列表 (/courses/list)
   │
   ├─────────────────┐
   │                 │
   ▼                 ▼
创建新课程           选择已有课程
(/courses/create)     │
   │                 │
   │                 ▼
   │            查看签到任务列表 (/courses/attendance/list)
   │                 │
   │                 ├─────────────────┐
   │                 │                 │
   │                 ▼                 ▼
   │            创建新签到任务       选择已有签到任务
   │      (/courses/attendance/create)  │
   │                 │                 │
   │                 ▼                 ▼
   │            获取二维码          查看签到记录
   │    (/courses/attendance/qrcode)    │
   │                 │                 │
   │                 │                 ├────────────────┐
   │                 │                 │                │
   │                 │                 ▼                ▼
   │                 │         查看签到记录列表      查看签到统计
   │                 │  (/courses/attendance/record/list) │
   │                 │                                (/courses/attendance/record/statistics)
   │                 │
   ▼                 ▼
展示给学生加入      展示给学生签到
```

### 学生端流程图

```
登录/注册 (/auth/login)
     │
     ▼
获取已加入课程列表 (/courses/list)
     │
     ├────────────────┐
     │                │
     ▼                ▼
扫描二维码加入课程   选择已加入课程
(/courses/members/join) │
     │                │
     │                ▼
     │         查看课程签到任务 (/courses/attendance/list)
     │                │
     │                ├────────────────┐
     │                │                │
     │                ▼                ▼
     │         进行二维码签到       查看个人签到记录
     │    (/courses/attendance/check-in) │
     │                                (/courses/attendance/record/status)
     │
     ▼
 返回课程列表
```

### 签到流程详细图

```
教师                                                     学生
  │                                                       │
  ├─ 1. 创建签到任务                                      │
  │  (/courses/attendance/create)                         │
  │                                                       │
  ├─ 2. 获取签到二维码 ────────────────────────────────── │
  │  (/courses/attendance/qrcode)                         │
  │                                                       │
  ├─ 3. 展示二维码给学生 ─────────────────────────────────┼─→ 4. 扫描二维码
  │                                                       │
  │                                                       ├─ 5. 提交签到
  │                                                       │  (/courses/attendance/check-in)
  │                                                       │
  ├←─────────────────────────────────────────────────────┤
  │                                                       │
  ├─ 6. 查看签到记录 ─────────────────────────────────────┤
  │  (/courses/attendance/record/list)                    │
  │                                                       ├─ 7. 查看个人记录
  ├─ 8. 查看签到统计 ─────────────────────────────────────┤  (/courses/attendance/record/status)
  │  (/courses/attendance/record/statistics)              │
  │                                                       │
```

## 首页设计需求

### 教师端首页需求

1. **教师仪表盘**
   - 显示当前教师的个人信息
   - 教授课程数量统计
   - 最近的签到活动统计（今日、本周）
   - 学生出勤率概览

2. **课程卡片列表**
   - 每个课程显示为一个卡片
   - 卡片显示课程名称、简介、学生人数、最近一次签到时间
   - 卡片右上角显示签到活跃状态指示器
   - 新建课程按钮（浮动操作按钮）

3. **签到快捷操作**
   - "快速发起签到"功能（选择课程后一键创建签到任务）
   - 最近使用的签到任务模板
   - 当前活跃的签到任务提示

4. **数据统计卡片**
   - 总体出勤率图表
   - 各课程出勤率对比图表
   - 学生签到时间分布图表

5. **通知区域**
   - 显示最近的系统通知
   - 显示需要关注的学生出勤异常情况

### 学生端首页需求

1. **学生仪表盘**
   - 显示学生个人信息
   - 已加入课程数量
   - 个人出勤率统计
   - 待签到任务提醒

2. **课程卡片列表**
   - 每个课程显示为一个卡片
   - 卡片显示课程名称、教师姓名、时间信息
   - 当前活跃签到任务高亮显示
   - 扫描二维码加入课程按钮

3. **签到快捷功能**
   - 大型二维码扫描入口（醒目位置）
   - 位置签到快捷入口
   - WiFi签到快捷入口

4. **签到状态概览**
   - 个人签到统计图表（正常、迟到、缺勤）
   - 最近签到记录列表
   - 签到状态日历视图

5. **通知区域**
   - 显示待签到任务
   - 显示签到结果通知
   - 显示教师发送的课程通知

## UI/UX建议

### 教师端

1. **签到二维码展示页面**
   - 全屏显示二维码，增加可扫描性
   - 二维码周围添加课程和签到任务信息
   - 实时显示已签到人数/总人数
   - 倒计时显示签到剩余时间
   - 自动刷新机制，防止二维码过期

2. **签到记录实时显示**
   - 实时更新签到学生列表
   - 使用颜色区分不同签到状态（正常、迟到、缺勤）
   - 提供快速筛选工具（按班级、按签到状态等）
   - 支持导出签到数据功能

3. **便捷导航**
   - 侧边栏快速导航到所有课程和签到任务
   - 顶部搜索框支持快速查找课程、学生和签到记录
   - 快捷键支持常用操作

### 学生端

1. **扫码签到体验**
   - 一键进入扫码模式
   - 扫码成功后显示动画反馈
   - 签到成功后显示详细课程和时间信息
   - 支持历史扫码记录查看

2. **签到状态直观展示**
   - 使用清晰的图标和颜色标识不同签到状态
   - 日历视图显示每日签到情况
   - 提供出勤率和统计数据的可视化图表

3. **位置/WiFi签到**
   - 获取位置时显示地图和当前位置
   - WiFi签到自动检测连接的网络
   - 提供手动输入验证码的备选方案（网络不好时使用）

4. **通知与提醒**
   - 签到时间临近时推送提醒
   - 签到成功后推送确认通知
   - 缺勤后发送警告通知
