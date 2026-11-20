import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import AeroShardsCanvas from '../workspace/AeroShardsCanvas'
import NovelCoverCarousel from '../common/NovelCoverCarousel'
import {
  fetchStoryById,
  fetchStoryChapters,
  recordStoryView,
  checkStoryFollowing,
  toggleStoryFollow
} from '../../lib/publicStoriesService'
import { fetchComments, addComment } from '../../lib/commentsService'
import confetti from 'canvas-confetti'

export default function StoryDetailsView({ storyId: propStoryId }) {
  const { navigateTo, activeReadStoryId, addToast, setActiveModal } = useApp()
  const { user, profile } = useAuth()

  const storyId = propStoryId || activeReadStoryId || (typeof window !== 'undefined' ? window.location.pathname.split('/story/')[1]?.split('/')[0] : '')

  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [savedBookmark, setSavedBookmark] = useState(null)

  // Comments input form
  const [newCommentName, setNewCommentName] = useState(() => {
    return profile?.display_name || user?.user_metadata?.full_name || ''
  })
  const [newCommentText, setNewCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Sync user display name
  useEffect(() => {
    if (user && (profile?.display_name || user.user_metadata?.full_name)) {
      setNewCommentName(profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0])
    }
  }, [user, profile])

  // Load Story, Chapters, Comments, Follow Status, and Record View
  useEffect(() => {
    let isMounted = true

    async function initStoryDetails() {
      if (!storyId) return
      setLoading(true)

      try {
        // Record real view in Supabase (session deduplicated)
        recordStoryView(storyId)

        // 1. Fetch story details
        const storyData = await fetchStoryById(storyId)
        if (!isMounted) return

        if (storyData) {
          setStory(storyData)
          setFollowerCount(storyData.follower_count || 0)

          // 2. Fetch published chapters
          const chs = await fetchStoryChapters(storyId, Boolean(user), storyData)
          if (isMounted) setChapters(chs)

          // 3. Fetch real comments
          const cmts = await fetchComments(storyId)
          if (isMounted) setComments(cmts)

          // 4. Check following state
          const following = await checkStoryFollowing(storyId, user?.id)
          if (isMounted) setIsFollowing(following)

          // 5. Read local bookmark
          if (typeof window !== 'undefined') {
            const rawBookmark = localStorage.getItem(`plottrix_bookmark_${storyId}`) || localStorage.getItem(`plottrix_read_progress_${storyId}`)
            if (rawBookmark) {
              try {
                setSavedBookmark(JSON.parse(rawBookmark))
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error('[StoryDetailsView] Error loading details:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initStoryDetails()
    return () => { isMounted = false }
  }, [storyId, user])

  // Toggle Follow
  const handleToggleFollow = async () => {
    if (followingLoading) return
    setFollowingLoading(true)

    const res = await toggleStoryFollow(storyId, user?.id)
    setIsFollowing(res.is_following)
    setFollowerCount(res.follower_count)
    setFollowingLoading(false)

    if (res.is_following) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#a855f7', '#ec4899', '#74d9b4']
      })
      addToast({
        title: 'ติดตามนิยายเรียบร้อย! 💖',
        description: `คุณจะได้รับการแจ้งเตือนเมื่อเรื่อง "${story?.title}" มีตอนใหม่`,
        fuseColor: '#ec4899'
      })
    } else {
      addToast({
        title: 'ยกเลิกการติดตามแล้ว',
        fuseColor: '#94a3b8'
      })
    }
  }

  // Handle Share Story Link
  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      addToast({
        title: 'คัดลอกลิงก์ผลงานแล้ว 📋',
        description: 'แชร์ให้นักอ่านคนอื่นๆ เข้ามาติดตามได้เลย!',
        fuseColor: '#a855f7'
      })
    }
  }

  // Handle Start / Resume Reading
  const handleStartReading = (targetIdx = 0) => {
    let chapterToOpen = targetIdx
    if (targetIdx === 0 && savedBookmark && typeof savedBookmark.chapterIdx === 'number') {
      chapterToOpen = savedBookmark.chapterIdx
    }
    navigateTo('reader', { storyId, chapterIdx: chapterToOpen })
  }

  // Handle Submit Comment
  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newCommentText.trim() || !newCommentName.trim()) return

    setSubmittingComment(true)
    const res = await addComment({
      storyId,
      chapterId: null,
      userId: user?.id || null,
      commenterName: newCommentName.trim(),
      content: newCommentText.trim()
    })

    setSubmittingComment(false)
    if (res.success && res.data) {
      setComments(prev => [res.data, ...prev])
      setNewCommentText('')
      addToast({
        title: 'ส่งความคิดเห็นสำเร็จ! 💬',
        fuseColor: '#74d9b4'
      })
    } else {
      addToast({
        title: 'เกิดข้อผิดพลาดในการส่ง',
        description: res.error || 'กรุณาลองใหม่อีกครั้ง',
        fuseColor: '#ef4444'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d091a] flex flex-col items-center justify-center text-purple-300 font-thai p-4">
        <AeroShardsCanvas />
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">กำลังโหลดข้อมูลนิยาย...</h3>
          <p className="text-xs text-plottrix-muted">ดึงสถิติยอดวิว คอมเมนต์ และสารบัญตอนจาก Supabase</p>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#0d091a] flex flex-col items-center justify-center text-white font-thai p-6 text-center">
        <AeroShardsCanvas />
        <div className="relative z-10 max-w-md p-8 rounded-3xl bg-[#15102a]/90 border border-purple-500/30 backdrop-blur-xl">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-xl font-bold mb-2">ไม่พบนิยายเรื่องนี้</h2>
          <p className="text-xs text-plottrix-muted mb-6">
            ผลงานนี้อาจถูกเปลี่ยนเป็นฉบับร่างส่วนตัว หรือลบออกจากระบบแล้ว
          </p>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
          >
            ← กลับหน้าหลัก
          </button>
        </div>
      </div>
    )
  }

  // Format dates according to specifications
  const createdDateStr = story.createdDate || story.publishedDate || '-'
  const updatedDateTimeStr = story.updatedDateTime || '-'
  const lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null
  const lastChapterTitle = lastChapter ? `บทที่ ${lastChapter.number}: ${lastChapter.title}` : '-'

  const coverImages = Array.isArray(story.cover_images) && story.cover_images.length > 0
    ? story.cover_images
    : [story.cover_url || story.cover]

  return (
    <div className="story-details-root min-h-[100dvh] relative text-white bg-transparent font-thai select-none">
      {/* 3D Ambient Shards Canvas */}
      <AeroShardsCanvas />

      {/* Top Floating Navbar */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 bg-[#0e091e]/85 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>←</span>
            <span>กลับหน้าหลัก</span>
          </button>

          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 cursor-pointer hidden sm:flex"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-sm">
              P
            </div>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-violet-300 to-fuchsia-200 bg-clip-text text-transparent">
              Plottrix Reader
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">แชร์นิยาย</span>
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => navigateTo('workspace_home')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold transition cursor-pointer"
            >
              สตูดิโอของฉัน
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveModal('auth')}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
            >
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Card */}
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#1c1338]/90 via-[#130d28]/95 to-[#0c0818]/98 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Left: Book Cover Carousel */}
            <div className="w-56 sm:w-64 md:w-72 shrink-0 flex flex-col items-center">
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden border border-purple-500/40 shadow-2xl shadow-purple-950/60 relative group">
                <NovelCoverCarousel
                  images={coverImages}
                  alt={story.title}
                  className="w-full h-full"
                  imageClassName="w-full h-full object-cover"
                />
              </div>

              {coverImages.length > 1 && (
                <p className="text-[10px] text-plottrix-muted text-center mt-2.5">
                  ✦ รวม {coverImages.length} ภาพปก · ชี้เมาส์เพื่อค้างรูปแรก
                </p>
              )}
            </div>

            {/* Right: Meta, Statistics, Dates & Actions */}
            <div className="flex-1 min-w-0 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-500/25 text-purple-300 border border-purple-500/40">
                    {story.genre || 'สืบสวน / ระทึกขวัญ'}
                  </span>

                  {story.published_arc && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      🏷️ {story.published_arc}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug mb-2">
                  {story.title}
                </h1>

                <p className="text-xs sm:text-sm text-plottrix-muted flex items-center gap-2">
                  <span>ผู้ประพันธ์:</span>
                  <strong className="text-purple-300 font-bold">{story.authorName}</strong>
                </p>
              </div>

              {/* Tags Row */}
              {Array.isArray(story.tags) && story.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {story.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-white/5 hover:bg-purple-600/20 text-slate-300 hover:text-purple-200 border border-white/10 transition"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* 4 Real Data Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2">
                {/* 1. Views */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-lg mb-1 block">👁️</span>
                  <div className="text-base sm:text-lg font-black text-white">
                    {(story.view_count || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-plottrix-muted">ยอดวิวรวม</div>
                </div>

                {/* 2. Comments */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-lg mb-1 block">💬</span>
                  <div className="text-base sm:text-lg font-black text-white">
                    {(comments.length || story.commentCount || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-plottrix-muted">คอมเมนต์</div>
                </div>

                {/* 3. Followers with Toggle Button */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center relative group">
                  <span className="text-lg mb-1 block">{isFollowing ? '💖' : '🤍'}</span>
                  <div className="text-base sm:text-lg font-black text-white">
                    {(followerCount || 0).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    disabled={followingLoading}
                    className={`mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold transition cursor-pointer ${
                      isFollowing
                        ? 'bg-pink-500/30 text-pink-300 border border-pink-400/50'
                        : 'bg-white/10 text-slate-300 hover:text-white hover:bg-purple-600/40'
                    }`}
                  >
                    {isFollowing ? '✓ ติดตามแล้ว' : '+ ติดตาม'}
                  </button>
                </div>

                {/* 4. Published Chapters */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-lg mb-1 block">📑</span>
                  <div className="text-base sm:text-lg font-black text-white">
                    {chapters.length || story.chapterCount || 0}
                  </div>
                  <div className="text-[10px] text-plottrix-muted">ตอนทั้งหมด</div>
                </div>
              </div>

              {/* Exact Dates & Latest Chapter Specification Card */}
              <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/25 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-plottrix-muted flex items-center gap-1.5">
                    <span>📅</span>
                    <span>วันที่เปิดเรื่อง:</span>
                  </span>
                  <span className="font-mono text-slate-200 font-semibold">{createdDateStr}</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-plottrix-muted flex items-center gap-1.5">
                    <span>🕒</span>
                    <span>อัปเดตล่าสุด:</span>
                  </span>
                  <span className="font-mono text-purple-300 font-semibold">{updatedDateTimeStr}</span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-plottrix-muted flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>ตอนล่าสุด:</span>
                  </span>
                  <span className="text-emerald-300 font-bold truncate max-w-[220px] sm:max-w-[320px]">
                    {lastChapterTitle}
                  </span>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartReading(0)}
                  className="flex-1 min-w-[200px] px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white shadow-purple-600/30"
                >
                  <span>🚀</span>
                  <span>
                    {savedBookmark && typeof savedBookmark.chapterNumber === 'number'
                      ? `อ่านต่อจากตอนที่ค้างไว้ (ตอนที่ ${savedBookmark.chapterNumber})`
                      : 'เริ่มอ่านตั้งแต่ตอนแรก (ฟรี)'}
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Synopsis Section */}
        <div className="rounded-3xl border border-purple-500/20 bg-[#140e2b]/80 p-6 sm:p-8 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>📖</span>
            <span>เรื่องย่อ / คำโปรย (Synopsis)</span>
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-thai">
            {story.synopsis || 'ร่วมผจญภัยและติดตามความเข้มข้นของเนื้อเรื่องที่ผ่านการขัดเกลาด้วยความประณีต...'}
          </p>
        </div>

        {/* Table of Contents / Chapter List */}
        <div className="rounded-3xl border border-purple-500/20 bg-[#140e2b]/80 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📑</span>
                <span>สารบัญตอน ({chapters.length} ตอน)</span>
              </h3>
              <p className="text-xs text-plottrix-muted mt-0.5">
                บทที่ 1-5 เปิดให้นักอ่านทั่วไปเข้าชมฟรี · บทที่ 6 เป็นต้นไปสำหรับสมาชิก
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {chapters.map((ch, idx) => {
              const isLocked = ch.isLocked
              const isSavedBookmark = savedBookmark?.chapterIdx === idx

              return (
                <div
                  key={ch.id || idx}
                  onClick={() => handleStartReading(idx)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSavedBookmark
                      ? 'bg-purple-600/25 border-purple-400 text-white shadow-md shadow-purple-900/30'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-black/40 text-purple-300 font-bold border border-white/10">
                      #{String(ch.number || idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold truncate">
                      {ch.title || `บทที่ ${idx + 1}`}
                    </span>
                    {isSavedBookmark && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                        🔖 อ่านค้างไว้ที่นี่
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-plottrix-muted hidden sm:inline">
                      {(ch.wordCount || 0).toLocaleString()} คำ
                    </span>
                    {isLocked ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1">
                        <span>🔒</span>
                        <span>สมาชิก</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold flex items-center gap-1">
                        <span>✓</span>
                        <span>อ่านฟรี</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Real Comments Section */}
        <div className="rounded-3xl border border-purple-500/20 bg-[#140e2b]/80 p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💬</span>
                <span>ความคิดเห็นจากนักอ่าน ({comments.length})</span>
              </h3>
              <p className="text-xs text-plottrix-muted mt-0.5">
                ร่วมส่งต่อกำลังใจ ข้อคิดเห็น หรือทฤษฎีเนื้อเรื่องให้ผู้แต่ง
              </p>
            </div>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-purple-500/30 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1">
                ชื่อผู้แสดงความคิดเห็น:
              </label>
              <input
                type="text"
                value={newCommentName}
                onChange={(e) => setNewCommentName(e.target.value)}
                placeholder="ระบุนามปากกาหรือชื่อของคุณ..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-purple-500/30 text-white text-xs outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1">
                ข้อความความคิดเห็น:
              </label>
              <textarea
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="เขียนความรู้สึกของคุณต่อผลงานเรื่องนี้..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/30 text-white text-xs outline-none focus:border-purple-400 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-plottrix-muted">
                {user ? `✓ แสดงความคิดเห็นในฐานะสมาชิก: ${newCommentName}` : '✦ แสดงความคิดเห็นในฐานะนักอ่านทั่วไป (Guest)'}
              </span>

              <button
                type="submit"
                disabled={submittingComment || !newCommentText.trim() || !newCommentName.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{submittingComment ? 'กำลังส่ง...' : 'ส่งความคิดเห็น 🚀'}</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length > 0 ? (
              comments.map((cmt) => (
                <div
                  key={cmt.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-purple-300">
                      {cmt.commenter_name || 'นักอ่านนิรนาม'}
                    </span>
                    <span className="text-[10px] text-plottrix-muted font-mono">
                      {cmt.created_at ? new Date(cmt.created_at).toLocaleDateString('th-TH') : 'เมื่อสักครู่'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-thai">
                    {cmt.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-plottrix-muted rounded-2xl bg-white/[0.01] border border-white/5">
                ยังไม่มีความคิดเห็น เป็นคนแรกที่เริ่มการพูดคุยกับผู้แต่ง!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
