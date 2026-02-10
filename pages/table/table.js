// pages/table/table.js
Page({
  data: {
    isScanning: false,
    tableInfo: null,
    showBindConfirm: false
  },

  onLoad: function(options) {
    // 检查是否通过扫码进入
    if (options.scene) {
      // 处理二维码参数
      this.handleScanCode(options.scene);
    }
  },

  // 扫码绑定桌台
  onScanTable: function() {
    if (this.data.isScanning) return;
    
    this.setData({ isScanning: true });
    
    wx.scanCode({
      success: (res) => {
        console.log('扫码成功', res);
        this.handleScanResult(res.result);
      },
      fail: (err) => {
        console.log('扫码失败', err);
        if (err.errMsg !== 'scanCode:fail cancel') {
          wx.showToast({
            title: '扫码失败，请重试',
            icon: 'none'
          });
        }
      },
      complete: () => {
        this.setData({ isScanning: false });
      }
    });
  },

  // 处理扫码结果
  handleScanResult: function(scanResult) {
    try {
      // 解析二维码内容（假设格式为 tableId=123 或 URL参数形式）
      let tableId = null;
      
      if (scanResult.includes('tableId=')) {
        const params = this.getUrlParams(scanResult);
        tableId = params.tableId;
      } else if (scanResult.startsWith('http')) {
        // 如果是URL，提取参数
        const urlObj = new URL(scanResult);
        tableId = urlObj.searchParams.get('tableId');
      } else {
        // 直接作为tableId
        tableId = scanResult;
      }
      
      if (tableId) {
        this.bindTable(tableId);
      } else {
        wx.showToast({
          title: '无效的桌台二维码',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('解析二维码失败', error);
      wx.showToast({
        title: '二维码格式错误',
        icon: 'none'
      });
    }
  },

  // 绑定桌台
  bindTable: function(tableId) {
    const request = require('../../utils/request.js');
    
    request.post('/table/bind', {
      tableId: tableId
    }, { loading: true })
    .then(res => {
      // 保存桌台信息到全局
      const tableInfo = {
        tableId: res.data.tableId,
        tableNumber: res.data.tableNumber,
        status: res.data.status,
        storeId: res.data.storeId,
        bindTime: new Date().getTime()
      };
      
      wx.setStorageSync('tableInfo', tableInfo);
      
      const app = getApp();
      app.globalData.tableInfo = tableInfo;
      
      this.setData({
        tableInfo: tableInfo,
        showBindConfirm: true
      });
      
      wx.showToast({
        title: `成功绑定桌台${tableInfo.tableNumber}`,
        icon: 'success'
      });
    })
    .catch(err => {
      console.error('绑定桌台失败', err);
      wx.showToast({
        title: err.message || '绑定失败',
        icon: 'none'
      });
    });
  },

  // 确认绑定
  onConfirmBind: function() {
    this.setData({ showBindConfirm: false });
    
    // 跳转到点餐页面
    wx.switchTab({
      url: '/pages/menu/menu'
    });
  },

  // 取消绑定
  onCancelBind: function() {
    this.setData({ showBindConfirm: false });
  },

  // 手动输入桌台号
  onManualInput: function() {
    wx.showModal({
      title: '手动绑定',
      editable: true,
      placeholderText: '请输入桌台号',
      success: (res) => {
        if (res.confirm && res.content) {
          const tableNumber = res.content.trim();
          if (tableNumber) {
            this.bindTableByNumber(tableNumber);
          }
        }
      }
    });
  },

  // 通过桌台号绑定
  bindTableByNumber: function(tableNumber) {
    const request = require('../../utils/request.js');
    
    request.post('/table/bind-by-number', {
      tableNumber: tableNumber
    }, { loading: true })
    .then(res => {
      const tableInfo = {
        tableId: res.data.tableId,
        tableNumber: res.data.tableNumber,
        status: res.data.status,
        storeId: res.data.storeId,
        bindTime: new Date().getTime()
      };
      
      wx.setStorageSync('tableInfo', tableInfo);
      const app = getApp();
      app.globalData.tableInfo = tableInfo;
      
      this.setData({ tableInfo: tableInfo });
      
      wx.showToast({
        title: `成功绑定桌台${tableNumber}`,
        icon: 'success'
      });
    })
    .catch(err => {
      wx.showToast({
        title: err.message || '绑定失败',
        icon: 'none'
      });
    });
  },

  // 解绑桌台
  onUnbindTable: function() {
    wx.showModal({
      title: '解绑桌台',
      content: '确定要解绑当前桌台吗？',
      success: (res) => {
        if (res.confirm) {
          this.unbindTable();
        }
      }
    });
  },

  // 执行解绑
  unbindTable: function() {
    wx.removeStorageSync('tableInfo');
    const app = getApp();
    app.globalData.tableInfo = null;
    
    this.setData({ tableInfo: null });
    
    wx.showToast({
      title: '已解绑桌台',
      icon: 'success'
    });
  },

  // 获取URL参数
  getUrlParams: function(url) {
    const params = {};
    const queryString = url.split('?')[1];
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }
    return params;
  }
});