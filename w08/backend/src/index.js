import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { indexRouter } from './router/indexRouter.js'

const app = new Hono()

// Enable CORS for all routes
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
}))

app.get('/', (c) => c.text('Hello, World!'))
app.route('/api', indexRouter)


console.log('Server is running on http://localhost:3000')

serve({
    fetch: app.fetch,
    port: 3000
})