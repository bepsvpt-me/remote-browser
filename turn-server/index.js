const os = require('os');
const turn = require('node-turn');

module.exports = new turn({
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
});
