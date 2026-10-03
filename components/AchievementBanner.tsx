import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Achievement, playAchievementUnlockedSound, getEffectivePlatform } from '../src/data/achievements';

interface AchievementBannerProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementBanner: React.FC<AchievementBannerProps> = ({ achievement, onDismiss }) => {
  const platform = getEffectivePlatform();

  useEffect(() => {
    if (achievement) {
      playAchievementUnlockedSound();
      const timer = setTimeout(() => {
        onDismiss();
      }, 4800);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  const isXbox = platform === 'xbox';

  return (
    <AnimatePresence>
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] pointer-events-auto px-4 w-full max-w-md">
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className={`relative border text-white rounded-2xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex items-center gap-3.5 overflow-hidden backdrop-blur-xl group cursor-pointer ${
            isXbox 
              ? 'bg-[#121417] border-[#1f2429]' 
              : 'bg-[#202124] border-[#3c4043]'
          }`}
          onClick={onDismiss}
        >
          {/* Ambient Glowing Background Light */}
          <div className={`absolute -left-10 -top-10 w-28 h-28 rounded-full blur-2xl pointer-events-none ${
            isXbox ? 'bg-[#107C41]/25' : 'bg-[#34A853]/20'
          }`}></div>
          
          {/* Badge Icon */}
          <div className="relative shrink-0">
            <div className={`w-12 h-12 rounded-full p-[2px] shadow-lg flex items-center justify-center animate-pulse ${
              isXbox 
                ? 'bg-gradient-to-tr from-[#0E6234] via-[#107C41] to-[#12A054] shadow-emerald-600/40' 
                : 'bg-gradient-to-tr from-[#0F9D58] via-[#34A853] to-[#4285F4] shadow-emerald-500/30'
            }`}>
              <div className="w-full h-full bg-[#17181A] rounded-full flex items-center justify-center text-emerald-400">
                <i className={`fa-solid ${achievement.icon || 'fa-trophy'} text-lg ${
                  isXbox ? 'text-[#107C41] drop-shadow-[0_0_8px_rgba(16,124,65,0.8)]' : 'text-[#34A853] drop-shadow-[0_0_8px_rgba(52,168,83,0.8)]'
                }`}></i>
              </div>
            </div>
            <div className={`absolute -bottom-1 -right-1 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] border-2 border-[#121417] shadow-md ${
              isXbox ? 'bg-[#107C41]' : 'bg-[#34A853]'
            }`}>
              {isXbox ? <i className="fa-brands fa-xbox text-[10px]"></i> : <i className="fa-solid fa-check"></i>}
            </div>
          </div>

          {/* Achievement Info */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isXbox ? (
                <>
                  <i className="fa-brands fa-xbox text-[#107C41] text-[11px]"></i>
                  <span className="text-[9px] font-black tracking-widest text-[#107C41] uppercase font-mono">
                    XBOX NETWORK • UNLOCKED
                  </span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-gamepad text-[#34A853] text-[10px]"></i>
                  <span className="text-[9px] font-black tracking-widest text-[#34A853] uppercase font-mono">
                    GOOGLE PLAY GAMES
                  </span>
                </>
              )}
            </div>
            <h4 className="text-sm font-black text-white truncate tracking-tight flex items-center gap-2">
              {achievement.title}
            </h4>
            <p className="text-xs text-slate-300 truncate mt-0.5 font-medium">
              {achievement.description}
            </p>
            
            <div className="flex items-center gap-2 mt-1.5">
              {isXbox ? (
                <span className="text-[10px] font-extrabold bg-[#107C41]/20 text-emerald-400 border border-[#107C41]/40 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                  <i className="fa-solid fa-circle-dot text-[8px] text-[#107C41]"></i> +{achievement.gamerscore || 50} G
                </span>
              ) : (
                <span className="text-[10px] font-extrabold bg-[#34A853]/20 text-[#34A853] border border-[#34A853]/40 px-2 py-0.5 rounded-md font-mono">
                  +{achievement.xp} XP
                </span>
              )}
              <span className="text-[10px] font-extrabold bg-amber-500/20 text-yellow-400 border border-amber-500/40 px-2 py-0.5 rounded-md font-mono">
                +{achievement.pimobuxReward ?? achievement.morobuxReward ?? 0} PimoBux
              </span>
            </div>
          </div>

          {/* Dismiss Close Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-slate-400 hover:text-white text-xs w-7 h-7 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          {/* Top Accent Bar */}
          <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${
            isXbox 
              ? 'bg-gradient-to-r from-[#0E6234] via-[#107C41] to-[#12A054]' 
              : 'bg-gradient-to-r from-[#0F9D58] via-[#34A853] to-[#4285F4]'
          }`}></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
