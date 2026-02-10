// pages/login/login.js
Page({
  data: {
    canIUseGetUserProfile: false,
    isLoggingIn: false,
    loginStep: 0 // 0:初始状态, 1:已获取用户信息, 2:已获取code, 3:登录完成
  },

  onLoad: function() {
    this.checkAuthStatus();
  },

  // 检查授权状态
  checkAuthStatus: function() {
    // 检查是否支持 getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查是否已登录
    const app = getApp();
    if (app.globalData.isLogin) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 微信授权登录 - 主要入口
  onWechatLogin: function() {
    if (this.data.isLoggingIn) return;
    
    this.setData({ 
      isLoggingIn: true,
      loginStep: 0
    });
    
    // 直接调用获取用户信息（由用户点击触发）
    this.getUserProfile();
  },

  // 获取用户信息 - 严格由用户点击触发
  getUserProfile: function() {
    if (!this.data.canIUseGetUserProfile) {
      this.handleLoginError('当前微信版本不支持该功能');
      return;
    }

    // 直接调用用户授权，不在任何异步回调中
    wx.getUserProfile({
      desc: '用于获取用户头像和昵称',
      success: (profileRes) => {
        console.log('用户授权成功:', profileRes);
        this.setData({ 
          userProfile: profileRes,
          loginStep: 1
        });
        // 授权成功后再获取登录凭证
        this.getLoginCode();
      },
      fail: (err) => {
        console.log('用户拒绝授权:', err);
        this.handleLoginError('需要授权才能使用完整功能，请点击允许');
      }
    });
  },

  // 获取登录凭证
  getLoginCode: function() {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('获取到登录code:', loginRes.code);
          this.setData({ 
            loginCode: loginRes.code,
            loginStep: 2
          });
          // 发送到服务器验证
          this.verifyLogin();
        } else {
          this.handleLoginError('获取登录凭证失败');
        }
      },
      fail: (err) => {
        console.error('wx.login失败:', err);
        this.handleLoginError('登录初始化失败');
      }
    });
  },

  // 验证登录 - 发送到后端
  verifyLogin: function() {
    if (!this.data.loginCode || !this.data.userProfile) {
      this.handleLoginError('登录信息不完整');
      return;
    }

    const request = require('../../utils/request.js');
    
    request.post('/auth/wechat-login', {
      code: this.data.loginCode,
      userInfo: this.data.userProfile.userInfo,
      encryptedData: this.data.userProfile.encryptedData,
      iv: this.data.userProfile.iv
    }, { loading: true })
    .then(res => {
      console.log('登录验证成功:', res);
      // 保存登录信息
      wx.setStorageSync('token', res.data.token);
      wx.setStorageSync('userInfo', res.data.userInfo);
      wx.setStorageSync('memberId', res.data.memberId);
      
      const app = getApp();
      app.globalData.userInfo = res.data.userInfo;
      app.globalData.isLogin = true;
      app.globalData.memberId = res.data.memberId;
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 延迟跳转避免toast被截断
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
    })
    .catch(err => {
      console.error('登录验证失败:', err);
      this.handleLoginError(err.message || '登录验证失败');
    });
  },

  // 统一错误处理
  handleLoginError: function(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    });
    this.setData({ 
      isLoggingIn: false,
      loginStep: 0
    });
  },

  // 手机号绑定（可选）
  onBindPhone: function() {
    wx.navigateTo({
      url: '/pages/login/bind-phone'
    });
  },

  // 游客模式
  onGuestMode: function() {
    wx.showModal({
      title: '游客模式',
      content: '游客模式无法享受会员权益和订单功能，是否继续？',
      success: (res) => {
        if (res.confirm) {
          // 设置游客标识
          const app = getApp();
          app.globalData.isLogin = false;
          app.globalData.userInfo = null;
          wx.setStorageSync('isGuest', true);
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      }
    });
  },

  // 查看隐私政策
  onPrivacyPolicy: function() {
    wx.showModal({
      title: '隐私政策',
      content: '我们承诺保护您的个人信息安全，收集的信息仅用于提供点餐服务和会员权益。您的数据将严格保密，不会泄露给第三方。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});