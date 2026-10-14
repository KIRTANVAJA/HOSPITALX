import React from 'react';
import { motion } from 'motion/react';

interface FeaturePanelProps {
  onWorkflowClick?: () => void;
  onAgentsClick?: () => void;
}

export const FeaturePanel: React.FC<FeaturePanelProps> = ({
  onWorkflowClick,
  onAgentsClick
}) => {
  return (
    <motion.div
      id="hero-feature-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="flex flex-col justify-center max-w-sm z-20 space-y-7"
    >
      {/* Item 1: AI Workflow */}
      <div 
        id="feature-ai-workflow"
        onClick={onWorkflowClick}
        className="group cursor-pointer transition-transform duration-300 hover:translate-x-1"
      >
        <div className="flex items-start gap-4">
          {/* Dotted Triangle / Pyramid Icon matching reference image */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center pt-0.5 text-sky-400 group-hover:text-sky-300 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              {/* Row 1: 1 dot */}
              <circle cx="12" cy="4" r="1.7" />
              {/* Row 2: 2 dots */}
              <circle cx="8.5" cy="10" r="1.7" />
              <circle cx="15.5" cy="10" r="1.7" />
              {/* Row 3: 3 dots */}
              <circle cx="5" cy="16" r="1.7" />
              <circle cx="12" cy="16" r="1.7" />
              <circle cx="19" cy="16" r="1.7" />
              {/* Row 4: 4 base dots */}
              <circle cx="2" cy="22" r="1.4" opacity="0.7" />
              <circle cx="8.5" cy="22" r="1.4" opacity="0.7" />
              <circle cx="15.5" cy="22" r="1.4" opacity="0.7" />
              <circle cx="22" cy="22" r="1.4" opacity="0.7" />
            </svg>
          </div>

          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-white tracking-tight group-hover:text-sky-200 transition-colors">
              AI Workflow
            </h3>
            <p className="text-sm text-white/55 font-normal tracking-wide mt-0.5">
              Automate tasks instantly
            </p>
          </div>
        </div>
      </div>

      {/* Item 2: Smart AI Agents */}
      <div 
        id="feature-smart-agents"
        onClick={onAgentsClick}
        className="group cursor-pointer transition-transform duration-300 hover:translate-x-1"
      >
        <div className="flex items-start gap-4">
          {/* Dotted Matrix Icon matching reference image */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center pt-0.5 text-sky-400 group-hover:text-sky-300 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              {/* 3x3 or 4x3 matrix grid of dots */}
              <circle cx="5" cy="6" r="1.6" />
              <circle cx="12" cy="6" r="1.6" />
              <circle cx="19" cy="6" r="1.6" />

              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />

              <circle cx="5" cy="18" r="1.6" />
              <circle cx="12" cy="18" r="1.6" />
              <circle cx="19" cy="18" r="1.6" />
            </svg>
          </div>

          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-white tracking-tight group-hover:text-sky-200 transition-colors">
              Smart AI Agents
            </h3>
            <p className="text-sm text-white/55 font-normal tracking-wide mt-0.5">
              AI that works 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Subtle Dashed Separator Line */}
      <div className="w-full border-t border-dashed border-white/20 my-1" />

      {/* Description Paragraph */}
      <div className="relative">
        <p className="text-[14px] leading-[1.65] text-white/60 font-normal tracking-wide">
          HOSPITALX brings together leading clinical specialists, state-of-the-art diagnostics, and empathetic care to secure a healthier tomorrow for you and your family.
        </p>
      </div>

      {/* Status metric badge with liquid glass effect */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl liquid-glass-panel border border-white/10 text-xs text-white/70">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] text-white/90">99.98% SPEED RATE</span>
          </div>
          <span className="text-white/20">|</span>
          <span className="text-white/50 text-[11px]">0.04s LATENCY</span>
        </div>
      </div>
    </motion.div>
  );
};
