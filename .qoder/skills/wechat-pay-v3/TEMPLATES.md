# 微信支付V3代码模板

## 基础模板

### 1. 配置文件模板

```javascript
// config/wechat-pay.js
module.exports = {
  // 商户基本信息
  merchant: {
    mchid: process.env.WECHAT_PAY_MCHID || 'your_merchant_id',
    appid: process.env.WECHAT_PAY_APPID || 'your_app_id',
    serial_no: process.env.WECHAT_PAY_SERIAL_NO || 'your_serial_no'
  },
  
  // 密钥配置
  keys: {
    apiv3_key: process.env.WECHAT_PAY_API_V3_KEY || 'your_32bit_apiv3_key',
    private_key: process.env.WECHAT_PAY_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
your_private_key_here
-----END PRIVATE KEY-----`
  },
  
  // 服务器配置
  server: {
    notify_url: process.env.WECHAT_PAY_NOTIFY_URL || 'https://your-domain.com/api/wechat-pay/notify',
    refund_notify_url: process.env.WECHAT_PAY_REFUND_NOTIFY_URL || 'https://your-domain.com/api/wechat-pay/refund-notify'
  },
  
  // 环境配置
  env: {
    sandbox: process.env.NODE_ENV === 'development',
    timeout: 10000
  }
}
```

### 2. 核心工具类模板

```javascript
// utils/wechat-pay/signer.js
const crypto = require('crypto')

class WeChatPaySigner {
  constructor(config) {
    this.mchid = config.mchid
    this.privateKey = config.privateKey
    this.serialNo = config.serialNo
  }

  /**
   * 构造签名字符串
   * @param {string} method HTTP方法
   * @param {string} url 完整URL
   * @param {string} timestamp 时间戳
   * @param {string} nonce 随机字符串
   * @param {string} body 请求体
   * @returns {string} 签名字符串
   */
  buildMessage(method, url, timestamp, nonce, body = '') {
    const urlObj = new URL(url)
    const canonicalUrl = urlObj.pathname + urlObj.search
    return `${method}\n${canonicalUrl}\n${timestamp}\n${nonce}\n${body}\n`
  }

  /**
   * 生成签名
   * @param {string} method HTTP方法
   * @param {string} url 完整URL
   * @param {string} body 请求体
   * @returns {Object} 包含authorization和其他必要字段的对象
   */
  sign(method, url, body = '') {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = this.generateNonce()
    const message = this.buildMessage(method, url, timestamp, nonce, body)
    
    const signature = crypto.createSign('RSA-SHA256')
      .update(message)
      .sign(this.privateKey, 'base64')
    
    return {
      authorization: `WECHATPAY2-SHA256-RSA2048 `
        + `mchid="${this.mchid}",`
        + `nonce_str="${nonce}",`
        + `signature="${signature}",`
        + `timestamp="${timestamp}",`
        + `serial_no="${this.serialNo}"`,
      timestamp,
      nonce
    }
  }

  /**
   * 生成随机字符串
   * @param {number} length 字符串长度
   * @returns {string} 随机字符串
   */
  generateNonce(length = 32) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  }

  /**
   * 验证平台签名
   * @param {Object} headers HTTP头
   * @param {string} body 响应体
   * @param {string} publicKey 平台公钥
   * @returns {boolean} 签名是否有效
   */
  verifyPlatformSignature(headers, body, publicKey) {
    const {
      'wechatpay-timestamp': timestamp,
      'wechatpay-nonce': nonce,
      'wechatpay-signature': signature
    } = headers

    const message = `${timestamp}\n${nonce}\n${body}\n`
    
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(message)
    return verify.verify(publicKey, signature, 'base64')
  }
}

module.exports = WeChatPaySigner
```

```javascript
// utils/wechat-pay/decryptor.js
const crypto = require('crypto')

class WeChatPayDecryptor {
  constructor(apiv3Key) {
    this.apiv3Key = Buffer.from(apiv3Key, 'utf8')
  }

  /**
   * 解密AES-256-GCM加密的数据
   * @param {string} encryptedData Base64编码的加密数据
   * @returns {Object} 解密后的JSON对象
   */
  decrypt(encryptedData) {
    try {
      const decoded = Buffer.from(encryptedData, 'base64')
      const nonce = decoded.slice(0, 12)
      const ciphertext = decoded.slice(12, -16)
      const authTag = decoded.slice(-16)
      
      const decipher = crypto.createDecipherGCM('aes-256-gcm', this.apiv3Key)
      decipher.setAuthTag(authTag)
      decipher.setAAD(Buffer.from(''))
      
      let decrypted = decipher.update(ciphertext, null, 'utf8')
      decrypted += decipher.final('utf8')
      
      return JSON.parse(decrypted)
    } catch (error) {
      throw new Error(`解密失败: ${error.message}`)
    }
  }

  /**
   * 加密数据（用于测试）
   * @param {Object} data 要加密的数据
   * @returns {string} Base64编码的加密数据
   */
  encrypt(data) {
    const plaintext = JSON.stringify(data)
    const nonce = crypto.randomBytes(12)
    
    const cipher = crypto.createCipherGCM('aes-256-gcm', this.apiv3Key)
    cipher.setAAD(Buffer.from(''))
    
    let encrypted = cipher.update(plaintext, 'utf8')
    encrypted += cipher.final()
    
    const authTag = cipher.getAuthTag()
    const result = Buffer.concat([nonce, encrypted, authTag])
    return result.toString('base64')
  }
}

module.exports = WeChatPayDecryptor
```

## 服务层模板

### 1. 支付服务模板

```javascript
// services/wechat-pay/payment.js
const axios = require('axios')
const WeChatPaySigner = require('../../utils/wechat-pay/signer')

class PaymentService {
  constructor(config) {
    this.config = config
    this.signer = new WeChatPaySigner({
      mchid: config.merchant.mchid,
      privateKey: config.keys.private_key,
      serialNo: config.merchant.serial_no
    })
    this.baseUrl = 'https://api.mch.weixin.qq.com'
  }

  /**
   * 创建支付订单
   * @param {Object} orderInfo 订单信息
   * @returns {Promise<Object>} 支付结果
   */
  async createOrder(orderInfo) {
    const url = `${this.baseUrl}/v3/pay/transactions/jsapi`
    
    const requestData = {
      appid: this.config.merchant.appid,
      mchid: this.config.merchant.mchid,
      description: orderInfo.description,
      out_trade_no: orderInfo.outTradeNo,
      notify_url: orderInfo.notifyUrl || this.config.server.notify_url,
      amount: {
        total: orderInfo.amount,
        currency: 'CNY'
      },
      payer: {
        openid: orderInfo.openid
      },
      time_expire: this.getDefaultExpireTime()
    }

    const { authorization } = this.signer.sign('POST', url, JSON.stringify(requestData))

    try {
      const response = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'your-app/1.0'
        },
        data: requestData,
        timeout: this.config.env.timeout
      })

      return {
        success: true,
        prepay_id: response.data.prepay_id,
        orderInfo: requestData
      }
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 生成前端支付参数
   * @param {string} prepay_id 预支付ID
   * @returns {Object} 前端支付参数
   */
  generatePayParams(prepay_id) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce_str = this.signer.generateNonce(32)
    const package = `prepay_id=${prepay_id}`
    
    const signStr = `${this.config.merchant.appid}\n${timestamp}\n${nonce_str}\n${package}\n`
    const paySign = crypto.createSign('RSA-SHA256')
      .update(signStr)
      .sign(this.config.keys.private_key, 'base64')
    
    return {
      appId: this.config.merchant.appid,
      timeStamp: timestamp,
      nonceStr: nonce_str,
      package: package,
      signType: 'RSA',
      paySign: paySign
    }
  }

  /**
   * 查询订单状态
   * @param {string} outTradeNo 商户订单号
   * @returns {Promise<Object>} 查询结果
   */
  async queryOrder(outTradeNo) {
    const url = `${this.baseUrl}/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${this.config.merchant.mchid}`
    const { authorization } = this.signer.sign('GET', url)

    try {
      const response = await axios({
        method: 'GET',
        url: url,
        headers: {
          'Authorization': authorization,
          'Accept': 'application/json',
          'User-Agent': 'your-app/1.0'
        },
        timeout: this.config.env.timeout
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 关闭订单
   * @param {string} outTradeNo 商户订单号
   * @returns {Promise<Object>} 关闭结果
   */
  async closeOrder(outTradeNo) {
    const url = `${this.baseUrl}/v3/pay/transactions/out-trade-no/${outTradeNo}/close`
    const requestData = { mchid: this.config.merchant.mchid }
    const { authorization } = this.signer.sign('POST', url, JSON.stringify(requestData))

    try {
      await axios({
        method: 'POST',
        url: url,
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'your-app/1.0'
        },
        data: requestData,
        timeout: this.config.env.timeout
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 获取默认过期时间（2小时后）
   * @returns {string} ISO时间字符串
   */
  getDefaultExpireTime() {
    const expireTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
    return expireTime.toISOString().replace(/\.\d+Z$/, '+08:00')
  }

  /**
   * 错误处理
   * @param {Error} error 错误对象
   * @returns {Object} 格式化后的错误信息
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response
      return {
        status,
        code: data?.code,
        message: data?.message || '请求失败',
        detail: data
      }
    }
    return {
      message: error.message,
      code: 'NETWORK_ERROR'
    }
  }
}

module.exports = PaymentService
```

### 2. 通知处理服务模板

```javascript
// services/wechat-pay/notify.js
const WeChatPayDecryptor = require('../../utils/wechat-pay/decryptor')

class NotifyService {
  constructor(config) {
    this.config = config
    this.decryptor = new WeChatPayDecryptor(config.keys.apiv3_key)
  }

  /**
   * 处理支付成功通知
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} businessHandler 业务处理函数
   */
  async handlePaymentNotify(req, res, businessHandler) {
    try {
      // 1. 验证签名（这里简化处理，实际需要完整验证）
      // const isValid = await this.verifySignature(req)
      // if (!isValid) {
      //   return res.status(401).json({ code: 'FAIL', message: '签名验证失败' })
      // }

      // 2. 解密数据
      const notifyData = JSON.parse(req.body.toString())
      const decryptedData = this.decryptor.decrypt(notifyData.resource.ciphertext)

      // 3. 业务处理
      await businessHandler(decryptedData)

      // 4. 返回成功响应
      res.status(200).json({ code: 'SUCCESS', message: '成功' })
    } catch (error) {
      console.error('处理支付通知失败:', error)
      res.status(500).json({ code: 'FAIL', message: error.message })
    }
  }

  /**
   * 处理退款通知
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} businessHandler 业务处理函数
   */
  async handleRefundNotify(req, res, businessHandler) {
    try {
      // 1. 验证签名
      // const isValid = await this.verifySignature(req)
      // if (!isValid) {
      //   return res.status(401).json({ code: 'FAIL', message: '签名验证失败' })
      // }

      // 2. 解密数据
      const notifyData = JSON.parse(req.body.toString())
      const decryptedData = this.decryptor.decrypt(notifyData.resource.ciphertext)

      // 3. 业务处理
      await businessHandler(decryptedData)

      // 4. 返回成功响应
      res.status(200).json({ code: 'SUCCESS', message: '成功' })
    } catch (error) {
      console.error('处理退款通知失败:', error)
      res.status(500).json({ code: 'FAIL', message: error.message })
    }
  }

  /**
   * 验证签名（需要完整实现）
   * @param {Object} req 请求对象
   * @returns {Promise<boolean>} 签名是否有效
   */
  async verifySignature(req) {
    // 这里需要实现完整的签名验证逻辑
    // 包括获取平台证书、验证签名等
    return true // 临时返回true用于测试
  }
}

module.exports = NotifyService
```

## 控制器模板

### 1. 支付控制器模板

```javascript
// controllers/wechat-pay/payment.js
const PaymentService = require('../../services/wechat-pay/payment')
const config = require('../../config/wechat-pay')

const paymentService = new PaymentService(config)

class PaymentController {
  /**
   * 创建支付订单
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async createOrder(req, res) {
    try {
      const { description, amount, openid, outTradeNo } = req.body
      
      // 参数验证
      if (!description || !amount || !openid || !outTradeNo) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        })
      }

      // 创建订单
      const result = await paymentService.createOrder({
        description,
        amount,
        openid,
        outTradeNo
      })

      if (result.success) {
        // 生成前端支付参数
        const payParams = paymentService.generatePayParams(result.prepay_id)
        
        res.json({
          success: true,
          data: {
            prepay_id: result.prepay_id,
            pay_params: payParams
          }
        })
      } else {
        res.status(400).json({
          success: false,
          message: result.error.message,
          error: result.error
        })
      }
    } catch (error) {
      console.error('创建订单失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  /**
   * 查询订单状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async queryOrder(req, res) {
    try {
      const { outTradeNo } = req.params
      
      if (!outTradeNo) {
        return res.status(400).json({
          success: false,
          message: '缺少订单号'
        })
      }

      const result = await paymentService.queryOrder(outTradeNo)
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        })
      } else {
        res.status(400).json({
          success: false,
          message: result.error.message,
          error: result.error
        })
      }
    } catch (error) {
      console.error('查询订单失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  /**
   * 关闭订单
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async closeOrder(req, res) {
    try {
      const { outTradeNo } = req.params
      
      if (!outTradeNo) {
        return res.status(400).json({
          success: false,
          message: '缺少订单号'
        })
      }

      const result = await paymentService.closeOrder(outTradeNo)
      
      if (result.success) {
        res.json({
          success: true,
          message: '订单关闭成功'
        })
      } else {
        res.status(400).json({
          success: false,
          message: result.error.message,
          error: result.error
        })
      }
    } catch (error) {
      console.error('关闭订单失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }
}

module.exports = new PaymentController()
```

### 2. 通知控制器模板

```javascript
// controllers/wechat-pay/notify.js
const NotifyService = require('../../services/wechat-pay/notify')
const OrderService = require('../../services/order') // 假设的订单服务
const config = require('../../config/wechat-pay')

const notifyService = new NotifyService(config)

class NotifyController {
  /**
   * 支付成功通知
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async paymentNotify(req, res) {
    await notifyService.handlePaymentNotify(req, res, async (data) => {
      const {
        out_trade_no,
        transaction_id,
        amount,
        success_time,
        payer
      } = data

      // 1. 幂等性检查
      const existing = await OrderService.checkPaymentProcessed(out_trade_no, transaction_id)
      if (existing) {
        console.log('重复通知，已处理:', out_trade_no)
        return
      }

      // 2. 验证订单
      const order = await OrderService.getByOutTradeNo(out_trade_no)
      if (!order) {
        throw new Error(`订单不存在: ${out_trade_no}`)
      }

      if (order.amount !== amount.payer_total) {
        throw new Error(`金额不匹配: 订单金额${order.amount}, 支付金额${amount.payer_total}`)
      }

      // 3. 更新订单状态
      await OrderService.updateStatus(out_trade_no, {
        status: 'paid',
        transaction_id,
        paid_at: success_time,
        openid: payer.openid
      })

      // 4. 执行业务逻辑（如发货）
      await this.handleBusinessLogic(order)

      // 5. 记录日志
      await OrderService.recordPaymentLog({
        out_trade_no,
        transaction_id,
        amount: amount.payer_total,
        paid_at: success_time
      })
    })
  }

  /**
   * 退款通知
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async refundNotify(req, res) {
    await notifyService.handleRefundNotify(req, res, async (data) => {
      const {
        out_refund_no,
        refund_id,
        refund_status,
        amount,
        success_time
      } = data

      // 处理退款业务逻辑
      await OrderService.handleRefundSuccess({
        out_refund_no,
        refund_id,
        refund_status,
        refund_amount: amount.refund,
        success_time
      })
    })
  }

  /**
   * 处理业务逻辑
   * @param {Object} order 订单信息
   */
  async handleBusinessLogic(order) {
    // 根据业务需求实现
    // 例如：发送通知、更新库存、发货等
    console.log('处理业务逻辑，订单号:', order.out_trade_no)
  }
}

module.exports = new NotifyController()
```

## 路由模板

```javascript
// routes/wechat-pay.js
const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/wechat-pay/payment')
const notifyController = require('../controllers/wechat-pay/notify')

// 支付相关路由
router.post('/orders', paymentController.createOrder)           // 创建订单
router.get('/orders/:outTradeNo', paymentController.queryOrder) // 查询订单
router.post('/orders/:outTradeNo/close', paymentController.closeOrder) // 关闭订单

// 通知相关路由
router.post('/notify/payment', express.raw({type: 'application/json'}), notifyController.paymentNotify)
router.post('/notify/refund', express.raw({type: 'application/json'}), notifyController.refundNotify)

module.exports = router
```

## 使用示例

### 1. 前端调用示例

```html
<!DOCTYPE html>
<html>
<head>
    <title>微信支付示例</title>
</head>
<body>
    <button id="payBtn">立即支付</button>

    <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
    <script>
        document.getElementById('payBtn').addEventListener('click', async function() {
            try {
                // 1. 调用后端创建订单
                const response = await fetch('/api/wechat-pay/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: '测试商品',
                        amount: 1, // 1分钱测试
                        openid: '用户的openid',
                        outTradeNo: 'order_' + Date.now()
                    })
                })

                const result = await response.json()
                
                if (result.success) {
                    // 2. 调起微信支付
                    WeixinJSBridge.invoke('getBrandWCPayRequest', result.data.pay_params, function(res) {
                        if (res.err_msg === "get_brand_wcpay_request:ok") {
                            alert('支付成功！')
                            // 跳转到成功页面或查询订单状态
                        } else {
                            alert('支付失败：' + res.err_msg)
                        }
                    })
                } else {
                    alert('创建订单失败：' + result.message)
                }
            } catch (error) {
                console.error('支付失败:', error)
                alert('支付失败')
            }
        })
    </script>
</body>
</html>
```

### 2. 完整的Express应用示例

```javascript
// app.js
const express = require('express')
const bodyParser = require('body-parser')
const wechatPayRoutes = require('./routes/wechat-pay')

const app = express()

// 中间件
app.use(bodyParser.json())
app.use('/api/wechat-pay', wechatPayRoutes)

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`)
})
```

这些模板提供了微信支付V3的核心功能实现，可以根据具体业务需求进行调整和扩展。