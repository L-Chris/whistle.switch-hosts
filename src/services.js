import axios from 'axios'

axios.defaults.baseURL = '/cgi-bin'
axios.defaults.timeout = 20000

axios.interceptors.request.use(config => config, err => Promise.reject(err))
axios.interceptors.response.use(({ data: { data, status } }) => {
  if (status === 200) return data
  return Promise.reject({ data, status })
}, err => Promise.reject(err))

function findHost() {
  return axios.get('/info')
}

export {
  findHost
}