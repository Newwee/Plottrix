import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import AeroShardsCanvas from '../workspace/AeroShardsCanvas'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

export default function AuthModal() {
  const {
    user,
    profile,
    signIn,
    signUp,
    signInWithOAuth,
    signInWithOtp,
    resetPassword,
    signOut
  } = useAuth()

  const { activeModal, setActiveModal, addToast } = useApp()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'magiclink' | 'reset'
  const [step, setStep] = useState(1) // 1: Email, 2: Password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null)

  if (activeModal !== 'auth') return null

  const handleClose = () => {
    setActiveModal(null)
    setStep(1)
    setPassword('')
    setConfirmPassword('')
  }

  // Step 1: Continue
  const handleEmailContinue = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      addToast({
        title: 'อีเมลไม่ถูกต้อง',
        description: 'กรุณากรอกอีเมลที่ถูกต้อง',
        fuseColor: '#ff7fa0'
      })
      return
    }
    setStep(2)
  }

  // Step 2: Sign in or Sign up
  const handleAuthSubmit = async (e) => {
    e.preventDefault()

    if (mode === 'signup') {
      if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        addToast({
          title: 'รหัสผ่านไม่ปลอดภัย',
          description: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวอักษรและตัวเลข',
          fuseColor: '#ff7fa0'
        })
        return
      }
      if (password !== confirmPassword) {
        addToast({
          title: 'รหัสผ่านไม่ตรงกัน',
          description: 'กรุณากรอกรหัสผ่านยืนยันให้ตรงกัน',
          fuseColor: '#ff7fa0'
        })
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, fullName || email.split('@')[0])
        addToast({
          title: 'สร้างบัญชีสำเร็จ!',
          description: 'ยินดีต้อนรับสู่ Plottrix! รับฟรี 30 Trix เริ่มเขียนได้เลย',
          fuseColor: '#74d9b4'
        })
      } else {
        await signIn(email, password)
        addToast({
          title: 'เข้าสู่ระบบสำเร็จ!',
          description: 'ยินดีต้อนรับกลับสู่ห้องเขียน Plottrix',
          fuseColor: '#74d9b4'
        })
      }
      handleClose()
    } catch (err) {
      addToast({
        title: mode === 'signup' ? 'สมัครสมาชิกไม่สำเร็จ' : 'เข้าสู่ระบบไม่สำเร็จ',
        description: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
        fuseColor: '#ff7fa0'
      })
    } finally {
      setLoading(false)
    }
  }

  // Magic Link Submit
  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      addToast({ title: 'กรุณากรอกอีเมล', fuseColor: '#ff7fa0' })
      return
    }
    setLoading(true)
    try {
      await signInWithOtp(email)
      addToast({
        title: 'ส่ง Magic Link เรียบร้อย!',
        description: 'กรุณาตรวจสอบกล่องจดหมายอีเมลของคุณเพื่อเข้าสู่ระบบ',
        fuseColor: '#74d9b4'
      })
      handleClose()
    } catch (err) {
      addToast({ title: 'ส่งลิงก์ไม่สำเร็จ', description: err.message, fuseColor: '#ff7fa0' })
    } finally {
      setLoading(false)
    }
  }

  // Reset Password Submit
  const handleResetSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      addToast({ title: 'กรุณากรอกอีเมล', fuseColor: '#ff7fa0' })
      return
    }
    setLoading(true)
    try {
      await resetPassword(email)
      addToast({
        title: 'ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว',
        description: 'กรุณาตรวจสอบอีเมลของคุณเพื่อตั้งรหัสผ่านใหม่',
        fuseColor: '#74d9b4'
      })
      handleClose()
    } catch (err) {
      addToast({ title: 'เกิดข้อผิดพลาด', description: err.message, fuseColor: '#ff7fa0' })
    } finally {
      setLoading(false)
    }
  }

  // OAuth Trigger
  const handleOAuth = async (provider) => {
    setOauthLoading(provider)
    try {
      await signInWithOAuth(provider)
    } catch (err) {
      addToast({
        title: `เข้าสู่ระบบด้วย ${provider} ไม่สำเร็จ`,
        description: err.message,
        fuseColor: '#ff7fa0'
      })
      setOauthLoading(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ isolation: 'isolate' }}
    >
      {/* 3D Ambient Background Shards Canvas behind Auth Screen */}
      <AeroShardsCanvas />

      {/* Dimmed backdrop with blur that dismisses on click */}
      <motion.div
        variants={modalBackdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={handleClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-10 cursor-pointer"
      />

      {/* Auth Card Container */}
      <motion.div
        variants={modalContentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 w-full max-w-[420px] bg-[#14121a]/95 border border-white/10 rounded-[28px] p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-white select-none my-auto"
      >
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
          title="ปิดหน้าต่าง (Esc)"
        >
          ✕
        </button>

        {/* 1. Header (Sign in / Create an account) */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            {mode === 'magiclink'
              ? 'Magic Link'
              : mode === 'reset'
              ? 'Reset Password'
              : mode === 'signup'
              ? 'Create an account'
              : 'Sign in'}
          </h1>

          <div className="text-sm text-zinc-400">
            {mode === 'magiclink' ? (
              <span>
                เข้าสู่ระบบโดยไม่ต้องใช้รหัสผ่าน ·{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setStep(1); }}
                  className="underline font-semibold hover:text-white text-zinc-300"
                >
                  Sign in with password
                </button>
              </span>
            ) : mode === 'reset' ? (
              <span>
                ลืมรหัสผ่าน? ·{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setStep(1); }}
                  className="underline font-semibold hover:text-white text-zinc-300"
                >
                  Back to Sign in
                </button>
              </span>
            ) : mode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setStep(1); }}
                  className="underline font-semibold hover:text-white text-zinc-200"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                New user?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setStep(1); }}
                  className="underline font-semibold hover:text-white text-zinc-200"
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>

        {/* 2. Form Flow */}
        {mode === 'magiclink' ? (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-5 py-3.5 rounded-full bg-[#1e1b26] border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-purple-400 focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'กำลังส่งลิงก์...' : 'Send Magic Link'}
            </button>
          </form>
        ) : mode === 'reset' ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-5 py-3.5 rounded-full bg-[#1e1b26] border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-purple-400 focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'กำลังส่งคำขอ...' : 'Send Reset Link'}
            </button>
          </form>
        ) : step === 1 ? (
          /* Step 1: Email Input + Continue Button */
          <form onSubmit={handleEmailContinue} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoFocus
                className="w-full px-5 py-3.5 rounded-full bg-[#1e1b26] border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-purple-400 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition shadow-lg flex items-center justify-center cursor-pointer"
            >
              Continue
            </button>
          </form>
        ) : (
          /* Step 2: Password & Name Confirmation */
          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {/* Email chip with Edit button */}
            <div className="flex items-center justify-between px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
              <span className="truncate">{email}</span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-purple-300 hover:text-white font-semibold underline text-xs ml-2 cursor-pointer"
              >
                Edit
              </button>
            </div>

            {mode === 'signup' && (
              <div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="นามปากกา / ชื่อนักเขียน (Display Name)"
                  className="w-full px-5 py-3 rounded-full bg-[#1e1b26] border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-purple-400 focus:outline-none transition"
                />
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Password (อย่างน้อย 8 ตัวอักษร)' : 'Password'}
                autoFocus
                className="w-full px-5 py-3 rounded-full bg-[#1e1b26] border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-purple-400 focus:outline-none transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                {showPassword ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>

            {mode === 'signup' && (
              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full px-5 py-3 rounded-full bg-[#1e1b26] border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-purple-400 focus:outline-none transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition shadow-lg flex items-center justify-center cursor-pointer mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>กำลังดำเนินการ...</span>
                </div>
              ) : mode === 'signup' ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        )}

        {/* 3. Divider: "or" */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-white/10" />
          <span className="px-3 text-xs text-zinc-500 font-medium">or</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* 4. Social OAuth Buttons (Google, Discord, GitHub) */}
        <div className="space-y-3">
          {/* Sign in with Google */}
          <button
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuth('google')}
            className="w-full py-3 px-4 rounded-full bg-[#1e1b26] hover:bg-[#282434] border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-3 transition cursor-pointer hover:border-white/20 shadow-sm"
          >
            {oauthLoading === 'google' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          {/* Sign in with Apple */}
          <button
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuth('apple')}
            className="w-full py-3 px-4 rounded-full bg-[#1e1b26] hover:bg-[#282434] border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-3 transition cursor-pointer hover:border-white/20 shadow-sm"
          >
            {oauthLoading === 'apple' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 170 170" fill="currentColor">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.59-7.71-11.72-14-4.99-7.6-9.02-16.53-12.09-26.78-3.07-10.25-4.61-20.25-4.61-30 0-14.45 3.65-26.68 10.96-36.68 7.3-10.01 16.5-15.11 27.59-15.31 4.58 0 9.85 1.25 15.81 3.75 5.96 2.5 9.77 3.86 11.45 4.09 2.12-.34 6.27-1.87 12.44-4.59 6.17-2.72 11.39-3.9 15.66-3.53 11.74.88 20.94 5.25 27.61 13.12-10.43 6.31-15.54 15.11-15.32 26.4.22 8.91 3.64 16.32 10.27 22.23 6.63 5.91 14.54 9.25 23.74 10.02-2.17 6.31-4.78 12.56-7.84 18.75zm-33.15-114.73c0 6.74-2.45 13.18-7.35 19.32-4.9 6.14-10.99 9.87-18.28 11.19-.22-.88-.33-1.66-.33-2.35 0-6.52 2.61-13.06 7.83-19.62 5.22-6.56 11.41-10.39 18.57-11.49-.44 1-.44 1.98-.44 2.95z"/>
              </svg>
            )}
            <span>Sign in with Apple</span>
          </button>

          {/* Sign in with GitHub */}
          <button
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuth('github')}
            className="w-full py-3 px-4 rounded-full bg-[#1e1b26] hover:bg-[#282434] border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-3 transition cursor-pointer hover:border-white/20 shadow-sm"
          >
            {oauthLoading === 'github' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            )}
            <span>Sign in with GitHub</span>
          </button>
        </div>

        {/* 5. Footer Links (More sign-in options, Can't sign in? Get help) */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-col items-center gap-2 text-xs text-zinc-400">
          <button
            type="button"
            onClick={() => { setMode('magiclink'); setStep(1); }}
            className="hover:text-white transition font-medium cursor-pointer"
          >
            More sign-in options
          </button>

          <div>
            Can't sign in?{' '}
            <button
              type="button"
              onClick={() => { setMode('reset'); setStep(1); }}
              className="underline font-semibold hover:text-white text-zinc-300 cursor-pointer"
            >
              Get help
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
