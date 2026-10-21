import { GadgetTier, GameplayPhase, LocomotionStage } from '../types/game';
import { saveManager } from './SaveManager';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private isRunningLoop = false;
  private loopTimer: number | null = null;
  private beatIndex = 0;
  private currentPressure = 15;
  private currentPhase: GameplayPhase = GameplayPhase.ESCAPE;
  private currentStage: LocomotionStage = LocomotionStage.FOOT;
  private footstepTimer = 0;

  private ensureContext(): AudioContext | null {
    const settings = saveManager.getData().settings;
    if (settings.isMuted) return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getSfxGain(): number {
    const s = saveManager.getData().settings;
    return s.isMuted ? 0 : s.sfxVolume;
  }

  private getMusicGain(): number {
    const s = saveManager.getData().settings;
    return s.isMuted ? 0 : s.musicVolume;
  }

  public initOnUserGesture(): void {
    this.ensureContext();
  }

  public startRunLoop(): void {
    this.ensureContext();
    if (this.isRunningLoop) return;
    this.isRunningLoop = true;
    this.beatIndex = 0;
    this.scheduleNextBeat();
  }

  public stopRunLoop(): void {
    this.isRunningLoop = false;
    if (this.loopTimer !== null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  public updateLoopState(pressure: number, phase: GameplayPhase, stage: LocomotionStage, dt: number): void {
    this.currentPressure = pressure;
    this.currentPhase = phase;
    this.currentStage = stage;

    // Continuous footsteps or vehicle hum
    this.footstepTimer += dt;
    if (phase !== GameplayPhase.THEFT) {
      const interval =
        stage === LocomotionStage.FOOT
          ? 0.27
          : stage === LocomotionStage.MOTORCYCLE
          ? 0.14
          : stage === LocomotionStage.CAR
          ? 0.12
          : 0.35;

      if (this.footstepTimer >= interval) {
        this.footstepTimer = 0;
        if (stage === LocomotionStage.FOOT) {
          this.playFootstep();
        } else if (stage === LocomotionStage.MOTORCYCLE || stage === LocomotionStage.CAR) {
          this.playEnginePulse(stage === LocomotionStage.CAR);
        } else if (stage === LocomotionStage.BALLOON) {
          this.playHelicopterBladePulse();
        }
      }
    }
  }

  private scheduleNextBeat(): void {
    if (!this.isRunningLoop) return;

    const ctx = this.ensureContext();
    const musicVol = this.getMusicGain();

    if (ctx && musicVol > 0.01) {
      const now = ctx.currentTime;
      // Groovy sneaky bassline notes (C minor blues heist scale)
      const bassScale =
        this.currentPhase === GameplayPhase.COIN_RUSH
          ? [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23]
          : [130.81, 155.56, 174.61, 185.0, 196.0, 174.61, 155.56, 146.83];

      const freq = bassScale[this.beatIndex % bassScale.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = this.currentPhase === GameplayPhase.COIN_RUSH ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Low-pass filter for warm cartoon spy bass
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.currentPhase === GameplayPhase.THEFT ? 320 : 650, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09 * musicVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);

      // Subtle police siren wail on every 8th beat when pursuit pressure > 35
      if (this.beatIndex % 8 === 0 && this.currentPressure > 35 && this.currentPhase === GameplayPhase.ESCAPE) {
        this.playSirenPulse(this.currentPressure / 100);
      }
    }

    this.beatIndex++;
    const baseMs = this.currentPhase === GameplayPhase.THEFT ? 280 : Math.max(145, 220 - this.currentPressure * 0.65);
    this.loopTimer = window.setTimeout(() => this.scheduleNextBeat(), baseMs);
  }

  public playMenuClick(): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.065);
    gain.gain.setValueAtTime(0.15 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playFootstep(): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110 + (this.beatIndex % 2) * 18, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);
    gain.gain.setValueAtTime(0.06 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playEnginePulse(isCar: boolean): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isCar ? 72 : 105, now);
    osc.frequency.linearRampToValueAtTime(isCar ? 82 : 122, now + 0.09);
    gain.gain.setValueAtTime(0.035 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playHelicopterBladePulse(): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(62, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.08);
    gain.gain.setValueAtTime(0.05 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playSirenPulse(intensity: number): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.linearRampToValueAtTime(910, now + 0.18);
    osc.frequency.linearRampToValueAtTime(640, now + 0.36);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07 * intensity * vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playJumpOrDodge(isJump: boolean): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    if (isJump) {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);
    } else {
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.1);
    }
    gain.gain.setValueAtTime(0.14 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playCoinCollect(isBonus: boolean): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const notes = isBonus ? [783.99, 987.77, 1318.51] : [880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.14 * vol, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.15);
    });
  }

  public playTheftResult(outcome: 'PERFECT' | 'NORMAL' | 'FAILURE'): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;

    if (outcome === 'FAILURE') {
      [220, 185].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.16 * vol, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.19);
      });
      return;
    }

    const chord = outcome === 'PERFECT' ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.18 * vol, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.27);
    });
  }

  public playGadgetActivate(tier: GadgetTier): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (tier === GadgetTier.ARCADE_PISTOL) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
    } else if (tier === GadgetTier.CARTOON_GRENADE) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.32);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);
    }

    gain.gain.setValueAtTime(0.2 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playCollisionImpact(): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.24);
    gain.gain.setValueAtTime(0.24 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playPhaseTransition(phase: GameplayPhase): void {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const notes =
      phase === GameplayPhase.COIN_RUSH
        ? [587.33, 783.99, 1174.66]
        : phase === GameplayPhase.THEFT
        ? [392.0, 493.88, 587.33]
        : [329.63, 440.0];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.055);
      gain.gain.setValueAtTime(0.14 * vol, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.2);
    });
  }

  public playGameOver(isNewBest: boolean): void {
    this.stopRunLoop();
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;
    const now = ctx.currentTime;
    const notes = isNewBest ? [523.25, 659.25, 783.99, 1046.5] : [392.0, 369.99, 349.23, 311.13];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.16);
      gain.gain.setValueAtTime(0.18 * vol, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.3);
    });
  }
}

export const audioManager = new AudioManager();
