const app = require('./client');

module.exports = require('http').createServer(app);
