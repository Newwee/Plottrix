import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { label: '📖 อ่านนิยาย', href: '#public-novels', isRead: true },
  { label: 'ฟีเจอร์', href: '#features' },
  { label: 'Coin Trix', href: '#coin-trix' },
  { label: 'เวิร์กสเปซ', href: '#workspace' },
  { label: 'เปรียบเทียบ', href: '#about' },
  { label: 'ราคา', href: '#pricing' }
]

export default function HomeNavbar() {
  const { navigateTo, setActiveModal } = useApp()
  const { user, profile } = useAuth()
  const [activeIdx, setActiveIdx] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const slotRefs = useRef([])
  const dotRef = useRef(null)

  // Move the glow dot under the active or hovered slot
  useEffect(() => {
    const targetIdx = hoveredIdx !== null ? hoveredIdx : activeIdx
    const slot = slotRefs.current[targetIdx]
    if (slot && dotRef.current) {
      const x = slot.offsetLeft + slot.offsetWidth / 2
      dotRef.current.style.transform = `translate3d(${x}px, 0, 0)`
    }
  }, [activeIdx, hoveredIdx])

  const handleLinkClick = (e, href, idx) => {
    setActiveIdx(idx)
    setMobileMenuOpen(false)
    const target = document.querySelector(href)
    if (target) {
      e.preventDefault()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className={`nav ${mobileMenuOpen ? 'mobile-open' : ''}`} id="top">
      <div className="wrap nav-inner">
        {/* Authentic Pill-Nav Bar */}
        <nav className="pill-nav" id="pillNav" aria-label="Main navigation">
          {/* Brand Logo Surface */}
          <a
            className="pill-nav__logo pill-nav__surface"
            href="#top"
            aria-label="Plottrix home"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <span className="pill-nav__mark">
              <img
                src="/Logo/PlottrixSingleLogo.png"
                alt="Plottrix Mark"
                className="pill-nav__logo-img"
              />
            </span>
            <span className="font-bold tracking-tight text-white font-sans text-[16px]">
              Plottrix
            </span>
            <span className="pill-nav__rim" />
          </a>

          {/* Desktop Navigation Track Surface */}
          <div className="pill-nav__bar pill-nav__surface">
            <div className="pill-nav__track" id="pillTrack">
              <ul className="pill-nav__list">
                {NAV_LINKS.map((link, idx) => {
                  const isActive = activeIdx === idx
                  const isHovered = hoveredIdx === idx

                  return (
                    <li
                      key={link.href}
                      ref={(el) => (slotRefs.current[idx] = el)}
                      className="pill-nav__slot"
                      data-hover={isHovered ? '' : undefined}
                      onPointerEnter={(e) => {
                        if (e.pointerType !== 'touch') {
                          setHoveredIdx(idx)
                        }
                      }}
                      onPointerLeave={() => setHoveredIdx(null)}
                    >
                      <a
                        className="pill-nav__item"
                        href={link.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={(e) => handleLinkClick(e, link.href, idx)}
                      >
                        <span className="pill-nav__fill" aria-hidden="true" />
                        <span className="pill-nav__face">{link.label}</span>
                        <span className="pill-nav__face-alt" aria-hidden="true">
                          {link.label}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
              <span
                ref={dotRef}
                className="pill-nav__dot"
                id="pillDot"
                aria-hidden="true"
              />
            </div>
            <span className="pill-nav__rim" />
          </div>
        </nav>

        {/* Right Desktop Nav Action Buttons */}
        <div className="nav-actions">
          <button
            type="button"
            onClick={() => navigateTo('test_ai')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/20 hover:bg-purple-600/35 border border-purple-400/40 text-purple-200 text-xs font-semibold transition cursor-pointer shadow-sm"
            title="ห้องทดสอบ AI (Localhost Sandbox)"
          >
            <span>🧪</span>
            <span className="hidden sm:inline">Test AI Lab</span>
          </button>

          <a
            href="#coin-trix"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 text-xs font-semibold transition"
            title="ระบบเหรียญ Coin Trix"
          >
            <img src="/Logo/TrixCoinLogo.png" alt="Coin Trix" className="w-4 h-4 object-contain inline-block" />
            <span className="hidden sm:inline">รับฟรี 30 Trix</span>
          </a>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveModal('settings')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition text-xs font-semibold text-white cursor-pointer"
                title="ตั้งค่าบัญชีและโปรไฟล์"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-600/40 border border-purple-400/40 flex items-center justify-center text-[10px] font-bold">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <span className="max-w-[120px] truncate">
                  {profile?.display_name || user.email?.split('@')[0]}
                </span>
                <span className="text-zinc-400 text-xs">⚙</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-small shadow-lg hover:shadow-purple-500/25 transition cursor-pointer"
                onClick={() => navigateTo('workspace_home')}
              >
                <span>เข้าสู่ Workspace</span>
                <span>↗</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="login cursor-pointer"
                onClick={() => setActiveModal('auth')}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                className="btn btn-primary btn-small shadow-lg hover:shadow-purple-500/25 transition cursor-pointer"
                onClick={() => setActiveModal('auth')}
              >
                <span>เริ่มต้นใช้งานฟรี</span>
                <span>↗</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="menu-toggle"
          aria-label="เปิดเมนู"
          aria-expanded={mobileMenuOpen}
          id="menuToggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="icon w-5 h-5 mx-auto"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        {/* Responsive Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-4 top-20 z-50 rounded-3xl bg-[#140e28]/98 border border-purple-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-5 backdrop-blur-2xl flex flex-col gap-3 animate-fade-in">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link, idx) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href, idx)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/15 transition min-h-[44px] flex items-center"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigateTo('test_ai')
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600/25 border border-purple-400/40 text-purple-200 text-xs font-bold min-h-[44px]"
              >
                <span>🧪</span>
                <span>ห้องทดสอบ Test AI Lab (Localhost)</span>
              </button>

              <a
                href="#coin-trix"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-bold min-h-[44px]"
              >
                <img src="/Logo/TrixCoinLogo.png" alt="Coin Trix" className="w-4 h-4 object-contain" />
                <span>รับฟรี 30 Trix แรกเข้า</span>
              </a>

              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigateTo('workspace_home')
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>เข้าสู่ Workspace</span>
                  <span>↗</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setActiveModal('auth')
                    }}
                    className="py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs min-h-[44px] cursor-pointer"
                  >
                    เข้าสู่ระบบ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setActiveModal('auth')
                    }}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md min-h-[44px] cursor-pointer"
                  >
                    เริ่มต้นฟรี ↗
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
