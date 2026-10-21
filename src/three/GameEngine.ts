import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ActiveTheftEncounter,
  BalloonContextOpportunity,
  GadgetTier,
  GameState,
  GameplayPhase,
  GestureType,
  LocomotionStage,
  OutfitCosmeticId,
  PursuitState,
  RunTelemetry,
  TheftOutcome,
  TheftTargetType,
  TutorialStep,
} from '../types/game';
import { audioManager } from '../systems/AudioManager';
import { InputManager } from '../systems/InputManager';
import { saveManager } from '../systems/SaveManager';
import {
  AnimatedCharacterRig,
  CharacterAndVehicleModels,
} from './CharacterAndVehicleModels';
import { MaterialsAndTextures } from './MaterialsAndTextures';
import { LANE_WIDTH, ProceduralCity } from './ProceduralCity';

export type TelemetryListener = (telemetry: RunTelemetry) => void;

interface ActiveGadgetProjectile {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
}

interface BurstParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
}

// Pre-allocated vectors & colors at module scope for zero GC in tick()
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _skyDayColor = new THREE.Color(0x38bdf8);
const _skySunsetColor = new THREE.Color(0xf97316);
const _skyNightColor = new THREE.Color(0x0f172a);
const _currentSkyColor = new THREE.Color();

export class GameEngine {
  private container: HTMLElement;
  private onTelemetry: TelemetryListener;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private materials: MaterialsAndTextures;
  private city: ProceduralCity;
  private inputManager: InputManager;

  // Player & Vehicle Rigs
  private playerRoot = new THREE.Group();
  private thiefRig: AnimatedCharacterRig;
  private playerBikeMesh: THREE.Group;
  private playerCarMesh: THREE.Group;
  private playerBalloonMesh: THREE.Group;

  // Police Pursuit Rigs
  private policeRoot = new THREE.Group();
  private policeOfficer1: AnimatedCharacterRig;
  private policeOfficer2: AnimatedCharacterRig;
  private policeBikeMesh: THREE.Group;
  private policeCarMesh: THREE.Group;
  private policeHelicopter: {
    root: THREE.Group;
    mainRotor: THREE.Group;
    searchlight: THREE.Mesh;
  };

  // Active Theft 3D Target Prop
  private theftPropGroup: THREE.Group | null = null;
  private theftPropZ = 0;

  // Projectiles & Pooled Visual Effects
  private projectiles: ActiveGadgetProjectile[] = [];
  private particles: BurstParticle[] = [];
  private sharedParticleGeo = new THREE.SphereGeometry(0.14, 8, 8);

  // Loop & Simulation State
  private frameId = 0;
  private lastTimestamp = 0;
  private animTime = 0;
  private hitstopTimer = 0;
  private cameraShake = 0;
  private bannerCounter = 1;

  // Player Spatial Kinematics
  private playerZ = 0;
  private playerLane = 0; // -1, 0, 1
  private playerX = 0;
  private playerY = 0;
  private baseGroundY = 0;
  private verticalVelocity = 0;
  private isJumping = false;
  private slideTimer = 0;
  private forwardSpeed = 14;
  private invulnerableTimer = 0;
  private policeStunTimer = 0;

  // Phase Director Scheduling
  private nextPhaseTriggerDistance = 120;
  private lastPhaseType: GameplayPhase = GameplayPhase.ESCAPE;
  private nextVehicleTargetIndex = 0; // 0: Wallet, 1: Bike, 2: Car, 3: Balloon, 4+: Cycle/Safe
  private balloonContextCooldown = 14;

  // Telemetry State
  private state: RunTelemetry;

  constructor(container: HTMLElement, onTelemetry: TelemetryListener) {
    this.container = container;
    this.onTelemetry = onTelemetry;

    // 1. Software WebGL Guard per Three.js Skill Directive
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer Configuration
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene, Studio Environment & Lighting
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.011);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const isPortrait = w < h;
    this.camera = new THREE.PerspectiveCamera(isPortrait ? 68 : 58, w / h, 0.1, 240);

    // Warm Key Light + Cool Hemisphere Fill
    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x78350f, 0.75);
    this.hemiLight.position.set(0, 40, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.85);
    this.dirLight.position.set(14, 28, 18);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    const d = 18;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 75;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // 4. Procedural Textures & City
    this.materials = new MaterialsAndTextures(this.renderer);
    this.city = new ProceduralCity(this.scene, this.materials);

    // 5. Build Player & Vehicle Models
    const savedOutfit = saveManager.getData().selectedOutfit;
    this.thiefRig = CharacterAndVehicleModels.createThiefRig(this.materials, savedOutfit);
    this.playerBikeMesh = CharacterAndVehicleModels.createMotorcycleGroup(false);
    this.playerCarMesh = CharacterAndVehicleModels.createCarGroup(false);
    this.playerBalloonMesh = CharacterAndVehicleModels.createHotAirBalloonGroup(this.materials);

    this.playerRoot.add(
      this.thiefRig.root,
      this.playerBikeMesh,
      this.playerCarMesh,
      this.playerBalloonMesh
    );
    this.scene.add(this.playerRoot);

    // 6. Build Police Pursuit Models
    this.policeOfficer1 = CharacterAndVehicleModels.createPoliceOfficerRig();
    this.policeOfficer2 = CharacterAndVehicleModels.createPoliceOfficerRig();
    this.policeBikeMesh = CharacterAndVehicleModels.createMotorcycleGroup(true);
    this.policeCarMesh = CharacterAndVehicleModels.createCarGroup(true);
    this.policeHelicopter = CharacterAndVehicleModels.createPoliceHelicopter();

    this.policeRoot.add(
      this.policeOfficer1.root,
      this.policeOfficer2.root,
      this.policeBikeMesh,
      this.policeCarMesh,
      this.policeHelicopter.root
    );
    this.scene.add(this.policeRoot);

    // 7. Initial Telemetry State
    this.state = this.createInitialTelemetry(GameState.MAIN_MENU);
    this.syncStageModels(LocomotionStage.FOOT);
    this.positionMenuDiorama();

    // Pre-warm shaders on GPU
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 8. Input & Resize Listeners
    this.inputManager = new InputManager(this.handleInputAction);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.emitTelemetry();
    this.lastTimestamp = performance.now();
    this.tick();
  }

  private createInitialTelemetry(initialGameState: GameState): RunTelemetry {
    const tutorialDone = saveManager.getData().tutorialCompleted;
    const maxCharges = saveManager.getMaxGadgetCharges();
    return {
      gameState: initialGameState,
      activePhase: GameplayPhase.ESCAPE,
      phaseTimeRemaining: 0,
      phaseTotalDuration: 0,
      phaseCoinsEarned: 0,
      locomotionStage: LocomotionStage.FOOT,
      highestStageReached: LocomotionStage.FOOT,
      pursuitState: PursuitState.SEARCHING,
      pursuitPressure: 18,
      score: 0,
      distance: 0,
      runCoins: 0,
      standardCoinsCollected: 0,
      bonusCoinsCollected: 0,
      successfulThefts: 0,
      perfectThefts: 0,
      nearMisses: 0,
      activeGadget: saveManager.getActiveGadgetTier(),
      gadgetCharges: maxCharges,
      maxGadgetCharges: maxCharges,
      gadgetCooldownProgress: 1,
      activeTheft: null,
      balloonOpportunity: null,
      tutorialStep: tutorialDone ? TutorialStep.NONE : TutorialStep.RUN_DODGE_FIRST,
      tutorialPrompt: tutorialDone
        ? null
        : 'STEP 1/6 — Swipe Left/Right or press A/D to switch lanes and dodge obstacles!',
      statusBanner: null,
      lastInputFeedback: null,
      isNewPersonalBest: false,
      captureReason: null,
    };
  }

  private positionMenuDiorama(): void {
    this.playerZ = 0;
    this.playerLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.baseGroundY = 0;
    this.playerRoot.position.set(-0.65, 0, 0);
    this.playerRoot.rotation.set(0, Math.PI * 0.82, 0);

    this.policeRoot.position.set(1.25, 0, -3.4);
    this.policeOfficer1.root.visible = true;
    this.policeOfficer1.root.position.set(0, 0, 0);
    this.policeOfficer1.root.rotation.y = -0.35;
    this.policeOfficer2.root.visible = false;
    this.policeBikeMesh.visible = false;
    this.policeCarMesh.visible = false;
    this.policeHelicopter.root.visible = false;
  }

  public startNewRun(): void {
    audioManager.initOnUserGesture();
    audioManager.playMenuClick();
    audioManager.startRunLoop();

    if (this.theftPropGroup) {
      this.scene.remove(this.theftPropGroup);
      this.theftPropGroup = null;
    }

    this.city.reset(Date.now());
    this.state = this.createInitialTelemetry(GameState.ESCAPE);

    this.playerZ = 0;
    this.playerLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.baseGroundY = 0;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.slideTimer = 0;
    this.forwardSpeed = 14.5;
    this.invulnerableTimer = 1.5;
    this.policeStunTimer = 0;
    this.nextPhaseTriggerDistance = this.state.tutorialStep !== TutorialStep.NONE ? 45 : 95;
    this.lastPhaseType = GameplayPhase.ESCAPE;
    this.nextVehicleTargetIndex = 0;
    this.balloonContextCooldown = 14;

    this.playerRoot.position.set(0, 0, 0);
    this.playerRoot.rotation.set(0, Math.PI, 0);
    this.syncStageModels(LocomotionStage.FOOT);

    // Spawn two gentle starter obstacles ahead so the player immediately acts
    this.city.spawnSingleObstacle(0, -28, false, LocomotionStage.FOOT);
    this.city.spawnSingleObstacle(-1, -46, false, LocomotionStage.FOOT);

    this.showBanner('THE GREAT GETAWAY!', 'Outrun the police and steal your getaway ride', 'gold');
    this.emitTelemetry();
  }

  public setMenuState(targetState: GameState): void {
    audioManager.playMenuClick();
    if (targetState === GameState.MAIN_MENU) {
      audioManager.stopRunLoop();
      this.city.clearAllObstaclesAndCoins();
      this.syncStageModels(LocomotionStage.FOOT);
      this.positionMenuDiorama();
    }
    this.state.gameState = targetState;
    this.emitTelemetry();
  }

  public togglePause(): void {
    if (
      this.state.gameState === GameState.ESCAPE ||
      this.state.gameState === GameState.THEFT ||
      this.state.gameState === GameState.COIN_RUSH ||
      this.state.gameState === GameState.BALLOON_CHASE
    ) {
      audioManager.playMenuClick();
      this.state.gameState = GameState.PAUSED;
      this.emitTelemetry();
    } else if (this.state.gameState === GameState.PAUSED) {
      audioManager.playMenuClick();
      this.state.gameState =
        this.state.activePhase === GameplayPhase.THEFT
          ? GameState.THEFT
          : this.state.activePhase === GameplayPhase.COIN_RUSH
          ? GameState.COIN_RUSH
          : this.state.locomotionStage === LocomotionStage.BALLOON
          ? GameState.BALLOON_CHASE
          : GameState.ESCAPE;
      this.emitTelemetry();
    }
  }

  public refreshPlayerCosmeticsAndStats(): void {
    const outfit: OutfitCosmeticId = saveManager.getData().selectedOutfit;
    if (this.thiefRig.sweaterMesh) {
      const mat = this.thiefRig.sweaterMesh.material as THREE.MeshStandardMaterial;
      mat.map = this.materials.getSweaterTexture(outfit);
      mat.needsUpdate = true;
    }
    this.state.activeGadget = saveManager.getActiveGadgetTier();
    this.state.maxGadgetCharges = saveManager.getMaxGadgetCharges();
    this.state.gadgetCharges = this.state.maxGadgetCharges;
    this.emitTelemetry();
  }

  public triggerGadgetFromUI(): void {
    this.handleInputAction('GADGET');
  }

  private handleInputAction = (action: GestureType | 'GADGET' | 'PAUSE'): void => {
    if (action === 'PAUSE') {
      this.togglePause();
      return;
    }

    // Allow Space / Tap on Main Menu to start run
    if (this.state.gameState === GameState.MAIN_MENU) {
      if (action === GestureType.SWIPE_UP || action === GestureType.TAP) {
        this.startNewRun();
      }
      return;
    }

    const isActiveGameplay =
      this.state.gameState === GameState.ESCAPE ||
      this.state.gameState === GameState.THEFT ||
      this.state.gameState === GameState.COIN_RUSH ||
      this.state.gameState === GameState.BALLOON_CHASE;

    if (!isActiveGameplay) return;

    this.state.lastInputFeedback = {
      gesture: action,
      timestamp: performance.now(),
    };

    if (action === 'GADGET') {
      this.activateGadget();
      this.emitTelemetry();
      return;
    }

    // 1. If in THEFT Phase: route gesture exclusively to the Theft Encounter evaluator
    if (this.state.activePhase === GameplayPhase.THEFT && this.state.activeTheft) {
      this.evaluateTheftGesture(action);
      this.emitTelemetry();
      return;
    }

    // 2. Check contextual Balloon Descend / Reattach opportunity
    if (
      this.state.balloonOpportunity &&
      action === this.state.balloonOpportunity.requiredGesture
    ) {
      this.executeBalloonContextAction();
      this.emitTelemetry();
      return;
    }

    // 3. Normal Movement in ESCAPE or COIN_RUSH Phase
    if (action === GestureType.SWIPE_LEFT) {
      if (this.playerLane > -1) {
        this.playerLane -= 1;
        audioManager.playJumpOrDodge(false);
        this.advanceTutorialOnDodge();
      }
    } else if (action === GestureType.SWIPE_RIGHT) {
      if (this.playerLane < 1) {
        this.playerLane += 1;
        audioManager.playJumpOrDodge(false);
        this.advanceTutorialOnDodge();
      }
    } else if (action === GestureType.SWIPE_UP) {
      if (!this.isJumping) {
        this.isJumping = true;
        this.slideTimer = 0;
        this.verticalVelocity = this.state.locomotionStage === LocomotionStage.BALLOON ? 7.5 : 10.2;
        audioManager.playJumpOrDodge(true);
        this.advanceTutorialOnDodge();
      }
    } else if (action === GestureType.SWIPE_DOWN) {
      if (this.isJumping) {
        // Fast-fall slam
        this.verticalVelocity = -16;
      }
      this.slideTimer = 0.65;
      audioManager.playJumpOrDodge(false);
      this.advanceTutorialOnDodge();
    } else if (action === GestureType.TAP) {
      // Tap during Escape triggers contextual jump/boost or interacts if prompt is shown
      if (this.state.balloonOpportunity) {
        this.executeBalloonContextAction();
      }
    }

    this.emitTelemetry();
  };

  private advanceTutorialOnDodge(): void {
    if (this.state.tutorialStep === TutorialStep.RUN_DODGE_FIRST) {
      this.state.tutorialStep = TutorialStep.DODGE_SECOND;
      this.state.tutorialPrompt =
        'STEP 2/6 — Great! Now Swipe Up/Down (or W/S) to Jump over barriers or Slide under awnings.';
    } else if (this.state.tutorialStep === TutorialStep.DODGE_SECOND) {
      this.state.tutorialStep = TutorialStep.STEAL_WALLET;
      this.state.tutorialPrompt =
        'STEP 3/6 — Watch for the highlighted Theft Target ahead to perform your first heist!';
    }
  }

  private activateGadget(): void {
    if (this.state.activePhase === GameplayPhase.THEFT) return;
    if (this.state.gadgetCharges <= 0) return;

    this.state.gadgetCharges -= 1;
    if (this.state.gadgetCooldownProgress >= 1) {
      this.state.gadgetCooldownProgress = 0;
    }

    const tier = this.state.activeGadget;
    audioManager.playGadgetActivate(tier);

    // Spawn 3D gadget projectile flying backward at pursuing police
    const projGroup = new THREE.Group();
    const color =
      tier === GadgetTier.STONES
        ? 0x94a3b8
        : tier === GadgetTier.SMOKE_BOMB
        ? 0xa855f7
        : tier === GadgetTier.CARTOON_GRENADE
        ? 0xef4444
        : 0x06b6d4;

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 })
    );
    projGroup.add(orb);
    projGroup.position.set(this.playerX, this.playerY + 1.2, this.playerZ + 0.8);
    this.scene.add(projGroup);

    this.projectiles.push({
      mesh: projGroup,
      velocity: new THREE.Vector3(0, 3.2, 18),
      age: 0,
      maxAge: 0.45,
    });

    // Reduce police pursuit pressure & stun pursuers temporarily
    const pressureDrop =
      tier === GadgetTier.STONES
        ? 14
        : tier === GadgetTier.SMOKE_BOMB
        ? 20
        : tier === GadgetTier.CARTOON_GRENADE
        ? 26
        : 32;

    this.state.pursuitPressure = Math.max(8, this.state.pursuitPressure - pressureDrop);
    this.policeStunTimer = 3.2;
    this.spawnParticleBurst(
      new THREE.Vector3(this.playerX, this.playerY + 1.2, this.playerZ + 3.5),
      color,
      14
    );

    const gadgetLabel =
      tier === GadgetTier.STONES
        ? 'STONE DISTRACTION!'
        : tier === GadgetTier.SMOKE_BOMB
        ? 'SMOKE CLOUD DEPLOYED!'
        : tier === GadgetTier.CARTOON_GRENADE
        ? 'BOOMER GRENADE!'
        : 'ARCADE ZAPPER HIT!';

    this.showBanner(gadgetLabel, `Police slowed! -${pressureDrop}% Pursuit Pressure`, 'sky');

    if (this.state.tutorialStep === TutorialStep.USE_GADGET) {
      this.state.tutorialStep = TutorialStep.COMPLETE;
      this.state.tutorialPrompt = null;
      saveManager.markTutorialCompleted();
      this.showBanner('TUTORIAL COMPLETE!', 'Reach the Sky Burglar Hot-Air Balloon!', 'emerald');
    }
  }

  private syncStageModels(stage: LocomotionStage): void {
    this.state.locomotionStage = stage;
    const rank: Record<LocomotionStage, number> = {
      [LocomotionStage.FOOT]: 1,
      [LocomotionStage.MOTORCYCLE]: 2,
      [LocomotionStage.CAR]: 3,
      [LocomotionStage.BALLOON]: 4,
    };
    if (rank[stage] > rank[this.state.highestStageReached]) {
      this.state.highestStageReached = stage;
    }

    this.thiefRig.root.visible = true;
    this.playerBikeMesh.visible = stage === LocomotionStage.MOTORCYCLE;
    this.playerCarMesh.visible = stage === LocomotionStage.CAR;
    this.playerBalloonMesh.visible = stage === LocomotionStage.BALLOON;

    if (stage === LocomotionStage.FOOT) {
      this.baseGroundY = 0;
      this.thiefRig.root.position.set(0, 0, 0);
      this.thiefRig.root.scale.setScalar(1);
    } else if (stage === LocomotionStage.MOTORCYCLE) {
      this.baseGroundY = 0;
      this.thiefRig.root.position.set(0, 0.55, 0.12);
      this.thiefRig.root.scale.setScalar(0.92);
    } else if (stage === LocomotionStage.CAR) {
      this.baseGroundY = 0;
      this.thiefRig.root.position.set(0, 0.35, 0.15);
      this.thiefRig.root.scale.setScalar(0.75);
    } else if (stage === LocomotionStage.BALLOON) {
      this.baseGroundY = 10.5;
      this.thiefRig.root.position.set(0, 0.42, 0);
      this.thiefRig.root.scale.setScalar(0.95);
    }
    this.playerY = this.baseGroundY;
  }

  /**
   * Begins a focused Slow-Motion Theft Encounter (GDD Section 2.2 & Section 6)
   */
  private beginTheftPhase(): void {
    // Clear running obstacles so no unfair collision occurs during Theft
    this.city.clearAllObstaclesAndCoins();
    this.isJumping = false;
    this.slideTimer = 0;
    this.playerY = this.baseGroundY;

    let targetType = TheftTargetType.WALLET;
    let unlocksStage: LocomotionStage | undefined;
    let title = 'PEDESTRIAN WALLET';
    let instruction = 'SWIPE LEFT OR RIGHT TO SNATCH!';
    let requiredGesture = GestureType.SWIPE_LEFT;

    if (this.nextVehicleTargetIndex === 0) {
      targetType = TheftTargetType.WALLET;
      title = 'WEALTHY PEDESTRIAN WALLET';
      instruction = 'SWIPE UP (OR SPACE) TO SNATCH THE LOOT!';
      requiredGesture = GestureType.SWIPE_UP;
    } else if (this.nextVehicleTargetIndex === 1) {
      targetType = TheftTargetType.MOTORCYCLE_KEY;
      unlocksStage = LocomotionStage.MOTORCYCLE;
      title = 'STREET MOTORCYCLE HIJACK';
      instruction = 'SWIPE RIGHT (OR D) TO GRAB THE IGNITION!';
      requiredGesture = GestureType.SWIPE_RIGHT;
    } else if (this.nextVehicleTargetIndex === 2) {
      targetType = TheftTargetType.SPORTS_CAR;
      unlocksStage = LocomotionStage.CAR;
      title = 'GETAWAY SPORTS CAR';
      instruction = 'SWIPE LEFT (OR A) TO VAULT INTO THE DRIVER SEAT!';
      requiredGesture = GestureType.SWIPE_LEFT;
    } else if (this.nextVehicleTargetIndex === 3) {
      targetType = TheftTargetType.BALLOON_ROPE;
      unlocksStage = LocomotionStage.BALLOON;
      title = 'SKY BURGLAR HOT-AIR BALLOON';
      instruction = 'SWIPE UP (OR SPACE) TO GRAB THE ANCHOR ROPE!';
      requiredGesture = GestureType.SWIPE_UP;
    } else {
      targetType = TheftTargetType.ROOFTOP_SAFE;
      title = 'PENTHOUSE BANK VAULT';
      instruction = 'TAP / CLICK (OR ENTER) TO CRACK THE DIAL!';
      requiredGesture = GestureType.TAP;
    }

    const graceMult = saveManager.getTheftWindowBonusMultiplier();
    const baseDuration = Math.max(2.1, 3.2 - Math.min(0.9, this.state.distance / 2000)) * graceMult;

    this.state.activePhase = GameplayPhase.THEFT;
    this.state.gameState = GameState.THEFT;
    this.state.phaseTotalDuration = baseDuration;
    this.state.phaseTimeRemaining = baseDuration;
    this.state.activeTheft = {
      targetType,
      title,
      instruction,
      requiredGesture,
      totalDuration: baseDuration,
      elapsed: 0,
      resolved: false,
      unlocksStage,
      isCritical: this.state.pursuitPressure >= 85,
    };

    // Place 3D Theft Target directly ahead in the player's lane
    if (this.theftPropGroup) {
      this.scene.remove(this.theftPropGroup);
    }
    this.theftPropGroup = CharacterAndVehicleModels.createTheftTargetProp(
      targetType,
      this.materials
    );
    this.theftPropZ = this.playerZ - 5.2;
    this.theftPropGroup.position.set(this.playerX, this.baseGroundY, this.theftPropZ);
    this.scene.add(this.theftPropGroup);

    audioManager.playPhaseTransition(GameplayPhase.THEFT);
    this.emitTelemetry();
  }

  private evaluateTheftGesture(gesture: GestureType): void {
    const enc = this.state.activeTheft;
    if (!enc || enc.resolved) return;

    enc.resolved = true;
    const progress = enc.elapsed / enc.totalDuration;

    // Accept the exact required gesture, OR TAP as a partial fallback on early encounters
    const isExactMatch = gesture === enc.requiredGesture;
    const isEarlyForgivingTap = gesture === GestureType.TAP && this.nextVehicleTargetIndex <= 1;

    if (isExactMatch || isEarlyForgivingTap) {
      const isPerfect = isExactMatch && progress >= 0.15 && progress <= 0.78;
      const outcome = isPerfect ? TheftOutcome.PERFECT : TheftOutcome.NORMAL;
      enc.outcome = outcome;

      this.state.successfulThefts += 1;
      if (isPerfect) this.state.perfectThefts += 1;

      const bonusCoins = isPerfect ? 25 : 15;
      const theftPoints = isPerfect ? 400 : 250;
      this.state.runCoins += bonusCoins;
      this.state.score += theftPoints;

      const coolingMult = saveManager.getPursuitRecoveryMultiplier();
      this.state.pursuitPressure = Math.max(
        5,
        this.state.pursuitPressure - (isPerfect ? 18 : 10) * coolingMult
      );

      audioManager.playTheftResult(isPerfect ? 'PERFECT' : 'NORMAL');
      this.spawnParticleBurst(
        new THREE.Vector3(this.playerX, this.playerY + 1.5, this.theftPropZ),
        0xfbbf24,
        20
      );

      // Unlock next vehicle tier if applicable
      if (enc.unlocksStage) {
        this.syncStageModels(enc.unlocksStage);
      }
      this.nextVehicleTargetIndex += 1;

      // Advance tutorial steps
      if (this.state.tutorialStep === TutorialStep.STEAL_WALLET) {
        this.state.tutorialStep = TutorialStep.COLLECT_COINS;
        this.state.tutorialPrompt =
          'STEP 4/6 — Coin Rush unlocked! Collect gold & ruby coins while police attacks pause.';
      } else if (this.state.tutorialStep === TutorialStep.STEAL_VEHICLE) {
        this.state.tutorialStep = TutorialStep.USE_GADGET;
        this.state.tutorialPrompt =
          'STEP 6/6 — Tap the bottom Gadget button (or press E) to toss a distraction at the police!';
      }

      this.showBanner(
        isPerfect ? 'PERFECT HEIST! +400 PTS' : 'SUCCESSFUL THEFT! +250 PTS',
        enc.unlocksStage
          ? `Hijacked ${enc.unlocksStage} & earned +${bonusCoins} Coins!`
          : `Snatched loot & earned +${bonusCoins} Coins!`,
        isPerfect ? 'emerald' : 'gold'
      );
    } else {
      // Wrong gesture
      this.handleTheftFailure('Wrong gesture! Police closed the gap!');
    }

    window.setTimeout(() => {
      this.endTheftPhase();
    }, 420);
  }

  private handleTheftFailure(reason: string): void {
    const enc = this.state.activeTheft;
    if (!enc) return;
    enc.resolved = true;
    enc.outcome = TheftOutcome.FAILURE;

    audioManager.playTheftResult('FAILURE');
    this.cameraShake = 0.45;
    this.state.pursuitPressure = Math.min(100, this.state.pursuitPressure + 26);

    if (this.state.pursuitPressure >= 100 || enc.isCritical) {
      this.triggerCapture('Caught red-handed during a critical heist!');
      return;
    }

    this.showBanner('THEFT BUNGLED!', reason, 'crimson');
  }

  private endTheftPhase(): void {
    if (this.theftPropGroup) {
      this.scene.remove(this.theftPropGroup);
      this.theftPropGroup = null;
    }
    if (this.state.gameState === GameState.GAME_OVER) return;

    this.state.activeTheft = null;

    // If tutorial step 4 is active, immediately launch Coin Rush to teach collection
    if (this.state.tutorialStep === TutorialStep.COLLECT_COINS) {
      this.beginCoinRushPhase();
      return;
    }

    this.state.activePhase = GameplayPhase.ESCAPE;
    this.state.gameState =
      this.state.locomotionStage === LocomotionStage.BALLOON
        ? GameState.BALLOON_CHASE
        : GameState.ESCAPE;
    this.lastPhaseType = GameplayPhase.THEFT;
    this.nextPhaseTriggerDistance = this.state.distance + 85;
    this.invulnerableTimer = 1.6;
    this.emitTelemetry();
  }

  /**
   * Begins a dedicated Coin Rush Bonus Phase (GDD Section 2.3)
   */
  private beginCoinRushPhase(): void {
    this.city.clearObstaclesOnly();
    this.state.activePhase = GameplayPhase.COIN_RUSH;
    this.state.gameState = GameState.COIN_RUSH;
    this.state.phaseTotalDuration = 9.0;
    this.state.phaseTimeRemaining = 9.0;
    this.state.phaseCoinsEarned = 0;

    // Populate coins immediately ahead of the player
    for (let i = 1; i <= 4; i++) {
      this.city.spawnCoinRushSegment(this.playerZ - i * 22, this.state.locomotionStage);
    }

    audioManager.playPhaseTransition(GameplayPhase.COIN_RUSH);
    this.showBanner(
      'COIN RUSH BONUS PHASE!',
      'Obstacles paused — collect every gold & ruby coin!',
      'gold'
    );
    this.emitTelemetry();
  }

  private endCoinRushPhase(): void {
    const earned = this.state.phaseCoinsEarned;
    this.city.clearAllObstaclesAndCoins();
    this.state.activePhase = GameplayPhase.ESCAPE;
    this.state.gameState =
      this.state.locomotionStage === LocomotionStage.BALLOON
        ? GameState.BALLOON_CHASE
        : GameState.ESCAPE;
    this.lastPhaseType = GameplayPhase.COIN_RUSH;
    this.nextPhaseTriggerDistance = this.state.distance + 95;
    this.invulnerableTimer = 1.5;

    if (this.state.tutorialStep === TutorialStep.COLLECT_COINS) {
      this.state.tutorialStep = TutorialStep.STEAL_VEHICLE;
      this.state.tutorialPrompt =
        'STEP 5/6 — Next up: Hijack the parked motorcycle to outrun police cruisers!';
      this.nextPhaseTriggerDistance = this.state.distance + 40;
    }

    this.showBanner(
      `COIN RUSH COMPLETE! +${earned} COINS`,
      'Returning to Escape Phase — watch out for police!',
      'emerald'
    );
    audioManager.playPhaseTransition(GameplayPhase.ESCAPE);
    this.emitTelemetry();
  }

  /**
   * Contextual Balloon Leave / Reattach system (GDD Section 5.1)
   */
  private executeBalloonContextAction(): void {
    const opp = this.state.balloonOpportunity;
    if (!opp) return;

    this.state.balloonOpportunity = null;
    this.balloonContextCooldown = 18;
    audioManager.playPhaseTransition(GameplayPhase.ESCAPE);

    if (opp.type === 'DESCEND_TO_STREET') {
      this.syncStageModels(LocomotionStage.CAR);
      this.city.clearObstaclesOnly();
      this.invulnerableTimer = 1.8;
      this.state.score += 150;
      this.showBanner(
        'PARACHUTE DROP TO STREET!',
        'Dodged aerial choppers & hijacked a street cruiser (+150 pts)',
        'sky'
      );
    } else {
      this.syncStageModels(LocomotionStage.BALLOON);
      this.city.clearObstaclesOnly();
      this.invulnerableTimer = 1.8;
      this.state.score += 200;
      this.showBanner(
        'BALLOON ROPE REATTACHED!',
        'Climbed back into the Sky Burglar basket (+200 pts)',
        'gold'
      );
    }
  }

  private triggerCapture(reason: string): void {
    this.state.pursuitState = PursuitState.CAUGHT;
    this.state.gameState = GameState.GAME_OVER;
    this.state.activeTheft = null;
    this.state.balloonOpportunity = null;
    this.state.captureReason = reason;

    const finalScore = Math.floor(this.state.score + this.state.distance);
    this.state.score = finalScore;

    const { isNewBest } = saveManager.recordRunResult({
      score: finalScore,
      distance: Math.floor(this.state.distance),
      coinsEarned: this.state.runCoins,
      thefts: this.state.successfulThefts,
      highestStage: this.state.highestStageReached,
    });
    this.state.isNewPersonalBest = isNewBest;

    audioManager.playGameOver(isNewBest);
    this.emitTelemetry();
  }

  private showBanner(
    text: string,
    subtext: string,
    tone: 'gold' | 'emerald' | 'crimson' | 'sky'
  ): void {
    this.state.statusBanner = {
      text,
      subtext,
      tone,
      id: this.bannerCounter++,
    };
  }

  private spawnParticleBurst(pos: THREE.Vector3, colorHex: number, count: number): void {
    if (saveManager.getData().settings.reducedMotion) return;
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sharedParticleGeo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 2,
          (Math.random() - 0.5) * 8
        ),
        age: 0,
        maxAge: 0.45 + Math.random() * 0.25,
      });
    }
  }

  /**
   * Software-WebGL compatible frame scheduler per Three.js skill
   */
  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    // Clamp delta time to 50ms max as required
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.updateSimulation(dt);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private updateSimulation(dt: number): void {
    this.animTime += dt;

    // 1. Menu / Idle Diorama Animation
    if (
      this.state.gameState === GameState.MAIN_MENU ||
      this.state.gameState === GameState.UPGRADE_SHOP ||
      this.state.gameState === GameState.SETTINGS
    ) {
      this.animateCharacterLimbs(this.thiefRig, this.animTime * 3.5, 0.35);
      this.animateCharacterLimbs(this.policeOfficer1, this.animTime * 4.2, 0.45);

      const camX = Math.sin(this.animTime * 0.55) * 1.4;
      _camTargetPos.set(camX, 2.35, 4.6);
      this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-5 * dt));
      _camLookAt.set(0.1, 1.35, -1.2);
      this.camera.lookAt(_camLookAt);
      return;
    }

    if (this.state.gameState === GameState.PAUSED) {
      return;
    }

    if (this.state.gameState === GameState.GAME_OVER) {
      // Comical capture camera orbit
      const angle = this.animTime * 0.7;
      _camTargetPos.set(
        this.playerX + Math.sin(angle) * 4.8,
        this.playerY + 2.6,
        this.playerZ + Math.cos(angle) * 4.8
      );
      this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-4 * dt));
      _camLookAt.set(this.playerX, this.playerY + 1.2, this.playerZ);
      this.camera.lookAt(_camLookAt);
      return;
    }

    // 2. Hitstop on Heavy Impact
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.policeStunTimer > 0) this.policeStunTimer -= dt;
    if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt * 1.8);

    // 3. Recharge Gadget Cooldown
    if (this.state.gadgetCharges < this.state.maxGadgetCharges) {
      const cdSec = saveManager.getGadgetCooldownSeconds();
      this.state.gadgetCooldownProgress += dt / cdSec;
      if (this.state.gadgetCooldownProgress >= 1) {
        this.state.gadgetCharges += 1;
        this.state.gadgetCooldownProgress =
          this.state.gadgetCharges < this.state.maxGadgetCharges ? 0 : 1;
      }
    }

    // 4. Dynamic Day-to-Sunset-to-Twilight Atmosphere Progression
    this.updateAtmosphereLighting();

    // 5. Phase-Specific Updates
    const stageSpeedBase =
      this.state.locomotionStage === LocomotionStage.FOOT
        ? 15.0
        : this.state.locomotionStage === LocomotionStage.MOTORCYCLE
        ? 20.5
        : this.state.locomotionStage === LocomotionStage.CAR
        ? 25.0
        : 21.5;

    const difficultyFactor = Math.min(1, this.state.distance / 1400);
    this.forwardSpeed = stageSpeedBase + difficultyFactor * 5.5;

    if (this.state.activePhase === GameplayPhase.THEFT) {
      // Slow-motion focused theft encounter
      if (this.state.activeTheft && !this.state.activeTheft.resolved) {
        this.state.activeTheft.elapsed += dt;
        this.state.phaseTimeRemaining = Math.max(
          0,
          this.state.activeTheft.totalDuration - this.state.activeTheft.elapsed
        );
        if (this.state.activeTheft.elapsed >= this.state.activeTheft.totalDuration) {
          this.handleTheftFailure('Too slow! Missed the theft window!');
          window.setTimeout(() => this.endTheftPhase(), 420);
        }
      }
      // Subtle slow-motion approach drift
      this.playerZ -= dt * 2.2;
    } else {
      // Forward locomotion in ESCAPE or COIN_RUSH
      const stepZ = this.forwardSpeed * dt;
      this.playerZ -= stepZ;
      this.state.distance += stepZ * 0.45; // Scale to readable metres

      // Gradual passive pursuit cooling when running cleanly
      if (this.state.activePhase === GameplayPhase.ESCAPE) {
        const cooling = 0.85 * saveManager.getPursuitRecoveryMultiplier();
        this.state.pursuitPressure = Math.max(8, this.state.pursuitPressure - cooling * dt);
      }

      if (this.state.activePhase === GameplayPhase.COIN_RUSH) {
        this.state.phaseTimeRemaining -= dt;
        if (this.state.phaseTimeRemaining <= 0) {
          this.endCoinRushPhase();
        }
      }
    }

    // 6. Lateral Lane Damping & Vertical Jump/Slide Physics
    const targetX = this.playerLane * LANE_WIDTH;
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 14, dt);

    if (this.isJumping) {
      this.playerY += this.verticalVelocity * dt;
      this.verticalVelocity -= 26.5 * dt;
      if (this.playerY <= this.baseGroundY) {
        this.playerY = this.baseGroundY;
        this.verticalVelocity = 0;
        this.isJumping = false;
      }
    } else {
      this.playerY = THREE.MathUtils.damp(this.playerY, this.baseGroundY, 10, dt);
    }

    if (this.slideTimer > 0) {
      this.slideTimer -= dt;
      this.thiefRig.bodyGroup.scale.y = THREE.MathUtils.damp(
        this.thiefRig.bodyGroup.scale.y,
        0.55,
        18,
        dt
      );
    } else {
      this.thiefRig.bodyGroup.scale.y = THREE.MathUtils.damp(
        this.thiefRig.bodyGroup.scale.y,
        1.0,
        16,
        dt
      );
    }

    // Update Player Root Transform & Lean
    const lateralDelta = targetX - this.playerX;
    this.playerRoot.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRoot.rotation.set(0, Math.PI, lateralDelta * 0.14);

    // Animate Thief Limbs & Loot Sack Bounce
    this.animateCharacterLimbs(
      this.thiefRig,
      this.animTime * (this.state.locomotionStage === LocomotionStage.FOOT ? 13 : 4),
      this.state.locomotionStage === LocomotionStage.FOOT ? 0.85 : 0.15
    );

    // 7. Update Procedural City, Obstacles & Coin Magnet Collection
    const nearTransition =
      this.state.activePhase === GameplayPhase.ESCAPE &&
      this.nextPhaseTriggerDistance - this.state.distance < 22;

    this.city.update(
      this.playerZ,
      this.state.activePhase,
      this.state.locomotionStage,
      difficultyFactor,
      !nearTransition
    );

    this.checkObstacleCollisions();
    this.checkCoinCollection(dt);
    this.updateProjectilesAndParticles(dt);
    this.updatePolicePursuit(dt);
    this.updatePhaseScheduler(dt);

    // Keep Directional Light shadow frustum locked onto Player
    this.dirLight.position.set(this.playerX + 14, this.playerY + 28, this.playerZ + 16);
    this.dirLight.target.position.set(this.playerX, this.playerY, this.playerZ - 8);
    this.dirLight.target.updateMatrixWorld();

    // 8. Smooth Camera Choreography (Slow-Mo Zoom in THEFT, Aerial pullback in BALLOON)
    this.updateCameraChoreography(dt);

    // 9. Update Procedural Audio Loop
    audioManager.updateLoopState(
      this.state.pursuitPressure,
      this.state.activePhase,
      this.state.locomotionStage,
      dt
    );

    this.emitTelemetry();
  }

  private updateAtmosphereLighting(): void {
    // Smoothly shift from Bright Mediterranean Day (0-350m) -> Golden Sunset (350-800m) -> Twilight Aerial Sky (800m+)
    const d = this.state.distance;
    if (d < 350) {
      const t = d / 350;
      _currentSkyColor.copy(_skyDayColor).lerp(_skySunsetColor, t * 0.65);
    } else if (d < 850) {
      const t = (d - 350) / 500;
      _currentSkyColor.copy(_skySunsetColor).lerp(_skyNightColor, t);
    } else {
      _currentSkyColor.copy(_skyNightColor);
    }

    (this.scene.background as THREE.Color).copy(_currentSkyColor);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(_currentSkyColor);
    }
  }

  private updateCameraChoreography(dt: number): void {
    const isPortrait = this.camera.aspect < 1;
    const shakeX = (Math.random() - 0.5) * this.cameraShake;
    const shakeY = (Math.random() - 0.5) * this.cameraShake;

    if (this.state.activePhase === GameplayPhase.THEFT && this.theftPropGroup) {
      // Dramatic slow-motion over-the-shoulder zoom onto the Theft Target
      _camTargetPos.set(
        this.playerX * 0.75 + 1.45 + shakeX,
        this.playerY + 2.35 + shakeY,
        this.playerZ + (isPortrait ? 4.4 : 3.6)
      );
      _camLookAt.set(
        this.theftPropGroup.position.x,
        this.playerY + 1.35,
        this.theftPropZ
      );
    } else if (this.state.locomotionStage === LocomotionStage.BALLOON) {
      // Wide cinematic aerial chase view above city rooftops
      _camTargetPos.set(
        this.playerX * 0.6 + shakeX,
        this.playerY + (isPortrait ? 5.2 : 4.4) + shakeY,
        this.playerZ + (isPortrait ? 11.2 : 9.2)
      );
      _camLookAt.set(this.playerX * 0.5, this.playerY + 1.8, this.playerZ - 10);
    } else {
      // Third-person chase camera showing both the Thief and creeping Police when pressure is high
      const extraDist = this.state.locomotionStage === LocomotionStage.CAR ? 1.4 : 0;
      _camTargetPos.set(
        this.playerX * 0.65 + shakeX,
        this.playerY + (isPortrait ? 4.4 : 3.6) + shakeY,
        this.playerZ + (isPortrait ? 7.6 : 6.2) + extraDist
      );
      _camLookAt.set(this.playerX * 0.5, this.playerY + 1.3, this.playerZ - 9);
    }

    this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-9 * dt));
    this.camera.lookAt(_camLookAt);
  }

  private checkObstacleCollisions(): void {
    if (this.state.activePhase !== GameplayPhase.ESCAPE) return;

    for (const obs of this.city.obstacles) {
      if (obs.hit) continue;

      const dz = Math.abs(obs.worldZ - this.playerZ);
      const dx = Math.abs(obs.lane * LANE_WIDTH - this.playerX);

      // Near-miss bonus check when passing closely in an adjacent lane
      if (!obs.nearMissChecked && obs.worldZ > this.playerZ + 1.2) {
        obs.nearMissChecked = true;
        if (dx > 1.1 && dx < 2.95) {
          this.state.nearMisses += 1;
          this.state.score += 25;
        }
      }

      if (dz < 1.15 && dx < 1.05) {
        // Check if player successfully jumped over or slid under
        const jumpHeightAboveBase = this.playerY - this.baseGroundY;
        if (obs.requiresJump && jumpHeightAboveBase > 0.85) {
          continue; // Cleanly jumped over!
        }
        if (obs.requiresSlide && this.slideTimer > 0) {
          continue; // Cleanly slid under!
        }

        obs.hit = true;
        this.scene.remove(obs.mesh);

        if (this.invulnerableTimer > 0) continue;

        audioManager.playCollisionImpact();
        this.hitstopTimer = 0.055; // 55ms heavy impact hitstop
        this.cameraShake = 0.55;
        this.invulnerableTimer = 1.4;
        this.spawnParticleBurst(
          new THREE.Vector3(this.playerX, this.playerY + 1.0, this.playerZ),
          0xef4444,
          16
        );

        this.state.pursuitPressure = Math.min(100, this.state.pursuitPressure + 28);

        if (this.state.pursuitPressure >= 100) {
          this.triggerCapture('Crashed into a blockade while Police surrounded you!');
          return;
        }

        this.showBanner(
          'STUMBLED ON OBSTACLE!',
          '+28% Pursuit Pressure — Police are closing in!',
          'crimson'
        );
      }
    }
  }

  private checkCoinCollection(dt: number): void {
    const magnetRadius = saveManager.getCoinMagnetRadius();

    for (const coin of this.city.coins) {
      if (coin.collected) continue;

      const dx = this.playerX - coin.worldX;
      const dy = this.playerY + 1.0 - coin.worldY;
      const dz = this.playerZ - coin.worldZ;
      const dist = Math.hypot(dx, dy, dz);

      // Magnet pull toward thief's loot sack
      if (dist < magnetRadius) {
        coin.worldX = THREE.MathUtils.damp(coin.worldX, this.playerX, 14, dt);
        coin.worldY = THREE.MathUtils.damp(coin.worldY, this.playerY + 1.1, 14, dt);
        coin.worldZ = THREE.MathUtils.damp(coin.worldZ, this.playerZ, 14, dt);
        coin.mesh.position.set(coin.worldX, coin.worldY, coin.worldZ);
      }

      if (dist < 1.45) {
        coin.collected = true;
        this.scene.remove(coin.mesh);

        const coinValue = coin.isBonus ? 5 : 1;
        const scoreValue = coin.isBonus ? 50 : 10;

        this.state.runCoins += coinValue;
        this.state.phaseCoinsEarned += coinValue;
        this.state.score += scoreValue;
        if (coin.isBonus) {
          this.state.bonusCoinsCollected += 1;
        } else {
          this.state.standardCoinsCollected += 1;
        }

        audioManager.playCoinCollect(coin.isBonus);
        this.spawnParticleBurst(
          new THREE.Vector3(coin.worldX, coin.worldY, coin.worldZ),
          coin.isBonus ? 0xf43f5e : 0xfbbf24,
          6
        );
      }
    }
  }

  private updateProjectilesAndParticles(dt: number): void {
    this.projectiles = this.projectiles.filter((p) => {
      p.age += dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      if (p.age >= p.maxAge) {
        this.scene.remove(p.mesh);
        return false;
      }
      return true;
    });

    this.particles = this.particles.filter((pt) => {
      pt.age += dt;
      pt.mesh.position.addScaledVector(pt.velocity, dt);
      pt.velocity.y -= 14 * dt;
      const s = Math.max(0.01, 1 - pt.age / pt.maxAge);
      pt.mesh.scale.setScalar(s);
      if (pt.age >= pt.maxAge) {
        this.scene.remove(pt.mesh);
        return false;
      }
      return true;
    });
  }

  /**
   * Escalating Police Pursuit Director (GDD Section 9)
   */
  private updatePolicePursuit(dt: number): void {
    const p = this.state.pursuitPressure;
    if (p < 25) this.state.pursuitState = PursuitState.SEARCHING;
    else if (p < 48) this.state.pursuitState = PursuitState.CHASING;
    else if (p < 68) this.state.pursuitState = PursuitState.INTERCEPTING;
    else if (p < 85) this.state.pursuitState = PursuitState.REINFORCING;
    else this.state.pursuitState = PursuitState.CRITICAL;

    // Hide police during Coin Rush so they never interfere with collection
    if (this.state.activePhase === GameplayPhase.COIN_RUSH) {
      this.policeRoot.visible = false;
      return;
    }
    this.policeRoot.visible = true;

    const stunOffset = this.policeStunTimer > 0 ? 5.5 : 0;
    // Distance behind player scales inversely with pursuitPressure
    const followBackZ = THREE.MathUtils.mapLinear(p, 0, 100, 7.2, 2.1) + stunOffset;
    const targetPoliceZ = this.playerZ + followBackZ;

    this.policeRoot.position.x = THREE.MathUtils.damp(
      this.policeRoot.position.x,
      this.playerX,
      6,
      dt
    );
    this.policeRoot.position.y = this.baseGroundY;
    this.policeRoot.position.z = THREE.MathUtils.damp(
      this.policeRoot.position.z,
      targetPoliceZ,
      8,
      dt
    );

    const stage = this.state.locomotionStage;
    this.policeOfficer1.root.visible = stage === LocomotionStage.FOOT;
    this.policeOfficer2.root.visible = stage === LocomotionStage.FOOT && p >= 42;
    this.policeBikeMesh.visible = stage === LocomotionStage.MOTORCYCLE;
    this.policeCarMesh.visible = stage === LocomotionStage.CAR;
    this.policeHelicopter.root.visible = stage === LocomotionStage.BALLOON;

    if (stage === LocomotionStage.FOOT) {
      this.policeOfficer1.root.position.set(0, 0, 0);
      this.policeOfficer1.root.rotation.y = Math.PI;
      this.animateCharacterLimbs(this.policeOfficer1, this.animTime * 14, 0.9);

      if (this.policeOfficer2.root.visible) {
        this.policeOfficer2.root.position.set(1.25, 0, 0.8);
        this.policeOfficer2.root.rotation.y = Math.PI;
        this.animateCharacterLimbs(this.policeOfficer2, this.animTime * 14 + 1.5, 0.9);
      }
    } else if (stage === LocomotionStage.MOTORCYCLE) {
      this.policeBikeMesh.rotation.y = 0;
    } else if (stage === LocomotionStage.CAR) {
      this.policeCarMesh.rotation.y = 0;
    } else if (stage === LocomotionStage.BALLOON) {
      this.policeHelicopter.root.position.set(
        Math.sin(this.animTime * 1.6) * 2.4,
        3.2,
        -1.5
      );
      this.policeHelicopter.root.rotation.y = Math.PI;
      this.policeHelicopter.mainRotor.rotation.y += dt * 24;
    }
  }

  /**
   * Weighted Phase Scheduler & Contextual Balloon Opportunity Director (GDD Section 2.4 & 5.1)
   */
  private updatePhaseScheduler(dt: number): void {
    if (this.state.activePhase !== GameplayPhase.ESCAPE) return;

    // Contextual Balloon Descend / Reattach opportunity after unlocking Balloon stage
    if (this.nextVehicleTargetIndex >= 4) {
      this.balloonContextCooldown -= dt;
      if (this.balloonContextCooldown <= 0 && !this.state.balloonOpportunity) {
        this.balloonContextCooldown = 22;
        if (this.state.locomotionStage === LocomotionStage.BALLOON) {
          this.state.balloonOpportunity = {
            type: 'DESCEND_TO_STREET',
            label: 'SAFE LANDING ZONE BELOW — SWIPE DOWN (OR S) TO PARACHUTE TO STREET!',
            requiredGesture: GestureType.SWIPE_DOWN,
            timeRemaining: 5.0,
          };
        } else {
          this.state.balloonOpportunity = {
            type: 'REATTACH_BALLOON',
            label: 'LOW-FLYING SKY BALLOON AHEAD — SWIPE UP (OR SPACE) TO REATTACH ROPE!',
            requiredGesture: GestureType.SWIPE_UP,
            timeRemaining: 5.0,
          };
        }
      }
    }

    if (this.state.balloonOpportunity) {
      this.state.balloonOpportunity.timeRemaining -= dt;
      if (this.state.balloonOpportunity.timeRemaining <= 0) {
        this.state.balloonOpportunity = null;
      }
    }

    // Do not start a new phase while mid-jump
    if (this.isJumping) return;

    if (this.state.distance >= this.nextPhaseTriggerDistance) {
      // Alternate cleanly between Theft and Coin Rush so phases never repeat back-to-back without Escape recovery
      if (this.lastPhaseType === GameplayPhase.THEFT) {
        this.beginCoinRushPhase();
      } else {
        this.beginTheftPhase();
      }
    }
  }

  private animateCharacterLimbs(
    rig: AnimatedCharacterRig,
    phase: number,
    amplitude: number
  ): void {
    rig.leftLeg.rotation.x = Math.sin(phase) * amplitude;
    rig.rightLeg.rotation.x = -Math.sin(phase) * amplitude;
    rig.leftArm.rotation.x = -Math.sin(phase) * amplitude * 0.85;
    rig.rightArm.rotation.x = Math.sin(phase) * amplitude * 0.85;
    rig.headGroup.rotation.z = Math.cos(phase * 0.5) * 0.06;
    if (rig.lootSack) {
      rig.lootSack.rotation.z = Math.sin(phase) * 0.08;
    }
  }

  private handleResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 68 : 58;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      if (
        this.state.gameState === GameState.ESCAPE ||
        this.state.gameState === GameState.THEFT ||
        this.state.gameState === GameState.COIN_RUSH ||
        this.state.gameState === GameState.BALLOON_CHASE
      ) {
        this.togglePause();
      }
    } else {
      this.lastTimestamp = performance.now();
    }
  };

  private emitTelemetry(): void {
    this.onTelemetry({ ...this.state });
  }

  public dispose(): void {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.inputManager.dispose();
    audioManager.stopRunLoop();
    this.materials.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
