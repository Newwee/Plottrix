import React, { Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import HomePage from './components/home/HomePage'
import SwipeToastContainer from './components/workspace/SwipeToastContainer'
import AuthRequiredView from './components/common/AuthRequiredView'
import { pageVariants } from './lib/animations'

// Lazy load heavy views
const WorkspaceHome = lazy(() => import('./components/workspace/WorkspaceHome'))
const WorkspaceLayout = lazy(() => import('./components/workspace/WorkspaceLayout'))
const PublicReaderHub = lazy(() => import('./components/reader/PublicReaderHub'))
const StoryDetailsView = lazy(() => import('./components/reader/StoryDetailsView'))
const ReaderView = lazy(() => import('./components/reader/ReaderView'))
const TestAiPlayground = lazy(() => import('./components/test-ai/TestAiPlayground'))
const AdminPaymentsView = lazy(() => import('./components/admin/AdminPaymentsView'))
const PricingModal = lazy(() => import('./components/modals/PricingModal'))
const TrialTermsModal = lazy(() => import('./components/modals/TrialTermsModal'))
const MembershipCheckoutModal = lazy(() => import('./components/modals/MembershipCheckoutModal'))
const SettingsModal = lazy(() => import('./components/modals/SettingsModal'))
const AuthModal = lazy(() => import('./components/modals/AuthModal'))
const PublishModal = lazy(() => import('./components/modals/PublishModal'))
const SmartImportModal = lazy(() => import('./components/modals/SmartImportModal'))
const OnboardingTour = lazy(() => import('./components/workspace/OnboardingTour'))

function ViewRouter() {
  const { currentView } = useApp()
  const { user, loading: authLoading } = useAuth()

  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-[#0d091a] flex flex-col items-center justify-center text-purple-300 font-sans">
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
          className="w-full h-full min-h-[100dvh]"
        >
          {currentView === 'studio' || currentView === 'workspace' ? (
            <WorkspaceLayout />
          ) : currentView === 'workspace_home' ? (
            <>
              <WorkspaceHome />
              {user && <OnboardingTour />}
            </>
          ) : currentView === 'test_ai' ? (
            authLoading ? <AuthRequiredView isLoading /> : !user ? <AuthRequiredView /> : <TestAiPlayground />
          ) : currentView === 'admin_payments' ? (
            <AdminPaymentsView />
          ) : currentView === 'story_detail' ? (
            <StoryDetailsView />
          ) : currentView === 'reader' ? (
            <ReaderView />
          ) : currentView === 'read' ? (
            <PublicReaderHub />
          ) : (
            <HomePage />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Global Modals & Notifications accessible anywhere */}
      <PricingModal />
      <TrialTermsModal />
      <MembershipCheckoutModal />
      <SettingsModal />
      <AuthModal />
      <PublishModal />
      <SmartImportModal />
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
