import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import AeroShardsCanvas from '../workspace/AeroShardsCanvas'
import { fetchStoryById, fetchStoryChapters } from '../../lib/publicStoriesService'
import { fetchComments, addComment } from '../../lib/commentsService'
import confetti from 'canvas-confetti'

export default function ReaderView({ storyId: propStoryId, chapterIndex = 1 }) {
  const { navigateTo, setActiveModal, addToast, activeReadStoryId, activeReadChapterIdx } = useApp()
  const { user, profile } = useAuth()

  const storyId = propStoryId || activeReadStoryId || (typeof window !== 'undefined' ? window.location.pathname.split('/read/')[1]?.split('/')[0] : '')

  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const [savedBookmark, setSavedBookmark] = useState(null)
  const [isArcCompleted, setIsArcCompleted] = useState(false)
  const isInitialRestoredRef = useRef(false)

  // Reader Typography & Comfort Settings (persisted)
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('plottrix_reader_font_size') || '18', 10)
  })
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('plottrix_reader_theme') || 'obsidian' // 'obsidian' | 'sepia' | 'light'
  })
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('plottrix_reader_font') || 'Sarabun'
  })
  const [fontMenuOpen, setFontMenuOpen] = useState(false)
  const [showBackground, setShowBackground] = useState(() => {
    return localStorage.getItem('plottrix_reader_bg_effect') !== 'false'
  })

  const fontMenuRef = useRef(null)

  // Available Thai Typography Choices
  const FONTS = [
    { id: 'Sarabun', name: 'สารบรรณ (Sarabun)', sub: 'ทางการ สะอาดตา อ่านง่าย', css: "'Sarabun', sans-serif" },
    { id: 'Prompt', name: 'พร้อมท์ (Prompt)', sub: 'โมเดิร์น ไร้หัว สไตล์แอพยุคใหม่', css: "'Prompt', sans-serif" },
    { id: 'Noto Serif Thai', name: 'โนโตะ เซอริฟ (Noto Serif)', sub: 'วรรณกรรม คลาสสิก ละเมียดละไม', css: "'Noto Serif Thai', serif" },
    { id: 'IBM Plex Sans Thai', name: 'ไอบีเอ็ม (IBM Plex Thai)', sub: 'โมเดิร์น คมชัด อ่านลื่นไหล', css: "'IBM Plex Sans Thai', sans-serif" },
    { id: 'System', name: 'ฟอนต์ระบบ (System UI)', sub: 'เรียบง่าย มาตรฐานประจำเครื่อง', css: "system-ui, -apple-system, sans-serif" }
  ]

  // Click outside to close font picker
  useEffect(() => {
    const handleOutside = (e) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target)) {
        setFontMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Comments State
  const [comments, setComments] = useState([])
  const [newCommentName, setNewCommentName] = useState(() => {
    return profile?.display_name || user?.user_metadata?.full_name || ''
  })
  const [newCommentText, setNewCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const activeChapterRef = useRef(null)

  // Save preferences
  useEffect(() => {
    localStorage.setItem('plottrix_reader_font_size', fontSize.toString())
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('plottrix_reader_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('plottrix_reader_font', fontFamily)
  }, [fontFamily])

  useEffect(() => {
    localStorage.setItem('plottrix_reader_bg_effect', String(showBackground))
  }, [showBackground])

  // Sync user display name into comment input if logged in
  useEffect(() => {
    if (user && (profile?.display_name || user.user_metadata?.full_name)) {
      setNewCommentName(profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0])
    }
  }, [user, profile])

  // Check completion state on story load
  useEffect(() => {
    if (!storyId) return
    const comp = localStorage.getItem(`plottrix_story_completion_${storyId}`)
    if (comp) {
      try {
        const parsed = JSON.parse(comp)
        if (parsed.completedChapterCount) {
          setIsArcCompleted(true)
        }
      } catch {
        setIsArcCompleted(false)
      }
    }
  }, [storyId])

  // Load Story & Chapters
  useEffect(() => {
    if (!storyId) return
    let isMounted = true

    async function loadData() {
      setLoading(true)
      const storyData = await fetchStoryById(storyId)
      const chaptersData = await fetchStoryChapters(storyId, Boolean(user), storyData)

      if (isMounted) {
        setStory(storyData)
        setChapters(chaptersData)
        setLoading(false)

        // Determine target chapter to resume or jump to
        let targetIdx = 0
        let foundSaved = null

        // Priority 1: Explicit target chapter from navigation (e.g. from Showcase "อ่านต่อ (ตอนที่ 13)")
        if (typeof activeReadChapterIdx === 'number' && activeReadChapterIdx >= 0 && activeReadChapterIdx < chaptersData.length) {
          targetIdx = activeReadChapterIdx
        } else {
          // Priority 2: Manual bookmark set by user
          const rawBookmark = localStorage.getItem(`plottrix_bookmark_${storyId}`)
          if (rawBookmark) {
            try {
              const b = JSON.parse(rawBookmark)
              if (b && typeof b.chapterIdx === 'number' && b.chapterIdx >= 0 && b.chapterIdx < chaptersData.length) {
                targetIdx = b.chapterIdx
                foundSaved = b
              }
            } catch (err) {
              console.warn('[Reader] Parse bookmark failed:', err)
            }
          }

          // Priority 3: Automatic reading progress
          if (foundSaved === null) {
            const rawProgress = localStorage.getItem(`plottrix_read_progress_${storyId}`)
            if (rawProgress) {
              try {
                const prog = JSON.parse(rawProgress)
                if (prog && typeof prog.chapterIdx === 'number' && prog.chapterIdx >= 0 && prog.chapterIdx < chaptersData.length) {
                  targetIdx = prog.chapterIdx
                  foundSaved = prog
                }
              } catch (err) {
                console.warn('[Reader] Parse progress failed:', err)
              }
            }
          }
        }

        // Apply target chapter immediately without requiring clicking banner
        setCurrentChapterIdx(targetIdx)
        if (foundSaved) {
          setSavedBookmark(foundSaved)
        }
        isInitialRestoredRef.current = true

        if (targetIdx > 0) {
          const chNum = chaptersData[targetIdx]?.number || (targetIdx + 1)
          const chTitle = chaptersData[targetIdx]?.title || ''
          addToast({
            title: 'กลับมาอ่านต่อจากจุดเดิม 🔖',
            description: `กำลังเปิด ตอนที่ ${chNum}${chTitle ? `: ${chTitle}` : ''} ตามจุดคั่นของคุณ`,
            fuseColor: '#a855f7'
          })
        }
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [storyId, Boolean(user), activeReadChapterIdx])

  // Current Chapter helper
  const currentChapter = chapters[currentChapterIdx] || chapters[0] || null
  const currentChapterNumber = currentChapter?.number || (currentChapterIdx + 1)
  const isLocked = !user && currentChapterNumber > 5
  const isLastChapter = chapters.length > 0 && currentChapterIdx === chapters.length - 1

  // Auto-save reading progress on chapter change (ONLY after initial restoration has completed!)
  useEffect(() => {
    if (!isInitialRestoredRef.current) return
    if (!storyId || !currentChapter) return
    const progressData = {
      chapterIdx: currentChapterIdx,
      chapterNumber: currentChapterNumber,
      chapterTitle: currentChapter?.title || `บทที่ ${currentChapterNumber}`,
      storyTitle: story?.title || '',
      updatedAt: Date.now()
    }
    localStorage.setItem(`plottrix_read_progress_${storyId}`, JSON.stringify(progressData))
  }, [storyId, currentChapterIdx, currentChapterNumber, currentChapter?.title, story?.title])

  // Auto-scroll active chapter into view inside drawer
  useEffect(() => {
    if (drawerOpen && activeChapterRef.current) {
      setTimeout(() => {
        activeChapterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [drawerOpen])

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

  const handleManualBookmark = () => {
    const progressData = {
      chapterIdx: currentChapterIdx,
      chapterNumber: currentChapterNumber,
      chapterTitle: currentChapter?.title || `บทที่ ${currentChapterNumber}`,
      storyTitle: story?.title || '',
      updatedAt: Date.now()
    }
    localStorage.setItem(`plottrix_bookmark_${storyId}`, JSON.stringify(progressData))
    localStorage.setItem(`plottrix_read_progress_${storyId}`, JSON.stringify(progressData))
    setSavedBookmark(progressData)

    addToast({
      title: 'คั่นหน้านี้ไว้แล้ว 🔖',
      description: `บันทึกจุดที่อ่านค้างไว้: ตอนที่ ${currentChapterNumber} (${currentChapter?.title || ''}) — เมื่อกลับเข้ามาจะเด้งมาหน้านี้ทันที`,
      fuseColor: '#a855f7'
    })
  }

  const handleMarkArcCompleted = () => {
    const arcTitle = story?.published_arc || (currentChapter?.title?.includes('ARC') ? 'ARC 1' : 'เนื้อหาทั้งหมด')
    const completionData = {
      completedChapterCount: chapters.length,
      completedArc: arcTitle,
      completedAt: Date.now()
    }
    localStorage.setItem(`plottrix_story_completion_${storyId}`, JSON.stringify(completionData))
    setIsArcCompleted(true)

    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#74d9b4', '#a855f7', '#fbbf24', '#ec4899']
    })

    addToast({
      title: 'บันทึกว่าอ่าน ARC นี้ครบแล้ว! 🎉',
      description: 'ระบบจะแสดงสถานะว่าคุณอ่านครบแล้ว และแจ้งเตือนทันทีเมื่อผู้แต่งปล่อย ARC ใหม่บนหน้าค้นหานิยาย',
      fuseColor: '#74d9b4'
    })
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
      panel: 'bg-[#15102a]/95 border-[#2c224d]',
      text: 'text-[#e6e0f8]',
      dimText: 'text-[#9b8eb9]',
      accent: 'text-purple-300'
    },
    sepia: {
      page: 'bg-[#1e1915] text-[#ecdcc8]',
      panel: 'bg-[#29221b]/95 border-[#4a3b2c]',
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
      <div className="min-h-[100dvh] bg-[#0b0816] flex flex-col items-center justify-center text-purple-300 font-thai">
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
      <div className="min-h-[100dvh] bg-[#0b0816] flex flex-col items-center justify-center text-white px-4 text-center font-thai">
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

  // PORTAL CHAPTER DRAWER: Rendered directly on document.body so it NEVER gets trapped by parent transforms
  const chapterDrawerContent = (
    <AnimatePresence>
      {drawerOpen && (
        <div className="fixed inset-0 z-[99999] flex select-none font-thai">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />

          {/* Drawer Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative ml-auto z-10 w-full max-w-md h-full flex flex-col bg-[#120d24] text-slate-100 border-l border-purple-500/30 shadow-[0_0_80px_rgba(0,0,0,0.8)] p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <span>📑</span>
                  <span>สารบัญตอน</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    {chapters.length} ตอน
                  </span>
                </h3>
                {story.published_arc && (
                  <span className="text-[11px] text-purple-300 font-medium block mt-0.5">
                    {story.published_arc}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-bold text-slate-300 hover:text-white transition cursor-pointer"
                title="ปิดสารบัญ"
              >
                ✕
              </button>
            </div>

            {/* Quick status bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-white/5 rounded-xl px-3 py-2 mb-3 border border-white/5">
              <span>กำลังอ่าน: <strong className="text-purple-300">ตอนที่ {currentChapterNumber}</strong></span>
              <button
                type="button"
                onClick={handleManualBookmark}
                className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>🔖</span>
                <span>คั่นหน้านี้</span>
              </button>
            </div>

            {/* Scrollable Chapter List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {chapters.map((ch, idx) => {
                const isCurrent = idx === currentChapterIdx
                const isBookmarked = savedBookmark?.chapterIdx === idx
                const locked = !user && ch.number > 5

                return (
                  <button
                    key={ch.id}
                    ref={isCurrent ? activeChapterRef : null}
                    type="button"
                    onClick={() => {
                      setCurrentChapterIdx(idx)
                      setDrawerOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-purple-600/35 border-purple-400/60 text-white font-bold shadow-lg shadow-purple-600/20 ring-1 ring-purple-400/40'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded-md ${
                        isCurrent ? 'bg-purple-500 text-white font-bold' : 'bg-white/5 text-purple-300'
                      }`}>
                        #{String(ch.number).padStart(2, '0')}
                      </span>
                      <span className="truncate">{ch.title || `บทที่ ${ch.number}`}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isBookmarked && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 font-semibold">
                          <span>🔖</span>
                          <span>จุดคั่น</span>
                        </span>
                      )}

                      {locked ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold">
                          🔒 ล็อค
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          อ่านฟรี
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return (
    <div className={`reader-root min-h-[100dvh] relative ${themeClasses.page} transition-colors duration-300 font-thai`}>
      {/* 3D Ambient Background Shards (Conditional for reading comfort) */}
      {showBackground && <AeroShardsCanvas />}

      {/* Portal Chapter Drawer (always fixed to viewport, zero clipping) */}
      {typeof document !== 'undefined' && createPortal(chapterDrawerContent, document.body)}

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
          {/* Zen Background Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !showBackground
              setShowBackground(next)
              addToast({
                title: next ? 'เปิดเอฟเฟกต์พื้นหลังแล้ว ✨' : 'โหมดอ่านสบายตา (ปิดพื้นหลัง) 🌙',
                description: next ? 'แสดงเอฟเฟกต์พื้นหลัง 3D' : 'ปิดเอฟเฟกต์เคลื่อนไหวเพื่ออ่านสบายตา',
                duration: 2000
              })
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showBackground
                ? 'bg-purple-500/15 border-purple-400/30 text-purple-200 hover:bg-purple-500/25'
                : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 shadow-sm'
            }`}
            title={showBackground ? "คลิกเพื่อปิดพื้นหลัง (อ่านสบายตา)" : "คลิกเพื่อเปิดพื้นหลัง 3D"}
          >
            <span>{showBackground ? '✨' : '🌙'}</span>
            <span className="hidden lg:inline">{showBackground ? 'พื้นหลัง 3D' : 'อ่านสบายตา'}</span>
          </button>

          {/* Font Family Selector Dropdown */}
          <div className="relative" ref={fontMenuRef}>
            <button
              type="button"
              onClick={() => setFontMenuOpen(!fontMenuOpen)}
              className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-purple-400/40 bg-white/5 hover:bg-white/10 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="เลือกรูปแบบตัวอักษร (Font)"
            >
              <span>🔤</span>
              <span className="hidden md:inline">{FONTS.find(f => f.id === fontFamily)?.name.split(' ')[0] || 'ฟอนต์'}</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {fontMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#140e28]/98 border border-purple-500/30 shadow-2xl p-2 z-50 backdrop-blur-2xl space-y-1">
                <div className="text-[10px] font-bold text-purple-300 px-2.5 py-1 uppercase tracking-wider border-b border-white/10 mb-1">
                  เลือกรูปแบบตัวอักษร
                </div>
                {FONTS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFontFamily(f.id)
                      setFontMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      fontFamily === f.id
                        ? 'bg-purple-600/30 text-white font-bold border border-purple-400/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    style={{ fontFamily: f.css }}
                  >
                    <div>
                      <div className="text-xs">{f.name}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{f.sub}</div>
                    </div>
                    {fontFamily === f.id && <span className="text-purple-300 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleManualBookmark}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              savedBookmark?.chapterIdx === currentChapterIdx
                ? 'border-amber-400 bg-amber-500/25 text-amber-200 ring-2 ring-amber-400/30 shadow-md'
                : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
            }`}
            title="บันทึกจุดที่อ่านค้างไว้"
          >
            <span>🔖</span>
            <span className="hidden md:inline">
              {savedBookmark?.chapterIdx === currentChapterIdx ? 'คั่นหน้านี้แล้ว' : 'คั่นหน้า'}
            </span>
          </button>

          {/* Chapter Drawer Toggle */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="px-2.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/15 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-500/25 text-purple-200 transition cursor-pointer"
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

      {/* Floating Resume Banner if user has saved bookmark on another chapter */}
      <AnimatePresence>
        {showResumeBanner && savedBookmark && savedBookmark.chapterIdx !== currentChapterIdx && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-16 z-30 max-w-xl mx-auto my-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 border border-purple-400/50 text-white shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-amber-400 text-sm">🔖</span>
              <span className="truncate">
                คุณอ่านค้างไว้ที่ <strong>ตอนที่ {savedBookmark.chapterNumber}: {savedBookmark.chapterTitle}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCurrentChapterIdx(savedBookmark.chapterIdx)
                  setShowResumeBanner(false)
                }}
                className="px-3 py-1 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-[11px] shadow-sm transition cursor-pointer"
              >
                อ่านต่อจุดเดิม
              </button>
              <button
                type="button"
                onClick={() => setShowResumeBanner(false)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </motion.div>
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
            className="reader-content space-y-6 select-text transition-all duration-200"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.95,
              fontFamily: FONTS.find(f => f.id === fontFamily)?.css || "'Sarabun', sans-serif"
            }}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualBookmark}
              className={`px-3 sm:px-4 py-3 rounded-2xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                savedBookmark?.chapterIdx === currentChapterIdx
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/30'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
              }`}
              title="คั่นหน้านี้ไว้"
            >
              <span>🔖</span>
              <span className="hidden sm:inline">
                {savedBookmark?.chapterIdx === currentChapterIdx ? 'คั่นหน้านี้แล้ว ✓' : 'คั่นหน้านี้'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="px-4 sm:px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-purple-500/40 text-xs font-bold text-purple-200 transition cursor-pointer flex items-center gap-2 shadow-md"
            >
              <span>📑</span>
              <span>สารบัญตอน ({chapters.length})</span>
            </button>
          </div>

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
        {/* END OF ARC / STORY CELEBRATORY CARD                     */}
        {/* Shown when user reaches the last published chapter      */}
        {/* ======================================================== */}
        {isLastChapter && (
          <div className="my-14 p-8 sm:p-10 rounded-3xl border border-purple-500/40 bg-gradient-to-br from-[#1d1233]/95 via-[#130d25]/95 to-[#0c0818]/95 text-center shadow-[0_20px_50px_rgba(147,51,234,0.2)] backdrop-blur-2xl">
            <span className="text-4xl block mb-3 animate-bounce">🎉</span>
            <span className="inline-block px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 mb-2">
              {story.published_arc || 'จบบริบูรณ์ ARC นี้'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              คุณได้อ่านเนื้อหาที่ปล่อยใน ARC นี้ครบถ้วนแล้ว!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              กดบันทึกว่าอ่านจบแล้วด้านล่าง เพื่อให้ระบบจดจำสถานะ และแจ้งเตือนคุณบนหน้าหลักทันทีเมื่อนักเขียนเผยแพร่ ARC หรือตอนใหม่เข้ามา
            </p>

            <button
              type="button"
              onClick={handleMarkArcCompleted}
              className={`px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black shadow-xl transition cursor-pointer flex items-center justify-center gap-2 mx-auto ${
                isArcCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 text-white hover:brightness-110 shadow-purple-600/30 hover:scale-105'
              }`}
            >
              <span>{isArcCompleted ? '✅' : '✨'}</span>
              <span>
                {isArcCompleted
                  ? 'คุณอ่าน ARC นี้ครบแล้ว (ระบบจะแจ้งเตือนเมื่อมี ARC ใหม่)'
                  : '✓ ทำเครื่องหมายว่าอ่าน ARC นี้จบแล้ว'}
              </span>
            </button>
          </div>
        )}

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
          className="flex-1 py-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold text-center flex items-center justify-center gap-1"
        >
          <span>📑</span>
          <span>สารบัญ</span>
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
