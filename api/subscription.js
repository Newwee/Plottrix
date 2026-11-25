/**
 * Vercel Serverless Function & API Route: /api/subscription
 * Enforces production-level subscription business logic:
 * 1. 1-time 3-Day Pro Free Trial (72 hours max, cannot re-activate if trial_used = true)
 * 2. Strict No-Downgrade Policy (cannot downgrade to lower tier)
 * 3. Paid plan gate (Pro/Ultra paid activations blocked until Payment Gateway is integrated)
 */

import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const TIER_RANKS = {
  free: 0,
  pro_trial: 1,
  pro: 2,
  ultra: 3
}

const CURRENT_TRIAL_TERMS_VERSION = '2026-11-v1'

export default async function handler(req, res) {
  const origin = req.headers.origin || ''
  const isAllowedOrigin =
    !origin ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin === 'https://plottrix.vercel.app' ||
    origin.endsWith('.vercel.app')

  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? (origin || '*') : 'https://plottrix.vercel.app')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jqgbgqlhztixhkrqdwtf.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return res.status(503).json({
      error: {
        code: 'SERVICE_ROLE_REQUIRED',
        message: 'Subscription RPC delegation requires SUPABASE_SERVICE_ROLE_KEY configuration.'
      }
    })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!token) {
    return res.status(401).json({ error: { message: 'Unauthorized: Missing session token' } })
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: { message: 'Invalid or expired user session' } })
    }

    await supabase.rpc('process_expiring_and_expired_memberships', { p_user_id: user.id })

    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('id, plan, plan_tier, trial_used, trial_started_at, trial_ends_at, trix_balance')
      .eq('id', user.id)
      .single()

    if (profError || !profile) {
      return res.status(404).json({ error: { message: 'ไม่พบข้อมูลโปรไฟล์ผู้ใช้' } })
    }

    const { data: activeSubscription } = await supabase
      .from('user_subscriptions')
      .select('id, plan_id, starts_at, expires_at, status, membership_plans(id, slug, name, price, duration_days, tier_rank)')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const currentTier = profile.plan_tier || 'free'

    if (req.method === 'GET') {
      return res.status(200).json({
        plan_tier: currentTier,
        plan: profile.plan || 'Free Plan',
        trial_used: Boolean(profile.trial_used),
        trial_started_at: profile.trial_started_at || null,
        trial_ends_at: profile.trial_ends_at || null,
        trix_balance: profile.trix_balance ?? 0,
        active_subscription: activeSubscription || null
      })
    }

    const body = req.body || {}
    const { action, targetTier } = body

    if (action === 'activate_trial') {
      const accepted = body.accepted === true || body.termsAccepted === true
      const termsVersion = String(body.termsVersion || '').trim()
      if (!accepted || termsVersion !== CURRENT_TRIAL_TERMS_VERSION) {
        return res.status(400).json({
          error: {
            code: 'TERMS_NOT_ACCEPTED',
            message: 'กรุณายอมรับเงื่อนไขการทดลองใช้งานฟรีก่อนเปิดใช้งานสิทธิ์'
          }
        })
      }

      const forwardedIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      const ipHash = forwardedIp ? createHash('sha256').update(forwardedIp).digest('hex') : ''
      const userAgent = String(req.headers['user-agent'] || '').slice(0, 500)

      const { data: rpcResult, error: rpcError } = await supabase.rpc('activate_pro_trial_safely', {
        p_user_id: user.id,
        p_terms_version: CURRENT_TRIAL_TERMS_VERSION,
        p_accepted: true,
        p_terms_summary: { version: CURRENT_TRIAL_TERMS_VERSION, duration_hours: 72, source: 'api_subscription_adapter' },
        p_user_agent: userAgent,
        p_ip_hash: ipHash
      })

      if (rpcError) {
        return res.status(400).json({ error: { message: rpcError.message } })
      }

      if (!rpcResult || rpcResult.success !== true) {
        return res.status(400).json({
          error: {
            code: rpcResult?.code || 'TRIAL_ACTIVATION_REJECTED',
            message: rpcResult?.error || 'ไม่สามารถเปิดใช้งานสิทธิ์ทดลองใช้ได้'
          }
        })
      }

      return res.status(200).json({
        success: true,
        message: 'เปิดใช้งาน Pro Plan ฟรี 3 วันสำเร็จ!',
        profile: {
          plan: rpcResult.plan,
          plan_tier: rpcResult.plan_tier,
          trial_used: rpcResult.trial_used,
          trial_started_at: rpcResult.trial_started_at,
          trial_ends_at: rpcResult.trial_ends_at,
          trix_balance: rpcResult.trix_balance
        }
      })
    }

    if (action === 'change_plan') {
      const normalizedTarget = (targetTier || '').toLowerCase().trim()
      const targetRank = TIER_RANKS[normalizedTarget]

      if (targetRank === undefined) {
        return res.status(400).json({ error: { message: `ไม่พบแพลนที่ระบุ: ${targetTier}` } })
      }

      const currentRank = TIER_RANKS[currentTier] ?? 0

      if (targetRank < currentRank) {
        return res.status(403).json({
          error: {
            code: 'NO_DOWNGRADE_ALLOWED',
            message: `ไม่สามารถลดระดับแพลนจาก ${currentTier} เป็น ${normalizedTarget} ได้ตามนโยบายระบบ (Strict No-Downgrade Policy)`
          }
        })
      }

      if (normalizedTarget === 'pro' || normalizedTarget === 'ultra') {
        return res.status(402).json({
          error: {
            code: 'PAYMENT_CHECKOUT_REQUIRED',
            message: 'กรุณาสร้างคำสั่งซื้อและชำระเงินพร้อมอัปโหลดสลิปผ่านระบบ Checkout เพื่อเปิดใช้งานแพ็กเกจสมาชิก'
          }
        })
      }

      return res.status(400).json({ error: { message: 'คำขอไม่ถูกต้อง' } })
    }

    return res.status(400).json({ error: { message: 'Unknown action' } })
  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'Internal server error' } })
  }
}
