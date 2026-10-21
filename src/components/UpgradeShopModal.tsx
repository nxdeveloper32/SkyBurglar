import React, { useState } from 'react';
import { Check, Coins, Lock, Shield, Sparkles, Wrench, X, Zap } from 'lucide-react';
import {
  OutfitCosmeticId,
  PersistentSaveData,
  UpgradeCategory,
  UpgradeItem,
} from '../types/game';
import { saveManager, UPGRADE_CATALOG } from '../systems/SaveManager';
import { audioManager } from '../systems/AudioManager';

interface UpgradeShopModalProps {
  saveData: PersistentSaveData;
  onClose: () => void;
  onUpgradeChanged: () => void;
}

export const UpgradeShopModal: React.FC<UpgradeShopModalProps> = ({
  saveData,
  onClose,
  onUpgradeChanged,
}) => {
  const [activeCategory, setActiveCategory] = useState<UpgradeCategory>('GADGETS');

  const filteredItems = UPGRADE_CATALOG.filter((item) => item.category === activeCategory);

  const handleBuy = (item: UpgradeItem) => {
    const ok = saveManager.purchaseUpgrade(item.id);
    if (ok) {
      audioManager.playCoinCollect(true);
      onUpgradeChanged();
    } else {
      audioManager.playMenuClick();
    }
  };

  const handleEquipOutfit = (outfit: OutfitCosmeticId) => {
    if (saveManager.selectOutfit(outfit)) {
      audioManager.playMenuClick();
      onUpgradeChanged();
    }
  };

  const getOutfitIdForUpgrade = (itemId: string): OutfitCosmeticId | null => {
    if (itemId === 'cosmetic_golden') return 'GOLDEN_HEIST';
    if (itemId === 'cosmetic_shadow') return 'SHADOW_NINJA';
    if (itemId === 'cosmetic_neon') return 'NEON_GETAWAY';
    return null;
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="thief-stripe-surface metallic-border rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-white">
              Hideout Upgrade Shop
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upgrade your getaway gadgets, stealth utility, and burglar outfits
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-mono-tabular font-bold text-amber-400 text-base">
                {saveData.totalCoins.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">Coins</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close upgrade shop"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/10">
            {(
              [
                { id: 'GADGETS', label: 'Gadgets', icon: Zap },
                { id: 'UTILITY', label: 'Utility', icon: Wrench },
                { id: 'COSMETICS', label: 'Cosmetics', icon: Sparkles },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    audioManager.playMenuClick();
                    setActiveCategory(tab.id);
                  }}
                  className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeCategory === 'COSMETICS' && (
            <button
              type="button"
              onClick={() => handleEquipOutfit('CLASSIC_STRIPES')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                saveData.selectedOutfit === 'CLASSIC_STRIPES'
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : 'border-white/15 bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {saveData.selectedOutfit === 'CLASSIC_STRIPES'
                ? 'Classic Striped Sweater (Equipped)'
                : 'Equip Classic Striped Sweater'}
            </button>
          )}
        </div>

        {/* Upgrade Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const currentLvl = saveManager.getUpgradeLevel(item.id);
            const isMaxed = currentLvl >= item.maxLevel;
            const price = saveManager.getUpgradePrice(item);
            const canAfford = saveData.totalCoins >= price;
            const outfitId = getOutfitIdForUpgrade(item.id);
            const isEquippedOutfit = outfitId && saveData.selectedOutfit === outfitId;

            return (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>
                      Level {currentLvl} / {item.maxLevel}
                    </span>
                    <span>{item.category}</span>
                  </div>

                  <h3 className="text-base font-display font-bold text-white">
                    {item.name}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-white/10 text-xs space-y-1">
                    <div className="text-slate-400">
                      Current:{' '}
                      <span className="text-emerald-300 font-medium">
                        {item.effectLabel(currentLvl)}
                      </span>
                    </div>
                    {!isMaxed && (
                      <div className="text-slate-400">
                        Next Level:{' '}
                        <span className="text-amber-300 font-medium">
                          {item.nextBenefitLabel(currentLvl)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  {isMaxed ? (
                    outfitId ? (
                      <button
                        type="button"
                        onClick={() => handleEquipOutfit(outfitId)}
                        className={`w-full min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          isEquippedOutfit
                            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {isEquippedOutfit ? 'Outfit Equipped' : 'Equip Outfit'}
                      </button>
                    ) : (
                      <div className="w-full min-h-[44px] rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Shield className="w-4 h-4" /> Maximum Level Reached
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                      className={`w-full min-h-[44px] rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-transform active:scale-95 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {!canAfford && <Lock className="w-3.5 h-3.5" />}
                        {canAfford ? 'Purchase Upgrade' : 'Need More Coins'}
                      </span>
                      <span className="font-mono-tabular flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        {price}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
