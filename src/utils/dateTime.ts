/**
 * 日期时间工具函数
 * 提供了中国时区（GMT+8 Asia/Shanghai）的日期时间格式化功能
 */

// 中国时区偏移（UTC+8小时）
// const _CHINA_TIMEZONE_OFFSET = 8 * 60 * 60 * 1000;
// const _TIMEZONE_IDENTIFIER = 'Asia/Shanghai';

/**
 * 简化的时区处理函数
 * 由于系统默认就是中国时区，此函数直接返回原始日期
 * @param date 原始日期
 * @returns 日期对象
 */
export function toChineseTimezone(date: Date): Date {
  // 检查date是否为有效日期
  if (Number.isNaN(date.getTime())) {
    console.warn('Invalid date passed to toChineseTimezone:', date);
    return new Date(); // 返回当前日期作为回退
  }
  
  // 直接返回日期副本，不做时区转换
  return new Date(date.getTime());
}

/**
 * 安全的日期解析，兼容iOS
 * @param dateString 日期字符串
 * @returns 日期对象
 */
export function safeParseDate(dateString: string | number | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }
  
  if (typeof dateString === 'number') {
    return new Date(dateString);
  }
  
  // 处理字符串格式
  if (typeof dateString === 'string') {
    // 对于格式为 "YYYY-MM-DD HH:MM:SS" 的字符串，转换为 "YYYY-MM-DDTHH:MM:SS" 格式以兼容iOS
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
      dateString = dateString.replace(' ', 'T');
    }
    
    // 对于格式为 "YYYY-MM-DD" 的字符串，兼容所有设备
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    // 其他格式，尝试直接解析
    return new Date(dateString);
  }
  
  // 如果都不符合，返回当前时间
  return new Date();
}

/**
 * 格式化日期为YYYY-MM-DD格式（中国时区）
 * @param timestamp 时间戳或日期对象
 * @returns 格式化后的日期字符串
 */
export function formatDate(timestamp: number | string | Date): string {
  if (!timestamp) return '';
  
  const date = safeParseDate(timestamp);
  const chinaDate = toChineseTimezone(date);
  
  const year = chinaDate.getFullYear();
  const month = String(chinaDate.getMonth() + 1).padStart(2, '0');
  const day = String(chinaDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期和时间为YYYY-MM-DD HH:MM:SS格式（中国时区）
 * @param timestamp 时间戳或日期对象
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTimeFull(timestamp: number | string | Date): string {
  if (!timestamp) return '';
  
  const date = safeParseDate(timestamp);
  const chinaDate = toChineseTimezone(date);
  
  const year = chinaDate.getFullYear();
  const month = String(chinaDate.getMonth() + 1).padStart(2, '0');
  const day = String(chinaDate.getDate()).padStart(2, '0');
  const hour = String(chinaDate.getHours()).padStart(2, '0');
  const minute = String(chinaDate.getMinutes()).padStart(2, '0');
  const second = String(chinaDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 格式化日期和时间为MM-DD HH:MM格式（中国时区），更简短易读
 * @param timestamp 时间戳或日期对象
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(timestamp: number | string | Date): string {
  if (!timestamp) return '';
  
  const date = safeParseDate(timestamp);
  const chinaDate = toChineseTimezone(date);
  
  const month = String(chinaDate.getMonth() + 1).padStart(2, '0');
  const day = String(chinaDate.getDate()).padStart(2, '0');
  const hour = String(chinaDate.getHours()).padStart(2, '0');
  const minute = String(chinaDate.getMinutes()).padStart(2, '0');
  
  // 使用简短格式 (MM-DD HH:MM)
  return `${month}-${day} ${hour}:${minute}`;
}

/**
 * 创建当前时间的Date对象（中国时区）
 * @returns 当前中国时区的Date对象
 */
export function getCurrentChineseDate(): Date {
  return toChineseTimezone(new Date());
}

/**
 * 获取当前日期的默认开始时间（当前时间）
 * @returns 默认的开始时间字符串
 */
export function getDefaultStartTime(): string {
  return formatDateTimeFull(getCurrentChineseDate());
}

/**
 * 获取当前日期的默认结束时间（当前时间 + 指定分钟数）
 * @param addMinutes 要添加的分钟数，默认5分钟
 * @returns 默认的结束时间字符串
 */
export function getDefaultEndTime(addMinutes: number = 5): string {
  const endDate = getCurrentChineseDate();
  endDate.setMinutes(endDate.getMinutes() + addMinutes);
  return formatDateTimeFull(endDate);
}

/**
 * 计算两个日期之间的时间差
 * @param start 开始时间
 * @param end 结束时间
 * @returns 格式化的时间差字符串
 */
export function getTimeDiff(start: Date, end: Date): string {
  const diff = end.getTime() - start.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}天${hours}小时${minutes}分钟`;
}

/**
 * 将ISO日期字符串转换为中国时区的ISO字符串
 * @param date Date对象
 * @returns 中国时区的ISO字符串（兼容iOS）
 */
export function toChineseISOString(date: Date): string {
  const chinaDate = toChineseTimezone(date);
  
  try {
    // 生成ISO格式字符串 (YYYY-MM-DDTHH:MM:SS.sssZ)
    const isoString = chinaDate.toISOString();
    return isoString;
  } catch (e) {
    // 备用方法
    const year = chinaDate.getFullYear();
    const month = String(chinaDate.getMonth() + 1).padStart(2, '0');
    const day = String(chinaDate.getDate()).padStart(2, '0');
    const hour = String(chinaDate.getHours()).padStart(2, '0');
    const minute = String(chinaDate.getMinutes()).padStart(2, '0');
    const second = String(chinaDate.getSeconds()).padStart(2, '0');
    
    // 使用标准ISO格式
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  }
} 