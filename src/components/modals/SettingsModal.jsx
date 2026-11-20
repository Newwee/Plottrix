import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useDevicePerformance } from '../../hooks/useDevicePerformance'
import { compressImageToWebP } from '../../lib/imageCompressor'
import { modalBackdropVariants, modalContentVariants, tabContentVariants } from '../../lib/animations'

export default function SettingsModal() {
  const {
    activeModal,
    setActiveModal,
    settings,
    setSettings,
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
    plan
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

  if (activeModal !== 'settings') return null

  // Auth-gated protection: If not logged in, prompt to log in and close settings
  if (!user) {
    setActiveModal('auth')
    return null
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleRestartTour = () => {
    setActiveModal(null)
    startTour()
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) return
    setIsSavingProfile(true)
    try {
      await updateProfile({ display_name: displayName.trim() })
      addToast({
        title: 'บันทึกโปรไฟล์สำเร็จ!',
        description: 'ข้อมูลนามปากกาได้รับการอัปเดตเรียบร้อย',
        fuseColor: '#74d9b4'
      })
    } catch (err) {
      addToast({
        title: 'บันทึกไม่สำเร็จ',
        description: err.message,
        fuseColor: '#ff7fa0'
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      addToast({ title: 'ไฟล์ไม่ถูกต้อง', description: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', fuseColor: '#ff7fa0' })
      return
    }

    setIsUploadingAvatar(true)
    try {
      // Compress to WebP max 800x800
      const compressedBlob = await compressImageToWebP(file, 800, 800, 0.85)
      const compressedFile = new File([compressedBlob], `avatar_${Date.now()}.webp`, { type: 'image/webp' })

      await uploadAvatar(compressedFile)
      addToast({
        title: 'อัปโหลดรูปโปรไฟล์สำเร็จ!',
        description: 'รูปโปรไฟล์ได้รับการย่อขนาดและบันทึกลงระบบแล้ว',
        fuseColor: '#74d9b4'
      })
    } catch (err) {
      addToast({
        title: 'อัปโหลดรูปไม่สำเร็จ',
        description: err.message || 'โปรดตรวจสอบการเชื่อมต่อ Supabase Storage',
        fuseColor: '#ff7fa0'
      })
    } finally {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        variants={modalBackdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={() => setActiveModal(null)}
        className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Dialog */}
      <motion.div
        variants={modalContentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] rounded-[24px] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-[#141024] text-white my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#19142e]/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              ⚙️
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                การตั้งค่าระบบ (Workspace Settings)
              </h3>
              <p className="text-xs text-zinc-400">
                จัดการโปรไฟล์นักเขียน บัญชี และสภาพแวดล้อมห้องเขียน
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
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-white/10 bg-black/20">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'account'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>👤</span>
            <span>บัญชีและโปรไฟล์ (Account & Profile)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>✍️</span>
            <span>ห้องเขียน & การแจ้งเตือน (Editor & Notifications)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
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
                {/* 1. Profile Avatar & Display Name */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-400/40 bg-purple-950 flex items-center justify-center text-2xl font-bold shadow-lg">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] font-semibold text-white transition cursor-pointer"
                    >
                      {isUploadingAvatar ? 'กำลังย่อรูป...' : 'เปลี่ยนรูป'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <form onSubmit={handleSaveProfile} className="space-y-2">
                      <label className="text-xs text-zinc-400 block">นามปากกา / ชื่อนักเขียน</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="ตั้งนามปากกา..."
                          className="px-4 py-2 rounded-xl bg-black/30 border border-white/15 text-sm text-white focus:border-purple-400 focus:outline-none flex-1"
                        />
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition cursor-pointer"
                        >
                          {isSavingProfile ? 'บันทึก...' : 'บันทึก'}
                        </button>
                      </div>
                    </form>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      รูปจะถูกบีบอัดเป็น WebP (สูงสุด 800x800) และบันทึกลง Supabase Storage อัตโนมัติ
                    </span>
                  </div>
                </div>

                {/* 2. Account Details & Provider Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-xs text-zinc-400 block font-medium">อีเมลที่ผูกไว้</span>
                    <div className="text-sm font-semibold text-white truncate">{user.email}</div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                      <span>สถานะการเชื่อมต่อ:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] uppercase">
                        {provider}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-xs text-zinc-400 block font-medium">แพ็กเกจ & เหรียญ Trix</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-purple-300">{plan}</span>
                      <span className="text-sm font-bold text-amber-300">🪙 {trixBalance} Trix</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal('pricing')}
                      className="text-xs text-purple-300 hover:text-purple-200 underline font-semibold mt-1 block cursor-pointer"
                    >
                      อัปเกรดแพ็กเกจหรือเติมเหรียญ ↗
                    </button>
                  </div>
                </div>

                {/* 3. Security Actions: Reset Password & Sign Out */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    🔑 ส่งอีเมลเปลี่ยนรหัสผ่าน
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition cursor-pointer"
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
                {/* Editor Typography Settings */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    ธีมและตัวอักษรหน้าเขียนนิยาย
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400">ธีมหน้ากระดาษ (Paper Theme)</label>
                      <select
                        value={paperTheme}
                        onChange={(e) => setPaperTheme(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none"
                      >
                        <option value="midnight" className="bg-[#16102a]">Midnight Obsidian (มืด)</option>
                        <option value="velvet" className="bg-[#16102a]">Velvet Royal (ม่วงเข้ม)</option>
                        <option value="cream" className="bg-[#16102a]">Sepia Cream (ถนอมสายตา)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400">ขนาดตัวอักษร ({fontSize}px)</label>
                      <input
                        type="range"
                        min="14"
                        max="24"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>
                  </div>
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
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
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
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
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
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
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

                {/* Notifications & Tour */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    การแจ้งเตือนและการแนะนำ (Tour & Toast)
                  </h4>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-xs font-semibold text-white">เริ่มทัวร์แนะนำการใช้งานอีกครั้ง</div>
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
  )
}
