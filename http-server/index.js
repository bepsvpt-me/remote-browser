const app = require('./client');
const fs = require('fs');
const path = require('path');

if (process.env.SECURE !== 'true') {
  module.exports = require('http').createServer(app);
} else {
  const opts = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'fullchain.pem'))
  };

  module.exports = require('https').createServer(opts, app);
}

