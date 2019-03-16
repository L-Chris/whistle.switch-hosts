const router = require('koa-router')()
const base = require('koa-router')()
const services = require('./services')

base.get('/list', ctx => {
  const data = services.findHost()
  ctx.success({ data })
})

base.get('/current', ctx => {
  const data = services.findCurrentHost()
  ctx.success({ data })
})

base.post('/change', ctx => {
  const { id } = ctx.request.body
  const host = updateCurrentHost({ id })
  ctx.body = {
    status: 200,
    data: host
  }
})

router.use('/cgi-bin', base.routes(), base.allowedMethods())

module.exports = router