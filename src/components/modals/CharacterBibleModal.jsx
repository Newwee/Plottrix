import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { compressImageToWebP, uploadImageToSupabase } from '../../lib/imageCompressor'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

const CHARACTER_ROLES = [
  'ตัวเอก (Protagonist)',
  'ตัวเอกฝ่ายตรงข้าม / พระเอก (Deuteragonist)',
  'ตัวร้ายหลัก (Antagonist)',
  'ตัวละครสมทบสำคัญ (Supporting)',
  'อาจารย์ / ผู้นำทาง (Mentor)',
  'ตัวแปรปริศนา (Mystery)'
]

export default function CharacterBibleModal() {
  const {
    activeModal, setActiveModal,
    characters, setCharacters,
    addToast
  } = useApp()

  const [selectedCharId, setSelectedCharId] = useState(characters[0]?.id || null)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: CHARACTER_ROLES[0],
    avatar: '',
    description: '',
    traits: '',
    secrets: '',
    relations: ''
  })

  const fileInputRef = useRef(null)

  const isOpen = activeModal === 'characterBible'
  const currentChar = characters.find(c => c.id === selectedCharId) || characters[0]

  const handleAddNew = () => {
    const newChar = {
      id: `char-${Date.now()}`,
      name: 'ตัวละครใหม่',
      role: 'ตัวละครสมทบสำคัญ (Supporting)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      description: 'กรอกรายละเอียดความเป็นมา...',
      traits: 'บุคลิกภาพ...',
      secrets: 'ความลับหรือปมในอดีต...',
      relations: 'ความสัมพันธ์กับตัวละครอื่น...'
    }
    setCharacters(prev => [...prev, newChar])
    setSelectedCharId(newChar.id)
    setFormData(newChar)
    setIsEditing(true)
  }

  const handleStartEdit = (char) => {
    setSelectedCharId(char.id)
    setFormData({
      name: char.name,
      role: char.role || CHARACTER_ROLES[0],
      avatar: char.avatar || '',
      description: char.description || '',
      traits: char.traits || '',
      secrets: char.secrets || '',
      relations: char.relations || ''
    })
    setIsEditing(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 5MB limit check
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: 'ไฟล์รูปภาพมีขนาดใหญ่เกินไป',
        description: 'กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB',
        fuseColor: '#ef4444'
      })
      return
    }

    setIsUploading(true)
    try {
      // Compress to 800x800 WebP (Quality 0.8)
      const compressedBlob = await compressImageToWebP(file, 800, 800, 0.8)
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target.result
        setFormData(prev => ({ ...prev, avatar: dataUrl }))
        setIsUploading(false)
        addToast({
          title: 'อัปโหลดรูปภาพตัวละครสำเร็จ',
          description: 'บีบอัดเป็น WebP (800x800) ความละเอียดสูงเรียบร้อย',
          fuseColor: '#74d9b4'
        })
      }
      reader.readAsDataURL(compressedBlob)
    } catch (err) {
      setIsUploading(false)
      addToast({
        title: 'ไม่สามารถประมวลผลรูปภาพได้',
        description: err.message,
        fuseColor: '#ef4444'
      })
    }
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      addToast({ title: 'กรุณาระบุชื่อตัวละคร', fuseColor: '#ef4444' })
      return
    }

    setCharacters(prev => prev.map(c => {
      if (c.id === selectedCharId) {
        return { ...c, ...formData }
      }
      return c
    }))
    setIsEditing(false)
    addToast({
      title: 'บันทึกข้อมูลตัวละครสำเร็จ!',
      description: 'AI จะจดจำข้อมูลนี้เพื่อคุมความสมเหตุสมผลในเนื้อเรื่อง',
      fuseColor: '#74d9b4'
    })
  }

  const handleDelete = (id) => {
    if (characters.length <= 1) {
      addToast({ title: 'ต้องมีตัวละครอย่างน้อย 1 ตัวในคัมภีร์', fuseColor: '#ef4444' })
      return
    }
    setCharacters(prev => prev.filter(c => c.id !== id))
    setSelectedCharId(characters[0].id)
    setIsEditing(false)
    addToast({ title: 'ลบตัวละครเรียบร้อย', duration: 2500 })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#130e24] my-auto"
          >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-plottrix-panel2/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h3 className="font-bold text-base text-white">
                Character & Lore Bible (คัมภีร์ตัวละครและโลกนิยาย)
              </h3>
              <p className="text-xs text-plottrix-muted">
                ศูนย์กลางบันทึกตัวละครและความสัมพันธ์ AI จะใช้อ้างอิงบริบทเพื่อไม่ให้เกิดช่องโหว่พล็อต
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Content: Left list & Right detail */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Character List Sidebar */}
          <div className="w-full md:w-64 border-r border-white/10 bg-black/20 p-4 overflow-y-auto space-y-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                รายชื่อ ({characters.length})
              </span>
              <button
                type="button"
                onClick={handleAddNew}
                className="text-xs px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-sm"
              >
                + เพิ่มตัวละคร
              </button>
            </div>

            <div className="space-y-1.5">
              {characters.map(char => (
                <div
                  key={char.id}
                  onClick={() => {
                    setSelectedCharId(char.id)
                    setIsEditing(false)
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    selectedCharId === char.id
                      ? 'border-purple-400 bg-purple-600/20 text-white'
                      : 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <img
                    src={char.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={char.name}
                    className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs truncate">{char.name}</h5>
                    <span className="text-[10px] text-plottrix-muted truncate block">{char.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Character Details / Edit Form */}
          <div className="flex-1 p-6 overflow-y-auto bg-black/10">
            {isEditing ? (
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img
                      src={formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-400 shadow-md group-hover:opacity-75 transition"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition">
                      {isUploading ? 'กำลังบีบอัด...' : 'เปลี่ยนรูป'}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-purple-200 border border-white/15 font-semibold transition"
                    >
                      📷 อัปโหลดรูปภาพตัวละคร (ไม่เกิน 5MB)
                    </button>
                    <p className="text-[10px] text-plottrix-muted mt-1">
                      ระบบจะย่อขนาดให้อัตโนมัติ (800x800px WebP) เพื่อความรวดเร็ว
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">ชื่อตัวละคร</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-xs outline-none"
                    />
                  </div>

                  {/* Custom Glass Dropdown for Role */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">บทบาทในเรื่อง</label>
                    <div className="relative">
                      <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1f1638] border border-white/15 text-white text-xs outline-none appearance-none cursor-pointer focus:border-purple-400"
                      >
                        {CHARACTER_ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ภูมิหลัง / รายละเอียด (Description)</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-xs outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">บุคลิกภาพ &amp; จุดเด่น (Traits)</label>
                  <input
                    type="text"
                    value={formData.traits}
                    onChange={e => setFormData({ ...formData, traits: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ความลับ / ปมในใจ (Secrets &amp; Vulnerabilities)</label>
                  <input
                    type="text"
                    value={formData.secrets}
                    onChange={e => setFormData({ ...formData, secrets: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ความสัมพันธ์ (Relations)</label>
                  <input
                    type="text"
                    value={formData.relations}
                    onChange={e => setFormData({ ...formData, relations: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-xs outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
                  >
                    ✓ บันทึกข้อมูล
                  </button>
                </div>
              </div>
            ) : currentChar ? (
              <div className="space-y-6 max-w-xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <img
                      src={currentChar.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={currentChar.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-400 shadow-lg"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-white">{currentChar.name}</h4>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-medium">
                        {currentChar.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(currentChar)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      ✏️ แก้ไขข้อมูล
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(currentChar.id)}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 flex items-center justify-center text-xs transition"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-slate-200">
                  <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                    <span className="font-bold text-purple-300 block mb-1">ภูมิหลัง &amp; ประวัติ:</span>
                    <p className="text-slate-300 leading-relaxed">{currentChar.description}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                    <span className="font-bold text-purple-300 block mb-1">บุคลิกภาพ &amp; ลักษณะนิสัย:</span>
                    <p className="text-slate-300 leading-relaxed">{currentChar.traits}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                    <span className="font-bold text-purple-300 block mb-1">ความลับ &amp; ปมขัดแย้งในใจ:</span>
                    <p className="text-slate-300 leading-relaxed">{currentChar.secrets}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                    <span className="font-bold text-purple-300 block mb-1">ความสัมพันธ์ในเรื่อง:</span>
                    <p className="text-slate-300 leading-relaxed">{currentChar.relations}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
  )
}
