import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'

const EXAMPLES = [
  {
    id: 'rain',
    title: 'ฉากฝนพรำ & ความทรงจำ',
    genre: 'ดราม่า / โรแมนติก',
    thai: '“แม้สายฝนจะกลบเสียงทุกอย่างในค่ำคืนนี้ แต่เธอยังคงจำคำสัญญานั้นได้ชัดเจน”',
    english: '“Even as the ceaseless rain drowned out the world tonight, the memory of that promise remained etched vividly in her heart.”',
    contextNotes: 'คงสรรพนาม "เธอ" และเพิ่มน้ำเสียงวรรณกรรม "etched vividly" ตามสุนทรียศาสตร์ต้นฉบับ'
  },
  {
    id: 'battle',
    title: 'ฉากประดาบ & สืบสวน',
    genre: 'พีเรียด / แฟนตาซี',
    thai: '“ประกายดาบปะทะกันกลางหมอกควัน เสียงเหล็กกล้ากังวานสะท้อนทั่วลานหิน”',
    english: '“Blades clashed amidst the swirling mist, the sharp ring of steel resounding across the stone courtyard.”',
    contextNotes: 'เลือกใช้กริยาจังหวะกระชับ ฉับไว คมชัด ตรงตามบรรยากาศฉากต่อสู้'
  },
  {
    id: 'mystery',
    title: 'ฉากเปิดเผยความลับ',
    genre: 'สืบสวน / ระทึกขวัญ',
    thai: '“เงาในกระจกไม่ได้ขยับตามเขา รอยยิ้มเย็นเยียบนั้นเป็นของใครบางคนที่ยืนอยู่ข้างหลัง”',
    english: '“The reflection in the mirror didn’t mimic his move. That cold, chilling smirk belonged to someone standing right behind him.”',
    contextNotes: 'คุมจังหวะความหลอนและพักจังหวะคำ (Pacing) ตาม Persona [ระทึกขวัญ]'
  }
]

export default function TranslationSection() {
  const { addToast } = useApp()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [isReversed, setIsReversed] = useState(false)

  const current = EXAMPLES[selectedIdx]

  const handleToggle = () => {
    setIsReversed(!isReversed)
    addToast({
      title: 'สลับทิศทางภาษา',
      description: !isReversed ? 'English → Thai (ถอดความวรรณกรรม)' : 'Thai → English (คงน้ำเสียงตัวละคร)',
      fuseColor: '#a855f7'
    })
  }

  return (
    <section className="section py-20 relative overflow-hidden" id="translation">
      <div className="wrap relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="section-head mb-0">
            <span className="eyebrow">LITERARY CONTEXT TRANSLATION</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2 mb-4 leading-tight">
              แปลวรรณกรรมไทย-อังกฤษ <br className="hidden sm:inline" />
              <span className="grad">คงน้ำเสียง ไม่แข็งทื่อ</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              ไม่ใช่แค่การแปลตรงตัวตามพจนานุกรม แต่ Plottrix ผูกโยงข้อมูลตัวละคร ความสัมพันธ์ และอารมณ์ของเรื่อง เพื่อให้ได้คำแปลที่ลื่นไหลระดับสากล
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleToggle}
              className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
            >
              <span>⇄</span>
              <span>สลับทิศทางภาษา ({isReversed ? 'EN → TH' : 'TH → EN'})</span>
            </button>
          </div>
        </div>

        {/* Scene Selector Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {EXAMPLES.map((ex, i) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedIdx === i
                  ? 'bg-purple-600/40 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{ex.title}</span>
              <span className="text-[10px] opacity-70 ml-1.5 font-normal">({ex.genre})</span>
            </button>
          ))}
        </div>

        {/* Dual Translation Display Surface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Source Card */}
          <div className="rounded-3xl bg-[#130d28]/90 border border-purple-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>{isReversed ? 'ENGLISH · ORIGINAL SOURCE' : 'ภาษาไทย · ต้นฉบับนักเขียน'}</span>
                </span>
                <span className="text-slate-500 font-mono">01</span>
              </div>

              <div className="font-serif text-lg sm:text-xl leading-relaxed text-slate-200 min-h-[90px]">
                {isReversed ? current.english : current.thai}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>บริบท: {current.title}</span>
              <span>{current.genre}</span>
            </div>
          </div>

          {/* Target Card */}
          <div className="rounded-3xl bg-gradient-to-br from-[#1c123b]/95 via-[#130b28]/95 to-[#0e071e]/98 border border-purple-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(112,48,220,0.25)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 text-xs font-bold">
                <span className="text-purple-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isReversed ? 'ภาษาไทย · คำแปลระดับวรรณกรรม' : 'ENGLISH · LITERARY TRANSLATION'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                  Context Locked ✓
                </span>
              </div>

              <div className="font-serif text-lg sm:text-xl leading-relaxed text-white min-h-[90px]">
                {isReversed ? current.thai : current.english}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-400/25 text-xs text-purple-200 flex items-start gap-2">
                <span className="text-sm">✦</span>
                <span className="text-[11px] leading-relaxed">
                  {current.contextNotes}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
