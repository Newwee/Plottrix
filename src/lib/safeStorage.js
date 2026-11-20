/**
 * Plottrix Safe Storage Utility
 * Bulletproof wrapper for localStorage that guards against QuotaExceededError,
 * handles JSON serialization safely, and auto-purges stale cache entries if space runs out.
 */

export function safeLocalStorageSet(key, value) {
  if (typeof window === 'undefined') return false
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(key, serialized)
    return true
  } catch (err) {
    console.warn(`[SafeStorage] Quota exceeded writing "${key}". Auto-recovering...`, err?.message)
    try {
      // 1. Evict non-essential bulky caches first
      const bulkyPrefixes = [
        'plottrix_snapshots',
        'plottrix_demo_runs',
        'plottrix_preview_',
        'plottrix_cached_',
        'plottrix_read_progress_'
      ]

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && bulkyPrefixes.some(prefix => k.startsWith(prefix))) {
          try { localStorage.removeItem(k) } catch (_) {}
        }
      }

      // 2. Retry original write
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, serialized)
      return true
    } catch (retryErr) {
      console.warn(`[SafeStorage] Could not persist "${key}" to local storage:`, retryErr?.message)
      return false
    }
  }
}

export function safeLocalStorageGet(key, fallback = null) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) return fallback
    return raw
  } catch {
    return fallback
  }
}

export function safeLocalStorageGetJSON(key, fallback = null) {
  const raw = safeLocalStorageGet(key, null)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}
