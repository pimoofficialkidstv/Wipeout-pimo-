import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bluetooth } from 'lucide-react';
import { getTranslation } from '../src/translations';
import { AnimatedButton } from './AnimatedButton';

interface ControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedController: Gamepad | null;
  setConnectedController: (gamepad: Gamepad | null) => void;
  language: string;
  ios27Animations?: boolean;
  activeBattery?: { level: number; charging: boolean; source: string } | null;
  simulatedBatteryMode?: 'none' | 'charging' | 'low';
  setSimulatedBatteryMode?: (mode: 'none' | 'charging' | 'low') => void;
  playLowBatteryAlarm?: () => void;
  onUpdateBattery?: (level: number, charging?: boolean) => void;
}

export const ControllerModal: React.FC<ControllerModalProps> = ({ 
  isOpen, 
  onClose, 
  connectedController, 
  setConnectedController,
  language,
  ios27Animations,
  activeBattery,
  simulatedBatteryMode = 'none',
  setSimulatedBatteryMode,
  playLowBatteryAlarm,
  onUpdateBattery
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedControllerType, setSelectedControllerType] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !connectedController) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 3000);
      return () => clearTimeout(timer);
    }
    // Reset selection if controller disconnects
    if (!connectedController) {
      setSelectedControllerType(null);
    }
  }, [isOpen, connectedController]);

  const iosVariants = {
    initial: { opacity: 0, scale: 0.8, y: 50, filter: "blur(20px)" },
    animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.8, y: 50, filter: "blur(20px)" }
  };

  const normalVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const variants = ios27Animations ? iosVariants : normalVariants;
  const transition = ios27Animations 
    ? { type: "spring" as const, stiffness: 300, damping: 30 } 
    : { duration: 0.2 };

  const controllerTypes = [
    { id: 'gamesir', name: 'GAMESIR / MOBILE', icon: 'fa-solid fa-mobile-screen-button', color: 'bg-amber-500' },
    { id: 'xbox', name: 'XBOX', icon: 'fa-brands fa-xbox', color: 'bg-green-600' },
    { id: 'playstation', name: 'PLAYSTATION', icon: 'fa-brands fa-playstation', color: 'bg-blue-600' },
    { id: 'switch', name: 'NINTENDO SWITCH', icon: 'fa-solid fa-gamepad', color: 'bg-red-500' },
  ];

  const [lastPressedName, setLastPressedName] = useState<string | null>(null);
  const [showGameSirGuide, setShowGameSirGuide] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);

  const handleForceScan = () => {
    window.focus();
    setScanAttempts((prev) => prev + 1);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const gps = navigator.getGamepads();
      if (gps) {
        for (let i = 0; i < gps.length; i++) {
          if (gps[i]) {
            setConnectedController(gps[i]);
            clearInterval(interval);
            return;
          }
        }
      }
      if (count > 60) clearInterval(interval);
    }, 50);
  };

  const handleEnableVirtualGameSir = () => {
    // Create a virtual GameSir gamepad fallback so users can play even if browser restricts raw Bluetooth API
    const virtualGamepad = {
      id: "GameSir Wireless Controller (Virtual PC Bridge)",
      index: 0,
      connected: true,
      mapping: "standard",
      timestamp: Date.now(),
      buttons: Array(17).fill(0).map(() => ({ pressed: false, touched: false, value: 0 })),
      axes: [0, 0, 0, 0]
    } as unknown as Gamepad;
    
    setConnectedController(virtualGamepad);
    setSelectedControllerType('GAMESIR / MOBILE');
  };

  useEffect(() => {
    if (!isOpen || !connectedController) return;

    let animId: number;
    const checkInputs = () => {
      const gps = navigator.getGamepads();
      if (gps) {
        let gp: Gamepad | null = null;
        for (let i = 0; i < gps.length; i++) {
          if (gps[i]) { gp = gps[i]; break; }
        }
        if (gp) {
          const isBtn = (idx: number) => {
            const b = gp?.buttons[idx];
            return !!(b && (b.pressed || b.value > 0.15 || b.touched));
          };

          const buttonNames = [
            'A / Cross (Btn 0)', 'B / Circle (Btn 1)', 'X / Square (Btn 2)', 'Y / Triangle (Btn 3)',
            'Left Bumper LB (Btn 4)', 'Right Bumper RB (Btn 5)', 'Left Trigger LT (Btn 6)', 'Right Trigger RT (Btn 7)',
            'Select / Back (Btn 8)', 'Start / Plus (Btn 9)', 'L3 Stick Press (Btn 10)', 'R3 Stick Press (Btn 11)',
            'D-Pad Up (Btn 12)', 'D-Pad Down (Btn 13)', 'D-Pad Left (Btn 14)', 'D-Pad Right (Btn 15)', 'Home / Guide (Btn 16)'
          ];

          let pressed: string | null = null;
          for (let i = 0; i < gp.buttons.length; i++) {
            if (isBtn(i)) {
              pressed = buttonNames[i] || `Button ${i}`;
              break;
            }
          }

          if (!pressed && gp.axes) {
            const lx = gp.axes[0] || 0;
            const ly = gp.axes[1] || 0;
            if (Math.abs(lx) > 0.35 || Math.abs(ly) > 0.35) {
              pressed = `Left Stick (${Math.round(lx * 100)}%, ${Math.round(ly * 100)}%)`;
            }
          }

          if (pressed) {
            setLastPressedName(pressed);
          }
        }
      }
      animId = requestAnimationFrame(checkInputs);
    };

    animId = requestAnimationFrame(checkInputs);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, connectedController]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="w-full max-w-md bg-white dark:bg-[#1a1a2e] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative"
          >
            {/* iOS 27.0 style glass header */}
            <div className="h-2 w-16 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-4 mb-2" />
            
            <div className="p-8">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center relative">
                  <motion.i 
                    animate={isSearching ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`fa-solid fa-gamepad text-4xl ${connectedController ? 'text-green-500' : 'text-blue-500'}`}
                  ></motion.i>
                  
                  {isSearching && (
                    <motion.div 
                      animate={{ scale: [1, 2, 1], opacity: [0, 0.3, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full border-2 border-blue-500"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-fredoka text-slate-900 dark:text-white uppercase text-center">
                    {connectedController 
                      ? (selectedControllerType ? "I'M READY!" : "What controller do you use?") 
                      : 'BLUETOOTH PAIRING'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed text-center">
                    {connectedController 
                      ? (selectedControllerType 
                          ? `Great! You are using your ${selectedControllerType} controller. Click "I'M READY!" to play.` 
                          : "Choose your console type below to configure your buttons for the best experience.")
                      : 'Scan for your controller in your device settings to connect.'}
                  </p>
                </div>

                {/* Battery Status & Power Monitor */}
                {connectedController && activeBattery && (
                  <div className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    activeBattery.level < 0.10 && !activeBattery.charging
                      ? 'bg-red-950/80 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] text-white animate-battery-shake'
                      : activeBattery.charging
                      ? 'bg-black/80 dark:bg-slate-950/90 border-2 border-emerald-400/80 text-white shadow-[0_0_25px_rgba(34,197,94,0.5)] animate-island-charging'
                      : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        activeBattery.charging ? 'text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        <i className={`fa-solid ${activeBattery.charging ? 'fa-bolt-lightning text-emerald-400 text-sm animate-bolt-vibrant' : activeBattery.level < 0.10 ? 'fa-triangle-exclamation text-red-400 animate-ping' : 'fa-battery-half text-emerald-500'}`}></i>
                        {activeBattery.charging ? 'USB-C CHARGING ACTIVE' : 'REAL BATTERY TELEMETRY'}
                      </span>
                      <span className={`text-xs font-mono font-black flex items-center gap-1 ${activeBattery.charging ? 'text-emerald-300' : ''}`}>
                        {activeBattery.charging && (
                          <i className="fa-solid fa-bolt-lightning text-emerald-400 text-[10px] animate-bolt-vibrant"></i>
                        )}
                        {Math.round(activeBattery.level * 100)}%
                      </span>
                    </div>

                    <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border relative ${
                      activeBattery.charging ? 'bg-slate-900 border-emerald-400' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    }`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 relative overflow-hidden ${
                          activeBattery.charging 
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 animate-charging-flow shadow-[0_0_12px_#22c55e]' 
                            : activeBattery.level >= 0.5 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : activeBattery.level >= 0.2 
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                            : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                        }`}
                        style={{ width: `${Math.max(6, activeBattery.level * 100)}%` }}
                      >
                        {activeBattery.charging && (
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        )}
                      </div>
                    </div>

                    {activeBattery.charging && (
                      <p className="text-[10px] text-emerald-300 font-bold mt-1.5 flex items-center gap-1.5">
                        <i className="fa-solid fa-bolt-lightning text-emerald-400 text-xs animate-bolt-vibrant"></i>
                        <span>USB-C Cable Connected • Rapid Charge Active (+1% / 3s)</span>
                      </p>
                    )}
                    {activeBattery.level < 0.10 && !activeBattery.charging && (
                      <p className="text-[10px] text-red-300 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                        <i className="fa-solid fa-triangle-exclamation text-[9px]"></i> Low Battery! Please connect USB-C charger.
                      </p>
                    )}

                    {/* Interactive USB-C Cable & Battery Level Adjusters */}
                    <div className="mt-3 pt-3 border-t border-slate-700/40 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          if (onUpdateBattery) {
                            onUpdateBattery(activeBattery.level, !activeBattery.charging);
                          } else if (setSimulatedBatteryMode) {
                            setSimulatedBatteryMode(activeBattery.charging ? 'none' : 'charging');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          activeBattery.charging
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/80 hover:bg-emerald-500/30 shadow-[0_0_10px_#22c55e]'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <i className={`fa-solid ${activeBattery.charging ? 'fa-bolt-lightning text-emerald-400 animate-bolt-vibrant' : 'fa-plug text-slate-400'}`}></i>
                        {activeBattery.charging ? 'Disconnect USB-C Cable' : 'Plug USB-C Charger'}
                      </button>

                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 mr-1">Sync Level:</span>
                        {[1.0, 0.75, 0.50, 0.25, 0.08].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => {
                              if (onUpdateBattery) {
                                onUpdateBattery(pct);
                              } else if (setSimulatedBatteryMode) {
                                setSimulatedBatteryMode(pct === 0.08 ? 'low' : 'none');
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                              Math.round(activeBattery.level * 100) === Math.round(pct * 100)
                                ? 'bg-emerald-500 text-slate-950 font-black scale-105'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {Math.round(pct * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Input Tester Banner */}
                {connectedController && (
                  <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-gamepad text-emerald-400 text-base animate-bounce"></i>
                      <span>
                        {lastPressedName ? (
                          <>Detected Input: <u className="font-mono text-white bg-emerald-600 px-2 py-0.5 rounded ml-1">{lastPressedName}</u></>
                        ) : (
                          "Press any button on GameSir to test..."
                        )}
                      </span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase font-black">
                      ACTIVE
                    </span>
                  </div>
                )}

                {connectedController && !selectedControllerType && (
                  <div className="w-full grid grid-cols-1 gap-3">
                    {controllerTypes.map((type) => (
                      <AnimatedButton
                        key={type.id}
                        onClick={() => setSelectedControllerType(type.name)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 transition-all text-left animate-in slide-in-from-bottom-2 duration-300 shadow-sm`}
                      >
                        <div className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center text-white shadow-inner`}>
                          <i className={type.icon}></i>
                        </div>
                        <div>
                          <p className="font-fredoka text-slate-900 dark:text-white">{type.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Tap to Select</p>
                        </div>
                      </AnimatedButton>
                    ))}
                  </div>
                )}

                {connectedController && selectedControllerType && (
                  <div className="w-full bg-green-500/10 p-4 rounded-2xl border border-green-500/20 flex items-center gap-4 animate-in zoom-in-95 duration-300">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-400 uppercase">CONFIGURED AS</p>
                      <p className="text-sm font-fredoka text-slate-900 dark:text-white">{selectedControllerType}</p>
                    </div>
                  </div>
                )}

                {!connectedController && (
                  <div className="w-full flex flex-col gap-3">
                    {/* Primary Focus & Activation Button */}
                    <button
                      onClick={handleForceScan}
                      className="w-full p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-fredoka font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 animate-pulse"
                    >
                      <i className="fa-solid fa-hand-pointer text-base"></i>
                      <span>CLICK HERE TO FOCUS GAME & PRESS ANY BUTTON ON GAMESIR</span>
                    </button>

                    <div className="w-full bg-slate-900/5 dark:bg-white/5 p-4 rounded-2xl border border-slate-900/10 dark:border-white/10 flex items-center gap-4 text-left">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <Bluetooth size={20} className="text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-400 uppercase">GAMESIR / PC BLUETOOTH HELP</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-tight">
                          Browsers lock Bluetooth pads until you click the game window and press a button (A, X, or Start).
                        </p>
                      </div>
                    </div>

                    {/* Collapsible GameSir PC Mode Guide */}
                    <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden text-left">
                      <button
                        onClick={() => setShowGameSirGuide(!showGameSirGuide)}
                        className="w-full p-3 flex items-center justify-between text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <i className="fa-solid fa-wrench"></i> GameSir PC Bluetooth Mode Guide
                        </span>
                        <i className={`fa-solid fa-chevron-${showGameSirGuide ? 'up' : 'down'}`}></i>
                      </button>

                      {showGameSirGuide && (
                        <div className="p-3 border-t border-amber-500/20 text-[11px] text-slate-700 dark:text-slate-300 space-y-2 font-medium">
                          <div className="p-2 rounded-xl bg-slate-900/10 dark:bg-slate-900/40">
                            <span className="font-bold text-emerald-500">1. Recommended PC Mode (XInput / Xbox):</span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Turn OFF controller. Hold <u className="font-bold text-white">B + HOME</u> (or <u className="font-bold text-white">X + HOME</u>) for 3s until LED flashes fast. Pair in Windows Bluetooth as <i>"Xbox Wireless Controller"</i>.
                            </p>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-900/10 dark:bg-slate-900/40">
                            <span className="font-bold text-amber-500">2. Android / HID Mode:</span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Hold <u className="font-bold text-white">A + HOME</u>. Connects as "GameSir...".
                            </p>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-900/10 dark:bg-slate-900/40">
                            <span className="font-bold text-blue-400">3. Switch Mode:</span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Hold <u className="font-bold text-white">Y + HOME</u>. Connects as "Pro Controller".
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Virtual GameSir Fallback */}
                    <button
                      onClick={handleEnableVirtualGameSir}
                      className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-bolt text-amber-400"></i>
                      <span>Enable Force GameSir Virtual PC Mode</span>
                    </button>
                  </div>
                )}

                <div className="w-full flex flex-col gap-3 mt-4">
                  {selectedControllerType ? (
                    <>
                      <AnimatedButton
                        onClick={onClose}
                        className="w-full bg-green-600 text-white font-fredoka py-4 rounded-2xl shadow-lg shadow-green-600/20"
                      >
                        I'M READY!
                      </AnimatedButton>
                      <button 
                        onClick={() => setSelectedControllerType(null)}
                        className="text-slate-500 dark:text-slate-400 font-fredoka py-2 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        BACK
                      </button>
                    </>
                  ) : connectedController ? (
                    <button 
                      onClick={onClose}
                      className="text-slate-500 dark:text-slate-400 font-fredoka py-2 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      BACK
                    </button>
                  ) : (
                    <>
                      <AnimatedButton
                        onClick={() => {
                          // Note: Browsers cannot directly open system settings.
                          // We use this as a polite prompt for the user.
                          alert('Please check your device Bluetooth settings.');
                        }}
                        className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white font-fredoka py-3 rounded-2xl hover:bg-slate-900/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Bluetooth size={18} />
                        OPEN BLUETOOTH
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white font-fredoka py-4 rounded-2xl shadow-lg shadow-blue-600/20"
                      >
                        OK, I UNDERSTAND
                      </AnimatedButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
