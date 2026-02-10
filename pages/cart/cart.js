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
      // 预处理购物车数据，添加格式化的价格
      cart: this.data.cart.map(item => ({
        ...item,
        formattedPrice: (item.price / 100).toFixed(2),
        formattedSubtotal: ((item.price * item.quantity) / 100).toFixed(2)
      })),
      // 格式化总价
      formattedTotalPrice: (totalPrice / 100).toFixed(2)
    });
  },

  // 选择/取消选择商品
  onItemSelect: function(e) {
    const { dishid } = e.currentTarget.dataset;
    let selectedItems = [...this.data.selectedItems];
    
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
    if (this.data.selectedItems.length === this.data.cart.length) {
      this.setData({ selectedItems: [] });
    } else {
      const allIds = this.data.cart.map(item => item.dishId);
      this.setData({ selectedItems: allIds });
    }
    this.calculateTotal();
  },

  // 增加数量
  onIncrease: function(e) {
    const { index } = e.currentTarget.dataset;
    let cart = [...this.data.cart];
    
    // 检查库存
    if (cart[index].quantity < cart[index].stock) {
      cart[index].quantity += 1;
      this.updateCart(cart);
    } else {
      wx.showToast({
        title: '已达最大库存',
        icon: 'none'
      });
    }
  },

  // 减少数量
  onDecrease: function(e) {
    const { index } = e.currentTarget.dataset;
    let cart = [...this.data.cart];
    
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
      this.updateCart(cart);
    } else {
      // 数量为1时询问是否删除
      wx.showModal({
        title: '删除商品',
        content: '确定要删除这件商品吗？',
        success: (res) => {
          if (res.confirm) {
            this.removeItem(index);
          }
        }
      });
    }
  },

  // 删除商品
  removeItem: function(index) {
    let cart = [...this.data.cart];
    const removedItem = cart.splice(index, 1)[0];
    
    // 更新选中状态
    let selectedItems = [...this.data.selectedItems];
    const selectedIndex = selectedItems.indexOf(removedItem.dishId);
    if (selectedIndex > -1) {
      selectedItems.splice(selectedIndex, 1);
    }
    
    this.setData({
      cart: cart,
      selectedItems: selectedItems
    });
    
    this.updateGlobalCart(cart);
    this.calculateTotal();
    
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });
  },

  // 更新购物车
  updateCart: function(cart) {
    this.setData({ cart: cart });
    this.updateGlobalCart(cart);
    this.calculateTotal();
  },

  // 更新全局购物车
  updateGlobalCart: function(cart) {
    const app = getApp();
    app.globalData.cart = cart;
    wx.setStorageSync('cart', cart);
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
            totalCount: 0
          });
          
          wx.showToast({
            title: '购物车已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 添加备注
  onAddRemark: function(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.cart[index];
    
    this.setData({
      showRemarkModal: true,
      currentRemarkItem: index,
      remarkContent: item.remark || ''
    });
  },

  // 备注输入
  onRemarkInput: function(e) {
    this.setData({ remarkContent: e.detail.value });
  },

  // 确认备注
  onConfirmRemark: function() {
    const index = this.data.currentRemarkItem;
    let cart = [...this.data.cart];
    
    cart[index].remark = this.data.remarkContent;
    
    this.setData({
      cart: cart,
      showRemarkModal: false,
      currentRemarkItem: null,
      remarkContent: ''
    });
    
    this.updateGlobalCart(cart);
    
    wx.showToast({
      title: '备注已保存',
      icon: 'success'
    });
  },

  // 取消备注
  onCancelRemark: function() {
    this.setData({
      showRemarkModal: false,
      currentRemarkItem: null,
      remarkContent: ''
    });
  },

  // 提交订单
  onSubmitOrder: function() {
    // 检查桌台绑定
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
    
    // 检查是否选择了商品
    if (this.data.selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要下单的商品',
        icon: 'none'
      });
      return;
    }
    
    // 检查登录状态
    if (!this.data.isLogin) {
      wx.showModal({
        title: '温馨提示',
        content: '下单需要登录，是否前往登录？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
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
      remark: '' // 可以添加全局订单备注
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