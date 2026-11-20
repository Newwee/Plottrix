import React, { useRef, useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import WarmTooltip from '../react-bits/WarmTooltip'
import AeroShardsCanvas from './AeroShardsCanvas'

export default function WorkspaceHome() {
  const {
    novels,
    openNovel,
    createNovel,
    deleteNovel,
    plan,
    trixBalance,
    claimDailyTrix,
    lastDailyClaim,
    navigateTo,
    setActiveModal,
    startTour
  } = useApp()
  const { user } = useAuth()

  const [isCreating, setIsCreating] = useState(false)
  const [novelToDelete, setNovelToDelete] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newGenre, setNewGenre] = useState('แฟนตาซี / กำลังภายใน')
  const [newSynopsis, setNewSynopsis] = useState('')

  const scrollRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const isFreePlan = plan === 'Free Plan'
  const FREE_PLAN_LIMIT = 3
  const isQuotaFull = isFreePlan && novels.length >= FREE_PLAN_LIMIT
  const today = new Date().toISOString().slice(0, 10)
  const canClaimDaily = lastDailyClaim !== today

  // Mouse wheel horizontal scrolling over the bookshelf
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 0.95
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -360 : 360
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e) => {
    // Avoid triggering drag when clicking directly on buttons
    if (e.target.closest('button, input, textarea, a, select')) return
    if (!scrollRef.current) return
    isDraggingRef.current = true
    setIsDragging(true)
    startXRef.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startXRef.current) * 1.4
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk
  }

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false
    setIsDragging(false)
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const success = createNovel({
      title: newTitle.trim(),
      genre: newGenre,
      synopsis: newSynopsis.trim()
    })
    if (success) {
      setNewTitle('')
      setNewSynopsis('')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0d091a] text-slate-100 flex flex-col font-sans relative overflow-x-hidden overflow-y-auto">
      {/* 3D Ambient Background Shards - Full-Screen Fixed Across Workspace */}
      <AeroShardsCanvas />

      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <header className="h-16 px-6 border-b border-white/10 bg-[#120d22]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img
            src="/Logo/PlottrixSingleLogo.png"
            alt="Plottrix Logo"
            className="w-8 h-8 rounded-lg shadow-md cursor-pointer hover:scale-105 transition"
            onClick={() => navigateTo('home')}
          />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
              Plottrix
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Trix Balance Indicator */}
          <WarmTooltip content="ยอดเหรียญ Trix คงเหลือสำหรับใช้ AI" side="bottom">
            <button
              type="button"
              onClick={() => setActiveModal('pricing')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition"
            >
              <span className="text-amber-300 font-bold">🪙 {trixBalance}</span>
              <span className="text-[10px] text-plottrix-muted">Trix</span>
            </button>
          </WarmTooltip>

          {/* Daily Trix Claim */}
          <WarmTooltip content={canClaimDaily ? 'กดรับฟรี +3 Trix ประจำวัน' : 'รับเหรียญของวันนี้ไปแล้ว'} side="bottom">
            <button
              type="button"
              onClick={claimDailyTrix}
              disabled={!canClaimDaily}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                canClaimDaily
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20 hover:scale-105'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-default'
              }`}
            >
              <span>🎁</span>
              <span>{canClaimDaily ? 'รับ Trix รายวัน' : 'รับแล้ว'}</span>
            </button>
          </WarmTooltip>

          {/* Plan Badge */}
          <WarmTooltip content="คลิกเพื่ออัปเกรดหรือจัดการแพ็กเกจ" side="bottom">
            <button
              type="button"
              onClick={() => setActiveModal('pricing')}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 hover:bg-purple-500/30 transition"
            >
              {plan}
            </button>
          </WarmTooltip>

          {/* Help / Tour */}
          <WarmTooltip content="เปิดคู่มือแนะนำการใช้งาน (Tour)" side="bottom">
            <button
              type="button"
              onClick={startTour}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-purple-300 border border-white/10 transition"
            >
              ?
            </button>
          </WarmTooltip>

          {/* Settings */}
          <WarmTooltip content="การตั้งค่าระบบ" side="bottom">
            <button
              type="button"
              onClick={() => setActiveModal('settings')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-slate-300 border border-white/10 transition"
            >
              ⚙
            </button>
          </WarmTooltip>

          {/* Back to Home */}
          <WarmTooltip content="กลับสู่หน้าแรกเว็บไซต์" side="bottom">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition"
            >
              หน้าแรก
            </button>
          </WarmTooltip>
        </div>
      </header>

      {/* Main Workspace Home Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col justify-center relative z-10">
        {/* Welcome Banner */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-400/25 text-purple-300 mb-3">
              <span>✦</span> ยินดีต้อนรับสู่สตูดิโองานเขียน
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome To Workspace
            </h1>
            <p className="text-sm text-plottrix-muted mt-2 max-w-xl leading-relaxed">
              เลือกนิยายที่ต้องการเขียนต่อจากชั้นวางด้านล่าง หรือเริ่มสร้างผลงานเรื่องใหม่พร้อมระบบผู้ช่วยนักเขียน AI คุมความต่อเนื่องและคลังคำศัพท์เฉพาะแนว
            </p>
          </div>

          {/* Quota Indicator */}
          <div className="bg-[#17112a] p-4 rounded-2xl border border-white/10 min-w-[260px] shadow-lg">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-plottrix-muted">โควต้านิยาย ({plan})</span>
              <span className="font-bold text-purple-300">
                {isFreePlan ? `${novels.length} / ${FREE_PLAN_LIMIT} เรื่อง` : `${novels.length} เรื่อง (ไม่จำกัด)`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isQuotaFull ? 'bg-amber-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                style={{ width: isFreePlan ? `${Math.min(100, (novels.length / FREE_PLAN_LIMIT) * 100)}%` : '100%' }}
              />
            </div>
            {isQuotaFull ? (
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="text-amber-400 font-semibold">ครบโควต้า Free Plan แล้ว ({novels.length}/{FREE_PLAN_LIMIT})</span>
                <button
                  type="button"
                  onClick={() => setActiveModal('pricing')}
                  className="font-bold text-purple-400 hover:text-purple-300 underline cursor-pointer"
                >
                  อัปเกรด Pro++
                </button>
              </div>
            ) : isFreePlan ? (
              <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                ✓ สามารถสร้างเพิ่มได้อีก {FREE_PLAN_LIMIT - novels.length} เรื่อง
              </p>
            ) : (
              <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                ✓ สมาชิก {plan} สิทธิ์สร้างผลงานไม่จำกัด
              </p>
            )}
          </div>
        </div>

        {/* Novel Shelf Carousel Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📚</span> ชั้นวางนิยายของคุณ ({novels.length})
            </h2>
            <p className="text-xs text-plottrix-muted mt-0.5">
              เลือกผลงานเพื่อเข้าสู่ห้องเขียนงาน Studio หรือเริ่มสร้างเรื่องใหม่
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tour-target-create-novel"
              type="button"
              onClick={() => {
                if (isQuotaFull) {
                  setActiveModal('pricing')
                } else {
                  setIsCreating(true)
                }
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>สร้างนิยายเรื่องใหม่</span>
            </button>

            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-sm transition cursor-pointer"
              aria-label="Scroll left"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-sm transition cursor-pointer"
              aria-label="Scroll right"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Book Shelf (ตรงตามแบบวาด 3 เล่มบนชั้นวาง) */}
        <div className="relative w-full">
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex items-stretch justify-start gap-6 sm:gap-8 overflow-x-auto pb-6 pt-2 scroll-smooth select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#9333ea rgba(255,255,255,0.08)'
            }}
          >
            {/* Empty Bookshelf State if user deleted all novels */}
            {novels.length === 0 && (
              <div className="w-full max-w-lg mx-auto my-6 py-10 px-6 rounded-3xl border border-white/10 bg-[#16102a]/60 backdrop-blur-md text-center flex flex-col items-center shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl mb-3 shadow-inner">
                  📚
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  ยังไม่มีนิยายในชั้นวางของคุณ
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
                  คุณได้ลบนิยายทั้งหมดแล้ว เริ่มต้นสร้างผลงานชิ้นใหม่เพื่อร่วมเขียนกับ AI ผู้ช่วยบรรณาธิการ
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition cursor-pointer"
                >
                  + สร้างนิยายเรื่องแรก
                </button>
              </div>
            )}

            {/* Cards: Novels on the Shelf */}
            {novels.map((novel, index) => (
              <article
                key={novel.id}
                id={index === 0 ? 'tour-target-novel-card' : undefined}
                className="w-64 sm:w-72 md:w-80 shrink-0 rounded-2xl border border-white/15 bg-gradient-to-b from-[#1b1433] to-[#110d22] p-5 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:border-purple-400/50 hover:-translate-y-2 transition-all duration-300 group relative"
              >
                <div>
                  {/* Book Cover 3:4 */}
                  <div
                    className="w-full h-64 rounded-xl overflow-hidden relative mb-4 shadow-md bg-gradient-to-br from-purple-950/60 via-[#16102a] to-indigo-950/60 border border-white/10 cursor-pointer"
                    onClick={() => openNovel(novel.id)}
                  >
                    <img
                      src={novel.cover}
                      alt={novel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600/80 text-white w-fit backdrop-blur-sm mb-1.5 border border-purple-400/30">
                        {novel.genre}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 leading-snug">
                        {novel.title}
                      </h3>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-plottrix-muted px-1">
                    <div className="flex items-center justify-between">
                      <span>จำนวนบท:</span>
                      <span className="text-slate-200 font-semibold">{novel.chapterCount || novel.chapters?.length || 1} ตอน</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>คำบรรยาย:</span>
                      <span className="text-slate-200 font-semibold">{novel.wordCount || 1420} คำ</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                      <span>แก้ไขล่าสุด:</span>
                      <span className="text-purple-300">{novel.updatedAt || 'วันนี้'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openNovel(novel.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>✍️</span>
                    <span>เปิดทำงาน (Open Studio)</span>
                  </button>
                  <WarmTooltip content="ลบนิยายเรื่องนี้" side="top">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setNovelToDelete(novel)
                      }}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      🗑
                    </button>
                  </WarmTooltip>
                </div>
              </article>
            ))}

            {/* Additional Slot: สร้างเรื่องใหม่ slot card */}
            <div
              className="w-64 sm:w-72 md:w-80 shrink-0 rounded-2xl border-2 border-dashed border-white/20 hover:border-purple-400/60 bg-[#16102a]/30 hover:bg-[#16102a]/70 transition-all duration-300 p-6 flex flex-col items-center justify-center text-center cursor-pointer group shadow-lg"
              onClick={() => {
                if (isQuotaFull) {
                  setActiveModal('pricing')
                } else {
                  setIsCreating(true)
                }
              }}
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 group-hover:bg-purple-500/20 flex items-center justify-center text-2xl text-purple-300 transition-all duration-300 mb-4 shadow-inner">
                +
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-purple-300 transition">
                เพิ่มเรื่องใหม่
              </h3>
              <p className="text-xs text-plottrix-muted mt-2 leading-relaxed">
                {isQuotaFull
                  ? `โควต้า Free Plan จำกัด ${FREE_PLAN_LIMIT} เรื่อง กรุณาอัปเกรด`
                  : 'คลิกเพื่อตั้งชื่อเรื่องและเปิดห้องเขียนใหม่'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Create Novel */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#16102a] border border-white/20 p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>📖</span> สร้างนิยายเรื่องใหม่
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  ชื่อเรื่องนิยาย <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น มนตราเงามรณะ, บันทึกลับราชสำนัก..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  แนวเรื่อง (Genre)
                </label>
                <div className="relative">
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1f1638] border border-white/15 text-white text-sm outline-none appearance-none cursor-pointer focus:border-purple-400 transition"
                  >
                    <option value="แฟนตาซี / กำลังภายใน">แฟนตาซี / กำลังภายใน</option>
                    <option value="สยองขวัญ / ระทึกขวัญ">สยองขวัญ / ระทึกขวัญ</option>
                    <option value="สืบสวนสอบสวน">สืบสวนสอบสวน</option>
                    <option value="โรแมนติก / ดราม่า">โรแมนติก / ดราม่า</option>
                    <option value="ไซไฟ / โลกอนาคต">ไซไฟ / โลกอนาคต</option>
                    <option value="พีเรียด / ประวัติศาสตร์">พีเรียด / ประวัติศาสตร์</option>
                    <option value="เกิดใหม่ / ต่างโลก (Isekai)">เกิดใหม่ / ต่างโลก (Isekai)</option>
                  </select>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    ▼
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  เรื่องย่อสั้นๆ (Synopsis)
                </label>
                <textarea
                  rows={3}
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  placeholder="เกริ่นนำปมเรื่องและแก่นหลักสั้นๆ เพื่อให้ AI ช่วยคุมทิศทาง..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-xs outline-none transition resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition"
                >
                  เริ่มสร้างผลงาน →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Modal: Delete Novel Confirmation */}
      {novelToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#16102a] border border-red-500/30 p-6 shadow-2xl animate-fade-in text-center">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-2xl text-red-400 shadow-inner">
              ⚠️
            </div>
            <h3 className="font-bold text-base text-white mb-2">
              ยืนยันการลบนิยายเรื่องนี้?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบนิยายเรื่อง <span className="text-purple-300 font-bold">"{novelToDelete.title}"</span>? การดำเนินการนี้จะลบเนื้อหาและข้อมูลตัวละครทั้งหมดออกจากคลังของคุณอย่างถาวร
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setNovelToDelete(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteNovel(novelToDelete.id)
                  setNovelToDelete(null)
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                ลบนิยายถาวร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
