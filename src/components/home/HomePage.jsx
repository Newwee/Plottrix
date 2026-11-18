import React from 'react'
import AeroShardsCanvas from '../workspace/AeroShardsCanvas'
import HomeNavbar from './HomeNavbar'
import HeroSection from './HeroSection'
import FeaturesSection from './FeaturesSection'
import WorkspaceShowcaseSection from './WorkspaceShowcaseSection'
import InteractiveDemoSection from './InteractiveDemoSection'
import PlotBranchSection from './PlotBranchSection'
import TranslationSection from './TranslationSection'
import CompareSection from './CompareSection'
import PricingSection from './PricingSection'
import FinalCtaSection from './FinalCtaSection'
import HomeFooter from './HomeFooter'

export default function HomePage() {
  return (
    <div className="home-page-root min-h-screen relative text-plottrix-text bg-plottrix-bg font-thai">
      {/* 3D Ambient Background Shards */}
      <AeroShardsCanvas />

      {/* Pill-Nav Header */}
      <HomeNavbar />

      {/* Main Page Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <WorkspaceShowcaseSection />
        <InteractiveDemoSection />
        <PlotBranchSection />
        <TranslationSection />
        <CompareSection />
        <PricingSection />
        <FinalCtaSection />
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  )
}
