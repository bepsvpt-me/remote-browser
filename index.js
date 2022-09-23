import consoleStamp from 'console-stamp'
consoleStamp(console, 'mm-dd HH:MM:ss.l')
import { Server } from 'socket.io'
import StreamServer from './stream-server/index.js'
import HttpServer from './http-server/index.js'

const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || '3000'

const io = new Server(HttpServer)

io.on('connect', StreamServer)

HttpServer.listen(PORT, HOST)

console.log(`Listen on http://${HOST}:${PORT}`)
