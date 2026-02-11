// utils/payment.js
// 微信支付工具类

class Payment {
  constructor() {
    // 支付配置
    this.appId = 'wxa1bb49316b8d802f'; // 您的小程序AppID
    // 开发者模式 - 在开发者工具中模拟支付成功
    this.isDevMode = __wxConfig && __wxConfig.envVersion === 'develop';
  }

  /**
   * 发起微信支付
   * @param {Object} orderInfo - 订单信息
   * @param {string} orderInfo.orderId - 订单ID
   * @param {number} orderInfo.amount - 支付金额（单位：分）
   * @param {string} orderInfo.description - 商品描述
   * @returns {Promise}
   */
  async pay(orderInfo) {
    try {
      // 1. 请求后端获取支付参数
      const paymentParams = await this.getPaymentParams(orderInfo);
      
      // 2. 调用微信支付API
      return await this.requestPayment(paymentParams, orderInfo);
    } catch (error) {
      console.error('支付失败:', error);
      throw error;
    }
  }

  /**
   * 获取支付参数（模拟后端接口）
   * 实际开发中这里应该调用真实的后端接口
   */
  async getPaymentParams(orderInfo) {
    // 模拟后端返回支付参数
    // 实际开发中应该调用：POST /api/payment/unifiedorder
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockPaymentParams = {
          timeStamp: Math.floor(Date.now() / 1000).toString(),
          nonceStr: this.generateNonceStr(),
          package: 'prepay_id=wx201410272009395522657a690389285100',
          signType: 'MD5',
          paySign: '70EA5D1DD5391816E7FFC32FB4D6371F' // 模拟签名
        };
        resolve(mockPaymentParams);
      }, 500);
    });
  }

  /**
   * 调用微信支付
   */
  requestPayment(paymentParams, orderInfo) {
    return new Promise((resolve, reject) => {
      // 开发者模式下直接模拟支付成功
      if (this.isDevMode) {
        console.log('【开发者模式】模拟支付成功');
        wx.showModal({
          title: '支付测试',
          content: `订单金额：¥${this.formatAmount(orderInfo.amount)}\n\n开发者模式下模拟支付成功`,
          showCancel: true,
          cancelText: '支付失败',
          confirmText: '支付成功',
          success: (res) => {
            if (res.confirm) {
              // 模拟支付成功
              resolve({
                success: true,
                result: { errMsg: 'requestPayment:ok' },
                isMock: true
              });
            } else {
              // 模拟支付失败
              reject({
                success: false,
                error: { errMsg: 'requestPayment:fail cancel' },
                message: '用户取消支付'
              });
            }
          }
        });
        return;
      }

      wx.requestPayment({
        ...paymentParams,
        success: (res) => {
          console.log('支付成功', res);
          resolve({
            success: true,
            result: res
          });
        },
        fail: (err) => {
          console.error('支付失败', err);
          
          // 根据错误码给出友好提示
          let errorMsg = '支付失败';
          let shouldReject = true;
          
          switch (err.errMsg) {
            case 'requestPayment:fail cancel':
              errorMsg = '用户取消支付';
              break;
            case 'requestPayment:fail timeout':
              errorMsg = '支付超时';
              break;
            case 'requestPayment:fail no permission':
              errorMsg = '暂无支付权限，请在真机上测试或联系管理员';
              break;
            case 'requestPayment:fail invalid appid':
              errorMsg = 'AppID配置错误';
              break;
            default:
              errorMsg = err.errMsg || '支付失败';
          }
          
          reject({
            success: false,
            error: err,
            message: errorMsg
          });
        }
      });
    });
  }

  /**
   * 生成随机字符串
   */
  generateNonceStr(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 格式化金额（分转元）
   */
  formatAmount(amountInCents) {
    return (amountInCents / 100).toFixed(2);
  }

  /**
   * 验证支付结果（可选）
   */
  async verifyPayment(orderId, paymentResult) {
    // 实际开发中可以调用后端接口验证支付结果
    return true;
  }

  /**
   * 检查是否支持支付
   */
  checkPaymentSupport() {
    if (this.isDevMode) {
      return {
        supported: true,
        message: '开发者模式 - 支持模拟支付'
      };
    }
    
    // 检查微信版本是否支持支付
    const systemInfo = wx.getSystemInfoSync();
    const isSupported = systemInfo.platform !== 'devtools';
    
    return {
      supported: isSupported,
      message: isSupported ? '支持微信支付' : '开发者工具暂不支持真实支付，请使用真机测试'
    };
  }
}

// 单例模式
const paymentInstance = new Payment();

module.exports = paymentInstance;