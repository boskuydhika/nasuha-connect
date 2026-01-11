/**
 * NASUHA Connect API
 * Main entry point for Hono server
 */

// Import config first - will fail-fast if env invalid
import { config } from './config'

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { logger, logError } from './lib/logger'
import { db } from './lib/db'
import { sql } from 'drizzle-orm'

import authRoutes from './routes/auth'
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
app.use('*', honoLogger())

// CORS configuration
app.use(
  '*',
  cors({
    origin: config.CORS_ORIGIN,
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

// Health check with database connectivity
app.get('/health', async (c) => {
  try {
    await db.execute(sql`SELECT 1`)
    return c.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    logError('health-check', err)
    return c.json({ status: 'degraded', database: 'disconnected' }, 503)
  }
})

// =============================================================================
// API ROUTES
// =============================================================================

// Mount routes under /api (NO URI VERSIONING - Eko PZN Philosophy)
const api = new Hono()

api.route('/auth', authRoutes)
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
  logError('unhandled-error', err, { path: c.req.path, method: c.req.method })
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

logger.info({ port: config.API_PORT }, `🚀 NASUHA Connect API running on http://localhost:${config.API_PORT}`)

export default {
  port: config.API_PORT,
  fetch: app.fetch,
}
