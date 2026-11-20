/**
 * Vercel Serverless Function & API Route: /api/subscription
 * Enforces production-level subscription business logic:
 * 1. 1-time 3-Day Pro Free Trial (72 hours max, cannot re-activate if trial_used = true)
 * 2. Strict No-Downgrade Policy (cannot downgrade to lower tier)
 * 3. Paid plan gate (Pro/Ultra paid activations blocked until Payment Gateway is integrated)
 */

import { createClient } from '@supabase/supabase-js'

const TIER_RANKS = {
  free: 0,
  pro_trial: 1,
  pro: 2,
  ultra: 3
}

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
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!token) {
    return res.status(401).json({ error: { message: 'Unauthorized: Missing session token' } })
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: { message: 'Invalid or expired user session' } })
    }

    const { action, targetTier } = req.body || {}

    // Fetch current user profile from DB
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const currentTier = profile?.plan_tier || 'free'
    const trialUsed = Boolean(profile?.trial_used)

    // Handle GET status
    if (req.method === 'GET') {
      return res.status(200).json({
        plan_tier: currentTier,
        plan: profile?.plan || 'Free Plan',
        trial_used: trialUsed,
        trial_started_at: profile?.trial_started_at || null,
        trial_ends_at: profile?.trial_ends_at || null
      })
    }

    // 1. ACTIVATE 3-DAY PRO TRIAL
    if (action === 'activate_trial') {
      if (trialUsed) {
        return res.status(400).json({
          error: { message: 'คุณเคยใช้สิทธิ์ทดลองใช้ Pro 3 วันไปแล้ว ไม่สามารถเปิดใช้งานซ้ำได้' }
        })
      }

      const currentRank = TIER_RANKS[currentTier] ?? 0
      if (currentRank >= TIER_RANKS.pro) {
        return res.status(400).json({
          error: { message: 'บัญชีของคุณอยู่ในระดับ Pro หรือสูงกว่าอยู่แล้ว' }
        })
      }

      const now = new Date()
      const endsAt = new Date(now.getTime() + 72 * 60 * 60 * 1000) // 72 hours

      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          plan_tier: 'pro_trial',
          plan: 'Pro Plan++',
          trial_used: true,
          trial_started_at: now.toISOString(),
          trial_ends_at: endsAt.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        return res.status(500).json({ error: { message: updateError.message } })
      }

      return res.status(200).json({
        success: true,
        message: 'เปิดใช้งาน Pro Plan ฟรี 3 วันสำเร็จ!',
        profile: updated
      })
    }

    // 2. CHANGE PLAN / STRICT NO-DOWNGRADE ENFORCEMENT
    if (action === 'change_plan') {
      const normalizedTarget = (targetTier || '').toLowerCase().trim()
      const targetRank = TIER_RANKS[normalizedTarget]

      if (targetRank === undefined) {
        return res.status(400).json({ error: { message: `ไม่พบแพลนที่ระบุ: ${targetTier}` } })
      }

      const currentRank = TIER_RANKS[currentTier] ?? 0

      // Enforce Strict No-Downgrade
      if (targetRank < currentRank) {
        return res.status(403).json({
          error: {
            message: `ไม่สามารถลดระดับแพลนจาก ${currentTier} เป็น ${normalizedTarget} ได้ตามนโยบายระบบ (Strict No-Downgrade Policy)`
          }
        })
      }

      if (targetRank === currentRank) {
        return res.status(400).json({ error: { message: 'คุณกำลังใช้งานแพลนนี้อยู่แล้ว' } })
      }

      // Paid plans cannot be activated instantly for free
      if (normalizedTarget === 'pro' || normalizedTarget === 'ultra') {
        return res.status(402).json({
          error: {
            message: 'ระบบชำระเงินกำลังเปิดให้บริการเร็วๆ นี้ ไม่สามารถเปิดใช้งานแพลนเสียเงินได้โดยไม่มีใบเสร็จการชำระเงิน'
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
