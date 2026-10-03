import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MarketplaceItem, MarketplaceItemType, Character } from '../types';
import { MARKETPLACE_ITEMS } from '../constants.tsx';
import Moro3D from './Moro3D';
import MorobuxIcon from './MorobuxIcon';
import MiketsIcon from './MiketsIcon';
import { getTranslation } from '../src/translations';
import { AnimatedButton } from './AnimatedButton';

interface MarketplaceProps {
  onBack: () => void;
  morobux: number;
  mikets: number;
  ownedItems: string[];
  onBuy: (item: MarketplaceItem) => void;
  selectedCharacter: Character;
  onEquip: (item: MarketplaceItem) => void;
  isMoroPlus?: boolean;
  language: string;
  playerName?: string;
}

const Marketplace: React.FC<MarketplaceProps> = ({ onBack, morobux, mikets, ownedItems, onBuy, selectedCharacter, onEquip, isMoroPlus, language, playerName }) => {
  const [activeCategory, setActiveCategory] = useState<MarketplaceItemType>(MarketplaceItemType.SKIN);

  const filteredItems = MARKETPLACE_ITEMS.filter(item => {
    if (item.type !== activeCategory) return false;
    
    // Check for expiry
    if (item.expiresAt) {
      const expiryDate = new Date(item.expiresAt);
      if (expiryDate < new Date() && !ownedItems.includes(item.id)) {
        return false;
      }
    }
    
    return true;
  });

  const getTimeLeft = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return getTranslation('TIME_LEFT_MSG', language, { time: `${days}d ${hours}h` });
    return getTranslation('TIME_LEFT_MSG', language, { time: `${hours}h` });
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-6xl h-full max-h-[90vh]">
      <div className="flex items-center justify-between w-full mb-8 shrink-0">
        <AnimatedButton 
          onClick={onBack} 
          className="bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka px-6 py-3 rounded-2xl hover:bg-slate-900/20 dark:bg-white/20 transition-all text-sm md:text-base"
        >
          {getTranslation('BACK', language)}
        </AnimatedButton>
        <div className="flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-fredoka text-slate-900 dark:text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-3">
            {getTranslation('MARKETPLACE', language)}
            {isMoroPlus && (
              <span className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 text-yellow-500 text-[10px] md:text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg">
                <i className="fa-solid fa-plus-circle"></i>
                PLUS
              </span>
            )}
          </h2>
          <div className="flex gap-4 mt-1">
            <p className="text-red-400 font-fredoka text-lg md:text-xl flex items-center gap-2">
              <MorobuxIcon className="w-6 h-6" /> {morobux} {getTranslation('MOROBUX', language)}
            </p>
            <p className="text-amber-400 font-fredoka text-lg md:text-xl flex items-center gap-2">
              <MiketsIcon className="w-6 h-6" /> {mikets} MIKETS
            </p>
          </div>
        </div>
        <div className="w-[80px] md:w-[100px] flex justify-end">
          <button 
            onClick={onBack} 
            className="bg-green-500/20 border border-green-500/50 text-green-400 font-fredoka px-4 py-2 md:px-6 md:py-3 rounded-2xl hover:bg-green-500/30 transition-all text-sm md:text-base shadow-lg flex items-center gap-2"
          >
            <i className="fa-solid fa-check"></i>
            <span className="hidden md:inline">{getTranslation('SAVE', language) || 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Category Selection - Swipeable on mobile */}
      <div className="w-full overflow-x-auto custom-scrollbar mb-8 shrink-0 pb-2">
        <div className="flex gap-4 min-w-max mx-auto bg-slate-900/5 dark:bg-white/5 p-2 rounded-[2rem] border border-slate-900/10 dark:border-white/10">
          {Object.values(MarketplaceItemType).map(type => (
            <AnimatedButton
              key={type}
              onClick={() => setActiveCategory(type)}
              className={`px-8 md:px-10 py-3 md:py-4 rounded-[1.5rem] font-fredoka text-base md:text-lg transition-all whitespace-nowrap ${
                activeCategory === type 
                  ? 'bg-purple-600 text-slate-900 dark:text-white shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-900/5 dark:bg-white/5'
              }`}
            >
              {getTranslation(type === MarketplaceItemType.SKIN ? 'SKINS' : type === MarketplaceItemType.SHIRT ? 'SHIRTS' : type === MarketplaceItemType.FACE ? 'FACES' : type === MarketplaceItemType.BACKPACK ? 'BACKPACKS' : type === MarketplaceItemType.HAIR ? 'HAIRS' : type === MarketplaceItemType.BODY ? 'BODIES' : 'GUESTS', language)}
            </AnimatedButton>

          ))}
        </div>
      </div>

      {/* Items Grid - Scrollable */}
      <div className="w-full overflow-y-auto custom-scrollbar pr-2 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full pb-8">
          {filteredItems.map(item => {
            const isOwned = item.price === 0 || ownedItems.includes(item.id);
            const canAfford = item.currency === 'mikets' ? mikets >= item.price : morobux >= item.price;
            
            let isEquipped = false;
            if (item.type === MarketplaceItemType.SKIN || item.type === MarketplaceItemType.GUEST) {
              isEquipped = selectedCharacter.id === item.id;
            } else if (item.type === MarketplaceItemType.SHIRT) {
              isEquipped = selectedCharacter.shirtId === item.id;
            } else if (item.type === MarketplaceItemType.FACE) {
              isEquipped = selectedCharacter.faceId === item.id;
            } else if (item.type === MarketplaceItemType.BACKPACK) {
              isEquipped = selectedCharacter.backpackId === item.id;
            } else if (item.type === MarketplaceItemType.HAIR) {
              isEquipped = selectedCharacter.hairId === item.id || (item.id === 'hair-none' && !selectedCharacter.hairId);
            } else if (item.type === MarketplaceItemType.BODY) {
              isEquipped = selectedCharacter.bodyId === item.id || (item.id === 'body-circle' && !selectedCharacter.bodyId);
            }

            // Create a mock character for preview
            const previewChar = {
              ...selectedCharacter,
              ...(item.type === MarketplaceItemType.SKIN ? {
                bodyColor: item.bodyColor || selectedCharacter.bodyColor,
                accessoryColor: item.accessoryColor || selectedCharacter.accessoryColor,
                emoji: item.emoji || selectedCharacter.emoji,
              } : {})
            };

            const itemName = getTranslation(`ITEM_${item.id.toUpperCase().replace(/-/g, '_')}_NAME`, language) || item.name;
            const itemDescription = getTranslation(`ITEM_${item.id.toUpperCase().replace(/-/g, '_')}_DESC`, language) || item.description;

            return (
              <motion.div 
                key={item.id} 
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(168, 85, 247, 0.4)",
                  borderColor: "rgba(168, 85, 247, 0.5)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-[3rem] p-6 md:p-8 flex flex-col items-center group relative overflow-hidden"
              >
                <div className="relative mb-4 md:mb-6">
                  <Moro3D 
                    character={previewChar} 
                    width={150} 
                    height={150} 
                    idleAnimScale={1.2}
                    previewShirt={item.type === MarketplaceItemType.SHIRT ? item : undefined}
                    previewFace={item.type === MarketplaceItemType.FACE ? item : undefined}
                    previewBackpack={item.type === MarketplaceItemType.BACKPACK ? item : undefined}
                    previewHair={item.type === MarketplaceItemType.HAIR ? item : undefined}
                    previewBody={item.type === MarketplaceItemType.BODY ? item : undefined}
                    playerName={playerName}
                  />
                  {item.expiresAt && (
                    <div className={`absolute -top-2 -left-2 text-slate-900 dark:text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10 ${isOwned ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`}>
                      {isOwned ? getTranslation('LIMITED_EDITION', language) : getTimeLeft(item.expiresAt)}
                    </div>
                  )}
                  {!isOwned && (
                    <div className="absolute top-0 right-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md p-2 md:p-3 rounded-full border border-slate-900/20 dark:border-white/20">
                      <i className="fa-solid fa-lock text-slate-500 dark:text-slate-400 text-xs md:text-base"></i>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-1 mb-2">
                  <h3 className="text-xl md:text-2xl font-fredoka text-slate-900 dark:text-white flex items-center gap-2">
                    {itemName}
                    {item.specialLabel && (
                      <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">
                        {item.specialLabel}
                      </span>
                    )}
                  </h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm text-center mb-4 md:mb-6 h-12 line-clamp-2">{itemDescription}</p>
                
                {/* Price and Status Info */}
                <div className="w-full flex flex-col gap-2 mb-6 bg-slate-900/5 dark:bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-[10px] md:text-xs">
                    <span className="text-slate-500 font-black uppercase tracking-widest">{getTranslation('PRICE', language)}</span>
                    <span className={`${item.currency === 'mikets' ? 'text-amber-400' : 'text-red-400'} font-fredoka flex items-center gap-1 text-sm`}>
                      {item.currency === 'mikets' ? <MiketsIcon className="w-4 h-4" /> : <MorobuxIcon className="w-4 h-4" />} {item.price}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] md:text-xs">
                    <span className="text-slate-500 font-black uppercase tracking-widest">{getTranslation('STATUS', language)}</span>
                    <span className={`font-fredoka text-sm ${isEquipped ? 'text-green-400' : isOwned ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {isEquipped ? getTranslation('EQUIPPED', language) : isOwned ? getTranslation('OWNED', language) : getTranslation('NOT_OWNED', language)}
                    </span>
                  </div>
                </div>

                <div className="w-full mt-auto">
                    {isOwned ? (
                    <AnimatedButton 
                      onClick={() => onEquip(item)}
                      className={`w-full font-fredoka py-3 md:py-4 rounded-2xl text-center flex items-center justify-center gap-2 text-sm md:text-base transition-all ${
                        isEquipped 
                          ? 'bg-green-500 text-slate-900 dark:text-white shadow-[0_4px_0_#166534] md:shadow-[0_6px_0_#166534] hover:translate-y-1 active:translate-y-3 active:shadow-none' 
                          : 'bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-900/20 dark:border-white/20 hover:bg-slate-900/20 dark:bg-white/20'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <i className="fa-solid fa-check"></i>
                          {getTranslation('EQUIPPED', language)}
                        </>
                      ) : (
                        getTranslation('EQUIP', language)
                      )}
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton 
                      onClick={() => onBuy(item)}
                      disabled={!canAfford}
                      className={`w-full font-fredoka py-3 md:py-4 rounded-2xl text-lg md:text-xl transition-all flex items-center justify-center gap-2 ${
                        canAfford 
                          ? (item.currency === 'mikets' ? 'bg-amber-600 text-slate-900 dark:text-white shadow-[0_4px_0_#b45309] md:shadow-[0_6px_0_#b45309] hover:translate-y-1 active:translate-y-3 active:shadow-none' : 'bg-purple-600 text-slate-900 dark:text-white shadow-[0_4px_0_#581c87] md:shadow-[0_6px_0_#581c87] hover:translate-y-1 active:translate-y-3 active:shadow-none')
                          : 'bg-slate-900/5 dark:bg-white/5 text-slate-500 cursor-not-allowed border border-slate-900/10 dark:border-white/10'
                      }`}
                    >
                      {item.currency === 'mikets' ? <MiketsIcon className="w-5 h-5" /> : <MorobuxIcon className="w-5 h-5" />}
                      {item.price} {item.currency === 'mikets' ? 'MIKETS' : getTranslation('MOROBUX', language)}
                    </AnimatedButton>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 mb-12 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-[3rem] p-8 md:p-10 w-full text-center">
          <h4 className="text-lg md:text-xl font-fredoka text-slate-900 dark:text-white mb-4">{getTranslation('CUSTOMIZE_YOUR_MORO', language)}</h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">{getTranslation('CUSTOMIZE_DESC', language)}</p>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
