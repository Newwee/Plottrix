import React, { useState, useEffect } from 'react'
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
    addToast
  } = useApp()
  const { user, profile } = useAuth()

  const isOpen = activeModal === 'publish'
  const targetNovel = activeNovel || novels.find(n => n.id === activeNovelId) || novels[0] || null

  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  // Populate data when modal opens
  useEffect(() => {
    if (targetNovel) {
      setTitle(targetNovel.title || '')
      setGenre(targetNovel.genre || 'แฟนตาซี / กำลังภายใน')
      setSynopsis(targetNovel.synopsis || '')
      setCoverUrl(targetNovel.cover || targetNovel.cover_url || '')
      setIsPublished(Boolean(targetNovel.is_published))
      setAuthorName(
        targetNovel.author_display_name ||
        profile?.display_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'นักเขียน Plottrix'
      )
    }
  }, [targetNovel, profile, user, isOpen])

  if (!isOpen || !targetNovel) return null

  const handleTogglePublish = async (nextState) => {
    setSaving(true)
    const result = await togglePublishStory(targetNovel.id, nextState, {
      title,
      genre,
      synopsis,
      author_display_name: authorName,
      cover_url: coverUrl
    })

    setSaving(false)

    if (result.success) {
      setIsPublished(nextState)

      // Update state in novels list
      setNovels(prev => prev.map(n => {
        if (n.id === targetNovel.id) {
          return {
            ...n,
            title,
            genre,
            synopsis,
            author_display_name: authorName,
            is_published: nextState,
            published_at: nextState ? new Date().toISOString() : null
          }
        }
        return n
      }))

      if (nextState) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#74d9b4', '#a855f7', '#6366f1']
        })
        addToast({
          title: 'เผยแพร่นิยายขึ้นหน้าหลักสำเร็จ! 🌐',
          description: 'ผู้อ่านทั่วประเทศสามารถเริ่มอ่านผลงานของคุณได้ทันทีบนหน้าค้นหานิยาย',
          fuseColor: '#74d9b4'
        })
      } else {
        addToast({
          title: 'ปรับสถานะเป็นฉบับร่างส่วนตัวแล้ว',
          description: 'นิยายเรื่องนี้จะไม่ปรากฏบนหน้าหลักอีกต่อไป มีเพียงคุณที่เข้าถึงได้',
          fuseColor: '#e9c78c'
        })
      }
    } else {
      const isMissingCol = result.error?.includes('author_display_name') || result.error?.includes('is_published') || result.error?.includes('schema cache')
      addToast({
        title: 'เกิดข้อผิดพลาดในการบันทึกสถานะ',
        description: isMissingCol
          ? 'ฐานข้อมูล Supabase ยังไม่มีคอลัมน์เผยแพร่ (is_published) — กรุณารันคำสั่ง SQL Migration ใน Supabase SQL Editor'
          : (result.error || 'กรุณาลองใหม่อีกครั้ง'),
        fuseColor: '#ef4444'
      })
    }
  }

  return (
    <AnimatePresence>
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

        {/* Modal Window */}
        <motion.div
          variants={modalContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-xl rounded-3xl flex flex-col overflow-hidden border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] bg-[#120d22]/95 text-white my-auto backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-purple-500/20 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 flex items-center justify-center text-xl shadow-inner">
                🌐
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <span>เผยแพร่นิยายสู่หน้าหลัก</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isPublished
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <span>{isPublished ? 'เผยแพร่แล้ว' : 'ฉบับร่างส่วนตัว'}</span>
                  </span>
                </h3>
                <p className="text-xs text-plottrix-muted">
                  ตั้งค่าการเผยแพร่เพื่อให้นักอ่านทั่วไปสามารถค้นพบและอ่านนิยายเรื่องนี้ได้
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

          {/* Body Fields */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* 1. Toggle Banner */}
            <div className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
              isPublished
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-white/5 border-white/10'
            }`}>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>สถานะการแสดงผล:</span>
                  <span className={isPublished ? 'text-emerald-300 font-extrabold' : 'text-slate-300'}>
                    {isPublished ? 'สาธารณะบนหน้าหลัก (Public)' : 'เก็บเป็นฉบับร่างส่วนตัว (Private Draft)'}
                  </span>
                </div>
                <p className="text-[11px] text-plottrix-muted mt-0.5">
                  {isPublished
                    ? 'นิยายของคุณจะปรากฏในหน้าสำรวจนิยาย (/read) ให้นักอ่านทุกคนอ่านฟรี 5 ตอนแรก'
                    : 'เฉพาะคุณที่มองเห็นและแก้ไขนิยายเรื่องนี้ใน Workspace ได้'}
                </p>
              </div>

              {/* Big Switch Button */}
              <button
                type="button"
                disabled={saving}
                onClick={() => handleTogglePublish(!isPublished)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPublished ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isPublished ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. Story Title Input */}
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

            {/* 3. Author Name Input */}
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

            {/* 4. Genre Input */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1">
                หมวดหมู่นิยาย
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="เช่น แฟนตาซี, ระทึกขวัญ, โรแมนติก..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/30 text-white text-xs sm:text-sm focus:border-purple-400 focus:bg-white/10 outline-none transition"
              />
            </div>

            {/* 5. Synopsis Textarea */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1">
                คำโปรย / เรื่องย่อสั้น (Synopsis)
              </label>
              <textarea
                rows={3}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="เขียนเรื่องย่อดึงดูดใจนักอ่านสั้นๆ 2-3 ประโยค..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/30 text-white text-xs sm:text-sm focus:border-purple-400 focus:bg-white/10 outline-none transition resize-none leading-relaxed"
              />
            </div>

            {/* Notice */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200/90 leading-relaxed">
              ✦ <strong>ระบบความปลอดภัย &amp; ลิขสิทธิ์:</strong> เมื่อเผยแพร่นักอ่านทั่วไปสามารถอ่านบทที่ 1-5 ได้ฟรีโดยไม่ต้องสมัครสมาชิก สำหรับบทที่ 6 เป็นต้นไป ระบบจะบังคับให้สมัครสมาชิกเพื่ออ่านต่อฟรี
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-purple-500/20 bg-plottrix-panel2/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2.5 rounded-xl hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleTogglePublish(!isPublished)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer ${
                isPublished
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black shadow-emerald-500/20'
              }`}
            >
              {saving ? (
                <span>กำลังบันทึก...</span>
              ) : isPublished ? (
                <>
                  <span>🔒</span>
                  <span>ยกเลิกการเผยแพร่ (เปลี่ยนเป็นฉบับร่าง)</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>เผยแพร่ขึ้นหน้าหลักทันที</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
