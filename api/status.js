/**
 * Vercel Serverless Function: /api/status
 * Health check & Real-time AI Configuration Status
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const key =
    process.env.ASTRACODE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  const hasKey = Boolean(key)
  const maskedKey = hasKey ? `${key.substring(0, 10)}...${key.substring(key.length - 4)}` : null
  const hasSupabaseUrl = Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)

  const fastModel = process.env.ASTRACODE_FAST_MODEL || 'claude-haiku-5.5-eco'
  const hardModel = process.env.ASTRACODE_HARD_MODEL || 'chatgpt-6-luna'

  return res.status(200).json({
    status: 'ok',
    version: '2.1.0-production',
    service: 'Plottrix Vercel Serverless',
    timestamp: new Date().toISOString(),
    config: {
      aiProvider: key.startsWith('sk-') ? 'Astracode Gateway' : 'AI Gateway',
      geminiKeyConfigured: hasKey,
      geminiKeyMasked: maskedKey,
      supabaseConfigured: hasSupabaseUrl,
      models: {
        fast: fastModel,
        hard: hardModel,
        primary: fastModel,
        backup: hardModel,
        heavy: hardModel
      }
    }
  })
}
