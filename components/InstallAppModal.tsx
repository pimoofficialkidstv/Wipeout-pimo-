import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall
}) => {
  if (!isOpen) return null;

  const appDirectUrl = window.location.href;
  const isInIframe = window.self !== window.top;

  const handleOpenNewTab = () => {
    window.open(appDirectUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#1C1E22] border border-[#2D3033] rounded-3xl max-w-lg w-full text-white shadow-2xl overflow-hidden relative flex flex-col font-sans"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 p-6 border-b border-[#2D3033] relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/10">
                <i className="fa-solid fa-download"></i>
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase font-mono block">
                  DESKTOP & MOBILE APP
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight font-fredoka">
                  Install Wipeout Pimo
                </h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            {/* Why Chrome address bar says Google AI Studio banner */}
            {isInIframe && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-300 uppercase font-mono text-[11px]">
                  <i className="fa-solid fa-circle-info text-amber-400"></i> Why address bar says "Install Google AI Studio":
                </div>
                <p>
                  Because this game preview is loaded inside the Google AI Studio editor workspace, Chrome's address bar targets the parent website domain instead of Wipeout Pimo.
                </p>
                <p className="font-bold text-white">
                  To install <span className="text-yellow-300">Wipeout Pimo</span> directly as a standalone app on Windows or macOS:
                </p>
              </div>
            )}

            {/* Step 1: Open Direct Tab Action */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-black flex items-center justify-center text-xs shrink-0 border border-emerald-500/30">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Open Game in Standalone Tab</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Opens Wipeout Pimo directly without editor tools surrounding it.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenNewTab}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-fredoka py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-base transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Open Direct Game Tab</span>
              </button>
            </div>

            {/* Step 2: Native PWA Install button */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 font-mono font-black flex items-center justify-center text-xs shrink-0 border border-blue-500/30">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Install Desktop App (PWA)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click below or use Chrome Menu (<i className="fa-solid fa-ellipsis-vertical mx-0.5"></i>) &gt; <strong>Save and share</strong> &gt; <strong>Install Wipeout Pimo</strong>.
                  </p>
                </div>
              </div>

              {deferredPrompt ? (
                <button
                  onClick={onTriggerInstall}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-fredoka py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-base transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  <i className="fa-solid fa-desktop"></i>
                  <span>Install App Prompt Now</span>
                </button>
              ) : (
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <i className="fa-brands fa-windows text-blue-400"></i> Windows PC / <i className="fa-brands fa-apple text-slate-300"></i> macOS Instructions:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
                    <li>Click <strong>Open Direct Game Tab</strong> above.</li>
                    <li>In Chrome / Edge address bar, click the <strong>Install App icon</strong> (<i className="fa-solid fa-download text-emerald-400 mx-1"></i>) or Chrome menu &gt; <strong>Install Wipeout Pimo</strong>.</li>
                    <li>Wipeout Pimo will launch in its own native app window on your desktop!</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Mobile Instructions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1">
              <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                <i className="fa-solid fa-mobile-screen text-red-400"></i> Android & iPhone Users:
              </div>
              <p className="text-[11px] text-slate-300">
                In Safari (iOS), tap <strong>Share</strong> &gt; <strong>Add to Home Screen</strong>. In Chrome (Android), tap <strong>Menu</strong> &gt; <strong>Install App / Add to Home Screen</strong>.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950 border-t border-[#2D3033] flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white font-fredoka px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
