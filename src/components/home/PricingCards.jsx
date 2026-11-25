import React from 'react'
import PixelCard from '../react-bits/PixelCard'
import CountUp from '../react-bits/CountUp'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { formatExpiryDateTime, getTierInfo } from '../../lib/subscription'

const PLAN_VISUAL_META = {
  free: {
    sub: 'สำหรับทดลองเขียน & นิยายสั้น',
    cycle: '/ ตลอดชีพ',
    trixBadge: '✦ 30 Trix แรกเข้า + 3 Trix/วัน',
    buttonText: 'เริ่มต้นใช้งานฟรี',
    isPrimary: false,
    badge: null,
    pixelColors: ['#cbd5e1', '#94a3b8', '#64748b'],
    glowHex: '#94a3b8'
  },
  pro: {
    sub: 'แผนยอดนิยมสำหรับนักเขียนนิยายยาว',
    isPrimary: true,
    badge: '⭐ ยอดนิยม - Best Value',
    pixelColors: ['#f3e8ff', '#c084fc', '#9333ea'],
    glowHex: '#a855f7'
  },
  ultra: {
    sub: 'สำหรับนักเขียนมืออาชีพ & ทำ E-Book',
    isPrimary: false,
    badge: null,
    pixelColors: ['#fef3c7', '#fde047', '#ca8a04'],
    glowHex: '#eab308'
  }
}

export default function PricingCards({ currentPlan: propPlan, onSelectPlan }) {
  const { user } = useAuth()
  const {
    plan: contextPlan,
    planTier: contextPlanTier,
    trialUsed,
    trialCountdown,
    activeSubscription,
    membershipPlans,
    membershipPlansLoading,
    refreshMembershipStatus,
    activateProTrial,
    changePlan,
    openCheckoutModal,
    setActiveModal
  } = useApp()

  const activePlan = propPlan || contextPlan || 'Free Plan'
  const activeTier = getTierInfo(contextPlanTier || activePlan)
  const isProTrial = activeTier.id === 'pro_trial'

  if (membershipPlansLoading && (!membershipPlans || membershipPlans.length === 0)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-[430px] rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse p-6"
          />
        ))}
      </div>
    )
  }

  if (!membershipPlans || membershipPlans.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-center space-y-3">
        <div className="text-sm font-bold text-amber-200">
          ยังไม่สามารถโหลดตารางแพ็กเกจสมาชิกจากฐานข้อมูลได้ในขณะนี้
        </div>
        <p className="text-xs text-slate-300">
          ราคาและรายละเอียดแพ็กเกจถูกดึงจากฐานข้อมูลโดยตรงเพื่อความถูกต้อง กรุณาลองโหลดใหม่อีกครั้ง
        </p>
        <button
          type="button"
          onClick={() => refreshMembershipStatus?.()}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition"
        >
          โหลดข้อมูลแพ็กเกจใหม่
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto items-stretch">
      {membershipPlans.map((dbPlan) => {
        const slug = String(dbPlan.slug || 'free').toLowerCase()
        const visual = PLAN_VISUAL_META[slug] || PLAN_VISUAL_META.free
        const priceNum = Number(dbPlan.price || 0)
        const durationDays = Number(dbPlan.duration_days || 0)
        const trixGrant = Number(dbPlan.trix_grant || 0)
        const features = Array.isArray(dbPlan.features) ? dbPlan.features : []
        const itemTier = getTierInfo(slug)
        const isCurrentActive = isProTrial
          ? slug === 'pro'
          : activeTier.id === itemTier.id
        const isLowerTier = activeTier.rank > itemTier.rank
        const isPaidActive = Boolean(user && (activeTier.id === 'pro' || activeTier.id === 'ultra'))
        const canUpgradeToUltra = isPaidActive && activeTier.id === 'pro' && slug === 'ultra'
        const canRenewCurrentPaid = isPaidActive && activeTier.id === slug

        const trixBadgeText =
          visual.trixBadge || (trixGrant > 0 ? `✦ รับ ${trixGrant.toLocaleString()} Trix / ${durationDays} วัน` : '✦ สมาชิก Plottrix')
        const cycleText = visual.cycle || (durationDays > 0 ? `/ ${durationDays} วัน` : '')

        return (
          <PixelCard
            key={dbPlan.id || slug}
            className={`price-card relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl transition-all duration-300 ${
              visual.isPrimary
                ? 'featured border border-purple-500/50 shadow-[0_12px_40px_rgba(147,51,234,0.28)] ring-1 ring-purple-400/40 bg-gradient-to-b from-[#2a1745] to-[#140d24]'
                : 'border border-plottrix-line/40 bg-plottrix-panel2/60 hover:border-purple-400/30'
            }`}
            colors={visual.pixelColors}
            glowHex={visual.glowHex}
          >
            <div className="flex items-center justify-between mb-3 min-h-[26px]">
              {visual.badge && !isProTrial && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md border border-purple-300/30">
                  {visual.badge}
                </div>
              )}
              {isProTrial && slug === 'pro' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-amber-200 bg-amber-500/20 border border-amber-400/40 animate-pulse">
                  <span>⏱️</span>
                  <span>ช่วงทดลองใช้ Pro 3 วัน</span>
                </div>
              )}
              {user && isCurrentActive && !isProTrial && (
                <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  แผนปัจจุบัน
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="plan-name text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {dbPlan.name}
                </h3>
              </div>

              <div className="plan-sub text-xs text-plottrix-muted mt-1 mb-4">
                {visual.sub}
              </div>

              <div className="plan-price flex items-baseline gap-1 text-3xl sm:text-4xl font-extrabold text-white mb-2">
                <span>
                  {priceNum === 0 ? (
                    '฿0'
                  ) : (
                    <>
                      <span>฿</span>
                      <CountUp to={priceNum} duration={1000} />
                    </>
                  )}
                </span>
                <span className="text-xs text-plottrix-muted font-normal">
                  {cycleText}
                </span>
              </div>

              <div className="plan-trix-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-400/30 text-amber-200 mb-4">
                <img src="/Logo/TrixCoinLogo.png" alt="Trix Coin" className="w-4 h-4 object-contain inline-block" />
                <span>{trixBadgeText}</span>
              </div>

              {isProTrial && slug === 'pro' && (
                <div className="mb-4 p-3 rounded-xl bg-purple-500/20 border border-purple-400/40 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-purple-300 font-bold mb-0.5 flex items-center justify-center gap-1">
                    <span>⏱️</span>
                    <span>เหลือเวลาทดลองใช้ Pro ฟรี</span>
                  </div>
                  <div className="text-sm font-extrabold tracking-wide text-amber-300">
                    {trialCountdown || 'กำลังคำนวณ...'}
                  </div>
                </div>
              )}

              {isPaidActive && isCurrentActive && activeSubscription?.expires_at && (
                <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-center">
                  <div className="text-[10px] text-emerald-300 font-bold">
                    ✓ สมาชิกใช้งานได้ถึง {formatExpiryDateTime(activeSubscription.expires_at)}
                  </div>
                </div>
              )}

              <p className="plan-desc text-xs text-plottrix-text/80 mb-5 leading-relaxed">
                {dbPlan.description}
              </p>

              <div className="border-t border-white/10 my-4" />

              <ul className="plan-list space-y-2.5 text-xs text-plottrix-text/90 mb-6">
                {features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-4 space-y-2">
              {(() => {
                if (user && isCurrentActive && isProTrial) {
                  return (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-center bg-purple-500/20 text-purple-200 border border-purple-400/40">
                        ✓ กำลังทดลองใช้ Pro ({trialCountdown || '3 วัน'})
                      </div>
                      <button
                        type="button"
                        onClick={() => openCheckoutModal('pro')}
                        className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-purple-600/30 border border-purple-300/40 transition cursor-pointer"
                      >
                        อัปเกรดเป็น Pro Plan++ เต็มรูปแบบ →
                      </button>
                    </div>
                  )
                }

                if (user && isCurrentActive && slug === 'free') {
                  return (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/10 text-plottrix-muted cursor-default border border-white/5"
                    >
                      กำลังใช้งานแผนนี้
                    </button>
                  )
                }

                if (canRenewCurrentPaid) {
                  return (
                    <button
                      type="button"
                      onClick={() => openCheckoutModal(slug)}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 transition cursor-pointer"
                    >
                      ต่ออายุ {dbPlan.name} (+{durationDays} วัน) →
                    </button>
                  )
                }

                if (isLowerTier) {
                  return (
                    <div>
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-black/40 text-rose-300/80 border border-rose-500/30 cursor-not-allowed opacity-60"
                        title="ไม่สามารถลดระดับแพลนได้ตามนโยบายระบบ (Strict No-Downgrade Policy)"
                      >
                        🔒 ไม่สามารถลดระดับแพลนได้
                      </button>
                      <div className="text-[10px] text-center text-slate-400 mt-1">
                        ระบบไม่อนุญาตให้ลดระดับลงสู่แผนที่ต่ำกว่า
                      </div>
                    </div>
                  )
                }

                if (slug === 'pro') {
                  return (
                    <div className="space-y-2">
                      {(!user || activeTier.id === 'free') && !trialUsed && (
                        <div>
                          <button
                            type="button"
                            onClick={() => (user ? activateProTrial() : setActiveModal('auth'))}
                            className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500 hover:brightness-110 text-white shadow-lg shadow-purple-600/40 border border-purple-300/50 transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>{user ? '⚡' : '🔒'}</span>
                            <span>{user ? 'ทดลองใช้ Pro ฟรี 3 วัน' : 'เข้าสู่ระบบเพื่อทดลอง Pro ฟรี 3 วัน'}</span>
                          </button>
                          <div className="text-[10px] text-center text-purple-300 mt-1 font-medium">
                            ✦ ทดลองฟรี 72 ชม. (1 ครั้ง/บัญชี ไม่ต้องผูกบัตร)
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => (user ? openCheckoutModal('pro') : setActiveModal('auth'))}
                        className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer ${
                          !trialUsed && (!user || activeTier.id === 'free')
                            ? 'bg-white/10 hover:bg-purple-600/30 text-white border border-purple-400/30'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-purple-600/35 border border-purple-300/40'
                        }`}
                      >
                        {user ? `สมัคร ${dbPlan.name} (${priceNum.toLocaleString()} ฿)` : `เข้าสู่ระบบเพื่อสมัคร ${dbPlan.name}`}
                      </button>
                    </div>
                  )
                }

                if (slug === 'ultra') {
                  return (
                    <button
                      type="button"
                      onClick={() => (user ? openCheckoutModal('ultra') : setActiveModal('auth'))}
                      className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 shadow-lg shadow-amber-500/25 border border-amber-300/60 transition cursor-pointer"
                    >
                      {!user
                        ? `🔒 เข้าสู่ระบบเพื่อสมัคร ${dbPlan.name}`
                        : canUpgradeToUltra
                        ? `อัปเกรดเป็น ${dbPlan.name} (${priceNum.toLocaleString()} ฿) →`
                        : `สมัคร ${dbPlan.name} (${priceNum.toLocaleString()} ฿) →`}
                    </button>
                  )
                }

                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        setActiveModal('auth')
                        return
                      }
                      onSelectPlan ? onSelectPlan(dbPlan.name) : changePlan(slug)
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/5 hover:bg-purple-600/20 text-white border border-white/15 cursor-pointer"
                  >
                    {!user ? '🔒 เข้าสู่ระบบเพื่อเริ่มต้นฟรี' : visual.buttonText}
                  </button>
                )
              })()}
            </div>
          </PixelCard>
        )
      })}
    </div>
  )
}
