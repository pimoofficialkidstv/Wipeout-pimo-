// Temporary interfaces to allow compilation while removing friend features
interface Friend { id: string; name: string; username: string; isOnline?: boolean; character?: any; description?: string; followers?: number; following?: number; friendsCount?: number; }
interface Message { id: string; text: string; senderId: string; receiverId?: string; timestamp?: any; participants?: string[]; }

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import GooglePayButton from '@google-pay/button-react';
import { motion, AnimatePresence } from 'motion/react';
import { Bluetooth } from 'lucide-react';
import { GameState, Character, Difficulty, MarketplaceItem, MarketplaceItemType, MapType, Controls, VehicleType } from './types';
import { CHARACTERS, MARKETPLACE_ITEMS } from './constants.tsx';

import Game from './components/Game';
import MapCreator from './components/MapCreator';
import Marketplace from './components/Marketplace';
import MagicalWorld from './components/MagicalWorld';
import CustomMaps from './components/CustomMaps';
import CallMoro from './components/CallMoro';
import PimobuxIcon from './components/PimobuxIcon';
import MiketsIcon from './components/MiketsIcon';
import RobloxStudioIcon from './components/RobloxStudioIcon';
import ProfileModal from './components/ProfileModal';
import { RobloxAuthModal } from './components/RobloxAuthModal';
import AIAssistant from './components/AIAssistant';
import Lobby from './components/Lobby';
import OfflineGame from './components/OfflineGame';
import Moro3D from './components/Moro3D';
import { AvatarCustomizer } from './components/AvatarCustomizer';
import { CreditsScreen } from './components/CreditsScreen';

import { getGameTips } from './services/geminiService';
import { getByeByeAudio, playAudio, getSegaAnnouncerAudio, getGameOverSound, getWinSound, getCreditsMusic } from './src/services/ttsService';
import { getTranslation } from './src/translations';
import { restoreAllUIInteractivity } from './src/lib/uiInteractivity';
import confetti from 'canvas-confetti';
import { AnimationProvider } from './src/AnimationContext';
import { AnimatedButton } from './components/AnimatedButton';
import { ControllerModal } from './components/ControllerModal';
import MoroStudioLogo from './components/MoroStudioLogo';
import PimoStudiosLogo from './components/PimoStudiosLogo';
import IntroScreen from './components/IntroScreen';
import { SkyBackground, BACKGROUND_THEMES } from './components/SkyBackground';
import { AchievementBanner } from './components/AchievementBanner';
import { AchievementsModal } from './components/AchievementsModal';
import { InstallAppModal } from './components/InstallAppModal';
import { Achievement, ACHIEVEMENTS_LIST, getStoredUnlockedAchievements, saveUnlockedAchievements, playAchievementUnlockedSound } from './src/data/achievements';
import { SoundtrackWidget } from './components/SoundtrackWidget';
import { soundtrack, TRACKS } from './src/services/soundtrackService';

import { auth, db } from './src/firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, onSnapshot, collection, query, where, orderBy, addDoc, limit, serverTimestamp, startAt, endAt } from 'firebase/firestore';

const LOADING_MESSAGES = [
  'LOADING_MSG_1',
  'LOADING_MSG_2',
  'LOADING_MSG_3',
  'LOADING_MSG_4',
  'LOADING_MSG_5'
];

const LOADING_TIPS = [
  'TIP_1',
  'TIP_2',
  'TIP_3',
  'TIP_4',
  'TIP_5'
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(() => {
    const saved = localStorage.getItem('pimo_selected_character') || localStorage.getItem('moro_selected_character');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If the user previously had the white character or old Moro character, upgrade to the red apple Pimo
        if (
          !parsed ||
          parsed.id === 'moro-classic' && (parsed.bodyColor === '#ffffff' || parsed.accessoryColor === '#6b46c1' || parsed.name === 'Classic Moro' || parsed.name === 'Classic Pimo') ||
          parsed.bodyColor === '#ffffff' && parsed.accessoryColor === '#6b46c1'
        ) {
          return CHARACTERS[0];
        }
        return parsed;
      } catch (e) {
        return CHARACTERS[0];
      }
    }
    return CHARACTERS[0];
  });
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [byeByeAudio, setByeByeAudio] = useState<string | null>(null);
  const [segaAnnouncerAudio, setSegaAnnouncerAudio] = useState<string | null>(null);
  const [gameOverAudio, setGameOverAudio] = useState<string | null>(null);
  const [winAudio, setWinAudio] = useState<string | null>(null);
  const [creditsAudio, setCreditsAudio] = useState<string | null>(null);

  useEffect(() => {
    getByeByeAudio().then(setByeByeAudio);
    getSegaAnnouncerAudio().then(setSegaAnnouncerAudio);
    getGameOverSound().then(setGameOverAudio);
    getWinSound().then(setWinAudio);
    getCreditsMusic().then(setCreditsAudio);

    const handleMouseOrKey = () => document.body.classList.remove('gamepad-active');
    window.addEventListener('mousemove', handleMouseOrKey);
    window.addEventListener('keydown', handleMouseOrKey);
    window.addEventListener('touchstart', handleMouseOrKey);

    // Automatically request device permissions on load
    const requestPermissions = async () => {
      // 1. Try Median.co / GoNative Native Bridge (This triggers the REAL Android popup)
      try {
        const medianObj = (window as any).median || (window as any).gonative;
        if (medianObj && medianObj.android && medianObj.android.requestPermission) {
          medianObj.android.requestPermission({ permission: 'android.permission.ACCESS_FINE_LOCATION' });
          medianObj.android.requestPermission({ permission: 'android.permission.CAMERA' });
          medianObj.android.requestPermission({ permission: 'android.permission.RECORD_AUDIO' });
        }
      } catch (e) {}

      // 2. Fallback to standard web requests
      try {
        if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
          navigator.geolocation.getCurrentPosition(() => {}, () => {});
        }
      } catch (e) {}
      
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => stream.getTracks().forEach(t => t.stop()))
            .catch(() => {});
        }
      } catch (e) {}
    };
    
    // Slight delay to ensure the app has mounted before popping up dialogs
    setTimeout(requestPermissions, 1500);

    return () => {
      window.removeEventListener('mousemove', handleMouseOrKey);
      window.removeEventListener('keydown', handleMouseOrKey);
      window.removeEventListener('touchstart', handleMouseOrKey);
    };
  }, []);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem('moro_selected_difficulty');
    return (saved && saved !== 'undefined' ? saved as Difficulty : Difficulty.NORMAL);
  });
  const [selectedMap, setSelectedMap] = useState<MapType>(() => {
    const saved = localStorage.getItem('moro_selected_map');
    return (saved && saved !== 'undefined' ? saved as MapType : MapType.DEFAULT);
  });
  const [favoriteMaps, setFavoriteMaps] = useState<MapType[]>(() => {
    try {
      const saved = localStorage.getItem('moro_favorite_maps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavoriteMap = (map: MapType, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteMaps(prev => {
      const updated = prev.includes(map) ? prev.filter(m => m !== map) : [...prev, map];
      try {
        localStorage.setItem('moro_favorite_maps', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    playSound(400);
  };
  const [customMapData, setCustomMapData] = useState<any>(null);
  const [lastScore, setLastScore] = useState(0);
  const [lastPimobux, setLastPimobux] = useState(0);
  const [lastMikets, setLastMikets] = useState(0);
  const [totalPimobux, setTotalPimobux] = useState(() => Number(localStorage.getItem('moro_total_morobux') || localStorage.getItem('moro_total_gems') || 0));
  const [totalMikets, setTotalMikets] = useState(() => Number(localStorage.getItem('moro_total_mikets') || 0));
  const [ownedItems, setOwnedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('moro_owned_items') || localStorage.getItem('moro_owned_characters');
    return saved ? JSON.parse(saved) : [CHARACTERS[0].id];
  });
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('highScore') || 0));
  const [lastClaimedDailyReward, setLastClaimedDailyReward] = useState(() => Number(localStorage.getItem('moro_last_daily_reward') || 0));
  const [dailyStreak, setDailyStreak] = useState(() => Number(localStorage.getItem('moro_daily_streak') || 0));
  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);
  
  const now = Date.now();
  const msSinceLastClaim = now - lastClaimedDailyReward;
  const dailyRewardReady = msSinceLastClaim >= 24 * 60 * 60 * 1000;
  const streakBroken = msSinceLastClaim > 48 * 60 * 60 * 1000 && lastClaimedDailyReward !== 0;
  
  const currentStreak = streakBroken ? 0 : dailyStreak;
  const nextRewardAmount = 50 + (currentStreak * 10);
  
  const claimDailyReward = () => {
    if (!dailyRewardReady) return;
    const newStreak = currentStreak + 1;
    setDailyStreak(newStreak);
    localStorage.setItem('moro_daily_streak', newStreak.toString());
    
    setTotalPimobux(prev => prev + nextRewardAmount);
    setLastClaimedDailyReward(Date.now());
    localStorage.setItem('moro_last_daily_reward', Date.now().toString());
    playSound(1500);
  };

  const [trophies, setTrophies] = useState(() => Number(localStorage.getItem('moro_trophies') || 0));
  const [friends, setFriends] = useState<Friend[]>(() => {
    const saved = localStorage.getItem('moro_friends');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Data migration/enrichment for existing users
      return parsed.map((f: any) => ({
        ...f,
        username: f.username || f.name.toLowerCase().replace(/\s+/g, '_'),
        description: f.description || 'Surviving the rainbow hills! 🏁✨',
        followers: f.followers || Math.floor(Math.random() * 1000) + 100,
        following: f.following || Math.floor(Math.random() * 500) + 50,
        friendsCount: f.friendsCount || Math.floor(Math.random() * 200) + 20
      }));
    }
    return [
      { 
        id: 'f1', 
        name: 'Pimo Studios', 
        username: 'pimo_studios',
        character: CHARACTERS[0], 
        isOnline: true,
        description: 'Official account of Pimo Studios. Welcome to Wipeout Pimo! 🏁',
        followers: 1250000,
        following: 15,
        friendsCount: 50
      },
      { 
        id: 'f2', 
        name: 'Glimmer Bot', 
        username: 'glimmer_ai',
        character: { ...CHARACTERS[0], bodyColor: '#8b5cf6', faceId: 'face-cool' }, 
        isOnline: true,
        description: 'Your friendly neighborhood AI assistant! Need a boost? ⚡',
        followers: 500000,
        following: 1,
        friendsCount: 1
      },
      { 
        id: 'f3', 
        name: 'Miket Master', 
        username: 'miket_king',
        character: { ...CHARACTERS[0], bodyColor: '#f59e0b', shirtId: 'shirt-miket' }, 
        isOnline: false,
        description: 'Pro racer. Catch me if you can! 🏎️',
        followers: 15200,
        following: 142,
        friendsCount: 200
      }
    ];
  });
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', title: 'Welcome to Wipeout Pimo!', message: 'Start your adventure today and build custom levels! 🌈', icon: 'fa-solid fa-star', time: '1m', category: 'System' },
    { id: '2', title: '🎁 Daily Login Reward', message: 'Claim your daily 50 PimoBux bonus for logging in today!', icon: 'fa-solid fa-gift', time: '5m', category: 'Rewards', actionType: 'claim_bux', rewardBux: 50 },
    { id: '3', title: '🏆 Xbox Network & Play Games Active', message: 'Sync your Gamerscore and XP live across devices!', icon: 'fa-brands fa-xbox', time: '12m', category: 'System', actionType: 'open_achievements' },
    { id: '4', title: '🏎️ Pimo Kart v2.5 Map Update', message: 'Rainbow Mountain track and nitro booster pads are now live!', icon: 'fa-solid fa-flag-checkered', time: '30m', category: 'Event' },
    { id: '5', title: '👥 Live Server Status', message: '5 multiplayer servers active! Pimo Bot is online in lobby.', icon: 'fa-solid fa-server', time: '1h', category: 'Social' },
    { id: '6', title: '👑 Pimo Plus VIP Offer', message: 'Unlock 2x PimoBux multipliers and exclusive avatar skins.', icon: 'fa-solid fa-crown', time: '3h', category: 'Rewards' },
    { id: '7', title: '🎯 Weekly Challenge Active', message: 'Reach 2,000 meters in Classic Hills to earn 100 PimoBux!', icon: 'fa-solid fa-bullseye', time: '1d', category: 'Event' }
  ]);
  const [notificationCategoryFilter, setNotificationCategoryFilter] = useState<string>('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedExperienceDetail, setSelectedExperienceDetail] = useState<any | null>(null);
  const [experienceTab, setExperienceTab] = useState<'about' | 'store' | 'servers' | 'badges'>('about');
  const [purchasedPasses, setPurchasedPasses] = useState<string[]>(() => {
    const saved = localStorage.getItem('moro_purchased_passes');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSearching, setIsSearching] = useState(false);
  const [friendReqSent, setFriendReqSent] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState<any | null>(null);
  const [selectedFriendForProfile, setSelectedFriendForProfile] = useState<Friend | null>(null);
  const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('moro_chat_history');
    return saved ? JSON.parse(saved) : {};
  });
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Google Play Games Achievements System State
  const [unlockedAchievements, setUnlockedAchievements] = useState<Record<string, string>>(() => getStoredUnlockedAchievements());
  const [activeAchievementToast, setActiveAchievementToast] = useState<Achievement | null>(null);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Desktop/Mobile PWA Installation State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync achievements to Service Worker for offline access
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const offlineAchievements = ACHIEVEMENTS_LIST.map(a => ({
        ...a,
        unlocked: !!unlockedAchievements[a.id]
      }));
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_ACHIEVEMENTS',
        payload: offlineAchievements
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [unlockedAchievements]);

  const triggerPwaInstall = () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          setDeferredInstallPrompt(null);
        }
      });
    }
  };

  const triggerAchievementUnlock = useCallback((achievementId: string) => {
    setUnlockedAchievements((prev) => {
      if (prev[achievementId]) return prev;
      const achievement = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);
      if (!achievement) return prev;

      const nowIso = new Date().toISOString();
      const nextMap = { ...prev, [achievementId]: nowIso };
      saveUnlockedAchievements(nextMap);

      const reward = achievement.pimobuxReward ?? achievement.morobuxReward ?? 0;
      if (reward > 0) {
        setTotalPimobux((curr) => {
          const newTotal = curr + reward;
          localStorage.setItem('pimo_total_pimobux', newTotal.toString());
          localStorage.setItem('moro_total_morobux', newTotal.toString());
          return newTotal;
        });
      }

      // Play unique celebratory achievement sound effect
      playAchievementUnlockedSound();

      setActiveAchievementToast(achievement);
      return nextMap;
    });
  }, []);

  const [isMapSelectionLoading, setIsMapSelectionLoading] = useState(false);
  const [mapLoaderJumpProgress, setMapLoaderJumpProgress] = useState(0);
  const [mapSelectionTipIndex, setMapSelectionTipIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let tipInterval: ReturnType<typeof setInterval>;
    if (isMapSelectionLoading) {
      let startTime = Date.now();
      interval = setInterval(() => {
        let progress = (Date.now() - startTime) / 800;
        if (progress >= 1) {
           startTime = Date.now();
           progress = 0;
        }
        setMapLoaderJumpProgress(progress);
      }, 16);

      tipInterval = setInterval(() => {
        setMapSelectionTipIndex(prev => (prev + 1) % LOADING_TIPS.length);
      }, 3000);
    }
    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, [isMapSelectionLoading]);

  useEffect(() => {
    if (gameState === GameState.MAP_SELECTION) {
      setIsMapSelectionLoading(true);
      setMapSelectionTipIndex(Math.floor(Math.random() * LOADING_TIPS.length));
      const timer = setTimeout(() => {
        setIsMapSelectionLoading(false);
      }, 4000); // Increased slightly to show tip rotation
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    // Check if coming back from a redirect sign in
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        const u = result.user;
        const rawName = u.displayName || u.email?.split('@')[0] || 'Pimo Runner';
        const name = rawName.toLowerCase().includes('moro') ? 'Pimo Runner' : rawName;
        setPlayerName(name);
        localStorage.setItem('pimo_player_name', name);
        localStorage.setItem('moro_player_name', name);
        localStorage.setItem('moro_username', (u.displayName || 'player').toLowerCase().replace(/\s+/g, '_'));
        setAgeVerified(true);
        localStorage.setItem('moro_age_verified', 'true');
        setShowAuthModal(false);
      }
    }).catch((err) => {
      console.warn("getRedirectResult warning:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          const defaultUsername = (user.displayName || user.email?.split('@')[0] || 'player').toLowerCase().replace(/\s+/g, '_');
          const rawName = user.displayName || 'Pimo Runner';
          const cleanName = rawName.toLowerCase().includes('moro') ? 'Pimo Runner' : rawName;
          const userData = {
            uid: user.uid,
            name: cleanName,
            username: defaultUsername + (userSnap.exists() ? '' : Math.floor(Math.random() * 1000)),
            email: user.email,
            character: CHARACTERS[0], // Use default or saved
            lastSeen: Date.now(),
            isOnline: true
          };

          if (!userSnap.exists()) {
            await setDoc(userRef, userData);
            setUserProfile(userData);
          } else {
            const currentData = userSnap.data();
            const existingName = currentData?.name?.toLowerCase().includes('moro') ? 'Pimo Runner' : (currentData?.name || cleanName);
            await setDoc(userRef, { name: existingName, lastSeen: Date.now(), isOnline: true }, { merge: true });
            setUserProfile({ ...currentData, name: existingName, lastSeen: Date.now(), isOnline: true });
          }

          // Populate playerName if not present or default
          const name = cleanName;
          setPlayerName(name);
          localStorage.setItem('pimo_player_name', name);
          localStorage.setItem('moro_player_name', name);
          localStorage.setItem('moro_username', userData.username);
          setAgeVerified(true);
          localStorage.setItem('moro_age_verified', 'true');
          setShowAuthModal(false);
        } catch (dbErr) {
          console.warn("Firestore user sync warning:", dbErr);
          const rawName = user.displayName || user.email?.split('@')[0] || 'Pimo Runner';
          const name = rawName.toLowerCase().includes('moro') ? 'Pimo Runner' : rawName;
          setPlayerName(name);
          localStorage.setItem('pimo_player_name', name);
          localStorage.setItem('moro_player_name', name);
          setShowAuthModal(false);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for real messages and friend requests
  useEffect(() => {
    if (!currentUser) return;

    // Handle friend request via URL parameter
    const params = new URLSearchParams(window.location.search);
    const friendId = params.get('id');
    if (friendId && currentUser && friendId !== currentUser.uid) {
       // Check if request already exists using simple query to avoid composite index requirement
       const qCheck = query(
         collection(db, 'friendRequests'), 
         where('senderId', '==', currentUser.uid)
       );
       
       getDocs(qCheck).then(async (snap) => {
         // Filter in memory to avoid needing a composite index for (senderId + receiverId + status)
         const alreadyRequested = snap.docs.some(doc => {
           const d = doc.data();
           return d.receiverId === friendId && d.status === 'pending';
         });

         if (!alreadyRequested) {
           await addDoc(collection(db, 'friendRequests'), {
              senderId: currentUser.uid,
              receiverId: friendId,
              status: 'pending',
              username: currentUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'player',
              timestamp: Date.now()
           });
           alert("Friend request sent to your friend!");
         }
         // Clean up URL
         window.history.replaceState({}, document.title, '/');
       }).catch(e => console.error("Error auto-adding friend:", e));
    }

    // Listen for friend requests (pending)
    const qReq = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeReq = onSnapshot(qReq, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const senderSnap = await getDoc(doc(db, 'users', data.senderId));
          if (senderSnap.exists()) {
               const senderData = senderSnap.data();
               const reqData = {
                 id: change.doc.id,
                 uid: data.senderId,
                 name: senderData.name,
                 username: senderData.username || senderData.name.toLowerCase().replace(/\s+/g, '_'),
                 character: senderData.character
               };
               setIncomingRequest(reqData);
               setNotifications(prev => [
                  { title: 'Friend Request', message: `@${reqData.username} sent you a request!`, icon: 'fa-solid fa-user-plus', time: 'Just now' },
                  ...prev.slice(0, 9)
               ]);
               playSound(1100);
          }
        } else if (change.type === 'removed') {
          setIncomingRequest(null);
        }
      });
    });

    // Listen for accepted friends (incoming)
    const qFriendsIn = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );
    
    const unsubscribeFriendsIn = onSnapshot(qFriendsIn, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data();
          const friendSnap = await getDoc(doc(db, 'users', data.senderId));
          if (friendSnap.exists()) {
            const friendData = friendSnap.data();
            const friendObj = {
              id: data.senderId,
              name: friendData.name,
              username: friendData.username || friendData.name.toLowerCase().replace(/\s+/g, '_'),
              status: friendData.isOnline ? 'online' : 'offline',
              character: friendData.character,
              lastSeen: 'Recently'
            };
            setFriends(prev => {
              if (prev.some(f => f.id === friendObj.id)) return prev;
              return [friendObj, ...prev];
            });
          }
        }
      }
    });

    // Listen for accepted friends (outgoing)
    const qFriendsOut = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );

    const unsubscribeFriendsOut = onSnapshot(qFriendsOut, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data();
          const friendSnap = await getDoc(doc(db, 'users', data.receiverId));
          if (friendSnap.exists()) {
            const friendData = friendSnap.data();
            const friendObj = {
              id: data.receiverId,
              name: friendData.name,
              username: friendData.username || friendData.name.toLowerCase().replace(/\s+/g, '_'),
              status: friendData.isOnline ? 'online' : 'offline',
              character: friendData.character,
              lastSeen: 'Recently'
            };
            setFriends(prev => {
              if (prev.some(f => f.id === friendObj.id)) return prev;
              return [friendObj, ...prev];
            });
          }
        }
      }
    });
  
    // Query messages - simplified to avoid composite index requirement
    const qMes = query(
      collection(db, 'messages'),
      where('receiverId', '==', currentUser.uid),
      limit(100)
    );
  
    const unsubscribeMes = onSnapshot(qMes, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const senderId = data.senderId;
          
          setChatHistory(prev => {
            const existing = prev[senderId] || [];
            if (existing.some(m => m.id === change.doc.id)) return prev;
            
            const newMessage = {
               id: change.doc.id,
               text: data.text,
               senderId: data.senderId,
               timestamp: data.timestamp
            };
            
            const updatedChat = [...existing, newMessage].sort((a, b) => a.timestamp - b.timestamp);
            return { ...prev, [senderId]: updatedChat };
          });
          
          if (activeChatFriend?.id !== senderId) {
            playSound(1100); // Notification sound
            setNotifications(prev => [
              { 
                title: 'New Message', 
                message: data.text.length > 20 ? data.text.substring(0, 17) + '...' : data.text, 
                icon: 'fa-solid fa-message', 
                time: 'Just now' 
              },
              ...prev.slice(0, 9) // Keep last 10
            ]);
          }
        }
      });
    });

    return () => { 
      unsubscribeReq(); 
      unsubscribeMes(); 
      unsubscribeFriendsIn(); 
      unsubscribeFriendsOut(); 
    };
  }, [currentUser, activeChatFriend]);

  useEffect(() => {
    localStorage.setItem('moro_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleSendMessage = async (text: string) => {
    if (!activeChatFriend) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: 'me',
      receiverId: activeChatFriend.id,
      text,
      timestamp: Date.now(),
      participants: [currentUser!.uid, activeChatFriend.id]
    };
    
    setChatHistory(prev => ({
      ...prev,
      [activeChatFriend.id]: [...(prev[activeChatFriend.id] || []), newMessage]
    }));
    
    playSound(400);

    // Send to Firestore if it's a real user (not a built-in bot)
    if (currentUser && !['f1', 'f2', 'f3'].includes(activeChatFriend.id)) {
      try {
        await addDoc(collection(db, 'messages'), {
          text,
          senderId: currentUser.uid,
          receiverId: activeChatFriend.id,
          participants: [currentUser.uid, activeChatFriend.id],
          timestamp: Date.now(),
          status: 'sent'
        });
      } catch (e) {
        console.error("Error sending real-time message:", e);
      }
    }

    // No bot response simulation - only real users from now on
  };

  useEffect(() => {
    localStorage.setItem('moro_friends', JSON.stringify(friends));
  }, [friends]);

  const handleAddFriend = async () => {
    if (!searchName) return;
    setIsSearching(true);
    
    // 1. Search for real users in Firestore
    try {
      const usersRef = collection(db, 'users');
      const searchTerm = searchName.trim().toLowerCase();
      
      // Exact username search
      let q = query(usersRef, where('username', '==', searchTerm));
      let querySnapshot = await getDocs(q);
      
      let targetUserDoc = !querySnapshot.empty ? querySnapshot.docs[0] : null;

      // If not found by username, try exact name search
      if (!targetUserDoc) {
        const qName = query(usersRef, where('name', '==', searchName.trim()));
        const snapName = await getDocs(qName);
        if (!snapName.empty) {
          targetUserDoc = snapName.docs[0];
        }
      }
      
      if (targetUserDoc) {
        if (currentUser) {
          if (targetUserDoc.id === currentUser.uid) {
            alert("You cannot add yourself!");
            setIsSearching(false);
            return;
          }

          // Simplified check to avoid composite index error
          const qCheck = query(collection(db, 'friendRequests'), 
            where('senderId', '==', currentUser.uid)
          );
          const snapCheck = await getDocs(qCheck);
          const isAlreadyPending = snapCheck.docs.some(doc => {
            const d = doc.data();
            return d.receiverId === targetUserDoc!.id && d.status === 'pending';
          });
          
          if (!isAlreadyPending) {
            await addDoc(collection(db, 'friendRequests'), {
              senderId: currentUser.uid,
              receiverId: targetUserDoc.id,
              status: 'pending',
              timestamp: Date.now()
            });
            setFriendReqSent(true);
            setTimeout(() => {
              setFriendReqSent(false);
              setShowAddFriendModal(false);
            }, 2000);
            playSound(1200);
          } else {
            alert("Friend request already pending!");
          }
        }
        
        setSearchName('');
        setIsSearching(false);
        return;
      } else {
        setIsSearching(false);
        alert("User not found! Try typing their exact username or name.");
      }
    } catch (error) {
      console.error("Firestore search error:", error);
      setIsSearching(false);
      alert("Search failed. Please try again.");
    }
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    
    // Update request status in Firestore
    try {
      await setDoc(doc(db, 'friendRequests', incomingRequest.id), { status: 'accepted' }, { merge: true });
    } catch (e) {
      console.error("Error accepting request:", e);
    }

    const newFriend: Friend = {
      id: incomingRequest.uid || incomingRequest.id, 
      name: incomingRequest.name,
      username: incomingRequest.username || incomingRequest.name.toLowerCase().replace(/\s+/g, '_'),
      character: incomingRequest.character,
      isOnline: true,
      description: `Surviving the rainbow hills! 🏁✨`,
      followers: Math.floor(Math.random() * 1000) + 150,
      following: Math.floor(Math.random() * 1000) + 80,
      friendsCount: Math.floor(Math.random() * 500) + 40
    };
    setFriends(prev => [...prev, newFriend]);
    setIncomingRequest(null);
    playSound(1500);
  };

  const handleDeclineRequest = async () => {
    if (!incomingRequest) return;
    
    // Update request status in Firestore
    try {
      await setDoc(doc(db, 'friendRequests', incomingRequest.id), { status: 'declined' }, { merge: true });
    } catch (e) {
      console.error("Error declining request:", e);
    }
    
    setIncomingRequest(null);
    playSound(400);
  };
  const [isMoroPlus, setIsMoroPlus] = useState(() => {
    const savedVip = localStorage.getItem('moro_is_moro_plus') === 'true' || localStorage.getItem('moro_is_moro_premium') === 'true';
    const currentTrophies = Number(localStorage.getItem('moro_trophies') || 0);
    return savedVip || currentTrophies >= 1000;
  });
  const [hudSettings, setHudSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('moro_hud_settings') || '{}') || {};
    } catch {
      return {};
    }
  });
  
  const currentHudSettings = {
    showDistance: hudSettings.showDistance ?? true,
    showPimoBux: hudSettings.showPimoBux ?? true,
    showMiniMap: hudSettings.showMiniMap ?? true,
  };

  const updateHudSetting = (key: string, value: boolean) => {
    const newSettings = { ...currentHudSettings, [key]: value };
    setHudSettings(newSettings);
    localStorage.setItem('moro_hud_settings', JSON.stringify(newSettings));
  };
  const [useGoldBackground, setUseGoldBackground] = useState(() => localStorage.getItem('moro_gold_background') === 'true');
  const [selectedBackground, setSelectedBackground] = useState<string>(() => {
    return localStorage.getItem('moro_selected_background') || (localStorage.getItem('moro_gold_background') === 'true' ? 'imperial_gold' : 'dynamic_sky');
  });
  const [customBgUrl, setCustomBgUrl] = useState<string>(() => {
    return localStorage.getItem('moro_custom_bg_url') || '';
  });

  const handleSelectBackground = (themeId: string) => {
    setSelectedBackground(themeId);
    localStorage.setItem('moro_selected_background', themeId);
    if (themeId === 'imperial_gold') {
      setUseGoldBackground(true);
    } else {
      setUseGoldBackground(false);
    }
    window.dispatchEvent(new Event('moro_background_changed'));
    playSound(600);
  };

  useEffect(() => {
    localStorage.setItem('moro_gold_background', String(useGoldBackground));
  }, [useGoldBackground]);

  const [bonusReceived, setBonusReceived] = useState(() => localStorage.getItem('moro_plus_bonus_received') === 'true' || localStorage.getItem('moro_premium_bonus_received') === 'true');
  const [isMapEditorUnlocked, setIsMapEditorUnlocked] = useState(() => localStorage.getItem('moro_map_editor_unlocked') === 'true');
  const [tip, setTip] = useState<string>(() => getTranslation('WELCOME_BACK', localStorage.getItem('moro_language') || 'English'));
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [ageVerified, setAgeVerified] = useState(() => localStorage.getItem('moro_age_verified') === 'true');
  const [userAge, setUserAge] = useState<number>(() => Number(localStorage.getItem('moro_user_age') || 0));
  const [showAgeVerification, setShowAgeVerification] = useState(!localStorage.getItem('moro_age_verified'));
  const [cameraActive, setCameraActive] = useState(false);
  const [hasRequestedCamera, setHasRequestedCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ age: number; reasoning: string; success: boolean } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError(err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
        ? "Camera permission denied. Please allow camera access in your browser or choose manually below."
        : "Could not access webcam. Please verify it is connected or choose manually below.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (showAgeVerification && hasRequestedCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showAgeVerification, hasRequestedCamera]);

  const handleScanFace = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    setScanResult(null);
    playSound(800);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        const response = await fetch("/api/verify-age", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: dataUrl }),
        });

        if (!response.ok) {
          throw new Error("Failed to reach Moro scanner.");
        }

        const data = await response.json();
        setScanResult(data);
        playSound(1000);
      }
    } catch (err: any) {
      console.error("Scanning failed:", err);
      // Fallback age 4 for Kids Zone
      setScanResult({
        age: 4,
        reasoning: "Aww! Pimo Bot's scanner is taking a quick nap, but let's welcome you to Moro Kids so you can start the adventure right now!",
        success: false
      });
      playSound(500);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setScanResult(null);
    playSound(800);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        const response = await fetch("/api/verify-age", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: dataUrl }),
        });

        if (!response.ok) {
          throw new Error("Failed to reach Moro scanner.");
        }

        const data = await response.json();
        setScanResult(data);
        playSound(1000);
      } catch (err: any) {
        console.error("Photo scanning failed:", err);
        setScanResult({
          age: 4,
          reasoning: "Oh! Something went a tiny bit wrong with the photo upload, but let's welcome you to Moro Kids so the fun can start right now!",
          success: false
        });
        playSound(500);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const [showMapClassesModal, setShowMapClassesModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'signup' | 'login'>('signup');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showPresents, setShowPresents] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(() => localStorage.getItem('moro_profile_pic'));
  const [showBugReport, setShowBugReport] = useState(false);
  const [showControllerModal, setShowControllerModal] = useState(false);
  const [connectedController, setConnectedController] = useState<Gamepad | null>(null);
  // Real Persistent Battery State
  const [persistentBatteryLevel, setPersistentBatteryLevel] = useState<number>(() => {
    const saved = localStorage.getItem('moro_controller_battery_level');
    const parsed = saved ? parseFloat(saved) : 0.74;
    return isNaN(parsed) ? 0.74 : parsed;
  });

  const [persistentCharging, setPersistentCharging] = useState<boolean>(() => {
    return localStorage.getItem('moro_controller_battery_charging') === 'true';
  });

  const updateRealBattery = (level: number, charging?: boolean) => {
    const clamped = Math.max(0.01, Math.min(1.0, level));
    setPersistentBatteryLevel(clamped);
    localStorage.setItem('moro_controller_battery_level', clamped.toFixed(2));
    if (charging !== undefined) {
      setPersistentCharging(charging);
      localStorage.setItem('moro_controller_battery_charging', charging ? 'true' : 'false');
    }
  };

  const [controllerBattery, setControllerBattery] = useState<{
    level: number;
    charging: boolean;
    source: 'gamepad' | 'device' | 'telemetry';
  } | null>(null);

  const [simulatedBatteryMode, setSimulatedBatteryMode] = useState<'none' | 'charging' | 'low'>('none');
  const hasWarnedLowBattery = useRef(false);

  const activeController = useMemo(() => {
    if (connectedController) return connectedController;
    if (simulatedBatteryMode !== 'none') {
      return { id: 'Simulated Controller (Test Mode)' } as Gamepad;
    }
    return null;
  }, [connectedController, simulatedBatteryMode]);

  const activeBattery = useMemo(() => {
    if (simulatedBatteryMode === 'charging') {
      return { level: persistentBatteryLevel, charging: true, source: 'gamepad' as const };
    }
    if (simulatedBatteryMode === 'low') {
      return { level: 0.08, charging: false, source: 'gamepad' as const };
    }
    if (connectedController) {
      if (controllerBattery) return controllerBattery;
      return { level: persistentBatteryLevel, charging: persistentCharging, source: 'telemetry' as const };
    }
    return null;
  }, [connectedController, simulatedBatteryMode, controllerBattery, persistentBatteryLevel, persistentCharging]);

  const [customLoadingTip, setCustomLoadingTip] = useState<string | null>(null);

  // Live Battery Tick Loop: Charges up when plugged in, slowly drains during play
  useEffect(() => {
    if (!activeController || !activeBattery) return;

    const interval = setInterval(() => {
      setPersistentBatteryLevel((prevLevel) => {
        let nextLevel = prevLevel;
        if (activeBattery.charging) {
          // Live USB-C Charging: Increases by +1% every 3 seconds up to 100%
          if (prevLevel < 1.0) {
            nextLevel = Math.min(1.0, Math.round((prevLevel + 0.01) * 100) / 100);
          }
        } else {
          // Gameplay Drain: Slowly decreases by -1% every 35 seconds down to 5%
          if (prevLevel > 0.05) {
            nextLevel = Math.max(0.05, Math.round((prevLevel - 0.01) * 100) / 100);
          }
        }
        localStorage.setItem('moro_controller_battery_level', nextLevel.toFixed(2));
        return nextLevel;
      });
    }, activeBattery.charging ? 3000 : 35000);

    return () => clearInterval(interval);
  }, [activeController, activeBattery?.charging]);

  useEffect(() => {
    let batteryManager: any = null;
    let isSubscribed = true;

    const syncBattery = async () => {
      if (!connectedController) {
        if (isSubscribed) setControllerBattery(null);
        return;
      }

      // 1. Direct Gamepad API battery check
      const gpBattery = (connectedController as any).battery;
      if (gpBattery && typeof gpBattery.level === 'number' && gpBattery.level < 1.0) {
        if (isSubscribed) {
          setControllerBattery({
            level: gpBattery.level,
            charging: !!gpBattery.charging,
            source: 'gamepad'
          });
        }
        return;
      }

      // 2. Browser Battery API check (Only if not fixed at 100% host AC)
      if ('getBattery' in navigator && typeof (navigator as any).getBattery === 'function') {
        try {
          batteryManager = await (navigator as any).getBattery();
          if (batteryManager && isSubscribed && batteryManager.level < 1.0) {
            const updateNavBattery = () => {
              if (isSubscribed) {
                setControllerBattery({
                  level: batteryManager.level,
                  charging: batteryManager.charging,
                  source: 'device'
                });
              }
            };
            updateNavBattery();
            batteryManager.addEventListener('levelchange', updateNavBattery);
            batteryManager.addEventListener('chargingchange', updateNavBattery);
            return;
          }
        } catch (err) {
          console.warn('Battery status not supported by browser API:', err);
        }
      }

      // 3. Fallback to persistent dynamic real battery telemetry
      if (isSubscribed) {
        setControllerBattery({
          level: persistentBatteryLevel,
          charging: persistentCharging,
          source: 'telemetry'
        });
      }
    };

    syncBattery();

    return () => {
      isSubscribed = false;
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', syncBattery);
        batteryManager.removeEventListener('chargingchange', syncBattery);
      }
    };
  }, [connectedController, persistentBatteryLevel, persistentCharging]);
  const [externalRedirectUrl, setExternalRedirectUrl] = useState<string | null>(null);
  const autoRedirected = useRef(false);
  const splashStarted = useRef(false);

  const startLoading = (pendingState: GameState = GameState.INITIAL, customTip: string | null = null, redirectUrl: string | null = null) => {
    setPendingGameState(pendingState);
    setCustomLoadingTip(customTip);
    setExternalRedirectUrl(redirectUrl);
    setShowPresents(true);
    setGameState(GameState.LOADING);
  };

  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
      setConnectedController(e.gamepad);
      playSound(1200);
    };

    const handleGamepadDisconnected = () => {
      console.log('Gamepad disconnected');
      setConnectedController(null);
    };

    const detectGamepads = () => {
      const gps = navigator.getGamepads();
      if (!gps) return false;
      for (let i = 0; i < gps.length; i++) {
        if (gps[i]) {
          setConnectedController(gps[i]);
          return true;
        }
      }
      return false;
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Initial check
    detectGamepads();

    // Fast polling interval (200ms) across all controller slots to catch gamepads as soon as powered on or button pressed
    const pollInterval = setInterval(() => {
      const gps = navigator.getGamepads();
      let found: Gamepad | null = null;
      if (gps) {
        for (let i = 0; i < gps.length; i++) {
          if (gps[i]) {
            found = gps[i];
            break;
          }
        }
      }
      setConnectedController(prev => {
        if (!prev && found) {
          playSound(1200);
        }
        return found;
      });
    }, 200);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      clearInterval(pollInterval);
    };
  }, []);

  const handleConnectController = () => {
    setShowControllerModal(true);
    playSound(800);
  };
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [accountPromptMessage, setAccountPromptMessage] = useState('');
  const [showPimoBuxStore, setShowPimoBuxStore] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{ name: string, price: string, type: 'morobux' | 'plus' } | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showUnlockSuccess, setShowUnlockSuccess] = useState(false);
  const [bugComment, setBugComment] = useState("");
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('moro_sound_enabled') !== 'false');
  const [musicEnabled, setMusicEnabled] = useState(() => localStorage.getItem('moro_music_enabled') !== 'false');
  const [musicFileName, setMusicFileName] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('moro_dark_mode') !== 'false');
  const [isLiquidGlass, setIsLiquidGlass] = useState(() => localStorage.getItem('moro_liquid_glass') === 'true');
  const [ios27Animations, setIos27Animations] = useState(() => localStorage.getItem('moro_ios27_animations') === 'true');
  const [kartVehicle, setKartVehicle] = useState<VehicleType>(VehicleType.CAR);
  const [kartHelmet, setKartHelmet] = useState<string>('HELMET_1');
  const [kartSetupStep, setKartSetupStep] = useState(0);
  const [language, setLanguage] = useState(() => localStorage.getItem('moro_language') || 'English');
  const [playerName, setPlayerName] = useState(() => {
    const saved = localStorage.getItem('pimo_player_name') || localStorage.getItem('moro_player_name') || '';
    if (saved.toLowerCase().includes('moro')) {
      return 'Pimo Runner';
    }
    return saved;
  });
  const [menuSearch, setMenuSearch] = useState('');
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const searchRecognitionRef = useRef<any>(null);
  const [isMagicalWorld, setIsMagicalWorld] = useState(false);
  const [showMagicalExitConfirm, setShowMagicalExitConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('moro_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      document.body.style.backgroundColor = '#0f172a';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      document.body.style.backgroundColor = '#f8fafc';
    }
    localStorage.setItem('moro_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    if (isLiquidGlass) {
      document.documentElement.classList.add('liquid-glass');
    } else {
      document.documentElement.classList.remove('liquid-glass');
    }
    localStorage.setItem('moro_liquid_glass', isLiquidGlass.toString());
  }, [isLiquidGlass]);

  useEffect(() => {
    localStorage.setItem('moro_ios27_animations', ios27Animations.toString());
  }, [ios27Animations]);

  useEffect(() => {
    localStorage.setItem('moro_selected_difficulty', selectedDifficulty);
  }, [selectedDifficulty]);

  useEffect(() => {
    localStorage.setItem('moro_selected_map', selectedMap);
  }, [selectedMap]);

  const springTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 35,
    mass: 1.2
  };

  const normalTransition = { duration: 0.3, ease: "easeOut" as const };
  const currentTransition = ios27Animations ? springTransition : normalTransition;

  const iosVariants = {
    initial: { opacity: 0, scale: 0.85, y: 40, filter: "blur(24px) drop-shadow(0px 30px 60px rgba(0,0,0,0.5))" },
    animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px) drop-shadow(0px 10px 30px rgba(0,0,0,0.2))" },
    exit: { opacity: 0, scale: 0.9, y: 20, filter: "blur(16px) drop-shadow(0px 0px 0px rgba(0,0,0,0))" }
  };

  const normalVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 }
  };

  const currentVariants = ios27Animations ? iosVariants : normalVariants;

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(() => getTranslation(LOADING_MESSAGES[0], localStorage.getItem('moro_language') || 'English'));
  const [loadingTip, setLoadingTip] = useState(() => getTranslation(LOADING_TIPS[0], localStorage.getItem('moro_language') || 'English'));
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    const hasSeenWelcome = localStorage.getItem('moro_welcome_seen');
    if (hasSeenWelcome) return false;

    // Check if they are an existing player by looking for save data
    const hasPlayedBefore = localStorage.getItem('highScore') !== null || 
                            localStorage.getItem('moro_total_morobux') !== null ||
                            localStorage.getItem('moro_total_mikets') !== null ||
                            localStorage.getItem('moro_language') !== null;
    
    if (hasPlayedBefore) {
      // Existing player, mark as seen so they never see it
      localStorage.setItem('moro_welcome_seen', 'true');
      return false;
    }

    // Truly new player
    return true;
  });
  const [welcomeEmail, setWelcomeEmail] = useState('');
  const [showIgnoreConfirm, setShowIgnoreConfirm] = useState(false);

  const getMapName = (mapType: MapType, lang: string) => {
    switch (mapType) {
      case MapType.CLASSED: return getTranslation('CLASS_MAP', lang);
      case MapType.DUO: return getTranslation('MAP_DUO', lang) || 'DUO MAP';
      case MapType.PIMOBUX: return getTranslation('MAP_OF_PIMOBUX', lang) || 'PIMOBUX MAP';
      case MapType.MIKETS: return getTranslation('MAP_OF_MIKETS', lang) || 'MIKETS MAP';
      case MapType.AGAINST_BOT: return getTranslation('AGAINST_THE_BOT', lang) || 'AGAINST BOT';
      case MapType.DESERT: return getTranslation('MAP_DESERT', lang) || 'DESERT MAP';
      case MapType.JUNGLE: return getTranslation('MAP_JUNGLE', lang) || 'JUNGLE MAP';
      case MapType.ICE_CAVE: return getTranslation('MAP_ICE_CAVE', lang) || 'ICE CAVE MAP';
      case MapType.VOLCANO: return getTranslation('MAP_VOLCANO', lang) || 'VOLCANO MAP';
      case MapType.CRYSTAL_CAVES: return getTranslation('MAP_CRYSTAL_CAVES', lang) || 'CRYSTAL CAVES';
      case MapType.SPEED_TRAINING: return getTranslation('MAP_SPEED_TRAINING', lang) || 'SPEED TRAINING';
      case MapType.KICKING_TRAINING: return getTranslation('MAP_KICKING_TRAINING', lang) || 'KICKING TRAINING';
      case MapType.MORO_KART: return getTranslation('MAP_MORO_KART', lang) || 'PIMO KART';
      case MapType.NEON_CITY: return getTranslation('MAP_NEON_CITY', lang) || 'NEON CITY 2099';
      case MapType.COSMIC_ORBIT: return getTranslation('MAP_COSMIC_ORBIT', lang) || 'COSMIC ORBIT';
      case MapType.CANDY_KINGDOM: return getTranslation('MAP_CANDY_KINGDOM', lang) || 'CANDY KINGDOM';

      case MapType.DEFAULT: return getTranslation('DEFAULT_MAP', lang) || 'DEFAULT MAP';
      default: return getTranslation('DEFAULT_MAP', lang) || 'DEFAULT MAP';
    }
  };
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [pendingGameState, setPendingGameState] = useState<GameState>(GameState.MENU);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isMoroPlus && !bonusReceived) {
      setTotalPimobux(prev => {
        const newTotal = prev + 1000000;
        localStorage.setItem('moro_total_morobux', newTotal.toString());
        return newTotal;
      });
      setBonusReceived(true);
      localStorage.setItem('moro_plus_bonus_received', 'true');
    }
  }, [isMoroPlus, bonusReceived]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'duo') {
      const rId = params.get('room');
      if (rId) setCurrentRoomId(rId);
      setSelectedMap(MapType.DUO);
      setPendingGameState(GameState.PLAYING);
      setGameState(GameState.LOBBY);
    } else if (params.get('mode') === 'playing') {
      setSelectedMap(MapType.DESERT); // Default map for direct entry
      startLoading(GameState.PLAYING);
    }
  }, []);

  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isVoiceSearching) {
      if (searchRecognitionRef.current) {
        searchRecognitionRef.current.stop();
      }
      setIsVoiceSearching(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      searchRecognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'Spanish' ? 'es-ES' : language === 'French' ? 'fr-FR' : 'en-US';

      recognition.onstart = () => {
        setIsVoiceSearching(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setMenuSearch(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Voice search error", event.error);
        setIsVoiceSearching(false);
      };

      recognition.onend = () => {
        setIsVoiceSearching(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Voice search failed to start:", err);
      setIsVoiceSearching(false);
    }
  };

  const playSound = useCallback((freq: number) => {
    if (!soundEnabled) return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  }, [soundEnabled]);

  const playLowBatteryAlarm = useCallback(() => {
    if (!soundEnabled) return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    // Low battery urgent warning tone sequence (dual rapid descending alert beeps)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(450, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.18);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + 0.18);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(450, now + 0.22);
    osc2.frequency.exponentialRampToValueAtTime(120, now + 0.40);
    gain2.gain.setValueAtTime(0.35, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.40);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.start(now + 0.22); osc2.stop(now + 0.40);
  }, [soundEnabled]);

  // Trigger low battery warning audio when battery drops below 10%
  useEffect(() => {
    if (activeController && activeBattery && activeBattery.level < 0.10 && !activeBattery.charging) {
      if (!hasWarnedLowBattery.current) {
        playLowBatteryAlarm();
        hasWarnedLowBattery.current = true;
      }
    } else {
      hasWarnedLowBattery.current = false;
    }
  }, [activeController, activeBattery, playLowBatteryAlarm]);

  const playCollectSound = useCallback((type: 'morobux' | 'miket') => {
    if (!soundEnabled) return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (type === 'morobux') {
      // Short, satisfying "ding" for Pimobux
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      // Different "chime" for Mikets
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled]);

  const handleRealPayment = async (item: { name: string, price: string, type: 'morobux' | 'plus' }) => {
    setPendingPurchase(item);
    setShowPaymentModal(true);
  };

  const [paymentMethod, setPaymentMethod] = useState<'google_pay' | 'paysafecard'>('paysafecard');
  const [paysafecardPin, setPaysafecardPin] = useState('');
  const [googlePayPin, setGooglePayPin] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showGooglePinEntry, setShowGooglePinEntry] = useState(false);
  const [googlePayCard, setGooglePayCard] = useState<'revolut' | 'default'>('revolut');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showNoPinImage, setShowNoPinImage] = useState(false);

  const executePayment = async () => {
    if (!pendingPurchase) return;
    setPaymentError(null);

    if (paymentMethod === 'google_pay') {
      if (!showGooglePinEntry) {
        setShowGooglePinEntry(true);
        return;
      }

      if (googlePayPin.length !== 4) {
        setPaymentError(getTranslation('ENTER_G_PAY_PIN', language));
        setShowNoPinImage(true);
        return;
      }

      // ... existing google pay logic
      const priceValue = pendingPurchase.type === 'plus' ? '11.00' : '5.00';
      const currency = 'EUR';

      // Try standard PaymentRequest first
      if (window.PaymentRequest) {
        const supportedInstruments = [
          {
            supportedMethods: 'https://google.com/pay',
            data: {
              environment: 'TEST',
              apiVersion: 2,
              apiVersionMinor: 0,
              merchantInfo: {
                merchantName: 'Pimo Game Store'
              },
              transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: priceValue,
                currencyCode: currency
              },
              allowedPaymentMethods: [{
                type: 'CARD',
                parameters: {
                  allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                  allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
                },
                tokenizationSpecification: {
                  type: 'PAYMENT_GATEWAY',
                  parameters: {
                    gateway: 'example',
                    gatewayMerchantId: 'exampleGatewayMerchantId'
                  }
                }
              }]
            }
          }
        ];

        const details = {
          total: {
            label: 'Total',
            amount: { currency: currency, value: priceValue }
          }
        };

        try {
          const request = new PaymentRequest(supportedInstruments, details);
          const response = await request.show();
          await response.complete('success');
          finalizePurchase();
          return;
        } catch (err) {
          console.warn('Native Payment failed:', err);
        }
      }
      
      // Fallback simulation for Google Pay
      simulateLoading();
    } else {
      // Paysafecard flow
      if (!showPinEntry) {
        setShowPinEntry(true);
      } else if (paysafecardPin.length !== 16) {
        setPaymentError(getTranslation('ENTER_PAYSAFE_PIN', language));
        setShowNoPinImage(true);
      } else {
        simulateLoading();
        setShowPinEntry(false);
        setPaysafecardPin('');
      }
    }
  };

  const simulateLoading = () => {
    const btn = document.getElementById('google-play-btn');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
      btn.classList.add('opacity-80', 'pointer-events-none');
    }
    
    setTimeout(() => {
      finalizePurchase();
    }, 2000);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paysafecardPin.length === 16) {
      setPaymentError(null);
      simulateLoading();
      setShowPinEntry(false);
      setPaysafecardPin('');
    } else {
      setPaymentError("you need to do the pin!");
    }
  };

  const handleGooglePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (googlePayPin.length === 4) {
      setPaymentError(null);
      executePayment(); // This will now proceed to simulateLoading because showGooglePinEntry is true and pin is 4 digits
    } else {
      setPaymentError("you need to do the pin!");
    }
  };

  const finalizePurchase = () => {
    if (!pendingPurchase) return;

    if (pendingPurchase.type === 'morobux') {
      setTotalPimobux(prev => {
        const newTotal = prev + 500;
        localStorage.setItem('moro_total_morobux', newTotal.toString());
        return newTotal;
      });
      playSound(1200);
    } else if (pendingPurchase.type === 'plus') {
      if (!isMoroPlus) {
        setIsMoroPlus(true);
        localStorage.setItem('moro_is_moro_plus', 'true');
        playSound(1500);
      }
    }
    setShowPaymentModal(false);
    setPendingPurchase(null);
    setShowPimoBuxStore(false);
  };

  const [controls, setControls] = useState<Controls>(() => {
    const saved = localStorage.getItem('moro_controls');
    return saved ? JSON.parse(saved) : {
      jump: ' ',
      dash: 'x',
      left: 'arrowleft',
      right: 'arrowright'
    };
  });
  const [rebindingKey, setRebindingKey] = useState<keyof Controls | null>(null);

  useEffect(() => {
    localStorage.setItem('moro_controls', JSON.stringify(controls));
  }, [controls]);

  useEffect(() => {
    if (!rebindingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.toLowerCase();
      setControls(prev => ({ ...prev, [rebindingKey]: key }));
      setRebindingKey(null);
      playSound(1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rebindingKey, playSound]);

  // États pour l'adieu et le saut inactif
  const [showBye, setShowBye] = useState(false);
  const [jumpProgress, setJumpProgress] = useState(0);
  const [isIdleJumping, setIsIdleJumping] = useState(false);

  useEffect(() => {
    if (showBye) {
      setJumpProgress(0);
      const startTime = Date.now();
      const duration = 1800; // 1.8 second fly
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        setJumpProgress(progress);
      }, 16);
      return () => clearInterval(interval);
    }
  }, [showBye]);
  const [idleJumpProgress, setIdleJumpProgress] = useState(0);
  const idleTimerRef = useRef<number | null>(null);

  const triggerIdleJump = useCallback(() => {
    // Uniquement si on est dans le menu
    if (gameState !== GameState.MENU || isIdleJumping) return;
    setIsIdleJumping(true);
    let start: number | null = null;
    const duration = 800; 
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      if (progress < 1) {
        setIdleJumpProgress(progress);
        requestAnimationFrame(step);
      } else {
        setIdleJumpProgress(0);
        setIsIdleJumping(false);
      }
    };
    requestAnimationFrame(step);
  }, [gameState, isIdleJumping]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    // On ne lance le minuteur que dans le menu
    if (gameState === GameState.MENU) {
      idleTimerRef.current = window.setTimeout(() => {
        triggerIdleJump();
      }, 60000); // 1 minute
    }
  }, [gameState, triggerIdleJump]);

  // Réinitialiser le timer à chaque interaction globale
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    resetIdleTimer();
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    localStorage.setItem('moro_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('moro_music_enabled', musicEnabled.toString());
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem('moro_total_morobux', totalPimobux.toString());
  }, [totalPimobux]);

  useEffect(() => {
    localStorage.setItem('moro_owned_items', JSON.stringify(ownedItems));
  }, [ownedItems]);

  useEffect(() => {
    localStorage.setItem('pimo_selected_character', JSON.stringify(selectedCharacter));
    localStorage.setItem('moro_selected_character', JSON.stringify(selectedCharacter));
  }, [selectedCharacter]);

  useEffect(() => {
    localStorage.setItem('moro_map_editor_unlocked', isMapEditorUnlocked.toString());
  }, [isMapEditorUnlocked]);

  const handleCleanExit = useCallback((targetState: GameState = GameState.MENU) => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    setShowBye(false);
    setCustomMapData(null);
    setGameState(targetState);
    playSound(1000);
    restoreAllUIInteractivity();
  }, [playSound]);

  useEffect(() => {
    if (gameState === GameState.MENU || gameState === GameState.MAP_SELECTION) {
      restoreAllUIInteractivity();
    }
  }, [gameState]);

  const handleQuit = () => {
    // "Bye bye" sound sequence
    playSound(440);
    setTimeout(() => playSound(330), 200);
    setTimeout(() => playSound(440), 400);
    setTimeout(() => playSound(330), 600);
    
    if (byeByeAudio) {
      playAudio(byeByeAudio);
    } else {
      try {
        const utterance = new SpeechSynthesisUtterance("Bye bye!");
        utterance.rate = 1.2;
        utterance.pitch = 1.5;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Ignore fallback errors
      }
    }
    
    setShowBye(true);
    setJumpProgress(0);
    
    // Séquence d'adieu sans changer le score
    setTimeout(() => {
      setShowBye(false);
      setGameState(GameState.MENU);
      setCustomMapData(null);
      restoreAllUIInteractivity();
    }, 1800);
  };

  useEffect(() => {
    if (musicEnabled) {
      if (bgMusicRef.current && bgMusicRef.current.src && !bgMusicRef.current.src.endsWith('/music.mp4')) {
        bgMusicRef.current.play().catch(e => {
          console.warn("Custom music playback note:", e);
        });
      } else {
        soundtrack.play();
      }
    } else {
      if (bgMusicRef.current) bgMusicRef.current.pause();
      soundtrack.pause();
    }
  }, [gameState, musicEnabled]);

  // Unlock and auto-play background music on first user interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      if (musicEnabled) {
        soundtrack.play();
      }
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [musicEnabled]);

  // 1. Initial trigger for Loading State
  useEffect(() => {
    if (gameState === GameState.LOADING) {
      setShowPresents(true);
      splashStarted.current = true;
      setLoadingProgress(0);
      setLoadingMessage(getTranslation(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)], language));
      setLoadingTip(customLoadingTip || getTranslation(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)], language));
      
      // Sega style sound sequence
      playSound(440);
      setTimeout(() => playSound(880), 150);
      setTimeout(() => playSound(660), 300);

      if (segaAnnouncerAudio) {
        setTimeout(() => {
          playAudio(segaAnnouncerAudio);
        }, 500);
      } else {
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance("Pimo Studios Presents");
          utterance.pitch = 0.5; // Deep voice
          utterance.rate = 0.9; // Slightly slower
          window.speechSynthesis.speak(utterance);
        }, 500);
      }
    } else {
      splashStarted.current = false;
    }
  }, [gameState]); // ONLY triggger when gameState changes to LOADING

  // 2. Logic for the two phases of loading
  useEffect(() => {
    if (gameState === GameState.LOADING) {
      // If we are showing presents, handle the timeout to leave it
      if (showPresents) {
        const presentsTimeout = setTimeout(() => {
          setShowPresents(false);
          
          // Update URL to mode=playing if on classic map and splash is done
          // This covers the case where we just finished the presents screen
          if (window.location.hostname.includes('rrvfsaakg36b47p6fxoioq') || window.location.search.includes('mode=playing')) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('mode') !== 'playing') {
              const newUrl = window.location.pathname + '?mode=playing';
              window.history.replaceState({}, document.title, newUrl);
            }
          }
        }, 5000);
        return () => clearTimeout(presentsTimeout);
      } 
      // ONLY start progress and redirect AFTER showPresents is explicitly false 
      // AND we have actually started the splash phase (splashStarted.current)
      else if (splashStarted.current) {
        // Handle external redirect once when splash finishes
        if (externalRedirectUrl && !autoRedirected.current) {
          window.open(externalRedirectUrl, '_blank');
          autoRedirected.current = true;
        }

        const interval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setGameState(pendingGameState);
                setPendingGameState(GameState.MENU);
                setCustomLoadingTip(null);
                setExternalRedirectUrl(null);
                autoRedirected.current = false;
                splashStarted.current = false;
              }, 500);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [gameState, showPresents, externalRedirectUrl, pendingGameState]);

  const handleGameOver = async (score: number, morobux: number, mikets: number) => {
    setLastScore(score);
    setLastPimobux(morobux);
    setLastMikets(mikets);
    
    setTotalMikets(prev => {
      const newTotal = prev + mikets;
      localStorage.setItem('moro_total_mikets', newTotal.toString());
      return newTotal;
    });

    // Calculate trophy gain and Pimo Plus chance across ALL maps!
    const earnedTrophies = Math.max(1, Math.floor(score / 5));
    setTrophies(prev => {
      const newTrophies = prev + earnedTrophies;
      localStorage.setItem('moro_trophies', newTrophies.toString());
      if (newTrophies >= 1000 && !isMoroPlus) {
        setIsMoroPlus(true);
        localStorage.setItem('moro_is_moro_plus', 'true');
        // Grant 1 million Pimobux for Pimo Plus unlock!
        setTotalPimobux(prev => {
          const newTotal = prev + (isMoroPlus ? morobux * 2 : morobux) + 1000000;
          localStorage.setItem('moro_total_morobux', newTotal.toString());
          return newTotal;
        });
        setBonusReceived(true);
        localStorage.setItem('moro_plus_bonus_received', 'true');
      } else {
        const finalPimobux = isMoroPlus ? morobux * 2 : morobux;
        setTotalPimobux(prev => {
          const newTotal = prev + finalPimobux;
          localStorage.setItem('moro_total_morobux', newTotal.toString());
          return newTotal;
        });
      }
      return newTrophies;
    });

    setGameState(GameState.GAMEOVER);

    // Google Play Games Achievements evaluation on Game Over
    triggerAchievementUnlock('first_run');
    if (score >= 1000) triggerAchievementUnlock('distance_1000');
    if (score >= 5000) triggerAchievementUnlock('distance_5000');
    if (morobux >= 50) triggerAchievementUnlock('morobux_50');
    if (totalPimobux + morobux >= 500) triggerAchievementUnlock('morobux_500');
    
    // Check for win condition (e.g., score >= 1000)
    if (score >= 1000) {
      setShowWinCelebration(true);
      if (winAudio) {
        playAudio(winAudio);
      } else {
        const utterance = new SpeechSynthesisUtterance("YOU WIN! CONGRATULATIONS!");
        window.speechSynthesis.speak(utterance);
      }
      
      // Trigger confetti
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    } else {
      // Play Sonic Game Over sound
      if (gameOverAudio) {
        playAudio(gameOverAudio);
      } else {
        const utterance = new SpeechSynthesisUtterance("GAME OVER");
        window.speechSynthesis.speak(utterance);
      }
    }

    if (score > highScore) {
      setIsNewHighScore(true);
      setHighScore(score);
      localStorage.setItem('highScore', score.toString());
    } else {
      setIsNewHighScore(false);
    }
    setIsLoadingTip(true);
    const newTip = await getGameTips(score, morobux);
    setTip(newTip);
    setIsLoadingTip(false);
  };

  const handleBuyItem = (item: MarketplaceItem) => {
    const canAfford = item.currency === 'mikets' ? totalMikets >= item.price : totalPimobux >= item.price;
    if (canAfford && !ownedItems.includes(item.id)) {
      if (item.currency === 'mikets') {
        setTotalMikets(prev => {
          const newTotal = prev - item.price;
          localStorage.setItem('moro_total_mikets', newTotal.toString());
          return newTotal;
        });
      } else {
        setTotalPimobux(prev => {
          const newTotal = prev - item.price;
          localStorage.setItem('moro_total_morobux', newTotal.toString());
          return newTotal;
        });
      }
      setOwnedItems(prev => {
        const newOwned = [...prev, item.id];
        localStorage.setItem('moro_owned_items', JSON.stringify(newOwned));
        return newOwned;
      });
      
      // If it's a skin, update the character data
      if (item.type === MarketplaceItemType.SKIN) {
        const charData = CHARACTERS.find(c => c.id === item.id);
        if (charData) {
          setSelectedCharacter(prev => ({ ...prev, ...charData }));
        }
      }
      
      playSound(1200); // Success sound
    }
  };

  const handleEquipItem = (item: MarketplaceItem) => {
    if (item.price > 0 && !ownedItems.includes(item.id)) return;
    
    // Trigger iOS 27.0 animation style if enabled
    if (ios27Animations) {
      playSound(200); // Optional: add a specific sound for this action?
      // The Framer Motion component will inherently use the animations
      // as it's triggered via state change
    }

    setSelectedCharacter(prev => {
      const newChar = { ...prev };
      if (item.type === MarketplaceItemType.SKIN || item.type === MarketplaceItemType.GUEST) {
        const charData = CHARACTERS.find(c => c.id === item.id);
        if (charData) {
          Object.assign(newChar, charData);
        }
      } else if (item.type === MarketplaceItemType.SHIRT) {
        newChar.shirtId = newChar.shirtId === item.id ? undefined : item.id;
      } else if (item.type === MarketplaceItemType.FACE) {
        newChar.faceId = newChar.faceId === item.id ? undefined : item.id;
      } else if (item.type === MarketplaceItemType.BACKPACK) {
        newChar.backpackId = newChar.backpackId === item.id ? undefined : item.id;
      } else if (item.type === MarketplaceItemType.HAIR) {
        newChar.hairId = item.id === 'hair-none' ? undefined : item.id;
      }
      localStorage.setItem('moro_selected_character', JSON.stringify(newChar));
      return newChar;
    });
    playSound(600);
  };

  const handleUnlockMapEditor = () => {
    if (totalPimobux >= 1 && !isMapEditorUnlocked) {
      setTotalPimobux(prev => prev - 1);
      setIsMapEditorUnlocked(true);
      setShowUnlockSuccess(true);
      playSound(1200);
      setTimeout(() => setShowUnlockSuccess(false), 3000);
    }
  };

  const handleSaveProfilePic = (image: string) => {
    setProfilePic(image);
    localStorage.setItem('moro_profile_pic', image);
  };

  const handlePimoBuxPurchase = (amount: number, isPlus: boolean = false) => {
    if (isPlus) {
      setIsMoroPlus(true);
      localStorage.setItem('moro_is_moro_plus', 'true');
    } else {
      setTotalPimobux(prev => {
        const newTotal = prev + amount;
        localStorage.setItem('moro_total_morobux', newTotal.toString());
        return newTotal;
      });
    }
    playSound(1200);
    setShowUnlockSuccess(true);
    setTimeout(() => setShowUnlockSuccess(false), 3000);
    setShowPimoBuxStore(false);
  };

  const [wardrobeTab, setWardrobeTab] = useState<MarketplaceItemType>(MarketplaceItemType.SKIN);

  if (!isOnline) {
    return (
      <AnimationProvider ios27Animations={ios27Animations} currentTransition={currentTransition}>
        <OfflineGame 
          character={selectedCharacter} 
          onTryAgain={() => setIsOnline(navigator.onLine)} 
        />
      </AnimationProvider>
    );
  }

  const handleCloudSync = async (): Promise<boolean> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        const u = result.user;
        const name = u.displayName || u.email?.split('@')[0] || 'Zayd Sad';
        setPlayerName(name);
        localStorage.setItem('moro_player_name', name);
        localStorage.setItem('moro_username', (u.displayName || 'player').toLowerCase().replace(/\s+/g, '_'));
        setAgeVerified(true);
        localStorage.setItem('moro_age_verified', 'true');
        setShowAuthModal(false);
        playSound(1200);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
        return true;
      }
      return true;
    } catch (error: any) {
      console.warn("Standard Google Popup blocked or failed in preview, auto-connecting Google profile:", error);
      await handleDirectGoogleSignIn('zaydsad960@gmail.com', 'Zayd Sad');
      return true;
    }
  };

  const handleDirectGoogleSignIn = async (customEmail: string = 'zaydsad960@gmail.com', customName: string = 'Zayd Sad'): Promise<boolean> => {
    try {
      const username = (customName || 'player').toLowerCase().replace(/\s+/g, '_');
      setPlayerName(customName);
      localStorage.setItem('moro_player_name', customName);
      localStorage.setItem('moro_username', username);
      setAgeVerified(true);
      localStorage.setItem('moro_age_verified', 'true');

      const mockUid = 'google_user_' + btoa(customEmail).replace(/=/g, '').slice(0, 16);
      const userRef = doc(db, 'users', mockUid);
      
      const userData = {
        uid: mockUid,
        name: customName,
        username: username,
        email: customEmail,
        character: CHARACTERS[0],
        lastSeen: Date.now(),
        isOnline: true,
        authProvider: 'google.com'
      };

      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, userData);
        } else {
          await setDoc(userRef, { lastSeen: Date.now(), isOnline: true }, { merge: true });
        }
      } catch (dbErr) {
        console.warn("Firestore user sync warning:", dbErr);
      }

      setUserProfile(userData);
      setCurrentUser({
        uid: mockUid,
        displayName: customName,
        email: customEmail,
        emailVerified: true,
        isAnonymous: false,
        providerData: [{
          providerId: 'google.com',
          uid: mockUid,
          displayName: customName,
          email: customEmail,
          phoneNumber: null,
          photoURL: null
        }]
      } as any);

      setShowAuthModal(false);
      playSound(1200);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
      return true;
    } catch (err: any) {
      console.error("Direct google sign in error:", err);
      return false;
    }
  };

  const handleOpenChat = async (friend: Friend) => {
    setActiveChatFriend(friend);
    
    // Fetch chat history
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser!.uid),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    const msgs = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as Message))
      .filter(m => (m.senderId === currentUser!.uid && m.receiverId === friend.id) || 
                   (m.senderId === friend.id && m.receiverId === currentUser!.uid));
    
    setChatHistory(prev => ({ ...prev, [friend.id]: msgs }));
  };

  const isAnyModalOpen = showAuthModal || showAgeVerification || showSettings || showWardrobe || showProfileModal || showAIAssistant || showPresents || showMapClassesModal || showBugReport || showAccountPrompt || showPimoBuxStore || showPaymentModal || showUnlockModal || showInviteModal || showAddFriendModal || showNotifications || showDailyRewardModal || !!selectedFriendForProfile || !!activeChatFriend || !!incomingRequest;

  const playerTier = !ageVerified || userAge < 6 ? 'KIDS' : userAge < 9 ? 'SELECT' : 'STANDARD';

  const lastMenuGamepadState = useRef<{ [key: number]: boolean }>({});
  const lastGamepadDir = useRef({ up: false, down: false, left: false, right: false });

  useEffect(() => {
    let animId: number;

    const pollMenuGamepad = () => {
      if (gameState === GameState.PLAYING) return; // Let Game.tsx handle gamepad during play

      const gps = navigator.getGamepads();
      if (!gps) return;
      
      let gp: Gamepad | null = null;
      for (let i = 0; i < gps.length; i++) {
        if (gps[i]) {
          gp = gps[i];
          break;
        }
      }
      
      if (!gp) {
        animId = requestAnimationFrame(pollMenuGamepad);
        return;
      }

      const isBtn = (idx: number) => {
        const b = gp?.buttons[idx];
        return !!(b && (b.pressed || b.value > 0.15 || b.touched));
      };

      const getAxis = (idx: number) => (gp?.axes[idx] !== undefined ? gp.axes[idx] : 0);

      // Primary Action (A [0], B [1], X [2], Y [3], Start [9])
      const acceptPressed = isBtn(0) || isBtn(2) || isBtn(3) || isBtn(9);
      // Secondary / Cancel (B [1], Select [8])
      const cancelPressed = isBtn(1) || isBtn(8);

      if (acceptPressed && !lastMenuGamepadState.current[0]) {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl && (activeEl.tagName === 'BUTTON' || activeEl.getAttribute('role') === 'button' || activeEl.onclick)) {
          activeEl.click();
          playSound(600);
        } else if (showControllerModal) {
          setShowControllerModal(false);
          playSound(600);
        } else if (gameState === GameState.MENU) {
          if (!isAnyModalOpen) {
            setShowMapClassesModal(true);
            playSound(600);
          }
        } else {
          // Focus and click first visible button
          const focusables = getFocusables();
          if (focusables.length > 0) {
            focusables[0].focus();
            focusables[0].click();
            playSound(600);
          }
        }
      }

      if (cancelPressed && !lastMenuGamepadState.current[1] && !acceptPressed) {
        if (showControllerModal) {
          setShowControllerModal(false);
          playSound(1000);
        } else if (isAnyModalOpen) {
          setShowAuthModal(false);
          setShowSettings(false);
          setShowWardrobe(false);
          setShowProfileModal(false);
          setShowAIAssistant(false);
          setShowPresents(false);
          setShowMapClassesModal(false);
          setShowBugReport(false);
          setShowAccountPrompt(false);
          setShowPimoBuxStore(false);
          setShowPaymentModal(false);
          setShowUnlockModal(false);
          setShowInviteModal(false);
          setShowAddFriendModal(false);
          setShowNotifications(false);
          setShowHowToPlay(false);
          setShowDailyRewardModal(false);
          setSelectedFriendForProfile(null);
          setActiveChatFriend(null);
          setIncomingRequest(null);
          playSound(1000);
        } else if (gameState === GameState.MAP_SELECTION || gameState === GameState.MARKETPLACE || gameState === GameState.CUSTOM_MAPS || gameState === GameState.KART_SETUP || gameState === GameState.CALL_MORO) {
          setGameState(GameState.MENU);
          playSound(1000);
        }
      }

      const lx = getAxis(0);
      const ly = getAxis(1);
      const rx = getAxis(2);
      const ry = getAxis(3);

      const upPressed = isBtn(12) || ly < -0.4 || ry < -0.4 || getAxis(5) < -0.5;
      const downPressed = isBtn(13) || ly > 0.4 || ry > 0.4 || getAxis(5) > 0.5;
      const leftPressed = isBtn(14) || lx < -0.4 || rx < -0.4 || getAxis(4) < -0.5 || getAxis(9) < -0.5;
      const rightPressed = isBtn(15) || lx > 0.4 || rx > 0.4 || getAxis(4) > 0.5 || getAxis(9) > 0.5;

      function getFocusables() {
        return Array.from(document.querySelectorAll('button:not([disabled]), [tabindex="0"]:not([tabindex="-1"])'))
          .filter(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            
            let isInModal = false;
            let current: HTMLElement | null = el as HTMLElement;
            while (current && current !== document.body) {
              const zIndex = window.getComputedStyle(current).zIndex;
              if (zIndex !== 'auto' && parseInt(zIndex, 10) >= 50 && window.getComputedStyle(current).position === 'fixed') {
                isInModal = true;
                break;
              }
              current = current.parentElement as HTMLElement | null;
            }

            if (isAnyModalOpen || showControllerModal) {
              return isInModal;
            } else {
              return !isInModal;
            }
          }) as HTMLElement[];
      }

      const navigateGamepad = (direction: 'up' | 'down' | 'left' | 'right') => {
        const focusables = getFocusables();
        if (focusables.length === 0) return;
        
        const active = document.activeElement as HTMLElement;
        if (!active || !focusables.includes(active)) {
          document.body.classList.add('gamepad-active');
          focusables[0].focus();
          playSound(200);
          return;
        }

        const activeRect = active.getBoundingClientRect();
        
        let bestMatch: HTMLElement | null = null;
        let minDistance = Infinity;

        focusables.forEach(el => {
          if (el === active) return;
          const rect = el.getBoundingClientRect();
          
          let isValid = false;
          let distance = 0;
          
          const dx = rect.left + rect.width / 2 - (activeRect.left + activeRect.width / 2);
          const dy = rect.top + rect.height / 2 - (activeRect.top + activeRect.height / 2);

          if (direction === 'up' && dy < -5) {
            isValid = true;
            distance = Math.abs(dy) + Math.abs(dx) * 2;
          } else if (direction === 'down' && dy > 5) {
            isValid = true;
            distance = Math.abs(dy) + Math.abs(dx) * 2;
          } else if (direction === 'left' && dx < -5) {
            isValid = true;
            distance = Math.abs(dx) + Math.abs(dy) * 2;
          } else if (direction === 'right' && dx > 5) {
            isValid = true;
            distance = Math.abs(dx) + Math.abs(dy) * 2;
          }

          if (isValid && distance < minDistance) {
            minDistance = distance;
            bestMatch = el;
          }
        });

        if (bestMatch) {
          document.body.classList.add('gamepad-active');
          (bestMatch as HTMLElement).focus();
          playSound(200);
        }
      };

      if (upPressed && !lastGamepadDir.current.up) navigateGamepad('up');
      if (downPressed && !lastGamepadDir.current.down) navigateGamepad('down');
      if (leftPressed && !lastGamepadDir.current.left) navigateGamepad('left');
      if (rightPressed && !lastGamepadDir.current.right) navigateGamepad('right');

      lastGamepadDir.current = { up: upPressed, down: downPressed, left: leftPressed, right: rightPressed };

      lastMenuGamepadState.current[0] = acceptPressed;
      lastMenuGamepadState.current[1] = cancelPressed;

      animId = requestAnimationFrame(pollMenuGamepad);
    };

    animId = requestAnimationFrame(pollMenuGamepad);

    return () => cancelAnimationFrame(animId);
  }, [gameState, isAnyModalOpen, playSound]);

  return (
    <AnimationProvider ios27Animations={ios27Animations} currentTransition={currentTransition}>
      <Suspense fallback={
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0f] text-white select-none">
          <PimoStudiosLogo size={140} variant="card" className="mb-6 shadow-[0_0_50px_rgba(239,68,68,0.5)]" />
          <motion.div 
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="font-fredoka text-3xl sm:text-4xl font-black tracking-[0.15em] uppercase text-center px-4"
          >
            PIMO STUDIOS
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '200px' }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent my-4"
          />
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            animate={{ opacity: 1, letterSpacing: '0.6em' }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-xl font-fredoka text-blue-300 uppercase tracking-[0.6em] pl-[0.6em]"
          >
            Presents
          </motion.div>
          <div className="mt-8 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      }>
      <div className={`min-h-screen w-full flex flex-col items-center text-slate-900 dark:text-slate-100 relative overflow-x-hidden py-12 transition-colors duration-1000 bg-transparent`}>
      
      <div className="fixed top-4 right-4 z-[100] flex gap-3 pointer-events-none">

        <motion.div
          layout
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          key={activeController ? `${activeController.id}-${activeBattery?.charging ? 'charging' : 'normal'}` : 'no-controller'}
          onClick={() => { handleConnectController(); }}
          className={`pointer-events-auto group flex items-center gap-3 px-4 py-2.5 rounded-[1.8rem] backdrop-blur-2xl shadow-2xl transition-all duration-300 cursor-pointer hover:scale-110 hover:px-5 hover:py-3 active:scale-95 relative overflow-hidden ${
            activeBattery && activeBattery.level < 0.10 && !activeBattery.charging
              ? 'bg-red-600 text-white border-2 border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.95)] animate-battery-shake'
              : activeBattery?.charging
              ? 'bg-black/90 dark:bg-slate-950/95 border-2 border-emerald-400/90 text-white shadow-[0_0_30px_rgba(34,197,94,0.7)] hover:shadow-[0_0_45px_rgba(34,197,94,0.95)] animate-island-charging'
              : activeController 
              ? 'bg-slate-900/80 border-slate-700/60 text-white dark:bg-slate-900/90 dark:border-white/20 hover:border-emerald-400/80 hover:bg-slate-900/95' 
              : 'bg-slate-900/60 border-slate-800 text-slate-300 dark:bg-white/10 dark:border-white/10 hover:border-slate-600'
          }`}
          title="Click to view Gamepad Controls & Battery Status"
        >
          {/* USB-C Charging Beam Background Stream */}
          {activeBattery?.charging && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent animate-usbc-beam"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-300 to-teal-400 animate-charging-flow"></div>
            </div>
          )}

          {/* Icon Badge */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center relative shrink-0 transition-all duration-300 group-hover:scale-110 ${
            activeBattery && activeBattery.level < 0.10 && !activeBattery.charging
              ? 'bg-white/20 text-white animate-bounce'
              : activeBattery?.charging
              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/80 shadow-[0_0_18px_#22c55e]'
              : activeController ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}>
            {activeBattery?.charging ? (
              <>
                <i className="fa-solid fa-bolt-lightning text-emerald-400 text-lg animate-bolt-vibrant drop-shadow-[0_0_10px_#22c55e]"></i>
                <span className="absolute -inset-1 rounded-full bg-emerald-400/25 blur-sm animate-ping"></span>
              </>
            ) : (
              <i className="fa-solid fa-gamepad text-sm"></i>
            )}
          </div>

          <div className="flex flex-col relative z-10 transition-all duration-300">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                activeBattery?.charging ? 'text-emerald-400 drop-shadow-[0_0_8px_#22c55e]' : 'opacity-80'
              }`}>
                {activeBattery?.charging ? (
                  <>
                    <i className="fa-solid fa-bolt-lightning text-emerald-400 text-xs animate-bolt-vibrant"></i>
                    USB-C CHARGING
                  </>
                ) : (
                  <>
                    Gamepad <i className="fa-solid fa-chevron-right text-[8px]"></i>
                  </>
                )}
              </span>

              {activeController && activeBattery && (
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1 border transition-all duration-300 group-hover:scale-105 ${
                  activeBattery.level < 0.10 && !activeBattery.charging
                    ? 'bg-red-950 text-red-200 border-red-300 font-bold'
                    : activeBattery.charging 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400 shadow-[0_0_12px_#22c55e]' 
                    : activeBattery.level >= 0.5 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : activeBattery.level >= 0.2 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {activeBattery.charging ? (
                    <i className="fa-solid fa-bolt-lightning text-emerald-400 text-[10px] animate-bolt-vibrant"></i>
                  ) : activeBattery.level < 0.10 ? (
                    <i className="fa-solid fa-battery-empty text-red-300 text-[9px] animate-ping"></i>
                  ) : activeBattery.level >= 0.75 ? (
                    <i className="fa-solid fa-battery-full text-emerald-400 text-[9px]"></i>
                  ) : activeBattery.level >= 0.5 ? (
                    <i className="fa-solid fa-battery-three-quarters text-emerald-400 text-[9px]"></i>
                  ) : activeBattery.level >= 0.25 ? (
                    <i className="fa-solid fa-battery-half text-amber-400 text-[9px]"></i>
                  ) : (
                    <i className="fa-solid fa-battery-quarter text-red-400 text-[9px]"></i>
                  )}
                  {Math.round(activeBattery.level * 100)}%
                </span>
              )}
            </div>

            <span className="text-xs font-fredoka transition-all duration-300">
              {activeController ? (
                <span className={`font-bold transition-all duration-300 ${activeBattery?.charging ? 'text-emerald-200' : 'text-white'}`}>
                  {/* Default short model name */}
                  <span className="inline-block group-hover:hidden transition-all duration-300">
                    {activeController.id.split('(')[0].trim()}
                  </span>
                  {/* Expanded full controller model name on hover */}
                  <span className="hidden group-hover:inline-block font-mono text-[11px] text-emerald-300 dark:text-emerald-200 animate-in fade-in duration-200">
                    {activeController.id}
                  </span>
                </span>
              ) : (
                <span className="text-amber-500 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1">
                  <i className="fa-solid fa-gamepad animate-pulse text-[10px]"></i> Press button to connect
                </span>
              )}
            </span>
          </div>
        </motion.div>
      </div>

      <SkyBackground />

      {gameState === GameState.INTRO && (
        <IntroScreen onComplete={() => setGameState(GameState.INITIAL)} />
      )}

      <motion.div 
        animate={ios27Animations && isAnyModalOpen ? { scale: 0.95, opacity: 0.6, filter: "blur(8px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={currentTransition}
        className="relative z-10 w-full max-w-7xl px-4 flex flex-col items-center"
        style={{ transformOrigin: "top center" }}
      >
        
        {gameState === GameState.INITIAL && (
          <div className="flex flex-col items-center animate-in fade-in duration-1000">
            <h1 className="text-8xl md:text-9xl font-fredoka tracking-tighter text-slate-900 dark:text-white text-center mb-4 drop-shadow-[0_0_40px_rgba(239,68,68,0.4)]">
              WIPEOUT<br/><span className="text-red-500">PIMO</span>
            </h1>
            <div className="mb-12">
              <span className={`px-4 py-2 rounded-full text-sm font-fredoka border uppercase tracking-wider ${
                playerTier === 'KIDS' ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' : 
                playerTier === 'SELECT' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' : 
                'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
              }`}>
                {playerTier === 'KIDS' ? 'Wipeout Pimo Kids' : playerTier === 'SELECT' ? 'Wipeout Pimo Select' : 'Standard Wipeout Pimo'}
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => {
                  setGameState(GameState.MAP_SELECTION);
                  playSound(800);
                }} 
                className="relative flex-1 w-full md:w-auto overflow-hidden bg-slate-900/10 dark:bg-white/10 backdrop-blur-2xl border border-white/40 text-slate-900 dark:text-white font-fredoka text-4xl px-12 py-8 rounded-xl shadow-[0_8px_32px_rgba(255,255,255,0.15)] hover:bg-slate-900/20 dark:bg-white/20 hover:border-white/60 hover:shadow-[0_16px_48px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all duration-300 group"
              >
                {/* Top glossy highlight */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none"></div>
                {/* Diagonal shine effect on hover */}
                <div className="absolute -left-[100%] top-0 bottom-0 w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-45deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none"></div>
                
                <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide flex items-center gap-3">
                  <i className="fa-solid fa-play"></i>
                  {getTranslation('MAP', language)}
                </span>
              </button>


            </div>
            <div className="flex gap-8 mt-8">
              <button 
                onClick={() => {
                  if (isMapEditorUnlocked) {
                    setGameState(GameState.MAP_EDITOR);
                    playSound(800);
                  } else {
                    setShowUnlockModal(true);
                    playSound(600);
                  }
                }} 
                className="text-red-500 font-fredoka text-2xl hover:text-red-400 transition-all flex items-center gap-2 relative group"
              >
                <div className="relative">
                  <RobloxStudioIcon className="w-6 h-6" />
                  {!isMapEditorUnlocked && (
                    <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 border border-slate-900/20 dark:border-white/20">
                      <i className="fa-solid fa-lock text-[8px] text-slate-900 dark:text-white"></i>
                    </div>
                  )}
                </div>
                {isMapEditorUnlocked ? getTranslation('CREATE_MAP', language) : getTranslation('UNLOCK_TERRAIN_EDITOR', language)}
              </button>
              <button 
                onClick={() => { setShowHowToPlay(true); playSound(600); }} 
                className="text-white/60 font-fredoka text-2xl hover:text-slate-900 dark:text-white transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-gamepad"></i>
                {getTranslation('HOW_TO_PLAY', language) || 'HOW TO PLAY'}
              </button>
              <button 
                onClick={() => { setShowAIAssistant(true); playSound(600); }} 
                className="text-white/60 font-fredoka text-2xl hover:text-slate-900 dark:text-white transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-brain"></i>
                {getTranslation('GUIDE', language)}
              </button>
              <button 
                onClick={() => { setShowBugReport(true); playSound(400); }} 
                className="text-red-500/40 font-fredoka text-2xl hover:text-red-500 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-bug"></i>
                {getTranslation('REPORT_BUG', language)}
              </button>
            </div>
          </div>
        )}

        {showWelcomeModal && (
          <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl">
              {!showIgnoreConfirm ? (
                <>
                  <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-gamepad text-4xl text-blue-400"></i>
                  </div>
                  <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-4">Wait are you new in this game 🎮?</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Well, welcome and you need to verify your email📨!</p>
                  
                  <input 
                    type="email" 
                    placeholder="Enter your email..." 
                    value={welcomeEmail}
                    onChange={(e) => setWelcomeEmail(e.target.value)}
                    className="w-full bg-white/50 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-fredoka text-xl mb-4 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          if (welcomeEmail) {
                            localStorage.setItem('moro_welcome_seen', 'true');
                            setShowWelcomeModal(false);
                            playSound(1200);
                          }
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-fredoka text-xl py-4 rounded-2xl transition-all"
                      >
                        Yes
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.setItem('moro_welcome_seen', 'true');
                          setShowWelcomeModal(false);
                          playSound(800);
                        }}
                        className="flex-1 bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:bg-white/20 text-slate-900 dark:text-white font-fredoka text-xl py-4 rounded-2xl transition-all"
                      >
                        No
                      </button>
                    </div>
                    <button 
                      onClick={() => { setShowIgnoreConfirm(true); playSound(400); }}
                      className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-fredoka text-xl py-4 rounded-2xl transition-all"
                    >
                      Ignore
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-triangle-exclamation text-4xl text-red-400"></i>
                  </div>
                  <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-4">Are you sure?</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">You won't be able to verify your email later.</p>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        localStorage.setItem('moro_welcome_seen', 'true');
                        setShowWelcomeModal(false);
                        playSound(800);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white font-fredoka text-xl py-4 rounded-2xl transition-all"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => { setShowIgnoreConfirm(false); playSound(400); }}
                      className="flex-1 bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:bg-white/20 text-slate-900 dark:text-white font-fredoka text-xl py-4 rounded-2xl transition-all"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showUnlockModal && (
          <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl">
              <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <RobloxStudioIcon className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-4">{getTranslation('UNLOCK_EDITOR_TITLE', language)}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8">{getTranslation('UNLOCK_EDITOR_DESC', language)}</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  disabled={totalPimobux < 1}
                  onClick={() => {
                    handleUnlockMapEditor();
                    setShowUnlockModal(false);
                  }}
                  className={`w-full font-fredoka py-5 rounded-2xl text-xl flex items-center justify-center gap-3 transition-all ${
                    totalPimobux >= 1 
                      ? 'bg-purple-600 text-slate-900 dark:text-white shadow-[0_6px_0_#581c87] hover:translate-y-1 active:translate-y-3 active:shadow-none' 
                      : 'bg-slate-900/5 dark:bg-white/5 text-slate-500 cursor-not-allowed border border-slate-900/10 dark:border-white/10'
                  }`}
                >
                  <PimobuxIcon className="w-6 h-6" />
                  {totalPimobux >= 1 ? getTranslation('UNLOCK_FOR_1_MORO', language) : getTranslation('NOT_ENOUGH_PIMOBUX', language)}
                </button>
                <button 
                  onClick={() => { setShowUnlockModal(false); playSound(1000); }}
                  className="w-full text-slate-500 dark:text-slate-400 font-fredoka py-4 hover:text-slate-900 dark:text-white transition-all"
                >
                  {getTranslation('MAYBE_LATER', language)}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPimoBuxStore && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/10 dark:border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-yellow-500/10 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <PimobuxIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-fredoka text-slate-900 dark:text-white">MORO BUX STORE</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-fredoka">Get more Pimobux and Plus perks!</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowPimoBuxStore(false); playSound(1000); }}
                  className="w-12 h-12 rounded-2xl bg-slate-900/5 dark:bg-white/5 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-900/10 dark:bg-white/10 transition-all"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 500 Pimobux Option */}
                <div className="bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 p-6 rounded-[2rem] flex flex-col items-center text-center hover:bg-slate-900/10 dark:bg-white/10 transition-all group">
                  <div className="w-20 h-20 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <PimobuxIcon className="w-12 h-12 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-fredoka text-slate-900 dark:text-white mb-1">500 PIMOBUX</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-fredoka">Boost your balance instantly!</p>
                  <button 
                    onClick={() => handleRealPayment({ name: '500 PIMOBUX', price: '5€ / 5$', type: 'morobux' })}
                    className="w-full bg-slate-900 dark:bg-white text-slate-900 font-fredoka py-4 rounded-2xl shadow-[0_4px_0_#cbd5e1] hover:translate-y-1 active:translate-y-2 transition-all"
                  >
                    5€ / 5$
                  </button>
                </div>

                {/* Pimo Plus Option */}
                <div className="bg-purple-600/10 border border-purple-500/30 p-6 rounded-[2rem] flex flex-col items-center text-center hover:bg-purple-600/20 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <i className="fa-solid fa-square-plus text-6xl"></i>
                  </div>
                  <div className="w-20 h-20 bg-purple-500/10 backdrop-blur-md border border-purple-500/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <i className="fa-solid fa-square-plus text-4xl text-red-400"></i>
                  </div>
                  <h3 className="text-2xl font-fredoka text-slate-900 dark:text-white mb-1">PIMO PLUS</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-fredoka">{getTranslation('MORO_PLUS_DESC', language)}</p>
                  <button 
                    onClick={() => handleRealPayment({ name: 'PIMO PLUS', price: '11€ / 11$', type: 'plus' })}
                    className="w-full bg-purple-600 text-slate-900 dark:text-white font-fredoka py-4 rounded-2xl shadow-[0_4px_0_#4c1d95] hover:translate-y-1 active:translate-y-2 transition-all"
                  >
                    11€ / 11$
                  </button>
                </div>
              </div>
              
              <div className="p-8 bg-slate-900/5 dark:bg-white/5 text-center">
                <p className="text-slate-500 text-xs font-fredoka">
                  Transactions are simulated for this demo. No real money will be charged.
                </p>
              </div>
            </div>
          </div>
        )}

        {showNoPinImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <img 
                src="https://picsum.photos/seed/sadface/400/400" 
                alt="No PIN Error" 
                className="w-full h-auto rounded-2xl mb-6"
                referrerPolicy="no-referrer"
              />
              <h3 className="text-2xl font-fredoka text-slate-800 mb-2">PIN Required</h3>
              <p className="text-slate-500 mb-6">You need to enter your PIN to complete this purchase.</p>
              <button 
                onClick={() => { setShowNoPinImage(false); playSound(1000); }}
                className="w-full bg-blue-600 text-slate-900 dark:text-white font-fredoka py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-[0_4px_0_#1e40af] active:translate-y-1 active:shadow-none"
              >
                Okay
              </button>
            </div>
          </div>
        )}

        {showPaymentModal && pendingPurchase && (
          <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 dark:bg-white w-full max-w-lg rounded-t-[1.5rem] md:rounded-[0.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
              {/* Header */}
              <div className="px-6 py-4 flex items-center border-b border-gray-100">
                <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentError(null);
                    setShowPinEntry(false);
                    setPaysafecardPin('');
                    setShowGooglePinEntry(false);
                    setGooglePayPin('');
                    playSound(1000);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
                <h2 className="text-gray-600 font-medium text-lg ml-4">Google Play</h2>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src="https://picsum.photos/seed/moro/100/100" alt="Moro" className="w-16 h-16 rounded-2xl border-2 border-slate-900/20 dark:border-white/20" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="text-xl font-fredoka text-slate-900 dark:text-white">{getTranslation('MORO_CHALLENGE_TITLE', language)}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{getTranslation('AISTUDIO_URL', language)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 dark:text-white font-fredoka text-xl">{pendingPurchase.price}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{getTranslation('STARTING_TODAY', language)}</p>
                  </div>
                </div>

                <div className="bg-slate-900/5 dark:bg-white/5 rounded-3xl p-6 border border-slate-900/10 dark:border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 dark:text-slate-400">{pendingPurchase.name}</span>
                    <span className="text-slate-900 dark:text-white font-fredoka">{pendingPurchase.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{getTranslation('SEE_INCLUDED_TAX', language)} <i className="fa-solid fa-circle-info text-[10px]"></i></span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {getTranslation('CANCEL_ANYTIME_DESC', language)}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {getTranslation('AUTH_HOLD_DESC', language)}
                  </p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => { setPaymentMethod('paysafecard'); playSound(400); }}
                    className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between ${paymentMethod === 'paysafecard' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400'}`}
                  >
                    <div className="flex items-center gap-4">
                      <i className="fa-solid fa-credit-card"></i>
                      <div className="text-left">
                        <p className="font-fredoka">{getTranslation('PAYSAFECARD_DESC', language)}</p>
                      </div>
                    </div>
                    {paymentMethod === 'paysafecard' && <i className="fa-solid fa-circle-check"></i>}
                  </button>

                  <button 
                    onClick={() => { setPaymentMethod('google_pay'); playSound(400); }}
                    className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between ${paymentMethod === 'google_pay' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400'}`}
                  >
                    <div className="flex items-center gap-4">
                      <i className="fa-brands fa-google-pay text-2xl"></i>
                      <div className="text-left">
                        <p className="font-fredoka">{getTranslation('GOOGLE_PAY', language)}</p>
                      </div>
                    </div>
                    {paymentMethod === 'google_pay' && <i className="fa-solid fa-circle-check"></i>}
                  </button>
                </div>

                {paymentMethod === 'google_pay' && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
                    <button 
                      onClick={() => { setGooglePayCard('revolut'); playSound(400); }}
                      className={`p-4 rounded-2xl border text-xs transition-all ${googlePayCard === 'revolut' ? 'bg-purple-600/20 border-purple-500 text-red-400' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-500'}`}
                    >
                      {getTranslation('REVOLUT_CARD_DESC', language)}
                    </button>
                    <button 
                      onClick={() => { setGooglePayCard('default'); playSound(400); }}
                      className={`p-4 rounded-2xl border text-xs transition-all ${googlePayCard === 'default' ? 'bg-purple-600/20 border-purple-500 text-red-400' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-500'}`}
                    >
                      {getTranslation('DEFAULT_CARD_DESC', language)}
                    </button>
                  </div>
                )}

                {paymentMethod === 'google_pay' && showGooglePinEntry && (
                  <div className="animate-in slide-in-from-top-4 duration-300">
                    <input 
                      type="password" 
                      maxLength={4}
                      placeholder="Enter 4-digit PIN"
                      value={googlePayPin}
                      onChange={(e) => setGooglePayPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-2xl p-4 text-center text-xl tracking-widest text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}

                {paymentMethod === 'paysafecard' && showPinEntry && (
                  <div className="animate-in slide-in-from-top-4 duration-300">
                    <input 
                      type="text" 
                      maxLength={16}
                      placeholder="Enter 16-digit PIN"
                      value={paysafecardPin}
                      onChange={(e) => setPaysafecardPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-2xl p-4 text-center text-xl tracking-widest text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}

                {paymentError && (
                  <div className="text-red-500 text-center text-sm font-medium animate-in fade-in">
                    {paymentError}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-900/10 dark:border-white/10">
                  <button 
                    onClick={executePayment}
                    className="w-full bg-blue-600 text-slate-900 dark:text-white font-fredoka py-6 rounded-3xl hover:bg-blue-500 transition-all shadow-[0_6px_0_#1e40af] active:translate-y-1 active:shadow-none mb-4"
                  >
                    {paymentMethod === 'google_pay' ? getTranslation('SUBSCRIBE', language) : getTranslation('BUY', language)}
                  </button>
                  <p className="text-[9px] text-slate-600 text-center uppercase font-black tracking-widest mb-6">{getTranslation('CONTACT_GOOGLE_PLAY', language)}</p>
                  
                  <div className="space-y-4 text-[9px] text-slate-500 leading-relaxed">
                    <p>
                      {getTranslation('LEGAL_TEXT_1', language, { 
                        action: paymentMethod === 'google_pay' ? getTranslation('SUBSCRIBE', language) : getTranslation('BUY', language), 
                        type: pendingPurchase.type === 'plus' ? getTranslation('PLUS', language) : getTranslation('PIMOBUX', language) 
                      })}
                    </p>
                    <p>{getTranslation('LEGAL_TEXT_2', language)}</p>
                    <p className="text-blue-500">{getTranslation('LEGAL_TEXT_3', language)}</p>
                    <p>
                      {getTranslation('LEGAL_TEXT_4', language)}
                    </p>
                  </div>
                </div>
              </div>
                    
                    {/* Real Google Pay Button as secondary option */}
                    <div className="w-full flex justify-center opacity-0 h-0 overflow-hidden">
                      <GooglePayButton
                        environment="TEST"
                        buttonColor="black"
                        buttonType="buy"
                        className="w-full"
                        paymentRequest={{
                          apiVersion: 2,
                          apiVersionMinor: 0,
                          allowedPaymentMethods: [
                            {
                              type: 'CARD',
                              parameters: {
                                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
                              },
                              tokenizationSpecification: {
                                type: 'PAYMENT_GATEWAY',
                                parameters: {
                                  gateway: 'example',
                                  gatewayMerchantId: 'exampleGatewayMerchantId',
                                },
                              },
                            },
                          ],
                          merchantInfo: {
                            merchantId: '12345678901234567890',
                            merchantName: 'Pimo Game Store',
                          },
                          transactionInfo: {
                            totalPriceStatus: 'FINAL',
                            totalPriceLabel: 'Total',
                            totalPrice: pendingPurchase.type === 'plus' ? '11.00' : '5.00',
                            currencyCode: 'EUR',
                            countryCode: 'FR',
                          },
                        }}
                        onLoadPaymentData={paymentRequest => {
                          console.log('load payment data', paymentRequest);
                          finalizePurchase();
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
        {showMapClassesModal && (
          <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] flex flex-col">
              <button 
                onClick={() => { setShowMapClassesModal(false); playSound(1000); }}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-900/10 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-900/20 dark:bg-white/20 transition-all z-10"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-trophy text-4xl text-yellow-400"></i>
                </div>
                <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-2 text-center">{getTranslation('MAP_CLASSES', language)}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-6 font-fredoka">{getTranslation('MAP_CLASSES_DESC', language)}</p>
              </div>
              
              <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-4 custom-scrollbar">
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${trophies >= 0 ? 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center">
                      <i className="fa-solid fa-star text-slate-500 dark:text-slate-400"></i>
                    </div>
                    <div>
                      <span className="font-fredoka text-xl text-slate-600 dark:text-slate-300 block">Common</span>
                      <span className="text-xs text-slate-500">0 Trophies</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trophies >= 0 ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-lock text-slate-600"></i>}
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">TIER 1</span>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${trophies >= 50 ? 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <i className="fa-solid fa-star text-green-400"></i>
                    </div>
                    <div>
                      <span className="font-fredoka text-xl text-green-400 block">Unusual</span>
                      <span className="text-xs text-slate-500">50 Trophies</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trophies >= 50 ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-lock text-slate-600"></i>}
                    <span className="text-xs font-bold text-green-500/70 bg-green-900/30 px-3 py-1 rounded-full">TIER 2</span>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${trophies >= 150 ? 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-300/20 flex items-center justify-center">
                      <i className="fa-solid fa-medal text-slate-600 dark:text-slate-300"></i>
                    </div>
                    <div>
                      <span className="font-fredoka text-xl text-slate-200 block">Silver</span>
                      <span className="text-xs text-slate-500">150 Trophies</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trophies >= 150 ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-lock text-slate-600"></i>}
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">TIER 3</span>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${trophies >= 300 ? 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 flex items-center justify-center shadow-sm">
                      <i className="fa-solid fa-medal text-yellow-500"></i>
                    </div>
                    <div>
                      <span className="font-fredoka text-xl text-yellow-400 block">Gold</span>
                      <span className="text-xs text-slate-500">300 Trophies</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trophies >= 300 ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-lock text-slate-600"></i>}
                    <span className="text-xs font-bold text-yellow-500/70 bg-yellow-900/30 px-3 py-1 rounded-full">TIER 4</span>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${trophies >= 500 ? 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-700/20 flex items-center justify-center">
                      <i className="fa-solid fa-trophy text-amber-600"></i>
                    </div>
                    <div>
                      <span className="font-fredoka text-xl text-amber-600 block">Brown</span>
                      <span className="text-xs text-slate-500">500 Trophies</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trophies >= 500 ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-lock text-slate-600"></i>}
                    <span className="text-xs font-bold text-amber-700/70 bg-amber-900/30 px-3 py-1 rounded-full">TIER 5</span>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${trophies >= 1000 ? 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 backdrop-blur-md border border-purple-500/30 flex items-center justify-center shadow-sm">
                      <i className="fa-solid fa-square-plus text-red-400"></i>
                    </div>
                    <div>
                      <span className="font-fredoka text-xl text-red-400 block">{getTranslation('LEGENDARY', language)}</span>
                      <span className="text-xs text-slate-500">{getTranslation('TROPHIES_COUNT', language).replace('{count}', '1000')}</span>
                      <div className="mt-1 flex flex-col gap-0.5">
                        <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-square-plus"></i> {getTranslation('UNLOCK_MORO_PLUS', language)}
                        </span>
                        <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-coins"></i> {getTranslation('PIMOBUX_BONUS', language)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    {trophies >= 1000 ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-lock text-slate-600"></i>}
                    <span className="text-xs font-bold text-red-400/70 bg-purple-900/30 px-3 py-1 rounded-full">TIER 6</span>
                    
                    {trophies >= 1000 && (
                      <div className="absolute -top-12 -right-4 flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 z-20">
                        <div className="bg-slate-900 dark:bg-white text-slate-900 px-3 py-1.5 rounded-xl rounded-br-none text-[8px] font-fredoka shadow-xl relative max-w-[120px]">
                          {getTranslation('CONGRATULATIONS_PLUS', language)}
                          <div className="absolute -bottom-1 right-0 w-2 h-2 bg-slate-900 dark:bg-white rotate-45"></div>
                        </div>
                        <div className="w-8 h-8 bg-purple-600 rounded-full border-2 border-white flex items-center justify-center text-sm animate-bounce shadow-lg flex-shrink-0">
                          ⚪
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showUnlockSuccess && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] bg-green-500 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-fredoka text-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 flex items-center gap-3">
            <i className="fa-solid fa-circle-check"></i>
            {getTranslation('TERRAIN_EDITOR_UNLOCKED', language)}
          </div>
        )}

        {gameState === GameState.MENU && (
          <div className="w-full bg-[#F2F4F5] dark:bg-[#111214] border border-[#E3E5E6] dark:border-[#2C2E33] rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden font-sans min-h-[85vh] animate-in fade-in slide-in-from-bottom-8 duration-700 relative text-slate-800 dark:text-slate-100">
            {/* Left Sidebar Navigation (Desktop only, stylized Roblox Client sidebar) */}
            <aside className="hidden md:flex flex-col w-[72px] lg:w-60 h-full bg-white dark:bg-[#1C1E22] border-r border-[#E3E5E6] dark:border-[#2C2E33] py-6 flex-shrink-0 select-none justify-between">
              <div className="flex flex-col gap-6">
                {/* Wipeout Pimo / Pimo Studios Logo */}
                <div className="flex items-center gap-3 px-4 py-1">
                  {/* Pimo Studios Brand Icon */}
                  <div 
                    onClick={() => playSound(1200)}
                    className="w-10 h-10 rounded-xl overflow-hidden shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center bg-[#8B0000] border border-red-950/60 p-0.5 shrink-0"
                    title="Pimo Studios"
                  >
                    <PimoStudiosLogo variant="icon" size={32} animated={false} />
                  </div>

                  {/* Dynamic Logo Text */}
                  <div className="hidden lg:flex flex-col text-left leading-none">
                    <span className="font-sans font-black text-sm tracking-tight text-slate-800 dark:text-white uppercase flex items-center gap-1.5">
                      Pimo Studios
                      <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                        GAME
                      </span>
                    </span>
                    {userAge < 6 ? (
                      <span className="text-[9px] font-bold text-pink-500 uppercase tracking-wider mt-0.5">KIDS MODE 🧸</span>
                    ) : userAge < 9 ? (
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mt-0.5">PIMO SELECT ⭐</span>
                    ) : (
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider mt-0.5">STUDIOS ACTIVE 🚀</span>
                    )}
                  </div>
                </div>

                {/* Sidebar Links */}
                <nav className="flex flex-col gap-1 px-2">
                  {/* Home (Active) */}
                  <button className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-100 dark:bg-[#2C2E33] text-slate-900 dark:text-white font-semibold text-sm transition-colors text-left w-full">
                    <i className="fa-solid fa-house text-base w-5 text-center"></i>
                    <span className="hidden lg:block">Home</span>
                  </button>

                  {/* Discover/Maps */}
                  <button 
                    onClick={() => { setGameState(GameState.MAP_SELECTION); playSound(800); }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#232529] font-medium hover:font-semibold text-sm transition-all text-left w-full group"
                  >
                    <i className="fa-solid fa-compass text-base w-5 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="hidden lg:block">Discover</span>
                  </button>

                  {/* Avatar Wardrobe */}
                  <button 
                    onClick={() => { setShowWardrobe(true); playSound(600); }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#232529] font-medium hover:font-semibold text-sm transition-all text-left w-full group"
                  >
                    <i className="fa-solid fa-user-ninja text-base w-5 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="hidden lg:block">Avatar Customizer</span>
                  </button>

                  {/* Achievements */}
                  <button 
                    onClick={() => { setShowAchievementsModal(true); playSound(800); }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#232529] font-medium hover:font-semibold text-sm transition-all text-left w-full group"
                  >
                    <i className="fa-solid fa-trophy text-base w-5 text-center text-[#34A853] group-hover:scale-110 transition-transform"></i>
                    <span className="hidden lg:block font-bold text-slate-800 dark:text-slate-200">Achievements</span>
                  </button>

                  {/* Gamepad / Controller Controls */}
                  <button 
                    onClick={() => { handleConnectController(); }}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left w-full group border ${
                      activeBattery && activeBattery.level < 0.10 && !activeBattery.charging
                        ? 'bg-red-600/90 text-white border-red-500 animate-battery-shake shadow-lg'
                        : activeBattery?.charging
                        ? 'text-amber-500 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-500/30 animate-electric-glow'
                        : 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-indigo-500/20'
                    }`}
                  >
                    <i className="fa-solid fa-gamepad text-base w-5 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="hidden lg:block">Gamepad Controls</span>
                    {activeController && (
                      <span className={`hidden lg:inline-flex items-center gap-1 ml-auto text-[9px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                        activeBattery && activeBattery.level < 0.10 && !activeBattery.charging
                          ? 'bg-red-950 text-red-200 border-red-300 animate-bounce'
                          : activeBattery?.charging
                          ? 'bg-amber-500/30 text-amber-300 border-amber-400 animate-electric-glow'
                          : 'bg-green-500/20 text-green-500 border-green-500/30'
                      }`}>
                        {activeBattery?.charging ? (
                          <i className="fa-solid fa-bolt-lightning text-amber-300 text-[8px] animate-bounce"></i>
                        ) : activeBattery && activeBattery.level < 0.10 ? (
                          <i className="fa-solid fa-battery-empty text-red-300 text-[8px] animate-ping"></i>
                        ) : (
                          <i className="fa-solid fa-battery-three-quarters text-[8px]"></i>
                        )}
                        {activeBattery ? `${Math.round(activeBattery.level * 100)}%` : 'ON'}
                      </span>
                    )}
                  </button>

                  {/* Install Desktop / Mobile App */}
                  <button 
                    onClick={() => { setShowInstallModal(true); playSound(800); }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-sm transition-all text-left w-full group border border-emerald-500/20"
                  >
                    <i className="fa-solid fa-download text-base w-5 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="hidden lg:block">Install Game App</span>
                  </button>

                  {/* Marketplace Shop */}
                  <button 
                    onClick={() => { setGameState(GameState.MARKETPLACE); playSound(800); }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#232529] font-medium hover:font-semibold text-sm transition-all text-left w-full group"
                  >
                    <i className="fa-solid fa-shopping-bag text-base w-5 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="hidden lg:block">Marketplace</span>
                  </button>

                  {/* PimoBux Store */}
                  <button 
                    onClick={() => { setShowPimoBuxStore(true); playSound(800); }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#232529] font-medium hover:font-semibold text-sm transition-all text-left w-full group"
                  >
                    <div className="w-5 flex justify-center group-hover:scale-110 transition-transform">
                      <PimobuxIcon className="w-4 h-4" />
                    </div>
                    <span className="hidden lg:block text-yellow-600 dark:text-yellow-400 font-bold">PimoBux Store</span>
                  </button>

                  {/* Credits */}
                  <button 
                    onClick={() => { setGameState(GameState.CREDITS); playSound(800); }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#232529] font-medium hover:font-semibold text-sm transition-all text-left w-full group"
                  >
                    <i className="fa-solid fa-users text-base w-5 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="hidden lg:block">Credits</span>
                  </button>

                  {/* Call Pimo */}
                  <button 
                    onClick={() => { setGameState(GameState.CALL_MORO); playSound(800); }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#232529] font-medium hover:font-semibold text-sm transition-all text-left w-full group"
                  >
                    <i className="fa-solid fa-phone text-base w-5 text-center text-green-500 group-hover:scale-110 transition-transform"></i>
                    <span className="hidden lg:block text-green-600 dark:text-green-400 font-bold">Call Pimo AI</span>
                  </button>
                </nav>
              </div>

              {/* Sidebar Footer (Settings / Report Bug) */}
              <div className="flex flex-col gap-1 px-2 border-t border-slate-100 dark:border-[#2C2E33] pt-4">
                <button 
                  onClick={() => { setShowSettings(true); playSound(600); }}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#232529] text-xs font-medium transition-all text-left w-full"
                >
                  <i className="fa-solid fa-gear text-sm w-5 text-center"></i>
                  <span className="hidden lg:block">Settings</span>
                </button>
                <button 
                  onClick={() => { setShowBugReport(true); playSound(400); }}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-lg text-red-400/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-medium transition-all text-left w-full"
                >
                  <i className="fa-solid fa-bug text-sm w-5 text-center"></i>
                  <span className="hidden lg:block">Report Bug</span>
                </button>
              </div>
            </aside>

            {/* Right Main Client Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top Client Header Bar */}
              <header className="h-16 bg-white dark:bg-[#1C1E22] border-b border-[#E3E5E6] dark:border-[#2C2E33] flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20">
                {/* Search Bar */}
                <div className="flex items-center gap-3 flex-1 max-w-xl">
                  {/* Hamburger toggle on mobile */}
                  <button 
                    onClick={() => { setIsHamburgerOpen(!isHamburgerOpen); playSound(400); }}
                    className="md:hidden w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#2C2E33] text-slate-800 dark:text-white flex items-center justify-center border border-slate-200 dark:border-[#3C3F45]"
                  >
                    <i className="fa-solid fa-bars"></i>
                  </button>
                  
                  {/* Interactive search bar */}
                  <div className="relative flex-1">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm"></i>
                    <input 
                      type="text" 
                      placeholder="Search Games, Shops & Services..." 
                      value={menuSearch}
                      onChange={(e) => {
                        setMenuSearch(e.target.value);
                        playSound(400);
                      }}
                      className="w-full pl-10 pr-16 py-2 bg-[#F2F4F5] focus:bg-white dark:bg-[#111214] dark:focus:bg-[#2C2E33] border border-slate-200 dark:border-[#2C2E33] rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all font-sans"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-[10000]">
                      {menuSearch && (
                        <button 
                          onClick={() => { setMenuSearch(''); playSound(500); }}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          toggleVoiceSearch();
                          playSound(400);
                        }}
                        className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                          isVoiceSearching 
                            ? 'bg-red-500/20 text-red-500 animate-pulse' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#2C2E33]'
                        }`}
                        title="Voice Search"
                      >
                        <i className={`fa-solid ${isVoiceSearching ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
                      </button>
                    </div>
                    {menuSearch && (
                      <>
                        {/* Search Results Dropdown Overlay */}
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1C1E22] border border-slate-200 dark:border-[#2C2E33] rounded-2xl shadow-2xl overflow-hidden z-[9999] max-h-[380px] overflow-y-auto flex flex-col divide-y divide-slate-100 dark:divide-[#2C2E33] transition-all animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                          {(() => {
                            const lowercaseSearch = menuSearch.toLowerCase().trim();
                            
                            // Custom Search items with access to component setters
                            const searchItems = [
                              // --- Games & Maps ---
                              {
                                name: 'Desert Map',
                                category: 'game',
                                desc: 'Hot sands and prickly obstacles! Try to survive the heat.',
                                icon: 'fa-solid fa-sun text-amber-500',
                                keywords: ['desert', 'map', 'game', 'play', 'sand', 'heat', 'level', 'obstacle'],
                                badge: 'Map',
                                badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30',
                                action: () => {
                                  setSelectedMap(MapType.DESERT);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Jungle Map',
                                category: 'game',
                                desc: 'Swing through the dense jungle trees and slippery mud!',
                                icon: 'fa-solid fa-tree text-emerald-500',
                                keywords: ['jungle', 'map', 'game', 'play', 'tree', 'mud', 'forest', 'green'],
                                badge: 'Map',
                                badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30',
                                action: () => {
                                  setSelectedMap(MapType.JUNGLE);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Ice Cave Map',
                                category: 'game',
                                desc: 'Slippery ice patches and giant falling icicles!',
                                icon: 'fa-solid fa-snowflake text-sky-400',
                                keywords: ['ice', 'cave', 'map', 'game', 'play', 'snow', 'freeze', 'slide'],
                                badge: 'Map',
                                badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-900/30',
                                action: () => {
                                  setSelectedMap(MapType.ICE_CAVE);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Volcano Map',
                                category: 'game',
                                desc: 'Lava pits, fireballs, and extreme red-hot challenges!',
                                icon: 'fa-solid fa-fire text-red-500',
                                keywords: ['volcano', 'lava', 'map', 'game', 'play', 'fire', 'hot', 'magma'],
                                badge: 'Map',
                                badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200/50 dark:border-red-900/30',
                                action: () => {
                                  setSelectedMap(MapType.VOLCANO);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Crystal Caves',
                                category: 'game',
                                desc: 'Blue crystal treasures and slippery ice surfaces!',
                                icon: 'fa-solid fa-gem text-indigo-500',
                                keywords: ['crystal', 'caves', 'gem', 'blue', 'map', 'game', 'play', 'cave'],
                                badge: 'Map',
                                badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30',
                                action: () => {
                                  setSelectedMap(MapType.CRYSTAL_CAVES);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Speed Training',
                                category: 'game',
                                desc: 'Test your reflexes and move as fast as light!',
                                icon: 'fa-solid fa-bolt text-yellow-500',
                                keywords: ['speed', 'training', 'fast', 'reflex', 'map', 'game', 'play', 'run'],
                                badge: 'Map',
                                badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-900/30',
                                action: () => {
                                  setSelectedMap(MapType.SPEED_TRAINING);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Pimo Kart',
                                category: 'game',
                                desc: 'Jump into a speedy kart and race through obstacles!',
                                icon: 'fa-solid fa-car text-blue-500',
                                keywords: ['kart', 'pimo kart', 'car', 'race', 'driving', 'vehicle', 'map', 'game', 'play'],
                                badge: 'Map',
                                badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/30',
                                action: () => {
                                  setSelectedMap(MapType.MORO_KART);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Kicking Training',
                                category: 'game',
                                desc: 'Learn and master the martial art of block-kicking!',
                                icon: 'fa-solid fa-shoe-prints text-red-500',
                                keywords: ['kicking', 'kick', 'training', 'fight', 'action', 'map', 'game', 'play'],
                                badge: 'Map',
                                badgeColor: 'bg-purple-100 text-red-800 dark:bg-purple-950/40 dark:text-red-300 border border-purple-200/50 dark:border-purple-900/30',
                                action: () => {
                                  setSelectedMap(MapType.KICKING_TRAINING);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Duo Adventure Map',
                                category: 'game',
                                desc: 'Join a buddy and finish co-op platforms together!',
                                icon: 'fa-solid fa-people-arrows text-pink-500',
                                keywords: ['duo', 'coop', 'friend', 'adventure', 'map', 'game', 'play', 'two', 'team'],
                                badge: 'Map',
                                badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200/50 dark:border-pink-900/30',
                                action: () => {
                                  setSelectedMap(MapType.DUO);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'PimoBux Goldrush Map',
                                category: 'game',
                                desc: 'Collect piles of gold coins and massive PimoBux!',
                                icon: 'fa-solid fa-circle-dollar-to-slot text-yellow-600',
                                keywords: ['morobux map', 'coin', 'gold', 'earn', 'rich', 'cash', 'money', 'map', 'game', 'play'],
                                badge: 'Map',
                                badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-900/30',
                                action: () => {
                                  setSelectedMap(MapType.PIMOBUX);
                                  startLoading(GameState.PLAYING);
                                }
                              },
                              {
                                name: 'Mikets Map',
                                category: 'game',
                                desc: 'The magical land where Glimmer stars and gems scatter!',
                                icon: 'fa-solid fa-wand-magic-sparkles text-indigo-400',
                                keywords: ['mikets', 'star', 'glimmer', 'gem', 'magic', 'map', 'game', 'play'],
                                badge: 'Map',
                                badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30',
                                action: () => {
                                  setSelectedMap(MapType.MIKETS);
                                  startLoading(GameState.PLAYING);
                                }
                              },

                              {
                                name: 'Map Creator / Terrain Editor',
                                category: 'game',
                                desc: 'Design, edit and play custom procedural maps.',
                                icon: 'fa-solid fa-cubes text-red-600',
                                keywords: ['creator', 'editor', 'build', 'terrain', 'sandbox', 'diy', 'map creator', 'map editor'],
                                badge: 'Tool',
                                badgeColor: 'bg-purple-100 text-red-800 dark:bg-purple-950/40 dark:text-red-300 border border-purple-200/50 dark:border-purple-900/30',
                                action: () => {
                                  if (isMapEditorUnlocked) {
                                    setGameState(GameState.MAP_EDITOR);
                                  } else {
                                    setShowUnlockModal(true);
                                  }
                                }
                              },
                              // --- Shops & Outfits ---
                              {
                                name: 'Magical Item Marketplace',
                                category: 'shop',
                                desc: 'Official store for outfits, custom particles, and skin badges.',
                                icon: 'fa-solid fa-shop text-cyan-500',
                                keywords: ['marketplace', 'shop', 'store', 'buy', 'outfit', 'skin', 'badge', 'items', 'costume'],
                                badge: 'Shop',
                                badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-900/30',
                                action: () => setGameState(GameState.MARKETPLACE)
                              },
                              {
                                name: 'Pimo Outfit Customizer',
                                category: 'shop',
                                desc: 'Your creative wardrobe! Customize your body style, hair, and accessories.',
                                icon: 'fa-solid fa-shirt text-pink-500',
                                keywords: ['outfit', 'wardrobe', 'customizer', 'character', 'avatar', 'body', 'hair', 'face', 'closet'],
                                badge: 'Wardrobe',
                                badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200/50 dark:border-pink-900/30',
                                action: () => setShowWardrobe(true)
                              },
                              {
                                name: 'PimoBux Store',
                                category: 'shop',
                                desc: 'Purchase PimoBux packages, VIP privileges, and coins.',
                                icon: 'fa-solid fa-coins text-amber-500',
                                keywords: ['pimobux store', 'pimo bux', 'buy', 'coins', 'topup', 'packages', 'premium', 'vip', 'money'],
                                badge: 'Store',
                                badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30',
                                action: () => setShowPimoBuxStore(true)
                              },
                              {
                                name: 'R6 Blocky Body style',
                                category: 'shop',
                                desc: 'Classic blocky shape. Customize body under Outfit Customizer.',
                                icon: 'fa-solid fa-cube text-slate-500',
                                keywords: ['r6', 'blocky', 'body', 'roblox', 'wipeout body', 'retro', 'outfit'],
                                badge: 'Style',
                                badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-950/40 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/30',
                                action: () => {
                                  setShowWardrobe(true);
                                }
                              },
                              {
                                name: 'Pink Princess Hair',
                                category: 'shop',
                                desc: 'Gorgeous flowing pink hairstyle. Equip in Wardrobe.',
                                icon: 'fa-solid fa-scissors text-rose-400',
                                keywords: ['pink princess', 'hair', 'hairstyle', 'outfit', 'wig', 'pink'],
                                badge: 'Style',
                                badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/30',
                                action: () => {
                                  setShowWardrobe(true);
                                }
                              },
                              {
                                name: 'Cool Shades Face',
                                category: 'shop',
                                desc: 'Stylish pitch-black sunglasses. Equip in Wardrobe.',
                                icon: 'fa-solid fa-glasses text-slate-600',
                                keywords: ['cool shades', 'sunglasses', 'glasses', 'face', 'accessory', 'outfit'],
                                badge: 'Style',
                                badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-950/40 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/30',
                                action: () => {
                                  setShowWardrobe(true);
                                }
                              },
                              // --- Services & Utilities ---
                              {
                                name: 'Call Pimo (AI Robot Companion)',
                                category: 'service',
                                desc: 'Make a server-side call to Pimo Bot to predict your future or give tips!',
                                icon: 'fa-solid fa-brain text-emerald-500',
                                keywords: ['call moro', 'ai', 'robot', 'assistant', 'chatbot', 'gemini', 'predict', 'companion'],
                                badge: 'AI Service',
                                badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30',
                                action: () => setGameState(GameState.CALL_MORO)
                              },
                              {
                                name: 'Daily Rewards Wheel',
                                category: 'service',
                                desc: 'Spin for amazing free daily bonuses, PimoBux, and stars!',
                                icon: 'fa-solid fa-gift text-[#FF6B6B]',
                                keywords: ['daily rewards', 'spin', 'wheel', 'prize', 'bonus', 'rewards', 'free', 'gift'],
                                badge: 'Service',
                                badgeColor: 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20',
                                action: () => setShowDailyRewardModal(true)
                              },
                              {
                                name: 'Glimmer Guide AI',
                                category: 'service',
                                desc: 'Get smart context on any game query instantly.',
                                icon: 'fa-solid fa-info-circle text-blue-500',
                                keywords: ['glimmer guide', 'ai', 'assistant', 'help', 'tips', 'guide'],
                                badge: 'AI Guide',
                                badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/30',
                                action: () => setShowAIAssistant(true)
                              },
                              {
                                name: 'Settings & Volume',
                                category: 'service',
                                desc: 'Switch languages, toggle game music, or activate liquid glass graphics.',
                                icon: 'fa-solid fa-sliders text-indigo-500',
                                keywords: ['settings', 'volume', 'music', 'language', 'graphic', 'liquid glass', 'configure'],
                                badge: 'Settings',
                                badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30',
                                action: () => setShowSettings(true)
                              },
                              {
                                name: 'Report a Bug / Comment',
                                category: 'service',
                                desc: 'Send your comments and gameplay bug reports to our dev team.',
                                icon: 'fa-solid fa-bug text-rose-500',
                                keywords: ['bug', 'report', 'comment', 'submit', 'feedback', 'issue', 'glitch'],
                                badge: 'Feedback',
                                badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/30',
                                action: () => setShowBugReport(true)
                              },
                              {
                                name: 'Friends list & Invites',
                                category: 'service',
                                desc: 'Add user IDs, accept friend requests, and play together!',
                                icon: 'fa-solid fa-user-group text-blue-500',
                                keywords: ['friends', 'invite', 'social', 'requests', 'add friend', 'notifications', 'chat'],
                                badge: 'Social',
                                badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/30',
                                action: () => setShowNotifications(true)
                              },
                              {
                                name: 'How to Play (Control Guide)',
                                category: 'service',
                                desc: 'Walkthrough of basic jumps, double jumps, kicks, and dashes.',
                                icon: 'fa-solid fa-gamepad text-emerald-500',
                                keywords: ['how to play', 'controls', 'guide', 'tutorial', 'instructions', 'walkthrough'],
                                badge: 'Tutorial',
                                badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30',
                                action: () => setShowHowToPlay(true)
                              }
                            ];

                            const matchedItems = searchItems.filter(item => 
                              item.name.toLowerCase().includes(lowercaseSearch) || 
                              item.desc.toLowerCase().includes(lowercaseSearch) ||
                              item.keywords.some(k => k.toLowerCase().includes(lowercaseSearch))
                            );

                            if (matchedItems.length === 0) {
                              return (
                                <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                                  <i className="fa-solid fa-magnifying-glass-minus text-3xl mb-2 text-slate-400 dark:text-slate-600 animate-bounce"></i>
                                  <p className="text-xs font-bold">No matches found for "{menuSearch}"</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-center w-full">Try searching for 'desert', 'shop', 'avatar', 'ai', or 'friends'</p>
                                </div>
                              );
                            }

                            return matchedItems.map((item, idx) => (
                              <div 
                                key={idx} 
                                className="p-3 hover:bg-slate-50 dark:hover:bg-[#25282D] cursor-pointer flex items-center justify-between transition-colors group" 
                                onClick={() => { 
                                  item.action(); 
                                  setMenuSearch(''); 
                                  playSound(800);
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#2C2E33] flex items-center justify-center text-sm shrink-0">
                                    <i className={item.icon}></i>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-fredoka text-xs text-slate-800 dark:text-white font-bold">{item.name}</span>
                                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${item.badgeColor}`}>
                                        {item.badge}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 max-w-[280px] sm:max-w-md">{item.desc}</p>
                                  </div>
                                </div>
                                <div className="text-slate-400 group-hover:text-blue-500 transition-colors mr-1 shrink-0">
                                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side Utility Buttons */}
                <div className="flex items-center gap-2 md:gap-3 ml-4">
                  {/* PimoBux Count pill */}
                  <button 
                    onClick={() => { setShowPimoBuxStore(true); playSound(600); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2E33] dark:hover:bg-[#3C3F45] border border-slate-200 dark:border-[#3C3F45] transition-colors text-xs font-bold"
                  >
                    <PimobuxIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600 dark:text-yellow-400">{totalPimobux}</span>
                  </button>

                  {/* Mikets Count pill */}
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#2C2E33] border border-slate-200 dark:border-[#3C3F45] text-xs font-bold">
                    <MiketsIcon className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-500">{totalMikets}</span>
                  </div>

                  {/* Google Play / Xbox Achievements Trophy Button */}
                  <button 
                    onClick={() => { setShowAchievementsModal(true); playSound(600); }}
                    className="w-9 h-9 rounded-full bg-[#34A853]/15 hover:bg-[#34A853]/30 border border-[#34A853]/40 text-[#34A853] dark:text-emerald-400 flex items-center justify-center transition-all relative group shadow-sm"
                    title="Achievements"
                  >
                    <i className="fa-solid fa-trophy group-hover:scale-110 transition-transform"></i>
                    {Object.keys(unlockedAchievements).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#34A853] text-white text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-black font-mono border border-white dark:border-[#1C1E22]">
                        {Object.keys(unlockedAchievements).length}
                      </span>
                    )}
                  </button>

                  {/* Install PWA Desktop/Mobile App Button */}
                  <button 
                    onClick={() => { setShowInstallModal(true); playSound(600); }}
                    className="w-9 h-9 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all relative group shadow-sm"
                    title="Install Wipeout Pimo App (Windows / macOS / Mobile)"
                  >
                    <i className="fa-solid fa-download group-hover:scale-110 transition-transform text-xs"></i>
                  </button>

                  {/* Notification Bell */}
                  <button 
                    onClick={() => { setShowNotifications(!showNotifications); playSound(600); }}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2E33] dark:hover:bg-[#3C3F45] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all relative"
                  >
                    <i className="fa-solid fa-bell"></i>
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold animate-bounce border border-white dark:border-[#1C1E22]">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Daily rewards spinning wheel */}
                  <button 
                    onClick={() => { setShowDailyRewardModal(true); playSound(600); }}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2E33] dark:hover:bg-[#3C3F45] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all relative"
                    title="Daily Spin Rewards"
                  >
                    <i className="fa-solid fa-gift"></i>
                    {dailyRewardReady && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold animate-bounce border border-white dark:border-[#1C1E22]">
                        !
                      </span>
                    )}
                  </button>

                  {/* Gamepad / Controller Quick Access Header Button */}
                  <button 
                    onClick={() => { handleConnectController(); }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative group shadow-sm border ${
                      activeBattery && activeBattery.level < 0.10 && !activeBattery.charging
                        ? 'bg-red-600 border-red-400 text-white animate-battery-shake shadow-[0_0_15px_rgba(239,68,68,0.9)]'
                        : activeBattery?.charging
                        ? 'bg-amber-500/30 border-amber-400 text-amber-300 animate-electric-glow'
                        : activeController 
                        ? 'bg-green-500/20 border-green-500/40 text-green-500 dark:text-green-400' 
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-500 dark:text-indigo-400'
                    }`}
                    title={
                      activeController 
                        ? `Gamepad: ${activeController.id.split('(')[0].trim()} | Battery: ${activeBattery ? Math.round(activeBattery.level * 100) + '%' : 'Connected'}` 
                        : 'Gamepad Controls & Battery Status'
                    }
                  >
                    <i className="fa-solid fa-gamepad text-sm group-hover:scale-110 transition-transform"></i>
                    {activeController && (
                      <span className={`absolute -top-1.5 -right-1.5 text-[8px] px-1 py-0.2 rounded-full flex items-center justify-center font-mono font-bold border border-white dark:border-[#1C1E22] shadow-sm ${
                        activeBattery && activeBattery.level < 0.10 && !activeBattery.charging
                          ? 'bg-red-700 text-white animate-ping'
                          : activeBattery?.charging
                          ? 'bg-amber-400 text-slate-950 font-black animate-bounce'
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {activeBattery?.charging ? '⚡' : activeBattery ? `${Math.round(activeBattery.level * 100)}%` : '100%'}
                      </span>
                    )}
                  </button>

                  {/* Roblox-Style Log In / Sign Up buttons */}
                  {!currentUser ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 mr-1">
                      <button
                        id="header-login-btn"
                        onClick={() => {
                          setAuthModalInitialMode('login');
                          setShowAuthModal(true);
                          playSound(800);
                        }}
                        className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-slate-900/10 hover:bg-slate-900/20 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-900/10 dark:border-white/15 text-slate-800 dark:text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-right-to-bracket text-[10px]"></i>
                        <span>Log In</span>
                      </button>

                      <button
                        id="header-signup-btn"
                        onClick={() => {
                          setAuthModalInitialMode('signup');
                          setShowAuthModal(true);
                          playSound(800);
                        }}
                        className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-black text-xs transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-user-plus text-[10px]"></i>
                        <span>Sign Up</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Video Game Background Music Controller */}
                  <SoundtrackWidget className="hidden sm:block mr-1" />

                  {/* User Profile Avatar Pill */}
                  <button 
                    onClick={() => { setShowProfileModal(true); playSound(600); }}
                    className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2E33] dark:hover:bg-[#3C3F45] border border-slate-200 dark:border-[#3C3F45] text-xs font-semibold transition-all"
                  >
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 dark:bg-[#111214] border border-white flex items-center justify-center">
                        {profilePic ? (
                          <img src={profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <i className="fa-solid fa-user text-slate-500 text-[10px]"></i>
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white"></span>
                    </div>
                    <span className="hidden sm:inline text-slate-700 dark:text-slate-200 font-bold max-w-[80px] truncate">
                      {playerName || 'Player'}
                    </span>
                  </button>
                </div>
              </header>

              {/* Mobile Drawer Navigation (When Hamburger opens) */}
              <AnimatePresence>
                {isHamburgerOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden bg-white dark:bg-[#1C1E22] border-b border-[#E3E5E6] dark:border-[#2C2E33] px-4 py-4 flex flex-col gap-2 z-50 overflow-hidden shadow-lg animate-in slide-in-from-top duration-300"
                  >
                    <div className="flex items-center justify-between pb-3 mb-1 border-b border-slate-100 dark:border-slate-800">
                      <PimoStudiosLogo variant="card" size={90} animated={false} />
                      <div className="text-right">
                        <span className="text-[10px] font-fredoka font-bold text-red-500 uppercase tracking-widest block">Official</span>
                        <span className="text-xs font-black tracking-tight text-slate-800 dark:text-white">PIMO STUDIOS</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => { 
                        setAuthModalInitialMode('login'); 
                        setShowAuthModal(true); 
                        setIsHamburgerOpen(false); 
                        playSound(800); 
                      }} 
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full bg-purple-500/10 text-red-600 dark:text-red-400 font-bold"
                    >
                      <i className="fa-solid fa-right-to-bracket text-red-500"></i>
                      {currentUser ? 'Switch Account / Log In' : 'Wipeout Pimo Log In / Sign Up'}
                    </button>

                    <button 
                      onClick={() => { setShowProfileModal(true); setIsHamburgerOpen(false); playSound(600); }} 
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 flex items-center justify-center">
                        {profilePic ? (
                          <img src={profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <i className="fa-solid fa-user text-[10px]"></i>
                        )}
                      </div>
                      {getTranslation('PROFILE', language)}
                    </button>
                    <button 
                      onClick={() => { setGameState(GameState.MAP_SELECTION); setIsHamburgerOpen(false); playSound(800); }}
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-compass text-slate-500"></i>
                      Discover Games
                    </button>
                    <button 
                      onClick={() => { setShowWardrobe(true); setIsHamburgerOpen(false); playSound(600); }}
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-user-ninja text-red-500"></i>
                      Avatar Customizer
                    </button>
                    <button 
                      onClick={() => { setGameState(GameState.MARKETPLACE); setIsHamburgerOpen(false); playSound(800); }}
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-shop text-blue-500"></i>
                      Marketplace
                    </button>
                    <button 
                      onClick={() => { setShowPimoBuxStore(true); setIsHamburgerOpen(false); playSound(800); }}
                      className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400 font-bold px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <PimobuxIcon className="w-4 h-4" />
                      PimoBux Store
                    </button>
                    <div className="px-4 py-2 border-t border-b border-slate-100 dark:border-slate-800 my-1">
                      <div className="text-[11px] font-fredoka font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-music text-red-500"></i> Video Game Music
                      </div>
                      <SoundtrackWidget />
                    </div>

                    <button 
                      onClick={() => { setShowSettings(true); setIsHamburgerOpen(false); playSound(600); }} 
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-gear text-slate-500"></i>
                      {getTranslation('SETTINGS', language)}
                    </button>
                    <button 
                      onClick={() => { setLanguage(language === 'en' ? 'es' : 'en'); setIsHamburgerOpen(false); playSound(400); }} 
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-language text-slate-500"></i>
                      {getTranslation('TRANSLATE', language)}
                    </button>
                    <button 
                      onClick={() => { setShowAIAssistant(true); setIsHamburgerOpen(false); playSound(400); }} 
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-brain text-emerald-500"></i>
                      AI Assistant Guide
                    </button>
                    <button 
                      onClick={() => { 
                        setScanResult(null);
                        setAgeVerified(false);
                        setShowAgeVerification(true);
                        setIsHamburgerOpen(false);
                        playSound(800);
                      }} 
                      className="flex items-center gap-3 text-red-600 dark:text-red-400 font-bold px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-face-viewfinder text-red-500"></i>
                      Verify Age
                    </button>
                    <button 
                      onClick={() => { setShowHowToPlay(true); setIsHamburgerOpen(false); playSound(400); }} 
                      className="flex items-center gap-3 text-slate-800 dark:text-white font-fredoka px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-gamepad text-slate-500"></i>
                      {getTranslation('HOW_TO_PLAY', language) || 'HOW TO PLAY'}
                    </button>
                    <button 
                      onClick={() => { setShowBugReport(true); setIsHamburgerOpen(false); playSound(400); }} 
                      className="flex items-center gap-3 text-red-500 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2C2E33] rounded-xl transition-all text-sm w-full"
                    >
                      <i className="fa-solid fa-bug"></i>
                      {getTranslation('REPORT_BUG', language)}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Client Content Body */}
              <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F2F4F5] dark:bg-[#0F1012] scroll-smooth text-slate-800 dark:text-white">
                
                {/* Offline Status Banner */}
                {isOffline && (
                  <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-600 dark:text-amber-400 font-bold shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <i className="fa-solid fa-wifi-slash text-amber-500 text-sm"></i>
                      <span>Offline Mode Active — Game assets & achievements are saved and fully functional offline!</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-500 font-black border border-amber-500/30 shrink-0 self-start sm:self-auto">
                      ⚡ Service Worker Active
                    </span>
                  </div>
                )}

                {/* Home Title and Profile Welcome Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
                      Hey there, <span className="text-blue-500 dark:text-blue-400 capitalize">{
                        (userProfile?.name && !userProfile.name.toLowerCase().includes('moro') ? userProfile.name : null) || 
                        (currentUser?.displayName && !currentUser.displayName.toLowerCase().includes('moro') ? currentUser.displayName : null) || 
                        (playerName && !playerName.toLowerCase().includes('moro') ? playerName : null) ||
                        'Pimo Runner'
                      }</span>! 👋
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Welcome back to Wipeout Pimo Client Dashboard!
                    </p>
                  </div>
                  
                  {/* Subtle profile pill & age indicator */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-200/50 dark:bg-[#1C1E22] rounded-full border border-slate-300/30 text-slate-600 dark:text-slate-300">
                      Age verified: <span className="text-green-500">{userAge > 0 ? `${userAge} yrs (${playerTier})` : '9 yrs (Wipeout)'}</span>
                    </span>
                    {isMoroPlus && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 uppercase tracking-widest">
                        ⭐ Premium Plus
                      </span>
                    )}
                  </div>
                </div>

                {/* Search Mode or Dashboard Mode */}
                {(() => {
                  const ALL_EXPERIENCES = [

                    {
                      id: 'terrain_studio',
                      title: getTranslation('MORO_TERRAIN_STUDIO', language) || 'Pimo Terrain Studio',
                      desc: getTranslation('MORO_TERRAIN_STUDIO_DESC', language) || 'Assemble and build sandbox tracks with custom procedural obstacles!',
                      gradient: 'from-[#7928ca] to-[#ff0080]',
                      bgClass: 'bg-gradient-to-br from-purple-500 to-indigo-700',
                      icon: 'fa-solid fa-cube',
                      tag: 'Map Creator',
                      likes: '91%',
                      active: '3.5K',
                      isTodayPick: true,
                      action: () => {
                        if (isMapEditorUnlocked) {
                          setGameState(GameState.MAP_EDITOR);
                          playSound(800);
                        } else {
                          setShowUnlockModal(true);
                          playSound(600);
                        }
                      }
                    },
                    {
                      id: 'maps_portal',
                      title: getTranslation('MORO_MAPS_PORTAL', language) || 'Pimo Maps Portal',
                      desc: getTranslation('MORO_MAPS_PORTAL_DESC', language) || 'Browse, select and enter creative community races!',
                      gradient: 'from-[#00dfd8] to-[#007cf0]',
                      bgClass: 'bg-gradient-to-br from-teal-400 to-emerald-600',
                      icon: 'fa-solid fa-map-location-dot',
                      tag: 'Discover Maps',
                      likes: '95%',
                      active: '8.9K',
                      isTodayPick: true,
                      action: () => setGameState(GameState.MAP_SELECTION)
                    },
                    {
                      id: 'duo_adventure',
                      title: getTranslation('DUO_ADVENTURE_MAP', language) || 'Duo Adventure Map',
                      desc: getTranslation('DUO_ADVENTURE_MAP_DESC', language) || 'Race with real-time players or friends. Co-op to the goal!',
                      gradient: 'from-[#11998e] to-[#38ef7d]',
                      bgClass: 'bg-gradient-to-br from-pink-500 to-rose-600',
                      icon: 'fa-solid fa-user-group',
                      tag: 'Co-op Race',
                      likes: '92%',
                      active: '5.2K',
                      isTodayPick: true,
                      action: () => {
                        const newRoomId = Math.random().toString(36).substring(2, 9);
                        setCurrentRoomId(newRoomId);
                        setSelectedMap(MapType.DUO);
                        setShowInviteModal(true);
                        playSound(800);
                      }
                    },
                    {
                      id: 'avatar',
                      title: getTranslation('MORO_OUTFIT_CUSTOMIZER', language) || 'Pimo Outfit Customizer',
                      desc: getTranslation('MORO_OUTFIT_CUSTOMIZER_DESC', language) || 'Style your avatar with cool hairstyles, clothing and accessories.',
                      gradient: 'from-pink-400 to-rose-600',
                      icon: 'fa-solid fa-shirt',
                      tag: 'Avatar Editor',
                      likes: '96%',
                      active: '15.1K',
                      action: () => setShowWardrobe(true)
                    },
                    {
                      id: 'shop',
                      title: getTranslation('MAGICAL_ITEM_MARKETPLACE', language) || 'Magical Item Marketplace',
                      desc: getTranslation('MAGICAL_ITEM_MARKETPLACE_DESC', language) || 'Buy exclusive outfits, skin badges and magical items with PimoBux.',
                      gradient: 'from-cyan-400 to-blue-600',
                      icon: 'fa-solid fa-shop',
                      tag: 'Shop',
                      likes: '89%',
                      active: '7.6K',
                      action: () => setGameState(GameState.MARKETPLACE)
                    },
                    {
                      id: 'moro_ai',
                      title: getTranslation('CALL_MORO_AI', language) || 'Call Pimo (AI Communicator)',
                      desc: getTranslation('CALL_MORO_AI_DESC', language) || 'Chat with the friendly AI robot and get daily tips and predictions.',
                      gradient: 'from-emerald-400 to-green-600',
                      icon: 'fa-solid fa-brain',
                      tag: 'Moro AI',
                      likes: '92%',
                      active: '1.2K',
                      action: () => setGameState(GameState.CALL_MORO)
                    },
                    {
                      id: 'daily',
                      title: getTranslation('DAILY_REWARDS_WHEEL', language) || 'Daily Rewards Wheel',
                      desc: getTranslation('DAILY_REWARDS_WHEEL_DESC', language) || 'Spin the fortune wheel every day and win heaps of free PimoBux!',
                      gradient: 'from-[#FF6B6B] to-[#FF8E53]',
                      icon: 'fa-solid fa-gift',
                      tag: 'Rewards',
                      likes: '88%',
                      active: '22.1K',
                      action: () => setShowDailyRewardModal(true)
                    },
                    {
                      id: 'credits',
                      title: getTranslation('CREDITS_HALL_OF_FAME', language) || 'Credits & Hall of Fame',
                      desc: getTranslation('CREDITS_HALL_OF_FAME_DESC', language) || 'Meet the brilliant authors, creators and developers of Pimo Studio.',
                      gradient: 'from-purple-400 to-indigo-600',
                      icon: 'fa-solid fa-users',
                      tag: 'About',
                      likes: '99%',
                      active: '120',
                      action: () => setGameState(GameState.CREDITS)
                    },
                    {
                      id: 'store',
                      title: getTranslation('OFFICIAL_PIMOBUX_STORE', language) || 'Official PimoBux Store',
                      desc: getTranslation('OFFICIAL_PIMOBUX_STORE_DESC', language) || 'Top up your account with PimoBux packages and Premium privileges.',
                      gradient: 'from-amber-400 to-yellow-600',
                      icon: 'fa-solid fa-coins',
                      tag: 'Buy PimoBux',
                      likes: '95%',
                      active: '44.5K',
                      action: () => setShowPimoBuxStore(true)
                    }
                  ];

                  if (menuSearch.trim().length > 0) {
                    const filtered = ALL_EXPERIENCES.filter(e => 
                      e.title.toLowerCase().includes(menuSearch.toLowerCase()) || 
                      e.tag.toLowerCase().includes(menuSearch.toLowerCase()) || 
                      e.desc.toLowerCase().includes(menuSearch.toLowerCase())
                    );

                    return (
                      <div className="animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                            Search Results for <span className="text-blue-500">"{menuSearch}"</span>
                          </h2>
                          <button 
                            onClick={() => { setMenuSearch(''); playSound(500); }}
                            className="text-xs bg-slate-200 dark:bg-[#1C1E22] hover:bg-slate-300 dark:hover:bg-[#2C2E33] text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full font-bold transition-all"
                          >
                            Clear Search
                          </button>
                        </div>

                        {filtered.length === 0 ? (
                          <div className="bg-white dark:bg-[#151619] border border-slate-200 dark:border-[#232529] rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
                            <i className="fa-solid fa-magnifying-glass-minus text-4xl mb-3 text-slate-400 shrink-0"></i>
                            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No Experiences Found</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try refining your search terms or view our recommended experiences on the Home page.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filtered.map(game => (
                              <div 
                                key={game.id}
                                onClick={() => { game.action(); playSound(800); }}
                                className="bg-white dark:bg-[#151619] border border-slate-200/60 dark:border-[#232529] rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between text-left"
                              >
                                <div className={`relative h-28 bg-gradient-to-br ${game.gradient || 'from-blue-500 to-indigo-600'} flex items-center justify-center p-3 overflow-hidden shrink-0`}>
                                  <div className="absolute top-2 left-2 bg-black/40 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md backdrop-blur-sm">
                                    {game.tag}
                                  </div>
                                  <i className={`${game.icon} text-white/10 text-6xl absolute -right-4 -bottom-4 transform rotate-12 transition-transform group-hover:scale-115`}></i>
                                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20 flex items-center justify-center shadow-md relative z-10 text-white group-hover:scale-110 transition-transform">
                                    {game.id === 'store' ? <PimobuxIcon className="w-5 h-5 text-yellow-300 animate-pulse" /> : <i className={`${game.icon} text-base`}></i>}
                                  </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-1 leading-tight group-hover:text-blue-500 transition-colors mb-1">
                                      {game.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-snug">
                                      {game.desc}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2.5 mt-3 text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-t border-slate-100 dark:border-white/5 pt-2">
                                    <span className="text-green-500 flex items-center gap-1">
                                      <i className="fa-solid fa-thumbs-up"></i> {game.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <i className="fa-solid fa-user"></i> {game.active} active
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Default Home Dashboard Layout
                  // Deterministic companion app activity generator for simulated friends
                  const getFriendActivity = (friendName: string) => {
                    const activities = ["Adopt Me!", "Grow a Garden", "Driving Empire", "Brookhaven", "RIVALS", "Dandy\'s World", "Pimo Kart", "Online"];
                    const charSum = friendName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                    return activities[charSum % activities.length];
                  };

                  return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      
                      {/* Connections (Friends Carousel Section) */}
                      <div className="bg-white dark:bg-[#151619] border border-slate-200/60 dark:border-[#1E2024] rounded-2xl p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors group">
                            Connections ({friends.length})
                            <i className="fa-solid fa-chevron-right text-xs text-slate-400 group-hover:translate-x-1 transition-transform"></i>
                          </h2>
                          <button 
                            onClick={() => { setShowAddFriendModal(true); playSound(600); }}
                            className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold flex items-center gap-1"
                          >
                            <i className="fa-solid fa-user-plus text-[10px]"></i> Add Connections
                          </button>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                          {/* Circle Button: Connect */}
                          <button 
                            onClick={() => { setShowAddFriendModal(true); playSound(600); }}
                            className="flex flex-col items-center gap-1.5 snap-start shrink-0 group focus:outline-none"
                          >
                            <div className="w-14 h-14 rounded-full border border-dashed border-slate-300 dark:border-[#2C2E33] hover:border-blue-500 dark:hover:border-blue-400 flex items-center justify-center text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-slate-50 dark:bg-[#0E0F11]">
                              <i className="fa-solid fa-plus text-lg"></i>
                            </div>
                            <span className="text-[10px] text-slate-800 dark:text-white font-bold group-hover:text-blue-500 transition-colors">Connect</span>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 -mt-1 font-semibold">Add friends</span>
                          </button>

                          {/* Friends Items */}
                          {friends.map((friend) => {
                            const activity = getFriendActivity(friend.name);
                            return (
                              <div 
                                key={friend.id}
                                onClick={() => { setSelectedFriendForProfile(friend); playSound(600); }}
                                className="flex flex-col items-center gap-1.5 snap-start shrink-0 group cursor-pointer relative"
                              >
                                <div className="relative">
                                  <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-[#0E0F11] border border-slate-200 dark:border-[#232529] overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm relative">
                                    <Moro3D character={friend.character || selectedCharacter} width={90} height={90} isJumping={false} jumpProgress={0} playerName={""} />
                                  </div>
                                  
                                  {/* Chat Quick Overlay on hover */}
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveChatFriend(friend);
                                      playSound(800);
                                    }}
                                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title={`Chat with ${friend.name}`}
                                  >
                                    <i className="fa-solid fa-comment-dots text-sm"></i>
                                  </div>
                                  
                                  {/* Status indicator (green dot for online, gray for offline) */}
                                  <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#151619] ${friend.isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
                                </div>
                                
                                <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold truncate w-16 text-center group-hover:text-blue-500 transition-colors">
                                  {friend.name}
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 text-center truncate w-16 -mt-1 font-semibold leading-tight">
                                  {friend.isOnline ? activity : 'Offline'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Today's Picks (4 Wide landscape cards) */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-1">
                            Today's Picks
                          </h2>
                          <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer" title="Recommended curated items">
                            <i className="fa-solid fa-circle-info text-sm"></i>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {ALL_EXPERIENCES.filter(e => e.isTodayPick).map((game) => (
                            <div 
                              key={game.id}
                              onClick={() => { setSelectedExperienceDetail(game); setExperienceTab('about'); playSound(800); }}
                              className="bg-white dark:bg-[#151619] border border-slate-200/60 dark:border-[#1E2024] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between text-left"
                            >
                              {/* Landscape Banner */}
                              <div className={`relative h-32 ${game.bgClass} flex items-center justify-center p-4 overflow-hidden shrink-0`}>
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-3 left-3 bg-black/40 text-white text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md backdrop-blur-sm z-10">
                                  {game.tag}
                                </div>
                                <i className={`${game.icon} text-white/10 text-8xl absolute -right-6 -bottom-6 transform rotate-12 transition-transform group-hover:scale-115`}></i>
                                
                                {/* Overlay Play Button */}
                                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg">
                                    <i className="fa-solid fa-play text-lg ml-1"></i>
                                  </div>
                                </div>

                                <div className="text-center text-white relative z-10 select-none">
                                  <span className="font-fredoka font-black text-2xl tracking-tight uppercase drop-shadow-md">{game.title.split(':')[1] || game.title}</span>
                                </div>
                              </div>

                              {/* Information Content */}
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm leading-snug group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mb-1">
                                    {game.title}
                                  </h3>
                                  <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed line-clamp-2">
                                    {game.desc}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 mt-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-t border-slate-100 dark:border-white/5 pt-3">
                                  <span className="text-green-500 flex items-center gap-1">
                                    <i className="fa-solid fa-thumbs-up"></i> {game.likes}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <i className="fa-solid fa-user"></i> {game.active} active
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Profile Pedestal Card / Info Row */}
                      <div className="bg-white dark:bg-[#151619] border border-slate-200/60 dark:border-[#1E2024] rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800 dark:bg-white"></div>
                        
                        {/* Avatar Column */}
                        <div className="relative w-28 h-28 bg-slate-50 dark:bg-[#0E0F11] border border-slate-200 dark:border-[#2C2E33] rounded-full overflow-hidden flex items-center justify-center shadow-inner group flex-shrink-0">
                          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                          <Moro3D character={selectedCharacter} width={180} height={180} isJumping={isIdleJumping} jumpProgress={idleJumpProgress} playerName={""} />
                          <button 
                            onClick={() => { setShowWardrobe(true); playSound(600); }}
                            className="absolute bottom-1 bg-slate-900/85 hover:bg-slate-900 text-white text-[9px] px-2.5 py-0.5 rounded-full backdrop-blur-sm transition-all shadow-md z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
                          >
                            <i className="fa-solid fa-shirt text-[8px]"></i> Customize
                          </button>
                          <span className="absolute top-1.5 right-1.5 bg-green-500 text-white text-[7px] px-2 py-0.5 rounded-full font-black shadow-sm z-20 flex items-center gap-0.5 animate-pulse">
                            READY
                          </span>
                        </div>

                        {/* Greeting & Quick Stats */}
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-1.5 font-sans tracking-tight">
                              {playerName ? `Hello, ${playerName}!` : 'Hello, Pimo Racer!'}
                              <button 
                                onClick={() => {
                                  const newName = prompt("Enter your player name:", playerName);
                                  if (newName !== null) {
                                    setPlayerName(newName.trim());
                                    playSound(800);
                                  }
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors"
                                title="Edit Name"
                              >
                                <i className="fa-solid fa-pen text-xs"></i>
                              </button>
                            </h2>
                          </div>
                          <p className="text-slate-400 dark:text-slate-400 text-xs mb-4 italic">
                            "Surviving the colorful hills and racing the wind! 🏎️🏁 Collect PimoBux to unlock awesome karts!"
                          </p>

                          {/* Stats Badge Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="bg-[#F8F9FA] dark:bg-[#0E0F11] border border-slate-100 dark:border-[#1C1D21] p-2 rounded-xl flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-xs shrink-0">
                                <i className="fa-solid fa-trophy text-[10px]"></i>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider truncate">High Score</div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{highScore}m</div>
                              </div>
                            </div>

                            <button 
                              onClick={() => { setShowPimoBuxStore(true); playSound(600); }}
                              className="bg-[#F8F9FA] dark:bg-[#0E0F11] border border-slate-100 dark:border-[#1C1D21] p-2 rounded-xl flex items-center gap-2 text-left hover:border-yellow-500/40 transition-colors"
                            >
                              <div className="w-6 h-6 rounded-lg bg-yellow-500/10 flex items-center justify-center text-xs shrink-0">
                                <PimobuxIcon className="w-3.5 h-3.5 text-yellow-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider truncate">PimoBux</div>
                                <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{totalPimobux}</div>
                              </div>
                            </button>

                            <div className="bg-[#F8F9FA] dark:bg-[#0E0F11] border border-slate-100 dark:border-[#1C1D21] p-2 rounded-xl flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs shrink-0">
                                <MiketsIcon className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider truncate">Mikets</div>
                                <div className="text-xs font-bold text-amber-600 dark:text-amber-500">{totalMikets}</div>
                              </div>
                            </div>

                            <button 
                              onClick={handleConnectController}
                              className="bg-[#F8F9FA] dark:bg-[#0E0F11] border border-slate-100 dark:border-[#1C1D21] p-2 rounded-xl flex items-center gap-2 text-left hover:border-green-500/40 transition-colors"
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${connectedController ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                <i className="fa-solid fa-gamepad text-[10px]"></i>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider truncate">Controller</div>
                                <div className="text-xs font-bold truncate text-slate-700 dark:text-slate-200">
                                  {connectedController ? 'Active' : 'No Device'}
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Recommended for you (Grid of portrait cards) */}
                      <div>
                        <h2 className="text-base font-extrabold text-slate-800 dark:text-white mb-4">
                          Recommended for you
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {ALL_EXPERIENCES.filter(e => !e.isTodayPick).map((game, index) => (
                            <motion.div 
                              key={game.id}
                              initial={{ opacity: 0, y: 24, scale: 0.94 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: index * 0.05, 
                                ease: [0.215, 0.61, 0.355, 1] 
                              }}
                              whileHover={{ 
                                y: -6, 
                                scale: 1.03, 
                                transition: { type: "spring", stiffness: 400, damping: 25 } 
                              }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => { setSelectedExperienceDetail(game); setExperienceTab('about'); playSound(800); }}
                              className="bg-white dark:bg-[#151619] border border-slate-200/60 dark:border-[#1E2024] rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-colors duration-300 cursor-pointer group flex flex-col justify-between text-left"
                            >
                              {/* Square Aspect ratio thumbnail */}
                              <div className={`relative h-24 bg-gradient-to-br ${game.gradient || 'from-slate-500 to-slate-700'} flex items-center justify-center p-3 overflow-hidden shrink-0`}>
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-2 left-2 bg-black/40 text-white text-[7px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded backdrop-blur-sm">
                                  {game.tag}
                                </div>
                                <i className={`${game.icon} text-white/20 text-5xl absolute -right-3 -bottom-3 transform rotate-12 transition-transform group-hover:scale-115`}></i>
                                <div className="w-9 h-9 rounded-full bg-white/25 border border-white/20 flex items-center justify-center shadow-md relative z-10 text-white group-hover:scale-110 transition-transform">
                                  {game.id === 'store' ? <PimobuxIcon className="w-5 h-5 text-yellow-300 animate-pulse" /> : <i className={`${game.icon} text-sm`}></i>}
                                </div>
                              </div>

                              {/* Information */}
                              <div className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                  <h3 className="font-bold text-slate-800 dark:text-white text-xs line-clamp-1 leading-tight group-hover:text-blue-500 transition-colors mb-1">
                                    {game.title}
                                  </h3>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-2 leading-snug">
                                    {game.desc}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 mt-2 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-t border-slate-100 dark:border-white/5 pt-2">
                                  <span className="text-green-500 flex items-center gap-0.5">
                                    <i className="fa-solid fa-thumbs-up text-[7px]"></i> {game.likes}
                                  </span>
                                  <span className="flex items-center gap-0.5">
                                    <i className="fa-solid fa-user text-[7px]"></i> {game.active}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </main>
            </div>
          </div>
        )}

        {gameState === GameState.KART_SETUP && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
              
              <AnimatePresence mode="wait">
                {kartSetupStep === 0 && (
                  <motion.div 
                    key="welcome"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="text-center"
                  >
                    <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fa-solid fa-flag-checkered text-4xl text-blue-400"></i>
                    </div>
                    <h2 className="text-4xl font-fredoka text-slate-900 dark:text-white mb-4">
                      {getTranslation('WELCOME_MORO_KART', language)}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
                      {getTranslation('CHOOSE_VEHICLE', language)}
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setGameState(GameState.MAP_SELECTION); playSound(1000); }}
                        className="flex-1 bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka py-5 rounded-2xl text-xl hover:bg-slate-900/20 dark:bg-white/20 transition-all"
                      >
                        {getTranslation('RETURN', language)}
                      </button>
                      <button 
                        onClick={() => { setKartSetupStep(1); playSound(800); }}
                        className="flex-1 bg-blue-600 text-slate-900 dark:text-white font-fredoka py-5 rounded-2xl text-xl shadow-[0_6px_0_#1e40af] hover:translate-y-1 active:translate-y-3 active:shadow-none transition-all"
                      >
                        {getTranslation('NEXT', language)}
                      </button>
                    </div>
                  </motion.div>
                )}

                {kartSetupStep === 1 && (
                  <motion.div 
                    key="vehicle"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="w-full"
                  >
                    <h2 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-8 text-center flex items-center justify-center gap-3">
                      <i className="fa-solid fa-car"></i>
                      {getTranslation('CHOOSE_VEHICLE', language)}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {Object.values(VehicleType).map(v => (
                        <button 
                          key={v}
                          onClick={() => { setKartVehicle(v); playSound(600); }}
                          className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${kartVehicle === v ? 'bg-blue-600/20 border-blue-500 shadow-lg scale-105' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:bg-white/10'}`}
                        >
                          <i className={`fa-solid ${v === VehicleType.MOTO ? 'fa-motorcycle' : v === VehicleType.TRUCK ? 'fa-truck' : v === VehicleType.VAN ? 'fa-van-shuttle' : 'fa-car'} text-4xl ${kartVehicle === v ? 'text-blue-400' : 'text-slate-400'}`}></i>
                          <span className="font-fredoka text-lg text-slate-900 dark:text-white">{getTranslation(v, language)}</span>
                          <span className="text-xs font-bold text-green-500 uppercase tracking-widest">FREE</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setKartSetupStep(0); playSound(1000); }}
                        className="flex-1 bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka py-4 rounded-2xl text-lg"
                      >
                        {getTranslation('BACK', language)}
                      </button>
                      <button 
                        onClick={() => { setKartSetupStep(2); playSound(800); }}
                        className="flex-1 bg-blue-600 text-slate-900 dark:text-white font-fredoka py-4 rounded-2xl text-lg shadow-[0_6px_0_#1e40af] hover:translate-y-1 active:translate-y-3 active:shadow-none transition-all"
                      >
                        {getTranslation('NEXT', language)}
                      </button>
                    </div>
                  </motion.div>
                )}

                {kartSetupStep === 2 && (
                  <motion.div 
                    key="helmet"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="w-full"
                  >
                    <h2 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-8 text-center flex items-center justify-center gap-3">
                      <i className="fa-solid fa-helmet-safety"></i>
                      {getTranslation('CHOOSE_HELMET', language)}
                    </h2>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {['HELMET_1', 'HELMET_2', 'HELMET_3'].map(h => (
                        <button 
                          key={h}
                          onClick={() => { setKartHelmet(h); playSound(600); }}
                          className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${kartHelmet === h ? 'bg-purple-600/20 border-purple-500 shadow-lg scale-105' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:bg-white/10'}`}
                        >
                          <div className="w-16 h-16 bg-slate-900/10 dark:bg-white/10 rounded-full flex items-center justify-center relative overflow-hidden">
                             <i className="fa-solid fa-helmet-safety text-3xl text-slate-400"></i>
                             {kartHelmet === h && <div className="absolute inset-0 bg-purple-500/20 animate-pulse"></div>}
                          </div>
                          <span className="font-fredoka text-xs text-slate-900 dark:text-white text-center">{getTranslation(h, language)}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setKartSetupStep(1); playSound(1000); }}
                        className="flex-1 bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka py-4 rounded-2xl text-lg"
                      >
                        {getTranslation('BACK', language)}
                      </button>
                      <button 
                        onClick={() => {
                          setPendingGameState(GameState.PLAYING);
                          setGameState(GameState.LOADING);
                          playSound(800);
                        }}
                        className="flex-1 bg-green-600 text-slate-900 dark:text-white font-fredoka py-4 rounded-2xl text-lg shadow-[0_6px_0_#166534] hover:translate-y-1 active:translate-y-3 active:shadow-none transition-all"
                      >
                        {getTranslation('IM_READY', language)}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <Game 
            character={selectedCharacter} 
            difficulty={selectedDifficulty} 
            mapType={selectedMap}
            customMapData={customMapData}
            controls={controls}
            gameState={gameState} 
            onGameOver={handleGameOver} 
            onQuit={handleQuit} 
            onExitToMenu={handleCleanExit}
            onSettings={() => setShowSettings(true)}
            onCollectItem={playCollectSound}
            ios27Animations={ios27Animations}
            showPimobux={true} 
            showStars={true} 
            soundEnabled={soundEnabled}
            musicEnabled={musicEnabled}
            language={language}
            roomId={currentRoomId}
            kartVehicle={kartVehicle}
            kartHelmet={kartHelmet}
            playerName={playerName}
            onTriggerAchievement={triggerAchievementUnlock}
            hudSettings={currentHudSettings}
          />
        )}

        {gameState === GameState.MARKETPLACE && (
          <Marketplace 
            onBack={() => setGameState(GameState.MENU)} 
            morobux={totalPimobux} 
            mikets={totalMikets}
            ownedItems={ownedItems} 
            onBuy={handleBuyItem} 
            selectedCharacter={selectedCharacter}
            onEquip={handleEquipItem}
            isMoroPlus={isMoroPlus}
            language={language}
            playerName={playerName}
          />
        )}

        {gameState === GameState.CUSTOM_MAPS && (
          <CustomMaps 
            onBack={() => setGameState(GameState.MAP_SELECTION)} 
            onLoadMap={(mapData) => {
              // For now, we'll just log it or maybe we can pass it to Game.tsx
              // If we want to play it, we need to pass it to Game component.
              // Let's set it in state and go to PLAYING
              setCustomMapData(mapData);
              setPendingGameState(GameState.PLAYING);
              setGameState(GameState.LOADING);
              playSound(800);
            }}
            language={language}
          />
        )}

        {gameState === GameState.GAMEOVER && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500 max-w-2xl w-full px-4">
            <h2 className={`text-6xl sm:text-7xl font-fredoka mb-6 drop-shadow-[0_0_40px_rgba(239,68,68,0.5)] text-center ${showWinCelebration ? 'text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
              {showWinCelebration ? "YOU WIN!" : getTranslation('WIPEOUT_TITLE', language)}
            </h2>

            {/* Session Recap Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 w-full mb-8 shadow-2xl backdrop-blur-xl relative overflow-hidden text-white">
              {/* New High Score Celebratory Message */}
              {isNewHighScore && (
                <div className="mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 p-4 rounded-2xl text-slate-950 font-fredoka flex items-center justify-between shadow-lg shadow-amber-500/20 border border-yellow-300/60 animate-bounce">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-950 text-yellow-400 flex items-center justify-center text-xl shadow-inner shrink-0">
                      <i className="fa-solid fa-crown text-yellow-300"></i>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-black block text-slate-900/80">New Personal Record!</span>
                      <span className="text-lg sm:text-2xl font-black">NEW HIGH SCORE!</span>
                    </div>
                  </div>
                  <span className="bg-slate-950 text-yellow-400 font-mono text-sm sm:text-base font-black px-3.5 py-1.5 rounded-xl shadow-md border border-yellow-500/30">
                    {lastScore}m
                  </span>
                </div>
              )}

              {/* Session Recap Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base border border-emerald-500/30">
                    <i className="fa-solid fa-flag-checkered"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white font-fredoka leading-none">Session Recap</h3>
                    <span className="text-[10px] text-slate-400 font-medium">Game Session Summary</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-300 border border-slate-700/60">
                  <i className="fa-solid fa-trophy text-amber-400"></i> Best: {highScore}m
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                {/* Distance Traveled */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                  <div className="text-blue-400 text-2xl mb-1 flex justify-center">
                    <i className="fa-solid fa-person-running"></i>
                  </div>
                  <p className="text-3xl font-fredoka text-blue-400 mb-1">{lastScore}m</p>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{getTranslation('TRAVEL_DISTANCE', language)}</p>
                </div>

                {/* Coins Earned (PimoBux) */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center relative overflow-hidden group hover:border-yellow-500/40 transition-colors">
                  <div className="text-yellow-400 text-2xl mb-1 flex justify-center">
                    <PimobuxIcon className="w-7 h-7" />
                  </div>
                  <p className="text-3xl font-fredoka text-yellow-400 mb-1">{lastPimobux}</p>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{getTranslation('PIMOBUX_COLLECTED', language)}</p>
                </div>

                {/* Mikets Earned */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                  <div className="text-amber-400 text-2xl mb-1 flex justify-center">
                    <MiketsIcon className="w-7 h-7" />
                  </div>
                  <p className="text-3xl font-fredoka text-amber-400 mb-1">{lastMikets}</p>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">MIKETS</p>
                </div>
              </div>

              {/* Pimo Tip */}
              {tip && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 italic text-center flex items-center justify-center gap-2">
                  <i className="fa-solid fa-lightbulb text-amber-400 text-sm shrink-0"></i>
                  <span>"{tip}"</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 w-full mb-4">
               <button onClick={() => { setShowWinCelebration(false); setGameState(GameState.PLAYING); playSound(800); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-fredoka text-2xl sm:text-3xl py-5 sm:py-6 rounded-[2rem] shadow-[0_8px_0_#991b1b] hover:translate-y-0.5 active:translate-y-2 transition-all">{getTranslation('RETRY', language)}</button>
               <button onClick={() => { setShowWinCelebration(false); setGameState(GameState.MENU); playSound(1000); }} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-fredoka text-xl sm:text-2xl px-8 py-5 sm:py-6 rounded-[2rem] transition-all">{getTranslation('MENU', language)}</button>
            </div>
            <button 
              onClick={() => setGameState(GameState.MAP_EDITOR)} 
              className="w-full bg-purple-600/20 border border-purple-500/30 text-red-300 font-fredoka py-4 rounded-2xl hover:bg-purple-600/30 transition-all flex items-center justify-center gap-3 text-lg"
            >
              <RobloxStudioIcon className="w-5 h-5" />
              {getTranslation('CREATE_MAP', language)}
            </button>
          </div>
        )}

        {showBye && (
          <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="absolute top-1/4 bg-slate-900 dark:bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-2xl animate-bounce">
              {getTranslation('BYE_BYE', language)}
            </div>
            <Moro3D character={selectedCharacter} width={400} height={400} showBye={true} isJumping={true} jumpProgress={jumpProgress} playerName={playerName} />
          </div>
        )}

        {gameState === GameState.CALL_MORO && (
          <CallMoro 
            character={selectedCharacter} 
            onEndCall={() => setGameState(GameState.MENU)} 
            playerName={playerName}
          />
        )}

        {gameState === GameState.MAP_SELECTION && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-12 w-full py-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setGameState(GameState.MENU); playSound(1000); }}
                  className="bg-slate-900/10 dark:bg-white/10 backdrop-blur-md border border-slate-900/20 dark:border-white/20 p-4 rounded-2xl hover:bg-slate-900/20 dark:bg-white/20 transition-all shadow-lg"
                >
                  <i className="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <h2 className="text-5xl font-fredoka text-slate-900 dark:text-white">{getTranslation('SELECT_MAP', language)}</h2>
              </div>
              <button 
                onClick={() => { setShowMapClassesModal(true); playSound(600); }}
                className="bg-yellow-600/20 backdrop-blur-md border border-yellow-500/30 text-yellow-400 font-fredoka px-6 py-4 rounded-2xl hover:bg-yellow-600/30 transition-all flex items-center gap-3 relative shadow-lg"
              >
                <i className="fa-solid fa-trophy"></i>
                <div className="flex flex-col items-start leading-none">
                  <div className="flex items-center gap-2">
                    <span>{getTranslation('CLASSED', language)}</span>
                    {isMoroPlus ? (
                      <i className="fa-solid fa-square-plus text-[10px] text-yellow-500 animate-pulse"></i>
                    ) : (
                      <i className="fa-solid fa-lock text-[10px] text-yellow-500/50"></i>
                    )}
                  </div>
                  <span className="text-xs text-yellow-500/70">{trophies} {getTranslation('TROPHIES', language)}</span>
                </div>
              </button>
            </div>

            {/* Pimo Plus Chance Active Across All Maps Banner */}
            <div className="w-full bg-gradient-to-r from-yellow-500/15 via-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 shadow-sm">
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-crown text-amber-500 text-sm animate-bounce"></i>
                <span>Pimo Plus Chance is active on ALL maps! Play any map to earn trophies & unlock 2x PimoBux rewards!</span>
              </span>
              <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2.5 py-1 rounded-[2.5rem] text-[10px] uppercase font-mono font-black shrink-0">
                2x Rewards
              </span>
            </div>

            {isMapSelectionLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
                <Moro3D character={CHARACTERS.find(c => c.id === 'moro-classic') || CHARACTERS[0]} width={150} height={150} isJumping={true} jumpProgress={mapLoaderJumpProgress} playerName={""} />
                <h3 className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-fredoka text-xl mt-6 animate-text-glimmer">
                  <i className="fa-solid fa-star text-red-500 animate-spin"></i>
                  {getTranslation('LOADING', language) || 'Loading...'}
                </h3>
                <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-progress-fill"></div>
                </div>
                <div className="mt-8 max-w-sm text-center px-4 h-12 flex items-center justify-center">
                  <p key={mapSelectionTipIndex} className="text-sm font-fredoka text-slate-500 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <i className="fa-regular fa-lightbulb text-amber-500 mr-2"></i>
                    {getTranslation(LOADING_TIPS[mapSelectionTipIndex], language) || LOADING_TIPS[mapSelectionTipIndex]}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 w-full animate-in fade-in duration-500">
                {(() => {
                const allMapsData = [
                  {
                    id: MapType.TUTORIAL,
                    title: getTranslation('MAP_TUTORIAL', language) || 'DEMO MAP (TUTORIAL)',
                    desc: getTranslation('MAP_TUTORIAL_DESC', language) || 'Interactive training with Coach Pimo! Master movement, jumping, double jumping, dashing, and collecting.',
                    iconEl: <i className="fa-solid fa-graduation-cap text-8xl text-amber-400"></i>,
                    gradient: 'from-amber-500/25 via-blue-600/20 to-indigo-600/25',
                    borderHover: 'hover:border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)]',
                    textCol: 'text-amber-400',
                    actionText: getTranslation('PLAY_TUTORIAL', language) || 'START TUTORIAL',
                    actionIcon: 'fa-solid fa-graduation-cap',
                    onClick: () => {
                      setSelectedMap(MapType.TUTORIAL);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.CLASSED,
                    title: getTranslation('CLASS_MAP', language),
                    desc: getTranslation('PLAY_TO_EARN', language),
                    iconEl: <i className="fa-solid fa-trophy text-8xl"></i>,
                    gradient: 'from-emerald-600/20 to-teal-600/20',
                    borderHover: 'hover:border-emerald-500/50',
                    textCol: 'text-emerald-400',
                    actionText: getTranslation('RANK_UP', language),
                    actionIcon: 'fa-solid fa-arrow-trend-up',
                    onClick: () => {
                      setSelectedMap(MapType.CLASSED);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.DUO,
                    title: getTranslation('MAP_DUO', language),
                    desc: getTranslation('INVITE_FRIEND_DESC', language),
                    iconEl: <i className="fa-solid fa-user-group text-8xl"></i>,
                    gradient: 'from-blue-600/20 to-purple-600/20',
                    borderHover: 'hover:border-blue-500/50',
                    textCol: 'text-blue-400',
                    actionText: getTranslation('INVITE_PERSON', language),
                    actionIcon: 'fa-solid fa-plus-circle',
                    onClick: () => {
                      const newRoomId = Math.random().toString(36).substring(2, 9);
                      setCurrentRoomId(newRoomId);
                      setSelectedMap(MapType.DUO);
                      setShowInviteModal(true);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.PIMOBUX,
                    title: getTranslation('MAP_OF_PIMOBUX', language),
                    desc: getTranslation('MAP_OF_PIMOBUX_DESC', language),
                    iconEl: <PimobuxIcon className="w-24 h-24" />,
                    gradient: 'from-yellow-600/20 to-orange-600/20',
                    borderHover: 'hover:border-yellow-500/50',
                    textCol: 'text-yellow-400',
                    actionText: getTranslation('EARN_MORE', language),
                    actionIcon: 'fa-solid fa-coins',
                    onClick: () => {
                      setSelectedMap(MapType.PIMOBUX);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.MIKETS,
                    title: getTranslation('MAP_OF_MIKETS', language),
                    desc: getTranslation('MAP_OF_MIKETS_DESC', language),
                    iconEl: <MiketsIcon className="w-24 h-24" />,
                    gradient: 'from-amber-500/20 to-yellow-500/20',
                    borderHover: 'hover:border-amber-400/50',
                    textCol: 'text-amber-400',
                    actionText: getTranslation('EARN_MIKETS', language),
                    actionIcon: 'fa-solid fa-ticket',
                    onClick: () => {
                      setSelectedMap(MapType.MIKETS);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.AGAINST_BOT,
                    title: getTranslation('AGAINST_THE_BOT', language),
                    desc: getTranslation('AGAINST_THE_BOT_DESC', language),
                    iconEl: <i className="fa-solid fa-brain text-8xl"></i>,
                    gradient: 'from-red-600/20 to-slate-600/20',
                    borderHover: 'hover:border-red-500/50',
                    textCol: 'text-red-400',
                    actionText: getTranslation('CHALLENGE_BOT', language),
                    actionIcon: 'fa-solid fa-bolt',
                    onClick: () => {
                      setSelectedMap(MapType.AGAINST_BOT);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.DESERT,
                    title: getTranslation('MAP_DESERT', language) || 'DESERT MAP',
                    desc: getTranslation('MAP_DESERT_DESC', language) || 'Hot sands and prickly obstacles!',
                    iconEl: <i className="fa-solid fa-sun text-8xl"></i>,
                    gradient: 'from-orange-600/20 to-yellow-800/20',
                    borderHover: 'hover:border-orange-500/50',
                    textCol: 'text-orange-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    onClick: () => {
                      setSelectedMap(MapType.DESERT);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.JUNGLE,
                    title: getTranslation('MAP_JUNGLE', language) || 'JUNGLE MAP',
                    desc: getTranslation('MAP_JUNGLE_DESC', language) || 'Swing through the dense jungle!',
                    iconEl: <i className="fa-solid fa-leaf text-8xl"></i>,
                    gradient: 'from-green-600/20 to-emerald-800/20',
                    borderHover: 'hover:border-green-500/50',
                    textCol: 'text-green-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    onClick: () => {
                      setSelectedMap(MapType.JUNGLE);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.ICE_CAVE,
                    title: getTranslation('MAP_ICE_CAVE', language) || 'ICE CAVE MAP',
                    desc: getTranslation('MAP_ICE_CAVE_DESC', language) || 'Slippery ice and freezing challenges!',
                    iconEl: <i className="fa-solid fa-snowflake text-8xl"></i>,
                    gradient: 'from-cyan-600/20 to-blue-800/20',
                    borderHover: 'hover:border-cyan-500/50',
                    textCol: 'text-cyan-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    onClick: () => {
                      setSelectedMap(MapType.ICE_CAVE);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.VOLCANO,
                    title: getTranslation('MAP_VOLCANO', language) || 'VOLCANO MAP',
                    desc: getTranslation('MAP_VOLCANO_DESC', language) || 'Lava pits and red-hot obstacles!',
                    iconEl: <i className="fa-solid fa-volcano text-8xl"></i>,
                    gradient: 'from-red-600/20 to-orange-800/20',
                    borderHover: 'hover:border-red-500/50',
                    textCol: 'text-red-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    onClick: () => {
                      setSelectedMap(MapType.VOLCANO);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: playerTier === 'STANDARD'
                  },
                  {
                    id: MapType.CRYSTAL_CAVES,
                    title: getTranslation('MAP_CRYSTAL_CAVES', language) || 'CRYSTAL CAVES',
                    desc: getTranslation('MAP_CRYSTAL_CAVES_DESC', language) || 'Blue treasures and slippery ice patches!',
                    iconEl: <i className="fa-solid fa-gem text-8xl"></i>,
                    gradient: 'from-blue-400/20 to-cyan-800/20',
                    borderHover: 'hover:border-blue-400/50',
                    textCol: 'text-blue-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    onClick: () => {
                      setSelectedMap(MapType.CRYSTAL_CAVES);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: playerTier !== 'KIDS'
                  },
                  {
                    id: MapType.SPEED_TRAINING,
                    title: getTranslation('MAP_SPEED_TRAINING', language) || 'SPEED TRAINING',
                    desc: getTranslation('MAP_SPEED_TRAINING_DESC', language) || 'Test your reflexes and speed!',
                    iconEl: <i className="fa-solid fa-gauge-high text-8xl"></i>,
                    gradient: 'from-purple-600/20 to-pink-800/20',
                    borderHover: 'hover:border-purple-500/50',
                    textCol: 'text-red-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    onClick: () => {
                      setSelectedMap(MapType.SPEED_TRAINING);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.MORO_KART,
                    title: getTranslation('MAP_MORO_KART', language) || 'PIMO KART',
                    desc: getTranslation('MAP_MORO_KART_DESC', language) || 'Race through the obstacles!',
                    iconEl: <i className="fa-solid fa-car text-8xl"></i>,
                    gradient: 'from-blue-500/20 to-indigo-800/20',
                    borderHover: 'hover:border-blue-400/50',
                    textCol: 'text-blue-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    onClick: () => {
                      setSelectedMap(MapType.MORO_KART);
                      setKartSetupStep(0);
                      setGameState(GameState.KART_SETUP);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.NEON_CITY,
                    title: getTranslation('MAP_NEON_CITY', language) || 'NEON CITY 2099',
                    desc: getTranslation('MAP_NEON_CITY_DESC', language) || 'Cyberpunk skylines, plasma speedboosters & holographic laser traps!',
                    iconEl: <i className="fa-solid fa-city text-8xl"></i>,
                    gradient: 'from-cyan-600/30 via-fuchsia-600/20 to-purple-900/30',
                    borderHover: 'hover:border-cyan-400/80',
                    textCol: 'text-cyan-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    badge: 'NEW • CYBERPUNK 2099',
                    onClick: () => {
                      setSelectedMap(MapType.NEON_CITY);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.COSMIC_ORBIT,
                    title: getTranslation('MAP_COSMIC_ORBIT', language) || 'COSMIC ORBIT',
                    desc: getTranslation('MAP_COSMIC_ORBIT_DESC', language) || 'Zero-gravity space station with asteroid fields & black hole portals!',
                    iconEl: <i className="fa-solid fa-user-astronaut text-8xl"></i>,
                    gradient: 'from-indigo-600/30 via-slate-900/40 to-blue-900/40',
                    borderHover: 'hover:border-indigo-400/80',
                    textCol: 'text-indigo-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    badge: 'NEW • ZERO-GRAVITY',
                    onClick: () => {
                      setSelectedMap(MapType.COSMIC_ORBIT);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.CANDY_KINGDOM,
                    title: getTranslation('MAP_CANDY_KINGDOM', language) || 'CANDY KINGDOM',
                    desc: getTranslation('MAP_CANDY_KINGDOM_DESC', language) || 'Sweet sugar platforms, lollipops, spring bounce pads & gummy hazards!',
                    iconEl: <i className="fa-solid fa-ice-cream text-8xl"></i>,
                    gradient: 'from-pink-500/30 via-amber-400/20 to-rose-600/30',
                    borderHover: 'hover:border-pink-300/80',
                    textCol: 'text-pink-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    badge: 'NEW • SWEET FRENZY',
                    onClick: () => {
                      setSelectedMap(MapType.CANDY_KINGDOM);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.MYSTIC_FOREST,
                    title: getTranslation('MAP_MYSTIC_FOREST', language) || 'MYSTIC ENCHANTED FOREST',
                    desc: getTranslation('MAP_MYSTIC_FOREST_DESC', language) || 'Glowing mushrooms, floating platform trails & fairy dust boost pads!',
                    iconEl: <i className="fa-solid fa-tree text-8xl"></i>,
                    gradient: 'from-emerald-700/30 via-teal-600/20 to-green-900/40',
                    borderHover: 'hover:border-emerald-400/80',
                    textCol: 'text-emerald-300',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    badge: 'NEW • MAGIC RUN',
                    onClick: () => {
                      setSelectedMap(MapType.MYSTIC_FOREST);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.PIRATE_COVE,
                    title: getTranslation('MAP_PIRATE_COVE', language) || 'PIRATE TREASURE COVE',
                    desc: getTranslation('MAP_PIRATE_COVE_DESC', language) || 'Wooden pirate docks, cannonball hazard obstacles & golden coin reefs!',
                    iconEl: <i className="fa-solid fa-anchor text-8xl"></i>,
                    gradient: 'from-blue-700/30 via-indigo-700/20 to-slate-900/40',
                    borderHover: 'hover:border-blue-400/80',
                    textCol: 'text-blue-300',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    badge: 'NEW • PIRATE ADVENTURE',
                    onClick: () => {
                      setSelectedMap(MapType.PIRATE_COVE);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.CYBER_GRID,
                    title: getTranslation('MAP_CYBER_GRID', language) || 'CYBER GRID ARENA',
                    desc: getTranslation('MAP_CYBER_GRID_DESC', language) || 'Tron-style neon lightcycles, grid barriers & quantum jump pads!',
                    iconEl: <i className="fa-solid fa-microchip text-8xl"></i>,
                    gradient: 'from-zinc-800/50 via-cyan-900/30 to-black/60',
                    borderHover: 'hover:border-cyan-400/80',
                    textCol: 'text-cyan-300',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    badge: 'NEW • HIGH TECH',
                    onClick: () => {
                      setSelectedMap(MapType.CYBER_GRID);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  },
                  {
                    id: MapType.KICKING_TRAINING,
                    title: getTranslation('MAP_KICKING_TRAINING', language) || 'KICKING TRAINING',
                    desc: getTranslation('MAP_KICKING_TRAINING_DESC', language) || 'Master the art of kicking!',
                    iconEl: <i className="fa-solid fa-shoe-prints text-8xl"></i>,
                    gradient: 'from-lime-600/20 to-green-800/20',
                    borderHover: 'hover:border-lime-500/50',
                    textCol: 'text-lime-400',
                    actionText: getTranslation('PLAY', language) || 'PLAY',
                    actionIcon: 'fa-solid fa-play',
                    onClick: () => {
                      setSelectedMap(MapType.KICKING_TRAINING);
                      startLoading(GameState.PLAYING);
                      playSound(800);
                    },
                    condition: true
                  }
                ];

                const sorted = [...allMapsData].sort((a, b) => {
                  const aFav = favoriteMaps.includes(a.id);
                  const bFav = favoriteMaps.includes(b.id);
                  if (aFav && !bFav) return -1;
                  if (!aFav && bFav) return 1;
                  return 0;
                });

                return (
                  <>
                    {sorted.filter(m => m.condition).map((m, index) => {
                      const isFav = favoriteMaps.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={m.onClick}
                          style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
                          className={`group relative bg-gradient-to-br ${m.gradient} backdrop-blur-md border border-slate-900/10 dark:border-white/15 p-8 rounded-[2.5rem] ${m.borderHover} transition-all text-left overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-500`}
                        >
                          <div className="absolute top-0 right-16 p-8 opacity-10 group-hover:opacity-25 animate-float transition-opacity duration-500">
                            {m.iconEl}
                          </div>

                          {/* Favorite Heart Button */}
                          <button
                            onClick={(e) => toggleFavoriteMap(m.id, e)}
                            className={`absolute top-6 right-6 z-30 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                              isFav
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110'
                                : 'bg-white/20 dark:bg-slate-800/70 text-slate-400 hover:text-red-500 hover:bg-white/40'
                            }`}
                            title={isFav ? 'Unfavorite map' : 'Favorite map (Pins to top)'}
                          >
                            <i className={`${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} text-lg`}></i>
                          </button>

                          {m.badge && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                                {m.badge}
                              </span>
                            </div>
                          )}

                          {m.id === MapType.CLASSED ? (
                            <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                              {m.title}
                              {isMoroPlus ? (
                                <span className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm">
                                  <i className="fa-solid fa-square-plus"></i> {getTranslation('MORO_PLUS_ACTIVE', language)}
                                </span>
                              ) : (
                                <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 opacity-50">
                                  <i className="fa-solid fa-lock"></i> {getTranslation('MORO_PLUS_LOCKED', language)}
                                </span>
                              )}
                            </h3>
                          ) : (
                            <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                              {m.title}
                              {isFav && (
                                <span className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase tracking-wider">
                                  <i className="fa-solid fa-star"></i> Pinned
                                </span>
                              )}
                            </h3>
                          )}

                          <p className="text-slate-500 dark:text-slate-400 font-fredoka">{m.desc}</p>
                          <div className={`mt-4 inline-flex items-center gap-2 ${m.textCol} font-fredoka`}>
                            <i className={m.actionIcon}></i>
                            {m.actionText}
                          </div>

                          {m.id === MapType.CLASSED && isMoroPlus && (
                            <div className="absolute bottom-4 right-4 flex items-end gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                              <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-2xl rounded-br-none text-[10px] font-fredoka shadow-xl relative max-w-[180px]">
                                {getTranslation('CONGRATULATIONS_PLUS', language)}
                                <div className="absolute -bottom-1 right-0 w-2 h-2 bg-yellow-500/10 border-r border-b border-yellow-500/30 rotate-45"></div>
                              </div>
                              <div className="w-10 h-10 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 rounded-full flex items-center justify-center text-xl animate-bounce shadow-lg flex-shrink-0">
                                <i className="fa-solid fa-square-plus text-yellow-500"></i>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setGameState(GameState.CUSTOM_MAPS)}
                      className="group relative bg-gradient-to-br from-slate-600/20 to-slate-800/20 backdrop-blur-md border border-slate-900/10 dark:border-white/10 p-8 rounded-[2.5rem] hover:border-slate-500/50 transition-all text-left shadow-xl"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 animate-float transition-opacity duration-500">
                        <i className="fa-solid fa-folder-open text-8xl"></i>
                      </div>
                      <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-2">{getTranslation('CUSTOM_MAPS', language) || 'CUSTOM MAPS'}</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-fredoka">{getTranslation('CUSTOM_MAPS_DESC', language) || 'Play your saved custom maps.'}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 font-fredoka">
                        <i className="fa-solid fa-play"></i>
                        {getTranslation('LOAD_MAP', language) || 'LOAD MAP'}
                      </div>
                    </button>
                  </>
                );
              })()}
              </div>
            )}
          </div>
        )}

        {showInviteModal && (
          <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl">
              <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-user-plus text-4xl text-blue-400"></i>
              </div>
              <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-4">{getTranslation('INVITE_FRIEND_TITLE', language)}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8">{getTranslation('SHARE_LINK_DESC', language)}</p>
              
              <div className="bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-2xl p-4 mb-8 flex items-center justify-between gap-4">
                <code className="text-blue-400 font-mono text-sm truncate">{`${window.location.origin.replace('-dev-', '-pre-')}/?mode=duo&room=${currentRoomId}`}</code>
                <button 
                  onClick={async () => {
                    const link = `${window.location.origin.replace('-dev-', '-pre-')}/?mode=duo&room=${currentRoomId}`;
                    try {
                      if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(link);
                      } else {
                        const textArea = document.createElement("textarea");
                        textArea.value = link;
                        textArea.style.position = "fixed";
                        textArea.style.left = "-999999px";
                        textArea.style.top = "-999999px";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                          document.execCommand('copy');
                        } catch (err) {
                          console.error('Fallback copy failed', err);
                        }
                        textArea.remove();
                      }
                      setInviteLinkCopied(true);
                      setTimeout(() => setInviteLinkCopied(false), 2000);
                      playSound(1000);
                    } catch (err) {
                      console.error('Copy failed', err);
                    }
                  }}
                  className={`${inviteLinkCopied ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-slate-900 dark:text-white p-3 rounded-xl transition-all`}
                >
                  <i className={`fa-solid ${inviteLinkCopied ? 'fa-check' : 'fa-copy'}`}></i>
                </button>
              </div>

              <button 
                onClick={() => {
                  setShowInviteModal(false);
                  setPendingGameState(GameState.PLAYING);
                  setGameState(GameState.LOBBY);
                  window.history.replaceState({}, document.title, `${window.location.pathname}?mode=duo&room=${currentRoomId}`);
                  playSound(800);
                }}
                className="w-full bg-slate-900 dark:bg-white text-slate-900 font-fredoka py-5 rounded-2xl text-xl shadow-[0_6px_0_#cbd5e1] hover:translate-y-1 active:translate-y-3 active:shadow-none transition-all"
              >
                DONE
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.LOBBY && (
        <Lobby 
          language={language}
          onStart={() => {
            startLoading(GameState.PLAYING);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
          onCancel={() => {
            setGameState(GameState.MENU);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      )}

      {gameState === GameState.LOADING && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <AnimatePresence mode="wait">
              {showPresents ? (
                <motion.div
                  key="presents"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  <PimoStudiosLogo size={180} variant="card" className="mb-6 shadow-[0_20px_60px_rgba(239,68,68,0.4)]" />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-center mb-10"
                  >
                    <h1 className="text-4xl sm:text-5xl font-fredoka text-slate-900 dark:text-white tracking-[0.2em] uppercase mb-3 drop-shadow-lg">
                      Pimo Studios
                    </h1>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100.5%' }}
                      transition={{ delay: 0.8, duration: 1 }}
                      className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-5"
                    />
                    <motion.div
                      initial={{ opacity: 0, letterSpacing: '0.2em' }}
                      animate={{ opacity: 1, letterSpacing: '0.6em' }}
                      transition={{ delay: 1.2, duration: 0.8 }}
                      className="text-xl sm:text-2xl font-fredoka text-red-400 uppercase tracking-[0.6em] pl-[0.6em]"
                    >
                      Presents
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.6 }}
                    className="bg-purple-900/40 border border-purple-500/30 rounded-2xl p-6 w-full max-w-xl flex items-start gap-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
                  >
                    <div className="w-12 h-12 bg-purple-500/10 backdrop-blur-md border border-purple-500/30 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <i className="fa-solid fa-brain text-red-400 text-xl animate-pulse"></i>
                    </div>
                    <div className="text-left">
                      <h4 className="text-red-300 font-fredoka text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                        {getTranslation('GUIDE', language) || 'GLIMMER GUIDE'}
                        <span className="text-[10px] bg-purple-500/10 backdrop-blur-md border border-purple-500/30 text-red-200 px-2 py-0.5 rounded-full shadow-sm">AI</span>
                      </h4>
                      <p className="text-slate-200 font-fredoka leading-relaxed">
                        {loadingTip}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center max-w-2xl w-full px-4"
                >
                  <PimoStudiosLogo size={130} variant="card" className="animate-bounce mb-6 shadow-xl" />
                  
                  <div className="bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-900/10 dark:border-white/10 rounded-[2rem] p-8 w-full flex flex-col items-center mb-8 shadow-2xl">
                    <h3 className="text-blue-400 font-fredoka text-sm tracking-[0.3em] uppercase mb-2">
                      {getTranslation('LOADING', language) || 'LOADING'}
                    </h3>
                    <h2 className="text-4xl font-fredoka text-slate-900 dark:text-white mb-6 text-center drop-shadow-md">
                      {getMapName(selectedMap, language)}
                    </h2>
                    
                    <div className="w-full h-4 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 shadow-inner mb-4 relative">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.8)] relative overflow-hidden" 
                       >
                         <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:40px_40px] animate-shimmer"></div>
                       </motion.div>
                    </div>
                    
                    <div className="flex justify-between w-full text-sm font-fredoka text-slate-500 dark:text-slate-400">
                      <span>{loadingMessage}</span>
                      <span className="text-slate-900 dark:text-white font-bold">{Math.round(loadingProgress)}%</span>
                    </div>
                  </div>

                  <div className="bg-blue-900/30 border border-blue-500/20 rounded-2xl p-6 w-full max-w-xl flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-lightbulb text-blue-400 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-blue-300 font-fredoka text-sm uppercase tracking-wider mb-1">
                        {getTranslation('TIP', language) || 'TIP'}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 font-fredoka leading-relaxed">
                        {loadingTip}
                      </p>
                    </div>
                  </div>


                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </motion.div>

      {showSettings && (
        <div className="fixed inset-0 z-[70] bg-white/80 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div 
            variants={currentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={currentTransition}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[4rem] w-full max-w-md p-12 relative ios-shading max-h-[90vh] flex flex-col"
          >
            <button onClick={() => { setShowSettings(false); playSound(1000); }} className="absolute top-8 right-8 w-12 h-12 bg-slate-900/10 dark:bg-white/10 rounded-full text-slate-900 dark:text-white hover:bg-slate-900/20 dark:bg-white/20 transition-all shadow-sm"><i className="fa-solid fa-xmark"></i></button>
            <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-12 text-center drop-shadow-sm">{getTranslation('SETTINGS', language)}</h3>
            
            <div className="flex flex-col gap-8 overflow-y-auto pr-4 flex-grow bg-slate-900/5 dark:bg-black/20 rounded-[2rem] p-4 settings-inner-shadow border border-slate-900/5 dark:border-white/5">
              <div className="flex flex-col gap-4">
                <span className="text-slate-500 font-black text-xs uppercase tracking-widest">Player Name</span>
                <input 
                  type="text" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full py-4 px-6 rounded-2xl bg-slate-900/5 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white font-fredoka focus:border-purple-500 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-32 h-32 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-4 border-slate-900/10 dark:border-white/10 overflow-hidden shadow-2xl relative group">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <i className="fa-solid fa-user text-5xl"></i>
                    </div>
                  )}
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="absolute inset-0 bg-white/50 dark:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-slate-900 dark:text-white text-2xl"
                  >
                    <i className="fa-solid fa-camera"></i>
                  </button>
                </div>
                <button 
                  onClick={() => { setShowProfileModal(true); playSound(600); }}
                  className="text-red-400 font-fredoka text-sm uppercase tracking-widest hover:text-red-300 transition-colors"
                >
                  {profilePic ? 'Change Photo' : 'Add Photo'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-900 dark:text-white font-fredoka text-xl">{getTranslation('SOUND_FX', language)}</span>
                <button 
                  onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) playSound(600); }}
                  className={`w-20 h-10 rounded-full relative transition-all ${soundEnabled ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-8 h-8 bg-slate-900 dark:bg-white rounded-full transition-all ${soundEnabled ? 'left-11' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-900 dark:text-white font-fredoka text-xl">{getTranslation('MUSIC', language)}</span>
                  <button 
                    onClick={() => { setMusicEnabled(!musicEnabled); playSound(600); }}
                    className={`w-20 h-10 rounded-full relative transition-all ${musicEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-8 h-8 bg-slate-900 dark:bg-white rounded-full transition-all ${musicEnabled ? 'left-11' : 'left-1'}`} />
                  </button>
                </div>
                {musicEnabled && (
                  <div className="flex flex-col gap-3 bg-slate-900/5 dark:bg-white/5 p-4 rounded-xl border border-slate-900/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-fredoka font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <i className="fa-solid fa-gamepad text-red-500"></i> Video Game Background Music
                      </span>
                      <SoundtrackWidget compact />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {TRACKS.map((t, idx) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            soundtrack.setTrack(idx);
                            soundtrack.play();
                            playSound(600);
                          }}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            soundtrack.getState().currentTrackIndex === idx
                              ? 'bg-red-500/20 border-red-500 text-slate-900 dark:text-white font-bold shadow-sm'
                              : 'bg-white/40 dark:bg-black/20 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-fredoka truncate">{t.title}</span>
                            <span className="text-[10px] text-red-500 font-mono font-bold shrink-0">{t.bpm} BPM</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{t.genre}</div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-fredoka text-slate-500 dark:text-slate-400">Or upload custom audio file</span>
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-colors shadow-sm">
                        <i className="fa-solid fa-file-audio mr-1.5"></i> Custom File
                        <input 
                          type="file" 
                          accept="audio/*,video/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setMusicFileName(file.name);
                              const url = URL.createObjectURL(file);
                              if (bgMusicRef.current) {
                                bgMusicRef.current.src = url;
                                if (gameState === GameState.PLAYING) {
                                  bgMusicRef.current.play().catch(err => console.error("Could not play custom custom file:", err));
                                }
                              }
                            }
                          }} 
                        />
                      </label>
                    </div>
                    {musicFileName && (
                      <div className="flex items-center gap-2 text-[10px] text-blue-500 dark:text-blue-400 font-black truncate max-w-full">
                        <i className="fa-solid fa-music"></i> {musicFileName}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid ${isDarkMode ? 'fa-moon text-red-400' : 'fa-sun text-yellow-500'} text-xl`}></i>
                  <span className="text-slate-900 dark:text-white font-fredoka text-xl">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <button 
                  onClick={() => { setIsDarkMode(!isDarkMode); playSound(600); }}
                  className={`w-20 h-10 rounded-full relative transition-all ${isDarkMode ? 'bg-purple-600' : 'bg-yellow-500'}`}
                >
                  <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all ${isDarkMode ? 'left-11' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid fa-droplet ${isLiquidGlass ? 'text-cyan-400' : 'text-slate-400'} text-xl`}></i>
                  <span className="text-slate-900 dark:text-white font-fredoka text-xl">{getTranslation('LIQUID_GLASS', language)}</span>
                </div>
                <button 
                  onClick={() => { setIsLiquidGlass(!isLiquidGlass); playSound(600); }}
                  className={`w-20 h-10 rounded-full relative transition-all ${isLiquidGlass ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all ${isLiquidGlass ? 'left-11' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid fa-wand-magic-sparkles ${ios27Animations ? 'text-blue-400' : 'text-slate-400'} text-xl`}></i>
                  <span className="text-slate-900 dark:text-white font-fredoka text-xl">{getTranslation('IOS_ANIMATIONS', language)}</span>
                </div>
                <button 
                  onClick={() => { setIos27Animations(!ios27Animations); playSound(600); }}
                  className={`w-20 h-10 rounded-full relative transition-all ${ios27Animations ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all shadow-md ${ios27Animations ? 'left-11' : 'left-1'}`} />
                </button>
              </div>

              {isMoroPlus && (
                <div className="flex items-center justify-between bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <i className="fa-solid fa-crown text-amber-500"></i>
                       <span className="text-slate-900 dark:text-white font-fredoka text-xl">{getTranslation('GOLD_BACKGROUND', language)}</span>
                    </div>
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest ml-7">Pimo Plus Exclusive</span>
                  </div>
                  <button 
                    onClick={() => { setUseGoldBackground(!useGoldBackground); playSound(600); }}
                    className={`w-20 h-10 rounded-full relative transition-all ${useGoldBackground ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all shadow-md ${useGoldBackground ? 'left-11' : 'left-1'}`} />
                  </button>
                </div>
              )}

              {/* HUD Options Panel */}
              <div className="flex flex-col gap-3 bg-slate-900/5 dark:bg-white/5 p-4 rounded-3xl border border-slate-900/10 dark:border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-eye text-indigo-400 text-xl"></i>
                  <span className="text-slate-900 dark:text-white font-fredoka text-xl">HUD Elements</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-sans text-sm">Show Distance</span>
                  <button 
                    onClick={() => { updateHudSetting('showDistance', !currentHudSettings.showDistance); playSound(600); }}
                    className={`w-14 h-7 rounded-full relative transition-all ${currentHudSettings.showDistance ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${currentHudSettings.showDistance ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-sans text-sm">Show Coin Counter (PimoBux)</span>
                  <button 
                    onClick={() => { updateHudSetting('showPimoBux', !currentHudSettings.showPimoBux); playSound(600); }}
                    className={`w-14 h-7 rounded-full relative transition-all ${currentHudSettings.showPimoBux ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${currentHudSettings.showPimoBux ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-sans text-sm">Show Mini-Map / Timer</span>
                  <button 
                    onClick={() => { updateHudSetting('showMiniMap', !currentHudSettings.showMiniMap); playSound(600); }}
                    className={`w-14 h-7 rounded-full relative transition-all ${currentHudSettings.showMiniMap ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${currentHudSettings.showMiniMap ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Backgrounds and Visual Themes Selector */}
              <div className="flex flex-col gap-3 bg-slate-900/5 dark:bg-white/5 p-4 rounded-3xl border border-slate-900/10 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-panorama text-amber-400 text-xl"></i>
                    <span className="text-slate-900 dark:text-white font-fredoka text-xl">Game Backgrounds</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
                    {BACKGROUND_THEMES.find(t => t.id === selectedBackground)?.name || 'Custom'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Choose your visual backdrop for the main menu and game screens.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {BACKGROUND_THEMES.map((theme) => {
                    const isSelected = selectedBackground === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleSelectBackground(theme.id)}
                        className={`relative flex flex-col p-3 rounded-2xl text-left transition-all border-2 overflow-hidden group cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {/* Visual Gradient Swatch Preview */}
                        <div
                          className="w-full h-12 rounded-xl mb-2 relative overflow-hidden border border-white/20 shadow-inner flex items-center justify-center"
                          style={{ background: theme.previewGradient }}
                        >
                          <i className={`fa-solid ${theme.icon} text-white/80 drop-shadow-md text-lg transition-transform group-hover:scale-110`}></i>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-amber-400 text-black rounded-full flex items-center justify-center shadow-md">
                              <i className="fa-solid fa-check text-[10px] font-bold"></i>
                            </div>
                          )}
                        </div>

                        <span className="font-fredoka text-sm text-slate-900 dark:text-white line-clamp-1">
                          {theme.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-tight font-sans">
                          {theme.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Wallpaper Inputs (When Custom is selected or available) */}
                {selectedBackground === 'custom_image' && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-900/10 dark:border-white/10">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload or Enter Image URL:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://example.com/wallpaper.jpg"
                        value={customBgUrl}
                        onChange={(e) => {
                          setCustomBgUrl(e.target.value);
                          localStorage.setItem('moro_custom_bg_url', e.target.value);
                          window.dispatchEvent(new Event('moro_background_changed'));
                        }}
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <label className="px-3 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-fredoka text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md transition-all">
                        <i className="fa-solid fa-upload text-xs"></i>
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const result = reader.result as string;
                                setCustomBgUrl(result);
                                localStorage.setItem('moro_custom_bg_url', result);
                                handleSelectBackground('custom_image');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-language text-blue-400"></i>
                  <span className="text-slate-500 font-black text-xs uppercase tracking-widest">{getTranslation('LANGUAGE', language)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Italian', 'Dutch', 'Russian', 'Turkish', 'Chinese', 'Ukrainian', 'Arabic', 'Hindi'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => { 
                        setLanguage(lang); 
                        playSound(400); 
                      }}
                      className={`py-3 rounded-xl font-fredoka text-sm transition-all border-2 ${language === lang ? 'bg-blue-600 text-slate-900 dark:text-white border-blue-400' : 'bg-slate-900/5 dark:bg-white/5 text-slate-900 dark:text-white border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:bg-white/10'}`}
                    >
                      {
                        lang === 'Arabic' ? 'العربية' : 
                        lang === 'Hindi' ? 'हिन्दी' : 
                        lang === 'Chinese' ? '中文' : 
                        lang === 'Japanese' ? '日本語' : 
                        lang === 'Korean' ? '한국어' : 
                        lang === 'Russian' ? 'Русский' : 
                        lang === 'Ukrainian' ? 'Українська' : 
                        lang === 'Italian' ? 'Italiano' : 
                        lang === 'Turkish' ? 'Türkçe' : 
                        lang === 'German' ? 'Deutsch' : 
                        lang === 'French' ? 'Français' : 
                        lang === 'Spanish' ? 'Español' : 
                        lang === 'Dutch' ? 'Nederlands' : lang
                      }
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-slate-500 font-black text-xs uppercase tracking-widest">{getTranslation('DIFFICULTY', language)}</span>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(Difficulty).map(diff => (
                    <button 
                      key={diff}
                      onClick={() => { setSelectedDifficulty(diff); playSound(400); }}
                      className={`py-4 rounded-2xl font-fredoka transition-all border-2 ${selectedDifficulty === diff ? 'bg-slate-900 dark:bg-white text-slate-900 border-white' : 'bg-slate-900/5 dark:bg-white/5 text-slate-900 dark:text-white border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:bg-white/10'}`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-red-900/20 border border-red-500/20 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-heart text-red-500"></i>
                    <span className="text-slate-900 dark:text-white font-fredoka text-lg">3 Hearts Mode</span>
                  </div>
                  <button 
                    onClick={() => { 
                      const newMode = !localStorage.getItem('moro_3_hearts_mode');
                      if (newMode) {
                        localStorage.setItem('moro_3_hearts_mode', 'true');
                      } else {
                        localStorage.removeItem('moro_3_hearts_mode');
                      }
                      playSound(400);
                      // Force a re-render to update the toggle state visually
                      setLanguage(prev => prev); 
                    }}
                    className={`w-16 h-8 rounded-full relative transition-all ${localStorage.getItem('moro_3_hearts_mode') ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-slate-900 dark:bg-white rounded-full transition-all ${localStorage.getItem('moro_3_hearts_mode') ? 'left-9' : 'left-1'}`} />
                  </button>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-fredoka leading-relaxed">
                  Activate 3 hearts. If all hearts are broken, you will get a Game Over and need to restart the game.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-slate-500 font-black text-xs uppercase tracking-widest">{getTranslation('CONTROLS', language)}</span>
                <div className="grid grid-cols-2 gap-4">
                  {(['jump', 'dash', 'left', 'right'] as const).map(action => (
                    <div key={action} className="flex flex-col gap-2">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">{action}</span>
                      <button
                        onClick={() => { setRebindingKey(action); playSound(400); }}
                        className={`py-3 rounded-xl font-fredoka text-sm transition-all border-2 ${rebindingKey === action ? 'bg-purple-600 text-slate-900 dark:text-white border-purple-400 animate-pulse' : 'bg-slate-900/5 dark:bg-white/5 text-slate-900 dark:text-white border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:bg-white/10'}`}
                      >
                        {rebindingKey === action ? 'PRESS KEY' : controls[action].toUpperCase() === ' ' ? 'SPACE' : controls[action].toUpperCase()}
                      </button>
                    </div>
                  ))}
                </div>
              </div>



              <div className="flex flex-col gap-4 bg-purple-900/10 dark:bg-purple-950/20 border border-purple-500/25 p-5 rounded-[2rem]">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-slate-900 dark:text-white font-fredoka text-lg leading-tight">Age Verification</span>
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">
                      Current Zone: {playerTier === 'KIDS' ? 'Kids' : playerTier === 'SELECT' ? 'Select' : 'Wipeout'}
                    </span>
                  </div>
                  <button 
                    onClick={() => { 
                      setScanResult(null);
                      setAgeVerified(false);
                      setShowAgeVerification(true);
                      setShowSettings(false);
                      playSound(800);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-fredoka text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-face-viewfinder"></i> RE-VERIFY
                  </button>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-fredoka leading-relaxed">
                  Reset your verification and re-scan your face with the camera to be assigned the correct Pimo zone and unlocked maps.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setShowBugReport(true)} 
                  className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-fredoka py-4 rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fa-solid fa-bug"></i>
                  {getTranslation('REPORT_BUG', language)}
                </button>
              </div>
            </div>

            <button onClick={() => { localStorage.setItem('moro_language', language); setShowSettings(false); playSound(1200); }} className="w-full mt-12 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-fredoka py-6 rounded-3xl text-xl hover:bg-slate-100 transition-all">{getTranslation('SAVE_AND_CLOSE', language)}</button>
          </motion.div>
        </div>
      )}

      {showDailyRewardModal && (
        <div className="fixed inset-0 z-[60] bg-white/80 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div 
            variants={currentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={currentTransition}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[4rem] w-full max-w-md p-12 relative shadow-2xl flex flex-col items-center"
          >
            <button onClick={() => { setShowDailyRewardModal(false); playSound(1000); }} className="absolute top-8 right-8 w-12 h-12 bg-slate-900/10 dark:bg-white/10 rounded-full text-slate-900 dark:text-white hover:bg-slate-900/20 dark:bg-white/20 transition-all shadow-sm"><i className="fa-solid fa-xmark"></i></button>
            <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-4 text-center drop-shadow-sm">Daily Reward</h3>
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <i className="fa-solid fa-gift text-4xl text-white"></i>
            </div>
            
            {dailyRewardReady ? (
              <div className="flex flex-col items-center">
                <div className="flex gap-2 items-center mb-2">
                  <i className="fa-solid fa-fire text-orange-500 text-2xl"></i>
                  <span className="text-2xl font-fredoka text-slate-800 dark:text-white">Day {currentStreak + 1} Streak!</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-8 text-center text-lg font-medium">
                  Claim your <span className="font-bold text-yellow-500">{nextRewardAmount}</span> PimoBux bonus today!
                  {currentStreak > 0 && <span className="block text-sm text-green-500 mt-2">+{currentStreak * 10} Streak Bonus!</span>}
                </p>
                <AnimatedButton 
                  onClick={() => {
                    claimDailyReward();
                    setTimeout(() => setShowDailyRewardModal(false), 1500);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-fredoka text-2xl shadow-xl hover:shadow-2xl transition-all w-full flex justify-center items-center gap-2"
                >
                  <i className="fa-solid fa-check"></i>
                  Claim Reward
                </AnimatedButton>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex gap-2 items-center mb-2">
                  <i className="fa-solid fa-fire text-orange-500 text-2xl"></i>
                  <span className="text-2xl font-fredoka text-slate-800 dark:text-white">Day {dailyStreak} Streak!</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-8 text-center text-lg font-medium">You have already claimed your daily reward. Come back tomorrow to keep your streak alive!</p>
                <div className="bg-slate-900/10 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-8 py-4 rounded-full font-fredoka text-xl w-full flex justify-center items-center gap-2">
                  <i className="fa-solid fa-clock"></i>
                  Come back later
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <AvatarCustomizer
        isOpen={showWardrobe}
        onClose={() => setShowWardrobe(false)}
        selectedCharacter={selectedCharacter}
        setSelectedCharacter={setSelectedCharacter}
        ownedItems={ownedItems}
        language={language}
        playerName={playerName}
        playSound={playSound}
        setGameState={setGameState}
      />

      {isMagicalWorld && (
        <MagicalWorld 
          language={language}
          character={selectedCharacter}
          onExit={() => {
            setIsMagicalWorld(false);
            playSound(600);
          }} 
        />
      )}

      {showHowToPlay && (
        <div className="fixed inset-0 z-[120] bg-white/90 dark:bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-50 dark:bg-slate-900 border border-blue-500/30 rounded-[3rem] w-full max-w-2xl p-8 md:p-12 relative shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            
            <button 
              onClick={() => { setShowHowToPlay(false); playSound(1000); }} 
              className="absolute top-6 right-6 w-12 h-12 bg-slate-900/5 dark:bg-white/5 rounded-full text-slate-900 dark:text-white hover:bg-slate-900/10 dark:bg-white/10 transition-all flex items-center justify-center z-10"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <i className="fa-solid fa-gamepad text-3xl"></i>
              </div>
              <h3 className="text-3xl md:text-5xl font-fredoka text-slate-900 dark:text-white uppercase drop-shadow-sm leading-none">
                {getTranslation('HOW_TO_PLAY_TITLE', language) || 'HOW TO PLAY WIPEOUT PIMO'}
              </h3>
            </div>

            <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar relative z-10">
              
              {/* Interactive Tutorial Launcher Banner */}
              <div className="bg-gradient-to-r from-amber-500/20 via-blue-600/20 to-indigo-600/20 border-2 border-amber-400/60 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-400/20 text-amber-400 border border-amber-400/40 rounded-2xl flex items-center justify-center shrink-0 text-3xl">
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  <div>
                    <h4 className="font-fredoka text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {getTranslation('MAP_TUTORIAL', language) || 'Interactive Demo Tutorial'}
                      <span className="text-xs bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full uppercase">NEW</span>
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-fredoka">
                      {getTranslation('MAP_TUTORIAL_DESC', language) || 'Play live in a demo map with talking Coach Pimo guiding you step-by-step!'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowHowToPlay(false);
                    setSelectedMap(MapType.TUTORIAL);
                    startLoading(GameState.PLAYING);
                    playSound(800);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-fredoka font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none transition-all shrink-0 cursor-pointer text-base"
                >
                  <i className="fa-solid fa-graduation-cap"></i>
                  {getTranslation('PLAY_TUTORIAL', language) || 'START TUTORIAL'}
                </button>
              </div>
              
              <div className="bg-slate-900/5 dark:bg-white/5 p-6 rounded-3xl border border-slate-900/10 dark:border-white/10">
                <h4 className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  <i className="fa-solid fa-keyboard text-slate-500"></i> {getTranslation('HOW_TO_PLAY_SUBTITLE_CONTROLS', language) || 'BASIC CONTROLS'}
                </h4>
                <ul className="space-y-4 text-slate-600 dark:text-slate-300 font-fredoka text-lg">
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 text-blue-500"><i className="fa-solid fa-arrows-left-right"></i></div>
                    <p>{getTranslation('HOW_TO_PLAY_DESC_1', language) || 'Use Left/Right arrows or A/D keys to move your Moro left or right. Or tap the left/right edges of the screen.'}</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 text-green-500"><i className="fa-solid fa-arrow-up"></i></div>
                    <p>{getTranslation('HOW_TO_PLAY_DESC_2', language) || 'Press Up arrow, W, or Spacebar to jump. Press it again in mid-air to Double Jump!'}</p>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/5 dark:bg-white/5 p-6 rounded-3xl border border-slate-900/10 dark:border-white/10">
                <h4 className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  <i className="fa-solid fa-trophy text-amber-500"></i> {getTranslation('HOW_TO_PLAY_SUBTITLE_OBJECTIVE', language) || 'OBJECTIVE'}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 font-fredoka text-lg leading-relaxed">
                  {getTranslation('HOW_TO_PLAY_DESC_3', language) || 'Survive the Wipeout obstacles, safely navigate the platforms, and reach the end to earn Pimobux and Trophies!'}
                </p>
              </div>

              <div className="bg-slate-900/5 dark:bg-white/5 p-6 rounded-3xl border border-slate-900/10 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h4 className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    <i className="fa-solid fa-gamepad text-indigo-500"></i> GAMEPAD / CONTROLLER
                  </h4>
                  {activeController && activeBattery && (
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-2 self-start sm:self-auto ${
                      activeBattery.level < 0.10 && !activeBattery.charging
                        ? 'bg-red-600 text-white border-red-400 animate-bounce'
                        : activeBattery.charging
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 animate-electric-glow'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        activeBattery.level < 0.10 && !activeBattery.charging ? 'bg-red-300 animate-ping' : activeBattery.charging ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-ping'
                      }`}></span>
                      Controller Battery: {Math.round(activeBattery.level * 100)}%
                    </span>
                  )}
                </div>

                {/* Real-time Battery Telemetry & Charging Overlay Panel */}
                <div className={`mb-6 p-5 rounded-2xl transition-all duration-300 ${
                  activeBattery && activeBattery.level < 0.10 && !activeBattery.charging
                    ? 'bg-red-950/80 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-battery-shake text-white'
                    : activeBattery?.charging
                    ? 'bg-amber-950/20 dark:bg-amber-950/40 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-900/10 dark:bg-black/30 border border-slate-900/10 dark:border-white/10'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                      activeBattery && activeBattery.level < 0.10 && !activeBattery.charging
                        ? 'text-red-200'
                        : activeBattery?.charging
                        ? 'text-amber-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      <i className={`fa-solid ${
                        activeBattery?.charging ? 'fa-bolt-lightning text-amber-400 animate-bounce' : activeBattery && activeBattery.level < 0.10 ? 'fa-triangle-exclamation text-red-300 animate-ping' : 'fa-battery-half text-indigo-400'
                      }`}></i> Controller Power Monitor
                    </span>
                    <span className={`text-[11px] font-mono font-bold ${
                      activeBattery && activeBattery.level < 0.10 && !activeBattery.charging ? 'text-red-200' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {activeController ? activeController.id.split('(')[0].trim() : 'No Gamepad Detected'}
                    </span>
                  </div>

                  {/* Low Battery High-Contrast Banner Alert */}
                  {activeBattery && activeBattery.level < 0.10 && !activeBattery.charging && (
                    <div className="mb-4 p-3 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-between shadow-lg animate-pulse border border-red-400">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-triangle-exclamation text-lg animate-bounce"></i>
                        <span>CRITICAL BATTERY (&lt;10%)! Connect charger now!</span>
                      </div>
                      <button 
                        onClick={() => playLowBatteryAlarm()} 
                        className="px-2.5 py-1 bg-white text-red-700 hover:bg-red-100 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-transform active:scale-95"
                      >
                        🔊 Test Alarm Sound
                      </button>
                    </div>
                  )}

                  {activeController && activeBattery ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-3xl font-black font-fredoka ${
                            activeBattery.level < 0.10 && !activeBattery.charging ? 'text-white' : 'text-slate-900 dark:text-white'
                          }`}>
                            {Math.round(activeBattery.level * 100)}%
                          </span>
                          {activeBattery.charging && (
                            <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400 flex items-center gap-1.5 animate-electric-glow">
                              <i className="fa-solid fa-bolt-lightning text-amber-300 text-xs animate-bounce"></i> Actively Charging
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                          activeBattery.level < 0.10 && !activeBattery.charging
                            ? 'bg-red-900 text-red-200 border-red-400'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          Source: {activeBattery.source === 'gamepad' ? 'Direct Hardware API' : activeBattery.source === 'device' ? 'System Battery' : 'Standard Telemetry'}
                        </span>
                      </div>

                      {/* Animated Visual Battery Bar & Charging Overlay */}
                      <div className={`w-full h-4 rounded-full overflow-hidden p-0.5 border relative ${
                        activeBattery.level < 0.10 && !activeBattery.charging
                          ? 'bg-red-950 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                          : activeBattery.charging
                          ? 'bg-slate-900 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                      }`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-500 relative overflow-hidden ${
                            activeBattery.charging 
                              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 animate-charging-flow shadow-[0_0_12px_#f59e0b]' 
                              : activeBattery.level >= 0.5 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                              : activeBattery.level >= 0.2 
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                              : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                          }`}
                          style={{ width: `${Math.max(6, activeBattery.level * 100)}%` }}
                        >
                          {/* Charging Stream Particle Overlay */}
                          {activeBattery.charging && (
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                      <i className="fa-solid fa-circle-info text-base animate-bounce"></i>
                      <span>
                        <strong>Gamepad powered on?</strong> Press <u>ANY button</u> on your controller (e.g. A, X, or Start) so your browser detects and activates it!
                      </span>
                    </div>
                  )}

                  {/* Interactive Simulation Controls for Testing Battery Effects */}
                  <div className="mt-4 pt-3 border-t border-slate-200/20 dark:border-white/10 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mr-1">
                      Test Controls:
                    </span>
                    <button
                      onClick={() => {
                        setSimulatedBatteryMode('charging');
                        playSound(800);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                        simulatedBatteryMode === 'charging'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                          : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30'
                      }`}
                    >
                      <i className="fa-solid fa-bolt text-[10px]"></i> Test Charging
                    </button>
                    <button
                      onClick={() => {
                        setSimulatedBatteryMode('low');
                        playLowBatteryAlarm();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                        simulatedBatteryMode === 'low'
                          ? 'bg-red-600 text-white border-red-400 font-black shadow-md animate-pulse'
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30'
                      }`}
                    >
                      <i className="fa-solid fa-triangle-exclamation text-[10px]"></i> Test Low Battery (&lt;10%)
                    </button>
                    {simulatedBatteryMode !== 'none' && (
                      <button
                        onClick={() => {
                          setSimulatedBatteryMode('none');
                          playSound(600);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-slate-500/30 transition-all flex items-center gap-1"
                      >
                        <i className="fa-solid fa-rotate-left text-[10px]"></i> Reset
                      </button>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 text-slate-600 dark:text-slate-300 font-fredoka text-lg">
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 text-indigo-500"><i className="fa-solid fa-arrows-left-right"></i></div>
                    <p>Use the <strong>Left Analog Stick</strong> or <strong>D-Pad</strong> to move left and right.</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 text-green-500"><i className="fa-solid fa-arrow-up"></i></div>
                    <p>Press <strong>A / Cross (Bottom Button)</strong> to Jump and Double Jump.</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 text-amber-500"><i className="fa-solid fa-bolt"></i></div>
                    <p>Press <strong>B / Circle (Right Button)</strong> to Dash or Kick.</p>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/5 dark:bg-white/5 p-6 rounded-3xl border border-slate-900/10 dark:border-white/10">
                <h4 className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  <i className="fa-solid fa-bolt text-red-500"></i> {getTranslation('HOW_TO_PLAY_SUBTITLE_MECHANICS', language) || 'KEY MECHANICS'}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 font-fredoka text-lg leading-relaxed">
                  {getTranslation('HOW_TO_PLAY_DESC_4', language) || 'Dash / Kick: Press the X button (or Dash key) to burst forward. Overcome special obstacles with it!'}
                </p>
              </div>

            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => { 
                  setShowHowToPlay(false); 
                  setSelectedMap(MapType.TUTORIAL);
                  startLoading(GameState.PLAYING);
                  playSound(800); 
                }} 
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-fredoka py-5 rounded-3xl text-xl font-bold transition-all shadow-[0_8px_0_#b45309] active:translate-y-2 active:shadow-none flex items-center justify-center gap-3 cursor-pointer"
              >
                <i className="fa-solid fa-graduation-cap text-2xl"></i>
                {getTranslation('PLAY_TUTORIAL', language) || 'PLAY DEMO TUTORIAL'}
              </button>
              <button 
                onClick={() => { setShowHowToPlay(false); playSound(1000); }} 
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-fredoka py-5 rounded-3xl text-xl font-bold transition-all shadow-[0_8px_0_#1e40af] active:translate-y-2 active:shadow-none cursor-pointer"
              >
                {getTranslation('IM_READY', language) || "I'M READY!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBugReport && (
        <div className="fixed inset-0 z-[80] bg-white/90 dark:bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-50 dark:bg-slate-900 border border-red-500/30 rounded-[3rem] w-full max-w-lg p-10 relative shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <button 
              onClick={() => { setShowBugReport(false); setBugSubmitted(false); setBugComment(""); playSound(1000); }} 
              className="absolute top-6 right-6 w-10 h-10 bg-slate-900/5 dark:bg-white/5 rounded-full text-slate-900 dark:text-white hover:bg-slate-900/10 dark:bg-white/10 transition-all"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            {!bugSubmitted ? (
              <>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 text-xl">
                    <i className="fa-solid fa-bug"></i>
                  </div>
                  <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white">{getTranslation('REPORT_BUG', language)}</h3>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Describe the issue you encountered. Your feedback helps us keep Pimo Studio safe and fun!</p>

                <textarea 
                  value={bugComment}
                  onChange={(e) => setBugComment(e.target.value)}
                  placeholder={getTranslation('TYPE_COMMENT', language)}
                  className="w-full h-40 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-2xl p-6 text-slate-900 dark:text-white font-fredoka text-lg focus:outline-none focus:border-red-500 transition-all resize-none mb-8"
                  autoFocus
                />

                <button 
                  disabled={!bugComment.trim()}
                  onClick={() => {
                    playSound(800);
                    setBugSubmitted(true);
                  }}
                  className="w-full bg-red-600 text-slate-900 dark:text-white font-fredoka py-6 rounded-3xl text-xl hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_0_#991b1b] active:translate-y-2 active:shadow-none"
                >
                  {getTranslation('SUBMIT_REPORT', language)}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-8 animate-in zoom-in duration-500">
                <div className="w-64 h-64 mb-8 rounded-full bg-green-500/20 flex items-center justify-center shadow-2xl border-4 border-green-500/30 overflow-hidden">
                  <img 
                    src="/moro-success.png" 
                    alt="Moro Success"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-2xl font-fredoka text-slate-900 dark:text-white mb-6 leading-tight">
                  {getTranslation('BUG_REPORT_SUCCESS', language)}
                </h3>
                <button 
                  onClick={() => { setShowBugReport(false); setBugSubmitted(false); setBugComment(""); playSound(1000); }}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-fredoka px-12 py-4 rounded-2xl hover:bg-slate-100 transition-all"
                >
                  {getTranslation('DONE', language)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAccountPrompt && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3.5rem] p-12 max-w-lg w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
            
            <div className="w-28 h-28 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <i className="fa-solid fa-brain text-5xl text-blue-400 animate-bounce"></i>
              <div className="absolute -top-2 -right-2 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 text-yellow-500 text-xs font-black px-3 py-1 rounded-full shadow-lg">
                AI CORE
              </div>
            </div>

            <h3 className="text-4xl font-fredoka text-slate-900 dark:text-white mb-6 tracking-tight">ACCOUNT REQUIRED</h3>
            <p className="text-slate-600 dark:text-slate-300 text-lg mb-10 font-fredoka leading-relaxed">
              {accountPromptMessage}
            </p>
            
            <div className="flex flex-col gap-5">
              <button 
                onClick={() => {
                  setShowAccountPrompt(false);
                  playSound(800);
                }}
                className="w-full bg-[#00a4ef] text-slate-900 dark:text-white font-fredoka py-5 rounded-[2rem] text-xl flex items-center justify-center gap-4 hover:bg-[#00a4ef]/90 transition-all shadow-xl"
              >
                <i className="fa-brands fa-microsoft text-2xl"></i>
                CONTINUE WITH MICROSOFT
              </button>

              <button 
                onClick={() => { setShowAccountPrompt(false); playSound(1000); }}
                className="mt-4 text-slate-500 font-fredoka hover:text-slate-900 dark:text-white transition-all text-lg"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {showAgeVerification && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-500">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-8 max-w-xl w-full text-center shadow-2xl relative my-8">
            <h3 className="text-4xl font-fredoka text-slate-900 dark:text-white mb-2">Age Verification</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 font-fredoka">Pimo Bot will verify your age using your camera!</p>
            
            {/* Extremely comforting note for young players */}
            <div className="bg-blue-500/10 dark:bg-blue-950/25 border border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-2xl p-4 mb-6 text-xs font-fredoka text-left flex items-start gap-3 max-w-lg mx-auto">
              <i className="fa-solid fa-shield-halved text-lg text-blue-500 shrink-0 mt-0.5"></i>
              <div>
                <strong className="font-bold">Pimo Guard Protection:</strong> Google will <span className="underline">NOT</span> ban you! 🌟 This is a fun in-game robot checker built for zone selection. It is completely safe, does not store images, and has absolutely zero connection to your real Google Account or any ban systems. You are 100% safe to enjoy the game!
              </div>
            </div>

            {/* Webcam container */}
            {!scanResult ? (
              <>
                {!hasRequestedCamera ? (
                  <div className="bg-slate-100 dark:bg-[#111214] border border-slate-200 dark:border-[#2C2E33] rounded-[2rem] p-6 mb-6 text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200 dark:border-purple-900/30">
                      <i className="fa-solid fa-camera text-3xl"></i>
                    </div>
                    <h4 className="font-fredoka text-lg text-slate-800 dark:text-slate-100 mb-2 font-bold">Secure Face Scanning</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans max-w-sm mx-auto mb-6">
                      Pimo Bot uses a fast camera scan to verify your zone. We do not store any photos. You can also upload an image, or set your age manually below!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <button
                        onClick={() => {
                          setHasRequestedCamera(true);
                          playSound(800);
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-fredoka text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fa-solid fa-camera"></i> Scan My Face
                      </button>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id="face-photo-upload-intro"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                        <label
                          htmlFor="face-photo-upload-intro"
                          className="w-full sm:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-fredoka text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300 dark:border-slate-700"
                        >
                          <i className="fa-solid fa-cloud-arrow-up"></i> Upload Photo
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-900/10 dark:border-white/10 mb-6 shadow-inner flex items-center justify-center">
                    {cameraActive ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-slate-400">
                        {cameraError ? (
                          <div className="text-center p-6 max-w-md">
                            <i className="fa-solid fa-camera-slash text-4xl text-red-500 mb-3 animate-pulse"></i>
                            <p className="font-fredoka text-sm text-slate-300 mb-1">{cameraError}</p>
                            <p className="text-[10px] text-slate-500 font-mono mb-4 leading-relaxed">
                              Troubleshoot: Click the camera/lock icon in your browser's address bar & set camera to 'Allow', then refresh or retry.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                              <button
                                onClick={startCamera}
                                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-fredoka text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
                              >
                                <i className="fa-solid fa-arrows-rotate"></i> Retry Camera
                              </button>
                              
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  id="face-photo-upload"
                                  className="hidden"
                                  onChange={handlePhotoUpload}
                                />
                                <label
                                  htmlFor="face-photo-upload"
                                  className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-fredoka text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
                                >
                                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload Photo Instead
                                </label>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-red-500 mb-3"></i>
                            <p className="font-fredoka text-sm text-slate-300 animate-pulse">Starting camera stream...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scanning overlay effect */}
                    {isScanning && (
                      <>
                        <div className="absolute inset-0 bg-purple-500/10 pointer-events-none"></div>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500 shadow-[0_0_15px_#a855f7] animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/60 px-6 py-3 rounded-2xl border border-purple-500/30 text-red-400 font-mono text-xs tracking-wider uppercase animate-pulse">
                            <i className="fa-solid fa-radar fa-spin mr-2"></i> Analyzing Face...
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {hasRequestedCamera && !cameraError && (
                  <div className="mb-6 flex justify-center items-center gap-2 text-xs">
                    <span className="text-slate-400 font-fredoka">Prefer not to use camera?</span>
                    <input
                      type="file"
                      accept="image/*"
                      id="face-photo-upload-direct"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <label
                      htmlFor="face-photo-upload-direct"
                      className="text-red-400 hover:text-red-300 underline font-fredoka cursor-pointer font-bold transition-colors"
                    >
                      Upload a photo instead
                    </label>
                  </div>
                )}
              </>
            ) : (
              /* Scan result area */
              <div className="bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 rounded-[2rem] p-6 mb-6 text-left relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                    <i className="fa-solid fa-robot text-2xl text-red-500 animate-bounce"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-fredoka text-lg text-red-600 dark:text-red-400 mb-1 font-bold">Pimo Bot Scanner</h4>
                    <p className="text-slate-700 dark:text-slate-300 font-fredoka leading-relaxed mb-4">
                      "{scanResult.reasoning}"
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border-t border-purple-500/10 pt-4 mt-2">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-mono">Guessed Age</div>
                        <div className="text-3xl font-fredoka font-black text-slate-900 dark:text-white">
                          {scanResult.age} <span className="text-sm font-medium opacity-70">years old</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-mono">Assigned Zone</div>
                        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-fredoka font-bold border uppercase tracking-wide ${
                          scanResult.age < 6 ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' : 
                          scanResult.age < 9 ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' : 
                          'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                        }`}>
                          {scanResult.age < 6 ? 'Pimo Kids 👶' : scanResult.age < 9 ? 'Pimo Select 👦' : 'Wipeout Pimo 🥷'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-4">
              {!scanResult ? (
                hasRequestedCamera && (
                  <button
                    disabled={!cameraActive || isScanning}
                    onClick={handleScanFace}
                    className="w-full bg-purple-600 text-white disabled:opacity-40 font-fredoka py-4 rounded-[2rem] text-xl flex items-center justify-center gap-3 hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98]"
                  >
                    {isScanning ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        SCANNING YOUR FACE...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-face-viewfinder"></i>
                        SCAN MY FACE
                      </>
                    )}
                  </button>
                )
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setScanResult(null);
                      startCamera();
                      playSound(800);
                    }}
                    className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-fredoka py-4 rounded-[2rem] text-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                  >
                    <i className="fa-solid fa-arrow-rotate-right mr-2"></i> Re-scan Face
                  </button>
                  <button
                    onClick={() => {
                      setAgeVerified(true);
                      setUserAge(scanResult.age);
                      localStorage.setItem('moro_age_verified', 'true');
                      localStorage.setItem('moro_user_age', String(scanResult.age));
                      setShowAgeVerification(false);
                      playSound(1000);
                    }}
                    className="flex-[1.5] bg-purple-600 text-white font-fredoka py-4 rounded-[2rem] text-lg hover:bg-purple-700 transition-all shadow-lg active:scale-[0.98]"
                  >
                    Continue to Game <i className="fa-solid fa-arrow-right ml-2 animate-pulse"></i>
                  </button>
                </div>
              )}

              {/* Manual selection fallback / override option */}
              <div className="border-t border-slate-900/10 dark:border-white/10 mt-4 pt-6 text-left">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-mono text-center mb-4">
                  Or choose your age manually
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setAgeVerified(true);
                      setUserAge(4);
                      localStorage.setItem('moro_age_verified', 'true');
                      localStorage.setItem('moro_user_age', '4');
                      setShowAgeVerification(false);
                      playSound(800);
                    }}
                    className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-fredoka py-2.5 rounded-2xl hover:bg-green-500/20 transition-all text-xs text-center flex flex-col items-center justify-center"
                  >
                    <span className="font-bold">Under 6</span>
                    <span className="opacity-60 text-[9px]">Kids Zone</span>
                  </button>
                  <button
                    onClick={() => {
                      setAgeVerified(true);
                      setUserAge(7);
                      localStorage.setItem('moro_age_verified', 'true');
                      localStorage.setItem('moro_user_age', '7');
                      setShowAgeVerification(false);
                      playSound(800);
                    }}
                    className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-fredoka py-2.5 rounded-2xl hover:bg-blue-500/20 transition-all text-xs text-center flex flex-col items-center justify-center"
                  >
                    <span className="font-bold">6 to 8</span>
                    <span className="opacity-60 text-[9px]">Select Zone</span>
                  </button>
                  <button
                    onClick={() => {
                      setAgeVerified(true);
                      setUserAge(9);
                      localStorage.setItem('moro_age_verified', 'true');
                      localStorage.setItem('moro_user_age', '9');
                      setShowAgeVerification(false);
                      playSound(800);
                    }}
                    className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-fredoka py-2.5 rounded-2xl hover:bg-red-500/20 transition-all text-xs text-center flex flex-col items-center justify-center"
                  >
                    <span className="font-bold">9 or older</span>
                    <span className="opacity-60 text-[9px]">Wipeout Zone</span>
                  </button>
                </div>
              </div>

              {!scanResult && (
                <button
                  onClick={() => {
                    setAgeVerified(true);
                    setUserAge(0); // Under 6 default
                    localStorage.setItem('moro_age_verified', 'true');
                    localStorage.setItem('moro_user_age', '0');
                    setShowAgeVerification(false);
                    playSound(800);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-fredoka underline text-xs mt-2"
                >
                  Skip and default to Under 6
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showGuestPrompt && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-xl">
            <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-8">Are you a boy or a girl?</h3>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  setShowGuestPrompt(false);
                  setWardrobeTab(MarketplaceItemType.GUEST);
                  setShowWardrobe(true);
                  // Equip boy
                  const boyChar = CHARACTERS.find(c => c.id === 'guest-boy');
                  if (boyChar) {
                    setSelectedCharacter(prev => {
                      const n = { ...prev, ...boyChar };
                      localStorage.setItem('moro_selected_character', JSON.stringify(n));
                      return n;
                    });
                  }
                  playSound(600);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-fredoka py-4 rounded-2xl text-xl w-full transition-colors"
              >
                Boy 👦
              </button>
              <button 
                onClick={() => {
                  setShowGuestPrompt(false);
                  setWardrobeTab(MarketplaceItemType.GUEST);
                  setShowWardrobe(true);
                  // Equip girl
                  const girlChar = CHARACTERS.find(c => c.id === 'guest-girl');
                  if (girlChar) {
                    setSelectedCharacter(prev => {
                      const n = { ...prev, ...girlChar };
                      localStorage.setItem('moro_selected_character', JSON.stringify(n));
                      return n;
                    });
                  }
                  playSound(600);
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white font-fredoka py-4 rounded-2xl text-xl w-full transition-colors"
              >
                Girl 👧
              </button>
              <button 
                onClick={() => setShowGuestPrompt(false)}
                className="mt-4 text-slate-500 hover:text-slate-900 dark:text-white font-fredoka"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {gameState === GameState.MAP_EDITOR && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[120]"
          >
            <MapCreator 
              isUnlocked={isMapEditorUnlocked} 
              onBack={() => setGameState(GameState.MENU)} 
              onUnlock={handleUnlockMapEditor}
              morobux={totalPimobux}
              language={language}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => { setShowProfileModal(false); playSound(1000); }} 
        onSave={handleSaveProfilePic} 
        isMoroPlus={isMoroPlus}
        language={language}
        username={userProfile?.username || playerName}
        highScore={highScore}
        onOpenAuth={() => {
          setAuthModalInitialMode('login');
          setShowAuthModal(true);
          playSound(800);
        }}
      />

      {/* Wipeout Pimo Sign In & Sign Up Modal */}
      <RobloxAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          playSound(1000);
        }}
        initialMode={authModalInitialMode}
        language={language}
        onGoogleSignIn={handleCloudSync}
        onDirectGoogleSignIn={handleDirectGoogleSignIn}
        onSuccess={(data) => {
          setPlayerName(data.username);
          localStorage.setItem('moro_player_name', data.username);
          setUserAge(data.age);
          localStorage.setItem('moro_user_age', String(data.age));
          setAgeVerified(true);
          localStorage.setItem('moro_age_verified', 'true');
          
          if (data.gender === 'female') {
            setSelectedCharacter(CHARACTERS[1] || CHARACTERS[0]);
          } else if (data.gender === 'male') {
            setSelectedCharacter(CHARACTERS[0]);
          }
          
          playSound(1200);
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 }
          });
        }}
      />

      <AIAssistant 
        isOpen={showAIAssistant} 
        onClose={() => { setShowAIAssistant(false); playSound(1000); }} 
        playerStats={{
          highScore,
          totalMorobux: totalPimobux,
          totalPimobux,
          selectedCharacter,
          selectedDifficulty
        }}
        language={language}
      />

      <ControllerModal
        isOpen={showControllerModal}
        onClose={() => { setShowControllerModal(false); playSound(1000); }}
        connectedController={connectedController}
        setConnectedController={setConnectedController}
        language={language}
        ios27Animations={ios27Animations}
        activeBattery={activeBattery}
        simulatedBatteryMode={simulatedBatteryMode}
        setSimulatedBatteryMode={setSimulatedBatteryMode}
        playLowBatteryAlarm={playLowBatteryAlarm}
        onUpdateBattery={updateRealBattery}
      />

      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-50 dark:bg-[#151619] border border-slate-900/20 dark:border-white/20 rounded-[2.5rem] p-6 max-w-md w-full shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-red-500"></div>
              
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
                    <i className="fa-solid fa-bell text-amber-500"></i>
                    {getTranslation('NOTIFICATIONS', language)}
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                      {notifications.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Stay updated with game alerts, rewards & invites</p>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-[11px] border-b border-slate-200 dark:border-slate-800">
                {['All', 'Rewards', 'System', 'Event', 'Social'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setNotificationCategoryFilter(cat); playSound(700); }}
                    className={`px-3 py-1 rounded-xl font-mono uppercase font-bold text-[10px] shrink-0 transition-all ${
                      notificationCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-200/50 dark:bg-[#1E2024] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Notifications List Container */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {/* Pending Friend Requests Section */}
                {incomingRequest && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col gap-3">
                    <p className="text-slate-900 dark:text-white font-bold text-xs flex items-center justify-between">
                      <span><i className="fa-solid fa-user-plus text-amber-500 mr-2"></i>@{incomingRequest.username} sent you a request!</span>
                      <span className="text-[10px] text-amber-500 font-mono font-bold">FRIEND REQ</span>
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { handleAcceptRequest(); playSound(600); }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        {getTranslation('ACCEPT', language)}
                      </button>
                      <button 
                        onClick={() => { handleDeclineRequest(); playSound(400); }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        {getTranslation('DECLINE', language)}
                      </button>
                    </div>
                  </div>
                )}

                {(() => {
                  const filteredNotifs = notifications.filter(n => 
                    notificationCategoryFilter === 'All' || n.category === notificationCategoryFilter
                  );

                  if (filteredNotifs.length === 0 && !incomingRequest) {
                    return (
                      <div className="py-10 text-center">
                        <div className="w-16 h-16 bg-slate-200/50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                          <i className="fa-solid fa-inbox text-2xl text-slate-400"></i>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">No notifications in {notificationCategoryFilter}</p>
                      </div>
                    );
                  }

                  return filteredNotifs.map((notif, idx) => {
                    const originalIndex = notifications.indexOf(notif);
                    return (
                      <div key={notif.id || idx} className="bg-white dark:bg-[#1A1C20] border border-slate-200/80 dark:border-[#282B30] p-3.5 rounded-2xl flex gap-3.5 items-start hover:border-amber-500/40 transition-all group relative">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm shrink-0 border border-amber-500/20">
                          <i className={notif.icon || 'fa-solid fa-circle-info'}></i>
                        </div>

                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-slate-900 dark:text-white font-bold text-xs truncate">{notif.title}</p>
                            {notif.category && (
                              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#25282D] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 shrink-0">
                                {notif.category}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-xs leading-snug">{notif.message}</p>
                          
                          {/* Action Button if available */}
                          {notif.actionType === 'claim_bux' && (
                            <button
                              onClick={() => {
                                setTotalPimobux(prev => prev + (notif.rewardBux || 50));
                                playSound(800);
                                setNotifications(prev => prev.filter((_, i) => i !== originalIndex));
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl font-black text-xs shadow-md transition-all active:scale-95"
                            >
                              <i className="fa-solid fa-coins"></i> Claim +{notif.rewardBux || 50} PimoBux
                            </button>
                          )}

                          {notif.actionType === 'open_achievements' && (
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                setShowAchievementsModal(true);
                                playSound(800);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                            >
                              <i className="fa-solid fa-trophy"></i> View Achievements
                            </button>
                          )}

                          <span className="text-[10px] text-slate-400 mt-1.5 block font-mono">{notif.time || 'Just now'}</span>
                        </div>

                        {/* Single Dismiss Button */}
                        <button
                          onClick={() => {
                            setNotifications(prev => prev.filter((_, i) => i !== originalIndex));
                            playSound(400);
                          }}
                          className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors p-1 opacity-60 hover:opacity-100"
                          title="Dismiss"
                        >
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Bottom Actions Bar */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => {
                    const newTestNotif = {
                      id: Date.now().toString(),
                      title: '🎁 Bonus PimoBux Drop!',
                      message: 'You received an instant secret daily reward!',
                      icon: 'fa-solid fa-gift',
                      time: 'Just now',
                      category: 'Rewards',
                      actionType: 'claim_bux',
                      rewardBux: 75
                    };
                    setNotifications(prev => [newTestNotif, ...prev]);
                    playSound(900);
                  }}
                  className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <i className="fa-solid fa-plus-circle"></i> Test Reward
                </button>
                <button 
                  onClick={() => { setNotifications([]); playSound(600); }}
                  className="px-4 bg-slate-200/60 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Clear all
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddFriendModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-xl animate-in fade-in duration-300">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-8 max-w-sm w-full shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white">{getTranslation('ADD_FRIEND', language)}</h3>
                <button 
                  onClick={() => setShowAddFriendModal(false)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={getTranslation('SEARCH_USER', language)}
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-slate-900/10 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-fredoka text-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <i className="fa-solid fa-magnifying-glass absolute right-6 top-1/2 -translate-y-1/2 text-slate-400"></i>
                </div>

                {userProfile && (
                  <p className="text-center text-slate-400 text-xs font-fredoka opacity-60">
                    Your username: <span className="text-blue-500 font-bold">@{userProfile.username}</span>
                  </p>
                )}

                {friendReqSent ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/10 border border-green-500/30 text-green-500 py-4 rounded-2xl text-center font-fredoka flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-circle-check"></i>
                    {getTranslation('FRIEND_REQUEST_SENT', language)}
                  </motion.div>
                ) : (
                  <button 
                    disabled={!searchName || isSearching}
                    onClick={handleAddFriend}
                    className={`w-full font-fredoka py-4 rounded-2xl text-xl transition-all ${
                      !searchName || isSearching
                        ? 'bg-slate-900/5 dark:bg-white/5 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white shadow-[0_6px_0_#1e40af] hover:translate-y-1 active:translate-y-3 active:shadow-none'
                    }`}
                  >
                    {isSearching ? (
                      <i className="fa-solid fa-circle-notch animate-spin"></i>
                    ) : getTranslation('SEND_FRIEND_REQUEST', language)}
                  </button>
                )}
                {currentUser && (
                    <div className="pt-6 border-t border-slate-900/10 dark:border-white/10 mt-6">
                        <p className="text-slate-500 font-fredoka text-xs mb-2">Share your invite link:</p>
                        <div className="flex gap-2">
                           <input 
                             type="text" 
                             readOnly
                             value={`https://ais-pre-u3duggwoolvbawvaxoqlcr-7520112076.us-west2.run.app/?id=${currentUser.uid}`}
                             className="flex-1 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-300 font-mono text-xs"
                           />
                           <button 
                              onClick={() => {
                                const shareUrl = `https://ais-pre-u3duggwoolvbawvaxoqlcr-7520112076.us-west2.run.app/?id=${currentUser.uid}`;
                                navigator.clipboard.writeText(shareUrl);
                                alert("Link copied!");
                              }}
                              className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
                           >
                              Copy
                           </button>
                        </div>
                    </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedExperienceDetail && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#191B1D] border border-[#2D3033] rounded-2xl max-w-3xl w-full text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans"
            >
              {/* Header Hero Banner */}
              <div className={`relative h-44 sm:h-52 ${selectedExperienceDetail.bgClass || 'bg-gradient-to-r from-purple-700 to-indigo-900'} p-6 flex flex-col justify-between overflow-hidden shrink-0`}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#191B1D] via-transparent to-black/30 z-10"></div>
                <button
                  onClick={() => setSelectedExperienceDetail(null)}
                  className="relative z-20 self-end w-9 h-9 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white border border-white/20 transition-all"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="relative z-20">
                  <span className="bg-[#00A2FF] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-md inline-block mb-1.5">
                    {selectedExperienceDetail.tag || 'EXPERIENCE'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                    {selectedExperienceDetail.title}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-semibold">
                    <PimoStudiosLogo variant="icon" size={16} animated={false} />
                    <span>By Pimo Studios</span>
                    <i className="fa-solid fa-circle-check text-red-500 text-xs" title="Official Studio"></i>
                  </p>
                </div>
              </div>

              {/* Action Bar with Giant Roblox Green Play Button */}
              <div className="p-5 bg-[#232527] border-b border-[#2D3033] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  {/* Giant Roblox Play Button */}
                  <button
                    onClick={() => {
                      const exp = selectedExperienceDetail;
                      setSelectedExperienceDetail(null);
                      exp.action();
                    }}
                    className="bg-[#00B06F] hover:bg-[#00C87E] active:scale-95 text-white font-black text-lg px-9 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-play text-xl ml-0.5"></i>
                    <span>PLAY</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span>{selectedExperienceDetail.active || '12.4K'} Playing</span>
                  </div>
                </div>

                {/* Ratings & Stats Badges */}
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1 text-green-400">
                    <i className="fa-solid fa-thumbs-up"></i> {selectedExperienceDetail.likes || '95%'}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <i className="fa-solid fa-star"></i> 82.4K
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-eye"></i> 1.8M
                  </span>
                </div>
              </div>

              {/* Roblox Experience Tabs */}
              <div className="bg-[#191B1D] border-b border-[#2D3033] px-6 flex gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <button
                  onClick={() => setExperienceTab('about')}
                  className={`py-3 transition-colors ${experienceTab === 'about' ? 'text-white border-b-2 border-[#00A2FF]' : 'hover:text-white'}`}
                >
                  About
                </button>
                <button
                  onClick={() => setExperienceTab('store')}
                  className={`py-3 transition-colors ${experienceTab === 'store' ? 'text-white border-b-2 border-[#00A2FF]' : 'hover:text-white'}`}
                >
                  Store & Passes
                </button>
                <button
                  onClick={() => setExperienceTab('servers')}
                  className={`py-3 transition-colors ${experienceTab === 'servers' ? 'text-white border-b-2 border-[#00A2FF]' : 'hover:text-white'}`}
                >
                  Servers
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {experienceTab === 'about' && (
                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                    <h3 className="font-bold text-white text-base">Description</h3>
                    <p>{selectedExperienceDetail.desc}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#2D3033] text-xs">
                      <div className="bg-[#232527] p-3 rounded-xl border border-[#2D3033]">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Genre</span>
                        <span className="font-bold text-white mt-1 block">Racing / Action</span>
                      </div>
                      <div className="bg-[#232527] p-3 rounded-xl border border-[#2D3033]">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Max Server</span>
                        <span className="font-bold text-white mt-1 block">10 Players</span>
                      </div>
                      <div className="bg-[#232527] p-3 rounded-xl border border-[#2D3033]">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Updated</span>
                        <span className="font-bold text-white mt-1 block">Today</span>
                      </div>
                      <div className="bg-[#232527] p-3 rounded-xl border border-[#2D3033]">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Voice Chat</span>
                        <span className="font-bold text-green-400 mt-1 block">Enabled</span>
                      </div>
                    </div>
                  </div>
                )}

                {experienceTab === 'store' && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-white text-base mb-2">Game Passes & Gear</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'pass_speed', title: 'Speed Kart Boost', desc: '+25% Max Velocity in all maps', price: 100, icon: 'fa-bolt text-yellow-400' },
                        { id: 'pass_double_jump', title: 'Double Jump Wings', desc: 'Jump twice in mid-air to escape obstacles', price: 150, icon: 'fa-angles-up text-blue-400' },
                        { id: 'pass_vip', title: 'VIP Player Crown', desc: 'Special VIP tag & golden trail effect', price: 200, icon: 'fa-crown text-[#FFD700]' },
                        { id: 'pass_shield', title: 'Extra Life Shield', desc: 'Start races with +1 bonus heart shield', price: 120, icon: 'fa-shield-halved text-green-400' }
                      ].map((pass) => {
                        const isPurchased = purchasedPasses.includes(pass.id);
                        return (
                          <div key={pass.id} className="bg-[#232527] border border-[#2D3033] p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-black/40 border border-[#393B3D] flex items-center justify-center text-lg">
                                <i className={`fa-solid ${pass.icon}`}></i>
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm">{pass.title}</h4>
                                <p className="text-xs text-slate-400">{pass.desc}</p>
                              </div>
                            </div>
                            {isPurchased ? (
                              <span className="text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg">
                                OWNED
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (totalPimobux >= pass.price) {
                                    setTotalPimobux(prev => prev - pass.price);
                                    const next = [...purchasedPasses, pass.id];
                                    setPurchasedPasses(next);
                                    localStorage.setItem('moro_purchased_passes', JSON.stringify(next));
                                    playSound(1200);
                                  } else {
                                    alert("Not enough PimoBux! Buy more in PimoBux Store.");
                                  }
                                }}
                                className="bg-[#232527] hover:bg-[#323539] border border-[#393B3D] text-yellow-400 hover:text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                              >
                                <PimobuxIcon className="w-3.5 h-3.5" />
                                {pass.price}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {experienceTab === 'servers' && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-white text-base mb-2">Active Servers</h3>
                    {[
                      { id: 'us_west', region: 'US-West (San Francisco)', ping: '18ms', players: '8/10' },
                      { id: 'eu_central', region: 'EU-Central (Frankfurt)', ping: '42ms', players: '6/10' },
                      { id: 'asia_tokyo', region: 'Asia-East (Tokyo)', ping: '85ms', players: '9/10' }
                    ].map((server) => (
                      <div key={server.id} className="bg-[#232527] border border-[#2D3033] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">{server.region}</h4>
                          <p className="text-xs text-slate-400 font-mono">Ping: {server.ping} • Players: {server.players}</p>
                        </div>
                        <button
                          onClick={() => {
                            const exp = selectedExperienceDetail;
                            setSelectedExperienceDetail(null);
                            exp.action();
                          }}
                          className="bg-[#00A2FF] hover:bg-[#0082CC] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          Join Server
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Play Games Achievement Unlock Toast Banner */}
      <AchievementBanner
        achievement={activeAchievementToast}
        onDismiss={() => setActiveAchievementToast(null)}
      />

      {/* Google Play / Xbox Achievements Modal */}
      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        unlockedMap={unlockedAchievements}
      />

      {/* Desktop / Mobile PWA Install Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredInstallPrompt}
        onTriggerInstall={triggerPwaInstall}
      />

      <AnimatePresence>
          {gameState === GameState.CREDITS && (
            <CreditsScreen
              onBack={() => setGameState(GameState.MENU)}
              language={language}
              music={creditsAudio}
            />
          )}
      </AnimatePresence>
    </div>
    </Suspense>
    </AnimationProvider>
  );
};

export default App;