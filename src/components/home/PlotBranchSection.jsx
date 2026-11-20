import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const BRANCHES = [
  {
    id: 1,
    tag: 'เส้นทาง 01 · สืบสวน & แอคชั่น',
    title: 'ตามหาผู้ส่งจดหมายทันที',
    impact: 'ความตึงเครียดสูง · เผชิญหน้าโดยตรง',
    badge: 'สายลุย',
    color: '#38bdf8',
    intro: 'เธอสังเกตตราประทับขี้ผึ้งสีชาดที่มุมซอง เป็นสัญลักษณ์ประจำตระกูลที่ควรจะสาบสูญไปเมื่อสิบปีก่อน หากไม่รีบออกตามหาเจ้าของในคืนนี้ เบาะแสเพียงชิ้นเดียวอาจถูกทำลายไปตลอดกาล...',
    hook: 'ปลายทาง: พบชายชุดดำที่โกดังร้างริมแม่น้ำ',
    promptIdea: 'ให้ AI ช่วยร่างบทสนทนาตอนเผชิญหน้าในโกดัง'
  },
  {
    id: 2,
    tag: 'เส้นทาง 02 · จิตวิทยา & หักมุม',
    title: 'ปกปิดเรื่องนี้ไว้เป็นความลับ',
    impact: 'ความลับซ่อนเร้น · หักหลังและไม่ไว้วางใจ',
    badge: 'สายวางแผน',
    color: '#c084fc',
    intro: 'เธอยัดจดหมายฉบับนั้นลงในลิ้นชักที่ล็อกกุญแจแน่นหนา พลางแสร้งทำสีหน้าเป็นปกติเมื่อได้ยินเสียงฝีเท้าของเพื่อนสนิทเดินเข้ามาใกล้ การโกหกครั้งแรกมักเริ่มต้นด้วยความกลัวเสมอ...',
    hook: 'ปลายทาง: เพื่อนสนิทเริ่มระแวงและแอบค้นห้อง',
    promptIdea: 'ให้ AI ช่วยคำนวณระดับความน่าสงสัยของพฤติกรรม'
  },
  {
    id: 3,
    tag: 'เส้นทาง 03 · ดราม่า & สะเทือนอารมณ์',
    title: 'เผชิญหน้ากับความจริงต่อหน้าทุกคน',
    impact: 'ความสัมพันธ์แตกหัก · จุดเปลี่ยนชีวิต',
    badge: 'สายดราม่า',
    color: '#f43f5e',
    intro: 'เธอหยิบจดหมายขึ้นมาแล้วก้าวเดินตรงไปยังโต๊ะอาหารกลางบ้าน วางกระดาษแผ่นนั้นลงตรงหน้าทุกคน "ใครจะอธิบายเรื่องนี้ได้บ้าง?" ความเงียบที่ตามมาเย็นเยียบยิ่งกว่าลมหนาวนอกหน้าต่าง...',
    hook: 'ปลายทาง: ความจริงเรื่องมรดกถูกเปิดเผยกลางวง',
    promptIdea: 'ให้ AI ช่วยคุมน้ำเสียงตัวละครตาม Character Bible'
  }
]

export default function PlotBranchSection() {
  const [activeId, setActiveId] = useState(1)
  const current = BRANCHES.find(b => b.id === activeId) || BRANCHES[0]

  return (
    <section className="section py-20 relative overflow-hidden" id="plot-branching">
      <div className="wrap relative z-10">
        <div className="section-head mb-12">
          <span className="eyebrow">INTERACTIVE PLOT BRANCHING</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2 mb-4 leading-tight">
            จุดประกายทางเลือกพล็อต <br className="hidden sm:inline" />
            <span className="grad">พร้อมย่อหน้าเกริ่นนำทันที</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            ตันเนื้อเรื่อง? ไม่รู้จะเขียนต่ออย่างไร? Plottrix ช่วยจำลอง 3 ทางแยกเนื้อเรื่องที่น่าติดตาม พร้อมย่อหน้าเริ่มต้นและผลกระทบต่อเนื่อง ให้คุณนำไปเขียนต่อ 100%
          </p>
        </div>

        {/* Story Scenario Prompt */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-purple-900/60 border border-purple-500/30 backdrop-blur-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-lg text-purple-300 shrink-0">
              ✉️
            </span>
            <div>
              <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                สถานการณ์ตั้งต้นในฉาก (5 Trix / ครั้ง)
              </div>
              <div className="text-sm sm:text-base font-bold text-white">
                “ตัวเอกเปิดซองจดหมายเก่า และพบข้อความขู่กรรโชกที่ไม่คาดคิด”
              </div>
            </div>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-300 font-mono self-start sm:self-auto shrink-0">
            3 ทางเลือกเนื้อเรื่อง
          </span>
        </div>

        {/* Branch Choices Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {BRANCHES.map(branch => {
            const isSelected = activeId === branch.id
            return (
              <div
                key={branch.id}
                onClick={() => setActiveId(branch.id)}
                className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#221447] via-[#160c33] to-[#0e0722] border-purple-400 shadow-[0_15px_35px_rgba(168,85,247,0.35)] scale-[1.02]'
                    : 'bg-[#120b24]/70 hover:bg-[#180f30] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: branch.color }}
                  />
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wider" style={{ color: branch.color }}>
                      {branch.tag}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold">
                      {branch.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mb-2 leading-snug">
                    {branch.title}
                  </h3>

                  <p className="text-xs text-slate-400 mb-4">
                    {branch.impact}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-white' : 'text-slate-400'}>
                    {isSelected ? 'กำลังดูเนื้อเรื่อง ✦' : 'คลิกเพื่อดูตัวอย่าง'}
                  </span>
                  <span className="text-purple-400">→</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Branch Detailed Preview Drawer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-gradient-to-br from-[#1c123b]/95 via-[#130b28]/95 to-[#0b0618]/98 border border-purple-500/35 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between pb-6 border-b border-white/10">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: current.color }}>
                  ย่อหน้าเกริ่นนำพร้อมเขียนต่อ
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {current.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-bold">
                  ✦ {current.hook}
                </span>
              </div>
            </div>

            {/* Prose Preview */}
            <div className="my-6 p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/10 text-slate-100 font-serif text-base sm:text-lg leading-relaxed shadow-inner">
              {current.intro}
            </div>

            {/* Smart Prompt Assistant Hint */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm">💡</span>
                <span>คำแนะนำต่อยอด: <strong className="text-slate-200">{current.promptIdea}</strong></span>
              </div>

              <span className="text-purple-300 font-medium">
                คัดลอกย่อหน้านี้ลงสตูดิโอของคุณได้ทันที ↗
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
