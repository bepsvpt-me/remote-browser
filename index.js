require('dotenv').config({});
require('console-stamp')(console, 'mm-dd HH:MM:ss.l');

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || '3000';
const httpServer = require('./http-server');

require('socket.io')(httpServer, { cookie: false })
  .on('connect', require('./stream-server'));

httpServer.listen(PORT, HOST);

console.log(`Listen on http://${HOST}:${PORT}`);
