import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Achievement, 
  ACHIEVEMENTS_LIST, 
  getEffectivePlatform, 
  setAchievementPlatformPreference, 
  AchievementPlatform, 
  isWindowsPC 
} from '../src/data/achievements';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedMap: Record<string, string>; // achievementId -> unlockedAt ISO date string
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  unlockedMap
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPref, setSelectedPref] = useState<AchievementPlatform>(() => {
    return (localStorage.getItem('moro_achievement_platform') as AchievementPlatform) || 'auto';
  });

  if (!isOpen) return null;

  const effectivePlatform = selectedPref === 'auto' ? (isWindowsPC() ? 'xbox' : 'google_play') : selectedPref;
  const isXbox = effectivePlatform === 'xbox';

  const unlockedCount = Object.keys(unlockedMap).length;
  const totalCount = ACHIEVEMENTS_LIST.length;

  const totalXP = ACHIEVEMENTS_LIST.reduce((sum, item) => {
    return unlockedMap[item.id] ? sum + item.xp : sum;
  }, 0);

  const totalGamerscore = ACHIEVEMENTS_LIST.reduce((sum, item) => {
    return unlockedMap[item.id] ? sum + (item.gamerscore || 50) : sum;
  }, 0);

  const totalMoroBuxEarned = ACHIEVEMENTS_LIST.reduce((sum, item) => {
    return unlockedMap[item.id] ? sum + (item.pimobuxReward ?? item.morobuxReward ?? 0) : sum;
  }, 0);

  const maxGamerscore = ACHIEVEMENTS_LIST.reduce((sum, item) => sum + (item.gamerscore || 50), 0);

  const userLevel = Math.floor(totalXP / 500) + 1;
  const levelProgress = Math.min(100, Math.round(((totalXP % 500) / 500) * 100));

  const handlePlatformChange = (pref: AchievementPlatform) => {
    setSelectedPref(pref);
    setAchievementPlatformPreference(pref);
  };

  const categories = ['all', 'Milestone', 'Gameplay', 'Economy', 'Avatar', 'Social', 'Creative', 'Challenge'];

  const filteredList = ACHIEVEMENTS_LIST.filter(item => {
    const isUnlocked = !!unlockedMap[item.id];
    if (filter === 'unlocked' && !isUnlocked) return false;
    if (filter === 'locked' && isUnlocked) return false;
    
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }

    return true;
  });

  const primaryAccent = isXbox ? '#107C41' : '#34A853';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#1C1E22] border border-[#2D3033] rounded-3xl max-w-2xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-sans"
        >
          {/* Header with Dynamic Platform Branding (Xbox / Google Play) */}
          <div className="bg-gradient-to-r from-[#17181A] via-[#202124] to-[#17181A] p-6 border-b border-[#2D3033] relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pr-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg text-lg ${
                  isXbox 
                    ? 'bg-gradient-to-tr from-[#0E6234] to-[#107C41] shadow-emerald-700/30' 
                    : 'bg-gradient-to-tr from-[#0F9D58] to-[#34A853] shadow-emerald-500/20'
                }`}>
                  {isXbox ? <i className="fa-brands fa-xbox"></i> : <i className="fa-solid fa-trophy"></i>}
                </div>
                <div>
                  <span className={`text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 font-mono ${
                    isXbox ? 'text-[#107C41]' : 'text-[#34A853]'
                  }`}>
                    {isXbox ? (
                      <><i className="fa-brands fa-xbox"></i> XBOX NETWORK (WINDOWS PC)</>
                    ) : (
                      <><i className="fa-solid fa-gamepad"></i> GOOGLE PLAY GAMES</>
                    )}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Achievements
                  </h2>
                </div>
              </div>

              {/* Platform Selector Switch */}
              <div className="bg-[#141618] border border-[#2D3033] p-1 rounded-xl flex items-center gap-1 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => handlePlatformChange('auto')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase font-mono transition-all ${
                    selectedPref === 'auto' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Auto Detect Platform (Windows PC = Xbox, Mobile/Other = Google Play)"
                >
                  Auto
                </button>
                <button
                  onClick={() => handlePlatformChange('xbox')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase font-mono transition-all flex items-center gap-1 ${
                    selectedPref === 'xbox' ? 'bg-[#107C41] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <i className="fa-brands fa-xbox"></i> Xbox
                </button>
                <button
                  onClick={() => handlePlatformChange('google_play')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase font-mono transition-all flex items-center gap-1 ${
                    selectedPref === 'google_play' ? 'bg-[#34A853] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <i className="fa-brands fa-google-play"></i> Play
                </button>
              </div>
            </div>

            {/* Level / Gamerscore Stats Box */}
            <div className="bg-[#25282C] border border-[#34383D] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mt-4">
              {/* Badge */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center text-white shadow-md shrink-0 ${
                  isXbox 
                    ? 'bg-gradient-to-br from-[#107C41] to-[#0D5C30] border-[#107C41]/50' 
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400/40'
                }`}>
                  {isXbox ? (
                    <>
                      <i className="fa-solid fa-circle-dot text-[9px] text-emerald-300"></i>
                      <span className="text-sm font-black leading-none font-mono">G</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] font-black uppercase text-red-200">LVL</span>
                      <span className="text-lg font-black leading-none">{userLevel}</span>
                    </>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-300 block">
                    {isXbox ? 'Gamerscore' : 'Play Gamer'}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isXbox ? 'text-emerald-400' : 'text-emerald-400'}`}>
                    {isXbox ? `${totalGamerscore.toLocaleString()} / ${maxGamerscore.toLocaleString()} G` : `${totalXP.toLocaleString()} XP`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">
                    {isXbox ? 'Gamerscore Completion' : `Level ${userLevel} Progress`}
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {isXbox ? `${Math.round((totalGamerscore / maxGamerscore) * 100)}%` : `${totalXP % 500} / 500 XP`}
                  </span>
                </div>
                <div className="w-full bg-[#17181A] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isXbox 
                        ? 'bg-gradient-to-r from-[#0E6234] to-[#107C41]' 
                        : 'bg-gradient-to-r from-[#0F9D58] to-[#34A853]'
                    }`}
                    style={{ 
                      width: isXbox 
                        ? `${Math.round((totalGamerscore / maxGamerscore) * 100)}%` 
                        : `${levelProgress}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Unlocked {unlockedCount} of {totalCount}</span>
                  <span>{Math.round((unlockedCount / totalCount) * 100)}% Complete</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-[#17181A] px-6 py-3 border-b border-[#2D3033] space-y-3">
            {/* Top row: Status Filter + Search input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-bold">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filter === 'all' 
                      ? isXbox ? 'bg-[#107C41] text-white shadow-md' : 'bg-[#34A853] text-white shadow-md' 
                      : 'bg-[#232527] text-slate-400 hover:text-white'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setFilter('unlocked')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filter === 'unlocked' 
                      ? isXbox ? 'bg-[#107C41] text-white shadow-md' : 'bg-[#34A853] text-white shadow-md' 
                      : 'bg-[#232527] text-slate-400 hover:text-white'
                  }`}
                >
                  Unlocked ({unlockedCount})
                </button>
                <button
                  onClick={() => setFilter('locked')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filter === 'locked' 
                      ? isXbox ? 'bg-[#107C41] text-white shadow-md' : 'bg-[#34A853] text-white shadow-md' 
                      : 'bg-[#232527] text-slate-400 hover:text-white'
                  }`}
                >
                  Locked ({totalCount - unlockedCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:max-w-xs">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search achievements..."
                  className="w-full bg-[#202326] border border-[#2D3033] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom row: Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-slate-500 font-mono text-[10px] uppercase mr-1 shrink-0">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono font-bold shrink-0 transition-all ${
                    categoryFilter === cat
                      ? isXbox 
                        ? 'bg-[#107C41]/30 text-emerald-300 border border-[#107C41]' 
                        : 'bg-[#34A853]/30 text-emerald-300 border border-[#34A853]'
                      : 'bg-[#202225] text-slate-400 border border-transparent hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Achievements List Container */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <i className="fa-solid fa-trophy-slash text-4xl mb-3 block text-slate-600"></i>
                <p className="font-bold">No achievements found in this view.</p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isUnlocked = !!unlockedMap[item.id];
                const unlockedDate = unlockedMap[item.id];

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isUnlocked
                        ? isXbox 
                          ? 'bg-[#1E2328] border-[#107C41]/50 shadow-lg shadow-emerald-950/20' 
                          : 'bg-[#222529] border-[#34A853]/40 shadow-lg shadow-emerald-500/5'
                        : 'bg-[#181A1C] border-[#2A2D30] opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                          isUnlocked
                            ? isXbox 
                              ? 'bg-gradient-to-tr from-[#0E6234] to-[#107C41] text-white shadow-md' 
                              : 'bg-gradient-to-tr from-[#0F9D58] to-[#34A853] text-white shadow-md shadow-emerald-500/20'
                            : 'bg-[#232527] text-slate-500 border border-[#2D3033]'
                        }`}
                      >
                        <i className={`fa-solid ${item.icon}`}></i>
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h4 className={`font-bold text-sm truncate ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>
                            {item.title}
                          </h4>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase border border-slate-700/60 shrink-0">
                            {item.category}
                          </span>
                          {isUnlocked && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase font-mono ${
                              isXbox ? 'bg-[#107C41]/20 text-[#12A054]' : 'bg-[#34A853]/20 text-[#34A853]'
                            }`}>
                              UNLOCKED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate leading-relaxed">
                          {item.description}
                        </p>
                        {isUnlocked && unlockedDate && (
                          <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                            Unlocked: {new Date(unlockedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1 font-mono">
                      {isXbox ? (
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                          isUnlocked ? 'bg-[#107C41]/20 text-emerald-300 border-[#107C41]/40' : 'bg-[#202326] text-slate-500 border-slate-700'
                        }`}>
                          +{item.gamerscore || 50} G
                        </span>
                      ) : (
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                          isUnlocked ? 'bg-[#34A853]/20 text-emerald-300 border-[#34A853]/40' : 'bg-[#202326] text-slate-500 border-slate-700'
                        }`}>
                          +{item.xp} XP
                        </span>
                      )}
                      <span className="text-[10px] text-yellow-400/90 font-bold">
                        +{item.pimobuxReward ?? item.morobuxReward ?? 0} Bux
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
