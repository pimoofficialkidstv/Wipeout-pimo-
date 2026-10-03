import React, { useState, useEffect } from 'react';
import { MapData } from '../types';
import { getTranslation } from '../src/translations';

interface CustomMapsProps {
  onBack: () => void;
  onLoadMap: (mapData: MapData) => void;
  language: string;
}

const CustomMaps: React.FC<CustomMapsProps> = ({ onBack, onLoadMap, language }) => {
  const [maps, setMaps] = useState<{ key: string; data: MapData }[]>([]);

  useEffect(() => {
    const loadMaps = () => {
      const existingMapsJson = localStorage.getItem('wipeout_custom_maps');
      if (existingMapsJson) {
        const keys: string[] = JSON.parse(existingMapsJson);
        const loadedMaps = keys.map(key => {
          const dataJson = localStorage.getItem(key);
          if (dataJson) {
            try {
              return { key, data: JSON.parse(dataJson) as MapData };
            } catch (e) {
              console.error('Failed to parse map data for key:', key);
              return null;
            }
          }
          return null;
        }).filter(Boolean) as { key: string; data: MapData }[];
        setMaps(loadedMaps);
      }
    };
    loadMaps();
  }, []);

  const handleDelete = (keyToDelete: string) => {
    if (window.confirm(getTranslation('CONFIRM_DELETE_MAP', language) || 'Are you sure you want to delete this map?')) {
      localStorage.removeItem(keyToDelete);
      const existingMapsJson = localStorage.getItem('wipeout_custom_maps');
      if (existingMapsJson) {
        let keys: string[] = JSON.parse(existingMapsJson);
        keys = keys.filter(key => key !== keyToDelete);
        localStorage.setItem('wipeout_custom_maps', JSON.stringify(keys));
      }
      setMaps(maps.filter(m => m.key !== keyToDelete));
    }
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-6xl h-full max-h-[90vh]">
      <div className="flex items-center justify-between w-full mb-8 shrink-0">
        <button 
          onClick={onBack} 
          className="bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka px-6 py-3 rounded-2xl hover:bg-slate-900/20 dark:bg-white/20 transition-all text-sm md:text-base"
        >
          {getTranslation('BACK', language)}
        </button>
        <h2 className="text-3xl md:text-5xl font-fredoka text-slate-900 dark:text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          {getTranslation('CUSTOM_MAPS', language) || 'CUSTOM MAPS'}
        </h2>
        <div className="w-[80px] md:w-[100px]"></div>
      </div>

      <div className="w-full overflow-y-auto custom-scrollbar pr-2 flex-1">
        {maps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-900/5 dark:bg-white/5 rounded-[3rem] border border-slate-900/10 dark:border-white/10">
            <i className="fa-solid fa-map text-6xl text-slate-500 mb-4"></i>
            <p className="text-slate-500 dark:text-slate-400 font-fredoka text-xl">{getTranslation('NO_CUSTOM_MAPS', language) || 'No custom maps found.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full pb-8">
            {maps.map((mapObj) => (
              <div key={mapObj.key} className="bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-[2rem] p-6 flex flex-col group relative overflow-hidden hover:bg-slate-900/10 dark:bg-white/10 transition-all">
                <div className="w-full h-32 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 overflow-hidden relative border border-slate-900/10 dark:border-white/10 flex items-center justify-center">
                  {mapObj.data.terrain ? (
                    <img src={mapObj.data.terrain} alt={mapObj.data.name} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-image text-4xl text-slate-700"></i>
                  )}
                </div>
                <h3 className="text-xl font-fredoka text-slate-900 dark:text-white mb-1 truncate">{mapObj.data.name || 'Untitled Map'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {getTranslation('LAST_MODIFIED', language) || 'Last modified'}: {new Date(mapObj.data.lastModified).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => onLoadMap(mapObj.data)}
                    className="flex-1 bg-purple-600 text-slate-900 dark:text-white font-fredoka py-2 rounded-xl hover:bg-purple-500 transition-all text-sm shadow-lg"
                  >
                    {getTranslation('LOAD', language) || 'LOAD'}
                  </button>
                  <button 
                    onClick={() => handleDelete(mapObj.key)}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-slate-900 dark:text-white transition-all text-sm shadow-lg"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomMaps;
