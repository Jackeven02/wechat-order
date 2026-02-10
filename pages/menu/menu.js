// pages/menu/menu.js
Page({
  data: {
    activeCategory: 0,
    categories: [],
    dishes: [],
    filteredDishes: [],
    cart: [],
    searchKeyword: '',
    showSearch: false,
    isLoading: false,
    // 购物车总价格式化显示
    formattedCartTotal: '0.00'
  },

  onLoad: function() {
    this.loadMenuData();
    this.loadCart();
  },

  onShow: function() {
    this.loadCart();
  },

  // 加载菜单数据
  loadMenuData: function() {
    this.setData({ isLoading: true });
    
    const request = require('../../utils/request.js');
    
    // 并行请求分类和菜品数据
    Promise.all([
      request.get('/menu/categories'),
      request.get('/menu/dishes')
    ])
    .then(([categoriesRes, dishesRes]) => {
      const categories = categoriesRes.data || [];
      const dishes = (dishesRes.data || []).map(dish => ({
        ...dish,
        formattedPrice: (dish.price / 100).toFixed(2)
      }));
      
      this.setData({
        categories: categories,
        dishes: dishes,
        filteredDishes: dishes.map(dish => ({
          ...dish,
          formattedPrice: (dish.price / 100).toFixed(2)
        })),
        isLoading: false
      });
      
      // 默认展开第一个分类
      if (categories.length > 0) {
        this.onCategorySelect({ currentTarget: { dataset: { index: 0, id: categories[0].id } } });
      }
    })
    .catch(err => {
      console.error('加载菜单数据失败', err);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ isLoading: false });
    });
  },

  // 加载购物车
  loadCart: function() {
    const app = getApp();
    const cart = app.globalData.cart || [];
    this.setData({ cart: cart });
    
    // 计算并格式化购物车总价
    this.calculateAndFormatCartTotal();
  },

  // 计算并格式化购物车总价
  calculateAndFormatCartTotal: function() {
    const cart = this.data.cart;
    if (!cart || cart.length === 0) {
      this.setData({ formattedCartTotal: '0.00' });
      return;
    }
    
    // 计算总价（分）
    const totalInCents = cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    // 转换为元并格式化
    const formattedTotal = (totalInCents / 100).toFixed(2);
    
    this.setData({ formattedCartTotal: formattedTotal });
  },
  onCategorySelect: function(e) {
    const { index, id } = e.currentTarget.dataset;
    
    this.setData({ activeCategory: index });
    
    // 筛选对应分类的菜品
    const filteredDishes = this.data.dishes.filter(dish => 
      dish.categoryId === id || dish.categoryIds.includes(id)
    );
    
    this.setData({ filteredDishes: filteredDishes });
  },

  // 搜索功能
  onSearchInput: function(e) {
    const keyword = e.detail.value.toLowerCase();
    this.setData({ searchKeyword: keyword });
    
    if (keyword.trim() === '') {
      this.setData({ filteredDishes: this.data.dishes });
    } else {
      const filtered = this.data.dishes.filter(dish => 
        dish.name.toLowerCase().includes(keyword) ||
        dish.description.toLowerCase().includes(keyword)
      );
      this.setData({ filteredDishes: filtered });
    }
  },

  // 切换搜索显示
  toggleSearch: function() {
    this.setData({ 
      showSearch: !this.data.showSearch,
      searchKeyword: ''
    });
    
    if (!this.data.showSearch) {
      this.setData({ filteredDishes: this.data.dishes });
    }
  },

  // 菜品详情
  onDishDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/menu/detail?id=${id}`
    });
  },

  // 添加到购物车
  onAddToCart: function(e) {
    const { dish } = e.currentTarget.dataset;
    
    // 检查库存
    if (dish.stock <= 0) {
      wx.showToast({
        title: '该菜品已售罄',
        icon: 'none'
      });
      return;
    }
    
    const app = getApp();
    let cart = [...app.globalData.cart];
    
    // 检查是否已存在
    const existingIndex = cart.findIndex(item => item.dishId === dish.id);
    
    if (existingIndex > -1) {
      // 增加数量
      if (cart[existingIndex].quantity < dish.stock) {
        cart[existingIndex].quantity += 1;
      } else {
        wx.showToast({
          title: '已达最大库存',
          icon: 'none'
        });
        return;
      }
    } else {
      // 新增菜品
      cart.push({
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        quantity: 1,
        remark: ''
      });
    }
    
    // 更新购物车
    app.globalData.cart = cart;
    wx.setStorageSync('cart', cart);
    this.setData({ cart: cart });
    
    // 显示添加成功动画
    this.showAddAnimation(e);
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 显示添加动画
  showAddAnimation: function(e) {
    // 这里可以实现添加到购物车的动画效果
    console.log('显示添加动画', e);
  },

  // 购物车预览
  onCartPreview: function() {
    if (this.data.cart.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      });
      return;
    }
    
    wx.switchTab({
      url: '/pages/cart/cart'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadMenuData();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多（如果需要分页）
  onReachBottom: function() {
    // 如果有分页逻辑，可以在这里实现
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '智慧餐厅 - 美味菜品等你来点',
      path: '/pages/menu/menu',
      imageUrl: 'https://picsum.photos/300/300?random=14'
    };
  }
});