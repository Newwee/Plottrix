import React, { useEffect, useRef } from 'react'
import { useDevicePerformance } from '../../hooks/useDevicePerformance'

export default function PixelCard({
  children,
  className = '',
  colors = ['#f3e8ff', '#c084fc', '#9333ea'],
  glowHex = '#a855f7',
  gap = 6,
  speed = 35,
  isActive = false,
  ...props
}) {
  const { isLowEnd, enablePixelCanvas } = useDevicePerformance()
  const cardRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    // If low-end mode, completely skip canvas creation and animation loop
    if (isLowEnd || !enablePixelCanvas) return

    const card = cardRef.current
    const canvas = canvasRef.current
    if (!card || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    // Parse glowHex to RGB
    const tmp = document.createElement('canvas').getContext('2d')
    tmp.fillStyle = glowHex
    const hex = (tmp.fillStyle || '#a855f7').replace('#', '')
    const gr = parseInt(hex.slice(0, 2), 16) || 168
    const gg = parseInt(hex.slice(2, 4), 16) || 85
    const gb = parseInt(hex.slice(4, 6), 16) || 247

    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, dots = []
    let active = isActive, hovering = false
    let ox = 0, oy = 0, sx = 0, sy = 0, px = 0, py = 0
    let raf = 0, last = 0, time = 0
    let isVisible = true
    const pulses = []

    function build() {
      if (!card || !canvas) return
      const r = card.getBoundingClientRect()
      w = Math.max(1, Math.round(r.width))
      h = Math.max(1, Math.round(r.height))
      dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      canvas.width = w * dpr
      canvas.height = h * dpr
      cols = Math.floor((w - 1) / gap) + 1
      rows = Math.floor((h - 1) / gap) + 1
      dots = []
      for (let c = 0; c < cols; c++) {
        for (let rw = 0; rw < rows; rw++) {
          dots.push({
            x: c * gap + gap / 2,
            y: rw * gap + gap / 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 1.2 + Math.random() * 1.4,
            phase: Math.random() * Math.PI * 2,
            rate: 0.6 + Math.random() * 0.8,
            presence: 0,
            delay: 0
          })
        }
      }
      ox = w / 2
      oy = h / 2
      sx = ox
      sy = oy
    }

    function schedule() {
      const far = Math.hypot(w, h)
      for (const d of dots) {
        const dist = Math.hypot(d.x - ox, d.y - oy) / far
        d.delay = active ? dist * 0.42 : (1 - dist) * 0.28
      }
    }

    function draw(now) {
      raf = 0
      if (!isVisible) {
        last = 0
        return
      }

      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      time += dt
      sx += (px - sx) * (1 - Math.exp(-dt * 10))
      sy += (py - sy) * (1 - Math.exp(-dt * 10))

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      let sum = 0
      for (const d of dots) {
        const target = active ? 1 : 0
        const step = dt * 3.8
        if (reduce) d.presence = target
        else if (target > d.presence) d.presence = Math.min(1, d.presence + step)
        else if (target < d.presence) d.presence = Math.max(0, d.presence - step)
        sum += d.presence
      }
      const avg = dots.length ? sum / dots.length : 0

      if (avg > 0.005) {
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.75)
        const a = 0.22 * avg
        grad.addColorStop(0, `rgba(${gr},${gg},${gb},${a})`)
        grad.addColorStop(1, `rgba(${gr},${gg},${gb},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].r += dt * 420
        pulses[i].p = Math.max(0, 1 - pulses[i].r / Math.hypot(w, h))
        if (pulses[i].p <= 0) pulses.splice(i, 1)
      }

      const freq = (speed / 35) * 1.4
      for (const d of dots) {
        if (d.presence <= 0.01) continue
        const wave = reduce ? 0 : Math.sin(d.phase + time * freq * d.rate)
        let sz = d.size * (0.7 + 0.3 * wave) * d.presence
        let al = (0.35 + 0.25 * wave) * d.presence
        if (hovering) {
          const dist = Math.hypot(d.x - sx, d.y - sy)
          if (dist < 110) {
            const boost = 1 - dist / 110
            sz *= 1 + boost * 1.5
            al += boost * 0.35
          }
        }
        for (const p of pulses) {
          const band = (Math.hypot(d.x - p.x, d.y - p.y) - p.r) / 22
          const pw = Math.exp(-band * band) * p.p
          sz *= 1 + pw * 1.3
          al += pw * 0.45
        }
        ctx.globalAlpha = Math.min(0.95, al)
        ctx.fillStyle = d.color
        ctx.fillRect(d.x - sz / 2, d.y - sz / 2, sz, sz)
      }
      ctx.globalAlpha = 1

      // Idle stop: Only continue RAF if hovering, active, or fading out
      if (isVisible && (active || avg > 0.005 || pulses.length > 0)) {
        raf = requestAnimationFrame(draw)
      } else {
        last = 0
      }
    }

    function wake() {
      if (!raf && isVisible) {
        last = performance.now()
        raf = requestAnimationFrame(draw)
      }
    }

    const onEnter = (e) => {
      const r = card.getBoundingClientRect()
      ox = px = sx = e.clientX - r.left
      oy = py = sy = e.clientY - r.top
      hovering = true
      active = true
      card.setAttribute('data-active', '')
      schedule()
      wake()
    }

    const onMove = (e) => {
      const r = card.getBoundingClientRect()
      px = e.clientX - r.left
      py = e.clientY - r.top
      wake()
    }

    const onLeave = () => {
      hovering = false
      active = false
      card.removeAttribute('data-active')
      schedule()
      wake()
    }

    const onDown = (e) => {
      const r = card.getBoundingClientRect()
      pulses.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 0, p: 1 })
      wake()
    }

    card.addEventListener('pointerenter', onEnter)
    card.addEventListener('pointermove', onMove, { passive: true })
    card.addEventListener('pointerleave', onLeave)
    card.addEventListener('pointerdown', onDown)

    build()
    window.addEventListener('resize', build)

    // Visibility and Viewport Culling
    const handleVisibility = () => {
      if (document.hidden) {
        isVisible = false
        if (raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      } else {
        isVisible = true
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    let io = null
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        const [entry] = entries
        isVisible = entry.isIntersecting
        if (!isVisible && raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      }, { threshold: 0.05 })
      io.observe(card)
    }

    return () => {
      card.removeEventListener('pointerenter', onEnter)
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
      card.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', build)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (io) io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [colors, glowHex, gap, speed, isActive, isLowEnd, enablePixelCanvas])

  // Low-End Potato PC Mode Fallback: Static Card without Canvas or RAF
  if (isLowEnd || !enablePixelCanvas) {
    return (
      <div
        ref={cardRef}
        className={`pixel-card relative rounded-2xl border border-purple-500/20 bg-[#151025]/90 transition-all duration-200 hover:border-purple-400/40 ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div ref={cardRef} className={`pixel-card ${className}`} {...props}>
      <canvas ref={canvasRef} className="pixel-card-canvas" />
      {children}
    </div>
  )
}
