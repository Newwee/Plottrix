import React, { useRef, useState, useEffect } from 'react'
import './PillNav.css'

/**
 * React Bits PillNav Component
 * Animated sliding pill navigation bar
 */
export default function PillNav({
  items = [],
  activeId,
  onChange,
  className = '',
  style
}) {
  const containerRef = useRef(null)
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeBtn = containerRef.current.querySelector(`[data-pill-id="${activeId}"]`)
    if (activeBtn) {
      setSliderStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1
      })
    } else {
      setSliderStyle(prev => ({ ...prev, opacity: 0 }))
    }
  }, [activeId, items])

  return (
    <nav ref={containerRef} className={`pill-nav-container ${className}`} style={style}>
      <div
        className="pill-nav-slider"
        style={{
          left: `${sliderStyle.left}px`,
          width: `${sliderStyle.width}px`,
          opacity: sliderStyle.opacity
        }}
      />
      {items.map((item) => {
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            data-pill-id={item.id}
            onClick={() => onChange?.(item.id)}
            className={`pill-nav-item ${isActive ? 'is-active' : ''}`}
            title={item.tooltip || item.label}
          >
            {item.icon && <span className="text-sm">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/25 text-violet-200">
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
