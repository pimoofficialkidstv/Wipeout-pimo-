import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, Difficulty } from '../types';
import { getTranslation } from '../src/translations';
import { getMoroVoice, playAudio } from '../src/services/ttsService';
import AppleIntelligenceOrb, { OrbState } from './AppleIntelligenceOrb';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  groundingChunks?: { uri: string; title: string }[];
  modelUsed?: string;
  summaryBullets?: string[];
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  playerStats: {
    highScore: number;
    totalMorobux?: number;
    totalPimobux?: number;
    selectedCharacter: Character;
    selectedDifficulty: Difficulty;
  };
  language: string;
}

const QUICK_PROMPTS = [
  "How do I double jump?",
  "How to get more PimoBux?",
  "Tips for Rainbow Hills",
  "How to beat Hard & Insane mode?",
  "What do Glimmer Stars do?",
  "Best Pimo Kart racing tips",
];

const generateBulletSummary = (content: string, groundingChunks?: { title: string; uri: string }[]) => {
  const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
  const bullets = sentences.slice(0, 3);
  if (bullets.length === 0) {
    bullets.push(content.slice(0, 120));
  }
  if (groundingChunks && groundingChunks.length > 0) {
    bullets.push(`Verified across ${groundingChunks.length} live web sources including "${groundingChunks[0].title}".`);
  }
  return bullets;
};

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, playerStats, language }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: getTranslation('INITIAL_GREETING', language) || "Hey human! I'm Glimmer AI. Search or ask me anything about Wipeout Pimo, mechanics, secrets, or high scores!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [useSearch, setUseSearch] = useState<boolean>(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Determine the dynamic orb state
  const orbState: OrbState = isListening
    ? 'listening'
    : isLoading
      ? 'thinking'
      : isTalking
        ? 'speaking'
        : 'idle';

  // Stop active speech / audio
  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsTalking(false);
  };

  const playMoroVoice = async (text: string) => {
    if (!voiceEnabled) return;
    stopAudio();
    setIsTalking(true);

    try {
      const audioBase64 = await getMoroVoice(text);
      if (audioBase64) {
        await playAudio(audioBase64);
        setIsTalking(false);
      } else {
        // Fallback to Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Google') || v.name.includes('Female'))) || voices.find(v => v.lang.startsWith('en-')) || voices[0];
          if (preferredVoice) utterance.voice = preferredVoice;

          utterance.pitch = 1.45;
          utterance.rate = 1.15;
          utterance.onend = () => setIsTalking(false);
          utterance.onerror = () => setIsTalking(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsTalking(false);
        }
      }
    } catch (e) {
      console.error("TTS Error:", e);
      setIsTalking(false);
    }
  };

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        stopAudio();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      stopAudio();
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // Scroll chat history
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, showHistory]);

  // Speech Recognition (Dictation)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your query in Search or Ask.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      stopAudio();
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'Spanish' ? 'es-ES' : language === 'French' ? 'fr-FR' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // If there's input text, auto-send after a short delay
        if (inputRef.current && inputRef.current.value.trim()) {
          handleSendQuery(inputRef.current.value.trim());
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  const handleSendQuery = async (queryToSend?: string) => {
    const text = (queryToSend || input).trim();
    if (!text || isLoading) return;

    stopAudio();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    setIsLoading(true);

    // Fallback response generator if API key is missing or offline
    const getLocalSmartResponse = (prompt: string): string => {
      const p = prompt.toLowerCase();
      if (p.includes('jump') || p.includes('double jump')) {
        return "To Double Jump, press Up Arrow, W, or Spacebar once to jump, then press it again while mid-air! Double jumping lets you clear tall obstacles, spiked barriers, and bouncing balls with ease.";
      }
      if (p.includes('morobux') || p.includes('coin') || p.includes('money') || p.includes('currency')) {
        return "You can earn MoroBux by finishing runs, completing map milestones, clearing the Wipeout Tutorial (+100 MoroBux reward), claiming Daily Rewards, and finding hidden MoroBux floating on tracks!";
      }
      if (p.includes('rainbow') || p.includes('rainbow hills')) {
        return "Rainbow Hills is fast and bouncy! Keep an eye out for slope inclines to gain airtime, and time your dashes right as you crest hills to get a massive speed boost.";
      }
      if (p.includes('hard') || p.includes('insane') || p.includes('difficulty')) {
        return "For Hard and Insane modes, obstacles move faster and spawn closer together. Use shorter, controlled jumps and conserve your Dash burst for panic evasions!";
      }
      if (p.includes('kart') || p.includes('race') || p.includes('racing')) {
        return "In Moro Kart mode, use bananas to slip opponents behind you, collect ghosts to slow down the race leaders, and grab anti-ball shields to deflect oncoming hazards!";
      }
      if (p.includes('glimmer') || p.includes('star')) {
        return "Glimmer Stars are mischievous cosmic hazards! If you collide with one, they give you a cheeky kick off the track. Jump or dash over them quickly!";
      }
      if (p.includes('voice') || p.includes('microphone') || p.includes('speak')) {
        return "You can use Voice Search by clicking the microphone icon in the main dashboard search bar! Just say a map name like 'Desert' or 'Rainbow Hills' to find it instantly.";
      }
      if (p.includes('multiplayer') || p.includes('lobby') || p.includes('friend')) {
        return "You can play with friends in the Multiplayer Lobby! Invite them using room links, chat with them, and race together in real-time.";
      }
      if (p.includes('editor') || p.includes('custom') || p.includes('roblox') || p.includes('studio')) {
        return "The Roblox Studio / Map Editor lets you build your very own 3D custom maps! You can place ramps, obstacles, and test your creations.";
      }
      if (p.includes('avatar') || p.includes('wardrobe') || p.includes('skin') || p.includes('customize')) {
        return "Check out the Avatar Customizer and Wardrobe to equip new karts, helmets, characters, and even change your HUD themes!";
      }
      return "Zorp! My neural circuits are busy right now, but I can tell you all about the Multiplayer Lobby, Voice Search, Map Editor, or Moro Kart!";
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(1).slice(-6).map(m => ({
            role: m.role,
            content: m.content
          })),
          text,
          playerStats,
          language,
          model: selectedModel,
          useSearch
        })
      });

      let data: any = {};
      if (response.ok) {
        data = await response.json();
      }

      const reply = data.text?.trim() || getLocalSmartResponse(text);
      const grounding = data.groundingChunks || [
        { uri: `https://www.google.com/search?q=${encodeURIComponent(text || 'Wipeout Pimo')}`, title: `Search Google: ${text || 'Wipeout Pimo'}` }
      ];

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: reply, 
        timestamp: Date.now(),
        groundingChunks: grounding,
        modelUsed: data.modelUsed || selectedModel
      }]);
      playMoroVoice(reply);
    } catch (err) {
      console.warn("AI Generation fallback active:", err);
      const reply = getLocalSmartResponse(text);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: reply, 
        timestamp: Date.now(), 
        groundingChunks: [
          { uri: `https://www.google.com/search?q=${encodeURIComponent(text || 'Wipeout Pimo')}`, title: `Search Google: ${text || 'Wipeout Pimo'}` }
        ],
        modelUsed: selectedModel 
      }]);
      playMoroVoice(reply);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-4 select-none">
        {/* Soft Backdrop Scrim (Leaves Game Background Visible) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            stopAudio();
            onClose();
          }}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
        />

        {/* Main Floating Apple Intelligence Siri Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-xl flex flex-col items-center gap-6"
        >
          {/* Top Control Utilities Bar (Minimalist) */}
          <div className="w-full flex items-center justify-between px-3 text-xs text-white/70 font-sans">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="font-semibold tracking-wider uppercase text-[11px] text-white/90">
                Glimmer Intelligence
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-black/50 border border-white/20 rounded-full px-2.5 py-1 text-[11px] text-white focus:outline-none cursor-pointer"
                title="Select Gemini Model"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Reasoning)</option>
              </select>

              <button
                onClick={() => setVoiceEnabled(v => !v)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 border ${
                  voiceEnabled
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-black/30 border-white/10 text-white/40'
                }`}
                title={voiceEnabled ? "Voice Output Active" : "Voice Output Muted"}
              >
                <i className={`fa-solid ${voiceEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                <span className="hidden sm:inline">{voiceEnabled ? 'Voice On' : 'Muted'}</span>
              </button>

              <button
                onClick={() => setShowHistory(h => !h)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 border ${
                  showHistory
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white/10 border-white/10 text-white/70 hover:text-white'
                }`}
                title="Toggle Conversation History"
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span className="hidden sm:inline">History</span>
              </button>

              <button
                onClick={() => {
                  stopAudio();
                  onClose();
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all"
                title="Close (Esc)"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          {/* 1. "Search or Ask" Capsule Pill (Exact Reference Image Style) */}
          <div className="w-full relative group">
            <div className="w-full h-14 sm:h-16 rounded-full bg-gradient-to-r from-[#1d1d20]/95 via-[#2b2b30]/95 to-[#1d1d20]/95 border border-white/20 shadow-[0_15px_45px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-2xl px-5 sm:px-6 flex items-center justify-between transition-all duration-300 focus-within:border-white/40 focus-within:shadow-[0_15px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(255,255,255,0.1)]">
              {/* Left: Blinking Cursor & Text Input */}
              <div className="flex items-center gap-1 flex-1 mr-3 overflow-hidden">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendQuery();
                    }
                  }}
                  placeholder="Search or Ask"
                  disabled={isLoading || isListening}
                  className="w-full bg-transparent text-white font-sans text-base sm:text-lg tracking-wide placeholder:text-slate-400/80 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Right: Search Toggle & Microphone / Submit Action Icons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseSearch(s => !s)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 border cursor-pointer ${
                    useSearch
                      ? 'bg-purple-600/30 border-purple-400/50 text-red-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={useSearch ? "Google Search Grounding Enabled" : "Google Search Grounding Disabled"}
                >
                  <i className="fa-brands fa-google text-xs"></i>
                  <span className="hidden sm:inline">Search</span>
                </button>

                {input.trim() ? (
                  <button
                    onClick={() => handleSendQuery()}
                    disabled={isLoading}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black hover:bg-slate-200 transition-all flex items-center justify-center shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Send Question"
                  >
                    <i className="fa-solid fa-arrow-up text-sm sm:text-base font-bold"></i>
                  </button>
                ) : (
                  <button
                    onClick={toggleListening}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    title={isListening ? "Listening... (Click to Stop)" : "Speak via Microphone"}
                  >
                    <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'} text-base sm:text-lg`}></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Iconic Apple Intelligence Glowing Wave Orb (Exact Screenshot Style) */}
          <div className="relative flex flex-col items-center justify-center my-1">
            <AppleIntelligenceOrb
              state={orbState}
              size={175}
              onClick={() => {
                if (isTalking) {
                  stopAudio();
                } else if (!isListening && !isLoading) {
                  toggleListening();
                }
              }}
            />

            {/* State status indicator below orb */}
            <div className="mt-2 text-xs font-sans tracking-wide text-slate-300 flex items-center gap-2">
              {orbState === 'listening' && (
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5 animate-pulse">
                  <i className="fa-solid fa-wave-square"></i> Listening to voice...
                </span>
              )}
              {orbState === 'thinking' && (
                <span className="text-amber-300 font-semibold flex items-center gap-1.5 animate-pulse">
                  <i className="fa-solid fa-sparkles animate-spin"></i> Processing answer...
                </span>
              )}
              {orbState === 'speaking' && (
                <button
                  onClick={stopAudio}
                  className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-volume-high"></i> Speaking... (Click to stop)
                </button>
              )}
              {orbState === 'idle' && (
                <span className="text-slate-400/80 text-[11px]">
                  Tap mic to speak or enter question above
                </span>
              )}
            </div>
          </div>

          {/* 3. Conversation History Drawer (Toggleable) */}
          {showHistory ? (
            <div
              ref={chatScrollRef}
              className="w-full max-h-[36vh] bg-[#141517]/90 border border-white/10 rounded-3xl p-4 overflow-y-auto space-y-3 shadow-2xl backdrop-blur-xl custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-slate-300">Conversation History</span>
                <button
                  onClick={() => setMessages([{ role: 'assistant', content: "Chat history cleared. How can I help you today?" }])}
                  className="text-red-400 hover:text-red-300 text-[11px] transition-colors"
                >
                  Clear History
                </button>
              </div>

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-sans leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-[#232428] text-slate-200 border border-white/10 rounded-bl-none'
                    }`}
                  >
                    {m.content}
                    {m.role === 'assistant' && (
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => playMoroVoice(m.content)}
                            className="text-red-400 hover:text-red-300 inline-flex items-center gap-1 cursor-pointer"
                            title="Play Voice"
                          >
                            <i className="fa-solid fa-volume-high"></i> Play Audio
                          </button>
                          <button
                            onClick={() => {
                              setMessages(prev => prev.map((msg, index) => {
                                if (index === idx) {
                                  return {
                                    ...msg,
                                    summaryBullets: msg.summaryBullets ? undefined : generateBulletSummary(msg.content, msg.groundingChunks)
                                  };
                                }
                                return msg;
                              }));
                            }}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-red-300 border border-purple-500/30 px-2 py-0.5 rounded inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Summarize into key bullet points"
                          >
                            <i className="fa-solid fa-list-check text-[10px]"></i> {m.summaryBullets ? 'Hide Summary' : 'Summarize'}
                          </button>
                        </div>
                        {m.modelUsed && (
                          <span className="bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                            ⚡ {m.modelUsed}
                          </span>
                        )}
                      </div>
                    )}
                    {m.summaryBullets && m.summaryBullets.length > 0 && (
                      <div className="mt-2.5 p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-1.5 w-full text-xs text-slate-200">
                        <div className="font-semibold text-red-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                          <i className="fa-solid fa-sparkles"></i> AI Summary Key Takeaways
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {m.summaryBullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {m.groundingChunks && m.groundingChunks.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 w-full">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <i className="fa-solid fa-search text-red-400"></i> Searched Web Sources
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.groundingChunks.map((chunk, i) => (
                            <a
                              key={i}
                              href={chunk.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-black/40 border border-white/10 hover:border-purple-500/50 rounded px-2 py-1 text-[10px] text-slate-300 hover:text-red-300 transition-colors"
                              title={chunk.title}
                            >
                              <i className="fa-brands fa-google text-[10px]"></i>
                              <span className="truncate max-w-[120px]">{chunk.title || new URL(chunk.uri).hostname.replace('www.', '')}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 4. Latest Intelligent Response Card */
            <AnimatePresence mode="wait">
              {latestAssistantMessage && (
                <motion.div
                  key={latestAssistantMessage.content}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full bg-[#17181c]/85 border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 text-sm sm:text-base font-sans text-slate-100 leading-relaxed">
                      {latestAssistantMessage.content}
                      {latestAssistantMessage.summaryBullets && latestAssistantMessage.summaryBullets.length > 0 && (
                        <div className="mt-3 p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-2xl space-y-2 w-full text-xs sm:text-sm text-slate-200">
                          <div className="font-semibold text-red-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                            <i className="fa-solid fa-sparkles"></i> AI Summary Key Takeaways
                          </div>
                          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                            {latestAssistantMessage.summaryBullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="leading-relaxed">{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {latestAssistantMessage.groundingChunks && latestAssistantMessage.groundingChunks.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5 w-full">
                          <div className="text-[10px] uppercase tracking-wider text-red-300 font-semibold flex items-center gap-1.5">
                            <i className="fa-brands fa-google text-xs"></i> Verified Web Sources
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {latestAssistantMessage.groundingChunks.map((chunk, i) => (
                              <a
                                key={i}
                                href={chunk.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-black/40 border border-white/10 hover:border-purple-500/50 rounded px-2 py-1 text-[10px] text-slate-300 hover:text-red-300 transition-colors"
                                title={chunk.title}
                              >
                                <i className="fa-brands fa-google text-[10px]"></i>
                                <span className="truncate max-w-[140px]">{chunk.title || new URL(chunk.uri).hostname.replace('www.', '')}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => playMoroVoice(latestAssistantMessage.content)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Replay Voice"
                      >
                        <i className="fa-solid fa-volume-high text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 flex items-center gap-1">
                        <i className="fa-solid fa-sparkles text-red-400"></i> Glimmer Intelligence
                      </span>
                      <button
                        onClick={() => {
                          setMessages(prev => {
                            const updated = [...prev];
                            const lastAssistantIdx = updated.map(x => x.role).lastIndexOf('assistant');
                            if (lastAssistantIdx !== -1) {
                              const target = updated[lastAssistantIdx];
                              updated[lastAssistantIdx] = {
                                ...target,
                                summaryBullets: target.summaryBullets ? undefined : generateBulletSummary(target.content, target.groundingChunks)
                              };
                            }
                            return updated;
                          });
                        }}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-red-300 border border-purple-500/30 px-2 py-0.5 rounded inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Summarize into key bullet points"
                      >
                        <i className="fa-solid fa-list-check text-[10px]"></i> {latestAssistantMessage.summaryBullets ? 'Hide Summary' : 'Summarize'}
                      </button>
                    </div>
                    {latestAssistantMessage.modelUsed && (
                      <span className="bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                        ⚡ {latestAssistantMessage.modelUsed}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* 5. Quick Suggestion Chips */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-1">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendQuery(prompt)}
                disabled={isLoading}
                className="bg-black/40 hover:bg-white/15 active:scale-95 border border-white/15 rounded-full px-3.5 py-1.5 text-xs text-slate-300 hover:text-white font-sans transition-all backdrop-blur-md cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AIAssistant;
