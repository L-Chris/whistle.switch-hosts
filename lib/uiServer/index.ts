import path from 'path'
import { Server } from 'http'

import * as Koa from 'koa'
import serve from 'koa-static'
import router from './router'

const MAX_AGE = 1000 * 60 * 5

export default (server: Server) => {
  const app = new Koa()
  app.proxy = true

  app.use(router.routes())
  app.use(serve(path.join(__dirname, '../../public'), { maxage: MAX_AGE }))
  server.on('request', app.callback())
}