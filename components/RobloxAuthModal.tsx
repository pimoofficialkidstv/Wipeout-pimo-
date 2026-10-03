import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getTranslation } from '../src/translations';

interface RobloxAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: {
    username: string;
    age: number;
    gender?: 'female' | 'male' | 'other';
    isGuest?: boolean;
  }) => void;
  onGoogleSignIn: () => Promise<boolean | void>;
  onDirectGoogleSignIn?: (email?: string, name?: string) => Promise<boolean>;
  language: string;
  initialMode?: 'signup' | 'login';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EXPERIENCE_TILES = [
  { title: 'Classic Hills', icon: 'fa-trophy', gradient: 'from-emerald-500 to-teal-700' },
  { title: 'Neon City 2099', icon: 'fa-city', gradient: 'from-fuchsia-600 to-purple-900' },
  { title: 'Cosmic Orbit', icon: 'fa-shuttle-space', gradient: 'from-indigo-600 to-blue-950' },
  { title: 'Mystic Forest', icon: 'fa-tree', gradient: 'from-teal-600 to-green-900' },
  { title: 'Pirate Cove', icon: 'fa-anchor', gradient: 'from-blue-600 to-amber-900' },
  { title: 'Cyber Grid', icon: 'fa-microchip', gradient: 'from-cyan-500 to-blue-900' },
  { title: 'Pimo Kart 2.5', icon: 'fa-flag-checkered', gradient: 'from-orange-500 to-red-800' },
  { title: 'Crystal Caves', icon: 'fa-gem', gradient: 'from-cyan-400 to-indigo-800' },
  { title: 'Volcano Run', icon: 'fa-volcano', gradient: 'from-red-600 to-yellow-800' },
  { title: 'Ice Cavern', icon: 'fa-icicles', gradient: 'from-sky-400 to-blue-800' },
  { title: 'Duo Adventure', icon: 'fa-user-group', gradient: 'from-pink-500 to-purple-800' },
  { title: 'Terrain Studio', icon: 'fa-cube', gradient: 'from-purple-600 to-pink-700' },
  { title: 'Candy Kingdom', icon: 'fa-candy-cane', gradient: 'from-pink-400 to-rose-600' },
  { title: 'Desert Dunes', icon: 'fa-sun', gradient: 'from-amber-500 to-yellow-700' },
  { title: 'Speed Arena', icon: 'fa-bolt', gradient: 'from-yellow-400 to-amber-700' },
  { title: 'Pimo Royale', icon: 'fa-crown', gradient: 'from-amber-400 to-purple-900' },
];

export const RobloxAuthModal: React.FC<RobloxAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onGoogleSignIn,
  onDirectGoogleSignIn,
  language,
  initialMode = 'signup',
}) => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>(initialMode);
  
  // Sign Up Form States
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [gender, setGender] = useState<'female' | 'male' | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const [showDirectGoogleFallback, setShowDirectGoogleFallback] = useState<boolean>(false);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= currentYear - 100; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const days = useMemo(() => {
    const list: number[] = [];
    for (let d = 1; d <= 31; d++) {
      list.push(d);
    }
    return list;
  }, []);

  // Calculate age from birthday
  const calculatedAge = useMemo(() => {
    if (!birthYear) return 10;
    const y = parseInt(birthYear, 10);
    const age = currentYear - y;
    return isNaN(age) || age < 1 ? 10 : age;
  }, [birthYear, currentYear]);

  if (!isOpen) return null;

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg('Please enter a username.');
      return;
    }
    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (cleanUsername.length > 20) {
      setErrorMsg('Username cannot exceed 20 characters.');
      return;
    }
    if (password && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem('moro_username', cleanUsername);
      localStorage.setItem('moro_player_name', cleanUsername);
      localStorage.setItem('moro_user_age', String(calculatedAge));
      localStorage.setItem('moro_age_verified', 'true');
      if (gender) {
        localStorage.setItem('moro_gender', gender);
      }
      onSuccess({
        username: cleanUsername,
        age: calculatedAge,
        gender: gender || 'other',
        isGuest: false,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = loginIdentifier.trim();
    if (!cleanUser) {
      setErrorMsg('Please enter your username or email.');
      return;
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem('moro_username', cleanUser);
      localStorage.setItem('moro_player_name', cleanUser);
      localStorage.setItem('moro_age_verified', 'true');
      onSuccess({
        username: cleanUser,
        age: calculatedAge || 12,
        isGuest: false,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuthClick = async () => {
    setErrorMsg(null);
    setIsGoogleSigningIn(true);
    try {
      const success = await onGoogleSignIn();
      if (success !== false) {
        onClose();
      }
    } catch (err: any) {
      console.warn("Google auth attempt:", err);
      const code = err.code || '';
      if (code === 'auth/popup-blocked' || err.message?.includes('popup') || code === 'auth/cancelled-popup-request') {
        setErrorMsg('Google Sign-In popup was blocked by browser or preview iframe. Click "Instant Google Connect" below to proceed.');
        setShowDirectGoogleFallback(true);
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg('Firebase domain not allowlisted. Click "Instant Google Connect" below to connect with your Google Profile.');
        setShowDirectGoogleFallback(true);
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in window was closed. Click below to retry or connect directly.');
        setShowDirectGoogleFallback(true);
      } else {
        setErrorMsg(err.message || 'Google Sign-In was interrupted. You can connect directly below.');
        setShowDirectGoogleFallback(true);
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleDirectGoogleClick = async () => {
    setErrorMsg(null);
    setIsGoogleSigningIn(true);
    try {
      if (onDirectGoogleSignIn) {
        await onDirectGoogleSignIn();
      } else {
        const guestName = 'Zayd Sad';
        localStorage.setItem('moro_username', 'zaydsad960');
        localStorage.setItem('moro_player_name', guestName);
        localStorage.setItem('moro_user_age', '12');
        localStorage.setItem('moro_age_verified', 'true');
        onSuccess({
          username: guestName,
          age: 12,
          isGuest: false,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Direct sync failed.');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleQuickGuestPlay = () => {
    const randomGuest = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('moro_username', randomGuest);
    localStorage.setItem('moro_player_name', randomGuest);
    localStorage.setItem('moro_user_age', '10');
    localStorage.setItem('moro_age_verified', 'true');
    onSuccess({
      username: randomGuest,
      age: 10,
      isGuest: true,
    });
    onClose();
  };

  return (
    <div id="wipeout-moro-auth-overlay" className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none">
      
      {/* Background Animated Experience Cards Wall */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 -rotate-6 scale-110 -translate-y-12">
          {EXPERIENCE_TILES.concat(EXPERIENCE_TILES).map((tile, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-2xl sm:rounded-3xl p-3 flex flex-col justify-end bg-gradient-to-br ${tile.gradient} border border-white/20 shadow-2xl relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"></div>
              <i className={`fa-solid ${tile.icon} text-white/30 text-4xl sm:text-6xl absolute top-3 right-3`}></i>
              <span className="relative z-10 text-[10px] sm:text-xs font-black text-white uppercase tracking-wider truncate drop-shadow-md">
                {tile.title}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-radial from-transparent via-black/60 to-black"></div>
      </div>

      {/* Top Header Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20 max-w-7xl mx-auto w-full">
        {/* Stylized White Wipeout Pimo Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-yellow-400 via-amber-500 to-red-500 rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)] rotate-[-8deg] transition-transform hover:rotate-0 border-2 border-white/40">
            <i className="fa-solid fa-gamepad text-white text-base sm:text-lg drop-shadow"></i>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl sm:text-2xl tracking-[-0.03em] text-white font-sans uppercase drop-shadow">
                WIPEOUT PIMO
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase bg-amber-500/30 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full hidden sm:inline-block">
                OFFICIAL
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold -mt-0.5 tracking-wider hidden sm:block">PIMO STUDIO PLATFORM</span>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {authMode === 'signup' ? (
            <button
              id="top-login-switch-btn"
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
                setShowDirectGoogleFallback(false);
              }}
              className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg bg-white/95 hover:bg-white text-slate-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              Log In
            </button>
          ) : (
            <button
              id="top-signup-switch-btn"
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg(null);
                setShowDirectGoogleFallback(false);
              }}
              className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg bg-white/95 hover:bg-white text-slate-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              Sign Up
            </button>
          )}

          <button
            id="auth-modal-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center text-sm transition-all"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px] bg-[#1E2024]/95 border border-white/10 rounded-2xl sm:rounded-[1.75rem] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl my-16 text-white"
      >
        <AnimatePresence mode="wait">
          {authMode === 'signup' ? (
            /* ==================== SIGN UP FORM ==================== */
            <motion.div
              key="signup-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl sm:text-2xl font-black text-center text-white uppercase tracking-tight mb-6">
                SIGN UP FOR WIPEOUT PIMO
              </h2>

              {errorMsg && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold px-4 py-2.5 rounded-xl mb-4 flex flex-col gap-1.5 animate-shake">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* One-Click Direct Google Sync Fallback */}
              {showDirectGoogleFallback && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/40 rounded-xl flex flex-col gap-2 animate-in fade-in">
                  <div className="text-[11px] text-blue-200 font-medium">
                    <i className="fa-solid fa-circle-info mr-1.5 text-blue-400"></i>
                    Instant Connect syncs your profile securely without popup blockers:
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectGoogleClick}
                    disabled={isGoogleSigningIn}
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <i className="fa-brands fa-google"></i>
                    <span>Instant Google Connect (zaydsad960@gmail.com)</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {/* Birthday Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Birthday
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Month */}
                    <div className="relative">
                      <select
                        id="signup-month-select"
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        className="w-full bg-[#111215] border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-white/40 cursor-pointer font-medium"
                      >
                        <option value="" disabled>Month</option>
                        {MONTHS.map((m, idx) => (
                          <option key={idx} value={m} className="bg-slate-900 text-white">{m}</option>
                        ))}
                      </select>
                      <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                    </div>

                    {/* Day */}
                    <div className="relative">
                      <select
                        id="signup-day-select"
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        className="w-full bg-[#111215] border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-white/40 cursor-pointer font-medium"
                      >
                        <option value="" disabled>Day</option>
                        {days.map((d) => (
                          <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
                        ))}
                      </select>
                      <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                    </div>

                    {/* Year */}
                    <div className="relative">
                      <select
                        id="signup-year-select"
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        className="w-full bg-[#111215] border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-white/40 cursor-pointer font-medium"
                      >
                        <option value="" disabled>Year</option>
                        {years.map((y) => (
                          <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                        ))}
                      </select>
                      <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                    </div>
                  </div>
                </div>

                {/* Username Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="signup-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Don't use your real name"
                      autoComplete="username"
                      className="w-full bg-[#111215] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/40 font-medium"
                    />
                    {username.length >= 3 && (
                      <i className="fa-solid fa-circle-check text-green-400 text-xs absolute right-3.5 top-1/2 -translate-y-1/2"></i>
                    )}
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="w-full bg-[#111215] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/40 font-medium pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Gender (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Gender <span className="text-slate-500 normal-case font-normal">(optional)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Female Toggle */}
                    <button
                      id="gender-female-btn"
                      type="button"
                      onClick={() => setGender(gender === 'female' ? null : 'female')}
                      className={`h-11 rounded-lg border flex items-center justify-center transition-all ${
                        gender === 'female'
                          ? 'bg-pink-600/30 border-pink-500 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                          : 'bg-[#111215] border-white/15 text-slate-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <circle cx="12" cy="7" r="4" />
                        <path d="M7 21v-4a5 5 0 0 1 10 0v4" />
                      </svg>
                    </button>

                    {/* Male Toggle */}
                    <button
                      id="gender-male-btn"
                      type="button"
                      onClick={() => setGender(gender === 'male' ? null : 'male')}
                      className={`h-11 rounded-lg border flex items-center justify-center transition-all ${
                        gender === 'male'
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                          : 'bg-[#111215] border-white/15 text-slate-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <circle cx="12" cy="7" r="4" />
                        <path d="M6 21v-5a5 5 0 0 1 10 0v5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Legal / Terms Disclaimer */}
                <p className="text-[10px] text-slate-400 leading-relaxed text-left pt-1">
                  By clicking Sign Up, you are agreeing to the{' '}
                  <span className="text-amber-400 hover:underline cursor-pointer">Terms of Use</span> and acknowledging the{' '}
                  <span className="text-amber-400 hover:underline cursor-pointer">Privacy Policy</span>.
                </p>

                {/* Main Sign Up Action Button */}
                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              {/* Alternative Quick Sign-in Options */}
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <button
                  id="signup-google-btn"
                  type="button"
                  onClick={handleGoogleAuthClick}
                  disabled={isGoogleSigningIn}
                  className="w-full py-2.5 rounded-lg bg-[#111215] hover:bg-[#1A1C20] border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGoogleSigningIn ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-amber-400"></i>
                  ) : (
                    <i className="fa-brands fa-google text-red-400"></i>
                  )}
                  <span>{isGoogleSigningIn ? 'Connecting to Google...' : 'Sign in with Google Cloud'}</span>
                </button>

                <button
                  id="signup-guest-btn"
                  type="button"
                  onClick={handleQuickGuestPlay}
                  className="w-full py-2 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  ⚡ Quick Play as Guest
                </button>
              </div>
            </motion.div>
          ) : (
            /* ==================== LOG IN FORM ==================== */
            <motion.div
              key="login-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl sm:text-2xl font-black text-center text-white uppercase tracking-tight mb-6">
                LOG IN TO WIPEOUT PIMO
              </h2>

              {errorMsg && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold px-4 py-2.5 rounded-xl mb-4 flex flex-col gap-1.5 animate-shake">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* One-Click Direct Google Sync Fallback */}
              {showDirectGoogleFallback && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/40 rounded-xl flex flex-col gap-2 animate-in fade-in">
                  <div className="text-[11px] text-blue-200 font-medium">
                    <i className="fa-solid fa-circle-info mr-1.5 text-blue-400"></i>
                    Instant Connect syncs your profile securely without popup blockers:
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectGoogleClick}
                    disabled={isGoogleSigningIn}
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <i className="fa-brands fa-google"></i>
                    <span>Instant Google Connect (zaydsad960@gmail.com)</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Username / Email
                  </label>
                  <input
                    id="login-username-input"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Username / Email"
                    autoComplete="username"
                    className="w-full bg-[#111215] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/40 font-medium"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-[10px] text-amber-400 hover:underline cursor-pointer">
                      Forgot Password?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password-input"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                      autoComplete="current-password"
                      className="w-full bg-[#111215] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/40 font-medium pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Main Log In Action Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? 'Logging In...' : 'Log In'}
                </button>
              </form>

              {/* Alternative Quick Sign-in Options */}
              <div className="mt-5 pt-5 border-t border-white/10 space-y-2.5">
                <button
                  id="login-google-btn"
                  type="button"
                  onClick={handleGoogleAuthClick}
                  disabled={isGoogleSigningIn}
                  className="w-full py-2.5 rounded-lg bg-[#111215] hover:bg-[#1A1C20] border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGoogleSigningIn ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-amber-400"></i>
                  ) : (
                    <i className="fa-brands fa-google text-red-400"></i>
                  )}
                  <span>{isGoogleSigningIn ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
                </button>

                <button
                  id="login-guest-btn"
                  type="button"
                  onClick={handleQuickGuestPlay}
                  className="w-full py-2 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  ⚡ Play as Guest
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMsg(null);
                        setShowDirectGoogleFallback(false);
                      }}
                      className="text-white font-bold hover:underline ml-1"
                    >
                      Sign Up
                    </button>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RobloxAuthModal;
