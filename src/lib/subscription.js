/**
 * Plottrix Subscription & 3-Day Pro Trial Utilities
 * Enforces production-grade business rules:
 * - 1-time 3-Day Pro Trial (72 hours)
 * - Strict No-Downgrade Policy
 * - Auto-expiration calculation
 */

export const PLAN_TIERS = {
  free: {
    id: 'free',
    rank: 0,
    name: 'Free Plan',
    displayName: 'Free Plan',
    maxNovels: 1,
    maxChaptersPerNovel: 5,
    cooldownMs: 8000
  },
  pro_trial: {
    id: 'pro_trial',
    rank: 1,
    name: 'Pro Plan++',
    displayName: 'Pro Plan++ (ทดลองใช้ 3 วัน)',
    isTrial: true,
    maxNovels: Infinity,
    maxChaptersPerNovel: Infinity,
    cooldownMs: 2000
  },
  pro: {
    id: 'pro',
    rank: 2,
    name: 'Pro Plan++',
    displayName: 'Pro Plan++',
    maxNovels: Infinity,
    maxChaptersPerNovel: Infinity,
    cooldownMs: 2000
  },
  ultra: {
    id: 'ultra',
    rank: 3,
    name: 'Ultra Plan',
    displayName: 'Ultra Plan',
    maxNovels: Infinity,
    maxChaptersPerNovel: Infinity,
    cooldownMs: 1000
  }
}

/**
 * Maps a plan name string (e.g. 'Free Plan', 'Pro Plan++', 'Ultra Plan') or tier ID to a normalized tier object
 */
export function getTierInfo(planOrTier) {
  if (!planOrTier) return PLAN_TIERS.free
  const lower = String(planOrTier).toLowerCase().trim()
  if (lower === 'ultra' || lower === 'ultra plan') return PLAN_TIERS.ultra
  if (lower === 'pro' || lower === 'pro plan' || lower === 'pro plan++') return PLAN_TIERS.pro
  if (lower === 'pro_trial' || lower.includes('trial')) return PLAN_TIERS.pro_trial
  return PLAN_TIERS.free
}

/**
 * Strict No-Downgrade Check:
 * Prohibits switching from a higher tier rank to a lower tier rank.
 * Example:
 * - Ultra (3) -> Pro (2) or Free (0) => REJECTED
 * - Pro (2) or Pro Trial (1) -> Free (0) => REJECTED
 * Returns { allowed: boolean, reason?: string }
 */
export function checkPlanTransition(currentTierId, targetTierId) {
  const current = getTierInfo(currentTierId)
  const target = getTierInfo(targetTierId)

  if (current.id === target.id) {
    return { allowed: false, reason: 'คุณกำลังใช้งานแพลนนี้อยู่แล้ว' }
  }

  if (target.rank < current.rank) {
    return {
      allowed: false,
      reason: `ไม่สามารถลดระดับแพลนจาก ${current.displayName} เป็น ${target.displayName} ได้ตามนโยบายระบบ (Strict No-Downgrade Policy)`
    }
  }

  return { allowed: true }
}

/**
 * Calculate remaining time for a 3-Day Pro Trial
 * @param {string | Date | null} trialEndsAt
 * @returns {{ isExpired: boolean, days: number, hours: number, minutes: number, seconds: number, formatted: string, totalSeconds: number }}
 */
export function getTrialCountdown(trialEndsAt) {
  if (!trialEndsAt) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'หมดเวลาแล้ว',
      totalSeconds: 0
    }
  }

  const endMs = new Date(trialEndsAt).getTime()
  const nowMs = Date.now()
  const diffMs = endMs - nowMs

  if (diffMs <= 0 || isNaN(diffMs)) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'หมดเวลาแล้ว',
      totalSeconds: 0
    }
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  let formatted = ''
  if (days > 0) {
    formatted = `${days} วัน ${hours} ชม. ${minutes} นาที`
  } else if (hours > 0) {
    formatted = `${hours} ชม. ${minutes} นาที ${seconds} วินาที`
  } else {
    formatted = `${minutes} นาที ${seconds} วินาที`
  }

  return {
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
    formatted,
    totalSeconds
  }
}
