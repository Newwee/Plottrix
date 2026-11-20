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

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
  const hasGeminiKey = Boolean(key)
  const maskedKey = hasGeminiKey ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : null
  const hasSupabaseUrl = Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)

  return res.status(200).json({
    status: 'ok',
    version: '2.0.0-production',
    service: 'Plottrix Vercel Serverless',
    timestamp: new Date().toISOString(),
    config: {
      geminiKeyConfigured: hasGeminiKey,
      geminiKeyMasked: maskedKey,
      supabaseConfigured: hasSupabaseUrl,
      models: {
        primary: 'gemini-3.5-flash-lite (Speed: ~0.89s)',
        backup: 'gemini-3.1-flash-lite',
        heavy: 'gemini-3.8-flash'
      }
    }
  })
}
