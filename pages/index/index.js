const getHomeData = require('../../apis/home')

Page({
  data: {
  },
  onLoad: function () {
    getHomeData({})
  },
})