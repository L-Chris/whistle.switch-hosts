const fs = require('fs')
const child_process = require('child_process')

function debounce(cb, timeout) {
  let tickId = null
  return () => {
    clearTimeout(tickId)
    tickId = setTimeout(cb, timeout)
  }
}

function triggerUpdate() {
  fs.appendFileSync('./package.json', ' ')
  console.log('Update Success!')
}

const watchCallback = function () {
  child_process.exec('yarn build', (err, stdout, stderr) => {
    triggerUpdate()
  })
}

fs.watch('./src', { recursive: true }, debounce(watchCallback, 1500))
fs.watch('./lib', { recursive: true }, debounce(triggerUpdate, 1500))