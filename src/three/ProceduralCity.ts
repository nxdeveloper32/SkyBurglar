import * as THREE from 'three';
import { GameplayPhase, LocomotionStage } from '../types/game';
import { MaterialsAndTextures } from './MaterialsAndTextures';

export const LANE_WIDTH = 2.6;
export const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH];
export const SEGMENT_LENGTH = 24;
export const ACTIVE_SEGMENTS_COUNT = 9;

export type ObstacleKind =
  | 'LOW_BARRIER' // Jump over (or dodge)
  | 'HIGH_AWNING' // Slide under (or dodge)
  | 'PARKED_VAN' // Full lane blocker (dodge left/right)
  | 'POLICE_ROADBLOCK' // High-pressure blocker
  | 'AERIAL_TOWER' // Balloon obstacle (dodge left/right)
  | 'AERIAL_CABLE'; // Balloon high/low obstacle

export interface ActiveObstacle {
  id: number;
  mesh: THREE.Group;
  lane: number; // -1, 0, 1
  worldZ: number;
  worldY: number;
  kind: ObstacleKind;
  requiresJump: boolean;
  requiresSlide: boolean;
  isAerial: boolean;
  hit: boolean;
  nearMissChecked: boolean;
}

export interface ActiveCoin {
  id: number;
  mesh: THREE.Mesh;
  lane: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  isBonus: boolean;
  collected: boolean;
}

export type SegmentTheme = 'MEDITERRANEAN' | 'DOWNTOWN' | 'ROOFTOP_SKYLINE';

interface PooledSegment {
  group: THREE.Group;
  zStart: number;
  theme: SegmentTheme;
}

export class SeededRandom {
  private state: number;

  constructor(seed = 1337420) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }

  public setSeed(seed: number): void {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }

  public next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export class ProceduralCity {
  private scene: THREE.Scene;
  private materials: MaterialsAndTextures;
  private rng = new SeededRandom(987654);

  private segments: PooledSegment[] = [];
  public obstacles: ActiveObstacle[] = [];
  public coins: ActiveCoin[] = [];

  private nextSegmentZ = 12;
  private nextEntityId = 1;

  // Shared Geometries & Materials for zero GC churn
  private stdCoinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 20);
  private bonusCoinGeo = new THREE.OctahedronGeometry(0.56, 0);
  private stdCoinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0x78350f,
    emissiveIntensity: 0.35,
  });
  private bonusCoinMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    roughness: 0.15,
    metalness: 0.85,
    emissive: 0x881337,
    emissiveIntensity: 0.45,
  });

  constructor(scene: THREE.Scene, materials: MaterialsAndTextures) {
    this.scene = scene;
    this.materials = materials;
    this.stdCoinGeo.rotateX(Math.PI / 2);
    this.initSegments();
  }

  private initSegments(): void {
    for (let i = 0; i < ACTIVE_SEGMENTS_COUNT; i++) {
      const theme: SegmentTheme = i % 2 === 0 ? 'MEDITERRANEAN' : 'DOWNTOWN';
      const group = this.buildSegmentGroup(theme);
      const zStart = 12 - i * SEGMENT_LENGTH;
      group.position.z = zStart;
      this.scene.add(group);
      this.segments.push({ group, zStart, theme });
    }
    this.nextSegmentZ = 12 - ACTIVE_SEGMENTS_COUNT * SEGMENT_LENGTH;
  }

  public reset(seed = Date.now()): void {
    this.rng.setSeed(seed);
    this.clearAllObstaclesAndCoins();

    for (let i = 0; i < this.segments.length; i++) {
      const zStart = 12 - i * SEGMENT_LENGTH;
      this.segments[i].zStart = zStart;
      this.segments[i].group.position.z = zStart;
    }
    this.nextSegmentZ = 12 - this.segments.length * SEGMENT_LENGTH;
  }

  public clearAllObstaclesAndCoins(): void {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];

    for (const c of this.coins) {
      this.scene.remove(c.mesh);
    }
    this.coins = [];
  }

  public clearObstaclesOnly(): void {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];
  }

  /**
   * Builds a rich stylized 3D city road segment combining elements from the user's
   * Mediterranean town (warm stucco, red awnings, potted topiaries) and
   * Modern Cartoon City (utility poles, fire hydrants, trash bins, glass towers).
   */
  private buildSegmentGroup(theme: SegmentTheme): THREE.Group {
    const group = new THREE.Group();

    // 1. Road Surface (3 Lanes)
    const roadGeo = new THREE.PlaneGeometry(LANE_WIDTH * 3 + 1.4, SEGMENT_LENGTH);
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.materials.roadAsphaltTexture,
      roughness: 0.8,
      metalness: 0.08,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -SEGMENT_LENGTH / 2);
    road.receiveShadow = true;
    group.add(road);

    // 2. Left & Right Elevated Sidewalks
    const walkGeo = new THREE.BoxGeometry(5.5, 0.28, SEGMENT_LENGTH);
    const walkMat = new THREE.MeshStandardMaterial({
      color: theme === 'MEDITERRANEAN' ? 0xe7e5e4 : 0xcbd5e1,
      roughness: 0.85,
    });
    [-7.35, 7.35].forEach((sx) => {
      const sidewalk = new THREE.Mesh(walkGeo, walkMat);
      sidewalk.position.set(sx, 0.14, -SEGMENT_LENGTH / 2);
      sidewalk.receiveShadow = true;
      group.add(sidewalk);
    });

    // 3. Buildings & Street Props along both flanks
    const medMat = new THREE.MeshStandardMaterial({
      map: this.materials.buildingFacadeMedTexture,
      roughness: 0.75,
    });
    const modernMat = new THREE.MeshStandardMaterial({
      map: this.materials.buildingFacadeModernTexture,
      roughness: 0.4,
      metalness: 0.3,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      roughness: 0.65,
    });
    const awningMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.6,
    });
    const potMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });

    for (const side of [-1, 1]) {
      for (let b = 0; b < 3; b++) {
        const zCenter = -4 - b * 8;
        const isMed = theme === 'MEDITERRANEAN' || b % 2 === 0;
        const bHeight = isMed ? 6.8 + (b % 2) * 1.8 : 11.5 + (b % 3) * 3.5;
        const bWidth = 4.6;
        const bDepth = 7.4;

        const building = new THREE.Mesh(
          new THREE.BoxGeometry(bWidth, bHeight, bDepth),
          isMed ? medMat : modernMat
        );
        building.position.set(side * 8.1, bHeight / 2 + 0.28, zCenter);
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);

        if (isMed) {
          // Terracotta pitched roof cap
          const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.8, 4), roofMat);
          roof.rotation.y = Math.PI / 4;
          roof.position.set(side * 8.1, bHeight + 1.15, zCenter);
          group.add(roof);

          // Red shopfront awning facing street
          const awning = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 3.2), awningMat);
          awning.position.set(side * 5.4, 2.75, zCenter);
          awning.rotation.z = side * 0.28;
          group.add(awning);

          // Potted topiary shrub by shop door
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.45, 10), potMat);
          pot.position.set(side * 5.2, 0.5, zCenter + 2.2);
          group.add(pot);

          const bush = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 10), bushMat);
          bush.position.set(side * 5.2, 1.15, zCenter + 2.2);
          group.add(bush);
        } else {
          // Clocktower spire on selected tall buildings (from 5th reference image)
          if (b === 1 && side === 1) {
            const spire = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4.2, 4), roofMat);
            spire.rotation.y = Math.PI / 4;
            spire.position.set(side * 8.1, bHeight + 2.3, zCenter);
            group.add(spire);
          }
        }
      }

      // Streetlamp / Utility pole + Red Fire Hydrant on sidewalk edge
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.12, 5.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 })
      );
      pole.position.set(side * 4.9, 2.8, -12);
      group.add(pole);

      const lampBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      lampBulb.position.set(side * 4.3, 5.2, -12);
      group.add(lampBulb);

      if (side === -1) {
        const hydrant = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.22, 0.68, 10),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
        );
        hydrant.position.set(-4.85, 0.62, -6);
        group.add(hydrant);
      }
    }

    return group;
  }

  /**
   * Advances segment pool and spawns fair obstacles or Coin Rush arcs
   */
  public update(
    playerZ: number,
    phase: GameplayPhase,
    stage: LocomotionStage,
    difficultyFactor: number, // 0 to 1
    allowSpawning: boolean
  ): void {
    // 1. Recycle segments that have passed behind the camera (playerZ + 22)
    for (const seg of this.segments) {
      if (seg.zStart - SEGMENT_LENGTH > playerZ + 20) {
        seg.zStart = this.nextSegmentZ;
        seg.group.position.z = seg.zStart;
        this.nextSegmentZ -= SEGMENT_LENGTH;

        if (allowSpawning) {
          this.populateRecycledSegment(seg.zStart, phase, stage, difficultyFactor);
        }
      }
    }

    // 2. Clean up passed obstacles & coins
    this.obstacles = this.obstacles.filter((obs) => {
      if (obs.worldZ > playerZ + 12) {
        this.scene.remove(obs.mesh);
        return false;
      }
      return true;
    });

    this.coins = this.coins.filter((c) => {
      if (c.collected || c.worldZ > playerZ + 10) {
        this.scene.remove(c.mesh);
        return false;
      }
      c.mesh.rotation.y += 0.06;
      return true;
    });
  }

  private populateRecycledSegment(
    zStart: number,
    phase: GameplayPhase,
    stage: LocomotionStage,
    difficultyFactor: number
  ): void {
    // MUTUAL EXCLUSIVITY RULE (GDD Section 2):
    // - THEFT phase: Neither running obstacles nor coin lines spawn
    if (phase === GameplayPhase.THEFT) return;

    // - COIN RUSH phase: Only coins and bonus coins spawn; obstacles & police blocks are disabled
    if (phase === GameplayPhase.COIN_RUSH) {
      this.spawnCoinRushSegment(zStart, stage);
      return;
    }

    // - ESCAPE phase: Only survival obstacles spawn; ordinary coins are disabled
    this.spawnEscapeObstaclesSegment(zStart, stage, difficultyFactor);
  }

  private spawnEscapeObstaclesSegment(
    zStart: number,
    stage: LocomotionStage,
    difficultyFactor: number
  ): void {
    const isBalloon = stage === LocomotionStage.BALLOON;
    const rowsInSegment = difficultyFactor > 0.45 ? 2 : 1;

    for (let r = 0; r < rowsInSegment; r++) {
      const rowZ = zStart - 7 - r * 11;

      // Guarantee fairness: always pick at least 1 guaranteed safe open lane
      const safeLaneIndex = this.rng.nextInt(0, 2); // 0, 1, or 2
      const numBlockedLanes = this.rng.next() < 0.35 + difficultyFactor * 0.4 ? 2 : 1;

      const candidateLanes = [0, 1, 2].filter((idx) => idx !== safeLaneIndex);
      for (let b = 0; b < numBlockedLanes && b < candidateLanes.length; b++) {
        const laneIdx = candidateLanes[b];
        const lane = laneIdx - 1; // -1, 0, or 1
        this.spawnSingleObstacle(lane, rowZ, isBalloon, stage);
      }
    }
  }

  public spawnSingleObstacle(
    lane: number,
    worldZ: number,
    isBalloon: boolean,
    stage: LocomotionStage
  ): void {
    const x = lane * LANE_WIDTH;
    const roll = this.rng.next();

    let kind: ObstacleKind = 'LOW_BARRIER';
    let requiresJump = true;
    let requiresSlide = false;
    let worldY = 0;

    if (isBalloon) {
      if (roll < 0.55) {
        kind = 'AERIAL_TOWER';
        requiresJump = false;
        requiresSlide = false;
      } else {
        kind = 'AERIAL_CABLE';
        requiresJump = true;
        requiresSlide = false;
      }
      worldY = 10.5;
    } else if (stage === LocomotionStage.FOOT) {
      if (roll < 0.42) {
        kind = 'LOW_BARRIER';
        requiresJump = true;
      } else if (roll < 0.76) {
        kind = 'HIGH_AWNING';
        requiresJump = false;
        requiresSlide = true;
      } else {
        kind = 'PARKED_VAN';
        requiresJump = false;
        requiresSlide = false;
      }
    } else {
      // Motorcycle or Car stage
      if (roll < 0.45) {
        kind = 'LOW_BARRIER';
        requiresJump = true;
      } else if (roll < 0.78) {
        kind = 'PARKED_VAN';
        requiresJump = false;
      } else {
        kind = 'POLICE_ROADBLOCK';
        requiresJump = false;
      }
    }

    const mesh = this.createObstacleMesh(kind);
    mesh.position.set(x, worldY, worldZ);
    this.scene.add(mesh);

    this.obstacles.push({
      id: this.nextEntityId++,
      mesh,
      lane,
      worldZ,
      worldY,
      kind,
      requiresJump,
      requiresSlide,
      isAerial: isBalloon,
      hit: false,
      nearMissChecked: false,
    });
  }

  private createObstacleMesh(kind: ObstacleKind): THREE.Group {
    const group = new THREE.Group();

    if (kind === 'LOW_BARRIER') {
      // Orange & White Striped Construction Sawhorse + Cones (Jumpable)
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.42, 0.35),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 })
      );
      bar.position.y = 0.72;
      bar.castShadow = true;
      group.add(bar);

      [-0.75, 0.75].forEach((lx) => {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.9, 0.25),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
        );
        leg.position.set(lx, 0.45, 0);
        group.add(leg);
      });
    } else if (kind === 'HIGH_AWNING') {
      // Elevated Overhead Scaffolding / Crossbar (Slide under!)
      const topBeam = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.75, 0.55),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
      );
      topBeam.position.y = 1.68;
      topBeam.castShadow = true;
      group.add(topBeam);

      [-0.95, 0.95].forEach((px) => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 })
        );
        post.position.set(px, 1.0, 0);
        group.add(post);
      });
    } else if (kind === 'PARKED_VAN' || kind === 'POLICE_ROADBLOCK') {
      const isPolice = kind === 'POLICE_ROADBLOCK';
      const van = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 1.85, 3.3),
        new THREE.MeshStandardMaterial({
          color: isPolice ? 0x1e3a8a : 0xf8fafc,
          roughness: 0.35,
          metalness: 0.3,
        })
      );
      van.position.y = 1.05;
      van.castShadow = true;
      group.add(van);

      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 0.6, 3.36),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 })
      );
      glass.position.y = 1.45;
      group.add(glass);

      if (isPolice) {
        const siren = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.2, 0.3),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        siren.position.y = 2.08;
        group.add(siren);
      }
    } else if (kind === 'AERIAL_TOWER') {
      // Rooftop Clocktower / Radio Mast extending into Balloon flight path
      const spire = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 8.0, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
      );
      spire.position.y = -1.5;
      group.add(spire);

      const roofCone = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 2.8, 4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
      );
      roofCone.rotation.y = Math.PI / 4;
      roofCone.position.y = 3.8;
      group.add(roofCone);
    } else if (kind === 'AERIAL_CABLE') {
      // Aerial Wind Gust / Warning Banner Bar
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 2.3, 12),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f })
      );
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 0.6;
      group.add(bar);
    }

    return group;
  }

  /**
   * Spawns readable arcs and multi-lane lines of Standard & Bonus Coins during COIN RUSH
   */
  public spawnCoinRushSegment(zStart: number, stage: LocomotionStage): void {
    const baseY = stage === LocomotionStage.BALLOON ? 11.2 : 1.05;
    const primaryLane = this.rng.nextInt(-1, 1);
    const bonusLane = ((primaryLane + 2) % 3) - 1;

    // 7-coin primary arc
    for (let i = 0; i < 7; i++) {
      const z = zStart - 2 - i * 3.1;
      const isJumpArc = i >= 2 && i <= 4;
      const y = baseY + (isJumpArc ? Math.sin(((i - 1) / 4) * Math.PI) * 1.45 : 0);
      this.spawnSingleCoin(primaryLane, y, z, false);
    }

    // 3 High-value Ruby Bonus Coins on a secondary lane
    for (let j = 0; j < 3; j++) {
      const z = zStart - 6 - j * 4.2;
      this.spawnSingleCoin(bonusLane, baseY + 0.35, z, true);
    }
  }

  public spawnSingleCoin(lane: number, worldY: number, worldZ: number, isBonus: boolean): void {
    const worldX = lane * LANE_WIDTH;
    const mesh = new THREE.Mesh(
      isBonus ? this.bonusCoinGeo : this.stdCoinGeo,
      isBonus ? this.bonusCoinMat : this.stdCoinMat
    );
    mesh.position.set(worldX, worldY, worldZ);
    this.scene.add(mesh);

    this.coins.push({
      id: this.nextEntityId++,
      mesh,
      lane,
      worldX,
      worldY,
      worldZ,
      isBonus,
      collected: false,
    });
  }
}
