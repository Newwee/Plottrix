import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { formatExpiryDateTime } from '../../lib/subscription'

export default function NotificationBell() {
  const {
    notifications,
    unreadNotificationCount,
    markOneNotificationRead,
    markAllRead
  } = useApp()

  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs text-purple-200 transition cursor-pointer"
        title="การแจ้งเตือนสมาชิกและการชำระเงิน"
      >
        <span>🔔</span>
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#140e27]/98 backdrop-blur-2xl border border-purple-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 overflow-hidden font-thai">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
            <span className="text-xs font-bold text-white">การแจ้งเตือน ({unreadNotificationCount} ใหม่)</span>
            {unreadNotificationCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-[11px] text-purple-300 hover:text-white underline cursor-pointer"
              >
                ทำเครื่องหมายอ่านทั้งหมด
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-plottrix-muted">
                ยังไม่มีรายการแจ้งเตือน
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.is_read) markOneNotificationRead(n.id)
                  }}
                  className={`w-full text-left p-3.5 hover:bg-white/5 transition cursor-pointer flex flex-col gap-1 ${
                    !n.is_read ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
                      <span>{n.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatExpiryDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
