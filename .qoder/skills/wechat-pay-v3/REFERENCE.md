# 微信支付V3详细参考手册

## API认证机制详解

### 1. HTTP Authorization头格式

```javascript
// 完整的Authorization头格式
const authorization = `WECHATPAY2-SHA256-RSA2048 `
  + `mchid="${mchid}",`
  + `nonce_str="${nonce_str}",`
  + `signature="${signature}",`
  + `timestamp="${timestamp}",`
  + `serial_no="${serial_no}"`

// 各字段说明：
// mchid: 商户号
// nonce_str: 随机字符串，32位以内
// signature: 签名值
// timestamp: 时间戳，10位Unix时间戳
// serial_no: 商户API证书序列号
```

### 2. 签名算法实现

```javascript
const crypto = require('crypto')

class WeChatPaySigner {
  constructor(config) {
    this.mchid = config.mchid
    this.privateKey = config.privateKey
    this.serialNo = config.serialNo
  }

  // 构造签名字符串
  buildMessage(method, url, timestamp, nonce, body = '') {
    // 处理URL路径
    const urlObj = new URL(url)
    const canonicalUrl = urlObj.pathname + urlObj.search
    
    return `${method}\n${canonicalUrl}\n${timestamp}\n${nonce}\n${body}\n`
  }

  // 生成签名
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

  // 生成随机字符串
  generateNonce(length = 32) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  }

  // 验证平台签名
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
```

## 加密解密机制

### 1. 回调数据解密

```javascript
class WeChatPayDecryptor {
  constructor(apiv3Key) {
    this.apiv3Key = Buffer.from(apiv3Key, 'utf8')
  }

  // 解密AES-256-GCM加密的数据
  decrypt(encryptedData) {
    try {
      // Base64解码
      const decoded = Buffer.from(encryptedData, 'base64')
      
      // 提取各部分
      const nonce = decoded.slice(0, 12)        // 12字节nonce
      const ciphertext = decoded.slice(12, -16) // 密文
      const authTag = decoded.slice(-16)        // 16字节认证标签
      
      // 创建解密器
      const decipher = crypto.createDecipherGCM('aes-256-gcm', this.apiv3Key)
      decipher.setAuthTag(authTag)
      decipher.setAAD(Buffer.from('')) // Associated Authenticated Data
      
      // 解密
      let decrypted = decipher.update(ciphertext, null, 'utf8')
      decrypted += decipher.final('utf8')
      
      return JSON.parse(decrypted)
    } catch (error) {
      throw new Error(`解密失败: ${error.message}`)
    }
  }

  // 加密数据（用于测试）
  encrypt(data) {
    const plaintext = JSON.stringify(data)
    const nonce = crypto.randomBytes(12)
    
    const cipher = crypto.createCipherGCM('aes-256-gcm', this.apiv3Key)
    cipher.setAAD(Buffer.from(''))
    
    let encrypted = cipher.update(plaintext, 'utf8')
    encrypted += cipher.final()
    
    const authTag = cipher.getAuthTag()
    
    // 组合: nonce + ciphertext + authTag
    const result = Buffer.concat([nonce, encrypted, authTag])
    return result.toString('base64')
  }
}
```

### 2. 证书管理

```javascript
class CertificateManager {
  constructor() {
    this.certificates = new Map() // serial_no -> certificate
  }

  // 下载平台证书
  async downloadCertificates(authorization) {
    const response = await axios({
      method: 'GET',
      url: 'https://api.mch.weixin.qq.com/v3/certificates',
      headers: {
        'Authorization': authorization,
        'Accept': 'application/json',
        'User-Agent': 'your-user-agent'
      }
    })

    const certificates = response.data.data
    for (const certInfo of certificates) {
      const serialNo = certInfo.serial_no
      const encryptCertificate = certInfo.encrypt_certificate
      
      // 解密证书内容
      const decryptedCert = this.decryptCertificate(
        encryptCertificate.ciphertext,
        encryptCertificate.nonce,
        encryptCertificate.associated_data
      )
      
      this.certificates.set(serialNo, {
        serialNo,
        publicKey: decryptedCert,
        effectiveTime: certInfo.effective_time,
        expireTime: certInfo.expire_time
      })
    }
  }

  // 解密证书
  decryptCertificate(ciphertext, nonce, associatedData) {
    const key = Buffer.from(process.env.WECHAT_PAY_API_V3_KEY, 'utf8')
    const nonceBuffer = Buffer.from(nonce, 'utf8')
    const adBuffer = Buffer.from(associatedData, 'utf8')
    const cipherBuffer = Buffer.from(ciphertext, 'base64')
    
    const authTag = cipherBuffer.slice(-16)
    const data = cipherBuffer.slice(0, -16)
    
    const decipher = crypto.createDecipherGCM('aes-256-gcm', key)
    decipher.setAuthTag(authTag)
    decipher.setAAD(adBuffer)
    
    let decrypted = decipher.update(data, null, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  // 获取证书
  getCertificate(serialNo) {
    return this.certificates.get(serialNo)
  }

  // 验证证书有效性
  isValidCertificate(serialNo) {
    const cert = this.certificates.get(serialNo)
    if (!cert) return false
    
    const now = new Date()
    const effectiveTime = new Date(cert.effectiveTime)
    const expireTime = new Date(cert.expireTime)
    
    return now >= effectiveTime && now <= expireTime
  }
}
```

## 完整的支付流程实现

### 1. 统一下单服务

```javascript
class PaymentService {
  constructor(config) {
    this.config = config
    this.signer = new WeChatPaySigner({
      mchid: config.mchid,
      privateKey: config.privateKey,
      serialNo: config.serialNo
    })
  }

  // 创建订单
  async createOrder(orderInfo) {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi'
    
    const requestData = {
      appid: this.config.appid,
      mchid: this.config.mchid,
      description: orderInfo.description,
      out_trade_no: orderInfo.outTradeNo,
      notify_url: orderInfo.notifyUrl || this.config.notifyUrl,
      amount: {
        total: orderInfo.amount,
        currency: 'CNY'
      },
      payer: {
        openid: orderInfo.openid
      },
      time_expire: orderInfo.timeExpire || this.getDefaultExpireTime()
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
          'User-Agent': 'your-user-agent'
        },
        data: requestData
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

  // 获取默认过期时间（2小时后）
  getDefaultExpireTime() {
    const expireTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
    return expireTime.toISOString().replace(/\.\d+Z$/, '+08:00')
  }

  // 生成前端支付参数
  generatePayParams(prepay_id) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce_str = this.signer.generateNonce(32)
    const package = `prepay_id=${prepay_id}`
    
    const signStr = `${this.config.appid}\n${timestamp}\n${nonce_str}\n${package}\n`
    const paySign = crypto.createSign('RSA-SHA256')
      .update(signStr)
      .sign(this.config.privateKey, 'base64')
    
    return {
      appId: this.config.appid,
      timeStamp: timestamp,
      nonceStr: nonce_str,
      package: package,
      signType: 'RSA',
      paySign: paySign
    }
  }

  // 查询订单
  async queryOrder(outTradeNo) {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${this.config.mchid}`
    const { authorization } = this.signer.sign('GET', url)

    try {
      const response = await axios({
        method: 'GET',
        url: url,
        headers: {
          'Authorization': authorization,
          'Accept': 'application/json',
          'User-Agent': 'your-user-agent'
        }
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

  // 关闭订单
  async closeOrder(outTradeNo) {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/{out_trade_no}/close'
    const requestData = { mchid: this.config.mchid }
    const { authorization } = this.signer.sign('POST', url, JSON.stringify(requestData))

    try {
      await axios({
        method: 'POST',
        url: url.replace('{out_trade_no}', outTradeNo),
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: requestData
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      }
    }
  }

  // 错误处理
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
```

### 2. 通知处理器

```javascript
class NotifyHandler {
  constructor(config) {
    this.config = config
    this.decryptor = new WeChatPayDecryptor(config.apiv3Key)
    this.certificateManager = new CertificateManager()
  }

  // 处理支付成功通知
  async handlePaymentNotify(req, res) {
    try {
      // 1. 验证签名
      const isValid = await this.verifySignature(req)
      if (!isValid) {
        return res.status(401).json({
          code: 'FAIL',
          message: '签名验证失败'
        })
      }

      // 2. 解密数据
      const notifyData = JSON.parse(req.body.toString())
      const decryptedData = this.decryptor.decrypt(notifyData.resource.ciphertext)

      // 3. 业务处理
      await this.processPaymentSuccess(decryptedData)

      // 4. 返回成功响应
      res.status(200).json({
        code: 'SUCCESS',
        message: '成功'
      })
    } catch (error) {
      console.error('处理支付通知失败:', error)
      res.status(500).json({
        code: 'FAIL',
        message: error.message
      })
    }
  }

  // 验证签名
  async verifySignature(req) {
    const headers = req.headers
    const {
      'wechatpay-timestamp': timestamp,
      'wechatpay-nonce': nonce,
      'wechatpay-signature': signature,
      'wechatpay-serial': serial
    } = headers

    // 获取平台证书
    let cert = this.certificateManager.getCertificate(serial)
    if (!cert || !this.certificateManager.isValidCertificate(serial)) {
      // 重新下载证书
      await this.certificateManager.downloadCertificates(this.getAuthorization())
      cert = this.certificateManager.getCertificate(serial)
      if (!cert) {
        throw new Error('无法获取平台证书')
      }
    }

    // 验证签名
    const message = `${timestamp}\n${nonce}\n${req.body}\n`
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(message)
    return verify.verify(cert.publicKey, signature, 'base64')
  }

  // 处理支付成功
  async processPaymentSuccess(data) {
    const {
      out_trade_no,
      transaction_id,
      amount,
      success_time,
      payer
    } = data

    // 1. 幂等性检查
    const existing = await this.checkProcessed(out_trade_no, transaction_id)
    if (existing) {
      console.log('重复通知，已处理:', out_trade_no)
      return
    }

    // 2. 验证订单信息
    const order = await this.getOrderInfo(out_trade_no)
    if (!order) {
      throw new Error(`订单不存在: ${out_trade_no}`)
    }

    if (order.amount !== amount.payer_total) {
      throw new Error(`金额不匹配: 订单金额${order.amount}, 支付金额${amount.payer_total}`)
    }

    // 3. 更新订单状态
    await this.updateOrderStatus(out_trade_no, {
      status: 'paid',
      transaction_id,
      paid_at: success_time,
      openid: payer.openid
    })

    // 4. 执行业务逻辑（发货等）
    await this.executeBusinessLogic(out_trade_no)

    // 5. 记录处理日志
    await this.recordProcessLog({
      out_trade_no,
      transaction_id,
      amount: amount.payer_total,
      process_time: new Date(),
      status: 'success'
    })
  }

  // 退款通知处理
  async handleRefundNotify(req, res) {
    try {
      // 验证签名
      const isValid = await this.verifySignature(req)
      if (!isValid) {
        return res.status(401).json({ code: 'FAIL', message: '签名验证失败' })
      }

      // 解密数据
      const notifyData = JSON.parse(req.body.toString())
      const decryptedData = this.decryptor.decrypt(notifyData.resource.ciphertext)

      // 处理退款业务
      await this.processRefundSuccess(decryptedData)

      res.status(200).json({ code: 'SUCCESS', message: '成功' })
    } catch (error) {
      console.error('处理退款通知失败:', error)
      res.status(500).json({ code: 'FAIL', message: error.message })
    }
  }

  // 辅助方法（需要根据实际业务实现）
  async checkProcessed(outTradeNo, transactionId) { /* 实现 */ }
  async getOrderInfo(outTradeNo) { /* 实现 */ }
  async updateOrderStatus(outTradeNo, statusInfo) { /* 实现 */ }
  async executeBusinessLogic(outTradeNo) { /* 实现 */ }
  async recordProcessLog(logData) { /* 实现 */ }
  getAuthorization() { /* 实现签名 */ }
}
```

## 退款服务

### 1. 退款处理

```javascript
class RefundService {
  constructor(paymentService) {
    this.paymentService = paymentService
  }

  // 发起退款
  async createRefund(refundInfo) {
    const url = 'https://api.mch.weixin.qq.com/v3/refund/domestic/refunds'
    
    const requestData = {
      out_refund_no: refundInfo.outRefundNo,
      transaction_id: refundInfo.transactionId,
      out_trade_no: refundInfo.outTradeNo,
      reason: refundInfo.reason,
      notify_url: refundInfo.notifyUrl,
      funds_account: refundInfo.fundsAccount || 'AVAILABLE',
      amount: {
        refund: refundInfo.refundAmount,
        total: refundInfo.totalAmount,
        currency: 'CNY'
      },
      goods_detail: refundInfo.goodsDetail || []
    }

    const { authorization } = this.paymentService.signer.sign('POST', url, JSON.stringify(requestData))

    try {
      const response = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: requestData
      })

      return {
        success: true,
        refund_id: response.data.refund_id,
        out_refund_no: response.data.out_refund_no,
        status: response.data.status
      }
    } catch (error) {
      return {
        success: false,
        error: this.paymentService.handleError(error)
      }
    }
  }

  // 查询退款
  async queryRefund(outRefundNo) {
    const url = `https://api.mch.weixin.qq.com/v3/refund/domestic/refunds/${outRefundNo}`
    const { authorization } = this.paymentService.signer.sign('GET', url)

    try {
      const response = await axios({
        method: 'GET',
        url: url,
        headers: {
          'Authorization': authorization,
          'Accept': 'application/json'
        }
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: this.paymentService.handleError(error)
      }
    }
  }
}
```

## 对账和查询

### 1. 交易账单下载

```javascript
class BillService {
  constructor(paymentService) {
    this.paymentService = paymentService
  }

  // 申请交易账单
  async getTradeBill(billDate, billType = 'ALL', tarType = 'GZIP') {
    const url = 'https://api.mch.weixin.qq.com/v3/bill/tradebill'
    const params = new URLSearchParams({
      bill_date: billDate,
      bill_type: billType,
      tar_type: tarType
    })

    const fullUrl = `${url}?${params.toString()}`
    const { authorization } = this.paymentService.signer.sign('GET', fullUrl)

    try {
      const response = await axios({
        method: 'GET',
        url: fullUrl,
        headers: {
          'Authorization': authorization,
          'Accept': 'application/json'
        }
      })

      return {
        success: true,
        download_url: response.data.download_url,
        hash_type: response.data.hash_type,
        hash_value: response.data.hash_value
      }
    } catch (error) {
      return {
        success: false,
        error: this.paymentService.handleError(error)
      }
    }
  }

  // 下载账单文件
  async downloadBill(downloadUrl) {
    try {
      const response = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream'
      })

      return response.data
    } catch (error) {
      throw new Error(`下载账单失败: ${error.message}`)
    }
  }

  // 解压GZIP文件
  unzipBill(gzipStream) {
    return new Promise((resolve, reject) => {
      const gunzip = zlib.createGunzip()
      const chunks = []
      
      gzipStream
        .pipe(gunzip)
        .on('data', chunk => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks).toString()))
        .on('error', reject)
    })
  }
}
```

## 错误码详解

### 1. 系统错误码

```javascript
const systemErrorCodes = {
  // 参数错误
  'PARAM_ERROR': {
    description: '参数错误',
    solution: '检查请求参数是否符合API文档要求'
  },
  'PARAM_FORMAT_ERROR': {
    description: '参数格式错误',
    solution: '检查参数格式，如日期格式、金额格式等'
  },
  'PARAM_VALUE_INVALID': {
    description: '参数值无效',
    solution: '检查参数值是否在有效范围内'
  },

  // 权限错误
  'NO_AUTH': {
    description: '权限异常',
    solution: '检查商户号和AppID是否匹配，确认API权限'
  },
  'MCH_NOT_EXISTS': {
    description: '商户号不存在',
    solution: '确认商户号是否正确'
  },
  'APPID_MCHID_NOT_MATCH': {
    description: 'AppID和商户号不匹配',
    solution: '确认AppID和商户号的绑定关系'
  },

  // 签名错误
  'SIGN_ERROR': {
    description: '签名错误',
    solution: '检查签名算法和密钥是否正确'
  },
  'SIGN_FORMAT_ERROR': {
    description: '签名格式错误',
    solution: '检查Authorization头格式是否正确'
  },

  // 业务错误
  'ORDERPAID': {
    description: '订单已支付',
    solution: '订单已完成支付，无需重复支付'
  },
  'ORDERCLOSED': {
    description: '订单已关闭',
    solution: '订单已关闭，无法继续支付'
  },
  'SYSTEMERROR': {
    description: '系统错误',
    solution: '系统异常，请稍后重试'
  },
  'USER_ACCOUNT_ABNORMAL': {
    description: '用户账户异常',
    solution: '用户账户状态异常，请联系用户处理'
  },
  'INVALID_TRANSACTIONID': {
    description: '无效transaction_id',
    solution: '检查微信支付订单号是否正确'
  },
  'TRADE_OVERDUE': {
    description: '交易超时',
    solution: '订单已超时，请重新下单'
  }
}

// 错误处理工具
class ErrorHandler {
  static getErrorInfo(code) {
    return systemErrorCodes[code] || {
      description: '未知错误',
      solution: '请联系技术支持'
    }
  }

  static formatError(error) {
    if (error.response && error.response.data) {
      const { code, message, detail } = error.response.data
      const errorInfo = this.getErrorInfo(code)
      
      return {
        code,
        message: message || errorInfo.description,
        solution: errorInfo.solution,
        detail
      }
    }
    
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      solution: '检查网络连接和API地址'
    }
  }
}
```

## 性能优化和监控

### 1. 连接池配置

```javascript
const axios = require('axios')
const https = require('https')

// 配置HTTP连接池
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
})

const httpClient = axios.create({
  timeout: 10000,
  httpsAgent: httpsAgent,
  retry: 3,
  retryDelay: 1000
})

// 请求拦截器
httpClient.interceptors.request.use(
  config => {
    console.log(`请求: ${config.method.toUpperCase()} ${config.url}`)
    config.metadata = { startTime: Date.now() }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
httpClient.interceptors.response.use(
  response => {
    const duration = Date.now() - response.config.metadata.startTime
    console.log(`响应: ${response.status} ${response.config.url} (${duration}ms)`)
    return response
  },
  error => {
    const duration = Date.now() - error.config.metadata.startTime
    console.error(`错误: ${error.config.url} (${duration}ms)`, error.message)
    return Promise.reject(error)
  }
)
```

### 2. 监控指标

```javascript
class MetricsCollector {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      errorRates: {}
    }
  }

  recordRequest(startTime, isSuccess, errorCode = null) {
    const duration = Date.now() - startTime
    this.metrics.totalRequests++
    
    if (isSuccess) {
      this.metrics.successRequests++
    } else {
      this.metrics.failedRequests++
      if (errorCode) {
        this.metrics.errorRates[errorCode] = (this.metrics.errorRates[errorCode] || 0) + 1
      }
    }

    // 计算平均响应时间
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + duration) / 
      this.metrics.totalRequests
    )
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.successRequests / this.metrics.totalRequests * 100).toFixed(2) + '%' : '0%',
      errorDistribution: this.metrics.errorRates
    }
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      errorRates: {}
    }
  }
}
```