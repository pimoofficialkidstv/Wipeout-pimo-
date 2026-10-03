
import { Character, MarketplaceItem, MarketplaceItemType } from './types';

export const CHARACTERS: Character[] = [
  {
    id: 'moro-classic',
    name: 'Pimo',
    emoji: '🍎',
    bodyColor: '#ef4444',
    accessoryColor: '#22c55e',
    description: 'The cheerful red apple hero of Wipeout Pimo!',
    image: '/pimo-apple.jpg',
    price: 0
  },
  {
    id: 'moro-mint',
    name: 'Minty Pimo',
    emoji: '🟢',
    bodyColor: '#99f6e4',
    accessoryColor: '#0d9488',
    description: 'Fresh as a summer breeze on the hills.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/tv.svg',
    price: 50
  },
  {
    id: 'moro-gold',
    name: 'Golden Pimo',
    emoji: '🟡',
    bodyColor: '#fde047',
    accessoryColor: '#b45309',
    description: 'A rare, shiny Pimo that loves to show off!',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/tv.svg',
    price: 250
  },
  {
    id: 'moro-noir',
    name: 'Noir Pimo',
    emoji: '⚫',
    bodyColor: '#334155',
    accessoryColor: '#f43f5e',
    description: 'A mysterious Pimo from the late-night broadcast.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/tv.svg',
    price: 150
  },
  {
    id: 'moro-pink',
    name: 'Pinky Pimo',
    emoji: '🌸',
    bodyColor: '#fbcfe8',
    accessoryColor: '#db2777',
    description: 'Sweet and bubbly.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/tv.svg',
    price: 75
  },
  {
    id: 'moro-sky',
    name: 'Sky Pimo',
    emoji: '☁️',
    bodyColor: '#bae6fd',
    accessoryColor: '#0284c7',
    description: 'Clear as the morning sky.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/tv.svg',
    price: 100
  },
  {
    id: 'pbj-banana',
    name: 'The Dancing Banana',
    emoji: '🍌',
    bodyColor: '#fde047',
    accessoryColor: '#854d0e',
    description: 'IT\'S PEANUT BUTTER JELLY TIME!!!',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/tv.svg',
    price: 11,
    expiresAt: '2026-03-31T00:00:00Z'
  },
  {
    id: 'moro-ai',
    name: 'Pimo AI',
    emoji: '🤖',
    bodyColor: '#e2e8f0',
    accessoryColor: '#3b82f6',
    description: 'The smartest Pimo in the universe. Powered by advanced AI!',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bot.svg',
    price: 999
  },
  {
    id: 'moro-miket',
    name: 'Miket Master',
    emoji: '🎟️',
    bodyColor: '#f59e0b',
    accessoryColor: '#d97706',
    description: 'A true collector of Mikets.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/ticket.svg',
    price: 500,
    currency: 'mikets'
  },
  {
    id: 'moro-squeak',
    name: 'Pimo Squeak',
    emoji: '💧',
    bodyColor: '#3b82f6',
    accessoryColor: '#60a5fa',
    description: 'He bouncy! Inspired by Supercell. He kicks with glue sticky-style!',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bubbles.svg',
    price: 20,
    expiresAt: '2026-05-17T00:00:00Z',
    specialLabel: 'pimo studio x supercell',
    kickType: 'glue'
  },
  {
    id: 'moro-guest-prompt',
    name: 'Pimo Guest',
    emoji: '👤',
    bodyColor: '#e5e7eb',
    accessoryColor: '#9ca3af',
    description: 'A classic guest! Choose your style.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/users.svg',
    price: 0,
    isGuestPrompt: true
  },
  {
    id: 'guest-boy',
    name: 'Pimo Boy',
    emoji: '👦',
    bodyColor: '#3b82f6',
    accessoryColor: '#1e3a8a',
    description: 'Classic Roblox-style guest boy.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user.svg',
    price: 0
  },
  {
    id: 'guest-girl',
    name: 'Pimo Girl',
    emoji: '👧',
    bodyColor: '#ec4899',
    accessoryColor: '#9d174d',
    description: 'Classic Roblox-style guest girl.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user.svg',
    price: 0
  },
  {
    id: 'moro-galaxy',
    name: 'Galaxy Pimo',
    emoji: '🌌',
    bodyColor: '#8b5cf6',
    accessoryColor: '#f59e0b',
    description: 'Mystic cosmic purple with glowing star sparkles.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg',
    price: 350
  },
  {
    id: 'moro-cyber',
    name: 'Cyberpunk Pimo',
    emoji: '⚡',
    bodyColor: '#06b6d4',
    accessoryColor: '#ec4899',
    description: 'Neon cyan body with futuristic HUD visor.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/zap.svg',
    price: 450
  },
  {
    id: 'moro-dragon',
    name: 'Dragon Pimo',
    emoji: '🐉',
    bodyColor: '#ef4444',
    accessoryColor: '#f59e0b',
    description: 'Lava red body with fiery golden horns.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/flame.svg',
    price: 600
  },
  {
    id: 'moro-candy',
    name: 'Candy Pimo',
    emoji: '🍭',
    bodyColor: '#f472b6',
    accessoryColor: '#fde047',
    description: 'Cotton candy sweet swirl!',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/candy.svg',
    price: 180
  },
  {
    id: 'moro-ninja',
    name: 'Shadow Ninja',
    emoji: '🥷',
    bodyColor: '#0f172a',
    accessoryColor: '#dc2626',
    description: 'Stealthy dark ninja outfit.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield.svg',
    price: 300
  },
  {
    id: 'moro-mecha',
    name: 'Mecha Titan',
    emoji: '🦾',
    bodyColor: '#94a3b8',
    accessoryColor: '#38bdf8',
    description: 'High-tech armored Pimo warrior.',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/cpu.svg',
    price: 850
  },
  {
    id: 'moro-diamond',
    name: 'Diamond Pimo',
    emoji: '💎',
    bodyColor: '#67e8f9',
    accessoryColor: '#38bdf8',
    description: 'Ultra luxury crystal diamond shine!',
    image: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/gem.svg',
    price: 1200
  }
];

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  // SKINS (Characters)
  { id: 'moro-mint', name: 'Minty Pimo', type: MarketplaceItemType.SKIN, price: 25, description: 'Fresh as a summer breeze.', bodyColor: '#99f6e4', accessoryColor: '#0d9488', emoji: '🟢' },
  { id: 'moro-gold', name: 'Golden Pimo', type: MarketplaceItemType.SKIN, price: 500, description: 'A rare, shiny Pimo.', bodyColor: '#fde047', accessoryColor: '#b45309', emoji: '🟡' },
  { id: 'moro-noir', name: 'Noir Pimo', type: MarketplaceItemType.SKIN, price: 200, description: 'A mysterious Pimo.', bodyColor: '#334155', accessoryColor: '#f43f5e', emoji: '⚫' },
  { id: 'moro-pink', name: 'Pinky Pimo', type: MarketplaceItemType.SKIN, price: 75, description: 'Sweet and bubbly.', bodyColor: '#fbcfe8', accessoryColor: '#db2777', emoji: '🌸' },
  { id: 'moro-sky', name: 'Sky Pimo', type: MarketplaceItemType.SKIN, price: 100, description: 'Clear as the morning sky.', bodyColor: '#bae6fd', accessoryColor: '#0284c7', emoji: '☁️' },
  { id: 'moro-galaxy', name: 'Galaxy Pimo', type: MarketplaceItemType.SKIN, price: 350, description: 'Mystic cosmic purple with glowing star sparkles.', bodyColor: '#8b5cf6', accessoryColor: '#f59e0b', emoji: '🌌' },
  { id: 'moro-cyber', name: 'Cyberpunk Pimo', type: MarketplaceItemType.SKIN, price: 450, description: 'Neon cyan body with futuristic HUD visor.', bodyColor: '#06b6d4', accessoryColor: '#ec4899', emoji: '⚡' },
  { id: 'moro-dragon', name: 'Dragon Pimo', type: MarketplaceItemType.SKIN, price: 600, description: 'Lava red body with fiery golden horns.', bodyColor: '#ef4444', accessoryColor: '#f59e0b', emoji: '🐉' },
  { id: 'moro-candy', name: 'Candy Pimo', type: MarketplaceItemType.SKIN, price: 180, description: 'Cotton candy sweet swirl!', bodyColor: '#f472b6', accessoryColor: '#fde047', emoji: '🍭' },
  { id: 'moro-ninja', name: 'Shadow Ninja', type: MarketplaceItemType.SKIN, price: 300, description: 'Stealthy dark ninja outfit.', bodyColor: '#0f172a', accessoryColor: '#dc2626', emoji: '🥷' },
  { id: 'moro-mecha', name: 'Mecha Titan', type: MarketplaceItemType.SKIN, price: 850, description: 'High-tech armored Pimo warrior.', bodyColor: '#94a3b8', accessoryColor: '#38bdf8', emoji: '🦾' },
  { id: 'moro-diamond', name: 'Diamond Pimo', type: MarketplaceItemType.SKIN, price: 1200, description: 'Ultra luxury crystal diamond shine!', bodyColor: '#67e8f9', accessoryColor: '#38bdf8', emoji: '💎' },
  { id: 'pbj-banana', name: 'The Dancing Banana', type: MarketplaceItemType.SKIN, price: 11, description: 'IT\'S PEANUT BUTTER JELLY TIME!!!', bodyColor: '#fde047', accessoryColor: '#854d0e', emoji: '🍌', expiresAt: '2026-03-31T00:00:00Z' },
  { id: 'moro-ai', name: 'Pimo AI', type: MarketplaceItemType.SKIN, price: 999, description: 'The smartest Pimo in the universe.', bodyColor: '#e2e8f0', accessoryColor: '#3b82f6', emoji: '🤖' },
  { id: 'moro-miket', name: 'Mystery of Mikets', type: MarketplaceItemType.SKIN, price: 500, currency: 'mikets', description: 'A mysterious Miket entity.', bodyColor: '#f59e0b', accessoryColor: '#d97706', emoji: '❓' },
  { id: 'moro-squeak', name: 'Pimo Squeak', type: MarketplaceItemType.SKIN, price: 20, description: 'He bouncy! Inspired by Supercell. He kicks with glue sticky-style!', bodyColor: '#3b82f6', accessoryColor: '#60a5fa', emoji: '💧', expiresAt: '2026-05-17T00:00:00Z', specialLabel: 'pimo studio x supercell' },

  // SHIRTS
  { id: 'shirt-stripes', name: 'Striped Shirt', type: MarketplaceItemType.SHIRT, price: 15, description: 'Classic horizontal stripes.', pattern: 'stripes', shirtColor: '#ffffff' },
  { id: 'shirt-dots', name: 'Polka Dots', type: MarketplaceItemType.SHIRT, price: 30, description: 'Fun and playful dots.', pattern: 'dots', shirtColor: '#ffffff' },
  { id: 'shirt-check', name: 'Checkered', type: MarketplaceItemType.SHIRT, price: 45, description: 'For the strategic Pimo.', pattern: 'check', shirtColor: '#ffffff' },
  { id: 'shirt-flame', name: 'Flame Pattern', type: MarketplaceItemType.SHIRT, price: 150, description: 'Too hot to handle!', pattern: 'flame', shirtColor: '#ff4400' },
  { id: 'shirt-star', name: 'Starry Night', type: MarketplaceItemType.SHIRT, price: 90, description: 'Shine bright like a star.', pattern: 'star', shirtColor: '#fde047' },
  { id: 'shirt-cyber', name: 'Cyber Grid', type: MarketplaceItemType.SHIRT, price: 65, description: 'Glowing digital matrix lines.', pattern: 'cyber', shirtColor: '#06b6d4' },
  { id: 'shirt-galaxy', name: 'Cosmic Nebula', type: MarketplaceItemType.SHIRT, price: 120, description: 'Deep space star pattern.', pattern: 'galaxy', shirtColor: '#a855f7' },
  { id: 'shirt-gold', name: 'Golden Tuxedo', type: MarketplaceItemType.SHIRT, price: 250, description: 'Royal golden suit pattern.', pattern: 'gold', shirtColor: '#eab308' },
  { id: 'shirt-camo', name: 'Tactical Camo', type: MarketplaceItemType.SHIRT, price: 50, description: 'Army stealth pattern.', pattern: 'camo', shirtColor: '#4d7c0f' },
  { id: 'shirt-heart', name: 'Sweet Love', type: MarketplaceItemType.SHIRT, price: 40, description: 'Pink heart pattern.', pattern: 'heart', shirtColor: '#f43f5e' },
  { id: 'shirt-miket', name: 'Moneys of the rich', type: MarketplaceItemType.SHIRT, price: 100, currency: 'mikets', description: 'Show off your wealth.', pattern: 'money', shirtColor: '#166534' },

  // FACES
  { id: 'face-cool', name: 'Cool Shades', type: MarketplaceItemType.FACE, price: 20, description: 'Always chill.', eyes: 'shades', mouth: 'smile' },
  { id: 'face-uwu', name: 'UwU Face', type: MarketplaceItemType.FACE, price: 10, description: 'So cute!', eyes: 'uwu', mouth: 'uwu' },
  { id: 'face-angry', name: 'Angry Pimo', type: MarketplaceItemType.FACE, price: 60, description: 'Don\'t mess with me.', eyes: 'angry', mouth: 'frown' },
  { id: 'face-derp', name: 'Derp Face', type: MarketplaceItemType.FACE, price: 5, description: 'Just being silly.', eyes: 'derp', mouth: 'tongue' },
  { id: 'face-heart', name: 'Heart Eyes', type: MarketplaceItemType.FACE, price: 80, description: 'Full of love.', eyes: 'heart', mouth: 'smile' },
  { id: 'face-cyber', name: 'Cyber Visor', type: MarketplaceItemType.FACE, price: 85, description: 'Glowing LED HUD visor.', eyes: 'visor', mouth: 'flat' },
  { id: 'face-anime', name: 'Anime Sparkle', type: MarketplaceItemType.FACE, price: 65, description: 'Cute blushing anime eyes.', eyes: 'anime', mouth: 'cat' },
  { id: 'face-pixel', name: 'Pixel Shades', type: MarketplaceItemType.FACE, price: 45, description: '8-bit retro thug life glasses.', eyes: 'pixel', mouth: 'smirk' },
  { id: 'face-star', name: 'Starry Eyes', type: MarketplaceItemType.FACE, price: 75, description: 'Glowing yellow star pupils.', eyes: 'star', mouth: 'open' },
  { id: 'face-fire', name: 'Fiery Eyes', type: MarketplaceItemType.FACE, price: 110, description: 'Blazing lava pupils!', eyes: 'fire', mouth: 'frown' },
  { id: 'face-miket', name: 'Eyes of Mikets', type: MarketplaceItemType.FACE, price: 50, currency: 'mikets', description: 'See the Mikets.', eyes: 'miket', mouth: 'smile' },

  // BACKPACKS
  { id: 'backpack-basic', name: 'Basic Backpack', type: MarketplaceItemType.BACKPACK, price: 10, description: 'A simple, reliable backpack.', backpackPattern: 'basic' },
  { id: 'backpack-sport', name: 'Sport Backpack', type: MarketplaceItemType.BACKPACK, price: 35, description: 'For the active Pimo.', backpackPattern: 'sport' },
  { id: 'backpack-tactical', name: 'Tactical Bag', type: MarketplaceItemType.BACKPACK, price: 80, description: 'Ready for any mission.', backpackPattern: 'tactical' },
  { id: 'backpack-wings', name: 'Angel Wings', type: MarketplaceItemType.BACKPACK, price: 250, description: 'Fly high!', backpackPattern: 'wings' },
  { id: 'backpack-jetpack', name: 'Jetpack', type: MarketplaceItemType.BACKPACK, price: 500, description: 'Blast off!', backpackPattern: 'jetpack' },
  { id: 'backpack-mecha', name: 'Mecha Wings', type: MarketplaceItemType.BACKPACK, price: 400, description: 'Glowing plasma thruster wings!', backpackPattern: 'mecha_wings' },
  { id: 'backpack-katana', name: 'Dual Katanas', type: MarketplaceItemType.BACKPACK, price: 220, description: 'Sheathed cyber ninja swords.', backpackPattern: 'katanas' },
  { id: 'backpack-pizza', name: 'Pizza Slice', type: MarketplaceItemType.BACKPACK, price: 95, description: 'Delicious giant pepperoni slice!', backpackPattern: 'pizza' },
  { id: 'backpack-guitar', name: 'Rock Guitar', type: MarketplaceItemType.BACKPACK, price: 175, description: 'Neon red electric rock guitar.', backpackPattern: 'guitar' },
  { id: 'backpack-secret', name: 'Secret Void Bag', type: MarketplaceItemType.BACKPACK, price: 100, currency: 'mikets', description: 'Holds infinite items. Shhh.', backpackPattern: 'void' },

  // HAIRS
  { id: 'hair-none', name: 'None', type: MarketplaceItemType.HAIR, price: 0, description: 'Bald is beautiful.', hairStyle: 'none' },
  { id: 'hair-spiky', name: 'Spiky Hair', type: MarketplaceItemType.HAIR, price: 0, description: 'Cool and sharp.', hairStyle: 'spiky' },
  { id: 'hair-long', name: 'Long Hair', type: MarketplaceItemType.HAIR, price: 0, description: 'Flowing locks.', hairStyle: 'long' },
  { id: 'hair-afro', name: 'Afro', type: MarketplaceItemType.HAIR, price: 0, description: 'Big and bouncy.', hairStyle: 'afro' },
  { id: 'hair-mohawk', name: 'Mohawk', type: MarketplaceItemType.HAIR, price: 0, description: 'Edgy and bold.', hairStyle: 'mohawk' },
  { id: 'hair-braids', name: 'Braids', type: MarketplaceItemType.HAIR, price: 0, description: 'Neatly tied.', hairStyle: 'braids' },
  { id: 'hair-ponytail', name: 'Ponytail', type: MarketplaceItemType.HAIR, price: 0, description: 'Practical and stylish.', hairStyle: 'ponytail' },
  { id: 'hair-cyber', name: 'Neon Dreads', type: MarketplaceItemType.HAIR, price: 60, description: 'Glowing cyan cyber dreadlocks.', hairStyle: 'cyber' },
  { id: 'hair-anime', name: 'Saiyan Spikes', type: MarketplaceItemType.HAIR, price: 120, description: 'Golden glowing spike hair.', hairStyle: 'anime' },
  { id: 'hair-crown', name: 'Royal Crown', type: MarketplaceItemType.HAIR, price: 300, description: 'Golden king/queen crown.', hairStyle: 'crown' },
  { id: 'hair-headphones', name: 'RGB Headphones', type: MarketplaceItemType.HAIR, price: 80, description: 'Pulsing rainbow gamer headset.', hairStyle: 'headphones' },

  // GUESTS
  { id: 'guest-boy', name: 'Pimo Boy', type: MarketplaceItemType.GUEST, price: 0, description: 'Classic Roblox-style guest boy.', bodyColor: '#3b82f6', accessoryColor: '#1e3a8a', emoji: '👦' },
  { id: 'guest-girl', name: 'Pimo Girl', type: MarketplaceItemType.GUEST, price: 0, description: 'Classic Roblox-style guest girl.', bodyColor: '#ec4899', accessoryColor: '#9d174d', emoji: '👧' },
  { id: 'guest-robot', name: 'Cyber Guest 2099', type: MarketplaceItemType.GUEST, price: 0, description: 'Futuristic metallic guest.', bodyColor: '#475569', accessoryColor: '#06b6d4', emoji: '🤖' },
  { id: 'guest-ninja', name: 'Shadow Guest', type: MarketplaceItemType.GUEST, price: 0, description: 'Mysterious hooded guest.', bodyColor: '#1e293b', accessoryColor: '#ef4444', emoji: '🥷' },

  // BODIES
  { id: 'body-circle', name: 'Circle (Original Body)', type: MarketplaceItemType.BODY, price: 0, description: 'The classic round Pimo body.' },
  { id: 'body-human', name: 'Human Body', type: MarketplaceItemType.BODY, price: 0, description: 'A more humanoid shape.' },
  { id: 'body-roblox', name: 'Roblox Body', type: MarketplaceItemType.BODY, price: 0, description: 'Blocky and nostalgic.' },
  { id: 'body-mecha', name: 'Mecha Armor Body', type: MarketplaceItemType.BODY, price: 0, description: 'Sleek futuristic cyber armor.' }
];

export const GRAVITY = 0.45;
export const JUMP_FORCE = -15;
export const FAST_FALL_FORCE = 15;
export const MOVE_SPEED = 5;
export const GAME_SPEED_START = 7;
export const DASH_SPEED_BOOST = 6;
export const DASH_DURATION = 20;
