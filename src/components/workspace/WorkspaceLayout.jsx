import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useApp } from '../../context/AppContext'
import TopNavbar from './TopNavbar'
import LeftSidebar from './LeftSidebar'
import EditorialAssistantSidebar from './EditorialAssistantSidebar'
import VocabularySidebar from './VocabularySidebar'
import AiResultDrawer from './AiResultDrawer'
import CommandPalette from './CommandPalette'

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
    editorialCheckOpen
  } = useApp()

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Handle Escape key to exit focus mode & Ctrl/Cmd + K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode, setIsFocusMode])

  return (
    <div className="flex flex-col h-[100dvh] min-h-[100dvh] w-screen overflow-hidden bg-plottrix-bg text-plottrix-text relative font-thai">
      {/* Top Pill Navbar */}
      {!isFocusMode && <TopNavbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />}

      {/* Main Author Workspace */}
      <main className="flex-1 flex overflow-hidden relative z-10 w-full h-full min-h-0">
        <div className="flex-1 overflow-hidden min-h-0 flex flex-row w-full h-full relative">
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

        {/* Right Drawer: Vocabulary Bank */}
        <VocabularySidebar />
      </main>

      {/* Overlays & Specific Modals with Suspense */}
      <AiResultDrawer />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
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
