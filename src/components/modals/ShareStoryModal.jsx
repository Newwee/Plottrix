import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { copyToClipboard, getSocialShareUrls } from '../../lib/seoHelper'
import confetti from 'canvas-confetti'

export default function ShareStoryModal({ isOpen, onClose, story, storyId }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !story) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://plottrix.vercel.app'
  const shareUrl = `${origin}/story/${storyId || story.id}`
  const coverImg = (Array.isArray(story.cover_images) && story.cover_images[0]) || story.cover_url || story.cover || `${origin}/Logo/PlottrixFullLogo.png`
  const authorName = story.authorName || story.author_display_name || 'นักเขียน Plottrix'
  const shareUrls = getSocialShareUrls(shareUrl, story.title, authorName)

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl)
    if (success) {
      setCopied(true)
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#38bdf8', '#4ade80']
      })
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: `${story.title} — Plottrix`,
          text: `อ่านนิยายเรื่อง "${story.title}" โดย ${authorName} บน Plottrix ฟรี!`,
          url: shareUrl
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy()
        }
      }
    } else {
      handleCopy()
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#130d2a]/95 border border-purple-500/30 p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-white font-thai overflow-hidden"
        >
          {/* Subtle Glow Header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500" />

          {/* Title Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔗</span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  แชร์นิยายเรื่องนี้
                </h3>
                <p className="text-[11px] text-plottrix-muted">
                  ส่งต่อผลงานให้นักอ่านในโซเชียลและแชทต่างๆ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Social Chat Preview Box (Simulating LINE / Facebook / Discord card) */}
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-purple-300">
                <span>📱</span>
                <span>ตัวอย่างการแสดงผลเวลาส่งในแชท:</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                ✓ รูปปก &amp; ชื่อเรื่องพร้อม
              </span>
            </div>

            <div className="rounded-2xl bg-[#090614] border border-purple-500/30 p-3 sm:p-3.5 flex gap-3.5 items-start shadow-inner">
              <img
                src={coverImg}
                alt={story.title}
                className="w-20 sm:w-24 aspect-[3/4] object-cover rounded-xl border border-white/10 shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block truncate">
                  plottrix.vercel.app · {story.genre || 'นิยายออนไลน์'}
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-white leading-tight line-clamp-2">
                  {story.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  โดย <strong className="text-purple-300">{authorName}</strong>
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {story.synopsis || 'ร่วมติดตามความเข้มข้นของผลงานเรื่องนี้ได้ที่ Plottrix อ่านฟรี 5 ตอนแรก...'}
                </p>
              </div>
            </div>
          </div>

          {/* Copy Link Input Bar */}
          <div className="space-y-1.5 mb-5">
            <label className="text-[11px] font-semibold text-slate-300">
              ลิงก์สำหรับแชร์:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/30 text-white font-mono text-xs focus:outline-none select-all"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-purple-600/30'
                }`}
              >
                <span>{copied ? '✓' : '📋'}</span>
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>

          {/* 1-Click Social Sharing Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">
              หรือแชร์ไปยังแอปโดยตรง:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* LINE */}
              <a
                href={shareUrls.line}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#06C755]/15 hover:bg-[#06C755]/25 border border-[#06C755]/40 text-[#06C755] text-xs font-bold transition"
              >
                <span className="text-sm">💬</span>
                <span>LINE</span>
              </a>

              {/* Facebook */}
              <a
                href={shareUrls.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#1877F2] text-xs font-bold transition"
              >
                <span className="text-sm">📘</span>
                <span>Facebook</span>
              </a>

              {/* Twitter / X */}
              <a
                href={shareUrls.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition"
              >
                <span className="text-sm">🐦</span>
                <span>X / Twitter</span>
              </a>

              {/* Native Device Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 text-purple-200 text-xs font-bold transition cursor-pointer"
              >
                <span className="text-sm">📱</span>
                <span>แอปอื่นๆ</span>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 text-center">
            <p className="text-[11px] text-plottrix-muted">
              ✦ เมื่อผู้อ่านเปิดลิงก์นี้จะเข้ามายังหน้ารายละเอียดและเริ่มอ่านได้ทันทีฟรี 5 ตอนแรก
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
