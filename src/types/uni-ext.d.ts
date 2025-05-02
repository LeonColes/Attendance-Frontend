/**
 * uni-app 扩展类型定义
 */

// 补充 GetAppBaseInfoResult 类型定义中缺少的 platform 属性
declare namespace UniNamespace {
  interface GetAppBaseInfoResult {
    platform: string;
  }
}

// 添加 HTML5 QR 码扫描库的类型定义
interface Window {
  Html5Qrcode: {
    new (elementId: string, config?: any): {
      start: (cameraIdOrConfig: any, configuration: any, qrCodeSuccessCallback: (decodedText: string, decodedResult?: any) => void, qrCodeErrorCallback?: (errorMessage: string, error?: any) => void) => Promise<any>;
      stop: () => Promise<any>;
    };
  };
  Html5QrcodeSupportedFormats: {
    QR_CODE: number;
  };
} 