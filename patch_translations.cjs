const fs = require('fs');

const translationsFile = './src/translations.ts';
let code = fs.readFileSync(translationsFile, 'utf-8');

const newKeys = {
  'MAP_MYSTIC_FOREST': 'MYSTIC ENCHANTED FOREST',
  'MAP_MYSTIC_FOREST_DESC': 'Glowing mushrooms, floating platform trails & fairy dust boost pads!',
  'MAP_PIRATE_COVE': 'PIRATE TREASURE COVE',
  'MAP_PIRATE_COVE_DESC': 'Wooden pirate docks, cannonball hazard obstacles & golden coin reefs!',
  'MAP_CYBER_GRID': 'CYBER GRID ARENA',
  'MAP_CYBER_GRID_DESC': 'Tron-style neon lightcycles, grid barriers & quantum jump pads!',
  'MORO_TERRAIN_STUDIO': 'Moro Terrain Studio',
  'MORO_TERRAIN_STUDIO_DESC': 'Assemble and build sandbox tracks with custom procedural obstacles!',
  'MORO_MAPS_PORTAL': 'Moro Maps Portal',
  'MORO_MAPS_PORTAL_DESC': 'Browse, select and enter creative community races!',
  'DUO_ADVENTURE_MAP': 'Duo Adventure Map',
  'DUO_ADVENTURE_MAP_DESC': 'Race with real-time players or friends. Co-op to the goal!',
  'MORO_OUTFIT_CUSTOMIZER': 'Moro Outfit Customizer',
  'MORO_OUTFIT_CUSTOMIZER_DESC': 'Style your avatar with cool hairstyles, clothing and accessories.',
  'MAGICAL_ITEM_MARKETPLACE': 'Magical Item Marketplace',
  'MAGICAL_ITEM_MARKETPLACE_DESC': 'Buy exclusive outfits, skin badges and magical items with MoroBux.',
  'CALL_MORO_AI': 'Call Moro (AI Communicator)',
  'CALL_MORO_AI_DESC': 'Chat with the friendly AI robot and get daily tips and predictions.',
  'DAILY_REWARDS_WHEEL': 'Daily Rewards Wheel',
  'DAILY_REWARDS_WHEEL_DESC': 'Spin the fortune wheel every day and win heaps of free MoroBux!',
  'CREDITS_HALL_OF_FAME': 'Credits & Hall of Fame',
  'CREDITS_HALL_OF_FAME_DESC': 'Meet the brilliant authors, creators and developers of Moro Studio.',
  'OFFICIAL_MOROBUX_STORE': 'Official MoroBux Store',
  'OFFICIAL_MOROBUX_STORE_DESC': 'Top up your account with MoroBux packages and Premium privileges.',
};

// We will just append these keys to the English dictionary. 
// If other languages don't have them, the getTranslation function already falls back to English!
// Let's check getTranslation:
// let text = translations[lang]?.[key] || translations['English'][key];
// So we ONLY need to add them to English!

const englishRegex = /(English:\s*\{)([\s\S]*?)(\},)/;
const match = code.match(englishRegex);

if (match) {
  let englishContent = match[2];
  for (const [key, value] of Object.entries(newKeys)) {
    if (!englishContent.includes(`'${key}'`)) {
      englishContent += `    '${key}': '${value.replace(/'/g, "\\'")}',\n`;
    }
  }
  code = code.replace(englishRegex, `$1${englishContent}$3`);
  fs.writeFileSync(translationsFile, code);
  console.log('Successfully patched translations.');
} else {
  console.log('Could not find English translation block.');
}
