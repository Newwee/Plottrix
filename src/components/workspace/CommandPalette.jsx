import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'

/**
 * CommandPalette (Ctrl/Cmd + K)
 * Instant search & navigation palette for fast workspace operations without taking hands off keyboard
 */
export default function CommandPalette({ isOpen, onClose }) {
  const {
    chapters,
    activeChapterId,
    setActiveChapterId,
    setActivePageIdx,
    isFocusMode,
    setIsFocusMode,
    setPaperTheme,
    setActiveModal,
    setRightSidebarOpen,
    rightSidebarOpen,
    setEditorialCheckOpen,
    triggerAiTask,
    navigateTo,
    addToast
  } = useApp()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [isOpen])

  // Build command list based on state
  const commands = [
    // Dynamic Chapter jumps
    ...chapters.map((ch, idx) => ({
      id: `ch-${ch.id}`,
      icon: '📖',
      title: `${ch.code || `บทที่ ${idx + 1}`}: ${ch.title || 'ไม่มีชื่อตอน'}`,
      category: 'สารบัญตอน',
      action: () => {
        setActiveChapterId(ch.id)
        setActivePageIdx(0)
        onClose()
      }
    })),

    // Fast Page Jump
    {
      id: 'quick-jump',
      icon: '📑',
      title: 'กระโดดไปหน้ากระดาษ (พิมพ์ตัวเลข เช่น 1, 14, 65)',
      category: 'การนำทางหน้า',
      action: () => {
        const num = parseInt(query.replace(/\D/g, ''), 10)
        if (num && num > 0) {
          setActivePageIdx(num - 1)
          addToast({ title: `ไปยังหน้าที่ ${num} แล้ว` })
        }
        onClose()
      }
    },

    // AI Tools
    {
      id: 'cmd-editorial',
      icon: '✦',
      title: 'ตรวจความสมเหตุสมผลและความต่อเนื่อง (Editorial Check)',
      category: 'ผู้ช่วย AI',
      action: () => {
        setEditorialCheckOpen(true)
        onClose()
      }
    },
    {
      id: 'cmd-plot',
      icon: '🌿',
      title: 'สร้างทางเลือกพล็อตตอนต่อไป (Plot Branching)',
      category: 'ผู้ช่วย AI',
      action: () => {
        triggerAiTask('plotBranch')
        onClose()
      }
    },
    {
      id: 'cmd-translate',
      icon: '🌐',
      title: 'แปลภาษาคงบริบทนิยาย (Context Translation)',
      category: 'ผู้ช่วย AI',
      action: () => {
        triggerAiTask('translate')
        onClose()
      }
    },
    {
      id: 'cmd-proofread',
      icon: '🔍',
      title: 'ตรวจจับคำผิดและคำพ้องเสียง (Proofread)',
      category: 'ผู้ช่วย AI',
      action: () => {
        triggerAiTask('proofread')
        onClose()
      }
    },

    // Workspaces & Modals
    {
      id: 'cmd-bible',
      icon: '♟',
      title: 'เปิด Story Bible (ตัวละคร & พล็อตย่อ)',
      category: 'ความรู้และข้อมูล',
      action: () => {
        setActiveModal('characterBible')
        onClose()
      }
    },
    {
      id: 'cmd-vocab',
      icon: '📚',
      title: 'เปิดคลังคำศัพท์นิยาย (Vocabulary Bank)',
      category: 'ความรู้และข้อมูล',
      action: () => {
        setRightSidebarOpen(true)
        onClose()
      }
    },
    {
      id: 'cmd-export',
      icon: '🚀',
      title: 'ส่งออก ReadAWrite / Dek-D Writer',
      category: 'จัดการเอกสาร',
      action: () => {
        setActiveModal('export')
        onClose()
      }
    },
    {
      id: 'cmd-history',
      icon: '🕒',
      title: 'เปิดประวัติการแก้ไขฉบับย้อนหลัง (Version History)',
      category: 'จัดการเอกสาร',
      action: () => {
        setActiveModal('history')
        onClose()
      }
    },
    {
      id: 'cmd-bookshelf',
      icon: '🗂',
      title: 'กลับสู่ชั้นวางนิยาย (Workspace Home)',
      category: 'การนำทาง',
      action: () => {
        navigateTo('workspace_home')
        onClose()
      }
    },

    // Modes & Themes
    {
      id: 'cmd-focus',
      icon: '🎯',
      title: isFocusMode ? 'ปิดโหมดสมาธิ (Exit Focus Mode)' : 'เปิดโหมดสมาธิเขียนต่อเนื่อง (Focus Mode)',
      category: 'มุมมองและการแสดงผล',
      action: () => {
        setIsFocusMode(!isFocusMode)
        onClose()
      }
    },
    {
      id: 'theme-obsidian',
      icon: '🟣',
      title: 'สลับธีม: Dark Obsidian (ม่วงเข้ม)',
      category: 'ธีมสีห้องเขียน',
      action: () => {
        setPaperTheme('obsidian')
        onClose()
      }
    },
    {
      id: 'theme-midnight',
      icon: '🔵',
      title: 'สลับธีม: Midnight Blue (น้ำเงินค่ำ)',
      category: 'ธีมสีห้องเขียน',
      action: () => {
        setPaperTheme('midnight')
        onClose()
      }
    },
    {
      id: 'theme-paper',
      icon: '📜',
      title: 'สลับธีม: Warm Paper (กระดาษถนอมสายตา)',
      category: 'ธีมสีห้องเขียน',
      action: () => {
        setPaperTheme('paper')
        onClose()
      }
    }
  ]

  // Filter commands by query
  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  )

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#16112a] border border-violet-500/40 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#120d22]/80">
          <span className="text-violet-400 text-lg">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหาตอน, หน้ากระดาษ, คำสั่ง AI, หรือสลับธีม..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              ไม่พบคำสั่งหรือตอนที่ตรงกับ "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-violet-600/30 text-white font-medium border border-violet-500/40'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    {item.category}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/10 bg-[#120d22]/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ เพื่อเลือก</span>
            <span>↵ เพื่อยืนยัน</span>
          </div>
          <span className="text-violet-300/80 font-mono">Plottrix Command Palette</span>
        </div>
      </div>
    </div>
  )
}
