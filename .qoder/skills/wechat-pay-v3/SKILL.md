---
name: wechat-pay-v3
description: 微信支付V3 API开发指导，涵盖JSAPI支付、统一下单、签名验签、回调通知、退款等核心功能。适用于微信支付商户开发、支付系统集成和问题排查。
---

# 微信支付V3开发指南

## 核心概念

微信支付V3是微信支付的最新版本API，提供更安全、更便捷的支付服务。主要特点：
- 基于HTTPS协议，使用RESTful API风格
- 采用SHA256-RSA非对称加密签名机制
- 支持多种支付场景：JSAPI、Native、APP、H5、小程序
- 提供完善的异步通知机制

## 开发准备

### 1. 账户准备
```
- 微信支付商户号 (mchid)
- 商户API证书 (包含私钥和证书序列号)
- APIv3密钥 (32位字符串)
- AppID (公众号或小程序ID)
```

### 2. 环境配置
```javascript
// 基础配置
const config = {
  mchid: 'your_merchant_id',      // 商户号
  appid: 'your_app_id',           // AppID
  serial_no: 'your_serial_no',    // 证书序列号
  apiv3_key: 'your_api_v3_key',   // APIv3密钥
  private_key: 'your_private_key' // 商户私钥
}
```

## 核心API接口

### 1. 统一下单 (JSAPI支付)

```javascript
// 请求地址: POST https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi
const orderData = {
  appid: config.appid,
  mchid: config.mchid,
  description: '商品描述',
  out_trade_no: '商户订单号', // 需唯一
  notify_url: 'https://your-domain.com/notify',
  amount: {
    total: 100,  // 金额(分)
    currency: 'CNY'
  },
  payer: {
    openid: '用户openid'
  }
}

// 成功响应
{
  "prepay_id": "wx201410272009395522657a690389285100"
}
```

### 2. 前端调起支付

```javascript
// 获取支付参数
function getPayParams(prepay_id) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce_str = Math.random().toString(36).substr(2, 15)
  const package = `prepay_id=${prepay_id}`
  
  // 生成签名
  const signStr = `${config.appid}\n${timestamp}\n${nonce_str}\n${package}\n`
  const signature = crypto.createSign('RSA-SHA256')
    .update(signStr)
    .sign(config.private_key, 'base64')
  
  return {
    appId: config.appid,
    timeStamp: timestamp,
    nonceStr: nonce_str,
    package: package,
    signType: 'RSA',
    paySign: signature
  }
}

// 前端调用
WeixinJSBridge.invoke('getBrandWCPayRequest', payParams, function(res) {
  if (res.err_msg === "get_brand_wcpay_request:ok") {
    // 支付成功
  } else {
    // 支付失败
  }
})
```

### 3. 订单查询

```javascript
// 查询订单状态
// GET https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/{out_trade_no}
const queryOrder = async (outTradeNo) => {
  const url = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${config.mchid}`
  // 需要进行API签名验证
  return await request.get(url)
}

// 响应示例
{
  "appid": "wxd678efh567hg6787",
  "mchid": "1230000109",
  "out_trade_no": "1217752501201407033233368018",
  "transaction_id": "1217752501201407033233368018",
  "trade_state": "SUCCESS",
  "trade_state_desc": "支付成功",
  "bank_type": "CMC",
  "attach": "",
  "success_time": "2018-06-08T10:34:56+08:00",
  "payer": {
    "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o"
  },
  "amount": {
    "total": 100,
    "payer_total": 100,
    "currency": "CNY",
    "payer_currency": "CNY"
  }
}
```

## 签名验签机制

### API请求签名

```javascript
// 构造签名串
function buildSignMessage(method, url, timestamp, nonce_str, body = '') {
  return `${method}\n${url}\n${timestamp}\n${nonce_str}\n${body}\n`
}

// 生成签名
function generateSignature(message, privateKey) {
  return crypto.createSign('SHA256withRSA')
    .update(message)
    .sign(privateKey, 'base64')
}

// 构造Authorization头
function buildAuthorization(method, url, body = '') {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce_str = Math.random().toString(36).substr(2, 15)
  const message = buildSignMessage(method, url, timestamp, nonce_str, body)
  const signature = generateSignature(message, config.private_key)
  
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchid}",nonce_str="${nonce_str}",signature="${signature}",timestamp="${timestamp}",serial_no="${config.serial_no}"`
}
```

### 回调通知验签

```javascript
// 验证回调签名
function verifyNotifySignature(headers, body) {
  const { 
    'wechatpay-timestamp': timestamp,
    'wechatpay-nonce': nonce,
    'wechatpay-signature': signature,
    'wechatpay-serial': serial 
  } = headers
  
  // 构造签名串
  const message = `${timestamp}\n${nonce}\n${body}\n`
  
  // 使用微信支付平台证书公钥验证签名
  const verify = crypto.createVerify('SHA256withRSA')
  verify.update(message)
  return verify.verify(platformPublicKey, signature, 'base64')
}

// 解密回调数据
function decryptNotifyData(encryptedData) {
  const decoded = Buffer.from(encryptedData, 'base64')
  const aesKey = Buffer.from(config.apiv3_key, 'utf8')
  const nonce = decoded.slice(0, 12)
  const ciphertext = decoded.slice(12, -16)
  const authTag = decoded.slice(-16)
  
  const decipher = crypto.createDecipherGCM('aes-256-gcm', aesKey)
  decipher.setAuthTag(authTag)
  decipher.setAAD(Buffer.from(''))
  
  let decrypted = decipher.update(ciphertext, null, 'utf8')
  decrypted += decipher.final('utf8')
  
  return JSON.parse(decrypted)
}
```

## 回调通知处理

### 1. 通知接收

```javascript
// Express示例
app.post('/wechat-pay/notify', express.raw({type: 'application/json'}), (req, res) => {
  try {
    // 1. 验证签名
    if (!verifyNotifySignature(req.headers, req.body)) {
      return res.status(401).send('签名验证失败')
    }
    
    // 2. 解密数据
    const notifyData = JSON.parse(req.body.toString())
    const decryptedData = decryptNotifyData(notifyData.resource.ciphertext)
    
    // 3. 处理业务逻辑
    handlePaymentSuccess(decryptedData)
    
    // 4. 返回成功响应
    res.status(200).json({ code: 'SUCCESS', message: '成功' })
  } catch (error) {
    console.error('处理回调失败:', error)
    res.status(500).json({ code: 'FAIL', message: '失败' })
  }
})

function handlePaymentSuccess(data) {
  const { 
    out_trade_no, 
    transaction_id, 
    amount,
    success_time 
  } = data
  
  // 1. 检查订单是否存在
  // 2. 验证金额是否一致
  // 3. 更新订单状态
  // 4. 发货或其他业务处理
  // 5. 记录支付日志
}
```

### 2. 重复通知处理

```javascript
// 幂等性处理
async function handlePaymentSuccess(data) {
  const { out_trade_no, transaction_id } = data
  
  // 检查是否已处理过该笔交易
  const existingRecord = await db.findOne({
    out_trade_no: out_trade_no,
    transaction_id: transaction_id
  })
  
  if (existingRecord) {
    console.log('重复通知，已处理过的交易:', out_trade_no)
    return // 直接返回，避免重复处理
  }
  
  // 执行业务逻辑...
  
  // 记录处理结果
  await db.insert({
    out_trade_no,
    transaction_id,
    status: 'processed',
    processed_at: new Date()
  })
}
```

## 退款处理

### 1. 发起退款

```javascript
// 退款请求
// POST https://api.mch.weixin.qq.com/v3/refund/domestic/refunds
const refundData = {
  out_refund_no: '商户退款单号', // 需唯一
  transaction_id: '微信支付订单号',
  out_trade_no: '商户订单号',
  reason: '退款原因',
  notify_url: 'https://your-domain.com/refund-notify',
  amount: {
    refund: 100,    // 退款金额(分)
    total: 100,     // 原订单金额(分)
    currency: 'CNY'
  }
}

// 退款响应
{
  "refund_id": "50000000382019012216530955748",
  "out_refund_no": "1217752501201407033233368018",
  "transaction_id": "1217752501201407033233368018",
  "out_trade_no": "1217752501201407033233368018",
  "channel": "ORIGINAL",
  "user_received_account": "支付用户零钱",
  "success_time": "2018-06-08T10:34:56+08:00",
  "create_time": "2018-06-08T10:34:56+08:00",
  "status": "SUCCESS",
  "funds_account": "AVAILABLE",
  "amount": {
    "total": 100,
    "refund": 100,
    "from": [
      {
        "account": "AVAILABLE",
        "amount": 100
      }
    ],
    "payer_total": 100,
    "payer_refund": 100
  },
  "promotion_detail": []
}
```

### 2. 退款通知

```javascript
// 退款回调处理
app.post('/wechat-pay/refund-notify', express.raw({type: 'application/json'}), (req, res) => {
  try {
    // 验证签名和解密数据
    if (!verifyNotifySignature(req.headers, req.body)) {
      return res.status(401).send('签名验证失败')
    }
    
    const notifyData = JSON.parse(req.body.toString())
    const decryptedData = decryptNotifyData(notifyData.resource.ciphertext)
    
    // 处理退款业务逻辑
    handleRefundSuccess(decryptedData)
    
    res.status(200).json({ code: 'SUCCESS', message: '成功' })
  } catch (error) {
    console.error('处理退款回调失败:', error)
    res.status(500).json({ code: 'FAIL', message: '失败' })
  }
})
```

## 错误处理

### 常见错误码

```javascript
const errorCodes = {
  // 参数错误
  'PARAM_ERROR': '参数错误',
  'MCH_NOT_EXISTS': '商户号不存在',
  'SIGN_ERROR': '签名错误',
  'NO_AUTH': '权限异常',
  
  // 业务错误
  'ORDERPAID': '订单已支付',
  'ORDERCLOSED': '订单已关闭',
  'SYSTEMERROR': '系统错误',
  'USER_ACCOUNT_ABNORMAL': '用户账户异常',
  'INVALID_TRANSACTIONID': '无效transaction_id',
  'TRADE_OVERDUE': '交易超时'
}

// 错误处理示例
async function handleApiError(error) {
  if (error.response) {
    const { status, data } = error.response
    if (status === 400) {
      console.error('请求参数错误:', data)
    } else if (status === 401) {
      console.error('签名验证失败:', data)
    } else if (status === 403) {
      console.error('权限不足:', data)
    } else if (status >= 500) {
      console.error('服务器错误:', data)
    }
  } else {
    console.error('网络错误:', error.message)
  }
}
```

## 最佳实践

### 1. 安全措施
- 使用HTTPS传输所有数据
- 定期轮换APIv3密钥
- 妥善保管商户私钥
- 验证所有回调通知签名
- 实施幂等性处理防止重复操作

### 2. 性能优化
- 合理设置超时时间
- 实施重试机制处理网络异常
- 使用连接池管理HTTP连接
- 缓存平台证书避免频繁下载

### 3. 监控告警
- 记录关键操作日志
- 监控支付成功率
- 设置异常交易告警
- 定期对账确保数据一致性

### 4. 测试验证
- 使用沙箱环境充分测试
- 验证各种异常场景处理
- 测试回调通知的可靠性
- 确认退款流程正常工作

## 常见问题

### 1. prepay_id获取失败
- 检查商户号和AppID是否匹配
- 验证签名算法是否正确
- 确认订单号是否唯一
- 检查金额格式是否正确

### 2. 前端支付调起失败
- 确认域名已在商户平台配置
- 验证支付参数生成是否正确
- 检查用户OpenID是否有效
- 确认在微信客户端环境中调用

### 3. 回调通知未收到
- 检查服务器防火墙设置
- 确认回调URL可公网访问
- 验证HTTPS证书有效性
- 检查服务器能否正确处理POST请求

### 4. 签名验证失败
- 确认使用正确的证书和密钥
- 验证签名字符串构造是否准确
- 检查时间戳是否同步
- 确认编码格式是否正确

## 参考资源

- [微信支付V3官方文档](https://pay.weixin.qq.com/wiki/doc/apiv3/)
- [API字典](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/)
- [开发工具](https://pay.weixin.qq.com/wiki/doc/apiv3/tools/)
- [常见问题](https://pay.weixin.qq.com/wiki/doc/apiv3/faq/)