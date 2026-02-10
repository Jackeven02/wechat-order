// pages/member/member.js
Page({
  data: {
    userInfo: null,
    isLogin: false,
    memberInfo: null,
    // 格式化后的数据显示
    formattedPoints: 0,
    formattedBalance: '0.00',
    formattedCoupons: 0
  },

  onLoad: function() {
    this.initPage();
  },

  onShow: function() {
    this.updateUserInfo();
  },

  // 初始化页面
  initPage: function() {
    this.updateUserInfo();
  },

  // 更新用户信息
  updateUserInfo: function() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    const isLogin = app.globalData.isLogin;
    const memberInfo = app.globalData.memberInfo || null;
    
    // 安全访问memberInfo属性并格式化
    const formattedPoints = memberInfo && memberInfo.points ? memberInfo.points : 0;
    const formattedBalance = memberInfo && memberInfo.balance ? (memberInfo.balance / 100).toFixed(2) : '0.00';
    const formattedCoupons = memberInfo && memberInfo.coupons ? memberInfo.coupons : 0;
    
    this.setData({
      userInfo: userInfo,
      isLogin: isLogin,
      memberInfo: memberInfo,
      formattedPoints: formattedPoints,
      formattedBalance: formattedBalance,
      formattedCoupons: formattedCoupons
    });
  },

  // 去登录
  onGoToLogin: function() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 查看积分
  onViewPoints: function() {
    wx.showToast({
      title: '积分功能开发中',
      icon: 'none'
    });
  },

  // 查看余额
  onViewBalance: function() {
    wx.showToast({
      title: '余额功能开发中',
      icon: 'none'
    });
  },

  // 我的优惠券
  onMyCoupons: function() {
    wx.showToast({
      title: '优惠券功能开发中',
      icon: 'none'
    });
  },

  // 我的订单
  onMyOrders: function() {
    wx.switchTab({
      url: '/pages/order/order'
    });
  }
});