// mock/mock-data.js
// 模拟数据用于开发测试

module.exports = {
  // 菜品分类
  categories: [
    {
      id: 1,
      name: '热菜',
      icon: '🔥',
      dishCount: 15
    },
    {
      id: 2,
      name: '凉菜',
      icon: '🥗',
      dishCount: 8
    },
    {
      id: 3,
      name: '汤类',
      icon: '🍲',
      dishCount: 6
    },
    {
      id: 4,
      name: '主食',
      icon: '🍚',
      dishCount: 12
    },
    {
      id: 5,
      name: '饮品',
      icon: '🥤',
      dishCount: 10
    }
  ],

  // 菜品数据
  dishes: [
    {
      id: 1,
      categoryId: 1,
      categoryIds: [1],
      name: '宫保鸡丁',
      price: 2800,
      description: '经典川菜，鸡肉嫩滑，花生香脆',
      image: 'https://picsum.photos/300/300?random=1',
      salesCount: 156,
      rating: 4.8,
      stock: 20,
      isNew: false,
      isHot: true,
      isRecommend: true
    },
    {
      id: 2,
      categoryId: 1,
      categoryIds: [1],
      name: '麻婆豆腐',
      price: 1800,
      description: '麻辣鲜香，豆腐嫩滑',
      image: 'https://picsum.photos/300/300?random=2',
      salesCount: 234,
      rating: 4.6,
      stock: 15,
      isNew: false,
      isHot: true,
      isRecommend: false
    },
    {
      id: 3,
      categoryId: 2,
      categoryIds: [2],
      name: '拍黄瓜',
      price: 1200,
      description: '清爽开胃，蒜香浓郁',
      image: 'https://picsum.photos/300/300?random=3',
      salesCount: 89,
      rating: 4.5,
      stock: 30,
      isNew: true,
      isHot: false,
      isRecommend: true
    },
    {
      id: 4,
      categoryId: 4,
      categoryIds: [4],
      name: '扬州炒饭',
      price: 1500,
      description: '粒粒分明，配料丰富',
      image: 'https://picsum.photos/300/300?random=4',
      salesCount: 167,
      rating: 4.7,
      stock: 25,
      isNew: false,
      isHot: false,
      isRecommend: true
    },
    {
      id: 5,
      categoryId: 3,
      categoryIds: [3],
      name: '西湖牛肉羹',
      price: 2200,
      description: '汤鲜味美，营养丰富',
      image: 'https://picsum.photos/300/300?random=5',
      salesCount: 78,
      rating: 4.4,
      stock: 18,
      isNew: false,
      isHot: false,
      isRecommend: false
    }
  ],

  // 订单数据（清空示例数据）
  orders: []
};