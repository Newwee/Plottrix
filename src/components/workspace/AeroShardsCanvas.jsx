import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDevicePerformance } from '../../hooks/useDevicePerformance'
import AeroShards from '../react-bits/AeroShards'

/**
 * AeroShardsCanvas
 * Hybrid 3D WebGPU & Canvas 2D Ambient Shards Engine
 * 1. High-End / Modern WebGPU: Authentic React Bits WebGPU <AeroShards /> shader engine
 * 2. Balanced / No-WebGPU Fallback: Optimized Canvas 2D floating glass ribbon shards
 * 3. Low-End / Potato PC Mode: 100% disabled GPU execution, pure CSS radial gradient + static SVG
 * 4. Zero Click-Blocking: Fixed pointer-events-none z-1 layer throughout document.body via Portal
 */
export default function AeroShardsCanvas() {
  const { isLowEnd, isBalanced, isHighEnd, maxDpr, enableAeroCanvas } = useDevicePerformance()
  const [webGpuFailed, setWebGpuFailed] = useState(false)
  const [hasWebGpuSupport, setHasWebGpuSupport] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Canvas 2D fallback refs
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      setHasWebGpuSupport(true)
    } else {
      setHasWebGpuSupport(false)
    }
  }, [])

  // Canvas 2D fallback animation loop (only runs when WebGPU is unavailable or fails, and NOT in low-end mode)
  const shouldUse2DCanvas = !isLowEnd && enableAeroCanvas && (!hasWebGpuSupport || webGpuFailed)

  useEffect(() => {
    if (!shouldUse2DCanvas) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    let w = 0, h = 0, dpr = 1
    const pointer = {
      x: 0.5,
      y: 0.5,
      tx: 0.5,
      ty: 0.5,
      inside: true,
      holding: false,
      holdPower: 0
    }
    const rings = []
    const DEPTHS = [1.0, 1.35, 1.8, 2.4, 3.2]
    const FADE = [0.95, 0.75, 0.52, 0.34, 0.2]
    const shards = []
    const markers = []

    const baseCount = isBalanced ? 24 : 38
    for (let lvl = 0; lvl < 5; lvl++) {
      const count = Math.round(lvl === 0 ? baseCount : lvl === 1 ? baseCount * 0.9 : baseCount * 0.75)
      for (let i = 0; i < count; i++) {
        shards.push({
          lvl,
          phase: (i / count) + Math.random() * 0.04,
          baseY: (i / count) * 0.9 + 0.05,
          lane: (Math.random() * 2 - 1) * 0.25,
          size: (11 + Math.random() * 14) / DEPTHS[lvl],
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 1.2,
          isAccent: Math.random() < 0.38,
          sides: Math.random() < 0.6 ? 3 : 4,
          ox: 0,
          oy: 0,
          vx: 0,
          vy: 0,
          flash: 0
        })
      }
      const markerCount = isBalanced ? 6 : 10
      for (let m = 0; m < markerCount; m++) {
        markers.push({
          lvl,
          x: Math.random(),
          y: Math.random(),
          blinkPhase: Math.random() * Math.PI * 2,
          size: lvl < 2 ? 4.5 : 3
        })
      }
    }

    function resize() {
      w = Math.max(1, window.innerWidth)
      h = Math.max(1, window.innerHeight)
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 1.15)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const handlePointerMove = (e) => {
      pointer.tx = e.clientX / w
      pointer.ty = e.clientY / h
      pointer.inside = true
    }

    const handlePointerDown = (e) => {
      if (e.button !== 0 || isBalanced) return
      pointer.tx = e.clientX / w
      pointer.ty = e.clientY / h
      pointer.holding = true
      rings.push({
        x: pointer.tx * w,
        y: pointer.ty * h,
        r: 0,
        alpha: 0.9
      })
      if (rings.length > 3) rings.shift()
    }

    const handlePointerUp = () => {
      pointer.holding = false
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('pointerup', handlePointerUp, { passive: true })

    let animId = null
    let last = performance.now()
    let clock = 0
    let isVisible = true

    function tick(now) {
      if (!isVisible) {
        animId = null
        return
      }

      animId = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!reduce) clock += dt

      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 7))
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 7))
      const targetHold = pointer.holding && !reduce ? 1 : 0
      pointer.holdPower += (targetHold - pointer.holdPower) * (1 - Math.exp(-dt * 4))

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const px = pointer.x * w
      const py = pointer.y * h
      const camX = (pointer.x - 0.5) * 36
      const camY = (pointer.y - 0.5) * 22

      if (!isBalanced && rings.length > 0) {
        for (let i = rings.length - 1; i >= 0; i--) {
          rings[i].r += dt * 520
          rings[i].alpha *= Math.exp(-dt * 1.9)
          if (rings[i].alpha < 0.02) {
            rings.splice(i, 1)
          }
        }
      }

      for (let lvl = 4; lvl >= 0; lvl--) {
        const depth = DEPTHS[lvl]
        const fade = FADE[lvl]
        const parallaxX = -camX / depth
        const parallaxY = -camY / depth

        for (const mk of markers) {
          if (mk.lvl !== lvl) continue
          const mx = (((mk.x * w + clock * 8 / depth + parallaxX) % w) + w) % w
          const my = mk.y * h + parallaxY
          const distCursor = Math.hypot(mx - px, my - py)
          const targetBracket = pointer.inside && lvl <= 2 && distCursor < 75 ? 1 - distCursor / 75 : 0
          const blink = 0.35 + 0.45 * Math.sin(clock * 2.2 + mk.blinkPhase)
          const alpha = fade * (blink + targetBracket * 0.8)
          ctx.fillStyle = `rgba(247, 85, 193, ${alpha.toFixed(3)})`
          const s = mk.size * 0.65
          ctx.beginPath()
          ctx.arc(mx, my, s, 0, Math.PI * 2)
          ctx.fill()
        }

        for (const sh of shards) {
          if (sh.lvl !== lvl) continue
          const s0 = (sh.phase + clock * (0.032 / depth)) % 1
          const slope = (lvl % 2 === 0 ? -0.22 : 0.18) * (s0 - 0.5)
          const wave = Math.sin(s0 * Math.PI * 2.2 + clock * 0.9 + lvl * 1.4) * 0.09 / depth
          const bx = s0 * w + parallaxX
          const by = (sh.baseY + slope * 0.35 + wave + (sh.lane / depth) * 0.25) * h + parallaxY

          let fx = 0
          let fy = 0
          const cx = bx + sh.ox
          const cy = by + sh.oy

          if (pointer.inside && !reduce && !isBalanced) {
            const dx = cx - px
            const dy = cy - py
            const dist = Math.hypot(dx, dy)
            const reach = 130 / depth
            if (dist < reach && dist > 0.1) {
              const push = (1 - dist / reach) * 18 / depth
              fx += (dx / dist) * push
              fy += (dy / dist) * push
            }
          }

          sh.vx = (sh.vx + fx - sh.ox * 0.08) * 0.82
          sh.vy = (sh.vy + fy - sh.oy * 0.08) * 0.82
          sh.ox += sh.vx
          sh.oy += sh.vy
          sh.flash *= Math.exp(-dt * 2.6)

          const rot = sh.angle + clock * sh.spin + sh.vx * 0.03
          const sz = sh.size * (1 + sh.flash * 0.35)

          ctx.save()
          ctx.translate(bx + sh.ox, by + sh.oy)
          ctx.rotate(rot)
          ctx.beginPath()
          for (let k = 0; k < sh.sides; k++) {
            const a = (k / sh.sides) * Math.PI * 2
            const rx = Math.cos(a) * sz * 1.35
            const ry = Math.sin(a) * sz * 0.65
            if (k === 0) ctx.moveTo(rx, ry)
            else ctx.lineTo(rx, ry)
          }
          ctx.closePath()

          const baseAlpha = fade * (0.28 + sh.flash * 0.5)
          ctx.fillStyle = sh.isAccent
            ? `rgba(168, 85, 247, ${baseAlpha.toFixed(3)})`
            : `rgba(137, 106, 189, ${baseAlpha.toFixed(3)})`
          ctx.fill()

          ctx.lineWidth = 1
          ctx.strokeStyle = `rgba(233, 213, 255, ${Math.min(0.9, fade * (0.45 + sh.flash * 0.6)).toFixed(3)})`
          ctx.stroke()
          ctx.restore()
        }
      }
    }

    const startAnimation = () => {
      if (!animId && isVisible) {
        last = performance.now()
        animId = requestAnimationFrame(tick)
      }
    }

    const stopAnimation = () => {
      if (animId) {
        cancelAnimationFrame(animId)
        animId = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false
        stopAnimation()
      } else {
        isVisible = true
        startAnimation()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    let io = null
    if (container && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          isVisible = true
          startAnimation()
        } else {
          isVisible = false
          stopAnimation()
        }
      }, { threshold: 0.05 })
      io.observe(container)
    } else {
      startAnimation()
    }

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (io) io.disconnect()
      stopAnimation()
    }
  }, [shouldUse2DCanvas, isBalanced, maxDpr])

  if (!mounted || typeof document === 'undefined') return null

  // 1. Low-End / Potato PC Mode: Zero Canvas, zero WebGPU
  if (!enableAeroCanvas || isLowEnd) {
    return createPortal(
      <div
        id="plottrix-aero-shards-portal"
        className="aero-shards aero-shards-global"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
          background: 'transparent'
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15%" cy="20%" r="1" fill="#c29aff" opacity="0.6" />
          <circle cx="85%" cy="15%" r="1.5" fill="#a855f7" opacity="0.5" />
          <circle cx="45%" cy="65%" r="1" fill="#e9d5ff" opacity="0.7" />
          <circle cx="75%" cy="80%" r="1.2" fill="#9333ea" opacity="0.4" />
          <circle cx="25%" cy="85%" r="1" fill="#c084fc" opacity="0.5" />
        </svg>
      </div>,
      document.body
    )
  }

  // 2. High-End / Modern WebGPU: React Bits authentic WebGPU <AeroShards /> component
  if (hasWebGpuSupport && !webGpuFailed) {
    return createPortal(
      <div
        id="plottrix-aero-shards-portal"
        className="aero-shards aero-shards-global"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
          background: 'transparent'
        }}
      >
        <AeroShards
          shardColor="#896ABD"
          accentColor="#f755c1"
          placement="full"
          material="chrome"
          markers="dots"
          count={1300}
          depthOfField={0.75}
          vignette={0.3}
          mouseInteraction={true}
          pulseOnClick={true}
          holdToGather={true}
          scale={1.25}
          spread={1.8}
          twist={1}
          billow={1}
          speed={0.9}
          glow={isHighEnd ? 0.35 : 0.15}
          grain={isHighEnd ? 0.06 : 0}
          dpr={isHighEnd ? 1.5 : 1.0}
          onError={() => setWebGpuFailed(true)}
          className="w-full h-full pointer-events-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none'
          }}
        />
      </div>,
      document.body
    )
  }

  // 3. Fallback Canvas 2D mode (when WebGPU is not supported or failed to initialize)
  return createPortal(
    <div
      id="plottrix-aero-shards-portal"
      ref={containerRef}
      className="aero-shards aero-shards-global"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      <canvas
        ref={canvasRef}
        className="aero-shards-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'block',
          pointerEvents: 'none'
        }}
      />
    </div>,
    document.body
  )
}
