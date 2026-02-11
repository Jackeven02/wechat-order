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
    let cart = app.globalData.cart || [];
    
    // 确保每项商品都有formattedPrice字段
    cart = cart.map(item => {
      if (!item.formattedPrice) {
        item.formattedPrice = (item.price / 100).toFixed(2);
      }
      return item;
    });
    
    // 初始化选中状态
    const selectedItems = cart.map(item => item.dishId);
    
    console.log('=== 购物车数据调试 ===');
    console.log('cart:', cart);
    console.log('selectedItems:', selectedItems);
    console.log('每个商品的选中状态:');
    cart.forEach(item => {
      console.log(`${item.name}: dishId=${item.dishId}, isSelected=${selectedItems.includes(item.dishId)}`);
    });
    
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
    
    // 预处理每个商品的选中状态
    const processedCart = this.data.cart.map(item => {
      return {
        ...item,
        isSelected: this.data.selectedItems.includes(item.dishId)
      };
    });
    
    this.setData({
      totalPrice: totalPrice,
      totalCount: totalCount,
      formattedTotalPrice: (totalPrice / 100).toFixed(2),
      processedCart: processedCart  // 添加预处理后的数据
    });
  },

  // 选择商品
  onItemSelect: function(e) {
    const { dishid } = e.currentTarget.dataset;
    let selectedItems = [...this.data.selectedItems];
    const index = selectedItems.indexOf(dishid);
    
    if (index > -1) {
      // 取消选择
      selectedItems.splice(index, 1);
    } else {
      // 添加选择
      selectedItems.push(dishid);
    }
    
    this.setData({ 
      selectedItems: selectedItems 
    });
    
    this.calculateTotal();
  },

  // 增加数量（新增方法，对应WXML中的onIncrease）
  onIncrease: function(e) {
    const { index } = e.currentTarget.dataset;
    const cart = this.data.cart;
    
    if (index >= 0 && index < cart.length) {
      cart[index].quantity += 1;
      
      const app = getApp();
      app.globalData.cart = cart;
      wx.setStorageSync('cart', cart);
      
      this.setData({ cart: cart });
      this.calculateTotal();
    }
  },

  // 减少数量（新增方法，对应WXML中的onDecrease）
  onDecrease: function(e) {
    const { index } = e.currentTarget.dataset;
    const cart = this.data.cart;
    
    if (index >= 0 && index < cart.length && cart[index].quantity > 1) {
      cart[index].quantity -= 1;
      
      const app = getApp();
      app.globalData.cart = cart;
      wx.setStorageSync('cart', cart);
      
      this.setData({ cart: cart });
      this.calculateTotal();
    }
  },

  // 移除商品（新增方法，对应WXML中的removeItem）
  removeItem: function(e) {
    const { index } = e.currentTarget.dataset;
    const cart = this.data.cart;
    
    if (index >= 0 && index < cart.length) {
      const removedItem = cart.splice(index, 1)[0];
      const selectedItems = this.data.selectedItems.filter(id => id !== removedItem.dishId);
      
      const app = getApp();
      app.globalData.cart = cart;
      wx.setStorageSync('cart', cart);
      
      this.setData({
        cart: cart,
        selectedItems: selectedItems
      });
      
      this.calculateTotal();
      
      if (cart.length === 0) {
        wx.showToast({
          title: '购物车已清空',
          icon: 'success'
        });
      }
    }
  },

  // 全选/取消全选
  onSelectAll: function() {
    const allSelected = this.data.selectedItems.length === this.data.cart.length && this.data.cart.length > 0;
    
    console.log('=== 全选调试 ===');
    console.log('当前选中项:', this.data.selectedItems);
    console.log('购物车项:', this.data.cart.map(item => item.dishId));
    console.log('是否全选:', allSelected);
    console.log('购物车长度:', this.data.cart.length);
    console.log('选中项长度:', this.data.selectedItems.length);
    console.log('选中项类型:', typeof this.data.selectedItems);
    console.log('选中项构造函数:', this.data.selectedItems.constructor.name);
    
    let newSelectedItems;
    if (allSelected) {
      // 取消全选
      newSelectedItems = [];
      console.log('执行取消全选');
    } else {
      // 全选
      newSelectedItems = this.data.cart.map(item => item.dishId);
      console.log('执行全选');
    }
    
    console.log('新选中项:', newSelectedItems);
    console.log('新选中项类型:', typeof newSelectedItems);
    
    this.setData({ 
      selectedItems: newSelectedItems 
    });
    
    this.calculateTotal();
    
    // 强制更新UI - 使用不同的方式
    this.setData({
      _trigger: Math.random() // 触发重新渲染
    });
    
    // 添加延迟调试
    setTimeout(() => {
      console.log('=== 延迟调试 ===');
      console.log('最终选中项:', this.data.selectedItems);
      console.log('最终购物车:', this.data.cart);
      console.log('最终选中项类型:', typeof this.data.selectedItems);
    }, 100);
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
    console.log('=== 提交订单调试 ===');
    console.log('登录状态:', this.data.isLogin);
    console.log('桌台信息:', this.data.tableInfo);
    console.log('选中商品:', this.data.selectedItems);
    console.log('购物车:', this.data.cart);
    
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