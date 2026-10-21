import React from 'react';
import { Coins, Play, Settings, ShoppingBag, Trophy, Volume2, VolumeX } from 'lucide-react';
import { LocomotionStage, PersistentSaveData } from '../types/game';

interface MainMenuOverlayProps {
  saveData: PersistentSaveData;
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
}

const STAGE_BADGE: Record<LocomotionStage, string> = {
  [LocomotionStage.FOOT]: 'Stage 1 · Foot Escape',
  [LocomotionStage.MOTORCYCLE]: 'Stage 2 · Street Motorcycle',
  [LocomotionStage.CAR]: 'Stage 3 · Getaway Sports Car',
  [LocomotionStage.BALLOON]: 'Stage 4 · Sky Burglar Balloon',
};

export const MainMenuOverlay: React.FC<MainMenuOverlayProps> = ({
  saveData,
  onStartGame,
  onOpenShop,
  onOpenSettings,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar: Best Record, Coins & Quick Actions */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="pointer-events-auto thief-stripe-surface metallic-border rounded-2xl px-4 py-2.5 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400">Personal Best</div>
              <div className="text-sm sm:text-base font-bold font-mono-tabular text-white leading-tight">
                {saveData.bestScore.toLocaleString()} pts · {saveData.bestDistance}m
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div className="hidden sm:block">
            <div className="text-[11px] text-slate-400">Highest Stage</div>
            <div className="text-xs font-semibold text-sky-300">
              {STAGE_BADGE[saveData.highestStageEver]}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenShop}
            className="thief-stripe-surface gold-border rounded-2xl min-h-[44px] px-3.5 py-2 flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-mono-tabular font-bold text-amber-400 text-sm sm:text-base">
              {saveData.totalCoins.toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={saveData.settings.isMuted ? 'Unmute audio' : 'Mute audio'}
            className="thief-stripe-surface metallic-border rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-200 hover:text-white transition-colors"
          >
            {saveData.settings.isMuted ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="thief-stripe-surface metallic-border rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-200 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bespoke Inline SVG Title Lockup positioned at top-center leaving 3D Diorama unobstructed */}
      <div className="flex flex-col items-center text-center mt-1 sm:mt-2">
        <svg
          viewBox="0 0 560 115"
          className="w-full max-w-[340px] sm:max-w-[460px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]"
          role="img"
          aria-label="The Great Getaway"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* Domino Mask Silhouette Emblem */}
          <path
            d="M210 18 C235 6, 265 10, 280 20 C295 10, 325 6, 350 18 C365 26, 365 42, 345 46 C322 50, 295 40, 280 34 C265 40, 238 50, 215 46 C195 42, 195 26, 210 18 Z"
            fill="#0f172a"
            stroke="#fbbf24"
            strokeWidth="2.5"
          />
          <ellipse cx="242" cy="31" rx="14" ry="7" fill="#f8fafc" />
          <ellipse cx="318" cy="31" rx="14" ry="7" fill="#f8fafc" />
          <text
            x="280"
            y="84"
            textAnchor="middle"
            fill="url(#goldGrad)"
            stroke="#090d16"
            strokeWidth="8"
            paintOrder="stroke"
            fontFamily="Outfit, sans-serif"
            fontWeight="900"
            fontSize="44"
            letterSpacing="2"
          >
            THE GREAT GETAWAY
          </text>
          <text
            x="280"
            y="108"
            textAnchor="middle"
            fill="#e2e8f0"
            stroke="#090d16"
            strokeWidth="4"
            paintOrder="stroke"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="700"
            fontSize="13"
            letterSpacing="3.5"
          >
            RUN · STEAL · ESCAPE · SKY BALLOON HEIST
          </text>
        </svg>
      </div>

      {/* Unobstructed 3D Center Viewport Space */}
      <div className="flex-1" />

      {/* Bottom Action Cluster (Natural Mobile Thumb Zone & Desktop Dock) */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3">
        {/* Character & Progression Stage Preview Strip */}
        <div className="pointer-events-auto thief-stripe-surface metallic-border rounded-2xl px-4 py-2.5 w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-amber-400/40 overflow-hidden shrink-0">
              <img
                src="/assets/aistudio/image_0a368a0b.png"
                alt="Masked Thief"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">
                4-Stage Pursuit Escalation
              </div>
              <div className="text-[11px] text-slate-300">
                Foot Chase · Bike Hijack · Sports Car · Sky Balloon
              </div>
            </div>
          </div>

          <div className="flex items-center -space-x-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/20 overflow-hidden">
              <img
                src="/assets/aistudio/image_aedda6f0.png"
                alt="Police Officer"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-amber-400/40 overflow-hidden">
              <img
                src="/assets/aistudio/image_91993ce9.png"
                alt="Sky Burglar Hot-Air Balloon"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Primary CTA + Upgrade Shop Button */}
        <div className="pointer-events-auto w-full flex items-center gap-3">
          <button
            type="button"
            onClick={onStartGame}
            className="flex-1 min-h-[54px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-lg sm:text-xl flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-transform"
          >
            <Play className="w-6 h-6 fill-current" />
            START GETAWAY
          </button>

          <button
            type="button"
            onClick={onOpenShop}
            className="min-h-[54px] px-5 rounded-2xl thief-stripe-surface gold-border text-amber-300 hover:text-amber-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shrink-0"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Upgrades</span>
          </button>
        </div>

        {/* Single Flat Control-Hint Line */}
        <div className="thief-stripe-surface metallic-border rounded-xl px-4 py-1.5 text-[11px] sm:text-xs text-slate-300 text-center">
          <span>Swipe or WASD/Arrows Move</span>
          <span className="mx-2 text-slate-500" aria-hidden="true">·</span>
          <span>Swipe Up / Space Jump</span>
          <span className="mx-2 text-slate-500" aria-hidden="true">·</span>
          <span>E / Tap Gadget</span>
          <span className="mx-2 text-slate-500" aria-hidden="true">·</span>
          <span>Esc Pause</span>
        </div>
      </div>
    </div>
  );
};
