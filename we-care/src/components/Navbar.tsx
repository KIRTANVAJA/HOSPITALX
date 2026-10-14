import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavItem } from '../types';

interface NavbarProps {
  onBookDemoClick?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'Departments', href: '#departments' },
  { label: 'Our Doctors', href: '#doctors' },
  { label: 'Appointments', href: '#appointments' },
];

export const Navbar: React.FC<NavbarProps> = ({ onBookDemoClick }) => {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <header 
      id="vortiq-navbar" 
      className="relative z-30 w-full flex items-center justify-between px-6 sm:px-10 md:px-14 py-6"
    >
      {/* Brand Logo (Left) */}
      <a 
        href="#" 
        id="nav-brand-logo"
        className="group flex items-center gap-2.5 text-white no-underline transition-opacity hover:opacity-90"
      >
        {/* Geometric Ai Glyph matching reference */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/20 overflow-hidden shadow-[0_0_15px_rgba(0,140,255,0.2)] group-hover:border-sky-400/50 transition-colors">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-white group-hover:text-sky-400 transition-colors"
          >
            {/* Stylized geometric AI prism */}
            <path 
              d="M 5 19 L 12 5 L 19 19 L 14 19 L 12 14 L 10 19 Z" 
              fill="currentColor" 
            />
            <circle cx="12" cy="10" r="1.5" fill="#0099ff" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-transparent pointer-events-none" />
        </div>

        <div className="flex items-center tracking-wide">
          <span className="text-xl font-bold text-white tracking-tight">We</span>
          <span className="text-xl font-semibold text-white/95 ml-1.5 tracking-tight">Care</span>
        </div>
      </a>

      {/* Center Nav Pills with Liquid Glass Effect */}
      <nav 
        id="nav-center-menu" 
        className="hidden md:flex items-center p-1 rounded-full liquid-glass-panel border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.label;
          return (
            <button
              key={item.label}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveTab(item.label)}
              className={`relative px-5 py-2 text-[12px] font-semibold tracking-wider transition-all duration-300 rounded-full select-none cursor-pointer ${
                isActive 
                  ? 'text-white font-bold' 
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill-bg"
                  className="absolute inset-0 rounded-full bg-white/[0.12] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_12px_rgba(0,140,255,0.3)]"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Action: BOOK DEMO Button */}
      <div className="flex items-center gap-3">
        <button
          id="nav-book-demo-btn"
          onClick={onBookDemoClick}
          className="relative group px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white border border-white/25 liquid-glass-pill hover:border-sky-400/60 shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer"
        >
          {/* Subtle liquid sheen layer */}
          <span className="relative z-10 flex items-center gap-2">
            <span>BOOK DEMO</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 group-hover:scale-125 transition-transform" />
          </span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-500/0 via-sky-500/20 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>
      </div>
    </header>
  );
};
