const router = require('koa-router')()
const base = require('koa-router')()

const store = {
  host: [
    { id: 0, name: 'student-apphd-exam' },
    { id: 1, name: 'parent-apphd-exam' }
  ],
  selectedHost: {
    id: 0,
    name: 'student-apphd-exam'
  }
}

base.get('/list', ctx => {
  ctx.body = {
    status: 200,
    data: store.hosts
  }
})

base.get('/current', ctx => {
  ctx.body = {
    status: 200,
    data: store.selectedHost
  }
})

base.post('/change', ctx => {
  const { id } = ctx.request.body
  const host = store.hosts.find(_ => _.id === id)
  store.selectedHost = host
  ctx.body = {
    status: 200,
    data: host
  }
})

router.use('/cgi-bin', base.routes(), base.allowedMethods())

module.exports = router