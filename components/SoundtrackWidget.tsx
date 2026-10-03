import React, { useEffect, useState } from 'react';
import { soundtrack, TRACKS, SoundtrackState } from '../src/services/soundtrackService';

interface SoundtrackWidgetProps {
  className?: string;
  compact?: boolean;
}

export const SoundtrackWidget: React.FC<SoundtrackWidgetProps> = ({ className = '', compact = false }) => {
  const [state, setState] = useState<SoundtrackState>(soundtrack.getState());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = soundtrack.subscribe((newState) => {
      setState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const currentTrack = TRACKS[state.currentTrackIndex] || TRACKS[0];

  return (
    <div className={`relative z-40 select-none ${className}`}>
      {/* Mini / Compact Bar */}
      <div className="flex items-center gap-2 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-700/60 rounded-2xl px-3 py-1.5 shadow-xl text-white">
        {/* Equalizer Wave Icon */}
        <button
          onClick={() => soundtrack.togglePlay()}
          title={state.isPlaying ? "Pause Background Music" : "Play Video Game Music"}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            state.isPlaying
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          {state.isPlaying ? (
            <i className="fa-solid fa-pause text-xs"></i>
          ) : (
            <i className="fa-solid fa-play text-xs ml-0.5"></i>
          )}
        </button>

        {/* Animated Equalizer Bars */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-end gap-0.5 h-4 px-1 cursor-pointer"
          title="Toggle Track Details"
        >
          {[0.7, 1.0, 0.5, 0.85, 0.6].map((mult, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                state.isPlaying && !state.isMuted
                  ? 'bg-gradient-to-t from-red-500 to-amber-400'
                  : 'bg-slate-700 h-1.5'
              }`}
              style={{
                height: state.isPlaying && !state.isMuted
                  ? `${Math.max(4, ((state.activeBeat + i) % 5 + 1) * 3 * mult)}px`
                  : '4px'
              }}
            />
          ))}
        </div>

        {/* Track Title Info */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer max-w-[140px] sm:max-w-[190px] overflow-hidden leading-tight"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-fredoka font-bold text-white truncate">
              {currentTrack.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium">
            <span className="text-red-400 font-bold">{currentTrack.genre}</span>
            <span>•</span>
            <span>{currentTrack.bpm} BPM</span>
          </div>
        </div>

        {/* Skip Track Button */}
        <button
          onClick={() => soundtrack.nextTrack()}
          title="Next Video Game Track"
          className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
        >
          <i className="fa-solid fa-forward-step"></i>
        </button>

        {/* Mute Button */}
        <button
          onClick={() => soundtrack.toggleMute()}
          title={state.isMuted ? "Unmute Music" : "Mute Music"}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
            state.isMuted ? 'text-red-400 bg-red-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <i className={`fa-solid ${state.isMuted || state.volume === 0 ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
        </button>

        {/* Expand / Minimize Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title="Soundtrack Menu"
          className="w-6 h-6 rounded-lg text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
        >
          <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </button>
      </div>

      {/* Expanded Track Selection Drawer */}
      {isExpanded && (
        <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto w-72 sm:w-80 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-compact-disc text-red-500 animate-spin" style={{ animationDuration: '6s' }}></i>
              <span className="font-fredoka text-xs text-white uppercase tracking-wider font-bold">
                Pimo Arcade Soundtrack
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-2 rounded-xl">
            <i className={`fa-solid ${state.isMuted ? 'fa-volume-xmark text-red-400' : 'fa-volume-low text-slate-400'} text-xs`}></i>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.isMuted ? 0 : state.volume}
              onChange={(e) => {
                if (state.isMuted) soundtrack.setMuted(false);
                soundtrack.setVolume(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
              {state.isMuted ? '0%' : `${Math.round(state.volume * 100)}%`}
            </span>
          </div>

          {/* Track List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {TRACKS.map((track, idx) => {
              const isSelected = idx === state.currentTrackIndex;
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    soundtrack.setTrack(idx);
                    if (!state.isPlaying) soundtrack.play();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-red-600/20 border-red-500/50 text-white shadow-md shadow-red-500/10'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${
                      isSelected
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:text-white'
                    }`}>
                      {isSelected && state.isPlaying ? (
                        <i className="fa-solid fa-volume-high animate-pulse"></i>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold font-fredoka leading-tight truncate">
                        {track.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {track.genre} • {track.bpm} BPM
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-mono text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/50 shrink-0">
                      PLAYING
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-800">
            Real-time retro Web Audio synthesis • Zero bandwidth
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundtrackWidget;
