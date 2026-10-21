import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Coins,
  Flame,
  Hand,
  Pause,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  GadgetTier,
  GameplayPhase,
  GestureType,
  LocomotionStage,
  RunTelemetry,
} from '../types/game';

interface InGameHudProps {
  telemetry: RunTelemetry;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerGadget: () => void;
  onManualGesture: (gesture: GestureType) => void;
}

const GADGET_NAMES: Record<GadgetTier, string> = {
  [GadgetTier.STONES]: 'Distraction Stones',
  [GadgetTier.SMOKE_BOMB]: 'Thick Smoke Bomb',
  [GadgetTier.CARTOON_GRENADE]: 'Boomer Grenade',
  [GadgetTier.ARCADE_PISTOL]: 'Arcade Zapper',
};

const STAGE_LABELS: Record<LocomotionStage, string> = {
  [LocomotionStage.FOOT]: 'Stage 1 · On Foot',
  [LocomotionStage.MOTORCYCLE]: 'Stage 2 · Street Motorcycle',
  [LocomotionStage.CAR]: 'Stage 3 · Getaway Sports Car',
  [LocomotionStage.BALLOON]: 'Stage 4 · Sky Burglar Balloon',
};

export const InGameHud: React.FC<InGameHudProps> = ({
  telemetry,
  isMuted,
  onToggleMute,
  onPause,
  onTriggerGadget,
  onManualGesture,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const isTheft = telemetry.activePhase === GameplayPhase.THEFT;
  const isCoinRush = telemetry.activePhase === GameplayPhase.COIN_RUSH;
  const isEscape = telemetry.activePhase === GameplayPhase.ESCAPE;

  const pressurePct = Math.round(telemetry.pursuitPressure);
  const pressureColor =
    pressurePct >= 75
      ? 'text-rose-400'
      : pressurePct >= 45
      ? 'text-amber-400'
      : 'text-emerald-400';

  const pressureBarColor =
    pressurePct >= 75
      ? 'bg-rose-500'
      : pressurePct >= 45
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const renderGestureIcon = (gesture: GestureType) => {
    switch (gesture) {
      case GestureType.SWIPE_UP:
        return <ArrowUp className="w-10 h-10 text-amber-300" />;
      case GestureType.SWIPE_DOWN:
        return <ArrowDown className="w-10 h-10 text-amber-300" />;
      case GestureType.SWIPE_LEFT:
        return <ArrowLeft className="w-10 h-10 text-amber-300" />;
      case GestureType.SWIPE_RIGHT:
        return <ArrowRight className="w-10 h-10 text-amber-300" />;
      case GestureType.TAP:
        return <Hand className="w-10 h-10 text-amber-300" />;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* TOP PERIMETER CLUSTER */}
      <div className="flex items-start justify-between gap-3 w-full max-w-6xl mx-auto">
        {/* Left Telemetry Cluster: Score, Distance, Coins */}
        <div className="thief-stripe-surface metallic-border rounded-2xl px-4 py-2.5 flex items-center gap-4 sm:gap-6">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Score</div>
            <div className="text-lg sm:text-2xl font-extrabold font-mono-tabular text-white leading-tight">
              {Math.floor(telemetry.score + telemetry.distance).toLocaleString()}
            </div>
          </div>

          <div className="h-7 w-px bg-white/10" />

          <div>
            <div className="text-[11px] font-medium text-slate-400">Distance</div>
            <div className="text-base sm:text-xl font-bold font-mono-tabular text-sky-300 leading-tight">
              {Math.floor(telemetry.distance)}m
            </div>
          </div>

          <div className="h-7 w-px bg-white/10" />

          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[11px] font-medium text-slate-400">Loot</div>
              <div className="text-base sm:text-xl font-bold font-mono-tabular text-amber-400 leading-tight">
                {telemetry.runCoins}
              </div>
            </div>
          </div>
        </div>

        {/* Center Phase & Stage Readout */}
        <div className="hidden md:flex flex-col items-center">
          <div className="thief-stripe-surface metallic-border rounded-xl px-4 py-1.5 text-xs text-slate-300 flex items-center gap-2">
            <span className="font-bold text-white">{ telemetry.activePhase === GameplayPhase.COIN_RUSH ? 'Coin Rush Phase' : telemetry.activePhase === GameplayPhase.THEFT ? 'Theft Encounter' : 'Escape Phase' }</span>
            <span aria-hidden="true">·</span>
            <span>{STAGE_LABELS[telemetry.locomotionStage]}</span>
          </div>
        </div>

        {/* Right Cluster: Pursuit Pressure (Hidden during Coin Rush per GDD 12.2) + Mute & Pause */}
        <div className="flex items-center gap-2">
          {!isCoinRush && (
            <div className="thief-stripe-surface metallic-border rounded-2xl px-3.5 py-2 min-w-[140px] sm:min-w-[175px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Pursuit
                </span>
                <span className={`font-mono-tabular font-bold ${pressureColor}`}>
                  {pressurePct}% · {telemetry.pursuitState}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${pressureBarColor}`}
                  style={{ width: `${Math.min(100, Math.max(4, pressurePct))}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            data-ui-interactive="true"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="pointer-events-auto thief-stripe-surface metallic-border rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-200 hover:text-white active:scale-95 transition-transform"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            data-ui-interactive="true"
            onClick={onPause}
            aria-label="Pause game"
            className="pointer-events-auto thief-stripe-surface metallic-border rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-200 hover:text-white active:scale-95 transition-transform"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CONTEXTUAL BANNERS, TUTORIAL HINTS & ACTIVE PHASE OVERLAYS */}
      <div className="flex-1 flex flex-col items-center justify-between py-3">
        {/* Top-Center Contextual Banner & Tutorial Callout */}
        <div className="flex flex-col items-center gap-2 max-w-lg w-full">
          {telemetry.tutorialPrompt && (
            <div className="thief-stripe-surface gold-border rounded-xl px-4 py-2 text-center text-xs sm:text-sm text-amber-200 font-medium">
              {telemetry.tutorialPrompt}
            </div>
          )}

          {telemetry.statusBanner && !isTheft && (
            <div
              key={telemetry.statusBanner.id}
              className="thief-stripe-surface metallic-border rounded-xl px-4 py-2 text-center"
            >
              <div
                className={`text-sm sm:text-base font-display font-extrabold ${
                  telemetry.statusBanner.tone === 'emerald'
                    ? 'text-emerald-400'
                    : telemetry.statusBanner.tone === 'crimson'
                    ? 'text-rose-400'
                    : telemetry.statusBanner.tone === 'sky'
                    ? 'text-sky-400'
                    : 'text-amber-400'
                }`}
              >
                {telemetry.statusBanner.text}
              </div>
              {telemetry.statusBanner.subtext && (
                <div className="text-xs text-slate-300 mt-0.5">
                  {telemetry.statusBanner.subtext}
                </div>
              )}
            </div>
          )}

          {/* COIN RUSH DEDICATED HEADER */}
          {isCoinRush && (
            <div className="thief-stripe-surface gold-border rounded-2xl px-5 py-3 w-full max-w-sm text-center">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Coin Rush Bonus Phase
                </span>
                <span className="font-mono-tabular">
                  +{telemetry.phaseCoinsEarned} Coins · {telemetry.phaseTimeRemaining.toFixed(1)}s
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-100"
                  style={{
                    width: `${Math.max(
                      0,
                      (telemetry.phaseTimeRemaining / Math.max(1, telemetry.phaseTotalDuration)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* CONTEXTUAL BALLOON JUMP / REATTACH PROMPT */}
          {isEscape && telemetry.balloonOpportunity && (
            <button
              type="button"
              data-ui-interactive="true"
              onClick={() => onManualGesture(telemetry.balloonOpportunity!.requiredGesture)}
              className="pointer-events-auto thief-stripe-surface gold-border rounded-2xl px-5 py-2.5 text-center hover:brightness-110 active:scale-95 transition-transform"
            >
              <div className="text-xs sm:text-sm font-display font-bold text-amber-300">
                {telemetry.balloonOpportunity.label}
              </div>
              <div className="text-[11px] text-slate-300 font-mono-tabular mt-0.5">
                Opportunity window: {telemetry.balloonOpportunity.timeRemaining.toFixed(1)}s (or Tap Here)
              </div>
            </button>
          )}
        </div>

        {/* SLOW-MOTION THEFT PHASE QUICK-TIME TARGET RING */}
        {isTheft && telemetry.activeTheft && (
          <div className="my-auto flex flex-col items-center">
            <div className="thief-stripe-surface gold-border rounded-3xl p-5 sm:p-6 flex flex-col items-center max-w-sm text-center">
              <div className="text-xs font-semibold text-amber-400 tracking-wide">
                Slow-Motion Heist Target
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-0.5">
                {telemetry.activeTheft.title}
              </h2>

              {/* Interactive Gesture Target Button with Shrinking Progress Ring */}
              <button
                type="button"
                data-ui-interactive="true"
                onClick={() => onManualGesture(telemetry.activeTheft!.requiredGesture)}
                className="pointer-events-auto relative my-4 w-28 h-28 flex items-center justify-center rounded-full bg-slate-900/90 border-2 border-amber-400/60 hover:border-amber-300 active:scale-95 transition-transform"
              >
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.18)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="6"
                    strokeDasharray={283}
                    strokeDashoffset={
                      283 *
                      (1 -
                        Math.max(
                          0,
                          telemetry.phaseTimeRemaining /
                            Math.max(0.1, telemetry.activeTheft.totalDuration)
                        ))
                    }
                    strokeLinecap="round"
                  />
                </svg>
                {renderGestureIcon(telemetry.activeTheft.requiredGesture)}
              </button>

              <p className="text-sm font-bold text-amber-200">
                {telemetry.activeTheft.instruction}
              </p>
              <p className="text-xs text-slate-400 font-mono-tabular mt-1">
                Time Remaining: {telemetry.phaseTimeRemaining.toFixed(1)}s · Or Tap Ring Directly
              </p>
            </div>
          </div>
        )}

        <div />
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Three.js Skill Section 5) */}
      {!isTheft && (
        <div className="flex flex-col items-center w-full max-w-xl mx-auto">
          <button
            type="button"
            data-ui-interactive="true"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="pointer-events-auto thief-stripe-surface metallic-border rounded-t-xl px-3.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show Controls
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Hide Controls
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="pointer-events-auto thief-stripe-surface metallic-border rounded-2xl px-4 py-2.5 w-full flex items-center justify-between gap-3">
              {/* Quick Directional Touch/Click Buttons for Accessibility */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-ui-interactive="true"
                  onClick={() => onManualGesture(GestureType.SWIPE_LEFT)}
                  aria-label="Move Left"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  data-ui-interactive="true"
                  onClick={() => onManualGesture(GestureType.SWIPE_UP)}
                  aria-label="Jump"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  data-ui-interactive="true"
                  onClick={() => onManualGesture(GestureType.SWIPE_DOWN)}
                  aria-label="Slide"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  data-ui-interactive="true"
                  onClick={() => onManualGesture(GestureType.SWIPE_RIGHT)}
                  aria-label="Move Right"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Stage Info on Mobile */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] text-slate-400">Swipe or WASD</span>
                <span className="text-xs font-semibold text-slate-200">
                  {STAGE_LABELS[telemetry.locomotionStage]}
                </span>
              </div>

              {/* Gadget Action Button (Hidden during Coin Rush per GDD 12.2) */}
              {isEscape && (
                <button
                  type="button"
                  data-ui-interactive="true"
                  disabled={telemetry.gadgetCharges <= 0}
                  onClick={onTriggerGadget}
                  className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 transition-transform active:scale-95 ${
                    telemetry.gadgetCharges > 0
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {telemetry.activeGadget === GadgetTier.CARTOON_GRENADE ? (
                    <Flame className="w-4 h-4 shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 shrink-0" />
                  )}
                  <div className="text-left">
                    <div className="leading-none whitespace-nowrap">
                      {GADGET_NAMES[telemetry.activeGadget]}
                    </div>
                    <div className="text-[10px] font-mono-tabular opacity-85 mt-0.5">
                      Charges: {telemetry.gadgetCharges}/{telemetry.maxGadgetCharges} · [E]
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
