import React, { useEffect, Suspense, lazy } from 'react'
import { useApp } from '../../context/AppContext'
import AeroShardsCanvas from './AeroShardsCanvas'
import TopNavbar from './TopNavbar'
import LeftSidebar from './LeftSidebar'
import EditorialAssistantSidebar from './EditorialAssistantSidebar'
import VocabularySidebar from './VocabularySidebar'
import AiResultDrawer from './AiResultDrawer'
import SwipeToastContainer from './SwipeToastContainer'
import OnboardingTour from './OnboardingTour'

// Lazy loaded heavy components & Modals for optimum performance
const StudioEditor = lazy(() => import('./StudioEditor'))
const CharacterBibleModal = lazy(() => import('../modals/CharacterBibleModal'))
const StylePersonaModal = lazy(() => import('../modals/StylePersonaModal'))
const CustomDictionaryModal = lazy(() => import('../modals/CustomDictionaryModal'))
const VersionHistoryModal = lazy(() => import('../modals/VersionHistoryModal'))
const SkillManagerModal = lazy(() => import('../modals/SkillManagerModal'))
const ExportModal = lazy(() => import('../modals/ExportModal'))
const PricingModal = lazy(() => import('../modals/PricingModal'))
const SettingsModal = lazy(() => import('../modals/SettingsModal'))
const AuthModal = lazy(() => import('../modals/AuthModal'))
const ApiTestModal = lazy(() => import('../modals/ApiTestModal'))

export default function WorkspaceLayout() {
  const { isFocusMode, setIsFocusMode, editorialCheckOpen, toggleEditorialCheck } = useApp()

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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-plottrix-bg text-plottrix-text relative font-thai">
      {/* 3D Ambient Background Shards */}
      <AeroShardsCanvas />

      {/* Top Pill Navbar */}
      {!isFocusMode && <TopNavbar />}

      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden relative z-10 px-2 sm:px-4 pb-2 sm:pb-3 pt-1 min-h-0">
        <div className="workspace-demo flex-1 flex flex-col w-full h-full overflow-hidden shadow-2xl">
          {/* Workspace Window Header (No macOS 3-dots) */}
          <div className="workspace-toolbar shrink-0 flex items-center justify-between">
            <span className="toolbar-brand flex items-center gap-2">
              <span className="text-purple-400">✦</span>
              <span>Plottrix Studio · ห้องเขียนและผู้ช่วยบรรณาธิการ AI</span>
            </span>

            <div className="toolbar-actions flex items-center gap-2">
              <button
                type="button"
                onClick={toggleEditorialCheck}
                className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition ${
                  editorialCheckOpen
                    ? 'bg-purple-600/30 text-purple-200 border-purple-400/60 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-purple-300 border-white/10'
                }`}
                title="เปิด/ปิด แผงตรวจความต่อเนื่องและข้อเสนอแนะบรรณาธิการ"
              >
                <span>✦</span>
                <span>Editorial Check</span>
              </button>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                Author Workspace
              </span>
            </div>
          </div>

          {/* Flexible Studio Body with Suspense for Editor */}
          <div className="workspace-inner flex-1 overflow-hidden min-h-0 flex flex-row w-full h-full">
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

      {/* Onboarding Interactive Tour */}
      <OnboardingTour />

      {/* Overlays & Modals with Suspense */}
      <AiResultDrawer />
      <Suspense fallback={null}>
        <CharacterBibleModal />
        <StylePersonaModal />
        <CustomDictionaryModal />
        <VersionHistoryModal />
        <SkillManagerModal />
        <ExportModal />
        <PricingModal />
        <SettingsModal />
        <AuthModal />
        <ApiTestModal />
      </Suspense>

      {/* SwipeToast Interactive Notification System */}
      <SwipeToastContainer />
    </div>
  )
}
