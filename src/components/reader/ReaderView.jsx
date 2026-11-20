import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import AeroShardsCanvas from '../workspace/AeroShardsCanvas'
import { fetchStoryById, fetchStoryChapters } from '../../lib/publicStoriesService'
import { fetchComments, addComment } from '../../lib/commentsService'

export default function ReaderView({ storyId: propStoryId, chapterIndex = 1 }) {
  const { navigateTo, setActiveModal, addToast, activeReadStoryId } = useApp()
  const { user, profile } = useAuth()

  const storyId = propStoryId || activeReadStoryId || (typeof window !== 'undefined' ? window.location.pathname.split('/read/')[1]?.split('/')[0] : '')

  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  // Reader Settings (persisted)
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('plottrix_reader_font_size') || '18', 10)
  })
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('plottrix_reader_theme') || 'obsidian' // 'obsidian' | 'sepia' | 'light'
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Comments State
  const [comments, setComments] = useState([])
  const [newCommentName, setNewCommentName] = useState(() => {
    return profile?.display_name || user?.user_metadata?.full_name || ''
  })
  const [newCommentText, setNewCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Save preferences
  useEffect(() => {
    localStorage.setItem('plottrix_reader_font_size', fontSize.toString())
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('plottrix_reader_theme', theme)
  }, [theme])

  // Sync user display name into comment input if logged in
  useEffect(() => {
    if (user && (profile?.display_name || user.user_metadata?.full_name)) {
      setNewCommentName(profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0])
    }
  }, [user, profile])

  // Load Story & Chapters
  useEffect(() => {
    if (!storyId) return
    let isMounted = true

    async function loadData() {
      setLoading(true)
      const storyData = await fetchStoryById(storyId)
      const chaptersData = await fetchStoryChapters(storyId, Boolean(user))

      if (isMounted) {
        setStory(storyData)
        setChapters(chaptersData)
        setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [storyId, Boolean(user)])

  // Current Chapter helper
  const currentChapter = chapters[currentChapterIdx] || chapters[0] || null
  const currentChapterNumber = currentChapter?.number || (currentChapterIdx + 1)
  const isLocked = !user && currentChapterNumber > 5

  // Load Comments for current chapter / story
  useEffect(() => {
    if (!storyId) return
    let isMounted = true

    async function loadComments() {
      const list = await fetchComments(storyId, currentChapter?.id || null)
      if (isMounted) setComments(list)
    }

    loadComments()
    return () => { isMounted = false }
  }, [storyId, currentChapter?.id])

  // Scroll to top when changing chapter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentChapterIdx])

  const handleNextChapter = () => {
    if (currentChapterIdx < chapters.length - 1) {
      setCurrentChapterIdx(prev => prev + 1)
    }
  }

  const handlePrevChapter = () => {
    if (currentChapterIdx > 0) {
      setCurrentChapterIdx(prev => prev - 1)
    }
  }

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newCommentText.trim()) return

    const name = newCommentName.trim() || 'ผู้อ่านทั่วไป'
    setSubmittingComment(true)

    const result = await addComment({
      storyId,
      chapterId: currentChapter?.id || null,
      userId: user?.id || null,
      commenterName: name,
      content: newCommentText.trim()
    })

    setSubmittingComment(false)

    if (result.success && result.data) {
      setComments(prev => [result.data, ...prev])
      setNewCommentText('')
      addToast({
        title: 'ส่งความคิดเห็นสำเร็จ! 💬',
        description: 'ขอบคุณที่ร่วมส่งกำลังใจให้นักเขียน',
        fuseColor: '#74d9b4'
      })
    } else {
      addToast({
        title: 'ไม่สามารถส่งความคิดเห็นได้',
        description: result.error || 'กรุณาลองใหม่อีกครั้ง',
        fuseColor: '#ef4444'
      })
    }
  }

  // Theme styling configurations
  const themeClasses = {
    obsidian: {
      page: 'bg-[#0b0816] text-[#e2dcf2]',
      panel: 'bg-[#15102a]/85 border-[#2c224d]',
      text: 'text-[#e6e0f8]',
      dimText: 'text-[#9b8eb9]',
      accent: 'text-purple-300'
    },
    sepia: {
      page: 'bg-[#1e1915] text-[#ecdcc8]',
      panel: 'bg-[#29221b]/90 border-[#4a3b2c]',
      text: 'text-[#f0e4d2]',
      dimText: 'text-[#bda991]',
      accent: 'text-amber-300'
    },
    light: {
      page: 'bg-[#f7f5f0] text-[#242129]',
      panel: 'bg-white/95 border-slate-300 shadow-xl',
      text: 'text-[#1d1b22]',
      dimText: 'text-[#635d6e]',
      accent: 'text-purple-700'
    }
  }[theme]

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0b0816] flex flex-col items-center justify-center text-purple-300">
        <AeroShardsCanvas />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-sm font-semibold tracking-wider">กำลังเปิดหนังสือนิยาย...</span>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-[100dvh] bg-[#0b0816] flex flex-col items-center justify-center text-white px-4 text-center">
        <AeroShardsCanvas />
        <div className="relative z-10 glass-panel p-8 rounded-3xl max-w-md border border-purple-500/30">
          <span className="text-5xl block mb-4">📖</span>
          <h2 className="text-xl font-bold mb-2">ไม่พบนิยายที่คุณต้องการอ่าน</h2>
          <p className="text-xs text-plottrix-muted mb-6 leading-relaxed">
            นิยายเรื่องนี้อาจถูกนักเขียนปรับเป็นฉบับร่างส่วนตัว หรือไม่มีอยู่ในระบบแล้ว
          </p>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
          >
            ← กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`reader-root min-h-[100dvh] relative ${themeClasses.page} transition-colors duration-300 font-thai`}>
      {/* 3D Ambient Background Shards */}
      <AeroShardsCanvas />

      {/* Floating Reader Top Bar */}
      <header className={`sticky top-0 z-40 px-4 sm:px-6 py-3 border-b backdrop-blur-xl flex items-center justify-between gap-3 ${themeClasses.panel}`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition cursor-pointer shrink-0"
            title="กลับสู่หน้าหลัก"
          >
            ←
          </button>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold truncate max-w-[200px] sm:max-w-md">
              {story.title}
            </h1>
            <div className={`text-[11px] truncate flex items-center gap-2 ${themeClasses.dimText}`}>
              <span>โดย {story.authorName}</span>
              <span>•</span>
              <span className="text-purple-400 font-semibold">{currentChapter?.title || `บทที่ ${currentChapterNumber}`}</span>
            </div>
          </div>
        </div>

        {/* Reader Customization Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Chapter Drawer Toggle */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="px-2.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/15 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-500/25 transition cursor-pointer"
          >
            <span>📑</span>
            <span className="hidden sm:inline">สารบัญ ({chapters.length})</span>
          </button>

          {/* Font Size Adjusters */}
          <div className="hidden sm:flex items-center rounded-xl border border-white/10 p-0.5 bg-black/20 text-xs">
            <button
              type="button"
              onClick={() => setFontSize(s => Math.max(14, s - 2))}
              className="px-2 py-1 hover:bg-white/10 rounded-lg font-bold"
              title="ลดขนาดตัวอักษร"
            >
              A-
            </button>
            <span className="px-1.5 text-[10px] font-mono opacity-70">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize(s => Math.min(24, s + 2))}
              className="px-2 py-1 hover:bg-white/10 rounded-lg font-bold"
              title="เพิ่มขนาดตัวอักษร"
            >
              A+
            </button>
          </div>

          {/* Theme Palette Switcher */}
          <div className="flex items-center rounded-xl border border-white/10 p-0.5 bg-black/20 text-xs">
            <button
              type="button"
              onClick={() => setTheme('obsidian')}
              className={`w-6 h-6 rounded-lg transition ${theme === 'obsidian' ? 'ring-2 ring-purple-400 bg-[#0d091a]' : 'bg-[#15102a]'}`}
              title="Dark Obsidian"
            />
            <button
              type="button"
              onClick={() => setTheme('sepia')}
              className={`w-6 h-6 rounded-lg ml-1 transition ${theme === 'sepia' ? 'ring-2 ring-amber-400 bg-[#1e1915]' : 'bg-[#29221b]'}`}
              title="Warm Sepia"
            />
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`w-6 h-6 rounded-lg ml-1 transition ${theme === 'light' ? 'ring-2 ring-purple-600 bg-white' : 'bg-slate-200'}`}
              title="Clean Light"
            />
          </div>
        </div>
      </header>

      {/* Chapter Drawer (Slide-over) */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className={`relative ml-auto z-10 w-full max-w-sm h-full flex flex-col border-l shadow-2xl p-6 ${themeClasses.panel}`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <span>📑</span>
                  <span>สารบัญตอน ({chapters.length} ตอน)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {chapters.map((ch, idx) => {
                  const isCurrent = idx === currentChapterIdx
                  const locked = !user && ch.number > 5
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setCurrentChapterIdx(idx)
                        setDrawerOpen(false)
                      }}
                      className={`w-full text-left px-3.5 py-3 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-purple-600/30 border-purple-500/50 text-white font-bold shadow-md'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-purple-300 mr-2">#{String(ch.number).padStart(2, '0')}</span>
                        <span>{ch.title || `บทที่ ${ch.number}`}</span>
                      </div>
                      {locked ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                          🔒 ล็อค
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold shrink-0">
                          อ่านฟรี
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Reading Column Container */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Chapter Header */}
        <div className="text-center mb-10 pb-8 border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
            <span>บทที่ {currentChapterNumber}</span>
            <span>•</span>
            <span>{story.genre || 'นิยาย'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            {currentChapter?.title || `บทที่ ${currentChapterNumber}`}
          </h2>

          <p className={`text-xs ${themeClasses.dimText}`}>
            เรื่อง: <strong className="text-white">{story.title}</strong> · นามปากกา: {story.authorName}
          </p>
        </div>

        {/* Chapter Content or 5-Chapter Guest Member Gate */}
        {isLocked ? (
          /* ======================================================== */
          /* 5-CHAPTER GUEST FREEMIUM MEMBER GATE CARD               */
          /* ======================================================== */
          <div className="relative rounded-3xl border border-purple-500/40 bg-gradient-to-br from-[#1b1233]/95 via-[#130d24]/95 to-[#0b0816]/95 p-8 sm:p-12 text-center shadow-[0_20px_60px_rgba(147,51,234,0.3)] backdrop-blur-2xl my-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-purple-400/40 flex items-center justify-center text-3xl shadow-lg animate-bounce">
              🔒
            </div>

            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-3">
              อ่านฟรีครบ 5 ตอนแรกแล้ว
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
              สมัครสมาชิกเพื่ออ่านต่อฟรีทุกตอน (ตอนที่ 6 เป็นต้นไป)
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-8">
              คุณอ่านสิทธิ์ฟรีสำหรับผู้เยี่ยมชมทั่วไปครบ 5 ตอนแล้ว — เพียงสมัครสมาชิกหรือเข้าสู่ระบบ Plottrix จะสามารถปลดล็อกอ่านฟรีได้ทุกตอนจนจบเรื่องทันที ไม่ต้องผูกบัตรเครดิต
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveModal('auth')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>✨</span>
                <span>สมัครสมาชิกฟรีเพื่ออ่านต่อ</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('auth')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition cursor-pointer"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        ) : (
          /* Reader Prose Body */
          <article
            className="reader-content space-y-6 select-text"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.95 }}
          >
            {currentChapter?.pages?.map((pageText, pIdx) => (
              <div key={pIdx} className="whitespace-pre-wrap font-normal leading-[1.95]">
                {pageText}
              </div>
            ))}
          </article>
        )}

        {/* Chapter Navigation Buttons */}
        <div className="mt-14 pt-8 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentChapterIdx === 0}
            onClick={handlePrevChapter}
            className={`px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              currentChapterIdx === 0
                ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-md'
            }`}
          >
            <span>←</span>
            <span>ตอนก่อนหน้า</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="px-3 sm:px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-purple-300 transition cursor-pointer"
          >
            สารบัญตอน
          </button>

          <button
            type="button"
            disabled={currentChapterIdx >= chapters.length - 1}
            onClick={handleNextChapter}
            className={`px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              currentChapterIdx >= chapters.length - 1
                ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-purple-600/30'
            }`}
          >
            <span>ตอนถัดไป</span>
            <span>→</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* PERSISTENT COMMENTS SECTION (Open to All Visitors)      */}
        {/* ======================================================== */}
        <section className="mt-16 pt-10 border-t border-white/15">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>💬</span>
                <span>ความคิดเห็นจากนักอ่าน ({comments.length})</span>
              </h3>
              <p className={`text-xs mt-1 ${themeClasses.dimText}`}>
                ร่วมแสดงความคิดเห็น ส่งกำลังใจ หรือวิเคราะห์เนื้อเรื่องกับนักเขียน
              </p>
            </div>
          </div>

          {/* Comment Form */}
          <form onSubmit={handlePostComment} className={`p-5 rounded-3xl border mb-8 ${themeClasses.panel}`}>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                ชื่อผู้แสดงความคิดเห็น
              </label>
              <input
                type="text"
                value={newCommentName}
                onChange={(e) => setNewCommentName(e.target.value)}
                placeholder="ระบุชื่อหรือนามแฝงของคุณ..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-purple-500/30 text-xs sm:text-sm focus:border-purple-400 outline-none transition"
              />
            </div>

            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                ข้อความความคิดเห็น
              </label>
              <textarea
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="เขียนความรู้สึกของคุณต่อตอนนี้..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/30 text-xs sm:text-sm focus:border-purple-400 outline-none transition resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-[10px] ${themeClasses.dimText}`}>
                {user ? `✓ โพสต์ในฐานะสมาชิก: ${newCommentName}` : '✦ โพสต์ในฐานะนักอ่านทั่วไป'}
              </span>

              <button
                type="submit"
                disabled={submittingComment || !newCommentText.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {submittingComment ? <span>กำลังส่ง...</span> : <span>ส่งความคิดเห็น 🚀</span>}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-xs text-plottrix-muted">
                ยังไม่มีความคิดเห็นในตอนนี้ — เป็นคนแรกที่แสดงความคิดเห็นเลย!
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border transition ${themeClasses.panel}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        {c.commenter_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-purple-200">
                        {c.commenter_name}
                      </span>
                      {c.user_id && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                          สมาชิก
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-plottrix-muted">
                      {new Date(c.created_at).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pl-9">
                    {c.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Touch-Friendly Bottom Mobile Navigation Bar */}
      <nav className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-2.5 border-t backdrop-blur-xl flex items-center justify-around gap-2 shadow-2xl ${themeClasses.panel}`}>
        <button
          type="button"
          disabled={currentChapterIdx === 0}
          onClick={handlePrevChapter}
          className="flex-1 py-2 rounded-xl bg-white/5 disabled:opacity-30 text-xs font-bold text-center"
        >
          ← ตอนก่อน
        </button>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex-1 py-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold text-center"
        >
          📑 สารบัญ
        </button>

        <button
          type="button"
          disabled={currentChapterIdx >= chapters.length - 1}
          onClick={handleNextChapter}
          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 disabled:opacity-30 text-white text-xs font-bold text-center shadow-md"
        >
          ตอนถัดไป →
        </button>
      </nav>
    </div>
  )
}
