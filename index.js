require('dotenv').config({});
require('console-stamp')(console, 'mm-dd HH:MM:ss.l');

const httpServer = require('./http-server');

require('socket.io')(httpServer, { cookie: false })
  .on('connect', require('./stream-server'));

httpServer.listen(process.env.PORT, process.env.HOST);
