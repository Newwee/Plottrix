import React from 'react'
import { useApp } from '../../context/AppContext'

const TRIX_ACTIONS = [
  {
    icon: '✍️',
    cost: '1 Trix',
    name: 'ตรวจแก้คำผิด & คำพ้องเสียง',
    sub: 'Thai Proofread & Grammar Engine',
    desc: 'ตรวจจับคำสะกดผิด คำพ้องเสียง (น่า/หน้า, ผูก/ผูกมัด) และเกลาการเว้นวรรคตอนตามบริบทภาษาไทย โดยรักษาเนื้อหาเดิมของคุณ 100%',
    tag: 'ใช้งานบ่อยที่สุด'
  },
  {
    icon: '🌐',
    cost: '2 Trix',
    name: 'แปลภาษาวรรณกรรม',
    sub: 'Context Literary Translation',
    desc: 'แปลภาษาไทย ↔ อังกฤษ หรือแปลปรับภาษาโบราณ/กำลังภายใน โดยคงอารมณ์ น้ำเสียง และบุคลิกเฉพาะตัวของตัวละครไว้ครบถ้วน',
    tag: 'ไทย ↔ อังกฤษ'
  },
  {
    icon: '🔍',
    cost: '3 Trix',
    name: 'เกลาสำนวน & ล็อกเสียง',
    sub: 'Style Persona & Vocabulary Bank',
    desc: 'ปรับระดับภาษาให้ลื่นไหล สละสลวย ตามโปรไฟล์นักเขียน 3 สไตล์ พร้อมดึงคำศัพท์เฉพาะแนว (แฟนตาซี, สืบสวน, พีเรียด) มาใช้อย่างเป็นธรรมชาติ',
    tag: 'คุมโทน 100%'
  },
  {
    icon: '🌿',
    cost: '4 Trix',
    name: 'แตก 3 ทางเลือกพล็อต',
    sub: 'Smart Branching & Plot Spark',
    desc: 'เมื่อเจอปัญหาคิดพล็อตไม่ออก AI จะเสนอไอเดียทางแยก 3 ทิศทาง พร้อมย่อหน้าเกริ่นนำเพื่อจุดประกายให้นักเขียนนำไปต่อยอดและเขียนต่อเอง',
    tag: 'แก้ปัญหาตัน'
  },
  {
    icon: '🧠',
    cost: '5 Trix',
    name: 'วิเคราะห์ลึก Story Bible',
    sub: '15+ Chapters Deep Memory Audit',
    desc: 'ตรวจสอบความสอดคล้องของประวัติตัวละคร ความสัมพันธ์ และปมเรื่องย้อนหลังกว่า 15 บท ป้องกันความจำเสื่อมและจุดขัดแย้งของเนื้อเรื่อง',
    tag: 'ความจำแม่นยำ'
  }
]

export default function TrixCoinSection() {
  const { navigateTo, setActiveModal } = useApp()

  return (
    <section className="section relative z-10 bg-transparent py-20" id="coin-trix">
      <div className="wrap max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-4">
            <img
              src="/Logo/TrixCoinLogo.png"
              alt="Trix Coin"
              className="w-4 h-4 object-contain inline-block"
            />
            <span>PLOTTRIX TOKEN ECONOMY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Coin Trix — เหรียญพลังขับเคลื่อน <br />
            <span className="grad">AI ผู้ช่วยบรรณาธิการของคุณ</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            ไม่ใช่ระบบเหมาจ่ายราคาแพง แต่คิดตามการใช้งานจริงแบบโปร่งใส 100%{' '}
            <strong className="text-amber-300">1 Trix = ตรวจคำผิด 1 ครั้ง</strong>{' '}
            ไม่มีหักเงินอัตโนมัติ ไม่ต้องผูกบัตรเครดิต พร้อมสิทธิ์รับฟรีทุกวัน
          </p>
        </div>

        {/* Hero Coin Feature Showcase Banner */}
        <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#231840]/90 via-[#181130]/90 to-[#100b22]/95 p-8 sm:p-10 mb-14 shadow-[0_20px_60px_rgba(245,158,11,0.15)] backdrop-blur-xl overflow-hidden">
          {/* Ambient Lighting Behind Coin */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left Coin Visual with Pulsing Glow */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/40 via-yellow-400/20 to-purple-600/30 blur-xl animate-pulse" />
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-3 bg-gradient-to-b from-[#2a1d4a] to-[#150f29] border border-amber-400/40 shadow-2xl relative flex items-center justify-center transform group-hover:scale-105 group-hover:rotate-3 transition duration-500">
                  <img
                    src="/Logo/TrixCoinLogo.png"
                    alt="Coin Trix Logo"
                    className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]"
                  />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  <span>✦</span> เหรียญมาตรฐานประจำ Plottrix Studio
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  เริ่มต้นด้วย <span className="text-amber-300">30 Trix ฟรี</span> ทันที
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
                  สมาชิกใหม่ทุกคนได้รับ 30 Trix ไปทดลองเขียนและใช้ AI เกลาสำนวนได้ทันที พร้อมกดรับฟรีได้อีก +3 Trix ทุกวัน
                </p>
              </div>
            </div>

            {/* Right Action CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => navigateTo('workspace_home')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-sm shadow-[0_10px_25px_rgba(245,158,11,0.35)] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <img src="/Logo/TrixCoinLogo.png" alt="Coin" className="w-5 h-5 object-contain" />
                <span>รับ 30 Trix แล้วเริ่มเขียน</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('pricing')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition cursor-pointer"
              >
                ดูแพ็กเกจ &amp; เติมเหรียญ
              </button>
            </div>
          </div>
        </div>

        {/* Feature Breakdown: What Coin Trix Can Do */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>⚡</span> Coin Trix ทำอะไรได้บ้าง?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                อัตราการใช้เหรียญต่อคำสั่ง AI แต่ละฟีเจอร์ คิดตามจริง ไม่หมดอายุในแพลน Pro
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              5 ฟังก์ชัน AI หลัก
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRIX_ACTIONS.map((action, idx) => (
              <div
                key={action.name}
                className="rounded-2xl border border-white/10 bg-[#17112c]/80 hover:bg-[#1f163b]/90 hover:border-amber-400/40 p-6 flex flex-col justify-between shadow-xl transition-all duration-300 group relative backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 transition duration-300">
                      {action.icon}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-extrabold shadow-sm">
                      <img src="/Logo/TrixCoinLogo.png" alt="Coin" className="w-3.5 h-3.5 object-contain" />
                      <span>{action.cost}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20 inline-block mb-2">
                    {action.tag}
                  </span>

                  <h4 className="text-base font-bold text-white group-hover:text-amber-200 transition">
                    {action.name}
                  </h4>
                  <p className="text-[11px] font-mono text-purple-300 mb-2.5">
                    {action.sub}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {action.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span>สถานะ: พร้อมใช้งาน</span>
                  <span className="text-emerald-400 font-semibold">✓ รวมในทุกบัญชี</span>
                </div>
              </div>
            ))}

            {/* Sixth Card: Daily Free Claim Promo */}
            <div className="rounded-2xl border border-dashed border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-transparent p-6 flex flex-col justify-between shadow-xl backdrop-blur-md text-center sm:text-left">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
                    🎁
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    ฟรีทุกวัน
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  รับฟรี +3 Trix ทุกวัน
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  เพียงล็อกอินและเข้าสู่สตูดิโอ Plottrix ทุกวัน สามารถกดปุ่มรับเหรียญ Trix ฟรีวันละ 3 เหรียญเพื่อใช้งานต่อเนื่องได้ตลอดชีวิต
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('workspace_home')}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>เข้าสู่ Workspace ไปรับเหรียญ</span>
                <span>↗</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Steps: How Coin Trix Works */}
        <div className="rounded-2xl border border-white/10 bg-[#140e26]/70 p-8 backdrop-blur-md">
          <h3 className="text-center text-lg sm:text-xl font-bold text-white mb-8">
            💡 3 ขั้นตอนง่ายๆ ในการใช้งาน Coin Trix
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 mx-auto rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 font-extrabold text-sm mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-white mb-1">รับเหรียญฟรีทันที</h4>
              <p className="text-xs text-slate-400">
                รับ 30 Trix ทันทีเมื่อสร้างบัญชี และรับเพิ่มฟรี +3 Trix ทุกวันที่เข้าเขียน
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 mx-auto rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 font-extrabold text-sm mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-white mb-1">เลือกใช้เฉพาะจุด</h4>
              <p className="text-xs text-slate-400">
                ไฮไลต์ข้อความที่ต้องการ แล้วคลิกคำสั่ง AI เช่น แก้คำผิด (1 Trix) หรือ เกลาสำนวน (3 Trix)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 mx-auto rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 font-extrabold text-sm mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-white mb-1">ควบคุมได้ 100%</h4>
              <p className="text-xs text-slate-400">
                เหรียญถูกหักเฉพาะเมื่อกดเรียกใช้จริง ผลลัพธ์ต้องผ่านการกดยืนยันของคุณเสมอ
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
