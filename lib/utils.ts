import crypto from 'crypto'
import net from 'net'
import qs from 'querystring'
import parseurl from 'parseurl'
import http from 'http'
import getAuth from 'basic-auth'
import * as Koa from 'koa'

const ENV_MAX_AGE = 60 * 60 * 24 * 3
const WHISTLE_ENV_HEADER = 'x-whistle-nohost-env'
const CONFIG_DATA_TYPE = 'PROXY_CONFIG'
const COOKIE_NAME = 'whistle_nohost_env'
const WHISTLE_RULE_VALUE = 'x-whistle-rule-value'
const BASE_URL = 'http://local.whistlejs.com/plugin.nohost/'

const CONF_KEY_RE = /^([\w-]{1,64}:?|[\w.-]{1,64}:)$/

const shasum = (str: string) => {
  const result = crypto.createHash('sha1')
  result.update(str)
  return result.digest('hex')
}

const getLoginKey = (ctx: Koa.Context, username: string, password: string) => {
  const ip = ctx.ip || '127.0.0.1'
  return shasum(`${username || ''}\n${password || ''}\n${ip}`)
}

const checkLogin = (ctx: Koa.Context, authConf: any) => {
  const {
    username,
    password,
    nameKey,
    authKey
  } = authConf

  if (!username || !password) {
    return true
  }

  const curName = ctx.cookies.get(nameKey)
  const lkey = ctx.cookies.get(authKey)
  const correctKey = getLoginKey(ctx, username, password)

  if (curName === username && correctKey === lkey) {
    return true
  }

  let { name, pass }: any = getAuth(ctx.req) || {}
  pass = shasum(pass)

  if (name === username && pass === password) {
    const options = {
      expires: new Date(Date.now() + ENV_MAX_AGE * 1000),
      path: '/'
    }
    ctx.cookies.set(nameKey, username, options)
    ctx.cookies.set(authKey, correctKey, options)
    return true
  }

  ctx.status = 401
  ctx.set('WWW-Authenticate', ' Basic realm=User Login')
  ctx.set('Content-Type', 'text/html; charset=utf8')
  ctx.body = 'Access denied, please <a href="javascript:;" onclick="location.reload()">try again</a>.'
  return false
}

const decodeURIComponentSafe = (str: string) => {
  try {
    return decodeURIComponent(str)
  } catch (e) {}
  return str
}

const parseJSON = (str: string) => {
  try {
    const result = JSON.parse(str)
    if (typeof result === 'object') {
      return result
    }
  } catch (e) {}
}

const parseExtraData = (str: string) => {
  if (typeof str !== 'string') {
    return {};
  }
  str = str.trim()
  if (str) {
    try {
      return JSON.parse(str)
    } catch (e) {}
    try {
      return JSON.parse(decodeURIComponent(str))
    } catch (e) {}
    try {
      return qs.parse(str)
    } catch (e) {}
  }
  return {}
};

const parseNohostConfig = (str: string) => {
  let data = parseExtraData(str).nohost
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
  } catch (e) {}
  return data || {}
};

const transformReq = (req: http.IncomingMessage, port: number, host?: string) => {
  const options: any = parseurl(req)
  options.host = host || '127.0.0.1'
  options.method = req.method
  options.headers = req.headers
  delete options.headers.referer
  delete options.protocol
  delete options.hostname
  if (port > 0) {
    options.port = port
  }
  return new Promise((resolve, reject) => {
    const client = http.request(options, resolve)
    client.on('error', reject)
    req.pipe(client)
  })
}

const transformWhistle = async function (ctx: Koa.Context, port: number) {
  const { req } = ctx
  const res: any = await transformReq(req, port)
  ctx.status = res.statusCode
  ctx.set(res.headers)
  ctx.body = res
};

const parseConfig = (ctn: string) => {
  if (typeof ctn !== 'string') {
    return
  }
  let conf: any
  ctn.trim().split(/\r\n|\r|\n/g).forEach((line) => {
    line = line.replace(/#.*$/, '').trim().split(/\s+/)
    if (line.length) {
      let key = line[0].toLowerCase()
      if (!key || !CONF_KEY_RE.test(key)) {
        return
      }
      conf = conf || {}
      key = key.replace(':', '')
      if (key !== 'host') {
        key = `x-nohost-${key}`
      }
      if (conf[key] == null && (!conf.headers || conf.headers[key] == null)) {
        if (key === 'host') {
          conf.host = line[1]
        } else {
          conf.headers = conf.headers || {}
          conf.headers[key] = line[1] || ''
        }
      }
    }
  })
  return conf
}

const KEY_RE = /(?:@([^\s@]+)|\{([^\s@]+)\})/ig;
const resolveConf = (ctn: string, values: any) => {
  if (!ctn || !values) {
    return ctn;
  }
  return ctn.replace(KEY_RE, (all, $1, $2) => {
    return values[$1 || $2] || '';
  });
};

const resolveConfList = (list: Array<any>, publicList) => {
  if (!list.length || !publicList || !publicList.length) {
    return list
  }
  const map = {}
  publicList.forEach((conf) => {
    map[conf.name] = conf.rules || ''
  })
  list.forEach((conf) => {
    conf.rules = resolveConf(conf.rules, map)
  })
  return list
};

let REQ_FROM_HEADER
let RULE_VALUE_HEADER

const initPlugin = (options) => {
  REQ_FROM_HEADER = options.REQ_FROM_HEADER
  RULE_VALUE_HEADER = options.RULE_VALUE_HEADER
  const config = options.config
  const pluginConfig = parseNohostConfig(options.config.extra)
  const hosts = options.config.pluginHosts.nohost || []
  if (hosts[0]) {
    const BASE_URL = `http://${hosts[0]}/`
  }
};

const getRuleValue = (ctx: Koa.Context) => {
  const ruleValue = ctx.get(RULE_VALUE_HEADER)
  return ruleValue ? decodeURIComponent(ruleValue) : ''
}

const isFromComposer = (ctx: Koa.Context) => {
  return ctx.get(REQ_FROM_HEADER) === 'W2COMPOSER'
}

const getDomain = (hostname: string) => {
  if (net.isIP(hostname)) {
    return hostname
  }
  let list = hostname.split('.')
  let len = list.length
  if (len < 3) {
    return hostname
  }
  let wildcard = len > 3
  if (wildcard) {
    list = list.slice(-3)
  }

  if (list[1].length > 3 || list[1] === 'url' || list[2] === 'com') {
    wildcard = true
    list = list.slice(-2)
  }
  if (wildcard) {
    list.unshift('')
  }
  return list.join('.')
};

const getClientId = (ctx: Koa.Context) => {
  const clientId = ctx.get('x-whistle-nohost-client-id')
  if (clientId && typeof clientId === 'string') {
    return clientId.trim() || ctx.ip
  }
  return ctx.ip
}

export {
  ENV_MAX_AGE,
  WHISTLE_ENV_HEADER,
  CONFIG_DATA_TYPE,
  COOKIE_NAME,
  WHISTLE_RULE_VALUE,
  BASE_URL,
  shasum,
  checkLogin,
  decodeURIComponentSafe,
  parseJSON,
  transformReq,
  transformWhistle,
  parseConfig,
  resolveConfList,
  initPlugin,
  getRuleValue,
  isFromComposer,
  getDomain,
  getClientId
}