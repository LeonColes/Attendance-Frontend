<!--
 * @Author: weisheng
 * @Date: 2025-04-08 10:00:00
 * @LastEditTime: 2025-04-08 10:00:00
 * @LastEditors: weisheng
 * @Description: 位置签到页面
 * @FilePath: \wot-demo\src\pages\location-checkin\index.vue
 * 记得注释
-->
<template>
  <view class="container" :class="{'wot-theme-dark': themeStore.isDarkMode}">
    <!-- 全屏地图 -->
    <view class="map-fullscreen">
      <map
        id="location-map"
        class="location-map"
        :latitude="location.latitude"
        :longitude="location.longitude"
        :markers="mapMarkers"
        :show-location="true"
        :show-compass="true"
        :enable-zoom="true"
        :enable-rotate="false"
        :enable-poi="true"
        scale="16"
      ></map>

      <!-- 地图控件 -->
      <view class="map-controls">
        <view class="map-control-item" @click="moveToLocation">
          <wd-icon name="location" size="44rpx" color="#6a11cb" />
        </view>
      </view>
    </view>

    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-info" :class="{ 'status-error': locationError }">
        {{ locationError ? locationError : (location.address ? '位置获取成功' : '正在获取位置...') }}
      </view>
    </view>

    <!-- 位置信息浮动卡片 -->
    <view class="location-card">
      <view class="card-header">
        <view class="location-icon">
          <wd-icon name="location" size="48rpx" color="#6a11cb" />
        </view>
        <view class="location-details">
          <text class="location-title">当前位置</text>
          <text class="location-subtitle">{{ locationSubtitle }}</text>
        </view>
        <view class="refresh-btn" @click="getLocation">
          <wd-icon name="refresh" size="40rpx" color="#6a11cb" />
        </view>
      </view>

      <view class="card-content">
        <view class="address-box">
          <text class="address">{{ location.address || '正在获取位置...' }}</text>
          <text class="coordinates" v-if="location.latitude && location.longitude">
            经纬度: {{ formatCoordinates(location.latitude, location.longitude) }}
          </text>
          <view class="address-details" v-if="location.city || location.district">
            <text class="detail-item">{{ location.city }} {{ location.district }} {{ location.street }}</text>
            <text class="detail-item">
              <text :class="['accuracy-indicator', location.isHighAccuracy ? 'high-accuracy' : 'normal-accuracy']"></text>
              {{ location.isHighAccuracy ? '高精度' : '普通精度' }} ({{ location.accuracy.toFixed(0) }}m)
            </text>
          </view>
        </view>

        <view class="location-actions">
          <view class="action-item" @click="copyLocationInfo">
            <wd-icon name="copy" size="32rpx" color="#666" />
            <text>复制位置</text>
          </view>
          <view class="action-item" @click="shareLocation">
            <wd-icon name="share" size="32rpx" color="#666" />
            <text>分享位置</text>
          </view>
        </view>
      </view>

      <!-- 签到按钮 -->
      <view class="checkin-action">
        <wd-button
          type="primary"
          round
          block
          :loading="loading"
          @click="submitLocationCheckin"
        >
          {{ locationError ? '使用默认位置签到' : '确认签到' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'
import { submitCheckin, CheckInType } from '@/api/attendance'

// 腾讯地图API配置
const QQ_MAP_KEY = 'G7VBZ-BF63Q-EEZ52-2XSLD-YYVA7-VJFB4' // 请替换为实际的key
const QQ_MAP_SECRET_KEY = 'Yb88cxWRzZ96IjO0Q3XYllP6C6oj40xc' // 请替换为实际的secretKey

const userStore = useUserStore()
const themeStore = useThemeStore()
const loading = ref(false)
const checkinId = ref('')
const courseId = ref('')
const locationError = ref('')
const location = reactive({
  latitude: 0,
  longitude: 0,
  address: '',
  accuracy: 0,
  updatedAt: 0,
  city: '',
  district: '',
  street: '',
  isHighAccuracy: false
})

// 计算位置副标题
const locationSubtitle = computed(() => {
  if (locationError.value) {
    return '位置获取失败';
  }

  if (!location.updatedAt) {
    return '正在定位中...';
  }

  // 计算位置更新时间
  const now = Date.now();
  const diff = now - location.updatedAt;
  let timeText = '';
  
  if (diff < 60000) {
    timeText = '刚刚更新';
  } else if (diff < 3600000) {
    timeText = `${Math.floor(diff / 60000)}分钟前更新`;
  } else {
    timeText = `${Math.floor(diff / 3600000)}小时前更新`;
  }
  
  // 添加位置精度信息
  const accuracyText = location.accuracy 
    ? `(精度:${location.accuracy.toFixed(0)}m)` 
    : '';
  
  return `${timeText} ${accuracyText}`;
});

// 格式化坐标显示
function formatCoordinates(latitude: number, longitude: number): string {
  if (!latitude || !longitude) return '';

  // 格式化为更易读的形式，保留6位小数
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

// 地图标记点
const mapMarkers = computed(() => {
  if (!location.latitude || !location.longitude) return [];

  // 定义标记点类型
  interface MapMarker {
    id: number;
    latitude: number;
    longitude: number;
    width: number;
    height: number;
    callout: {
      content: string;
      color: string;
      fontSize: number;
      borderRadius: number;
      bgColor: string;
      padding: number;
      display: string;
    }
  }

  // 创建标记点数组并添加当前位置标记
  const markers: MapMarker[] = [{
    id: 1,
    latitude: location.latitude,
    longitude: location.longitude,
    width: 40,
    height: 40,
    callout: {
      content: location.address || '当前位置',
      color: '#FFFFFF',
      fontSize: 14,
      borderRadius: 8,
      bgColor: '#6a11cb',
      padding: 10,
      display: 'ALWAYS'
    }
  }];

  return markers;
});

// 移动地图到当前位置
function moveToLocation() {
  try {
    const mapContext = uni.createMapContext('location-map');
    mapContext.moveToLocation({
      latitude: location.latitude,
      longitude: location.longitude
    });
  } catch (e) {
    console.error('移动地图位置失败:', e);
  }
}

// 复制位置信息
function copyLocationInfo() {
  const locationText = location.address
    ? `${location.address} (${location.latitude}, ${location.longitude})`
    : `位置坐标: ${location.latitude}, ${location.longitude}`;

  uni.setClipboardData({
    data: locationText,
    success: () => {
      uni.showToast({
        title: '位置信息已复制',
        icon: 'success'
      });
    }
  });
}

// 分享位置
function shareLocation() {
  uni.showModal({
    title: '位置分享',
    content: '即将开放此功能，敬请期待！',
    showCancel: false
  });
}

// 计算腾讯地图API签名 - 严格按照官方文档实现
function calculateMapSignature(params: Record<string, string>, secretKey: string): string {
  // 1. 对请求参数按键名升序排序
  const sortedKeys = Object.keys(params).sort()
  
  // 2. 构建请求字符串 - 不进行URL编码
  let queryString = ''
  for (const key of sortedKeys) {
    // 注意：计算签名时不对参数值进行URL编码
    queryString += `${key}=${params[key]}&`
  }
  queryString = queryString.slice(0, -1) // 移除末尾的&

  // 3. 拼接路径、参数和密钥 - 严格按照官方文档格式
  // 官方要求: 请求路径+"?"+请求参数+SK
  const signStr = `/ws/geocoder/v1?${queryString}${secretKey}`
  
  console.log('签名计算用字符串:', signStr)
  
  // 4. 计算MD5并转换为小写
  const signature = md5Sync(signStr).toLowerCase()
  console.log('计算得到的签名:', signature)
  
  return signature
}

// MD5实现 - 来自知名的JavaScript库，经过优化的真实MD5实现
function md5Sync(str: string): string {
  // 注意：以下是一个真实的MD5实现

  function rotateLeft(lValue: number, iShiftBits: number): number {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX: number, lY: number): number {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }

  function F(x: number, y: number, z: number): number {
    return (x & y) | ((~x) & z);
  }

  function G(x: number, y: number, z: number): number {
    return (x & z) | (y & (~z));
  }

  function H(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }

  function I(x: number, y: number, z: number): number {
    return y ^ (x | (~z));
  }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] || 0) | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = (lWordArray[lWordCount] || 0) | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    
    return lWordArray;
  }

  function wordToHex(lValue: number): string {
    let WordToHexValue = '';
    let WordToHexValue_temp = '';
    let lByte;
    
    for (let lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = '0' + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    
    return WordToHexValue;
  }

  let x = convertToWordArray(str);
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;
  let S11 = 7;
  let S12 = 12;
  let S13 = 17;
  let S14 = 22;
  let S21 = 5;
  let S22 = 9;
  let S23 = 14;
  let S24 = 20;
  let S31 = 4;
  let S32 = 11;
  let S33 = 16;
  let S34 = 23;
  let S41 = 6;
  let S42 = 10;
  let S43 = 15;
  let S44 = 21;
  let k = 0;
  
  while (k < x.length) {
    let AA = a;
    let BB = b;
    let CC = c;
    let DD = d;
    
    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);

    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);

    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);

    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
    
    k += 16;
  }
  
  const result = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  return result.toLowerCase();
}

// 获取位置信息
function getLocation() {
  locationError.value = ''

  try {
    uni.showLoading({
      title: '获取位置中...',
      mask: true
    });

    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true, // 开启高精度定位
      highAccuracyExpireTime: 4000, // 高精度定位超时时间，单位毫秒
      success: (res) => {
        location.latitude = res.latitude
        location.longitude = res.longitude
        location.address = '位置获取成功'
        location.accuracy = res.accuracy || 0
        location.updatedAt = Date.now()

        // 获取地址信息（可选）
        // 构建请求参数 - 不包含中文和特殊字符
        const params: Record<string, string> = {
          key: QQ_MAP_KEY,
          location: `${res.latitude},${res.longitude}`,
          output: 'json'
        }
        
        try {
          // 计算签名 - 按照官方文档要求
          const sig = calculateMapSignature(params, QQ_MAP_SECRET_KEY)
          
          // 构建请求URL - 参数值需要URL编码
          let requestUrl = 'https://apis.map.qq.com/ws/geocoder/v1?'
          
          // 添加所有参数（需要URL编码）
          for (const key of Object.keys(params)) {
            requestUrl += `${key}=${encodeURIComponent(params[key])}&`
          }
          
          // 添加签名参数
          requestUrl += `sig=${sig}`
          
          console.log('请求URL:', requestUrl)
          
          // 发送请求
          uni.request({
            url: requestUrl,
            success: (res: any) => {
              console.log('逆地址解析响应:', res.data)
              if (res.statusCode === 200 && res.data && res.data.status === 0 && res.data.result) {
                // 存储基本地址
                location.address = res.data.result.address
                
                // 存储更多详细地址信息
                if (res.data.result.address_component) {
                  const addressComp = res.data.result.address_component
                  location.city = addressComp.city || ''
                  location.district = addressComp.district || ''
                  location.street = addressComp.street || ''
                }
                
                // 如果有精度信息，判断是否为高精度定位
                if (location.accuracy) {
                  location.isHighAccuracy = location.accuracy < 50 // 精度小于50米视为高精度
                }
                
                // 更新地图位置
                moveToLocation()
              } else if (res.data) {
                // 记录API返回的错误信息
                console.error('地图API错误:', res.data.status, res.data.message)
                
                // 特殊处理不同错误码
                if (res.data.status === 110) {
                  console.error('请求来源未被授权，需要在腾讯地图控制台添加域名白名单')
                } else if (res.data.status === 112) {
                  console.error('IP未被授权，需要在腾讯地图控制台添加授权IP')
                } else if (res.data.status === 111) {
                  console.error('签名校验失败，请检查SecretKey和签名计算方法')
                }
              }
              uni.hideLoading()
            },
            fail: () => {
              uni.hideLoading();
            }
          })
        } catch (e) {
          console.error('签名计算失败:', e)
          locationError.value = '获取位置失败，将使用默认位置签到'

          // 使用默认位置
          location.latitude = 30.4851
          location.longitude = 114.3072
          location.address = '默认位置 (武昌首义学院)'
          location.updatedAt = Date.now()

          // 更新地图位置
          moveToLocation()
          uni.hideLoading();
        }
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        locationError.value = '获取位置失败，将使用默认位置签到'

        // 使用默认位置
        location.latitude = 30.4851
        location.longitude = 114.3072
        location.address = '默认位置 (武昌首义学院)'
        location.updatedAt = Date.now()

        // 更新地图位置
        moveToLocation()
        uni.hideLoading();
      }
    })
  } catch (e) {
    console.error('获取位置异常:', e)
    locationError.value = '获取位置异常，将使用默认位置签到'

    // 使用默认位置
    location.latitude = 30.4851
    location.longitude = 114.3072
    location.address = '默认位置 (武昌首义学院)'
    location.updatedAt = Date.now()
    // 30.4851, 114.3072
    // 更新地图位置
    moveToLocation()
    uni.hideLoading();
  }
}

// 提交签到
async function submitLocationCheckin() {
  try {
    loading.value = true

    // 获取设备信息
    const deviceInfo = uni.getSystemInfoSync()

    // 只使用经纬度，不包含地址信息，符合API要求的格式
    const locationStr = `${location.latitude},${location.longitude}`

    // 准备签到数据
    const checkinData = {
      checkinId: checkinId.value,
      verifyMethod: CheckInType.LOCATION,
      location: locationStr,
      device: JSON.stringify({
        type: deviceInfo.platform || 'iPhone',
        model: deviceInfo.model || '测试设备'
      }),
      verifyData: ''
    }

    console.log('提交签到数据:', checkinData)

    // 提交签到
    const response = await submitCheckin(checkinData)

    if (response && response.code === 200) {
      uni.showToast({
        title: '签到成功',
        icon: 'success'
      })

      // 延迟后返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      throw new Error(response?.message || '签到失败')
    }
  } catch (e: any) {
    console.error('签到失败:', e)
    uni.showToast({
      title: e.message || '签到失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const query = currentPage ? (currentPage as any)?.options : {}
  console.log('query', query)
  // 处理签到ID
  if (query.checkinId) {
    checkinId.value = query.checkinId
  } else if (query.checkinData) {
    try {
      const checkinData = JSON.parse(decodeURIComponent(query.checkinData))
      checkinId.value = checkinData.checkinId
    } catch (e) {
      console.error('解析签到数据失败:', e)
    }
  } else {
    console.error('签到ID不存在')
  }

  courseId.value = query.courseId || ''

  // 获取位置信息
  getLocation()
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: var(--background-color-primary, #f5f5f5);
  color: var(--text-color-primary, #303133);
  position: relative;
  transition: all 0.3s ease;
}

.wot-theme-dark {
  .container {
    background-color: var(--background-color-primary, #121212);
    color: var(--text-color-primary, #e5eaf3);
  }
  
  .location-card {
    background-color: var(--card-bg-color, #1e1e1e);
    color: var(--text-color-primary, #e5eaf3);
    border-color: var(--border-color, #3e3e3e);
  }
  
  .status-bar {
    background-color: rgba(30, 30, 30, 0.9);
  }
  
  .map-control-item {
    background-color: rgba(30, 30, 30, 0.9);
    box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.3);
  }
}

.map-fullscreen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.location-map {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  right: 30rpx;
  bottom: 480rpx;
  z-index: 10;
}

.map-control-item {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 20rpx;
}

.status-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  padding: 20rpx;
  display: flex;
  justify-content: center;
}

.status-info {
  padding: 10rpx 30rpx;
  background-color: rgba(76, 175, 80, 0.8);
  color: #fff;
  border-radius: 50rpx;
  font-size: 26rpx;
  max-width: 80%;
  text-align: center;
}

.status-error {
  background-color: rgba(244, 67, 54, 0.8);
}

.location-card {
  position: fixed;
  left: 30rpx;
  right: 30rpx;
  bottom: 50rpx;
  z-index: 10;
  background: #FFFFFF;
  border-radius: 30rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.location-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(106, 17, 203, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.location-details {
  flex: 1;
}

.location-title {
  display: block;
  font-weight: bold;
  font-size: 34rpx;
  color: #333;
}

.location-subtitle {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.refresh-btn {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  margin-bottom: 30rpx;
}

.address-box {
  margin-bottom: 24rpx;
  padding: 20rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
}

.address {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  line-height: 1.6;
}

.coordinates {
  font-size: 24rpx;
  color: #999;
}

.address-details {
  margin-top: 10rpx;
  display: flex;
  justify-content: space-around;
}

.detail-item {
  font-size: 24rpx;
  color: #666;
}

.accuracy-indicator {
  display: inline-block;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 6rpx;
}

.high-accuracy {
  background-color: #4CAF50; /* 绿色表示高精度 */
}

.normal-accuracy {
  background-color: #FFC107; /* 黄色表示普通精度 */
}

.low-accuracy {
  background-color: #FF5722; /* 红色表示低精度 */
}

.location-actions {
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
}

.action-item text {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.checkin-action {
  margin-top: 20rpx;
}
</style>

<route lang="json">
{
  "navigationBarTitleText": "位置签到",
  "navigationStyle": "custom"
}
</route>
