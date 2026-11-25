import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import aiHandler from './api/ai.js'
import statusHandler from './api/status.js'
import subscriptionHandler from './api/subscription.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Populate server-only env vars into process.env for local Vercel handler parity
  const serverEnvKeys = [
    'ASTRACODE_API_KEY',
    'ASTRACODE_BASE_URL',
    'ASTRACODE_FAST_MODEL',
    'ASTRACODE_HARD_MODEL',
    'GEMINI_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  for (const k of serverEnvKeys) {
    if (env[k] && !process.env[k]) {
      process.env[k] = env[k]
    }
  }

  return {
    plugins: [
      react(),
      // Dev middleware to handle Vercel serverless /api endpoints locally
      {
        name: 'vercel-api-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/')) {
              const pathname = req.url.split('?')[0]

              const attachExpressHelpers = () => {
                res.status = (code) => {
                  res.statusCode = code
                  return res
                }
                res.json = (data) => {
                  res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8' })
                  res.end(JSON.stringify(data))
                  return res
                }
              }

              // Handle /api/status
              if (pathname === '/api/status') {
                attachExpressHelpers()
                await statusHandler(req, res)
                return
              }

              // Handle /api/subscription
              if (pathname === '/api/subscription') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', async () => {
                  try {
                    req.body = body ? JSON.parse(body) : {}
                    attachExpressHelpers()
                    await subscriptionHandler(req, res)
                  } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({ error: { message: e.message || 'Subscription API error' } }))
                  }
                })
                return
              }

              // Handle /api/test-ai/proxy for local development
              if (pathname === '/api/test-ai/proxy' && req.method === 'POST') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', async () => {
                  try {
                    const { endpoint, apiKey, payload } = JSON.parse(body || '{}')
                    if (!endpoint) throw new Error('Missing endpoint')

                    const parsedUrl = new URL(endpoint)
                    const postData = JSON.stringify(payload)
                    const isHttps = parsedUrl.protocol === 'https:'
                    const httpModule = isHttps ? https : (await import('http')).default

                    const options = {
                      hostname: parsedUrl.hostname,
                      port: parsedUrl.port || (isHttps ? 443 : 80),
                      path: parsedUrl.pathname + parsedUrl.search,
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey || env.ASTRACODE_API_KEY || ''}`,
                        'Content-Length': Buffer.byteLength(postData)
                      },
                      timeout: 60000
                    }

                    const proxyReq = httpModule.request(options, (proxyRes) => {
                      let rawData = ''
                      proxyRes.on('data', chunk => { rawData += chunk })
                      proxyRes.on('end', () => {
                        let parsedData = null
                        try {
                          parsedData = JSON.parse(rawData)
                        } catch {
                          parsedData = { raw: rawData }
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                        res.end(JSON.stringify({
                          success: proxyRes.statusCode >= 200 && proxyRes.statusCode < 300,
                          statusCode: proxyRes.statusCode,
                          data: parsedData,
                          error: proxyRes.statusCode >= 400 ? (parsedData?.error?.message || `HTTP ${proxyRes.statusCode}`) : null
                        }))
                      })
                    })

                    proxyReq.on('error', (err) => {
                      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
                      res.end(JSON.stringify({ success: false, error: err.message }))
                    })

                    proxyReq.write(postData)
                    proxyReq.end()
                  } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({ success: false, error: e.message }))
                  }
                })
                return
              }

              // Handle /api/ai, /api/ai/execute, or /api/gemini cleanly through unified handler
              if (pathname === '/api/ai' || pathname === '/api/ai/execute' || pathname === '/api/gemini') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', async () => {
                  try {
                    req.body = body ? JSON.parse(body) : {}
                    attachExpressHelpers()
                    await aiHandler(req, res)
                  } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({ error: { message: e.message || 'AI processing error' } }))
                  }
                })
                return
              }
            }
            next()
          })
        }
      }
    ],
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler') || id.includes('motion')) {
                return 'vendor-framework'
              }
              if (id.includes('@supabase') || id.includes('supabase')) {
                return 'vendor-supabase'
              }
              if (id.includes('canvas-confetti')) {
                return 'vendor-confetti'
              }
            }
          }
        }
      }
    }
  }
})
