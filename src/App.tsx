import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameState,
  GestureType,
  PersistentSaveData,
  RunTelemetry,
  UserSettings,
} from './types/game';
import { saveManager } from './systems/SaveManager';
import { audioManager } from './systems/AudioManager';
import { GameEngine } from './three/GameEngine';
import { MainMenuOverlay } from './components/MainMenuOverlay';
import { InGameHud } from './components/InGameHud';
import { UpgradeShopModal } from './components/UpgradeShopModal';
import {
  GameOverModal,
  PauseModal,
  SettingsModal,
} from './components/GameModals';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [telemetry, setTelemetry] = useState<RunTelemetry | null>(null);
  const [saveData, setSaveData] = useState<PersistentSaveData>(() =>
    structuredClone(saveManager.getData())
  );
  const [showShopModal, setShowShopModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  const refreshSaveState = useCallback(() => {
    setSaveData(structuredClone(saveManager.getData()));
    engineRef.current?.refreshPlayerCosmeticsAndStats();
  }, []);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    try {
      const engine = new GameEngine(mount, (newTelemetry) => {
        setTelemetry(newTelemetry);
        if (newTelemetry.gameState === GameState.GAME_OVER) {
          setSaveData(structuredClone(saveManager.getData()));
        }
      });
      engineRef.current = engine;

      return () => {
        engine.dispose();
        engineRef.current = null;
      };
    } catch {
      setWebglError(
        'WebGL 3D rendering could not be initialized on this browser. Please enable hardware acceleration or try a modern desktop or Android browser.'
      );
    }
  }, []);

  const handleStartGame = useCallback(() => {
    setShowShopModal(false);
    setShowSettingsModal(false);
    engineRef.current?.startNewRun();
  }, []);

  const handleToggleMute = useCallback(() => {
    const current = saveManager.getData().settings.isMuted;
    saveManager.updateSettings({ isMuted: !current });
    refreshSaveState();
  }, [refreshSaveState]);

  const handleUpdateSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      saveManager.updateSettings(partial);
      refreshSaveState();
    },
    [refreshSaveState]
  );

  const handleManualGesture = useCallback((gesture: GestureType) => {
    audioManager.initOnUserGesture();
    // Dispatch synthetic key event so InputManager and GameEngine process it uniformly
    const keyMap: Record<GestureType, string> = {
      [GestureType.SWIPE_LEFT]: 'ArrowLeft',
      [GestureType.SWIPE_RIGHT]: 'ArrowRight',
      [GestureType.SWIPE_UP]: 'ArrowUp',
      [GestureType.SWIPE_DOWN]: 'ArrowDown',
      [GestureType.TAP]: 'Enter',
    };
    const code = keyMap[gesture];
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    window.setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    }, 30);
  }, []);

  if (webglError) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="thief-stripe-surface metallic-border rounded-3xl p-6 max-w-md text-center space-y-4">
          <img
            src="/assets/aistudio/image_0a368a0b.png"
            alt="The Great Getaway"
            referrerPolicy="no-referrer"
            className="w-24 h-24 rounded-2xl mx-auto object-cover border border-amber-400/40"
          />
          <h1 className="text-2xl font-display font-black text-amber-400">
            The Great Getaway
          </h1>
          <p className="text-sm text-slate-300">{webglError}</p>
        </div>
      </div>
    );
  }

  const isPlaying =
    telemetry &&
    (telemetry.gameState === GameState.ESCAPE ||
      telemetry.gameState === GameState.THEFT ||
      telemetry.gameState === GameState.COIN_RUSH ||
      telemetry.gameState === GameState.BALLOON_CHASE);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Isolated Three.js WebGL Canvas Container */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Main Menu Overlay */}
      {telemetry && telemetry.gameState === GameState.MAIN_MENU && (
        <MainMenuOverlay
          saveData={saveData}
          onStartGame={handleStartGame}
          onOpenShop={() => {
            audioManager.playMenuClick();
            setShowShopModal(true);
          }}
          onOpenSettings={() => {
            audioManager.playMenuClick();
            setShowSettingsModal(true);
          }}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active Gameplay HUD */}
      {telemetry && isPlaying && (
        <InGameHud
          telemetry={telemetry}
          isMuted={saveData.settings.isMuted}
          onToggleMute={handleToggleMute}
          onPause={() => engineRef.current?.togglePause()}
          onTriggerGadget={() => engineRef.current?.triggerGadgetFromUI()}
          onManualGesture={handleManualGesture}
        />
      )}

      {/* Pause Modal */}
      {telemetry && telemetry.gameState === GameState.PAUSED && (
        <PauseModal
          distance={telemetry.distance}
          onResume={() => engineRef.current?.togglePause()}
          onRestart={handleStartGame}
          onOpenSettings={() => setShowSettingsModal(true)}
          onMainMenu={() => engineRef.current?.setMenuState(GameState.MAIN_MENU)}
        />
      )}

      {/* Game Over Modal */}
      {telemetry && telemetry.gameState === GameState.GAME_OVER && (
        <GameOverModal
          telemetry={telemetry}
          saveData={saveData}
          onPlayAgain={handleStartGame}
          onOpenShop={() => setShowShopModal(true)}
          onMainMenu={() => engineRef.current?.setMenuState(GameState.MAIN_MENU)}
        />
      )}

      {/* Upgrade Shop Modal */}
      {showShopModal && (
        <UpgradeShopModal
          saveData={saveData}
          onClose={() => {
            audioManager.playMenuClick();
            setShowShopModal(false);
          }}
          onUpgradeChanged={refreshSaveState}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={saveData.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => {
            audioManager.playMenuClick();
            setShowSettingsModal(false);
          }}
        />
      )}
    </main>
  );
}
