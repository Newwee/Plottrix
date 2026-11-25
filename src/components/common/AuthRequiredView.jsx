import React from 'react'
import { useApp } from '../../context/AppContext'
import AeroShardsCanvas from '../workspace/AeroShardsCanvas'

export default function AuthRequiredView({ isLoading = false }) {
  const { navigateTo, setActiveModal } = useApp()

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0d091a] flex flex-col items-center justify-center text-purple-300 font-thai relative overflow-hidden">
        <AeroShardsCanvas />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wider text-white">กำลังตรวจสอบสิทธิ์การเข้าสู่ระบบ...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0d091a] flex flex-col items-center justify-center text-white font-thai p-4 sm:p-6 relative overflow-hidden select-none">
      <AeroShardsCanvas />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-purple-500/35 bg-gradient-to-b from-[#1a1233]/95 via-[#130c26]/95 to-[#0c0719]/98 p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-3xl shadow-inner">
          🔒
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ต้องเข้าสู่ระบบก่อนจึงจะเข้าถึงเนื้อหาได้
          </h2>
          <p className="text-xs sm:text-sm text-plottrix-muted leading-relaxed">
            กรุณาเข้าสู่ระบบหรือสมัครสมาชิก เพื่อเข้าถึง Workspace ดูนิยายที่คุณสร้างไว้ และใช้งานเครื่องมือเขียนนิยาย
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setActiveModal('auth')}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
            <span>→</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="w-full py-2.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
          >
            ← กลับสู่หน้าแรก
          </button>
        </div>
      </div>
    </div>
  )
}
