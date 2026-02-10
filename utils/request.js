// utils/request.js
const BASE_URL = 'https://your-api-domain.com/api'; // 替换为你的API域名
const MOCK_DATA = require('../mock/mock-data.js'); // 引入模拟数据

// 存储新创建的订单数据
const createdOrders = {};

// 兼容微信小程序的URL参数解析函数
function parseQueryString(queryString) {
  const params = {};
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
  }
  return params;
}

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
            console.log('=== 订单列表调试信息 ===');
            console.log('请求URL:', url);
            
            // 合并模拟数据和用户创建的订单
            const allOrders = [...MOCK_DATA.orders];
            
            // 将用户创建的订单添加到列表中
            Object.values(createdOrders).forEach(order => {
              // 检查是否已存在（避免重复）
              if (!allOrders.find(o => o.id == order.id)) {
                allOrders.push(order);
              }
            });
            
            console.log('所有订单数据:', allOrders);
            
            // 获取查询参数并筛选（使用兼容微信小程序的解析方式）
            const queryString = url.split('?')[1] || '';
            const params = parseQueryString(queryString);
            const statusFilter = params.status;
            
            console.log('解析的参数:', params);
            console.log('状态筛选条件:', statusFilter);
            
            // 状态筛选 - 修复：只有当statusFilter存在且非空时才进行筛选
            let finalOrders = allOrders;
            if (statusFilter && statusFilter !== '') {
              const statusMap = {
                '待制作': 'pending',
                '制作中': 'processing',
                '已完成': 'completed'
              };
              const backendStatus = statusMap[statusFilter] || statusFilter;
              console.log('映射后的后端状态:', backendStatus);
              
              finalOrders = allOrders.filter(order => {
                const match = order.status === backendStatus;
                console.log(`订单 ${order.orderNumber || order.id} 状态 ${order.status} 是否匹配 ${backendStatus}:`, match);
                return match;
              });
            } else {
              console.log('不进行状态筛选，返回所有订单');
            }
            
            console.log('最终返回订单数量:', finalOrders.length);
            console.log('最终返回订单:', finalOrders);
            console.log('========================');
            
            result = { code: 0, data: finalOrders };
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
    // 将data转换为查询参数并附加到URL上
    let fullUrl = url;
    if (Object.keys(data).length > 0) {
      const queryParams = Object.keys(data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&');
      fullUrl = url.includes('?') ? `${url}&${queryParams}` : `${url}?${queryParams}`;
    }
    
    return this.request({
      ...options,
      method: 'GET',
      url: fullUrl,
      data: {}
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