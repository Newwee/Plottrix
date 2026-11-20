import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'

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
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({
                  success: true,
                  service: "Plottrix Studio API (Vercel Serverless)",
                  routing: {
                    light: "gemini-3.5-flash-lite",
                    core: "gemini-3.8-flash",
                    deep: "gemini-4-hydrogen"
                  },
                  keyConfigured: Boolean(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY)
                }))
                return
              }

              // Handle /api/ai or /api/gemini
              if ((pathname === '/api/ai' || pathname === '/api/gemini') && req.method === 'POST') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', async () => {
                  try {
                    const parsed = JSON.parse(body)
                    const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || parsed.apiKey
                    const payload = parsed.payload
                    const taskType = parsed.taskType || 'core'
                    const clientPlan = parsed.plan || req.headers['x-client-plan'] || 'Free Plan'

                    if (!payload) {
                      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
                      res.end(JSON.stringify({ error: { message: "Missing payload parameter" } }))
                      return
                    }

                    // Routing
                    let model = 'gemini-3.8-flash'
                    if (taskType === 'light') model = 'gemini-3.5-flash-lite'
                    else if (taskType === 'deep' && clientPlan.includes('Ultra')) model = 'gemini-4-hydrogen'
                    else if (parsed.model) model = parsed.model

                    // Context caching fallback check
                    const totalChars = JSON.stringify(payload).length
                    let useCaching = Boolean(parsed.useCaching)
                    if (useCaching && totalChars < 85000) {
                      useCaching = false
                    }

                    // Call Google API
                    const postData = JSON.stringify(payload)
                    const options = {
                      hostname: 'generativelanguage.googleapis.com',
                      port: 443,
                      path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                      },
                      timeout: 45000
                    }

                    const googleReq = https.request(options, (googleRes) => {
                      let raw = ''
                      googleRes.setEncoding('utf8')
                      googleRes.on('data', c => { raw += c })
                      googleRes.on('end', () => {
                        res.writeHead(googleRes.statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8' })
                        res.end(raw)
                      })
                    })

                    googleReq.on('error', (err) => {
                      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
                      res.end(JSON.stringify({ error: { message: err.message } }))
                    })

                    googleReq.write(postData)
                    googleReq.end()

                  } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({ error: { message: e.message } }))
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
