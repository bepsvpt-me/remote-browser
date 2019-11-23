const credentials = require('../credentials');
const os = require('os');
const turn = require('node-turn');

const interfaces = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => !i.internal && i.family === 'IPv4')
  .map((i) => i.address);

const config = {
  authMech: 'long-term',
  credentials: {},
  debugLevel: 'WARN',
  listeningIps: interfaces,
  listeningPort: 3478,
  maxPort: 65535,
  minPort: 49152,
  realm: process.env.HOST,
  maxAllocateLifetime: 3600,
  defaultAllocatetLifetime: 600,
};

config.credentials[credentials.username] = credentials.password;

module.exports = new turn(config);
