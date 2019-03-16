const path = require('path')

const Koa = require('koa')
const onerror = require('koa-onerror')
const bodyParser = require('koa-bodyparser')
const serve = require('koa-static')
const router = require('./router')

const MAX_AGE = 1000 * 60 * 5

module.exports = server => {
  const app = new Koa()
  app.proxy = true
  onerror(app)

  app.use(bodyParser())
  app.use(serve(path.join(__dirname, '../../public'), MAX_AGE))
  app.use(router.routes())
  server.on('request', app.callback())
}