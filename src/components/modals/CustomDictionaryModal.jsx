import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function CustomDictionaryModal() {
  const {
    activeModal, setActiveModal,
    customDictionary, setCustomDictionary,
    addToast
  } = useApp()

  const [newWord, setNewWord] = useState('')

  if (activeModal !== 'customDictionary') return null

  const handleAdd = (e) => {
    e.preventDefault()
    const word = newWord.trim()
    if (!word) return
    if (customDictionary.includes(word)) {
      addToast({ title: 'คำนี้มีอยู่ในพจนานุกรมแล้ว', fuseColor: '#e9c78c' })
      return
    }

    setCustomDictionary(prev => [...prev, word])
    setNewWord('')
    addToast({ title: `เพิ่ม "${word}" ลงในพจนานุกรมแล้ว`, fuseColor: '#74d9b4' })
  }

  const handleDelete = (word) => {
    setCustomDictionary(prev => prev.filter(w => w !== word))
    addToast({ title: `ลบ "${word}" เรียบร้อย`, fuseColor: '#ef4444' })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="glass-panel w-full max-w-xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-plottrix-line/40 flex items-center justify-between bg-plottrix-panel2/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📚</span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Custom Dictionary (พจนานุกรมคำเฉพาะ)
              </h3>
              <p className="text-[11px] text-plottrix-muted">
                ชื่อตัวละคร คาถา สถานที่ ที่ AI จะไม่แก้หรือมองเป็นคำผิด
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

        {/* Input */}
        <div className="p-5 border-b border-plottrix-line/40 bg-plottrix-bg2/40">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              placeholder="พิมพ์คำเฉพาะ, ชื่อเฉพาะ, หรือศัพท์เฉพาะกลุ่ม..."
              className="flex-1 bg-plottrix-panel2 border border-plottrix-line focus:border-plottrix-purple2 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-plottrix-muted outline-none transition"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl btn-primary-purple text-xs font-bold transition shadow-sm"
            >
              + เพิ่มคำ
            </button>
          </form>
        </div>

        {/* Word Chips */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-2">
            {customDictionary.map((word, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-plottrix-panel2/70 border border-plottrix-line/50 text-xs text-plottrix-text group hover:border-plottrix-purple2/40 transition"
              >
                <span>{word}</span>
                <button
                  onClick={() => handleDelete(word)}
                  className="text-plottrix-muted hover:text-red-400 p-0.5 rounded transition text-xs"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
