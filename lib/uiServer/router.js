const router = require('koa-router')()
const base = require('koa-router')()

base.get('/info', ctx => {
  ctx.body = {
    status: 200,
    data: [
      { id: 0, name: 'student-apphd-exam' },
      { id: 1, name: 'parent-apphd-exam' }
    ]
  }
})
base.post('/change', ctx => {})
base.post('/add', ctx => {})

router.use('/cgi-bin', base.routes(), base.allowedMethods())

module.exports = router