// utils/util.js
module.exports = {
  // 格式化时间
  formatTime: function(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return [year, month, day].map(this.formatNumber).join('-') + ' ' +
           [hour, minute, second].map(this.formatNumber).join(':');
  },

  // 数字补零
  formatNumber: function(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
  },

  // 格式化金额
  formatPrice: function(price) {
    return '¥' + (price / 100).toFixed(2);
  },

  // 计算总价
  calculateTotal: function(cart) {
    return cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },

  // 防抖函数
  debounce: function(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  },

  // 节流函数
  throttle: function(func, wait) {
    let previous = 0;
    return function(...args) {
      const now = Date.now();
      const context = this;
      if (now - previous > wait) {
        func.apply(context, args);
        previous = now;
      }
    };
  },

  // 深拷贝
  deepClone: function(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  // 数组去重
  uniqueArray: function(arr, key) {
    if (!key) {
      return [...new Set(arr)];
    }
    
    const map = new Map();
    arr.forEach(item => {
      if (!map.has(item[key])) {
        map.set(item[key], item);
      }
    });
    return [...map.values()];
  },

  // 验证手机号
  validatePhone: function(phone) {
    const reg = /^1[3-9]\d{9}$/;
    return reg.test(phone);
  },

  // 验证身份证
  validateIdCard: function(idCard) {
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(idCard);
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
  },

  // 生成唯一ID
  generateUUID: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // 计算两点间距离
  getDistance: function(lat1, lng1, lat2, lng2) {
    const radLat1 = lat1 * Math.PI / 180.0;
    const radLat2 = lat2 * Math.PI / 180.0;
    const a = radLat1 - radLat2;
    const b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return s;
  }
};