const request = require('../utils/request')

function getHomeData(data) {
  return request({
    url: '/users/register',
    method: 'post',
    data: data
  })
}

module.exports = {
  getHomeData
}