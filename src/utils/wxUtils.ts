/**
 * 微信小程序环境工具函数
 */

/**
 * 检查是否在微信小程序环境中
 * @returns 是否为微信小程序环境
 */
export function isWechatMiniProgram(): boolean {
  // @ts-ignore
  return typeof wx !== 'undefined' && !!wx.getSystemInfoSync;
}

/**
 * 安全获取uni对象
 * 在不同环境下返回可用的uni对象
 */
export function getSafeUni() {
  // @ts-ignore
  return typeof window !== 'undefined' && window.uni ? window.uni : uni;
}

/**
 * 处理微信小程序Worker错误
 * 创建一个空的Worker对象作为fallback
 */
export function createSafeWorker(url: string, options?: any): Worker | any {
  if (isWechatMiniProgram()) {
    console.warn('在微信小程序环境中不支持完整的Worker功能，使用模拟实现');
    return {
      postMessage: () => {},
      onmessage: null,
      terminate: () => {}
    };
  }
  
  try {
    // @ts-ignore
    return new Worker(url, options);
  } catch (e) {
    console.warn('创建Worker失败，使用fallback', e);
    return {
      postMessage: () => {},
      onmessage: null,
      terminate: () => {}
    };
  }
}

/**
 * 安全调用微信API，处理可能的错误
 * @param apiFunc 要调用的API函数
 * @param args API参数
 * @returns API调用结果Promise
 */
export function callWxApiSafely<T>(apiFunc: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      apiFunc(...args)
        .then(resolve)
        .catch((error) => {
          console.error('微信API调用失败:', error);
          reject(error);
        });
    } catch (error) {
      console.error('微信API调用异常:', error);
      reject(error);
    }
  });
}

/**
 * 初始化微信环境的必要处理
 * 设置一些全局对象以避免错误
 */
export function initializeWxEnvironment() {
  if (typeof window !== 'undefined') {
    // 防止未定义的WeixinJSBridge错误
    if (!window.WeixinJSBridge) {
      // @ts-ignore
      window.WeixinJSBridge = {
        invoke: function() {},
        on: function() {}
      };
    }
  }
} 