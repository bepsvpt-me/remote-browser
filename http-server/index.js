import { createServer } from 'http'
import app from './client/index.js'

export default createServer(app)
