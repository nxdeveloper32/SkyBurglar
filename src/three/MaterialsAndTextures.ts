import * as THREE from 'three';
import { OutfitCosmeticId } from '../types/game';

export class MaterialsAndTextures {
  private maxAnisotropy: number;
  private sweaterTextures = new Map<OutfitCosmeticId, THREE.CanvasTexture>();
  public balloonEnvelopeTexture: THREE.CanvasTexture;
  public wickerBasketTexture: THREE.CanvasTexture;
  public skyBurglarBannerTexture: THREE.CanvasTexture;
  public roadAsphaltTexture: THREE.CanvasTexture;
  public buildingFacadeMedTexture: THREE.CanvasTexture;
  public buildingFacadeModernTexture: THREE.CanvasTexture;

  constructor(renderer: THREE.WebGLRenderer) {
    this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy() || 4;
    this.balloonEnvelopeTexture = this.createBalloonEnvelopeTexture();
    this.wickerBasketTexture = this.createWickerTexture();
    this.skyBurglarBannerTexture = this.createBannerTexture();
    this.roadAsphaltTexture = this.createRoadTexture();
    this.buildingFacadeMedTexture = this.createMediterraneanFacadeTexture();
    this.buildingFacadeModernTexture = this.createModernFacadeTexture();
  }

  private configureColorTexture(tex: THREE.CanvasTexture): THREE.CanvasTexture {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  public getSweaterTexture(outfit: OutfitCosmeticId): THREE.CanvasTexture {
    const cached = this.sweaterTextures.get(outfit);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    let stripeA = '#1c1b18';
    let stripeB = '#68665c';

    if (outfit === 'GOLDEN_HEIST') {
      stripeA = '#18181b';
      stripeB = '#f59e0b';
    } else if (outfit === 'SHADOW_NINJA') {
      stripeA = '#0f172a';
      stripeB = '#dc2626';
    } else if (outfit === 'NEON_GETAWAY') {
      stripeA = '#090d16';
      stripeB = '#06b6d4';
    }

    const numStripes = 8;
    const h = canvas.height / numStripes;
    for (let i = 0; i < numStripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? stripeA : stripeB;
      ctx.fillRect(0, i * h, canvas.width, h);
      // Subtle knit texture lines
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let x = 0; x < canvas.width; x += 8) {
        ctx.fillRect(x, i * h, 3, h);
      }
    }

    const tex = this.configureColorTexture(new THREE.CanvasTexture(canvas));
    this.sweaterTextures.set(outfit, tex);
    return tex;
  }

  private createBalloonEnvelopeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Patchwork thief-striped hot-air balloon envelope with "$" symbol
    const rows = 10;
    const cols = 8;
    const rowH = canvas.height / rows;
    const colW = canvas.width / cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + (c % 2 === 0 ? 0 : 1)) % 2 === 0 ? '#26272b' : '#9ca3af';
        ctx.fillRect(c * colW, r * rowH, colW, rowH);

        // Seam lines
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3;
        ctx.strokeRect(c * colW, r * rowH, colW, rowH);
      }
    }

    // Large patched "$" emblem patches on two sides
    [128, 384].forEach((cx) => {
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(cx - 54, 150, 108, 170);
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 4;
      ctx.strokeRect(cx - 54, 150, 108, 170);

      ctx.fillStyle = '#18181b';
      ctx.font = '900 130px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', cx, 240);
    });

    return this.configureColorTexture(new THREE.CanvasTexture(canvas));
  }

  private createWickerTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 16) {
      for (let x = 0; x < 256; x += 32) {
        ctx.fillStyle = (x / 32 + y / 16) % 2 === 0 ? '#92400e' : '#b45309';
        ctx.fillRect(x + 2, y + 2, 28, 12);
      }
    }
    return this.configureColorTexture(new THREE.CanvasTexture(canvas));
  }

  private createBannerTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 248, 120);

    ctx.fillStyle = '#111827';
    ctx.font = '800 34px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SKY', 128, 52);
    ctx.fillText('BURGLAR', 128, 96);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  }

  private createRoadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Warm asphalt / cobblestone blend
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle stone/asphalt grain
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let y = 0; y < 512; y += 32) {
      for (let x = 0; x < 512; x += 64) {
        ctx.strokeStyle = 'rgba(15,23,42,0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + ((y / 32) % 2) * 24, y, 64, 32);
      }
    }

    // Yellow side curb lines
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(16, 0, 10, 512);
    ctx.fillRect(486, 0, 10, 512);

    // Three-lane white dashed dividers at 1/3 and 2/3 width
    ctx.fillStyle = '#f8fafc';
    for (let y = 24; y < 512; y += 128) {
      ctx.fillRect(170 - 5, y, 10, 68);
      ctx.fillRect(342 - 5, y, 10, 68);
    }

    return this.configureColorTexture(new THREE.CanvasTexture(canvas));
  }

  private createMediterraneanFacadeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#fde68a';
    ctx.fillRect(0, 0, 256, 256);

    // Trim bands
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 256, 14);
    ctx.fillRect(0, 124, 256, 10);

    // Warm wooden framed windows
    for (const wy of [34, 152]) {
      for (const wx of [36, 148]) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(wx - 6, wy - 6, 72, 76);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(wx, wy, 60, 64);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(wx + 28, wy, 4, 64);
        ctx.fillRect(wx, wy + 30, 60, 4);
      }
    }

    return this.configureColorTexture(new THREE.CanvasTexture(canvas));
  }

  private createModernFacadeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 16; y < 240; y += 36) {
      for (let x = 16; x < 240; x += 48) {
        const lit = (x * 7 + y * 13) % 5 !== 0;
        ctx.fillStyle = lit ? '#38bdf8' : '#0f172a';
        ctx.fillRect(x, y, 34, 24);
      }
    }

    return this.configureColorTexture(new THREE.CanvasTexture(canvas));
  }

  public dispose(): void {
    this.sweaterTextures.forEach((t) => t.dispose());
    this.balloonEnvelopeTexture.dispose();
    this.wickerBasketTexture.dispose();
    this.skyBurglarBannerTexture.dispose();
    this.roadAsphaltTexture.dispose();
    this.buildingFacadeMedTexture.dispose();
    this.buildingFacadeModernTexture.dispose();
  }
}
