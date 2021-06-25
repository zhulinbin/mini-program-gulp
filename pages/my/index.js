import { getHomeData } from '../../apis/home'

Page({
  data: {
  },
  onLoad: function () {
    getHomeData({})
  },
  goHomePage: function () {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
})