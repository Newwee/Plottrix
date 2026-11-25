import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'
import { CURRENT_TRIAL_TERMS_VERSION, TRIAL_TERMS_CLAUSES } from '../../lib/membershipService'

export default function TrialTermsModal() {
  const {
    activeModal,
    setActiveModal,
    confirmActivateProTrial,
    trialUsed,
    planTier
  } = useApp()

  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const isOpen = activeModal === 'trialTerms'

  const handleClose = () => {
    if (submitting) return
    setAccepted(false)
    setErrorMsg('')
    setActiveModal(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!accepted || submitting) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      const ok = await confirmActivateProTrial({
        accepted: true,
        termsVersion: CURRENT_TRIAL_TERMS_VERSION
      })
      if (ok) {
        setAccepted(false)
        setActiveModal(null)
      }
    } catch (err) {
      setErrorMsg(err?.message || 'ไม่สามารถเปิดใช้งานสิทธิ์ทดลองใช้ได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto font-thai">
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden border border-purple-500/35 shadow-[0_24px_70px_rgba(0,0,0,0.85)] bg-[#120d22]/95 text-white my-auto"
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-plottrix-panel2/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-400/40 flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    ข้อกำหนดการทดลองใช้ Pro ฟรี 3 วัน
                  </h3>
                  <p className="text-[11px] text-plottrix-muted">
                    ข้อตกลงการทดลองใช้บริการฟรี 72 ชั่วโมง (เวอร์ชัน {CURRENT_TRIAL_TERMS_VERSION})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-400/30 space-y-2">
                <div className="text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span>รายละเอียดสิทธิ์ทดลองใช้ Pro Plan++</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                    ฿0 ไม่มีค่าใช้จ่าย
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  เอกสารนี้เป็นข้อตกลงสำหรับการทดลองใช้งานฟีเจอร์ระดับ Pro ฟรี 72 ชั่วโมงเท่านั้น ไม่ใช่คำสั่งซื้อ ไม่มีการชำระเงิน และไม่มีการต่ออายุอัตโนมัติ
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2.5 max-h-60 overflow-y-auto">
                {TRIAL_TERMS_CLAUSES.map((clause, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-400/30 text-purple-200 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{clause}</span>
                  </div>
                ))}
              </div>

              {trialUsed || planTier === 'pro' || planTier === 'ultra' ? (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-xs text-amber-200">
                  {trialUsed
                    ? 'บัญชีของคุณเคยใช้สิทธิ์ทดลองใช้ Pro ฟรี 3 วันไปแล้ว (จำกัด 1 ครั้งต่อบัญชี)'
                    : 'บัญชีของคุณกำลังใช้งานแพ็กเกจสมาชิกที่สูงกว่าอยู่แล้ว'}
                </div>
              ) : (
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/15 bg-white/[0.04] hover:border-purple-400/40 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    disabled={submitting}
                    className="mt-0.5 w-4 h-4 accent-purple-500 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-100 leading-relaxed select-text">
                    ข้าพเจ้าได้อ่านและยอมรับข้อตกลงและเงื่อนไขการทดลองใช้ Pro ฟรี 3 วัน (72 ชั่วโมง) และรับทราบว่าไม่มีการหักเงินหรือต่ออายุอัตโนมัติ
                  </span>
                </label>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                {!trialUsed && planTier !== 'pro' && planTier !== 'ultra' && (
                  <button
                    type="submit"
                    disabled={!accepted || submitting}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer"
                  >
                    {submitting ? 'กำลังบันทึกการยอมรับและเปิดสิทธิ์...' : 'ยอมรับและเริ่มทดลองใช้'}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
