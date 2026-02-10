# 微信支付V3 Skill使用说明

## 技能概述

这是一个完整的微信支付V3开发指导skill，涵盖了从基础配置到高级功能的全面内容。适用于：

- 微信支付商户系统开发
- 支付功能集成和调试
- 支付安全和合规性检查
- 支付系统运维和监控

## 文件结构

```
wechat-pay-v3/
├── SKILL.md        # 主技能文件，核心概念和基础用法
├── REFERENCE.md    # 详细参考手册，深入技术细节
├── TEMPLATES.md    # 代码模板集合，可直接使用的代码
└── USAGE.md        # 本使用说明文件
```

## 如何使用

### 1. 学习路径建议

**新手入门顺序：**
1. 阅读 `SKILL.md` 了解基础概念和核心API
2. 参考 `TEMPLATES.md` 中的基础模板快速搭建
3. 遇到具体技术问题时查阅 `REFERENCE.md` 的详细说明

**进阶开发者：**
- 直接查阅 `REFERENCE.md` 获取深入的技术实现细节
- 使用 `TEMPLATES.md` 中的高级模板和服务封装
- 参考安全最佳实践和性能优化建议

### 2. 常见使用场景

#### 场景1：快速集成支付功能
```markdown
参考 TEMPLATES.md 中的完整示例
1. 配置商户信息和密钥
2. 使用支付服务模板创建订单
3. 实现通知处理逻辑
4. 测试支付流程
```

#### 场景2：处理支付回调通知
```markdown
参考 SKILL.md 中的回调通知处理部分
1. 实现签名验证机制
2. 解密回调数据
3. 实施幂等性处理
4. 更新业务状态
```

#### 场景3：退款功能实现
```markdown
参考 REFERENCE.md 中的退款服务部分
1. 调用退款API
2. 处理退款回调
3. 更新订单退款状态
4. 记录退款日志
```

#### 场景4：安全合规检查
```markdown
参考 SKILL.md 中的最佳实践部分
1. 检查签名验证实现
2. 验证参数安全处理
3. 确认幂等性机制
4. 审核错误处理流程
```

### 3. 快速查找指南

| 需求 | 查找位置 | 关键词 |
|------|----------|--------|
| 基础概念 | SKILL.md | JSAPI支付, prepay_id, 签名 |
| API接口 | SKILL.md | 统一下单, 订单查询, 关闭订单 |
| 签名验签 | SKILL.md | SHA256-RSA, Authorization头 |
| 回调处理 | SKILL.md | 通知验签, 数据解密, 幂等性 |
| 详细实现 | REFERENCE.md | Signer类, Decryptor类, 证书管理 |
| 性能优化 | REFERENCE.md | 连接池, 监控指标, 错误处理 |
| 代码模板 | TEMPLATES.md | 配置模板, 服务模板, 控制器模板 |
| 错误码 | REFERENCE.md | errorCodes, 错误处理 |

### 4. 实际应用示例

#### 示例1：电商网站支付集成
```javascript
// 1. 参考 TEMPLATES.md 的支付服务模板
const PaymentService = require('./services/wechat-pay/payment')
const config = require('./config/wechat-pay')

const paymentService = new PaymentService(config)

// 2. 创建订单
app.post('/api/orders', async (req, res) => {
  const { productId, userId, amount } = req.body
  
  // 生成商户订单号
  const outTradeNo = `ORDER_${Date.now()}_${userId}`
  
  // 创建支付订单
  const result = await paymentService.createOrder({
    description: `商品-${productId}`,
    amount: amount,
    openid: req.user.openid, // 从用户会话获取
    outTradeNo: outTradeNo
  })
  
  if (result.success) {
    // 保存订单到数据库
    await OrderModel.create({
      out_trade_no: outTradeNo,
      user_id: userId,
      product_id: productId,
      amount: amount,
      status: 'pending'
    })
    
    // 返回支付参数
    const payParams = paymentService.generatePayParams(result.prepay_id)
    res.json({ success: true, payParams })
  } else {
    res.status(400).json({ success: false, message: result.error.message })
  }
})
```

#### 示例2：支付回调处理
```javascript
// 1. 参考 TEMPLATES.md 的通知控制器模板
const NotifyService = require('./services/wechat-pay/notify')
const notifyService = new NotifyService(config)

// 2. 实现业务处理逻辑
app.post('/api/wechat-pay/notify', express.raw({type: 'application/json'}), 
async (req, res) => {
  await notifyService.handlePaymentNotify(req, res, async (data) => {
    const { out_trade_no, transaction_id, amount } = data
    
    // 更新订单状态
    await OrderModel.updateOne(
      { out_trade_no: out_trade_no },
      { 
        status: 'paid',
        transaction_id: transaction_id,
        paid_at: new Date()
      }
    )
    
    // 增加用户积分
    await UserModel.updateOne(
      { openid: data.payer.openid },
      { $inc: { points: Math.floor(amount.payer_total / 100) } }
    )
    
    // 发送支付成功通知
    await NotificationService.sendPaymentSuccess(data.payer.openid, amount.payer_total)
  })
})
```

#### 示例3：退款处理
```javascript
// 1. 参考 REFERENCE.md 的退款服务
const RefundService = require('./services/wechat-pay/refund')
const refundService = new RefundService(paymentService)

// 2. 处理退款申请
app.post('/api/orders/:orderId/refund', async (req, res) => {
  const order = await OrderModel.findById(req.params.orderId)
  
  if (!order || order.status !== 'paid') {
    return res.status(400).json({ success: false, message: '订单状态不正确' })
  }
  
  // 生成退款单号
  const outRefundNo = `REFUND_${Date.now()}_${order._id}`
  
  // 发起退款
  const result = await refundService.createRefund({
    outRefundNo: outRefundNo,
    transactionId: order.transaction_id,
    outTradeNo: order.out_trade_no,
    reason: req.body.reason || '用户申请退款',
    refundAmount: req.body.amount || order.amount,
    totalAmount: order.amount
  })
  
  if (result.success) {
    // 更新订单状态为退款中
    await OrderModel.updateOne(
      { _id: order._id },
      { 
        status: 'refunding',
        refund_no: outRefundNo
      }
    )
    
    res.json({ success: true, refundId: result.refund_id })
  } else {
    res.status(400).json({ success: false, message: result.error.message })
  }
})
```

## 部署和配置

### 1. 环境变量配置
```bash
# .env 文件
WECHAT_PAY_MCHID=your_merchant_id
WECHAT_PAY_APPID=your_app_id
WECHAT_PAY_SERIAL_NO=your_certificate_serial_no
WECHAT_PAY_API_V3_KEY=your_32bit_apiv3_key
WECHAT_PAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/wechat-pay/notify
WECHAT_PAY_REFUND_NOTIFY_URL=https://your-domain.com/api/wechat-pay/refund-notify
```

### 2. 服务器配置要求
```nginx
# nginx配置示例
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # 支付回调路径
    location /api/wechat-pay/notify {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 重要：保持原始请求体
        proxy_pass_request_body on;
        proxy_set_header Content-Length "";
        proxy_pass_header Content-Length;
    }
    
    # 其他API路径
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. 防火墙配置
```bash
# 确保以下IP段可以访问你的服务器
# 微信支付回调IP范围（需要在商户平台确认最新IP列表）
iptables -A INPUT -s 183.192.0.0/16 -j ACCEPT
iptables -A INPUT -s 14.102.0.0/16 -j ACCEPT
iptables -A INPUT -s 117.135.0.0/16 -j ACCEPT
```

## 测试和调试

### 1. 沙箱环境测试
```javascript
// 测试配置
const testConfig = {
  merchant: {
    mchid: 'sandbox_mchid',
    appid: 'sandbox_appid',
    serial_no: 'sandbox_serial_no'
  },
  keys: {
    apiv3_key: 'sandbox_apiv3_key',
    private_key: 'sandbox_private_key'
  }
}

// 使用测试数据
const testData = {
  description: '测试商品',
  amount: 1, // 1分钱
  openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o', // 测试openid
  outTradeNo: `TEST_${Date.now()}`
}
```

### 2. 日志记录
```javascript
// 支付日志记录
class PaymentLogger {
  static logPaymentEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: event,
      data: data,
      ip: data.ip || 'unknown'
    }
    
    // 写入日志文件或数据库
    console.log('Payment Event:', JSON.stringify(logEntry))
  }
  
  static logError(error, context) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context: context
    }
    
    console.error('Payment Error:', JSON.stringify(errorLog))
  }
}
```

### 3. 监控告警
```javascript
// 关键指标监控
const metrics = {
  paymentSuccessRate: 0,    // 支付成功率
  refundSuccessRate: 0,     // 退款成功率
  averageResponseTime: 0,   // 平均响应时间
  errorCount: 0,            // 错误次数
  callbackSuccessRate: 0    // 回调成功率
}

// 告警阈值
const thresholds = {
  paymentSuccessRate: 0.95,  // 95%
  averageResponseTime: 5000, // 5秒
  errorCount: 10            // 10次/分钟
}
```

## 常见问题解答

### Q1: prepay_id获取失败怎么办？
A: 检查以下几点：
- 商户号和AppID是否匹配
- 签名算法是否正确实现
- 订单号是否唯一
- 金额格式是否正确（单位为分）

### Q2: 回调通知总是失败？
A: 排查步骤：
1. 检查服务器防火墙设置
2. 确认HTTPS证书有效性
3. 验证回调URL是否可公网访问
4. 检查签名验证逻辑是否正确

### Q3: 如何处理重复支付？
A: 实施幂等性处理：
- 使用商户订单号作为唯一标识
- 支付前检查订单状态
- 回调通知时进行重复检查
- 记录已处理的交易ID

### Q4: 签名验证总是失败？
A: 常见原因：
- 证书序列号不匹配
- 签名字符串构造错误
- 时间戳不同步
- 编码格式问题

### Q5: 生产环境部署注意事项？
A: 关键要点：
- 使用正式的商户证书和密钥
- 配置HTTPS和有效的SSL证书
- 设置适当的超时和重试机制
- 实施完整的日志记录和监控
- 定期轮换API密钥

## 更新维护

### 1. 版本升级
```bash
# 关注官方更新
# 定期检查微信支付文档更新
# 及时升级相关依赖库
npm update wechatpay-node-v3
```

### 2. 安全维护
```bash
# 定期安全检查清单
- [ ] 轮换APIv3密钥
- [ ] 更新商户证书
- [ ] 检查依赖库安全漏洞
- [ ] 审核权限配置
- [ ] 验证签名验证逻辑
```

### 3. 性能优化
```javascript
// 性能监控建议
- 监控API响应时间
- 跟踪支付成功率
- 分析错误分布
- 优化数据库查询
- 实施缓存策略
```

## 反馈和支持

如果您在使用过程中遇到问题或有更好的建议，请通过以下方式反馈：
- 提交GitHub Issue
- 发送邮件到技术支持邮箱
- 在开发者社区提问

我们会持续完善这个skill，为您提供更好的开发体验！