const crypto = require('crypto');

if (!(process.env.TURN_SERVER && process.env.TURN_SECRET)) {
  module.exports = () => ({});
} else {
  module.exports = () => {
    const lifetime = Math.trunc(+new Date / 1000) + 6 * 60 * 60; // 6 hours
    const unique = crypto.randomBytes(8).toString('hex');
    const username = `${lifetime}:${unique}`;

    return {
      turnServer: process.env.TURN_SERVER,
      turnUsername: username,
      turnPassword: crypto.createHmac('sha1', process.env.TURN_SECRET)
        .update(username)
        .digest('base64')
    };
  };
}
