import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import { getTierInfo, checkPlanTransition, getTrialCountdown, PLAN_TIERS } from '../lib/subscription'
import { safeLocalStorageSet, safeLocalStorageGet, safeLocalStorageGetJSON } from '../lib/safeStorage'

const AppContext = createContext(null)

const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

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
  const { user, profile, session, loading: authLoading, oauthError, clearOAuthError } = useAuth()

  // Navigation / Views: 'home' | 'workspace_home' | 'studio'
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase()
      if (path === '/test-ai' || path === '/test') return 'test_ai'
      if (path.startsWith('/story/')) return 'story_detail'
      if (path.startsWith('/read/')) return 'reader'
      if (path === '/read') return 'read'
      if (path === '/workspace' || path === '/studio') return 'studio'
      if (path === '/home-workspace' || path === '/workspace-home') return 'workspace_home'
      if (path === '/home' || path === '/') return 'home'
    }
    return 'home'
  })

  // Public Reader Active Story ID & Target Chapter
  const [activeReadStoryId, setActiveReadStoryId] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/(?:story|read)\/([^\/]+)/i)
      if (match) return match[1]
    }
    return ''
  })
  const [activeReadChapterIdx, setActiveReadChapterIdx] = useState(null)

  // Modals & Drawers
  const [activeModal, setRawActiveModal] = useState(null)

  const addToastRef = useRef(null)

  const setActiveModal = useCallback((modalName) => {
    const AUTH_ONLY_MODALS = new Set([
      'settings',
      'publish',
      'import',
      'apiTest',
      'characterBible',
      'stylePersona',
      'dictionary',
      'history',
      'skills',
      'export'
    ])
    if (modalName && AUTH_ONLY_MODALS.has(modalName) && !user?.id) {
      setRawActiveModal('auth')
      addToastRef.current?.({
        title: 'ต้องเข้าสู่ระบบก่อนใช้งาน 🔒',
        description: 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนจึงจะใช้งานฟีเจอร์นี้ได้',
        fuseColor: '#ff7fa0'
      })
      return
    }
    setRawActiveModal(modalName)
  }, [user?.id])

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

  // Reset body overflow when activeModal opens/closes
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeModal])

  const navigateTo = useCallback((view, payload) => {
    let targetView = view
    let targetPath = '/home'

    if (view === 'studio') {
      targetView = 'studio'
      targetPath = '/workspace'
    } else if (view === 'workspace_home' || view === 'workspace') {
      targetView = 'workspace_home'
      targetPath = '/home-workspace'
    } else if (view === 'story_detail') {
      targetView = 'story_detail'
      let sid = typeof payload === 'object' ? payload?.storyId : payload
      sid = sid || activeReadStoryId
      if (sid) setActiveReadStoryId(sid)
      targetPath = sid ? `/story/${sid}` : '/home'
    } else if (view === 'reader' || (view === 'read' && payload)) {
      targetView = 'reader'
      let sid = typeof payload === 'object' ? payload?.storyId : payload
      sid = sid || activeReadStoryId
      if (sid) setActiveReadStoryId(sid)
      if (typeof payload === 'object' && typeof payload?.chapterIdx === 'number') {
        setActiveReadChapterIdx(payload.chapterIdx)
      } else {
        setActiveReadChapterIdx(null)
      }
      targetPath = sid ? `/read/${sid}` : '/read'
    } else if (view === 'test_ai' || view === 'test') {
      targetView = 'test_ai'
      targetPath = '/test-ai'
    } else if (view === 'read') {
      targetView = 'read'
      targetPath = '/read'
    } else {
      targetView = 'home'
      targetPath = '/home'
    }

    // Always dismiss any open overlay/modal/drawer when changing view
    setActiveModal(null)
    setAiDrawer(prev => ({ ...prev, isOpen: false, loading: false }))
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }

    setCurrentView(targetView)

    if (typeof window !== 'undefined') {
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view: targetView }, '', targetPath)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeReadStoryId])

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase()
      if (path.startsWith('/story/')) {
        const sid = window.location.pathname.split('/story/')[1]?.split('/')[0]
        if (sid) setActiveReadStoryId(sid)
        setCurrentView('story_detail')
      } else if (path.startsWith('/read/')) {
        const sid = window.location.pathname.split('/read/')[1]?.split('/')[0]
        if (sid) setActiveReadStoryId(sid)
        setCurrentView('reader')
      } else if (path === '/test-ai' || path === '/test') {
        setCurrentView('test_ai')
      } else if (path === '/read') {
        setCurrentView('read')
      } else if (path === '/workspace' || path === '/studio') {
        setCurrentView('studio')
      } else if (path === '/home-workspace' || path === '/workspace-home') {
        setCurrentView('workspace_home')
      } else {
        setCurrentView('home')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Novels List & Active Novel (only populated when user is authenticated)
  const [novels, setNovels] = useState([])
  const [activeNovelId, setActiveNovelId] = useState('')
  const activeNovel = useMemo(() => {
    if (!novels || novels.length === 0) return null
    return novels.find(n => n.id === activeNovelId) || novels[0] || null
  }, [novels, activeNovelId])

  // Novel Metadata
  const [novelTitle, setNovelTitle] = useState('')
  const [genre, setGenre] = useState('แฟนตาซี / กำลังภายใน')
  const [pov, setPov] = useState('บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)')

  // Chapters & Content for current active novel
  const [chapters, setChapters] = useState([])
  const [activeChapterId, setActiveChapterId] = useState('')
  const [activePageIdx, setActivePageIdx] = useState(0)

  // Current Chapter helper
  const currentChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return { pages: [''] }
    return chapters.find(c => c.id === activeChapterId) || chapters[0] || { pages: [''] }
  }, [chapters, activeChapterId])
  const currentPageText = currentChapter?.pages?.[activePageIdx] || ''

  // Editor Appearance & Behavior
  const [paperTheme, setPaperTheme] = useState(() => localStorage.getItem('plottrix_paper_theme') || 'midnight')
  useEffect(() => {
    safeLocalStorageSet('plottrix_paper_theme', paperTheme)
  }, [paperTheme])

  // Global App Theme: 'dark' | 'light' | 'system'
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem('plottrix_app_theme') || 'dark')
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    const apply = (th) => {
      let isDark = true
      if (th === 'light') {
        isDark = false
      } else if (th === 'system') {
        isDark = Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      } else {
        isDark = true
      }
      if (isDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }

    apply(appTheme)
    safeLocalStorageSet('plottrix_app_theme', appTheme)

    if (appTheme === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const h = () => apply('system')
      mq.addEventListener('change', h)
      return () => mq.removeEventListener('change', h)
    }
  }, [appTheme])
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('thai')
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [editorialCheckOpen, setEditorialCheckOpen] = useState(false)
  const [selection, setSelection] = useState({ text: '', start: 0, end: 0 })

  // Trix Economy & Plans (reset cleanly when unauthenticated)
  const [trixBalance, setTrixBalance] = useState(0)
  const [plan, setPlan] = useState('Free Plan')
  const [planTier, setPlanTier] = useState('free')
  const [trialUsed, setTrialUsed] = useState(false)
  const [trialStartedAt, setTrialStartedAt] = useState(null)
  const [trialEndsAt, setTrialEndsAt] = useState(null)
  const [trialCountdown, setTrialCountdown] = useState('')
  const [lastDailyClaim, setLastDailyClaim] = useState('')

  // Characters & Story Bible
  const [characters, setCharacters] = useState([])

  // Custom Dictionary
  const [customDictionary, setCustomDictionary] = useState([])

  const [personas, setPersonas] = useState(DEFAULT_PERSONAS)
  const [activePersonaId, setActivePersonaId] = useState('persona-1')
  const [skills, setSkills] = useState(DEFAULT_SKILLS)
  const [customSkillPrompt, setCustomSkillPrompt] = useState(() => localStorage.getItem('plottrix_custom_skill_prompt') || '')

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('plottrix_settings')
      return saved ? JSON.parse(saved) : {
        notifySize: 'standard',
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

  // Global AI Lock & Anti-Spam
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [activeAITool, setActiveAITool] = useState(null)
  const aiLockRef = useRef(false)
  const aiCooldownRef = useRef(0)
  const abortControllerRef = useRef(null)

  // Snapshots (Version History)
  const [snapshots, setSnapshots] = useState([])

  // Debounced Auto-Save
  const [saveStatus, setSaveStatus] = useState('saved') // 'saving', 'saved', 'unsaved'
  const saveTimeoutRef = useRef(null)

  // SwipeToast System
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ title, description, icon, actionLabel, onAction, duration = 3800, fuseColor = '#c29aff', background = '#1a132e', color = '#f4efff' }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, title, description, icon, actionLabel, onAction, duration, fuseColor, background, color }])
  }, [])
  addToastRef.current = addToast

  const requireAuth = useCallback((actionDesc = 'เข้าถึงและใช้งานระบบนี้') => {
    if (user?.id) return true
    setRawActiveModal('auth')
    addToast({
      title: 'ต้องเข้าสู่ระบบก่อนใช้งาน 🔒',
      description: `กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนจึงจะ${actionDesc}ได้`,
      fuseColor: '#ff7fa0'
    })
    return false
  }, [user?.id, addToast])

  // Surface OAuth callback errors from redirect URL
  useEffect(() => {
    if (oauthError) {
      addToast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: oauthError,
        fuseColor: '#ff7fa0',
        duration: 6000
      })
      clearOAuthError()
    }
  }, [oauthError, clearOAuthError, addToast])

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
    if (typeof document !== 'undefined') document.body.style.overflow = ''
    safeLocalStorageSet('plottrix_tour_completed', 'true')
    addToast({
      title: 'ยินดีด้วย! คุณพร้อมเริ่มเขียนนิยายแล้ว',
      description: 'สามารถเปิดคู่มือแนะนำการใช้งานซ้ำได้จากเมนูการตั้งค่า',
      fuseColor: '#74d9b4'
    })
  }, [addToast])

  const skipTour = useCallback(() => {
    setIsTourOpen(false)
    if (typeof document !== 'undefined') document.body.style.overflow = ''
    safeLocalStorageSet('plottrix_tour_completed', 'true')
  }, [])

  // First time tour trigger (only when authenticated inside Workspace Home)
  useEffect(() => {
    if (!user?.id) return
    const done = localStorage.getItem('plottrix_tour_completed')
    if (!done && currentView === 'workspace_home') {
      const timer = setTimeout(() => {
        setIsTourOpen(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [currentView, user?.id])

  // Wipe private user state cleanly whenever user is logged out
  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setNovels([])
      setActiveNovelId('')
      setNovelTitle('')
      setGenre('แฟนตาซี / กำลังภายใน')
      setPov('บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)')
      setChapters([])
      setActiveChapterId('')
      setActivePageIdx(0)
      setCharacters([])
      setCustomDictionary([])
      setSnapshots([])
      setTrixBalance(0)
      setPlan('Free Plan')
      setPlanTier('free')
      setTrialUsed(false)
      setTrialStartedAt(null)
      setTrialEndsAt(null)
      setTrialCountdown('')
      setLastDailyClaim('')
      setIsTourOpen(false)
    }
  }, [authLoading, user?.id])

  // Persist private data to localStorage ONLY for authenticated sessions
  useEffect(() => {
    if (!user?.id) return
    try {
      // Create lightweight copy to protect localStorage 5MB origin quota
      const sanitized = novels.map(n => {
        let cover = n.cover || n.cover_url || ''
        let coverImages = Array.isArray(n.cover_images) ? [...n.cover_images] : []

        // If an image string exceeds 80KB in offline cache, truncate or fallback
        if (cover && cover.length > 80000) {
          cover = cover.startsWith('data:') ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80' : cover
        }
        coverImages = coverImages.map(img => {
          if (img && img.length > 80000) {
            return img.startsWith('data:') ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80' : img
          }
          return img
        })

        return {
          ...n,
          cover,
          cover_url: cover,
          cover_images: coverImages
        }
      })

      safeLocalStorageSet('plottrix_novels', sanitized)
    } catch (err) {
      console.warn('[AppContext] Safe storage fallback for novels:', err?.message)
      const miniNovels = novels.map(n => ({
        id: n.id,
        title: n.title,
        genre: n.genre,
        pov: n.pov,
        synopsis: n.synopsis,
        is_published: n.is_published,
        chapterCount: n.chapters ? n.chapters.length : (n.chapterCount || 0),
        updatedAt: n.updatedAt
      }))
      safeLocalStorageSet('plottrix_novels', miniNovels)
    }
  }, [novels, user?.id])

  useEffect(() => {
    if (!user?.id) return
    safeLocalStorageSet('plottrix_characters', characters)
  }, [characters, user?.id])

  useEffect(() => {
    if (!user?.id) return
    safeLocalStorageSet('plottrix_dictionary', customDictionary)
  }, [customDictionary, user?.id])

  useEffect(() => {
    if (!user?.id) return
    safeLocalStorageSet('plottrix_snapshots', snapshots)
  }, [snapshots, user?.id])

  useEffect(() => {
    if (!user?.id) return
    safeLocalStorageSet('plottrix_trix', trixBalance.toString())
  }, [trixBalance, user?.id])

  useEffect(() => {
    if (!user?.id) return
    safeLocalStorageSet('plottrix_plan', plan)
  }, [plan, user?.id])

  useEffect(() => {
    if (!user?.id) return
    safeLocalStorageSet('plottrix_plan_tier', planTier)
  }, [planTier, user?.id])

  useEffect(() => {
    if (!user?.id) return
    safeLocalStorageSet('plottrix_trial_used', String(trialUsed))
  }, [trialUsed, user?.id])

  useEffect(() => {
    if (!user?.id) return
    if (trialStartedAt) safeLocalStorageSet('plottrix_trial_started_at', trialStartedAt)
    else { try { localStorage.removeItem('plottrix_trial_started_at') } catch {} }
  }, [trialStartedAt, user?.id])

  useEffect(() => {
    if (!user?.id) return
    if (trialEndsAt) safeLocalStorageSet('plottrix_trial_ends_at', trialEndsAt)
    else { try { localStorage.removeItem('plottrix_trial_ends_at') } catch {} }
  }, [trialEndsAt, user?.id])

  useEffect(() => {
    safeLocalStorageSet('plottrix_settings', settings)
  }, [settings])

  useEffect(() => {
    safeLocalStorageSet('plottrix_custom_skill_prompt', customSkillPrompt)
  }, [customSkillPrompt])

  // =========================================================================
  // SUPABASE REAL-TIME DATABASE PERSISTENCE & SYNC
  // =========================================================================

  // Sync profile data (trix balance, plan, plan_tier, trial metadata)
  useEffect(() => {
    if (profile) {
      if (typeof profile.trix_balance === 'number') {
        setTrixBalance(profile.trix_balance)
      }
      if (profile.trial_used !== undefined && profile.trial_used !== null) {
        setTrialUsed(Boolean(profile.trial_used))
      }
      if (profile.trial_started_at) {
        setTrialStartedAt(profile.trial_started_at)
      }
      if (profile.trial_ends_at) {
        setTrialEndsAt(profile.trial_ends_at)
      }
      if (profile.plan_tier) {
        setPlanTier(profile.plan_tier)
        if (profile.plan_tier === 'pro_trial') {
          setPlan('Pro Plan++')
        } else if (profile.plan_tier === 'pro') {
          setPlan('Pro Plan++')
        } else if (profile.plan_tier === 'ultra') {
          setPlan('Ultra Plan')
        } else {
          setPlan('Free Plan')
        }
      } else if (profile.plan) {
        setPlan(profile.plan)
        const t = getTierInfo(profile.plan)
        setPlanTier(t.id)
      }
      if (profile.last_claim_date) {
        setLastDailyClaim(profile.last_claim_date)
      }
    }
  }, [profile])

  // Load User Data from Supabase
  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    async function loadUserData() {
      try {
        // 1. Fetch Novels
        const { data: dbNovels, error: novelsErr } = await supabase
          .from('novels')
          .select('id, title, genre, pov, synopsis, author_display_name, is_published, published_at, published_arc, published_snapshot, publish_history, cover_url, cover_images, tags, view_count, follower_count, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!isMounted) return

        if (novelsErr) {
          console.warn('[AppContext] Notice loading user novels:', novelsErr.message)
        }

        if (dbNovels && dbNovels.length > 0) {
          // Fetch chapter stats (count & word count) for all user's novels
          const novelIds = dbNovels.map(n => n.id)
          const chapterStatsMap = {}
          if (novelIds.length > 0) {
            try {
              const { data: allChs } = await supabase
                .from('chapters')
                .select('id, novel_id, word_count, pages')
                .in('novel_id', novelIds)

              if (allChs) {
                allChs.forEach(ch => {
                  if (!chapterStatsMap[ch.novel_id]) {
                    chapterStatsMap[ch.novel_id] = { count: 0, words: 0 }
                  }
                  chapterStatsMap[ch.novel_id].count += 1
                  let chWords = ch.word_count || 0
                  if (!chWords && ch.pages) {
                    const pagesArr = Array.isArray(ch.pages) ? ch.pages : [ch.pages]
                    const fullText = pagesArr.join(' ')
                    chWords = fullText.trim() ? fullText.trim().split(/\s+/).length : 0
                  }
                  chapterStatsMap[ch.novel_id].words += chWords
                })
              }
            } catch (statsErr) {
              console.warn('[AppContext] Could not fetch chapter stats:', statsErr)
            }
          }

          const mappedNovels = dbNovels.map(n => {
            const stats = chapterStatsMap[n.id] || { count: 0, words: 0 }
            return {
              id: n.id,
              title: n.title,
              genre: n.genre,
              pov: n.pov,
              synopsis: n.synopsis || '',
              author_display_name: n.author_display_name || '',
              is_published: Boolean(n.is_published),
              published_at: n.published_at || null,
              published_arc: n.published_arc || '',
              published_snapshot: n.published_snapshot || null,
              publish_history: Array.isArray(n.publish_history) ? n.publish_history : [],
              cover: n.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
              cover_images: Array.isArray(n.cover_images) && n.cover_images.length > 0 ? n.cover_images : [n.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80'],
              tags: Array.isArray(n.tags) ? n.tags : [],
              view_count: Number(n.view_count) || 0,
              follower_count: Number(n.follower_count) || 0,
              wordCount: stats.words,
              chapterCount: stats.count,
              updatedAt: new Date(n.updated_at || n.created_at).toLocaleDateString('th-TH'),
              chapters: [],
              characters: []
            }
          })

          setNovels(mappedNovels)

          if (mappedNovels.length > 0) {
            const firstNov = mappedNovels[0]
            setActiveNovelId(firstNov.id)
            setNovelTitle(firstNov.title)
            setGenre(firstNov.genre)
            setPov(firstNov.pov)

            // Load chapters for first novel
            const { data: dbChapters } = await supabase
              .from('chapters')
              .select('*')
              .eq('novel_id', firstNov.id)
              .order('chapter_number', { ascending: true })

            if (isMounted && dbChapters) {
              const mappedChapters = dbChapters.map((c, i) => ({
                id: c.id,
                novel_id: firstNov.id,
                number: c.chapter_number || i + 1,
                title: c.title || `บทที่ ${c.chapter_number || i + 1}`,
                pages: Array.isArray(c.pages) ? c.pages : (typeof c.pages === 'string' ? JSON.parse(c.pages) : [''])
              }))
              setChapters(mappedChapters)
              setActiveChapterId(mappedChapters[0]?.id || '')
            }

            // Load characters for first novel
            const { data: dbChars } = await supabase
              .from('characters')
              .select('*')
              .eq('novel_id', firstNov.id)
              .order('created_at', { ascending: true })

            if (isMounted && dbChars) {
              setCharacters(dbChars.map(c => ({
                id: c.id,
                name: c.name,
                role: c.role || 'ตัวเอก',
                avatar: c.avatar_url || '',
                description: c.description || '',
                traits: c.traits || '',
                secrets: c.secrets || '',
                relations: c.speech_pattern || ''
              })))
            }

            // Load snapshots for first novel
            const { data: dbSnaps } = await supabase
              .from('version_history')
              .select('*')
              .eq('novel_id', firstNov.id)
              .order('created_at', { ascending: false })
              .limit(20)

            if (isMounted && dbSnaps) {
              setSnapshots(dbSnaps.map(s => ({
                id: s.id,
                timestamp: new Date(s.created_at).toLocaleString('th-TH'),
                label: s.summary || 'จุดย้อนกลับ',
                preview: s.content || ''
              })))
            }
          } else {
            // User has 0 novels in database
            setActiveNovelId('')
            setNovelTitle('')
            setChapters([])
            setActiveChapterId('')
            setCharacters([])
            setSnapshots([])
          }
        }

        // 2. Load Custom Dictionary
        const { data: dbDict } = await supabase
          .from('custom_dictionary')
          .select('word')
          .eq('user_id', user.id)

        if (isMounted && dbDict) {
          setCustomDictionary(dbDict.map(d => d.word))
        }

      } catch (err) {
        console.error('Error loading Supabase user data:', err)
      }
    }

    loadUserData()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Open novel handler & fetch its chapters, characters, and history from DB
  const openNovel = useCallback(async (id) => {
    if (!requireAuth('เปิดดูหรือแก้ไขนิยาย')) return
    const target = novels.find(n => n.id === id)
    if (target) {
      setActiveNovelId(target.id)
      setNovelTitle(target.title || '')
      setGenre(target.genre || 'แฟนตาซี / กำลังภายใน')
      setPov(target.pov || 'บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)')

      if (user?.id) {
        // Fetch chapters from Supabase
        const { data: chData } = await supabase
          .from('chapters')
          .select('*')
          .eq('novel_id', target.id)
          .order('chapter_number', { ascending: true })

        const loadedChapters = (chData && chData.length > 0)
          ? chData.map((c, i) => ({
              id: c.id,
              novel_id: target.id,
              number: c.chapter_number || i + 1,
              title: c.title || `บทที่ ${c.chapter_number || i + 1}`,
              pages: Array.isArray(c.pages) ? c.pages : (typeof c.pages === 'string' ? JSON.parse(c.pages) : [''])
            }))
          : (target.chapters || [])

        setChapters(loadedChapters)
        setActiveChapterId(loadedChapters[0]?.id || '')
        setActivePageIdx(0)

        // Fetch characters from Supabase
        const { data: charData } = await supabase
          .from('characters')
          .select('*')
          .eq('novel_id', target.id)
          .order('created_at', { ascending: true })

        if (charData) {
          setCharacters(charData.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role || 'ตัวเอก',
            avatar: c.avatar_url || '',
            description: c.description || '',
            traits: c.traits || '',
            secrets: c.secrets || '',
            relations: c.speech_pattern || ''
          })))
        }

        // Fetch snapshots from Supabase
        const { data: snapData } = await supabase
          .from('version_history')
          .select('*')
          .eq('novel_id', target.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (snapData) {
          setSnapshots(snapData.map(s => ({
            id: s.id,
            timestamp: new Date(s.created_at).toLocaleString('th-TH'),
            label: s.summary || 'จุดย้อนกลับ',
            preview: s.content || ''
          })))
        }
      } else {
        setChapters(target.chapters || [])
        setActiveChapterId(target.chapters?.[0]?.id || '')
        setActivePageIdx(0)
        setCharacters(target.characters || [])
      }
    }
    navigateTo('studio')
  }, [novels, user?.id, navigateTo, requireAuth])

  // Save chapters with 1.8s debounce and update saveStatus
  const updateCurrentPageText = useCallback((newText) => {
    if (!user?.id) return
    setSaveStatus('saving')

    let updatedPages = []
    setChapters(prev => {
      const updated = prev.map(ch => {
        if (ch.id === activeChapterId) {
          const newPages = [...ch.pages]
          newPages[activePageIdx] = newText
          updatedPages = newPages
          return { ...ch, pages: newPages }
        }
        return ch
      })

      // Sync back to active novel with real word count and chapter count
      setNovels(allNovs => allNovs.map(n => {
        if (n.id === activeNovelId) {
          const totalWords = updated.reduce((sum, ch) => {
            const fullChText = (ch.pages || []).join(' ')
            return sum + (fullChText.trim() ? fullChText.trim().split(/\s+/).length : 0)
          }, 0)
          return {
            ...n,
            chapters: updated,
            chapterCount: updated.length,
            wordCount: totalWords,
            updatedAt: 'บันทึกเมื่อสักครู่'
          }
        }
        return n
      }))
      return updated
    })

    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      if (user?.id) {
        try {
          const totalWords = (newText || '').trim() ? (newText || '').trim().split(/\s+/).length : 0
          if (isUuid(activeChapterId)) {
            const { error } = await supabase
              .from('chapters')
              .update({
                pages: updatedPages.length > 0 ? updatedPages : [newText],
                word_count: totalWords,
                updated_at: new Date().toISOString()
              })
              .eq('id', activeChapterId)

            if (error) {
              console.warn('Auto-save warning (Supabase):', error.message)
            }
          } else if (isUuid(activeNovelId)) {
            // Chapter has a client-generated ID; insert it to DB to get permanent UUID
            const { data: newCh, error: insErr } = await supabase
              .from('chapters')
              .insert({
                novel_id: activeNovelId,
                user_id: user.id,
                chapter_number: currentChapter?.number || 1,
                title: currentChapter?.title || 'บทที่ 1 — จุดเริ่มต้น',
                pages: updatedPages.length > 0 ? updatedPages : [newText],
                word_count: totalWords
              })
              .select()
              .single()

            if (!insErr && newCh) {
              setActiveChapterId(newCh.id)
              setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, id: newCh.id } : c))
            }
          }
        } catch (err) {
          console.warn('Exception in auto-save:', err.message)
        }
      }
      setSaveStatus('saved')
    }, 1800)
  }, [user?.id, activeChapterId, activePageIdx, activeNovelId])

  // Create novel handler with Supabase persistence
  const FREE_PLAN_LIMIT = 3

  const createNovel = useCallback(async ({ title, genre: g, pov: p, synopsis, cover }) => {
    if (!requireAuth('สร้างนิยายเรื่องใหม่')) return false
    if (plan === 'Free Plan' && novels.length >= FREE_PLAN_LIMIT) {
      addToast({
        title: `โควต้า Free Plan จำกัด ${FREE_PLAN_LIMIT} เรื่อง`,
        description: 'กรุณาอัปเกรดเป็น Pro Plan++ เพื่อปลดล็อกการสร้างนิยายไม่จำกัด',
        actionLabel: 'อัปเกรดแผน',
        onAction: () => setActiveModal('pricing'),
        fuseColor: '#eab308'
      })
      setActiveModal('pricing')
      return false
    }

    const novelTitleToUse = title || 'นิยายเรื่องใหม่'
    const genreToUse = g || 'แฟนตาซี / กำลังภายใน'
    const povToUse = p || 'บุรุษที่ 3 (เขา/เธอ/ชื่อตัวละคร)'
    const coverToUse = cover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80'

    let novelId = `novel-${Date.now()}`
    let initialChapterId = `ch-${Date.now()}`

    if (user?.id) {
      try {
        const { data: novelRow, error: novelErr } = await supabase
          .from('novels')
          .insert({
            user_id: user.id,
            title: novelTitleToUse,
            genre: genreToUse,
            pov: povToUse,
            synopsis: synopsis || '',
            cover_url: coverToUse
          })
          .select()
          .single()

        if (novelErr) {
          console.error('Error creating novel in Supabase:', novelErr.message)
        } else if (novelRow) {
          novelId = novelRow.id

          const { data: chRow, error: chErr } = await supabase
            .from('chapters')
            .insert({
              novel_id: novelId,
              user_id: user.id,
              chapter_number: 1,
              title: 'บทที่ 1 — จุดเริ่มต้น',
              pages: [''],
              word_count: 0
            })
            .select()
            .single()

          if (chErr) {
            console.error('Error creating first chapter in Supabase:', chErr.message)
          } else if (chRow) {
            initialChapterId = chRow.id
          }
        }
      } catch (e) {
        console.error('Exception creating novel:', e)
      }
    }

    const firstChapter = {
      id: initialChapterId,
      novel_id: novelId,
      number: 1,
      title: 'บทที่ 1 — จุดเริ่มต้น',
      pages: ['']
    }

    const newNov = {
      id: novelId,
      title: novelTitleToUse,
      genre: genreToUse,
      pov: povToUse,
      synopsis: synopsis || '',
      cover: coverToUse,
      wordCount: 0,
      chapterCount: 1,
      updatedAt: 'วันนี้',
      chapters: [firstChapter],
      characters: []
    }

    setNovels(prev => [newNov, ...prev])
    setActiveNovelId(novelId)
    setNovelTitle(newNov.title)
    setGenre(newNov.genre)
    setPov(newNov.pov)
    setChapters([firstChapter])
    setActiveChapterId(initialChapterId)
    setActivePageIdx(0)
    setCharacters([])
    setSnapshots([])
    navigateTo('studio')

    addToast({
      title: `สร้างนิยาย "${newNov.title}" สำเร็จ!`,
      description: 'เปิดห้องสตูดิโอพร้อมให้คุณเริ่มเขียนแล้ว',
      fuseColor: '#74d9b4'
    })
    return true
  }, [user?.id, plan, novels.length, navigateTo, addToast, requireAuth])

  // Delete novel handler (supports deleting all novels down to 0)
  const deleteNovel = useCallback(async (id) => {
    if (!requireAuth('ลบนิยาย')) return
    if (user?.id && isUuid(id)) {
      supabase.from('novels').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Error deleting novel from Supabase:', error.message)
      })
    }

    setNovels(prev => {
      const remaining = prev.filter(n => n.id !== id)
      if (activeNovelId === id) {
        if (remaining.length > 0) {
          openNovel(remaining[0].id)
        } else {
          setActiveNovelId('')
          setNovelTitle('')
          setChapters([])
          setActiveChapterId('')
          setCharacters([])
          setSnapshots([])
        }
      }
      return remaining
    })
    addToast({ title: 'ลบนิยายออกจากคลังแล้ว', duration: 2500 })
  }, [user?.id, activeNovelId, openNovel, addToast, requireAuth])

  // Update novel metadata (title, genre, synopsis, cover)
  const updateNovel = useCallback(async (id, updates) => {
    if (!requireAuth('แก้ไขข้อมูลนิยาย')) return
    if (user?.id) {
      const dbPayload = {}
      if (updates.title) dbPayload.title = updates.title
      if (updates.genre) dbPayload.genre = updates.genre
      if (updates.pov) dbPayload.pov = updates.pov
      if (updates.synopsis !== undefined) dbPayload.synopsis = updates.synopsis
      if (updates.cover) dbPayload.cover_url = updates.cover
      if (updates.cover_images !== undefined) dbPayload.cover_images = updates.cover_images
      if (updates.tags !== undefined) dbPayload.tags = updates.tags
      dbPayload.updated_at = new Date().toISOString()

      supabase.from('novels').update(dbPayload).eq('id', id).then(({ error }) => {
        if (error) console.error('Error updating novel in Supabase:', error.message)
      })
    }

    setNovels(prev => {
      const next = prev.map(n => {
        if (n.id === id) {
          return {
            ...n,
            ...updates,
            updatedAt: 'แก้ไขเมื่อสักครู่'
          }
        }
        return n
      })
      return next
    })

    if (activeNovelId === id) {
      if (updates.title) setNovelTitle(updates.title)
      if (updates.genre) setGenre(updates.genre)
      if (updates.pov) setPov(updates.pov)
    }
    addToast({ title: 'บันทึกการตั้งค่านิยายสำเร็จ!', duration: 2000, fuseColor: '#a855f7' })
  }, [user?.id, activeNovelId, addToast, requireAuth])

  // Real-time 3-Day Pro Trial Countdown & Auto-Expiration
  useEffect(() => {
    if (planTier !== 'pro_trial' || !trialEndsAt) {
      if (planTier !== 'pro_trial') {
        setTrialCountdown('')
      }
      return
    }

    const checkExpiration = () => {
      const countdown = getTrialCountdown(trialEndsAt)
      setTrialCountdown(countdown.formatted)

      if (countdown.isExpired) {
        console.log('[Subscription] 3-Day Pro Trial has expired. Auto-reverting to Free Plan.')
        setPlanTier('free')
        setPlan('Free Plan')
        setTrialCountdown('หมดเวลาแล้ว')

        if (user?.id) {
          supabase.from('profiles').update({
            plan_tier: 'free',
            plan: 'Free Plan',
            updated_at: new Date().toISOString()
          }).eq('id', user.id).then(({ error }) => {
            if (error) console.warn('Error reverting expired trial in Supabase:', error.message)
          })
        }

        addToast({
          title: 'หมดเวลาทดลองใช้ Pro 3 วันแล้ว',
          description: 'ระบบได้ปรับระดับบัญชีกลับเป็น Free Plan ตามปกติ ขอบคุณที่ร่วมทดลองใช้!',
          fuseColor: '#eab308',
          duration: 6000
        })
      }
    }

    checkExpiration()
    const timer = setInterval(checkExpiration, 1000)
    return () => clearInterval(timer)
  }, [planTier, trialEndsAt, user?.id, addToast])

  // Activate One-Time 3-Day Free Trial of Pro Plan
  const activateProTrial = useCallback(async () => {
    if (!requireAuth('รับสิทธิ์ทดลองใช้ Pro ฟรี 3 วัน')) return false
    if (trialUsed) {
      addToast({
        title: 'คุณเคยใช้สิทธิ์ทดลองใช้ Pro 3 วันไปแล้ว',
        description: 'สิทธิ์ทดลองใช้งานฟรี 72 ชั่วโมงสามารถเปิดใช้งานได้เพียง 1 ครั้งต่อบัญชีเท่านั้น',
        fuseColor: '#ef4444',
        duration: 4000
      })
      return false
    }

    if (planTier === 'pro' || planTier === 'ultra') {
      addToast({
        title: 'คุณกำลังใช้งานแพลนที่สูงกว่าอยู่แล้ว',
        description: `บัญชีของคุณอยู่ในระดับ ${plan} เรียบร้อยแล้ว`,
        fuseColor: '#a855f7',
        duration: 3500
      })
      return false
    }

    const now = new Date()
    const ends = new Date(now.getTime() + 72 * 60 * 60 * 1000) // 72 hours
    const startIso = now.toISOString()
    const endIso = ends.toISOString()

    setPlanTier('pro_trial')
    setPlan('Pro Plan++')
    setTrialUsed(true)
    setTrialStartedAt(startIso)
    setTrialEndsAt(endIso)
    setTrialCountdown('2 วัน 23 ชม. 59 นาที')

    // Persist to Supabase
    if (user?.id) {
      supabase.from('profiles').update({
        plan_tier: 'pro_trial',
        plan: 'Pro Plan++',
        trial_used: true,
        trial_started_at: startIso,
        trial_ends_at: endIso,
        updated_at: startIso
      }).eq('id', user.id).then(({ error }) => {
        if (error) {
          console.warn('Supabase update warning (fallback to plan):', error.message)
          // Fallback if specific columns are not yet in remote table
          supabase.from('profiles').update({
            plan: 'Pro Plan++',
            updated_at: startIso
          }).eq('id', user.id)
        }
      })

      supabase.from('trix_transactions').insert({
        user_id: user.id,
        amount: 0,
        type: 'bonus',
        action: 'เปิดใช้งานทดลองใช้ Pro ฟรี 3 วัน'
      }).then(({ error }) => {
        if (error) console.warn('Transaction log note:', error.message)
      })
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#6366f1', '#ec4899', '#38bdf8']
    })

    addToast({
      title: 'เปิดใช้งาน Pro Plan ฟรี 3 วันสำเร็จ! 🎉',
      description: 'ปลดล็อกเครื่องมือระดับ Pro ทุกฟังก์ชันตลอด 72 ชั่วโมงข้างหน้า',
      fuseColor: '#c084fc',
      duration: 5000
    })

    return true
  }, [trialUsed, planTier, plan, user?.id, addToast, requireAuth])

  // Change Plan Handler with Strict No-Downgrade & Paid Plan Protection
  const changePlan = useCallback(async (targetPlanNameOrTier) => {
    if (!requireAuth('เลือกแพ็กเกจสมาชิก')) return false
    const targetTier = getTierInfo(targetPlanNameOrTier)
    const currentTier = getTierInfo(planTier || plan)

    // 1. Strict No-Downgrade Policy
    const transition = checkPlanTransition(currentTier.id, targetTier.id)
    if (!transition.allowed) {
      addToast({
        title: 'ไม่สามารถลดระดับแพลนได้',
        description: transition.reason,
        fuseColor: '#ef4444',
        duration: 4500
      })
      return false
    }

    // 2. Paid Plan Gate: Cannot activate paid plans instantly for free
    if (targetTier.id === 'pro' || targetTier.id === 'ultra') {
      addToast({
        title: 'ระบบชำระเงินกำลังเปิดให้บริการเร็วๆ นี้',
        description: `แพ็กเกจ ${targetTier.displayName} ต้องชำระเงินผ่านระบบ Payment Gateway ซึ่งกำลังเปิดให้บริการในเร็วๆ นี้`,
        fuseColor: '#eab308',
        duration: 4500
      })
      return false
    }

    return false
  }, [planTier, plan, addToast, requireAuth])

  // Backward-compatible alias
  const upgradePlanPrototype = changePlan

  // Temporarily Disabled Trix Top-Up Handler
  const topupTrix = useCallback(() => {
    if (!requireAuth('เติมเหรียญ Trix')) return
    addToast({
      title: 'ปิดให้บริการเติมเหรียญชั่วคราว (เร็วๆ นี้)',
      description: 'ระบบเติมเหรียญ Trix อยู่ระหว่างเตรียมเชื่อมต่อกับ Payment Gateway ขออภัยในความไม่สะดวก',
      fuseColor: '#f59e0b',
      duration: 4000
    })
  }, [addToast, requireAuth])

  // Daily Trix Claim with Supabase Persistence
  const claimDailyTrix = useCallback(async () => {
    if (!requireAuth('รับเหรียญ Trix ประจำวัน')) return
    const today = new Date().toISOString().slice(0, 10)
    if (lastDailyClaim === today) {
      addToast({
        title: 'รับเหรียญ Trix วันนี้ไปแล้ว',
        description: 'กลับมารับฟรีใหม่อีกครั้งในวันพรุ่งนี้ (+3 Trix)',
        fuseColor: '#e9c78c'
      })
      return
    }

    const newBal = trixBalance + 3
    setTrixBalance(newBal)
    setLastDailyClaim(today)
    safeLocalStorageSet('plottrix_last_claim', today)

    if (user?.id) {
      supabase
        .from('profiles')
        .update({ trix_balance: newBal, last_claim_date: today, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('Error updating daily claim in profile:', error.message)
        })

      supabase
        .from('trix_transactions')
        .insert({
          user_id: user.id,
          amount: 3,
          type: 'claim',
          action: 'รับ Trix รายวัน'
        })
        .then(({ error }) => {
          if (error) console.error('Error logging daily claim transaction:', error.message)
        })
    }

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
  }, [lastDailyClaim, trixBalance, user?.id, addToast, requireAuth])

  // Deduct Trix helper with Supabase Persistence
  const deductTrix = useCallback(async (cost, reason) => {
    if (!user?.id) return false
    if (trixBalance < cost) return false
    const newBal = trixBalance - cost
    setTrixBalance(newBal)

    if (user?.id) {
      supabase
        .from('profiles')
        .update({ trix_balance: newBal, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('Error updating trix balance in DB:', error.message)
        })

      supabase
        .from('trix_transactions')
        .insert({
          user_id: user.id,
          amount: -cost,
          type: 'deduct',
          action: reason || 'AI Execution'
        })
        .then(({ error }) => {
          if (error) console.error('Error logging deduction in DB:', error.message)
        })
    }

    addToast({
      title: `หัก ${cost} Trix (${reason})`,
      description: `คงเหลือ ${newBal} Trix`,
      duration: 3000,
      fuseColor: '#c29aff'
    })
    return true
  }, [trixBalance, user?.id, addToast])

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
    const cooldownMs = plan === 'Free Plan' ? 4000 : 1500
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

  // Add Chapter with DB persistence
  const addChapter = useCallback(async () => {
    if (!requireAuth('เพิ่มตอนใหม่')) return
    const newNumber = chapters.length + 1
    let newId = `ch-${Date.now()}`
    const chapterTitle = `บทที่ ${newNumber} — ตอนใหม่`
    const defaultPages = ['']

    if (user?.id && activeNovelId) {
      try {
        const { data, error } = await supabase
          .from('chapters')
          .insert({
            novel_id: activeNovelId,
            user_id: user.id,
            chapter_number: newNumber,
            title: chapterTitle,
            pages: defaultPages,
            word_count: 0
          })
          .select()
          .single()

        if (error) {
          console.error('Error inserting chapter in Supabase:', error.message)
        } else if (data) {
          newId = data.id
        }
      } catch (err) {
        console.error('Exception creating chapter:', err)
      }
    }

    const newCh = {
      id: newId,
      novel_id: activeNovelId,
      number: newNumber,
      title: chapterTitle,
      pages: defaultPages
    }

    setChapters(prev => [...prev, newCh])
    setActiveChapterId(newId)
    setActivePageIdx(0)
    addToast({
      title: `สร้างบทที่ ${newNumber} สำเร็จ`,
      description: 'เปิดหน้ากระดาษใหม่พร้อมให้คุณลุยต่อ',
      fuseColor: '#74d9b4'
    })
  }, [user?.id, activeNovelId, chapters.length, addToast])

  // Reorder Chapters with DB persistence
  const reorderChapters = useCallback(async (fromIdx, toIdx) => {
    if (!requireAuth('เรียงลำดับตอน')) return
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return
    setChapters(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      const renumbered = next.map((ch, idx) => ({
        ...ch,
        number: idx + 1,
        code: `บทที่ ${String(idx + 1).padStart(2, '0')}`
      }))

      if (user?.id) {
        renumbered.forEach(ch => {
          if (isUuid(ch.id)) {
            supabase
              .from('chapters')
              .update({ chapter_number: ch.number, updated_at: new Date().toISOString() })
              .eq('id', ch.id)
              .then(({ error }) => {
                if (error) console.warn('Error updating chapter order:', error.message)
              })
          }
        })
      }

      setNovels(all => all.map(n => n.id === activeNovelId ? { ...n, chapters: renumbered } : n))
      return renumbered
    })
    addToast({ title: 'สลับลำดับตอนเรียบร้อยแล้ว ✓', duration: 1800 })
  }, [user?.id, activeNovelId, addToast])

  // Delete Chapter (Supports true 0-item state down to 0 chapters)
  const deleteChapter = useCallback(async (chId) => {
    if (!requireAuth('ลบตอน')) return
    if (user?.id && isUuid(chId)) {
      supabase.from('chapters').delete().eq('id', chId).then(({ error }) => {
        if (error) console.warn('Error deleting chapter from Supabase:', error.message)
      })
    }

    setChapters(prev => {
      const remaining = prev.filter(c => c.id !== chId).map((ch, idx) => ({
        ...ch,
        number: idx + 1,
        code: `บทที่ ${String(idx + 1).padStart(2, '0')}`
      }))

      if (remaining.length === 0) {
        setActiveChapterId('')
        setActivePageIdx(0)
      } else if (activeChapterId === chId) {
        setActiveChapterId(remaining[0].id)
        setActivePageIdx(0)
      }

      setNovels(all => all.map(n => n.id === activeNovelId ? { ...n, chapters: remaining, chapterCount: remaining.length } : n))
      return remaining
    })
    addToast({ title: 'ลบตอนเรียบร้อยแล้ว', duration: 2000 })
  }, [user?.id, activeChapterId, activeNovelId, addToast])

  // Rename Chapter with DB persistence
  const renameChapter = useCallback(async (chId, newTitle) => {
    if (!requireAuth('เปลี่ยนชื่อตอน')) return
    if (!newTitle?.trim()) return
    const trimmed = newTitle.trim()

    if (user?.id && isUuid(chId)) {
      supabase
        .from('chapters')
        .update({ title: trimmed, updated_at: new Date().toISOString() })
        .eq('id', chId)
        .then(({ error }) => {
          if (error) console.warn('Error updating chapter title in Supabase:', error.message)
        })
    }

    setChapters(prev => {
      const updated = prev.map(ch => ch.id === chId ? { ...ch, title: trimmed } : ch)
      setNovels(all => all.map(n => n.id === activeNovelId ? { ...n, chapters: updated } : n))
      return updated
    })
    addToast({ title: 'เปลี่ยนชื่อตอนเรียบร้อย ✓', duration: 1800 })
  }, [user?.id, activeNovelId, addToast])

  // Add Page to current Chapter
  const addPage = useCallback(() => {
    if (!requireAuth('เพิ่มหน้ากระดาษ')) return
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
    if (!requireAuth('ลบหน้ากระดาษ')) return
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

  // Story Bible: Character CRUD with Supabase persistence
  const saveCharacter = useCallback(async (charData) => {
    if (!requireAuth('บันทึกข้อมูลตัวละคร')) return
    if (!charData?.name?.trim()) return

    const charToSave = {
      name: charData.name.trim(),
      role: charData.role || 'ตัวเอก',
      description: charData.description || '',
      traits: charData.traits || '',
      secrets: charData.secrets || '',
      speech_pattern: charData.speech_pattern || charData.relations || '',
      avatar_url: charData.avatar || charData.avatar_url || ''
    }

    if (user?.id && activeNovelId) {
      try {
        if (charData.id && !charData.id.startsWith('char-temp-') && !charData.id.startsWith('char-')) {
          const { data, error } = await supabase
            .from('characters')
            .update({
              ...charToSave,
              updated_at: new Date().toISOString()
            })
            .eq('id', charData.id)
            .select()
            .single()

          if (!error && data) {
            setCharacters(prev => prev.map(c => c.id === charData.id ? { ...c, ...data, avatar: data.avatar_url } : c))
            return
          }
        } else {
          const { data, error } = await supabase
            .from('characters')
            .insert({
              novel_id: activeNovelId,
              user_id: user.id,
              ...charToSave
            })
            .select()
            .single()

          if (!error && data) {
            setCharacters(prev => [...prev.filter(c => c.id !== charData.id), { ...data, avatar: data.avatar_url }])
            return
          }
        }
      } catch (err) {
        console.error('Exception saving character to Supabase:', err)
      }
    }

    // Local state fallback
    setCharacters(prev => {
      const existing = prev.find(c => c.id === charData.id)
      if (existing) {
        return prev.map(c => c.id === charData.id ? { ...c, ...charData } : c)
      }
      return [...prev, { id: charData.id || `char-${Date.now()}`, ...charData }]
    })
  }, [user?.id, activeNovelId])

  const deleteCharacterFromDb = useCallback(async (charId) => {
    if (!requireAuth('ลบตัวละคร')) return
    if (user?.id && charId && !charId.startsWith('char-')) {
      supabase
        .from('characters')
        .delete()
        .eq('id', charId)
        .then(({ error }) => {
          if (error) console.error('Error deleting character from Supabase:', error.message)
        })
    }
    setCharacters(prev => prev.filter(c => c.id !== charId))
  }, [user?.id])

  // Custom Dictionary CRUD with Supabase persistence
  const addCustomWord = useCallback(async (word, description = '') => {
    if (!requireAuth('เพิ่มคำศัพท์ในคลัง')) return
    if (!word?.trim()) return
    const trimmed = word.trim()

    if (user?.id) {
      supabase
        .from('custom_dictionary')
        .insert({ user_id: user.id, word: trimmed, description })
        .then(({ error }) => {
          if (error) console.error('Error inserting word to Supabase:', error.message)
        })
    }

    setCustomDictionary(prev => {
      if (prev.includes(trimmed)) return prev
      return [...prev, trimmed]
    })
  }, [user?.id])

  const deleteCustomWord = useCallback(async (word) => {
    if (!requireAuth('ลบคำศัพท์')) return
    if (user?.id) {
      supabase
        .from('custom_dictionary')
        .delete()
        .eq('user_id', user.id)
        .eq('word', word)
        .then(({ error }) => {
          if (error) console.error('Error deleting word from Supabase:', error.message)
        })
    }
    setCustomDictionary(prev => prev.filter(w => w !== word))
  }, [user?.id])

  // Version History Snapshot with Supabase persistence
  const saveSnapshot = useCallback(async (label, customPreview = null) => {
    if (!user?.id) return
    const preview = customPreview !== null ? customPreview : (currentPageText || 'ว่างเปล่า')
    const snapId = `snap-${Date.now()}`
    const timestamp = new Date().toLocaleString('th-TH')

    if (user?.id && activeNovelId) {
      supabase
        .from('version_history')
        .insert({
          chapter_id: activeChapterId && !activeChapterId.startsWith('ch-') ? activeChapterId : null,
          novel_id: activeNovelId && !activeNovelId.startsWith('novel-') ? activeNovelId : null,
          user_id: user.id,
          page_index: activePageIdx || 0,
          content: preview,
          summary: label || 'บันทึกจุดย้อนกลับ'
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting snapshot in Supabase:', error.message)
        })
    }

    const newSnap = {
      id: snapId,
      timestamp,
      label: label || 'จุดย้อนกลับใหม่',
      preview
    }
    setSnapshots(prev => [newSnap, ...prev])
  }, [user?.id, activeNovelId, activeChapterId, activePageIdx, currentPageText])

  // =========================================================================
  // REAL PRODUCTION AI ENGINE (ZERO MOCK DATA, REAL GEMINI ONLY)
  // =========================================================================

  const triggerAiTask = async (actionType, textToProcess = null) => {
    if (!requireAuth('เรียกใช้ผู้ช่วย AI')) return
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
      fullBook: 0,
      custom: 2
    }
    const cost = COSTS[actionType] !== undefined ? COSTS[actionType] : 1

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
        'วิเคราะห์ข้อความต้นฉบับอย่างเคร่งครัด',
        'แปลคำศัพท์และสำนวนวรรณกรรมอย่างตรงไปตรงมา',
        'ขัดเกลาไวยากรณ์ให้ถูกต้องโดยไม่ต่อเติมเนื้อหาเกินจริง'
      ],
      fullBook: [
        'อ่านโครงเรื่องภาพรวมทุกบทที่เขียน',
        'วิเคราะห์จังหวะการดำเนินเรื่อง (Pacing)',
        'ตรวจสอบพัฒนาการตัวละครและช่องโหว่พล็อต'
      ],
      custom: [
        'ประมวลผลคำสั่งพิเศษจากผู้ใช้',
        'ปรับแต่งเนื้อหาตามข้อกำหนด',
        'จัดเตรียมผลลัพธ์พร้อมใช้งาน'
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
      const token = session?.access_token || ''
      const res = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        signal: abortController.signal,
        body: JSON.stringify({
          actionType,
          payload: {
            text: targetText,
            genre,
            pov,
            persona: personas.find(p => p.id === activePersonaId)?.name,
            dictionary: customDictionary.map(d => typeof d === 'string' ? d : d.word),
            characters: characters.map(c => ({
              name: c.name,
              role: c.role,
              description: c.description,
              traits: c.traits,
              secrets: c.secrets
            })),
            customSkillPrompt: customSkillPrompt || undefined
          }
        })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const errMsg = errJson?.error?.message || errJson?.error || `HTTP ${res.status}: ไม่สามารถประมวลผลคำขอ AI ได้`
        throw new Error(errMsg)
      }

      const data = await res.json()
      if (!data || !data.result) {
        throw new Error('AI Engine ไม่ได้ส่งผลลัพธ์ที่ถูกต้องกลับมา')
      }

      const elapsed = (performance.now() - startTime) / 1000

      // Deduct Trix in DB and local state
      await deductTrix(cost, `AI ${actionType}`)

      // Create snapshot before applying result
      saveSnapshot(`ก่อนเรียก AI: ${actionType}`)

      setAiDrawer(prev => ({
        ...prev,
        loading: false,
        result: data.result,
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
        error: err.message || 'เกิดข้อผิดพลาดในการประมวลผลคำขอ AI'
      }))
      addToast({
        title: 'เกิดข้อผิดพลาดในการเรียก AI',
        description: err.message,
        fuseColor: '#ef4444'
      })
    }
  }

  // Apply AI Result to editor text safely without corrupting surrounding manuscript
  const applyAiResult = useCallback((replacementText) => {
    if (!replacementText) return
    const full = currentPageText || ''

    if (selection.text && selection.end > selection.start && full.substring(selection.start, selection.end) === selection.text) {
      const before = full.substring(0, selection.start)
      const after = full.substring(selection.end)
      updateCurrentPageText(before + replacementText + after)
    } else if (selection.text && full.includes(selection.text)) {
      const idx = full.indexOf(selection.text)
      const before = full.substring(0, idx)
      const after = full.substring(idx + selection.text.length)
      updateCurrentPageText(before + replacementText + after)
    } else if (full.trim().length === 0) {
      updateCurrentPageText(replacementText)
    } else {
      updateCurrentPageText(full + '\n\n' + replacementText)
    }

    setAiDrawer(prev => ({ ...prev, isOpen: false }))
    addToast({
      title: 'นำข้อความที่ขัดเกลาไปใช้แล้ว!',
      description: 'เนื้อหาในหน้ากระดาษได้รับการอัปเดตเรียบร้อย โดยรักษาเนื้อหาแวดล้อม 100%',
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
        activeReadStoryId,
        setActiveReadStoryId,
        activeReadChapterIdx,
        setActiveReadChapterIdx,

        // Novels Collection
        novels,
        setNovels,
        activeNovelId,
        setActiveNovelId,
        activeNovel,
        createNovel,
        updateNovel,
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
        reorderChapters,
        deleteChapter,
        renameChapter,
        addPage,
        deletePage,

        // Editor Settings & States
        appTheme, setAppTheme,
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
        planTier, setPlanTier,
        trialUsed,
        trialStartedAt,
        trialEndsAt,
        trialCountdown,
        activateProTrial,
        changePlan,
        topupTrix,
        claimDailyTrix,
        lastDailyClaim,
        deductTrix,
        upgradePlanPrototype,

        // Modals & Navigation
        activeModal, setActiveModal,

        // Story Lore Data
        characters, setCharacters,
        saveCharacter,
        deleteCharacterFromDb,
        customDictionary, setCustomDictionary,
        addCustomWord,
        deleteCustomWord,
        personas, setPersonas,
        activePersonaId, setActivePersonaId,
        skills, setSkills,
        customSkillPrompt, setCustomSkillPrompt,
        snapshots,
        saveSnapshot,

        // Auto Save Status (1.8s debounced)
        saveStatus,

        // Global AI Lock & Anti-Spam
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
