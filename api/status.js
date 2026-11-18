/**
 * Vercel Serverless Function: /api/status
 * Quick health check and environment status
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY)
  const hasSupabaseUrl = Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)

  return res.status(200).json({
    status: 'ok',
    version: '2.0.0-production',
    service: 'Plottrix Vercel Serverless',
    timestamp: new Date().toISOString(),
    config: {
      geminiKeyConfigured: hasGeminiKey,
      supabaseConfigured: hasSupabaseUrl,
      models: {
        light: 'gemini-3.5-flash-lite',
        core: 'gemini-3.8-flash',
        deep: 'gemini-4-hydrogen'
      }
    }
  })
}
