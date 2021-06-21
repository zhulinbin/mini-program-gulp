import { getHomeData } from '../../apis/home'

Page({
  data: {
  },
  onLoad: function () {
    getHomeData({})
  },
})