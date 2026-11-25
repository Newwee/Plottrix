import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { readFileToText, parseThaiManuscript } from '../../lib/manuscriptParser'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'
import confetti from 'canvas-confetti'

export default function SmartImportModal() {
  const {
    activeModal,
    setActiveModal,
    novels,
    setNovels,
    activeNovelId,
    activeNovel,
    setActiveNovelId,
    setNovelTitle,
    setGenre,
    setPov,
    setChapters,
    setActiveChapterId,
    setActivePageIdx,
    characters: existingCharacters,
    setCharacters,
    navigateTo,
    addToast
  } = useApp()

  const { user } = useAuth()
  const isOpen = activeModal === 'import'

  // Wizard Stage: 1 = File Upload, 2 = Config & Preview, 3 = Confirming
  const [stage, setStage] = useState(1)

  // Mode: 'new_novel' | 'append'
  const [importMode, setImportMode] = useState(() => (activeNovelId ? 'append' : 'new_novel'))
  const [targetNovelId, setTargetNovelId] = useState(activeNovelId || novels[0]?.id || '')

  // File States
  const [primaryFile, setPrimaryFile] = useState(null)
  const [supplementaryFile, setSupplementaryFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')

  // Parsed Config Data
  const [metadata, setMetadata] = useState({
    title: '',
    arc: '',
    author: '',
    genre: 'ระทึกขวัญ / สืบสวน',
    version: '',
    includeHeaderMeta: false
  })

  const [chapters, setParsedChapters] = useState([])
  const [characters, setParsedCharacters] = useState([])
  const [syncCharacters, setSyncCharacters] = useState(true)

  // Range Selector States
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(1)

  // Active Preview Chapter
  const [previewChapterId, setPreviewChapterId] = useState(null)

  // Executing State
  const [isExecuting, setIsExecuting] = useState(false)

  // Drag over states for file zone
  const [isDragOver, setIsDragOver] = useState(false)

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStage(1)
      setPrimaryFile(null)
      setSupplementaryFile(null)
      setParsing(false)
      setParseError('')
      setImportMode(activeNovelId ? 'append' : 'new_novel')
      setTargetNovelId(activeNovelId || novels[0]?.id || '')
      setIsExecuting(false)
    }
  }, [isOpen, activeNovelId, novels])

  if (!isOpen || !user) return null

  // Target Novel object
  const selectedTargetNovel = novels.find(n => n.id === targetNovelId) || activeNovel || novels[0] || null

  // Handle File Selection and Parsing
  const processFiles = async (fileObj, suppFileObj = null) => {
    if (!fileObj) return
    setParsing(true)
    setParseError('')

    try {
      const primaryText = await readFileToText(fileObj)
      let suppText = null
      if (suppFileObj) {
        suppText = await readFileToText(suppFileObj)
      }

      const parsed = parseThaiManuscript(primaryText, suppText)

      setMetadata({
        title: parsed.metadata.title || fileObj.name.replace(/\.[^/.]+$/, ''),
        arc: parsed.metadata.arc || '',
        author: parsed.metadata.author || '',
        genre: parsed.metadata.genre || 'ระทึกขวัญ / สืบสวน',
        version: parsed.metadata.version || '',
        includeHeaderMeta: false
      })

      setParsedChapters(parsed.chapters)
      setRangeStart(1)
      setRangeEnd(parsed.chapters.length)
      if (parsed.chapters[0]) {
        setPreviewChapterId(parsed.chapters[0].id)
      }

      // Check for duplicates against existing Character Bible
      const existingNames = new Set(existingCharacters.map(c => c.name.trim()))
      const processedChars = parsed.characters.map(c => {
        const isDuplicate = existingNames.has(c.name.trim()) || existingNames.has(c.shortName?.trim())
        return {
          ...c,
          isDuplicate,
          action: isDuplicate ? 'merge' : 'create' // 'merge' | 'create' | 'skip'
        }
      })
      setParsedCharacters(processedChars)

      setStage(2)
    } catch (err) {
      console.error('Import parse error:', err)
      setParseError(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบรูปแบบไฟล์')
    } finally {
      setParsing(false)
    }
  }

  // File Input Handler
  const handlePrimaryFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPrimaryFile(file)
      processFiles(file, supplementaryFile)
    }
  }

  // Range Selector: Apply Range Selection
  const applyRangeSelection = (start, end) => {
    const s = Math.max(1, Math.min(start, chapters.length))
    const e = Math.max(s, Math.min(end, chapters.length))
    setRangeStart(s)
    setRangeEnd(e)

    setParsedChapters(prev => prev.map((ch, idx) => {
      const chapterNum = idx + 1
      return {
        ...ch,
        selected: chapterNum >= s && chapterNum <= e
      }
    }))
  }

  // Select / Deselect All
  const toggleSelectAllChapters = (selected) => {
    setParsedChapters(prev => prev.map(ch => ({ ...ch, selected })))
  }

  // Toggle Single Chapter Selection
  const toggleChapterSelection = (id) => {
    setParsedChapters(prev => prev.map(ch => ch.id === id ? { ...ch, selected: !ch.selected } : ch))
  }

  // Move Chapter Up / Down (Reordering)
  const moveChapter = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= chapters.length) return

    setParsedChapters(prev => {
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[targetIndex]
      copy[targetIndex] = temp
      return copy
    })
  }

  // Inline Title Change
  const updateChapterTitle = (id, newTitle) => {
    setParsedChapters(prev => prev.map(ch => ch.id === id ? { ...ch, title: newTitle } : ch))
  }

  // Auto-Renumbering & Syncing
  const autoRenumberChapters = (format = 'colon') => {
    // If appending to current novel, base starting number after existing chapters
    const baseNumber = (importMode === 'append' && selectedTargetNovel)
      ? (selectedTargetNovel.chapterCount || selectedTargetNovel.chapters?.length || 0)
      : 0

    let activeCount = 0
    setParsedChapters(prev => prev.map(ch => {
      if (!ch.selected) return ch
      activeCount++
      const newNum = baseNumber + activeCount
      const cleanTitle = ch.title.replace(/^(ตอนที่|บทที่|Chapter)\s*\d+[\s:：.-]*/i, '').trim() || ch.title

      let formattedHeading = ''
      if (format === 'dash') {
        formattedHeading = `บทที่ ${newNum} — ${cleanTitle}`
      } else {
        formattedHeading = `ตอนที่ ${newNum}: ${cleanTitle}`
      }

      return {
        ...ch,
        number: newNum,
        title: cleanTitle,
        heading: formattedHeading
      }
    }))

    addToast({
      title: 'จัดเรียงเลขตอนใหม่อัตโนมัติแล้ว! ✨',
      description: `รันเลขตอนตั้งแต่ ${baseNumber + 1} ถึง ${baseNumber + activeCount} อย่างเป็นระเบียบ`,
      fuseColor: '#74d9b4'
    })
  }

  // Execute Import
  const handleExecuteImport = async () => {
    setIsExecuting(true)
    const selectedChapters = chapters.filter(c => c.selected)

    if (selectedChapters.length === 0) {
      addToast({
        title: 'กรุณาเลือกตอนอย่างน้อย 1 ตอน',
        description: 'ติ๊กเลือกตอนที่ต้องการนำเข้าจากรายการ',
        fuseColor: '#ef4444'
      })
      setIsExecuting(false)
      return
    }

    try {
      let finalNovelId = targetNovelId
      let finalNovelTitle = metadata.title || 'นิยายเรื่องใหม่'
      const finalGenre = metadata.genre || 'ระทึกขวัญ / สืบสวน'
      const finalAuthor = metadata.author || ''

      // ========================================================
      // 1. Create New Novel or Use Existing
      // ========================================================
      if (importMode === 'new_novel' || !finalNovelId) {
        finalNovelId = `novel-${Date.now()}`

        if (user?.id) {
          let { data: novRow, error: novErr } = await supabase
            .from('novels')
            .insert({
              user_id: user.id,
              title: finalNovelTitle,
              genre: finalGenre,
              pov: 'บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)',
              synopsis: metadata.arc ? `${metadata.arc}\n${metadata.version}` : '',
              author_display_name: finalAuthor,
              cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80'
            })
            .select()
            .single()

          if (novErr && novErr.message?.includes('author_display_name')) {
            const retry = await supabase
              .from('novels')
              .insert({
                user_id: user.id,
                title: finalNovelTitle,
                genre: finalGenre,
                pov: 'บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)',
                synopsis: metadata.arc ? `${metadata.arc}\n${metadata.version}` : '',
                cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80'
              })
              .select()
              .single()
            novRow = retry.data
            novErr = retry.error
          }

          if (!novErr && novRow) {
            finalNovelId = novRow.id
          }
        }
      }

      // ========================================================
      // 2. Insert Chapters
      // ========================================================
      const chaptersToSave = []

      for (let i = 0; i < selectedChapters.length; i++) {
        const ch = selectedChapters[i]
        let chapterNumber = ch.number || (i + 1)
        const chapterTitle = ch.heading || `ตอนที่ ${chapterNumber}: ${ch.title}`
        const pagesArray = [ch.content]

        let chId = `ch-${Date.now()}-${i}`

        if (user?.id) {
          const { data: dbCh, error: dbChErr } = await supabase
            .from('chapters')
            .insert({
              novel_id: finalNovelId,
              user_id: user.id,
              chapter_number: chapterNumber,
              title: chapterTitle,
              pages: pagesArray,
              word_count: ch.wordCount || 0
            })
            .select()
            .single()

          if (!dbChErr && dbCh) {
            chId = dbCh.id
          }
        }

        chaptersToSave.push({
          id: chId,
          novel_id: finalNovelId,
          number: chapterNumber,
          title: chapterTitle,
          pages: pagesArray,
          wordCount: ch.wordCount || 0
        })
      }

      // ========================================================
      // 3. Save Characters to Story Bible
      // ========================================================
      let savedCharCount = 0
      const selectedChars = characters.filter(c => c.selected && c.action !== 'skip')

      if (syncCharacters && selectedChars.length > 0) {
        for (const charItem of selectedChars) {
          if (!charItem.name.trim()) continue

          const charPayload = {
            name: charItem.name.trim(),
            role: charItem.role || 'ตัวละครหลัก',
            description: charItem.description || '',
            traits: charItem.traits || '',
            secrets: charItem.secrets || '',
            speech_pattern: charItem.shortName ? `ชื่อเล่น/คำเรียก: ${charItem.shortName}` : '',
            avatar_url: ''
          }

          if (user?.id) {
            await supabase.from('characters').insert({
              novel_id: finalNovelId,
              user_id: user.id,
              ...charPayload
            })
          }

          savedCharCount++
        }

        // Update local characters list
        setCharacters(prev => [
          ...prev,
          ...selectedChars.map(c => ({
            id: `char-${Date.now()}-${Math.random()}`,
            novel_id: finalNovelId,
            name: c.name,
            role: c.role,
            description: c.description,
            traits: c.traits,
            secrets: c.secrets
          }))
        ])
      }

      // ========================================================
      // 4. Update App State & Open Studio
      // ========================================================
      if (importMode === 'new_novel') {
        const newNovelObj = {
          id: finalNovelId,
          title: finalNovelTitle,
          genre: finalGenre,
          pov: 'บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)',
          synopsis: metadata.arc ? `${metadata.arc}\n${metadata.version}` : '',
          author_display_name: finalAuthor,
          cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
          wordCount: selectedChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0),
          chapterCount: selectedChapters.length,
          updatedAt: 'เมื่อสักครู่',
          chapters: chaptersToSave,
          characters: selectedChars
        }

        setNovels(prev => [newNovelObj, ...prev])
        setActiveNovelId(finalNovelId)
        setNovelTitle(finalNovelTitle)
        setGenre(finalGenre)
        setChapters(chaptersToSave)
        setActiveChapterId(chaptersToSave[0]?.id || '')
        setActivePageIdx(0)
      } else {
        // Appending to existing novel
        setChapters(prev => [...prev, ...chaptersToSave])
        setActiveChapterId(chaptersToSave[0]?.id || '')
        setActivePageIdx(0)

        setNovels(prev => prev.map(n => {
          if (n.id === finalNovelId) {
            return {
              ...n,
              chapterCount: (n.chapterCount || 0) + chaptersToSave.length,
              wordCount: (n.wordCount || 0) + selectedChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0),
              updatedAt: 'เมื่อสักครู่'
            }
          }
          return n
        }))
      }

      // Celebration confetti
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#74d9b4', '#a855f7', '#6366f1', '#f59e0b']
      })

      addToast({
        title: 'นำเข้าไฟล์นิยายสำเร็จ! 🎉',
        description: `นำเข้าแล้ว ${selectedChapters.length} ตอน และบันทึก ${savedCharCount} ตัวละครลงใน Story Bible เรียบร้อย`,
        fuseColor: '#74d9b4',
        duration: 5000
      })

      setActiveModal(null)
      navigateTo('studio')
    } catch (err) {
      console.error('Execute import exception:', err)
      addToast({
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: err.message || 'กรุณาลองใหม่อีกครั้ง',
        fuseColor: '#ef4444'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // Active preview chapter object
  const activePreviewChapter = chapters.find(c => c.id === previewChapterId) || chapters[0] || null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          variants={modalContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-5xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] bg-[#120d22]/95 text-white my-auto backdrop-blur-2xl"
        >
          {/* Header & Step Wizard Indicator */}
          <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/25 to-indigo-500/25 border border-purple-400/40 flex items-center justify-center text-xl shadow-inner">
                📥
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                  <span>นำเข้าไฟล์ต้นฉบับอัจฉริยะ (Smart Manuscript Import)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    Step {stage} / 2
                  </span>
                </h3>
                <p className="text-xs text-plottrix-muted">
                  รองรับ .md, .txt, .docx พร้อมวิเคราะห์แยกตอนและซิงค์ตัวละครลง Story Bible อัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stage === 2 && (
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  ← เลือกไฟล์ใหม่
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-xl hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-base transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ======================================================== */}
            {/* STAGE 1: FILE SELECTION & IMPORT MODE                    */}
            {/* ======================================================== */}
            {stage === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto py-4">
                {/* 1. Mode Selection Card */}
                <div>
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                    เลือกรูปแบบการนำเข้า
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setImportMode('new_novel')}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                        importMode === 'new_novel'
                          ? 'bg-purple-600/25 border-purple-400/60 shadow-lg shadow-purple-600/20'
                          : 'bg-white/5 border-white/10 hover:border-purple-400/30'
                      }`}
                    >
                      <span className="text-2xl p-2 rounded-xl bg-purple-500/20">✨</span>
                      <div>
                        <div className="font-bold text-sm text-white">สร้างเป็นนิยายเรื่องใหม่</div>
                        <div className="text-[11px] text-plottrix-muted mt-1 leading-relaxed">
                          เปิดโปรเจกต์ใหม่ พร้อมนำเข้าทุกตอนและตั้งค่าคัมภีร์ตัวละครแยกต่างหาก
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                        importMode === 'append'
                          ? 'bg-purple-600/25 border-purple-400/60 shadow-lg shadow-purple-600/20'
                          : 'bg-white/5 border-white/10 hover:border-purple-400/30'
                      }`}
                    >
                      <span className="text-2xl p-2 rounded-xl bg-purple-500/20">➕</span>
                      <div>
                        <div className="font-bold text-sm text-white">เพิ่มตอนเข้าเรื่องปัจจุบัน</div>
                        <div className="text-[11px] text-plottrix-muted mt-1 leading-relaxed">
                          นำตอนที่เลือกไปต่อท้ายนิยายที่มีอยู่แล้ว และรันเลขตอนต่อให้อัตโนมัติ
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* If Append Mode, pick target novel */}
                {importMode === 'append' && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/30">
                    <label className="block text-xs font-semibold text-purple-300 mb-1">
                      เลือกนิยายเป้าหมายที่ต้องการเพิ่มตอน
                    </label>
                    <select
                      value={targetNovelId}
                      onChange={(e) => setTargetNovelId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-400/30 text-white text-xs outline-none focus:border-purple-400"
                    >
                      {novels.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.title} ({n.chapterCount || n.chapters?.length || 0} ตอน)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 2. Drag & Drop Primary File Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                    ไฟล์ต้นฉบับหลัก (.md, .txt, .docx)
                  </label>
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragOver(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file) {
                        setPrimaryFile(file)
                        processFiles(file, supplementaryFile)
                      }
                    }}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                      isDragOver
                        ? 'border-purple-400 bg-purple-600/20 scale-[1.01]'
                        : 'border-purple-500/40 bg-purple-950/15 hover:bg-purple-950/25 hover:border-purple-400/60'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".md,.txt,.docx"
                      onChange={handlePrimaryFileChange}
                      className="hidden"
                    />

                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-3xl mb-4 shadow-inner">
                      📄
                    </div>

                    <h4 className="font-extrabold text-base text-white mb-1">
                      {primaryFile ? primaryFile.name : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
                    </h4>

                    <p className="text-xs text-plottrix-muted max-w-sm leading-relaxed mb-4">
                      รองรับไฟล์ Markdown (.md), เอกสาร Word (.docx) และข้อความ (.txt) ระบบจะตัดแยกตอนให้อัตโนมัติ
                    </p>

                    <span className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-200 text-xs font-bold shadow-sm">
                      เลือกไฟล์จากเครื่อง
                    </span>
                  </label>
                </div>

                {/* 3. Optional Supplementary Lore / Character file */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <span>📁</span>
                      <span>ไฟล์เสริมสำหรับ Character &amp; Lore (ไม่บังคับ)</span>
                    </label>
                    <span className="text-[10px] text-plottrix-muted">เช่น Character_State.md</span>
                  </div>

                  <input
                    type="file"
                    accept=".md,.txt"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setSupplementaryFile(f)
                        if (primaryFile) processFiles(primaryFile, f)
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                  />
                </div>

                {/* Parsing Spinner */}
                {parsing && (
                  <div className="p-4 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center gap-3 animate-pulse">
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-purple-200 font-bold">กำลังวิเคราะห์โครงสร้างต้นฉบับภาษาไทย...</span>
                  </div>
                )}

                {/* Error Banner */}
                {parseError && (
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                    ⚠️ {parseError}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* STAGE 2: IMPORT SUMMARY & CONFIGURATION WIZARD           */}
            {/* ======================================================== */}
            {stage === 2 && (
              <div className="space-y-8">
                {/* 1. Book & Arc Metadata Section */}
                <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                    <h4 className="font-extrabold text-sm text-purple-200 flex items-center gap-2">
                      <span>📖</span>
                      <span>ข้อมูลนิยายและภาค (Book &amp; Arc Metadata)</span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      ตรวจพบอัตโนมัติ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-300 mb-1">ชื่อเรื่อง</label>
                      <input
                        type="text"
                        value={metadata.title}
                        onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-400/30 text-white text-xs outline-none focus:border-purple-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-purple-300 mb-1">ชื่อภาค / Arc</label>
                      <input
                        type="text"
                        value={metadata.arc}
                        onChange={(e) => setMetadata({ ...metadata, arc: e.target.value })}
                        placeholder="เช่น ARC 1: เงินที่หายไป"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-400/30 text-white text-xs outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-purple-300 mb-1">ผู้เขียน (Author)</label>
                      <input
                        type="text"
                        value={metadata.author}
                        onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                        placeholder="นามปากกา..."
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-400/30 text-white text-xs outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-purple-300 mb-1">แนวเรื่อง (Genre)</label>
                      <input
                        type="text"
                        value={metadata.genre}
                        onChange={(e) => setMetadata({ ...metadata, genre: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-400/30 text-white text-xs outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Chapter Selection, Reordering & Renumbering */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                        <span>📑</span>
                        <span>รายการตอนที่ตรวจพบ ({chapters.filter(c => c.selected).length} / {chapters.length} ตอน)</span>
                      </h4>
                      <p className="text-xs text-plottrix-muted">
                        เลือกช่วงตอน ปรับชื่อ สลับตำแหน่งขึ้น-ลง หรือคลิกเพื่อดูตัวอย่างเนื้อหา
                      </p>
                    </div>

                    {/* Auto-Renumber Action Button */}
                    <button
                      type="button"
                      onClick={() => autoRenumberChapters('colon')}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>⚡</span>
                      <span>จัดเรียงเลขตอนใหม่อัตโนมัติ (Auto-Sync)</span>
                    </button>
                  </div>

                  {/* Range Selector Bar */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-purple-300 font-semibold">เลือกช่วง:</span>
                      <span>ตอนที่</span>
                      <input
                        type="number"
                        min={1}
                        max={chapters.length}
                        value={rangeStart}
                        onChange={(e) => applyRangeSelection(parseInt(e.target.value, 10) || 1, rangeEnd)}
                        className="w-14 px-2 py-1 rounded-lg bg-black/40 border border-white/20 text-center text-xs font-bold"
                      />
                      <span>ถึงตอนที่</span>
                      <input
                        type="number"
                        min={rangeStart}
                        max={chapters.length}
                        value={rangeEnd}
                        onChange={(e) => applyRangeSelection(rangeStart, parseInt(e.target.value, 10) || chapters.length)}
                        className="w-14 px-2 py-1 rounded-lg bg-black/40 border border-white/20 text-center text-xs font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleSelectAllChapters(true)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition"
                      >
                        เลือกทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSelectAllChapters(false)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 transition"
                      >
                        ยกเลิกทั้งหมด
                      </button>
                    </div>
                  </div>

                  {/* Main Split: Chapters List vs Quick Preview Pane */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* Left: Reorderable Chapters List */}
                    <div className="lg:col-span-7 space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {chapters.map((ch, idx) => {
                        const isPreviewing = ch.id === previewChapterId
                        return (
                          <div
                            key={ch.id}
                            className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                              isPreviewing
                                ? 'bg-purple-950/40 border-purple-400 shadow-md ring-1 ring-purple-400/40'
                                : ch.selected
                                ? 'bg-white/5 border-white/10 hover:border-purple-400/30'
                                : 'bg-black/30 border-white/5 opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={ch.selected}
                                onChange={() => toggleChapterSelection(ch.id)}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />

                              <span className="font-mono text-xs text-purple-300 font-bold shrink-0">
                                #{String(ch.number).padStart(2, '0')}
                              </span>

                              <input
                                type="text"
                                value={ch.title}
                                onChange={(e) => updateChapterTitle(ch.id, e.target.value)}
                                className="flex-1 px-2.5 py-1 rounded-lg bg-transparent hover:bg-black/30 focus:bg-black/50 border border-transparent hover:border-purple-400/30 focus:border-purple-400 text-xs text-white font-medium outline-none truncate"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-plottrix-muted font-mono hidden sm:inline">
                                {ch.wordCount?.toLocaleString() || 0} คำ
                              </span>

                              {/* Preview Toggle */}
                              <button
                                type="button"
                                onClick={() => setPreviewChapterId(ch.id)}
                                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-purple-600/20 text-purple-200 text-[11px] font-semibold transition"
                                title="ดูตัวอย่างเนื้อหา"
                              >
                                ดู
                              </button>

                              {/* Reorder Up */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveChapter(idx, -1)}
                                className="w-6 h-6 rounded-lg bg-white/5 disabled:opacity-20 hover:bg-white/10 text-xs flex items-center justify-center cursor-pointer"
                                title="เลื่อนขึ้น"
                              >
                                ▲
                              </button>

                              {/* Reorder Down */}
                              <button
                                type="button"
                                disabled={idx === chapters.length - 1}
                                onClick={() => moveChapter(idx, 1)}
                                className="w-6 h-6 rounded-lg bg-white/5 disabled:opacity-20 hover:bg-white/10 text-xs flex items-center justify-center cursor-pointer"
                                title="เลื่อนลง"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Right: Quick Preview Box */}
                    <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/40 p-4 h-[360px] flex flex-col justify-between">
                      {activePreviewChapter ? (
                        <>
                          <div className="pb-2 border-b border-white/10 mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-300 truncate max-w-[200px]">
                              {activePreviewChapter.heading || activePreviewChapter.title}
                            </span>
                            <span className="text-[10px] text-plottrix-muted font-mono">
                              {activePreviewChapter.wordCount?.toLocaleString() || 0} คำ
                            </span>
                          </div>

                          <div className="flex-1 overflow-y-auto text-xs text-slate-300 space-y-2 whitespace-pre-wrap leading-relaxed pr-1 select-text font-normal font-thai">
                            {activePreviewChapter.content || 'ไม่มีเนื้อหา'}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-plottrix-muted">
                          คลิกปุ่ม "ดู" ในรายการตอนเพื่อดูตัวอย่างเนื้อหา
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Character & Lore Bible Sync Section */}
                <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id="syncCharToggle"
                        checked={syncCharacters}
                        onChange={(e) => setSyncCharacters(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor="syncCharToggle" className="font-extrabold text-sm text-white cursor-pointer">
                        บันทึกข้อมูลตัวละครลงใน Character &amp; Lore Bible ด้วย ({characters.filter(c => c.selected).length} คน)
                      </label>
                    </div>

                    <span className="text-[10px] text-purple-300 bg-purple-500/20 border border-purple-400/30 px-2.5 py-0.5 rounded-full font-bold">
                      ตรวจจับอัตโนมัติ {characters.length} คน
                    </span>
                  </div>

                  {syncCharacters && (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {characters.map((charItem, cIdx) => (
                        <div
                          key={charItem.id}
                          className="p-3 rounded-xl border border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={charItem.selected}
                              onChange={() => {
                                setParsedCharacters(prev => prev.map((c, i) => i === cIdx ? { ...c, selected: !c.selected } : c))
                              }}
                              className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                            />

                            <input
                              type="text"
                              value={charItem.name}
                              onChange={(e) => {
                                const val = e.target.value
                                setParsedCharacters(prev => prev.map((c, i) => i === cIdx ? { ...c, name: val } : c))
                              }}
                              className="px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-xs font-bold text-white w-44 truncate outline-none focus:border-purple-400"
                            />

                            {/* Duplicate Badge */}
                            {charItem.isDuplicate ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                มีอยู่แล้ว (จะผสานข้อมูล)
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ตัวละครใหม่
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={charItem.role}
                              onChange={(e) => {
                                const val = e.target.value
                                setParsedCharacters(prev => prev.map((c, i) => i === cIdx ? { ...c, role: val } : c))
                              }}
                              className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] text-purple-200 outline-none"
                            >
                              <option value="ตัวเอก">ตัวเอก</option>
                              <option value="ตัวละครหลัก">ตัวละครหลัก</option>
                              <option value="ตัวร้าย">ตัวร้าย</option>
                              <option value="ตัวละครสมทบ">ตัวละครสมทบ</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setParsedCharacters(prev => prev.filter((_, i) => i !== cIdx))
                              }}
                              className="w-6 h-6 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs transition cursor-pointer"
                              title="ลบรายชื่อนี้ออก"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-purple-500/20 bg-plottrix-panel2/60 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-plottrix-muted">
              {stage === 2 && (
                <span>
                  พร้อมนำเข้า <strong className="text-purple-300">{chapters.filter(c => c.selected).length}</strong> ตอน
                  {syncCharacters && <span> และ <strong className="text-emerald-300">{characters.filter(c => c.selected).length}</strong> ตัวละคร</span>}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                ยกเลิก
              </button>

              {stage === 2 && (
                <button
                  type="button"
                  disabled={isExecuting || chapters.filter(c => c.selected).length === 0}
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-50 text-white font-black text-xs shadow-xl shadow-purple-600/30 transition cursor-pointer flex items-center gap-2"
                >
                  {isExecuting ? (
                    <span>กำลังบันทึกลงระบบ...</span>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>ยืนยันการนำเข้า ({chapters.filter(c => c.selected).length} ตอน)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
