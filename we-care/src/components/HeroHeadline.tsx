import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface HeroHeadlineProps {
  onBookDemo?: () => void;
  onLearnMore?: () => void;
}

export const HeroHeadline: React.FC<HeroHeadlineProps> = ({ 
  onBookDemo, 
  onLearnMore 
}) => {
  return (
    <div id="hero-headline-container" className="flex flex-col justify-center max-w-xl z-20">
      {/* Subtle indicator pill */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/15 backdrop-blur-xl mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
      >
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[12px] font-medium tracking-wider uppercase text-white/80">Your Health, Our Sacred Mission</span>
      </motion.div>

      {/* Main Massive Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-medium text-white leading-[1.08] tracking-[-0.03em] mb-8 select-none"
      >
        <span className="block font-semibold">World-Class</span>
        <span className="block text-white/95">Healthcare,</span>
        <span className="block bg-gradient-to-r from-white via-white/90 to-sky-200 bg-clip-text text-transparent">
          Delivered with Care
        </span>
      </motion.h1>

      {/* CTAs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="flex flex-wrap items-center gap-4 pt-2"
      >
        {/* Primary Pill: Book a Demo */}
        <button
          id="hero-cta-book-demo"
          onClick={onBookDemo}
          className="relative group px-8 py-3.5 rounded-full text-[15px] font-semibold text-black bg-white liquid-glass-cta flex items-center gap-2.5 active:scale-98 cursor-pointer"
        >
          <span>Book a Demo</span>
          <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>

        {/* Secondary Pill: Learn More (Liquid Glass) */}
        <button
          id="hero-cta-learn-more"
          onClick={onLearnMore}
          className="relative px-8 py-3.5 rounded-full text-[15px] font-medium text-white/90 liquid-glass-pill flex items-center gap-2 cursor-pointer active:scale-98"
        >
          <span>Learn More</span>
        </button>
      </motion.div>
    </div>
  );
};
