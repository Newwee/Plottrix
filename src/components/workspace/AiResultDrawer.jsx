import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import ThoughtLine from '../react-bits/ThoughtLine'
import StatusMark from '../react-bits/StatusMark'
import WarmTooltip from '../react-bits/WarmTooltip'

export default function AiResultDrawer() {
  const {
    aiDrawer, setAiDrawer,
    applyAiResult,
    addToast
  } = useApp()

  const [activeTab, setActiveTab] = useState('result')

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && aiDrawer.isOpen) {
        setAiDrawer(prev => ({ ...prev, isOpen: false }))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [aiDrawer.isOpen, setAiDrawer])

  if (!aiDrawer.isOpen) return null

  const { loading, actionType, cost, result, error, steps, thoughtTime } = aiDrawer

  const ACTION_TITLES = {
    proofread: 'ตรวจคำผิด & วรรคตอน (Proofread)',
    polish: 'ขัดเกลาสำนวนด้วย Style Persona',
    continuity: 'วิเคราะห์ความสมเหตุสมผล & ตรรกะ (Continuity)',
    plotBranch: '3 ทางเลือกดำเนินเรื่องต่อ (Plot Branching)',
    translate: 'การแปลวรรณกรรมภาษาอังกฤษ (Literary Translation)',
    fullBook: 'วิเคราะห์โครงเรื่องทั้งเล่ม (Full-Book Analysis)'
  }

  const ACTION_ICONS = {
    proofread: '🔍',
    polish: '✨',
    continuity: '🧠',
    plotBranch: '🌱',
    translate: '🌐',
    fullBook: '📚'
  }

  return (
    <div
      onClick={() => setAiDrawer(prev => ({ ...prev, isOpen: false }))}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-purple2/30 shadow-2xl cursor-default bg-[#151028]/95"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-plottrix-line/40 flex items-center justify-between bg-plottrix-panel2/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{ACTION_ICONS[actionType] || '✦'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {ACTION_TITLES[actionType] || 'ผลลัพธ์จาก AI'}
                </h3>
                <span className="bg-plottrix-purple/20 text-plottrix-purple2 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-plottrix-purple/30">
                  {cost} Trix
                </span>
              </div>
              <p className="text-[11px] text-plottrix-muted">
                Smart Model Routing • Dynamic Vocabulary • Style Persona
              </p>
            </div>
          </div>

          <button
            onClick={() => setAiDrawer(prev => ({ ...prev, isOpen: false }))}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 1. THINKING STATE (Using React Bits <ThoughtLine />) */}
          {loading && (
            <div className="py-14 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="p-6 rounded-2xl bg-plottrix-panel2/70 border border-plottrix-purple2/30 shadow-glow-purple max-w-md w-full flex flex-col items-center">
                <ThoughtLine
                  working={true}
                  steps={steps}
                  label="Plottrix AI กำลังวิเคราะห์..."
                  doneLabel="วิเคราะห์เสร็จใน"
                  glyph="sparkle"
                  fontSize={16}
                  breathPeriod={1.5}
                  breathDepth={0.45}
                  settleDuration={350}
                  color="#c29aff"
                  glyphColor="#e9c78c"
                  collapsible={true}
                  collapseOnSettle={false}
                  showTimer={true}
                />
              </div>

              <div className="text-xs text-plottrix-muted max-w-sm leading-relaxed">
                ระบบกำลังเชื่อมโยงคลังคำศัพท์เฉพาะหมวด ตรวจสอบกับข้อมูลตัวละครใน Character Bible และปรับสำนวนตาม Persona ของคุณ
              </div>
            </div>
          )}

          {/* 2. ERROR STATE */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
              <div className="font-bold text-sm mb-1 text-red-300">เกิดข้อผิดพลาด</div>
              <p>{error}</p>
              <button
                onClick={() => setAiDrawer(prev => ({ ...prev, isOpen: false }))}
                className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          )}

          {/* 3. COMPLETED STATE (Using React Bits <StatusMark /> at the top banner) */}
          {!loading && result && (
            <div className="space-y-5">
              {/* Status Header with StatusMark */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-transparent border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusMark
                    status="done"
                    size={22}
                    fontSize={13}
                    doneColor="#74d9b4"
                    label="คิดวิเคราะห์และประมวลผลเสร็จสมบูรณ์"
                  />
                </div>
                {thoughtTime > 0 && (
                  <span className="text-[11px] text-plottrix-mint font-semibold bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    ใช้เวลา {thoughtTime.toFixed(1)}s
                  </span>
                )}
              </div>

              {/* ACTION RESULT: PROOFREAD */}
              {actionType === 'proofread' && (
                <div className="space-y-4">
                  <p className="text-xs text-plottrix-text/90 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                    {result.explanation}
                  </p>

                  {result.corrections && result.corrections.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-plottrix-purple2 uppercase tracking-wider">
                        รายการจุดที่แนะนำให้แก้ไข ({result.corrections.length} จุด)
                      </h4>
                      <div className="rounded-xl border border-plottrix-line/40 overflow-hidden divide-y divide-plottrix-line/20">
                        {result.corrections.map((item, idx) => (
                          <div key={idx} className="p-3 bg-plottrix-panel2/50 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="line-through text-red-400 font-medium">{item.original}</span>
                              <span className="text-plottrix-muted">→</span>
                              <span className="text-emerald-400 font-bold">{item.replacement}</span>
                            </div>
                            <span className="text-[11px] text-plottrix-muted italic">{item.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Corrected Preview */}
                  <div className="p-4 rounded-xl bg-plottrix-bg2/90 border border-plottrix-line/50 space-y-2">
                    <span className="text-[11px] text-plottrix-muted font-bold uppercase tracking-wider">
                      ข้อความหลังปรับปรุง
                    </span>
                    <p className="text-xs sm:text-sm text-plottrix-text leading-relaxed whitespace-pre-wrap font-thai">
                      {result.correctedText}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => applyAiResult(result.correctedText)}
                      className="px-4 py-2 rounded-xl btn-primary-purple text-xs font-bold shadow-md flex items-center gap-1.5"
                    >
                      <span>✓ นำไปแทนที่ในต้นฉบับทันที</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION RESULT: POLISH */}
              {actionType === 'polish' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-plottrix-purple/10 border border-plottrix-purple/30 text-xs text-plottrix-purple2 leading-relaxed">
                    <strong>สรุปการขัดเกลา: </strong>{result.changesSummary}
                  </div>

                  {/* Polished Text Display */}
                  <div className="p-4 rounded-xl bg-plottrix-bg2/90 border border-plottrix-line/50 space-y-2">
                    <span className="text-[11px] text-plottrix-purple2 font-bold uppercase tracking-wider">
                      สำนวนที่ผ่านการเกลา (พร้อมคำไวพจน์ & จังหวะอ่าน)
                    </span>
                    <p className="text-xs sm:text-sm text-plottrix-text leading-relaxed whitespace-pre-wrap font-thai">
                      {result.polishedText}
                    </p>
                  </div>

                  {result.suggestions && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                      <span className="text-[11px] font-bold text-plottrix-gold">ข้อสังเกตเพิ่มเติมสำหรับนักเขียน:</span>
                      <ul className="text-xs text-plottrix-muted space-y-1 list-disc list-inside">
                        {result.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => applyAiResult(result.polishedText)}
                      className="px-4 py-2 rounded-xl btn-primary-purple text-xs font-bold shadow-md flex items-center gap-1.5"
                    >
                      <span>✨ แทนที่ด้วยสำนวนนี้</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION RESULT: CONTINUITY */}
              {actionType === 'continuity' && (
                <div className="space-y-4">
                  {/* Score */}
                  <div className="p-4 rounded-xl bg-plottrix-panel2/60 border border-plottrix-line/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-plottrix-muted block">คะแนนความต่อเนื่อง & ตรรกะ</span>
                      <span className="text-2xl font-bold text-plottrix-mint">{result.consistencyScore}/100</span>
                    </div>
                    <div className="text-right text-xs text-plottrix-muted">
                      <div>{result.timelineCheck}</div>
                      <div className="text-[11px] text-plottrix-purple2 mt-0.5">{result.bibleAlignment}</div>
                    </div>
                  </div>

                  {/* Issues */}
                  {result.inconsistencies && result.inconsistencies.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-plottrix-purple2 uppercase tracking-wider">
                        จุดที่ตรวจพบความคลาดเคลื่อน ({result.inconsistencies.length})
                      </span>
                      {result.inconsistencies.map((issue, i) => (
                        <div key={i} className="p-3 rounded-xl bg-plottrix-bg2 border border-plottrix-line/50 space-y-1 text-xs">
                          <div className="flex items-center justify-between font-bold text-amber-300">
                            <span>⚠️ {issue.issue}</span>
                            <span className="text-[10px] text-plottrix-muted">ตัวละคร: {issue.character}</span>
                          </div>
                          <p className="text-plottrix-text/80">{issue.solution}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACTION RESULT: PLOT BRANCH */}
              {actionType === 'plotBranch' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-plottrix-purple2 uppercase tracking-wider block">
                    3 ทางเลือกดำเนินเรื่องต่อ (เลือกเส้นทางที่โดนใจคุณ)
                  </span>

                  <div className="grid grid-cols-1 gap-3">
                    {result.branches?.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-plottrix-panel2/70 border border-plottrix-line/40 hover:border-plottrix-purple2/50 transition space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white group-hover:text-plottrix-purple2 transition">
                            {b.title}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-plottrix-purple/20 text-plottrix-purple2 font-semibold">
                            ทางเลือก {idx + 1}
                          </span>
                        </div>
                        <p className="text-xs text-plottrix-text/80 leading-relaxed">
                          {b.summary}
                        </p>
                        <div className="p-2.5 rounded-lg bg-black/40 text-[11px] text-plottrix-muted italic border-l-2 border-plottrix-purple2">
                          "{b.previewText}"
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => applyAiResult(b.previewText)}
                            className="px-3 py-1.5 rounded-lg bg-plottrix-purple/20 hover:bg-plottrix-purple text-plottrix-purple2 hover:text-white text-xs font-semibold transition"
                          >
                            + แทรกย่อหน้านี้ลงในเรื่อง
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION RESULT: TRANSLATE */}
              {actionType === 'translate' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-plottrix-purple/10 border border-plottrix-purple/30 text-xs text-plottrix-purple2">
                    {result.notes}
                  </div>

                  <div className="p-4 rounded-xl bg-plottrix-bg2/90 border border-plottrix-line/50 space-y-2">
                    <span className="text-[11px] text-plottrix-purple2 font-bold uppercase tracking-wider">
                      English Literary Prose
                    </span>
                    <p className="text-xs sm:text-sm text-plottrix-text leading-relaxed whitespace-pre-wrap font-serif">
                      {result.translatedText}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-plottrix-line/30">
                    <button
                      type="button"
                      onClick={() => setAiDrawer(prev => ({ ...prev, isOpen: false }))}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                    >
                      ✕ ปิดหน้าต่าง (Esc)
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(result.translatedText)
                          addToast({
                            title: 'คัดลอกคำแปลลงคลิปบอร์ดแล้ว',
                            description: 'พร้อมนำไปใช้งานหรือจัดพิมพ์ภาษาอังกฤษ',
                            fuseColor: '#74d9b4'
                          })
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        คัดลอกคำแปล (Copy)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          applyAiResult(result.translatedText)
                          setAiDrawer(prev => ({ ...prev, isOpen: false }))
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        ✓ แทนที่ในหน้ากระดาษ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
