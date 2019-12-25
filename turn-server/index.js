const crypto = require('crypto');

const turn = {};

if (process.env.TURN_SERVER && process.env.TURN_SECRET) {
  const lifetime = Math.trunc(+new Date / 1000) + 12 * 60 * 60; // 12 hours
  const unique = crypto.randomBytes(8).toString('hex');

  turn.turnServer = process.env.TURN_SERVER;

  turn.turnUsername = `${lifetime}:${unique}`;

  turn.turnPassword = crypto.createHmac('sha1', process.env.TURN_SECRET)
    .update(turn.turnUsername)
    .digest('base64');
}

module.exports = turn;
