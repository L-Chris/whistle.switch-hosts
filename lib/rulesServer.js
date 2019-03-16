exports.rulesServer = (server, { config, storage }) => {
  const rulesFile = storage.getProperty('path')
  server.on('request', (req, res) => {
    
  })
}