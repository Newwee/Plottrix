import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'
import {
  createMembershipOrder,
  validateClientSlipFile,
  verifyPaymentSlip
} from '../../lib/membershipService'
import { formatExpiryDateTime } from '../../lib/subscription'

export default function MembershipCheckoutModal() {
  const {
    activeModal,
    setActiveModal,
    checkoutTargetSlug,
    membershipPlans,
    activeSubscription,
    refreshMembershipStatus,
    addToast
  } = useApp()

  const isOpen = activeModal === 'checkout'

  const [step, setStep] = useState(1)
  const [selectedSlug, setSelectedSlug] = useState('pro')
  const [selectedChannel, setSelectedChannel] = useState('promptpay')
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [order, setOrder] = useState(null)
  const [estimatedExpiry, setEstimatedExpiry] = useState('')
  const [channels, setChannels] = useState([])
  const [slipFile, setSlipFile] = useState(null)
  const [slipPreview, setSlipPreview] = useState('')
  const [slipError, setSlipError] = useState('')
  const [verifyState, setVerifyState] = useState('idle')
  const [verifyResult, setVerifyResult] = useState(null)
  const [lastPaymentId, setLastPaymentId] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedSlug(checkoutTargetSlug === 'ultra' ? 'ultra' : 'pro')
      setStep(1)
      setOrder(null)
      setSlipFile(null)
      setSlipPreview('')
      setSlipError('')
      setVerifyState('idle')
      setVerifyResult(null)
      setLastPaymentId('')
    }
  }, [isOpen, checkoutTargetSlug])

  useEffect(() => {
    return () => {
      if (slipPreview && slipPreview.startsWith('blob:')) {
        URL.revokeObjectURL(slipPreview)
      }
    }
  }, [slipPreview])

  const paidPlans = (membershipPlans || []).filter(p => Number(p.price) > 0)
  const selectedPlan = paidPlans.find(p => p.slug === selectedSlug) || paidPlans[0] || null

  const activeChannelObj = channels.find(c => c.channel_type === selectedChannel) || channels[0] || null

  const handleClose = () => {
    if (verifyState === 'uploading' || verifyState === 'verifying') return
    setActiveModal(null)
  }

  const handleCreateOrder = async () => {
    if (!selectedPlan || creatingOrder) return
    setCreatingOrder(true)
    setSlipError('')
    try {
      const res = await createMembershipOrder({
        planSlug: selectedPlan.slug,
        channel: selectedChannel
      })
      setOrder(res.order)
      setEstimatedExpiry(res.estimatedMembershipExpiresAt || '')
      setChannels(res.channels || [])
      if (res.channels?.length > 0 && !res.channels.some(c => c.channel_type === selectedChannel)) {
        setSelectedChannel(res.channels[0].channel_type)
      }
      setStep(2)
      refreshMembershipStatus().catch(() => {})
    } catch (err) {
      addToast({
        title: 'ไม่สามารถสร้างคำสั่งซื้อได้',
        description: err.message,
        fuseColor: '#ef4444'
      })
    } finally {
      setCreatingOrder(false)
    }
  }

  const handleSlipSelected = async (file) => {
    setSlipError('')
    const validation = await validateClientSlipFile(file)
    if (!validation.valid) {
      setSlipError(validation.message)
      setSlipFile(null)
      setSlipPreview('')
      return
    }
    if (slipPreview && slipPreview.startsWith('blob:')) {
      URL.revokeObjectURL(slipPreview)
    }
    setSlipFile(file)
    setSlipPreview(URL.createObjectURL(file))
  }

  const handleSubmitSlip = async () => {
    if (!order || !slipFile || verifyState === 'uploading' || verifyState === 'verifying') return
    setVerifyState('uploading')
    setVerifyResult(null)
    setSlipError('')

    try {
      const channelType = activeChannelObj?.channel_type || selectedChannel
      setStep(3)
      setVerifyState('verifying')

      const res = await verifyPaymentSlip({
        orderId: order.id,
        paymentMethod: channelType,
        file: slipFile
      })

      if (res.paymentId) {
        setLastPaymentId(res.paymentId)
      }

      if (res.status === 'VERIFIED') {
        setVerifyState('verified')
        setVerifyResult(res)
        await refreshMembershipStatus()
        addToast({
          title: 'เปิดใช้งาน Premium สำเร็จ!',
          description: res.message,
          fuseColor: '#74d9b4'
        })
      } else if (res.status === 'MANUAL_REVIEW') {
        setVerifyState('manual_review')
        setVerifyResult(res)
        await refreshMembershipStatus()
      } else if (res.status === 'PENDING_BANK') {
        setVerifyState('pending_bank')
        setVerifyResult(res)
      } else {
        setVerifyState('failed')
        setVerifyResult(res)
      }
    } catch (err) {
      setVerifyState('failed')
      setVerifyResult({ message: err.message || 'ระบบตรวจสอบการชำระเงินขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง', canRetry: true })
    }
  }

  const handleRetrySameSlip = async () => {
    if (!order || !lastPaymentId || verifyState === 'verifying') return
    setVerifyState('verifying')
    try {
      const channelType = activeChannelObj?.channel_type || selectedChannel
      const res = await verifyPaymentSlip({
        orderId: order.id,
        paymentMethod: channelType,
        retryPaymentId: lastPaymentId
      })
      if (res.paymentId) setLastPaymentId(res.paymentId)
      if (res.status === 'VERIFIED') {
        setVerifyState('verified')
        setVerifyResult(res)
        await refreshMembershipStatus()
      } else if (res.status === 'MANUAL_REVIEW') {
        setVerifyState('manual_review')
        setVerifyResult(res)
        await refreshMembershipStatus()
      } else if (res.status === 'PENDING_BANK') {
        setVerifyState('pending_bank')
        setVerifyResult(res)
      } else {
        setVerifyState('failed')
        setVerifyResult(res)
      }
    } catch (err) {
      setVerifyState('failed')
      setVerifyResult({ message: err.message, canRetry: true })
    }
  }

  const copyText = (text, label) => {
    navigator.clipboard.writeText(String(text || ''))
    addToast({ title: `คัดลอก ${label} แล้ว`, fuseColor: '#74d9b4', duration: 2200 })
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
            className="relative z-10 w-full max-w-3xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#120d22]/95 text-white my-auto"
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-plottrix-panel2/60">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">
                  สมัครสมาชิก Premium Membership
                </h3>
                <p className="text-[11px] text-plottrix-muted">
                  ชำระผ่าน PromptPay QR หรือโอนบัญชีธนาคาร · ตรวจสอบสลิปอัตโนมัติผ่าน EasySlip
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={verifyState === 'uploading' || verifyState === 'verifying'}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-white/10 bg-black/20 text-xs">
              {[
                { num: 1, title: '1. เลือกแพ็กเกจ' },
                { num: 2, title: '2. โอนเงิน & แนบสลิป' },
                { num: 3, title: '3. ตรวจสอบและเปิดสิทธิ์' }
              ].map((item) => (
                <div
                  key={item.num}
                  className={`px-3 py-1.5 rounded-full font-bold transition ${
                    step === item.num
                      ? 'bg-purple-600/35 text-purple-200 border border-purple-400/40'
                      : step > item.num
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}
                >
                  {step > item.num ? `✓ ${item.title}` : item.title}
                </div>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {step === 1 && (
                <div className="space-y-5">
                  {paidPlans.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-plottrix-muted">
                      กำลังโหลดข้อมูลแพ็กเกจจากฐานข้อมูล...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {paidPlans.map((p) => {
                        const isSelected = selectedPlan?.slug === p.slug
                        const activeRank = Number(activeSubscription?.membership_plans?.tier_rank || 0)
                        const isBlockedDowngrade = activeSubscription && activeRank > Number(p.tier_rank)
                        return (
                          <button
                            key={p.id || p.slug}
                            type="button"
                            disabled={isBlockedDowngrade}
                            onClick={() => setSelectedSlug(p.slug)}
                            className={`text-left p-5 rounded-2xl border transition flex flex-col justify-between ${
                              isBlockedDowngrade
                                ? 'opacity-45 bg-black/40 border-rose-500/20 cursor-not-allowed'
                                : isSelected
                                ? 'bg-purple-600/20 border-purple-400 ring-2 ring-purple-400/30 cursor-pointer'
                                : 'bg-white/5 border-white/10 hover:border-purple-400/40 cursor-pointer'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-base text-white">{p.name}</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold">
                                  +{p.trix_grant} Trix
                                </span>
                              </div>
                              <div className="text-2xl font-black text-white mb-1">
                                ฿{Number(p.price).toLocaleString()}
                                <span className="text-xs font-normal text-plottrix-muted"> / {p.duration_days} วัน</span>
                              </div>
                              <p className="text-[11px] text-plottrix-muted mb-3">{p.description}</p>
                              <ul className="space-y-1.5 text-[11px] text-slate-200">
                                {(p.features || []).slice(0, 4).map((feat, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400 font-bold">✓</span>
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {isBlockedDowngrade && (
                              <div className="mt-3 text-[11px] text-rose-300 font-semibold">
                                ไม่สามารถลดระดับแพ็กเกจขณะแพ็กเกจเดิมยังไม่หมดอายุ
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {activeSubscription && selectedPlan && Number(selectedPlan.tier_rank) > Number(activeSubscription?.membership_plans?.tier_rank || 0) && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-xs text-indigo-100">
                      อัปเกรดจาก Pro เป็น Ultra: Ultra จะมีผลทันทีและนำวัน Pro คงเหลือมาคำนวณ Pro-rata ตามสัดส่วนราคา (249/599) เพิ่มเติมจาก 30 วันโดยอัตโนมัติ
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={!selectedPlan || creatingOrder}
                      onClick={handleCreateOrder}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-40 text-white text-xs font-bold shadow-lg cursor-pointer"
                    >
                      {creatingOrder ? 'กำลังสร้างคำสั่งซื้อ...' : 'ดำเนินการสร้างคำสั่งซื้อ →'}
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && order && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-purple-300 font-bold">คำสั่งซื้อ: {order.order_code}</div>
                      <div className="text-sm font-bold text-white">
                        {order.plan_snapshot?.name} — ยอดที่ต้องโอน{' '}
                        <span className="text-amber-300 text-lg font-black">฿{Number(order.amount).toFixed(2)}</span>
                      </div>
                      {estimatedExpiry && (
                        <div className="text-[11px] text-emerald-300 mt-0.5">
                          วันหมดอายุสมาชิกโดยประมาณหลังชำระ: {formatExpiryDateTime(estimatedExpiry)}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-plottrix-muted">
                      <div>ชำระภายใน:</div>
                      <div className="font-bold text-white">{formatExpiryDateTime(order.expires_at)}</div>
                    </div>
                  </div>

                  {channels.length > 0 && (
                    <div className="flex gap-2">
                      {channels.map((ch) => (
                        <button
                          key={ch.channel_type}
                          type="button"
                          onClick={() => setSelectedChannel(ch.channel_type)}
                          className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            activeChannelObj?.channel_type === ch.channel_type
                              ? 'bg-purple-600/30 border-purple-400 text-white'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {ch.channel_type === 'promptpay' ? '📱 PromptPay QR Code' : '🏦 โอนผ่านบัญชีธนาคาร'}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeChannelObj && (
                    <div className="p-5 rounded-2xl bg-black/35 border border-white/10 space-y-4">
                      {activeChannelObj.channel_type === 'promptpay' ? (
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          {activeChannelObj.qr_signed_url ? (
                            <img
                              src={activeChannelObj.qr_signed_url}
                              alt="PromptPay QR"
                              className="w-48 h-48 rounded-xl object-contain bg-white p-2 border border-purple-400/30 shrink-0"
                            />
                          ) : (
                            <div className="w-44 h-44 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-xs text-plottrix-muted text-center p-3">
                              ใช้หมายเลข PromptPay ด้านข้างเพื่อโอนเงิน
                            </div>
                          )}
                          <div className="space-y-2 text-xs flex-1 w-full">
                            <div className="font-bold text-purple-200 text-sm">{activeChannelObj.display_name}</div>
                            <div>
                              <span className="text-plottrix-muted">ชื่อผู้รับเงิน: </span>
                              <span className="font-bold text-white">{activeChannelObj.account_name}</span>
                            </div>
                            {activeChannelObj.promptpay_id && (
                              <div className="flex items-center gap-2">
                                <span className="text-plottrix-muted">PromptPay ID: </span>
                                <span className="font-mono font-bold text-amber-300">{activeChannelObj.promptpay_id}</span>
                                <button
                                  type="button"
                                  onClick={() => copyText(activeChannelObj.promptpay_id, 'PromptPay ID')}
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] cursor-pointer"
                                >
                                  คัดลอก
                                </button>
                              </div>
                            )}
                            <div>
                              <span className="text-plottrix-muted">ยอดโอนเป๊ะ: </span>
                              <span className="font-bold text-emerald-300">฿{Number(order.amount).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-plottrix-muted">อ้างอิงคำสั่งซื้อ: </span>
                              <span className="font-mono text-white">{order.order_code}</span>
                            </div>
                            {activeChannelObj.instructions && (
                              <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">{activeChannelObj.instructions}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5 text-xs">
                          <div className="font-bold text-purple-200 text-sm">{activeChannelObj.bank_name}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                            <div>
                              <div className="text-[10px] text-plottrix-muted">ชื่อบัญชี</div>
                              <div className="font-bold text-white mt-0.5">{activeChannelObj.account_name}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-plottrix-muted">เลขที่บัญชี</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-amber-300 text-sm">{activeChannelObj.account_number}</span>
                                <button
                                  type="button"
                                  onClick={() => copyText(activeChannelObj.account_number, 'เลขบัญชี')}
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] cursor-pointer"
                                >
                                  คัดลอก
                                </button>
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-plottrix-muted">ยอดชำระ</div>
                              <div className="font-bold text-emerald-300 mt-0.5">฿{Number(order.amount).toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-plottrix-muted">Order Reference</div>
                              <div className="font-mono text-white mt-0.5">{order.order_code}</div>
                            </div>
                          </div>
                          {activeChannelObj.instructions && (
                            <p className="text-[11px] text-slate-300 leading-relaxed">{activeChannelObj.instructions}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-200">
                        แนบสลิปการโอนเงิน (JPEG, PNG, GIF, WebP ไม่เกิน 4 MB)
                      </label>
                      {slipFile && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-purple-300 hover:text-white underline cursor-pointer"
                        >
                          เปลี่ยนรูปสลิป
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleSlipSelected(f)
                        e.target.value = ''
                      }}
                    />

                    {!slipPreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 rounded-2xl border-2 border-dashed border-purple-400/35 hover:border-purple-400 bg-white/[0.03] hover:bg-purple-500/10 text-center transition cursor-pointer space-y-2"
                      >
                        <div className="text-3xl">🧾</div>
                        <div className="text-xs font-bold text-white">คลิกเพื่อเลือกรูปสลิปการโอนเงิน</div>
                        <div className="text-[11px] text-plottrix-muted">รองรับเฉพาะภาพที่มี QR Code ชัดเจน ขนาดไม่เกิน 4 MB</div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-black/40 border border-purple-400/30 flex flex-col sm:flex-row items-center gap-4">
                        <img
                          src={slipPreview}
                          alt="Slip Preview"
                          className="w-36 h-48 object-contain rounded-xl bg-black border border-white/10"
                        />
                        <div className="flex-1 space-y-2 text-xs">
                          <div className="font-bold text-white truncate">{slipFile?.name}</div>
                          <div className="text-plottrix-muted">
                            ขนาดไฟล์: {((slipFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                          </div>
                          <div className="text-emerald-300 text-[11px]">✓ ผ่านการตรวจรูปแบบไฟล์และขนาดเบื้องต้นแล้ว</div>
                        </div>
                      </div>
                    )}

                    {slipError && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200">
                        {slipError}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
                    >
                      ← เปลี่ยนแพ็กเกจ
                    </button>
                    <button
                      type="button"
                      disabled={!slipFile || verifyState === 'uploading' || verifyState === 'verifying'}
                      onClick={handleSubmitSlip}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-40 text-white text-xs font-bold shadow-lg cursor-pointer"
                    >
                      ยืนยันส่งสลิปตรวจสอบอัตโนมัติ
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="py-6 space-y-5 text-center max-w-md mx-auto">
                  {(verifyState === 'uploading' || verifyState === 'verifying') && (
                    <div className="space-y-4">
                      <div className="w-12 h-12 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <div className="text-base font-bold text-white">
                        {verifyState === 'uploading' ? 'กำลังอัปโหลดหลักฐานอย่างปลอดภัย...' : 'กำลังตรวจสอบสลิปผ่าน EasySlip...'}
                      </div>
                      <p className="text-xs text-plottrix-muted">
                        ระบบกำลังตรวจสอบบัญชีผู้รับ ยอดเงิน และรหัสธุรกรรม กรุณาอย่าปิดหน้าต่างนี้
                      </p>
                    </div>
                  )}

                  {verifyState === 'verified' && (
                    <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 space-y-3">
                      <div className="text-4xl">✅</div>
                      <h4 className="text-lg font-extrabold text-emerald-300">
                        {verifyResult?.message || 'ชำระเงินสำเร็จ! Premium Membership ของคุณเปิดใช้งานแล้ว'}
                      </h4>
                      {verifyResult?.activation && (
                        <div className="text-xs text-slate-200 space-y-1 pt-2 border-t border-white/10">
                          <div>แพ็กเกจ: <strong>{verifyResult.activation.plan}</strong></div>
                          <div>ได้รับโบนัส: <strong className="text-amber-300">+{verifyResult.activation.trix_granted} Trix</strong></div>
                          <div>หมดอายุวันที่: <strong>{formatExpiryDateTime(verifyResult.activation.expires_at)}</strong></div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        เริ่มใช้งาน Premium ทันที
                      </button>
                    </div>
                  )}

                  {verifyState === 'manual_review' && (
                    <div className="p-6 rounded-2xl bg-amber-500/15 border border-amber-400/40 space-y-3">
                      <div className="text-4xl">🕵️</div>
                      <h4 className="text-base font-bold text-amber-200">
                        {verifyResult?.message || 'ได้รับหลักฐานการชำระเงินแล้ว กำลังตรวจสอบเพิ่มเติม'}
                      </h4>
                      <p className="text-xs text-slate-300">
                        คำสั่งซื้อ {order?.order_code} ถูกส่งให้ผู้ดูแลระบบตรวจสอบเพิ่มเติมแล้ว คุณจะได้รับการแจ้งเตือนทันทีเมื่ออนุมัติ
                      </p>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mt-3 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
                      >
                        รับทราบ
                      </button>
                    </div>
                  )}

                  {(verifyState === 'pending_bank' || verifyState === 'failed') && (
                    <div className="p-6 rounded-2xl bg-rose-500/15 border border-rose-400/40 space-y-4">
                      <div className="text-4xl">{verifyState === 'pending_bank' ? '⏳' : '⚠️'}</div>
                      <h4 className="text-base font-bold text-rose-200">
                        {verifyResult?.message || 'ไม่สามารถตรวจสอบสลิปนี้ได้ กรุณาตรวจสอบรูปภาพและลองอีกครั้ง'}
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                        {lastPaymentId && verifyState === 'pending_bank' && (
                          <button
                            type="button"
                            onClick={handleRetrySameSlip}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer"
                          >
                            ตรวจสอบสลิปเดิมอีกครั้ง
                          </button>
                        )}
                        {verifyResult?.canRetry !== false && (
                          <button
                            type="button"
                            onClick={() => {
                              setVerifyState('idle')
                              setStep(2)
                            }}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                          >
                            อัปโหลดสลิปใหม่
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
