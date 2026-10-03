import React from 'react';
import { motion } from 'motion/react';
import Moro3D from './Moro3D';
import { CHARACTERS } from '../constants';
import PimoStudiosLogo from './PimoStudiosLogo';

interface CreditsModalProps {
  onClose: () => void;
  language: string;
  music: string | null;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose, language, music }) => {
  // Use state to make the character spin
  const [rotation, setRotation] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => r + 0.05);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (music) {
      import('../src/services/ttsService').then(({ playAudio }) => {
         playAudio(music);
      });
    }
  }, [music]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black flex items-center justify-center"
    >
      {/* Background Cinematic Placeholder */}
      <div className="absolute inset-0 bg-slate-900 z-0 flex items-center justify-center overflow-hidden">
        {/* Placeholder for Wipeout Pimo background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 to-purple-900 opacity-50"></div>
        <div className="text-white/10 text-[20vw] font-black tracking-tighter animate-pulse select-none">
          WIPEOUT
        </div>
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 w-full max-w-xl h-full flex flex-col items-center py-20 px-8"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all z-20"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Spinning Pimo Character */}
        <div className="mb-8">
           <Moro3D 
             character={CHARACTERS[0]} 
             width={250} 
             height={250} 
             rotation={rotation}
           />
        </div>

        <motion.div 
          className="overflow-hidden h-full flex flex-col items-center w-full mask-linear-fade"
          initial={{ y: '100%' }}
          animate={{ y: '-100%' }}
          transition={{ duration: 25, ease: 'linear', repeat: Infinity, repeatDelay: 1 }}
        >
          <h2 className="text-6xl font-fredoka text-white mb-20">Credits</h2>
          
          <div className="space-y-12 text-white font-fredoka text-center w-full">
            <div>
              <p className="text-sm text-yellow-400 mb-2">Created by</p>
              <p className="text-xl">Zayd/Pimo</p>
            </div>
            <div>
              <p className="text-sm text-yellow-400 mb-2">Lead Developer</p>
              <p className="text-xl">Pimo Team</p>
            </div>
            <div>
              <p className="text-sm text-yellow-400 mb-2">Design</p>
              <p className="text-xl">Pimo Studio</p>
            </div>
            <div>
              <p className="text-sm text-yellow-400 mb-2">Engine</p>
              <p className="text-xl">Antigravity Framework</p>
            </div>
            <div>
              <p className="text-lg">Special thanks to all our</p>
              <p className="text-2xl text-red-400">Beta Testers!</p>
            </div>
            <div>
              <p className="text-sm text-yellow-400 mb-2">Design</p>
              <p className="text-xl">AI Studio</p>
            </div>
            
            <div className="pt-16 flex flex-col items-center">
              <PimoStudiosLogo size={140} variant="card" className="mb-4 shadow-2xl" />
              <h3 className="text-3xl font-black text-white tracking-wide">Pimo Studios™</h3>
              <p className="text-xs text-red-300 font-mono mt-1">Official Game Studio</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
