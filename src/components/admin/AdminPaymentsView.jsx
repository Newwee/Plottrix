import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import AuthRequiredView from '../common/AuthRequiredView'
import AeroShardsCanvas from '../workspace/AeroShardsCanvas'
import { invokeAdminMembership, uploadAdminChannelQr } from '../../lib/membershipService'
import { formatExpiryDateTime } from '../../lib/subscription'

export default function AdminPaymentsView() {
  const { user, loading: authLoading } = useAuth()
  const { adminRole, navigateTo, addToast, refreshMembershipStatus } = useApp()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [slipModalUrl, setSlipModalUrl] = useState('')
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewAction, setReviewAction] = useState('approve')
  const [reviewNote, setReviewNote] = useState('')
  const [overrideTransRef, setOverrideTransRef] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const [channels, setChannels] = useState([])
  const [savingChannel, setSavingChannel] = useState(false)

  const isAdmin = adminRole === 'owner' || adminRole === 'admin'
  const isOwner = adminRole === 'owner'

  const loadAdminData = useCallback(async () => {
    if (!user || !isAdmin) return
    setLoading(true)
    try {
      const [sumRes, listRes] = await Promise.all([
        invokeAdminMembership('dashboard_summary'),
        invokeAdminMembership('list_payments', { statusFilter })
      ])
      setSummary(sumRes.summary)
      setPayments(listRes.payments || [])
      setAuditLogs(listRes.auditLogs || [])

      if (isOwner) {
        const chRes = await invokeAdminMembership('get_channel_settings')
        setChannels(chRes.channels || [])
      }
    } catch (err) {
      addToast({ title: 'โหลดข้อมูล Admin ไม่สำเร็จ', description: err.message, fuseColor: '#ef4444' })
    } finally {
      setLoading(false)
    }
  }, [user, isAdmin, isOwner, statusFilter, addToast])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const handleViewSlip = async (paymentId) => {
    try {
      const res = await invokeAdminMembership('get_slip_signed_url', { paymentId })
      setSlipModalUrl(res.signedUrl)
    } catch (err) {
      addToast({ title: 'เปิดดูสลิปไม่สำเร็จ', description: err.message, fuseColor: '#ef4444' })
    }
  }

  const handleSubmitManualReview = async (e) => {
    e.preventDefault()
    if (!reviewTarget || !reviewNote.trim() || submittingReview) return
    setSubmittingReview(true)
    try {
      if (reviewAction === 'approve') {
        await invokeAdminMembership('manual_approve', {
          paymentId: reviewTarget.id,
          reviewNote: reviewNote.trim(),
          overrideTransRef: overrideTransRef.trim() || null
        })
        addToast({ title: 'อนุมัติและเปิดใช้งานสมาชิกสำเร็จ', fuseColor: '#74d9b4' })
      } else {
        await invokeAdminMembership('manual_reject', {
          paymentId: reviewTarget.id,
          reviewNote: reviewNote.trim()
        })
        addToast({ title: 'ปฏิเสธรายการชำระเงินแล้ว', fuseColor: '#eab308' })
      }
      setReviewTarget(null)
      setReviewNote('')
      setOverrideTransRef('')
      await Promise.all([loadAdminData(), refreshMembershipStatus()])
    } catch (err) {
      addToast({ title: 'ดำเนินการไม่สำเร็จ', description: err.message, fuseColor: '#ef4444' })
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleSaveChannel = async (ch) => {
    if (!isOwner || savingChannel) return
    setSavingChannel(true)
    try {
      const rules = ch.payment_channel_verification_rules || {}
      await invokeAdminMembership('update_channel_settings', {
        channelType: ch.channel_type,
        isEnabled: Boolean(ch.is_enabled),
        displayName: ch.display_name,
        bankName: ch.bank_name,
        accountName: ch.account_name,
        accountNumber: ch.account_number,
        promptpayId: ch.promptpay_id,
        instructions: ch.instructions,
        allowedBankCodes: rules.allowed_bank_codes || [],
        expectedAccountDigits: rules.expected_account_digits || '',
        expectedProxyType: rules.expected_proxy_type || '',
        expectedProxyValue: rules.expected_proxy_value || '',
        expectedAccountNameTh: rules.expected_account_name_th || ch.account_name
      })
      addToast({ title: 'บันทึกการตั้งค่าช่องทางรับเงินแล้ว', fuseColor: '#74d9b4' })
      await loadAdminData()
    } catch (err) {
      addToast({ title: 'บันทึกการตั้งค่าไม่สำเร็จ', description: err.message, fuseColor: '#ef4444' })
    } finally {
      setSavingChannel(false)
    }
  }

  const handleQrUpload = async (channelType, file) => {
    if (!file || !isOwner) return
    try {
      await uploadAdminChannelQr(channelType, file)
      addToast({ title: 'อัปโหลดรูป PromptPay QR สำเร็จ', fuseColor: '#74d9b4' })
      await loadAdminData()
    } catch (err) {
      addToast({ title: 'อัปโหลด QR ไม่สำเร็จ', description: err.message, fuseColor: '#ef4444' })
    }
  }

  const updateChannelField = (channelType, field, value) => {
    setChannels(prev =>
      prev.map((c) => {
        if (c.channel_type !== channelType) return c
        const nextChannel = { ...c, [field]: value }
        const rules = { ...(c.payment_channel_verification_rules || {}) }
        if (field === 'promptpay_id') {
          const prevId = String(c.promptpay_id || '').trim()
          const curRule = String(rules.expected_proxy_value || '').trim()
          if (!curRule || curRule === prevId) {
            rules.expected_proxy_value = String(value || '').trim()
          }
        }
        if (field === 'account_number') {
          const prevDigits = String(c.account_number || '').replace(/[^0-9]/g, '')
          const curDigits = String(rules.expected_account_digits || '').replace(/[^0-9]/g, '')
          if (!curDigits || curDigits === prevDigits) {
            rules.expected_account_digits = String(value || '').replace(/[^0-9]/g, '')
          }
        }
        if (field === 'account_name') {
          const prevName = String(c.account_name || '').trim()
          const curRuleName = String(rules.expected_account_name_th || '').trim()
          if (!curRuleName || curRuleName === prevName) {
            rules.expected_account_name_th = String(value || '').trim()
          }
        }
        nextChannel.payment_channel_verification_rules = rules
        return nextChannel
      })
    )
  }

  const updateRuleField = (channelType, field, value) => {
    setChannels(prev =>
      prev.map(c =>
        c.channel_type === channelType
          ? {
              ...c,
              payment_channel_verification_rules: {
                ...(c.payment_channel_verification_rules || {}),
                [field]: value
              }
            }
          : c
      )
    )
  }

  if (authLoading) return <AuthRequiredView isLoading />
  if (!user) return <AuthRequiredView />

  if (!isAdmin) {
    return (
      <div className="min-h-[100dvh] bg-[#0d091a] flex items-center justify-center p-6 text-white font-thai relative overflow-hidden">
        <AeroShardsCanvas />
        <div className="relative z-10 max-w-md w-full rounded-3xl border border-rose-500/30 bg-[#151025]/95 p-8 text-center space-y-4">
          <div className="text-4xl">🛡️</div>
          <h2 className="text-lg font-bold">ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลการชำระเงิน</h2>
          <p className="text-xs text-plottrix-muted">หน้านี้สงวนสิทธิ์เฉพาะ Admin และ Owner ที่ได้รับอนุญาตจาก Backend เท่านั้น</p>
          <button
            type="button"
            onClick={() => navigateTo('workspace_home')}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold cursor-pointer"
          >
            กลับสู่ Workspace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-transparent text-white font-thai relative overflow-x-hidden">
      <AeroShardsCanvas />

      <header className="sticky top-0 z-30 px-6 py-4 bg-[#120d22]/85 backdrop-blur-xl border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/Logo/PlottrixSingleLogo.png" alt="Plottrix" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <span>Payment &amp; Membership Admin</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                {adminRole}
              </span>
            </h1>
            <p className="text-[11px] text-plottrix-muted">จัดการคำสั่งซื้อ ตรวจสอบสลิป EasySlip และตั้งค่าช่องทางรับเงิน</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAdminData}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold cursor-pointer"
          >
            รีเฟรช
          </button>
          <button
            type="button"
            onClick={() => navigateTo('workspace_home')}
            className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 text-xs font-bold cursor-pointer"
          >
            ← กลับ Workspace
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {[
            { id: 'dashboard', label: '📊 Dashboard & Audit Logs' },
            { id: 'payments', label: '🧾 จัดการคำสั่งซื้อและสลิป' },
            ...(isOwner ? [{ id: 'channels', label: '⚙️ ช่องทางรับเงิน (Owner)' }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && !summary ? (
          <div className="p-12 text-center text-xs text-purple-200">กำลังโหลดข้อมูล...</div>
        ) : null}

        {activeTab === 'dashboard' && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-2xl bg-[#151025]/90 border border-white/10">
                <div className="text-[11px] text-plottrix-muted">คำสั่งซื้อทั้งหมด</div>
                <div className="text-2xl font-black mt-1">{summary.totalOrders}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#151025]/90 border border-emerald-500/30">
                <div className="text-[11px] text-emerald-300">ยอดชำระสำเร็จ</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">฿{Number(summary.totalPaidRevenueThb || 0).toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#151025]/90 border border-amber-500/30">
                <div className="text-[11px] text-amber-300">รอตรวจสอบเพิ่มเติม</div>
                <div className="text-2xl font-black text-amber-300 mt-1">{summary.pendingReviewCount}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#151025]/90 border border-rose-500/30">
                <div className="text-[11px] text-rose-300">ไม่ผ่าน / ขัดข้อง</div>
                <div className="text-2xl font-black text-rose-300 mt-1">{summary.rejectedOrFailedCount}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#151025]/90 border border-purple-500/30">
                <div className="text-[11px] text-purple-300">สมาชิก Premium</div>
                <div className="text-2xl font-black text-purple-200 mt-1">{summary.activePremiumSubscribers}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#151025]/90 border border-indigo-500/30">
                <div className="text-[11px] text-indigo-300">กำลัง Trial 3 วัน</div>
                <div className="text-2xl font-black text-indigo-200 mt-1">{summary.activeTrials}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#151025]/90 border border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">บันทึกเหตุการณ์ล่าสุด (Payment Audit Logs)</h3>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/5 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-mono text-[10px]">
                        {log.event_type}
                      </span>
                      <span className="text-slate-300 text-[11px]">{log.actor_type}</span>
                      <span className="text-plottrix-muted font-mono text-[10px] truncate max-w-md">
                        {JSON.stringify(log.details)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{formatExpiryDateTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'MANUAL_REVIEW', 'PENDING_BANK', 'VERIFIED', 'REJECTED', 'PROVIDER_ERROR'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                    statusFilter === st
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-[#151025]/90 border border-white/10 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-purple-300">{p.membership_orders?.order_code}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 font-bold">{p.verification_status}</span>
                      <span className="text-amber-300 font-bold">฿{Number(p.amount).toFixed(2)}</span>
                      <span className="text-slate-300">({p.payment_method})</span>
                    </div>
                    <div className="text-[11px] text-plottrix-muted">
                      {formatExpiryDateTime(p.created_at)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
                    <div>
                      <span className="text-plottrix-muted">ผู้ใช้: </span>
                      <span>{p.userProfile?.display_name || p.userProfile?.email || p.user_id}</span>
                    </div>
                    <div>
                      <span className="text-plottrix-muted">TransRef: </span>
                      <span className="font-mono text-white">{p.transaction_reference || p.detected_trans_ref || '-'}</span>
                    </div>
                    <div>
                      <span className="text-plottrix-muted">เหตุผล / Error: </span>
                      <span className="text-rose-300">{p.failure_reason || '-'}</span>
                    </div>
                  </div>

                  {p.provider_response && (
                    <details className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                      <summary className="cursor-pointer text-[11px] text-purple-300 font-semibold">ดูผลตรวจจาก EasySlip</summary>
                      <pre className="mt-2 text-[10px] font-mono text-slate-300 overflow-x-auto">
                        {JSON.stringify(p.provider_response, null, 2)}
                      </pre>
                    </details>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleViewSlip(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer"
                    >
                      ดูรูปสลิป (Private Storage)
                    </button>

                    {p.verification_status !== 'VERIFIED' && p.membership_orders?.status !== 'PAID' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewTarget(p)
                            setReviewAction('approve')
                            setOverrideTransRef(p.detected_trans_ref || '')
                            setReviewNote('')
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold cursor-pointer"
                        >
                          Manual Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewTarget(p)
                            setReviewAction('reject')
                            setOverrideTransRef('')
                            setReviewNote('')
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-xs font-bold cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'channels' && isOwner && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200">
              บัญชีรับเงินและ PromptPay ที่ระบุในหน้านี้ต้องตรงกับบัญชีที่ลงทะเบียนไว้ในระบบ EasySlip ของคุณ เพื่อให้ matchAccount ยืนยันผู้รับเงินได้อย่างถูกต้อง
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {channels.map((ch) => {
                const rules = ch.payment_channel_verification_rules || {}
                return (
                  <div key={ch.channel_type} className="p-5 rounded-2xl bg-[#151025]/90 border border-white/10 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">
                        {ch.channel_type === 'promptpay' ? '📱 PromptPay QR' : '🏦 Bank Transfer'}
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(ch.is_enabled)}
                          onChange={(e) => updateChannelField(ch.channel_type, 'is_enabled', e.target.checked)}
                          className="accent-purple-500 w-4 h-4"
                        />
                        <span className={ch.is_enabled ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                          {ch.is_enabled ? 'เปิดรับเงินอยู่' : 'ปิดใช้งาน'}
                        </span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-plottrix-muted mb-1">ชื่อแสดงผล (Display Name)</label>
                        <input
                          type="text"
                          value={ch.display_name || ''}
                          onChange={(e) => updateChannelField(ch.channel_type, 'display_name', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                        />
                      </div>

                      {ch.channel_type === 'bank_transfer' && (
                        <div>
                          <label className="block text-[11px] text-plottrix-muted mb-1">ชื่อธนาคาร (เช่น ธนาคารกสิกรไทย)</label>
                          <input
                            type="text"
                            value={ch.bank_name || ''}
                            onChange={(e) => updateChannelField(ch.channel_type, 'bank_name', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] text-plottrix-muted mb-1">ชื่อบัญชีผู้รับเงิน</label>
                        <input
                          type="text"
                          value={ch.account_name || ''}
                          onChange={(e) => updateChannelField(ch.channel_type, 'account_name', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                        />
                      </div>

                      {ch.channel_type === 'bank_transfer' ? (
                        <div>
                          <label className="block text-[11px] text-plottrix-muted mb-1">เลขที่บัญชีธนาคาร</label>
                          <input
                            type="text"
                            value={ch.account_number || ''}
                            onChange={(e) => updateChannelField(ch.channel_type, 'account_number', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                          />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[11px] text-plottrix-muted mb-1">PromptPay ID (เบอร์โทร / เลข ปชช. / e-Wallet)</label>
                            <input
                              type="text"
                              value={ch.promptpay_id || ''}
                              onChange={(e) => updateChannelField(ch.channel_type, 'promptpay_id', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-plottrix-muted mb-1">อัปโหลดรูป PromptPay QR</label>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleQrUpload(ch.channel_type, f)
                              }}
                              className="text-xs text-slate-300"
                            />
                            {ch.qr_signed_url && (
                              <img src={ch.qr_signed_url} alt="Current QR" className="w-28 h-28 rounded-xl bg-white p-1 mt-2 object-contain" />
                            )}
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-[11px] text-plottrix-muted mb-1">คำแนะนำสำหรับลูกค้า</label>
                        <textarea
                          rows={2}
                          value={ch.instructions || ''}
                          onChange={(e) => updateChannelField(ch.channel_type, 'instructions', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-black/30 border border-purple-500/20 space-y-2.5">
                        <div className="text-[11px] font-bold text-purple-300">กฎจับคู่ EasySlip ภายใน (Backend Verification Rules)</div>
                        <div>
                          <label className="block text-[10px] text-plottrix-muted mb-1">รหัสธนาคารที่อนุญาต คั่นด้วยคอมม่า (เช่น KBANK,004)</label>
                          <input
                            type="text"
                            value={Array.isArray(rules.allowed_bank_codes) ? rules.allowed_bank_codes.join(',') : (rules.allowed_bank_codes || '')}
                            onChange={(e) =>
                              updateRuleField(
                                ch.channel_type,
                                'allowed_bank_codes',
                                e.target.value.split(',').map(x => x.trim().toUpperCase()).filter(Boolean)
                              )
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-[11px]"
                          />
                        </div>
                        {ch.channel_type === 'promptpay' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-plottrix-muted mb-1">Proxy Type (เช่น MSISDN / NATID)</label>
                              <input
                                type="text"
                                value={rules.expected_proxy_type || ''}
                                onChange={(e) => updateRuleField(ch.channel_type, 'expected_proxy_type', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-[11px]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-plottrix-muted mb-1">Proxy Value เต็มสำหรับเทียบ</label>
                              <input
                                type="text"
                                value={rules.expected_proxy_value || ''}
                                onChange={(e) => updateRuleField(ch.channel_type, 'expected_proxy_value', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-[11px]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] text-plottrix-muted mb-1">เลขบัญชีเฉพาะตัวเลขสำหรับเทียบกับสลิป</label>
                            <input
                              type="text"
                              value={rules.expected_account_digits || ''}
                              onChange={(e) => updateRuleField(ch.channel_type, 'expected_account_digits', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-[11px]"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={savingChannel}
                        onClick={() => handleSaveChannel(ch)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 font-bold text-xs cursor-pointer"
                      >
                        {savingChannel ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าช่องทางนี้'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {slipModalUrl && (
        <div
          onClick={() => setSlipModalUrl('')}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full bg-[#120d22] rounded-2xl p-4 border border-purple-500/30 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>หลักฐานสลิปโอนเงิน (Private Signed URL 120s)</span>
              <button type="button" onClick={() => setSlipModalUrl('')} className="px-2 py-1 rounded bg-white/10 cursor-pointer">✕</button>
            </div>
            <img src={slipModalUrl} alt="Payment Slip" className="w-full max-h-[70vh] object-contain rounded-xl bg-black" />
          </div>
        </div>
      )}

      {reviewTarget && (
        <div
          onClick={() => setReviewTarget(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSubmitManualReview}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#120d22] rounded-2xl p-5 border border-purple-500/30 space-y-4 text-xs"
          >
            <h3 className="font-bold text-sm text-white">
              {reviewAction === 'approve' ? 'ยืนยัน Manual Approve' : 'ยืนยัน Reject Payment'}
            </h3>
            <p className="text-plottrix-muted">
              คำสั่งซื้อ: {reviewTarget.membership_orders?.order_code} · ยอด ฿{Number(reviewTarget.amount).toFixed(2)}
            </p>
            {reviewAction === 'approve' && (
              <div>
                <label className="block text-plottrix-muted mb-1">Transaction Reference (ถ้ามี)</label>
                <input
                  type="text"
                  value={overrideTransRef}
                  onChange={(e) => setOverrideTransRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>
            )}
            <div>
              <label className="block text-plottrix-muted mb-1">หมายเหตุการตรวจสอบ (บังคับระบุเพื่อบันทึก Audit Log)</label>
              <textarea
                required
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="เช่น ตรวจสอบยอดเงินเข้าบัญชีจริงเรียบร้อย..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReviewTarget(null)} className="px-4 py-2 rounded-xl bg-white/10 cursor-pointer">
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submittingReview || !reviewNote.trim()}
                className={`px-4 py-2 rounded-xl font-bold text-white cursor-pointer ${
                  reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submittingReview ? 'กำลังบันทึก...' : 'ยืนยันดำเนินการ'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
