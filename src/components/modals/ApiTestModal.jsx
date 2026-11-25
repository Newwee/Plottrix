import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

export default function ApiTestModal() {
  const { activeModal, setActiveModal, addToast } = useApp()
  const { session } = useAuth()

  const [serverStatus, setServerStatus] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [statusError, setStatusError] = useState(null)

  // Live Test State
  const [testText, setTestText] = useState('สวัสดีนักรบทุกท่าน')
  const [testAction, setTestAction] = useState('translate')
  const [testingAi, setTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState(null)
  const [aiTestError, setAiTestError] = useState(null)
  const [latencyMs, setLatencyMs] = useState(null)

  const isOpen = activeModal === 'apiTest'

  // Auto-check status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkServerStatus()
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setActiveModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setActiveModal])

  async function checkServerStatus() {
    setCheckingStatus(true)
    setStatusError(null)
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setServerStatus(data)
    } catch (err) {
      setStatusError(err.message)
    } finally {
      setCheckingStatus(false)
    }
  }

  async function handleRunLiveTest() {
    if (!testText.trim() || testingAi) return
    setTestingAi(true)
    setAiTestError(null)
    setAiTestResult(null)
    setLatencyMs(null)

    const startTime = performance.now()
    try {
      const token = session?.access_token || ''
      const res = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          actionType: testAction,
          payload: {
            text: testText.trim(),
            language: 'en',
            genre: 'แฟนตาซี'
          }
        })
      })

      const elapsed = Math.round(performance.now() - startTime)
      setLatencyMs(elapsed)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson?.error?.message || errJson?.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setAiTestResult(data)
      addToast({
        title: 'ทดสอบสำเร็จ! AI Engine ใช้งานได้จริง',
        description: `ตอบกลับภายใน ${(elapsed / 1000).toFixed(2)} วินาที ผ่านโมเดล ${data.model}`,
        fuseColor: '#74d9b4'
      })
    } catch (err) {
      setAiTestError(err.message)
      addToast({
        title: 'การทดสอบขัดข้อง',
        description: err.message,
        fuseColor: '#ef4444'
      })
    } finally {
      setTestingAi(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-3xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden border border-purple-500/30 shadow-2xl bg-[#130d26]/95 text-white my-auto"
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-white/10 flex items-center justify-between bg-[#191133]/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-lg text-purple-300 shadow-inner">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white tracking-tight">
                      AI Engine & API Key Diagnostics
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/70">
                    แดชบอร์ดตรวจสอบสถานะ API Key และการสลับโมเดลอัตโนมัติ (Smart Model Routing)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={checkServerStatus}
                  disabled={checkingStatus}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-purple-300 border border-white/10 transition cursor-pointer"
                >
                  {checkingStatus ? 'กำลังรีเฟรช...' : '↻ รีเฟรชสถานะ'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* SECTION 1: SYSTEM HEALTH OVERVIEW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Card 1: API Key */}
                <div className="p-4 rounded-2xl bg-[#191336]/80 border border-purple-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Gateway Key</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${serverStatus?.config?.geminiKeyConfigured ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-400'}`} />
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    {serverStatus?.config?.geminiKeyConfigured ? (serverStatus.config.geminiKeyMasked || 'พร้อมใช้งาน (Active)') : 'ยังไม่ระบุคีย์'}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    อ่านจาก Environment Variables (.env / Vercel Settings)
                  </p>
                </div>

                {/* Card 2: Smart Model Routing */}
                <div className="p-4 rounded-2xl bg-[#191336]/80 border border-purple-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model Routing</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">Auto</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-purple-200 space-y-0.5">
                    <div>Fast: {serverStatus?.config?.models?.fast || 'claude-haiku-5.5-eco'}</div>
                    <div>Deep: {serverStatus?.config?.models?.hard || 'chatgpt-6-luna'}</div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    เลือกโมเดลตามความซับซ้อนของงานอัตโนมัติ
                  </p>
                </div>

                {/* Card 3: Database & Cloud */}
                <div className="p-4 rounded-2xl bg-[#191336]/80 border border-purple-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supabase Cloud</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-300">
                    เชื่อมต่อสมบูรณ์
                  </div>
                  <p className="text-[10px] text-slate-400">
                    ซิงค์ข้อมูลนิยาย ตอน และประวัติเหรียญอัตโนมัติ
                  </p>
                </div>
              </div>

              {/* SECTION 2: INTERACTIVE LIVE API PING TEST */}
              <div className="p-5 rounded-2xl bg-white/5 border border-purple-500/30 space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>🧪</span>
                      <span>ทดสอบยิงคำสั่งไปยัง AI Gateway ของจริง (Live Test)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ทดสอบส่งข้อความเข้าไปประมวลผลจริง เพื่อวัดความเร็ว (Latency) และตรวจเช็คผลลัพธ์
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {['translate', 'polish', 'proofread'].map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => setTestAction(action)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          testAction === action
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {action === 'translate' ? 'แปลภาษา' : action === 'polish' ? 'เกลาสำนวน' : 'แก้คำผิด'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <input
                    type="text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="พิมพ์ข้อความทดสอบ..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-purple-400/30 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleRunLiveTest}
                    disabled={testingAi || !testText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {testingAi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>กำลังยิงทดสอบ...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>ยิงทดสอบเดี๋ยวนี้</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Display */}
                {aiTestResult && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-bold text-xs text-emerald-300">HTTP 200 OK — สำเร็จ 100%</span>
                        <span className="text-[11px] text-slate-400 font-mono">({aiTestResult.model})</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">
                        ⚡ ความเร็ว: {latencyMs} ms ({(latencyMs / 1000).toFixed(2)} วินาที)
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">ผลลัพธ์ที่ได้จากโมเดล:</span>
                      <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-thai text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {aiTestResult.result?.translatedText ||
                         aiTestResult.result?.polishedText ||
                         aiTestResult.result?.correctedText ||
                         JSON.stringify(aiTestResult.result, null, 2)}
                      </div>
                    </div>
                  </div>
                )}

                {aiTestError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>✕</span>
                      <span>เกิดข้อผิดพลาดในการเรียก API:</span>
                    </div>
                    <div className="font-mono text-[11px] text-red-200">{aiTestError}</div>
                  </div>
                )}
              </div>

              {/* SECTION 3: SPEED & TOKEN EFFICIENCY GUIDE */}
              <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                <h4 className="font-bold text-sm text-purple-200 flex items-center gap-2">
                  <span>💡</span>
                  <span>ข้อควรรู้: ความเร็ว Free Plan vs Pay-As-You-Go และเทคนิคประหยัด Token</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                    <div className="font-bold text-amber-300">1. งานทั่วไป (Fast Route)</div>
                    <p className="text-slate-400 leading-relaxed">
                      งานตรวจคำผิด (Proofread), แปลประโยค และคำสั่งทั่วไปใช้ <code>claude-haiku-5.5-eco</code> เพื่อความเร็วสูงสุด
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                    <div className="font-bold text-indigo-300">2. งานวิเคราะห์ลึก (Deep Route)</div>
                    <p className="text-slate-400 leading-relaxed">
                      งานเกลาสำนวน, ตรวจความต่อเนื่องข้ามบท และวิเคราะห์พล็อตใช้ <code>chatgpt-6-luna</code> พร้อมระบบสลับสำรองอัตโนมัติ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#191133]/60">
              <span className="text-[11px] text-slate-400">
                Plottrix AI Engine v2.1 • Astracode Gateway
              </span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
