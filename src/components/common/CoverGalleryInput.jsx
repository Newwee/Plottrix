import React, { useState } from 'react'

/**
 * Client-side Canvas Image Compression
 * Scales images to book-cover standard (max 600x800) and encodes to WebP/JPEG
 * Drops multi-megabyte uploads to lightweight ~25-45KB to prevent localStorage and Supabase timeouts
 */
export function compressImageFile(file, maxWidth = 600, maxHeight = 800, quality = 0.75) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        let dataUrl = canvas.toDataURL('image/webp', quality)
        if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }
        resolve(dataUrl)
      }
      img.onerror = () => resolve(e.target?.result)
      img.src = e.target?.result
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

export default function CoverGalleryInput({ images = [], onChange, maxImages = 5 }) {
  // Ensure array of max 5 strings
  const list = Array.isArray(images) ? images.slice(0, maxImages) : []
  const [activeSlot, setActiveSlot] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [compressingSlot, setCompressingSlot] = useState(null)

  const handleUpdateSlot = (index, newUrl) => {
    const updated = [...list]
    if (newUrl) {
      updated[index] = newUrl
    } else {
      updated.splice(index, 1)
    }
    onChange(updated.filter(Boolean))
    setActiveSlot(null)
    setUrlInput('')
  }

  const handleAddSlot = (newUrl) => {
    if (!newUrl || list.length >= maxImages) return
    onChange([...list, newUrl])
    setActiveSlot(null)
    setUrlInput('')
  }

  const handleFileUpload = async (e, index = null) => {
    const file = e.target.files?.[0]
    if (!file) return

    const targetIdx = index !== null ? index : list.length
    setCompressingSlot(targetIdx)

    try {
      // Compress client-side automatically before setting state
      const compressed = await compressImageFile(file, 600, 800, 0.75)
      if (compressed) {
        if (index !== null && index < list.length) {
          handleUpdateSlot(index, compressed)
        } else {
          handleAddSlot(compressed)
        }
      }
    } catch (err) {
      console.error('[CoverGalleryInput] Compression error:', err)
    } finally {
      setCompressingSlot(null)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
          <span>🖼️</span>
          <span>ภาพปกนิยาย (สูงสุด 5 ภาพ สลับ Animation บนหน้าหลัก):</span>
        </label>
        <span className="text-[11px] text-plottrix-muted font-mono">
          {list.length} / {maxImages} ภาพ
        </span>
      </div>

      {/* Grid of Slots */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[0, 1, 2, 3, 4].map((slotIdx) => {
          const imgUrl = list[slotIdx]
          const isPrimary = slotIdx === 0

          if (imgUrl) {
            return (
              <div
                key={slotIdx}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-purple-500/40 bg-black/40 shadow-md"
              >
                <img
                  src={imgUrl}
                  alt={`Cover ${slotIdx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge */}
                <div className="absolute top-1.5 left-1.5 z-10">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow ${
                    isPrimary ? 'bg-amber-500 text-black' : 'bg-black/70 text-purple-300 border border-white/20'
                  }`}>
                    {isPrimary ? '⭐ รูปหลัก' : `#${slotIdx + 1}`}
                  </span>
                </div>

                {/* Delete button on hover */}
                <button
                  type="button"
                  onClick={() => handleUpdateSlot(slotIdx, null)}
                  className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                  title="ลบรูปนี้"
                >
                  ✕
                </button>
              </div>
            )
          }

          // Empty slot
          if (slotIdx <= list.length) {
            const isCompressing = compressingSlot === slotIdx
            return (
              <div
                key={slotIdx}
                className="aspect-[3/4] rounded-xl border border-dashed border-purple-500/30 hover:border-purple-400/60 bg-white/[0.02] hover:bg-white/[0.05] p-2 flex flex-col items-center justify-center text-center transition cursor-pointer relative"
              >
                {!isCompressing && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, slotIdx)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    title={`อัปโหลดภาพที่ ${slotIdx + 1}`}
                  />
                )}
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9px] text-purple-300 font-semibold">กำลังบีบอัด...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-xl mb-1 text-purple-400">＋</span>
                    <span className="text-[10px] font-bold text-slate-300">
                      {isPrimary ? 'เพิ่มรูปหลัก' : `รูปที่ ${slotIdx + 1}`}
                    </span>
                    <span className="text-[9px] text-plottrix-muted">คลิกเพื่ออัปโหลด</span>
                  </>
                )}
              </div>
            )
          }

          return (
            <div
              key={slotIdx}
              className="aspect-[3/4] rounded-xl border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-slate-600"
            >
              <span className="text-xs">🔒</span>
              <span className="text-[9px]">ช่องที่ {slotIdx + 1}</span>
            </div>
          )
        })}
      </div>

      {/* URL Input Accordion for pasting direct links */}
      <div className="pt-1">
        {activeSlot === null ? (
          <button
            type="button"
            onClick={() => setActiveSlot('url_add')}
            className="text-[11px] text-purple-300 hover:text-purple-200 underline cursor-pointer"
          >
            + หรือใส่ลิงก์รูปภาพ (Image URL) โดยตรง
          </button>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-purple-500/30">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="วาง URL รูปภาพ (https://...)..."
              className="flex-1 bg-transparent text-xs text-white outline-none px-2"
            />
            <button
              type="button"
              onClick={() => handleAddSlot(urlInput)}
              disabled={!urlInput.trim() || list.length >= maxImages}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
            >
              เพิ่ม
            </button>
            <button
              type="button"
              onClick={() => { setActiveSlot(null); setUrlInput('') }}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-plottrix-muted">
        ✦ รูปแรกจะแสดงนานที่สุดเสมอ (5 วินาที) ส่วนรูปที่ 2-5 จะสลับแสดง 2.5 วินาที เมื่อผู้อ่านชี้เมาส์ รูปจะค้างไว้ที่รูปแรกอัตโนมัติ
      </p>
    </div>
  )
}
