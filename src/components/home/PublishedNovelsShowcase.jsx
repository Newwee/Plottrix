import React, { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { fetchPublishedStories } from '../../lib/publicStoriesService'

export default function PublishedNovelsShowcase() {
  const { navigateTo } = useApp()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  // Local reader state maps for instant reactive badges
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

        // Read local storage reading states for each story
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

  return (
    <section className="section py-20 px-4 sm:px-6 relative z-10" id="public-novels">
      <div className="wrap max-w-6xl mx-auto">
        {/* Section Head */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow text-xs font-bold text-purple-400 tracking-widest uppercase block mb-2">
            PUBLIC NOVEL SHOWCASE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            อ่านนิยายจาก <span className="grad bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400 bg-clip-text text-transparent">นักเขียนในคอมมูนิตี้</span>
          </h2>
          <p className="text-sm text-plottrix-muted leading-relaxed">
            สำรวจผลงานคุณภาพที่รังสรรค์และขัดเกลาผ่าน Plottrix Studio อ่านฟรี 5 ตอนแรกโดยไม่ต้องสมัครสมาชิก
          </p>
        </div>

        {/* Content State: Loading, Empty, or List */}
        {loading ? (
          <div className="p-12 text-center rounded-3xl bg-white/5 border border-purple-500/20 max-w-md mx-auto">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-purple-300 font-semibold">กำลังค้นหานิยายที่เผยแพร่...</span>
          </div>
        ) : stories.length === 0 ? (
          /* ======================================================== */
          /* Sleek Obsidian Glass Empty State Card                   */
          /* ======================================================== */
          <div className="max-w-lg mx-auto p-8 sm:p-12 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#1c1333]/90 via-[#130d25]/90 to-[#0c0818]/95 text-center shadow-[0_20px_50px_rgba(147,51,234,0.15)] backdrop-blur-2xl">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-3xl shadow-inner">
              📚
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              ยังไม่มีใครเอานิยายมาลง
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mb-8 leading-relaxed">
              เป็นนักเขียนคนแรกที่เผยแพร่ผลงานสู่หน้าหลัก — ปลดปล่อยจินตนาการของคุณสู่สายตานักอ่านทั่วประเทศ
            </p>

            <button
              type="button"
              onClick={() => navigateTo('workspace')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2 mx-auto"
            >
              <span>✍️</span>
              <span>เริ่มเขียนและเผยแพร่นิยายของคุณ</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          /* Responsive Book Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => {
              const progress = readerProgressMap[story.id]
              const completion = completionMap[story.id]
              const hasReadBefore = Boolean(progress && progress.chapterNumber)

              // Check if author added new chapters after reader completed
              const hasNewChaptersAfterCompletion =
                Boolean(completion && story.chapterCount > completion.completedChapterCount)
              const newChapterCount = hasNewChaptersAfterCompletion
                ? story.chapterCount - completion.completedChapterCount
                : 0

              return (
                <div
                  key={story.id}
                  className="group relative rounded-3xl border border-purple-500/25 bg-[#15102a]/80 hover:bg-[#1a1336]/90 hover:border-purple-400/50 p-6 flex flex-col justify-between shadow-xl transition-all duration-300 backdrop-blur-md overflow-hidden"
                >
                  <div>
                    {/* Card Cover & Badge Top Row */}
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={story.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80'}
                        alt={story.title}
                        className="w-16 h-22 object-cover rounded-xl border border-white/10 shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 truncate max-w-full">
                            {story.genre || 'แฟนตาซี'}
                          </span>

                          {/* Dynamic Arc / New Chapter / Read Status Badges */}
                          {hasNewChaptersAfterCompletion ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-amber-300 border border-pink-400/50 animate-pulse shadow-sm flex items-center gap-1">
                              <span>🔔</span>
                              <span>มี ARC ใหม่! (+{newChapterCount} ตอน)</span>
                            </span>
                          ) : completion ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                              <span>✅</span>
                              <span>อ่านครบแล้ว</span>
                            </span>
                          ) : hasReadBefore ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                              <span>🔖</span>
                              <span>ถึงตอนที่ {progress.chapterNumber}</span>
                            </span>
                          ) : null}
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-200 transition line-clamp-2 leading-snug">
                          {story.title}
                        </h4>

                        <p className="text-xs text-plottrix-muted mt-1 truncate">
                          โดย <strong className="text-purple-300 font-semibold">{story.authorName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Synopsis snippet */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                      {story.synopsis || 'ร่วมติดตามเรื่องราวอันน่าติดตามที่เขียนและเรียบเรียงอย่างประณีต...'}
                    </p>
                  </div>

                  {/* Footer Meta & Read Action */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-plottrix-muted">
                      <span className="text-purple-300 font-bold">{story.chapterCount || 0}</span> ตอน
                      {story.published_arc && (
                        <span className="hidden sm:inline text-slate-400"> · {story.published_arc}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigateTo('reader', { storyId: story.id, chapterIdx: hasReadBefore ? progress.chapterIdx : 0 })}
                        className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 ${
                          hasNewChaptersAfterCompletion
                            ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-pink-600/30 animate-pulse'
                            : hasReadBefore
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-purple-600/30'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        <span>
                          {hasNewChaptersAfterCompletion
                            ? 'อ่าน ARC ใหม่'
                            : hasReadBefore
                            ? `อ่านต่อ (ตอนที่ ${progress.chapterNumber})`
                            : 'เริ่มอ่าน'}
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
