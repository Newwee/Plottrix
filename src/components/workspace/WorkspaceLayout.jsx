import React, { useEffect, Suspense, lazy } from 'react'
import { useApp } from '../../context/AppContext'
import AeroShardsCanvas from './AeroShardsCanvas'
import TopNavbar from './TopNavbar'
import LeftSidebar from './LeftSidebar'
import EditorialAssistantSidebar from './EditorialAssistantSidebar'
import VocabularySidebar from './VocabularySidebar'
import AiResultDrawer from './AiResultDrawer'

// Lazy loaded heavy components & Modals for optimum performance
const StudioEditor = lazy(() => import('./StudioEditor'))
const CharacterBibleModal = lazy(() => import('../modals/CharacterBibleModal'))
const StylePersonaModal = lazy(() => import('../modals/StylePersonaModal'))
const CustomDictionaryModal = lazy(() => import('../modals/CustomDictionaryModal'))
const VersionHistoryModal = lazy(() => import('../modals/VersionHistoryModal'))
const SkillManagerModal = lazy(() => import('../modals/SkillManagerModal'))
const ExportModal = lazy(() => import('../modals/ExportModal'))
const ApiTestModal = lazy(() => import('../modals/ApiTestModal'))

export default function WorkspaceLayout() {
  const {
    isFocusMode, setIsFocusMode,
    leftSidebarOpen, setLeftSidebarOpen,
    editorialCheckOpen, toggleEditorialCheck
  } = useApp()

  // Handle Escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode, setIsFocusMode])

  return (
    <div className="flex flex-col h-[100dvh] min-h-[100dvh] w-screen overflow-hidden bg-plottrix-bg text-plottrix-text relative font-thai">
      {/* 3D Ambient Background Shards */}
      <AeroShardsCanvas />

      {/* Top Pill Navbar */}
      {!isFocusMode && <TopNavbar />}

      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden relative z-10 px-2 sm:px-4 pb-2 sm:pb-3 pt-1 min-h-0">
        <div className="workspace-demo flex-1 flex flex-col w-full h-full overflow-hidden shadow-2xl">
          {/* Workspace Window Header with Mobile Sidebar Toggle */}
          <div className="workspace-toolbar shrink-0 flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="lg:hidden px-2.5 py-1.5 min-h-[36px] min-w-[36px] rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 text-xs flex items-center gap-1.5 cursor-pointer border border-white/10 shrink-0"
                title="เปิด/ปิด แผงสารบัญ & Story Bible"
              >
                <span>☰</span>
                <span className="hidden sm:inline font-semibold">สารบัญ</span>
              </button>

              <span className="toolbar-brand flex items-center gap-2 text-xs sm:text-sm font-semibold truncate">
                <span className="text-purple-400">✦</span>
                <span className="truncate">Plottrix Studio · ห้องเขียนและผู้ช่วยบรรณาธิการ AI</span>
              </span>
            </div>

            <div className="toolbar-actions flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleEditorialCheck}
                className={`px-3 py-1.5 min-h-[36px] rounded-full text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                  editorialCheckOpen
                    ? 'bg-purple-600/30 text-purple-200 border-purple-400/60 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-purple-300 border-white/10'
                }`}
                title="เปิด/ปิด แผงตรวจความต่อเนื่องและข้อเสนอแนะบรรณาธิการ"
              >
                <span>✦</span>
                <span className="hidden sm:inline">Editorial Check</span>
              </button>
              <span className="hidden sm:inline text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-400/30">
                Author Workspace
              </span>
            </div>
          </div>

          {/* Flexible Studio Body with Suspense for Editor */}
          <div className="workspace-inner flex-1 overflow-hidden min-h-0 flex flex-row w-full h-full relative">
            {!isFocusMode && <LeftSidebar />}
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center text-xs text-purple-300">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mr-2" />
                  กำลังโหลดห้องเขียน...
                </div>
              }
            >
              <StudioEditor />
            </Suspense>
            {!isFocusMode && editorialCheckOpen && <EditorialAssistantSidebar />}
          </div>
        </div>

        {/* Right Drawer: Vocabulary Bank */}
        <VocabularySidebar />
      </main>

      {/* Overlays & Specific Modals with Suspense */}
      <AiResultDrawer />
      <Suspense fallback={null}>
        <CharacterBibleModal />
        <StylePersonaModal />
        <CustomDictionaryModal />
        <VersionHistoryModal />
        <SkillManagerModal />
        <ExportModal />
        <ApiTestModal />
      </Suspense>
    </div>
  )
}
