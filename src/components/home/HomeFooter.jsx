import React from 'react'
import { useApp } from '../../context/AppContext'

export default function HomeFooter() {
  const { navigateTo } = useApp()

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <a
              className="brand"
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <img
                src="/Logo/PlottrixSingleLogo.png"
                alt="Plottrix Logo"
                className="footer-logo-img"
              />
              Plottrix
            </a>
            <p>
              พื้นที่เขียนนิยายอัจฉริยะที่นักเขียนคุมเกมเอง — ผู้ช่วยบรรณาธิการ AI ที่เข้าใจงานเขียนและเคารพเสียงของผู้สร้าง
            </p>
          </div>

          <div className="footer-col">
            <h4>PRODUCT</h4>
            <a href="#features">Features</a>
            <a href="#coin-trix">Coin Trix (เหรียญ AI)</a>
            <a
              href="#workspace"
              onClick={(e) => {
                e.preventDefault()
                navigateTo('workspace')
              }}
            >
              Workspace
            </a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className="footer-col">
            <h4>EXPLORE</h4>
            <a href="#about">Why Plottrix</a>
            <a href="#features">Style Persona</a>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                navigateTo('workspace')
              }}
            >
              Get Started
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Plottrix. All rights reserved. Designed for Thai Authors.</span>
        </div>
      </div>
    </footer>
  )
}
