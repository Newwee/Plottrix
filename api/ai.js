/**
 * Vercel Serverless Function: /api/ai
 * Production-ready AI router for Gemini API on Vercel Pro
 */

import https from 'https'

const MODEL_ROUTING = {
  light: 'gemini-3.5-flash-lite',
  core: 'gemini-3.8-flash',
  deep: 'gemini-4-hydrogen',
  fallback: 'gemini-3.5-flash-lite'
}

const CONTEXT_CACHE_MIN_CHARS = 85000

function callGoogleApi(model, apiKey, payload, cachedContentName = null) {
  return new Promise((resolve, reject) => {
    const bodyToSend = Object.assign({}, payload)
    if (cachedContentName) {
      bodyToSend.cachedContent = cachedContentName
    }

    const postData = JSON.stringify(bodyToSend)
    const reqOptions = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 50000
    }

    const req = https.request(reqOptions, (res) => {
      let rawData = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { rawData += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData)
          resolve({ statusCode: res.statusCode, data: parsed })
        } catch (err) {
          resolve({ statusCode: res.statusCode, data: null, raw: rawData, error: 'JSON parse error' })
        }
      })
    })

    req.on('error', err => reject(err))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Google API request timed out (50s)'))
    })

    req.write(postData)
    req.end()
  })
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Plan')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } })
  }

  try {
    const { payload, taskType = 'core', plan = 'Free Plan', apiKey: clientKey, useCaching } = req.body || {}
    const apiKey = process.env.GEMINI_API_KEY || clientKey

    if (!apiKey) {
      return res.status(500).json({ error: { message: 'GEMINI_API_KEY is not configured on server.' } })
    }

    if (!payload) {
      return res.status(400).json({ error: { message: 'Missing payload parameter.' } })
    }

    // Smart Model Routing
    let primaryModel = MODEL_ROUTING.core
    if (taskType === 'light') {
      primaryModel = MODEL_ROUTING.light
    } else if (taskType === 'deep' && (plan === 'Ultra Plan' || plan.includes('Ultra'))) {
      primaryModel = MODEL_ROUTING.deep
    } else if (req.body.model) {
      primaryModel = req.body.model
    }

    // Context Caching Fallback: inspect character count
    const totalChars = JSON.stringify(payload).length
    let cacheIdentifier = null
    if (useCaching && totalChars >= CONTEXT_CACHE_MIN_CHARS) {
      cacheIdentifier = req.body.cachedContentName || null
    }

    const models = [primaryModel, MODEL_ROUTING.core, MODEL_ROUTING.light]
    const uniqueModels = [...new Set(models)]
    let lastResp = null

    for (const m of uniqueModels) {
      try {
        let apiResp = await callGoogleApi(m, apiKey, payload, cacheIdentifier)

        // If 400 on cache, retry without cache
        if (apiResp.statusCode === 400 && cacheIdentifier) {
          apiResp = await callGoogleApi(m, apiKey, payload, null)
        }

        if (apiResp.statusCode === 200) {
          return res.status(200).json(apiResp.data)
        }

        lastResp = apiResp
        if (apiResp.statusCode !== 503 && apiResp.statusCode !== 404) {
          break
        }
      } catch (e) {
        console.warn(`[Vercel Serverless] Model ${m} error:`, e.message)
      }
    }

    return res.status(lastResp?.statusCode || 500).json(lastResp?.data || { error: { message: 'AI request failed' } })

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } })
  }
}
