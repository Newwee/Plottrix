import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { togglePublishStory } from '../../lib/publicStoriesService'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'
import confetti from 'canvas-confetti'

export default function PublishModal() {
  const {
    activeModal,
    setActiveModal,
    novels,
    setNovels,
    activeNovelId,
    activeNovel,
    chapters: studioChapters,
    addToast
  } = useApp()
  const { user, profile } = useAuth()

  const isOpen = activeModal === 'publish'
  const targetNovel = activeNovel || novels.find(n => n.id === activeNovelId) || novels[0] || null

  const [activeTab, setActiveTab] = useState('chapters') // 'chapters' | 'info'
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [arcName, setArcName] = useState('ARC 1: เงินที่หายไป (ตอนที่ 1–11)')
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  // Chapter Selection for Snapshot Staging
  const [selectedChapterIds, setSelectedChapterIds] = useState(new Set())

  // Populate data when modal opens
  useEffect(() => {
    if (targetNovel) {
      setTitle(targetNovel.title || '')
      setGenre(targetNovel.genre || 'ระทึกขวัญ / สืบสวน')
      setSynopsis(targetNovel.synopsis || '')
      setCoverUrl(targetNovel.cover || targetNovel.cover_url || '')
      setIsPublished(Boolean(targetNovel.is_published))
      setArcName(targetNovel.published_arc || targetNovel.published_snapshot?.arc_name || 'ARC 1: เงินที่หายไป (ตอนที่ 1–11)')
      setAuthorName(
        targetNovel.author_display_name ||
        profile?.display_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'นักเขียน Plottrix'
      )

      // Initialize selected chapters from previous snapshot, or default to all current studio chapters
      const prevSnap = targetNovel.published_snapshot?.chapters
      if (Array.isArray(prevSnap) && prevSnap.length > 0) {
        const snapIds = new Set(prevSnap.map(c => c.id))
        setSelectedChapterIds(snapIds)
      } else if (Array.isArray(studioChapters) && studioChapters.length > 0) {
        // Default to first 11 chapters (ARC 1) or all if <= 11
        const defaultCount = Math.min(11, studioChapters.length)
        const initialIds = new Set(studioChapters.slice(0, defaultCount).map(c => c.id))
        setSelectedChapterIds(initialIds)
      }
    }
  }, [targetNovel, profile, user, isOpen, studioChapters])

  // Previously published chapter IDs for comparison
  const previouslyPublishedIds = useMemo(() => {
    const prevSnap = targetNovel?.published_snapshot?.chapters
    if (Array.isArray(prevSnap)) {
      return new Set(prevSnap.map(c => c.id))
    }
    return new Set()
  }, [targetNovel?.published_snapshot])

  if (!isOpen || !targetNovel) return null

  // Selection toggles
  const handleToggleChapter = (chId) => {
    setSelectedChapterIds(prev => {
      const next = new Set(prev)
      if (next.has(chId)) {
        next.delete(chId)
      } else {
        next.add(chId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedChapterIds(new Set(studioChapters.map(c => c.id)))
  }

  const handleSelectArc1 = () => {
    const arc1Count = Math.min(11, studioChapters.length)
    setSelectedChapterIds(new Set(studioChapters.slice(0, arc1Count).map(c => c.id)))
    setArcName('ARC 1: เงินที่หายไป (ตอนที่ 1–11)')
  }

  const handleDeselectAll = () => {
    setSelectedChapterIds(new Set())
  }

  // Handle Publish / Update Snapshot
  const handlePublishRelease = async () => {
    if (selectedChapterIds.size === 0) {
      addToast({
        title: 'กรุณาเลือกอย่างน้อย 1 ตอน',
        description: 'เลือกตอนที่คุณต้องการปล่อยให้นักอ่านเข้าชมในเวอร์ชันนี้',
        fuseColor: '#eab308'
      })
      return
    }

    setSaving(true)

    // Freeze snapshot of selected chapters
    const frozenChapters = studioChapters
      .filter(ch => selectedChapterIds.has(ch.id))
      .map((ch, idx) => ({
        id: ch.id,
        number: idx + 1,
        title: ch.title || `บทที่ ${idx + 1}`,
        pages: ch.pages || [''],
        word_count: ch.wordCount || ch.word_count || 0
      }))

    const snapshot = {
      version: (targetNovel.published_snapshot?.version || 0) + 1,
      published_at: new Date().toISOString(),
      arc_name: arcName.trim() || 'ARC 1',
      published_chapter_count: frozenChapters.length,
      chapters: frozenChapters
    }

    const result = await togglePublishStory(targetNovel.id, true, {
      title,
      genre,
      synopsis,
      author_display_name: authorName,
      cover_url: coverUrl,
      published_arc: snapshot.arc_name,
      published_snapshot: snapshot
    })

    setSaving(false)

    if (result.success) {
      setIsPublished(true)

      // Update state in novels list
      setNovels(prev => prev.map(n => {
        if (n.id === targetNovel.id) {
          return {
            ...n,
            title,
            genre,
            synopsis,
            author_display_name: authorName,
            is_published: true,
            published_at: new Date().toISOString(),
            published_arc: snapshot.arc_name,
            published_snapshot: snapshot
          }
        }
        return n
      }))

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#74d9b4', '#a855f7', '#6366f1']
      })

      addToast({
        title: 'เผยแพร่ / อัปเดตเวอร์ชันสำเร็จ! 🚀',
        description: `ตรึง Snapshot ทั้งหมด ${frozenChapters.length} ตอนเรียบร้อย — นักอ่านจะเห็นเฉพาะเวอร์ชันนี้ ไม่ต้องกังวลเรื่องการแก้ไขร่างสดใน Studio`,
        fuseColor: '#74d9b4'
      })
    } else {
      const isMissingCol = result.error?.includes('author_display_name') || result.error?.includes('is_published') || result.error?.includes('schema cache')
      addToast({
        title: 'เกิดข้อผิดพลาดในการบันทึกสถานะ',
        description: isMissingCol
          ? 'ฐานข้อมูล Supabase ยังไม่มีคอลัมน์เผยแพร่ — กรุณารันคำสั่ง SQL Migration ใน Supabase SQL Editor'
          : (result.error || 'กรุณาลองใหม่อีกครั้ง'),
        fuseColor: '#ef4444'
      })
    }
  }

  // Handle Unpublish (Change back to Private Draft)
  const handleUnpublish = async () => {
    setSaving(true)
    const result = await togglePublishStory(targetNovel.id, false, {
      title,
      genre,
      synopsis,
      author_display_name: authorName,
      cover_url: coverUrl
    })

    setSaving(false)

    if (result.success) {
      setIsPublished(false)
      setNovels(prev => prev.map(n => {
        if (n.id === targetNovel.id) {
          return {
            ...n,
            is_published: false
          }
        }
        return n
      }))

      addToast({
        title: 'ปรับสถานะเป็นฉบับร่างส่วนตัวแล้ว 🔒',
        description: 'นิยายเรื่องนี้จะไม่ปรากฏบนหน้าหลักอีกต่อไป มีเพียงคุณที่เข้าถึงได้ใน Studio',
        fuseColor: '#e9c78c'
      })
    } else {
      addToast({
        title: 'เกิดข้อผิดพลาดในการยกเลิกเผยแพร่',
        description: result.error || 'กรุณาลองใหม่อีกครั้ง',
        fuseColor: '#ef4444'
      })
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto font-thai">
        {/* Backdrop */}
        <motion.div
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          variants={modalContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-2xl rounded-3xl flex flex-col overflow-hidden border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] bg-[#120d22]/98 text-white my-auto backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-purple-500/20 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 flex items-center justify-center text-xl shadow-inner">
                🌐
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <span>ศูนย์จัดการการเผยแพร่ (Release Manager)</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isPublished
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <span>{isPublished ? 'เผยแพร่อยู่บนหน้าหลัก' : 'ฉบับร่างส่วนตัว'}</span>
                  </span>
                </h3>
                <p className="text-xs text-plottrix-muted">
                  เลือกตอนที่ต้องการปล่อยสู่สาธารณะ — ควบคุมเวอร์ชันได้เอง ไม่มีการอัปเดตแบบ Realtime ขณะแต่งสด
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-8 h-8 rounded-xl hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-base transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 border-b border-white/10 flex items-center gap-4 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setActiveTab('chapters')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'chapters'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>📑</span>
              <span>เลือกตอนที่ต้องการปล่อย ({selectedChapterIds.size}/{studioChapters?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'info'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>✏️</span>
              <span>ข้อมูลเรื่อง &amp; ผู้แต่ง</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {activeTab === 'chapters' ? (
              <div className="space-y-4">
                {/* Arc & Release Name Input */}
                <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/20">
                  <label className="block text-xs font-bold text-purple-300 mb-1.5 flex items-center gap-1.5">
                    <span>🏷️</span>
                    <span>ชื่องวด / ARC ที่ปล่อยในเวอร์ชันนี้:</span>
                  </label>
                  <input
                    type="text"
                    value={arcName}
                    onChange={(e) => setArcName(e.target.value)}
                    placeholder="เช่น ARC 1: เงินที่หายไป (ตอนที่ 1–11)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs sm:text-sm focus:border-purple-400 outline-none transition"
                  />
                  <p className="text-[11px] text-plottrix-muted mt-1.5">
                    ชื่อนี้จะแสดงบนการ์ดนิยาย และแจ้งเตือนนักอ่านเมื่อมีการอัปเดต ARC ใหม่เข้ามา
                  </p>
                </div>

                {/* Staging Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
                  <div className="text-xs text-slate-300">
                    เลือกปล่อย: <strong className="text-purple-300">{selectedChapterIds.size}</strong> จากทั้งหมด {studioChapters?.length || 0} ตอน
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectArc1}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-[11px] text-purple-300 font-bold transition cursor-pointer"
                    >
                      เลือก ARC 1 (ตอน 1–11)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 transition cursor-pointer"
                    >
                      เลือกทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-400 transition cursor-pointer"
                    >
                      ยกเลิกทั้งหมด
                    </button>
                  </div>
                </div>

                {/* Safety Guarantee Notice */}
                <div className="p-3 rounded-xl bg-purple-900/25 border border-purple-500/30 text-[11px] text-purple-200 leading-relaxed flex items-start gap-2">
                  <span className="text-sm">🛡️</span>
                  <span>
                    <strong>ระบบตรึง Release Snapshot:</strong> ผู้อ่านจะเห็นเฉพาะเนื้อหาตอนที่คุณติ๊กถูกด้านล่างนี้เท่านั้น ตอนที่เหลือ (เช่น ตอนที่ 12–22 หรือฉบับร่างที่กำลังพิมพ์ต่อ) จะถูกเก็บเป็นความลับใน Studio ของคุณโดยไม่มีการปล่อยแบบ Realtime
                  </span>
                </div>

                {/* Chapter List */}
                <div className="space-y-2 mt-2">
                  {studioChapters && studioChapters.length > 0 ? (
                    studioChapters.map((ch, idx) => {
                      const isSelected = selectedChapterIds.has(ch.id)
                      const wasLive = previouslyPublishedIds.has(ch.id)
                      const wordCount = ch.wordCount || ch.word_count || 0

                      return (
                        <div
                          key={ch.id}
                          onClick={() => handleToggleChapter(ch.id)}
                          className={`px-4 py-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-purple-600/20 border-purple-500/50 text-white'
                              : 'bg-white/[0.03] hover:bg-white/5 border-white/5 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                            />
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 text-purple-300">
                              #{String(ch.number || idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold truncate text-white">
                              {ch.title || `บทที่ ${idx + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-plottrix-muted hidden sm:inline">
                              {wordCount.toLocaleString()} คำ
                            </span>

                            {wasLive ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                                🟢 เคยปล่อยแล้ว
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-semibold">
                                🟡 ร่างใหม่
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-plottrix-muted">
                      ไม่พบตอนในนิยายเรื่องนี้
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TAB 2: METADATA & AUTHOR INFO */
              <div className="space-y-4">
                {/* Story Title Input */}
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    ชื่อเรื่องนิยาย
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ระบุชื่อเรื่องนิยายของคุณ..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/30 text-white text-xs sm:text-sm focus:border-purple-400 focus:bg-white/10 outline-none transition"
                  />
                </div>

                {/* Author Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    นามปากกา / ชื่อผู้แต่ง (แสดงบนหน้านิยาย)
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="นามปากกาของคุณ..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/30 text-white text-xs sm:text-sm focus:border-purple-400 focus:bg-white/10 outline-none transition"
                  />
                </div>

                {/* Genre Input */}
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    หมวดหมู่นิยาย
                  </label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="เช่น ระทึกขวัญ / สืบสวน, แฟนตาซี..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/30 text-white text-xs sm:text-sm focus:border-purple-400 focus:bg-white/10 outline-none transition"
                  />
                </div>

                {/* Synopsis Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    คำโปรย / เรื่องย่อสั้น (Synopsis)
                  </label>
                  <textarea
                    rows={3}
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    placeholder="เขียนเรื่องย่อดึงดูดใจนักอ่านสั้นๆ..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/30 text-white text-xs sm:text-sm focus:border-purple-400 focus:bg-white/10 outline-none transition resize-none leading-relaxed"
                  />
                </div>

                {/* Notice */}
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200/90 leading-relaxed">
                  ✦ <strong>ระบบความปลอดภัย &amp; ลิขสิทธิ์:</strong> เมื่อเผยแพร่นักอ่านทั่วไปสามารถอ่านบทที่ 1-5 ได้ฟรีโดยไม่ต้องสมัครสมาชิก สำหรับบทที่ 6 เป็นต้นไป ระบบจะบังคับให้สมัครสมาชิกเพื่ออ่านต่อฟรี
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-purple-500/20 bg-plottrix-panel2/60 flex items-center justify-between gap-3">
            <div>
              {isPublished && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleUnpublish}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/15 border border-rose-500/30 transition cursor-pointer"
                >
                  🔒 ปรับเป็นฉบับร่าง (ยกเลิกเผยแพร่)
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>

              <button
                type="button"
                disabled={saving || selectedChapterIds.size === 0}
                onClick={handlePublishRelease}
                className="px-6 py-2.5 rounded-xl font-black text-xs shadow-xl transition flex items-center gap-2 cursor-pointer bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white shadow-purple-600/30 disabled:opacity-50"
              >
                {saving ? (
                  <span>กำลังบันทึก Snapshot...</span>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>
                      {isPublished
                        ? `อัปเดตเวอร์ชันที่เผยแพร่ (${selectedChapterIds.size} ตอน)`
                        : `เผยแพร่งวดนี้ (${selectedChapterIds.size} ตอน)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
