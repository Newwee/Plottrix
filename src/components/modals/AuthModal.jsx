import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'

export default function AuthModal() {
  const { user, profile, signIn, signUp, signOut } = useAuth()
  const { activeModal, setActiveModal, triggerToast } = useApp()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  if (activeModal !== 'auth') return null

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(email, password, fullName)
        triggerToast('สมัครสมาชิกสำเร็จและเข้าสู่ระบบแล้ว!', 'success')
      } else {
        await signIn(email, password)
        triggerToast('เข้าสู่ระบบสำเร็จ!', 'success')
      }
      setActiveModal(null)
    } catch (err) {
      console.error(err)
      triggerToast(`เข้าสู่ระบบไม่สำเร็จ: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      triggerToast('ออกจากระบบแล้ว', 'info')
      setActiveModal(null)
    } catch (err) {
      triggerToast(err.message, 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-pop">
      <div className="themed-panel border border-slate-300 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <span>{user ? '👤 ข้อมูลบัญชีนักเขียน' : mode === 'signin' ? '🔐 เข้าสู่ระบบ Plottrix' : '✨ สมัครสมาชิกใหม่'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              เชื่อมต่อ Supabase Database & Auth เพื่อซิงก์ข้อมูลข้ามอุปกรณ์
            </p>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-lg flex items-center justify-center">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {profile?.display_name || 'นักเขียน Plottrix'}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                    {profile?.plan || 'Free Plan'} • {profile?.trix_balance ?? 30} Trix
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition border border-red-500/20"
                >
                  ออกจากระบบ (Sign Out)
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    ชื่อนามปากกา / ชื่อแสดง
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="นามปากกาของคุณ..."
                    className="w-full themed-input px-3 py-2 text-xs rounded-lg border focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  อีเมล (Email)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full themed-input px-3 py-2 text-xs rounded-lg border focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  รหัสผ่าน (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร..."
                  minLength={6}
                  className="w-full themed-input px-3 py-2 text-xs rounded-lg border focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
              >
                {loading ? 'กำลังดำเนินการ...' : mode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกและรับ 30 Trix'}
              </button>

              <div className="text-center pt-2 text-xs text-slate-500">
                {mode === 'signin' ? (
                  <span>
                    ยังไม่มีบัญชี?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      สมัครสมาชิกฟรี
                    </button>
                  </span>
                ) : (
                  <span>
                    มีบัญชีอยู่แล้ว?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      เข้าสู่ระบบ
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
