/**
 * NASUHA Connect API
 * Main entry point for Hono server
 */

import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import mediaRoutes from './routes/media'
import categoryRoutes from './routes/categories'

// =============================================================================
// APP SETUP
// =============================================================================

const app = new Hono()

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

// Request logging
app.use('*', logger())

// CORS configuration
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'NASUHA Connect API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

// =============================================================================
// API ROUTES
// =============================================================================

// Mount routes under /api (NO URI VERSIONING - Eko PZN Philosophy)
const api = new Hono()

api.route('/media', mediaRoutes)
api.route('/categories', categoryRoutes)

app.route('/api', api)

// =============================================================================
// 404 HANDLER
// =============================================================================

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} tidak ditemukan`,
      },
    },
    404
  )
})

// =============================================================================
// ERROR HANDLER
// =============================================================================

app.onError((err, c) => {
  console.error('[UNHANDLED ERROR]', err)
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan internal server',
      },
    },
    500
  )
})

// =============================================================================
// SERVER START
// =============================================================================

const port = Number(process.env.API_PORT) || 3000

console.log(`🚀 NASUHA Connect API running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
