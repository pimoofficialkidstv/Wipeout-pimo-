import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../types';
import Moro3D from './Moro3D';

interface MagicalWorldProps {
  character: Character;
  onExit: () => void;
  language: string;
}

const MagicalWorld: React.FC<MagicalWorldProps> = ({ character, onExit, language }) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [characterX, setCharacterX] = useState(50);
  const [characterY, setCharacterY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const gravity = 0.8;
    if (characterY > 0) {
      setCharacterY(prev => Math.max(0, prev - gravity));
    } else {
      setIsJumping(false);
    }
  }, [characterY, isPaused]);

  const handleMapClick = (mapName: string) => {
    setSelectedMap(mapName);
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 2500);
  };

  const moveLeft = () => setCharacterX(prev => Math.max(0, prev - 5));
  const moveRight = () => setCharacterX(prev => Math.min(90, prev + 5));
  const jump = () => {
    if (!isJumping) {
      setIsJumping(true);
      setCharacterY(20);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-pink-200 flex flex-col items-center justify-center overflow-hidden">
      {/* Animation Overlay */}
      {showAnimation && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[210] bg-pink-200 flex flex-col items-center justify-center"
        >
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-pink-600 font-fredoka text-6xl font-bold drop-shadow-lg">
              Pimo Studio Presents
            </h2>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-6xl animate-bounce">🍬</span>
              <span className="text-pink-400 font-fredoka text-3xl">{selectedMap}</span>
              <span className="text-6xl animate-bounce">🍬</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Initial Moro Studio Presents Screen */}
      {!selectedMap && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 z-10"
        >
          <h2 className="text-pink-600 font-fredoka text-4xl font-bold drop-shadow-lg">
            Pimo Studio Presents
          </h2>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="text-4xl">🍬</span>
            <span className="text-pink-400 font-fredoka text-xl">Cotton Candy World</span>
            <span className="text-4xl">🍬</span>
          </div>
        </motion.div>
      )}

      {/* Pop-up Map */}
      {!selectedMap && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/80 backdrop-blur-md border-4 border-pink-300 rounded-[3rem] p-8 shadow-2xl max-w-2xl w-full relative z-10"
        >
          <div className="text-center mb-6">
            <h3 className="text-pink-500 font-fredoka text-3xl">Magical Map</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div onClick={() => handleMapClick('Candy Castle')} className="bg-pink-200/50 p-6 rounded-3xl flex flex-col items-center gap-3 border-2 border-pink-300 hover:scale-105 transition-transform cursor-pointer">
              <span className="text-5xl">🏰</span>
              <span className="font-fredoka text-pink-700">Candy Castle</span>
            </div>
            <div onClick={() => handleMapClick('Rainbow River')} className="bg-pink-200/50 p-6 rounded-3xl flex flex-col items-center gap-3 border-2 border-pink-300 hover:scale-105 transition-transform cursor-pointer">
              <span className="text-5xl">🌈</span>
              <span className="font-fredoka text-pink-700">Rainbow River</span>
            </div>
            <div onClick={() => handleMapClick('Unicorn Valley')} className="bg-pink-200/50 p-6 rounded-3xl flex flex-col items-center gap-3 border-2 border-pink-300 hover:scale-105 transition-transform cursor-pointer">
              <span className="text-5xl">🦄</span>
              <span className="font-fredoka text-pink-700">Unicorn Valley</span>
            </div>
            <div onClick={() => handleMapClick('Cloud Kingdom')} className="bg-pink-200/50 p-6 rounded-3xl flex flex-col items-center gap-3 border-2 border-pink-300 hover:scale-105 transition-transform cursor-pointer">
              <span className="text-5xl">☁️</span>
              <span className="font-fredoka text-pink-700">Cloud Kingdom</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Game Area (Only visible after map selection) */}
      {selectedMap && (
        <>
          {/* Top Bar: Distance, Pause, X */}
          <div className="absolute top-6 w-full px-6 flex justify-between items-center z-[220]">
            <div className="bg-white/60 backdrop-blur-md rounded-full px-6 py-3 shadow-lg font-fredoka text-xl text-slate-700">
              DISTANCE: 6m
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="bg-purple-400/50 hover:bg-purple-400/70 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'} text-2xl`}></i>
              </button>
              <button 
                onClick={() => setShowExitConfirm(true)}
                className="bg-red-400/50 hover:bg-red-400/70 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="w-[90%] h-[40vh] bg-white/50 backdrop-blur-md border-4 border-white/50 rounded-[3rem] shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/4 bg-green-500"></div>
            
            {/* Moro Character */}
            <motion.div 
              animate={{ x: `${characterX}%`, y: `${-characterY * 5}px` }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute bottom-[20%] left-0 w-32 h-32"
            >
              <Moro3D character={character} width={128} height={128} />
            </motion.div>
            
            {/* Unicorn Obstacles */}
            <motion.div 
              animate={{ x: ['100%', '-100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[20%] right-0 w-12 h-12 bg-pink-500 rounded-full"
            >
            </motion.div>
          </div>

          {/* Bottom Controls: < > A */}
          <div className="mt-8 w-[90%] bg-white/30 backdrop-blur-md rounded-[3rem] p-6 flex justify-between items-center shadow-lg">
            <div className="flex gap-6">
              <button onClick={moveLeft} className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center text-4xl shadow-md hover:bg-white/70">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button onClick={moveRight} className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center text-4xl shadow-md hover:bg-white/70">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
            <button onClick={jump} className="w-32 h-32 rounded-full border-4 border-green-500 bg-white/50 flex items-center justify-center text-5xl font-bold text-green-500 shadow-xl hover:bg-white/70">
              A
            </button>
          </div>
        </>
      )}

      {/* Exit Button */}
      <button 
        onClick={() => setShowExitConfirm(true)}
        className="absolute top-6 right-6 bg-white/50 hover:bg-white/80 text-pink-600 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all z-20"
      >
        <i className="fa-solid fa-xmark text-2xl"></i>
      </button>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-pink-900/40 backdrop-blur-sm"
              onClick={() => setShowExitConfirm(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl relative z-10 text-center"
            >
              <h3 className="text-pink-600 font-fredoka text-3xl mb-6">Are you sure?!</h3>
              <div className="flex gap-4">
                <button 
                  onClick={onExit}
                  className="flex-1 bg-pink-500 text-white font-fredoka py-4 rounded-2xl hover:bg-pink-600 transition-all shadow-lg"
                >
                  Yes
                </button>
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-fredoka py-4 rounded-2xl hover:bg-slate-200 transition-all shadow-md"
                >
                  No
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MagicalWorld;
