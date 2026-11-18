import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { VOCABULARY_BANK } from '../../lib/vocabularyBank'
import WarmTooltip from '../react-bits/WarmTooltip'

export default function VocabularySidebar() {
  const {
    rightSidebarOpen, setRightSidebarOpen,
    genre,
    currentPageText, updateCurrentPageText,
    addToast
  } = useApp()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState('all')

  // Filter vocabulary entries
  const filteredEntries = useMemo(() => {
    let result = []

    VOCABULARY_BANK.forEach((category, cIdx) => {
      if (selectedCategoryIdx !== 'all' && selectedCategoryIdx !== cIdx) return

      category.entries.forEach(entry => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) {
          result.push({ ...entry, categoryName: category.name })
        } else {
          const matchOrig = entry.original.toLowerCase().includes(query)
          const matchSyn = entry.synonyms.toLowerCase().includes(query)
          if (matchOrig || matchSyn) {
            result.push({ ...entry, categoryName: category.name })
          }
        }
      })
    })

    return result.slice(0, 80) // Limit for smooth rendering
  }, [searchQuery, selectedCategoryIdx])

  if (!rightSidebarOpen) return null

  // Insert word at end of current page
  const handleInsertWord = (word) => {
    updateCurrentPageText(currentPageText + ' ' + word)
    addToast({
      title: `แทรกคำว่า "${word}" แล้ว`,
      description: 'เพิ่มคำศัพท์ลงในหน้ากระดาษปัจจุบันเรียบร้อย',
      duration: 2500,
      fuseColor: '#74d9b4'
    })
  }

  return (
    <aside className="w-72 sm:w-80 border-l border-plottrix-line/40 glass-panel flex flex-col h-full shrink-0 select-none transition-all duration-300">
      {/* Header */}
      <div className="p-3.5 border-b border-plottrix-line/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📚</span>
          <div>
            <h3 className="text-xs font-bold text-plottrix-text tracking-wide uppercase">
              คลังคำศัพท์นักเขียน
            </h3>
            <span className="text-[10px] text-plottrix-purple2">1,041 คำ • ปรับตามแนว {genre.split(' ')[0]}</span>
          </div>
        </div>

        <button
          onClick={() => setRightSidebarOpen(false)}
          className="text-plottrix-muted hover:text-white p-1 rounded-lg text-sm transition"
          title="ปิดแถบด้านข้าง"
        >
          ✕
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-plottrix-line/40">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาคำศัพท์ คำไวพจน์..."
            className="w-full bg-plottrix-panel2/80 border border-plottrix-line/50 focus:border-plottrix-purple2 rounded-xl px-3 py-2 text-xs text-plottrix-text placeholder:text-plottrix-muted outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-plottrix-muted hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 text-[11px] no-scrollbar">
          <button
            onClick={() => setSelectedCategoryIdx('all')}
            className={`px-2 py-1 rounded-lg whitespace-nowrap transition font-medium ${
              selectedCategoryIdx === 'all'
                ? 'bg-plottrix-purple text-white shadow-xs font-bold'
                : 'bg-white/5 text-plottrix-muted hover:text-white'
            }`}
          >
            ทั้งหมด
          </button>
          {VOCABULARY_BANK.slice(0, 8).map((cat, idx) => (
            <button
              key={cat.number}
              onClick={() => setSelectedCategoryIdx(idx)}
              className={`px-2 py-1 rounded-lg whitespace-nowrap transition font-medium ${
                selectedCategoryIdx === idx
                  ? 'bg-plottrix-purple text-white shadow-xs font-bold'
                  : 'bg-white/5 text-plottrix-muted hover:text-white'
              }`}
            >
              {cat.name.split('และ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Vocabulary Results List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-plottrix-muted">
            ไม่พบคำศัพท์ที่ตรงกับการค้นหา
          </div>
        ) : (
          filteredEntries.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-plottrix-panel2/60 border border-plottrix-line/30 hover:border-plottrix-purple2/30 transition group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-plottrix-text group-hover:text-plottrix-purple2 transition">
                  {item.original}
                </span>
                <span className="text-[10px] text-plottrix-muted/80 truncate max-w-[120px]">
                  {item.categoryName}
                </span>
              </div>

              {/* Individual Synonym Word Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.words?.slice(0, 8).map((w, wIdx) => (
                  <WarmTooltip key={wIdx} content={`คลิกเพื่อแทรกคำว่า "${w}"`} side="top">
                    <button
                      onClick={() => handleInsertWord(w)}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-plottrix-purple/30 text-plottrix-text hover:text-white border border-white/5 hover:border-plottrix-purple2/40 text-[11px] transition"
                    >
                      {w}
                    </button>
                  </WarmTooltip>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
