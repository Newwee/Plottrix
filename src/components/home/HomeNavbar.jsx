import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { label: 'ฟีเจอร์', href: '#features' },
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
                onClick={() => navigateTo('workspace')}
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
      </div>
    </header>
  )
}
