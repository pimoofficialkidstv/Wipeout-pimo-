
export enum MapType {
  DEFAULT = 'DEFAULT',
  DUO = 'DUO',
  MOROBUX = 'MOROBUX',
  PIMOBUX = 'MOROBUX',
  AGAINST_BOT = 'AGAINST_BOT',
  CLASSED = 'CLASSED',
  MIKETS = 'MIKETS',
  DESERT = 'DESERT',
  JUNGLE = 'JUNGLE',
  ICE_CAVE = 'ICE_CAVE',
  VOLCANO = 'VOLCANO',
  CRYSTAL_CAVES = 'CRYSTAL_CAVES',
  SPEED_TRAINING = 'SPEED_TRAINING',
  MORO_KART = 'MORO_KART',
  PIMO_KART = 'MORO_KART',
  KICKING_TRAINING = 'KICKING_TRAINING',
  NEON_CITY = 'NEON_CITY',
  COSMIC_ORBIT = 'COSMIC_ORBIT',
  CANDY_KINGDOM = 'CANDY_KINGDOM',
  MYSTIC_FOREST = 'MYSTIC_FOREST',
  PIRATE_COVE = 'PIRATE_COVE',
  CYBER_GRID = 'CYBER_GRID',
  TUTORIAL = 'TUTORIAL'
}

export enum GameState {
  INTRO = 'INTRO',
  INITIAL = 'INITIAL',
  MENU = 'MENU',
  LOADING = 'LOADING',
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  BROADCAST = 'BROADCAST',
  MAP_EDITOR = 'MAP_EDITOR',
  MARKETPLACE = 'MARKETPLACE',
  MAP_SELECTION = 'MAP_SELECTION',
  CUSTOM_MAPS = 'CUSTOM_MAPS',
  CALL_MORO = 'CALL_MORO',
  CALL_PIMO = 'CALL_MORO',
  KART_SETUP = 'KART_SETUP',
  CREDITS = 'CREDITS'
}

export enum VehicleType {
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  MOTO = 'MOTO',
  CAR = 'CAR'
}

export enum MarketplaceItemType {
  SKIN = 'SKIN',
  SHIRT = 'SHIRT',
  FACE = 'FACE',
  BACKPACK = 'BACKPACK',
  HAIR = 'HAIR',
  GUEST = 'GUEST',
  BODY = 'BODY'
}

export interface MarketplaceItem {
  id: string;
  name: string;
  type: MarketplaceItemType;
  price: number;
  currency?: 'morobux' | 'pimobux' | 'mikets';
  description: string;
  expiresAt?: string; // ISO date string
  specialLabel?: string; // For things like "pimo studio x supercell"
  // For skins
  bodyColor?: string;
  accessoryColor?: string;
  emoji?: string;
  // For shirts
  pattern?: string;
  shirtColor?: string;
  // For faces
  eyes?: string;
  mouth?: string;
  // For backpacks
  backpackColor?: string;
  backpackPattern?: string;
  // For hairs
  hairStyle?: string;
}

export enum Difficulty {
  EASY = 'CHILL',
  NORMAL = 'ON AIR',
  HARD = 'WIPEOUT',
  EXPERT = 'ELITE',
  INSANE = 'GLITCH'
}

export interface Character {
  id: string;
  name: string;
  emoji: string;
  bodyColor: string;
  accessoryColor: string;
  description: string;
  image: string;
  price?: number;
  currency?: 'morobux' | 'pimobux' | 'mikets';
  shirtId?: string;
  shirtColor?: string;
  faceId?: string;
  backpackId?: string;
  backpackColor?: string;
  hairId?: string;
  hairColor?: string;
  bodyId?: string;
  isGuestPrompt?: boolean;
  expiresAt?: string;
  specialLabel?: string;
  kickType?: 'default' | 'glue';
}

export interface GameScore {
  score: number;
  morobux: number;
  time: number;
}

export interface Obstacle {
  id: number;
  type: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  rotation?: number;
  scale?: number;
  isWarning?: boolean;
  charge?: number;
  isKicked?: boolean;
}

export interface Controls {
  jump: string;
  dash: string;
  left: string;
  right: string;
}

export interface MapData {
  name: string;
  terrain: string | null;
  obstacles: Obstacle[];
  lastModified: string;
  version: string;
  author: string;
}
