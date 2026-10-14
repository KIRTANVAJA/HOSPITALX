import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { NavItem } from '../types';

interface NavbarProps {
  onBookDemoClick?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Departments', href: '/departments' },
  { label: 'Our Doctors', href: '#doctors' },
  { label: 'Appointments', href: '#appointments' },
];

// Routes that use the light Slate/Blue theme (as opposed to the dark
// liquid-glass hero theme). Add new light-themed page routes here.
const LIGHT_ROUTES = ['/about', '/departments'];

export const Navbar = ({ onBookDemoClick }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we are on a light-themed page (About, Departments, ...).
  // Named `isAbout` for minimal diff against the rest of this file's
  // conditional styling below — it now means "use the light theme".
  const isAbout = LIGHT_ROUTES.includes(location.pathname);
  const activeTab =
    location.pathname === '/about'
      ? 'About Us'
      : location.pathname === '/departments'
        ? 'Departments'
        : 'Home';

  const handleNavClick = (item: NavItem) => {
    if (item.href === '/') {
      if (location.pathname !== '/') {
        navigate('/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.href === '/about' || item.href === '/departments') {
      if (location.pathname !== item.href) {
        navigate(item.href);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.href.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/' + item.href);
      } else {
        const target = document.querySelector(item.href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      id="vortiq-navbar" 
      className="relative z-30 w-full max-w-[1720px] mx-auto flex items-center justify-between px-6 sm:px-10 md:px-16 py-4 transition-colors duration-300"
    >
      {/* Brand Logo (Left) */}
      <a 
        href="/" 
        id="nav-brand-logo"
        onClick={handleLogoClick}
        className={`group flex items-center gap-3 no-underline transition-transform hover:scale-[1.02] ${
          isAbout ? 'text-slate-900' : 'text-white'
        }`}
      >
        {/* Brand Pill Tile */}
        <div
          className={`relative flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden transition-all shadow-sm ${
            isAbout
              ? 'bg-blue-600 text-white border border-blue-500'
              : 'navbar-brand-pill group-hover:border-white'
          }`}
        >
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-white drop-shadow-[0_1px_4px_rgba(0,60,150,0.5)] group-hover:scale-110 transition-transform"
          >
            <path 
              d="M 5 19 L 12 5 L 19 19 L 14 19 L 12 14 L 10 19 Z" 
              fill="currentColor" 
            />
            <circle cx="12" cy="10" r="1.8" fill={isAbout ? '#ffffff' : '#38bdf8'} />
          </svg>
        </div>

        <div className="flex items-center tracking-tight">
          <span className={`text-2xl font-black tracking-tight ${isAbout ? 'text-slate-900' : 'text-white'}`}>
            We
          </span>
          <span className={`text-2xl font-bold ml-1 tracking-tight ${isAbout ? 'text-blue-600' : 'text-white'}`}>
            Care
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ml-1.5 animate-pulse ${isAbout ? 'bg-blue-600' : 'bg-sky-300'}`} />
        </div>
      </a>

      {/* Center Nav Pills with Dynamic Light/Dark Contrast */}
      <nav 
        id="nav-center-menu" 
        className={`hidden md:flex items-center p-1.5 rounded-full transition-all ${
          isAbout 
            ? 'bg-slate-100/90 border border-slate-200/90 shadow-sm' 
            : 'navbar-liquid-island'
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.label;
          return (
            <button
              key={item.label}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleNavClick(item)}
              className={`relative px-5 py-2 text-[13px] tracking-wide transition-all duration-300 rounded-full select-none cursor-pointer ${
                isActive 
                  ? isAbout
                    ? 'text-white font-bold'
                    : 'text-black font-bold' 
                  : isAbout
                    ? 'text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-200/60'
                    : 'text-white font-semibold hover:bg-white/15 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill-bg"
                  className={`absolute inset-0 rounded-full ${
                    isAbout
                      ? 'bg-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.3)]'
                      : 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
                  }`}
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Action: Button */}
      <div className="hidden sm:flex items-center gap-3">
        <button
          id="nav-book-demo-btn"
          onClick={onBookDemoClick}
          className={`relative group px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            isAbout
              ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95'
              : 'text-black bg-white shadow-[0_4px_20px_rgba(255,255,255,0.3),0_0_0_1px_rgba(255,255,255,0.9)] hover:bg-slate-100 hover:shadow-[0_6px_25px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95'
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span>BOOK APPOINTMENT</span>
            <span
              className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${
                isAbout ? 'bg-white' : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.9)]'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        type="button"
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`flex md:hidden items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-colors ${
          isAbout
            ? 'border border-slate-200 bg-slate-100 text-slate-800'
            : 'navbar-brand-pill text-white'
        }`}
      >
        <div className="flex flex-col gap-1.5 w-5">
          <span className={`h-0.5 w-full transition-all duration-300 ${isAbout ? 'bg-slate-800' : 'bg-white'} ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 w-full transition-opacity duration-300 ${isAbout ? 'bg-slate-800' : 'bg-white'} ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-full transition-all duration-300 ${isAbout ? 'bg-slate-800' : 'bg-white'} ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-6 right-6 mt-2 p-4 rounded-3xl flex flex-col gap-2 md:hidden shadow-2xl ${
              isAbout
                ? 'bg-white border border-slate-200 text-slate-900 shadow-xl'
                : 'navbar-liquid-island'
            }`}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleNavClick(item);
                }}
                className={`w-full py-2.5 px-4 text-left text-sm rounded-xl transition-colors ${
                  activeTab === item.label
                    ? isAbout
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-white text-black font-bold shadow-sm'
                    : isAbout
                      ? 'text-slate-700 font-semibold hover:bg-slate-100'
                      : 'text-white font-semibold hover:bg-white/15'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className={`pt-2 border-t ${isAbout ? 'border-slate-200' : 'border-white/20'}`}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBookDemoClick?.();
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isAbout
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'text-black bg-white hover:bg-slate-100'
                }`}
              >
                <span>BOOK APPOINTMENT</span>
                <span className={`w-2 h-2 rounded-full ${isAbout ? 'bg-white' : 'bg-sky-500'}`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
