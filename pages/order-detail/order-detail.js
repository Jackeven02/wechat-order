// pages/order-detail/order-detail.js
Page({
  data: {
    order: null,
    orderId: null
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrderDetail();
    }
  },

  // 加载订单详情
  loadOrderDetail: function() {
    const request = require('../../utils/request.js');
    
    request.get(`/orders/detail/${this.data.orderId}`, {}, { loading: true })
    .then(res => {
      const order = res.data;
      if (order) {
        // 格式化订单中的价格
        const formattedOrder = {
          ...order,
          formattedTotalAmount: (order.totalAmount / 100).toFixed(2),
          items: order.items.map(item => ({
            ...item,
            formattedPrice: (item.price / 100).toFixed(2),
            formattedSubtotal: ((item.price * item.quantity) / 100).toFixed(2)
          }))
        };
        this.setData({ order: formattedOrder });
      }
    })
    .catch(err => {
      console.error('加载订单详情失败', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 获取状态样式类
  getStatusClass: function(status) {
    const statusMap = {
      'pending': 'status-pending',
      'processing': 'status-processing', 
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  },

  // 获取状态文本
  getStatusText: function(status) {
    const statusMap = {
      'pending': '待处理',
      'processing': '制作中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  // 联系客服
  onContactService: function() {
    wx.showToast({
      title: '联系客服功能开发中',
      icon: 'none'
    });
  },

  // 再来一单
  onOrderAgain: function() {
    wx.switchTab({
      url: '/pages/menu/menu'
    });
  }
});