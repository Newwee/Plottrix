import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/**
 * NovelCoverCarousel
 * Cycles through up to 5 cover images with crossfade animation.
 * - Primary cover (#1) always stays visible the longest (5000ms).
 * - Secondary images cycle at 2500ms.
 * - Hover Rule: When mouse hovers over the card, pauses animation and
 *   permanently locks to the primary cover (#1) until unhovered.
 */
export default function NovelCoverCarousel({
  images = [],
  alt = 'หน้าปกนิยาย',
  className = '',
  imageClassName = 'w-full h-full object-cover',
  showDots = true
}) {
  const validImages = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean)
    : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80']

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (validImages.length <= 1) return

    // When hovered: permanently lock to first image
    if (isHovered) {
      setCurrentIndex(0)
      return
    }

    // First image stays longest (5000ms), subsequent images cycle faster (2500ms)
    const delay = currentIndex === 0 ? 5000 : 2500

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length)
    }, delay)

    return () => clearTimeout(timer)
  }, [currentIndex, isHovered, validImages.length])

  const handleMouseEnter = () => {
    setIsHovered(true)
    setCurrentIndex(0)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={validImages[currentIndex] || currentIndex}
          src={validImages[currentIndex]}
          alt={`${alt} - ภาพที่ ${currentIndex + 1}`}
          initial={{ opacity: 0.3, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.2 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className={imageClassName}
          loading="lazy"
        />
      </AnimatePresence>

      {/* Slide indicator dots (when more than 1 image) */}
      {showDots && validImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 pointer-events-none">
          {validImages.map((_, idx) => (
            <span
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-3 h-1 bg-purple-400'
                  : 'w-1 h-1 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
