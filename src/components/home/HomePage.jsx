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
import AnimatedContent from '../react-bits/AnimatedContent'

export default function HomePage() {
  return (
    <div className="home-page-root min-h-screen relative text-plottrix-text bg-plottrix-bg font-thai">
      {/* 3D Ambient Background Shards */}
      <AeroShardsCanvas />

      {/* Pill-Nav Header */}
      <HomeNavbar />

      {/* Main Page Content with Scroll Animations */}
      <main>
        <HeroSection />

        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" threshold={0.1}>
          <FeaturesSection />
        </AnimatedContent>

        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" threshold={0.1}>
          <WorkspaceShowcaseSection />
        </AnimatedContent>

        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" threshold={0.1}>
          <InteractiveDemoSection />
        </AnimatedContent>

        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" threshold={0.1}>
          <PlotBranchSection />
        </AnimatedContent>

        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" threshold={0.1}>
          <TranslationSection />
        </AnimatedContent>

        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" threshold={0.1}>
          <CompareSection />
        </AnimatedContent>

        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" threshold={0.1}>
          <PricingSection />
        </AnimatedContent>

        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" threshold={0.1}>
          <FinalCtaSection />
        </AnimatedContent>
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  )
}
