import React, { Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AuthProvider } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import HomePage from './components/home/HomePage'
import SwipeToastContainer from './components/workspace/SwipeToastContainer'
import { pageVariants } from './lib/animations'

// Lazy load heavy views
const WorkspaceHome = lazy(() => import('./components/workspace/WorkspaceHome'))
const WorkspaceLayout = lazy(() => import('./components/workspace/WorkspaceLayout'))
const PricingModal = lazy(() => import('./components/modals/PricingModal'))
const SettingsModal = lazy(() => import('./components/modals/SettingsModal'))
const AuthModal = lazy(() => import('./components/modals/AuthModal'))
const OnboardingTour = lazy(() => import('./components/workspace/OnboardingTour'))

function ViewRouter() {
  const { currentView } = useApp()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d091a] flex flex-col items-center justify-center text-purple-300 font-sans">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-sm font-semibold tracking-wider">กำลังโหลด Plottrix Workspace...</span>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full h-full min-h-screen"
        >
          {currentView === 'studio' || currentView === 'workspace' ? (
            <WorkspaceLayout />
          ) : currentView === 'workspace_home' ? (
            <>
              <WorkspaceHome />
              <OnboardingTour />
            </>
          ) : (
            <HomePage />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Global Modals & Notifications accessible anywhere */}
      <PricingModal />
      <SettingsModal />
      <AuthModal />
      <SwipeToastContainer />
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ViewRouter />
      </AppProvider>
    </AuthProvider>
  )
}
