export enum GameState {
  LOADING = 'LOADING',
  MAIN_MENU = 'MAIN_MENU',
  TUTORIAL = 'TUTORIAL',
  RUN_STARTING = 'RUN_STARTING',
  ESCAPE = 'ESCAPE',
  THEFT = 'THEFT',
  COIN_RUSH = 'COIN_RUSH',
  VEHICLE_TRANSITION = 'VEHICLE_TRANSITION',
  BALLOON_CHASE = 'BALLOON_CHASE',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  UPGRADE_SHOP = 'UPGRADE_SHOP',
  SETTINGS = 'SETTINGS',
}

export enum GameplayPhase {
  ESCAPE = 'ESCAPE',
  THEFT = 'THEFT',
  COIN_RUSH = 'COIN_RUSH',
}

export enum LocomotionStage {
  FOOT = 'FOOT',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  BALLOON = 'BALLOON',
}

export enum PursuitState {
  SEARCHING = 'SEARCHING',
  CHASING = 'CHASING',
  INTERCEPTING = 'INTERCEPTING',
  REINFORCING = 'REINFORCING',
  CRITICAL = 'CRITICAL',
  CAUGHT = 'CAUGHT',
}

export enum GadgetTier {
  STONES = 'STONES',
  SMOKE_BOMB = 'SMOKE_BOMB',
  CARTOON_GRENADE = 'CARTOON_GRENADE',
  ARCADE_PISTOL = 'ARCADE_PISTOL',
}

export enum TheftTargetType {
  WALLET = 'WALLET',
  MOTORCYCLE_KEY = 'MOTORCYCLE_KEY',
  SPORTS_CAR = 'SPORTS_CAR',
  BALLOON_ROPE = 'BALLOON_ROPE',
  ROOFTOP_SAFE = 'ROOFTOP_SAFE',
}

export enum GestureType {
  SWIPE_LEFT = 'SWIPE_LEFT',
  SWIPE_RIGHT = 'SWIPE_RIGHT',
  SWIPE_UP = 'SWIPE_UP',
  SWIPE_DOWN = 'SWIPE_DOWN',
  TAP = 'TAP',
}

export enum TheftOutcome {
  PERFECT = 'PERFECT',
  NORMAL = 'NORMAL',
  PARTIAL = 'PARTIAL',
  FAILURE = 'FAILURE',
}

export enum TutorialStep {
  NONE = 0,
  RUN_DODGE_FIRST = 1,
  DODGE_SECOND = 2,
  STEAL_WALLET = 3,
  COLLECT_COINS = 4,
  STEAL_VEHICLE = 5,
  USE_GADGET = 6,
  COMPLETE = 7,
}

export type UpgradeCategory = 'GADGETS' | 'UTILITY' | 'COSMETICS';

export interface UpgradeItem {
  id: string;
  name: string;
  category: UpgradeCategory;
  description: string;
  effectLabel: (level: number) => string;
  nextBenefitLabel: (level: number) => string;
  maxLevel: number;
  basePrice: number;
  priceMultiplier: number;
}

export interface ActiveTheftEncounter {
  targetType: TheftTargetType;
  title: string;
  instruction: string;
  requiredGesture: GestureType;
  totalDuration: number;
  elapsed: number;
  resolved: boolean;
  outcome?: TheftOutcome;
  unlocksStage?: LocomotionStage;
  isCritical: boolean;
}

export interface BalloonContextOpportunity {
  type: 'DESCEND_TO_STREET' | 'REATTACH_BALLOON';
  label: string;
  requiredGesture: GestureType;
  timeRemaining: number;
}

export interface RunTelemetry {
  gameState: GameState;
  activePhase: GameplayPhase;
  phaseTimeRemaining: number;
  phaseTotalDuration: number;
  phaseCoinsEarned: number;
  locomotionStage: LocomotionStage;
  highestStageReached: LocomotionStage;
  pursuitState: PursuitState;
  pursuitPressure: number; // 0 to 100
  score: number;
  distance: number; // metres
  runCoins: number;
  standardCoinsCollected: number;
  bonusCoinsCollected: number;
  successfulThefts: number;
  perfectThefts: number;
  nearMisses: number;
  activeGadget: GadgetTier;
  gadgetCharges: number;
  maxGadgetCharges: number;
  gadgetCooldownProgress: number; // 0 to 1 (1 = ready)
  activeTheft: ActiveTheftEncounter | null;
  balloonOpportunity: BalloonContextOpportunity | null;
  tutorialStep: TutorialStep;
  tutorialPrompt: string | null;
  statusBanner: {
    text: string;
    subtext?: string;
    tone: 'gold' | 'emerald' | 'crimson' | 'sky';
    id: number;
  } | null;
  lastInputFeedback: {
    gesture: GestureType | 'GADGET';
    timestamp: number;
  } | null;
  isNewPersonalBest: boolean;
  captureReason: string | null;
}

export interface UserSettings {
  musicVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  isMuted: boolean;
  swipeSensitivity: 'LOW' | 'NORMAL' | 'HIGH';
  reducedMotion: boolean;
}

export type OutfitCosmeticId = 'CLASSIC_STRIPES' | 'GOLDEN_HEIST' | 'SHADOW_NINJA' | 'NEON_GETAWAY';

export interface PersistentSaveData {
  totalCoins: number;
  bestScore: number;
  bestDistance: number;
  highestStageEver: LocomotionStage;
  totalRuns: number;
  totalThefts: number;
  tutorialCompleted: boolean;
  upgradeLevels: Record<string, number>;
  selectedOutfit: OutfitCosmeticId;
  settings: UserSettings;
}
