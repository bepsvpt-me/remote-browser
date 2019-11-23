const randomString = require('crypto-random-string');

module.exports = {
  username: randomString({ length: 16 }),
  password: randomString({ length: 16 }),
};
