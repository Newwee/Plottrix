import { useState, useEffect, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'plottrix_perf_mode'
const PERF_CHANGE_EVENT = 'plottrix-perf-mode-change'

/**
 * Assess device hardware capabilities and assign an optimal tier
 * @returns {'low' | 'balanced' | 'high'}
 */
function evaluateHardwareTier() {
  if (typeof window === 'undefined') return 'balanced'

  try {
    const cores = navigator.hardwareConcurrency || 4
    const memory = navigator.deviceMemory || 4 // In GB (Chrome/Edge only)
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    const saveData = Boolean(navigator.connection?.saveData)
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator

    // Low-end conditions: Potato PC, older phones, battery saver, or reduced motion
    if (prefersReducedMotion || saveData || cores <= 2 || memory <= 2) {
      return 'low'
    }

    // High-end conditions: 8+ cores, 8GB+ RAM, and modern WebGPU/WebGL capabilities
    if (cores >= 8 && memory >= 6 && hasWebGPU) {
      return 'high'
    }

    // Balanced default: Standard laptops, modern smartphones, integrated GPUs
    return 'balanced'
  } catch {
    return 'balanced'
  }
}

export function useDevicePerformance() {
  const [mode, setModeState] = useState(() => {
    if (typeof window === 'undefined') return 'auto'
    return localStorage.getItem(STORAGE_KEY) || 'auto'
  })

  // Hardware evaluation
  const [detectedTier, setDetectedTier] = useState(() => evaluateHardwareTier())

  // Listen for storage changes across tabs or window events
  useEffect(() => {
    const handlePerfChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY) || 'auto'
      setModeState(stored)
    }

    window.addEventListener(PERF_CHANGE_EVENT, handlePerfChange)
    window.addEventListener('storage', handlePerfChange)

    return () => {
      window.removeEventListener(PERF_CHANGE_EVENT, handlePerfChange)
      window.removeEventListener('storage', handlePerfChange)
    }
  }, [])

  // Update tier based on mode
  const tier = useMemo(() => {
    if (mode === 'low' || mode === 'balanced' || mode === 'high') {
      return mode
    }
    return detectedTier
  }, [mode, detectedTier])

  // Sync DOM class for CSS hardware fallbacks (e.g. disabling heavy backdrop blur)
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (tier === 'low') {
      root.classList.add('perf-low')
      root.classList.remove('perf-high')
    } else if (tier === 'high') {
      root.classList.add('perf-high')
      root.classList.remove('perf-low')
    } else {
      root.classList.remove('perf-low', 'perf-high')
    }
  }, [tier])

  const setMode = useCallback((newMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newMode)
      setModeState(newMode)
      window.dispatchEvent(new CustomEvent(PERF_CHANGE_EVENT, { detail: newMode }))
    }
  }, [])

  const isLowEnd = tier === 'low'
  const isBalanced = tier === 'balanced'
  const isHighEnd = tier === 'high'

  // Presets based on tier
  const config = useMemo(() => ({
    mode,
    setMode,
    tier,
    isLowEnd,
    isBalanced,
    isHighEnd,
    enableAeroCanvas: !isLowEnd,
    shardCount: isLowEnd ? 0 : isBalanced ? 280 : 850,
    maxDpr: isLowEnd ? 1 : isBalanced ? 1.15 : 1.5,
    enablePixelCanvas: !isLowEnd,
    enableBackdropBlur: !isLowEnd,
    enableBloom: isHighEnd,
    hardwareStats: {
      cores: typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 'unknown') : 4,
      memory: typeof navigator !== 'undefined' ? (navigator.deviceMemory || 'unknown') : 4,
      hasWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator
    }
  }), [mode, setMode, tier, isLowEnd, isBalanced, isHighEnd])

  return config
}
