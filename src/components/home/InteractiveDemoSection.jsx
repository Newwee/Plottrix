import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const ACTION_DATA = {
  proof: {
    title: 'แก้ไขคำผิด & ตรวจคำพ้องเสียง',
    cost: '1 Trix',
    icon: '✎',
    color: '#38bdf8',
    before: 'แสงไฟที่ริบหรี่ลงอย่างช้าๆ',
    after: 'แสงไฟที่ริบหรี่ลงอย่างช้า ๆ',
    explanation: 'ตรวจพบคำซ้ำที่ต้องใช้ไม้ยมก และปรับจังหวะการเว้นวรรคให้ถูกต้องตามหลักไวยากรณ์ไทยสากล'
  },
  word: {
    title: 'เกลาสำนวนตาม Style Persona',
    cost: '1 Trix',
    icon: '✦',
    color: '#c084fc',
    before: 'แสงไฟที่ริบหรี่ลงอย่างช้าๆ ก่อนจะก้าวเดินต่อไปในความมืด',
    after: 'ประกายแสงสุดท้ายค่อย ๆ วูบไหวราวกับกำลังจะมอดดับ ก่อนที่เขาจะสาวเท้ากลืนหายไปในความมืดมิด',
    explanation: 'ยกระดับวรรณศิลป์ตาม Persona [ดราม่าลึกลับ] เพิ่มผัสสะความเย็นเยียบและความสิ้นหวังโดยไม่เปลี่ยนเจตนาเดิม'
  },
  translate: {
    title: 'แปลวรรณกรรมอังกฤษคงน้ำเสียง',
    cost: '3 Trix',
    icon: '文',
    color: '#34d399',
    before: 'เขาหันหลังกลับไปมองแสงไฟที่ริบหรี่ลงอย่างช้าๆ',
    after: '"He glanced back at the slowly faltering embers of light, before stepping resolutely into the consuming dark."',
    explanation: 'แปลคำว่า "ริบหรี่" เป็น "faltering embers" เพื่อคงบรรยากาศสุนทรียศาสตร์ของฉาก'
  },
  plot: {
    title: 'แตก 3 ทางเลือกพล็อตตอนต่อไป',
    cost: '5 Trix',
    icon: '⑂',
    color: '#f43f5e',
    before: 'ก่อนจะก้าวเดินต่อไปในความมืด...',
    after: 'ทางเลือกที่ 1: แสงไฟดับพรึ่บพร้อมเสียงโลหะหล่นกระทบพื้น\nทางเลือกที่ 2: มีเงาร่างปริศนาดักรออยู่หน้าทางออกลับ\nทางเลือกที่ 3: ข้อความในโทรศัพท์สั่นเตือนว่า "อย่าหันหลังกลับมา"',
    explanation: 'ประมวลผลแรงขับดันตัวเอกและความขัดแย้งหลักเพื่อขยายฉากไคลแมกซ์'
  },
  continuity: {
    title: 'ตรวจสอบความต่อเนื่องข้ามตอน',
    cost: '3 Trix',
    icon: '◈',
    color: '#fbbf24',
    before: 'เช็คความสอดคล้องกับเนื้อเรื่องย้อนหลัง',
    after: '✓ ผ่านการตรวจสอบ: สอดคล้องกับอาการบาดเจ็บที่ขาของตัวเอกในบทที่ 2 และไม่มีสิ่งของหลุดบริบท',
    explanation: 'ตรวจสอบ Lore Bible และลำดับไทม์ไลน์อัตโนมัติ'
  },
  vocab: {
    title: 'คลังคำศัพท์นิยาย (เปิดใช้ฟรี)',
    cost: 'ฟรี',
    icon: '☷',
    color: '#818cf8',
    before: 'ค้นหาคำไวพจน์เฉพาะแนว',
    after: 'คำแนะนำ: สลัวราง, วูบไหว, เลือนราง, มืดมิด, เงาทะมึน, เงียบสงัด, เหน็บหนาว',
    explanation: 'ดึงคลังคำศัพท์เฉพาะนิยายสืบสวนและระทึกขวัญกว่า 500+ คำ'
  }
}

export default function InteractiveDemoSection() {
  const [activeAction, setActiveAction] = useState('word')
  const item = ACTION_DATA[activeAction]

  return (
    <section className="section py-20 relative overflow-hidden" id="highlight-action">
      <div className="wrap relative z-10">
        <div className="section-head mb-12">
          <span className="eyebrow">HIGHLIGHT-TO-ACTION</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2 mb-4 leading-tight">
            คลุมดำข้อความ <br className="hidden sm:inline" />
            แล้วเรียกใช้คำสั่ง <span className="grad">ได้ทันที</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            ไม่ต้องสลับหน้าจอไปพิมพ์พร้อมต์ยาวๆ ในแชต เพียงแค่คลุมดำข้อความในต้นฉบับ แถบคำสั่ง AI อัจฉริยะจะช่วยเกลา ตรวจสอบ หรือแตกพล็อตให้ในคลิกเดียว
          </p>
        </div>

        {/* Interactive Workspace Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Simulated Manuscript Paper */}
          <div className="lg:col-span-7 rounded-3xl bg-[#130d28]/90 border border-purple-500/25 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold">หน้ากระดาษต้นฉบับจริง · บทที่ 04</span>
                </div>
                <span className="text-purple-300 text-[11px] font-mono">1,248 คำ</span>
              </div>

              {/* Prose Container */}
              <div className="font-serif text-base sm:text-lg leading-relaxed text-slate-200 space-y-4">
                <p>
                  เสียงสายฝนกระหน่ำนอกหน้าต่างสะท้อนความเงียบงันภายในห้องทำงานไม้เก่า ชายหนุ่มทอดสายตามองเอกสารที่กระจัดกระจายบนโต๊ะด้วยความสับสน
                </p>

                {/* Highlighted text with floating action toolbar */}
                <div className="relative my-4 p-4 rounded-2xl bg-purple-950/40 border border-purple-400/40 shadow-inner">
                  {/* Floating Action Badge */}
                  <div className="absolute -top-3.5 left-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold tracking-wide shadow-md flex items-center gap-1.5">
                    <span>⚡ กำลังคลุมดำ</span>
                  </div>

                  <p className="font-medium text-white">
                    “เขาหันหลังกลับไปมอง{' '}
                    <mark className="bg-gradient-to-r from-purple-500/60 to-pink-500/60 text-white px-2 py-0.5 rounded-lg shadow-sm border border-purple-300/40 animate-pulse">
                      แสงไฟที่ริบหรี่ลงอย่างช้าๆ
                    </mark>{' '}
                    ก่อนจะก้าวเดินต่อไปในความมืด”
                  </p>
                </div>

                <p className="text-slate-400 text-sm">
                  ไม่มีใครรู้ว่าการก้าวเดินในครั้งนี้ จะนำพาเขาไปสู่จุดจบหรือการเริ่มต้นใหม่...
                </p>
              </div>
            </div>

            {/* Quick Action Selector Strip */}
            <div className="mt-8 pt-5 border-t border-white/10">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                คลิกเลือกคำสั่งเพื่อทดสอบการประมวลผล:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(ACTION_DATA).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveAction(key)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all duration-200 border cursor-pointer flex items-center justify-between ${
                      activeAction === key
                        ? 'bg-purple-600/40 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span style={{ color: info.color }}>{info.icon}</span>
                      <span>{info.title.split(' ')[0]}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono shrink-0">
                      {info.cost}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Output & Editorial Explanation */}
          <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-[#1c1238]/90 via-[#130b28]/95 to-[#0e071e]/98 border border-purple-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAction}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-base" style={{ color: item.color }}>
                      {item.icon}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-white text-sm sm:text-base">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-plottrix-muted">
                        ประมวลผลทันทีใน 0.4 วินาที
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-mono">
                    {item.cost}
                  </span>
                </div>

                {/* Result Block */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    ผลลัพธ์ที่นำไปใช้งานได้ทันที (1-Click Apply):
                  </div>
                  <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 text-white font-thai text-sm sm:text-base leading-relaxed whitespace-pre-line shadow-inner">
                    {item.after}
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>หลักการวิเคราะห์ของ AI:</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    {item.explanation}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-6 border-t border-white/10 text-center">
              <span className="text-[11px] text-plottrix-muted">
                ✦ นักเขียนมีอิสระ 100% ในการเลือกนำผลลัพธ์ไปใช้ หรือปฏิเสธได้ทุกเมื่อ
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
