import express from 'express'
import basicAuth from 'express-basic-auth'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

if (process.env.AUTH_ENABLE === 'true') {
  app.use(basicAuth({
    users: (await import('./auth.js')).default,
    challenge: true,
  }))
}

app.use(
  '/assets',
  express.static(path.join(__dirname, 'assets'))
)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client.html'))
})

app.get('/credentials.json', async (req, res) => {
  res.json((await import('../../ice-servers/index.js')).default())
})

app.get('*', (req, res) => {
  res.redirect('/')
})

export default app
