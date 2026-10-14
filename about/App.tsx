/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHeadline } from './components/HeroHeadline';
import { FeaturePanel } from './components/FeaturePanel';
import { LiquidCausticsBackground } from './components/LiquidCausticsBackground';
import { LiquidGlassFilter } from './components/LiquidGlassFilter';
import { DemoModal } from './components/DemoModal';
import AboutSection from './components/AboutSection';
import { LiquidGlassConfig } from './types';

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'demo' | 'learn'>('demo');

  // Liquid glass configuration state
  const [glassConfig] = useState<LiquidGlassConfig>({
    blurAmount: 24,
    glassOpacity: 0.08,
    refractionIntensity: 14,
    blueGlowIntensity: 1.0,
    fluidAnimation: true,
    chromaticShift: true,
  });

  const handleOpenDemo = () => {
    setModalMode('demo');
    setModalOpen(true);
  };

  const handleOpenLearn = () => {
    setModalMode('learn');
    setModalOpen(true);
  };

  return (
    <main
      id="vortiq-app-root"
      className="relative min-h-screen w-full bg-[#000000] text-white flex flex-col justify-between selection:bg-sky-500 selection:text-black font-sans"
    >
      {/* SVG Optical Refraction Filters */}
      <LiquidGlassFilter
        displacementScale={glassConfig.refractionIntensity}
      />

      {/* Plain Black Background with Interactive Liquid Glass Caustics */}
      <LiquidCausticsBackground
        glowIntensity={glassConfig.blueGlowIntensity ?? 1.0}
        interactive={true}
      />

      {/* Subtle Pitch-Black Architectural Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.95)_100%)]"
      />

      {/* Top Navigation Bar */}
      <Navbar onBookDemoClick={handleOpenDemo} />

      {/* Central Hero Section */}
      <div
        id="hero-content-wrapper"
        className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-14 py-8 md:py-16 flex-1 flex items-center"
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center justify-between">

          {/* Left Column: Headline & Action Buttons (Span 7) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-start">
            <HeroHeadline
              onBookDemo={handleOpenDemo}
              onLearnMore={handleOpenLearn}
            />
          </div>

          {/* Right Column: AI Workflow & Smart Agents Feature Stack (Span 5) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <FeaturePanel
              onWorkflowClick={handleOpenDemo}
              onAgentsClick={handleOpenDemo}
            />
          </div>

        </div>
      </div>

      {/* About Section */}
      <AboutSection />

      {/* Bottom Subtle Technical Line */}
      <footer className="relative z-20 w-full px-8 md:px-14 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-white/35">
        <div className="flex items-center gap-4">
          <span>LATITUDE: 37.7749° N</span>
          <span className="hidden sm:inline text-white/15">•</span>
          <span className="hidden sm:inline">LONGITUDE: 122.4194° W</span>
        </div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <span className="inline-block w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(0,140,255,0.85)]" />
          <span>HOSPITALX PROTOCOL OPERATIONAL</span>
        </div>
      </footer>

      {/* Interactive Modal for Demos and Information */}
      <DemoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </main>
  );
}
