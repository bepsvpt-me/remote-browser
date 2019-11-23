const os = require('os');
const turn = require('node-turn');
const credentials = require('../credentials');

const config = {
  authMech: 'long-term',
  credentials: {},
  debugLevel: 'WARN',
  listeningIps: ['0.0.0.0'],
  listeningPort: 3478,
  maxPort: 65535,
  minPort: 49152,
  realm: os.hostname(),
  maxAllocateLifetime: 3600,
  defaultAllocatetLifetime: 600,
};

config.credentials[credentials.username] = credentials.password;

module.exports = new turn(config);
