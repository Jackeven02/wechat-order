// pages/review/review.js
Page({
  data: {
    orderId: '',
    orderInfo: null,
    rating: 5,
    comment: '',
    images: [],
    isSubmitting: false,
    ratingLabels: ['非常差', '差', '一般', '好', '非常好']
  },

  onLoad: function(options) {
    const { orderId } = options;
    this.setData({ orderId: orderId });
    this.loadOrderInfo(orderId);
  },

  // 加载订单信息
  loadOrderInfo: function(orderId) {
    const request = require('../../utils/request.js');
    
    request.get(`/orders/detail/${orderId}`)
      .then(res => {
        const orderInfo = res.data;
        // 预先计算格式化价格
        if (orderInfo && orderInfo.items) {
          orderInfo.items = orderInfo.items.map(item => ({
            ...item,
            formattedPrice: ((item.price * item.quantity) / 100).toFixed(2)
          }));
        }
        this.setData({
          orderInfo: orderInfo
        });
      })
      .catch(err => {
        console.error('加载订单信息失败', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 评分选择
  onRatingChange: function(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating: rating });
  },

  // 评论输入
  onCommentInput: function(e) {
    this.setData({ comment: e.detail.value });
  },

  // 选择图片
  onChooseImage: function() {
    const that = this;
    wx.chooseImage({
      count: 3 - this.data.images.length,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const images = that.data.images.concat(res.tempFilePaths);
        that.setData({ images: images });
      }
    });
  },

  // 删除图片
  onDeleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({ images: images });
  },

  // 提交评价
  onSubmitReview: function() {
    if (this.data.isSubmitting) return;
    
    if (this.data.comment.trim() === '') {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ isSubmitting: true });

    // 上传图片（如果有）
    let imageUrls = [];
    if (this.data.images.length > 0) {
      this.uploadImages()
        .then(urls => {
          imageUrls = urls;
          return this.submitReviewData(imageUrls);
        })
        .catch(err => {
          console.error('图片上传失败', err);
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
          this.setData({ isSubmitting: false });
        });
    } else {
      this.submitReviewData(imageUrls);
    }
  },

  // 上传图片
  uploadImages: function() {
    const images = this.data.images;
    const uploadPromises = images.map(imagePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: 'https://your-api-domain.com/api/upload', // 替换为实际上传接口
          filePath: imagePath,
          name: 'file',
          success: res => {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              resolve(data.data.url);
            } else {
              reject(data.message);
            }
          },
          fail: reject
        });
      });
    });

    return Promise.all(uploadPromises);
  },

  // 提交评价数据
  submitReviewData: function(imageUrls) {
    const request = require('../../utils/request.js');
    
    const reviewData = {
      orderId: this.data.orderId,
      rating: this.data.rating,
      comment: this.data.comment,
      images: imageUrls,
      anonymous: false // 可以添加匿名选项
    };

    request.post('/orders/review', reviewData)
      .then(res => {
        wx.showToast({
          title: '评价成功',
          icon: 'success'
        });
        
        // 延迟返回订单详情页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('提交评价失败', err);
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  },

  // 预览图片
  onPreviewImage: function(e) {
    const current = e.currentTarget.dataset.src;
    wx.previewImage({
      current: current,
      urls: this.data.images
    });
  }
});