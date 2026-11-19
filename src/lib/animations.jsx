/**
 * Global Animation System: Motion for React
 * Standardized timing, easing, spring physics, and centralized components
 * Powered by 'motion/react'
 */

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'

// Standardized Spring Settings
export const SPRING_PRESETS = {
  gentle: { type: 'spring', damping: 28, stiffness: 300 },
  bouncy: { type: 'spring', damping: 18, stiffness: 350 },
  stiff: { type: 'spring', damping: 30, stiffness: 450 },
  snappy: { type: 'spring', damping: 25, stiffness: 400 }
}

// 1. Page Transition Variants
export const pageVariants = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(3px)',
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
  }
}

// 2. Modal Overlay & Content Variants
export const modalBackdropVariants = {
  initial: { opacity: 0, backdropFilter: 'blur(0px)' },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(12px)',
    transition: { duration: 0.25 }
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.2 }
  }
}

export const modalContentVariants = {
  initial: { opacity: 0, scale: 0.94, y: 20, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', damping: 24, stiffness: 320 }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    filter: 'blur(4px)',
    transition: { duration: 0.18, ease: 'easeIn' }
  }
}

// 3. Side Panel / Drawer Variants
export const drawerRightVariants = {
  initial: { x: '100%', opacity: 0.4 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 26, stiffness: 300 }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.22, ease: 'easeInOut' }
  }
}

export const drawerBottomVariants = {
  initial: { y: '100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 280 }
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' }
  }
}

// 4. Dropdown Menu Variants
export const dropdownVariants = {
  initial: { opacity: 0, y: -8, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.96,
    transition: { duration: 0.14, ease: 'easeIn' }
  }
}

// 5. Tab Content Switch Variants
export const tabContentVariants = {
  initial: { opacity: 0, x: 12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.16, ease: 'easeIn' }
  }
}

// 6. Toast Notification Variants
export const toastVariants = {
  initial: { opacity: 0, y: 28, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 350 }
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 12,
    transition: { duration: 0.2 }
  }
}

// 7. Accordion / Height Expansion Variants
export const accordionVariants = {
  initial: { height: 0, opacity: 0, overflow: 'hidden' },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.22, ease: 'easeInOut' }
  }
}

/**
 * Reusable Motion Modal Component
 */
export function MotionModal({ isOpen, onClose, children, className = '', containerClassName = '' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 ${containerClassName}`}>
          {/* Backdrop with Click-Outside dismiss */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/65 z-0"
          />

          {/* Modal Content Box */}
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative z-10 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Reusable Motion Page Transition Wrapper
 */
export function MotionPageTransition({ children, viewKey, className = '' }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Reusable Motion Drawer Component
 */
export function MotionDrawer({ isOpen, onClose, children, position = 'right', className = '' }) {
  const variants = position === 'bottom' ? drawerBottomVariants : drawerRightVariants

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 pointer-events-auto"
          />

          {/* Drawer Body */}
          <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`pointer-events-auto ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
