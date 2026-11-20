import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import { processAiRequest } from './api/aiEngine.js'

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
