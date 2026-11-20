import React, { memo, useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import WarmTooltip, { WarmTooltipGroup } from '../WarmTooltip'
import StatusMark from '../react-bits/StatusMark'

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
    activeNovel,
    novelTitle, setNovelTitle,
    genre, setGenre,
    trixBalance, claimDailyTrix,
    plan, planTier, trialCountdown,
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

  const [genreOpen, setGenreOpen] = useState(false)
  const genreDropdownRef = useRef(null)

  // Click-outside handler for custom genre dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target)) {
        setGenreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      {/* 1. Left Group: Logo + Bookshelf + Novel Title + Custom Genre Dropdown + Live Save */}
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

        {/* Return to Bookshelf Button */}
        <WarmTooltip content="กลับสู่ชั้นวางนิยายของคุณ" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
          <button
            type="button"
            onClick={() => navigateTo('workspace_home')}
            className="elevated-surface border px-2.5 py-1.5 rounded-xl text-xs font-semibold text-violet-300 hover:text-white hover:border-violet-400/60 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
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

        {/* 1. Custom Dark Obsidian Glass Genre Dropdown */}
        <div ref={genreDropdownRef} className="hidden lg:flex items-center relative">
          <button
            type="button"
            onClick={() => setGenreOpen(prev => !prev)}
            className="bg-[#161229]/90 border border-purple-500/30 hover:border-purple-400/60 text-slate-200 rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <span className="truncate max-w-[145px]">{genre || 'แฟนตาซี / กำลังภายใน'}</span>
            <span className={`text-[9px] text-purple-300 transition-transform duration-200 ${genreOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {genreOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-[#120e24]/95 backdrop-blur-xl border border-purple-500/30 shadow-[0_12px_32px_rgba(0,0,0,0.65)] p-1.5 z-50 animate-fade-in space-y-0.5">
              {GENRES.map((g) => {
                const isActive = (genre || 'แฟนตาซี / กำลังภายใน') === g
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGenre(g)
                      setGenreOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-purple-600/30 text-purple-200 font-bold border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                        : 'text-slate-300 hover:bg-purple-500/20 hover:text-white'
                    }`}
                  >
                    <span>{g}</span>
                    {isActive && <span className="text-purple-300 text-xs font-bold">✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Save Status Indicator */}
        <div className="hidden md:flex items-center">
          <WarmTooltip content="บันทึกอัตโนมัติลงเครื่องและระบบอย่างปลอดภัย" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
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

      {/* 2. Center: Workspace Navigation with WarmTooltipGroup */}
      <div className="hidden xl:flex items-center">
        <WarmTooltipGroup delay={250} warmWindow={300} travel={280} lean={2}>
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#16102a]/80 border border-purple-500/25 backdrop-blur-md">
            {navItems.map((item) => (
              <WarmTooltip
                key={item.id}
                content={`เปิดหน้าต่าง ${item.label}`}
                side="bottom"
                surfaceColor="#1e1b2e"
                inkColor="#f4f4f5"
              >
                <button
                  type="button"
                  onClick={() => handleNavChange(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    item.id === 'studio'
                      ? 'bg-purple-600/35 text-purple-200 border border-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              </WarmTooltip>
            ))}
          </div>
        </WarmTooltipGroup>
      </div>

      {/* 3. Right Group: Command Palette, Trix Wallet, Import, Export, Focus Mode */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {/* Command Palette Trigger (Ctrl/Cmd + K) */}
        <WarmTooltip content="เปิด Command Palette ค้นหาคำศัพท์ / ข้ามตอน / คำสั่งด่วน" shortcut="⌘K" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl elevated-surface border hover:border-violet-500/60 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <span className="text-violet-400 text-sm font-bold">⌘</span>
            <span className="text-[11px] font-mono opacity-80">Cmd+K</span>
          </button>
        </WarmTooltip>

        {/* Live Pro Trial Countdown Badge (When active) */}
        {planTier === 'pro_trial' && (
          <WarmTooltip content={`สิทธิ์ทดลองใช้ Pro ฟรี 72 ชั่วโมง (เหลือเวลา ${trialCountdown || '3 วัน'}) - คลิกเพื่อดูรายละเอียด`} side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
            <button
              type="button"
              onClick={() => setActiveModal('pricing')}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-bold transition shadow-sm animate-pulse cursor-pointer"
            >
              <span className="text-amber-300">⏱️</span>
              <span className="hidden lg:inline text-[11px] font-semibold text-purple-300">เหลือเวลาทดลองใช้ Pro:</span>
              <span className="text-amber-300 text-xs font-bold">{trialCountdown || '3 วัน'}</span>
            </button>
          </WarmTooltip>
        )}

        {/* Trix Wallet with Daily Claim */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a142e] border border-amber-500/30">
          <WarmTooltip content="เหรียญ Trix คงเหลือสำหรับใช้งาน AI (ระบบเติมเหรียญปิดชั่วคราว - รอเปิดตัว Payment Gateway)" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
            <button
              type="button"
              onClick={() => setActiveModal('pricing')}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition cursor-pointer"
            >
              <img src="/Logo/TrixCoinLogo.png" alt="Trix Coin" className="w-4 h-4 object-contain inline-block" />
              <span>{trixBalance?.toLocaleString() || 0}</span>
              <span className="text-[10px] text-amber-400/80 font-normal">Trix</span>
            </button>
          </WarmTooltip>

          <WarmTooltip content="รับสิทธิ์ฟรี +3 Trix ทุกวัน!" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
            <button
              type="button"
              onClick={claimDailyTrix}
              className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition border border-emerald-500/30 cursor-pointer"
            >
              +3 ฟรี
            </button>
          </WarmTooltip>
        </div>

        {/* Free Novel Vocab Bank Button */}
        <WarmTooltip content="คลังคำศัพท์เฉพาะทางสำหรับนักเขียนนิยาย (เปิดใช้ฟรี)" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
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
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">ฟรี</span>
          </button>
        </WarmTooltip>

        {/* Import file button */}
        <WarmTooltip content="นำเข้าไฟล์ต้นฉบับอัจฉริยะ (.md / .docx / .txt)" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
          <button
            type="button"
            onClick={() => setActiveModal('import')}
            className="elevated-surface border hover:border-violet-500/60 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white transition hidden md:flex items-center gap-1 cursor-pointer"
          >
            <span>📥</span>
            <span>นำเข้า</span>
          </button>
        </WarmTooltip>

        {/* Publish to Home Page Button */}
        <WarmTooltip
          content={activeNovel?.is_published ? "นิยายเรื่องนี้เผยแพร่อยู่บนหน้าหลัก (คลิกเพื่อแก้ไขหรือยกเลิกการเผยแพร่)" : "เผยแพร่นิยายเรื่องนี้ขึ้นหน้าหลักให้นักอ่านทั่วไปเข้าชม"}
          side="bottom"
          surfaceColor="#1e1b2e"
          inkColor="#f4f4f5"
        >
          <button
            type="button"
            onClick={() => setActiveModal('publish')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer ${
              activeNovel?.is_published
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                : 'bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border-purple-400/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeNovel?.is_published ? 'bg-emerald-400 animate-ping' : 'bg-purple-400'}`} />
            <span className="hidden sm:inline">{activeNovel?.is_published ? 'เผยแพร่แล้ว' : 'เผยแพร่ขึ้นหน้าหลัก'}</span>
            <span className="sm:hidden">{activeNovel?.is_published ? 'เผยแพร่' : 'เผยแพร่'}</span>
          </button>
        </WarmTooltip>

        {/* Export Modal Button */}
        <WarmTooltip content="ส่งออกเป็นไฟล์ Word, PDF หรือ E-pub พร้อมลงเว็บนิยาย" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
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
        <WarmTooltip content={isFocusMode ? "ออกจากโหมดสมาธิ (Esc)" : "โหมดสมาธิไร้สิ่งรบกวน (Focus Mode)"} shortcut="Esc" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
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
