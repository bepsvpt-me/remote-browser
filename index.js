require('dotenv').config({});
require('console-stamp')(console, 'mm-dd HH:MM:ss.l');

const httpServer = require('./http-server');
const turn = require('./turn-server');

turn.start();

require('socket.io')(httpServer).on('connect', require('./stream-server'));

httpServer.listen(process.env.PORT);
