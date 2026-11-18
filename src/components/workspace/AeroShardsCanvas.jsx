import React, { useEffect, useRef } from 'react'

export default function AeroShardsCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const handleResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Shards particles
    const shardCount = 38
    const shards = []
    const colors = [
      'rgba(155, 99, 255, 0.18)',
      'rgba(194, 154, 255, 0.14)',
      'rgba(110, 64, 217, 0.16)',
      'rgba(116, 217, 180, 0.12)',
      'rgba(233, 199, 140, 0.08)'
    ]

    for (let i = 0; i < shardCount; i++) {
      shards.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 60 + 20,
        sides: Math.floor(Math.random() * 3) + 3,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.005,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      shards.forEach(s => {
        s.x += s.vx
        s.y += s.vy
        s.angle += s.vAngle

        if (s.x < -s.size) s.x = w + s.size
        if (s.x > w + s.size) s.x = -s.size
        if (s.y < -s.size) s.y = h + s.size
        if (s.y > h + s.size) s.y = -s.size

        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.angle)

        ctx.beginPath()
        for (let i = 0; i < s.sides; i++) {
          const a = (i * 2 * Math.PI) / s.sides
          const px = Math.cos(a) * (s.size / 2)
          const py = Math.sin(a) * (s.size / 2)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()

        ctx.fillStyle = s.color
        ctx.fill()
        ctx.strokeStyle = 'rgba(203, 183, 255, 0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
    </div>
  )
}
