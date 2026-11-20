import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

export default function AvatarCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imgLoaded, setImgLoaded] = useState(false)
  const [previewDataUrl, setPreviewDataUrl] = useState('')

  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  // Reset state when new image is loaded
  useEffect(() => {
    if (imageSrc && isOpen) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setImgLoaded(false)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imageRef.current = img
        setImgLoaded(true)
      }
      img.src = imageSrc
    }
  }, [imageSrc, isOpen])

  // Draw interactive crop canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !imgLoaded) return

    const ctx = canvas.getContext('2d')
    const size = 320
    canvas.width = size
    canvas.height = size

    // Clear background
    ctx.clearRect(0, 0, size, size)

    // Calculate dimensions
    const baseScale = Math.max(size / img.width, size / img.height)
    const currentScale = baseScale * zoom
    const drawWidth = img.width * currentScale
    const drawHeight = img.height * currentScale

    const centerX = size / 2 + pan.x
    const centerY = size / 2 + pan.y
    const drawX = centerX - drawWidth / 2
    const drawY = centerY - drawHeight / 2

    // Draw source image
    ctx.save()
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

    // Draw circular vignette / mask overlay
    ctx.fillStyle = 'rgba(10, 7, 20, 0.72)'
    ctx.beginPath()
    ctx.rect(0, 0, size, size)
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2, true)
    ctx.fill()

    // Draw circular crop boundary guide
    ctx.strokeStyle = '#c084fc'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2)
    ctx.stroke()

    // Subtle crosshair guides
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(size / 2, 10)
    ctx.lineTo(size / 2, size - 10)
    ctx.moveTo(10, size / 2)
    ctx.lineTo(size - 10, size / 2)
    ctx.stroke()
    ctx.restore()

    // Update real-time mini circular preview
    try {
      const previewCanvas = document.createElement('canvas')
      const pSize = 120
      previewCanvas.width = pSize
      previewCanvas.height = pSize
      const pCtx = previewCanvas.getContext('2d')

      const pScale = (pSize / (size - 20))
      pCtx.drawImage(
        canvas,
        10, 10, size - 20, size - 20,
        0, 0, pSize, pSize
      )
      setPreviewDataUrl(previewCanvas.toDataURL('image/png'))
    } catch {
      // Ignored if canvas tainted
    }
  }, [zoom, pan, imgLoaded])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch pan handlers for mobile/tablets
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      })
    }
  }

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Final export of cropped circle/square to WebP
  const handleConfirmCrop = () => {
    const img = imageRef.current
    if (!img || !imgLoaded) return

    const exportSize = 600
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = exportSize
    exportCanvas.height = exportSize
    const ctx = exportCanvas.getContext('2d')

    const size = 320
    const cropDiameter = size - 20
    const ratio = exportSize / cropDiameter

    const baseScale = Math.max(size / img.width, size / img.height)
    const currentScale = baseScale * zoom * ratio
    const drawWidth = img.width * currentScale
    const drawHeight = img.height * currentScale

    const centerX = exportSize / 2 + pan.x * ratio
    const centerY = exportSize / 2 + pan.y * ratio
    const drawX = centerX - drawWidth / 2
    const drawY = centerY - drawHeight / 2

    // Draw high-resolution cropped content
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const finalFile = new File([blob], `avatar_crop_${Date.now()}.webp`, { type: 'image/webp' })
      const dataUrl = exportCanvas.toDataURL('image/webp', 0.9)
      onCropComplete(finalFile, dataUrl)
      onClose()
    }, 'image/webp', 0.9)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
      <motion.div
        variants={modalBackdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      <motion.div
        variants={modalContentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden border border-purple-500/30 bg-[#120d22] text-white shadow-2xl p-6 flex flex-col items-center"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-sm">
              ✂️
            </span>
            <div>
              <h3 className="text-base font-bold text-white">ครอบตัดรูปโปรไฟล์ (Crop Avatar)</h3>
              <p className="text-xs text-zinc-400">ลากเพื่อเลื่อนตำแหน่ง และปรับขนาดให้พอดีกับกรอบวงกลม</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Interactive Crop Stage */}
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full">
          {/* Canvas Viewport */}
          <div
            className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-black/60 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              className="block"
              style={{ width: '320px', height: '320px' }}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-purple-300">
                กำลังโหลดรูปภาพ...
              </div>
            )}
          </div>

          {/* Live Circle Preview Card */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 w-full sm:w-auto shrink-0">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              ตัวอย่างที่จะแสดง
            </span>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-400 shadow-xl bg-black/40 flex items-center justify-center">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-zinc-500">Preview</span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 text-center max-w-[120px] leading-tight">
              รูปทรงกลมมาตรฐานในแถบเมนูและโปรไฟล์
            </span>
          </div>
        </div>

        {/* Zoom & Controls Bar */}
        <div className="w-full mt-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5 font-semibold text-purple-200">
              <span>🔍</span>
              <span>ระดับการซูม (Zoom: {zoom.toFixed(2)}x)</span>
            </span>
            <button
              type="button"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
              className="text-[11px] text-purple-300 hover:text-purple-200 underline cursor-pointer"
            >
              รีเซ็ตตำแหน่ง
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center justify-center"
              title="ซูมออก"
            >
              -
            </button>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-purple-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(3, z + 0.15))}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center justify-center"
              title="ซูมเข้า"
            >
              +
            </button>
          </div>
        </div>

        {/* Bottom Modal Actions */}
        <div className="w-full mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center gap-2"
          >
            <span>✓</span>
            <span>ยืนยันการครอบตัด (Crop & Apply)</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
