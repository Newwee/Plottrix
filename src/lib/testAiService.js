/**
 * Test AI Service
 * Supports OpenAI-compatible gateways (e.g. Astracode, OpenRouter, LocalAI)
 * and direct Google Gemini API, tracking latency, actual responding model, and token usage.
 */

export const DEFAULT_ASTRACODE_CONFIG = {
  baseURL: 'https://astracode.panderx.xyz/v1',
  apiKey: '',
  model: 'claude-haiku-5.5-eco'
}

export const PRESET_MODELS = [
  { id: 'claude-haiku-5.5-eco', name: 'Claude Haiku 5.5 Eco (Fast / General)', provider: 'Astracode' },
  { id: 'chatgpt-6-luna', name: 'ChatGPT 6 Luna (Deep Reasoning)', provider: 'Astracode' }
]

/**
 * Execute chat completion with OpenAI-compatible API
 */
export async function executeAiCall({
  baseURL = DEFAULT_ASTRACODE_CONFIG.baseURL,
  apiKey = DEFAULT_ASTRACODE_CONFIG.apiKey,
  model = DEFAULT_ASTRACODE_CONFIG.model,
  systemPrompt = '',
  userPrompt = '',
  temperature = 0.7,
  responseFormat = null
}) {
  const cleanBase = (baseURL || '').trim().replace(/\/+$/, '')
  const endpoint = cleanBase.endsWith('/chat/completions')
    ? cleanBase
    : `${cleanBase}/chat/completions`

  const messages = []
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt.trim() })
  }
  messages.push({ role: 'user', content: userPrompt })

  const requestPayload = {
    model: model || 'gemini-3.8-flash',
    messages,
    temperature
  }

  if (responseFormat) {
    requestPayload.response_format = responseFormat
  }

  const startTime = performance.now()

  // 1. Attempt direct fetch to endpoint
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(requestPayload)
    })

    const durationMs = Math.round(performance.now() - startTime)
    const rawText = await res.text()
    let data = null
    try {
      data = JSON.parse(rawText)
    } catch {
      data = { raw: rawText }
    }

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.error?.message_th || `HTTP ${res.status}: ${res.statusText}`
      return {
        success: false,
        error: errMsg,
        statusCode: res.status,
        durationMs,
        reportedModel: data?.model || model,
        rawRequest: requestPayload,
        rawResponse: data
      }
    }

    const replyContent = data?.choices?.[0]?.message?.content || ''
    const reportedModel = data?.model || model
    const usage = data?.usage || null

    return {
      success: true,
      content: replyContent,
      durationMs,
      reportedModel,
      usage,
      rawRequest: requestPayload,
      rawResponse: data
    }
  } catch (directErr) {
    // 2. If direct fetch fails (e.g. CORS block or network failure), route via local proxy
    console.warn('[TestAiService] Direct fetch failed, trying local proxy...', directErr.message)

    try {
      const proxyRes = await fetch('/api/test-ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          apiKey,
          payload: requestPayload
        })
      })

      const durationMs = Math.round(performance.now() - startTime)
      const proxyData = await proxyRes.json()

      if (!proxyRes.ok || !proxyData.success) {
        return {
          success: false,
          error: proxyData.error || `Proxy error HTTP ${proxyRes.status}`,
          durationMs,
          reportedModel: proxyData.data?.model || model,
          rawRequest: requestPayload,
          rawResponse: proxyData
        }
      }

      return {
        success: true,
        content: proxyData.data?.choices?.[0]?.message?.content || '',
        durationMs,
        reportedModel: proxyData.data?.model || model,
        usage: proxyData.data?.usage || null,
        rawRequest: requestPayload,
        rawResponse: proxyData.data
      }
    } catch (proxyErr) {
      const durationMs = Math.round(performance.now() - startTime)
      return {
        success: false,
        error: `Network Error: ${directErr.message} (Proxy: ${proxyErr.message})`,
        durationMs,
        reportedModel: model,
        rawRequest: requestPayload,
        rawResponse: null
      }
    }
  }
}

/**
 * Quick Ping / Connection Test
 */
export async function testConnectionPing(baseURL, apiKey, model) {
  return executeAiCall({
    baseURL,
    apiKey,
    model,
    systemPrompt: 'You are an AI latency ping responder. Reply with only one word: "OK" or "สวัสดี".',
    userPrompt: 'สวัสดี',
    temperature: 0.1
  })
}
