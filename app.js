// app.js
App({
  globalData: {
    userInfo: null,
    isLogin: false,
    tableInfo: null, // 当前桌台信息
    cart: [], // 购物车数据
    orderId: null, // 当前订单ID
    memberId: null, // 会员ID
    appid: 'wxa1bb49316b8d802f' // 你的AppID
  },

  onLaunch: function(options) {
    console.log('小程序启动', options);
    this.checkLoginStatus();
    this.initSystem();
  },

  onShow: function(options) {
    console.log('小程序显示', options);
  },

  onHide: function() {
    console.log('小程序隐藏');
  },

  onError: function(msg) {
    console.error('小程序错误:', msg);
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const memberId = wx.getStorageSync('memberId');
    
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLogin = true;
    }
    
    if (memberId) {
      this.globalData.memberId = memberId;
    }
  },

  // 初始化系统
  initSystem: function() {
    // 初始化购物车
    let cart = wx.getStorageSync('cart') || [];
    
    // 如果购物车为空，添加默认商品
    if (cart.length === 0) {
      cart = [
        {
          dishId: 1,
          name: '宫保鸡丁',
          price: 2800, // 单位：分
          formattedPrice: '28.00',
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&h=300&fit=crop&q=80',
          remark: ''
        },
        {
          dishId: 2,
          name: '麻婆豆腐',
          price: 1800, // 单位：分
          formattedPrice: '18.00',
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&h=300&fit=crop&q=80',
          remark: ''
        },
        {
          dishId: 3,
          name: '拍黄瓜',
          price: 1200, // 单位：分
          formattedPrice: '12.00',
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&h=300&fit=crop&q=80',
          remark: ''
        }
      ];
      wx.setStorageSync('cart', cart);
    }
    
    this.globalData.cart = cart;
    
    // 初始化桌台信息
    let tableInfo = wx.getStorageSync('tableInfo');
    if (!tableInfo) {
      tableInfo = {
        tableId: 1,
        tableNumber: 'A01',
        status: 'available'
      };
      wx.setStorageSync('tableInfo', tableInfo);
    }
    this.globalData.tableInfo = tableInfo;
  },

  // 获取用户信息
  getUserInfo: function(cb) {
    if (this.globalData.userInfo) {
      typeof cb === "function" && cb(this.globalData.userInfo);
    } else {
      // 调用登录接口
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          console.log('登录成功', res);
        }
      });
    }
  },

  // 显示提示信息
  showToast: function(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title: title,
      icon: icon,
      duration: duration
    });
  },

  // 显示模态框
  showModal: function(title, content, confirmCallback, cancelCallback) {
    wx.showModal({
      title: title,
      content: content,
      success: function(res) {
        if (res.confirm) {
          typeof confirmCallback === "function" && confirmCallback();
        } else if (res.cancel) {
          typeof cancelCallback === "function" && cancelCallback();
        }
      }
    });
  },

  // 计算购物车总价
  calculateCartTotal: function(cart) {
    return cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
})