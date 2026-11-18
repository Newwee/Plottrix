import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import Stepper, { Step } from '../react-bits/Stepper'

export default function OnboardingTour() {
  const {
    isTourOpen,
    tourStep,
    setTourStep,
    completeTour,
    skipTour,
    currentView,
    navigateTo,
    novels,
    openNovel
  } = useApp()

  const [targetRect, setTargetRect] = useState(null)
  const animFrameRef = useRef(null)

  // Step definition with target selectors
  const STEPS_CONFIG = [
    {
      step: 1,
      view: 'workspace_home',
      selector: '#tour-target-create-novel',
      fallbackSelector: '#tour-target-novel-card',
      title: 'ชั้นวางนิยาย & สร้างเรื่องใหม่',
      desc: 'ยินดีต้อนรับ! นี่คือพื้นที่จัดการนิยายทั้งหมดของคุณ คุณสามารถเริ่มเรื่องใหม่ได้จากปุ่มนี้ หรือเลือกหนังสือจากชั้นวางเพื่อเปิดห้องเขียน'
    },
    {
      step: 2,
      view: 'studio',
      selector: '#tour-target-editor',
      fallbackSelector: '.studio-editor-area',
      title: 'ห้องเขียนสตูดิโอ (Distraction-Free)',
      desc: 'พื้นที่เขียนงานระดับพรีเมียม จัดการบทและหน้ากระดาษ พร้อมระบบบันทึกอัตโนมัติลง Supabase หลังหยุดพิมพ์ 2.5 วินาที'
    },
    {
      step: 3,
      view: 'studio',
      selector: '#tour-target-editor-text',
      fallbackSelector: '#tour-target-editor',
      title: 'Floating AI Context Toolbar',
      desc: 'จุดเด่นของ Plottrix! เพียงลากคลุมข้อความใดๆ ในหน้ากระดาษ แถบกระจก Liquid Glassmorphism จะลอยขึ้นมาให้คุณเลือก 5 คำสั่ง AI ทันที'
    },
    {
      step: 4,
      view: 'studio',
      selector: '#tour-target-sidebar-tools',
      fallbackSelector: '#tour-target-top-actions',
      title: 'คลังคำศัพท์ & AI Skill อิสระ',
      desc: 'เชื่อมต่อคลังคำศัพท์ 20 หมวดหมู่ตามแนวเรื่อง และกำหนด Prompt คุมสไตล์การเขียนเฉพาะตัวได้อิสระใน AI Skill Manager'
    }
  ]

  const currentConfig = STEPS_CONFIG.find(s => s.step === tourStep) || STEPS_CONFIG[0]

  // Smooth DOM calculation & auto view switching with requestAnimationFrame
  const updateRect = useCallback(() => {
    if (!isTourOpen) return

    const config = STEPS_CONFIG.find(s => s.step === tourStep)
    if (!config) return

    // Ensure we are in the correct view
    if (config.view === 'studio' && currentView !== 'studio') {
      if (novels.length > 0) {
        openNovel(novels[0].id)
      } else {
        navigateTo('studio')
      }
      return
    }

    if (config.view === 'workspace_home' && currentView !== 'workspace_home') {
      navigateTo('workspace_home')
      return
    }

    // Try finding the target element in the DOM
    const el = document.querySelector(config.selector) || document.querySelector(config.fallbackSelector)
    if (el) {
      const rect = el.getBoundingClientRect()
      // Guard against 0,0 before DOM is fully rendered
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })
        return
      }
    }

    // If element is not yet ready, retry on next animation frame
    animFrameRef.current = requestAnimationFrame(updateRect)
  }, [isTourOpen, tourStep, currentView, novels, openNovel, navigateTo])

  useEffect(() => {
    if (!isTourOpen) {
      setTargetRect(null)
      return
    }

    updateRect()
    const onResize = () => updateRect()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isTourOpen, tourStep, currentView, updateRect])

  if (!isTourOpen) return null

  const handleStepChange = (nextStep) => {
    const nextConfig = STEPS_CONFIG.find(s => s.step === nextStep)
    if (nextConfig && nextConfig.view === 'studio' && currentView !== 'studio') {
      if (novels.length > 0) {
        openNovel(novels[0].id)
      } else {
        navigateTo('studio')
      }
    }
    setTourStep(nextStep)
  }

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-auto overflow-hidden">
      {/* SVG Spotlight Mask with Smooth Tweening */}
      <svg className="w-full h-full absolute inset-0 pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers the entire screen (opaque) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cutout creates the transparent hole where target element sits */}
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="16"
                ry="16"
                fill="black"
                style={{
                  transition: 'x 0.45s cubic-bezier(0.22, 1, 0.36, 1), y 0.45s cubic-bezier(0.22, 1, 0.36, 1), width 0.45s cubic-bezier(0.22, 1, 0.36, 1), height 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              />
            )}
          </mask>
        </defs>
        {/* Dark overlay applied through the mask */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(8, 5, 18, 0.82)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Glow Border Frame (Tweening) */}
      {targetRect && (
        <div
          className="absolute border-2 border-purple-400 rounded-2xl pointer-events-none shadow-[0_0_30px_rgba(168,85,247,0.5)] ring-4 ring-purple-500/20"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />
      )}

      {/* Floating Stepper Dialog */}
      <div
        className="absolute z-10 p-4 transition-all duration-300"
        style={{
          top: targetRect ? Math.min(window.innerHeight - 380, Math.max(20, targetRect.top + targetRect.height + 24)) : '50%',
          left: targetRect ? Math.min(window.innerWidth - 480, Math.max(20, targetRect.left)) : '50%',
          transform: targetRect ? 'none' : 'translate(-50%, -50%)',
          maxWidth: '460px',
          width: 'calc(100% - 32px)'
        }}
      >
        <div className="relative shadow-2xl">
          {/* Top Skip Button */}
          <button
            type="button"
            onClick={skipTour}
            className="absolute -top-3 -right-3 z-20 px-2.5 py-1 rounded-full bg-[#271d42] hover:bg-[#342759] text-purple-200 text-[11px] font-bold border border-purple-400/30 shadow-md transition"
          >
            ข้ามการสอน ✕
          </button>

          <Stepper
            step={tourStep}
            onStepChange={handleStepChange}
            onFinalStepCompleted={completeTour}
            backButtonText="ย้อนกลับ"
            nextButtonText="ถัดไป →"
            completeButtonText="เสร็จสิ้น เริ่มเขียนเลย 🎉"
            theme="dark"
            accentColor="#9333ea"
            width={440}
            frame={true}
            radius={20}
          >
            {STEPS_CONFIG.map((sc) => (
              <Step key={sc.step} title={`ขั้นตอนที่ ${sc.step}`}>
                <div className="py-2 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/20">
                    Step {sc.step} จาก 4
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    {sc.title}
                  </h3>
                  <p className="text-xs text-plottrix-muted leading-relaxed">
                    {sc.desc}
                  </p>
                </div>
              </Step>
            ))}
          </Stepper>
        </div>
      </div>
    </div>
  )
}
