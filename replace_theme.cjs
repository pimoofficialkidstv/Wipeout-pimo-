const fs = require('fs');
const path = require('path');

const files = [
  'App.tsx',
  'components/Game.tsx',
  'components/Lobby.tsx',
  'components/MapCreator.tsx',
  'components/Marketplace.tsx',
  'components/CustomMaps.tsx',
  'components/CallMoro.tsx',
  'components/ProfileModal.tsx',
  'components/AIAssistant.tsx'
];

const replacements = [
  { regex: /(?<!dark:)\bbg-slate-900\b(?!\/)/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { regex: /(?<!dark:)\bbg-slate-800\b(?!\/)/g, replace: 'bg-slate-100 dark:bg-slate-800' },
  { regex: /(?<!dark:)\bbg-slate-700\b(?!\/)/g, replace: 'bg-slate-200 dark:bg-slate-700' },
  { regex: /(?<!dark:)\btext-white\b(?!\/)/g, replace: 'text-slate-900 dark:text-white' },
  { regex: /(?<!dark:)\btext-slate-400\b(?!\/)/g, replace: 'text-slate-500 dark:text-slate-400' },
  { regex: /(?<!dark:)\btext-slate-300\b(?!\/)/g, replace: 'text-slate-600 dark:text-slate-300' },
  { regex: /(?<!dark:)\bborder-white\/10\b/g, replace: 'border-slate-900/10 dark:border-white/10' },
  { regex: /(?<!dark:)\bborder-white\/20\b/g, replace: 'border-slate-900/20 dark:border-white/20' },
  { regex: /(?<!dark:)\bbg-white\/5\b/g, replace: 'bg-slate-900/5 dark:bg-white/5' },
  { regex: /(?<!dark:)\bbg-white\/10\b/g, replace: 'bg-slate-900/10 dark:bg-white/10' },
  { regex: /(?<!dark:)\bbg-white\/20\b/g, replace: 'bg-slate-900/20 dark:bg-white/20' },
  { regex: /(?<!dark:)\bbg-black\/80\b/g, replace: 'bg-white/80 dark:bg-black/80' },
  { regex: /(?<!dark:)\bbg-black\/90\b/g, replace: 'bg-white/90 dark:bg-black/90' },
  { regex: /(?<!dark:)\bbg-black\/50\b/g, replace: 'bg-white/50 dark:bg-black/50' },
  { regex: /(?<!dark:)\btext-slate-950\b(?!\/)/g, replace: 'text-white dark:text-slate-950' },
  { regex: /(?<!dark:)\bbg-white\b(?!\/)/g, replace: 'bg-slate-900 dark:bg-white' },
  { regex: /(?<!dark:)\bbg-slate-900\/60\b/g, replace: 'bg-slate-50/60 dark:bg-slate-900/60' },
  { regex: /(?<!dark:)\bbg-slate-900\/80\b/g, replace: 'bg-slate-50/80 dark:bg-slate-900/80' },
  { regex: /(?<!dark:)\bbg-slate-950\/90\b/g, replace: 'bg-white/90 dark:bg-slate-950/90' },
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    replacements.forEach(({ regex, replace }) => {
      content = content.replace(regex, replace);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
