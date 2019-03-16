const router = require('koa-router')()

router.get('/cgi-bin/info', ctx => {
  ctx.body = {
    status: 200,
    data: [
      { id: 0, name: 'student-apphd-exam' },
      { id: 1, name: 'parent-apphd-exam' }
    ]
  }
})
router.post('/cgi-bin/change', ctx => {})
router.post('/cgi-bin/add', ctx => {})

module.exports = router