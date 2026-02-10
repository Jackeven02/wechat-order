# 微信小程序开发Skill使用说明

## 技能概述

这是一个完整的微信小程序开发指导skill，包含了从小程序基础概念到高级开发技巧的全面内容。适用于：

- 微信小程序新手入门学习
- 项目开发中的问题排查
- 最佳实践参考
- 代码模板快速复制

## 文件结构

```
wechat-miniprogram-dev/
├── SKILL.md        # 主技能文件，核心概念和基础语法
├── REFERENCE.md    # 详细参考手册，深入技术细节
├── TEMPLATES.md    # 代码模板集合，可直接使用的代码片段
└── USAGE.md        # 本使用说明文件
```

## 如何使用

### 1. 学习路径建议

**新手入门顺序：**
1. 阅读 `SKILL.md` 了解基础概念和项目结构
2. 参考 `TEMPLATES.md` 中的基础页面模板快速上手
3. 遇到具体问题时查阅 `REFERENCE.md` 的详细说明

**进阶开发者：**
- 直接查阅 `REFERENCE.md` 获取深入的技术细节
- 使用 `TEMPLATES.md` 中的高级模板和工具函数
- 参考最佳实践和性能优化建议

### 2. 常见使用场景

#### 场景1：创建新页面
```markdown
参考 TEMPLATES.md 中的"页面模板"部分
1. 复制完整的页面代码结构
2. 根据业务需求修改数据和方法
3. 调整样式和布局
```

#### 场景2：处理路由跳转
```markdown
参考 SKILL.md 中的"页面路由"部分
1. 根据需求选择合适的路由API
2. 注意页面栈限制和tabBar约束
3. 处理页面间数据传递
```

#### 场景3：优化性能
```markdown
参考 REFERENCE.md 中的"性能优化策略"部分
1. 实施虚拟列表减少渲染压力
2. 使用防抖节流优化频繁操作
3. 合理管理内存和资源清理
```

#### 场景4：调试问题
```markdown
参考 REFERENCE.md 中的"调试技巧"部分
1. 使用开发者工具的各种面板
2. 实施错误监控和上报
3. 利用条件编译进行调试
```

### 3. 快速查找指南

| 需求 | 查找位置 | 关键词 |
|------|----------|--------|
| 基础语法 | SKILL.md | WXML, WXSS, JS |
| 生命周期 | SKILL.md | onLoad, onShow, onUnload |
| 事件处理 | SKILL.md | bindtap, dataset |
| 路由管理 | SKILL.md | navigateTo, switchTab |
| 配置文件 | SKILL.md | app.json, page.json |
| 深入原理 | REFERENCE.md | observers, computed |
| 性能优化 | REFERENCE.md | setData, 内存管理 |
| 调试技巧 | REFERENCE.md | 开发者工具, 性能监控 |
| 页面模板 | TEMPLATES.md | 页面模板 |
| 组件模板 | TEMPLATES.md | 自定义组件 |
| 工具函数 | TEMPLATES.md | request, storage |

### 4. 实际应用示例

#### 示例1：实现列表页面
```javascript
// 1. 参考 TEMPLATES.md 的页面模板
// 2. 修改数据结构适应业务需求
Page({
  data: {
    productList: [],  // 商品列表
    currentPage: 1,   // 当前页码
    pageSize: 10,     // 每页数量
    hasMore: true     // 是否还有更多
  },
  
  // 3. 实现具体的业务逻辑
  loadData: function() {
    // 调用实际的API
    request.get('/api/products', {
      page: this.data.currentPage,
      size: this.data.pageSize
    }).then(res => {
      this.setData({
        productList: res.data.list,
        hasMore: res.data.list.length === this.data.pageSize
      })
    })
  }
})
```

#### 示例2：封装网络请求
```javascript
// 1. 参考 TEMPLATES.md 的网络请求封装
// 2. 根据项目需求调整拦截器
request.addRequestInterceptor(config => {
  // 添加认证token
  const token = storage.get('token')
  if (token) {
    config.header.Authorization = `Bearer ${token}`
  }
  return config
})

// 3. 统一错误处理
request.addResponseInterceptor(response => {
  if (response.data.code === 401) {
    // token过期，跳转登录
    wx.redirectTo({ url: '/pages/login/login' })
    return
  }
  return response
})
```

## 最佳实践建议

### 1. 代码组织
- 按功能模块组织目录结构
- 统一命名规范和代码风格
- 合理拆分组件提高复用性

### 2. 性能优化
- 避免频繁的setData调用
- 实施图片懒加载
- 合理使用缓存机制

### 3. 用户体验
- 提供良好的加载状态反馈
- 处理各种异常情况
- 优化交互响应速度

### 4. 开发效率
- 建立组件库提高复用
- 使用模板快速搭建页面
- 建立统一的工具函数库

## 常见问题解答

### Q1: 如何处理页面间数据传递？
A: 可以通过URL参数、全局变量、storage等方式，参考REFERENCE.md中的详细说明。

### Q2: setData调用太频繁怎么办？
A: 使用批量更新、防抖节流等优化策略，参考REFERENCE.md的性能优化部分。

### Q3: 如何实现组件间通信？
A: 使用triggerEvent触发自定义事件，或通过全局状态管理，参考TEMPLATES.md的组件模板。

### Q4: 页面加载慢如何优化？
A: 实施虚拟列表、图片懒加载、代码分割等策略，参考REFERENCE.md的性能优化章节。

## 更新维护

这个skill会定期根据微信小程序官方文档更新进行维护，建议：
1. 关注微信官方文档更新
2. 根据项目实践经验持续完善
3. 收集团队内部最佳实践

## 反馈建议

如果您在使用过程中发现任何问题或有更好的建议，欢迎提出改进意见，让我们一起完善这个开发skill。