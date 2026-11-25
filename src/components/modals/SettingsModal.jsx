import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useDevicePerformance } from '../../hooks/useDevicePerformance'
import AvatarCropperModal from './AvatarCropperModal'
import { modalBackdropVariants, modalContentVariants, tabContentVariants } from '../../lib/animations'

export default function SettingsModal() {
  const {
    activeModal,
    setActiveModal,
    settings,
    setSettings,
    appTheme,
    setAppTheme,
    paperTheme,
    setPaperTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    startTour,
    addToast,
    navigateTo,
    trixBalance,
    plan,
    planTier,
    trialCountdown
  } = useApp()

  const {
    user,
    profile,
    updateProfile,
    uploadAvatar,
    signOut,
    resetPassword
  } = useAuth()

  const { mode: perfMode, setMode: setPerfMode, tier: perfTier } = useDevicePerformance()

  const [activeTab, setActiveTab] = useState('account') // 'account' | 'editor'
  const [displayName, setDisplayName] = useState(() => profile?.display_name || user?.user_metadata?.full_name || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  // Cropper states
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropRawImage, setCropRawImage] = useState('')
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState(null)
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState(null)

  if (activeModal !== 'settings') return null
  if (!user) return null

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleRestartTour = () => {
    setActiveModal(null)
    startTour()
  }

  // Handle avatar file chosen -> open cropper
  const handleAvatarFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'ไฟล์ไม่ถูกต้อง',
        description: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, WebP)',
        fuseColor: '#ff7fa0'
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast({
        title: 'ขนาดไฟล์เกินกำหนด',
        description: 'กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 10MB',
        fuseColor: '#ff7fa0'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setCropRawImage(event.target.result)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Handle crop completed -> stage pending avatar
  const handleCropComplete = (croppedFile, previewUrl) => {
    setPendingAvatarBlob(croppedFile)
    setPendingAvatarPreview(previewUrl)
    addToast({
      title: 'ครอบตัดรูปภาพเรียบร้อย ✂️',
      description: 'ระบบตั้งรูปตัวอย่างไว้แล้ว — กรุณากดปุ่ม "บันทึก" เพื่ออัปเดตลงระบบถาวร',
      fuseColor: '#c084fc'
    })
  }

  // Save profile and commit any pending cropped avatar
  const handleSaveProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!displayName.trim() && !pendingAvatarBlob) return

    setIsSavingProfile(true)
    try {
      let updatedFields = {}

      // 1. Upload pending cropped avatar if present
      if (pendingAvatarBlob) {
        setIsUploadingAvatar(true)
        const publicUrl = await uploadAvatar(pendingAvatarBlob)
        updatedFields.avatar_url = publicUrl
        setPendingAvatarBlob(null)
        setPendingAvatarPreview(null)
        setIsUploadingAvatar(false)
      }

      // 2. Update display name if provided
      if (displayName.trim()) {
        updatedFields.display_name = displayName.trim()
        await updateProfile(updatedFields)
      }

      addToast({
        title: 'บันทึกโปรไฟล์สำเร็จ! ✨',
        description: 'ข้อมูลนามปากกาและรูปโปรไฟล์ของคุณได้รับการอัปเดตเรียบร้อย',
        fuseColor: '#74d9b4'
      })
    } catch (err) {
      addToast({
        title: 'บันทึกไม่สำเร็จ',
        description: err.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือ Supabase',
        fuseColor: '#ff7fa0'
      })
    } finally {
      setIsSavingProfile(false)
      setIsUploadingAvatar(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    try {
      await resetPassword(user.email)
      addToast({
        title: 'ส่งลิงก์เปลี่ยนรหัสผ่านแล้ว',
        description: `ส่งลิงก์ไปยัง ${user.email} เรียบร้อย`,
        fuseColor: '#74d9b4'
      })
    } catch (err) {
      addToast({ title: 'เกิดข้อผิดพลาด', description: err.message, fuseColor: '#ff7fa0' })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setActiveModal(null)
      navigateTo('home')
      addToast({
        title: 'ออกจากระบบแล้ว',
        description: 'เคลียร์เซสชันเรียบร้อย กลับสู่หน้าหลัก',
        fuseColor: '#c29aff'
      })
    } catch (err) {
      addToast({ title: 'เกิดข้อผิดพลาด', description: err.message, fuseColor: '#ff7fa0' })
    }
  }

  const provider = user?.app_metadata?.provider || 'email'

  // Available Paper Themes
  const PAPER_THEMES = [
    {
      id: 'obsidian',
      name: 'Midnight Obsidian',
      sub: 'ดำสนิทม่วงมิติ ออริจินัล ถนอมสายตาสูงสุด',
      bgPreview: 'bg-[#080511] border-purple-500/40 text-purple-200'
    },
    {
      id: 'midnight',
      name: 'Midnight Slate',
      sub: 'น้ำเงินค่ำสลัว สบายตา บรรยากาศเงียบสงบ',
      bgPreview: 'bg-[#0b1120] border-blue-500/40 text-blue-200'
    },
    {
      id: 'paper',
      name: 'Warm Paper',
      sub: 'ครีมกระดาษถนอมสายตา ตัวหนังสือดำคมชัด',
      bgPreview: 'bg-[#f7f4ed] border-stone-300 text-stone-900'
    },
    {
      id: 'velvet',
      name: 'Velvet Royal',
      sub: 'กำมะหยี่ม่วงเข้ม โทนวรรณกรรมคลาสสิก',
      bgPreview: 'bg-[#150d24] border-fuchsia-500/40 text-fuchsia-200'
    }
  ]

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Dialog */}
        <motion.div
          variants={modalContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-2xl max-h-[92vh] rounded-[28px] flex flex-col overflow-hidden border border-purple-500/25 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] bg-[#120d22] text-white my-auto"
        >
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
                ⚙️
              </div>
              <div>
                <h3 className="font-black text-base text-white tracking-wide">
                  การตั้งค่าระบบ (Workspace Settings)
                </h3>
                <p className="text-xs text-zinc-400">
                  จัดการโปรไฟล์นักเขียน สภาพแวดล้อมห้องเขียน และประสิทธิภาพ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-2 flex items-center gap-2 border-b border-white/10 bg-black/20">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'account'
                  ? 'border-purple-400 text-purple-300 shadow-[0_2px_10px_rgba(192,132,252,0.3)]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <span>👤</span>
              <span>บัญชีและโปรไฟล์ (Account & Profile)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'editor'
                  ? 'border-purple-400 text-purple-300 shadow-[0_2px_10px_rgba(192,132,252,0.3)]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <span>✍️</span>
              <span>ห้องเขียน & ธีมหน้ากระดาษ (Editor & Themes)</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'account' ? (
                <motion.div
                  key="account-tab"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* 1. Profile Avatar & Display Name Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-purple-500/20 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar Area with crop button */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="relative group">
                        <div className={`w-24 h-24 rounded-full overflow-hidden border-2 shadow-2xl bg-black/60 flex items-center justify-center text-3xl font-black transition duration-300 ${
                          pendingAvatarPreview
                            ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-amber-500/20 animate-pulse'
                            : 'border-purple-400/60 ring-4 ring-purple-500/10'
                        }`}>
                          {pendingAvatarPreview ? (
                            <img
                              src={pendingAvatarPreview}
                              alt="Cropped Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : profile?.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-purple-300">
                              {displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          )}
                        </div>

                        {/* Always-visible Camera/Crop Badge Button */}
                        <button
                          type="button"
                          disabled={isUploadingAvatar || isSavingProfile}
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center text-xs shadow-lg border-2 border-[#120d24] transition cursor-pointer hover:scale-110 active:scale-95"
                          title="เลือกรูปภาพใหม่และครอบตัด (Crop Avatar)"
                        >
                          📷
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={handleAvatarFileSelected}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isUploadingAvatar || isSavingProfile}
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 text-[11px] font-bold px-3 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <span>✂️</span>
                        <span>ครอบตัดรูปภาพ</span>
                      </button>
                    </div>

                    {/* Display Name & Info */}
                    <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                      <form onSubmit={handleSaveProfile} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-purple-200 tracking-wide block">
                            นามปากกา / ชื่อนักเขียน
                          </label>
                          {pendingAvatarPreview && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-semibold animate-pulse">
                              ⏳ รูปใหม่รอการกดบันทึก
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="ระบุนามปากกาที่ต้องการ..."
                            className="px-4 py-2.5 rounded-2xl bg-black/40 border border-purple-500/30 text-sm text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none flex-1 transition shadow-inner"
                          />
                          <button
                            type="submit"
                            disabled={isSavingProfile || isUploadingAvatar}
                            className={`px-6 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${
                              pendingAvatarPreview
                                ? 'bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-amber-500/25 ring-2 ring-amber-400/50 animate-pulse'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-purple-600/30'
                            }`}
                          >
                            <span>✓</span>
                            <span>{isSavingProfile || isUploadingAvatar ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                          </button>
                        </div>
                      </form>

                      <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2 text-[11px] text-zinc-400">
                        <span>📸 ครอบตัดขนาดสี่เหลี่ยมจัตุรัสและบีบอัดเป็น WebP (กดบันทึกทุกครั้งเพื่อยืนยัน)</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Account Details & Subscription Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Linked Email Card */}
                    <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-2">
                      <span className="text-xs text-zinc-400 block font-bold">อีเมลที่ผูกไว้</span>
                      <div className="text-sm font-bold text-white truncate">{user.email}</div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                        <span>สถานะการเชื่อมต่อ:</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase border border-emerald-500/30">
                          {provider}
                        </span>
                      </div>
                    </div>

                    {/* Subscription & Trix Coin Card */}
                    <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-bold">แพ็กเกจ &amp; เหรียญ Trix</span>
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          <span>🪙</span>
                          <span>{trixBalance} Trix</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-sm font-black text-purple-300 whitespace-nowrap">{plan}</span>
                        {planTier === 'pro_trial' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 whitespace-nowrap">
                            เหลือ {trialCountdown || '3 วัน'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveModal('pricing')}
                        className="text-xs text-purple-300 hover:text-purple-200 underline font-bold mt-1.5 inline-block cursor-pointer"
                      >
                        จัดการแพ็กเกจและเติมเหรียญ ↗
                      </button>
                    </div>
                  </div>

                  {/* 3. Security Actions: Reset Password & Sign Out */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-2"
                    >
                      <span>🔑</span>
                      <span>ส่งอีเมลเปลี่ยนรหัสผ่าน</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="px-5 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition cursor-pointer"
                    >
                      ออกจากระบบ (Sign Out)
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="editor-tab"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Global App Theme (Dark / Light / System) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                        ธีมระบบแอปพลิเคชัน (Global App Theme)
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-400/30">
                        {appTheme === 'system' ? 'ตามระบบเครื่อง' : appTheme === 'light' ? 'โหมดสว่าง' : 'โหมดมืด'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setAppTheme('dark')}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          appTheme === 'dark'
                            ? 'bg-purple-600/30 border-purple-400 text-white ring-2 ring-purple-400/40 shadow-lg'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">🌙</span>
                        <span className="text-xs font-bold">Dark (มืด)</span>
                        <span className="text-[10px] text-zinc-400">โทนหลัก ดำ-ม่วงพรีเมียม</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAppTheme('light')}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          appTheme === 'light'
                            ? 'bg-purple-600/30 border-purple-400 text-white ring-2 ring-purple-400/40 shadow-lg'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">☀️</span>
                        <span className="text-xs font-bold">Light (สว่าง)</span>
                        <span className="text-[10px] text-zinc-400">สะอาดตา อ่านง่ายในที่แจ้ง</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAppTheme('system')}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          appTheme === 'system'
                            ? 'bg-purple-600/30 border-purple-400 text-white ring-2 ring-purple-400/40 shadow-lg'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">💻</span>
                        <span className="text-xs font-bold">System (ระบบ)</span>
                        <span className="text-[10px] text-zinc-400">เปลี่ยนตาม OS อัตโนมัติ</span>
                      </button>
                    </div>
                  </div>

                  {/* Paper Theme (Visual Custom Dropdown / Cards) */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      ธีมหน้ากระดาษห้องเขียน (Paper Theme)
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      เลือกบรรยากาศโทนสีของหน้าพิมพ์นิยายใน Studio เพื่อความสบายตาในการเขียนยาวนาน
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PAPER_THEMES.map(t => {
                        const isSelected = paperTheme === t.id
                        return (
                          <div
                            key={t.id}
                            onClick={() => setPaperTheme(t.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3.5 ${
                              isSelected
                                ? 'bg-purple-600/25 border-purple-400 ring-2 ring-purple-400/40 shadow-md'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl border shadow-inner shrink-0 ${t.bgPreview} flex items-center justify-center font-bold text-xs`}>
                              Aa
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-white flex items-center justify-between">
                                <span>{t.name}</span>
                                {isSelected && <span className="text-purple-300 text-xs">✓ เลือกอยู่</span>}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                {t.sub}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Font Size Range */}
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                        ขนาดตัวอักษรหน้าเขียน ({fontSize}px)
                      </span>
                      <span className="text-xs text-zinc-400">14px – 24px</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Performance & Graphics Setting */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                          กราฟิกและประสิทธิภาพ (Graphics & Performance)
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          ปรับความละเอียดและเอฟเฟกต์ตามสเปกเครื่องเพื่อความลื่นไหล 60 FPS
                        </p>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-semibold">
                        โหมดปัจจุบัน: {perfTier === 'low' ? 'ประหยัดพลังงาน' : perfTier === 'high' ? 'จัดเต็ม' : 'สมดุล'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPerfMode('low')}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          perfMode === 'low' || (perfMode === 'auto' && perfTier === 'low')
                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm ring-1 ring-purple-400/40'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                          <span>🥔</span>
                          <span>ประหยัดพลังงาน</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 leading-snug">
                          ปิด Canvas 3D & Blur สเปกต่ำ/เน็ตช้า ลื่น 100%
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPerfMode('balanced')}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          perfMode === 'balanced' || (perfMode === 'auto' && perfTier === 'balanced')
                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm ring-1 ring-purple-400/40'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                          <span>⚖️</span>
                          <span>สมดุล (แนะนำ)</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 leading-snug">
                          ลดจำนวนชิ้นส่วน ปรับ DPR พอเหมาะ ไม่กินแบต
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPerfMode('high')}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          perfMode === 'high' || (perfMode === 'auto' && perfTier === 'high')
                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm ring-1 ring-purple-400/40'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                          <span>🚀</span>
                          <span>จัดเต็ม</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 leading-snug">
                          เอฟเฟกต์และ Bloom เต็มรูปแบบ สำหรับคอมสเปกแรง
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Tour Restart */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div>
                        <div className="text-xs font-bold text-white">เริ่มทัวร์แนะนำการใช้งานอีกครั้ง</div>
                        <div className="text-[11px] text-zinc-400">เรียนรู้วิธีใช้ฟีเจอร์ AI และ Story Bible ทั้งหมด</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRestartTour}
                        className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-xs font-bold text-purple-200 transition cursor-pointer"
                      >
                        เริ่มทัวร์ ↗
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Interactive Avatar Cropper Modal */}
      <AvatarCropperModal
        isOpen={cropModalOpen}
        imageSrc={cropRawImage}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}
