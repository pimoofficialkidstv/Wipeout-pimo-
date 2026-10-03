import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MoroStudioLogo from './MoroStudioLogo';

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'moro' | 'wipeout' | 'loading' | 'done'>('moro');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer1: any, timer2: any, timer3: any;

    // Show Pimo Studio logo
    timer1 = setTimeout(() => {
      setPhase('wipeout');
    }, 2500);

    // Show Wipeout Pimo logo and start loading
    timer2 = setTimeout(() => {
      setPhase('loading');
      
      // Simulate loading progress
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 15;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(() => {
            setPhase('done');
            onComplete();
          }, 500);
        }
        setProgress(Math.min(p, 100));
      }, 100);
      
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'moro' && (
          <motion.div
            key="moro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="w-64 h-64 mb-8">
              <MoroStudioLogo />
            </div>
            <h2 className="text-4xl md:text-5xl font-fredoka text-white tracking-widest uppercase">
              Pimo Studio
            </h2>
          </motion.div>
        )}

        {(phase === 'wipeout' || phase === 'loading') && (
          <motion.div
            key="wipeout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center w-full max-w-md px-8"
          >
            <h1 className="text-6xl md:text-8xl font-fredoka tracking-tighter text-white text-center mb-12 drop-shadow-[0_0_40px_rgba(239,68,68,0.4)]">
              WIPEOUT<br/><span className="text-red-500">PIMO</span>
            </h1>

            {phase === 'loading' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center gap-6"
              >
                {/* Loading Circle */}
                <div className="w-12 h-12 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
                
                {/* Loading Bar */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-600 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                  />
                </div>
                <p className="text-slate-400 font-fredoka text-sm uppercase tracking-widest">
                  Loading... {Math.floor(progress)}%
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntroScreen;
