const WS = require('jest-websocket-mock').default

const server = new WS('ws://localhost:57685', { jsonProtocol: true })

module.exports = server
