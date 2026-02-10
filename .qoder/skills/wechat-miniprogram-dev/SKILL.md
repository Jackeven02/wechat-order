---
name: wechat-miniprogram-dev
description: 微信小程序开发框架指导，涵盖页面结构、WXML/WXSS语法、事件处理、生命周期、路由管理等核心开发知识。适用于微信小程序项目开发、问题排查和最佳实践参考。
---

# 微信小程序开发框架指南

## 核心概念

微信小程序是一种全新的连接用户与服务的方式，具有原生APP体验。主要特点：
- 使用JavaScript作为主要开发语言
- 逻辑层和渲染层分离运行
- 支持iOS和Android两大平台
- 提供丰富的组件和API

## 项目结构

### 基础文件构成

```
project/
├── app.js          # 小程序逻辑（必需）
├── app.json        # 小程序公共配置（必需）
├── app.wxss        # 小程序公共样式表（可选）
├── project.config.json  # 项目配置文件
└── pages/          # 页面目录
    ├── index/      # 首页
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    └── logs/       # 日志页
        ├── logs.js
        ├── logs.json
        ├── logs.wxml
        └── logs.wxss
```

### 文件作用说明

**全局文件：**
- `app.js`：注册小程序，包含应用级生命周期函数
- `app.json`：全局配置，定义页面路径、窗口表现、网络超时等
- `app.wxss`：全局样式，作用于所有页面
- `project.config.json`：开发工具配置

**页面文件：**
- `[page].js`：页面逻辑，注册页面构造器
- `[page].json`：页面配置，覆盖全局配置
- `[page].wxml`：页面结构，类似HTML的标签语言
- `[page].wxss`：页面样式，类似CSS

## 核心语法

### WXML (WeiXin Markup Language)

#### 数据绑定
```html
<!-- 基础数据绑定 -->
<view>{{message}}</view>

<!-- 属性绑定 -->
<view id="{{id}}">{{message}}</view>

<!-- 运算表达式 -->
<view>{{a + b}} + {{c}} + d</view>
<view hidden="{{flag ? true : false}}">Hidden</view>
```

#### 列表渲染
```html
<!-- 基本列表 -->
<view wx:for="{{array}}">{{item}}</view>

<!-- 自定义索引和变量名 -->
<view wx:for="{{array}}" wx:for-index="idx" wx:for-item="itemName">
  {{idx}}: {{itemName.message}}
</view>

<!-- block包装 -->
<block wx:for="{{[1, 2, 3]}}">
  <view>{{index}}:</view>
  <view>{{item}}</view>
</block>
```

#### 条件渲染
```html
<!-- 基础条件 -->
<view wx:if="{{length > 5}}">1</view>
<view wx:elif="{{length > 2}}">2</view>
<view wx:else>3</view>

<!-- block条件 -->
<block wx:if="{{true}}">
  <view>view1</view>
  <view>view2</view>
</block>
```

#### 模板
```html
<!-- 定义模板 -->
<template name="staffName">
  <view>
    FirstName: {{firstName}}, LastName: {{lastName}}
  </view>
</template>

<!-- 使用模板 -->
<template is="staffName" data="{{...staffA}}"></template>
<template is="staffName" data="{{...staffB}}"></template>
```

### WXSS (WeiXin Style Sheets)

#### 尺寸单位
```css
/* rpx单位 - 响应式像素 */
.container {
  width: 750rpx;  /* iPhone6上等于375px */
  height: 300rpx;
}

/* 常用设备换算 */
/* iPhone5: 1rpx = 0.42px */
/* iPhone6: 1rpx = 0.5px */
/* iPhone6 Plus: 1rpx = 0.552px */
```

#### 样式导入
```css
/* common.wxss */
.small-p {
  padding: 5px;
}

/* app.wxss */
@import "common.wxss";
.middle-p {
  padding: 15px;
}
```

#### 选择器支持
```css
/* 支持的选择器 */
.class {}          /* 类选择器 */
#id {}             /* ID选择器 */
element {}         /* 元素选择器 */
element, element {} /* 并集选择器 */
::after {}         /* 伪元素 */
::before {}        /* 伪元素 */
```

### JS逻辑层

#### Page构造器
```javascript
// 页面注册
Page({
  // 页面数据
  data: {
    text: "This is page data."
  },
  
  // 生命周期函数
  onLoad: function(options) {
    // 页面加载时执行，可获取启动参数
  },
  
  onShow: function() {
    // 页面显示时执行
  },
  
  onReady: function() {
    // 页面初次渲染完成时执行
  },
  
  onHide: function() {
    // 页面隐藏时执行
  },
  
  onUnload: function() {
    // 页面卸载时执行
  },
  
  // 页面事件处理函数
  viewTap: function() {
    this.setData({
      text: 'Set some data for updating view.'
    })
  },
  
  // 自定义数据
  customData: {
    hi: 'MINA'
  }
})
```

#### App构造器
```javascript
// app.js - 应用注册
App({
  // 应用生命周期
  onLaunch: function(options) {
    // 应用启动时执行
    // options包含场景值、启动参数等
  },
  
  onShow: function(options) {
    // 应用显示时执行
  },
  
  onHide: function() {
    // 应用隐藏时执行
  },
  
  onError: function(msg) {
    console.log(msg)
  },
  
  // 全局数据
  globalData: {
    userInfo: null
  }
})

// 获取全局实例
const appInstance = getApp()
console.log(appInstance.globalData)
```

## 事件系统

### 事件绑定
```html
<!-- 基础事件绑定 -->
<view bindtap="tapName">Click me!</view>

<!-- 传参事件 -->
<view bindtap="tapName" data-id="{{id}}" data-name="{{name}}">
  Click with data
</view>
```

```javascript
Page({
  tapName: function(event) {
    console.log(event)
    // 获取dataset数据
    console.log(event.currentTarget.dataset.id)
    console.log(event.currentTarget.dataset.name)
  }
})
```

### 事件类型

**冒泡事件：**
- touchstart, touchmove, touchend, touchcancel
- tap, longpress, longtap
- transitionend, animationstart, animationiteration, animationend

**非冒泡事件：**
- form的submit事件
- input的input事件
- scroll-view的scroll事件

### 事件阻止
```html
<!-- 阻止冒泡 -->
<view catchtap="handleTap2">Middle view</view>

<!-- 互斥事件绑定 -->
<view mut-bind:tap="handleTap1">Outer view</view>
```

## 生命周期

### 应用生命周期
```
onLaunch → onShow → onHide → onShow → ...
     ↓
   onError (异常时触发)
```

### 页面生命周期
```
onLoad → onShow → onReady → onHide → onShow → ...
     ↓                    ↓
  onUnload (页面卸载)   onPageScroll (页面滚动)
```

### 路由生命周期触发顺序

**打开新页面 (navigateTo)：**
1. 当前页面 onHide
2. 新页面 onLoad
3. 新页面 onShow

**页面重定向 (redirectTo)：**
1. 当前页面 onUnload
2. 新页面 onLoad
3. 新页面 onShow

**页面返回 (navigateBack)：**
1. 当前页面 onUnload
2. 前页面 onShow

## 页面路由

### 路由API
```javascript
// 打开新页面
wx.navigateTo({
  url: 'pages/detail/detail?id=1'
})

// 页面重定向
wx.redirectTo({
  url: 'pages/home/home'
})

// 切换Tab
wx.switchTab({
  url: 'pages/index/index'
})

// 关闭所有页面并跳转
wx.reLaunch({
  url: 'pages/start/start'
})

// 页面返回
wx.navigateBack({
  delta: 1
})
```

### 路由限制
- `navigateTo` 和 `redirectTo` 只能打开非 tabBar 页面
- `switchTab` 只能打开 tabBar 页面
- 页面栈最多10层

## 配置文件

### app.json 全局配置
```json
{
  "pages": [
    "pages/index/index",
    "pages/logs/logs"
  ],
  "window": {
    "navigationBarTitleText": "Demo",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#eeeeee",
    "backgroundTextStyle": "light",
    "enablePullDownRefresh": true
  },
  "tabBar": {
    "list": [{
      "pagePath": "pages/index/index",
      "text": "首页"
    }, {
      "pagePath": "pages/logs/logs",
      "text": "日志"
    }]
  },
  "networkTimeout": {
    "request": 10000,
    "connectSocket": 10000,
    "uploadFile": 10000,
    "downloadFile": 10000
  },
  "debug": true
}
```

### 页面配置 (page.json)
```json
{
  "navigationBarBackgroundColor": "#ffffff",
  "navigationBarTextStyle": "black",
  "navigationBarTitleText": "页面标题",
  "backgroundColor": "#eeeeee",
  "backgroundTextStyle": "light",
  "enablePullDownRefresh": true,
  "disableScroll": false
}
```

## 最佳实践

### 性能优化
1. 避免频繁setData调用
2. 合理使用rpx单位适配不同屏幕
3. 图片资源做好压缩和格式优化
4. 避免页面层级过深

### 开发规范
1. 统一命名规范
2. 合理拆分组件
3. 做好错误处理
4. 注重用户体验

### 调试技巧
1. 使用微信开发者工具
2. 利用console.log调试
3. 网络面板查看请求
4. 存储面板检查数据

## 常见问题

### 1. 页面数据更新不及时
- 确保使用this.setData()更新数据
- 检查数据路径是否正确

### 2. 样式不生效
- 检查选择器优先级
- 确认样式文件是否正确引入
- 注意全局样式与局部样式的覆盖关系

### 3. 事件绑定失效
- 检查函数名拼写
- 确认事件名是否正确
- 验证data属性格式

### 4. 路由跳转失败
- 检查页面是否在app.json中注册
- 确认页面路径是否正确
- 验证路由API使用是否符合规范

## 参考资源

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [小程序开发指南](https://developers.weixin.qq.com/miniprogram/dev/guide/)
- [小程序组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/)
- [小程序API文档](https://developers.weixin.qq.com/miniprogram/dev/api/)