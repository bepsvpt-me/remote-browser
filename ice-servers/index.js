import crypto from 'crypto'

const sServer = process.env.STUN_SERVER
const tServer = process.env.TURN_SERVER
const key = process.env.TURN_KEY

const expiration = () => {
  const microsecond = +new Date

  const timestamp = Math.trunc(microsecond / 1000)

  return timestamp + (60 * 60) // one hour
}

const random = () => {
  return crypto.randomBytes(8)
    .toString('hex')
}

const hmac = (data) => {
  return crypto.createHmac('sha1', key)
    .update(data)
    .digest('base64')
}

export default () => {
  const servers = []

  if (sServer) {
    servers.push({ urls: `stun:${sServer}` })
  }

  if (tServer && key) {
    const username = `${expiration()}:${random()}`

    servers.push({
      urls: `turn:${tServer}`,
      username: username,
      credential: hmac(username)
    })
  }

  return servers
}
