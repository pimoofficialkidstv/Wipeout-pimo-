import React, { useState, useEffect, useRef } from 'react';
import Moro3D from './Moro3D';
import { Character } from '../types';
import MoroStudioLogo from './MoroStudioLogo';
import { motion } from 'motion/react';

interface OfflineGameProps {
  character: Character;
  onTryAgain: () => void;
}

const OfflineGame: React.FC<OfflineGameProps> = ({ character, onTryAgain }) => {
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('moro_offline_highscore') || 0));
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWifiWarning, setShowWifiWarning] = useState(false);

  const [moroY, setMoroY] = useState(0);
  const [moroRotation, setMoroRotation] = useState(0);
  const [obstacleX, setObstacleX] = useState(100);

  const velocityRef = useRef(0);
  const moroYRef = useRef(0);
  const moroRotationRef = useRef(0);
  const obstacleXRef = useRef(100);
  const isPlayingRef = useRef(false);
  const scoreRef = useRef(0);

  const jump = () => {
    if (!isPlayingRef.current && !isGameOver) {
      startGame();
    }
    if (moroYRef.current === 0) {
      velocityRef.current = 16; // Jump strength
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    scoreRef.current = 0;
    obstacleXRef.current = 100;
    moroRotationRef.current = 0;
    isPlayingRef.current = true;
  };

  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (isPlayingRef.current) {
        // Physics
        moroYRef.current += velocityRef.current;
        velocityRef.current -= 0.8; // Gravity

        if (moroYRef.current <= 0) {
          moroYRef.current = 0;
          velocityRef.current = 0;
        }

        // Rotation (roll like a ball)
        moroRotationRef.current += 0.1 + (scoreRef.current * 0.0005);

        // Obstacle movement
        obstacleXRef.current -= 1.2 + (scoreRef.current * 0.002); // Speed up over time
        if (obstacleXRef.current < -10) {
          obstacleXRef.current = 100;
          scoreRef.current += 10;
          setScore(Math.floor(scoreRef.current));
        }

        // Collision detection
        const moroRight = 10 + 8;
        const moroLeft = 10 + 2;
        const obsLeft = obstacleXRef.current;
        const obsRight = obstacleXRef.current + 5;

        if (obsLeft < moroRight && obsRight > moroLeft && moroYRef.current < 40) {
          // Hit!
          isPlayingRef.current = false;
          setIsPlaying(false);
          setIsGameOver(true);
          if (scoreRef.current > highScore) {
            setHighScore(Math.floor(scoreRef.current));
            localStorage.setItem('moro_offline_highscore', Math.floor(scoreRef.current).toString());
          }
        }

        setMoroY(moroYRef.current);
        setMoroRotation(moroRotationRef.current);
        setObstacleX(obstacleXRef.current);
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  const handleTryAgain = () => {
    if (navigator.onLine) {
      onTryAgain();
    } else {
      setShowWifiWarning(true);
      setTimeout(() => setShowWifiWarning(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex flex-col items-center p-4 py-12 select-none overflow-y-auto" onClick={jump}>
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        <div className="flex flex-col items-center mb-10">
          <MoroStudioLogo size={100} className="mb-6 drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]" />
          <h1 className="text-4xl md:text-5xl font-fredoka text-white font-black tracking-tight mb-2">You are offline</h1>
          <p className="text-red-300 font-fredoka text-xl uppercase tracking-[0.2em] opacity-80">play this game instead</p>
        </div>

        <div className="w-full h-72 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 relative overflow-hidden mb-12 cursor-pointer shadow-2xl">
          {/* Ground Glow */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
          
          {/* Score */}
          <div className="absolute top-6 right-8 font-mono text-2xl font-bold tracking-widest z-20 flex flex-col items-end sm:flex-row sm:gap-6">
            {highScore > 0 && (
              <span className="text-white/40 uppercase text-xs sm:text-sm self-center">Personal Best: {highScore.toString().padStart(5, '0')}</span>
            )}
            <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">{score.toString().padStart(5, '0')}</span>
          </div>

          {/* Start Prompt */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 flex items-center justify-center z-10 px-8 text-center text-white/30 font-fredoka uppercase tracking-widest text-sm italic">
              Tap or press Space to jump
            </div>
          )}

          {/* Game Over Screen */}
          {isGameOver && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
              className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#0a0a0f]/60"
            >
              <h2 className="text-5xl font-fredoka text-white font-black mb-8 tracking-tighter drop-shadow-lg">GAME OVER</h2>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="bg-white text-slate-950 font-fredoka px-10 py-4 rounded-2xl text-xl hover:scale-105 active:scale-95 transition-all shadow-xl font-bold flex items-center gap-3"
              >
                <i className="fa-solid fa-rotate-right"></i> Replay
              </button>
            </motion.div>
          )}

          {/* Ground Line */}
          <div className="absolute bottom-8 w-full h-[1px] bg-white/20"></div>

          {/* Moro Character */}
          <div 
            className="absolute left-[10%] w-16 h-16 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            style={{ bottom: `${32 + moroY}px` }}
          >
            <Moro3D character={character} width={64} height={64} rotation={moroRotation} />
          </div>

          {/* Cactus Obstacle (Refined) */}
          <div 
            className="absolute bottom-8 w-6 h-12 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-t-lg shadow-[0_0_15px_rgba(96,165,250,0.3)] transition-colors duration-300"
            style={{ left: `${obstacleX}%` }}
          >
            <div className="absolute top-4 -left-3 w-3 h-5 border-l-4 border-b-4 border-indigo-500 rounded-bl-lg"></div>
            <div className="absolute top-2 -right-3 w-3 h-7 border-r-4 border-b-4 border-indigo-500 rounded-br-lg"></div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={(e) => { e.stopPropagation(); handleTryAgain(); }}
            className="group relative bg-white/10 backdrop-blur-md border border-white/20 text-white font-fredoka px-12 py-5 rounded-[2rem] text-2xl font-black tracking-wide hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl"
          >
            Try again
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          {showWifiWarning && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 font-fredoka font-bold text-lg bg-red-400/10 border border-red-400/30 px-6 py-3 rounded-2xl backdrop-blur-2xl"
            >
              You need to get the wifi!
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineGame;
