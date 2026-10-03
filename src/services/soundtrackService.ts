// Procedural Web Audio Video Game Soundtrack Engine for Wipeout Pimo
// High-energy 8-bit / 16-bit arcade synth background music that loops seamlessly.

export interface SoundtrackTrack {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  description: string;
  bars: number;
}

export interface SoundtrackState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  currentTrackIndex: number;
  trackTitle: string;
  activeBeat: number;
}

type StateListener = (state: SoundtrackState) => void;

// Musical note frequencies (Hz)
const NOTE: Record<string, number> = {
  REST: 0,
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
  C6: 1046.50
};

// 4 iconic video game background music compositions
export const TRACKS: SoundtrackTrack[] = [
  {
    id: 'pimo-dash',
    title: "Pimo's 8-Bit Dash",
    genre: "Chiptune Arcade",
    bpm: 130,
    description: "Upbeat retro platformer runner theme with bouncy arpeggios",
    bars: 4
  },
  {
    id: 'cyber-runner',
    title: "Neon Cyber Runner",
    genre: "Synthwave / Electro",
    bpm: 124,
    description: "Futuristic driving synth bassline with high-energy arcade pulse",
    bars: 4
  },
  {
    id: 'apple-meadow',
    title: "Sunny Apple Meadow",
    genre: "Whimsical Adventure",
    bpm: 116,
    description: "Playful cheerful Nintendo-inspired melody with bright bells",
    bars: 4
  },
  {
    id: 'boss-rush',
    title: "Overdrive Speedrun",
    genre: "High-Octane Racer",
    bpm: 140,
    description: "Fast-paced adrenaline soundtrack for extreme obstacle dodging",
    bars: 4
  }
];

class VideoGameSoundtrackEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.55;
  private currentTrackIndex = 0;
  private listeners: Set<StateListener> = new Set();
  
  // Audio playback scheduling
  private schedulerInterval: any = null;
  private nextNoteTime = 0;
  private currentStep = 0; // 0 to 63 (64 sixteenth notes per 4-bar loop)
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Load stored preferences
    if (typeof window !== 'undefined') {
      const savedMuted = localStorage.getItem('pimo_music_muted');
      if (savedMuted !== null) this.isMuted = savedMuted === 'true';

      const savedVol = localStorage.getItem('pimo_music_volume');
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.volume = v;
      }

      const savedTrack = localStorage.getItem('pimo_music_track_index');
      if (savedTrack !== null) {
        const idx = parseInt(savedTrack, 10);
        if (!isNaN(idx) && idx >= 0 && idx < TRACKS.length) this.currentTrackIndex = idx;
      }
    }
  }

  private initAudio() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create white noise buffer for chiptune drums (snare & hi-hat)
      const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec noise
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch (e) {
      console.warn("Soundtrack AudioContext init skipped:", e);
    }
  }

  public subscribe(listener: StateListener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  public getState(): SoundtrackState {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      currentTrackIndex: this.currentTrackIndex,
      trackTitle: TRACKS[this.currentTrackIndex].title,
      activeBeat: Math.floor(this.currentStep / 4) % 16
    };
  }

  public async play() {
    this.initAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn("AudioContext resume warning:", err);
      }
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Start lookahead scheduler
    clearInterval(this.schedulerInterval);
    this.schedulerInterval = setInterval(() => this.scheduleNotes(), 25);
    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public nextTrack() {
    this.setTrack((this.currentTrackIndex + 1) % TRACKS.length);
  }

  public prevTrack() {
    this.setTrack((this.currentTrackIndex - 1 + TRACKS.length) % TRACKS.length);
  }

  public setTrack(index: number) {
    if (index < 0 || index >= TRACKS.length) return;
    this.currentTrackIndex = index;
    localStorage.setItem('pimo_music_track_index', index.toString());
    this.currentStep = 0;
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('pimo_music_volume', this.volume.toString());
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('pimo_music_muted', muted.toString());
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleMute() {
    this.setMuted(!this.isMuted);
  }

  // Lookahead scheduler loop
  private scheduleNotes() {
    if (!this.ctx || !this.isPlaying || !this.masterGain) return;

    const scheduleAheadTime = 0.15; // 150ms ahead
    const currentTrack = TRACKS[this.currentTrackIndex];
    const secondsPer16th = 60 / (currentTrack.bpm * 4);

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.playStep(this.currentStep, this.nextNoteTime, currentTrack.id, secondsPer16th);
      this.nextNoteTime += secondsPer16th;
      this.currentStep = (this.currentStep + 1) % 64; // 64 sixteenth notes (4 bars of 4/4)
    }

    this.notify();
  }

  // Play individual audio elements at scheduled time
  private playStep(step: number, time: number, trackId: string, stepDuration: number) {
    if (!this.ctx || !this.masterGain) return;

    switch (trackId) {
      case 'pimo-dash':
        this.renderPimoDash(step, time, stepDuration);
        break;
      case 'cyber-runner':
        this.renderCyberRunner(step, time, stepDuration);
        break;
      case 'apple-meadow':
        this.renderAppleMeadow(step, time, stepDuration);
        break;
      case 'boss-rush':
        this.renderBossRush(step, time, stepDuration);
        break;
      default:
        this.renderPimoDash(step, time, stepDuration);
    }
  }

  // ----------------------------------------------------------------------
  // SOUND SYNTHESIS HELPERS
  // ----------------------------------------------------------------------
  private playTone(freq: number, time: number, duration: number, type: OscillatorType, gainLevel: number, decay = 0.05) {
    if (freq <= 0 || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(gainLevel * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.02, duration - decay));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playKick(time: number, power = 1.0) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.7 * power, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playSnare(time: number, power = 1.0) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35 * power, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.16);

    // Subtle tone punch beneath the snare noise
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    oscGain.gain.setValueAtTime(0.3 * power, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.09);
  }

  private playHiHat(time: number, open = false) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, time);

    const gain = this.ctx.createGain();
    const duration = open ? 0.12 : 0.04;
    gain.gain.setValueAtTime(open ? 0.2 : 0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  // ----------------------------------------------------------------------
  // TRACK 1: PIMO'S 8-BIT DASH
  // ----------------------------------------------------------------------
  private renderPimoDash(step: number, time: number, dur: number) {
    // Drums (Kick on 0, 8, 16, 24... Snare on 4, 12, 20, 28... Hats on every even step)
    const beat = step % 16;
    if (beat === 0 || beat === 8 || (step === 30 || step === 62)) {
      this.playKick(time, 0.9);
    }
    if (beat === 4 || beat === 12) {
      this.playSnare(time, 0.85);
    }
    if (step % 2 === 0) {
      this.playHiHat(time, step % 8 === 6);
    }

    // Bassline (Funky 8-bit pulse)
    const bassSeq = [
      NOTE.C3, NOTE.C3, NOTE.G2, NOTE.C3, NOTE.F2, NOTE.G2, NOTE.A2, NOTE.B2,
      NOTE.C3, NOTE.C3, NOTE.G2, NOTE.C3, NOTE.A2, NOTE.G2, NOTE.F2, NOTE.E2,
      NOTE.A2, NOTE.A2, NOTE.E2, NOTE.A2, NOTE.G2, NOTE.A2, NOTE.B2, NOTE.C3,
      NOTE.F2, NOTE.F2, NOTE.C2, NOTE.F2, NOTE.G2, NOTE.G2, NOTE.B2, NOTE.D3,
      NOTE.C3, NOTE.C3, NOTE.G2, NOTE.C3, NOTE.F2, NOTE.G2, NOTE.A2, NOTE.B2,
      NOTE.C3, NOTE.C3, NOTE.G2, NOTE.C3, NOTE.A2, NOTE.G2, NOTE.F2, NOTE.E2,
      NOTE.F2, NOTE.F2, NOTE.C3, NOTE.F2, NOTE.G2, NOTE.G2, NOTE.D3, NOTE.G2,
      NOTE.C3, NOTE.E3, NOTE.G3, NOTE.C4, NOTE.G3, NOTE.E3, NOTE.D3, NOTE.B2
    ];
    const bassNote = bassSeq[step % bassSeq.length];
    if (bassNote) {
      this.playTone(bassNote, time, dur * 1.4, 'triangle', 0.6);
    }

    // Melody (Catchy Chiptune Lead in Square wave)
    const melodySeq = [
      NOTE.C5, NOTE.REST, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.REST, NOTE.G5, NOTE.REST,
      NOTE.E5, NOTE.F5, NOTE.G5, NOTE.A5, NOTE.G5, NOTE.REST, NOTE.E5, NOTE.REST,
      NOTE.D5, NOTE.REST, NOTE.F5, NOTE.A5, NOTE.D6, NOTE.REST, NOTE.A5, NOTE.REST,
      NOTE.G5, NOTE.A5, NOTE.B5, NOTE.C6, NOTE.B5, NOTE.G5, NOTE.E5, NOTE.D5,
      NOTE.C5, NOTE.REST, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.REST, NOTE.B5, NOTE.A5,
      NOTE.G5, NOTE.REST, NOTE.E5, NOTE.C5, NOTE.D5, NOTE.REST, NOTE.E5, NOTE.REST,
      NOTE.F5, NOTE.A5, NOTE.C6, NOTE.A5, NOTE.G5, NOTE.B5, NOTE.D6, NOTE.B5,
      NOTE.C6, NOTE.REST, NOTE.G5, NOTE.E5, NOTE.C5, NOTE.REST, NOTE.REST, NOTE.REST
    ];
    const melNote = melodySeq[step % melodySeq.length];
    if (melNote) {
      this.playTone(melNote, time, dur * 1.5, 'square', 0.4);
    }

    // Fast decorative arpeggio on off-beats
    if (step % 4 === 2) {
      const arpNote = (step < 32) ? NOTE.G5 : NOTE.C5;
      this.playTone(arpNote, time, dur * 0.8, 'sawtooth', 0.15);
    }
  }

  // ----------------------------------------------------------------------
  // TRACK 2: NEON CYBER RUNNER
  // ----------------------------------------------------------------------
  private renderCyberRunner(step: number, time: number, dur: number) {
    const beat = step % 16;
    // Four on the floor kick
    if (beat % 4 === 0) {
      this.playKick(time, 1.0);
    }
    // Heavy snare on 4 and 12
    if (beat === 4 || beat === 12) {
      this.playSnare(time, 0.95);
    }
    // Crisp hats on every 16th note
    this.playHiHat(time, step % 4 === 2);

    // Synthwave bass driving line
    const bassNotes = [
      NOTE.F2, NOTE.F2, NOTE.F2, NOTE.F2, NOTE.A2, NOTE.A2, NOTE.A2, NOTE.A2,
      NOTE.D2, NOTE.D2, NOTE.D2, NOTE.D2, NOTE.C2, NOTE.C2, NOTE.C2, NOTE.C2,
      NOTE.As2, NOTE.As2, NOTE.As2, NOTE.As2, NOTE.C3, NOTE.C3, NOTE.C3, NOTE.C3,
      NOTE.D2, NOTE.D2, NOTE.F2, NOTE.F2, NOTE.G2, NOTE.G2, NOTE.A2, NOTE.A2
    ];
    const bass = bassNotes[Math.floor(step / 2) % bassNotes.length];
    if (step % 2 === 0) {
      this.playTone(bass, time, dur * 1.8, 'sawtooth', 0.55);
    }

    // Cyber Synth Lead Melody
    const cyberMelody = [
      NOTE.REST, NOTE.F4, NOTE.A4, NOTE.C5, NOTE.D5, NOTE.REST, NOTE.C5, NOTE.REST,
      NOTE.A4, NOTE.REST, NOTE.F4, NOTE.REST, NOTE.G4, NOTE.A4, NOTE.F4, NOTE.REST,
      NOTE.REST, NOTE.D5, NOTE.F5, NOTE.A5, NOTE.G5, NOTE.REST, NOTE.F5, NOTE.REST,
      NOTE.D5, NOTE.REST, NOTE.C5, NOTE.REST, NOTE.D5, NOTE.REST, NOTE.REST, NOTE.REST,
      NOTE.REST, NOTE.A4, NOTE.C5, NOTE.F5, NOTE.E5, NOTE.REST, NOTE.D5, NOTE.REST,
      NOTE.C5, NOTE.D5, NOTE.C5, NOTE.A4, NOTE.G4, NOTE.REST, NOTE.A4, NOTE.REST,
      NOTE.F4, NOTE.G4, NOTE.A4, NOTE.C5, NOTE.D5, NOTE.F5, NOTE.G5, NOTE.A5,
      NOTE.G5, NOTE.F5, NOTE.D5, NOTE.C5, NOTE.D5, NOTE.REST, NOTE.REST, NOTE.REST
    ];
    const mel = cyberMelody[step % cyberMelody.length];
    if (mel) {
      this.playTone(mel, time, dur * 2.0, 'sawtooth', 0.45);
    }
  }

  // ----------------------------------------------------------------------
  // TRACK 3: SUNNY APPLE MEADOW
  // ----------------------------------------------------------------------
  private renderAppleMeadow(step: number, time: number, dur: number) {
    const beat = step % 16;
    if (beat === 0 || beat === 6 || beat === 10) {
      this.playKick(time, 0.7);
    }
    if (beat === 4 || beat === 12) {
      this.playSnare(time, 0.6);
    }
    if (step % 2 === 0) {
      this.playHiHat(time, false);
    }

    // Bouncy Marimba / Staccato Chords
    const chordStep = Math.floor(step / 16);
    const chords = [
      [NOTE.G3, NOTE.B3, NOTE.D4], // G
      [NOTE.E3, NOTE.G3, NOTE.B3], // Em
      [NOTE.C3, NOTE.E3, NOTE.G3], // C
      [NOTE.D3, NOTE.Fs3, NOTE.A3] // D
    ];
    const currentChord = chords[chordStep % chords.length];
    if (step % 4 === 0 || step % 4 === 2) {
      currentChord.forEach(note => {
        this.playTone(note, time, dur * 0.9, 'triangle', 0.25);
      });
    }

    // Playful Apple Flute / Bell Melody
    const meadowMelody = [
      NOTE.G4, NOTE.B4, NOTE.D5, NOTE.REST, NOTE.E5, NOTE.REST, NOTE.D5, NOTE.B4,
      NOTE.A4, NOTE.REST, NOTE.B4, NOTE.REST, NOTE.G4, NOTE.REST, NOTE.REST, NOTE.REST,
      NOTE.E4, NOTE.G4, NOTE.B4, NOTE.REST, NOTE.C5, NOTE.REST, NOTE.B4, NOTE.G4,
      NOTE.A4, NOTE.B4, NOTE.A4, NOTE.G4, NOTE.A4, NOTE.REST, NOTE.REST, NOTE.REST,
      NOTE.C5, NOTE.E5, NOTE.G5, NOTE.REST, NOTE.Fs5, NOTE.REST, NOTE.E5, NOTE.C5,
      NOTE.D5, NOTE.REST, NOTE.B4, NOTE.REST, NOTE.G4, NOTE.REST, NOTE.REST, NOTE.REST,
      NOTE.A4, NOTE.B4, NOTE.C5, NOTE.D5, NOTE.E5, NOTE.D5, NOTE.C5, NOTE.B4,
      NOTE.G4, NOTE.A4, NOTE.B4, NOTE.D5, NOTE.G5, NOTE.REST, NOTE.REST, NOTE.REST
    ];
    const mel = meadowMelody[step % meadowMelody.length];
    if (mel) {
      this.playTone(mel, time, dur * 1.3, 'sine', 0.5);
    }
  }

  // ----------------------------------------------------------------------
  // TRACK 4: OVERDRIVE SPEEDRUN
  // ----------------------------------------------------------------------
  private renderBossRush(step: number, time: number, dur: number) {
    // 140 BPM Rapid fire drums
    const beat = step % 8;
    if (beat === 0 || beat === 3 || beat === 5) {
      this.playKick(time, 1.0);
    }
    if (beat === 2 || beat === 6) {
      this.playSnare(time, 0.95);
    }
    this.playHiHat(time, step % 2 === 1);

    // Speedrun Acid Arpeggio
    const arpNotes = [
      NOTE.E3, NOTE.E4, NOTE.G3, NOTE.G4, NOTE.B3, NOTE.B4, NOTE.E4, NOTE.G4,
      NOTE.D3, NOTE.D4, NOTE.Fs3, NOTE.Fs4, NOTE.A3, NOTE.A4, NOTE.D4, NOTE.Fs4,
      NOTE.C3, NOTE.C4, NOTE.E3, NOTE.E4, NOTE.G3, NOTE.G4, NOTE.C4, NOTE.E4,
      NOTE.B2, NOTE.B3, NOTE.Ds3, NOTE.Ds4, NOTE.Fs3, NOTE.Fs4, NOTE.B3, NOTE.Ds4
    ];
    const arp = arpNotes[step % arpNotes.length];
    this.playTone(arp, time, dur * 0.95, 'sawtooth', 0.4);

    // Piercing Heroic Lead
    const bossMelody = [
      NOTE.E5, NOTE.REST, NOTE.REST, NOTE.G5, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.REST,
      NOTE.B4, NOTE.REST, NOTE.D5, NOTE.REST, NOTE.E5, NOTE.REST, NOTE.REST, NOTE.REST,
      NOTE.G5, NOTE.REST, NOTE.REST, NOTE.A5, NOTE.B5, NOTE.REST, NOTE.G5, NOTE.REST,
      NOTE.A5, NOTE.B5, NOTE.A5, NOTE.G5, NOTE.Fs5, NOTE.REST, NOTE.REST, NOTE.REST,
      NOTE.E5, NOTE.REST, NOTE.REST, NOTE.G5, NOTE.B5, NOTE.REST, NOTE.C6, NOTE.REST,
      NOTE.B5, NOTE.REST, NOTE.A5, NOTE.REST, NOTE.G5, NOTE.A5, NOTE.B5, NOTE.REST,
      NOTE.A5, NOTE.G5, NOTE.Fs5, NOTE.E5, NOTE.Ds5, NOTE.Fs5, NOTE.B5, NOTE.A5,
      NOTE.G5, NOTE.Fs5, NOTE.E5, NOTE.Ds5, NOTE.E5, NOTE.REST, NOTE.REST, NOTE.REST
    ];
    const mel = bossMelody[step % bossMelody.length];
    if (mel) {
      this.playTone(mel, time, dur * 2.2, 'square', 0.5);
    }
  }
}

// Global Singleton Instance
export const soundtrack = new VideoGameSoundtrackEngine();
