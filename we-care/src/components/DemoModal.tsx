import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Sparkles, Send } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'demo' | 'learn';
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  mode = 'demo',
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="demo-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md p-8 rounded-3xl liquid-glass-panel border border-white/25 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(0,140,255,0.2)] text-white"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="py-8 flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Access Granted</h3>
                <p className="text-white/60 text-sm max-w-xs">
                  Our healthcare operations specialist will reach out to schedule your consultation.
                </p>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{mode === 'demo' ? 'HOSPITALX Clinical Solutions' : 'Platform Documentation'}</span>
                </div>

                <h3 className="text-2xl font-bold tracking-tight mb-2">
                  {mode === 'demo' ? 'Schedule a Live Walkthrough' : 'Explore HOSPITALX Healthcare'}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed mb-6">
                  Experience intelligent healthcare workflows coordinating patient care, clinical summaries, and operations.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@healthcare.org"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-black bg-white liquid-glass-cta flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Request Healthcare Demo</span>
                    <Send className="w-4 h-4 text-black" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
