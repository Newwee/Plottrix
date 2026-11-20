import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import { processAiRequest } from './api/aiEngine.js'
import subscriptionHandler from './api/subscription.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

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

              // Handle /api/status
              if (pathname === '/api/status' && req.method === 'GET') {
                const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
                const hasKey = Boolean(key)
                const masked = hasKey ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : null
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({
                  status: 'ok',
                  version: '2.0.0-production',
                  service: 'Plottrix Studio API (Local & Vercel)',
                  timestamp: new Date().toISOString(),
                  config: {
                    geminiKeyConfigured: hasKey,
                    geminiKeyMasked: masked,
                    supabaseConfigured: Boolean(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL),
                    models: {
                      primary: 'gemini-3.5-flash-lite (Speed: ~0.89s)',
                      backup: 'gemini-3.1-flash-lite',
                      heavy: 'gemini-3.8-flash'
                    }
                  }
                }))
                return
              }

              // Handle /api/subscription
              if (pathname === '/api/subscription') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', async () => {
                  try {
                    req.body = body ? JSON.parse(body) : {}
                    res.status = (code) => {
                      res.statusCode = code
                      return res
                    }
                    res.json = (data) => {
                      res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8' })
                      res.end(JSON.stringify(data))
                      return res
                    }
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
                        'Authorization': `Bearer ${apiKey || ''}`,
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

              // Handle /api/ai, /api/ai/execute, or /api/gemini
              if ((pathname === '/api/ai' || pathname === '/api/ai/execute' || pathname === '/api/gemini') && req.method === 'POST') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', async () => {
                  try {
                    const parsed = body ? JSON.parse(body) : {}
                    const defaultKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
                    const resp = await processAiRequest(parsed, defaultKey)

                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify(resp))
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
