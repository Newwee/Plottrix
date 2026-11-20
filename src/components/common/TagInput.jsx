import React, { useState } from 'react'

const SUGGESTED_TAGS = [
  'หักมุม',
  'สืบสวน',
  'ระทึกขวัญ',
  'ลึกลับ',
  'แก้แค้น',
  'ดราม่า',
  'แฟนตาซี',
  'ย้อนยุค',
  'ธุรกิจ',
  'เอาชีวิตรอด',
  'โรแมนติก',
  'คอมเมดี้'
]

export default function TagInput({ tags = [], onChange, maxTags = 8, placeholder = 'พิมพ์แท็กแล้วกด Enter เช่น หักมุม, แก้แค้น...' }) {
  const [inputValue, setInputValue] = useState('')

  const handleAddTag = (rawTag) => {
    let clean = rawTag.trim().replace(/^#+/, '')
    if (!clean) return
    if (tags.includes(clean)) {
      setInputValue('')
      return
    }
    if (tags.length >= maxTags) return

    onChange([...tags, clean])
    setInputValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  const handleRemoveTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-black/40 border border-purple-500/30 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/40 transition">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-semibold animate-fadeIn"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(idx)}
              className="text-purple-300 hover:text-white hover:bg-white/10 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] transition cursor-pointer"
            >
              ✕
            </button>
          </span>
        ))}

        {tags.length < maxTags && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputValue && handleAddTag(inputValue)}
            placeholder={tags.length === 0 ? placeholder : 'เพิ่มแท็ก...'}
            className="flex-1 min-w-[140px] bg-transparent text-white text-xs outline-none py-1 px-1 placeholder-slate-500"
          />
        )}
      </div>

      {/* Suggested Quick Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] text-plottrix-muted">แท็กแนะนำ:</span>
        {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 6).map((sug) => (
          <button
            key={sug}
            type="button"
            onClick={() => handleAddTag(sug)}
            className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-purple-600/20 text-slate-300 hover:text-purple-200 border border-white/10 hover:border-purple-400/40 transition cursor-pointer"
          >
            + #{sug}
          </button>
        ))}
      </div>
    </div>
  )
}
