import React, { useEffect, useRef, useState } from 'react'

export default function CountUp({
  to = 0,
  from = 0,
  duration = 1200,
  separator = ',',
  prefix = '',
  suffix = '',
  className = ''
}) {
  const [val, setVal] = useState(from)
  const ref = useRef(null)
  const animatedRef = useRef(false)
  const rafRef = useRef(null)

  const format = (v) => {
    const num = Math.round(v).toString()
    const grouped = separator ? num.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : num
    return `${prefix}${grouped}${suffix}`
  }

  const runAnimation = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduce || to === from) {
      setVal(to)
      return
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    const start = performance.now()
    function step(now) {
      if (document.hidden) {
        setVal(to)
        return
      }
      const t = Math.min(1, (now - start) / duration)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(from + (to - from) * ease)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setVal(to)
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true
          runAnimation()
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })

    io.observe(el)

    return () => {
      io.disconnect()
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [to, from, duration])

  return (
    <span
      ref={ref}
      className={className}
      onMouseEnter={() => runAnimation()}
    >
      {format(val)}
    </span>
  )
}
