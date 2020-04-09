const users = {}

users[process.env.AUTH_USERNAME] = process.env.AUTH_PASSWORD

module.exports = users
