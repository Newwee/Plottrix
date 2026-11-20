import React from 'react'
import AeroShardsCanvas from '../workspace/AeroShardsCanvas'
import HomeNavbar from '../home/HomeNavbar'
import PublishedNovelsShowcase from '../home/PublishedNovelsShowcase'
import HomeFooter from '../home/HomeFooter'

export default function PublicReaderHub() {
  return (
    <div className="reader-hub-root min-h-[100dvh] relative text-plottrix-text bg-transparent font-thai">
      {/* 3D Ambient Background Shards */}
      <AeroShardsCanvas />

      {/* Navigation Header */}
      <HomeNavbar />

      <main className="relative z-10 pt-10">
        <PublishedNovelsShowcase />
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  )
}
