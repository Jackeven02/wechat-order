// pages/feedback/feedback.js
Page({
  data: {
    feedbackTypes: [
      { id: 1, name: '菜品问题', icon: '🍽️' },
      { id: 2, name: '服务问题', icon: '👨‍🍳' },
      { id: 3, name: '环境问题', icon: '🏠' },
      { id: 4, name: '支付问题', icon: '💳' },
      { id: 5, name: '其他问题', icon: '❓' }
    ],
    selectedType: null,
    contact: '',
    content: '',
    images: [],
    isSubmitting: false
  },

  onLoad: function() {
    // 页面加载
  },

  // 选择反馈类型
  onSelectType: function(e) {
    const typeId = e.currentTarget.dataset.type;
    this.setData({ selectedType: typeId });
  },

  // 联系方式输入
  onContactInput: function(e) {
    this.setData({ contact: e.detail.value });
  },

  // 反馈内容输入
  onContentInput: function(e) {
    this.setData({ content: e.detail.value });
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

  // 提交反馈
  onSubmitFeedback: function() {
    if (this.data.isSubmitting) return;
    
    if (!this.data.selectedType) {
      wx.showToast({
        title: '请选择反馈类型',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.content.trim() === '') {
      wx.showToast({
        title: '请输入反馈内容',
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
          return this.submitFeedbackData(imageUrls);
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
      this.submitFeedbackData(imageUrls);
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

  // 提交反馈数据
  submitFeedbackData: function(imageUrls) {
    const request = require('../../utils/request.js');
    
    const feedbackData = {
      type: this.data.selectedType,
      contact: this.data.contact,
      content: this.data.content,
      images: imageUrls
    };

    request.post('/feedback/submit', feedbackData)
      .then(res => {
        wx.showToast({
          title: '反馈提交成功',
          icon: 'success'
        });
        
        // 清空表单
        this.setData({
          selectedType: null,
          contact: '',
          content: '',
          images: []
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('提交反馈失败', err);
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