import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function ApiTestModal() {
  const { activeModal, setActiveModal } = useApp()
  const [statusResult, setStatusResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (activeModal !== 'apiTest') return null

  async function checkServerStatus() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStatusResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-pop">
      <div className="themed-panel border border-slate-300 dark:border-slate-700 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <span>⚙️ สถานะระบบและการเชื่อมต่อ API</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ตรวจสอบสถานะ Vercel Serverless Function และคอนฟิกของระบบ
            </p>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-bold text-slate-800 dark:text-slate-100">ระบบ Vercel Serverless (/api)</div>
            <p>API Key ถูกซ่อนไว้ในฝั่งเซิร์ฟเวอร์อย่างปลอดภัย (อ่านจาก process.env.GEMINI_API_KEY)</p>
          </div>

          <button
            onClick={checkServerStatus}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {loading ? 'กำลังตรวจสอบสถานะ...' : 'กดตรวจสอบสถานะเซิร์ฟเวอร์ (/api/status)'}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
              เกิดข้อผิดพลาด: {error}
            </div>
          )}

          {statusResult && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
              <div className="font-bold flex items-center space-x-1.5">
                <span>✓</span>
                <span>เซิร์ฟเวอร์พร้อมใช้งาน (Status: OK)</span>
              </div>
              <div className="font-mono text-[11px] space-y-1">
                <div>เวอร์ชัน: {statusResult.version}</div>
                <div>บริการ: {statusResult.service}</div>
                <div>เวลาเซิร์ฟเวอร์: {statusResult.timestamp}</div>
                <div>Gemini Key Configured: {statusResult.config?.geminiKeyConfigured ? 'Yes (True)' : 'No'}</div>
                <div>Supabase Configured: {statusResult.config?.supabaseConfigured ? 'Yes (True)' : 'No'}</div>
                <div>
                  โมเดลที่กำหนด: {statusResult.config?.models?.light}, {statusResult.config?.models?.core}, {statusResult.config?.models?.deep}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
