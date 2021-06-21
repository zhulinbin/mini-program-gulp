const envConfig = require('../.env.js')
const Fly = require('flyio')
const flyio = new Fly

/* 设置通用配置 */
flyio.config.timeout = 10000
flyio.config.baseURL = envConfig.BASE_URL

/* 添加请求拦截器 */
flyio.interceptors.request.use((request) => {
  request.headers['token'] = 'aslkasjdlk99'

  return request
})

/* 添加响应拦截器，响应拦截器会在then/catch处理之前执行 */
flyio.interceptors.response.use(
  (response) => {
    return response.data
  },
  (err) => {
    return Promise.resolve(err)
  }
)

export default flyio
