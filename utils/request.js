// utils/request.js
const BASE_URL = 'https://your-api-domain.com/api'; // 替换为你的API域名
const MOCK_DATA = require('../mock/mock-data.js'); // 引入模拟数据

// 存储新创建的订单数据
const createdOrders = {};

class Request {
  constructor() {
    this.baseURL = BASE_URL;
    this.timeout = 10000;
    this.useMock = true; // 开发环境下使用模拟数据
  }

  // 核心请求方法
  request(options) {
    // 开发环境下使用模拟数据
    if (this.useMock) {
      return this.mockRequest(options);
    }

    return new Promise((resolve, reject) => {
      const {
        url,
        method = 'GET',
        data = {},
        header = {},
        loading = true
      } = options;

      // 显示加载提示
      if (loading) {
        wx.showLoading({
          title: '加载中...',
          mask: true
        });
      }

      // 获取token
      const token = wx.getStorageSync('token');

      wx.request({
        url: this.baseURL + url,
        method: method,
        data: data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...header
        },
        timeout: this.timeout,
        success: (res) => {
          if (loading) {
            wx.hideLoading();
          }

          if (res.statusCode === 200) {
            if (res.data.code === 0) {
              resolve(res.data);
            } else {
              // 业务错误处理
              wx.showToast({
                title: res.data.message || '请求失败',
                icon: 'none'
              });
              reject(res.data);
            }
          } else if (res.statusCode === 401) {
            // 未授权，清除登录状态并跳转登录
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('token');
            wx.removeStorageSync('memberId');
            
            getApp().globalData.userInfo = null;
            getApp().globalData.isLogin = false;
            getApp().globalData.memberId = null;
            
            wx.navigateTo({
              url: '/pages/login/login'
            });
            reject(res);
          } else {
            wx.showToast({
              title: `请求失败(${res.statusCode})`,
              icon: 'none'
            });
            reject(res);
          }
        },
        fail: (err) => {
          if (loading) {
            wx.hideLoading();
          }
          
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  }

  // 模拟请求方法
  mockRequest(options) {
    const { url, method = 'GET', data = {}, loading = true } = options;
    
    if (loading) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }

    return new Promise((resolve, reject) => {
      // 模拟网络延迟
      setTimeout(() => {
        if (loading) {
          wx.hideLoading();
        }

        try {
          let result = null;
          
          // 根据URL路由返回相应数据
          if (url.includes('/menu/categories')) {
            result = { code: 0, data: MOCK_DATA.categories };
          } else if (url.includes('/menu/dishes')) {
            result = { code: 0, data: MOCK_DATA.dishes };
          } else if (url.includes('/orders/list')) {
            result = { code: 0, data: MOCK_DATA.orders };
          } else if (url.includes('/orders/detail')) {
            const orderId = url.split('/').pop();
            // 先在模拟数据中查找
            let order = MOCK_DATA.orders.find(o => o.id == orderId);
            // 如果找不到，从创建的订单中查找
            if (!order) {
              order = createdOrders[orderId];
            }
            // 如果还是找不到，创建一个模拟的
            if (!order) {
              order = {
                id: orderId.replace('mock_order_', ''),
                orderNumber: 'ORD' + Date.now(),
                tableNumber: 'A01',
                status: 'pending',
                totalAmount: 0,
                createTime: new Date().toLocaleString(),
                items: []
              };
            }
            result = { code: 0, data: order };
          } else if (url.includes('/auth/wechat-login')) {
            result = { 
              code: 0, 
              data: {
                token: 'mock_token_' + Date.now(),
                userInfo: {
                  nickName: '测试用户',
                  avatarUrl: 'https://picsum.photos/100/100'
                }
              }
            };
          } else if (url.includes('/table/bind')) {
            result = {
              code: 0,
              data: {
                tableId: data.tableId || 'mock_table_1',
                tableNumber: 'A01',
                status: 'available',
                storeId: 'mock_store_1'
              }
            };
          } else if (url.includes('/orders/create')) {
            const orderId = 'mock_order_' + Date.now();
            const orderData = {
              id: orderId.replace('mock_order_', ''),
              orderId: orderId,
              orderNumber: 'ORD' + Date.now(),
              tableId: data.tableId,
              tableNumber: data.tableNumber || 'A01',
              totalAmount: data.totalAmount,
              status: 'pending',
              createTime: new Date().toLocaleString(),
              items: data.items || []
            };
            
            // 存储订单数据
            createdOrders[orderId] = orderData;
            
            result = {
              code: 0,
              data: orderData
            };
          } else {
            // 默认成功响应
            result = { code: 0, data: {}, message: '操作成功' };
          }

          resolve(result);
        } catch (error) {
          if (loading) {
            wx.hideLoading();
          }
          wx.showToast({
            title: '请求失败',
            icon: 'none'
          });
          reject(error);
        }
      }, 500); // 模拟500ms延迟
    });
  }

  get(url, data = {}, options = {}) {
    return this.request({
      ...options,
      method: 'GET',
      url,
      data
    });
  }

  post(url, data = {}, options = {}) {
    return this.request({
      ...options,
      method: 'POST',
      url,
      data
    });
  }

  put(url, data = {}, options = {}) {
    return this.request({
      ...options,
      method: 'PUT',
      url,
      data
    });
  }

  delete(url, data = {}, options = {}) {
    return this.request({
      ...options,
      method: 'DELETE',
      url,
      data
    });
  }
}

// 创建实例
const request = new Request();

module.exports = request;