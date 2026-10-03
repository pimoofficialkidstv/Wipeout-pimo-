import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GameState,
  Character,
  Difficulty,
  MapType,
  Controls,
  MapData,
  Obstacle,
} from "../types";
import {
  JUMP_FORCE,
  MOVE_SPEED,
  DASH_SPEED_BOOST,
  DASH_DURATION,
} from "../constants.tsx";
import { getTranslation } from "../src/translations";
import { getMoroVoice, playAudio } from "../src/services/ttsService";
import { db, auth } from "../src/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

import MorobuxIcon from "./MorobuxIcon";
import Moro3D from "./Moro3D";
import TutorialCoach, { TutorialProgress } from "./TutorialCoach";
import { restoreAllUIInteractivity } from "../src/lib/uiInteractivity";
import { SoundtrackWidget } from "./SoundtrackWidget";

interface GameProps {
  character: Character;
  onGameOver: (score: number, morobux: number, mikets: number) => void;
  onQuit: () => void;
  onExitToMenu?: (targetState?: GameState) => void;
  onSettings: () => void;
  gameState: GameState;
  difficulty: Difficulty;
  mapType: MapType;
  customMapData?: MapData;
  controls: Controls;
  showMorobux?: boolean;
  showPimobux?: boolean;
  showStars: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  language: string;
  roomId?: string;
  kartVehicle?: string;
  kartHelmet?: string;
  playerName?: string;
  onCollectItem?: (type: "morobux" | "miket") => void;
  ios27Animations?: boolean;
  onTriggerAchievement?: (id: string) => void;
  hudSettings?: {
    showDistance?: boolean;
    showMoroBux?: boolean;
    showPimoBux?: boolean;
    showMiniMap?: boolean;
  };
}

const difficultyConfig = {
  [Difficulty.EASY]: { baseSpeed: 4, freq: 110, gravity: 0.45, scoreMult: 0.8 },
  [Difficulty.NORMAL]: { baseSpeed: 6, freq: 85, gravity: 0.5, scoreMult: 1.0 },
  [Difficulty.HARD]: { baseSpeed: 9, freq: 65, gravity: 0.55, scoreMult: 1.5 },
  [Difficulty.EXPERT]: {
    baseSpeed: 12,
    freq: 50,
    gravity: 0.6,
    scoreMult: 2.5,
  },
  [Difficulty.INSANE]: {
    baseSpeed: 16,
    freq: 40,
    gravity: 0.7,
    scoreMult: 5.0,
  },
};

const Game: React.FC<GameProps> = ({
  character,
  onGameOver,
  onQuit,
  onExitToMenu,
  onSettings,
  gameState,
  difficulty,
  mapType,
  customMapData,
  controls,
  showMorobux,
  showStars,
  soundEnabled,
  musicEnabled,
  language,
  roomId,
  kartVehicle,
  kartHelmet,
  playerName,
  onCollectItem,
  ios27Animations,
  onTriggerAchievement,
  hudSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [gameScore, setGameScore] = useState(0);

  // Restore UI responsiveness on component unmount
  useEffect(() => {
    return () => {
      restoreAllUIInteractivity();
    };
  }, []);
  const [customMapImage, setCustomMapImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [morobuxCollected, setMorobuxCollected] = useState(0);
  const [miketsCollected, setMiketsCollected] = useState(0);
  const [timeLeftDisplay, setTimeLeftDisplay] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [isAITalking, setIsAITalking] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showEmoteWheel, setShowEmoteWheel] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [heartsDisplay, setHeartsDisplay] = useState(() =>
    localStorage.getItem("moro_3_hearts_mode") === "true" ? 3 : 1,
  );
  const [activePressedKeys, setActivePressedKeys] = useState<{
    left: boolean;
    right: boolean;
    jump: boolean;
    dash: boolean;
  }>({ left: false, right: false, jump: false, dash: false });
  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgress>({
    step: 0,
    movedLeft: false,
    movedRight: false,
    jumped: false,
    doubleJumped: false,
    dashed: false,
    smashedBlock: false,
    collectedCoin: false,
    collectedPowerup: false,
    reachedFinish: false,
    distance: 0,
  });

  const useItem = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentItem) return;

    if (s.currentItem === "banana") {
      // Slip an obstacle
      const target = s.obstacles.find(
        (o) => o.x > s.playerX && o.x < s.playerX + 400,
      );
      if (target) {
        target.vx = 5;
        target.vy = -10;
        target.isKicked = true;
        playSound("kick");
      }
    } else if (s.currentItem === "ghost") {
      // Scare opponents
      s.opponents.forEach((o) => {
        if (!o.finished) {
          o.vx *= 0.5;
        }
      });
    } else if (s.currentItem === "anti_ball") {
      // Balls slip
      s.obstacles.forEach((o) => {
        if (o.type === "ball") {
          o.vx = 10;
          o.vy = -5;
          o.isKicked = true;
        }
      });
    }

    s.currentItem = null;
    playSound("powerup");
  }, [soundEnabled, character]);

  const playMoroVoice = async (text: string) => {
    setIsTalking(true);
    try {
      const audioBase64 = await getMoroVoice(text);
      if (audioBase64) {
        await playAudio(audioBase64);
      } else {
        // Fallback to Web Speech API
        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.pitch = 1.5;
          utterance.rate = 1.2;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          if (window.speechSynthesis) {
            window.speechSynthesis.speak(utterance);
          } else {
            resolve();
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTalking(false);
    }
  };

  const stateRef = useRef({
    playerX: 150,
    playerY: 300,
    playerVY: 0,
    playerRotation: 0,
    obstacles: [] as {
      x: number;
      y: number;
      type: string;
      id: number;
      vx?: number;
      vy?: number;
      isKicked?: boolean;
      isWarning?: boolean;
      charge?: number;
      phase?: number;
      seed?: number;
    }[],
    particles: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
      type?: string;
    }[],
    frameCount: 0,
    isJumping: false,
    score: 0,
    tutorialDistance: 0,
    morobux: 0,
    mikets: 0,
    isKicked: false,
    kickEffectTimer: 0,
    dashTimer: 0,
    shieldTimer: 0,
    boostTimer: 0,
    magnetTimer: 0,
    trophyTimer: 0,
    morobuxCollectTimer: 0,
    timeLeft: mapType === MapType.CLASSED ? 60 : 0,
    timeBonuses: [] as { x: number; y: number; text: string; timer: number }[],
    coachTip: "",
    coachTipTimer: 0,
    input: { left: false, right: false },
    gamepadInput: { left: false, right: false },
    shake: 0,
    blinkTimer: 0,
    lastInputTime: Date.now(), // Pour l'auto-quit
    lastButtonState: [] as boolean[],
    lastJumpPressed: false,
    lastDashPressed: false,
    lastItemPressed: false,
    lastPausePressed: false,
    hearts: localStorage.getItem("moro_3_hearts_mode") === "true" ? 3 : 1,
    invincibilityTimer: 0,
    jumpProgress: 0,
    jumpCount: 0,
    hasWon: false,
    otherPlayers: {} as Record<
      string,
      {
        x: number;
        y: number;
        rotation: number;
        isKicked: boolean;
        isBlinking: boolean;
        isKicking: boolean;
        character: Character;
      }
    >,
    // Racing state
    raceCountdown: mapType === MapType.MORO_KART ? 240 : 0,
    laps: 1,
    maxLaps: 3,
    raceFinished: false,
    raceResults: [] as { name: string; place: number }[],
    currentItem: null as string | null,
    isSlipping: 0,
    ghostTimer: 0,
    opponents: [] as {
      name: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
      laps: number;
      finished: boolean;
      item: string | null;
      id: number;
      character?: Character;
      vehicle?: string;
      obstacleType?: string;
    }[],
    finishLineX: 0,
  });

  const onGameOverRef = useRef(onGameOver);
  const onQuitRef = useRef(onQuit);
  const characterRef = useRef(character);
  const playerNameRef = useRef(playerName);
  const showMorobuxRef = useRef(showMorobux);
  const showStarsRef = useRef(showStars);
  const mapTypeRef = useRef(mapType);
  const kartVehicleRef = useRef(kartVehicle);
  const kartHelmetRef = useRef(kartHelmet);
  const languageRef = useRef(language);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onQuitRef.current = onQuit;
    characterRef.current = character;
    playerNameRef.current = playerName;
    showMorobuxRef.current = showMorobux;
    showStarsRef.current = showStars;
    mapTypeRef.current = mapType;
    kartVehicleRef.current = kartVehicle;
    kartHelmetRef.current = kartHelmet;
    languageRef.current = language;
    soundEnabledRef.current = soundEnabled;
  });

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      const s = stateRef.current;
      s.score = 0;
      s.playerX = 150;
      s.playerY = 300;
      s.playerVY = 0;
      s.obstacles = [];
      s.particles = [];
      s.frameCount = 0;
      s.isKicked = false;
      s.isJumping = false;
      s.dashTimer = 0;
      s.shieldTimer = 0;
      s.boostTimer = 0;
      s.magnetTimer = 0;
      s.trophyTimer = 0;
      s.morobux = 0;
      s.mikets = 0;
      s.timeLeft = mapType === MapType.CLASSED ? 60 : 0;
      s.raceCountdown = mapType === MapType.MORO_KART ? 240 : 0;
      s.laps = 1;
      s.raceFinished = false;
      s.raceResults = [];
      s.opponents = [];
      s.isSlipping = 0;
      s.ghostTimer = 0;
      s.currentItem = null;
      s.jumpCount = 0;
      setGameScore(0);
      setMorobuxCollected(0);
      setMiketsCollected(0);
      if (mapType === MapType.CLASSED) setTimeLeftDisplay(60);
      if (mapType === MapType.TUTORIAL) {
        s.tutorialDistance = 0;
        setIsAITalking(false);
        setTutorialProgress({
          step: 0,
          movedLeft: false,
          movedRight: false,
          jumped: false,
          doubleJumped: false,
          dashed: false,
          smashedBlock: false,
          collectedCoin: false,
          collectedPowerup: false,
          reachedFinish: false,
          distance: 0,
        });
      }

      // Trigger initial achievements
      onTriggerAchievement?.('first_run');
      if (mapType === MapType.MORO_KART) onTriggerAchievement?.('kart_master');
      if (mapType === MapType.CLASSED || roomId || mapType === MapType.AGAINST_BOT) onTriggerAchievement?.('social_hero');
      if (localStorage.getItem("moro_3_hearts_mode") === "true") onTriggerAchievement?.('heart_shield');
    }
  }, [gameState, mapType, roomId, onTriggerAchievement]);

  const OBSTACLE_CHARACTERS: Record<string, Character> = {
    bot: {
      id: "bot",
      name: "Pimo Bot",
      bodyColor: "#475569",
      accessoryColor: "#1e293b",
      faceId: "face-default",
      emoji: "🤖",
      description: "",
      image: "",
    },
    ninja: {
      id: "ninja",
      name: "Pimo Ninja",
      bodyColor: "#0f172a",
      accessoryColor: "#020617",
      faceId: "face-angry",
      emoji: "🥷",
      description: "",
      image: "",
    },
    flyer: {
      id: "flyer",
      name: "Pimo Flyer",
      bodyColor: "#64748b",
      accessoryColor: "#334155",
      faceId: "face-cool",
      emoji: "🛸",
      description: "",
      image: "",
    },
    jumper: {
      id: "jumper",
      name: "Pimo Jumper",
      bodyColor: "#10b981",
      accessoryColor: "#047857",
      faceId: "face-uwu",
      emoji: "🐸",
      description: "",
      image: "",
    },
    fat: {
      id: "fat",
      name: "Pimo Boss",
      bodyColor: "#6366f1",
      accessoryColor: "#4338ca",
      faceId: "face-angry",
      emoji: "👹",
      description: "",
      image: "",
    },
  };

  const playSound = (type: string) => {
    if (!soundEnabled) return;
    if (!audioCtxRef.current)
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === "jump") {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    } else if (type === "gem") {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1600, now);
      osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.1);
      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc2.start();
      osc2.stop(now + 0.1);
    } else if (type === "kick") {
      osc.type = "square";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.4);
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      noise.start();
    } else if (type === "powerup") {
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    }
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start();
    osc.stop(now + 0.3);
  };

  const resetActivity = () => {
    stateRef.current.lastInputTime = Date.now();
  };

  const jump = useCallback(() => {
    resetActivity();
    const s = stateRef.current;
    if (
      !isPaused &&
      !isAITalking &&
      !s.isKicked
    ) {
      if (!s.isJumping) {
        s.playerVY = JUMP_FORCE;
        s.isJumping = true;
        s.jumpCount = 1;
        playSound("jump");
        if (mapType === MapType.TUTORIAL) {
          setTutorialProgress((p) => (p.step === 2 && !p.jumped ? { ...p, jumped: true } : p));
        }
      } else if (s.jumpCount === 1) {
        s.playerVY = JUMP_FORCE * 0.85;
        s.jumpCount = 2;
        playSound("jump");
        for (let p = 0; p < 6; p++) {
          s.particles.push({
            x: s.playerX + 25,
            y: s.playerY + 50,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 3,
            life: 30,
            maxLife: 30,
            size: Math.random() * 4 + 2,
            color: "#38bdf8",
          });
        }
        if (mapType === MapType.TUTORIAL) {
          setTutorialProgress((p) => (p.step === 2 && !p.doubleJumped ? { ...p, doubleJumped: true } : p));
        }
      }
    }
  }, [isPaused, isAITalking, mapType]);

  const dash = useCallback(() => {
    resetActivity();
    if (
      !isPaused &&
      !isAITalking &&
      !stateRef.current.isKicked &&
      stateRef.current.dashTimer <= 0
    ) {
      stateRef.current.dashTimer = DASH_DURATION;
      playSound("jump");
      if (mapType === MapType.TUTORIAL) {
        setTutorialProgress((p) => (p.step === 3 && !p.dashed ? { ...p, dashed: true } : p));
      }
    }
  }, [isPaused, isAITalking, mapType]);

  const handleSpawnPracticeHazard = useCallback((type: string) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newObs: Obstacle = {
      id: Date.now() + Math.random(),
      type: type,
      x: s.playerX + Math.min(600, canvas.width * 0.7),
      y: type === "star_coin" ? canvas.height - 200 : canvas.height - 110,
      vx: type === "ball" ? -2.5 : 0,
      vy: 0,
      isWarning: true,
      isKicked: false,
    };
    s.obstacles.push(newObs);
    playSound("powerup");
    s.coachTip = `Practice target spawned!`;
    s.coachTipTimer = 80;
  }, []);

  useEffect(() => {
    if (mapType !== MapType.DUO || !roomId || !auth.currentUser) return;

    const roomRef = doc(db, "rooms", roomId);

    // Sync our state to Firestore periodically
    const syncInterval = setInterval(() => {
      if (isPaused) return;
      const s = stateRef.current;
      updateDoc(roomRef, {
        [`playerStates.${auth.currentUser?.uid}`]: {
          x: s.playerX,
          y: s.playerY,
          rotation: s.playerRotation,
          isKicked: s.isKicked,
          isBlinking: s.blinkTimer > 0,
          isKicking: s.dashTimer > 0,
          character: character,
          lastUpdate: Date.now(),
        },
      }).catch(console.error);
    }, 100); // 10Hz sync

    // Listen for other players
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.playerStates) {
          const others = { ...data.playerStates };
          delete others[auth.currentUser?.uid || ""];
          stateRef.current.otherPlayers = others;
        }
      }
    });

    return () => {
      clearInterval(syncInterval);
      unsubscribe();
    };
  }, [mapType, roomId, isPaused, character]);

  useEffect(() => {
    if (isAITalking) {
      let guideText = "";
      if (mapType === MapType.CLASSED)
        guideText = getTranslation("CLASSED_MAP_GUIDE", language);
      else if (mapType === MapType.DUO)
        guideText = getTranslation("DUO_MAP_GUIDE", language);
      else if (mapType === MapType.MOROBUX)
        guideText = getTranslation("MOROBUX_MAP_GUIDE", language);
      else if (mapType === MapType.MIKETS)
        guideText = getTranslation("MIKETS_MAP_GUIDE", language);
      else if (mapType === MapType.AGAINST_BOT)
        guideText = getTranslation("BOT_MAP_GUIDE", language);
      else if (mapType === MapType.DESERT)
        guideText = getTranslation("DESERT_MAP_GUIDE", language);
      else if (mapType === MapType.JUNGLE)
        guideText = getTranslation("JUNGLE_MAP_GUIDE", language);
      else if (mapType === MapType.ICE_CAVE)
        guideText = getTranslation("ICE_CAVE_MAP_GUIDE", language);
      else if (customMapData)
        guideText = getTranslation("CUSTOM_MAP_GUIDE", language);
      else if (mapType === MapType.DEFAULT && !customMapData)
        guideText = getTranslation("DEFAULT_MAP_GUIDE", language);

      if (guideText) {
        playMoroVoice(guideText);
      }
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isAITalking, mapType, customMapData, language]);

  useEffect(() => {
    if (customMapData) {
      if (customMapData.terrain) {
        const img = new Image();
        img.onload = () => setCustomMapImage(img);
        img.src = customMapData.terrain;
      }
      // Load obstacles
      stateRef.current.obstacles = customMapData.obstacles.map((o) => ({
        ...o,
        id: Date.now() + Math.random(),
      }));
    }
  }, [customMapData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetActivity();
      const k = e.key.toLowerCase();
      if (k === "p" || e.key === "Escape") setIsPaused((p) => !p);
      if (isPaused) return;
      if (k === controls.left || k === "arrowleft" || k === "a") {
        stateRef.current.input.left = true;
        setActivePressedKeys((prev) => ({ ...prev, left: true }));
      }
      if (k === controls.right || k === "arrowright" || k === "d") {
        stateRef.current.input.right = true;
        setActivePressedKeys((prev) => ({ ...prev, right: true }));
      }
      if (
        k === controls.jump ||
        k === "arrowup" ||
        k === "w" ||
        e.code === "Space" ||
        controls.jump === " "
      ) {
        setActivePressedKeys((prev) => ({ ...prev, jump: true }));
        jump();
      }
      if (k === controls.dash || k === "x" || k === "shift") {
        setActivePressedKeys((prev) => ({ ...prev, dash: true }));
        dash();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === controls.left || k === "arrowleft" || k === "a") {
        stateRef.current.input.left = false;
        setActivePressedKeys((prev) => ({ ...prev, left: false }));
      }
      if (k === controls.right || k === "arrowright" || k === "d") {
        stateRef.current.input.right = false;
        setActivePressedKeys((prev) => ({ ...prev, right: false }));
      }
      if (
        k === controls.jump ||
        k === "arrowup" ||
        k === "w" ||
        e.code === "Space" ||
        controls.jump === " "
      ) {
        setActivePressedKeys((prev) => ({ ...prev, jump: false }));
      }
      if (k === controls.dash || k === "x" || k === "shift") {
        setActivePressedKeys((prev) => ({ ...prev, dash: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPaused, jump, dash, controls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;

    const drawObstacleShape = (
      type: string,
      isFront: boolean,
      isWarning: boolean = false,
    ) => {
      if (type === "moro_bot") {
        ctx.fillStyle = isFront ? "#475569" : "#1e293b";
        ctx.fillRect(-15, -15, 30, 30);
        if (isFront) {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(-10, -10, 20, 10);
          ctx.fillStyle = isWarning ? "#ef4444" : "#22d3ee";
          ctx.beginPath();
          ctx.arc(-5, -5, 2, 0, Math.PI * 2);
          ctx.arc(5, -5, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(0, -25);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -25, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === "moro_flyer") {
        ctx.fillStyle = isFront ? "#64748b" : "#334155";
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        if (isFront) {
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(0, -5, 12, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.moveTo(-10, 10);
          ctx.lineTo(10, 10);
          ctx.lineTo(0, 20 + Math.random() * 10);
          ctx.fill();
        }
      } else if (type === "moro_ninja") {
        ctx.fillStyle = isFront ? "#0f172a" : "#020617";
        ctx.fillRect(-15, -15, 30, 30);
        if (isFront) {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(-15, -10, 30, 8);
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(-5, -6, 2, 0, Math.PI * 2);
          ctx.arc(5, -6, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-20, 0);
          ctx.lineTo(-35, -15);
          ctx.stroke();
        }
      } else if (type === "moro_jumper") {
        ctx.fillStyle = isFront ? "#10b981" : "#047857";
        ctx.fillRect(-15, -20, 30, 40);
        if (isFront) {
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-10, 20);
          ctx.lineTo(-10, 30);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(10, 20);
          ctx.lineTo(10, 30);
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(-5, -10, 3, 0, Math.PI * 2);
          ctx.arc(5, -10, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(-5, -10, 1, 0, Math.PI * 2);
          ctx.arc(5, -10, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === "moro_fat") {
        ctx.fillStyle = isFront ? "#6366f1" : "#4338ca";
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        if (isFront) {
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(-6, -4, 3, 0, Math.PI * 2);
          ctx.arc(6, -4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 4, 6, 0.5, Math.PI - 0.5);
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.beginPath();
          ctx.arc(0, 8, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === "cactus") {
        ctx.fillStyle = isFront ? "#22c55e" : "#15803d";
        ctx.fillRect(-10, -30, 20, 60);
        ctx.fillRect(-20, -10, 10, 20);
        ctx.fillRect(10, -20, 10, 20);
        if (isFront) {
          ctx.fillStyle = "#166534";
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(-12, -25 + i * 10, 4, 2);
            ctx.fillRect(8, -20 + i * 10, 4, 2);
          }
        }
      } else if (type === "ice_block") {
        ctx.fillStyle = isFront
          ? "rgba(186, 230, 253, 0.8)"
          : "rgba(125, 211, 252, 0.9)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.fillRect(-20, -20, 40, 40);
        if (isFront) {
          ctx.strokeRect(-20, -20, 40, 40);
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.beginPath();
          ctx.moveTo(-15, -15);
          ctx.lineTo(5, -15);
          ctx.lineTo(-15, 5);
          ctx.fill();
        }
      } else if (type === "miket") {
        ctx.fillStyle = isFront ? "#eab308" : "#a16207";
        ctx.fillRect(-25, -15, 50, 30);
        if (isFront) {
          ctx.fillStyle = "black";
          ctx.beginPath();
          ctx.arc(-15, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(15, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === "ball") {
        const grad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 25);
        grad.addColorStop(0, "#ffb3b3");
        grad.addColorStop(0.3, "#ff4d4d");
        grad.addColorStop(0.8, "#cc0000");
        grad.addColorStop(1, "#660000");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawMoro = (
      x: number,
      y: number,
      rotation: number,
      isKicked: boolean,
      isBlinking: boolean,
      isKicking: boolean,
      isTalking: boolean,
      char?: Character,
    ) => {
      const activeChar = char || characterRef.current;
      const isAngry = false;
      const isUpset = false;
      ctx.save();
      ctx.translate(x + 35, y + 35);
      ctx.rotate(rotation);

      // Idle Animation (Bobbing)
      const breathe = Math.sin(stateRef.current.frameCount * 0.08) * 2;
      ctx.translate(0, breathe);

      // Jumping Animation (Squash and Stretch)
      if (stateRef.current.isJumping && !char) {
        const jumpProgress = stateRef.current.jumpProgress;
        const squashY = 1 + Math.abs(Math.sin(jumpProgress * Math.PI)) * 0.2;
        const squashX = 1 - Math.abs(Math.sin(jumpProgress * Math.PI)) * 0.1;
        ctx.scale(squashX, squashY);
      }

      // Collect effect (enlarge)
      if (stateRef.current.morobuxCollectTimer > 0 && !char) {
        const scale = 1 + (stateRef.current.morobuxCollectTimer / 10) * 0.2;
        ctx.scale(scale, scale);
      }

      // Shield visual
      if (stateRef.current.shieldTimer > 0) {
        ctx.save();
        const pulse = Math.sin(stateRef.current.frameCount * 0.15) * 5;
        const shimmer = Math.sin(stateRef.current.frameCount * 0.3) * 0.1;

        // Outer glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#22d3ee";

        ctx.strokeStyle = `rgba(34, 211, 238, ${0.4 + shimmer})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 50 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Inner shimmering fill
        const grad = ctx.createRadialGradient(0, 0, 30, 0, 0, 55 + pulse);
        grad.addColorStop(0, "rgba(34, 211, 238, 0)");
        grad.addColorStop(0.8, `rgba(34, 211, 238, ${0.15 + shimmer})`);
        grad.addColorStop(1, "rgba(34, 211, 238, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 55 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Hexagon pattern overlay for "tech" shield feel
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + shimmer})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const angle =
            (i / 6) * Math.PI * 2 + stateRef.current.frameCount * 0.02;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 45, Math.sin(angle) * 45);
          ctx.lineTo(Math.cos(angle) * 55, Math.sin(angle) * 55);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Kicking visual
      if (isKicking) {
        // Spinning kick effect
        const kickAngle = Math.sin(stateRef.current.frameCount * 0.8) * 0.5;
        ctx.rotate(kickAngle);

        // Draw a swoosh/foot extending forward
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.ellipse(45, 10, 25, 10, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Speed lines behind
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-40, -10);
        ctx.lineTo(-100, -10);
        ctx.moveTo(-40, 10);
        ctx.lineTo(-80, 10);
        ctx.stroke();

        // Impact sparks
        for (let i = 0; i < 3; i++) {
          const sparkX = 50 + Math.random() * 20;
          const sparkY = (Math.random() - 0.5) * 30;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Boost visual
      if (stateRef.current.boostTimer > 0) {
        ctx.save();
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const offset = (stateRef.current.frameCount + i * 10) % 30;
          ctx.beginPath();
          ctx.arc(0, 0, 40 + offset, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Anime Squash and Stretch on kick
      if (stateRef.current.kickEffectTimer > 0) {
        const squash =
          1 + Math.sin(stateRef.current.kickEffectTimer * 0.5) * 0.3;
        ctx.scale(squash, 1 / squash);
      }

      if (activeChar.id === "pbj-banana") {
        // --- DANCING BANANA (Peanut Butter Jelly Time) ---
        const danceAngle = Math.sin(stateRef.current.frameCount * 0.15) * 0.2;
        ctx.rotate(danceAngle);

        // Banana Body (Curved)
        ctx.save();
        ctx.fillStyle = "#fde047"; // Yellow
        ctx.strokeStyle = "#854d0e"; // Brownish outline
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Draw a curved banana shape
        ctx.moveTo(-15, -45);
        ctx.quadraticCurveTo(25, -30, 15, 45); // Outer curve
        ctx.quadraticCurveTo(5, 50, -5, 45); // Bottom
        ctx.quadraticCurveTo(0, -20, -20, -40); // Inner curve
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Banana Tip (Top)
        ctx.fillStyle = "#422006";
        ctx.beginPath();
        ctx.moveTo(-15, -45);
        ctx.lineTo(-10, -52);
        ctx.lineTo(-5, -46);
        ctx.closePath();
        ctx.fill();

        // Banana Tip (Bottom)
        ctx.beginPath();
        ctx.arc(10, 46, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-2, -15, 3, 0, Math.PI * 2);
        ctx.arc(8, -12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.beginPath();
        ctx.arc(3, -5, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Arms (Peanut Butter Jelly Time style - thin lines)
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        const armWave = Math.sin(stateRef.current.frameCount * 0.2) * 10;

        // Left Arm
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(-30, -20 + armWave);
        ctx.stroke();

        // Right Arm
        ctx.beginPath();
        ctx.moveTo(15, -5);
        ctx.lineTo(35, -15 - armWave);
        ctx.stroke();

        // Legs
        const legWave = Math.cos(stateRef.current.frameCount * 0.2) * 5;
        ctx.beginPath();
        ctx.moveTo(-5, 35);
        ctx.lineTo(-15, 55 + legWave);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(10, 38);
        ctx.lineTo(20, 55 - legWave);
        ctx.stroke();

        ctx.restore();
        ctx.restore();
        return;
      }

      // Shadow dynamics
      const shadowSize = 25 - Math.abs(stateRef.current.playerVY) * 0.5;
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(0, 45, Math.max(5, shadowSize), 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 1. Sac à dos (Rendu 3D par couches) - Seulement si équipé
      if (activeChar.backpackId) {
        const bY = Math.sin(stateRef.current.frameCount * 0.3) * 1.5;
        ctx.save();
        ctx.fillStyle = "#1e1b4b";
        ctx.beginPath();
        ctx.roundRect(-45, -18 + bY, 35, 52, 14);
        ctx.fill();

        const backpackColor =
          activeChar.backpackColor || activeChar.accessoryColor || "#8b5cf6";
        const backpackGrad = ctx.createLinearGradient(-40, -14, -10, 30);
        backpackGrad.addColorStop(0, backpackColor);
        backpackGrad.addColorStop(1, "#2d1b4d");
        ctx.fillStyle = backpackGrad;
        ctx.beginPath();
        ctx.roundRect(-40, -14 + bY, 28, 44, 12);
        ctx.fill();

        // Backpack Pattern
        const getBackpackPattern = (id: string) => {
          const p = id.replace("backpack-", "");
          if (p === "mecha") return "mecha_wings";
          if (p === "katana") return "katanas";
          if (p === "secret") return "void";
          return p;
        };
        const backpackPattern = activeChar.backpackId ? getBackpackPattern(activeChar.backpackId) : null;
        if (backpackPattern) {
          ctx.save();
          ctx.clip(); // Clip to backpack shape
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "#fff";

          if (backpackPattern === "sport") {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-35, -10 + bY);
            ctx.lineTo(-15, 20 + bY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-15, -10 + bY);
            ctx.lineTo(-35, 20 + bY);
            ctx.stroke();
          } else if (backpackPattern === "tactical") {
            ctx.lineWidth = 1;
            for (let i = -10; i < 30; i += 8) {
              ctx.beginPath();
              ctx.moveTo(-40, i + bY);
              ctx.lineTo(-10, i + bY);
              ctx.stroke();
            }
          } else if (backpackPattern === "wings") {
            ctx.fillStyle = "#f8fafc";
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(-35, 0 + bY);
            ctx.quadraticCurveTo(-50, -20 + bY, -60, -10 + bY);
            ctx.quadraticCurveTo(-45, 10 + bY, -35, 15 + bY);
            ctx.fill();
          } else if (backpackPattern === "jetpack") {
            ctx.fillStyle = "#94a3b8";
            ctx.globalAlpha = 1;
            ctx.fillRect(-35, -5 + bY, 8, 30);
            ctx.fillRect(-23, -5 + bY, 8, 30);
            // flames
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.moveTo(-31, 25 + bY);
            ctx.lineTo(-35, 35 + bY + Math.random() * 5);
            ctx.lineTo(-27, 35 + bY + Math.random() * 5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-19, 25 + bY);
            ctx.lineTo(-23, 35 + bY + Math.random() * 5);
            ctx.lineTo(-15, 35 + bY + Math.random() * 5);
            ctx.fill();
          } else if (backpackPattern === "void") {
            ctx.fillStyle = "#000";
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(-26, 8 + bY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
              -26,
              8 + bY,
              12 + Math.sin(stateRef.current.frameCount * 0.1) * 2,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          } else if (backpackPattern === "mecha_wings") {
            ctx.fillStyle = "#38bdf8";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#38bdf8";
            ctx.beginPath();
            ctx.moveTo(-30, -5 + bY);
            ctx.lineTo(-65, -30 + bY);
            ctx.lineTo(-50, 5 + bY);
            ctx.lineTo(-60, 25 + bY);
            ctx.lineTo(-30, 15 + bY);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (backpackPattern === "katanas") {
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-50, -35 + bY);
            ctx.lineTo(-10, 35 + bY);
            ctx.moveTo(-10, -35 + bY);
            ctx.lineTo(-50, 35 + bY);
            ctx.stroke();
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(-54, -40 + bY, 8, 8);
            ctx.fillRect(-14, -40 + bY, 8, 8);
          } else if (backpackPattern === "pizza") {
            ctx.fillStyle = "#facc15";
            ctx.beginPath();
            ctx.moveTo(-26, -15 + bY);
            ctx.lineTo(-45, 30 + bY);
            ctx.lineTo(-10, 30 + bY);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(-28, 5 + bY, 4, 0, Math.PI * 2);
            ctx.arc(-20, 20 + bY, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (backpackPattern === "guitar") {
            ctx.fillStyle = "#dc2626";
            ctx.beginPath();
            ctx.ellipse(-26, 15 + bY, 12, 18, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-26, 15 + bY);
            ctx.lineTo(-45, -30 + bY);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // Default Texture de tissu
          ctx.globalAlpha = 0.1;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1;
          for (let i = -35; i < -15; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, -10 + bY);
            ctx.lineTo(i, 20 + bY);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // --- HAIR BACK ---
      const hairMode = activeChar.hairId
        ? activeChar.hairId.replace("hair-", "")
        : "none";
      const hColor = activeChar.hairColor || "#1e293b";
      if (
        hairMode === "long" ||
        hairMode === "braids" ||
        hairMode === "ponytail"
      ) {
        ctx.save();
        ctx.fillStyle = hColor;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        if (hairMode === "long") {
          ctx.beginPath();
          ctx.moveTo(-35, 0);
          ctx.quadraticCurveTo(-45, 40, -15, 40);
          ctx.lineTo(-15, -10);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(35, 0);
          ctx.quadraticCurveTo(45, 40, 15, 40);
          ctx.lineTo(15, -10);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "braids") {
          for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.arc(side * 28, 5 + i * 12, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }
        } else if (hairMode === "ponytail") {
          ctx.beginPath();
          ctx.arc(35, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Body Orb or Red Apple Pimo with Rim Light
      const isHuman = activeChar.bodyId === "body-human";
      const isRoblox = activeChar.bodyId === "body-roblox";
      const isPimo =
        activeChar.id === "moro-classic" ||
        activeChar.id === "pimo-classic" ||
        (activeChar.name && activeChar.name.toLowerCase().includes("pimo")) ||
        activeChar.emoji === "🍎" ||
        activeChar.bodyColor === "#ef4444" ||
        activeChar.bodyColor === "#dc2626";

      const bodyGrad = ctx.createRadialGradient(-10, -12, 4, 0, 0, 36);
      if (isPimo) {
        bodyGrad.addColorStop(0, "#ff7575");
        bodyGrad.addColorStop(0.25, "#ef4444");
        bodyGrad.addColorStop(0.7, "#dc2626");
        bodyGrad.addColorStop(1, "#991b1b");
      } else {
        bodyGrad.addColorStop(0, "#ffffff");
        bodyGrad.addColorStop(0.3, activeChar.bodyColor);
        bodyGrad.addColorStop(1, "#1e293b");
      }
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      const t = stateRef.current.frameCount;
      const walkCycle = Math.sin(t * 0.4);

      if (isRoblox) {
        // Draw Arms First (Behind/Sides)
        ctx.roundRect(-42, -20 + walkCycle * 10, 14, 45, 2);
        ctx.roundRect(28, -20 - walkCycle * 10, 14, 45, 2);
        // Legs
        ctx.roundRect(-22, 37 - walkCycle * 10, 20, 25, 2);
        ctx.roundRect(2, 37 + walkCycle * 10, 20, 25, 2);
        // Torso
        ctx.roundRect(-26, -35, 52, 70, 3);
      } else if (isHuman) {
        // Legs
        ctx.roundRect(-15, 42 - walkCycle * 10, 10, 30, 5);
        ctx.roundRect(5, 42 + walkCycle * 10, 10, 30, 5);
        // Arms
        ctx.roundRect(-34, -5 + walkCycle * 10, 10, 40, 5);
        ctx.roundRect(24, -5 - walkCycle * 10, 10, 40, 5);
        // Torso
        ctx.arc(0, -2, 20, 0, Math.PI * 2);
        ctx.moveTo(-10, 14);
        ctx.lineTo(10, 14);
        ctx.quadraticCurveTo(24, 14, 24, 24);
        ctx.lineTo(18, 40);
        ctx.lineTo(-18, 40);
        ctx.lineTo(-24, 24);
        ctx.quadraticCurveTo(-24, 14, -10, 14);
      } else if (isPimo) {
        // Chubby Red Apple body silhouette
        ctx.beginPath();
        ctx.moveTo(0, -29);
        ctx.bezierCurveTo(16, -39, 39, -20, 37, 5);
        ctx.bezierCurveTo(36, 25, 22, 38, 7, 36);
        ctx.bezierCurveTo(0, 34, 0, 34, -7, 36);
        ctx.bezierCurveTo(-22, 38, -36, 25, -37, 5);
        ctx.bezierCurveTo(-39, -20, -16, -39, 0, -29);
        ctx.closePath();
      } else {
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
      }
      ctx.fill();

      // Apple features for Pimo in-game
      if (isPimo && !isRoblox && !isHuman) {
        ctx.save();
        // Cute Rosy Blush Cheeks
        ctx.fillStyle = "rgba(254, 205, 211, 0.75)";
        ctx.beginPath();
        ctx.ellipse(-18, 5, 7, 4.5, 0, 0, Math.PI * 2);
        ctx.ellipse(18, 5, 7, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Little running shoes
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-20, 32 + walkCycle * 4, 14, 10, 5);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(6, 32 - walkCycle * 4, 14, 10, 5);
        ctx.fill();
        ctx.stroke();

        // Cute cartoon hands at sides
        ctx.beginPath();
        ctx.arc(-35, 8 - walkCycle * 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(35, 8 + walkCycle * 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Apple Stem & Green Leaf on Top of Head
        if (!activeChar.hairId) {
          const leafSway = Math.sin(t * 0.15) * 0.12;

          // Cute brown curved stem
          ctx.strokeStyle = "#78350f";
          ctx.lineWidth = 4.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(0, -29);
          ctx.quadraticCurveTo(3, -41, 5, -50);
          ctx.stroke();

          // Woody highlight
          ctx.strokeStyle = "#92400e";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-1, -30);
          ctx.quadraticCurveTo(2, -41, 4, -49);
          ctx.stroke();

          // Green Leaf
          ctx.save();
          ctx.translate(3, -41);
          ctx.rotate(leafSway);
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(16, -13, 24, -4);
          ctx.quadraticCurveTo(15, 9, 0, 0);
          ctx.fill();

          // Leaf outline & vein
          ctx.strokeStyle = "#15803d";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(11, -4, 18, -4);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // --- SHIRT PATTERN ---
      if (activeChar.shirtId) {
        const getShirtPattern = (id) => {
          const p = id.replace("shirt-", "");
          if (p === "miket") return "money";
          return p;
        };
        const pattern = getShirtPattern(activeChar.shirtId);
        ctx.save();
        ctx.clip(); // Clip to body
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = "#fff";
        ctx.fillStyle = "#fff";

        if (pattern === "stripes") {
          ctx.lineWidth = 4;
          for (let i = -45; i < 45; i += 10) {
            ctx.beginPath();
            ctx.moveTo(-45, i);
            ctx.lineTo(45, i);
            ctx.stroke();
          }
        } else if (pattern === "dots") {
          for (let x = -45; x < 45; x += 12) {
            for (let y = -45; y < 45; y += 12) {
              ctx.beginPath();
              ctx.arc(x + (y % 24 === 0 ? 6 : 0), y, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (pattern === "check") {
          for (let x = -45; x < 45; x += 10) {
            for (let y = -45; y < 45; y += 10) {
              if (((x + y) / 10) % 2 === 0) ctx.fillRect(x, y, 10, 10);
            }
          }
        } else if (pattern === "flame") {
          ctx.strokeStyle = "#ff4400";
          ctx.lineWidth = 3;
          for (let i = -45; i < 45; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, 45);
            ctx.bezierCurveTo(i - 10, 20, i + 10, 10, i, -15);
            ctx.stroke();
          }
        } else if (pattern === "star") {
          ctx.fillStyle = "#fde047";
          for (let i = 0; i < 10; i++) {
            const sx = Math.sin(i * 2.5) * 35;
            const sy = Math.cos(i * 2.5) * 35;
            ctx.beginPath();
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (pattern === "money") {
          ctx.fillStyle = "#15803d"; // Darker green
          ctx.globalAlpha = 0.6;
          // Draw some money bills / dollar signs
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (let i = 0; i < 8; i++) {
            const sx = Math.sin(i * 3.1) * 30;
            const sy = Math.cos(i * 2.7) * 30;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(i * 0.5);
            ctx.fillText("$", 0, 0);
            ctx.restore();
          }
        } else if (pattern === "cyber") {
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;
          for (let x = -30; x <= 30; x += 12) {
            ctx.beginPath(); ctx.moveTo(x, -35); ctx.lineTo(x, 35); ctx.stroke();
          }
          for (let y = -30; y <= 30; y += 12) {
            ctx.beginPath(); ctx.moveTo(-35, y); ctx.lineTo(35, y); ctx.stroke();
          }
        } else if (pattern === "galaxy") {
          ctx.fillStyle = "#e0e7ff";
          for (let i = 0; i < 15; i++) {
            const gx = Math.sin(i * 4.2) * 30;
            const gy = Math.cos(i * 3.1) * 30;
            ctx.beginPath(); ctx.arc(gx, gy, (i % 3) + 1, 0, Math.PI * 2); ctx.fill();
          }
        } else if (pattern === "gold") {
          ctx.fillStyle = "#eab308";
          ctx.fillRect(-15, -20, 30, 40);
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.moveTo(-10, -20); ctx.lineTo(0, -5); ctx.lineTo(10, -20);
          ctx.fill();
        } else if (pattern === "camo") {
          ctx.fillStyle = "#15803d";
          for (let i = 0; i < 6; i++) {
            const cx = Math.sin(i * 2.1) * 25;
            const cy = Math.cos(i * 1.8) * 25;
            ctx.beginPath(); ctx.ellipse(cx, cy, 10, 6, i, 0, Math.PI * 2); ctx.fill();
          }
        } else if (pattern === "heart") {
          ctx.fillStyle = "#f43f5e";
          ctx.font = "14px Arial";
          for (let i = 0; i < 6; i++) {
            const hx = Math.sin(i * 2.8) * 25;
            const hy = Math.cos(i * 2.2) * 25;
            ctx.fillText("❤️", hx, hy);
          }
        }
        ctx.restore();
      }

      // Face expressions
      ctx.save();
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      const getEyesType = (id) => {
        const p = id.replace("face-", "");
        if (p === "cyber") return "visor";
        return p;
      };
      const eyesType = activeChar.faceId ? getEyesType(activeChar.faceId) : "default";

      if (isKicked) {
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("×", -14, -6);
        ctx.fillText("×", 14, -6);
        ctx.beginPath();
        ctx.arc(0, 18, 10, Math.PI, 0);
        ctx.stroke();
      } else if (isBlinking && !isAngry) {
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-22, -6);
        ctx.lineTo(-10, -6);
        ctx.moveTo(10, -6);
        ctx.lineTo(22, -6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 10, 12, 0.4, Math.PI - 0.4);
        ctx.stroke();
      } else {
        // EYES
        if (eyesType === "shades" || eyesType === "cool") {
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.roundRect(-28, -12, 22, 14, 4);
          ctx.roundRect(6, -12, 22, 14, 4);
          ctx.fill();
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-6, -5);
          ctx.lineTo(6, -5);
          ctx.stroke();
        } else if (eyesType === "uwu") {
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-24, -10);
          ctx.lineTo(-16, -2);
          ctx.lineTo(-8, -10);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(8, -10);
          ctx.lineTo(16, -2);
          ctx.lineTo(24, -10);
          ctx.stroke();
        } else if (eyesType === "angry") {
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-24, -12);
          ctx.lineTo(-8, -4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(24, -12);
          ctx.lineTo(8, -4);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-16, -2, 4, 0, Math.PI * 2);
          ctx.arc(16, -2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (eyesType === "derp") {
          ctx.beginPath();
          ctx.arc(-16, -6, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(16, -6, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (eyesType === "heart") {
          ctx.fillStyle = "#f43f5e";
          ctx.font = "24px Arial";
          ctx.textAlign = "center";
          ctx.fillText("❤️", -16, -2);
          ctx.fillText("❤️", 16, -2);
        } else if (eyesType === "miket") {
          // Left eye (ticket)
          ctx.fillStyle = "#facc15"; // yellow-400
          ctx.beginPath();
          ctx.roundRect(-24, -10, 16, 8, 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a"; // black hole
          ctx.beginPath();
          ctx.arc(-22, -6, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-10, -6, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Right eye (ticket)
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.roundRect(8, -10, 16, 8, 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(10, -6, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(22, -6, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (eyesType === "visor") {
          ctx.fillStyle = "#06b6d4";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#06b6d4";
          ctx.beginPath();
          ctx.roundRect(-28, -10, 56, 10, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (eyesType === "anime") {
          ctx.fillStyle = "#000";
          ctx.beginPath(); ctx.ellipse(-16, -6, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(16, -6, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(-18, -10, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(14, -10, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(244, 63, 94, 0.4)";
          ctx.beginPath(); ctx.ellipse(-20, 4, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(20, 4, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        } else if (eyesType === "pixel") {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(-28, -10, 24, 8);
          ctx.fillRect(4, -10, 24, 8);
          ctx.fillRect(-6, -6, 12, 2);
        } else if (eyesType === "star") {
          ctx.fillStyle = "#facc15";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.fillText("⭐", -16, 2);
          ctx.fillText("⭐", 16, 2);
        } else if (eyesType === "fire") {
          ctx.fillStyle = "#ef4444";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#f59e0b";
          ctx.beginPath(); ctx.arc(-16, -6, 8, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(16, -6, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fde047";
          ctx.beginPath(); ctx.arc(-16, -6, 4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(16, -6, 4, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(-16, -6, 7, 0, Math.PI * 2);
          ctx.arc(16, -6, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(-18, -8, 2.5, 0, Math.PI * 2);
          ctx.arc(14, -8, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // MOUTH
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#0f172a";

        if (isTalking) {
          const mouthOpen = Math.abs(Math.sin(stateRef.current.frameCount * 0.5)) * 10;
          ctx.beginPath();
          ctx.ellipse(
            0,
            12 + mouthOpen / 2,
            8,
            2 + mouthOpen,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else if (eyesType === "uwu") {
          ctx.beginPath();
          ctx.arc(-4, 10, 4, 0, Math.PI);
          ctx.arc(4, 10, 4, 0, Math.PI);
          ctx.stroke();
        } else if (eyesType === "angry" || isAngry) {
          ctx.beginPath();
          ctx.arc(0, 20, 10, Math.PI + 0.5, -0.5);
          ctx.stroke();
        } else if (eyesType === "derp") {
          ctx.beginPath();
          ctx.arc(0, 10, 8, 0, Math.PI);
          ctx.stroke();
          ctx.fillStyle = "#fb7185";
          ctx.beginPath();
          ctx.roundRect(2, 12, 8, 12, 4);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 10, 12, 0.4, Math.PI - 0.4);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 4. Reflet brillant (Gloss)
      ctx.save();
      const glass = ctx.createLinearGradient(-35, -35, 35, 35);
      glass.addColorStop(0, "rgba(255,255,255,0.4)");
      glass.addColorStop(0.5, "rgba(255,255,255,0)");
      glass.addColorStop(1, "rgba(255,255,255,0.1)");
      ctx.fillStyle = glass;
      ctx.beginPath();
      if (isPimo) {
        ctx.ellipse(-12, -15, 11, 5.5, -0.6, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();

      // --- HAIR FRONT ---
      if (hairMode && hairMode !== "none") {
        ctx.save();
        ctx.fillStyle = hColor;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;

        if (hairMode === "spiky") {
          ctx.beginPath();
          ctx.moveTo(-35, -15);
          for (let i = -30; i <= 30; i += 12) {
            const h =
              5 +
              Math.abs(Math.sin(stateRef.current.frameCount * 0.1 + i)) * 12;
            ctx.lineTo(i, -32 - h);
            ctx.lineTo(i + 6, -32);
          }
          ctx.lineTo(35, -15);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "long") {
          // Bangs
          ctx.beginPath();
          ctx.moveTo(-32, -18);
          ctx.quadraticCurveTo(0, -45, 32, -18);
          ctx.quadraticCurveTo(15, -12, 0, -25);
          ctx.quadraticCurveTo(-15, -12, -32, -18);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "afro") {
          ctx.beginPath();
          ctx.arc(0, -35, 30, 0, Math.PI * 2);
          ctx.arc(-22, -25, 20, 0, Math.PI * 2);
          ctx.arc(22, -25, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "mohawk") {
          ctx.beginPath();
          ctx.moveTo(-6, -35);
          ctx.lineTo(-12, -60);
          ctx.lineTo(0, -75);
          ctx.lineTo(12, -60);
          ctx.lineTo(6, -35);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "ponytail" || hairMode === "braids") {
          // Top coverage
          ctx.beginPath();
          ctx.moveTo(-35, -8);
          ctx.quadraticCurveTo(0, -42, 35, -8);
          ctx.lineTo(35, 2);
          ctx.lineTo(-35, 2);
          ctx.fill();
          ctx.stroke();
        }

        // Texture / Shine
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(0, -32, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    };

    const draw3DObstacle = (obs: any) => {
      if (
        mapType === MapType.MORO_KART &&
        [
          "moro_bot",
          "moro_ninja",
          "moro_flyer",
          "moro_jumper",
          "moro_fat",
          "cactus",
          "ice_block",
          "miket",
          "ball",
        ].includes(obs.type)
      ) {
        const vehicleMap: any = {
          moro_bot: "VAN",
          moro_ninja: "MOTO",
          moro_flyer: "TRUCK",
          moro_jumper: "CAR",
          moro_fat: "VAN",
          cactus: "TRUCK",
          ice_block: "VAN",
          miket: "CAR",
          ball: "CAR",
        };
        drawVehicle(
          0,
          0,
          vehicleMap[obs.type] || "CAR",
          "HELMET_1",
          character,
          obs.type,
        );
        return;
      }
      ctx.save();

      // Wind-up Vibration & Lunge
      let offsetX = 0;
      let offsetY = 0;
      if (obs.isWarning && obs.type !== "gem") {
        const vibration = obs.charge * 5;
        offsetX = (Math.random() - 0.5) * vibration;
        offsetY = (Math.random() - 0.5) * vibration;

        // Lunge towards player
        const lunge = obs.charge * 15;
        offsetX -= lunge; // Lunging left towards player
      }

      ctx.translate(obs.x + 22 + offsetX, obs.y + 22 + offsetY);

      // Physics-based rotation
      if (obs.vx) {
        ctx.rotate(obs.x * 0.05);
      }

      // Anime Warning Effect
      if (obs.isWarning) {
        const pulse = Math.sin(stateRef.current.frameCount * 0.3) * 0.5 + 0.5;
        const chargeScale = 1 + obs.charge * 0.3;

        ctx.shadowBlur = 15 + pulse * 10 + obs.charge * 20;
        ctx.shadowColor = obs.charge > 0.8 ? "#ffffff" : "#ff0000";
        ctx.scale(chargeScale, chargeScale);

        // Warning speed lines
        ctx.strokeStyle =
          obs.charge > 0.8
            ? `rgba(255, 255, 255, ${pulse})`
            : `rgba(255, 0, 0, ${pulse * 0.5})`;
        ctx.lineWidth = 2 + obs.charge * 2;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + stateRef.current.frameCount * 0.1;
          const len = 30 + obs.charge * 40;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 25, Math.sin(a) * 25);
          ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
          ctx.stroke();
        }

        // "Charging" particles
        if (obs.charge > 0.5) {
          ctx.fillStyle = "#fff";
          for (let i = 0; i < 3; i++) {
            const pa = Math.random() * Math.PI * 2;
            const pr = 40 * (1 - (stateRef.current.frameCount % 10) / 10);
            ctx.beginPath();
            ctx.arc(Math.cos(pa) * pr, Math.sin(pa) * pr, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (obs.type === "star") {
        const rotationSpeed = 0.1 + (obs.charge || 0) * 0.4;
        ctx.rotate(stateRef.current.frameCount * rotationSpeed);

        const drawStar = (color: string | CanvasGradient | CanvasPattern) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? 25 : 12;
            const a = (i / 5) * Math.PI;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        };

        // 3D Extrusion
        for (let i = 8; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawStar("#854d0e");
          ctx.restore();
        }

        const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 25);
        grad.addColorStop(0, obs.charge > 0.8 ? "#fff" : "#fff");
        grad.addColorStop(0.5, obs.charge > 0.8 ? "#fef08a" : "#facc15");
        grad.addColorStop(1, obs.charge > 0.8 ? "#eab308" : "#b45309");
        drawStar(grad);

        if (obs.isWarning) {
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.moveTo(-8, -5);
          ctx.lineTo(-2, -2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(8, -5);
          ctx.lineTo(2, -2);
          ctx.stroke();
        }
      } else if (obs.type === "ball") {
        const bob = Math.sin(stateRef.current.frameCount * 0.1) * 5;
        ctx.translate(0, bob);
        drawObstacleShape("ball", true);
      } else if (obs.type === "gem") {
        const pulse = Math.sin(stateRef.current.frameCount * 0.2) * 5 + 10;
        ctx.rotate(stateRef.current.frameCount * 0.08);
        ctx.shadowBlur = pulse;
        ctx.shadowColor = "#cbd5e1";

        const drawHex = (color: string) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 3) * Math.PI;
            ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
          }
          ctx.closePath();
          ctx.fill();
        };

        for (let i = 8; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawHex("#64748b");
          ctx.restore();
        }

        drawHex("#cbd5e1");
        ctx.fillStyle = "#000";
        ctx.fillRect(-6, -6, 12, 12);
      } else if (obs.type === "miket") {
        const bob = Math.sin(stateRef.current.frameCount * 0.1) * 5;
        ctx.translate(0, bob);

        for (let i = 10; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape("miket", false);
          ctx.restore();
        }
        drawObstacleShape("miket", true);
      } else if (
        obs.type === "shield" ||
        obs.type === "boost" ||
        obs.type === "magnet" ||
        obs.type === "trophy"
      ) {
        const pulse = Math.sin(stateRef.current.frameCount * 0.1) * 0.1 + 1;
        ctx.scale(pulse, pulse);
        const darkColors: any = {
          shield: "#0891b2",
          boost: "#b45309",
          magnet: "#be185d",
          trophy: "#92400e",
        };
        const icons: any = {
          shield: "🛡️",
          boost: "⚡",
          magnet: "🧲",
          trophy: "🏆",
        };
        const colors: any = {
          shield: "#22d3ee",
          boost: "#f59e0b",
          magnet: "#ec4899",
          trophy: "#facc15",
        };

        for (let i = 8; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          ctx.fillStyle = darkColors[obs.type];
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = colors[obs.type];
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icons[obs.type], 0, 0);
      } else if (obs.type === "moro_bot") {
        for (let i = 12; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape("moro_bot", false, obs.isWarning);
          ctx.restore();
        }
        drawObstacleShape("moro_bot", true, obs.isWarning);
      } else if (obs.type === "moro_flyer") {
        for (let i = 10; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape("moro_flyer", false);
          ctx.restore();
        }
        drawObstacleShape("moro_flyer", true);
      } else if (obs.type === "moro_ninja") {
        for (let i = 10; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape("moro_ninja", false);
          ctx.restore();
        }
        drawObstacleShape("moro_ninja", true);
      } else if (obs.type === "moro_jumper") {
        for (let i = 12; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape("moro_jumper", false);
          ctx.restore();
        }
        drawObstacleShape("moro_jumper", true);
      } else if (obs.type === "moro_fat") {
        const scale = 3.5;
        ctx.scale(scale, scale);
        const bob = Math.sin(stateRef.current.frameCount * 0.05) * 2;
        ctx.translate(0, bob);

        for (let i = 8; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape("moro_fat", false);
          ctx.restore();
        }
        drawObstacleShape("moro_fat", true);

        ctx.save();
        ctx.scale(1 / scale, 1 / scale);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 12px Fredoka One";
        ctx.textAlign = "center";
        ctx.fillText(getTranslation("BOSS", languageRef.current), 0, -80);
        ctx.restore();
      } else if (obs.type === "cactus") {
        for (let i = 10; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape("cactus", false);
          ctx.restore();
        }
        drawObstacleShape("cactus", true);
      } else if (obs.type === "vine") {
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.moveTo(-5, -40);
        ctx.quadraticCurveTo(15, -20, -5, 0);
        ctx.quadraticCurveTo(-25, 20, -5, 40);
        ctx.lineWidth = 10;
        ctx.stroke();

        const drawLeaf = (color: string) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(0, -20, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-10, 10, 8, 0, Math.PI * 2);
          ctx.fill();
        };

        for (let i = 5; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawLeaf("#166534");
          ctx.restore();
        }
        drawLeaf("#4ade80");
      } else if (obs.type === "ice_block") {
        for (let i = 15; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape("ice_block", false);
          ctx.restore();
        }
        drawObstacleShape("ice_block", true);
      } else if (obs.type === "blade") {
        ctx.rotate(stateRef.current.frameCount * 0.2);

        const drawBlade = (color: string) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.moveTo(0, 0);
            ctx.lineTo(10, -30);
            ctx.lineTo(-10, -30);
          }
          ctx.fill();
        };

        for (let i = 5; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawBlade("#475569");
          ctx.restore();
        }
        drawBlade("#94a3b8");

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === "speed") {
        const drawSpeed = (isFront: boolean) => {
          ctx.fillStyle = isFront ? "#06b6d4" : "#0891b2";
          ctx.fillRect(-25, -5, 50, 10);
          if (isFront) {
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(-5, -5);
            ctx.lineTo(-5, 5);
            ctx.moveTo(0, 0);
            ctx.lineTo(10, -5);
            ctx.lineTo(10, 5);
            ctx.fill();
          }
        };

        for (let i = 5; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawSpeed(false);
          ctx.restore();
        }
        drawSpeed(true);
      } else if (obs.type === "boost_pad") {
        // Glowing Speed Booster Pad
        ctx.fillStyle = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#38bdf8";
        ctx.fillRect(-30, -6, 60, 12);
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(-15, -4); ctx.lineTo(-5, 0); ctx.lineTo(-15, 4);
        ctx.moveTo(0, -4); ctx.lineTo(10, 0); ctx.moveTo(0, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === "spring_pad") {
        // Bouncy Spring Pad
        ctx.fillStyle = "#9333ea";
        ctx.fillRect(-20, 0, 40, 8);
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(10, -10); ctx.lineTo(-10, -20); ctx.lineTo(10, -25);
        ctx.stroke();
        ctx.fillStyle = "#facc15";
        ctx.fillRect(-22, -30, 44, 8);
      } else if (obs.type === "star_coin") {
        // Golden Star Coin
        const coinW = Math.abs(Math.cos(stateRef.current.frameCount * 0.1)) * 24 + 6;
        ctx.fillStyle = "#eab308";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#fde047";
        ctx.beginPath();
        ctx.ellipse(0, 0, coinW, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.ellipse(0, 0, coinW * 0.6, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === "laser_barrier") {
        // Holographic Laser Trap
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(-25, -40, 10, 80);
        ctx.fillRect(15, -40, 10, 80);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ef4444";
        for (let l = -30; l <= 30; l += 15) {
          ctx.beginPath();
          ctx.moveTo(-15, l + Math.sin(stateRef.current.frameCount * 0.2) * 2);
          ctx.lineTo(15, l);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (obs.type === "black_hole") {
        // Cosmic Black Hole Void
        ctx.save();
        ctx.rotate(stateRef.current.frameCount * 0.05);
        ctx.fillStyle = "#020617";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#6366f1";
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 35, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (obs.type === "lollipop") {
        // Candy Lollipop Spinner
        ctx.fillStyle = "#fce7f3";
        ctx.fillRect(-3, 0, 6, 40);
        ctx.save();
        ctx.translate(0, -10);
        ctx.rotate(stateRef.current.frameCount * 0.05);
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (obs.type === "cyber_drone") {
        // Flying Cyber Drone
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-25, -8, 50, 16);
        ctx.fillStyle = "#06b6d4";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#06b6d4";
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        // Spinning Rotors
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-20, -10, 10, 0, Math.PI * 2);
        ctx.arc(20, -10, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Visual Warning Overlays
      if (obs.isWarning && !obs.isKicked) {
        const pulse = Math.sin(stateRef.current.frameCount * 0.2) * 0.5 + 0.5;
        const charge = obs.charge || 0;

        // Red Pulsing Glow
        ctx.save();
        ctx.globalAlpha = 0.3 * pulse;
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(0, 0, 40 + charge * 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Speed Lines (if charging)
        if (charge > 0.5) {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 255, 255, ${charge})`;
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const yOffset = (i - 1) * 15;
            const xStart = 30 + Math.random() * 10;
            const xEnd = 60 + charge * 40;
            ctx.beginPath();
            ctx.moveTo(xStart, yOffset);
            ctx.lineTo(xEnd, yOffset);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Exclamation Mark
        ctx.save();
        ctx.translate(
          0,
          -50 - Math.sin(stateRef.current.frameCount * 0.1) * 10,
        );
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ef4444";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("!", 0, 0);

        // Small white outline for readability
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeText("!", 0, 0);
        ctx.restore();
      }

      ctx.restore();
    };

    const drawAnimeImpact = (x: number, y: number) => {
      const timer = stateRef.current.kickEffectTimer;
      if (timer <= 0) return;

      const opacity = timer / 20;
      ctx.save();
      ctx.translate(x, y);

      // Radial Impact Lines
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.lineWidth = 4;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const length = 100 + Math.random() * 50;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
        ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        ctx.stroke();
      }

      // stylized "KICK!" text
      ctx.font = "italic bold 60px Fredoka One, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Text Shadow/Glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff0000";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 8;

      const scale = 1 + (1 - opacity) * 0.5;
      ctx.scale(scale, scale);
      ctx.strokeText(getTranslation("KICK_TEXT", languageRef.current), 0, 0);
      ctx.fillText(getTranslation("KICK_TEXT", languageRef.current), 0, 0);

      ctx.restore();

      // Screen Flash
      if (timer > 15) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(timer - 15) / 5})`;
        ctx.fillRect(-x, -y, canvas.width * 2, canvas.height * 2);
      }
    };

    const drawVehicle = (
      x: number,
      y: number,
      type: string,
      helmet: string = "HELMET_1",
      char: Character = characterRef.current,
      obstacleType?: string,
    ) => {
      ctx.save();
      ctx.translate(x, y);

      // Draw Vehicle Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(40, 75, 50, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Vehicle Body with more detail
      if (type === "VAN") {
        // Main body
        const grad = ctx.createLinearGradient(0, 10, 0, 60);
        grad.addColorStop(0, "#94a3b8");
        grad.addColorStop(1, "#475569");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-10, 10, 100, 55, 10);
        ctx.fill();

        // Windows
        ctx.fillStyle = "#bae6fd";
        ctx.fillRect(60, 15, 25, 20); // Front window
        ctx.fillRect(10, 15, 40, 20); // Side window

        // Wheels
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(15, 65, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(75, 65, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(15, 65, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(75, 65, 5, 0, Math.PI * 2);
        ctx.fill();

        // Headlights
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(90, 45, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === "TRUCK") {
        // Cab
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.roundRect(-10, 0, 45, 40, 5);
        ctx.fill();
        // Trailer
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.roundRect(35, 20, 80, 45, 5);
        ctx.fill();
        // Window
        ctx.fillStyle = "#bae6fd";
        ctx.fillRect(15, 5, 20, 15);
        // Wheels
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(10, 65, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(60, 65, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(95, 65, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === "MOTO") {
        // Frame
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(10, 60);
        ctx.lineTo(35, 35);
        ctx.lineTo(60, 60);
        ctx.stroke();

        // Wheels
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(10, 60, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(60, 60, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(10, 60, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(60, 60, 6, 0, Math.PI * 2);
        ctx.fill();

        // Body/Tank
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.roundRect(20, 30, 35, 15, 5);
        ctx.fill();
      } else {
        // CAR
        const grad = ctx.createLinearGradient(0, 20, 0, 65);
        grad.addColorStop(0, "#60a5fa");
        grad.addColorStop(1, "#2563eb");
        ctx.fillStyle = grad;

        // Body
        ctx.beginPath();
        ctx.moveTo(-5, 65);
        ctx.lineTo(95, 65);
        ctx.lineTo(90, 40);
        ctx.lineTo(60, 40);
        ctx.lineTo(50, 20);
        ctx.lineTo(10, 20);
        ctx.lineTo(0, 40);
        ctx.closePath();
        ctx.fill();

        // Windows
        ctx.fillStyle = "#bae6fd";
        ctx.beginPath();
        ctx.moveTo(15, 25);
        ctx.lineTo(45, 25);
        ctx.lineTo(55, 40);
        ctx.lineTo(15, 40);
        ctx.closePath();
        ctx.fill();

        // Wheels
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(15, 65, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(75, 65, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(15, 65, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(75, 65, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Character or Obstacle in vehicle
      ctx.save();
      ctx.translate(35, 25);
      ctx.scale(0.6, 0.6);
      if (obstacleType) {
        let depth = 10;
        if (obstacleType === "moro_bot") depth = 12;
        if (obstacleType === "moro_jumper") depth = 12;
        if (obstacleType === "moro_fat") depth = 8;
        if (obstacleType === "ice_block") depth = 15;

        for (let i = depth; i >= 1; i--) {
          ctx.save();
          ctx.translate(-i * 0.5, i * 0.5);
          drawObstacleShape(obstacleType, false);
          ctx.restore();
        }
        drawObstacleShape(obstacleType, true);
      } else {
        drawMoro(-35, -35, 0, false, false, false, false, char);
      }

      // Draw Helmet
      const helmetColor =
        helmet === "HELMET_1"
          ? "#fff"
          : helmet === "HELMET_2"
            ? "#ef4444"
            : "#22d3ee";
      ctx.fillStyle = helmetColor;
      ctx.beginPath();
      ctx.arc(0, -45, 38, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Visor
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.roundRect(-28, -42, 56, 18, 5);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      if (!gamepads) return;

      let gp: Gamepad | null = null;
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          gp = gamepads[i];
          break;
        }
      }
      if (!gp) return;

      const s = stateRef.current;

      const isBtn = (idx: number) => {
        const b = gp?.buttons[idx];
        return !!(b && (b.pressed || b.value > 0.15 || b.touched));
      };

      const getAxis = (idx: number) => (gp?.axes[idx] !== undefined ? gp.axes[idx] : 0);

      // Horizontal Movement (Left Stick [0], Right Stick [2], D-Pad [14/15], Hat switch axes [4/9])
      const leftStickX = getAxis(0);
      const rightStickX = getAxis(2);
      const horizontalAxis = Math.abs(leftStickX) > 0.2 ? leftStickX : (Math.abs(rightStickX) > 0.2 ? rightStickX : 0);

      const dpadLeft = isBtn(14) || horizontalAxis < -0.25 || getAxis(4) < -0.5 || getAxis(9) < -0.5;
      const dpadRight = isBtn(15) || horizontalAxis > 0.25 || getAxis(4) > 0.5 || getAxis(9) > 0.5;

      if (dpadLeft) {
        s.gamepadInput.left = true;
        s.lastInputTime = Date.now();
      } else {
        s.gamepadInput.left = false;
      }

      if (dpadRight) {
        s.gamepadInput.right = true;
        s.lastInputTime = Date.now();
      } else {
        s.gamepadInput.right = false;
      }

      // Jump (Button 0 [A/Cross], Button 3 [Y/Triangle], D-pad Up [12], Left Stick Up, Right Stick Up)
      const leftStickY = getAxis(1);
      const rightStickY = getAxis(3);
      const jumpPressed = isBtn(0) || isBtn(3) || isBtn(12) || leftStickY < -0.4 || rightStickY < -0.4 || getAxis(5) < -0.5;
      if (jumpPressed && !s.lastJumpPressed) {
        jump();
        s.lastInputTime = Date.now();
      }
      s.lastJumpPressed = jumpPressed;

      // Dash (Button 1 [B/Circle], Right Bumper [5], Right Trigger [7] / Axis 5)
      const dashPressed = isBtn(1) || isBtn(5) || isBtn(7) || getAxis(5) > 0.3;
      if (dashPressed && !s.lastDashPressed) {
        dash();
        s.lastInputTime = Date.now();
      }
      s.lastDashPressed = dashPressed;

      // Use Item (Button 2 [X/Square], Left Bumper [4], Left Trigger [6] / Axis 4)
      const itemPressed = isBtn(2) || isBtn(4) || isBtn(6) || getAxis(4) > 0.3;
      if (itemPressed && !s.lastItemPressed) {
        useItem();
        s.lastInputTime = Date.now();
      }
      s.lastItemPressed = itemPressed;

      // Pause (Start/Options [9], Select/Back [8], Home/Guide [16], L3 [10], R3 [11])
      const pausePressed = isBtn(9) || isBtn(8) || isBtn(16) || isBtn(10) || isBtn(11);
      if (pausePressed && !s.lastPausePressed) {
        setIsPaused((p) => !p);
        s.lastInputTime = Date.now();
      }
      s.lastPausePressed = pausePressed;

      s.lastButtonState = gp.buttons.map((b) => b.pressed || b.value > 0.15 || b.touched);
    };

    const loop = () => {
      const s = stateRef.current;
      pollGamepad();
      const config = difficultyConfig[difficulty];
      s.frameCount++;
      if (!isPaused && !isAITalking) {
        // s.frameCount++; // Moved outside for animations

        // Auto-Quit Logic: 1 minute = 60000ms
        if (Date.now() - s.lastInputTime > 60000) {
          onQuitRef.current();
          return;
        }

        if (s.blinkTimer > 0) s.blinkTimer--;
        else if (Math.random() < 0.01) s.blinkTimer = 7;

        // Vitesse constante et progressive
        let currentSpeed = s.isKicked
          ? 0
          : config.baseSpeed +
            (s.dashTimer > 0 ? DASH_SPEED_BOOST : 0) +
            (s.boostTimer > 0 ? 10 : 0) +
            s.score / 1000;

        // Map specific speed adjustments
        if (mapType === MapType.SPEED_TRAINING) {
          currentSpeed *= 1.5; // 50% faster
          currentSpeed += s.score / 500; // Faster progression
        } else if (mapType === MapType.MORO_KART) {
          currentSpeed *= 1.2; // 20% faster
          if (s.raceCountdown > 0) {
            s.raceCountdown--;
            currentSpeed = 0;
          }
          if (s.ghostTimer > 0) {
            s.ghostTimer--;
            currentSpeed = 0;
          }
          if (s.isSlipping > 0) {
            s.isSlipping--;
            currentSpeed *= 0.5;
          }
        }

        if (s.isKicked) {
          // Freeze player during initial impact for anime feel
          if (s.kickEffectTimer > 15) {
            // No movement
          } else {
            s.playerY += s.playerVY;
            s.playerVY += config.gravity;
            s.playerRotation += 0.2;
          }
          if (s.playerY > canvas.height + 200) {
            onGameOverRef.current(Math.floor(s.score), s.morobux, s.mikets);
            return;
          }
        } else {
          // Movement controls
          if (s.input.left || s.gamepadInput.left) s.playerX -= MOVE_SPEED;
          if (s.input.right || s.gamepadInput.right) s.playerX += MOVE_SPEED;

          // Auto-recovery to base position (150)
          if (!s.input.left && !s.gamepadInput.left && !s.input.right && !s.gamepadInput.right && s.playerX < 150) {
            s.playerX += 1;
          }

          s.playerX = Math.max(10, Math.min(canvas.width - 90, s.playerX));

          s.playerVY += config.gravity;
          s.playerY += s.playerVY;
          if (s.isJumping) {
            s.jumpProgress = Math.min(1, s.jumpProgress + 0.02);
          } else {
            s.jumpProgress = 0;
          }
          if (s.playerY > canvas.height - 110) {
            s.playerY = canvas.height - 110;
            s.playerVY = 0;
            s.isJumping = false;
            s.jumpCount = 0;
            s.jumpProgress = 0;
          }

          // Tutorial input tracking & finish gate check
          if (mapType === MapType.TUTORIAL) {
            if (s.input.left || s.gamepadInput.left) {
              setTutorialProgress((p) => (p.step === 1 && !p.movedLeft ? { ...p, movedLeft: true } : p));
            }
            if (s.input.right || s.gamepadInput.right) {
              setTutorialProgress((p) => (p.step === 1 && !p.movedRight ? { ...p, movedRight: true } : p));
            }
            if (s.dashTimer > 0) {
              setTutorialProgress((p) => (p.step === 3 && !p.dashed ? { ...p, dashed: true } : p));
            }
            s.tutorialDistance += currentSpeed / 10;
            if (s.frameCount % 6 === 0) {
              setTutorialProgress((p) => ({ ...p, distance: s.tutorialDistance }));
            }
            if (s.tutorialDistance >= 500) {
              setTutorialProgress((p) => {
                if (p.step === 5 && !p.reachedFinish) {
                  return { ...p, reachedFinish: true, step: 6 };
                }
                return p;
              });
            }
          }

          // Map specific movement adjustments
          if (mapType === MapType.KICKING_TRAINING && s.dashTimer > 0) {
            s.playerX += 2; // Extra forward movement during kick
          }

          if (mapType === MapType.MORO_KART) {
            const lapDistance = 5000;
            const currentLap = Math.floor(s.score / lapDistance) + 1;
            if (currentLap > s.laps) {
              s.laps = currentLap;
              if (s.laps > s.maxLaps && !s.raceFinished) {
                s.raceFinished = true;
                s.raceResults.push({
                  name: "You",
                  place: s.raceResults.length + 1,
                });
              }
            }

            if (s.opponents.length === 0) {
              s.opponents = [
                {
                  id: 1,
                  name: "Pimo Ball",
                  x: 250,
                  y: canvas.height - 110,
                  vx: 0,
                  vy: 0,
                  laps: 1,
                  finished: false,
                  item: null,
                  character: {
                    ...OBSTACLE_CHARACTERS.bot,
                    name: "Ball",
                    bodyColor: "#eab308",
                  },
                  vehicle: "CAR",
                  obstacleType: "ball",
                },
                {
                  id: 2,
                  name: "Pimo Cactus",
                  x: 400,
                  y: canvas.height - 110,
                  vx: 0,
                  vy: 0,
                  laps: 1,
                  finished: false,
                  item: null,
                  character: {
                    ...OBSTACLE_CHARACTERS.ninja,
                    name: "Cactus",
                    bodyColor: "#22c55e",
                  },
                  vehicle: "TRUCK",
                  obstacleType: "cactus",
                },
                {
                  id: 3,
                  name: "Pimo Ice",
                  x: 550,
                  y: canvas.height - 110,
                  vx: 0,
                  vy: 0,
                  laps: 1,
                  finished: false,
                  item: null,
                  character: {
                    ...OBSTACLE_CHARACTERS.flyer,
                    name: "Ice",
                    bodyColor: "#bae6fd",
                  },
                  vehicle: "VAN",
                  obstacleType: "ice_block",
                },
                {
                  id: 4,
                  name: "Pimo Ninja",
                  x: 700,
                  y: canvas.height - 110,
                  vx: 0,
                  vy: 0,
                  laps: 1,
                  finished: false,
                  item: null,
                  character: OBSTACLE_CHARACTERS.ninja,
                  vehicle: "MOTO",
                  obstacleType: "moro_ninja",
                },
                {
                  id: 5,
                  name: "Pimo Boss",
                  x: 850,
                  y: canvas.height - 110,
                  vx: 0,
                  vy: 0,
                  laps: 1,
                  finished: false,
                  item: null,
                  character: OBSTACLE_CHARACTERS.fat,
                  vehicle: "VAN",
                  obstacleType: "moro_fat",
                },
              ];
            }

            if (s.raceCountdown <= 0 && !s.raceFinished) {
              s.opponents.forEach((o) => {
                if (!o.finished) {
                  o.x += config.baseSpeed * 1.05 + Math.random() * 1.5;
                  if (o.x > lapDistance * o.laps) {
                    o.laps++;
                    if (o.laps > s.maxLaps) {
                      o.finished = true;
                      s.raceResults.push({
                        name: o.name,
                        place: s.raceResults.length + 1,
                      });
                    }
                  }
                  // Randomly use item against player
                  if (Math.random() < 0.002) {
                    const item = ["banana", "ghost", "anti_moro"][
                      Math.floor(Math.random() * 3)
                    ];
                    if (item === "ghost") {
                      s.ghostTimer = 180;
                      playSound("kick");
                    } else if (item === "anti_moro") {
                      s.isSlipping = 120;
                      playSound("kick");
                    }
                  }
                }
              });
            }

            if (s.raceResults.length >= 6) {
              onGameOverRef.current(Math.floor(s.score), s.morobux, s.mikets);
              return;
            }
          }

          if (s.dashTimer > 0) s.dashTimer--;
          if (s.shieldTimer > 0) s.shieldTimer--;
          if (s.boostTimer > 0) s.boostTimer--;
          if (s.magnetTimer > 0) s.magnetTimer--;
          if (s.trophyTimer > 0) s.trophyTimer--;
          if (s.morobuxCollectTimer > 0) s.morobuxCollectTimer--;
          if (s.coachTipTimer > 0) s.coachTipTimer--;
          if (s.invincibilityTimer > 0) s.invincibilityTimer--;

          // Timer for Classed Map
          if (mapType === MapType.CLASSED && !s.isKicked) {
            s.timeLeft -= 1 / 60;
            if (Math.ceil(s.timeLeft) !== timeLeftDisplay) {
              setTimeLeftDisplay(Math.ceil(s.timeLeft));
            }
            if (s.timeLeft <= 0) {
              s.timeLeft = 0;
              onGameOverRef.current(Math.floor(s.score), s.morobux, s.mikets);
              return;
            }
          }
        }

        // Spawn régulier et automatique
        if (
          !customMapData &&
          s.frameCount % config.freq === 0 &&
          !s.isKicked &&
          (mapType !== MapType.MORO_KART || s.raceCountdown <= 0)
        ) {
          const rand = Math.random();
          let type = "star";

          if (mapType === MapType.AGAINST_BOT) {
            // In Against Bot map, stars and balls are replaced by moro bots
            // Every 1500 points, spawn a boss
            const scoreInt = Math.floor(s.score);
            if (
              scoreInt > 0 &&
              scoreInt % 1500 < 20 &&
              !s.obstacles.some((o) => o.type === "moro_fat")
            ) {
              type = "moro_fat";
            } else if (rand < 0.2) {
              type = "gem";
            } else if (rand < 0.25) {
              const pTypes = ["shield", "boost", "magnet"];
              type = pTypes[Math.floor(Math.random() * pTypes.length)];
            } else {
              const botRand = Math.random();
              if (botRand < 0.2) type = "moro_flyer";
              else if (botRand < 0.4) type = "moro_ninja";
              else if (botRand < 0.6) type = "moro_jumper";
              else type = "moro_bot";
            }
          } else if (mapType === MapType.MIKETS) {
            if (rand < 0.1) type = "gem";
            else if (rand < 0.4)
              type = "miket"; // 30% chance of miket
            else if (rand < 0.45) {
              const pTypes = ["shield", "boost", "magnet"];
              type = pTypes[Math.floor(Math.random() * pTypes.length)];
            } else if (rand < 0.6) type = "ball";
          } else if (mapType === MapType.DESERT) {
            if (rand < 0.2) type = "gem";
            else if (rand < 0.25) type = "miket";
            else if (rand < 0.3) {
              const pTypes = ["shield", "boost", "magnet"];
              type = pTypes[Math.floor(Math.random() * pTypes.length)];
            } else if (rand < 0.6) type = "cactus";
            else type = "star";
          } else if (mapType === MapType.JUNGLE) {
            if (rand < 0.2) type = "gem";
            else if (rand < 0.25) type = "miket";
            else if (rand < 0.3) {
              const pTypes = ["shield", "boost", "magnet"];
              type = pTypes[Math.floor(Math.random() * pTypes.length)];
            } else if (rand < 0.6) type = "vine";
            else type = "star";
          } else if (mapType === MapType.ICE_CAVE) {
            if (rand < 0.2) type = "gem";
            else if (rand < 0.25) type = "miket";
            else if (rand < 0.3) {
              const pTypes = ["shield", "boost", "magnet"];
              type = pTypes[Math.floor(Math.random() * pTypes.length)];
            } else if (rand < 0.6) type = "ice_block";
            else type = "star";
          } else if (mapType === MapType.SPEED_TRAINING) {
            if (rand < 0.1) type = "gem";
            else if (rand < 0.15) type = "miket";
            else if (rand < 0.3) {
              const pTypes = ["boost", "speed", "trophy"]; // More speed/trophy items
              type = pTypes[Math.floor(Math.random() * pTypes.length)];
            } else if (rand < 0.6)
              type = "moro_ninja"; // Fast enemies
            else type = "star";
          } else if (mapType === MapType.MORO_KART) {
            if (rand < 0.05) type = "gem";
            else if (rand < 0.1) type = "miket";
            else if (rand < 0.25) {
              const pTypes = ["boost", "trophy"]; // More powerups in kart
              type = pTypes[Math.floor(Math.random() * pTypes.length)];
            } else if (rand < 0.35) type = "oil";
            else if (rand < 0.45) type = "banana";
            else if (rand < 0.55) type = "ghost_item";
            else if (rand < 0.65) type = "anti_ball";
            else type = "nothing";
          } else if (mapType === MapType.KICKING_TRAINING) {
          } else if (mapType === MapType.NEON_CITY) {
            if (rand < 0.15) type = "star_coin";
            else if (rand < 0.30) type = "boost_pad";
            else if (rand < 0.45) type = "cyber_drone";
            else if (rand < 0.60) type = "laser_barrier";
            else if (rand < 0.75) type = "gem";
            else type = "shield";
          } else if (mapType === MapType.COSMIC_ORBIT) {
            if (rand < 0.15) type = "star_coin";
            else if (rand < 0.30) type = "black_hole";
            else if (rand < 0.45) type = "ball";
            else if (rand < 0.60) type = "boost_pad";
            else if (rand < 0.75) type = "gem";
            else type = "shield";
          } else if (mapType === MapType.CANDY_KINGDOM) {
            if (rand < 0.15) type = "star_coin";
            else if (rand < 0.30) type = "spring_pad";
            else if (rand < 0.45) type = "lollipop";
            else if (rand < 0.60) type = "boost_pad";
            else if (rand < 0.75) type = "gem";
            else type = "star";
          } else if (mapType === MapType.TUTORIAL) {
            const dist = s.tutorialDistance;
            if (dist < 80) {
              type = "gem";
            } else if (dist < 180) {
              if (rand < 0.45) type = "star";
              else if (rand < 0.7) type = "spring_pad";
              else type = "gem";
            } else if (dist < 320) {
              if (rand < 0.45) type = "ice_block";
              else if (rand < 0.75) type = "ball";
              else type = "gem";
            } else if (dist < 440) {
              if (rand < 0.4) {
                const pTypes = ["magnet", "shield", "boost"];
                type = pTypes[Math.floor(Math.random() * pTypes.length)];
              } else if (rand < 0.7) type = "gem";
              else type = "star_coin";
            } else {
              if (rand < 0.3) type = "star";
              else if (rand < 0.6) type = "gem";
              else type = "boost_pad";
            }
          } else {
            if (rand < 0.2) type = "gem";
            else if (rand < 0.25) type = "miket";
            else if (rand < 0.3) {
              const pTypes = ["shield", "boost", "magnet", "trophy"];
              type = pTypes[Math.floor(Math.random() * pTypes.length)];
            } else if (rand < 0.45) type = "ball";
            else if (rand < 0.5) type = "moro_ninja";
            else if (rand < 0.55) type = "moro_flyer";
            else if (rand < 0.6) type = "moro_jumper";
            else type = "star";
          }

          const vy =
            type === "ball" ||
            type === "star" ||
            type === "vine" ||
            type === "moro_jumper"
              ? -Math.random() * 5
              : 0;
          const vx =
            type === "ball" || type === "ice_block"
              ? -(Math.random() * 2 + 1)
              : type === "moro_ninja"
                ? -(Math.random() * 3 + 3)
                : 0;
          const yPos =
            type === "vine" || type === "moro_flyer" || type === "cyber_drone"
              ? canvas.height - 220
              : type === "black_hole" || type === "star_coin"
                ? canvas.height - (140 + Math.random() * 80)
                : type === "boost_pad" || type === "spring_pad"
                  ? canvas.height - 95
                  : canvas.height - 140;

          s.obstacles.push({
            x: canvas.width,
            y: yPos,
            vx,
            vy,
            type,
            id: Date.now(),
            phase: Math.random() * Math.PI * 2,
            seed: Math.random(),
          });
        }

        // Coach Logic
        if (s.frameCount % 180 === 0 && !s.isKicked && s.coachTipTimer <= 0) {
          const nearObstacle = s.obstacles.find(
            (o) => o.x - s.playerX < 200 && o.x > s.playerX,
          );
          const nearPowerup = s.obstacles.find(
            (o) =>
              (o.type === "shield" ||
                o.type === "boost" ||
                o.type === "magnet" ||
                o.type === "speed") &&
              o.x - s.playerX < 300 &&
              o.x > s.playerX,
          );
          const currentSpeed =
            config.baseSpeed +
            (s.dashTimer > 0 ? DASH_SPEED_BOOST : 0) +
            (s.boostTimer > 0 ? 10 : 0) +
            s.score / 1000;

          if (nearPowerup) {
            s.coachTip = getTranslation("COACH_GRAB", languageRef.current, {
              item: nearPowerup.type,
            });
            s.coachTipTimer = 120;
            playMoroVoice(s.coachTip);
          } else if (
            nearObstacle &&
            nearObstacle.type === "ball" &&
            !s.isJumping
          ) {
            s.coachTip = getTranslation("COACH_JUMP", languageRef.current);
            s.coachTipTimer = 90;
            playMoroVoice(s.coachTip);
          } else if (
            s.obstacles.filter((o) => o.x > s.playerX && o.x < s.playerX + 400)
              .length > 3
          ) {
            s.coachTip = getTranslation("COACH_CROWDED", languageRef.current);
            s.coachTipTimer = 120;
            playMoroVoice(s.coachTip);
          } else if (currentSpeed > 20) {
            s.coachTip = getTranslation("COACH_FLYING", languageRef.current);
            s.coachTipTimer = 120;
            playMoroVoice(s.coachTip);
          } else if (mapType === MapType.CLASSED && s.timeLeft < 15) {
            s.coachTip = getTranslation("COACH_TIME", languageRef.current);
            s.coachTipTimer = 120;
            playMoroVoice(s.coachTip);
          } else if (s.score > 500 && s.score < 600) {
            s.coachTip = getTranslation("COACH_SPEED", languageRef.current);
            s.coachTipTimer = 120;
            playMoroVoice(s.coachTip);
          }
        }

        // Dust particles for Desert Map
        if (
          mapType === MapType.DESERT &&
          !s.isJumping &&
          !s.isKicked &&
          s.frameCount % 3 === 0
        ) {
          s.particles.push({
            x: s.playerX + 10,
            y: s.playerY + 60,
            vx: -Math.random() * 2 - 1,
            vy: -Math.random() * 1,
            life: 0,
            maxLife: 30 + Math.random() * 20,
            size: 5 + Math.random() * 10,
            color: `rgba(217, 119, 6, ${Math.random() * 0.5 + 0.2})`, // #d97706 with opacity
          });
        }

        // Update particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;

          if (p.type === "confetti") {
            p.vy += 0.05; // Gravity
            p.x += Math.sin(p.life * 0.1) * 2; // Sway
          } else {
            p.size += 0.2; // Expand slightly
          }

          if (p.life >= p.maxLife || p.y > canvas.height) {
            s.particles.splice(i, 1);
          }
        }

        // Update obstacles position and collision
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];

          // Magnet effect
          if (s.magnetTimer > 0 && obs.type === "gem") {
            const mdx = s.playerX + 35 - (obs.x + 22);
            const mdy = s.playerY + 35 - (obs.y + 22);
            obs.x += mdx * 0.1;
            obs.y += mdy * 0.1;
          }

          // Freeze movement during initial impact for anime feel
          if (s.kickEffectTimer > 15) {
            // No movement
          } else {
            // Base horizontal movement
            obs.x -= currentSpeed;
            if (obs.vx) obs.x += obs.vx;

            // Varied AI Behaviors
            if (!obs.isKicked) {
              if (obs.type === "star") {
                // Unpredictable wavy movement
                obs.y += Math.sin(s.frameCount * 0.05 + (obs.phase || 0)) * 3;
                obs.x += Math.cos(s.frameCount * 0.03 + (obs.phase || 0)) * 2;
              } else if (obs.type === "moro_bot") {
                // Charge at player if close
                const distToPlayer = obs.x - s.playerX;
                if (distToPlayer > 0 && distToPlayer < 400) {
                  obs.vx = (obs.vx || 0) - 0.25; // Accelerate left faster
                  obs.isWarning = true; // Force warning when charging
                }
              } else if (obs.type === "moro_flyer") {
                // Swooping movement
                obs.y += Math.sin(s.frameCount * 0.08 + (obs.phase || 0)) * 4;
                const distToPlayer = obs.x - s.playerX;
                if (distToPlayer > 0 && distToPlayer < 300) {
                  // Dive towards player height
                  const targetY = s.playerY;
                  obs.y += (targetY - obs.y) * 0.02;
                  obs.isWarning = true;
                }
              } else if (obs.type === "moro_ninja") {
                // Speed bursts
                if (s.frameCount % 60 < 20) {
                  obs.vx = (obs.vx || 0) - 0.6;
                  obs.isWarning = true;
                } else {
                  obs.vx = (obs.vx || 0) * 0.95;
                }
              } else if (obs.type === "ball") {
                // Hops only when close to player
                if (
                  obs.isWarning &&
                  s.frameCount % 60 === 0 &&
                  obs.y > canvas.height - 150
                ) {
                  obs.vy = -10 - Math.random() * 5;
                }
              }
            }

            if (obs.vy !== undefined) {
              obs.y += obs.vy;
              obs.vy += config.gravity * 0.5; // Obstacles have lighter gravity

              // Bounce on floor
              if (obs.y > canvas.height - 140) {
                obs.y = canvas.height - 140;
                obs.vy *= -0.6; // Bounce factor
                if (obs.type === "moro_jumper" && !obs.isKicked) {
                  obs.vy = -12 - Math.random() * 5; // Jump high again
                }
              }
            }
          }

          const dx = s.playerX + 35 - (obs.x + 22);
          const dy = s.playerY + 35 - (obs.y + 22);
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Pre-kick warning (Enemy "wants" to kick)
          if (
            dist < 180 &&
            !["gem", "shield", "boost", "magnet", "speed"].includes(obs.type) &&
            !s.isKicked &&
            !obs.isKicked
          ) {
            obs.isWarning = true;
            // Calculate charge intensity (0 to 1)
            obs.charge = Math.max(0, 1 - (dist - 48) / (180 - 48));
          } else {
            obs.isWarning = false;
            obs.charge = 0;
          }

          if (dist < 35 && !s.isKicked && !obs.isKicked) {
            if (obs.type === "gem") {
              s.morobux++;
              setMorobuxCollected(s.morobux);
              if (onCollectItem) onCollectItem("morobux");
              s.morobuxCollectTimer = 10;
              s.obstacles.splice(i, 1);
              if (mapType === MapType.TUTORIAL) {
                setTutorialProgress((p) => (p.step === 4 ? { ...p, collectedCoin: true } : p));
              }
              if (mapType === MapType.CLASSED) {
                s.timeLeft += 2;
                setTimeLeftDisplay(Math.ceil(s.timeLeft));
                s.timeBonuses.push({
                  x: obs.x,
                  y: obs.y,
                  text: "+2s",
                  timer: 60,
                });
              }
            } else if (obs.type === "star_coin") {
              s.score += 100;
              s.morobux += 2;
              setMorobuxCollected(s.morobux);
              if (onCollectItem) onCollectItem("morobux");
              playSound("powerup");
              if (mapType === MapType.TUTORIAL) {
                setTutorialProgress((p) => (p.step === 4 ? { ...p, collectedCoin: true } : p));
              }
              s.timeBonuses.push({
                x: obs.x,
                y: obs.y,
                text: "+100 COIN",
                timer: 60,
              });
              s.obstacles.splice(i, 1);
            } else if (obs.type === "boost_pad") {
              s.boostTimer = 300; // 5s super speed
              s.kickEffectTimer = 15;
              playSound("powerup");
              if (mapType === MapType.TUTORIAL) {
                setTutorialProgress((p) => (p.step === 4 ? { ...p, collectedPowerup: true } : p));
              }
              s.timeBonuses.push({
                x: obs.x,
                y: obs.y,
                text: "SPEED BOOST!",
                timer: 60,
              });
              s.obstacles.splice(i, 1);
            } else if (obs.type === "spring_pad") {
              s.playerVY = -24; // Super bounce jump!
              s.isJumping = true;
              s.kickEffectTimer = 15;
              playSound("powerup");
              if (mapType === MapType.TUTORIAL) {
                setTutorialProgress((p) => (p.step === 4 ? { ...p, collectedPowerup: true } : p));
              }
              s.timeBonuses.push({
                x: obs.x,
                y: obs.y,
                text: "SUPER BOUNCE!",
                timer: 60,
              });
              s.obstacles.splice(i, 1);
            } else if (obs.type === "miket") {
              s.mikets++;
              setMiketsCollected(s.mikets);
              if (onCollectItem) onCollectItem("miket");
              s.obstacles.splice(i, 1);
            } else if (
              ["shield", "boost", "magnet", "speed", "trophy"].includes(
                obs.type,
              )
            ) {
              if (obs.type === "shield") s.shieldTimer = 600; // 10s
              if (obs.type === "boost" || obs.type === "speed")
                s.boostTimer = 600; // 10s
              if (obs.type === "magnet") s.magnetTimer = 600; // 10s
              if (obs.type === "trophy") s.trophyTimer = 600; // 10s
              playSound("powerup");
              s.obstacles.splice(i, 1);
              if (mapType === MapType.TUTORIAL) {
                setTutorialProgress((p) => (p.step === 4 ? { ...p, collectedPowerup: true } : p));
              }
              if (mapType === MapType.CLASSED) {
                s.timeLeft += 5;
                setTimeLeftDisplay(Math.ceil(s.timeLeft));
                s.timeBonuses.push({
                  x: obs.x,
                  y: obs.y,
                  text: "+5s",
                  timer: 60,
                });
              }
            } else {
              if (s.dashTimer > 0) {
                // Player kicks the obstacle!
                playSound("kick");
                s.shake = 20; // Increased shake
                s.kickEffectTimer = 20; // Trigger anime effect
                s.score += 50; // Bonus points for kicking
                // Launch the obstacle away
                obs.vx = 20;
                obs.vy = -15;
                obs.isKicked = true;
                obs.isWarning = false;
                if (mapType === MapType.TUTORIAL) {
                  setTutorialProgress((p) => (p.step === 3 ? { ...p, dashed: true, smashedBlock: true } : p));
                }
              } else if (mapType === MapType.TUTORIAL) {
                // Safe friendly collision bounce in tutorial
                playSound("kick");
                s.shake = 10;
                s.invincibilityTimer = 90;
                obs.vx = 15;
                obs.vy = -10;
                obs.isKicked = true;
                obs.isWarning = false;
                s.coachTip = "No worries! Jump over or press Dash (X) to smash it!";
                s.coachTipTimer = 100;
              } else if (s.shieldTimer > 0) {
                s.shieldTimer = 0;
                s.shake = 10;
                s.kickEffectTimer = 20; // Trigger anime effect
                playSound("kick");
                s.obstacles.splice(i, 1);
              } else if (s.invincibilityTimer <= 0) {
                if (mapType === MapType.MORO_KART) {
                  if (obs.type === "oil") {
                    s.isSlipping = 60;
                    playSound("kick");
                  } else if (obs.type === "banana") {
                    s.currentItem = "banana";
                    playSound("powerup");
                  } else if (obs.type === "ghost_item") {
                    s.currentItem = "ghost";
                    playSound("powerup");
                  } else if (obs.type === "anti_ball") {
                    s.currentItem = "anti_ball";
                    playSound("powerup");
                  } else if (obs.type === "nothing") {
                    // No item
                  } else {
                    s.playerX -= 20; // Reduced from 50
                    s.shake = 10;
                    playSound("kick");
                    obs.vx = 10;
                    obs.vy = -5;
                  }
                  if (
                    ["oil", "banana", "ghost_item", "anti_ball"].includes(
                      obs.type,
                    )
                  ) {
                    s.obstacles.splice(i, 1);
                  }
                } else {
                  s.hearts--;
                  setHeartsDisplay(s.hearts);

                  if (s.hearts <= 0) {
                    s.isKicked = true;
                    s.playerVY = -15;
                    s.kickEffectTimer = 20; // Trigger anime effect
                    playSound("kick");
                    s.shake = 30;

                    // Launch the obstacle away
                    obs.vx = 15;
                    obs.vy = -10;
                  } else {
                    // Lost a heart, but still alive
                    playSound("kick");
                    s.shake = 20;
                    s.kickEffectTimer = 20; // Trigger anime effect
                    s.invincibilityTimer = 60; // 1 second of invincibility at 60fps

                    // Launch the obstacle away so it doesn't hit again immediately
                    obs.vx = 15;
                    obs.vy = -10;
                    obs.isKicked = true;
                    obs.isWarning = false;
                  }
                }
              }
            }
          }
          if (obs.x < -100) {
            if (customMapData) {
              obs.x = canvas.width + 100; // Wrap around
            } else {
              s.obstacles.splice(i, 1);
            }
          }
        }

        // Update time bonuses
        s.timeBonuses = s.timeBonuses.filter((b) => {
          b.timer--;
          b.y -= 1;
          return b.timer > 0;
        });

        if (!s.isKicked) {
          const speedFactor = mapType === MapType.MORO_KART ? 1.5 : 1 / 50;
          let currentMult = config.scoreMult;
          if (s.trophyTimer > 0) currentMult *= 2;
          s.score += currentSpeed * speedFactor * currentMult;
          const currentFloorScore = Math.floor(s.score);
          setGameScore(currentFloorScore);

          if (currentFloorScore >= 1000) {
            onTriggerAchievement?.('distance_1000');
          }
          if (currentFloorScore >= 5000) {
            onTriggerAchievement?.('distance_5000');
          }

          if (s.score >= 1000 && !s.hasWon) {
            s.hasWon = true;
            s.coachTip =
              getTranslation("COACH_WIN", languageRef.current) || "YOU WIN!";
            s.coachTipTimer = 300;
            playMoroVoice(s.coachTip);

            // Spawn confetti
            const colors = [
              "#f43f5e",
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#8b5cf6",
            ];
            for (let i = 0; i < 200; i++) {
              s.particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width,
                y: -50 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 10,
                vy: Math.random() * 5 + 2,
                life: 0,
                maxLife: 300 + Math.random() * 100,
                size: 4 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: "confetti",
              });
            }
          }
        }
        if (s.shake > 0) s.shake *= 0.85;
      }

      if (s.kickEffectTimer > 0) s.kickEffectTimer--;

      // Rendering
      ctx.save();

      // Anime Zoom Effect
      if (s.kickEffectTimer > 15) {
        const zoom = 1.1;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      if (s.shake > 0)
        ctx.translate(
          (Math.random() - 0.5) * s.shake,
          (Math.random() - 0.5) * s.shake,
        );

      if (customMapImage) {
        const bgOffset = (s.score * 10) % canvas.width;
        ctx.drawImage(
          customMapImage,
          -bgOffset,
          0,
          canvas.width,
          canvas.height,
        );
        ctx.drawImage(
          customMapImage,
          canvas.width - bgOffset,
          0,
          canvas.width,
          canvas.height,
        );
      } else {
        const isLiquidGlass =
          document.documentElement.classList.contains("liquid-glass");
        if (!isLiquidGlass) {
          const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          if (
            window.location.pathname.includes("custom")
          ) {
            // Let the global SkyBackground shine through
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.DESERT) {
            skyGrad.addColorStop(0, "#fcd34d");
            skyGrad.addColorStop(1, "#f59e0b");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.JUNGLE) {
            skyGrad.addColorStop(0, "#14532d");
            skyGrad.addColorStop(1, "#064e3b");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.ICE_CAVE) {
            skyGrad.addColorStop(0, "#e0f2fe");
            skyGrad.addColorStop(1, "#bae6fd");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.SPEED_TRAINING) {
            skyGrad.addColorStop(0, "#701a75");
            skyGrad.addColorStop(1, "#4a044e");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.MORO_KART) {
            skyGrad.addColorStop(0, "#1e3a8a");
            skyGrad.addColorStop(1, "#1e1b4b");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.KICKING_TRAINING) {
            skyGrad.addColorStop(0, "#365314");
            skyGrad.addColorStop(1, "#1a2e05");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.VOLCANO) {
            skyGrad.addColorStop(0, "#450a0a");
            skyGrad.addColorStop(1, "#7f1d1d");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.CRYSTAL_CAVES) {
            skyGrad.addColorStop(0, "#0f172a");
            skyGrad.addColorStop(1, "#1e3a8a");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.NEON_CITY) {
            skyGrad.addColorStop(0, "#090514");
            skyGrad.addColorStop(0.6, "#1e0b36");
            skyGrad.addColorStop(1, "#3b0764");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.COSMIC_ORBIT) {
            skyGrad.addColorStop(0, "#020617");
            skyGrad.addColorStop(0.5, "#0b0f29");
            skyGrad.addColorStop(1, "#1e1b4b");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.CANDY_KINGDOM) {
            skyGrad.addColorStop(0, "#fce7f3");
            skyGrad.addColorStop(0.5, "#fbcfe8");
            skyGrad.addColorStop(1, "#fda4af");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.MYSTIC_FOREST) {
            skyGrad.addColorStop(0, "#064e3b");
            skyGrad.addColorStop(0.5, "#065f46");
            skyGrad.addColorStop(1, "#047857");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.PIRATE_COVE) {
            skyGrad.addColorStop(0, "#1e3a8a");
            skyGrad.addColorStop(0.5, "#1d4ed8");
            skyGrad.addColorStop(1, "#0284c7");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.CYBER_GRID) {
            skyGrad.addColorStop(0, "#09090b");
            skyGrad.addColorStop(0.5, "#18181b");
            skyGrad.addColorStop(1, "#27272a");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (mapType === MapType.TUTORIAL) {
            skyGrad.addColorStop(0, "#0284c7");
            skyGrad.addColorStop(0.45, "#38bdf8");
            skyGrad.addColorStop(1, "#bae6fd");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            skyGrad.addColorStop(0, "#0f172a");
            skyGrad.addColorStop(1, "#1e1b4b");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Detailed Background Elements
        if (mapType === MapType.DESERT) {
          // Sun
          ctx.fillStyle = "#fef3c7";
          ctx.shadowBlur = 40;
          ctx.shadowColor = "#fbbf24";
          ctx.beginPath();
          ctx.arc(canvas.width - 100, 80, 40, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Distant Mountains (Slowest Parallax)
          const mtOffset = (s.score * 0.5) % canvas.width;
          ctx.fillStyle = "#92400e";
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * canvas.width - mtOffset, canvas.height - 50);
            ctx.lineTo(i * canvas.width - mtOffset + 200, canvas.height - 300);
            ctx.lineTo(i * canvas.width - mtOffset + 400, canvas.height - 50);
            ctx.fill();
          }

          // Dunes (Parallax with shading)
          const duneOffset1 = (s.score * 2) % canvas.width;
          const duneOffset2 = (s.score * 5) % canvas.width;

          // Far Dunes
          for (let i = -1; i <= 1; i++) {
            const x = i * canvas.width - duneOffset1;
            const grad = ctx.createLinearGradient(
              x,
              canvas.height - 200,
              x + canvas.width,
              canvas.height - 50,
            );
            grad.addColorStop(0, "#b45309");
            grad.addColorStop(1, "#78350f");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x, canvas.height - 50);
            ctx.quadraticCurveTo(
              x + canvas.width / 4,
              canvas.height - 150,
              x + canvas.width / 2,
              canvas.height - 80,
            );
            ctx.quadraticCurveTo(
              x + (3 * canvas.width) / 4,
              canvas.height - 200,
              x + canvas.width,
              canvas.height - 50,
            );
            ctx.fill();
          }

          // Near Dunes
          for (let i = -1; i <= 1; i++) {
            const x = i * canvas.width - duneOffset2;
            const grad = ctx.createLinearGradient(
              x,
              canvas.height - 120,
              x + canvas.width,
              canvas.height - 50,
            );
            grad.addColorStop(0, "#f59e0b");
            grad.addColorStop(1, "#d97706");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x, canvas.height - 50);
            ctx.quadraticCurveTo(
              x + canvas.width / 3,
              canvas.height - 120,
              x + (2 * canvas.width) / 3,
              canvas.height - 60,
            );
            ctx.quadraticCurveTo(
              x + (5 * canvas.width) / 6,
              canvas.height - 100,
              x + canvas.width,
              canvas.height - 50,
            );
            ctx.fill();
          }
        } else if (mapType === MapType.JUNGLE) {
          // Distant Trees (Multiple layers for 3D depth)
          const layers = [
            { offset: 0.8, color: "#064e3b", scale: 0.5, y: 100 },
            { offset: 1.5, color: "#065f46", scale: 0.7, y: 50 },
            { offset: 3, color: "#047857", scale: 1.0, y: 0 },
          ];

          layers.forEach((layer) => {
            const treeOffset = (s.score * layer.offset) % canvas.width;
            ctx.fillStyle = layer.color;
            for (let i = -1; i <= 1; i++) {
              for (let j = 0; j < 5; j++) {
                const x =
                  i * canvas.width - treeOffset + (j * canvas.width) / 5;
                const h = 200 * layer.scale;
                ctx.beginPath();
                ctx.moveTo(x, canvas.height - 50);
                ctx.lineTo(x + 25 * layer.scale, canvas.height - 50 - h);
                ctx.lineTo(x + 50 * layer.scale, canvas.height - 50);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(
                  x + 25 * layer.scale,
                  canvas.height - 50 - h,
                  30 * layer.scale,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();
              }
            }
          });

          // Vines with 3D sway
          ctx.strokeStyle = "#065f46";
          ctx.lineWidth = 4;
          for (let i = 0; i < canvas.width; i += 150) {
            const vineX = i + Math.sin(s.frameCount * 0.02 + i) * 20;
            const depth = Math.sin(s.frameCount * 0.01 + i) * 5; // Fake 3D depth sway
            ctx.beginPath();
            ctx.moveTo(vineX, 0);
            ctx.quadraticCurveTo(vineX + 20 + depth, 100, vineX - 10, 200);
            ctx.stroke();
          }
        } else if (mapType === MapType.ICE_CAVE) {
          // Stalactites (3D-ish with gradients)
          for (let i = 0; i < canvas.width; i += 100) {
            const x = i;
            const h = 80 + Math.sin(i) * 30;
            const grad = ctx.createLinearGradient(x, 0, x + 60, h);
            grad.addColorStop(0, "#e0f2fe");
            grad.addColorStop(1, "#bae6fd");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 30, h);
            ctx.lineTo(x + 60, 0);
            ctx.fill();
          }

          // Stalagmites (3D-ish with gradients)
          const iceOffset = (s.score * 4) % canvas.width;
          for (let i = -1; i <= 1; i++) {
            for (let j = 0; j < canvas.width; j += 150) {
              const x = i * canvas.width - iceOffset + j;
              const grad = ctx.createLinearGradient(
                x,
                canvas.height - 150,
                x + 80,
                canvas.height - 50,
              );
              grad.addColorStop(0, "#bae6fd");
              grad.addColorStop(1, "#7dd3fc");
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.moveTo(x, canvas.height - 50);
              ctx.lineTo(x + 40, canvas.height - 150);
              ctx.lineTo(x + 80, canvas.height - 50);
              ctx.fill();
            }
          }

          // Floating Ice Crystals (3D rotation)
          for (let i = 0; i < 15; i++) {
            const x =
              (Math.sin(i * 123 + s.frameCount * 0.005) * 0.5 + 0.5) *
              canvas.width;
            const y =
              (Math.cos(i * 456 + s.frameCount * 0.01) * 0.5 + 0.5) *
              canvas.height;
            const size = 5 + Math.sin(s.frameCount * 0.05 + i) * 3;
            const rot = s.frameCount * 0.02 + i;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.beginPath();
            ctx.moveTo(-size, 0);
            ctx.lineTo(0, -size * 1.5);
            ctx.lineTo(size, 0);
            ctx.lineTo(0, size * 1.5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // Sparkles
          ctx.fillStyle = "#fff";
          for (let i = 0; i < 20; i++) {
            const x =
              (Math.sin(i * 123 + s.frameCount * 0.01) * 0.5 + 0.5) *
              canvas.width;
            const y =
              (Math.cos(i * 456 + s.frameCount * 0.02) * 0.5 + 0.5) *
              canvas.height;
            ctx.globalAlpha = Math.sin(s.frameCount * 0.1 + i) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else if (mapType === MapType.VOLCANO) {
          // Real 3D Floor Grid & Deep Volcanos
          const horizonY = canvas.height * 0.4;

          // Draw deep distant 3D volcanos (polygonal shading)
          for (let i = -1; i <= 2; i++) {
            const vX = canvas.width / 2 + i * 500 - ((s.score * 0.5) % 1000);

            // Main dark cone
            ctx.fillStyle = "#450a0a";
            ctx.beginPath();
            ctx.moveTo(vX, horizonY - 100);
            ctx.lineTo(vX - 300, canvas.height);
            ctx.lineTo(vX + 300, canvas.height);
            ctx.fill();

            // Highlight side for 3D depth
            ctx.fillStyle = "#7f1d1d";
            ctx.beginPath();
            ctx.moveTo(vX, horizonY - 100);
            ctx.lineTo(vX, canvas.height);
            ctx.lineTo(vX + 300, canvas.height);
            ctx.fill();

            // Lava running down (Middle cut constraint)
            ctx.fillStyle = "#f97316";
            ctx.beginPath();
            ctx.moveTo(vX, horizonY - 100);
            // Squiggly flow
            ctx.lineTo(vX - 20, canvas.height / 2 + 100);
            ctx.lineTo(vX + 40, canvas.height);
            ctx.lineTo(vX - 20, canvas.height);
            ctx.lineTo(vX + 10, canvas.height / 2 + 80);
            ctx.fill();
          }

          // 3D Plane Floor Grid converging at horizon
          const gridZOffset = ((s.score * 15) % 100) / 100; // Moving rapidly forward 0-1
          ctx.strokeStyle = "rgba(249, 115, 22, 0.4)"; // Orange-red lava grid
          ctx.lineWidth = 3;
          ctx.beginPath();

          // Horizontal lines extending by depth 'z'
          for (let i = 0; i < 25; i++) {
            let z = i - gridZOffset;
            if (z < 0.1) continue;
            let y = horizonY + (canvas.height - horizonY) / z;
            if (y > canvas.height) continue;
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
          }

          // Vertical perspective lines
          for (let i = -20; i <= 20; i++) {
            let xOnHorizon = canvas.width / 2 + i * 40;
            let xOnBottom = canvas.width / 2 + i * 600;
            ctx.moveTo(xOnHorizon, horizonY);
            ctx.lineTo(xOnBottom, canvas.height);
          }
          ctx.stroke();

          // Embers flying into the 3D camera
          for (let i = 0; i < 40; i++) {
            const seed = i * 1337; // pseudo random
            // Z starts far (100) and moves toward camera (0)
            let z = 100 - ((s.frameCount * 2.5 + seed) % 100);
            if (z < 0.1) z = 0.1;
            const px =
              ((Math.sin(seed) * canvas.width * 1.5) / z) * 5 +
              canvas.width / 2;
            const py = ((Math.cos(seed) * canvas.height) / z) * 5 + horizonY;
            const r = Math.max(0.5, 50 / z);

            if (px > 0 && px < canvas.width && py > 0 && py < canvas.height) {
              ctx.globalAlpha = Math.min(1, z / 20); // Fade in from distance
              ctx.fillStyle = i % 3 === 0 ? "#fef08a" : "#ea580c";
              ctx.beginPath();
              ctx.arc(px, py, r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
        } else if (mapType === MapType.CRYSTAL_CAVES) {
          // Real 3D Tunnel/Cave
          const focusX = canvas.width / 2;
          const focusY = canvas.height / 2;
          const zSpeed = 0.3; // depth speed
          const frameZ = (s.score * zSpeed) % 1;
          const numRings = 15;
          const numSegments = 8; // Octagonal cave

          ctx.lineWidth = 2;
          for (let i = numRings; i >= 0; i--) {
            let z = i - frameZ;
            if (z < 0.1) continue;

            // Depth scaling factor
            const scale = 600 / z;
            const twist = z * 0.1 + Math.sin(s.frameCount * 0.01) * 0.5; // Tunnel twisting

            ctx.strokeStyle = `rgba(56, 189, 248, ${Math.min(1, 1.2 - z / numRings)})`;
            ctx.fillStyle = `rgba(2, 132, 199, ${Math.min(0.4, 1.2 - z / numRings)})`;

            // Draw a polygon ring
            ctx.beginPath();
            let pts = [];
            for (let j = 0; j <= numSegments; j++) {
              const angle = (j / numSegments) * Math.PI * 2 + twist;
              // Add jaggy terrain using a sine hash
              const radius =
                1.0 +
                Math.sin(
                  j * 7531 + Math.floor(i - frameZ + s.score * zSpeed) * 11,
                ) *
                  0.25;

              const px = focusX + Math.cos(angle) * scale * radius;
              const py = focusY + Math.sin(angle) * scale * radius;
              pts.push({ px, py });

              if (j === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.fill();
            ctx.stroke();

            // Connect lines to next Z layer to draw 3D wall segments
            if (i < numRings) {
              let nextZ = z + 1;
              let nextScale = 600 / nextZ;
              let nextTwist = nextZ * 0.1 + Math.sin(s.frameCount * 0.01) * 0.5;

              for (let j = 0; j < numSegments; j++) {
                const angle2 = (j / numSegments) * Math.PI * 2 + nextTwist;
                const radius2 =
                  1.0 +
                  Math.sin(
                    j * 7531 +
                      Math.floor(i + 1 - frameZ + s.score * zSpeed) * 11,
                  ) *
                    0.25;

                const rx2 = focusX + Math.cos(angle2) * nextScale * radius2;
                const ry2 = focusY + Math.sin(angle2) * nextScale * radius2;

                ctx.beginPath();
                ctx.moveTo(pts[j].px, pts[j].py);
                ctx.lineTo(rx2, ry2);
                ctx.stroke();
              }
            }
          }

          // Floating 3D Crystal Shards rushing camera
          for (let i = 0; i < 25; i++) {
            const seed = i * 888;
            let z = 20 - ((s.frameCount * 0.8 + seed) % 20);
            if (z < 0.1) z = 0.1;
            const px =
              ((Math.sin(seed * 11) * canvas.width * 1.5) / z) * 5 + focusX;
            const py =
              ((Math.cos(seed * 7) * canvas.height * 1.5) / z) * 5 + focusY;
            const r = Math.max(1, 150 / z);

            if (
              px > -r &&
              px < canvas.width + r &&
              py > -r &&
              py < canvas.height + r
            ) {
              ctx.globalAlpha = Math.min(1, z / 10);

              const rot = s.frameCount * 0.05 + seed;
              ctx.translate(px, py);
              ctx.rotate(rot);

              // 3D Diamond facet 1 (Light blue)
              ctx.fillStyle = "#7dd3fc";
              ctx.beginPath();
              ctx.moveTo(0, -r);
              ctx.lineTo(r / 2, 0);
              ctx.lineTo(0, r);
              ctx.lineTo(-r / 2, 0);
              ctx.fill();

              // 3D Diamond facet 2 (Dark blue shade)
              ctx.fillStyle = "#0284c7";
              ctx.beginPath();
              ctx.moveTo(0, -r);
              ctx.lineTo(r / 2, 0);
              ctx.lineTo(0, r);
              ctx.fill();

              ctx.rotate(-rot);
              ctx.translate(-px, -py);
            }
          }
          ctx.globalAlpha = 1;
        } else if (mapType === MapType.SPEED_TRAINING) {
          // Neon Grid Background
          ctx.strokeStyle = "rgba(217, 70, 239, 0.2)";
          ctx.lineWidth = 2;
          const speedOffset = (s.score * 10) % 100;
          for (let i = -100; i < canvas.width + 100; i += 100) {
            ctx.beginPath();
            ctx.moveTo(i - speedOffset, 0);
            ctx.lineTo(i - speedOffset, canvas.height);
            ctx.stroke();
          }
          for (let i = 0; i < canvas.height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
          }
          // Speed lines
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
          for (let i = 0; i < 10; i++) {
            const x =
              (Math.sin(i * 789 + s.frameCount * 0.1) * 0.5 + 0.5) *
              canvas.width;
            const y = (i * 40) % canvas.height;
            const len = 100 + Math.random() * 200;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + len, y);
            ctx.stroke();
          }
        } else if (mapType === MapType.MORO_KART) {
          // Racing Track Elements
          // Distant Grandstands with visitors
          const standOffset = (s.score * 1.5) % 400;
          ctx.fillStyle = "#1e293b";
          for (let i = -1; i <= 2; i++) {
            const x = i * 400 - standOffset;
            ctx.fillRect(x, canvas.height - 200, 300, 150);
            // Visitors
            for (let v = 0; v < 10; v++) {
              ctx.fillStyle = `hsl(${v * 36}, 70%, 50%)`;
              ctx.beginPath();
              ctx.arc(x + 30 + v * 25, canvas.height - 180, 8, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = "#ef4444";
            for (let j = 0; j < 5; j++) {
              ctx.fillRect(x + 20 + j * 50, canvas.height - 180, 40, 10);
            }
          }
          // Finish line pattern in distance
          const lineOffset = (s.score * 3) % 200;
          for (let i = -1; i <= 5; i++) {
            const x = i * 200 - lineOffset;
            ctx.fillStyle = "#fff";
            ctx.fillRect(x, canvas.height - 60, 20, 10);
            ctx.fillStyle = "#000";
            ctx.fillRect(x + 20, canvas.height - 60, 20, 10);
          }
        } else if (mapType === MapType.KICKING_TRAINING) {
          // Stadium Background
          // Floodlights
          ctx.fillStyle = "#334155";
          ctx.fillRect(100, 50, 20, 200);
          ctx.fillRect(canvas.width - 120, 50, 20, 200);
          ctx.fillStyle = "#fff";
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#fff";
          ctx.beginPath();
          ctx.arc(110, 50, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(canvas.width - 110, 50, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          // Goal posts in distance
          const goalOffset = (s.score * 2) % 600;
          for (let i = -1; i <= 1; i++) {
            const x = i * 600 - goalOffset + 300;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 5;
            ctx.strokeRect(x, canvas.height - 150, 200, 100);
          }
        } else if (mapType === MapType.NEON_CITY) {
          // Cyberpunk Skyscrapers & Flying Cars
          const cityOffset = (s.score * 1.2) % 600;
          for (let i = -1; i <= 3; i++) {
            const x = i * 250 - cityOffset;
            const bWidth = 140;
            const bHeight = 220 + (Math.abs(i) % 3) * 60;
            const bY = canvas.height - bHeight - 50;

            // Skyscraper Silhouette
            ctx.fillStyle = "#170a2c";
            ctx.fillRect(x, bY, bWidth, bHeight);

            // Neon Trim Outline
            ctx.strokeStyle = i % 2 === 0 ? "#06b6d4" : "#e0e7ff";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = i % 2 === 0 ? "#06b6d4" : "#c084fc";
            ctx.strokeRect(x + 2, bY + 2, bWidth - 4, bHeight);
            ctx.shadowBlur = 0;

            // Glowing Windows
            ctx.fillStyle = i % 2 === 0 ? "#22d3ee" : "#f43f5e";
            for (let wx = x + 15; wx < x + bWidth - 20; wx += 25) {
              for (let wy = bY + 20; wy < canvas.height - 70; wy += 35) {
                if ((wx + wy + Math.floor(s.frameCount * 0.05)) % 3 !== 0) {
                  ctx.fillRect(wx, wy, 12, 18);
                }
              }
            }
          }

          // Flying Hover Cars in Sky
          for (let h = 0; h < 5; h++) {
            const hx = ((s.frameCount * (3 + h) + h * 200) % (canvas.width + 300)) - 100;
            const hy = 80 + h * 40;
            ctx.fillStyle = h % 2 === 0 ? "#38bdf8" : "#f43f5e";
            ctx.shadowBlur = 12;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillRect(hx, hy, 30, 6);
            ctx.fillRect(hx - 15, hy + 2, 15, 2); // Tail light streak
            ctx.shadowBlur = 0;
          }

          // Matrix Digital Code Rain
          ctx.fillStyle = "rgba(6, 182, 212, 0.4)";
          ctx.font = "10px monospace";
          for (let c = 0; c < 15; c++) {
            const cx = (c * 90 + (s.frameCount % 50)) % canvas.width;
            const cy = ((s.frameCount * 4 + c * 70) % (canvas.height - 100)) + 20;
            ctx.fillText("01101", cx, cy);
          }
        } else if (mapType === MapType.COSMIC_ORBIT) {
          // Giant Ringed Planet
          const planetX = canvas.width - 180;
          const planetY = 140;
          const planetR = 75;

          // Atmosphere Glow
          ctx.shadowBlur = 40;
          ctx.shadowColor = "#818cf8";
          ctx.fillStyle = "#312e81";
          ctx.beginPath();
          ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Planet Surface Pattern
          ctx.fillStyle = "#4338ca";
          ctx.beginPath();
          ctx.arc(planetX - 10, planetY - 10, planetR * 0.8, 0, Math.PI * 2);
          ctx.fill();

          // Planet Rings
          ctx.save();
          ctx.translate(planetX, planetY);
          ctx.rotate(-0.35);
          ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.ellipse(0, 0, planetR * 1.8, planetR * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Floating Asteroids & Stardust Particles
          ctx.fillStyle = "rgba(224, 231, 255, 0.8)";
          for (let st = 0; st < 30; st++) {
            const sx = (st * 57 + s.frameCount * 0.5) % canvas.width;
            const sy = (st * 33 + Math.sin(s.frameCount * 0.02 + st) * 20) % (canvas.height - 120);
            const sz = (st % 3) + 1;
            ctx.beginPath();
            ctx.arc(sx, sy, sz, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (mapType === MapType.CANDY_KINGDOM) {
          // Peppermint Pinwheel Trees
          const candyOffset = (s.score * 1.5) % 500;
          for (let p = -1; p <= 3; p++) {
            const px = p * 280 - candyOffset;
            const py = canvas.height - 160;

            // Candy Cane Trunk
            ctx.strokeStyle = "#e11d48";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(px, canvas.height - 50);
            ctx.lineTo(px, py);
            ctx.stroke();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(px, canvas.height - 50);
            ctx.lineTo(px, py);
            ctx.stroke();

            // Spinning Peppermint Wheel
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(s.frameCount * 0.03 + p);
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.arc(0, 0, 45, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            for (let s = 0; s < 6; s++) {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.arc(0, 0, 45, (s * Math.PI) / 3, ((s + 0.5) * Math.PI) / 3);
              ctx.fill();
            }
            ctx.restore();
          }

          // Cotton Candy Clouds
          ctx.fillStyle = "rgba(244, 114, 182, 0.5)";
          for (let c = 0; c < 3; c++) {
            const cx = ((c * 400 + s.frameCount * 0.6) % (canvas.width + 300)) - 100;
            const cy = 70 + c * 35;
            ctx.beginPath();
            ctx.arc(cx, cy, 35, 0, Math.PI * 2);
            ctx.arc(cx + 25, cy - 10, 30, 0, Math.PI * 2);
            ctx.arc(cx + 50, cy, 35, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (mapType === MapType.TUTORIAL) {
          // Wipeout Academy Blimp
          const blimpX = ((s.frameCount * 0.8 + 200) % (canvas.width + 400)) - 200;
          const blimpY = 70;
          ctx.fillStyle = "#2563eb";
          ctx.beginPath();
          ctx.ellipse(blimpX, blimpY, 65, 28, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(blimpX - 25, blimpY + 18, 50, 10);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px Fredoka One, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("WIPEOUT ACADEMY", blimpX, blimpY + 4);

          // Training Ground Grandstands & Cheering Flags
          const grandstandOffset = (s.tutorialDistance * 1.5) % 600;
          for (let i = -1; i <= 2; i++) {
            const gx = i * 400 - grandstandOffset;
            ctx.fillStyle = "#334155";
            ctx.fillRect(gx, canvas.height - 180, 260, 130);
            ctx.fillStyle = "#3b82f6";
            ctx.fillRect(gx + 10, canvas.height - 170, 240, 14);
            ctx.fillStyle = "#f59e0b";
            ctx.fillRect(gx + 10, canvas.height - 146, 240, 14);
            ctx.fillStyle = "#10b981";
            ctx.fillRect(gx + 10, canvas.height - 122, 240, 14);
          }

          // Floating Tutorial Signposts based on player distance
          const signPosts = [
            { dist: 80, text: "🏃 RUN LEFT & RIGHT" },
            { dist: 160, text: "🦘 JUMP & DOUBLE JUMP" },
            { dist: 280, text: "⚡ DASH & SMASH (X)" },
            { dist: 380, text: "🪙 COLLECT MOROBUX" },
            { dist: 490, text: "🏁 FINISH GATE 500M" },
          ];
          signPosts.forEach((sp) => {
            const signX = sp.dist * 10 - s.tutorialDistance * 10 + s.playerX;
            if (signX > -200 && signX < canvas.width + 200) {
              ctx.save();
              ctx.fillStyle = "#1e293b";
              ctx.strokeStyle = "#38bdf8";
              ctx.lineWidth = 3;
              ctx.shadowBlur = 10;
              ctx.shadowColor = "#38bdf8";
              ctx.fillRect(signX - 95, 95, 190, 45);
              ctx.strokeRect(signX - 95, 95, 190, 45);
              ctx.shadowBlur = 0;
              ctx.fillStyle = "#f8fafc";
              ctx.font = "bold 13px Fredoka One, sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(sp.text, signX, 123);
              ctx.restore();
            }
          });

          // Floating Golden Ring at 160m for Jump Target
          const ringX = 160 * 10 - s.tutorialDistance * 10 + s.playerX;
          if (ringX > -100 && ringX < canvas.width + 100) {
            ctx.save();
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 6;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#fbbf24";
            ctx.beginPath();
            ctx.arc(ringX, canvas.height - 210, 32, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px Fredoka One, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🦘 JUMP TARGET", ringX, canvas.height - 250);
            ctx.restore();
          }

          // Dynamic Overhead Prompts for Player Actions
          if (s.isJumping && s.jumpCount === 1) {
            ctx.save();
            ctx.fillStyle = "#38bdf8";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#38bdf8";
            ctx.font = "bold 13px Fredoka One, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("✨ TAP SPACE FOR DOUBLE JUMP!", s.playerX + 25, s.playerY - 20);
            ctx.restore();
          }

          // Giant Rainbow Finish Gate at 500m
          const finishGateX = 500 * 10 - s.tutorialDistance * 10 + s.playerX;
          if (finishGateX > -300 && finishGateX < canvas.width + 400) {
            ctx.save();
            ctx.fillStyle = "#f59e0b";
            ctx.fillRect(finishGateX - 80, canvas.height - 280, 25, 230);
            ctx.fillRect(finishGateX + 80, canvas.height - 280, 25, 230);

            // Rainbow Arch Top
            const archGrad = ctx.createLinearGradient(finishGateX - 100, 0, finishGateX + 100, 0);
            archGrad.addColorStop(0, "#f43f5e");
            archGrad.addColorStop(0.25, "#f59e0b");
            archGrad.addColorStop(0.5, "#10b981");
            archGrad.addColorStop(0.75, "#3b82f6");
            archGrad.addColorStop(1, "#8b5cf6");
            ctx.fillStyle = archGrad;
            ctx.fillRect(finishGateX - 95, canvas.height - 310, 215, 40);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Fredoka One, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🏁 FINISH LINE 🏁", finishGateX + 12, canvas.height - 282);

            for (let c = 0; c < 10; c++) {
              ctx.fillStyle = c % 2 === 0 ? "#000000" : "#ffffff";
              ctx.fillRect(finishGateX - 85 + c * 20, canvas.height - 270, 20, 12);
            }
            ctx.restore();
          }
        }
      }

      // Speed lines during kick effect
      if (s.kickEffectTimer > 0) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
          const y = Math.random() * canvas.height;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Infinite Ground Effect (only if no custom map)
      if (!customMapImage) {
        ctx.save();
        const groundY = canvas.height - 50;
        const horizonY = groundY - 150;

        // 3D Perspective Ground
        let groundColor = "#16a34a";
        let stripeColor = "rgba(0,0,0,0.05)";
        if (mapType === MapType.DESERT) {
          groundColor = "#d97706";
          stripeColor = "rgba(180, 83, 9, 0.3)";
        } else if (mapType === MapType.JUNGLE) {
          groundColor = "#065f46";
          stripeColor = "rgba(6, 78, 59, 0.4)";
        } else if (mapType === MapType.ICE_CAVE) {
          groundColor = "#7dd3fc";
          stripeColor = "rgba(186, 230, 253, 0.5)";
        } else if (mapType === MapType.SPEED_TRAINING) {
          groundColor = "#d946ef";
          stripeColor = "rgba(255, 255, 255, 0.2)";
        } else if (mapType === MapType.MORO_KART) {
          groundColor = "#334155";
          stripeColor = "rgba(255, 255, 255, 0.5)";
        } else if (mapType === MapType.KICKING_TRAINING) {
          groundColor = "#4ade80";
          stripeColor = "rgba(255, 255, 255, 0.3)";
        } else if (mapType === MapType.VOLCANO) {
          groundColor = "#7f1d1d";
          stripeColor = "rgba(239, 68, 68, 0.4)";
        } else if (mapType === MapType.CRYSTAL_CAVES) {
          groundColor = "#0369a1";
          stripeColor = "rgba(56, 189, 248, 0.4)";
        } else if (mapType === MapType.NEON_CITY) {
          groundColor = "#1e1b4b";
          stripeColor = "rgba(6, 182, 212, 0.6)";
        } else if (mapType === MapType.COSMIC_ORBIT) {
          groundColor = "#0f172a";
          stripeColor = "rgba(99, 102, 241, 0.5)";
        } else if (mapType === MapType.CANDY_KINGDOM) {
          groundColor = "#f43f5e";
          stripeColor = "rgba(253, 224, 71, 0.5)";
        } else if (mapType === MapType.MYSTIC_FOREST) {
          groundColor = "#065f46";
          stripeColor = "rgba(110, 231, 183, 0.6)";
        } else if (mapType === MapType.PIRATE_COVE) {
          groundColor = "#1e40af";
          stripeColor = "rgba(251, 191, 36, 0.6)";
        } else if (mapType === MapType.CYBER_GRID) {
          groundColor = "#18181b";
          stripeColor = "rgba(6, 182, 212, 0.7)";
        } else if (mapType === MapType.TUTORIAL) {
          groundColor = "#1e293b";
          stripeColor = "rgba(56, 189, 248, 0.5)";
        }

        // Draw ground base
        ctx.fillStyle = groundColor;
        ctx.fillRect(0, groundY, canvas.width, 50);

        // Draw perspective lines for "3D" feel
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, horizonY, canvas.width, groundY - horizonY + 50);
        ctx.clip();

        // Horizontal perspective lines
        const speed =
          config.baseSpeed +
          (s.dashTimer > 0 ? DASH_SPEED_BOOST : 0) +
          (s.boostTimer > 0 ? 10 : 0) +
          s.score / 1000;
        const offset = (s.score * 20) % 100;

        for (let i = 0; i < 20; i++) {
          const z = (i * 10 + (100 - offset)) % 100;
          const py = horizonY + z * z * 0.015; // Quadratic spacing for perspective
          if (py > horizonY && py < canvas.height) {
            ctx.strokeStyle = stripeColor;
            ctx.lineWidth = Math.max(1, z * 0.05);
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(canvas.width, py);
            ctx.stroke();
          }
        }

        // Vertical perspective lines (converging at vanishing point)
        const vanishingX =
          canvas.width / 2 + (s.playerX - canvas.width / 2) * 0.05;
        for (let i = -10; i <= 10; i++) {
          const xOffset = i * 100 - ((s.score * 5) % 100);
          ctx.beginPath();
          ctx.moveTo(vanishingX + xOffset * 0.1, horizonY);
          ctx.lineTo(vanishingX + xOffset * 5, canvas.height);
          ctx.stroke();
        }
        ctx.restore();

        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(0, groundY, canvas.width, 4);
        ctx.restore();
      }

      // Coach Tip UI
      if (s.coachTipTimer > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.roundRect(canvas.width / 2 - 150, 50, 300, 40, 10);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Fredoka One";
        ctx.textAlign = "center";
        ctx.fillText(
          `${getTranslation("COACH", languageRef.current)}: ${s.coachTip}`,
          canvas.width / 2,
          75,
        );
        ctx.restore();
      }

      // Draw particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        if (p.type === "confetti") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 0.1);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Powerup Timers HUD (Speed/Trophy)
      const drawPowerupBar = (
        timer: number,
        label: string,
        y: number,
        icon: string,
      ) => {
        if (timer <= 0) return;
        const seconds = Math.ceil(timer / 60);
        const progress = timer / 600; // 10s base

        let color = "#22c55e"; // Green
        let blur = 0;

        if (timer > 300) {
          // > 5s
          color = "#22c55e";
          blur = 20;
        } else if (timer > 60) {
          // > 1s
          color = "#facc15"; // Brighter Yellow
          blur = 15;
        } else {
          color = "#ef4444"; // Red
          blur = 10;
        }

        ctx.save();
        ctx.translate(canvas.width / 2 - 100, y);

        // Background
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.roundRect(0, 0, 200, 15, 7);
        ctx.fill();

        // Bar
        ctx.fillStyle = color;
        if (blur > 0) {
          ctx.shadowBlur = blur;
          ctx.shadowColor = color;
        }
        ctx.beginPath();
        ctx.roundRect(0, 0, 200 * progress, 15, 7);
        ctx.fill();

        // Label & Time
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Fredoka One, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${icon} ${label}`, 5, -5);
        ctx.textAlign = "right";
        ctx.fillText(`${seconds}s`, 195, -5);

        ctx.restore();
      };

      if (s.boostTimer > 0)
        drawPowerupBar(
          s.boostTimer,
          getTranslation("SPEED", languageRef.current),
          100,
          "⚡",
        );
      if (s.trophyTimer > 0)
        drawPowerupBar(
          s.trophyTimer,
          getTranslation("TROPHY", languageRef.current),
          140,
          "🏆",
        );
      if (s.magnetTimer > 0)
        drawPowerupBar(
          s.magnetTimer,
          getTranslation("MAGNET", languageRef.current),
          180,
          "🧲",
        );
      if (s.shieldTimer > 0)
        drawPowerupBar(
          s.shieldTimer,
          getTranslation("SHIELD", languageRef.current),
          220,
          "🛡️",
        );

      for (const obs of s.obstacles) {
        if (
          ((obs.type === "gem" || obs.type === "miket") &&
            showMorobuxRef.current) ||
          (obs.type !== "gem" && obs.type !== "miket" && showStarsRef.current)
        )
          draw3DObstacle(obs);
      }

      // Draw other players
      Object.values(s.otherPlayers).forEach((p) => {
        if (Date.now() - (p as any).lastUpdate < 2000) {
          drawMoro(
            p.x,
            p.y,
            p.rotation,
            p.isKicked,
            p.isBlinking,
            p.isKicking,
            false,
            p.character,
          );
        }
      });

      // Blink effect when invincible
      if (
        s.invincibilityTimer > 0 &&
        Math.floor(s.invincibilityTimer / 5) % 2 === 0
      ) {
        // Skip drawing the player to create a blinking effect
      } else {
        if (mapType === MapType.MORO_KART) {
          drawVehicle(
            s.playerX,
            s.playerY,
            kartVehicleRef.current || "CAR",
            kartHelmetRef.current || "HELMET_1",
            characterRef.current,
          );
          // Draw opponents
          s.opponents.forEach((o) => {
            if (!o.finished) {
              drawVehicle(
                o.x - s.score + s.playerX - 150,
                o.y,
                o.vehicle || "CAR",
                "HELMET_1",
                o.character || characterRef.current,
                (o as any).obstacleType,
              );
            }
          });
        } else {
          drawMoro(
            s.playerX,
            s.playerY,
            s.playerRotation,
            s.isKicked,
            s.blinkTimer > 0,
            s.dashTimer > 0,
            isAITalking,
            characterRef.current,
          );
        }

        // Draw Player Name Tag
        if (playerNameRef.current) {
          ctx.save();
          // Reset any global scale/flip that might be active from previous draw calls
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          ctx.font = "bold 16px Fredoka, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(0,0,0,0.5)";

          const nameY =
            mapTypeRef.current === MapType.MORO_KART
              ? s.playerY - 60
              : s.playerY - 80;
          const nameX =
            mapTypeRef.current === MapType.MORO_KART
              ? s.playerX + 45
              : s.playerX + 45; // Centered relative to Moro width (approx 90)

          ctx.fillText(playerNameRef.current, nameX, nameY);
          ctx.restore();
        }
      }

      // Countdown rendering
      if (mapType === MapType.MORO_KART && s.raceCountdown > 0) {
        // Traffic Light on the right
        ctx.save();
        ctx.translate(canvas.width - 80, canvas.height - 280);

        // Pole
        ctx.fillStyle = "#475569";
        ctx.fillRect(-5, 0, 10, 230);

        // Box
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(-25, -110, 50, 130, 10);
        ctx.fill();
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.stroke();

        const trafficCount = Math.ceil(s.raceCountdown / 60);

        // Red Light (3)
        ctx.fillStyle = trafficCount >= 4 ? "#ef4444" : "#020617";
        if (trafficCount >= 4) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#ef4444";
        }
        ctx.beginPath();
        ctx.arc(0, -85, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Amber Light (2)
        ctx.fillStyle = trafficCount === 3 ? "#f59e0b" : "#020617";
        if (trafficCount === 3) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#f59e0b";
        }
        ctx.beginPath();
        ctx.arc(0, -45, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Green Light (1)
        ctx.fillStyle = trafficCount <= 2 ? "#22c55e" : "#020617";
        if (trafficCount <= 2) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#22c55e";
        }
        ctx.beginPath();
        ctx.arc(0, -5, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        const displayCount = Math.ceil(s.raceCountdown / 60);
        const colors = ["#22c55e", "#22c55e", "#f59e0b", "#ef4444"]; // GO, 1, 2, 3
        const texts = ["GO!", "1", "2", "3"];
        const idx = Math.min(3, 4 - displayCount);
        ctx.fillStyle = colors[idx];
        ctx.font = "bold 120px Fredoka One";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 10;
        ctx.strokeText(texts[idx], 0, 0);
        ctx.fillText(texts[idx], 0, 0);
        ctx.restore();
      }

      // Lap and Results UI
      if (mapType === MapType.MORO_KART) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.roundRect(20, 20, 150, 40, 10);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Fredoka One";
        ctx.fillText(
          `${getTranslation("LAP", languageRef.current)}: ${Math.min(s.laps, s.maxLaps)}/${s.maxLaps}`,
          30,
          48,
        );

        if (s.raceResults.length > 0) {
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.roundRect(canvas.width - 220, 20, 200, 200, 20);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 16px Fredoka One";
          ctx.fillText(
            getTranslation("RACE_RESULTS", languageRef.current),
            canvas.width - 210,
            45,
          );
          s.raceResults.forEach((res, idx) => {
            ctx.fillText(
              `${idx + 1}. ${res.name}`,
              canvas.width - 210,
              75 + idx * 25,
            );
          });
        }
        ctx.restore();
      }

      if (s.kickEffectTimer > 0) {
        drawAnimeImpact(s.playerX + 35, s.playerY + 35);
      }

      // Draw time bonuses
      s.timeBonuses.forEach((b) => {
        ctx.save();
        ctx.globalAlpha = b.timer / 60;
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 24px Fredoka One";
        ctx.textAlign = "center";
        ctx.fillText(b.text, b.x, b.y);
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    // loop(); // Removed to prevent synchronous update depth error
    animId = requestAnimationFrame(loop); // Start asynchronously
    return () => cancelAnimationFrame(animId);
  }, [gameState, isPaused, isAITalking, difficulty]);

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40">
        {/* Item Button */}
        {mapType === MapType.MORO_KART && stateRef.current.currentItem && (
          <div className="absolute bottom-32 right-8 pointer-events-auto">
            <button
              onClick={useItem}
              className="w-20 h-20 bg-blue-600 border-4 border-white rounded-full flex items-center justify-center shadow-2xl animate-bounce"
            >
              <i
                className={`fa-solid ${stateRef.current.currentItem === "banana" ? "fa-leaf" : stateRef.current.currentItem === "ghost" ? "fa-ghost" : "fa-circle-xmark"} text-3xl text-white`}
              ></i>
            </button>
          </div>
        )}
        {/* AI Guide Overlay */}
        <AnimatePresence>
          {isAITalking && mapType !== MapType.TUTORIAL && (
            <motion.div
              initial={
                ios27Animations
                  ? { opacity: 0, scale: 0.9, y: 30 }
                  : { opacity: 0, y: 10 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={
                ios27Animations
                  ? { type: "spring" as const, stiffness: 400, damping: 30 }
                  : { duration: 0.3 }
              }
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-end gap-4 pointer-events-auto"
            >
              <div className="w-32 h-32 drop-shadow-2xl">
                <Moro3D
                  character={character}
                  width={128}
                  height={128}
                  isTalking={isTalking}
                />
              </div>
              <div className="bg-white/90 backdrop-blur-md border-4 border-purple-500 p-4 rounded-3xl rounded-bl-none shadow-2xl max-w-md relative pr-10">
                <button
                  onClick={() => setIsAITalking(false)}
                  className="absolute top-3 right-3 w-8 h-8 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-600 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <h4 className="text-red-600 font-black font-fredoka text-sm mb-1 uppercase tracking-wider">
                  {getTranslation("GLIMMER_GUIDE", language)}
                </h4>
                <p className="text-slate-800 font-fredoka text-lg leading-tight">
                  {mapType === MapType.CLASSED &&
                    getTranslation("CLASSED_MAP_GUIDE", language)}
                  {mapType === MapType.DUO &&
                    getTranslation("DUO_MAP_GUIDE", language)}
                  {mapType === MapType.MOROBUX &&
                    getTranslation("MOROBUX_MAP_GUIDE", language)}
                  {mapType === MapType.MIKETS &&
                    getTranslation("MIKETS_MAP_GUIDE", language)}
                  {mapType === MapType.AGAINST_BOT &&
                    getTranslation("BOT_MAP_GUIDE", language)}
                  {mapType === MapType.DESERT &&
                    getTranslation("DESERT_MAP_GUIDE", language)}
                  {mapType === MapType.JUNGLE &&
                    getTranslation("JUNGLE_MAP_GUIDE", language)}
                  {mapType === MapType.ICE_CAVE &&
                    getTranslation("ICE_CAVE_MAP_GUIDE", language)}

                  {customMapData &&
                    getTranslation("CUSTOM_MAP_GUIDE", language)}
                  {mapType === MapType.DEFAULT &&
                    !customMapData &&
                    getTranslation("DEFAULT_MAP_GUIDE", language)}
                </p>
                <button
                  onClick={() => setIsAITalking(false)}
                  className="mt-3 bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white font-fredoka px-4 py-1.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-[0_4px_0_#581c87] active:translate-y-1 active:shadow-none"
                >
                  <i className="fa-solid fa-forward-step"></i>
                  {getTranslation("READY", language)}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roblox In-Game Top-Left Bar */}
        <div className="absolute top-4 left-4 pointer-events-auto flex items-center gap-2 z-30">
          {/* Silver Roblox Tilted Logo Button */}
          <button
            onClick={() => {
              resetActivity();
              setIsPaused((p) => !p);
            }}
            className="w-11 h-11 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-lg border border-white/20 text-white flex items-center justify-center transition-all active:scale-90 shadow-xl group"
            title="Roblox Menu (Esc)"
          >
            {/* Tilted Square Roblox Logo Icon */}
            <div className="w-5 h-5 bg-gradient-to-tr from-slate-200 to-white rounded-[3px] transform -rotate-12 flex items-center justify-center border border-white/80 shadow-sm group-hover:scale-110 transition-transform">
              <div className="w-2 h-2 bg-slate-900 transform -rotate-12 rounded-[1px]"></div>
            </div>
          </button>

          {/* Chat Icon Button */}
          <button
            onClick={() => {
              resetActivity();
              setIsAITalking((prev) => !prev);
            }}
            className={`w-10 h-10 ${isAITalking ? 'bg-[#00A2FF] text-white border-[#00A2FF]' : 'bg-black/40 hover:bg-black/60 text-white border-white/10'} backdrop-blur-md rounded-lg border text-sm transition-all active:scale-95`}
            title="Toggle Chat"
          >
            <i className="fa-solid fa-comment-dots"></i>
          </button>

          {/* Leaderboard Icon Button */}
          <button
            onClick={() => {
              setShowLeaderboard((prev) => !prev);
              setShowEmoteWheel(false);
              playSound("click");
            }}
            className={`w-10 h-10 ${showLeaderboard ? 'bg-[#00A2FF] text-white border-[#00A2FF]' : 'bg-black/40 hover:bg-black/60 text-white border-white/10'} backdrop-blur-md rounded-lg border text-sm transition-all active:scale-95`}
            title="Leaderboard / Players"
          >
            <i className="fa-solid fa-list-ol"></i>
          </button>

          {/* Emote Wheel Button */}
          <button
            onClick={() => {
              setShowEmoteWheel((prev) => !prev);
              setShowLeaderboard(false);
              playSound("click");
            }}
            className={`w-10 h-10 ${showEmoteWheel ? 'bg-[#00A2FF] text-white border-[#00A2FF]' : 'bg-black/40 hover:bg-black/60 text-white border-white/10'} backdrop-blur-md rounded-lg border text-sm transition-all active:scale-95`}
            title="Emotes"
          >
            <i className="fa-solid fa-face-smile"></i>
          </button>

          {/* Voice Chat Mic Toggle Button */}
          <button
            onClick={() => {
              setMicActive((prev) => !prev);
              playSound("click");
            }}
            className={`w-10 h-10 ${micActive ? 'bg-green-600/80 text-white border-green-400/50' : 'bg-black/40 text-slate-400 border-white/10'} backdrop-blur-md rounded-lg border flex items-center justify-center text-sm transition-all active:scale-95 relative`}
            title={micActive ? "Mute Voice Chat" : "Unmute Voice Chat"}
          >
            <i className={`fa-solid ${micActive ? "fa-microphone" : "fa-microphone-slash"}`}></i>
            {micActive && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            )}
          </button>

          {/* Background Video Game Soundtrack Controller */}
          <SoundtrackWidget compact className="hidden sm:block" />

          {/* Difficulty Tag */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-white font-mono">
            <div
              className={`w-2 h-2 rounded-full ${
                difficulty === Difficulty.INSANE
                  ? "bg-red-500 animate-pulse"
                  : difficulty === Difficulty.EXPERT
                    ? "bg-orange-500"
                    : difficulty === Difficulty.HARD
                      ? "bg-yellow-500"
                      : difficulty === Difficulty.NORMAL
                        ? "bg-blue-500"
                        : "bg-green-500"
              }`}
            ></div>
            <span className="font-bold uppercase tracking-wider">{difficulty}</span>
          </div>
        </div>

        {/* Roblox In-Game Leaderboard (Player List Overlay) */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-16 right-4 z-40 bg-[#191B1D]/90 backdrop-blur-xl border border-[#2D3033] rounded-xl p-3 w-64 shadow-2xl text-white font-sans pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-[#2D3033] pb-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-users text-[#00A2FF]"></i> Players (4/10)
                </span>
                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  PING: 18ms
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {/* User Row */}
                <div className="bg-[#232527] p-2 rounded-lg border border-[#2D3033] flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span className="font-bold text-white truncate">{playerName || "Player"}</span>
                  </div>
                  <span className="font-mono text-red-300 text-[11px] font-bold">
                    {gameScore}m
                  </span>
                </div>
                {/* Moro Bot Row */}
                <div className="bg-[#232527]/60 p-2 rounded-lg border border-[#2D3033]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span className="font-medium text-slate-300 truncate">Moro Bot</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    240m
                  </span>
                </div>
                {/* Player 2 */}
                <div className="bg-[#232527]/40 p-2 rounded-lg border border-[#2D3033]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span className="font-medium text-slate-300 truncate">ObbyPro_2026</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    512m
                  </span>
                </div>
                {/* Player 3 */}
                <div className="bg-[#232527]/40 p-2 rounded-lg border border-[#2D3033]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <span className="font-medium text-slate-400 truncate">SpeedRunner_X</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    180m
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roblox In-Game Emote Wheel Overlay */}
        <AnimatePresence>
          {showEmoteWheel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-16 left-28 z-40 bg-[#191B1D]/95 backdrop-blur-xl border border-[#2D3033] rounded-2xl p-4 w-72 shadow-2xl text-white font-sans pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-[#2D3033] pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-face-smile text-yellow-400"></i> Emote Wheel
                </span>
                <button
                  onClick={() => setShowEmoteWheel(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Dance", icon: "🕺", command: "/e dance", action: () => { stateRef.current.playerVY = -12; playSound("jump"); onTriggerAchievement?.('emoter'); } },
                  { name: "Wave", icon: "👋", command: "/e wave", action: () => { playSound("powerup"); onTriggerAchievement?.('emoter'); } },
                  { name: "Cheer", icon: "🎉", command: "/e cheer", action: () => { stateRef.current.playerVY = -14; playSound("win"); onTriggerAchievement?.('emoter'); } },
                  { name: "Laugh", icon: "😂", command: "/e laugh", action: () => { playSound("kick"); onTriggerAchievement?.('emoter'); } },
                  { name: "Point", icon: "👉", command: "/e point", action: () => { playSound("click"); onTriggerAchievement?.('emoter'); } },
                  { name: "Flex", icon: "💪", command: "/e flex", action: () => { stateRef.current.shieldTimer = 100; playSound("shield"); onTriggerAchievement?.('emoter'); } },
                ].map((emote, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      emote.action();
                      setShowEmoteWheel(false);
                    }}
                    className="bg-[#232527] hover:bg-[#323539] border border-[#2D3033] hover:border-[#00A2FF] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{emote.icon}</span>
                    <span className="text-[10px] font-bold text-slate-300">{emote.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile / On-Screen Roblox Controls */}
        <div className="absolute bottom-6 right-6 pointer-events-auto z-30 flex items-center gap-3">
          {/* Dash Button */}
          <button
            onClick={() => dash()}
            className="w-14 h-14 bg-amber-600/60 hover:bg-amber-600/80 active:bg-amber-600 backdrop-blur-md border-2 border-amber-400/50 rounded-full flex items-center justify-center text-white text-xl shadow-2xl transition-all active:scale-90 select-none cursor-pointer"
            title="Dash / Kick (X)"
          >
            <i className="fa-solid fa-bolt text-amber-300"></i>
          </button>
          {/* Big Circular Roblox Jump Button */}
          <button
            onClick={() => jump()}
            className="w-16 h-16 bg-black/40 hover:bg-black/60 active:bg-black/80 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center text-white text-2xl shadow-2xl transition-all active:scale-90 select-none cursor-pointer"
            title="Jump (Space / Tap)"
          >
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        </div>

        {/* Dedicated Interactive Coach Moro Tutorial Overlay */}
        {mapType === MapType.TUTORIAL && (
          <TutorialCoach
            progress={tutorialProgress}
            onNextStep={() => {
              setTutorialProgress((p) => ({
                ...p,
                step: Math.min(6, p.step + 1),
              }));
            }}
            onSkipStep={() => {
              setTutorialProgress((p) => ({
                ...p,
                step: Math.min(5, p.step + 1),
              }));
            }}
            onFinishTutorial={() => {
              // Award 100 MoroBux
              const currentMorobux = Number(localStorage.getItem('moro_total_morobux') || 0);
              localStorage.setItem('moro_total_morobux', (currentMorobux + 100).toString());
              onCollectItem?.("morobux");
              onTriggerAchievement?.("tutorial_master");
              localStorage.setItem("moro_tutorial_completed", "true");
              restoreAllUIInteractivity();
              if (onExitToMenu) {
                onExitToMenu(GameState.MAP_SELECTION);
              } else {
                onQuit();
              }
            }}
            onExitTutorial={() => {
              restoreAllUIInteractivity();
              if (onExitToMenu) {
                onExitToMenu(GameState.MENU);
              } else {
                onQuit();
              }
            }}
            onRestartTutorial={() => {
              stateRef.current.tutorialDistance = 0;
              stateRef.current.score = 0;
              setTutorialProgress({
                step: 0,
                movedLeft: false,
                movedRight: false,
                jumped: false,
                doubleJumped: false,
                dashed: false,
                smashedBlock: false,
                collectedCoin: false,
                collectedPowerup: false,
                reachedFinish: false,
                distance: 0,
              });
            }}
            onSpawnPracticeHazard={handleSpawnPracticeHazard}
            soundEnabled={soundEnabled}
          />
        )}

        {/* Live Input Key Visualizer HUD (Bottom Left) */}
        {mapType === MapType.TUTORIAL && (
          <div
            id="live-input-hud"
            className="absolute bottom-6 left-6 z-30 pointer-events-auto bg-black/60 backdrop-blur-md border border-white/20 p-2.5 rounded-2xl flex items-center gap-1.5 shadow-2xl animate-in fade-in"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs border transition-all ${
                activePressedKeys.left
                  ? "bg-blue-500 text-white border-blue-300 shadow-[0_0_12px_#3b82f6] scale-110"
                  : "bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              A ◄
            </div>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs border transition-all ${
                activePressedKeys.right
                  ? "bg-blue-500 text-white border-blue-300 shadow-[0_0_12px_#3b82f6] scale-110"
                  : "bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              D ►
            </div>
            <div
              className={`px-3 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs border transition-all ${
                activePressedKeys.jump
                  ? "bg-emerald-500 text-white border-emerald-300 shadow-[0_0_12px_#10b981] scale-105"
                  : "bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              SPACE
            </div>
            <div
              className={`px-3 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs border transition-all ${
                activePressedKeys.dash
                  ? "bg-amber-500 text-slate-950 font-black border-amber-300 shadow-[0_0_12px_#f59e0b] scale-105"
                  : "bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              ⚡ X
            </div>
          </div>
        )}

        {/* Center: Main HUD */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto z-20">
          {(hudSettings?.showDistance ?? true) && (
            <div className="bg-black/60 backdrop-blur-xl border border-white/15 px-6 py-2.5 rounded-2xl flex items-center gap-4 shadow-2xl min-w-[140px]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {getTranslation("DISTANCE", language)}
              </span>
              <span className="text-2xl font-bold font-mono text-white leading-none">
                {gameScore}
                <span className="text-xs ml-1 text-slate-400">m</span>
              </span>
            </div>
          )}

          {(hudSettings?.showMoroBux ?? true) && (
            <div className="bg-purple-950/70 backdrop-blur-xl border border-purple-500/30 px-6 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl min-w-[140px]">
              <MorobuxIcon className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              <span className="text-2xl font-bold font-mono text-red-300 leading-none">
                {morobuxCollected}
              </span>
            </div>
          )}

          {(hudSettings?.showMiniMap ?? true) && mapType === MapType.CLASSED && (
            <div
              className={`bg-black/60 backdrop-blur-xl border ${timeLeftDisplay < 10 ? "border-red-500 animate-pulse" : "border-white/15"} px-6 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl min-w-[110px]`}
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                TIME
              </span>
              <span
                className={`text-2xl font-bold font-mono ${timeLeftDisplay < 10 ? "text-red-400" : "text-white"} leading-none`}
              >
                {timeLeftDisplay}s
              </span>
            </div>
          )}
        </div>

        {/* Right: Quit & Controls */}
        <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto z-30">
          <button
            onClick={() => {
              resetActivity();
              setIsPaused((p) => !p);
            }}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 text-white font-bold text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <i className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`}></i>
            <span className="hidden sm:inline">Pause</span>
          </button>
          <button
            onClick={() => {
              restoreAllUIInteractivity();
              if (mapType === MapType.TUTORIAL && onExitToMenu) {
                onExitToMenu(GameState.MENU);
              } else {
                onQuit();
              }
            }}
            className="bg-red-600/80 hover:bg-red-600 backdrop-blur-md px-3 py-2 rounded-lg border border-red-400/30 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Authentic Roblox Pause / Escape Menu Modal */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F1012]/90 backdrop-blur-xl flex flex-col items-center justify-center z-[200] p-4 text-white"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="bg-[#191B1D] border border-[#2D3033] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Roblox Top Header Bar */}
              <div className="bg-[#232527] border-b border-[#2D3033] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Tilted Roblox Silver Square */}
                  <div className="w-7 h-7 bg-white rounded-[4px] transform -rotate-12 flex items-center justify-center shadow-md border border-slate-300">
                    <div className="w-2.5 h-2.5 bg-[#191B1D] transform -rotate-12 rounded-[1px]"></div>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                      Wipeout Pimo Experience
                      <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-mono">
                        IN SERVER
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">Server ID: #pimo-game-{roomId || 'classic'}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPaused(false)}
                  className="w-8 h-8 rounded-lg bg-[#393B3D] hover:bg-[#494B4D] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Roblox Top Tab Bar */}
              <div className="bg-[#191B1D] border-b border-[#2D3033] px-6 flex gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <button className="py-3 text-white border-b-2 border-[#00A2FF] flex items-center gap-2">
                  <i className="fa-solid fa-users text-[#00A2FF]"></i> People
                </button>
                <button 
                  onClick={onSettings}
                  className="py-3 hover:text-white transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-gear"></i> Settings
                </button>
                <button className="py-3 hover:text-white transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved"></i> Report
                </button>
                <button className="py-3 hover:text-white transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-circle-question"></i> Help
                </button>
              </div>

              {/* Server Players List Table (Roblox Style) */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="bg-[#232527] border border-[#2D3033] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                      <Moro3D character={character} width={60} height={60} isJumping={false} jumpProgress={0} playerName="" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white block">{playerName || "Player"}</span>
                      <span className="text-xs text-slate-400">@pimo_racer • Owner</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs text-slate-300">
                    <span className="text-red-400 flex items-center gap-1">
                      <MorobuxIcon className="w-3.5 h-3.5" /> {morobuxCollected}
                    </span>
                    <span className="bg-[#393B3D] px-2.5 py-1 rounded text-[10px] text-green-400 font-bold">
                      YOU
                    </span>
                  </div>
                </div>

                {/* Companion Bot Player */}
                <div className="bg-[#232527] border border-[#2D3033] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-red-300 text-lg">
                      <i className="fa-solid fa-robot"></i>
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white block">Pimo Bot</span>
                      <span className="text-xs text-red-400">@pimo_official_bot • Guide</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="bg-[#00A2FF] hover:bg-[#0082CC] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <i className="fa-solid fa-user-plus text-[10px]"></i> Add Friend
                    </button>
                  </div>
                </div>

                {/* Score & Stats Summary */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#232527] border border-[#2D3033] p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-xs text-slate-400 uppercase font-bold">Distance Traveled</span>
                    <span className="text-2xl font-black font-mono text-white mt-1">{gameScore}m</span>
                  </div>
                  <div className="bg-[#232527] border border-[#2D3033] p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-xs text-slate-400 uppercase font-bold">MoroBux Harvested</span>
                    <span className="text-2xl font-black font-mono text-red-400 mt-1 flex items-center gap-2">
                      <MorobuxIcon className="w-5 h-5" /> {morobuxCollected}
                    </span>
                  </div>
                </div>
              </div>

              {/* Roblox Bottom Actions Bar */}
              <div className="bg-[#232527] border-t border-[#2D3033] p-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setIsPaused(false);
                    restoreAllUIInteractivity();
                    if (mapType === MapType.TUTORIAL && onExitToMenu) {
                      onExitToMenu(GameState.MENU);
                    } else {
                      onQuit();
                    }
                  }}
                  className="bg-[#E22525] hover:bg-[#F23535] text-white font-bold text-sm px-6 py-3 rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  {mapType === MapType.TUTORIAL ? "Exit Tutorial" : "Leave Game"}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      stateRef.current.playerY = 0;
                      setIsPaused(false);
                      playSound("kick");
                    }}
                    className="bg-[#393B3D] hover:bg-[#494B4D] text-white font-bold text-sm px-5 py-3 rounded-lg transition-all active:scale-95"
                  >
                    Reset Character
                  </button>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="bg-[#00A2FF] hover:bg-[#0082CC] text-white font-bold text-sm px-7 py-3 rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-play text-xs"></i>
                    Resume
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mt-20 mb-10 w-full max-w-4xl shadow-3xl rounded-[3rem] overflow-hidden border-4 border-slate-900/10 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full aspect-[2/1]"
        />
      </div>

      <div className="w-full max-w-4xl bg-slate-900/5 dark:bg-white/5 backdrop-blur-3xl p-8 rounded-[4rem] border border-slate-900/10 dark:border-white/10 flex justify-between items-center z-10">
        <div className="flex gap-6">
          <button
            onMouseDown={() => {
              resetActivity();
              stateRef.current.input.left = true;
            }}
            onMouseUp={() => (stateRef.current.input.left = false)}
            onTouchStart={(e) => {
              e.preventDefault();
              resetActivity();
              stateRef.current.input.left = true;
            }}
            onTouchEnd={() => (stateRef.current.input.left = false)}
            className="w-24 h-24 bg-slate-900/10 dark:bg-white/10 rounded-[2rem] text-slate-900 dark:text-white text-4xl active:bg-white/30 border border-slate-900/10 dark:border-white/10 shadow-xl"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            onMouseDown={() => {
              resetActivity();
              stateRef.current.input.right = true;
            }}
            onMouseUp={() => (stateRef.current.input.right = false)}
            onTouchStart={(e) => {
              e.preventDefault();
              resetActivity();
              stateRef.current.input.right = true;
            }}
            onTouchEnd={() => (stateRef.current.input.right = false)}
            className="w-24 h-24 bg-slate-900/10 dark:bg-white/10 rounded-[2rem] text-slate-900 dark:text-white text-4xl active:bg-white/30 border border-slate-900/10 dark:border-white/10 shadow-xl"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
        <div className="flex gap-6">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              jump();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              jump();
            }}
            className="w-28 h-28 rounded-full bg-green-500/20 border-4 border-green-500 text-green-500 font-fredoka text-5xl active:scale-90 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center"
          >
            A
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              dash();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              dash();
            }}
            className="w-28 h-28 rounded-full bg-blue-500/20 border-4 border-blue-500 text-blue-500 font-fredoka text-5xl active:scale-90 shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center"
          >
            X
          </button>
        </div>
      </div>
    </div>
  );
};

export default Game;
