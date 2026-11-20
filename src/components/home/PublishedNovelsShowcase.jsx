import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { fetchPublishedStories } from '../../lib/publicStoriesService'
import NovelCoverCarousel from '../common/NovelCoverCarousel'

const CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'สืบสวน', label: 'สืบสวน / ระทึกขวัญ' },
  { id: 'แฟนตาซี', label: 'แฟนตาซี / กำลังภายใน' },
  { id: 'โรแมนติก', label: 'โรแมนติก / ดราม่า' },
  { id: 'วาย', label: 'วาย / ยูริ (BL / GL)' },
  { id: 'ไซไฟ', label: 'ไซไฟ / เอาชีวิตรอด' },
  { id: 'สยองขวัญ', label: 'สยองขวัญ' },
  { id: 'คอมเมดี้', label: 'คอมเมดี้ / ชีวิตประจำวัน' }
]

export default function PublishedNovelsShowcase() {
  const { navigateTo } = useApp()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState(null)
  const [showAll, setShowAll] = useState(false)

  // Local reader progress maps
  const [readerProgressMap, setReaderProgressMap] = useState({})
  const [completionMap, setCompletionMap] = useState({})

  useEffect(() => {
    let isMounted = true

    async function loadPublished() {
      setLoading(true)
      const data = await fetchPublishedStories()
      if (isMounted) {
        setStories(data)
        setLoading(false)

        const progMap = {}
        const compMap = {}
        if (typeof window !== 'undefined') {
          data.forEach(s => {
            const rawProg = localStorage.getItem(`plottrix_bookmark_${s.id}`) || localStorage.getItem(`plottrix_read_progress_${s.id}`)
            if (rawProg) {
              try { progMap[s.id] = JSON.parse(rawProg) } catch {}
            }
            const rawComp = localStorage.getItem(`plottrix_story_completion_${s.id}`)
            if (rawComp) {
              try { compMap[s.id] = JSON.parse(rawComp) } catch {}
            }
          })
        }
        setReaderProgressMap(progMap)
        setCompletionMap(compMap)
      }
    }

    loadPublished()
    return () => { isMounted = false }
  }, [])

  // Filtered stories based on category & tag
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchCategory = selectedCategory === 'all'
        ? true
        : (story.genre && story.genre.includes(selectedCategory))

      const matchTag = selectedTag
        ? Array.isArray(story.tags) && story.tags.includes(selectedTag)
        : true

      return matchCategory && matchTag
    })
  }, [stories, selectedCategory, selectedTag])

  // Pagination / Limit logic: show 6 by default (2 rows of 3), expand if showAll
  const INITIAL_LIMIT = 6
  const visibleStories = showAll ? filteredStories : filteredStories.slice(0, INITIAL_LIMIT)
  const hasMoreThanLimit = filteredStories.length > INITIAL_LIMIT

  const handleOpenStoryDetails = (storyId) => {
    navigateTo('story_detail', { storyId })
  }

  return (
    <section className="section py-20 px-4 sm:px-6 relative z-10" id="public-novels">
      <div className="wrap max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="eyebrow text-xs font-bold text-purple-400 tracking-widest uppercase block mb-2">
            PUBLIC NOVEL SHOWCASE
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            อ่านนิยายจาก <span className="grad bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400 bg-clip-text text-transparent">นักเขียนในคอมมูนิตี้</span>
          </h2>
          <p className="text-sm sm:text-base text-plottrix-muted leading-relaxed">
            สำรวจผลงานคุณภาพที่รังสรรค์และขัดเกลาผ่าน Plottrix Studio อ่านฟรี 5 ตอนแรกโดยไม่ต้องสมัครสมาชิก
          </p>
        </div>

        {/* Category & Tag Filter Bar */}
        <div className="mb-10 space-y-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setSelectedTag(null)
                  setShowAll(false)
                }}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer backdrop-blur-md ${
                  selectedCategory === cat.id && !selectedTag
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/50 scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active Tag Filter Indicator */}
          {selectedTag && (
            <div className="flex items-center justify-center gap-2 pt-1 animate-fadeIn">
              <span className="text-xs text-plottrix-muted">กรองด้วยแท็ก:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-400/40 text-xs font-bold">
                <span>#{selectedTag}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="hover:text-white text-purple-300 text-xs"
                >
                  ✕
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Content State: Loading, Empty, or 3-Column Grid */}
        {loading ? (
          <div className="p-16 text-center rounded-3xl bg-white/5 border border-purple-500/20 max-w-md mx-auto">
            <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-purple-300 font-semibold">กำลังค้นหานิยายที่เผยแพร่...</span>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="max-w-lg mx-auto p-8 sm:p-12 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#1c1333]/90 via-[#130d25]/90 to-[#0c0818]/95 text-center shadow-[0_20px_50px_rgba(147,51,234,0.15)] backdrop-blur-2xl">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-3xl shadow-inner">
              📚
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              ไม่พบนิยายในหมวดหมู่นี้
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
              ลองเลือกหมวดหมู่อื่น หรือเป็นนักเขียนคนแรกที่สร้างสรรค์ผลงานในหมวดนี้
            </p>
            <button
              type="button"
              onClick={() => { setSelectedCategory('all'); setSelectedTag(null) }}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
            >
              แสดงนิยายทั้งหมด
            </button>
          </div>
        ) : (
          <>
            {/* Prominent 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleStories.map((story) => {
                const progress = readerProgressMap[story.id]
                const completion = completionMap[story.id]
                const hasReadBefore = Boolean(progress && typeof progress.chapterNumber === 'number')

                const hasNewChaptersAfterCompletion =
                  Boolean(completion && story.chapterCount > completion.completedChapterCount)
                const newChapterCount = hasNewChaptersAfterCompletion
                  ? story.chapterCount - completion.completedChapterCount
                  : 0

                const coverImages = Array.isArray(story.cover_images) && story.cover_images.length > 0
                  ? story.cover_images
                  : [story.cover_url || story.cover]

                return (
                  <motion.div
                    key={story.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => handleOpenStoryDetails(story.id)}
                    className="group relative rounded-3xl border border-purple-500/25 bg-[#140e2b]/85 hover:bg-[#1a1236]/95 hover:border-purple-400/60 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_60px_rgba(147,51,234,0.25)] hover:-translate-y-2 transition-all duration-300 backdrop-blur-xl overflow-hidden cursor-pointer"
                  >
                    <div>
                      {/* Big Book Cover Container with Multi-Cover Carousel */}
                      <div className="relative w-full aspect-[4/5] overflow-hidden bg-black/40 border-b border-purple-500/20">
                        <NovelCoverCarousel
                          images={coverImages}
                          alt={story.title}
                          className="w-full h-full"
                          imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />

                        {/* Top Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#140e2b] via-black/20 to-black/40 pointer-events-none" />

                        {/* Top Badges */}
                        <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-start justify-between gap-2 pointer-events-none">
                          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-purple-600/90 text-white backdrop-blur-md border border-purple-400/40 shadow-lg">
                            {story.genre || 'สืบสวน'}
                          </span>

                          {/* Dynamic Reading / ARC Badges */}
                          {hasNewChaptersAfterCompletion ? (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-pink-600/90 text-amber-200 border border-pink-400/50 animate-pulse shadow-lg flex items-center gap-1">
                              <span>🔔</span>
                              <span>ARC ใหม่! (+{newChapterCount})</span>
                            </span>
                          ) : completion ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600/90 text-white border border-emerald-400/50 shadow-lg flex items-center gap-1">
                              <span>✓</span>
                              <span>อ่านครบแล้ว</span>
                            </span>
                          ) : hasReadBefore ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/90 text-black border border-amber-300/50 shadow-lg flex items-center gap-1">
                              <span>🔖</span>
                              <span>ถึงตอนที่ {progress.chapterNumber}</span>
                            </span>
                          ) : null}
                        </div>

                        {/* Cover Bottom Title Peek */}
                        <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none">
                          {story.published_arc && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-indigo-300 border border-white/10 backdrop-blur-md mb-1.5 inline-block">
                              🏷️ {story.published_arc}
                            </span>
                          )}
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug line-clamp-2 drop-shadow-md group-hover:text-purple-200 transition">
                            {story.title}
                          </h3>
                        </div>
                      </div>

                      {/* Details Body */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between text-xs text-plottrix-muted">
                          <span>
                            ผู้แต่ง: <strong className="text-purple-300 font-bold">{story.authorName}</strong>
                          </span>
                          <span className="text-[11px] font-mono">
                            📅 {story.publishedDate || 'เร็วๆ นี้'}
                          </span>
                        </div>

                        {/* Tags list */}
                        {Array.isArray(story.tags) && story.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {story.tags.slice(0, 4).map((tag, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedTag(tag)
                                }}
                                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/5 hover:bg-purple-600/30 text-slate-300 hover:text-purple-200 border border-white/10 hover:border-purple-400/40 transition cursor-pointer"
                              >
                                #{tag}
                              </button>
                            ))}
                            {story.tags.length > 4 && (
                              <span className="text-[10px] text-plottrix-muted">
                                +{story.tags.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Synopsis Excerpt */}
                        <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed font-thai">
                          {story.synopsis || 'ร่วมเดินทางสู่เรื่องราวอันน่าติดตามที่รังสรรค์อย่างพิถีพิถัน...'}
                        </p>

                        {/* Real Statistics Ribbon */}
                        <div className="grid grid-cols-4 gap-1 p-2.5 rounded-2xl bg-black/40 border border-white/5 text-center text-[11px]">
                          <div>
                            <div className="font-bold text-slate-200">
                              {(story.view_count || 0).toLocaleString()}
                            </div>
                            <div className="text-[9px] text-plottrix-muted">วิว</div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-200">
                              {(story.commentCount || 0).toLocaleString()}
                            </div>
                            <div className="text-[9px] text-plottrix-muted">ความเห็น</div>
                          </div>
                          <div>
                            <div className="font-bold text-purple-300">
                              {(story.follower_count || 0).toLocaleString()}
                            </div>
                            <div className="text-[9px] text-plottrix-muted">ผู้ติดตาม</div>
                          </div>
                          <div>
                            <div className="font-bold text-emerald-300">
                              {story.chapterCount || 0}
                            </div>
                            <div className="text-[9px] text-plottrix-muted">ตอน</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="p-6 pt-0 border-t border-white/5 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenStoryDetails(story.id)
                        }}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-purple-500/50"
                      >
                        <span>📖</span>
                        <span>ดูรายละเอียด &amp; เริ่มอ่าน</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* View More Button if > 6 novels */}
            {hasMoreThanLimit && (
              <div className="text-center pt-10">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="px-8 py-3.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/40 text-purple-200 hover:text-white font-extrabold text-xs sm:text-sm shadow-xl transition cursor-pointer backdrop-blur-md"
                >
                  {showAll
                    ? 'ย่อผลงานลง ▲'
                    : `ดูผลงานทั้งหมด (${filteredStories.length} เรื่อง) ▼`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
