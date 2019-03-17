import whistle from 'whistle'
import path from 'path'
import os from 'os'
import portfinder from 'portfinder'
import { CONFIG_DATA_TYPE } from './utils'

const HOME_DIR = os.homedir()

const WHISTLE_SECURE_FILTER = path.resolve(HOME_DIR, 'nohost/whistleSecureFilter.js')
const PLUGINS_DIR = path.resolve(HOME_DIR, 'whistle-plugins')
const NOHOST_PLUGINS = path.join(PLUGINS_DIR, 'whistle.nohost/node_modules')
const IDLE_TIMEOUT = 12 * 60 * 1000
const UPDATE_INTERVAL = 1000
const SHADOW_RULES = '/./ responseFor://name=x-upstream,req.x-whistle-nohost-env'

let index = 0
let updatedIndex
let curEnvList = []

const compareList = (curList, newList) => {
  if (curList.length !== newList.length) {
    return false;
  }
  return !newList.some((item, i) => {
    const { name, data } = curList[i];
    return name !== item.name || data !== item.data;
  });
};

const syncData = (proxy) => {
  process.on('data', (data) => {
    const type = data && data.type;
    if (type !== CONFIG_DATA_TYPE) {
      return;
    }
    if (data.index >= 0) {
      updatedIndex = data.index;
    }
    proxy.setAuth(data);
  });
  const getEnvList = () => {
    const envList = proxy.rulesUtil.rules.list();
    if (updatedIndex !== index || !compareList(curEnvList, envList)) {
      ++index;
      curEnvList = envList;
      process.sendData({
        index,
        envList,
        type: CONFIG_DATA_TYPE,
      });
    }
    setTimeout(getEnvList, UPDATE_INTERVAL);
  };
  getEnvList();
};

export default async (options, callback) => {
  const port = await portfinder.getPortPromise()

  const proxy = whistle({
    port,
    authKey: options.authKey,
    encrypted: true,
    certDir: options.certDir,
    storage: options.storage,
    username: options.username,
    password: options.password,
    guestName: options.guestName,
    guestPassword: options.guestPassword,
    shadowRules: SHADOW_RULES,
    rules: options.rules,
    values: options.values,
    replaceExistRule: false,
    replaceExistValue: false,
    mode: 'multiEnv|keepXFF',
    secureFilter: WHISTLE_SECURE_FILTER,
    extra: JSON.stringify({
      uiport: options.uiport,
      name: options.username,
    }),
    pluginPaths: [
      path.join(PLUGINS_DIR, `whistle.nohost/${options.value}/node_modules`),
      NOHOST_PLUGINS,
    ],
  }, () => {
    curEnvList = proxy.rulesUtil.rules.list();
    setTimeout(() => callback(null, { port, envList: curEnvList }), 100);
  });
  let timer
  const exitWhistleIfIdleTimeout = () => {
    clearTimeout(timer)
    timer = setTimeout(() => process.exit(), IDLE_TIMEOUT)
  }
  exitWhistleIfIdleTimeout()
  proxy.on('wsRequest', exitWhistleIfIdleTimeout)
  proxy.on('_request', exitWhistleIfIdleTimeout)
  syncData(proxy)
}