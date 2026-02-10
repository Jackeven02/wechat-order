// pages/cart/cart.js
Page({
  data: {
    cart: [],
    selectedItems: [],
    totalPrice: 0,
    totalCount: 0,
    tableInfo: null,
    userInfo: null,
    isLogin: false,
    showRemarkModal: false,
    currentRemarkItem: null,
    remarkContent: ''
  },

  onLoad: function() {
    this.initPage();
  },

  onShow: function() {
    this.loadCartData();
    this.updateUserInfo();
    this.updateTableInfo();
  },

  // 初始化页面
  initPage: function() {
    this.loadCartData();
    this.updateUserInfo();
    this.updateTableInfo();
  },

  // 加载购物车数据
  loadCartData: function() {
    const app = getApp();
    const cart = app.globalData.cart || [];
    
    // 初始化选中状态
    const selectedItems = cart.map(item => item.dishId);
    
    this.setData({
      cart: cart,
      selectedItems: selectedItems
    });
    
    this.calculateTotal();
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

  // 计算总价和数量
  calculateTotal: function() {
    const selectedCart = this.data.cart.filter(item => 
      this.data.selectedItems.includes(item.dishId)
    );
    
    const totalPrice = selectedCart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const totalCount = selectedCart.reduce((count, item) => {
      return count + item.quantity;
    }, 0);
    
    this.setData({
      totalPrice: totalPrice,
      totalCount: totalCount,
      formattedTotalPrice: (totalPrice / 100).toFixed(2)
    });
  },

  // 选择商品
  onSelectItem: function(e) {
    const { dishid } = e.currentTarget.dataset;
    const selectedItems = this.data.selectedItems;
    const index = selectedItems.indexOf(dishid);
    
    if (index > -1) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(dishid);
    }
    
    this.setData({ selectedItems: selectedItems });
    this.calculateTotal();
  },

  // 全选/取消全选
  onSelectAll: function() {
    const allSelected = this.data.selectedItems.length === this.data.cart.length;
    
    if (allSelected) {
      this.setData({ selectedItems: [] });
    } else {
      const allItemIds = this.data.cart.map(item => item.dishId);
      this.setData({ selectedItems: allItemIds });
    }
    
    this.calculateTotal();
  },

  // 修改数量
  onChangeQuantity: function(e) {
    const { dishid, type } = e.currentTarget.dataset;
    const cart = this.data.cart;
    const itemIndex = cart.findIndex(item => item.dishId === dishid);
    
    if (itemIndex > -1) {
      if (type === 'add') {
        cart[itemIndex].quantity += 1;
      } else if (type === 'reduce' && cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
      }
      
      const app = getApp();
      app.globalData.cart = cart;
      wx.setStorageSync('cart', cart);
      
      this.setData({ cart: cart });
      this.calculateTotal();
    }
  },

  // 删除商品
  onDeleteItem: function(e) {
    const { dishid } = e.currentTarget.dataset;
    const cart = this.data.cart.filter(item => item.dishId !== dishid);
    const selectedItems = this.data.selectedItems.filter(id => id !== dishid);
    
    const app = getApp();
    app.globalData.cart = cart;
    wx.setStorageSync('cart', cart);
    
    this.setData({
      cart: cart,
      selectedItems: selectedItems
    });
    
    this.calculateTotal();
  },

  // 清空购物车
  onClearCart: function() {
    wx.showModal({
      title: '清空购物车',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.globalData.cart = [];
          wx.setStorageSync('cart', []);
          
          this.setData({
            cart: [],
            selectedItems: [],
            totalPrice: 0,
            totalCount: 0,
            formattedTotalPrice: '0.00'
          });
        }
      }
    });
  },

  // 添加备注
  onAddRemark: function(e) {
    const { dishid } = e.currentTarget.dataset;
    const item = this.data.cart.find(item => item.dishId === dishid);
    
    this.setData({
      showRemarkModal: true,
      currentRemarkItem: dishid,
      remarkContent: item.remark || ''
    });
  },

  // 备注输入
  onRemarkInput: function(e) {
    this.setData({ remarkContent: e.detail.value });
  },

  // 确认备注
  onConfirmRemark: function() {
    const { currentRemarkItem, remarkContent } = this.data;
    const cart = this.data.cart;
    const itemIndex = cart.findIndex(item => item.dishId === currentRemarkItem);
    
    if (itemIndex > -1) {
      cart[itemIndex].remark = remarkContent;
      
      const app = getApp();
      app.globalData.cart = cart;
      wx.setStorageSync('cart', cart);
      
      this.setData({
        cart: cart,
        showRemarkModal: false,
        currentRemarkItem: null,
        remarkContent: ''
      });
    }
  },

  // 取消备注
  onCancelRemark: function() {
    this.setData({
      showRemarkModal: false,
      currentRemarkItem: null,
      remarkContent: ''
    });
  },

  // 阻止冒泡
  stopPropagation: function(e) {
    // 阻止事件冒泡
  },

  // 提交订单
  onSubmitOrder: function() {
    // 检查登录状态
    if (!this.data.isLogin) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    // 检查桌台信息
    if (!this.data.tableInfo) {
      wx.showToast({
        title: '请先绑定桌台',
        icon: 'none'
      });
      wx.navigateTo({
        url: '/pages/table/table'
      });
      return;
    }
    
    // 检查是否有选中商品
    if (this.data.selectedItems.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }
    
    // 准备订单数据
    const selectedCart = this.data.cart.filter(item => 
      this.data.selectedItems.includes(item.dishId)
    );
    
    const orderData = {
      tableId: this.data.tableInfo.tableId,
      tableNumber: this.data.tableInfo.tableNumber,
      items: selectedCart.map(item => ({
        dishId: item.dishId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        remark: item.remark
      })),
      totalAmount: this.data.totalPrice,
      remark: '', // 可以添加全局订单备注
      status: 'pending' // 明确设置订单状态为待制作
    };
    
    // 跳转到确认订单页面
    wx.navigateTo({
      url: `/pages/order/confirm?orderData=${encodeURIComponent(JSON.stringify(orderData))}`
    });
  },

  // 返回菜单
  onBackToMenu: function() {
    wx.navigateTo({
      url: '/pages/table/table'
    });
  }
});