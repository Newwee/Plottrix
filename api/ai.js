/**
 * Vercel Serverless Function: /api/ai and /api/ai/execute
 * Production-ready AI router for Astracode OpenAI Gateway & Gemini API
 * Hardened with strict JWT auth gate, CORS policy, and Trix deduction
 */

import { processAiRequest } from './aiEngine.js'
import { createClient } from '@supabase/supabase-js'
import { getModelDisplayInfo } from '../src/lib/aiRouting.js'

export default async function handler(req, res) {
  // 1. Strict CORS Policy
  const origin = req.headers.origin || ''
  const isAllowedOrigin =
    !origin ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin === 'https://plottrix.vercel.app' ||
    origin.endsWith('.vercel.app')

  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? (origin || '*') : 'https://plottrix.vercel.app')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Plan')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } })
  }

  const wantsStream = Boolean(req.body?.stream)
  let streamStarted = false

  const sendEvent = (evt) => {
    if (!wantsStream || !streamStarted || res.writableEnded) return
    try {
      res.write(`${JSON.stringify({ ...evt, ts: Date.now() })}\n`)
    } catch (_) {}
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jqgbgqlhztixhkrqdwtf.supabase.co'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY

    // Enforce authenticated user session when Supabase auth keys are present
    let authedUser = null
    let supabase = null
    if (serviceRoleKey || anonKey) {
      if (!token) {
        return res.status(401).json({
          error: { message: 'ต้องเข้าสู่ระบบก่อนจึงจะใช้งาน AI ได้' }
        })
      }

      supabase = createClient(supabaseUrl, serviceRoleKey || anonKey)
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
      if (authErr || !user) {
        return res.status(401).json({
          error: { message: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง' }
        })
      }
      authedUser = user
    }

    if (wantsStream) {
      res.writeHead(200, {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no'
      })
      res.flushHeaders?.()
      streamStarted = true

      sendEvent({
        type: 'progress',
        phase: 'auth_verified',
        stepText: 'ยืนยันเซสชันบัญชีผู้ใช้สำเร็จ กำลังจัดเส้นทางโมเดล AI'
      })
    }

    // Process real AI request via Astracode (claude-haiku-5.5-eco / chatgpt-6-luna)
    const defaultKey = process.env.ASTRACODE_API_KEY || process.env.GEMINI_API_KEY || ''
    const startedAt = Date.now()
    const aiResponse = await processAiRequest(
      req.body,
      defaultKey,
      wantsStream ? (evt) => sendEvent({ type: 'progress', ...evt }) : null
    )

    // Calculate Trix cost
    const actionCosts = {
      proofread: 1,
      polish: 3,
      continuity: 3,
      plotBranch: 4,
      translate: 2,
      fullBook: 0,
      custom: 2
    }
    const actionType = req.body.actionType || 'polish'
    const cost = actionCosts[actionType] !== undefined ? actionCosts[actionType] : 1

    if (wantsStream && cost > 0) {
      sendEvent({
        type: 'progress',
        phase: 'deducting_trix',
        activeModel: aiResponse.model,
        modelDisplayName: aiResponse.modelDisplayName || getModelDisplayInfo(aiResponse.model).label,
        fallbackUsed: Boolean(aiResponse.fallbackUsed),
        stepText: `บันทึกการใช้ ${cost} Trix และจัดเตรียมผลลัพธ์`
      })
    }

    // Deduct Trix in database for authenticated user
    if (authedUser && supabase && cost > 0) {
      try {
        const { error: rpcErr } = await supabase.rpc('deduct_trix_safely', {
          p_user_id: authedUser.id,
          p_amount: cost,
          p_action: `AI ${actionType}`
        })

        if (rpcErr) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('trix_balance')
            .eq('id', authedUser.id)
            .single()

          if (prof && prof.trix_balance >= cost) {
            await supabase
              .from('profiles')
              .update({ trix_balance: prof.trix_balance - cost, updated_at: new Date().toISOString() })
              .eq('id', authedUser.id)

            await supabase
              .from('trix_transactions')
              .insert({
                user_id: authedUser.id,
                amount: -cost,
                type: 'deduct',
                action: `AI ${actionType}`
              })
          }
        }
      } catch (deductErr) {
        console.warn('[AI Trix Deduct Warning]', deductErr.message)
      }
    }

    const modelDisplayName = aiResponse.modelDisplayName || getModelDisplayInfo(aiResponse.model).label
    const durationSec = Number(((Date.now() - startedAt) / 1000).toFixed(2))

    if (wantsStream) {
      sendEvent({
        type: 'done',
        success: true,
        cost,
        model: aiResponse.model,
        modelDisplayName,
        fallbackUsed: Boolean(aiResponse.fallbackUsed),
        attemptedModels: aiResponse.attemptedModels || [aiResponse.model],
        durationSec,
        result: aiResponse.result
      })
      return res.end()
    }

    return res.status(200).json({
      success: true,
      cost,
      model: aiResponse.model,
      modelDisplayName,
      fallbackUsed: Boolean(aiResponse.fallbackUsed),
      result: aiResponse.result
    })
  } catch (err) {
    console.error('[AI Handler Error]', err)
    if (streamStarted && !res.writableEnded) {
      sendEvent({
        type: 'error',
        error: {
          message: err.message || 'เกิดข้อผิดพลาดในการประมวลผลคำขอ AI'
        }
      })
      return res.end()
    }
    return res.status(500).json({
      error: {
        message: err.message || 'เกิดข้อผิดพลาดในการประมวลผลคำขอ AI'
      }
    })
  }
}
