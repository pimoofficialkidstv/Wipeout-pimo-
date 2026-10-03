import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, MarketplaceItem, MarketplaceItemType, GameState } from '../types';
import { CHARACTERS, MARKETPLACE_ITEMS } from '../constants';
import { getTranslation } from '../src/translations';
import Moro3D from './Moro3D';

interface AvatarCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacter: Character;
  setSelectedCharacter: React.Dispatch<React.SetStateAction<Character>>;
  ownedItems: string[];
  language: string;
  playerName: string;
  playSound: (freq?: number) => void;
  setGameState: (state: GameState) => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  isOpen,
  onClose,
  selectedCharacter,
  setSelectedCharacter,
  ownedItems,
  language,
  playerName,
  playSound,
  setGameState,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'body' | 'hair' | 'face' | 'clothing' | 'backpack' | 'presets'>('body');

  // Working draft of character so user can preview safely before saving
  const [draft, setDraft] = useState<Character>({ ...selectedCharacter });

  // Interactive preview animation states
  const [isJumping, setIsJumping] = useState(false);
  const [jumpProgress, setJumpProgress] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isAngry, setIsAngry] = useState(false);
  const [isUpset, setIsUpset] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Sync draft with selected character when opened
  useEffect(() => {
    if (isOpen) {
      setDraft({ ...selectedCharacter });
    }
  }, [isOpen, selectedCharacter]);

  // Jump animation handler
  useEffect(() => {
    if (!isJumping) return;
    let start: number | null = null;
    const duration = 650; // ms

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      setJumpProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsJumping(false);
        setJumpProgress(0);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isJumping]);

  // Periodic blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    setSelectedCharacter(draft);
    playSound(1200);
    onClose();
  };

  const handleReset = () => {
    setDraft({ ...selectedCharacter });
    playSound(400);
  };

  const isItemOwned = (item: MarketplaceItem | Character) => {
    if (item.price === 0) return true;
    return ownedItems.includes(item.id);
  };

  // Color lists
  const skinColors = [
    { name: 'Classic', hex: '#ffffff' },
    { name: 'Mint', hex: '#99f6e4' },
    { name: 'Sky', hex: '#bae6fd' },
    { name: 'Gold', hex: '#fde047' },
    { name: 'Pinky', hex: '#fbcfe8' },
    { name: 'Noir', hex: '#334155' },
    { name: 'Purple Neon', hex: '#d8b4fe' },
    { name: 'Orange Burst', hex: '#fed7aa' },
    { name: 'Volcano Red', hex: '#fecaca' },
    { name: 'Grass Green', hex: '#bbf7d0' },
  ];

  const hairColors = [
    { name: 'Dark Slate', hex: '#1e293b' },
    { name: 'Chestnut Brown', hex: '#422006' },
    { name: 'Golden Amber', hex: '#92400e' },
    { name: 'Neon Yellow', hex: '#fde047' },
    { name: 'Rose Petal', hex: '#f43f5e' },
    { name: 'Cobalt Blue', hex: '#3b82f6' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Anime White', hex: '#ffffff' },
    { name: 'Pitch Black', hex: '#000000' },
    { name: 'Cosmic Violet', hex: '#8b5cf6' },
  ];

  const shirtColors = [
    { name: 'Pure White', hex: '#ffffff' },
    { name: 'Retro Orange', hex: '#f97316' },
    { name: 'Forest Green', hex: '#15803d' },
    { name: 'Electric Cyan', hex: '#06b6d4' },
    { name: 'Barbie Pink', hex: '#db2777' },
    { name: 'Cyber Purple', hex: '#7c3aed' },
    { name: 'Lava Red', hex: '#dc2626' },
    { name: 'Midnight', hex: '#0f172a' },
  ];

  const backpackColors = [
    { name: 'Indigo', hex: '#1e1b4b' },
    { name: 'Fire Red', hex: '#ef4444' },
    { name: 'Royal Blue', hex: '#3b82f6' },
    { name: 'Toxic Slime', hex: '#10b981' },
    { name: 'Bux Orange', hex: '#f59e0b' },
    { name: 'Amethyst', hex: '#8b5cf6' },
    { name: 'Bubblegum', hex: '#ec4899' },
    { name: 'Stealth Black', hex: '#000000' },
    { name: 'Paper White', hex: '#ffffff' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 overflow-y-auto font-sans select-none text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-[#191B1D] border border-[#2D3033] w-full max-w-[1100px] h-full md:h-[85vh] shadow-2xl flex flex-col md:flex-row overflow-hidden md:rounded-2xl"
      >
        {/* Left Side: Avatar Interactive Stage (Sleek Roblox Viewport) */}
        <div className="w-full md:w-[40%] bg-[#111214] p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#2D3033] relative overflow-hidden">
          {/* Subtle baseplate style grid overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px'
            }}
          />

          {/* Top Header info */}
          <div className="relative z-10 flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              {/* Custom Roblox-like silver logo tilt */}
              <div className="w-4 h-4 bg-gradient-to-br from-[#00A2FF] to-[#0055FF] transform -rotate-12 rounded-sm" />
              <span className="text-[11px] font-black tracking-widest text-[#00A2FF] uppercase">
                AVATAR ENGINE v2.0
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-[#252729] px-2.5 py-1 rounded-md border border-[#2D3033]">
              {playerName || 'Player'}
            </span>
          </div>

          {/* Canvas Wrapper & Pedestal Stand */}
          <div className="relative my-4 flex flex-col items-center justify-center h-64 md:h-80 w-full z-10">
            {/* Holographic Glowing Base Ring / Roblox Spawn Stand */}
            <div className="absolute bottom-6 w-48 h-10 bg-[#00A2FF]/10 border-2 border-[#00A2FF]/40 rounded-full blur-[2px] transform rotate-x-60 animate-pulse flex items-center justify-center">
              <div className="w-36 h-6 border border-[#00A2FF]/50 rounded-full" />
            </div>

            <div className="relative flex items-center justify-center h-[260px] w-full">
              <Moro3D
                character={draft}
                width={260}
                height={260}
                isJumping={isJumping}
                jumpProgress={jumpProgress}
                isBlinking={isBlinking}
                isTalking={isTalking}
                isAngry={isAngry}
                isUpset={isUpset}
                rotation={rotation}
                playerName={playerName}
              />
            </div>
          </div>

          {/* Interactive Sandbox Sandbox Controls */}
          <div className="relative z-10 w-full bg-[#191B1D]/80 border border-[#2D3033] p-4 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span>Inspect Controls</span>
              <span className="text-[#00A2FF]">Active Sandbox</span>
            </div>

            {/* Micro Interaction Triggers (Roblox gray/flat button style) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setIsJumping(true); playSound(500); }}
                disabled={isJumping}
                className="py-2.5 bg-[#252729] hover:bg-[#323539] text-[#f2f4f5] disabled:opacity-50 text-[11px] font-bold rounded-lg transition-all border border-[#393B3D] active:scale-95 flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-bounce text-[#00A2FF]"></i> Bounce
              </button>
              <button
                onMouseDown={() => setIsTalking(true)}
                onMouseUp={() => setIsTalking(false)}
                onTouchStart={() => setIsTalking(true)}
                onTouchEnd={() => setIsTalking(false)}
                className={`py-2.5 text-[#f2f4f5] text-[11px] font-bold rounded-lg transition-all border active:scale-95 select-none flex items-center justify-center gap-1.5 ${
                  isTalking 
                    ? 'bg-[#00A2FF] border-[#00A2FF]' 
                    : 'bg-[#252729] border-[#393B3D] hover:bg-[#323539]'
                }`}
              >
                <i className="fa-solid fa-microphone"></i> Speak
              </button>
              <button
                onClick={() => {
                  if (isAngry) {
                    setIsAngry(false);
                    setIsUpset(true);
                  } else if (isUpset) {
                    setIsUpset(false);
                  } else {
                    setIsAngry(true);
                  }
                  playSound(800);
                }}
                className={`py-2.5 text-[#f2f4f5] text-[11px] font-bold rounded-lg transition-all border active:scale-95 flex items-center justify-center gap-1.5 ${
                  isAngry 
                    ? 'bg-[#FF453A] border-[#FF453A]' 
                    : isUpset 
                      ? 'bg-[#FF9F0A] border-[#FF9F0A]' 
                      : 'bg-[#252729] border-[#393B3D] hover:bg-[#323539]'
                }`}
              >
                <i className="fa-solid fa-face-smile"></i> Pose
              </button>
            </div>

            {/* Rotation Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Yaw Angle</span>
                <span className="font-mono text-[#00A2FF]">{Math.round((rotation * 180) / Math.PI)}°</span>
              </div>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step={0.05}
                value={rotation}
                onChange={(e) => setRotation(parseFloat(e.target.value))}
                className="w-full accent-[#00A2FF] bg-[#252729] h-1 rounded appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Controls Dashboard (New Roblox Creator Panel Look) */}
        <div className="w-full md:w-[60%] p-6 flex flex-col justify-between h-full overflow-hidden">
          {/* Main Top Title & Tabs */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                  <span>Wipeout Pimo Avatar Customizer</span>
                  <span className="text-xs bg-[#00A2FF]/10 text-[#00A2FF] border border-[#00A2FF]/20 px-2 py-0.5 rounded uppercase font-mono">
                    BETA
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Equip skins, clothing, hair, and gears to customize your custom in-game character.
                </p>
              </div>
              <button
                onClick={() => { playSound(1000); onClose(); }}
                className="w-8 h-8 bg-[#252729] hover:bg-[#323539] border border-[#2D3033] rounded-lg text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Horizontal Subcategory Bar (Exactly like Roblox Avatar editor categorization list) */}
            <div className="flex gap-2 border-b border-[#2D3033] pb-3 mb-5 overflow-x-auto custom-scrollbar snap-x whitespace-nowrap">
              {[
                { id: 'body', label: 'Body Shapes', icon: 'fa-cube' },
                { id: 'hair', label: 'Hairstyles', icon: 'fa-scissors' },
                { id: 'face', label: 'Expressions', icon: 'fa-face-laugh' },
                { id: 'clothing', label: 'Clothing Store', icon: 'fa-shirt' },
                { id: 'backpack', label: 'Accessories', icon: 'fa-bag-shopping' },
                { id: 'presets', label: 'Skins & Outfits', icon: 'fa-users' },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); playSound(400); }}
                    className={`relative px-4 py-2 text-xs font-bold transition-all snap-start flex items-center gap-1.5 ${
                      isSelected
                        ? 'text-[#00A2FF]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} text-xs`}></i>
                    {tab.label}
                    {isSelected && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-[#00A2FF] rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Items Grid (Modern Grid Layout) */}
          <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar mb-5 min-h-[240px]">
            {/* 1. BODY & SKIN TAB */}
            {activeTab === 'body' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Body Shapes */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    1. Choose Body Base Shape
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'body-circle', name: 'Classic Circle', desc: 'Pimo Origin', icon: 'fa-circle' },
                      { id: 'body-human', name: 'Humanoid', desc: 'Sleek Character', icon: 'fa-person' },
                      { id: 'body-roblox', name: 'R6 Blocky', desc: 'Wipeout Blocky', icon: 'fa-cube' }
                    ].map((item) => {
                      const isSelected = draft.bodyId === item.id || (!draft.bodyId && item.id === 'body-circle');
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setDraft(prev => ({
                              ...prev,
                              bodyId: item.id === 'body-circle' ? undefined : item.id
                            }));
                            playSound(600);
                          }}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col items-center justify-center text-center relative bg-[#232527] ${
                            isSelected
                              ? 'border-[#00A2FF] bg-[#1E2E3E] ring-2 ring-[#00A2FF]/20 scale-[1.02]'
                              : 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center bg-[#191B1D]">
                            <i className={`fa-solid ${item.icon} text-lg text-[#00A2FF]`}></i>
                          </div>
                          <p className="text-xs font-bold text-white leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1 leading-none">{item.desc}</p>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                              <i className="fa-solid fa-check text-[7px] text-white"></i>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Skin/Body Color */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    2. Choose Skin Color Pattern
                  </h4>
                  
                  {/* Grid Palette */}
                  <div className="grid grid-cols-5 gap-2.5 mb-4">
                    {skinColors.map((color) => {
                      const isSelected = draft.bodyColor.toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.name}
                          onClick={() => {
                            setDraft(prev => ({ ...prev, bodyColor: color.hex }));
                            playSound(400);
                          }}
                          className={`group aspect-square rounded-xl transition-all border-2 relative flex flex-col items-center justify-center p-1 ${
                            isSelected
                              ? 'border-[#00A2FF] scale-105 shadow-md shadow-[#00A2FF]/10'
                              : 'border-[#2D3033] hover:scale-[1.03]'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          <span className="opacity-0 group-hover:opacity-100 absolute bottom-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white font-mono leading-none pointer-events-none transition-opacity">
                            {color.name}
                          </span>
                          {isSelected && (
                            <i className="fa-solid fa-check text-[9px] drop-shadow bg-black/40 text-white p-1 rounded-full"></i>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Advanced Color Picker */}
                  <div className="bg-[#111214] p-4 rounded-xl border border-[#2D3033] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">Custom Skin Hex Code</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">{draft.bodyColor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={draft.bodyColor}
                        onChange={(e) => setDraft(prev => ({ ...prev, bodyColor: e.target.value }))}
                        className="bg-[#252729] border border-[#2D3033] rounded-lg px-3 py-1.5 font-mono text-xs w-24 text-center focus:ring-1 focus:ring-[#00A2FF] text-white"
                      />
                      <input
                        type="color"
                        value={draft.bodyColor.startsWith('#') ? draft.bodyColor : '#ffffff'}
                        onChange={(e) => setDraft(prev => ({ ...prev, bodyColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. HAIRSTYLES TAB */}
            {activeTab === 'hair' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Hair Cuts */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    1. Hair Style Selection
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MARKETPLACE_ITEMS.filter(i => i.type === MarketplaceItemType.HAIR).map((item) => {
                      const isSelected = draft.hairId === item.id || (item.id === 'hair-none' && !draft.hairId);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setDraft(prev => ({
                              ...prev,
                              hairId: item.id === 'hair-none' ? undefined : item.id
                            }));
                            playSound(600);
                          }}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center text-center relative bg-[#232527] ${
                            isSelected
                              ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.02]'
                              : 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                          }`}
                        >
                          <div className="relative mb-2 w-16 h-16 flex items-center justify-center bg-[#111214] rounded-lg overflow-hidden">
                            <Moro3D character={draft} width={64} height={64} previewHair={item} />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-200 line-clamp-1 leading-tight px-1 text-center w-full">
                            {getTranslation(`ITEM_${item.id.toUpperCase().replace(/-/g, '_')}_NAME`, language) || item.name}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                              <i className="fa-solid fa-check text-[7px] text-white"></i>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hair Color */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    2. Hair Color Shader
                  </h4>

                  {/* Grid Palette */}
                  <div className="grid grid-cols-5 gap-2.5 mb-4">
                    {hairColors.map((color) => {
                      const isSelected = (draft.hairColor || '#1e293b').toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.name}
                          onClick={() => {
                            setDraft(prev => ({ ...prev, hairColor: color.hex }));
                            playSound(400);
                          }}
                          className={`group aspect-square rounded-xl transition-all border-2 relative flex flex-col items-center justify-center p-1 ${
                            isSelected
                              ? 'border-[#00A2FF] scale-105 shadow-md shadow-[#00A2FF]/10'
                              : 'border-[#2D3033] hover:scale-[1.03]'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          <span className="opacity-0 group-hover:opacity-100 absolute bottom-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white font-mono leading-none pointer-events-none transition-opacity">
                            {color.name}
                          </span>
                          {isSelected && (
                            <i className="fa-solid fa-check text-[9px] drop-shadow bg-black/40 text-white p-1 rounded-full"></i>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Advanced Color Picker */}
                  <div className="bg-[#111214] p-4 rounded-xl border border-[#2D3033] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">Custom Hair Hex</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">{draft.hairColor || '#1e293b'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={draft.hairColor || '#1e293b'}
                        onChange={(e) => setDraft(prev => ({ ...prev, hairColor: e.target.value }))}
                        className="bg-[#252729] border border-[#2D3033] rounded-lg px-3 py-1.5 font-mono text-xs w-24 text-center focus:ring-1 focus:ring-[#00A2FF] text-white"
                      />
                      <input
                        type="color"
                        value={(draft.hairColor || '#1e293b').startsWith('#') ? (draft.hairColor || '#1e293b') : '#1e293b'}
                        onChange={(e) => setDraft(prev => ({ ...prev, hairColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. FACIAL FEATURES TAB */}
            {activeTab === 'face' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    Faces & Expressions Gallery
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Default Face */}
                    <button
                      onClick={() => {
                        setDraft(prev => ({ ...prev, faceId: undefined }));
                        playSound(600);
                      }}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center text-center relative bg-[#232527] ${
                        !draft.faceId
                          ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.02]'
                          : 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                      }`}
                    >
                      <div className="relative mb-2 w-16 h-16 flex items-center justify-center bg-[#111214] rounded-lg overflow-hidden">
                        <Moro3D character={{ ...draft, faceId: undefined }} width={64} height={64} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-200">
                        Default Smile
                      </span>
                      {!draft.faceId && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                          <i className="fa-solid fa-check text-[7px] text-white"></i>
                        </div>
                      )}
                    </button>

                    {/* Loaded faces */}
                    {MARKETPLACE_ITEMS.filter(i => i.type === MarketplaceItemType.FACE).map((item) => {
                      const isOwned = isItemOwned(item);
                      const isSelected = draft.faceId === item.id;
                      return (
                        <button
                          key={item.id}
                          disabled={!isOwned}
                          onClick={() => {
                            setDraft(prev => ({ ...prev, faceId: item.id }));
                            playSound(600);
                          }}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center text-center relative bg-[#232527] ${
                            isSelected
                              ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.02]'
                              : isOwned
                                ? 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                                : 'border-transparent bg-[#1E2022] opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="relative mb-2 w-16 h-16 flex items-center justify-center bg-[#111214] rounded-lg overflow-hidden">
                            <Moro3D character={draft} width={64} height={64} previewFace={item} />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-200 line-clamp-1">
                            {getTranslation(`ITEM_${item.id.toUpperCase().replace(/-/g, '_')}_NAME`, language) || item.name}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                              <i className="fa-solid fa-check text-[7px] text-white"></i>
                            </div>
                          )}
                          {!isOwned && (
                            <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-slate-300 font-bold flex items-center gap-1">
                              <i className="fa-solid fa-lock text-[7px]"></i> LOCKED
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. CLOTHING & OUTFIITS TAB */}
            {activeTab === 'clothing' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Patterns */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    1. Choose Apparel Pattern
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* No Shirt */}
                    <button
                      onClick={() => {
                        setDraft(prev => ({ ...prev, shirtId: undefined }));
                        playSound(600);
                      }}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center text-center relative bg-[#232527] ${
                        !draft.shirtId
                          ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.02]'
                          : 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                      }`}
                    >
                      <div className="relative mb-2 w-16 h-16 flex items-center justify-center bg-[#111214] rounded-lg overflow-hidden">
                        <Moro3D character={{ ...draft, shirtId: undefined }} width={64} height={64} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-200">
                        Default Style
                      </span>
                      {!draft.shirtId && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                          <i className="fa-solid fa-check text-[7px] text-white"></i>
                        </div>
                      )}
                    </button>

                    {/* Pattern shirts */}
                    {MARKETPLACE_ITEMS.filter(i => i.type === MarketplaceItemType.SHIRT).map((item) => {
                      const isOwned = isItemOwned(item);
                      const isSelected = draft.shirtId === item.id;
                      return (
                        <button
                          key={item.id}
                          disabled={!isOwned}
                          onClick={() => {
                            setDraft(prev => ({ ...prev, shirtId: item.id }));
                            playSound(600);
                          }}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center text-center relative bg-[#232527] ${
                            isSelected
                              ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.02]'
                              : isOwned
                                ? 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                                : 'border-transparent bg-[#1E2022] opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="relative mb-2 w-16 h-16 flex items-center justify-center bg-[#111214] rounded-lg overflow-hidden">
                            <Moro3D character={draft} width={64} height={64} previewShirt={item} />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-200 line-clamp-1 w-full text-center">
                            {getTranslation(`ITEM_${item.id.toUpperCase().replace(/-/g, '_')}_NAME`, language) || item.name}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                              <i className="fa-solid fa-check text-[7px] text-white"></i>
                            </div>
                          )}
                          {!isOwned && (
                            <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-slate-300 font-bold flex items-center gap-1">
                              <i className="fa-solid fa-lock text-[7px]"></i> LOCKED
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shirt Color */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    2. Customize Apparel Hue Tint
                  </h4>

                  {/* Grid Palette */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {shirtColors.map((color) => {
                      const isSelected = (draft.shirtColor || '#ffffff').toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.name}
                          onClick={() => {
                            setDraft(prev => ({ ...prev, shirtColor: color.hex }));
                            playSound(400);
                          }}
                          className={`group h-11 rounded-lg transition-all border relative flex items-center justify-between px-3 bg-[#232527] ${
                            isSelected
                              ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.01]'
                              : 'border-[#2D3033] hover:bg-[#2A2C2E]'
                          }`}
                        >
                          <div className="w-4.5 h-4.5 rounded-full border border-black/30" style={{ backgroundColor: color.hex }} />
                          <span className="text-[10px] font-bold text-slate-300">
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom color input */}
                  <div className="bg-[#111214] p-4 rounded-xl border border-[#2D3033] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">Custom Apparel Hex Code</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">{draft.shirtColor || '#ffffff'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={draft.shirtColor || '#ffffff'}
                        onChange={(e) => setDraft(prev => ({ ...prev, shirtColor: e.target.value }))}
                        className="bg-[#252729] border border-[#2D3033] rounded-lg px-3 py-1.5 font-mono text-xs w-24 text-center focus:ring-1 focus:ring-[#00A2FF] text-white"
                      />
                      <input
                        type="color"
                        value={(draft.shirtColor || '#ffffff').startsWith('#') ? (draft.shirtColor || '#ffffff') : '#ffffff'}
                        onChange={(e) => setDraft(prev => ({ ...prev, shirtColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. BACKPACKS & ACCESSORIES */}
            {activeTab === 'backpack' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Backpack style */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    1. Select Gear / Accessory
                  </h4>
                  
                  {/* Info helper */}
                  <p className="text-[10px] text-[#00A2FF]/80 mb-3 italic">
                    💡 Pro-Tip: Slide the inspection angle on the left to review back accessories!
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* No Backpack */}
                    <button
                      onClick={() => {
                        setDraft(prev => ({ ...prev, backpackId: undefined }));
                        playSound(600);
                      }}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center text-center relative bg-[#232527] ${
                        !draft.backpackId
                          ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.02]'
                          : 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                      }`}
                    >
                      <div className="relative mb-2 w-16 h-16 flex items-center justify-center bg-[#111214] rounded-lg overflow-hidden">
                        <Moro3D character={{ ...draft, backpackId: undefined }} rotation={Math.PI} width={64} height={64} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-200">
                        No Accessory
                      </span>
                      {!draft.backpackId && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                          <i className="fa-solid fa-check text-[7px] text-white"></i>
                        </div>
                      )}
                    </button>

                    {/* Backpack items */}
                    {MARKETPLACE_ITEMS.filter(i => i.type === MarketplaceItemType.BACKPACK).map((item) => {
                      const isOwned = isItemOwned(item);
                      const isSelected = draft.backpackId === item.id;
                      return (
                        <button
                          key={item.id}
                          disabled={!isOwned}
                          onClick={() => {
                            setDraft(prev => ({ ...prev, backpackId: item.id }));
                            playSound(600);
                          }}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center text-center relative bg-[#232527] ${
                            isSelected
                              ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.02]'
                              : isOwned
                                ? 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                                : 'border-transparent bg-[#1E2022] opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="relative mb-2 w-16 h-16 flex items-center justify-center bg-[#111214] rounded-lg overflow-hidden">
                            <Moro3D character={draft} previewBackpack={item} rotation={Math.PI} width={64} height={64} />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-200 line-clamp-1 w-full text-center">
                            {getTranslation(`ITEM_${item.id.toUpperCase().replace(/-/g, '_')}_NAME`, language) || item.name}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                              <i className="fa-solid fa-check text-[7px] text-white"></i>
                            </div>
                          )}
                          {!isOwned && (
                            <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-slate-300 font-bold flex items-center gap-1">
                              <i className="fa-solid fa-lock text-[7px]"></i> LOCKED
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Backpack color */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    2. Customize Gear Color Tint
                  </h4>

                  {/* Grid Palette */}
                  <div className="grid grid-cols-5 gap-2.5 mb-4">
                    {backpackColors.map((color) => {
                      const isSelected = (draft.backpackColor || '#1e1b4b').toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.name}
                          onClick={() => {
                            setDraft(prev => ({ ...prev, backpackColor: color.hex }));
                            playSound(400);
                          }}
                          className={`group aspect-square rounded-xl transition-all border-2 relative flex flex-col items-center justify-center p-1 ${
                            isSelected
                              ? 'border-[#00A2FF] scale-105 shadow-md shadow-[#00A2FF]/10'
                              : 'border-[#2D3033] hover:scale-[1.03]'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          <span className="opacity-0 group-hover:opacity-100 absolute bottom-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white font-mono leading-none pointer-events-none transition-opacity">
                            {color.name}
                          </span>
                          {isSelected && (
                            <i className="fa-solid fa-check text-[9px] drop-shadow bg-black/40 text-white p-1 rounded-full"></i>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Advanced Color Picker */}
                  <div className="bg-[#111214] p-4 rounded-xl border border-[#2D3033] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">Custom Gear Hex</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">{draft.backpackColor || '#1e1b4b'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={draft.backpackColor || '#1e1b4b'}
                        onChange={(e) => setDraft(prev => ({ ...prev, backpackColor: e.target.value }))}
                        className="bg-[#252729] border border-[#2D3033] rounded-lg px-3 py-1.5 font-mono text-xs w-24 text-center focus:ring-1 focus:ring-[#00A2FF] text-white"
                      />
                      <input
                        type="color"
                        value={(draft.backpackColor || '#1e1b4b').startsWith('#') ? (draft.backpackColor || '#1e1b4b') : '#1e1b4b'}
                        onChange={(e) => setDraft(prev => ({ ...prev, backpackColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CHARACTER PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A2FF]"></span>
                    Wipeout Pimo Skins & Character Presets
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CHARACTERS.map((char) => {
                      const isOwned = isItemOwned(char);
                      const isSelected = draft.id === char.id;
                      return (
                        <button
                          key={char.id}
                          disabled={!isOwned && !char.isGuestPrompt}
                          onClick={() => {
                            setDraft(prev => ({ ...prev, ...char }));
                            playSound(600);
                          }}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col items-center text-center relative bg-[#232527] ${
                            isSelected
                              ? 'border-[#00A2FF] bg-[#1E2E3E] scale-[1.02]'
                              : isOwned || char.isGuestPrompt
                                ? 'border-[#2D3033] hover:bg-[#2A2C2E] hover:border-slate-500'
                                : 'border-transparent bg-[#1E2022] opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="relative mb-2 w-16 h-16 flex items-center justify-center bg-[#111214] rounded-lg overflow-hidden">
                            <Moro3D character={char} width={64} height={64} />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-100 leading-tight">
                            {getTranslation(`ITEM_${char.id.toUpperCase().replace(/-/g, '_')}_NAME`, language) || char.name}
                          </span>
                          <span className="text-[8px] text-slate-400 mt-1 block max-w-full truncate">{char.description}</span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#00A2FF] rounded-full flex items-center justify-center">
                              <i className="fa-solid fa-check text-[7px] text-white"></i>
                            </div>
                          )}
                          {!isOwned && !char.isGuestPrompt && (
                            <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-slate-300 font-bold flex items-center gap-1">
                              <i className="fa-solid fa-lock text-[7px]"></i> LOCKED
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls (Roblox Game Options Bar) */}
          <div className="flex flex-col sm:flex-row gap-3 border-t border-[#2D3033] pt-5">
            <button
              onClick={handleReset}
              className="px-5 py-3.5 bg-[#252729] hover:bg-[#323539] text-[#f2f4f5] border border-[#393B3D] font-bold rounded-lg text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-rotate-left"></i> Revert Preset
            </button>
            <button
              onClick={() => { playSound(600); onClose(); setGameState(GameState.MARKETPLACE); }}
              className="px-5 py-3.5 bg-[#00A2FF]/10 text-[#00A2FF] border border-[#00A2FF]/20 font-bold rounded-lg text-xs transition-all hover:bg-[#00A2FF]/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-basket-shopping"></i> Custom Catalog Shop
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-5 py-3.5 bg-[#00A2FF] hover:bg-[#1faeff] text-white font-bold rounded-lg text-xs transition-all shadow-lg shadow-[#00A2FF]/20 active:scale-95 flex items-center justify-center gap-1.5 border border-[#0084FF]"
            >
              <i className="fa-solid fa-square-check"></i> Wear / Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
