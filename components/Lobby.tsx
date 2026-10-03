import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../src/firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc } from 'firebase/firestore';
import { getTranslation } from '../src/translations';
import { signInAnonymously } from 'firebase/auth';

interface LobbyProps {
  language: string;
  onStart: () => void;
  onCancel: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ language, onStart, onCancel }) => {
  const [playerCount, setPlayerCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rId = new URLSearchParams(window.location.search).get('room') || 'default';

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=duo&room=${rId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        const roomRef = doc(db, 'rooms', rId);
        updateDoc(roomRef, {
          players: arrayRemove(auth.currentUser.uid)
        }).catch(console.error);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const joinRoom = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        const roomRef = doc(db, 'rooms', rId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          await setDoc(roomRef, {
            players: [auth.currentUser?.uid],
            status: 'waiting',
            createdAt: serverTimestamp()
          });
        } else {
          const data = roomSnap.data();
          if (data && data.players && !data.players.includes(auth.currentUser?.uid)) {
            await updateDoc(roomRef, {
              players: arrayUnion(auth.currentUser?.uid)
            });
          }
        }

        unsubscribe = onSnapshot(roomRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (data && data.players) {
              const count = data.players.length;
              setPlayerCount(count);
              
              if (count >= 2) {
                if (!startTimeoutRef.current) {
                  startTimeoutRef.current = setTimeout(() => {
                    onStart();
                  }, 1500);
                }
              } else {
                if (startTimeoutRef.current) {
                  clearTimeout(startTimeoutRef.current);
                  startTimeoutRef.current = null;
                }
              }
            }
          }
        });
      } catch (error) {
        console.error("Lobby error:", error);
        // Do not auto-start. A real game waits for the player.
      }
    };

    joinRoom();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (unsubscribe) unsubscribe();
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      
      // Cleanup: remove player from room
      if (auth.currentUser) {
        const roomRef = doc(db, 'rooms', rId);
        updateDoc(roomRef, {
          players: arrayRemove(auth.currentUser.uid)
        }).catch(console.error);
      }
    };
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="relative">
            <i className="fa-solid fa-user-group text-4xl text-blue-400"></i>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs text-slate-900 dark:text-white font-bold animate-pulse border-2 border-slate-900">
              {playerCount}/2
            </div>
          </div>
        </div>
        
        <h3 className="text-3xl font-fredoka text-slate-900 dark:text-white mb-4">
          {playerCount < 2 
            ? (getTranslation('WAITING_FOR_PLAYERS', language) || 'WAITING FOR PLAYERS...') 
            : (getTranslation('READY_TO_START', language) || 'READY TO START!')}
        </h3>
        
        <div className="flex justify-center gap-6 mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${playerCount >= 1 ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-100 dark:bg-slate-800 border-slate-700'}`}>
            <i className="fa-solid fa-user text-2xl text-slate-900 dark:text-white"></i>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${playerCount >= 2 ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-100 dark:bg-slate-800 border-slate-700 animate-pulse'}`}>
            <i className={`fa-solid fa-user text-2xl text-slate-900 dark:text-white ${playerCount < 2 ? 'opacity-20' : 'opacity-100'}`}></i>
          </div>
        </div>

        <p className="text-slate-500 dark:text-slate-400 mb-6 font-fredoka text-lg">
          {playerCount < 2 
            ? (getTranslation('WAITING_DESC', language) || 'Invite a friend to join the race!')
            : (getTranslation('STARTING_DESC', language) || 'Both players joined! Starting in 1s...')}
        </p>

        {playerCount < 2 && (
          <div className="mb-8">
            <div className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-slate-900/10 dark:border-white/10 mb-3">
              <span className="text-slate-600 dark:text-slate-300 font-mono text-sm truncate mr-3">
                {`${window.location.origin}${window.location.pathname}?mode=duo&room=${rId}`}
              </span>
              <button 
                onClick={handleCopyLink}
                className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white p-2 rounded-lg transition-colors shrink-0"
              >
                <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              </button>
            </div>
            {copied && <p className="text-green-400 text-sm font-fredoka animate-in fade-in">Link copied to clipboard!</p>}
          </div>
        )}

        <button 
          onClick={onCancel}
          className="w-full bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-fredoka py-4 rounded-2xl text-xl hover:bg-slate-900/10 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-all border border-slate-900/10 dark:border-white/10"
        >
          {getTranslation('CANCEL', language) || 'CANCEL'}
        </button>
      </div>
    </div>
  );
};

export default Lobby;
