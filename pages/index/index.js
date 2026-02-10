// pages/index/index.js
Page({
  data: {
    tableInfo: null,
    userInfo: null,
    isLogin: false,
    storeInfo: {
      name: '智慧餐厅',
      address: '北京市朝阳区某某路123号',
      phone: '010-12345678',
      businessHours: '10:00-22:00'
    },
    quickActions: [
      {
        id: 1,
        icon: 'https://picsum.photos/100/100?random=1',
        text: '扫码点餐',
        url: '/pages/table/table'
      },
      {
        id: 2,
        icon: 'https://picsum.photos/100/100?random=2',
        text: '菜单浏览',
        url: '/pages/menu/menu'
      },
      {
        id: 3,
        icon: 'https://picsum.photos/100/100?random=3',
        text: '我的订单',
        url: '/pages/order/order'
      },
      {
        id: 4,
        icon: 'https://picsum.photos/100/100?random=4',
        text: '会员中心',
        url: '/pages/member/member'
      }
    ],
    banners: [
      {
        id: 1,
        image: 'https://picsum.photos/800/400?random=5',
        title: '新品上市'
      },
      {
        id: 2,
        image: 'https://picsum.photos/800/400?random=6',
        title: '限时优惠'
      }
    ],
    notices: [
      '欢迎光临智慧餐厅！',
      '本周特色菜品：红烧肉特价',
      '会员专享：充值满500送100'
    ]
  },

  onLoad: function(options) {
    this.initPage();
  },

  onShow: function() {
    this.updateUserInfo();
    this.updateTableInfo();
  },

  // 初始化页面
  initPage: function() {
    this.updateUserInfo();
    this.updateTableInfo();
    this.loadStoreInfo();
  },

  // 更新用户信息
  updateUserInfo: function() {
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      isLogin: app.globalData.isLogin
    });
  },

  // 更新桌台信息
  updateTableInfo: function() {
    const app = getApp();
    this.setData({
      tableInfo: app.globalData.tableInfo
    });
  },

  // 加载门店信息
  loadStoreInfo: function() {
    // 这里可以从API获取实际的门店信息
    // 暂时使用默认数据
  },

  // 快捷操作点击
  onQuickActionTap: function(e) {
    const { url } = e.currentTarget.dataset;
    
    if (!url) return;
    
    // 检查是否需要登录
    if (url !== '/pages/table/table' && !this.data.isLogin) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    wx.navigateTo({
      url: url
    });
  },

  // 桌台信息点击
  onTableInfoTap: function() {
    if (this.data.tableInfo) {
      wx.navigateTo({
        url: '/pages/table/table'
      });
    }
  },

  // 轮播图点击
  onBannerTap: function(e) {
    const { index } = e.currentTarget.dataset;
    console.log('点击banner:', index);
    // 可以跳转到对应活动页面
  },

  // 公告点击
  onNoticeTap: function() {
    wx.showToast({
      title: '更多优惠活动敬请期待',
      icon: 'none'
    });
  },

  // 门店信息点击
  onStoreInfoTap: function() {
    wx.openLocation({
      latitude: 39.9042,
      longitude: 116.4074,
      name: this.data.storeInfo.name,
      address: this.data.storeInfo.address
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.initPage();
    wx.stopPullDownRefresh();
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '智慧餐厅 - 便捷的用餐体验',
      path: '/pages/index/index',
      imageUrl: 'https://picsum.photos/300/300?random=7'
    };
  }
});