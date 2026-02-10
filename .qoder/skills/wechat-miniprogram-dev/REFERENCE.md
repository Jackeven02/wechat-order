# 微信小程序详细参考手册

## 生命周期详解

### 应用级生命周期

```javascript
App({
  // 小程序初始化完成时触发，全局只触发一次
  onLaunch: function(options) {
    console.log('小程序启动', options)
    // options包含：
    // scene: 场景值
    // query: 启动参数
    // shareTicket: 转发信息
    // referrerInfo: 来源信息
  },
  
  // 小程序启动，或从后台进入前台显示时触发
  onShow: function(options) {
    console.log('小程序显示', options)
  },
  
  // 小程序从前台进入后台时触发
  onHide: function() {
    console.log('小程序隐藏')
  },
  
  // 小程序发生脚本错误或API调用报错时触发
  onError: function(msg) {
    console.log('小程序错误', msg)
  },
  
  // 页面不存在时触发
  onPageNotFound: function(res) {
    wx.redirectTo({
      url: 'pages/error/error'
    })
  },
  
  // 全局数据
  globalData: {
    userInfo: null,
    version: '1.0.0'
  }
})
```

### 页面级生命周期

```javascript
Page({
  // 页面加载时触发，一个页面只会调用一次
  onLoad: function(options) {
    // options为页面跳转带来的参数
    console.log('页面加载', options)
  },
  
  // 页面显示时触发
  onShow: function() {
    console.log('页面显示')
  },
  
  // 页面初次渲染完成时触发
  onReady: function() {
    console.log('页面准备完成')
    // 此时页面已经准备完毕，可以调用节点信息查询
  },
  
  // 页面隐藏时触发
  onHide: function() {
    console.log('页面隐藏')
  },
  
  // 页面卸载时触发
  onUnload: function() {
    console.log('页面卸载')
  },
  
  // 下拉刷新时触发
  onPullDownRefresh: function() {
    console.log('下拉刷新')
    // 处理完数据后停止下拉刷新
    wx.stopPullDownRefresh()
  },
  
  // 页面上拉触底时触发
  onReachBottom: function() {
    console.log('页面触底')
  },
  
  // 页面滚动时触发
  onPageScroll: function(res) {
    console.log('页面滚动', res.scrollTop)
  },
  
  // 页面尺寸改变时触发
  onResize: function(res) {
    console.log('页面尺寸改变', res.size)
  },
  
  // 当前是 tab 页时，点击 tab 时触发
  onTabItemTap: function(item) {
    console.log('tab点击', item)
  },
  
  // 用户点击右上角转发时触发
  onShareAppMessage: function(res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '自定义转发标题',
      path: '/page/user?id=123'
    }
  },
  
  // 页面分享朋友圈时触发
  onShareTimeline: function() {
    return {
      title: '自定义分享标题',
      query: 'a=1&b=2'
    }
  }
})
```

## WXML进阶语法

### 模板引用

```html
<!-- 引入外部模板 -->
<import src="template.wxml"/>

<!-- 使用模板 -->
<template is="模板名称" data="{{...数据}}"></template>

<!-- include引用 -->
<include src="header.wxml"/>
```

### wxs模块

```html
<!-- 内联wxs -->
<wxs module="m1">
var getMax = function(array) {
  var max = undefined;
  for (var i = 0; i < array.length; ++i) {
    max = max === undefined ? array[i] : (max > array[i] ? max : array[i]);
  }
  return max;
}
module.exports.getMax = getMax;
</wxs>

<view>{{m1.getMax(array)}}</view>
```

```html
<!-- 外部wxs文件 -->
<wxs src="./filters.wxs" module="filters" />
<view>{{filters.formatDate(date)}}</view>
```

### 条件编译

```html
<!-- 平台特定代码 -->
<view wx:if="{{__wxcli}}">开发者工具</view>
<view wx:elif="{{__wxandroid}}">安卓</view>
<view wx:elif="{{__wxios}}">iOS</view>
```

## 数据处理

### setData详解

```javascript
Page({
  data: {
    array: [{text: 'init data'}],
    msg: 'hello'
  },
  
  changeData: function() {
    // 基础用法
    this.setData({
      msg: 'world'
    })
    
    // 修改数组某一项
    this.setData({
      'array[0].text': 'changed data'
    })
    
    // 修改对象属性
    this.setData({
      'object.text': 'changed data'
    })
    
    // 带回调函数
    this.setData({
      msg: 'updated'
    }, function() {
      console.log('数据更新完成')
    })
    
    // 批量更新
    this.setData({
      msg: 'batch update',
      'array[0].text': 'batch changed'
    })
  }
})
```

### 数据监听

```javascript
Page({
  observers: {
    // 监听单个字段
    'field1': function(field1) {
      console.log('field1 changed', field1)
    },
    
    // 监听多个字段
    'field1, field2': function(field1, field2) {
      console.log('fields changed', field1, field2)
    },
    
    // 监听对象属性
    'object.field': function(field) {
      console.log('object.field changed', field)
    },
    
    // 监听数组
    'array': function(newArray) {
      console.log('array changed', newArray)
    },
    
    // 监听所有数据
    '**': function() {
      console.log('any data changed')
    }
  }
})
```

## 事件系统深入

### 事件对象结构

```javascript
Page({
  tapHandler: function(event) {
    // 基础事件对象
    console.log('事件类型:', event.type)
    console.log('时间戳:', event.timeStamp)
    
    // 触发事件的目标组件
    console.log('目标组件:', event.target)
    console.log('目标ID:', event.target.id)
    console.log('目标dataset:', event.target.dataset)
    
    // 当前组件（事件绑定的组件）
    console.log('当前组件:', event.currentTarget)
    console.log('当前ID:', event.currentTarget.id)
    console.log('当前dataset:', event.currentTarget.dataset)
    
    // 自定义数据
    console.log('mark数据:', event.mark)
    
    // 触摸事件特有属性
    if (event.touches) {
      console.log('触摸点:', event.touches)
      console.log('变化触摸点:', event.changedTouches)
    }
    
    // 自定义事件特有属性
    if (event.detail) {
      console.log('详细信息:', event.detail)
    }
  }
})
```

### dataset使用技巧

```html
<!-- HTML中定义data属性 -->
<view 
  data-user-id="{{userId}}" 
  data-user-name="{{userName}}"
  data-complex-data="{{complexObject}}"
  bindtap="handleTap">
  Click me
</view>
```

```javascript
Page({
  handleTap: function(event) {
    // 获取dataset数据
    const userId = event.currentTarget.dataset.userId
    const userName = event.currentTarget.dataset.userName
    const complexData = event.currentTarget.dataset.complexData
    
    // 连字符会转换为驼峰命名
    // data-user-id → userId
    // data-user-name → userName
    // data-complex-data → complexData
  }
})
```

## 路由管理详解

### 路由API对比

| API | 跳转方式 | 页面栈变化 | 是否关闭当前页面 | tabBar支持 |
|-----|----------|------------|------------------|------------|
| wx.navigateTo | 打开 | 增加一层 | 否 | 否 |
| wx.redirectTo | 重定向 | 替换当前 | 是 | 否 |
| wx.switchTab | 切换 | 特殊处理 | 是 | 是 |
| wx.reLaunch | 重启 | 清空并重建 | 是 | 是 |
| wx.navigateBack | 返回 | 减少层数 | 是 | - |

### 页面栈管理

```javascript
// 获取当前页面栈
const pages = getCurrentPages()
console.log('页面栈长度:', pages.length)
console.log('当前页面:', pages[pages.length - 1])

// 页面栈操作示例
Page({
  navigateToDetail: function() {
    const pages = getCurrentPages()
    if (pages.length >= 10) {
      // 页面栈满时的处理
      wx.showToast({
        title: '页面层级过多',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/detail/detail'
    })
  },
  
  goBackWithParams: function() {
    const pages = getCurrentPages()
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      // 向前一页传递数据
      prevPage.setData({
        fromChild: 'some data'
      })
    }
    
    wx.navigateBack()
  }
})
```

## 配置文件详解

### app.json完整配置

```json
{
  "pages": [
    "pages/index/index",
    "pages/logs/logs"
  ],
  "window": {
    "navigationBarBackgroundColor": "#000000",
    "navigationBarTextStyle": "white",
    "navigationBarTitleText": "小程序标题",
    "navigationStyle": "default",
    "backgroundColor": "#ffffff",
    "backgroundTextStyle": "dark",
    "backgroundColorTop": "#ffffff",
    "backgroundColorBottom": "#ffffff",
    "enablePullDownRefresh": false,
    "onReachBottomDistance": 50
  },
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#3cc51f",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [{
      "pagePath": "pages/index/index",
      "iconPath": "images/icon_component.png",
      "selectedIconPath": "images/icon_component_HL.png",
      "text": "组件"
    }, {
      "pagePath": "pages/logs/logs",
      "iconPath": "images/icon_API.png",
      "selectedIconPath": "images/icon_API_HL.png",
      "text": "接口"
    }],
    "position": "bottom",
    "custom": false
  },
  "networkTimeout": {
    "request": 60000,
    "connectSocket": 60000,
    "uploadFile": 60000,
    "downloadFile": 60000
  },
  "debug": true,
  "requiredBackgroundModes": ["audio", "location"],
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于小程序位置接口的效果展示"
    }
  },
  "sitemapLocation": "sitemap.json",
  "style": "v2",
  "useExtendedLib": {
    "kbone": true,
    "weui": true
  },
  "entranceDeclare": {
    "locationMessage": {
      "path": "pages/location/location",
      "query": "foo=bar"
    }
  },
  "darkmode": true,
  "themeLocation": "theme.json"
}
```

### 页面配置选项

```json
{
  "navigationBarBackgroundColor": "#ffffff",
  "navigationBarTextStyle": "black",
  "navigationBarTitleText": "页面标题",
  "navigationStyle": "default",
  "backgroundColor": "#eeeeee",
  "backgroundTextStyle": "light",
  "backgroundColorTop": "#ffffff",
  "backgroundColorBottom": "#ffffff",
  "enablePullDownRefresh": true,
  "onReachBottomDistance": 50,
  "disableScroll": false,
  "usingComponents": {
    "component-tag-name": "path/to/the/custom/component"
  }
}
```

## 性能优化策略

### 渲染优化

```javascript
Page({
  data: {
    list: [],
    scrollTop: 0
  },
  
  // 虚拟列表实现思路
  loadMore: function() {
    // 分批加载数据，避免一次性渲染大量数据
    const newData = this.generateData(20)
    this.setData({
      list: [...this.data.list, ...newData]
    })
  },
  
  // 避免频繁setData
  batchUpdate: function() {
    const updates = {}
    
    // 批量收集更新
    updates['field1'] = 'value1'
    updates['field2'] = 'value2'
    updates['array[0].text'] = 'new text'
    
    // 一次性更新
    this.setData(updates)
  },
  
  // 使用computed优化计算属性
  computed: {
    fullName: function() {
      return this.data.firstName + ' ' + this.data.lastName
    }
  }
})
```

### 内存管理

```javascript
Page({
  onUnload: function() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
    }
    
    // 清理监听器
    if (this.listener) {
      this.listener.remove()
    }
    
    // 清理全局事件
    wx.offNetworkStatusChange()
  },
  
  // 图片懒加载
  lazyLoadImages: function() {
    // 使用IntersectionObserver实现图片懒加载
    this.observer = wx.createIntersectionObserver(this)
    this.observer.relativeToViewport().observe('.image-container', (res) => {
      if (res.intersectionRatio > 0) {
        // 加载图片
        this.setData({
          imageLoaded: true
        })
      }
    })
  }
})
```

## 调试技巧

### 开发者工具调试

```javascript
// 条件编译调试
Page({
  data: {
    isDevTool: __wxConfig.platform === 'devtools'
  },
  
  onLoad: function() {
    // 开发环境特殊处理
    if (this.data.isDevTool) {
      console.log('当前在开发者工具中')
      // 开发环境下的特殊逻辑
    }
  }
})

// 网络请求拦截
const originalRequest = wx.request
wx.request = function(options) {
  console.log('请求拦截:', options.url)
  return originalRequest.call(this, options)
}

// 错误监控
App({
  onError: function(error) {
    // 上报错误信息
    console.error('小程序错误:', error)
    // 可以集成错误监控服务
  }
})
```

### 性能监控

```javascript
Page({
  onReady: function() {
    // 页面性能监控
    wx.reportPerformance(1001, Date.now() - this.startTime)
  },
  
  // 自定义性能指标
  measureRenderTime: function() {
    const startTime = Date.now()
    
    this.setData({
      // 大量数据更新
    }, () => {
      const renderTime = Date.now() - startTime
      console.log('渲染耗时:', renderTime, 'ms')
      
      // 上报性能数据
      if (renderTime > 1000) {
        console.warn('渲染时间过长')
      }
    })
  }
})
```

## 安全注意事项

### 数据安全

```javascript
Page({
  // 敏感数据处理
  handleSensitiveData: function(data) {
    // 不要在data中存储敏感信息
    // 使用临时变量或加密存储
    const encrypted = this.encrypt(data)
    wx.setStorageSync('encrypted_data', encrypted)
  },
  
  // 输入验证
  validateInput: function(input) {
    // 防止XSS攻击
    const sanitized = input.replace(/[<>]/g, '')
    return sanitized
  }
})
```

### 网络安全

```javascript
// 请求封装
const request = function(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: function(res) {
        // 统一处理响应
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: reject
    })
  })
}

// 使用HTTPS
const apiCall = function() {
  return request({
    url: 'https://api.example.com/data', // 必须使用HTTPS
    header: {
      'content-type': 'application/json'
    }
  })
}
```