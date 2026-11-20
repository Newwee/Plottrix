import React, { useRef } from 'react'
import './SpotlightCard.css'

/**
 * React Bits SpotlightCard Component
 * High-performance cursor-following radial spotlight border card
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(168, 85, 247, 0.45)',
  spotlightSize = 350,
  radius = 16,
  style,
  onClick
}) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`spotlight-card ${className}`}
      style={{
        '--spotlight-color': spotlightColor,
        '--spotlight-size': `${spotlightSize}px`,
        '--spotlight-radius': `${radius}px`,
        ...style
      }}
    >
      <div className="spotlight-card-content">{children}</div>
    </div>
  )
}
