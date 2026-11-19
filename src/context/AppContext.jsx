import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { VOCABULARY_BANK } from '../lib/vocabularyBank'
import { getDynamicVocabularyPrompt, MAX_ACTIVE_SKILLS } from '../lib/dynamicVocab'
import confetti from 'canvas-confetti'

const AppContext = createContext(null)

const INITIAL_CHAPTERS = [
  {
    id: 'ch-1',
    number: 1,
    title: 'บทนำ — คืนฝนโปรยปราย',
    pages: [
      `เสียงฝนตกกระทบหลังคาไม้เก่าอย่างต่อเนื่อง เธอเดินผ่านประตูบานนั้นอีกครั้ง กลิ่นอายความชื้นและไอฝนอบอวลไปทั่วทางเดินแคบๆ เบื้องหน้าคือแสงตะเกียงที่สั่นไหวราวกับจะดับมอดลงได้ทุกเมื่อ

รินลดาหยุดฝีเท้า ดวงตาคู่เรียวมองฝ่าม่านน้ำฝนไปยังเงาร่างลึกลับที่ยืนนิ่งอยู่ใต้ซุ้มไม้เลื้อย ชายหนุ่มคนนั้นไม่ได้ถือร่ม แต่ละอองน้ำกลับไม่สัมผัสผิวกายเขาเลยแม้แต่น้อย

"ในที่สุดเจ้าก็มาตามสัญญา" น้ำเสียงทุ้มต่ำแทรกผ่านสายลมหนาวเหน็บ`,
      `เธอกำด้ามมีดสั้นที่ซ่อนไว้ใต้แขนเสื้อแน่นขึ้น หัวใจเต้นระรัวราวกับกลองศึก ความทรงจำเมื่อห้าปีก่อนย้อนกลับมาฉายชัดในหัว

"ข้าไม่ได้มาเพื่อรักษาสัญญา แต่มาเพื่อทวงคืนสิ่งที่เจ้าขโมยไป" รินลดาเอ่ยตอบด้วยน้ำเสียงเยือกเย็น แม้ในใจจะหวั่นไหวกับพลังเวทมนตร์มืดที่แผ่ออกมาจากตัวเขา

ชายหนุ่มหัวเราะเบาๆ ในลำคอ รอยยิ้มเย้ยหยันปรากฏบนริมฝีปากที่ซีดเซียว "ของสิ่งนั้น... กลายเป็นส่วนหนึ่งของวิญญาณข้าไปแล้ว แม่มดน้อย"`
    ]
  },
  {
    id: 'ch-2',
    number: 2,
    title: 'บทที่ 2 — คำสาปแห่งจันทราสีเลือด',
    pages: [
      `หมอกสีเงินเริ่มลอยปกคลุมยอดเขาราวกับผืนผ้าไหมโบราณ ลมหนาวพัดผ่านแมกไม้ส่งเสียงหวีดหวิว รินลดาหันมองไปรอบตัว ดอกไม้กลางคืนเริ่มคลี่กลีบออกรับแสงจันทร์สีแดงก่ำ

นี่คือเวลาที่พลังแห่งเผ่าพันธุ์จันทราจะตื่นขึ้นอย่างสมบูรณ์`
    ]
  },
  {
    id: 'ch-3',
    number: 3,
    title: 'บทที่ 3 — พันธสัญญาในเงามืด',
    pages: [
      `ความเงียบงันเข้าปกคลุมห้องโถงศิลา มีเพียงเสียงลมหายใจแผ่วเบาของพวกเขาสองคน ข้อตกลงที่ไม่อาจหลีกเลี่ยงกำลังจะเริ่มต้นขึ้น`
    ]
  }
]

const DEFAULT_CHARACTERS = [
  {
    id: 'char-1',
    name: 'รินลดา (Rinlada)',
    role: 'ตัวเอก (Protagonist)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    description: 'ทายาทคนสุดท้ายของตระกูลผู้พิทักษ์ผนึกจันทรา มีเวทมนตร์เยียวยาและอ่านความทรงจำของวัตถุได้',
    traits: 'ฉลาด สุขุม เด็ดเดี่ยว มักเก็บซ่อนความรู้สึก ไม่ยอมก้มหัวให้ความอยุติธรรม',
    secrets: 'แอบครอบครองศิลาจันทราครึ่งซีกที่ทุกคนคิดว่าถูกทำลายไปแล้ว',
    relations: 'เป็นทั้งศัตรูและคู่ชะตากรรมของศรุต'
  },
  {
    id: 'char-2',
    name: 'ศรุต (Sarut)',
    role: 'ตัวเอกฝ่ายตรงข้าม / พระเอก (Deuteragonist)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    description: 'จอมเวทผู้ถูกเนรเทศ ครอบครองพลังแห่งเงาและความมืด ร่างกายมีรอยสักโบราณที่เรืองแสงได้ในคืนเดือนดับ',
    traits: 'ลึกลับ พูดน้อย เย็นชา แต่รักษาคำพูดเสมอ มีอารมณ์ขันแบบประชดประชัน',
    secrets: 'ถูกคำสาปกลืนวิญญาณ หากไม่ถอนคำสาปภายใน 1 ปีจะสูญเสียความเป็นมนุษย์',
    relations: 'ติดหนี้ชีวิตรินลดาในอดีต'
  }
]

const INITIAL_NOVELS = [
  {
    id: 'novel-1',
    title: 'เงาในสายฝน (บททดลอง)',
    genre: 'แฟนตาซี / กำลังภายใน',
    pov: 'บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)',
    synopsis: 'เรื่องราวของรินลดา ทายาทตระกูลผู้พิทักษ์ผนึกจันทรา ที่ต้องเผชิญหน้ากับศรุต จอมเวทแห่งเงามืดในคืนฝนกระหน่ำ',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    wordCount: 1420,
    chapterCount: 3,
    updatedAt: '19 พ.ย. 2026',
    chapters: INITIAL_CHAPTERS,
    characters: DEFAULT_CHARACTERS
  }
]

const DEFAULT_PERSONAS = [
  {
    id: 'persona-1',
    name: 'พรรณนาลึกซึ้ง (Poetic & Atmospheric)',
    tone: 'เน้นบรรยากาศ สุนทรียภาพทางภาษา บรรยายภาพและประสาทสัมผัสคมชัด',
    desc: 'เหมาะกับนิยายแฟนตาซี พีเรียด และวรรณกรรมที่ต้องการภาษาประณีต'
  },
  {
    id: 'persona-2',
    name: 'กระชับ ฉับไว (Fast-Paced Action)',
    tone: 'เน้นการกระทำ ประโยคสั้นทรงพลัง จังหวะตื่นเต้นเร้าใจ',
    desc: 'เหมาะกับฉากต่อสู้ นิยายสืบสวน ระทึกขวัญ หรือเอาชีวิตรอด'
  },
  {
    id: 'persona-3',
    name: 'อบอุ่น นุ่มนวล (Gentle & Emotional)',
    tone: 'เน้นความรู้สึก อารมณ์ผูกพัน ภาษาละมุน เข้าถึงจิตใจตัวละคร',
    desc: 'เหมาะกับนิยายโรแมนติก ดราม่า หรือชีวิตประจำวันอบอุ่นใจ'
  }
]

const DEFAULT_SKILLS = [
  { id: 'skill-1', name: 'Show, Don\'t Tell', desc: 'เปลี่ยนการบอกตรงๆ เป็นพฤติกรรมและอาการทางกายภาพ', active: true, prompt: 'แปลงข้อความที่เป็นการบอกความรู้สึกตรงๆ ให้แสดงออกผ่านภาษากาย สีหน้า แววตา หรือปฏิกิริยาทางกายภาพแทน' },
  { id: 'skill-2', name: 'Sensory Detail (5 สัมผัส)', desc: 'เพิ่มรายละเอียด รูป รส กลิ่น เสียง สัมผัส ในฉาก', active: true, prompt: 'เสริมรายละเอียดทางประสาทสัมผัส (แสง เงา กลิ่นอาย อุณหภูมิ เสียงประกอบฉาก) ให้ผู้อ่านเห็นภาพชัดเจน' },
  { id: 'skill-3', name: 'Anti-Repetition Engine', desc: 'ตัดคำซ้ำซ้อน สลับตำแหน่งคำเชื่อม และเกลาประโยค', active: true, prompt: 'ตรวจจับคำซ้ำในระยะใกล้เคียง (เช่น คำว่า หรือ, จึง, ค่อยๆ, บานประตู) แล้วแทนที่ด้วยคำไวพจน์ที่เหมาะสม' },
  { id: 'skill-4', name: 'Character Voice Consistency', desc: 'คุมโทนคำพูดให้สอดคล้องกับนิสัยตัวละคร', active: false, prompt: 'ตรวจสอบบทสนทนาให้ตรงกับคาแรคเตอร์ ระดับภาษา และความสัมพันธ์ระหว่างตัวละคร' }
]

export function AppProvider({ children }) {
  // Navigation / Views: 'home' | 'workspace_home' | 'studio'
  const [currentView, setCurrentView] = useState('home')

  const navigateTo = useCallback((view) => {
    if (view === 'workspace') {
      setCurrentView('workspace_home')
    } else {
      setCurrentView(view)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Novels List & Active Novel
  const [novels, setNovels] = useState(() => {
    try {
      const saved = localStorage.getItem('plottrix_novels')
      return saved ? JSON.parse(saved) : INITIAL_NOVELS
    } catch {
      return INITIAL_NOVELS
    }
  })
  const [activeNovelId, setActiveNovelId] = useState(() => novels[0]?.id || 'novel-1')
  const activeNovel = useMemo(() => novels.find(n => n.id === activeNovelId) || novels[0] || INITIAL_NOVELS[0], [novels, activeNovelId])

  // Novel Metadata
  const [novelTitle, setNovelTitle] = useState(() => activeNovel?.title || 'เงาในสายฝน (บททดลอง)')
  const [genre, setGenre] = useState(() => activeNovel?.genre || 'แฟนตาซี / กำลังภายใน')
  const [pov, setPov] = useState(() => activeNovel?.pov || 'บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)')

  // Chapters & Content for current active novel
  const [chapters, setChapters] = useState(() => activeNovel?.chapters || INITIAL_CHAPTERS)
  const [activeChapterId, setActiveChapterId] = useState(() => chapters[0]?.id || 'ch-1')
  const [activePageIdx, setActivePageIdx] = useState(0)

  // Current Chapter helper
  const currentChapter = useMemo(() => chapters.find(c => c.id === activeChapterId) || chapters[0] || { pages: [''] }, [chapters, activeChapterId])
  const currentPageText = currentChapter?.pages?.[activePageIdx] || ''

  // Editor Appearance & Behavior
  const [paperTheme, setPaperTheme] = useState(() => localStorage.getItem('plottrix_paper_theme') || 'midnight')
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('thai')
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [editorialCheckOpen, setEditorialCheckOpen] = useState(false)
  const [selection, setSelection] = useState({ text: '', start: 0, end: 0 })

  // Trix Economy & Plans
  const [trixBalance, setTrixBalance] = useState(() => {
    const saved = localStorage.getItem('plottrix_trix')
    return saved ? parseInt(saved, 10) : 400
  })
  const [plan, setPlan] = useState('Pro Plan++')
  const [lastDailyClaim, setLastDailyClaim] = useState(() => localStorage.getItem('plottrix_last_claim') || '')

  // Modals & Drawers
  const [activeModal, setActiveModal] = useState(null) // 'characterBible', 'stylePersona', 'customDictionary', 'history', 'export', 'pricing', 'skills', 'settings'

  // Characters & Lore
  const [characters, setCharacters] = useState(() => {
    try {
      const saved = localStorage.getItem('plottrix_characters')
      return saved ? JSON.parse(saved) : DEFAULT_CHARACTERS
    } catch {
      return DEFAULT_CHARACTERS
    }
  })
  const [customDictionary, setCustomDictionary] = useState(() => {
    try {
      const saved = localStorage.getItem('plottrix_dictionary')
      return saved ? JSON.parse(saved) : ['รินลดา', 'ศรุต', 'ศิลาจันทรา', 'เวทมนตร์ย้อนเงา', 'หอคอยรัตติกาล']
    } catch {
      return ['รินลดา', 'ศรุต', 'ศิลาจันทรา', 'เวทมนตร์ย้อนเงา', 'หอคอยรัตติกาล']
    }
  })
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS)
  const [activePersonaId, setActivePersonaId] = useState('persona-1')
  const [skills, setSkills] = useState(DEFAULT_SKILLS)
  const [customSkillPrompt, setCustomSkillPrompt] = useState(() => localStorage.getItem('plottrix_custom_skill_prompt') || '')

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('plottrix_settings')
      return saved ? JSON.parse(saved) : {
        notifySize: 'standard', // 'compact', 'standard', 'large'
        notifyDuration: 3800,
        notifySound: true,
        editorFont: 'thai',
        editorLineHeight: 1.8,
        aiCreativity: 'balanced',
        aiVocabIntensity: 'moderate'
      }
    } catch {
      return {
        notifySize: 'standard',
        notifyDuration: 3800,
        notifySound: true,
        editorFont: 'thai',
        editorLineHeight: 1.8,
        aiCreativity: 'balanced',
        aiVocabIntensity: 'moderate'
      }
    }
  })

  // Global AI Lock & Anti-Spam (Requirement 1)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [activeAITool, setActiveAITool] = useState(null)
  const aiLockRef = useRef(false)
  const aiCooldownRef = useRef(0)
  const abortControllerRef = useRef(null)

  // Snapshots (Version History)
  const [snapshots, setSnapshots] = useState(() => {
    return [
      { id: 'snap-1', timestamp: new Date(Date.now() - 3600000).toLocaleString('th-TH'), label: 'โครงร่างบทนำแรกเริ่ม', preview: 'เสียงฝนตกกระทบหลังคาไม้เก่าอย่างต่อเนื่อง...' },
      { id: 'snap-2', timestamp: new Date(Date.now() - 1800000).toLocaleString('th-TH'), label: 'เพิ่มฉากบทสนทนารินลดา-ศรุต', preview: 'ในที่สุดเจ้าก็มาตามสัญญา น้ำเสียงทุ้มต่ำแทรกผ่านสายลม...' }
    ]
  })

  // Debounced Auto-Save (Requirement 2: 2.5 seconds)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saving', 'saved', 'unsaved'
  const saveTimeoutRef = useRef(null)

  // AI Drawer State
  const [aiDrawer, setAiDrawer] = useState({
    isOpen: false,
    loading: false,
    actionType: null,
    cost: 0,
    result: null,
    error: null,
    steps: [],
    thoughtTime: 0
  })

  // SwipeToast System
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ title, description, icon, actionLabel, onAction, duration = 3800, fuseColor = '#c29aff', background = '#1a132e', color = '#f4efff' }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, title, description, icon, actionLabel, onAction, duration, fuseColor, background, color }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Onboarding Tour State
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(1)

  const startTour = useCallback(() => {
    setTourStep(1)
    setIsTourOpen(true)
  }, [])

  const completeTour = useCallback(() => {
    setIsTourOpen(false)
    localStorage.setItem('plottrix_tour_completed', 'true')
    addToast({
      title: 'ยินดีด้วย! คุณพร้อมเริ่มเขียนนิยายแล้ว',
      description: 'สามารถเปิดคู่มือแนะนำการใช้งานซ้ำได้จากเมนูการตั้งค่า',
      fuseColor: '#74d9b4'
    })
  }, [addToast])

  const skipTour = useCallback(() => {
    setIsTourOpen(false)
    localStorage.setItem('plottrix_tour_completed', 'true')
  }, [])

  // First time tour trigger
  useEffect(() => {
    const done = localStorage.getItem('plottrix_tour_completed')
    if (!done && currentView === 'workspace_home') {
      const timer = setTimeout(() => {
        setIsTourOpen(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [currentView])

  // Persist important data
  useEffect(() => {
    localStorage.setItem('plottrix_novels', JSON.stringify(novels))
  }, [novels])

  useEffect(() => {
    localStorage.setItem('plottrix_trix', trixBalance.toString())
  }, [trixBalance])

  useEffect(() => {
    localStorage.setItem('plottrix_settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem('plottrix_custom_skill_prompt', customSkillPrompt)
  }, [customSkillPrompt])

  // Save chapters with 2.5s debounce and update saveStatus
  const updateCurrentPageText = useCallback((newText) => {
    setSaveStatus('saving')
    setChapters(prev => {
      const updated = prev.map(ch => {
        if (ch.id === activeChapterId) {
          const newPages = [...ch.pages]
          newPages[activePageIdx] = newText
          return { ...ch, pages: newPages }
        }
        return ch
      })
      // Sync back to active novel
      setNovels(allNovs => allNovs.map(n => {
        if (n.id === activeNovelId) {
          return { ...n, chapters: updated, updatedAt: 'บันทึกเมื่อสักครู่' }
        }
        return n
      }))
      return updated
    })

    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved')
    }, 2500) // 2.5s Debounce as requested
  }, [activeChapterId, activePageIdx, activeNovelId])

  // Open novel handler
  const openNovel = useCallback((id) => {
    const target = novels.find(n => n.id === id)
    if (target) {
      setActiveNovelId(target.id)
      setNovelTitle(target.title)
      setGenre(target.genre)
      setPov(target.pov)
      setChapters(target.chapters || INITIAL_CHAPTERS)
      setActiveChapterId(target.chapters?.[0]?.id || 'ch-1')
      setActivePageIdx(0)
    }
    navigateTo('studio')
  }, [novels, navigateTo])

  // Create novel handler with plan quota check
  const createNovel = useCallback(({ title, genre: g, pov: p, synopsis, cover }) => {
    if (plan === 'Free Plan' && novels.length >= 1) {
      addToast({
        title: 'โควต้า Free Plan จำกัด 1 เรื่อง',
        description: 'กรุณาอัปเกรดเป็น Pro Plan++ เพื่อปลดล็อกการสร้างนิยายไม่จำกัด',
        actionLabel: 'อัปเกรดแผน',
        onAction: () => setActiveModal('pricing'),
        fuseColor: '#eab308'
      })
      setActiveModal('pricing')
      return false
    }

    const newId = `novel-${Date.now()}`
    const newNov = {
      id: newId,
      title: title || 'นิยายเรื่องใหม่',
      genre: g || 'แฟนตาซี / กำลังภายใน',
      pov: p || 'บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)',
      synopsis: synopsis || '',
      cover: cover || 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop&q=80',
      wordCount: 0,
      chapterCount: 1,
      updatedAt: 'วันนี้',
      chapters: [
        {
          id: `ch-${Date.now()}`,
          number: 1,
          title: 'บทที่ 1 — จุดเริ่มต้น',
          pages: ['เริ่มจรดปลายปากกาเขียนเรื่องราวของคุณที่นี่...']
        }
      ],
      characters: []
    }

    setNovels(prev => [newNov, ...prev])
    openNovel(newId)
    addToast({
      title: `สร้างนิยาย "${newNov.title}" สำเร็จ!`,
      description: 'เปิดห้องสตูดิโอพร้อมให้คุณเริ่มเขียนแล้ว',
      fuseColor: '#74d9b4'
    })
    return true
  }, [plan, novels.length, openNovel, addToast])

  const deleteNovel = useCallback((id) => {
    if (novels.length <= 1) {
      addToast({
        title: 'ไม่สามารถลบนิยายเรื่องนี้ได้',
        description: 'ต้องมีนิยายในคลังอย่างน้อย 1 เรื่องสำหรับเขียนงาน',
        fuseColor: '#ef4444'
      })
      return
    }
    setNovels(prev => prev.filter(n => n.id !== id))
    addToast({ title: 'ลบนิยายออกจากคลังแล้ว', duration: 2500 })
  }, [novels.length, addToast])

  // Upgrade Plan Handler with Confetti
  const upgradePlanPrototype = useCallback((newPlan) => {
    setPlan(newPlan)
    let addedTrix = 0
    if (newPlan === 'Pro Plan++') addedTrix = 400
    if (newPlan === 'Ultra Plan') addedTrix = 1000

    if (addedTrix > 0) {
      setTrixBalance(b => b + addedTrix)
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#6366f1', '#ec4899', '#38bdf8']
    })

    addToast({
      title: `อัปเกรดเป็น ${newPlan} สำเร็จ! 🎉`,
      description: addedTrix > 0 ? `ได้รับเหรียญ +${addedTrix} Trix และสิทธิพิเศษของ ${newPlan} ทันที` : 'ยินดีต้อนรับสู่ Plottrix',
      fuseColor: '#c084fc'
    })
  }, [addToast])

  // Daily Trix Claim
  const claimDailyTrix = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (lastDailyClaim === today) {
      addToast({
        title: 'รับเหรียญ Trix วันนี้ไปแล้ว',
        description: 'กลับมารับฟรีใหม่อีกครั้งในวันพรุ่งนี้ (+3 Trix)',
        fuseColor: '#e9c78c'
      })
      return
    }
    setTrixBalance(b => b + 3)
    setLastDailyClaim(today)
    localStorage.setItem('plottrix_last_claim', today)

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.2, x: 0.8 },
      colors: ['#9b63ff', '#c29aff', '#74d9b4', '#e9c78c']
    })

    addToast({
      title: 'รับสำเร็จ +3 Trix ประจำวัน!',
      description: 'ยอดเหรียญ Trix ปัจจุบันของคุณพร้อมใช้งานสร้างสรรค์นิยาย',
      fuseColor: '#74d9b4'
    })
  }, [lastDailyClaim, addToast])

  // Deduct Trix helper
  const deductTrix = useCallback((cost, reason) => {
    if (trixBalance < cost) return false
    setTrixBalance(b => b - cost)
    addToast({
      title: `หัก ${cost} Trix (${reason})`,
      description: `คงเหลือ ${trixBalance - cost} Trix`,
      duration: 3000,
      fuseColor: '#c29aff'
    })
    return true
  }, [trixBalance, addToast])

  // AI Task Guard (Anti-Spam & Global Processing Lock)
  const startAITask = useCallback((taskName) => {
    if (aiLockRef.current || isAIProcessing) {
      addToast({
        title: 'AI กำลังประมวลผลอยู่',
        description: 'กรุณารอให้ระบบทำงานปัจจุบันเสร็จสิ้น หรือกดยกเลิก',
        fuseColor: '#eab308'
      })
      return null
    }

    if (Date.now() < aiCooldownRef.current) {
      const remaining = Math.ceil((aiCooldownRef.current - Date.now()) / 1000)
      addToast({
        title: 'ระบบ AI อยู่ในช่วง Cooldown',
        description: `กรุณารออีก ${remaining} วินาที ก่อนเรียกใช้งานอีกครั้ง`,
        fuseColor: '#38bdf8'
      })
      return null
    }

    aiLockRef.current = true
    setIsAIProcessing(true)
    setActiveAITool(taskName)
    abortControllerRef.current = new AbortController()
    return abortControllerRef.current
  }, [isAIProcessing, addToast])

  const endAITask = useCallback((success = true) => {
    setIsAIProcessing(false)
    setActiveAITool(null)
    aiLockRef.current = false
    abortControllerRef.current = null
    const cooldownMs = plan === 'Free Plan' ? 5000 : 2000
    aiCooldownRef.current = Date.now() + cooldownMs
  }, [plan])

  const cancelAITask = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsAIProcessing(false)
    setActiveAITool(null)
    aiLockRef.current = false
    abortControllerRef.current = null
    setAiDrawer(prev => ({ ...prev, loading: false, isOpen: false }))
    addToast({
      title: 'ยกเลิกคำสั่ง AI เรียบร้อย',
      description: 'การประมวลผลถูกระงับทันที',
      fuseColor: '#ef4444'
    })
  }, [addToast])

  // Add Chapter
  const addChapter = useCallback(() => {
    const newNumber = chapters.length + 1
    const newId = `ch-${Date.now()}`
    const newCh = {
      id: newId,
      number: newNumber,
      title: `บทที่ ${newNumber} — ตอนใหม่`,
      pages: ['เริ่มเขียนเนื้อหาของบทนี้ได้ที่นี่...']
    }
    setChapters(prev => [...prev, newCh])
    setActiveChapterId(newId)
    setActivePageIdx(0)
    addToast({
      title: `สร้างบทที่ ${newNumber} สำเร็จ`,
      description: 'เปิดหน้ากระดาษใหม่พร้อมให้คุณลุยต่อ',
      fuseColor: '#74d9b4'
    })
  }, [chapters.length, addToast])

  // Add Page to current Chapter
  const addPage = useCallback(() => {
    setChapters(prev => prev.map(ch => {
      if (ch.id === activeChapterId) {
        return { ...ch, pages: [...ch.pages, ''] }
      }
      return ch
    }))
    setActivePageIdx(currentChapter.pages.length)
    addToast({
      title: `เพิ่มหน้าที่ ${currentChapter.pages.length + 1}`,
      description: 'แบ่งช่วงหน้ากระดาษอย่างเป็นระเบียบ',
      duration: 2500
    })
  }, [activeChapterId, currentChapter.pages.length, addToast])

  // Delete Page
  const deletePage = useCallback((idx) => {
    if (currentChapter.pages.length <= 1) {
      addToast({
        title: 'ไม่สามารถลบหน้านี้ได้',
        description: 'แต่ละบทต้องมีหน้ากระดาษอย่างน้อย 1 หน้า',
        fuseColor: '#ef4444'
      })
      return
    }
    setChapters(prev => prev.map(ch => {
      if (ch.id === activeChapterId) {
        const nextPages = ch.pages.filter((_, i) => i !== idx)
        return { ...ch, pages: nextPages }
      }
      return ch
    }))
    setActivePageIdx(Math.max(0, idx - 1))
    addToast({ title: 'ลบหน้ากระดาษเรียบร้อย', duration: 2500 })
  }, [currentChapter.pages.length, activeChapterId, addToast])

  // AI Task Orchestrator with ThoughtLine & StatusMark
  const triggerAiTask = async (actionType, textToProcess = null) => {
    const targetText = textToProcess !== null ? textToProcess : (selection.text || currentPageText)
    if (!targetText || targetText.trim().length === 0) {
      addToast({
        title: 'กรุณาเลือกข้อความก่อน',
        description: 'คลุมดำข้อความที่ต้องการ หรือเริ่มพิมพ์เนื้อหาในหน้ากระดาษ',
        fuseColor: '#ef4444'
      })
      return
    }

    const abortController = startAITask(actionType)
    if (!abortController) return

    const COSTS = {
      proofread: 1,
      polish: 3,
      continuity: 3,
      plotBranch: 4,
      translate: 2,
      fullBook: 0
    }
    const cost = COSTS[actionType] || 1

    if (trixBalance < cost) {
      endAITask(false)
      addToast({
        title: 'Trix ไม่เพียงพอ',
        description: `ฟีเจอร์นี้ต้องการ ${cost} Trix (คุณมี ${trixBalance} Trix)`,
        actionLabel: 'เติม Trix',
        onAction: () => setActiveModal('pricing'),
        fuseColor: '#ef4444'
      })
      return
    }

    const STEP_SETS = {
      proofread: [
        'อ่านวิเคราะห์โครงสร้างประโยคและวรรคตอน',
        'ตรวจสอบพจนานุกรมคำผิดและคำทับศัพท์',
        'เทียบเคียงคำเฉพาะจาก Custom Dictionary',
        'จัดทำรายการคำผิดและคำที่แนะนำให้แก้'
      ],
      polish: [
        'อ่านบริบทอารมณ์และสำนวนต้นฉบับ',
        `ดึงคลังคำศัพท์เฉพาะแนว '${genre}'`,
        `ปรับระดับภาษาให้ตรงกับ Persona '${personas.find(p => p.id === activePersonaId)?.name || 'พรรณนาลึกซึ้ง'}'`,
        customSkillPrompt ? 'ผนวกคำสั่งพิเศษจาก Custom AI Skill' : 'เกลาจังหวะการอ่านและตัดคำซ้ำซ้อน'
      ],
      continuity: [
        'สแกนรายชื่อและพฤติกรรมตัวละครในฉาก',
        'เปรียบเทียบข้อมูลกับ Character Bible',
        'ตรวจเช็กลำดับเวลาและตรรกะในโลกนิยาย',
        'ประเมินคะแนนความสมเหตุสมผลและชี้จุดขัดแย้ง'
      ],
      plotBranch: [
        'จับใจความสำคัญและปมขัดแย้งหลักของฉาก',
        'สร้าง 3 ทางแยกเนื้อเรื่องที่น่าติดตาม',
        'คำนวณแรงขับดันตัวละครและผลกระทบต่อเนื่อง',
        'ร่างตัวอย่างย่อหน้าเริ่มต้นของแต่ละเส้นทาง'
      ],
      translate: [
        'วิเคราะห์อรรถรสและโทนทางวรรณกรรม',
        'แปลคำศัพท์พร้อมเลือกสำนวนที่สละสลวย',
        'ขัดเกลาไวยากรณ์ให้ลื่นไหลเหมือนต้นฉบับ'
      ],
      fullBook: [
        'อ่านโครงเรื่องภาพรวมทุกบทที่เขียน',
        'วิเคราะห์จังหวะการดำเนินเรื่อง (Pacing)',
        'ตรวจสอบพัฒนาการตัวละครและช่องโหว่พล็อต'
      ]
    }

    const steps = STEP_SETS[actionType] || ['กำลังวิเคราะห์ข้อความ...', 'ประมวลผลคำแนะนำ...', 'จัดทำผลลัพธ์']

    setAiDrawer({
      isOpen: true,
      loading: true,
      actionType,
      cost,
      result: null,
      error: null,
      steps,
      thoughtTime: 0
    })

    const startTime = performance.now()

    try {
      let parsedResult = null
      let useMockFallback = false

      // Pass custom skill prompt to payload if provided
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          actionType,
          payload: {
            text: targetText,
            genre,
            pov,
            persona: personas.find(p => p.id === activePersonaId)?.name,
            dictionary: customDictionary,
            customSkillPrompt: customSkillPrompt || undefined
          }
        })
      }).catch((err) => {
        if (err.name === 'AbortError') {
          throw err
        }
        return null
      })

      if (res && res.ok) {
        const data = await res.json()
        if (data && !data.mock && data.result) {
          parsedResult = data.result
        } else {
          useMockFallback = true
        }
      } else {
        useMockFallback = true
      }

      if (useMockFallback || !parsedResult) {
        await new Promise((r, rej) => {
          const timeout = setTimeout(r, 2000)
          abortController.signal.addEventListener('abort', () => {
            clearTimeout(timeout)
            rej(new Error('AbortError'))
          })
        })

        if (actionType === 'proofread') {
          parsedResult = {
            explanation: 'ตรวจพบจุดที่สะกดผิดและการเว้นวรรคไม่ถูกต้อง 3 จุด ได้ทำการแก้ไขตามหลักภาษาไทยและคงสำนวนเดิมไว้ 100%',
            corrections: [
              { original: 'โซซัดโซเซ', replacement: 'ซวนเซ / โซซัดโซเซ', reason: 'คำว่าโซเซในบริบทนี้สามารถเลือกคำที่กระชับขึ้นได้' },
              { original: 'ปาฏิหารย์', replacement: 'ปาฏิหาริย์', reason: 'สะกดด้วย สระอิ บน ร' },
              { original: 'โอกาศ', replacement: 'โอกาส', reason: 'ใช้ ส เสือ' }
            ],
            correctedText: targetText
              .replace(/ปาฏิหารย์/g, 'ปาฏิหาริย์')
              .replace(/โอกาศ/g, 'โอกาส')
          }
        } else if (actionType === 'polish') {
          const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]
          parsedResult = {
            polishedText: targetText + '\n\nสายลมกรรโชกหวีดหวิวพาเอากลิ่นดินชื้นและไอเย็นยะเยือกมาปะทะผิวหน้า บรรยากาศรอบกายพลันเงียบสงัดลงจนได้ยินแม้กระทั่งเสียงหยดน้ำที่ร่วงหล่นจากปลายกิ่งไม้แห้งลงสู่ผิวดิน',
            changesSummary: `ขัดเกลาสำนวนตามสไตล์ '${activePersona.name}' ${customSkillPrompt ? `(และตาม Custom Skill: ${customSkillPrompt.slice(0, 30)}...)` : ''} โดยเติมมิติทางประสาทสัมผัส เพิ่มคำไวพจน์ และตัดคำเชื่อมที่ฟุ่มเฟือยออก`,
            suggestions: [
              'ใช้คำว่า "สั่นไหว" แทน "ไหวไปมา" เพื่อขับเน้นความอ่อนแอของแสงไฟ',
              'เพิ่มจังหวะเว้นวรรคก่อนบทสนทนาเพื่อเพิ่มความตึงเครียด (Tension)'
            ]
          }
        } else if (actionType === 'continuity') {
          parsedResult = {
            consistencyScore: 94,
            inconsistencies: [
              {
                issue: 'การใช้เวทมนตร์ในคืนเดือนดับ',
                character: 'ศรุต',
                severity: 'medium',
                solution: 'ใน Character Bible ระบุว่าพลังของศรุตจะแปรปรวนในคืนจันทร์ดับ ควรระบุอาการเหนื่อยล้าหรือแสงประกายเวทสีดำที่กระตุกดับ'
              }
            ],
            timelineCheck: 'ลำดับเวลาต่อเนื่องสมบูรณ์ (เหตุการณ์เกิดขึ้นช่วงหัวค่ำของคืนฝนตก)',
            bibleAlignment: 'สอดคล้องกับบุคลิกของรินลดาที่มักพกมีดสั้นป้องกันตัว'
          }
        } else if (actionType === 'plotBranch') {
          parsedResult = {
            branches: [
              {
                title: 'ทางเลือกที่ 1: การเผชิญหน้าและเจรจาอย่างตึงเครียด',
                summary: 'รินลดาไม่ยอมลดอาวุธ แต่ยื่นข้อเสนอแลกเปลี่ยนด้วยข้อมูลลับของตระกูลจันทราเพื่อดูปฏิกิริยาของศรุต',
                hook: 'ความลับที่ศรุตไม่เคยรู้ว่าผู้บงการตัวจริงไม่ใช่ตระกูลของเธอ',
                previewText: 'รินลดาเลื่อนปลายนิ้วไปสัมผัสสัญลักษณ์บนด้ามมีด แสงเรืองรองสีเงินวาบขึ้น "ก่อนที่เจ้าจะพูดถึงสัญญา เจ้าควรรู้ก่อนว่าคืนที่ผนึกแตก มีคนอื่นอยู่ในห้องนั้นด้วย!"'
              },
              {
                title: 'ทางเลือกที่ 2: เหตุการณ์ไม่คาดฝันจากศัตรูที่ซุ่มซ่อน',
                summary: 'ก่อนที่ทั้งคู่จะได้ข้อสรุป ฝูงอีกาเวทมนตร์จากหอคอยรัตติกาลเข้าจู่โจม บีบให้ทั้งคู่ต้องร่วมมือกันชั่วคราว',
                hook: 'การต่อสู้ร่วมกันเผยให้เห็นรอยสักคำสาปที่ลุกลามถึงหัวใจของศรุต',
                previewText: 'เสียงกรีดร้องแหลมสูงของสัตว์เวทดังสะท้อนผ่านม่านฝน ทันใดนั้นเงาดำนับสิบร่างก็ดิ่งลงมาจากฟากฟ้า เป้าหมายไม่ใช่รินลดา แต่เป็นผนึกที่ร่างของศรุต!'
              },
              {
                title: 'ทางเลือกที่ 3: ความจริงที่ซ่อนอยู่ใต้มนตราลวงตา',
                summary: 'รินลดาค้นพบว่าคนที่ยืนอยู่ตรงหน้าไม่ใช่ตัวจริงของศรุต แต่เป็นหุ่นเชิดวิญญาณที่ถูกส่งมาเพื่อทดสอบเธอ',
                hook: 'ตัวจริงของศรุตกำลังเฝ้ามองดูเธออยู่จากอีกมุมหนึ่งของเมือง',
                previewText: '"ภาพลวงตาอันแยบยล..." รินลดาพึมพำเมื่อสังเกตเห็นว่าเงาของเขาบนพื้นดินทอดยาวไปในทิศทางที่ไม่ตรงกับแสงตะเกียง "เจ้าไม่ใช่เขา ตัวจริงของเจ้าอยู่ที่ไหน!"'
              }
            ]
          }
        } else if (actionType === 'translate') {
          parsedResult = {
            translatedText: `Raindrops drummed ceaselessly against the weathered wooden shingles. She stepped across that familiar threshold once more, enveloped by the damp chill of moisture hanging thick in the narrow corridor. Ahead, the solitary lantern flickered, as though on the verge of surrendering to the dark.\n\nRinlada halted her stride, her keen eyes piercing through the curtain of rain toward the enigmatic silhouette standing motionless beneath the ivy trellis. The young man carried no umbrella, yet the mist seemed incapable of gracing his pale skin.\n\n"At long last, you have honored your oath," his low cadence cut through the biting wind.`,
            notes: 'แปลเป็นวรรณกรรมภาษาอังกฤษ (Literary English) คงน้ำเสียงลึกลับและอารมณ์หนาวเหน็บตามต้นฉบับ'
          }
        } else if (actionType === 'fullBook') {
          parsedResult = {
            plotArcScore: 92,
            majorPacingIssues: ['ช่วงต้นบทที่ 1 ถึงบทที่ 2 เดินเรื่องกระชับดีมาก อาจเพิ่มการปูเบื้องหลังของเมืองก่อนเริ่มบทที่ 3'],
            characterArcAnalysis: 'รินลดาแสดงความเด็ดเดี่ยวชัดเจน ขณะที่ศรุตมีความน่าค้นหาและแรงจูงใจที่ซับซ้อน',
            plotHoles: ['ระวังเรื่องระยะเวลาของคำสาป 1 ปี ควรกำหนดจุดนับเวลาถอยหลังให้ชัดเจนในบทต่อๆ ไป'],
            recommendations: ['เพิ่มฉากแสดงความสัมพันธ์ในอดีต (Flashback สั้นๆ) เพื่อให้ผู้อ่านเข้าใจความผูกพันของทั้งสอง']
          }
        }
      }

      const elapsed = (performance.now() - startTime) / 1000
      deductTrix(cost, `AI ${actionType}`)

      setAiDrawer(prev => ({
        ...prev,
        loading: false,
        result: parsedResult,
        error: null,
        thoughtTime: elapsed
      }))

      endAITask(true)

      addToast({
        title: 'AI ประมวลผลเสร็จสิ้น!',
        description: `คิดวิเคราะห์สำเร็จในเวลา ${elapsed.toFixed(1)} วินาที`,
        fuseColor: '#74d9b4'
      })

    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'AbortError') {
        return
      }
      endAITask(false)
      setAiDrawer(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'เกิดข้อผิดพลาดในการประมวลผล'
      }))
      addToast({
        title: 'เกิดข้อผิดพลาดในการเรียก AI',
        description: err.message,
        fuseColor: '#ef4444'
      })
    }
  }

  // Apply AI Result to editor text
  const applyAiResult = useCallback((replacementText) => {
    if (!replacementText) return
    if (selection.text && selection.end > selection.start) {
      const full = currentPageText
      const before = full.substring(0, selection.start)
      const after = full.substring(selection.end)
      updateCurrentPageText(before + replacementText + after)
    } else {
      updateCurrentPageText(replacementText)
    }

    setAiDrawer(prev => ({ ...prev, isOpen: false }))
    addToast({
      title: 'นำข้อความที่ขัดเกลาไปใช้แล้ว!',
      description: 'เนื้อหาในหน้ากระดาษได้รับการอัปเดตเรียบร้อย',
      fuseColor: '#74d9b4'
    })
  }, [selection, currentPageText, updateCurrentPageText, addToast])

  return (
    <AppContext.Provider
      value={{
        // Routing & Views
        currentView,
        setCurrentView,
        navigateTo,

        // Novels Collection
        novels,
        setNovels,
        activeNovelId,
        setActiveNovelId,
        activeNovel,
        createNovel,
        deleteNovel,
        openNovel,

        // Current Active Novel Metadata
        novelTitle, setNovelTitle,
        genre, setGenre,
        pov, setPov,

        // Chapters & Pages
        chapters, setChapters,
        activeChapterId, setActiveChapterId,
        currentChapter,
        activePageIdx, setActivePageIdx,
        currentPageText,
        updateCurrentPageText,
        addChapter,
        addPage,
        deletePage,

        // Editor Settings & States
        paperTheme, setPaperTheme,
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        isFocusMode, setIsFocusMode,
        leftSidebarOpen, setLeftSidebarOpen,
        rightSidebarOpen, setRightSidebarOpen,
        editorialCheckOpen, setEditorialCheckOpen,
        toggleEditorialCheck: () => setEditorialCheckOpen(prev => !prev),
        selection, setSelection,

        // Trix & Plans
        trixBalance, setTrixBalance,
        plan, setPlan,
        claimDailyTrix,
        lastDailyClaim,
        deductTrix,
        upgradePlanPrototype,

        // Modals & Navigation
        activeModal, setActiveModal,

        // Story Lore Data
        characters, setCharacters,
        customDictionary, setCustomDictionary,
        personas, setPersonas,
        activePersonaId, setActivePersonaId,
        skills, setSkills,
        customSkillPrompt, setCustomSkillPrompt,
        snapshots,

        // Auto Save Status (2.5s debounced)
        saveStatus,

        // Global AI Lock & Anti-Spam (Requirement 1)
        isAIProcessing,
        activeAITool,
        startAITask,
        endAITask,
        cancelAITask,

        // AI Engine
        aiDrawer, setAiDrawer,
        triggerAiTask,
        applyAiResult,

        // Settings
        settings, setSettings,

        // Onboarding Tour
        isTourOpen, setIsTourOpen,
        tourStep, setTourStep,
        startTour,
        completeTour,
        skipTour,

        // SwipeToast
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
