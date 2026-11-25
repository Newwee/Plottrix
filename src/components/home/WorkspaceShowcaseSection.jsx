import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

const HOTSPOT_DATA = {
  editor: {
    id: 'editor',
    label: 'Distraction-free Editor',
    icon: '▤',
    badge: 'พื้นที่เขียนต้นฉบับ',
    title: 'พื้นที่พิมพ์งานสมาธิสูง พร้อมระบบบันทึกเรียลไทม์',
    desc: 'นำเข้าไฟล์ .docx / .md หรือเริ่มเขียนใหม่ได้ทันที มีประวัติเวอร์ชันย้อนหลัง 30 วัน และจัดหน้าตามมาตรฐานวรรณกรรมไทย'
  },
  notes: {
    id: 'notes',
    label: 'Character & Lore Bible',
    icon: '♙',
    badge: 'คลังข้อมูลโลกนิยาย',
    title: 'ไบเบิลตัวละคร ความสัมพันธ์ และตรรกะโลกนิยาย',
    desc: 'บันทึกประวัติตัวละคร ปมความลับ และกฎของโลก เพื่อให้ AI ผู้ช่วยบรรณาธิการใช้อ้างอิงเช็คความต่อเนื่องข้ามตอนย้อนหลังได้ถึง 15 ตอน'
  },
  assistant: {
    id: 'assistant',
    label: 'Style Persona & Dictionary',
    icon: '✧',
    badge: 'ปรับแต่งสำนวนเฉพาะตัว',
    title: 'จูนน้ำเสียง AI ให้ตรงกับสำนวนปลายปากกาของคุณ',
    desc: 'เลือกหรือสร้าง Style Persona ได้สูงสุด 3 โปรไฟล์ พร้อมคลังคำศัพท์เฉพาะ (Custom Dictionary) และคลังคำศัพท์นิยายเปิดใช้ฟรีทุกแพลน'
  }
}

export default function WorkspaceShowcaseSection() {
  const { navigateTo, addToast, setActiveModal } = useApp()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('editor')
  const current = HOTSPOT_DATA[activeTab]

  const handleLockedDemoAction = (title, message, fuseColor) => {
    if (!user) {
      setActiveModal('auth')
      addToast({
        title: 'ต้องเข้าสู่ระบบก่อนใช้งาน 🔒',
        description: 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อใช้งานเครื่องมือ AI ในสตูดิโอจริง',
        fuseColor: '#ff7fa0'
      })
      return
    }
    addToast({ title, description: message, fuseColor })
  }

  return (
    <section className="section py-20 relative overflow-hidden" id="workspace">
      <div className="wrap relative z-10">
        <div className="section-head mb-12">
          <span className="eyebrow">WORKSPACE PREVIEW</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2 mb-4 leading-tight">
            พื้นที่เขียนและ <span className="grad">สตูดิโอบรรณาธิการ</span> ในหน้าเดียว
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            ไม่ต้องสลับโปรแกรมไปมาระหว่างโปรแกรมพิมพ์งานและแชต AI เพราะ Plottrix รวมทุกอย่างไว้ในที่เดียว ทั้งโครงเรื่อง ตัวละคร และคลังคำศัพท์
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            {Object.values(HOTSPOT_DATA).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-purple-600/40 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-purple-300">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-purple-600/25 border border-purple-400/40 transition flex items-center gap-2 cursor-pointer hover:scale-105"
            onClick={() => navigateTo('workspace')}
          >
            <span>✦</span>
            <span>เปิดสตูดิโอจริง →</span>
          </button>
        </div>

        {/* Main Showcase Stage */}
        <div className="rounded-3xl border border-purple-500/30 bg-[#120a28]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">Plottrix Studio</span>
              <span className="text-slate-500">•</span>
              <span className="text-purple-300 font-semibold">{current.title}</span>
            </div>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-400/30">
              {current.badge}
            </span>
          </div>

          {/* Dynamic Interactive Stage Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'editor' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Rail */}
                  <div className="lg:col-span-3 space-y-1.5 p-4 rounded-2xl bg-black/30 border border-white/5 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">สารบัญตอนในเรื่อง</div>
                    <div className="p-2 rounded-xl bg-purple-600/30 text-white font-bold border border-purple-400/30">▤ ตอนที่ 1: อีเมลจากตัวเอง</div>
                    <div className="p-2 rounded-xl text-slate-400 hover:text-white transition">▤ ตอนที่ 2: รอยแยกในสัญญา</div>
                    <div className="p-2 rounded-xl text-slate-400 hover:text-white transition">▤ ตอนที่ 3: เงาในห้องทำงาน</div>
                    <div className="p-2 rounded-xl text-purple-300 hover:text-white font-semibold">＋ เพิ่มตอนใหม่...</div>
                  </div>

                  {/* Center Typing Area */}
                  <div className="lg:col-span-6 p-6 rounded-2xl bg-black/40 border border-purple-500/20 shadow-inner font-serif space-y-4">
                    <div className="text-[11px] font-mono text-purple-300">บทที่ 1 · หน้า 1 / 1 · 1,248 คำ</div>
                    <h3 className="text-xl font-bold text-white">ตอนที่ 1: อีเมลจากตัวเอง</h3>
                    <p className="text-slate-200 leading-relaxed text-sm sm:text-base">
                      เสียงแจ้งเตือนจากโทรศัพท์มือถือดังขึ้นท่ามกลางความเงียบสงัดของห้องชุดชั้นสิบเจ็ด รามไม่ได้ขยับตัวในทันที เขานั่งนิ่งอยู่หน้าโต๊ะทำงานไม้สีเข้ม...
                    </p>

                    {/* Interactive Floating Toolbar */}
                    <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-400/40 inline-flex items-center gap-1.5 shadow-lg">
                      <button
                        type="button"
                        onClick={() => handleLockedDemoAction('แก้คำผิด (1 Trix)', 'ตรวจสอบคำพ้องเสียงและวรรคตอนเสร็จสิ้น', '#38bdf8')}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                      >
                        ✎ แก้คำผิด (1)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLockedDemoAction('เกลาสำนวน (1 Trix)', 'ปรับสำนวนให้ตรงกับ Persona ดราม่าลึกลับ', '#c084fc')}
                        className="px-2.5 py-1 rounded-lg bg-purple-600/60 hover:bg-purple-600 text-xs font-bold text-white transition cursor-pointer"
                      >
                        ✦ เกลาสำนวน (1)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLockedDemoAction('แปลวรรณกรรม (3 Trix)', 'แปลเป็นภาษาอังกฤษคงน้ำเสียงตัวละคร', '#34d399')}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                      >
                        文 แปลภาษา (3)
                      </button>
                    </div>
                  </div>

                  {/* Right Assistant Panel */}
                  <div className="lg:col-span-3 space-y-3 p-4 rounded-2xl bg-black/30 border border-white/5 text-xs">
                    <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">EDITORIAL CHECK</div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="font-bold text-white mb-1">ความต่อเนื่องข้ามตอน</div>
                      <div className="text-[11px] text-emerald-300">✓ ตรวจพบความสอดคล้อง 98%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="font-bold text-white mb-1">สถานะคลังคำศัพท์</div>
                      <div className="text-[11px] text-slate-300">เปิดใช้คลังแนวสืบสวน (500+ คำ)</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <img src="/Logo/ProfileD/plottrix_profile_512.png" alt="ราม" className="w-12 h-12 rounded-xl object-cover border border-purple-400/40" />
                      <div>
                        <div className="font-bold text-white text-base">ราม (Tharm)</div>
                        <div className="text-[11px] text-purple-300">ตัวเอก / ผู้ก่อตั้ง NINTH ROOM</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      สูญเสียความทรงจำ 19 วันก่อนเกิดเหตุ ฉลาด รอบคอบ ช่างสังเกต แต่มีปัญหาเรื่องความไว้วางใจ
                    </p>
                    <div className="text-[10px] text-amber-300 font-mono">✦ ปมความลับ: อีเมลที่ส่งหาตัวเองล่วงหน้า</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl">🏢</div>
                      <div>
                        <div className="font-bold text-white text-base">บริษัท NINTH ROOM</div>
                        <div className="text-[11px] text-indigo-300">สถานที่ &amp; โลกนิยาย (Lore)</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      สตาร์ทอัพที่ก่อตั้งโดยเพื่อนร่วมชั้น 4 คน เงิน 18.6 ล้านหายไปพร้อมการล้มละลาย
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">✦ กฎ: AI จะเช็คสถานะทางกฎหมายทุกครั้งที่เอ่ยถึง</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-xl">⏳</div>
                      <div>
                        <div className="font-bold text-white text-base">ไทม์ไลน์ 19 วัน</div>
                        <div className="text-[11px] text-pink-300">ลำดับเหตุการณ์ข้ามตอน</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      บันทึกไทม์ไลน์ตั้งแต่วันที่ 1 ถึง 19 ก่อนวันเกิดเหตุ เพื่อไม่ให้เกิดพล็อตโฮล (Plot Holes)
                    </p>
                    <div className="text-[10px] text-emerald-300 font-mono">✓ อ้างอิงย้อนหลัง 15 ตอนอัตโนมัติ</div>
                  </div>
                </div>
              )}

              {activeTab === 'assistant' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-black/40 border border-purple-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-base flex items-center gap-2">
                        <span>✧</span>
                        <span>Style Persona ที่ใช้งานอยู่</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30 font-bold">
                        โปรไฟล์หลัก
                      </span>
                    </div>
                    <div className="text-sm font-bold text-purple-300">พรรณนาลึกซึ้ง (Poetic &amp; Atmospheric)</div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      เน้นบรรยากาศ สุนทรียภาพทางภาษา บรรยายภาพและประสาทสัมผัสคมชัด เหมาะกับนิยายสืบสวนและดราม่าจิตวิทยา
                    </p>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400">
                      ✦ รองรับการสร้าง Custom Skill Prompt ส่วนตัวเพื่อควบคุมแนวการเขียนอย่างแม่นยำ
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-base flex items-center gap-2">
                        <span>📖</span>
                        <span>Custom Dictionary &amp; คลังคำศัพท์</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                        เปิดฟรีทุกแพลน
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white">NINTH ROOM</span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white">ราม (Tharm)</span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white">วูบไหว</span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white">สลัวราง</span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white">เย็นเยียบ</span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/30 text-xs text-purple-200 border border-purple-400/30">＋ คำเฉพาะของคุณ</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      AI จะไม่เปลี่ยนชื่อเฉพาะ หรือคำศัพท์เฉพาะเรื่องที่คุณบันทึกไว้ในพจนานุกรมอย่างเด็ดขาด
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Bottom Footnote */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>{current.desc}</span>
            <button
              type="button"
              onClick={() => navigateTo('workspace')}
              className="text-purple-300 font-bold hover:text-white transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>ทดลองเขียนในสตูดิโอ</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
