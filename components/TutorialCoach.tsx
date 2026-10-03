import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Character } from "../types";
import Moro3D from "./Moro3D";
import MorobuxIcon from "./MorobuxIcon";
import { getMoroVoice, playAudio } from "../src/services/ttsService";
import { restoreAllUIInteractivity } from "../src/lib/uiInteractivity";

export interface TutorialProgress {
  step: number;
  movedLeft: boolean;
  movedRight: boolean;
  jumped: boolean;
  doubleJumped: boolean;
  dashed: boolean;
  smashedBlock: boolean;
  collectedCoin: boolean;
  collectedPowerup: boolean;
  reachedFinish: boolean;
  distance: number;
}

export const COACH_PIMO: Character = {
  id: "coach-pimo",
  name: "Coach Pimo",
  emoji: "🏆",
  bodyColor: "#2563eb",
  accessoryColor: "#f59e0b",
  description: "Chief Instructor at the Wipeout Pimo Academy!",
  image: "",
};

export const COACH_MORO: Character = COACH_PIMO;

interface TutorialCoachProps {
  progress: TutorialProgress;
  onNextStep: () => void;
  onSkipStep: () => void;
  onFinishTutorial: () => void;
  onExitTutorial: () => void;
  onRestartTutorial?: () => void;
  onSpawnPracticeHazard?: (type: string) => void;
  soundEnabled: boolean;
}

interface StepData {
  stepIndex: number;
  badge: string;
  title: string;
  speechText: string;
  voiceText: string;
  hintKeys: string[];
  tasks: { label: string; done: boolean }[];
  actionPrompt: string;
}

export const TutorialCoach: React.FC<TutorialCoachProps> = ({
  progress,
  onNextStep,
  onSkipStep,
  onFinishTutorial,
  onExitTutorial,
  onRestartTutorial,
  onSpawnPracticeHazard,
  soundEnabled,
}) => {
  const [isTalking, setIsTalking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState<"energetic" | "cute" | "deep">("energetic");
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);
  const [freePracticeMode, setFreePracticeMode] = useState(false);
  const lastSpokenStepRef = useRef<number>(-1);
  const audioContextRef = useRef<AudioContext | null>(null);

  const steps: StepData[] = [
    {
      stepIndex: 0,
      badge: "ACADEMY ORIENTATION",
      title: "WELCOME TO WIPEOUT ACADEMY!",
      speechText:
        "Hey there rookie! I'm Coach Pimo. Let's get you trained up so you can dodge hazards, crush courses, and earn piles of PimoBux!",
      voiceText:
        "Welcome to Wipeout Academy! I am Coach Pimo. Let's get you trained up for the tournament!",
      hintKeys: ["A", "D", "◄", "►"],
      actionPrompt: "Tap Start to begin training!",
      tasks: [{ label: "Start Training", done: true }],
    },
    {
      stepIndex: 1,
      badge: "STEP 1 OF 5: MOVEMENT",
      title: "BASIC MOVEMENT",
      speechText:
        "First up: Movement! Use your Left and Right Arrow keys (or A / D keys, or tap the left/right screen sides) to run around the track.",
      voiceText:
        "Use Left and Right keys to run around the training grounds!",
      hintKeys: ["A / ◄ Left", "D / ► Right"],
      actionPrompt: "Press Left (A) & Right (D) keys to sprint!",
      tasks: [
        { label: "Run Left (A / ◄)", done: progress.movedLeft },
        { label: "Run Right (D / ►)", done: progress.movedRight },
      ],
    },
    {
      stepIndex: 2,
      badge: "STEP 2 OF 5: JUMPING",
      title: "JUMP & DOUBLE JUMP",
      speechText:
        "Nice footwork! Now let's take to the air! Press UP Arrow, W, or Spacebar to Jump. Press it AGAIN in mid-air to execute a DOUBLE JUMP!",
      voiceText:
        "Press Space or Up Arrow to jump! Tap again in the air for a Double Jump!",
      hintKeys: ["Space", "W", "▲ Up"],
      actionPrompt: "Jump into the air and press Space again for a Double Jump!",
      tasks: [
        { label: "Perform a Jump (Space)", done: progress.jumped },
        { label: "Perform Double Jump in mid-air", done: progress.doubleJumped },
      ],
    },
    {
      stepIndex: 3,
      badge: "STEP 3 OF 5: DASH & KICK",
      title: "DASH & SMASH OBSTACLES",
      speechText:
        "Looking athletic! Press the X key (or tap the Dash button) to DASH forward at high speed! Dashing lets you smash straight through training obstacle blocks!",
      voiceText:
        "Press the X key or Dash button to burst forward and smash target blocks!",
      hintKeys: ["X Key", "Dash Button"],
      actionPrompt: "Press X or tap the Lightning button to Dash & Smash!",
      tasks: [
        { label: "Execute a Dash (X key)", done: progress.dashed },
        { label: "Smash through practice block", done: progress.smashedBlock },
      ],
    },
    {
      stepIndex: 4,
      badge: "STEP 4 OF 5: ITEMS & POWER-UPS",
      title: "COLLECT PIMOBUX & POWER-UPS",
      speechText:
        "Collect the gleaming PimoBux coins and glowing star power-ups along the track. They grant shields, magnets, and currency for skins!",
      voiceText:
        "Grab the shiny PimoBux coins and power-up stars on the course!",
      hintKeys: ["Collect Coins", "Collect Power-Up"],
      actionPrompt: "Run into gold PimoBux coins and glowing items!",
      tasks: [
        { label: "Collect PimoBux Coins", done: progress.collectedCoin },
        { label: "Grab a Power-Up Item", done: progress.collectedPowerup },
      ],
    },
    {
      stepIndex: 5,
      badge: "STEP 5 OF 5: FINISH SPRINT",
      title: "CROSS THE RAINBOW FINISH GATE",
      speechText:
        "You're a natural! Now sprint down the course, dodge the rolling stars, and cross the giant Rainbow Finish Gate at 500m to graduate!",
      voiceText:
        "Sprint down the course and cross the Rainbow Finish Gate to graduate!",
      hintKeys: ["Dodge Hazards", "Reach 500m"],
      actionPrompt: "Sprint past 500m to cross the Rainbow Finish Gate!",
      tasks: [
        {
          label: `Reach Finish Gate (${Math.min(500, Math.floor(progress.distance))}m / 500m)`,
          done: progress.reachedFinish || progress.distance >= 500,
        },
      ],
    },
    {
      stepIndex: 6,
      badge: "ACADEMY GRADUATION",
      title: "TUTORIAL COMPLETED! 🏆",
      speechText:
        "Outstanding work, Champion! You have officially mastered Wipeout Pimo. You earned +100 bonus PimoBux and the Academy Graduate badge!",
      voiceText:
        "Outstanding work, Champion! You have officially graduated from the Wipeout Academy!",
      hintKeys: ["+100 PimoBux", "Badge Unlocked"],
      actionPrompt: "Graduation Ceremony Complete!",
      tasks: [{ label: "Academy Graduate Badge Unlocked!", done: true }],
    },
  ];

  const currentStepData = steps[Math.min(progress.step, steps.length - 1)];
  const isStepComplete = progress.step === 0 ? false : currentStepData.tasks.every((t) => t.done);

  // Sound chirper synthesizer for cute character talk effects
  const playCuteChirp = (frequency: number = 550, duration: number = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = voiceStyle === "cute" ? "sine" : voiceStyle === "deep" ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.3, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context fallback
    }
  };

  // Play fanfare when a step is completed
  const playStepCompleteChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  };

  const speakText = async (text: string) => {
    if (!soundEnabled) return;
    setIsTalking(true);
    // Play voice chirps
    for (let c = 0; c < 5; c++) {
      setTimeout(() => {
        playCuteChirp(
          voiceStyle === "cute" ? 700 + c * 40 : voiceStyle === "deep" ? 300 + c * 25 : 550 + c * 35,
          0.06
        );
      }, c * 80);
    }

    try {
      const audioBase64 = await getMoroVoice(text);
      if (audioBase64) {
        await playAudio(audioBase64);
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = voiceStyle === "cute" ? 1.6 : voiceStyle === "deep" ? 0.9 : 1.35;
        utterance.rate = voiceStyle === "energetic" ? 1.2 : 1.1;
        utterance.onend = () => setIsTalking(false);
        utterance.onerror = () => setIsTalking(false);
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch (e) {
      console.warn("Coach voice fallback:", e);
    } finally {
      setIsTalking(false);
    }
  };

  // Unmount cleanup to cancel speech and restore UI buttons
  useEffect(() => {
    return () => {
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
      restoreAllUIInteractivity();
    };
  }, []);

  // Keyboard shortcut listener: Escape key or 'Q' key triggers clean exit
  useEffect(() => {
    const handleTutorialKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key.toLowerCase() === "q") {
        if (progress.step <= 5 && !showSettings) {
          // If in tutorial mode and user presses Esc or Q, clean exit
          onExitTutorial();
        }
      }
    };
    window.addEventListener("keydown", handleTutorialKeyDown);
    return () => {
      window.removeEventListener("keydown", handleTutorialKeyDown);
    };
  }, [onExitTutorial, progress.step, showSettings]);

  // Trigger speech whenever step changes
  useEffect(() => {
    if (progress.step !== lastSpokenStepRef.current) {
      lastSpokenStepRef.current = progress.step;
      speakText(currentStepData.voiceText);
    }
  }, [progress.step]);

  // Auto-advance with countdown when all step tasks are completed
  useEffect(() => {
    if (isStepComplete && progress.step > 0 && progress.step < 5 && autoAdvanceEnabled) {
      playStepCompleteChime();
      setAutoAdvanceTimer(3);
      const interval = setInterval(() => {
        setAutoAdvanceTimer((prev) => {
          if (prev !== null && prev <= 1) {
            clearInterval(interval);
            onNextStep();
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setAutoAdvanceTimer(null);
    }
  }, [isStepComplete, progress.step, autoAdvanceEnabled]);

  return (
    <>
      {/* Top Tutorial HUD Navigation Bar */}
      <div
        id="tutorial-hud-top"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 pointer-events-auto max-w-[95vw]"
      >
        <div className="bg-slate-950/90 backdrop-blur-2xl border-2 border-amber-400/70 rounded-2xl px-4 sm:px-6 py-2.5 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center gap-3 sm:gap-4 text-white">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-fredoka text-xs sm:text-sm font-black text-amber-400 tracking-wider uppercase">
              🎓 DEMO TUTORIAL
            </span>
          </div>

          <div className="h-4 w-px bg-white/20 hidden sm:block"></div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 sm:gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-4 sm:w-7 h-2 rounded-full transition-all duration-300 ${
                    progress.step > s
                      ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                      : progress.step === s
                      ? "bg-amber-400 animate-pulse ring-2 ring-amber-300/80"
                      : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 ml-1 hidden xs:inline">
              {Math.min(5, Math.max(1, progress.step))}/5
            </span>
          </div>

          <div className="h-4 w-px bg-white/20"></div>

          {/* Distance Meter */}
          <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
            <i className="fa-solid fa-flag-checkered text-amber-400"></i>
            <span>{Math.min(500, Math.floor(progress.distance))}m / 500m</span>
          </div>

          <div className="h-4 w-px bg-white/20 hidden md:block"></div>

          {/* Auto-Advance Toggle */}
          <button
            id="auto-advance-toggle-btn"
            onClick={() => setAutoAdvanceEnabled((v) => !v)}
            className={`hidden lg:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              autoAdvanceEnabled
                ? "bg-emerald-600/30 border-emerald-400/50 text-emerald-300"
                : "bg-white/10 text-slate-300 border-white/20"
            }`}
            title="Toggle step auto-advance"
          >
            <i className={`fa-solid ${autoAdvanceEnabled ? "fa-forward" : "fa-pause"}`}></i>
            <span>{autoAdvanceEnabled ? "Auto-Next ON" : "Auto-Next OFF"}</span>
          </button>

          {/* Sandbox Toggle */}
          <button
            id="sandbox-mode-toggle"
            onClick={() => setSandboxMode((v) => !v)}
            className={`hidden md:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              sandboxMode
                ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                : "bg-white/10 hover:bg-white/20 text-slate-300 border-white/20"
            }`}
            title="Toggle Practice Sandbox Spawner"
          >
            <i className="fa-solid fa-flask text-red-300"></i>
            <span>{sandboxMode ? "Sandbox ON" : "Sandbox"}</span>
          </button>

          {/* Exit Tutorial Button */}
          <button
            id="top-exit-tutorial-btn"
            onClick={() => {
              restoreAllUIInteractivity();
              onExitTutorial();
            }}
            className="text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl border border-rose-400/50 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
            title="Exit Tutorial (Esc / Q)"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span className="font-fredoka font-black">Exit Tutorial</span>
          </button>
        </div>
      </div>

      {/* Sandbox Practice Spawner Panel (if enabled) */}
      <AnimatePresence>
        {sandboxMode && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="absolute top-20 left-4 z-40 bg-slate-900/90 backdrop-blur-xl border-2 border-purple-500/60 p-4 rounded-3xl shadow-2xl text-white pointer-events-auto max-w-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-fredoka text-xs font-black text-red-300 flex items-center gap-2 uppercase tracking-wider">
                <i className="fa-solid fa-flask"></i> Practice Hazard Spawner
              </h5>
              <button
                onClick={() => setSandboxMode(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="text-[11px] text-slate-300 mb-3 leading-tight font-fredoka">
              Spawn target obstacles and practice items directly in front of your Pimo:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSpawnPracticeHazard?.("ice_block")}
                className="bg-sky-600/30 hover:bg-sky-600 border border-sky-400/40 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>🧊 Smash Crate</span>
              </button>
              <button
                onClick={() => onSpawnPracticeHazard?.("ball")}
                className="bg-amber-600/30 hover:bg-amber-600 border border-amber-400/40 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>⚽ Rolling Ball</span>
              </button>
              <button
                onClick={() => onSpawnPracticeHazard?.("star_coin")}
                className="bg-yellow-600/30 hover:bg-yellow-600 border border-yellow-400/40 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>⭐ PimoBux Coin</span>
              </button>
              <button
                onClick={() => onSpawnPracticeHazard?.("boost_pad")}
                className="bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-400/40 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>🚀 Speed Pad</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Coach Pimo Dialogue Box (Bottom Center) */}
      <AnimatePresence>
        {!isMinimized && progress.step <= 5 && (
          <motion.div
            id="coach-dialogue-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-2xl pointer-events-auto flex flex-col sm:flex-row items-end gap-3"
          >
            {/* 3D Coach Pimo Character Canvas */}
            <div
              className="relative group self-center sm:self-end flex-shrink-0 cursor-pointer"
              onClick={() => speakText(currentStepData.voiceText)}
              title="Click Coach Pimo to hear him talk!"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                <Moro3D
                  character={COACH_PIMO}
                  width={112}
                  height={112}
                  isTalking={isTalking}
                  isJumping={isTalking}
                  jumpProgress={isTalking ? 0.3 : 0}
                />
              </div>

              {/* Speaking Equalizer Badge */}
              <div className="absolute -top-2 -right-1 bg-blue-600 border-2 border-white rounded-full px-2 py-0.5 shadow-lg flex items-center gap-1 animate-in fade-in">
                <i
                  className={`fa-solid ${
                    isTalking ? "fa-volume-high text-amber-300 animate-bounce" : "fa-microphone text-white"
                  } text-[10px]`}
                ></i>
                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                  {isTalking ? "Speaking" : "Coach"}
                </span>
              </div>
            </div>

            {/* Coach Speech Bubble Card */}
            <div className="flex-1 bg-slate-900/95 backdrop-blur-2xl border-2 border-blue-500/50 rounded-3xl rounded-bl-lg sm:rounded-bl-3xl sm:rounded-tl-none p-4 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative text-white">
              {/* Header with Step Badge & Controls */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-fredoka font-black text-[11px] px-2.5 py-0.5 rounded-md tracking-wider uppercase shadow-sm">
                    {currentStepData.badge}
                  </span>
                  <h4 className="text-amber-400 font-black font-fredoka text-sm sm:text-base leading-none">
                    {currentStepData.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Replay Voice Button */}
                  <button
                    id="replay-coach-voice-btn"
                    onClick={() => speakText(currentStepData.voiceText)}
                    className="w-8 h-8 rounded-full bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 flex items-center justify-center transition-all text-xs cursor-pointer"
                    title="Hear Coach Pimo voice again"
                  >
                    <i
                      className={`fa-solid ${
                        isTalking ? "fa-volume-high animate-pulse text-amber-300" : "fa-volume-high"
                      }`}
                    ></i>
                  </button>

                  {/* Settings Toggle */}
                  <button
                    id="coach-settings-btn"
                    onClick={() => setShowSettings((v) => !v)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all text-xs cursor-pointer"
                    title="Voice Pitch & Settings"
                  >
                    <i className="fa-solid fa-gear"></i>
                  </button>

                  {/* Minimize Button */}
                  <button
                    id="minimize-coach-btn"
                    onClick={() => setIsMinimized(true)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all text-xs cursor-pointer"
                    title="Minimize Dialogue"
                  >
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                </div>
              </div>

              {/* Voice Settings Sub-Panel (if open) */}
              {showSettings && (
                <div className="mb-3 p-3 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-300">Voice Style:</span>
                  <div className="flex gap-2">
                    {(["energetic", "cute", "deep"] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => {
                          setVoiceStyle(style);
                          speakText(currentStepData.voiceText);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                          voiceStyle === style
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coach Speech Text */}
              <p className="text-slate-100 font-fredoka text-sm sm:text-base leading-snug mb-3">
                {currentStepData.speechText}
              </p>

              {/* Step Tasks Checklist with Completed Animations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 bg-black/30 p-2.5 rounded-xl border border-white/5">
                {currentStepData.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      task.done
                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        : "bg-white/5 text-slate-300 border border-white/5"
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        task.done
                          ? "fa-circle-check text-emerald-400 text-sm animate-bounce"
                          : "fa-circle-dot text-slate-500 text-sm animate-pulse"
                      }`}
                    ></i>
                    <span className="truncate">{task.label}</span>
                  </div>
                ))}
              </div>

              {/* Action Banner / Auto-Advance Notice */}
              {isStepComplete && autoAdvanceTimer !== null && autoAdvanceEnabled && (
                <div className="mb-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-300 animate-pulse">
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-sparkles text-amber-400"></i>
                    <span>Step Complete! Next step in {autoAdvanceTimer}s...</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAutoAdvanceTimer(null)}
                      className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/10 text-[10px] cursor-pointer"
                      title="Stay on this step to practice"
                    >
                      Stay & Practice
                    </button>
                    <button
                      onClick={onNextStep}
                      className="underline text-amber-300 hover:text-white cursor-pointer font-black"
                    >
                      Next now ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Key Control Hints & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Control Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Controls:</span>
                  {currentStepData.hintKeys.map((key, kIdx) => (
                    <span
                      key={kIdx}
                      className="px-2 py-0.5 bg-blue-950/80 border border-blue-400/50 rounded text-[11px] font-mono font-black text-cyan-300 shadow-sm animate-pulse"
                    >
                      {key}
                    </span>
                  ))}
                </div>

                {/* Progress / Next Button */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    id="dialog-exit-tutorial-btn"
                    onClick={() => {
                      restoreAllUIInteractivity();
                      onExitTutorial();
                    }}
                    className="text-xs text-slate-400 hover:text-rose-300 px-2 py-1 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Exit Tutorial and return to Menu"
                  >
                    <i className="fa-solid fa-door-open text-[11px]"></i>
                    <span>Exit</span>
                  </button>

                  {progress.step > 0 && progress.step < 5 && (
                    <button
                      id="skip-step-btn"
                      onClick={onSkipStep}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 transition-colors cursor-pointer"
                    >
                      Skip Step
                    </button>
                  )}

                  {progress.step === 0 ? (
                    <button
                      id="start-training-btn"
                      onClick={onNextStep}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-fredoka px-5 py-2 rounded-xl text-sm shadow-[0_4px_0_#065f46] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>LET'S GO!</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  ) : (
                    <button
                      id="next-step-btn"
                      onClick={onNextStep}
                      className={`font-black font-fredoka px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                        isStepComplete
                          ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_4px_0_#065f46] active:translate-y-1 animate-bounce"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_0_#1e3a8a] active:translate-y-1"
                      }`}
                    >
                      <span>{isStepComplete ? "NEXT STEP ➔" : "CONTINUE"}</span>
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Coach Button (if minimized) */}
      {isMinimized && progress.step <= 5 && (
        <button
          id="restore-coach-btn"
          onClick={() => setIsMinimized(false)}
          className="absolute bottom-24 left-6 z-50 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-full border-2 border-white shadow-2xl flex items-center gap-2 font-fredoka text-xs animate-bounce cursor-pointer pointer-events-auto"
        >
          <i className="fa-solid fa-graduation-cap text-amber-300"></i>
          <span>Show Coach Pimo ({currentStepData.title})</span>
        </button>
      )}

      {/* Step 6: Full-Screen Grand Victory Celebration Modal */}
      <AnimatePresence>
        {progress.step >= 6 && !freePracticeMode && (
          <motion.div
            id="tutorial-victory-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] pointer-events-auto bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-4 border-amber-400 rounded-[3rem] w-full max-w-lg p-6 sm:p-10 relative shadow-[0_0_80px_rgba(245,158,11,0.5)] text-center text-white overflow-hidden my-auto pointer-events-auto">
              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

              {/* 3D Coach Pimo */}
              <div className="w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-2 drop-shadow-2xl">
                <Moro3D
                  character={COACH_PIMO}
                  width={144}
                  height={144}
                  isTalking={isTalking}
                  isJumping={true}
                  jumpProgress={0.5}
                />
              </div>

              {/* Confetti & Trophy Title */}
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 px-4 py-1 rounded-full mb-3 text-amber-300 font-bold text-xs">
                <i className="fa-solid fa-crown text-amber-400 animate-bounce"></i>
                <span>ACADEMY CERTIFIED GRADUATE</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-fredoka font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 uppercase drop-shadow-md mb-2">
                TUTORIAL COMPLETE!
              </h2>

              <p className="text-slate-200 font-fredoka text-sm sm:text-base mb-5 leading-relaxed">
                You've mastered running, double jumps, power dashes, smashing crates, and dodging hazards. You're ready for the real tournament!
              </p>

              {/* Rewards Box */}
              <div className="bg-black/50 border border-amber-500/40 rounded-2xl p-3 sm:p-4 mb-5 flex items-center justify-around">
                <div className="flex items-center gap-3">
                  <MorobuxIcon className="w-10 h-10 drop-shadow-md animate-pulse" />
                  <div className="text-left">
                    <div className="text-2xl font-black font-fredoka text-amber-400">+100</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">PimoBux Bonus</div>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/10"></div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-300 flex items-center justify-center text-xl shadow-lg">
                    🎓
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black font-fredoka text-indigo-300">Graduate</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Achievement</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  id="play-game-maps-btn"
                  onClick={() => {
                    restoreAllUIInteractivity();
                    onFinishTutorial();
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-fredoka font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#065f46] hover:translate-y-0.5 active:translate-y-1.5 transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
                >
                  <i className="fa-solid fa-play text-xl"></i>
                  <span>CLAIM +100 PIMOBUX & PLAY MAPS</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="free-practice-sandbox-btn"
                    onClick={() => setFreePracticeMode(true)}
                    className="bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/40 text-red-200 hover:text-white font-fredoka font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
                  >
                    <i className="fa-solid fa-flask text-red-300"></i>
                    <span>Free Practice Mode</span>
                  </button>

                  <button
                    id="restart-training-btn"
                    onClick={() => {
                      if (onRestartTutorial) {
                        onRestartTutorial();
                      } else {
                        restoreAllUIInteractivity();
                        onExitTutorial();
                      }
                    }}
                    className="bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white font-fredoka font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                    <span>Restart Tutorial</span>
                  </button>
                </div>

                <button
                  id="return-to-menu-btn"
                  onClick={() => {
                    restoreAllUIInteractivity();
                    onExitTutorial();
                  }}
                  className="w-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-fredoka font-bold text-xs sm:text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
                >
                  <i className="fa-solid fa-door-open text-rose-400"></i>
                  <span>Return to Main Menu</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free Practice HUD Banner if user chose free practice after graduation */}
      {progress.step >= 6 && freePracticeMode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-purple-950/90 backdrop-blur-md border-2 border-purple-400/60 p-3 rounded-2xl flex items-center gap-3 text-white shadow-2xl animate-in fade-in max-w-[95vw] flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <span className="text-xs font-fredoka font-bold text-red-200">
              Free Practice Sandbox Mode
            </span>
          </div>
          <button
            onClick={() => setFreePracticeMode(false)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black font-fredoka px-3 py-1.5 rounded-lg shadow cursor-pointer"
          >
            View Graduation
          </button>
          <button
            onClick={() => {
              restoreAllUIInteractivity();
              onFinishTutorial();
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black font-fredoka px-3 py-1.5 rounded-lg shadow cursor-pointer"
          >
            Play Maps
          </button>
          <button
            onClick={() => {
              restoreAllUIInteractivity();
              onExitTutorial();
            }}
            className="bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-black font-fredoka px-3 py-1.5 rounded-lg shadow cursor-pointer"
          >
            Exit to Menu
          </button>
        </div>
      )}
    </>
  );
};

export default TutorialCoach;
