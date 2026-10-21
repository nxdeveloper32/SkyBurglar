import React, { useEffect, useState } from 'react';
import {
  Award,
  Coins,
  Home,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  ShoppingBag,
  Sliders,
  Volume2,
  X,
} from 'lucide-react';
import {
  LocomotionStage,
  PersistentSaveData,
  RunTelemetry,
  UserSettings,
} from '../types/game';
import { audioManager } from '../systems/AudioManager';

const STAGE_NAMES: Record<LocomotionStage, string> = {
  [LocomotionStage.FOOT]: 'Stage 1: Foot Chase',
  [LocomotionStage.MOTORCYCLE]: 'Stage 2: Street Motorcycle',
  [LocomotionStage.CAR]: 'Stage 3: Getaway Sports Car',
  [LocomotionStage.BALLOON]: 'Stage 4: Sky Burglar Balloon',
};

interface PauseModalProps {
  distance: number;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  distance,
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
}) => {
  const [confirmRestart, setConfirmRestart] = useState(false);

  const handleRestartRequest = () => {
    // GDD Section 12.3: Restarting must require confirmation if it would discard a significant active run
    if (distance >= 30 && !confirmRestart) {
      setConfirmRestart(true);
      audioManager.playMenuClick();
      return;
    }
    onRestart();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="thief-stripe-surface metallic-border rounded-3xl p-6 w-full max-w-sm text-center space-y-4">
        <h2 className="text-2xl font-display font-black text-white">Heist Paused</h2>
        <p className="text-xs text-slate-400 font-mono-tabular">
          Current Run Distance: {Math.floor(distance)}m
        </p>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Play className="w-4 h-4 fill-current" /> Resume Getaway
          </button>

          {!confirmRestart ? (
            <button
              type="button"
              onClick={handleRestartRequest}
              className="w-full min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Restart Run
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 space-y-2">
              <div className="text-xs text-rose-200 font-medium">
                Discard current {Math.floor(distance)}m run and restart?
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onRestart}
                  className="flex-1 min-h-[40px] rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Yes, Restart
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRestart(false)}
                  className="flex-1 min-h-[40px] rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" /> Audio & Controls Settings
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full min-h-[46px] rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" /> Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75">
      <div className="thief-stripe-surface metallic-border rounded-3xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-display font-black text-white">Game Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Music Volume */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-400" /> Heist Music Volume
              </span>
              <span className="font-mono-tabular">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-400" /> Sound Effects Volume
              </span>
              <span className="font-mono-tabular">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
              className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Touch Swipe Sensitivity */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Touch & Mouse Swipe Sensitivity
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl border border-white/10">
              {(['LOW', 'NORMAL', 'HIGH'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    audioManager.playMenuClick();
                    onUpdateSettings({ swipeSensitivity: level });
                  }}
                  className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors ${
                    settings.swipeSensitivity === level
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-xs font-semibold text-slate-300">Mute All Audio</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ isMuted: !settings.isMuted })}
              className={`min-w-[64px] min-h-[38px] px-3 rounded-xl text-xs font-bold transition-colors ${
                settings.isMuted
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {settings.isMuted ? 'Muted' : 'Active'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Reduced Camera Shake & Particles
            </span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`min-w-[64px] min-h-[38px] px-3 rounded-xl text-xs font-bold transition-colors ${
                settings.reducedMotion
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {settings.reducedMotion ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  telemetry: RunTelemetry;
  saveData: PersistentSaveData;
  onPlayAgain: () => void;
  onOpenShop: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  telemetry,
  saveData,
  onPlayAgain,
  onOpenShop,
  onMainMenu,
}) => {
  // Animated score reveal counter (GDD Section 7.3)
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const duration = 900;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimProgress(eased);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const displayScore = Math.round(telemetry.score * animProgress);
  const displayDistance = Math.round(telemetry.distance * animProgress);
  const displayCoins = Math.round(telemetry.runCoins * animProgress);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="thief-stripe-surface metallic-border rounded-3xl p-6 w-full max-w-lg space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header with Character Reaction Portraits */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl bg-slate-800 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/image_aedda6f0.png"
                alt="Police Officer"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-400">
                Pursuit Climax · Busted!
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
                Caught by the Police!
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {telemetry.captureReason || 'The police pursuit closed every escape route!'}
              </p>
            </div>
          </div>

          {telemetry.isNewPersonalBest && (
            <div className="gold-border bg-amber-500/20 rounded-xl px-3 py-1.5 text-right shrink-0">
              <Award className="w-5 h-5 text-amber-400 ml-auto mb-0.5" />
              <div className="text-[11px] font-bold text-amber-300 whitespace-nowrap">
                New Personal Best!
              </div>
            </div>
          )}
        </div>

        {/* Animated Primary Score & Distance Readouts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4">
            <div className="text-xs text-slate-400">Total Run Score</div>
            <div className="text-2xl sm:text-3xl font-display font-black font-mono-tabular text-amber-400 mt-0.5">
              {displayScore.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-mono-tabular mt-1">
              Best Record: {saveData.bestScore.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4">
            <div className="text-xs text-slate-400">Distance Survived</div>
            <div className="text-2xl sm:text-3xl font-display font-black font-mono-tabular text-sky-400 mt-0.5">
              {displayDistance}m
            </div>
            <div className="text-[11px] text-slate-400 font-mono-tabular mt-1">
              Best Distance: {saveData.bestDistance}m
            </div>
          </div>
        </div>

        {/* Detailed Run Breakdown (GDD Section 7.3) */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Coins Collected for Upgrades</span>
            <span className="font-mono-tabular font-bold text-amber-400">
              +{displayCoins} Coins (Bank: {saveData.totalCoins})
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Successful Thefts · Perfect Heists</span>
            <span className="font-mono-tabular font-semibold text-emerald-400">
              {telemetry.successfulThefts} Thefts · {telemetry.perfectThefts} Perfect
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Traffic Near-Miss Bonuses</span>
            <span className="font-mono-tabular font-semibold text-sky-300">
              {telemetry.nearMisses} Near Misses
            </span>
          </div>
          <div className="flex justify-between text-slate-300 pt-1 border-t border-white/10">
            <span>Highest Escape Stage Reached</span>
            <span className="font-semibold text-white">
              {STAGE_NAMES[telemetry.highestStageReached]}
            </span>
          </div>
        </div>

        {/* Primary Play Again & Secondary Upgrade Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Play className="w-5 h-5 fill-current" /> Play Again
          </button>

          <button
            type="button"
            onClick={onOpenShop}
            className="min-h-[48px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 border border-amber-500/30 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> Upgrade ({saveData.totalCoins})
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            aria-label="Main Menu"
            className="min-h-[48px] px-4 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 font-semibold text-sm flex items-center justify-center"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
