import React, { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

export default function HomeNavbar() {
  const { navigateTo, setActiveModal } = useApp()
  const [activeIdx, setActiveIdx] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'ฟีเจอร์', href: '#features' },
    { label: 'เวิร์กสเปซ', href: '#workspace' },
    { label: 'เปรียบเทียบ', href: '#about' },
    { label: 'ราคา', href: '#pricing' },
  ]

  return (
    <header className="nav" id="top">
      <nav className="pill-nav" id="pillNav" aria-label="Main navigation">
        {/* Brand Logo */}
        <a
          href="#top"
          className="pill-nav__logo pill-nav__surface"
          aria-label="Plottrix Home"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <img
            src="/Logo/PlottrixSingleLogo.png"
            alt="Plottrix Logo"
            className="pill-nav__logo-img"
          />
          <span>Plottrix</span>
        </a>

        {/* Desktop Navigation Track */}
        <div className="pill-nav__track pill-nav__surface" id="pillTrack">
          {navLinks.map((link, idx) => (
            <div
              key={link.href}
              className="pill-nav__slot"
              onPointerEnter={() => setActiveIdx(idx)}
            >
              <a
                href={link.href}
                className="pill-nav__link"
                onClick={() => setActiveIdx(idx)}
              >
                {link.label}
              </a>
            </div>
          ))}
          <span
            className="pill-nav__dot"
            id="pillDot"
            aria-hidden="true"
            style={{
              left: `${activeIdx * 25 + 12.5}%`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="pill-nav__actions">
          <button
            type="button"
            className="pill-nav__cta pill-nav__cta--ghost"
            onClick={() => setActiveModal('pricing')}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            className="pill-nav__cta pill-nav__cta--primary"
            onClick={() => navigateTo('workspace')}
          >
            เริ่มต้นใช้งาน
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="menu-toggle"
          aria-label="เปิดเมนู"
          aria-expanded={mobileMenuOpen}
          id="menuToggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay animate-pop">
          <div className="mobile-menu-card">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mobile-actions">
              <button
                className="btn btn-ghost w-full"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setActiveModal('pricing')
                }}
              >
                เข้าสู่ระบบ
              </button>
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigateTo('workspace')
                }}
              >
                เริ่มต้นใช้งานฟรี →
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
