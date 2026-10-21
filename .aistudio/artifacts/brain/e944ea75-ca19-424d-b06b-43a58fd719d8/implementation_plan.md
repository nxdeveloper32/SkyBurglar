# The Great Getaway — 3D Endless Heist & Pursuit Game

**The Great Getaway** is a stylized 3D third-person endless arcade chase game built for both Windows desktop browsers (mouse and keyboard) and Android smartphone browsers (touch slide, swipe, and tap). Players step into the shoes of a mischievous masked cartoon thief escaping an escalating police pursuit across a vibrant procedural city—shifting cleanly between survival running, slow-motion quick-time vehicle thefts, and high-reward coin rushes all the way into the sky aboard a hot-air balloon.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core design choices have been confirmed from your answers and integrated with your Game Design Document (GDD) and visual reference artwork:

- **Confirmed Viewport & Framing**: **Portrait-first vertical runner layout** optimized for effortless one-handed thumb play on Android browsers, while expanding to a full-viewport 3D canvas on Windows desktop browsers with centered ergonomic HUD framing and wide peripheral city vistas.
- **Confirmed Atmosphere & Lighting**: **Dynamic day-to-sunset progression** as the pursuit escalates—starting in a bright, sun-drenched Mediterranean and modern cartoon town and transitioning into a warm golden-hour and twilight skyline illuminated by streetlamps, searchlights, and flashing police sirens during high-speed and aerial balloon stages.
- **Confirmed Tutorial & Onboarding**: **Interactive in-run prompts during the first 300m of play**, teaching lane dodges, jumps/slides, first wallet theft, coin collection, motorcycle hijacking, and stone distraction organically without locking players in a separate practice mode.
- **Confirmed Theft Phase Mechanics**: **Quick-time gesture target with slow-motion camera zoom**, temporarily suspending normal running obstacles so the camera frames the target (pedestrian wallet, motorcycle ignition, sports car door, or dangling hot-air balloon rope) with a crisp directional swipe or tap/click ring.

---

## 1. Overview & Core Concept

- **What It Does**: Delivers a 60fps WebGL 3D endless chase where running, stealing, and coin collecting operate as **three mutually exclusive gameplay phases** (`Escape`, `Theft`, and `Coin Rush`) governed by a deterministic phase director.
- **Target Audience / Persona**: Desktop and mobile web players looking for an immediately accessible, tactile 3D arcade runner with expressive cartoon characters, zero-clutter controls, and high replayability.
- **Key Value**: Solves the cognitive overload of typical endless runners by dedicating 100% of player focus to one clear objective at a time—dodging traffic and police during **Escape**, executing cinematic slow-motion heists during **Theft**, and carving through golden coin arcs during **Coin Rush**—while escalating across four distinct locomotion tiers (**On Foot → Motorcycle → Sports Car → Hot-Air Balloon**).

![Thief Reference](/assets/aistudio/image_0a368a0b.png)
![Police Officer Reference](/assets/aistudio/image_aedda6f0.png)

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Title Screen & Live 3D Diorama**:
   - Opens directly into a full-viewport live 3D city street diorama where the masked thief (in his signature black-and-grey striped sweater and oversized loot sack) peers around a corner while a determined cartoon police officer patrols in the background.
   - Features a bespoke inline SVG title lockup (**THE GREAT GETAWAY**), personal best distance/score readout, current coin balance, a prominent primary **Play** CTA (`Space`/`Enter` or Tap), and direct access to the **Upgrade Shop** and **Settings** drawers.
2. **In-Run Onboarding (0–300m)**:
   - Seamless contextual callouts guide the player through their first Left/Right lane dodge, Up/Down jump and slide, first slow-motion Wallet Theft, first Coin Rush corridor, first Motorcycle hijack, and first Stone distraction toss. Once completed, onboarding flags persist locally so veteran runs remain uninterrupted.
3. **Mutually Exclusive 3-Phase Core Loop**:
   - **Phase A — Escape**: Automatic forward locomotion across a 3-lane road and rooftop network. Ordinary coins and theft prompts are completely suppressed so the player focuses purely on dodging barriers, weaving through traffic, deploying arcade gadgets, and managing the **Pursuit Pressure Meter**.
   - **Phase B — Theft (Slow-Motion Quick-Time Zoom)**: Forward hazards pause and the camera dollys in on a highlighted target. A clear shrinking timing ring and directional swipe/click indicator appear. **Perfect**, **Normal**, **Partial**, or **Failed** outcomes determine whether the player smoothly hijacks the next vehicle tier (Motorcycle, Car, or Hot-Air Balloon rope) or suffers a pursuit pressure spike.
   - **Phase C — Coin Rush**: Police attacks and hazard collisions are suspended for a high-speed bonus sprint through dense, readable arcs of Standard Coins (10 pts / +1 coin) and ruby-rimmed Bonus Coins (50 pts / +5 coins), concluding with an animated loot tally banner before returning to Escape.
4. **4-Stage Vehicle & Aerial Progression**:
   - **Stage 1 (On Foot)**: Agile 3-lane sprinting, jumping over hydrants/barriers, sliding under café awnings, pursued by foot patrol officers.
   - **Stage 2 (Motorcycle)**: Faster forward velocity, leaning into lane switches, weaving past vans, pursued by police motorbikes.
   - **Stage 3 (Car)**: Wide muscle/sports car silhouette with glossy clearcoat paint, smashing light cones, earning near-miss bonuses, pursued by police cruisers and roadblocks.
   - **Stage 4 (Hot-Air Balloon Sky Chase)**: Triggered by a contextual upward swipe/jump to grab the dangling anchor rope of the striped `$` Sky Burglar balloon. The camera pulls back over the twilight city rooftops as police helicopters sweep searchlights across the sky and wind gusts, clock towers, and cables test aerial steering. Includes contextual **Jump Down** (descend to a safe street landing zone) and **Reattach** opportunities.
5. **Capture Climax, Game Over & Upgrade Loop**:
   - When pursuit pressure maxes out or a critical encounter fails, a comical capture sequence plays (police officer posing proudly beside the exasperated thief).
   - The **Game Over Modal** reveals animated tabular counters for Final Score, Distance (m), Coins Collected, Successful/Perfect Thefts, and Highest Stage Reached, paired with instant **Play Again** and **Upgrade Shop** buttons.

![Mediterranean Street Reference](/assets/aistudio/image_a26ec23f.png)
![Modern City Street Reference](/assets/aistudio/image_4b9c61a0.png)
![Sky Burglar Hot-Air Balloon Reference](/assets/aistudio/image_91993ce9.png)

### Visual Identity & Theme

- **Aesthetic Direction**: Vibrant, stylized cartoon 3D with physically based materials (`MeshStandardMaterial` and `MeshPhysicalMaterial`), composite multi-part procedural 3D character and vehicle assemblies inspired directly by your five reference images, and warm/cool studio lighting.
- **Color Palette & Mood**:
  - **Canvas & Sky Atmosphere**: Shifts smoothly with distance and pursuit stage—from Crisp Azure Day (`#38BDF8` sky, `#FDE68A` warm sunlight, terracotta `#C2410C` and cream `#FEF3C7` Mediterranean facades) to Golden Hour Sunset (`#FB923C` horizon, `#4C1D95` deep zenith) and Twilight Aerial Chase (`#0F172A` night sky, `#F59E0B` warm window glow, `#EF4444` & `#3B82F6` police strobes).
  - **UI Surface Tokens**: Deep obsidian carbon surfaces (`rgba(15, 23, 42, 0.88)`) with subtle thief-sweater diagonal stripe accents, metallic gold trim (`#F59E0B`) for coins and records, emerald (`#10B981`) for Perfect Theft feedback, and crimson (`#EF4444`) for high Pursuit Pressure warnings.
- **Typography & Hierarchy**:
  - **Display / Arcade Headers**: `Outfit` (Bold/ExtraBold, tight tracking) for phase banners, score popups, and modal headers.
  - **UI & Controls Body**: `Plus Jakarta Sans` (Medium/SemiBold) for upgrade descriptions, tutorial prompts, and menu actions.
  - **Telemetry & Score Readouts**: `JetBrains Mono` with `font-variant-numeric: tabular-nums` so rapidly ticking distance meters, coin counts, and cooldown timers never jitter horizontally.
- **Viewport Presence & Low-Occlusion HUD (<15% Footprint)**:
  - The 3D WebGL canvas fills `100vw × 100vh`.
  - In-game HUD is restricted to compact perimeter clusters (`pointer-events: none` on wrappers, zero CSS `backdrop-filter` over active WebGL to guarantee 60fps on mobile GPUs):
    - **Top-Left**: Tabular Score, Distance (`m`), and Coin counter.
    - **Top-Right**: Compact **Pursuit Pressure Meter** (chevron heat bar + police stage icon) and Pause button (`44×44px` minimum touch target).
    - **Top-Center**: Contextual Phase pill (`ESCAPE`, `THEFT OPPORTUNITY`, `COIN RUSH`) and non-intrusive 1-line tutorial prompt when active.
    - **Bottom-Center Thumb Zone**: Tactile **Gadget Action Button** showing current unlocked tier (**Stones → Smoke Bomb → Cartoon Grenade → Arcade Zapper Pistol**), charge pips, and radial cooldown sweep, positioned comfortably for one-handed mobile thumb reach or `E` / Right-Click / dedicated HUD click on desktop.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Strict Mutually Exclusive Phase Director vs. Simultaneous Runner Chaos**
  - *Chosen Approach*: A deterministic state machine where `Escape`, `Theft`, and `Coin Rush` never overlap. Entering `Theft` despawns/halts oncoming road hazards and zooms the camera onto the heist target; entering `Coin Rush` suspends police takedowns and replaces obstacles with pure reward lanes.
  - *Why*: Directly fulfills Section 2 of the GDD, ensuring players on both smartphone touchscreens and desktop keyboards never suffer unfair deaths caused by competing gesture prompts during obstacle dodging.
- **Decision 2:Unified Pointer, Touch Gesture & Keyboard Input Engine**
  - *Chosen Approach*: A dedicated input layer supporting swipe vectors (configurable 28px deadzone threshold so taps and swipes never misfire), tap/click raycast & quick-time triggers, and `WASD` / Arrow Keys / `Space` / `Mouse` on Windows browsers, complete with input buffering, edge-triggered action consumption, and automatic key-release on `window.blur`.
  - *Why*: Guarantees responsive, pixel-forgiving control across desktop and Android browsers while preventing accidental page scrolling (`touch-action: none`) or double-triggered actions.
- **Decision 3: Seeded Object-Pooled Procedural City & Composite 3D Models**
  - *Chosen Approach*: A rolling window of pooled 3D city segments (Mediterranean Old Town, Modern Downtown Crosswalk, Construction Zone, Park Bridge, Rooftop Skyline) using `InstancedMesh` for coins/decorations and multi-part `THREE.Group` rigs for the Thief, Police Officer, Motorcycle, Car, Helicopter, and Sky Burglar Hot-Air Balloon.
  - *Why*: Delivers zero-404 reliability, rich cartoon silhouettes faithful to your uploaded reference art, bounded memory usage, and smooth 30–60fps performance on Android and desktop browsers.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        GameApp Shell (React + TypeScript)                    │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │   Isolated WebGL Canvas Container  │  │   Low-Occlusion HTML/SVG HUD   │  │
│  │        (Three.js r160+ Engine)     │  │  (Menus, HUD, Shop, Game Over) │  │
│  └─────────────────┬──────────────────┘  └───────────────▲────────────────┘  │
└────────────────────┼─────────────────────────────────────┼───────────────────┘
                     │ Fixed-Step / Clamped Delta Loop     │ Typed Event Bus
                     ▼                                     │
┌──────────────────────────────────────────────────────────┴───────────────────┐
│                          Core Game State Machine                             │
│   [MainMenu] ➔ [Escape] ⇄ [Theft (Slow-Mo QTE)] ⇄ [CoinRush] ⇄ [GameOver]   │
└───────┬──────────────────┬───────────────────┬──────────────────┬────────────┘
        │                  │                   │                  │
        ▼                  ▼                   ▼                  ▼
┌───────────────┐  ┌───────────────┐   ┌───────────────┐  ┌────────────────────┐
│ Player &      │  │ Phase &       │   │ Pursuit &     │  │ Seeded Procedural  │
│ Vehicle Rig   │  │ Theft System  │   │ Gadget System │  │ City & Object Pool │
│ ───────────── │  │ ───────────── │   │ ───────────── │  │ ────────────────── │
│ • Foot / Bike │  │ • Weighted    │   │ • Foot Cops   │  │ • Mediterranean &  │
│ • Sports Car  │  │   Scheduler   │   │ • Moto / Cars │  │   Downtown Chunks  │
│ • Sky Balloon │  │ • Slow-Mo Cam │   │ • Helicopters │  │ • Fairness Validator│
│ • Input Buffer│  │ • QTE Gesture │   │ • 4-Tier      │  │ • Day-to-Sunset    │
│   (Touch/KBD) │  │   Evaluator   │   │   Gadgets     │  │   Sky & Lighting   │
└───────────────┘  └───────────────┘   └───────────────┘  └─────────┬──────────┘
                                                                    │
                                                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                Web Audio Procedural Synth & LocalSaveManager                 │
│  • Layered Sirens, Footsteps, Engines, Coin Chimes, Theft Fanfare (Mute/Vol) │
│  • LocalStorage Persistence: Coins, Best Score/Distance, 3-Category Upgrades │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **RunState (Active Session)**:
  - `gameState`: `'MAIN_MENU' | 'ESCAPE' | 'THEFT' | 'COIN_RUSH' | 'VEHICLE_TRANSITION' | 'BALLOON_CHASE' | 'PAUSED' | 'GAME_OVER' | 'UPGRADE_SHOP' | 'SETTINGS'`
  - `locomotionStage`: `'FOOT' | 'MOTORCYCLE' | 'CAR' | 'BALLOON'`
  - `score`: Total integer score (`distance * 1 + standardCoins * 10 + bonusCoins * 50 + thefts * 250 + perfectThefts * 150 + nearMisses * 25`)
  - `distance`: Metres travelled (`number`)
  - `runCoins`: Coins collected in the current run (`number`)
  - `pursuitPressure`: `0` to `100` meter driving police proximity, siren intensity, and unit escalation (`Searching → Chasing → Intercepting → Reinforcing → Critical → Caught`)
  - `activeTheftEncounter`: Target type (`'WALLET' | 'MOTORCYCLE_KEY' | 'SPORTS_CAR' | 'BALLOON_ROPE' | 'ROOFTOP_SAFE'`), required gesture (`'SWIPE_UP' | 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'TAP'`), remaining time window, and precision zone thresholds.
- **PersistentSaveData (`localStorage`)**:
  - `totalCoins`, `bestScore`, `bestDistance`, `highestStageReached`, `tutorialCompleted`
  - `upgrades`:
    - **Gadgets**: Unlocked gadget tier (Tier 1 Stones, Tier 2 Smoke Bomb, Tier 3 Cartoon Grenade, Tier 4 Arcade Zapper), Max Charges (1–4), Cooldown Speed (Lv 1–5).
    - **Utility**: Coin Magnet Radius (Lv 1–5), Pursuit Recovery Rate (Lv 1–5), Headstart Boost.
    - **Cosmetics**: Thief Outfit Trim (`Classic Striped`, `Golden Heist`, `Shadow Ninja`, `Neon Getaway`) and Sneak Shoes trail effect.
  - `settings`: `musicVolume`, `sfxVolume`, `isMuted`, `controlSensitivity`, `reducedMotion`.

### Interactive Component & State Mapping

- **Unified Input Manager**:
  - Captures `pointerdown`, `pointermove`, `pointerup`, `keydown`, and `keyup` on the gameplay layer while ignoring events originating inside interactive HUD buttons (`e.target.closest('button')`).
  - Translates horizontal/vertical swipe vectors (`>= 28px`) or `WASD`/Arrow keys into lane switches (`-1, 0, +1`), jumps/climbs, or slides during `ESCAPE` and `COIN_RUSH`, and maps them directly to QTE gesture evaluation during `THEFT`.
- **Fairness-Constrained Segment Pool**:
  - Maintains a rolling window of 8 active road/rooftop segments (6 ahead, 1 current, 1 behind) recycled via an object pool.
  - Every segment template guarantees at least one unobstructed lane path, valid jump/slide clearance, and obstacle suppression whenever a phase transition or vehicle mount/dismount begins.
- **Upgrade Shop & Settings Modals**:
  - Accessible from both the Main Menu and Game Over screen. Purchasing any Gadget, Utility, or Cosmetic upgrade deducts `totalCoins`, persists immediately to `localStorage`, updates the 3D Thief character's visual gear/outfit live in the viewport, and recalculates gadget stats for the next run.
