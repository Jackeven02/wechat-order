# 微信小程序代码模板

## 基础模板

### 页面模板

```javascript
// pages/template/template.js
Page({
  data: {
    // 页面数据
    title: '',
    list: [],
    loading: false,
    hasMore: true
  },

  // 页面参数
  options: {},

  // 生命周期
  onLoad: function(options) {
    this.options = options || {}
    this.init()
  },

  onShow: function() {
    // 页面显示
  },

  onReady: function() {
    // 页面渲染完成
  },

  onHide: function() {
    // 页面隐藏
  },

  onUnload: function() {
    // 页面卸载，清理资源
    this.cleanup()
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.refresh()
  },

  // 上拉加载更多
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 初始化
  init: function() {
    this.loadData()
  },

  // 加载数据
  loadData: function() {
    this.setData({ loading: true })
    
    // 模拟API调用
    setTimeout(() => {
      this.setData({
        list: ['item1', 'item2', 'item3'],
        loading: false
      })
    }, 1000)
  },

  // 刷新数据
  refresh: function() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  // 加载更多
  loadMore: function() {
    this.setData({ loading: true })
    
    // 模拟加载更多
    setTimeout(() => {
      const newList = this.data.list.concat(['new item'])
      this.setData({
        list: newList,
        loading: false,
        hasMore: newList.length < 20 // 控制是否还有更多
      })
    }, 1000)
  },

  // 清理资源
  cleanup: function() {
    // 清理定时器、监听器等
  },

  // 事件处理
  handleTap: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
```

```html
<!-- pages/template/template.wxml -->
<view class="container">
  <!-- 导航栏 -->
  <view class="navbar">
    <text class="title">{{title}}</text>
  </view>

  <!-- 内容区域 -->
  <scroll-view 
    class="content" 
    scroll-y 
    enable-back-to-top
    refresher-enabled
    refresher-triggered="{{refreshing}}"
    bindrefresherrefresh="onRefresh"
    bindscrolltolower="onScrollToLower">
    
    <!-- 列表 -->
    <view class="list">
      <block wx:for="{{list}}" wx:key="index">
        <view class="list-item" bindtap="handleTap" data-id="{{item.id}}">
          <text>{{item.name}}</text>
        </view>
      </block>
    </view>

    <!-- 加载状态 -->
    <view class="loading" wx:if="{{loading}}">
      <text>加载中...</text>
    </view>

    <!-- 没有更多 -->
    <view class="no-more" wx:elif="{{!hasMore && list.length > 0}}">
      <text>没有更多了</text>
    </view>

    <!-- 空状态 -->
    <view class="empty" wx:elif="{{list.length === 0 && !loading}}">
      <text>暂无数据</text>
    </view>
  </scroll-view>
</view>
```

```css
/* pages/template/template.wxss */
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  height: 88rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid #eee;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
}

.content {
  flex: 1;
  padding: 20rpx;
}

.list {
  margin-bottom: 20rpx;
}

.list-item {
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.loading, .no-more, .empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
```

```json
{
  "navigationBarTitleText": "页面标题",
  "enablePullDownRefresh": true,
  "backgroundTextStyle": "dark",
  "onReachBottomDistance": 50
}
```

## 组件模板

### 自定义组件

```javascript
// components/custom-button/custom-button.js
Component({
  properties: {
    // 组件属性
    type: {
      type: String,
      value: 'primary'
    },
    size: {
      type: String,
      value: 'default'
    },
    disabled: {
      type: Boolean,
      value: false
    },
    loading: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 组件内部数据
    isPressed: false
  },

  methods: {
    // 组件方法
    onTap: function() {
      if (this.data.disabled || this.data.loading) {
        return
      }
      
      // 触发自定义事件
      this.triggerEvent('tap', {
        timestamp: Date.now()
      })
    },

    onPress: function() {
      this.setData({ isPressed: true })
    },

    onRelease: function() {
      this.setData({ isPressed: false })
    }
  }
})
```

```html
<!-- components/custom-button/custom-button.wxml -->
<view 
  class="custom-button {{type}} {{size}} {{disabled ? 'disabled' : ''}} {{isPressed ? 'pressed' : ''}}"
  bindtap="onTap"
  bindtouchstart="onPress"
  bindtouchend="onRelease"
  bindtouchcancel="onRelease">
  
  <text class="button-text" wx:if="{{!loading}}">{{text}}</text>
  <view class="loading-icon" wx:else></view>
</view>
```

```css
/* components/custom-button/custom-button.wxss */
.custom-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  transition: all 0.2s;
}

.custom-button.primary {
  background-color: #007aff;
  color: white;
}

.custom-button.secondary {
  background-color: #f8f8f8;
  color: #333;
  border: 1rpx solid #ddd;
}

.custom-button.small {
  padding: 15rpx 30rpx;
  font-size: 24rpx;
}

.custom-button.large {
  padding: 25rpx 50rpx;
  font-size: 36rpx;
}

.custom-button.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.custom-button.pressed {
  transform: scale(0.95);
}

.button-text {
  font-size: 28rpx;
}

.loading-icon {
  width: 30rpx;
  height: 30rpx;
  border: 2rpx solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

```json
{
  "component": true,
  "usingComponents": {}
}
```

## 工具函数模板

### 网络请求封装

```javascript
// utils/request.js
const BASE_URL = 'https://api.example.com'

// 请求拦截器
const interceptors = {
  request: [],
  response: []
}

class Request {
  constructor() {
    this.baseURL = BASE_URL
    this.timeout = 10000
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    interceptors.request.push(interceptor)
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    interceptors.response.push(interceptor)
  }

  // 核心请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      // 请求拦截
      let config = { ...options }
      interceptors.request.forEach(interceptor => {
        config = interceptor(config) || config
      })

      wx.request({
        url: this.baseURL + config.url,
        method: config.method || 'GET',
        data: config.data || {},
        header: {
          'content-type': 'application/json',
          ...config.header
        },
        timeout: config.timeout || this.timeout,
        success: (res) => {
          // 响应拦截
          let result = res
          interceptors.response.forEach(interceptor => {
            result = interceptor(result) || result
          })
          
          if (result.statusCode === 200) {
            resolve(result.data)
          } else {
            reject(new Error(`HTTP ${result.statusCode}`))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  get(url, data = {}, options = {}) {
    return this.request({
      ...options,
      method: 'GET',
      url,
      data
    })
  }

  post(url, data = {}, options = {}) {
    return this.request({
      ...options,
      method: 'POST',
      url,
      data
    })
  }

  put(url, data = {}, options = {}) {
    return this.request({
      ...options,
      method: 'PUT',
      url,
      data
    })
  }

  delete(url, data = {}, options = {}) {
    return this.request({
      ...options,
      method: 'DELETE',
      url,
      data
    })
  }
}

const request = new Request()

// 默认响应拦截器 - 处理业务错误
request.addResponseInterceptor(response => {
  if (response.data && response.data.code !== 0) {
    wx.showToast({
      title: response.data.message || '请求失败',
      icon: 'none'
    })
    throw new Error(response.data.message)
  }
  return response
})

module.exports = request
```

### 数据存储工具

```javascript
// utils/storage.js
class Storage {
  // 设置存储
  set(key, value, expire = 0) {
    try {
      const data = {
        value: value,
        timestamp: Date.now(),
        expire: expire > 0 ? Date.now() + expire : 0
      }
      wx.setStorageSync(key, data)
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  }

  // 获取存储
  get(key, defaultValue = null) {
    try {
      const data = wx.getStorageSync(key)
      if (!data) return defaultValue
      
      // 检查是否过期
      if (data.expire > 0 && Date.now() > data.expire) {
        this.remove(key)
        return defaultValue
      }
      
      return data.value
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  }

  // 移除存储
  remove(key) {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (e) {
      console.error('Storage remove error:', e)
      return false
    }
  }

  // 清空所有存储
  clear() {
    try {
      wx.clearStorageSync()
      return true
    } catch (e) {
      console.error('Storage clear error:', e)
      return false
    }
  }

  // 获取存储信息
  getInfo(key) {
    try {
      const data = wx.getStorageSync(key)
      if (!data) return null
      
      return {
        key: key,
        size: JSON.stringify(data).length,
        createTime: data.timestamp,
        expireTime: data.expire,
        isExpired: data.expire > 0 && Date.now() > data.expire
      }
    } catch (e) {
      console.error('Storage getInfo error:', e)
      return null
    }
  }
}

module.exports = new Storage()
```

### 工具函数集合

```javascript
// utils/util.js
module.exports = {
  // 格式化时间
  formatTime: function(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(this.formatNumber).join('/') + ' ' +
           [hour, minute, second].map(this.formatNumber).join(':')
  },

  // 数字补零
  formatNumber: function(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },

  // 防抖函数
  debounce: function(func, wait) {
    let timeout
    return function(...args) {
      const context = this
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(context, args), wait)
    }
  },

  // 节流函数
  throttle: function(func, wait) {
    let previous = 0
    return function(...args) {
      const now = Date.now()
      const context = this
      if (now - previous > wait) {
        func.apply(context, args)
        previous = now
      }
    }
  },

  // 深拷贝
  deepClone: function(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj)
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    if (typeof obj === 'object') {
      const clonedObj = {}
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key])
        }
      }
      return clonedObj
    }
  },

  // 数组去重
  uniqueArray: function(arr, key) {
    if (!key) {
      return [...new Set(arr)]
    }
    
    const map = new Map()
    arr.forEach(item => {
      if (!map.has(item[key])) {
        map.set(item[key], item)
      }
    })
    return [...map.values()]
  },

  // 验证手机号
  validatePhone: function(phone) {
    const reg = /^1[3-9]\d{9}$/
    return reg.test(phone)
  },

  // 验证邮箱
  validateEmail: function(email) {
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return reg.test(email)
  },

  // 获取URL参数
  getUrlParams: function(url) {
    const params = {}
    const queryString = url.split('?')[1]
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=')
        params[decodeURIComponent(key)] = decodeURIComponent(value || '')
      })
    }
    return params
  }
}
```

## 业务场景模板

### 登录流程

```javascript
// pages/login/login.js
Page({
  data: {
    phone: '',
    code: '',
    sending: false,
    countdown: 0
  },

  // 获取验证码
  sendCode: function() {
    if (!this.validatePhone()) return
    
    if (this.data.sending) return
    
    this.setData({ sending: true })
    
    // 调用发送验证码API
    request.post('/api/send-code', {
      phone: this.data.phone
    }).then(() => {
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })
      
      // 开始倒计时
      this.startCountdown()
    }).catch(err => {
      wx.showToast({
        title: err.message,
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ sending: false })
    })
  },

  // 倒计时
  startCountdown: function() {
    let count = 60
    this.setData({ countdown: count })
    
    const timer = setInterval(() => {
      count--
      this.setData({ countdown: count })
      
      if (count <= 0) {
        clearInterval(timer)
        this.setData({ countdown: 0 })
      }
    }, 1000)
  },

  // 验证手机号
  validatePhone: function() {
    const phone = this.data.phone.trim()
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return false
    }
    
    if (!util.validatePhone(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 登录
  login: function() {
    if (!this.validatePhone()) return
    
    const code = this.data.code.trim()
    if (!code) {
      wx.showToast({
        title: '请输入验证码',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '登录中...' })
    
    request.post('/api/login', {
      phone: this.data.phone,
      code: code
    }).then(res => {
      // 存储token
      storage.set('token', res.token, 7 * 24 * 60 * 60 * 1000) // 7天过期
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      // 跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      })
    }).catch(err => {
      wx.showToast({
        title: err.message,
        icon: 'none'
      })
    }).finally(() => {
      wx.hideLoading()
    })
  },

  // 输入处理
  onPhoneInput: function(e) {
    this.setData({ phone: e.detail.value })
  },

  onCodeInput: function(e) {
    this.setData({ code: e.detail.value })
  }
})
```

这些模板可以直接在项目中使用，根据具体需求进行调整和扩展。