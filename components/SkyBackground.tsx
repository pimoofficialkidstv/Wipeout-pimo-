import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface BackgroundThemeInfo {
  id: string;
  name: string;
  desc: string;
  previewGradient: string;
  icon: string;
  category: 'dynamic' | 'luxury' | 'abstract' | 'retro' | 'custom';
}

export const BACKGROUND_THEMES: BackgroundThemeInfo[] = [
  {
    id: 'dynamic_sky',
    name: 'Dynamic Sky (Default)',
    desc: 'Adapts in real-time to morning sun, golden sunset, and starry night',
    previewGradient: 'linear-gradient(135deg, #38bdf8 0%, #f43f5e 50%, #0f172a 100%)',
    icon: 'fa-cloud-sun',
    category: 'dynamic'
  },
  {
    id: 'apple_intelligence',
    name: 'Apple Intelligence Silk',
    desc: 'Warm cashmere and champagne silk curves with soft ambient glow',
    previewGradient: 'linear-gradient(135deg, #e5ded8 0%, #c4b5a5 40%, #544941 100%)',
    icon: 'fa-wand-magic-sparkles',
    category: 'abstract'
  },
  {
    id: 'cosmic_nebula',
    name: 'Cosmic Nebula',
    desc: 'Deep space starfield with glowing purple and cyan galaxy dust',
    previewGradient: 'linear-gradient(135deg, #0b091a 0%, #3b0764 50%, #06b6d4 100%)',
    icon: 'fa-meteor',
    category: 'abstract'
  },
  {
    id: 'cyber_grid',
    name: 'Cyber Synthwave',
    desc: 'Retro 80s neon perspective grid with glowing magenta horizon',
    previewGradient: 'linear-gradient(135deg, #09090b 0%, #ec4899 60%, #06b6d4 100%)',
    icon: 'fa-vr-cardboard',
    category: 'retro'
  },
  {
    id: 'sunset_glow',
    name: 'Golden Sunset',
    desc: 'Radiant golden hour amber, coral, and violet twilight sky',
    previewGradient: 'linear-gradient(135deg, #fbbf24 0%, #f43f5e 50%, #4c1d95 100%)',
    icon: 'fa-sun',
    category: 'dynamic'
  },
  {
    id: 'emerald_aurora',
    name: 'Emerald Aurora',
    desc: 'Shimmering northern lights with vivid green and turquoise ribbons',
    previewGradient: 'linear-gradient(135deg, #022c22 0%, #10b981 50%, #06b6d4 100%)',
    icon: 'fa-compass-drafting',
    category: 'dynamic'
  },
  {
    id: 'roblox_skybox',
    name: 'Roblox Classic Sky',
    desc: 'Nostalgic bright blue skybox with floating blocky voxel clouds',
    previewGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 60%, #e0f2fe 100%)',
    icon: 'fa-cube',
    category: 'retro'
  },
  {
    id: 'imperial_gold',
    name: 'Imperial Gold',
    desc: 'Moro Plus luxury gold gradients and sparkling floating embers',
    previewGradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 50%, #fef08a 100%)',
    icon: 'fa-crown',
    category: 'luxury'
  },
  {
    id: 'obsidian_dark',
    name: 'Obsidian Minimal',
    desc: 'Deep OLED black titanium with subtle ambient dark glow',
    previewGradient: 'linear-gradient(135deg, #030712 0%, #111827 60%, #1f2937 100%)',
    icon: 'fa-moon',
    category: 'luxury'
  },
  {
    id: 'custom_image',
    name: 'Custom Wallpaper',
    desc: 'Personalized image background from device upload or image URL',
    previewGradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
    icon: 'fa-image',
    category: 'custom'
  }
];

export const SkyBackground: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem('moro_selected_background') || 'dynamic_sky';
  });
  const [customBgUrl, setCustomBgUrl] = useState<string>(() => {
    return localStorage.getItem('moro_custom_bg_url') || '';
  });
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('night');

  useEffect(() => {
    const handleStorage = () => {
      setSelectedTheme(localStorage.getItem('moro_selected_background') || 'dynamic_sky');
      setCustomBgUrl(localStorage.getItem('moro_custom_bg_url') || '');
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('moro_background_changed', handleStorage as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('moro_background_changed', handleStorage as EventListener);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 17) {
        setTimeOfDay('day');
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay('sunset');
      } else {
        setTimeOfDay('night');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const dynamicSkyGradient = useMemo(() => {
    switch (timeOfDay) {
      case 'day':
        return 'linear-gradient(to bottom, #38bdf8 0%, #bae6fd 70%, #f0fdf4 100%)';
      case 'sunset':
        return 'linear-gradient(to bottom, #f43f5e 0%, #fb923c 45%, #fcd34d 85%, #831843 100%)';
      case 'night':
      default:
        return 'linear-gradient(to bottom, #090d16 0%, #0f172a 40%, #1e1b4b 100%)';
    }
  }, [timeOfDay]);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {/* 1. Dynamic Sky Theme */}
        {selectedTheme === 'dynamic_sky' && (
          <motion.div
            key="dynamic_sky"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
            style={{ background: dynamicSkyGradient }}
          >
            {timeOfDay === 'night' && (
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj4NCiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIgLz4NCiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iODAiIHI9IjEuNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMiIgLz4NCiAgPGNpcmNsZSBjeD0iMzUwIiBjeT0iMjUwIiByPSIxIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4xNSIgLz4NCiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMzAwIiByPSIyIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4wNSIgLz4NCiAgPGNpcmNsZSBjeD0iMjgwIiBjeT0iMjAiIHI9IjEiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjEiIC8+DQo8L3N2Zz4=')] bg-repeat opacity-40" />
            )}
            {timeOfDay === 'day' && (
              <div className="absolute top-10 right-20 w-40 h-40 bg-yellow-300/30 rounded-full blur-3xl" />
            )}
          </motion.div>
        )}

        {/* 2. Apple Intelligence Silk Theme (Matches Screenshot Style) */}
        {selectedTheme === 'apple_intelligence' && (
          <motion.div
            key="apple_intelligence"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-[#e7ded7] overflow-hidden"
          >
            {/* Base warm silky gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f2ece6] via-[#e5ded8] to-[#c5b8ab]" />

            {/* Organic flowing silk curve 1 */}
            <svg className="absolute -top-[10%] -left-[15%] w-[130%] h-[120%] opacity-85" viewBox="0 0 1000 1000" fill="none">
              <path
                d="M-100,200 C300,100 500,450 700,300 C900,150 1100,400 1200,600 L1200,1200 L-100,1200 Z"
                fill="url(#silkGrad1)"
              />
              <defs>
                <linearGradient id="silkGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#faf6f2" />
                  <stop offset="40%" stopColor="#d9cec2" />
                  <stop offset="100%" stopColor="#968577" />
                </linearGradient>
              </defs>
            </svg>

            {/* Organic flowing silk curve 2 */}
            <svg className="absolute -top-[5%] -right-[10%] w-[120%] h-[120%] opacity-90" viewBox="0 0 1000 1000" fill="none">
              <path
                d="M1100,100 C750,200 650,600 400,550 C150,500 -50,800 -100,1000 L1100,1000 Z"
                fill="url(#silkGrad2)"
              />
              <defs>
                <linearGradient id="silkGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#ded5cb" />
                  <stop offset="70%" stopColor="#aa9a8b" />
                  <stop offset="100%" stopColor="#4a4038" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing highlight ribbon / Apple Intelligence contour */}
            <svg className="absolute top-[10%] left-[5%] w-[90%] h-[80%] opacity-60" viewBox="0 0 1000 1000" fill="none">
              <path
                d="M100,350 C350,250 550,580 850,420"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="2.5"
                filter="drop-shadow(0 0 8px rgba(255,255,255,0.8))"
              />
            </svg>

            {/* Warm ambient depth glows */}
            <div className="absolute top-[20%] left-[10%] w-[50vw] h-[50vh] bg-[#ffeedd]/40 rounded-full blur-[140px]" />
            <div className="absolute bottom-[5%] right-[10%] w-[40vw] h-[40vh] bg-[#3a322c]/40 rounded-full blur-[120px]" />
          </motion.div>
        )}

        {/* 3. Cosmic Nebula Theme */}
        {selectedTheme === 'cosmic_nebula' && (
          <motion.div
            key="cosmic_nebula"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-[#06040d]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c081e] via-[#1a0833] to-[#04020a]" />
            <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '10s' }} />
            <div className="absolute top-[50%] left-[40%] w-[350px] h-[350px] bg-pink-500/20 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
          </motion.div>
        )}

        {/* 4. Cyber Synthwave Grid Theme */}
        {selectedTheme === 'cyber_grid' && (
          <motion.div
            key="cyber_grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-[#090514] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#090514] via-[#1a0a2a] to-[#2b0838]" />
            {/* Retro Sun */}
            <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-b from-yellow-300 via-pink-500 to-purple-800 shadow-[0_0_80px_rgba(236,72,153,0.6)]" />
            {/* Horizon Glow */}
            <div className="absolute top-[50%] left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_#06b6d4,0_0_40px_#ec4899]" />
            {/* Grid Floor */}
            <div
              className="absolute top-[50%] left-0 right-0 bottom-0 opacity-45"
              style={{
                backgroundImage: 'linear-gradient(to right, rgba(6,182,212,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(236,72,153,0.4) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                transform: 'perspective(300px) rotateX(60deg)',
                transformOrigin: 'top center'
              }}
            />
          </motion.div>
        )}

        {/* 5. Golden Sunset Theme */}
        {selectedTheme === 'sunset_glow' && (
          <motion.div
            key="sunset_glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #311042 0%, #701a75 25%, #c026d3 45%, #f43f5e 65%, #fb923c 85%, #fde047 100%)' }}
          >
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-300/30 rounded-full blur-[100px]" />
          </motion.div>
        )}

        {/* 6. Emerald Aurora Theme */}
        {selectedTheme === 'emerald_aurora' && (
          <motion.div
            key="emerald_aurora"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-[#021310] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#010907] via-[#021d18] to-[#042f2c]" />
            {/* Flowing aurora curtains */}
            <div className="absolute -top-[10%] left-[-10%] w-[120%] h-[60%] bg-gradient-to-r from-emerald-500/30 via-teal-400/40 to-cyan-400/30 blur-[90px] transform -rotate-6 animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="absolute top-[10%] right-[-10%] w-[100%] h-[50%] bg-gradient-to-r from-teal-400/20 via-emerald-400/30 to-green-500/20 blur-[100px] transform rotate-12 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:32px_32px] opacity-35" />
          </motion.div>
        )}

        {/* 7. Roblox Classic Skybox */}
        {selectedTheme === 'roblox_skybox' && (
          <motion.div
            key="roblox_skybox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-gradient-to-b from-[#007cd4] via-[#3aa8ff] to-[#8fd4ff]"
          >
            {/* Blocky voxel clouds */}
            <div className="absolute top-16 left-12 w-48 h-16 bg-white/70 rounded-md shadow-md" />
            <div className="absolute top-12 left-24 w-32 h-20 bg-white/80 rounded-md" />
            <div className="absolute top-36 right-32 w-64 h-20 bg-white/70 rounded-md shadow-md" />
            <div className="absolute top-32 right-48 w-40 h-24 bg-white/85 rounded-md" />
            <div className="absolute top-64 left-1/3 w-56 h-18 bg-white/60 rounded-md" />
          </motion.div>
        )}

        {/* 8. Imperial Gold Theme */}
        {selectedTheme === 'imperial_gold' && (
          <motion.div
            key="imperial_gold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-[#120c02]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f1303] via-[#3b2304] to-[#120a01]" />
            <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-amber-400/25 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-yellow-500/25 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
          </motion.div>
        )}

        {/* 9. Obsidian Minimal Theme */}
        {selectedTheme === 'obsidian_dark' && (
          <motion.div
            key="obsidian_dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-[#07090e]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d14] via-[#07090e] to-[#040508]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-slate-800/15 rounded-full blur-[140px]" />
          </motion.div>
        )}

        {/* 10. Custom Wallpaper */}
        {selectedTheme === 'custom_image' && (
          <motion.div
            key="custom_image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-black"
          >
            {customBgUrl ? (
              <img
                src={customBgUrl}
                alt="Custom Background"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
            )}
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkyBackground;
