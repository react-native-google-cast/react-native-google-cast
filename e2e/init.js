const detox = require('detox')
const config = require('../package.json').detox
const adapter = require('detox/runners/jest/adapter')
const WS = require('jest-websocket-mock').default
require('./socket')

jest.setTimeout(120000)
jasmine.getEnv().addReporter(adapter)

beforeAll(async () => {
  await detox.init(config)

  const serveStatic = require('serve-static')
  const http = require('http')

  const serve = serveStatic(__dirname)
  const server = http.createServer((req, res) => {
    serve(req, res)
  })

  server.listen(57684, () => {
    console.log('Running at http://localhost:57684')
  })
})

beforeEach(async () => {
  await adapter.beforeEach()
  WS.clean()
})

afterAll(async () => {
  await adapter.afterAll()
  await detox.cleanup()
  WS.clean()
})
