export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'Milestone' | 'Gameplay' | 'Economy' | 'Avatar' | 'Social' | 'Creative' | 'Challenge';
  icon: string;
  xp: number;
  gamerscore?: number;
  pimobuxReward: number;
  unlockedAt?: string;
  progressPercent?: number;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_run',
    title: 'First Wipeout',
    description: 'Start your very first Wipeout Pimo run!',
    category: 'Gameplay',
    icon: 'fa-person-running',
    xp: 250,
    gamerscore: 25,
    pimobuxReward: 25,
  },
  {
    id: 'distance_1000',
    title: 'Obstacle Runner',
    description: 'Reach 1,000 meters distance in any game map.',
    category: 'Milestone',
    icon: 'fa-gauge-high',
    xp: 500,
    gamerscore: 50,
    pimobuxReward: 50,
  },
  {
    id: 'distance_5000',
    title: 'PRO Racer Legend',
    description: 'Reach 5,000 meters in any map & unlock the PRO Tier Badge!',
    category: 'Milestone',
    icon: 'fa-crown',
    xp: 2500,
    gamerscore: 250,
    pimobuxReward: 250,
  },
  {
    id: 'pimobux_50',
    title: 'Bux Collector',
    description: 'Collect 50 PimoBux during gameplay.',
    category: 'Economy',
    icon: 'fa-coins',
    xp: 400,
    gamerscore: 40,
    pimobuxReward: 40,
  },
  {
    id: 'pimobux_500',
    title: 'PimoBux Millionaire',
    description: 'Accumulate a total balance of 500 PimoBux.',
    category: 'Economy',
    icon: 'fa-sack-dollar',
    xp: 1000,
    gamerscore: 100,
    pimobuxReward: 100,
  },
  {
    id: 'customizer',
    title: 'Fashion Icon',
    description: 'Customize your avatar skin, shirt, or face.',
    category: 'Avatar',
    icon: 'fa-shirt',
    xp: 300,
    gamerscore: 30,
    pimobuxReward: 30,
  },
  {
    id: 'kart_master',
    title: 'Kart Champion',
    description: 'Enter and race in Pimo Kart mode.',
    category: 'Gameplay',
    icon: 'fa-car-side',
    xp: 600,
    gamerscore: 60,
    pimobuxReward: 60,
  },
  {
    id: 'social_hero',
    title: 'Server Legend',
    description: 'Join a multiplayer lobby or server with Pimo Bot.',
    category: 'Social',
    icon: 'fa-users',
    xp: 500,
    gamerscore: 50,
    pimobuxReward: 50,
  },
  {
    id: 'map_architect',
    title: 'World Architect',
    description: 'Create and save a custom level in Map Editor.',
    category: 'Creative',
    icon: 'fa-cubes',
    xp: 800,
    gamerscore: 80,
    pimobuxReward: 80,
  },
  {
    id: 'emoter',
    title: 'Show Off',
    description: 'Perform an emote dance using the in-game emote wheel.',
    category: 'Social',
    icon: 'fa-face-smile',
    xp: 200,
    gamerscore: 20,
    pimobuxReward: 20,
  },
  {
    id: 'heart_shield',
    title: 'Unstoppable Force',
    description: 'Play with 3 Hearts mode enabled for extra resilience.',
    category: 'Challenge',
    icon: 'fa-shield-halved',
    xp: 750,
    gamerscore: 75,
    pimobuxReward: 75,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Trigger a max velocity nitro boost in Pimo Kart.',
    category: 'Gameplay',
    icon: 'fa-bolt',
    xp: 450,
    gamerscore: 45,
    pimobuxReward: 45,
  },
  {
    id: 'streak_master',
    title: 'Daily Streak Legend',
    description: 'Log in and play for 3 consecutive days.',
    category: 'Milestone',
    icon: 'fa-fire',
    xp: 600,
    gamerscore: 60,
    pimobuxReward: 60,
  },
  {
    id: 'miket_hoarder',
    title: 'Miket Hoarder',
    description: 'Collect over 100 Mikets across your gameplay sessions.',
    category: 'Economy',
    icon: 'fa-gem',
    xp: 850,
    gamerscore: 85,
    pimobuxReward: 85,
  },
  {
    id: 'hat_tricker',
    title: 'Fashion Master',
    description: 'Unlock 3 different custom avatar hats or accessories.',
    category: 'Avatar',
    icon: 'fa-hat-wizard',
    xp: 350,
    gamerscore: 35,
    pimobuxReward: 35,
  },
  {
    id: 'bot_slayer',
    title: 'Pimo Bot Rival',
    description: 'Outscore Pimo Bot in a single race or runner match.',
    category: 'Challenge',
    icon: 'fa-robot',
    xp: 900,
    gamerscore: 90,
    pimobuxReward: 90,
  },
  {
    id: 'parkour_pro',
    title: 'Obstacle Master',
    description: 'Cleanly dodge 20 consecutive obstacles without taking damage.',
    category: 'Gameplay',
    icon: 'fa-medal',
    xp: 700,
    gamerscore: 70,
    pimobuxReward: 70,
  },
  {
    id: 'pro_subscriber',
    title: 'Pimo Plus VIP',
    description: 'Unlock or activate Pimo Plus Premium membership status.',
    category: 'Milestone',
    icon: 'fa-star',
    xp: 1200,
    gamerscore: 120,
    pimobuxReward: 120,
  },
  {
    id: 'chat_tycoon',
    title: 'Social Butterfly',
    description: 'Send 10 chat messages in the live multiplayer server.',
    category: 'Social',
    icon: 'fa-comments',
    xp: 300,
    gamerscore: 30,
    pimobuxReward: 30,
  },
  {
    id: 'night_runner',
    title: 'Night Owl Racer',
    description: 'Race in Midnight mode under the glowing moon.',
    category: 'Challenge',
    icon: 'fa-moon',
    xp: 500,
    gamerscore: 50,
    pimobuxReward: 50,
  },
  {
    id: 'wipeout_survivor',
    title: 'Wipeout King',
    description: 'Achieve a record score of over 10,000 points in a single run.',
    category: 'Milestone',
    icon: 'fa-trophy',
    xp: 3000,
    gamerscore: 300,
    pimobuxReward: 300,
  }
];

export function isWindowsPC(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || '';
  const platform = (window.navigator as any).userAgentData?.platform || window.navigator.platform || '';
  return /Win/i.test(platform) || /Windows/i.test(ua);
}

export type AchievementPlatform = 'auto' | 'xbox' | 'google_play';

export function getEffectivePlatform(): 'xbox' | 'google_play' {
  const saved = localStorage.getItem('moro_achievement_platform') as AchievementPlatform | null;
  if (saved === 'xbox') return 'xbox';
  if (saved === 'google_play') return 'google_play';
  return isWindowsPC() ? 'xbox' : 'google_play';
}

export function setAchievementPlatformPreference(pref: AchievementPlatform) {
  try {
    localStorage.setItem('moro_achievement_platform', pref);
  } catch (e) {
    console.error('Failed to save achievement platform preference', e);
  }
}

export function getStoredUnlockedAchievements(): Record<string, string> {
  try {
    const saved = localStorage.getItem('moro_unlocked_achievements');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

export function saveUnlockedAchievements(unlockedMap: Record<string, string>) {
  try {
    localStorage.setItem('moro_unlocked_achievements', JSON.stringify(unlockedMap));
  } catch (e) {
    console.error('Failed to save achievements', e);
  }
}

// Xbox Live User & Gamertag State Helpers
export function getXboxGamertag(): string {
  try {
    const tag = localStorage.getItem('xbox_live_gamertag');
    return tag || (isWindowsPC() ? 'XboxPlayer1' : 'MoroGamer');
  } catch (e) {
    return 'MoroGamer';
  }
}

export function setXboxGamertag(gamertag: string) {
  try {
    localStorage.setItem('xbox_live_gamertag', gamertag);
  } catch (e) {
    console.error('Failed to store Xbox gamertag', e);
  }
}

export function isXboxLiveSignedIn(): boolean {
  try {
    const signedIn = localStorage.getItem('xbox_live_signed_in');
    return signedIn === 'true' || isWindowsPC();
  } catch (e) {
    return isWindowsPC();
  }
}

export function signInXboxLive(gamertag?: string): string {
  const newTag = gamertag || `XboxPlayer${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    localStorage.setItem('xbox_live_signed_in', 'true');
    localStorage.setItem('xbox_live_gamertag', newTag);
  } catch (e) {
    console.error('Failed signing into Xbox Live', e);
  }
  return newTag;
}

export function signOutXboxLive() {
  try {
    localStorage.setItem('xbox_live_signed_in', 'false');
  } catch (e) {
    console.error('Failed signing out of Xbox Live', e);
  }
}

export function getXboxGamerscoreTotal(): { current: number; max: number } {
  const unlocked = getStoredUnlockedAchievements();
  let current = 0;
  let max = 0;

  ACHIEVEMENTS_LIST.forEach((item) => {
    const score = item.gamerscore || 50;
    max += score;
    if (unlocked[item.id]) {
      current += score;
    }
  });

  return { current, max };
}

// Sound Synthesis for Xbox Achievement Unlock Chime
export function playXboxAchievementChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // Dual-tone pulse: warm base chord + resonant high chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(369.99, now); // F#4
    gain1.gain.setValueAtTime(0.01, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(554.37, now); // C#5
    gain2.gain.setValueAtTime(0.01, now);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.5);

    const chimeNotes = [
      { freq: 739.99, time: 0.12, duration: 0.8, gain: 0.30 },  // F#5
      { freq: 1108.73, time: 0.14, duration: 1.0, gain: 0.35 }, // C#6
      { freq: 1479.98, time: 0.16, duration: 1.2, gain: 0.28 }  // F#6
    ];

    chimeNotes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      gain.gain.setValueAtTime(0.01, now + note.time);
      gain.gain.linearRampToValueAtTime(note.gain, now + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.1);
    });
  } catch (e) {
    console.warn('Xbox chime sound error:', e);
  }
}

export function playGooglePlayChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0.00, duration: 0.16, type: 'sine' as OscillatorType, gain: 0.20 },
      { freq: 659.25, time: 0.06, duration: 0.16, type: 'sine' as OscillatorType, gain: 0.22 },
      { freq: 783.99, time: 0.12, duration: 0.18, type: 'sine' as OscillatorType, gain: 0.25 },
      { freq: 1046.50, time: 0.18, duration: 0.50, type: 'triangle' as OscillatorType, gain: 0.30 },
      { freq: 1318.51, time: 0.26, duration: 0.60, type: 'triangle' as OscillatorType, gain: 0.28 },
      { freq: 1567.98, time: 0.34, duration: 0.75, type: 'sine' as OscillatorType, gain: 0.22 },
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      gain.gain.setValueAtTime(0.01, now + note.time);
      gain.gain.linearRampToValueAtTime(note.gain, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });
  } catch (e) {
    console.warn('Google Play chime error:', e);
  }
}

export function playAchievementUnlockedSound() {
  const platform = getEffectivePlatform();
  if (platform === 'xbox') {
    playXboxAchievementChime();
  } else {
    playGooglePlayChime();
  }
}

// Gamepad API integration for Xbox Controller detection on Windows
export interface XboxGamepadState {
  connected: boolean;
  id: string;
  guideButtonPressed: boolean;
  aButtonPressed: boolean;
  xButtonPressed: boolean;
}

export function checkXboxGamepad(): XboxGamepadState {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) {
    return { connected: false, id: '', guideButtonPressed: false, aButtonPressed: false, xButtonPressed: false };
  }

  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    const gp = gamepads[i];
    if (gp && gp.connected) {
      const idLower = (gp.id || '').toLowerCase();
      const isXboxController = idLower.includes('xbox') || idLower.includes('xinput') || idLower.includes('microsoft') || idLower.includes('controller');
      
      // Index 16 is usually Guide / Nexus button on Xbox controllers
      const guidePressed = gp.buttons[16] ? gp.buttons[16].pressed : false;
      const aPressed = gp.buttons[0] ? gp.buttons[0].pressed : false;
      const xPressed = gp.buttons[2] ? gp.buttons[2].pressed : false;

      return {
        connected: true,
        id: gp.id,
        guideButtonPressed: guidePressed,
        aButtonPressed: aPressed,
        xButtonPressed: xPressed,
      };
    }
  }

  return { connected: false, id: '', guideButtonPressed: false, aButtonPressed: false, xButtonPressed: false };
}

export function initXboxGamepadListener(onGuideButton?: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let intervalId: any = null;
  let lastGuideState = false;

  const pollGamepad = () => {
    const state = checkXboxGamepad();
    if (state.connected && state.guideButtonPressed && !lastGuideState) {
      if (onGuideButton) {
        onGuideButton();
      }
    }
    lastGuideState = state.guideButtonPressed;
  };

  intervalId = setInterval(pollGamepad, 200);

  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}

export function unlockXboxAchievement(achievementId: string): Achievement | null {
  const ach = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);
  if (!ach) return null;

  const current = getStoredUnlockedAchievements();
  if (!current[achievementId]) {
    const nowISO = new Date().toISOString();
    current[achievementId] = nowISO;
    saveUnlockedAchievements(current);
    playXboxAchievementChime();
    return { ...ach, unlockedAt: nowISO };
  }

  return null;
}
