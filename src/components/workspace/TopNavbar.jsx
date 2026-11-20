import React, { memo } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import WarmTooltip from '../react-bits/WarmTooltip'
import StatusMark from '../react-bits/StatusMark'
import PillNav from '../react-bits/PillNav'

const GENRES = [
  'แฟนตาซี / กำลังภายใน',
  'สืบสวน / ระทึกขวัญ',
  'โรแมนติก / ดราม่า',
  'วาย / ยูริ (BL / GL)',
  'สยองขวัญ',
  'พีเรียด / ย้อนยุค',
  'เอาชีวิตรอด / ไซไฟ',
  'คอมเมดี้ / ชีวิตประจำวัน',
  'ทั่วไป / ยังไม่ระบุ'
]

function TopNavbar({ onOpenCommandPalette }) {
  const { user } = useAuth()
  const {
    novelTitle, setNovelTitle,
    genre, setGenre,
    trixBalance, claimDailyTrix,
    saveStatus,
    setActiveModal,
    setRightSidebarOpen,
    rightSidebarOpen,
    editorialCheckOpen,
    setEditorialCheckOpen,
    navigateTo,
    isAIProcessing,
    isFocusMode,
    setIsFocusMode
  } = useApp()

  const navItems = [
    { id: 'studio', label: 'ห้องเขียน Studio', icon: '✍️' },
    { id: 'bible', label: 'Story Bible', icon: '📖' },
    { id: 'vocab', label: 'คลังคำศัพท์', icon: '📚', badge: 'ฟรี' },
    { id: 'history', label: 'ประวัติแก้ไข', icon: '🕒' },
    { id: 'export', label: 'ส่งออก', icon: '🚀' }
  ]

  const handleNavChange = (id) => {
    if (id === 'studio') {
      navigateTo('studio')
    } else if (id === 'bible') {
      setActiveModal('characterBible')
    } else if (id === 'vocab') {
      setRightSidebarOpen(true)
    } else if (id === 'history') {
      setActiveModal('history')
    } else if (id === 'export') {
      setActiveModal('export')
    }
  }

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-5 py-2 panel-surface border-b flex flex-wrap items-center justify-between gap-3 select-none backdrop-blur-xl">
      {/* 1. Left Group: Logo + Bookshelf + Novel Title + Genre + Debounced Live Save */}
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        <div
          onClick={() => navigateTo('workspace_home')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          title="กลับไปยังชั้นวางนิยาย (Workspace Home)"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/30 text-white font-bold text-base group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-300 bg-clip-text text-transparent hidden sm:inline">
            Plottrix
          </span>
        </div>

        {/* Bookshelf button */}
        <WarmTooltip content="สลับโปรเจกต์ หรือจัดการชั้นวางนิยาย" side="bottom">
          <button
            type="button"
            onClick={() => navigateTo('workspace_home')}
            className="elevated-surface border px-2.5 py-1.5 rounded-xl text-xs font-semibold text-violet-300 hover:text-white hover:border-violet-400/60 transition flex items-center gap-1.5 shrink-0"
          >
            <span>📚</span>
            <span className="hidden md:inline">ชั้นวางนิยาย</span>
          </button>
        </WarmTooltip>

        <span className="text-slate-600 hidden sm:inline">/</span>

        {/* Editable Novel Title Input */}
        <input
          type="text"
          value={novelTitle}
          onChange={(e) => setNovelTitle(e.target.value)}
          placeholder="ตั้งชื่อนิยาย..."
          className="bg-transparent hover:bg-white/5 focus:bg-black/30 border border-transparent hover:border-violet-500/30 focus:border-violet-400 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-bold text-white max-w-[160px] sm:max-w-[210px] transition outline-none"
          title="คลิกเพื่อแก้ไขชื่อเรื่อง"
        />

        {/* Genre Selector */}
        <div className="hidden lg:flex items-center relative">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="elevated-surface border border-violet-500/25 text-violet-300 text-xs px-2.5 py-1.5 rounded-xl outline-none cursor-pointer hover:border-violet-400/60 transition font-medium appearance-none pr-6 shadow-sm"
          >
            {GENRES.map(g => (
              <option key={g} value={g} className="bg-[#16102a] text-white">{g}</option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-violet-400 pointer-events-none">
            ▼
          </span>
        </div>

        {/* Save Status Indicator */}
        <div className="hidden md:flex items-center">
          <WarmTooltip content="บันทึกอัตโนมัติลง Supabase หลังหยุดพิมพ์" side="bottom">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 border border-white/10 text-[11px]">
              <StatusMark
                status={saveStatus === 'saving' ? 'running' : 'done'}
                size={13}
                fontSize={10}
                strokeWidth={2}
                label={saveStatus === 'saving' ? 'กำลังบันทึก...' : 'บันทึกแล้ว ✓'}
                color="rgba(203, 183, 255, 0.75)"
                doneColor="#34d399"
              />
            </div>
          </WarmTooltip>
        </div>
      </div>

      {/* 2. Center: React Bits PillNav Workspace Navigation */}
      <div className="hidden xl:flex items-center">
        <PillNav
          items={navItems}
          activeId="studio"
          onChange={handleNavChange}
        />
      </div>

      {/* 3. Right Group: Command Palette, Trix Wallet, Import, Export, Focus Mode */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {/* Command Palette Trigger (Ctrl/Cmd + K) */}
        <WarmTooltip content="เปิด Command Palette เพื่อค้นหาหรือสั่งการด่วน" shortcut="⌘K" side="bottom">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl elevated-surface border hover:border-violet-500/60 text-xs text-slate-300 hover:text-white transition"
          >
            <span className="text-violet-400 text-sm">⌘</span>
            <span className="text-[11px] font-mono opacity-70">Cmd+K</span>
          </button>
        </WarmTooltip>

        {/* Trix Wallet with Daily Claim */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a142e] border border-amber-500/30">
          <WarmTooltip content="เหรียญ Trix คงเหลือสำหรับใช้งาน AI" side="bottom">
            <button
              type="button"
              onClick={() => setActiveModal('pricing')}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-[#0d0b14] font-bold text-[10px] flex items-center justify-center shadow">
                T
              </span>
              <span>{trixBalance?.toLocaleString() || 0}</span>
              <span className="text-[10px] text-amber-400/80 font-normal">Trix</span>
            </button>
          </WarmTooltip>

          <WarmTooltip content="รับสิทธิ์ฟรี +3 Trix ทุกวัน!" side="bottom">
            <button
              type="button"
              onClick={claimDailyTrix}
              className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition border border-emerald-500/30"
            >
              +3 ฟรี
            </button>
          </WarmTooltip>
        </div>

        {/* Free Novel Vocab Bank Button */}
        <WarmTooltip content="คลังคำศัพท์เฉพาะทางสำหรับนักเขียนนิยาย (ฟรีทุกแพลน)" side="bottom">
          <button
            type="button"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`elevated-surface border px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              rightSidebarOpen
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'hover:border-emerald-400/50 text-slate-200'
            }`}
          >
            <span className="text-emerald-400">📚</span>
            <span className="hidden md:inline">คลังคำศัพท์</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">ฟรี</span>
          </button>
        </WarmTooltip>

        {/* Import file button */}
        <WarmTooltip content="นำเข้าไฟล์ต้นฉบับเดิม (.txt)" side="bottom">
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.txt'
              input.onchange = (e) => {
                const file = e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (re) => {
                  window.dispatchEvent(new CustomEvent('plottrix-import-text', { detail: re.target.result }))
                }
                reader.readAsText(file)
              }
              input.click()
            }}
            className="elevated-surface border hover:border-violet-500/60 px-2 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white transition hidden md:flex items-center gap-1"
          >
            <span>📥</span>
            <span>นำเข้า</span>
          </button>
        </WarmTooltip>

        {/* Export Modal Button */}
        <WarmTooltip content="ส่งออกผลงานพร้อมลง ReadAWrite, Dek-D Writer หรือ E-Book" side="bottom">
          <button
            type="button"
            onClick={() => setActiveModal('export')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-violet-600/30 transition cursor-pointer"
          >
            <span>🚀</span>
            <span>ส่งออก</span>
          </button>
        </WarmTooltip>

        {/* Focus Mode Button */}
        <WarmTooltip content={isFocusMode ? "ออกจากโหมดสมาธิ (Esc)" : "โหมดสมาธิไร้สิ่งรบกวน (Focus Mode)"} shortcut="Esc" side="bottom">
          <button
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs transition cursor-pointer ${
              isFocusMode
                ? 'bg-violet-600 text-white border-violet-400'
                : 'elevated-surface border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {isFocusMode ? '⛶' : '⊡'}
          </button>
        </WarmTooltip>
      </div>
    </header>
  )
}

export default memo(TopNavbar)
