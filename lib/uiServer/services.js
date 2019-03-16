const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({
  hosts: [
    { id: 0, name: 'host1' },
    { id: 1, name: 'host2' }
  ],
  currentHost: {
    id: 0,
    name: 'host1'
  }
}).write()

function findHost() {
  return db.get('hosts').value()
}

function findOneHost(id) {
  return db.get('hosts').filter({ id }).value()
}

function getCurrentHost() {
  return db.get('currentHost').value()
}

function updateCurrentHost({ id }) {
  const host = findOneHost(id)
  db.set('currentHost', host).write()
  return host
}

exports.findHost = findHost
exports.getCurrentHost = getCurrentHost
exports.updateCurrentHost = updateCurrentHost