// pages/order/order.js
Page({
  data: {
    orders: [],
    activeTab: 0,
    tabs: ['全部', '待制作', '制作中', '已完成'],
    userInfo: null,
    isLogin: false
  },

  onLoad: function() {
    this.initPage();
  },

  onShow: function() {
    this.loadOrders();
    this.updateUserInfo();
  },

  // 初始化页面
  initPage: function() {
    this.updateUserInfo();
    this.loadOrders();
  },

  // 更新用户信息
  updateUserInfo: function() {
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      isLogin: app.globalData.isLogin
    });
  },

  // 加载订单数据
  loadOrders: function() {
    // 检查登录状态
    if (!this.data.isLogin) {
      this.setData({ orders: [] });
      return;
    }

    const request = require('../../utils/request.js');
    
    request.get('/orders/list', {
      status: this.data.activeTab === 0 ? '' : this.data.tabs[this.data.activeTab]
    }, { loading: true })
    .then(res => {
      const rawOrders = res.data || [];
      // 预处理订单数据，添加格式化字段
      const formattedOrders = rawOrders.map(order => ({
        ...order,
        formattedTotalAmount: (order.totalAmount / 100).toFixed(2),
        items: order.items.map(item => ({
          ...item,
          formattedPrice: (item.price / 100).toFixed(2)
        }))
      }));
      this.setData({ orders: formattedOrders });
    })
    .catch(err => {
      console.error('加载订单失败', err);
      this.setData({ orders: [] });
    });
  },

  // 切换标签页
  onTabChange: function(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ activeTab: index });
    this.loadOrders();
  },

  // 查看订单详情
  onViewOrder: function(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    });
  },

  // 取消订单
  onCancelOrder: function(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.cancelOrder(id);
        }
      }
    });
  },

  // 执行取消订单
  cancelOrder: function(orderId) {
    const request = require('../../utils/request.js');
    
    request.post('/orders/cancel', { orderId: orderId }, { loading: true })
    .then(res => {
      wx.showToast({
        title: '订单已取消',
        icon: 'success'
      });
      this.loadOrders();
    })
    .catch(err => {
      wx.showToast({
        title: err.message || '取消失败',
        icon: 'none'
      });
    });
  },

  // 去点餐
  onGoToMenu: function() {
    wx.switchTab({
      url: '/pages/menu/menu'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadOrders();
    wx.stopPullDownRefresh();
  }
});