import React, { useState, useEffect, useRef } from 'react';
import { GameState, Obstacle, MapData } from '../types';
import RobloxStudioIcon from './RobloxStudioIcon';
import MoroStudioLogo from './MoroStudioLogo';
import { getTranslation } from '../src/translations';

interface MapCreatorProps {
  onBack: () => void;
  isUnlocked: boolean;
  onUnlock: () => void;
  morobux: number;
  language: string;
}

const MapCreator: React.FC<MapCreatorProps> = ({ onBack, isUnlocked, onUnlock, morobux, language }) => {
  const PREDEFINED_OBSTACLES = [
    { type: 'star', icon: 'fa-star', color: 'text-yellow-400', label: getTranslation('GLIMMER_STAR', language) },
    { type: 'star_coin', icon: 'fa-coins', color: 'text-amber-400', label: getTranslation('MAP_ITEM_STAR_COIN', language) },
    { type: 'boost_pad', icon: 'fa-forward-fast', color: 'text-cyan-400', label: getTranslation('MAP_ITEM_BOOST_PAD', language) },
    { type: 'spring_pad', icon: 'fa-arrow-up-from-ground-water', color: 'text-red-400', label: getTranslation('MAP_ITEM_SPRING_PAD', language) },
    { type: 'laser_barrier', icon: 'fa-border-all', color: 'text-rose-500', label: getTranslation('MAP_ITEM_LASER_BARRIER', language) },
    { type: 'black_hole', icon: 'fa-atom', color: 'text-indigo-400', label: getTranslation('MAP_ITEM_BLACK_HOLE', language) },
    { type: 'lollipop', icon: 'fa-candy-cane', color: 'text-pink-400', label: getTranslation('MAP_ITEM_LOLLIPOP', language) },
    { type: 'cyber_drone', icon: 'fa-drone', color: 'text-teal-400', label: getTranslation('MAP_ITEM_CYBER_DRONE', language) },
    { type: 'ball', icon: 'fa-circle', color: 'text-blue-400', label: getTranslation('BOUNCY_BALL', language) },
    { type: 'blade', icon: 'fa-fan', color: 'text-red-400', label: getTranslation('ROTATING_BLADE', language) },
    { type: 'speed', icon: 'fa-bolt', color: 'text-cyan-400', label: getTranslation('SPEED_PAD', language) },
    { type: 'moro_flyer', icon: 'fa-plane', color: 'text-slate-500 dark:text-slate-400', label: getTranslation('PIMO_FLYER', language) || getTranslation('MORO_FLYER', language) || 'Flying Bot' },
    { type: 'moro_ninja', icon: 'fa-user-ninja', color: 'text-slate-800', label: getTranslation('PIMO_NINJA', language) || getTranslation('MORO_NINJA', language) || 'Ninja Bot' },
    { type: 'moro_jumper', icon: 'fa-frog', color: 'text-emerald-400', label: getTranslation('PIMO_JUMPER', language) || getTranslation('MORO_JUMPER', language) || 'Jumping Bot' },
  ];

  const PALETTE = [
    '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#06b6d4', '#ec4899', '#6366f1', '#1e293b', '#ffffff'
  ];

  const [mapName, setMapName] = useState(() => getTranslation('NEW_MAP', language) || 'New Map');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [intensity, setIntensity] = useState(0.5);
  const [brushType, setBrushType] = useState<'soft' | 'hard' | 'erase' | 'bucket'>('soft');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [gridSnapping, setGridSnapping] = useState(true);
  const [obstacleScale, setObstacleScale] = useState(1);
  const [atmosphere, setAtmosphere] = useState<'day' | 'night' | 'sunset' | 'cyber'>('night');
  const [showTerrainLayer, setShowTerrainLayer] = useState(true);
  const [showObstacleLayer, setShowObstacleLayer] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const [terrainImage, setTerrainImage] = useState<string | null>(null);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>(PREDEFINED_OBSTACLES[0].type);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // History management
  const [history, setHistory] = useState<{ terrain: string | null; obstacles: Obstacle[]; atmosphere: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushToHistory = (terrain: string | null, currentObstacles: Obstacle[]) => {
    const newState = { terrain, obstacles: [...currentObstacles], atmosphere };
    
    // Don't push if it's the same as the current state
    if (historyIndex >= 0) {
      const currentState = history[historyIndex];
      if (currentState.terrain === newState.terrain && 
          JSON.stringify(currentState.obstacles) === JSON.stringify(newState.obstacles) &&
          currentState.atmosphere === newState.atmosphere) {
        return;
      }
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history size to 50 steps
    if (newHistory.length > 50) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setTerrainImage(state.terrain);
      setObstacles(state.obstacles);
      setAtmosphere(state.atmosphere as any);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setTerrainImage(state.terrain);
      setObstacles(state.obstacles);
      setAtmosphere(state.atmosphere as any);
      setHistoryIndex(newIndex);
    }
  };

  // Initialize history when entering editor
  useEffect(() => {
    if (activeTool && historyIndex === -1) {
      pushToHistory(terrainImage, obstacles);
    }
  }, [activeTool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      } else if (activeTool === 'terrain') {
        if (e.key === '[') {
          e.preventDefault();
          setBrushSize(prev => Math.max(5, prev - 5));
          playSound(400);
        } else if (e.key === ']') {
          e.preventDefault();
          setBrushSize(prev => Math.min(150, prev + 5));
          playSound(500);
        } else if (e.key === '{') {
          e.preventDefault();
          setIntensity(prev => Math.max(0.1, prev - 0.1));
          playSound(450);
        } else if (e.key === '}') {
          e.preventDefault();
          setIntensity(prev => Math.min(1, prev + 0.1));
          playSound(550);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, activeTool, language]);

  // Add dummy playSound helper if not available in props (though App.tsx has it, MapCreator doesn't receive it)
  // Let's use a local simple sound helper
  const playSound = (freq: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const atmosphereColors: Record<string, string> = {
    day: '#f1f5f9',
    night: '#0f172a',
    sunset: '#4c1d95',
    cyber: '#050505'
  };

  // Initialize and handle canvas drawing
  useEffect(() => {
    if ((activeTool === 'terrain' || activeTool === 'obstacles') && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        if (terrainImage && showTerrainLayer) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            if (activeTool === 'obstacles' && showObstacleLayer) {
              drawObstacles(ctx);
            }
          };
          img.src = terrainImage;
        } else {
          // Fill with atmosphere background
          ctx.fillStyle = atmosphereColors[atmosphere];
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw atmosphere-specific patterns
          if (atmosphere === 'cyber') {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            const step = 60;
            for (let i = 0; i < canvas.width; i += step) {
              ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
            }
            for (let i = 0; i < canvas.height; i += step) {
              ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
            }
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 40) {
              ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
            }
            for (let i = 0; i < canvas.height; i += 40) {
              ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
            }
          }

          if (activeTool === 'obstacles' && showObstacleLayer) {
            drawObstacles(ctx);
          }
        }
      }
    }
  }, [activeTool, terrainImage, obstacles, atmosphere]);

  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    obstacles.forEach(obs => {
      ctx.save();
      ctx.translate(obs.x, obs.y);
      if (obs.scale) {
        ctx.scale(obs.scale, obs.scale);
      }
      
      // Draw a simple representation of the obstacle
      switch (obs.type) {
        case 'star':
          ctx.fillStyle = '#fbbf24'; // yellow-400
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * 15, -Math.sin((18 + i * 72) / 180 * Math.PI) * 15);
            ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * 7, -Math.sin((54 + i * 72) / 180 * Math.PI) * 7);
          }
          ctx.closePath();
          ctx.fill();
          break;
        case 'ball':
          ctx.fillStyle = '#60a5fa'; // blue-400
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'blade':
          ctx.fillStyle = '#f87171'; // red-400
          ctx.fillRect(-15, -2, 30, 4);
          ctx.fillRect(-2, -15, 4, 30);
          break;
        case 'speed':
          ctx.fillStyle = '#22d3ee'; // cyan-400
          ctx.beginPath();
          ctx.moveTo(-10, 10);
          ctx.lineTo(0, -10);
          ctx.lineTo(10, 10);
          ctx.closePath();
          ctx.fill();
          break;
        case 'moro_flyer':
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(-15, -2, 30, 4);
          break;
        case 'moro_ninja':
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-8, -4, 16, 2);
          break;
        case 'moro_jumper':
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI, true);
          ctx.fill();
          break;
      }
      ctx.restore();
    });
  };

  const handleSaveMap = () => {
    const mapData: MapData = {
      name: mapName,
      terrain: terrainImage,
      obstacles: obstacles,
      lastModified: new Date().toISOString(),
      version: '1.0',
      author: 'User'
    };

    // Serialize to JSON
    const serializedData = JSON.stringify(mapData);
    
    // Save to localStorage
    try {
      const storageKey = `wipeout_map_${mapName.replace(/\s+/g, '_').toLowerCase()}`;
      localStorage.setItem(storageKey, serializedData);
      
      // Also save to a list of maps
      const existingMapsJson = localStorage.getItem('wipeout_custom_maps');
      const existingMaps = existingMapsJson ? JSON.parse(existingMapsJson) : [];
      if (!existingMaps.includes(storageKey)) {
        existingMaps.push(storageKey);
        localStorage.setItem('wipeout_custom_maps', JSON.stringify(existingMaps));
      }

      alert(`Map "${mapName}" saved successfully!`);
      console.log('Saved Map Data:', mapData);
    } catch (e) {
      console.error('Failed to save map:', e);
      alert('Failed to save map. The terrain data might be too large for browser storage.');
    }
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Normalize coordinates
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((startX / rect.width) * canvas.width);
    const y = Math.floor((startY / rect.height) * canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Parse color
    const tempDiv = document.createElement('div');
    tempDiv.style.color = fillColor;
    const rgbStr = fillColor.startsWith('#') ? fillColor : getComputedStyle(document.body).getPropertyValue(fillColor) || fillColor;
    
    // Simple hex to rgb
    let fillR, fillG, fillB;
    if (fillColor.startsWith('#')) {
      fillR = parseInt(fillColor.slice(1, 3), 16);
      fillG = parseInt(fillColor.slice(3, 5), 16);
      fillB = parseInt(fillColor.slice(5, 7), 16);
    } else {
      fillR = 168; fillG = 85; fillB = 247; // Default purple
    }
    const fillA = 255;

    const pixelPos = (y * canvas.width + x) * 4;
    const startR = data[pixelPos];
    const startG = data[pixelPos + 1];
    const startB = data[pixelPos + 2];
    const startA = data[pixelPos + 3];

    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;

    const stack: [number, number][] = [[x, y]];
    const width = canvas.width;
    const height = canvas.height;

    while (stack.length > 0) {
      let [currX, currY] = stack.pop()!;
      let pos = (currY * width + currX) * 4;

      while (currY >= 0 && data[pos] === startR && data[pos+1] === startG && data[pos+2] === startB && data[pos+3] === startA) {
        currY--;
        pos -= width * 4;
      }
      pos += width * 4;
      currY++;

      let reachLeft = false;
      let reachRight = false;
      
      while (currY < height && data[pos] === startR && data[pos+1] === startG && data[pos+2] === startB && data[pos+3] === startA) {
        data[pos] = fillR;
        data[pos+1] = fillG;
        data[pos+2] = fillB;
        data[pos+3] = fillA;

        if (currX > 0) {
          const leftPos = pos - 4;
          if (data[leftPos] === startR && data[leftPos+1] === startG && data[leftPos+2] === startB && data[leftPos+3] === startA) {
            if (!reachLeft) {
              stack.push([currX - 1, currY]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (currX < width - 1) {
          const rightPos = pos + 4;
          if (data[rightPos] === startR && data[rightPos+1] === startG && data[rightPos+2] === startB && data[rightPos+3] === startA) {
            if (!reachRight) {
              stack.push([currX + 1, currY]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        currY++;
        pos += width * 4;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const currentTerrain = canvas.toDataURL('image/png');
    setTerrainImage(currentTerrain);
    pushToHistory(currentTerrain, obstacles);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      // Prevent scrolling on touch
      if (e.cancelable) e.preventDefault();
    }

    if (activeTool === 'terrain') {
      if (brushType === 'bucket') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
          const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
          floodFill(x, y, selectedColor);
        }
      } else {
        isDrawingRef.current = true;
        handleMouseMove(e);
      }
    } else if (activeTool === 'obstacles') {
      placeObstacle(e);
    }
  };

  const placeObstacle = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    if (gridSnapping) {
      x = Math.round(x / 40) * 40;
      y = Math.round(y / 40) * 40;
    }

    const newObstacle: Obstacle = {
      id: Date.now() + Math.random(),
      type: selectedObstacleType as any,
      x,
      y,
      rotation: 0,
      scale: obstacleScale
    };

    const newObstacles = [...obstacles, newObstacle];
    setObstacles(newObstacles);
    pushToHistory(terrainImage, newObstacles);
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current && canvasRef.current) {
      const currentTerrain = canvasRef.current.toDataURL('image/png');
      setTerrainImage(currentTerrain);
      pushToHistory(currentTerrain, obstacles);
    }
    isDrawingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y, clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      x = clientX - rect.left;
      y = clientY - rect.top;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      x = clientX - rect.left;
      y = clientY - rect.top;
    }

    setCursorPos({ x: clientX, y: clientY });

    if (!isDrawingRef.current || activeTool !== 'terrain') return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (brushType === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (brushType === 'hard') {
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Use current brush size and intensity from state
      ctx.beginPath();
      
      // Parse hex to RGB for gradient
      let r = 168, g = 85, b = 247;
      if (selectedColor.startsWith('#')) {
        r = parseInt(selectedColor.slice(1, 3), 16);
        g = parseInt(selectedColor.slice(3, 5), 16);
        b = parseInt(selectedColor.slice(5, 7), 16);
      }

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, brushSize);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const draw = handleMouseMove; // Compatibility with legacy calls

  if (activeTool === 'terrain' || activeTool === 'obstacles') {
    const isTerrain = activeTool === 'terrain';
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in zoom-in duration-500 overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-900/10 dark:border-white/10 bg-slate-900/50 backdrop-blur-xl z-20">
          <button onClick={() => setActiveTool(null)} className="bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka px-6 py-3 rounded-xl hover:bg-slate-900/20 dark:bg-white/20 transition-all flex items-center gap-2">
            <i className="fa-solid fa-arrow-left"></i> {getTranslation('BACK_TO_MAP', language)}
          </button>
          <h2 className="text-3xl font-fredoka text-slate-900 dark:text-white tracking-tight">
            {isTerrain ? getTranslation('TERRAIN_EDITOR', language) : getTranslation('OBSTACLE_PLACEMENT', language)} 
            <span className="text-red-500 text-sm ml-2 font-black uppercase tracking-widest opacity-50">v1.0</span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-900/50 rounded-xl p-1 border border-slate-900/10 dark:border-white/10">
              <button 
                onClick={undo}
                disabled={historyIndex <= 0}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                  historyIndex > 0 ? 'text-slate-900 dark:text-white hover:bg-slate-900/10 dark:bg-white/10' : 'text-white/20 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
              <button 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                  historyIndex < history.length - 1 ? 'text-slate-900 dark:text-white hover:bg-slate-900/10 dark:bg-white/10' : 'text-white/20 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
            </div>
            <div className="bg-purple-600/20 border border-purple-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
              <i className={`fa-solid ${isTerrain ? 'fa-mountain' : 'fa-star'} text-red-400`}></i>
              <span className="text-slate-900 dark:text-white font-fredoka text-sm uppercase">{mapName}</span>
            </div>
            <button 
              onClick={() => {
                if (canvasRef.current) {
                  const currentTerrain = canvasRef.current.toDataURL('image/png');
                  if (isTerrain) setTerrainImage(currentTerrain);
                  
                  // Trigger save with the current terrain
                  const mapData: MapData = {
                    name: mapName,
                    terrain: isTerrain ? currentTerrain : terrainImage,
                    obstacles: obstacles,
                    lastModified: new Date().toISOString(),
                    version: '1.0',
                    author: 'User'
                  };
                  const serializedData = JSON.stringify(mapData);
                  const storageKey = `wipeout_map_${mapName.replace(/\s+/g, '_').toLowerCase()}`;
                  localStorage.setItem(storageKey, serializedData);
                  
    try {
      const existingMapsJson = localStorage.getItem('wipeout_custom_maps');
      const existingMaps = existingMapsJson ? JSON.parse(existingMapsJson) : [];
      if (!Array.isArray(existingMaps)) {
        localStorage.setItem('wipeout_custom_maps', JSON.stringify([]));
        return;
      }
      if (!existingMaps.includes(storageKey)) {
        existingMaps.push(storageKey);
        localStorage.setItem('wipeout_custom_maps', JSON.stringify(existingMaps));
      }
    } catch (e) {
      console.error("Error saving map list:", e);
      localStorage.setItem('wipeout_custom_maps', JSON.stringify([storageKey]));
    }
                  alert('Map saved successfully!');
                }
              }}
              className="bg-green-600 text-slate-900 dark:text-white font-fredoka px-6 py-3 rounded-xl hover:bg-green-500 transition-all flex items-center gap-2 shadow-lg"
            >
              <i className="fa-solid fa-floppy-disk"></i> {getTranslation('SAVE_MAP', language)}
            </button>
          </div>
        </div>
        
        {/* Main Editor Viewport */}
        <div className={`flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-900 touch-none ${activeTool === 'terrain' ? 'cursor-none' : 'cursor-crosshair'}`}>
          <canvas 
            ref={canvasRef}
            className="w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => setShowCursor(true)}
            onMouseLeave={() => { handleMouseUp(); setShowCursor(false); }}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          />

          {/* Visual Brush Cursor */}
          {showCursor && activeTool === 'terrain' && (
            <div 
              className={`fixed pointer-events-none z-[200] ${brushType === 'bucket' ? '' : 'rounded-full border border-white/40 ring-1 ring-black/20'}`}
              style={{
                width: brushType === 'bucket' ? 40 : brushSize * 2,
                height: brushType === 'bucket' ? 40 : brushSize * 2,
                left: cursorPos.x,
                top: cursorPos.y,
                transform: 'translate(-50%, -50%)',
                backgroundColor: brushType === 'erase' ? 'rgba(239, 68, 68, 0.3)' : brushType === 'bucket' ? 'transparent' : selectedColor,
                opacity: brushType === 'bucket' ? 1 : (brushType === 'soft' ? intensity : 0.8),
                boxShadow: brushType === 'bucket' ? 'none' : `0 0 15px ${selectedColor}44`
              }}
            >
              {brushType === 'bucket' && <i className="fa-solid fa-fill-drip text-3xl text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"></i>}
              {brushType === 'hard' && <i className="fa-solid fa-pencil text-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></i>}
            </div>
          )}

          {/* Obstacle Preview */}
          {showCursor && activeTool === 'obstacles' && (
            <div 
              className="fixed pointer-events-none z-[200] opacity-50"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
               <i className={`fa-solid ${PREDEFINED_OBSTACLES.find(o => o.type === selectedObstacleType)?.icon || 'fa-question'} text-4xl text-red-500 shadow-xl`}></i>
            </div>
          )}
          
          {/* Floating Controls */}
          <div className="absolute top-8 left-8 flex flex-col gap-4 z-10">
            <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 p-6 rounded-3xl shadow-2xl">
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                {isTerrain ? getTranslation('BRUSHES', language) : getTranslation('OBSTACLES', language)}
              </p>
              <div className="flex flex-col gap-4">
                {isTerrain ? (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => setBrushType('soft')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${brushType === 'soft' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400'}`}
                        title="Soft Brush"
                      >
                        <i className="fa-solid fa-cloud"></i>
                      </button>
                      <button 
                        onClick={() => setBrushType('hard')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${brushType === 'hard' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400'}`}
                        title="Pencil"
                      >
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                      <button 
                        onClick={() => setBrushType('bucket')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${brushType === 'bucket' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400'}`}
                        title="Bucket Fill"
                      >
                        <i className="fa-solid fa-fill-drip"></i>
                      </button>
                      <button 
                        onClick={() => setBrushType('erase')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${brushType === 'erase' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400'}`}
                        title="Eraser"
                      >
                        <i className="fa-solid fa-eraser"></i>
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-900/10 dark:border-white/10">
                      <label className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] flex justify-between">
                        <span>Size</span>
                        <span>{brushSize}px</span>
                      </label>
                      <input 
                        type="range" 
                        min="5" 
                        max="150" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                     <div className="flex flex-col gap-2 pt-2">
                      <label className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] flex justify-between">
                        <span>Intensity</span>
                        <span>{Math.round(intensity * 100)}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.1"
                        value={intensity} 
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
                       <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em]">Palette</p>
                       <div className="grid grid-cols-5 gap-2">
                         {PALETTE.map(color => (
                           <button
                             key={color}
                             onClick={() => setSelectedColor(color)}
                             className={`w-7 h-7 rounded-lg border-2 transition-all ${selectedColor === color ? 'border-purple-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                             style={{ backgroundColor: color }}
                           />
                         ))}
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        const ctx = canvasRef.current?.getContext('2d');
                        if (ctx) {
                          ctx.fillStyle = atmosphereColors[atmosphere];
                          ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                          setTerrainImage(null);
                          pushToHistory(null, obstacles);
                        }
                      }}
                      className="w-full h-10 bg-red-600/20 text-red-400 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase hover:bg-red-600/30 transition-all font-fredoka"
                    >
                      <i className="fa-solid fa-trash"></i> {getTranslation('CLEAR', language) || 'CLEAR'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {PREDEFINED_OBSTACLES.map(obs => (
                        <button 
                          key={obs.type}
                          onClick={() => setSelectedObstacleType(obs.type)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            selectedObstacleType === obs.type 
                            ? 'bg-purple-600 text-slate-900 dark:text-white shadow-lg scale-110' 
                            : 'bg-slate-900/5 dark:bg-white/5 text-white/50 hover:bg-slate-900/10 dark:bg-white/10'
                          }`}
                          title={obs.label}
                        >
                          <i className={`fa-solid ${obs.icon}`}></i>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                      <button 
                        onClick={() => setGridSnapping(!gridSnapping)}
                        className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${gridSnapping ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}
                      >
                        <i className="fa-solid fa-thumbtack mr-2"></i> Grid Snap: {gridSnapping ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Atmosphere Selector */}
            <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 p-6 rounded-3xl shadow-2xl">
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                Atmosphere
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['day', 'night', 'sunset', 'cyber'] as const).map(env => (
                  <button 
                    key={env}
                    onClick={() => {
                      setAtmosphere(env);
                      pushToHistory(terrainImage, obstacles);
                    }}
                    className={`h-10 rounded-lg text-[10px] font-black uppercase transition-all ${atmosphere === env ? 'bg-purple-600 text-white ring-2 ring-purple-400/50 shadow-lg' : 'bg-white/5 text-white/40'}`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Visibility */}
            <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 p-6 rounded-3xl shadow-2xl">
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                View Layers
              </p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowTerrainLayer(!showTerrainLayer)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${showTerrainLayer ? 'bg-purple-600/20 text-red-200' : 'bg-white/5 text-white/30'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Terrain</span>
                  <i className={`fa-solid ${showTerrainLayer ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
                <button 
                  onClick={() => setShowObstacleLayer(!showObstacleLayer)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${showObstacleLayer ? 'bg-blue-600/20 text-blue-200' : 'bg-white/5 text-white/30'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Obstacles</span>
                  <i className={`fa-solid ${showObstacleLayer ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
              </div>
            </div>

            {/* Map Statistics */}
            <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 p-6 rounded-3xl shadow-2xl">
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                Map Stats
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-black text-white/50 uppercase tracking-widest">
                  <span>Obstacles:</span>
                  <span className="text-white">{obstacles.length} / 100</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (obstacles.length / 100) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-900/10 dark:border-white/10 p-4 rounded-[2.5rem] shadow-2xl z-10">
            {isTerrain ? (
              <div className="flex gap-6 px-4">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest">{getTranslation('BRUSH_SIZE', language)}</p>
                    <div className="flex gap-1">
                      {[15, 45, 100].map(s => (
                        <button 
                          key={s}
                          onClick={() => { setBrushSize(s); playSound(400 + s); }}
                          className={`w-5 h-5 flex items-center justify-center rounded text-[8px] font-black transition-all ${brushSize === s ? 'bg-purple-600 text-slate-900 dark:text-white' : 'bg-slate-300 dark:bg-slate-800 text-slate-500'}`}
                        >
                          {s === 15 ? 'S' : s === 45 ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setBrushSize(prev => Math.max(5, prev - 5))} className="w-6 h-6 rounded bg-slate-900/10 dark:bg-white/10 flex items-center justify-center hover:bg-slate-900/20 text-slate-900 dark:text-white transition-all"><i className="fa-solid fa-minus text-[8px]"></i></button>
                    <input 
                      type="range" 
                      min="5" 
                      max="150" 
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-32 accent-purple-500 cursor-pointer" 
                    />
                    <button onClick={() => setBrushSize(prev => Math.min(150, prev + 5))} className="w-6 h-6 rounded bg-slate-900/10 dark:bg-white/10 flex items-center justify-center hover:bg-slate-900/20 text-slate-900 dark:text-white transition-all"><i className="fa-solid fa-plus text-[8px]"></i></button>
                    <span className="text-slate-900 dark:text-white font-fredoka text-sm w-12 text-right">{brushSize}m</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-900/10 dark:bg-white/10 self-center"></div>
                <div className="flex flex-col">
                  <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-1">{getTranslation('INTENSITY', language)}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIntensity(prev => Math.max(0.1, prev - 0.1))} className="w-6 h-6 rounded bg-slate-900/10 dark:bg-white/10 flex items-center justify-center hover:bg-slate-900/20 text-slate-900 dark:text-white transition-all"><i className="fa-solid fa-minus text-[8px]"></i></button>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.1"
                      value={intensity}
                      onChange={(e) => setIntensity(parseFloat(e.target.value))}
                      className="w-32 accent-purple-500 cursor-pointer" 
                    />
                    <button onClick={() => setIntensity(prev => Math.min(1, prev + 0.1))} className="w-6 h-6 rounded bg-slate-900/10 dark:bg-white/10 flex items-center justify-center hover:bg-slate-900/20 text-slate-900 dark:text-white transition-all"><i className="fa-solid fa-plus text-[8px]"></i></button>
                    <span className="text-slate-900 dark:text-white font-fredoka text-sm w-12 text-right">{Math.round(intensity * 100)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-8 px-4">
                <div className="flex flex-col items-center">
                  <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] mb-1">{getTranslation('SELECTED_OBSTACLE', language)}</p>
                  <p className="text-slate-900 dark:text-white font-fredoka text-lg uppercase tracking-wider text-center">
                    {PREDEFINED_OBSTACLES.find(o => o.type === selectedObstacleType)?.label || 'Unknown'}
                  </p>
                </div>
                <div className="w-px h-10 bg-slate-900/10 dark:bg-white/10 self-center"></div>
                <div className="flex flex-col">
                  <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-1">Obstacle Scale</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setObstacleScale(prev => Math.max(0.5, prev - 0.1))} className="w-6 h-6 rounded bg-slate-900/10 dark:bg-white/10 flex items-center justify-center hover:bg-slate-900/20 text-slate-900 dark:text-white transition-all"><i className="fa-solid fa-minus text-[8px]"></i></button>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2" 
                      step="0.1"
                      value={obstacleScale}
                      onChange={(e) => setObstacleScale(parseFloat(e.target.value))}
                      className="w-32 accent-blue-500 cursor-pointer" 
                    />
                    <button onClick={() => setObstacleScale(prev => Math.min(2, prev + 0.1))} className="w-6 h-6 rounded bg-slate-900/10 dark:bg-white/10 flex items-center justify-center hover:bg-slate-900/20 text-slate-900 dark:text-white transition-all"><i className="fa-solid fa-plus text-[8px]"></i></button>
                    <span className="text-slate-900 dark:text-white font-fredoka text-sm w-12 text-right">{Math.round(obstacleScale * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
            <button 
              onClick={() => {
                if (canvasRef.current) {
                  const currentTerrain = canvasRef.current.toDataURL('image/png');
                  if (isTerrain) setTerrainImage(currentTerrain);
                  setActiveTool(null);
                }
              }}
              className="bg-purple-600 text-slate-900 dark:text-white font-fredoka px-10 py-5 rounded-[1.5rem] shadow-[0_6px_0_#581c87] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all text-lg"
            >
              {isTerrain ? getTranslation('SAVE_TERRAIN', language) : getTranslation('FINISH_PLACEMENT', language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-4xl">
      <div className="flex flex-col items-center mb-12 animate-in fade-in zoom-in duration-500">
        <MoroStudioLogo size={100} className="mb-6 shadow-2xl" />
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={onBack} 
            className="bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka px-8 py-4 rounded-2xl hover:bg-slate-900/20 dark:bg-white/20 transition-all"
          >
            {getTranslation('BACK', language)}
          </button>
          <h2 className="text-5xl font-fredoka text-slate-900 dark:text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-4">
            <RobloxStudioIcon className="w-12 h-12" />
            {getTranslation('MAP_CREATOR', language)}
          </h2>
          <button 
            onClick={handleSaveMap}
            className="bg-green-600 text-slate-900 dark:text-white font-fredoka px-8 py-4 rounded-2xl hover:bg-green-500 transition-all shadow-lg flex items-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk"></i> {getTranslation('SAVE', language)}
          </button>
        </div>
      </div>

      <div className="bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-[3rem] p-12 w-full flex flex-col items-center">
        <div className="mb-12 text-center">
          <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] mb-4">{getTranslation('EDITING_MAP', language)}</p>
          <h1 className="text-6xl font-fredoka text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            {mapName || getTranslation('UNTITLED_MAP', language)}
          </h1>
        </div>

        <div className="w-full mb-12">
          <label className="text-slate-500 font-black text-xs uppercase tracking-widest mb-2 block">{getTranslation('MAP_NAME', language)}</label>
          <input 
            type="text" 
            value={mapName} 
            onChange={(e) => setMapName(e.target.value)}
            className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-2xl p-6 text-slate-900 dark:text-white font-fredoka text-2xl focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <button 
            onClick={() => {
              if (isUnlocked) {
                setActiveTool('terrain');
              } else {
                onUnlock();
              }
            }}
            className={`group bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center aspect-video transition-all relative overflow-hidden ${
              isUnlocked ? 'hover:bg-slate-900/10 dark:bg-white/10 hover:border-purple-500/50' : 'opacity-80'
            }`}
          >
            <i className={`fa-solid fa-mountain-sun text-6xl mb-4 transition-transform group-hover:scale-110 ${isUnlocked ? 'text-red-500' : 'text-slate-600'}`}></i>
            <p className="text-slate-900 dark:text-white font-fredoka text-xl">{getTranslation('TERRAIN_EDITOR', language)}</p>
            {isUnlocked ? (
              <p className="text-red-400 text-xs mt-2 font-black uppercase tracking-widest">{getTranslation('READY_TO_SCULPT', language)}</p>
            ) : (
              <div className="flex flex-col items-center mt-2">
                <p className="text-slate-500 text-sm">{getTranslation('REQUIRES_UNLOCK', language)}</p>
                <div className="mt-2 bg-purple-600 text-slate-900 dark:text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                  <i className="fa-solid fa-lock text-[8px]"></i> {getTranslation('ONE_PIMO', language) || getTranslation('ONE_MORO', language) || '1 PIMO'}
                </div>
              </div>
            )}
          </button>
          
          <button 
            onClick={() => {
              if (isUnlocked) {
                setActiveTool('obstacles');
              } else {
                onUnlock();
              }
            }}
            className={`group bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center aspect-video transition-all relative overflow-hidden ${
              isUnlocked ? 'hover:bg-slate-900/10 dark:bg-white/10 hover:border-purple-500/50' : 'opacity-80'
            }`}
          >
            <i className={`fa-solid fa-star text-6xl mb-4 transition-transform group-hover:scale-110 ${isUnlocked ? 'text-red-500' : 'text-slate-600'}`}></i>
            <p className="text-slate-900 dark:text-white font-fredoka text-xl">{getTranslation('OBSTACLE_PLACEMENT', language)}</p>
            {isUnlocked ? (
              <p className="text-red-400 text-xs mt-2 font-black uppercase tracking-widest">{getTranslation('READY_TO_PLACE', language)}</p>
            ) : (
              <div className="flex flex-col items-center mt-2">
                <p className="text-slate-500 text-sm">{getTranslation('REQUIRES_UNLOCK', language)}</p>
                <div className="mt-2 bg-purple-600 text-slate-900 dark:text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                  <i className="fa-solid fa-lock text-[8px]"></i> {getTranslation('ONE_PIMO', language) || getTranslation('ONE_MORO', language) || '1 PIMO'}
                </div>
              </div>
            )}
          </button>
        </div>

        <div className="flex gap-4 mt-12">
          <button 
            onClick={handleSaveMap}
            className="bg-purple-600 text-slate-900 dark:text-white font-fredoka text-3xl px-16 py-8 rounded-[2.5rem] shadow-[0_10px_0_#581c87] hover:translate-y-1 active:translate-y-4 transition-all"
          >
            {getTranslation('SAVE_MAP', language)}
          </button>
          <button 
            onClick={() => {
              const mapData = {
                name: mapName,
                terrain: terrainImage,
                obstacles: [],
                lastModified: new Date().toISOString(),
                version: '1.0'
              };
              const serializedData = JSON.stringify(mapData);
              navigator.clipboard.writeText(serializedData)
                .then(() => {
                  // Use a non-blocking way to show success if needed, or just console log
                  console.log(getTranslation('MAP_COPIED', language));
                })
                .catch(err => {
                  console.error(getTranslation('MAP_COPY_FAILED', language), err);
                });
            }}
            className="bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka text-3xl px-12 py-8 rounded-[2.5rem] hover:bg-slate-900/20 dark:bg-white/20 transition-all"
          >
            <i className="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapCreator;
