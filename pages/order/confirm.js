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
    
    request.post('/orders/create', this.data.orderData, { loading: true })
    .then(res => {
      console.log('订单创建成功', res);
      
      // 清空购物车
      const app = getApp();
      app.globalData.cart = [];
      wx.setStorageSync('cart', []);
      
      wx.showToast({
        title: '下单成功',
        icon: 'success'
      });
      
      // 跳转到订单详情或订单列表
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?id=${res.data.orderId}`
        });
      }, 1500);
    })
    .catch(err => {
      console.error('订单提交失败', err);
      wx.showToast({
        title: err.message || '下单失败',
        icon: 'none'
      });
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