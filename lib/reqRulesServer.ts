import { Server } from 'http'
import * as Koa from 'koa'

import {
  COOKIE_NAME,
  ENV_MAX_AGE,
  WHISTLE_ENV_HEADER,
  WHISTLE_RULE_VALUE,
  isFromComposer,
  getRuleValue,
  getDomain
} from './utils'

const getCookie = (value: string, maxAge: number, hostname: string) => {
  return {
    whistleEnvCookie: {
      [COOKIE_NAME]: {
        value,
        maxAge,
        domain: getDomain(hostname),
        path: '/'
      }
    }
  }
}

export default (server: Server) => {
  const app = new Koa()
  app.proxy = true

  app.use(async function () {
    let { account, env } = envMgr.getEnvByHeader(this, isFromComposer(this))
    const useReqHeaders = account
    if (!useReqHeaders) {
      env = envMgr.getEnv(this)
      account = env && accountMgr.getAccount(env.name)
    }
    const hostname = (this.get('host') || '').split(':')[0]
    const filter = getRuleValue(this) === 'none' ? 'filter://html' : ''
    if (!account) {
      this.body = {
        rules: `/./ resCookies://{whistleEnvCookie} ${filter}`,
        values: getCookie('', -ENV_MAX_AGE, hostname),
      }
      return
    }
    const name = account && account.name
    let envHeader = ''
    let envKey = `${name}/`

    if (env) {
      const { envName } = env
      const resHeaders = {}
      if (envName) {
        envKey += envName
        let { rules, headers } = accountMgr.getRules(account.name, envName)
        if (headers) {
          headers = JSON.stringify(headers)
          rules += `\n/./ reqHeaders://(${headers})`
        }
        if (rules) {
          resHeaders[WHISTLE_RULE_VALUE] = encodeURIComponent(rules)
        }
      }
      resHeaders[WHISTLE_ENV_HEADER] = encodeURIComponent(envKey)
      envHeader = `reqHeaders://(${JSON.stringify(resHeaders)})`
    }
    const port = await whistleMgr.fork(account)
    const proxyUrl = `internal-proxy://127.0.0.1:${port}`
    const cookie = getCookie(envKey, ENV_MAX_AGE, hostname)
    this.body = {
      rules: `/./ ${proxyUrl} ${envHeader} ${filter} ${cookie ? 'resCookies://{whistleEnvCookie}' : ''}`,
      values: cookie,
    }
  })

  server.on('request', app.callback())
}