import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function ExportModal() {
  const {
    activeModal, setActiveModal,
    novelTitle, chapters,
    addToast
  } = useApp()

  const [exportFormat, setExportFormat] = useState('raw') // 'raw', 'txt', 'dekd'
  const [includeChapterHeaders, setIncludeChapterHeaders] = useState(true)

  if (activeModal !== 'export') return null

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
    a.download = `${novelTitle || 'Plottrix_Manuscript'}.txt`
    a.click()
    URL.revokeObjectURL(url)

    addToast({
      title: 'ดาวน์โหลดไฟล์ .txt สำเร็จ',
      description: 'ไฟล์ต้นฉบับถูกบันทึกลงในเครื่องของคุณแล้ว',
      fuseColor: '#74d9b4'
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-plottrix-line/40 flex items-center justify-between bg-plottrix-panel2/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📤</span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Export Manuscript (ส่งออกต้นฉบับ)
              </h3>
              <p className="text-[11px] text-plottrix-muted">
                พร้อมจัดหน้าสำหรับส่งสำนักพิมพ์ หรือเผยแพร่บน ReadAWrite / Dek-D
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Options */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setExportFormat('dekd')}
              className={`p-3 rounded-xl border text-center transition ${
                exportFormat === 'dekd'
                  ? 'bg-plottrix-purple/20 border-plottrix-purple2 text-white font-bold'
                  : 'bg-plottrix-panel2/50 border-plottrix-line/30 text-plottrix-muted hover:text-white'
              }`}
            >
              <div className="text-base mb-1">📖</div>
              <div className="text-xs">ReadAWrite / Dek-D</div>
            </button>

            <button
              onClick={() => setExportFormat('txt')}
              className={`p-3 rounded-xl border text-center transition ${
                exportFormat === 'txt'
                  ? 'bg-plottrix-purple/20 border-plottrix-purple2 text-white font-bold'
                  : 'bg-plottrix-panel2/50 border-plottrix-line/30 text-plottrix-muted hover:text-white'
              }`}
            >
              <div className="text-base mb-1">📄</div>
              <div className="text-xs">Plain Text (.txt)</div>
            </button>

            <button
              onClick={() => setExportFormat('raw')}
              className={`p-3 rounded-xl border text-center transition ${
                exportFormat === 'raw'
                  ? 'bg-plottrix-purple/20 border-plottrix-purple2 text-white font-bold'
                  : 'bg-plottrix-panel2/50 border-plottrix-line/30 text-plottrix-muted hover:text-white'
              }`}
            >
              <div className="text-base mb-1">📝</div>
              <div className="text-xs">พร้อมหัวข้อบท</div>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-plottrix-text">
            <input
              type="checkbox"
              id="includeHeaders"
              checked={includeChapterHeaders}
              onChange={e => setIncludeChapterHeaders(e.target.checked)}
              className="accent-purple-600 rounded"
            />
            <label htmlFor="includeHeaders" className="cursor-pointer">
              รวมชื่อตอนและตัวคั่นหัวข้อบท
            </label>
          </div>

          {/* Preview Box */}
          <div className="p-4 rounded-xl bg-plottrix-bg2/90 border border-plottrix-line/40 max-h-56 overflow-y-auto text-xs text-plottrix-text leading-relaxed whitespace-pre-wrap font-thai">
            {generateManuscriptText().slice(0, 1000)}...
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              onClick={handleCopyClipboard}
              className="px-4 py-2 rounded-xl bg-plottrix-panel2 hover:bg-white/10 text-xs font-semibold text-plottrix-text border border-plottrix-line transition flex items-center gap-1.5"
            >
              <span>📋</span>
              <span>คัดลอกลงคลิปบอร์ด</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-4 py-2 rounded-xl btn-primary-purple text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <span>⬇</span>
              <span>ดาวน์โหลดไฟล์ .txt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
