import * as THREE from 'three';
import { OutfitCosmeticId, TheftTargetType } from '../types/game';
import { MaterialsAndTextures } from './MaterialsAndTextures';

export interface AnimatedCharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  lootSack?: THREE.Group;
  sweaterMesh?: THREE.Mesh;
}

export class CharacterAndVehicleModels {
  /**
   * Builds the composite cartoon Masked Thief from the user's reference art:
   * - Exaggerated head, black domino mask, big round nose, wide toothy grin, dark swept hair
   * - Black-and-grey horizontal striped sweater
   * - Olive-green burlap loot sack slung over the shoulder with glittering gold coins
   * - Dark denim jeans & brown leather shoes
   */
  public static createThiefRig(
    materials: MaterialsAndTextures,
    outfit: OutfitCosmeticId
  ): AnimatedCharacterRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf4b386,
      roughness: 0.55,
      metalness: 0.05,
    });
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xec8f6a,
      roughness: 0.45,
      metalness: 0.05,
    });
    const maskMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.4,
      metalness: 0.2,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1a1715,
      roughness: 0.65,
      metalness: 0.08,
    });
    const sweaterMat = new THREE.MeshStandardMaterial({
      map: materials.getSweaterTexture(outfit),
      roughness: 0.75,
      metalness: 0.05,
    });
    const denimMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.05,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: outfit === 'GOLDEN_HEIST' ? 0xb45309 : 0x5c3a21,
      roughness: 0.45,
      metalness: outfit === 'GOLDEN_HEIST' ? 0.4 : 0.1,
    });
    const sackMat = new THREE.MeshStandardMaterial({
      color: 0x525744,
      roughness: 0.88,
      metalness: 0.02,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.22,
      metalness: 0.88,
    });

    // Contact shadow disc grounded at Y = 0.02
    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(0.68, 24),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    root.add(shadowPlane);

    // 1. Torso (Striped Sweater)
    const torsoGeo = new THREE.CapsuleGeometry(0.36, 0.48, 8, 16);
    const sweaterMesh = new THREE.Mesh(torsoGeo, sweaterMat);
    sweaterMesh.position.y = 1.05;
    sweaterMesh.castShadow = true;
    bodyGroup.add(sweaterMesh);

    // 2. Exaggerated Cartoon Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.66, 0.08);
    bodyGroup.add(headGroup);

    const headMain = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), skinMat);
    headMain.scale.set(0.95, 1.08, 0.96);
    headMain.castShadow = true;
    headGroup.add(headMain);

    // Black Domino Mask
    const maskMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.34), maskMat);
    maskMesh.position.set(0, 0.07, 0.22);
    headGroup.add(maskMesh);

    // Big Expressive Cartoon Eyes
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x29180b });
    [-0.14, 0.14].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), whiteMat);
      eye.position.set(ex, 0.07, 0.35);
      headGroup.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), pupilMat);
      pupil.position.set(ex, 0.07, 0.42);
      headGroup.add(pupil);
    });

    // Oversized Bulbous Cartoon Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 16), noseMat);
    nose.scale.set(1.25, 0.9, 1.15);
    nose.position.set(0, -0.04, 0.42);
    headGroup.add(nose);

    // Wide Mischievous Toothy Grin
    const smileMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.045, 8, 16, Math.PI),
      whiteMat
    );
    smileMesh.rotation.x = Math.PI;
    smileMesh.position.set(0, -0.14, 0.33);
    headGroup.add(smileMesh);

    // Swept Dark Cartoon Hair
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 20), hairMat);
    hairCap.scale.set(1.0, 0.72, 1.05);
    hairCap.position.set(0, 0.22, -0.02);
    headGroup.add(hairCap);

    const hairCrest = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.34, 12), hairMat);
    hairCrest.rotation.x = -0.5;
    hairCrest.position.set(0, 0.42, 0.1);
    headGroup.add(hairCrest);

    // 3. Articulated Legs + Chunky Brown Shoes
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.18, 0.68, 0);
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.18, 0.68, 0);

    [leftLeg, rightLeg].forEach((leg) => {
      const pant = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.36, 6, 12), denimMat);
      pant.position.y = -0.24;
      pant.castShadow = true;
      leg.add(pant);

      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.44), shoeMat);
      shoe.position.set(0, -0.54, 0.08);
      shoe.castShadow = true;
      leg.add(shoe);

      bodyGroup.add(leg);
    });

    // 4. Articulated Striped Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.42, 1.32, 0);
    const rightArm = new THREE.Group();
    rightArm.position.set(0.42, 1.32, 0);

    [leftArm, rightArm].forEach((arm) => {
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 6, 12), sweaterMat);
      sleeve.position.y = -0.2;
      sleeve.castShadow = true;
      arm.add(sleeve);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), skinMat);
      hand.position.y = -0.44;
      arm.add(hand);

      bodyGroup.add(arm);
    });

    // 5. Olive-Green Burlap Loot Sack Slung Over Back/Shoulder
    const lootSack = new THREE.Group();
    lootSack.position.set(0.12, 1.24, -0.42);
    const sackBody = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 20), sackMat);
    sackBody.scale.set(1.0, 1.18, 0.95);
    sackBody.castShadow = true;
    lootSack.add(sackBody);

    // Sack Neck Tie & Gold Coins Peeking Out
    const sackNeck = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 12), sackMat);
    sackNeck.position.set(-0.18, 0.46, 0.22);
    sackNeck.rotation.z = 0.45;
    lootSack.add(sackNeck);

    for (let i = 0; i < 5; i++) {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12), goldMat);
      coin.position.set(
        (i - 2) * 0.07,
        0.44 + (i % 2) * 0.04,
        (i % 3 - 1) * 0.06
      );
      coin.rotation.x = 0.4 * i;
      lootSack.add(coin);
    }
    bodyGroup.add(lootSack);

    return {
      root,
      bodyGroup,
      headGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      lootSack,
      sweaterMesh,
    };
  }

  /**
   * Builds the Cartoon Police Officer from the user's first reference image:
   * - Friendly/determined cartoon face with rosy cheeks & round nose
   * - Navy-blue police uniform with black tie & gold shield badge
   * - Peaked navy police cap with gold emblem
   * - Utility belt with brass buckle & dark boots
   */
  public static createPoliceOfficerRig(): AnimatedCharacterRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf7c59f, roughness: 0.5 });
    const cheekMat = new THREE.MeshStandardMaterial({ color: 0xf48c7f, roughness: 0.45 });
    const navyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.65, metalness: 0.1 });
    const darkNavyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.2 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.85 });

    // Ground contact shadow
    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(0.65, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    root.add(shadowPlane);

    // 1. Navy Uniform Torso
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.46, 8, 16), navyMat);
    torso.position.y = 1.04;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Black Tie
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.36, 0.06), darkNavyMat);
    tie.position.set(0, 1.12, 0.36);
    bodyGroup.add(tie);

    // Gold Shield Badge on Chest
    const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), goldMat);
    badge.scale.set(1, 1.25, 0.4);
    badge.position.set(0.16, 1.2, 0.36);
    bodyGroup.add(badge);

    // Utility Belt & Brass Buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.11, 20), darkNavyMat);
    belt.position.y = 0.78;
    bodyGroup.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), goldMat);
    buckle.position.set(0, 0.78, 0.38);
    bodyGroup.add(buckle);

    // 2. Head & Peaked Police Cap
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.65, 0);
    bodyGroup.add(headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 24, 24), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Rosy Cheeks & Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), cheekMat);
    nose.position.set(0, -0.02, 0.36);
    headGroup.add(nose);

    [-0.22, 0.22].forEach((cx) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), cheekMat);
      cheek.position.set(cx, -0.05, 0.3);
      headGroup.add(cheek);
    });

    // Eyes
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const brownMat = new THREE.MeshBasicMaterial({ color: 0x3b1d0a });
    [-0.12, 0.12].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), whiteMat);
      eye.position.set(ex, 0.06, 0.33);
      headGroup.add(eye);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), brownMat);
      iris.position.set(ex, 0.06, 0.39);
      headGroup.add(iris);
    });

    // Peaked Police Cap + Gold Cap Shield
    const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.22, 24), navyMat);
    capCrown.position.set(0, 0.32, 0);
    headGroup.add(capCrown);

    const capVisor = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 20, 1, false, -Math.PI / 2, Math.PI), darkNavyMat);
    capVisor.position.set(0, 0.21, 0.14);
    headGroup.add(capVisor);

    const capBadge = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), goldMat);
    capBadge.scale.set(1, 1.3, 0.4);
    capBadge.position.set(0, 0.33, 0.4);
    headGroup.add(capBadge);

    // 3. Legs & Arms
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.17, 0.68, 0);
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.17, 0.68, 0);

    [leftLeg, rightLeg].forEach((leg) => {
      const trouser = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.34, 6, 12), navyMat);
      trouser.position.y = -0.22;
      leg.add(trouser);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.42), darkNavyMat);
      boot.position.set(0, -0.52, 0.06);
      leg.add(boot);
      bodyGroup.add(leg);
    });

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.44, 1.3, 0);
    const rightArm = new THREE.Group();
    rightArm.position.set(0.44, 1.3, 0);

    [leftArm, rightArm].forEach((arm) => {
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.34, 6, 12), navyMat);
      sleeve.position.y = -0.18;
      arm.add(sleeve);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), skinMat);
      hand.position.y = -0.4;
      arm.add(hand);
      bodyGroup.add(arm);
    });

    return {
      root,
      bodyGroup,
      headGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
    };
  }

  /**
   * Multi-part Street Motorcycle (Player getaway bike or Police pursuit bike)
   */
  public static createMotorcycleGroup(isPolice: boolean): THREE.Group {
    const group = new THREE.Group();
    const bodyColor = isPolice ? 0x1e3a8a : 0xe11d48;
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      roughness: 0.25,
      metalness: 0.6,
      clearcoat: 0.9,
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });

    // Front & Rear Wheels
    [-0.95, 0.95].forEach((zPos) => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.13, 12, 24), tireMat);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(0, 0.48, zPos);
      wheel.castShadow = true;
      group.add(wheel);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 12), chromeMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(0, 0.48, zPos);
      group.add(hub);
    });

    // Main Frame & Fuel Tank
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 1.5), bodyMat);
    frame.position.set(0, 0.82, 0);
    frame.castShadow = true;
    group.add(frame);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.75), seatMat);
    seat.position.set(0, 1.1, 0.18);
    group.add(seat);

    // Front Fork & Handlebars
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 10), chromeMat);
    fork.position.set(0, 0.95, -0.78);
    fork.rotation.x = 0.28;
    group.add(fork);

    const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 10), chromeMat);
    bars.rotation.z = Math.PI / 2;
    bars.position.set(0, 1.34, -0.66);
    group.add(bars);

    // Glowing Headlight
    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    headlight.position.set(0, 1.12, -0.95);
    group.add(headlight);

    if (isPolice) {
      const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      sirenRed.position.set(-0.18, 1.25, 0.7);
      group.add(sirenRed);
      const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      sirenBlue.position.set(0.18, 1.25, 0.7);
      group.add(sirenBlue);
    }

    return group;
  }

  /**
   * Multi-part Sports Car or Police Cruiser
   */
  public static createCarGroup(isPolice: boolean): THREE.Group {
    const group = new THREE.Group();
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: isPolice ? 0x1e3a8a : 0xf59e0b,
      roughness: 0.2,
      metalness: 0.65,
      clearcoat: 1.0,
    });
    const whiteDoorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.85,
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

    // Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.62, 3.6), paintMat);
    chassis.position.set(0, 0.56, 0);
    chassis.castShadow = true;
    group.add(chassis);

    if (isPolice) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.32, 1.6), whiteDoorMat);
      stripe.position.set(0, 0.56, 0);
      group.add(stripe);
    }

    // Upper Cabin & Windshield
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.54, 1.85), paintMat);
    cabin.position.set(0, 1.1, 0.15);
    cabin.castShadow = true;
    group.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.44, 1.9), glassMat);
    windshield.position.set(0, 1.08, 0.15);
    group.add(windshield);

    // 4 Wheels
    [
      [-0.98, -1.15],
      [0.98, -1.15],
      [-0.98, 1.15],
      [0.98, 1.15],
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.38, wz);
      group.add(wheel);
    });

    // Headlights & Taillights
    [-0.65, 0.65].forEach((hx) => {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      head.position.set(hx, 0.62, -1.81);
      group.add(head);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      tail.position.set(hx, 0.64, 1.81);
      group.add(tail);
    });

    // Police Roof Lightbar
    if (isPolice) {
      const barLeft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.26), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      barLeft.position.set(-0.3, 1.45, 0.1);
      group.add(barLeft);

      const barRight = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.26), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      barRight.position.set(0.3, 1.45, 0.1);
      group.add(barRight);
    }

    return group;
  }

  /**
   * Builds the "SKY BURGLAR" Hot-Air Balloon from the 5th reference image:
   * - Woven wicker basket with "SKY BURGLAR" banner, pressure gauge, sandbags, & anchor
   * - Glowing burner flame
   * - Striped "$" patchwork balloon envelope
   * - Climbable dangling rope underneath
   */
  public static createHotAirBalloonGroup(materials: MaterialsAndTextures): THREE.Group {
    const group = new THREE.Group();

    const wickerMat = new THREE.MeshStandardMaterial({
      map: materials.wickerBasketTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const envelopeMat = new THREE.MeshStandardMaterial({
      map: materials.balloonEnvelopeTexture,
      roughness: 0.65,
      metalness: 0.08,
    });
    const bannerMat = new THREE.MeshStandardMaterial({
      map: materials.skyBurglarBannerTexture,
      roughness: 0.5,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.85,
    });
    const ropeMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      roughness: 0.8,
    });

    // 1. Wicker Basket
    const basket = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.25, 1.75), wickerMat);
    basket.position.y = 0.65;
    basket.castShadow = true;
    group.add(basket);

    // "SKY BURGLAR" Front & Rear Banners
    [-0.89, 0.89].forEach((zPos, i) => {
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.58), bannerMat);
      banner.position.set(0, 0.65, zPos);
      if (i === 0) banner.rotation.y = Math.PI;
      group.add(banner);
    });

    // Sandbags & Pressure Gauge Accents on Basket
    [-0.7, 0.7].forEach((sx) => {
      const sandbag = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), wickerMat);
      sandbag.scale.set(0.9, 1.3, 0.9);
      sandbag.position.set(sx, 0.52, 0.92);
      group.add(sandbag);
    });

    // 2. Suspension Struts & Burner Flame
    [
      [-0.75, -0.75],
      [0.75, -0.75],
      [-0.75, 0.75],
      [0.75, 0.75],
    ].forEach(([rx, rz]) => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 8), metalMat);
      cable.position.set(rx, 2.3, rz);
      group.add(cable);
    });

    const burnerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.75, 12),
      new THREE.MeshBasicMaterial({ color: 0xfb923c })
    );
    burnerFlame.position.set(0, 2.8, 0);
    group.add(burnerFlame);

    // 3. Balloon Envelope (Teardrop Sphere + Cone Base)
    const upperDome = new THREE.Mesh(new THREE.SphereGeometry(2.65, 28, 24), envelopeMat);
    upperDome.position.set(0, 6.2, 0);
    upperDome.scale.set(1, 1.15, 1);
    upperDome.castShadow = true;
    group.add(upperDome);

    const lowerCone = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 0.85, 2.4, 24), envelopeMat);
    lowerCone.position.set(0, 4.1, 0);
    group.add(lowerCone);

    // 4. Dangling Escape Rope Underneath Basket
    const danglingRope = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.8, 8), ropeMat);
    danglingRope.position.set(0, -1.35, 0);
    group.add(danglingRope);

    return group;
  }

  /**
   * Police Pursuit Helicopter with spinning rotor & searchlight cone
   */
  public static createPoliceHelicopter(): {
    root: THREE.Group;
    mainRotor: THREE.Group;
    searchlight: THREE.Mesh;
  } {
    const root = new THREE.Group();
    const navyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35, metalness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 16), navyMat);
    body.scale.set(0.85, 0.8, 1.45);
    root.add(body);

    const noseGlass = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), glassMat);
    noseGlass.position.set(0, 0.05, 0.65);
    root.add(noseGlass);

    // Tail Boom
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 2.4, 12), whiteMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0.15, -1.9);
    root.add(tail);

    // Main Rotor
    const mainRotor = new THREE.Group();
    mainRotor.position.set(0, 0.95, 0);
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.04, 0.24), darkMat);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 4.4), darkMat);
    mainRotor.add(blade1, blade2);
    root.add(mainRotor);

    // Volumetric-style Searchlight Cone
    const coneGeo = new THREE.ConeGeometry(2.1, 7.5, 20, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const searchlight = new THREE.Mesh(coneGeo, coneMat);
    searchlight.position.set(0, -3.6, 1.4);
    searchlight.rotation.x = -0.25;
    root.add(searchlight);

    return { root, mainRotor, searchlight };
  }

  /**
   * Builds highlighted 3D Target Props for the Theft Phase encounters
   */
  public static createTheftTargetProp(
    targetType: TheftTargetType,
    materials: MaterialsAndTextures
  ): THREE.Group {
    const group = new THREE.Group();

    // Glowing gold Floor Beacon Ring so the target is unmistakably readable
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.38, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
      })
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.04;
    group.add(beaconRing);

    if (targetType === TheftTargetType.WALLET) {
      // Distracted Wealthy Pedestrian + Glowing Leather Wallet & Gold Bills
      const pedGroup = new THREE.Group();
      const suitMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 });
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.55, 8, 12), suitMat);
      torso.position.y = 1.0;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), skinMat);
      head.position.y = 1.62;
      pedGroup.add(torso, head);
      pedGroup.position.set(0.55, 0, 0);
      group.add(pedGroup);

      // Oversized Floating Highlighted Wallet with Cash
      const wallet = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.45, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4, emissive: 0x451a03 })
      );
      wallet.position.set(-0.2, 1.35, 0.25);
      wallet.rotation.z = 0.25;
      group.add(wallet);

      const cash = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.3, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46 })
      );
      cash.position.set(-0.2, 1.55, 0.25);
      group.add(cash);
    } else if (targetType === TheftTargetType.MOTORCYCLE_KEY) {
      const bike = this.createMotorcycleGroup(false);
      group.add(bike);
    } else if (targetType === TheftTargetType.SPORTS_CAR) {
      const car = this.createCarGroup(false);
      group.add(car);
    } else if (targetType === TheftTargetType.BALLOON_ROPE) {
      const balloon = this.createHotAirBalloonGroup(materials);
      balloon.position.y = 2.6;
      group.add(balloon);
    } else if (targetType === TheftTargetType.ROOFTOP_SAFE) {
      // Cracked Bank Safe from the 5th reference image!
      const safeMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.35,
        metalness: 0.8,
      });
      const safeBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), safeMat);
      safeBox.position.y = 0.72;
      safeBox.castShadow = true;
      group.add(safeBox);

      const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.14, 20),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.9 })
      );
      dial.rotation.x = Math.PI / 2;
      dial.position.set(0, 0.72, 0.72);
      group.add(dial);
    }

    return group;
  }
}
