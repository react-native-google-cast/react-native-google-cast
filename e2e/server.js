const WebSocket = require('ws')

const cast = new WebSocket.Server({ port: 57685 })
const test = new WebSocket.Server({ port: 57686 })

cast.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('\nreceived: %s', message)
    if (test.readyState === WebSocket.OPEN) test.send(message)
  })
})
test.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('\nsending: %s', message)
    if (cast.readyState === WebSocket.OPEN) cast.send(message)
  })
})

const serveStatic = require('serve-static')
const http = require('http')

const serve = serveStatic(__dirname)
const server = http.createServer((req, res) => {
  serve(req, res)
})

server.listen(57684, () => {
  console.log('Running at http://localhost:57684')
})
