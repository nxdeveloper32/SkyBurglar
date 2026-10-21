import {
  GadgetTier,
  LocomotionStage,
  OutfitCosmeticId,
  PersistentSaveData,
  UpgradeItem,
  UserSettings,
} from '../types/game';

const STORAGE_KEY = 'the_great_getaway_save_v1';

export const UPGRADE_CATALOG: UpgradeItem[] = [
  // GADGETS
  {
    id: 'gadget_tier',
    name: 'Gadget Arsenal Tier',
    category: 'GADGETS',
    description: 'Unlock higher-tier cartoon getaway gadgets to disrupt pursuing police units.',
    effectLabel: (lvl) => {
      if (lvl <= 1) return 'Tier 1: Distraction Stones';
      if (lvl === 2) return 'Tier 2: Thick Smoke Bomb';
      if (lvl === 3) return 'Tier 3: Cartoon Boomer Grenade';
      return 'Tier 4: Arcade Zapper Pistol';
    },
    nextBenefitLabel: (lvl) => {
      if (lvl === 1) return 'Unlocks Tier 2: Thick Smoke Bomb';
      if (lvl === 2) return 'Unlocks Tier 3: Cartoon Boomer Grenade';
      if (lvl === 3) return 'Unlocks Tier 4: Arcade Zapper Pistol';
      return 'Max Arsenal Unlocked';
    },
    maxLevel: 4,
    basePrice: 120,
    priceMultiplier: 2.2,
  },
  {
    id: 'gadget_charges',
    name: 'Utility Belt Pouches',
    category: 'GADGETS',
    description: 'Carry additional gadget charges before waiting for reload.',
    effectLabel: (lvl) => `${lvl + 1} Maximum Charges`,
    nextBenefitLabel: (lvl) => `${lvl + 2} Maximum Charges (+1 Pouch)`,
    maxLevel: 4,
    basePrice: 80,
    priceMultiplier: 1.8,
  },
  {
    id: 'gadget_cooldown',
    name: 'Quick-Reload Mechanism',
    category: 'GADGETS',
    description: 'Reduces the recharge cooldown time between gadget deployments.',
    effectLabel: (lvl) => `${(10 - (lvl - 1) * 1.3).toFixed(1)}s Recharge Cooldown`,
    nextBenefitLabel: (lvl) => `${(10 - lvl * 1.3).toFixed(1)}s Cooldown (-1.3s faster)`,
    maxLevel: 5,
    basePrice: 70,
    priceMultiplier: 1.65,
  },

  // UTILITY
  {
    id: 'coin_magnet',
    name: 'Loot Magnet Gloves',
    category: 'UTILITY',
    description: 'Pulls nearby standard and bonus coins toward your loot sack during Coin Rush.',
    effectLabel: (lvl) => `${(1.8 + (lvl - 1) * 0.85).toFixed(1)}m Pull Radius`,
    nextBenefitLabel: (lvl) => `${(1.8 + lvl * 0.85).toFixed(1)}m Pull Radius (+0.85m)`,
    maxLevel: 5,
    basePrice: 60,
    priceMultiplier: 1.6,
  },
  {
    id: 'pursuit_cooling',
    name: 'Stealth Sneakers',
    category: 'UTILITY',
    description: 'Lowers police pursuit pressure faster during clean dodging and perfect thefts.',
    effectLabel: (lvl) => `+${(lvl - 1) * 15}% Pressure Recovery`,
    nextBenefitLabel: (lvl) => `+${lvl * 15}% Pressure Recovery (+15%)`,
    maxLevel: 5,
    basePrice: 75,
    priceMultiplier: 1.65,
  },
  {
    id: 'theft_window',
    name: 'Master Lockpick Kit',
    category: 'UTILITY',
    description: 'Widens the slow-motion timing window during vehicle and wallet theft encounters.',
    effectLabel: (lvl) => `+${(lvl - 1) * 12}% Theft Window Grace`,
    nextBenefitLabel: (lvl) => `+${lvl * 12}% Theft Window Grace (+12%)`,
    maxLevel: 5,
    basePrice: 90,
    priceMultiplier: 1.7,
  },

  // COSMETICS
  {
    id: 'cosmetic_golden',
    name: 'Golden Heist Trim',
    category: 'COSMETICS',
    description: 'Equips gold-striped thief sweater, brass buckle shoes, and golden sprint sparkles.',
    effectLabel: (lvl) => (lvl >= 2 ? 'Unlocked & Equippable' : 'Locked Outfit'),
    nextBenefitLabel: () => 'Unlocks Golden Heist Outfit & Trail',
    maxLevel: 2,
    basePrice: 150,
    priceMultiplier: 1,
  },
  {
    id: 'cosmetic_shadow',
    name: 'Midnight Phantom Suit',
    category: 'COSMETICS',
    description: 'Stealth charcoal-and-crimson tactical burglar sweater with crimson dash trail.',
    effectLabel: (lvl) => (lvl >= 2 ? 'Unlocked & Equippable' : 'Locked Outfit'),
    nextBenefitLabel: () => 'Unlocks Midnight Phantom Outfit',
    maxLevel: 2,
    basePrice: 220,
    priceMultiplier: 1,
  },
  {
    id: 'cosmetic_neon',
    name: 'Sky Burglar Ace Jacket',
    category: 'COSMETICS',
    description: 'Electric cyan-and-obsidian aviator stripes with high-altitude wind trail.',
    effectLabel: (lvl) => (lvl >= 2 ? 'Unlocked & Equippable' : 'Locked Outfit'),
    nextBenefitLabel: () => 'Unlocks Sky Burglar Ace Outfit',
    maxLevel: 2,
    basePrice: 300,
    priceMultiplier: 1,
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  musicVolume: 0.6,
  sfxVolume: 0.85,
  isMuted: false,
  swipeSensitivity: 'NORMAL',
  reducedMotion: false,
};

const DEFAULT_SAVE: PersistentSaveData = {
  totalCoins: 100, // Starting coins so players can test or save for upgrades immediately
  bestScore: 0,
  bestDistance: 0,
  highestStageEver: LocomotionStage.FOOT,
  totalRuns: 0,
  totalThefts: 0,
  tutorialCompleted: false,
  upgradeLevels: {
    gadget_tier: 1,
    gadget_charges: 1,
    gadget_cooldown: 1,
    coin_magnet: 1,
    pursuit_cooling: 1,
    theft_window: 1,
    cosmetic_golden: 1,
    cosmetic_shadow: 1,
    cosmetic_neon: 1,
  },
  selectedOutfit: 'CLASSIC_STRIPES',
  settings: { ...DEFAULT_SETTINGS },
};

const STAGE_RANK: Record<LocomotionStage, number> = {
  [LocomotionStage.FOOT]: 1,
  [LocomotionStage.MOTORCYCLE]: 2,
  [LocomotionStage.CAR]: 3,
  [LocomotionStage.BALLOON]: 4,
};

export class SaveManager {
  private data: PersistentSaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): PersistentSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw) as Partial<PersistentSaveData>;
      return {
        totalCoins: typeof parsed.totalCoins === 'number' && parsed.totalCoins >= 0 ? Math.floor(parsed.totalCoins) : DEFAULT_SAVE.totalCoins,
        bestScore: typeof parsed.bestScore === 'number' && parsed.bestScore >= 0 ? Math.floor(parsed.bestScore) : 0,
        bestDistance: typeof parsed.bestDistance === 'number' && parsed.bestDistance >= 0 ? Math.floor(parsed.bestDistance) : 0,
        highestStageEver: parsed.highestStageEver && STAGE_RANK[parsed.highestStageEver] ? parsed.highestStageEver : LocomotionStage.FOOT,
        totalRuns: typeof parsed.totalRuns === 'number' ? parsed.totalRuns : 0,
        totalThefts: typeof parsed.totalThefts === 'number' ? parsed.totalThefts : 0,
        tutorialCompleted: Boolean(parsed.tutorialCompleted),
        upgradeLevels: {
          ...DEFAULT_SAVE.upgradeLevels,
          ...(parsed.upgradeLevels || {}),
        },
        selectedOutfit: parsed.selectedOutfit || 'CLASSIC_STRIPES',
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
        },
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore storage quota errors in restricted frames
    }
  }

  public getData(): PersistentSaveData {
    return this.data;
  }

  public getUpgradeLevel(id: string): number {
    return this.data.upgradeLevels[id] ?? 1;
  }

  public getUpgradePrice(item: UpgradeItem): number {
    const currentLevel = this.getUpgradeLevel(item.id);
    if (currentLevel >= item.maxLevel) return 0;
    return Math.round(item.basePrice * Math.pow(item.priceMultiplier, currentLevel - 1));
  }

  public purchaseUpgrade(id: string): boolean {
    const item = UPGRADE_CATALOG.find((u) => u.id === id);
    if (!item) return false;
    const currentLevel = this.getUpgradeLevel(id);
    if (currentLevel >= item.maxLevel) return false;
    const price = this.getUpgradePrice(item);
    if (this.data.totalCoins < price) return false;

    this.data.totalCoins -= price;
    this.data.upgradeLevels[id] = currentLevel + 1;

    // Auto-equip cosmetic if purchased
    if (id === 'cosmetic_golden') this.data.selectedOutfit = 'GOLDEN_HEIST';
    if (id === 'cosmetic_shadow') this.data.selectedOutfit = 'SHADOW_NINJA';
    if (id === 'cosmetic_neon') this.data.selectedOutfit = 'NEON_GETAWAY';

    this.save();
    return true;
  }

  public selectOutfit(outfit: OutfitCosmeticId): boolean {
    if (outfit === 'CLASSIC_STRIPES') {
      this.data.selectedOutfit = outfit;
      this.save();
      return true;
    }
    const map: Record<OutfitCosmeticId, string> = {
      CLASSIC_STRIPES: '',
      GOLDEN_HEIST: 'cosmetic_golden',
      SHADOW_NINJA: 'cosmetic_shadow',
      NEON_GETAWAY: 'cosmetic_neon',
    };
    if (this.getUpgradeLevel(map[outfit]) >= 2) {
      this.data.selectedOutfit = outfit;
      this.save();
      return true;
    }
    return false;
  }

  public updateSettings(partial: Partial<UserSettings>): UserSettings {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
    };
    this.save();
    return this.data.settings;
  }

  public recordRunResult(params: {
    score: number;
    distance: number;
    coinsEarned: number;
    thefts: number;
    highestStage: LocomotionStage;
  }): { isNewBest: boolean } {
    const isNewBest = params.score > this.data.bestScore;
    if (isNewBest) {
      this.data.bestScore = Math.floor(params.score);
    }
    if (params.distance > this.data.bestDistance) {
      this.data.bestDistance = Math.floor(params.distance);
    }
    if (STAGE_RANK[params.highestStage] > STAGE_RANK[this.data.highestStageEver]) {
      this.data.highestStageEver = params.highestStage;
    }
    this.data.totalCoins += Math.max(0, Math.floor(params.coinsEarned));
    this.data.totalRuns += 1;
    this.data.totalThefts += params.thefts;
    this.save();
    return { isNewBest };
  }

  public markTutorialCompleted(): void {
    this.data.tutorialCompleted = true;
    this.save();
  }

  // Computed gameplay modifiers
  public getActiveGadgetTier(): GadgetTier {
    const lvl = this.getUpgradeLevel('gadget_tier');
    if (lvl === 1) return GadgetTier.STONES;
    if (lvl === 2) return GadgetTier.SMOKE_BOMB;
    if (lvl === 3) return GadgetTier.CARTOON_GRENADE;
    return GadgetTier.ARCADE_PISTOL;
  }

  public getMaxGadgetCharges(): number {
    return this.getUpgradeLevel('gadget_charges') + 1;
  }

  public getGadgetCooldownSeconds(): number {
    const lvl = this.getUpgradeLevel('gadget_cooldown');
    return Math.max(3.5, 10 - (lvl - 1) * 1.3);
  }

  public getCoinMagnetRadius(): number {
    const lvl = this.getUpgradeLevel('coin_magnet');
    return 1.8 + (lvl - 1) * 0.85;
  }

  public getPursuitRecoveryMultiplier(): number {
    const lvl = this.getUpgradeLevel('pursuit_cooling');
    return 1 + (lvl - 1) * 0.15;
  }

  public getTheftWindowBonusMultiplier(): number {
    const lvl = this.getUpgradeLevel('theft_window');
    return 1 + (lvl - 1) * 0.12;
  }
}

export const saveManager = new SaveManager();
