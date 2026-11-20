import React, { useState, useRef, useEffect } from 'react'
import './PromptBar.css'

/**
 * React Bits PromptBar Component
 * Signature AI input interface with model selection, context chips, / commands, and auto-expanding input
 */
export default function PromptBar({
  placeholder = 'สั่งให้ AI ช่วยเกลาสำนวน, คิดพล็อตต่อ, หรือถามความต่อเนื่อง...',
  onSubmit,
  isProcessing = false,
  contextChips = ['@ตัวละคร', '@บทที่ 1', '@Story Bible'],
  onRemoveChip,
  onAddChip,
  models = [
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Core)' },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini Flash-Lite (Fast)' },
    { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen (Deep)' }
  ],
  selectedModel = 'gemini-3.8-flash',
  onSelectModel,
  className = '',
  style
}) {
  const [value, setValue] = useState('')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(120, textareaRef.current.scrollHeight)}px`
    }
  }, [value])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (!value.trim() || isProcessing) return
    if (onSubmit) {
      onSubmit(value.trim(), selectedModel)
    }
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const currentModelLabel = models.find(m => m.id === selectedModel)?.label || 'Gemini Flash'

  return (
    <div className={`prompt-bar-root ${className}`} style={style}>
      {/* Context Chips Row */}
      {contextChips && contextChips.length > 0 && (
        <div className="prompt-bar-context-row">
          <span className="text-[10px] uppercase font-bold text-violet-400/80 mr-1 flex items-center gap-1">
            <span>✦</span> CONTEXT:
          </span>
          {contextChips.map((chip, idx) => (
            <span key={idx} className="prompt-bar-context-chip">
              <span>{chip}</span>
              {onRemoveChip && (
                <button
                  type="button"
                  onClick={() => onRemoveChip(chip, idx)}
                  className="hover:text-red-300 ml-0.5 text-[9px] cursor-pointer"
                  title="ลบบริบทนี้"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
          {onAddChip && (
            <button
              type="button"
              onClick={onAddChip}
              className="text-[10px] text-violet-300 hover:text-white px-2 py-0.5 rounded-full border border-dashed border-violet-400/30 hover:border-violet-400 transition"
            >
              + บริบท
            </button>
          )}
        </div>
      )}

      {/* Main Textarea Input Wrap */}
      <div className="prompt-bar-input-wrap">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
          className="prompt-bar-textarea"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || isProcessing}
          className="prompt-bar-send-btn"
          title="ส่งคำสั่งให้ AI (Enter)"
        >
          {isProcessing ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          )}
        </button>
      </div>

      {/* Actions and Model Selection Bar */}
      <div className="prompt-bar-actions-row">
        {/* Model Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModelPicker(prev => !prev)}
            className="prompt-bar-model-badge"
            title="เปลี่ยนโมเดล AI"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{currentModelLabel}</span>
            <span className="text-[9px] opacity-70">▾</span>
          </button>

          {showModelPicker && (
            <div className="absolute left-0 bottom-full mb-1.5 w-60 rounded-xl bg-[#1a142e] border border-violet-500/30 shadow-2xl p-1 z-30 animate-fade-in text-xs">
              <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-violet-300/70 border-b border-white/5 mb-1">
                เลือกโมเดล Gemini API
              </div>
              {models.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectModel?.(m.id)
                    setShowModelPicker(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                    selectedModel === m.id
                      ? 'bg-violet-600/30 text-violet-200 font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>{m.label}</span>
                  {selectedModel === m.id && <span className="text-violet-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Command Hints */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="opacity-60 hidden sm:inline">คีย์ลัด:</span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">
            Enter ↵
          </span>
          <span className="opacity-60">ส่งคำสั่ง</span>
        </div>
      </div>
    </div>
  )
}
