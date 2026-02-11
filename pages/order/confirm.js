// pages/order/confirm.js
Page({
  data: {
    orderData: null,
    userInfo: null,
    isLogin: false,
    submitting: false
  },

  onLoad: function(options) {
    this.initPage(options);
    // 检查支付支持情况
    this.checkPaymentSupport();
  },

  // 检查支付支持情况
  checkPaymentSupport: function() {
    const payment = require('../../utils/payment.js');
    const supportInfo = payment.checkPaymentSupport();
    
    if (!supportInfo.supported) {
      wx.showToast({
        title: supportInfo.message,
        icon: 'none',
        duration: 3000
      });
    }
  },

  onShow: function() {
    this.updateUserInfo();
  },

  // 初始化页面
  initPage: function(options) {
    this.updateUserInfo();
    
    // 解析订单数据
    if (options.orderData) {
      try {
        const orderData = JSON.parse(decodeURIComponent(options.orderData));
        
        // 预处理订单数据，添加格式化字段
        const processedOrderData = {
          ...orderData,
          formattedTotalAmount: (orderData.totalAmount / 100).toFixed(2),
          items: orderData.items.map(item => ({
            ...item,
            formattedPrice: (item.price / 100).toFixed(2),
            formattedSubtotal: ((item.price * item.quantity) / 100).toFixed(2)
          }))
        };
        
        this.setData({ orderData: processedOrderData });
      } catch (e) {
        console.error('解析订单数据失败', e);
        wx.showToast({
          title: '订单数据异常',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } else {
      wx.showToast({
        title: '缺少订单数据',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 更新用户信息
  updateUserInfo: function() {
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      isLogin: app.globalData.isLogin
    });
  },

  // 提交订单
  onSubmitOrder: function() {
    if (this.data.submitting) return;
    
    if (!this.data.orderData) {
      wx.showToast({
        title: '订单数据异常',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    const request = require('../../utils/request.js');
    const payment = require('../../utils/payment.js');
    
    // 1. 先创建订单
    request.post('/orders/create', this.data.orderData, { loading: true })
    .then(res => {
      console.log('订单创建成功', res);
      
      // 2. 发起支付
      const orderInfo = {
        orderId: res.data.orderId,
        amount: this.data.orderData.totalAmount,
        description: '餐厅点餐订单'
      };
      
      return payment.pay(orderInfo);
    })
    .then(paymentResult => {
      console.log('支付成功', paymentResult);
      
      // 3. 支付成功后清空购物车
      const app = getApp();
      app.globalData.cart = [];
      wx.setStorageSync('cart', []);
      
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      });
      
      // 4. 跳转到订单详情
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?id=${this.data.orderData.orderId || 'mock_order_1'}`
        });
      }, 1500);
    })
    .catch(err => {
      this.setData({ submitting: false });
      
      if (err.success === false) {
        // 支付失败
        wx.showToast({
          title: err.message || '支付失败',
          icon: 'none'
        });
        
        // 支付失败时的处理逻辑
        if (err.message === '用户取消支付') {
          // 用户取消支付，可以保留在当前页面
          console.log('用户取消支付');
        } else {
          // 其他支付失败，可能需要更新订单状态为待支付
          console.log('支付失败，需要更新订单状态');
        }
      } else {
        // 订单创建失败
        wx.showToast({
          title: err.message || '下单失败',
          icon: 'none'
        });
      }
    })
    .finally(() => {
      this.setData({ submitting: false });
    });
  },

  // 修改桌台
  onChangeTable: function() {
    wx.navigateTo({
      url: '/pages/table/table'
    });
  },

  // 返回购物车
  onBackToCart: function() {
    wx.navigateBack();
  }
});