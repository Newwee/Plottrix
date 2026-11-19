import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

export default function ExportModal() {
  const {
    activeModal, setActiveModal,
    novelTitle, chapters,
    addToast
  } = useApp()

  const [exportFormat, setExportFormat] = useState('raw') // 'raw', 'txt', 'dekd'
  const [includeChapterHeaders, setIncludeChapterHeaders] = useState(true)

  const isOpen = activeModal === 'export'

  // Generate full text
  const generateManuscriptText = () => {
    let full = ''
    if (includeChapterHeaders) {
      full += `${novelTitle.toUpperCase()}\n`
      full += `========================================\n\n`
    }

    chapters.forEach(ch => {
      if (includeChapterHeaders) {
        full += `\n\n[ตอนที่ ${ch.number}: ${ch.title}]\n\n`
      }
      ch.pages.forEach((page, pIdx) => {
        if (pIdx > 0 && exportFormat !== 'dekd') {
          full += `\n--- [หน้า ${pIdx + 1}] ---\n\n`
        }
        full += page.trim() + '\n\n'
      })
    })

    return full.trim()
  }

  const handleCopyClipboard = () => {
    const text = generateManuscriptText()
    navigator.clipboard.writeText(text)
    addToast({
      title: 'คัดลอกต้นฉบับลงคลิปบอร์ดแล้ว',
      description: 'พร้อมนำไปวางลงใน ReadAWrite / Dek-D หรือโปรแกรมจัดหน้า',
      fuseColor: '#74d9b4'
    })
  }

  const handleDownloadTxt = () => {
    const text = generateManuscriptText()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${novelTitle || 'manuscript'}.txt`
    a.click()
    URL.revokeObjectURL(url)

    addToast({
      title: 'ดาวน์โหลดไฟล์สำเร็จ!',
      description: `บันทึกไฟล์ "${novelTitle}.txt" เรียบร้อย`,
      fuseColor: '#74d9b4'
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
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

          {/* Dialog Card */}
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 glass-panel w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#141024] my-auto text-white"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-plottrix-line/40 flex items-center justify-between bg-plottrix-panel2/60">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📤</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Export Manuscript (ส่งออกต้นฉบับ)
                  </h3>
                  <p className="text-[11px] text-plottrix-muted">
                    ดาวน์โหลดหรือคัดลอกเนื้อหาทั้งหมดเพื่อนำไปเผยแพร่บนแพลตฟอร์มนิยาย
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Options */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Format Selection */}
              <div>
                <label className="text-xs text-plottrix-muted font-bold block mb-2">
                  รูปแบบการส่งออก (Export Format)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setExportFormat('raw')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                      exportFormat === 'raw'
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5">ReadAWrite</div>
                    <div className="text-[10px] text-zinc-400">เว้นบรรทัดสำหรับ RAW</div>
                  </div>

                  <div
                    onClick={() => setExportFormat('dekd')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                      exportFormat === 'dekd'
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5">Dek-D</div>
                    <div className="text-[10px] text-zinc-400">ตัดเส้นแบ่งหน้า</div>
                  </div>

                  <div
                    onClick={() => setExportFormat('txt')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                      exportFormat === 'txt'
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5">Plain TXT</div>
                    <div className="text-[10px] text-zinc-400">ข้อความบริสุทธิ์</div>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeChapterHeaders}
                    onChange={e => setIncludeChapterHeaders(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  <span>ใส่หัวข้อชื่อตอน [ตอนที่ X: ชื่อตอน] ในต้นฉบับ</span>
                </label>
              </div>

              {/* Text Preview Box */}
              <div>
                <label className="text-xs text-plottrix-muted font-bold block mb-1.5">
                  ตัวอย่างเนื้อหา (Preview)
                </label>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs leading-relaxed text-zinc-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {generateManuscriptText().slice(0, 500)}...
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/15 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📋</span>
                  <span>คัดลอกลงคลิปบอร์ด</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>⬇</span>
                  <span>ดาวน์โหลดไฟล์ .txt</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
