import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function SettingsModal() {
  const {
    activeModal,
    setActiveModal,
    settings,
    setSettings,
    paperTheme,
    setPaperTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    startTour,
    addToast
  } = useApp()

  const [activeTab, setActiveTab] = useState('notifications') // 'notifications' | 'editor' | 'ai' | 'tour'

  if (activeModal !== 'settings') return null

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleRestartTour = () => {
    setActiveModal(null)
    startTour()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#130e24]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-plottrix-panel2/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h3 className="font-bold text-base text-white">
                การตั้งค่าระบบ (Workspace Settings)
              </h3>
              <p className="text-xs text-plottrix-muted">
                ปรับแต่งการแจ้งเตือน สภาพแวดล้อมห้องเขียน และพฤติกรรมของ AI
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-white/10 bg-black/20">
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'notifications'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🔔 การแจ้งเตือน (Notifications)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'editor'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            ✍️ หน้ากระดาษ (Editor)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'ai'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🤖 ผู้ช่วย AI (AI Preferences)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tour')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'tour'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🎯 คู่มือการใช้งาน (Tour)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-200">
          {/* Tab 1: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  ขนาดกล่องแจ้งเตือน (Notification Size)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'compact', label: 'กะทัดรัด (Compact)', desc: 'ประหยัดพื้นที่หน้าจอ' },
                    { id: 'standard', label: 'มาตรฐาน (Standard)', desc: 'ขนาดพอดีอ่านง่าย' },
                    { id: 'large', label: 'ขนาดใหญ่ (Large)', desc: 'เห็นชัดเจนสะดุดตา' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateSetting('notifySize', opt.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        settings.notifySize === opt.id
                          ? 'border-purple-400 bg-purple-600/20 text-white'
                          : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/25'
                      }`}
                    >
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div className="text-[10px] text-plottrix-muted mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  ระยะเวลาแสดงผล (Auto-Dismiss Duration)
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { dur: 3000, label: '3 วินาที' },
                    { dur: 5000, label: '5 วินาที' },
                    { dur: 8000, label: '8 วินาที' },
                    { dur: 0, label: 'ไม่ปิดอัตโนมัติ' }
                  ].map(opt => (
                    <button
                      key={opt.dur}
                      type="button"
                      onClick={() => updateSetting('notifyDuration', opt.dur)}
                      className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition ${
                        settings.notifyDuration === opt.dur
                          ? 'border-purple-400 bg-purple-600/20 text-white'
                          : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/25'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-white">เสียงเอฟเฟกต์แจ้งเตือน (Sound Effects)</div>
                  <div className="text-xs text-plottrix-muted">เล่นเสียงสั้นๆ เมื่อ AI ประมวลผลเสร็จสิ้น</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('notifySound', !settings.notifySound)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings.notifySound ? 'bg-purple-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.notifySound ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Editor */}
          {activeTab === 'editor' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  ฟอนต์เนื้อหา (Editor Typography)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'thai', label: 'ฟอนต์คลาสสิก (Sarabun)', family: 'Sarabun' },
                    { id: 'baijamjuree', label: 'ใบจามจุรี (Bai Jamjuree)', family: 'Bai Jamjuree' },
                    { id: 'kanit', label: 'คณิต (Kanit)', family: 'Kanit' },
                    { id: 'prompt', label: 'พร้อมต์ (Prompt)', family: 'Prompt' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id)}
                      className={`p-3 rounded-xl border text-center transition ${
                        fontFamily === f.id
                          ? 'border-purple-400 bg-purple-600/20 text-white'
                          : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/25'
                      }`}
                    >
                      <div className="font-bold text-xs">{f.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  ขนาดตัวอักษร: {fontSize}px
                </label>
                <input
                  type="range"
                  min={14}
                  max={24}
                  step={1}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  ธีมกระดาษห้องเขียน (Paper Theme)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'midnight', name: 'Midnight (รัตติกาล)', bg: '#0f0a1e' },
                    { id: 'sepia', name: 'Sepia (กระดาษถนอมสายตา)', bg: '#2b211b' },
                    { id: 'light', name: 'Clean Paper (สว่าง)', bg: '#f8fafc' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPaperTheme(t.id)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                        paperTheme === t.id
                          ? 'border-purple-400 bg-purple-600/20 text-white'
                          : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/25'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: t.bg }} />
                      <span className="font-bold text-xs">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: AI Preferences */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  ระดับความคิดสร้างสรรค์ของ AI (Creativity Mode)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'creative', label: 'เน้นจินตนาการ (Creative)', desc: 'เสนอสำนวนและพล็อตหักมุมหลากหลาย' },
                    { id: 'balanced', label: 'สมดุล (Balanced)', desc: 'รักษาแก่นเรื่องเดิม เติมเต็มอย่างพอดี' },
                    { id: 'strict', label: 'เคร่งครัดตามกรอบ (Strict)', desc: 'คงสำนวนเดิม 100% แก้เฉพาะข้อผิดพลาด' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateSetting('aiCreativity', opt.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        settings.aiCreativity === opt.id
                          ? 'border-purple-400 bg-purple-600/20 text-white'
                          : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/25'
                      }`}
                    >
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div className="text-[10px] text-plottrix-muted mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  ความเข้มข้นของการแทรกคลังคำศัพท์ (Vocab Bank Intensity)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'subtle', label: 'เบาบาง (Subtle)' },
                    { id: 'moderate', label: 'ปานกลาง (Moderate)' },
                    { id: 'rich', label: 'เข้มข้นสละสลวย (Rich)' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateSetting('aiVocabIntensity', opt.id)}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition ${
                        settings.aiVocabIntensity === opt.id
                          ? 'border-purple-400 bg-purple-600/20 text-white'
                          : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/25'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Tour */}
          {activeTab === 'tour' && (
            <div className="p-6 rounded-2xl bg-black/30 border border-white/10 text-center space-y-4">
              <span className="text-4xl block">🎯</span>
              <h4 className="font-bold text-base text-white">
                ทัวร์แนะนำการใช้งานระบบ (Interactive Onboarding)
              </h4>
              <p className="text-xs text-plottrix-muted max-w-md mx-auto leading-relaxed">
                ต้องการทบทวนวิธีใช้งานหรือไม่? ระบบจะพาคุณไปดูชั้นวางนิยาย, วิธีใช้สตูดิโอ 3 มิติ, การเรียก Floating AI Toolbar และการใช้คลังคำศัพท์ทีละสเต็ป
              </p>
              <button
                type="button"
                onClick={handleRestartTour}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-600/30 hover:brightness-110 transition"
              >
                เริ่มทัวร์แนะนำการใช้งานทันที →
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-end bg-black/30">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
          >
            บันทึกและปิด
          </button>
        </div>
      </div>
    </div>
  )
}
