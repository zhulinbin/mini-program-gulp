import flyio from '../utils/request'

export function getHomeData(data) {
  return flyio.request({
    url: 'http://www.baidu.com/users/register',
    method: 'post',
    data: data
  })
}
