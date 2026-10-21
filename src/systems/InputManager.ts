import { GestureType } from '../types/game';
import { saveManager } from './SaveManager';

export type InputActionCallback = (action: GestureType | 'GADGET' | 'PAUSE') => void;

export class InputManager {
  private onAction: InputActionCallback;
  private activePointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private swipeConsumed = false;
  private heldKeys = new Set<string>();
  private enabled = true;

  constructor(onAction: InputActionCallback) {
    this.onAction = onAction;
    this.bindEvents();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.activePointerId = null;
      this.heldKeys.clear();
    }
  }

  private getSwipeThresholdPx(): number {
    const sens = saveManager.getData().settings.swipeSensitivity;
    if (sens === 'HIGH') return 20;
    if (sens === 'LOW') return 38;
    return 28;
  }

  private isInteractiveUiElement(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('button, input, select, a, [data-ui-interactive="true"]'));
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Escape') {
      e.preventDefault();
      this.onAction('PAUSE');
      return;
    }

    if (!this.enabled) return;
    if (this.heldKeys.has(e.code)) return;
    this.heldKeys.add(e.code);

    switch (e.code) {
      case 'KeyA':
      case 'ArrowLeft':
        e.preventDefault();
        this.onAction(GestureType.SWIPE_LEFT);
        break;
      case 'KeyD':
      case 'ArrowRight':
        e.preventDefault();
        this.onAction(GestureType.SWIPE_RIGHT);
        break;
      case 'KeyW':
      case 'ArrowUp':
      case 'Space':
        e.preventDefault();
        this.onAction(GestureType.SWIPE_UP);
        break;
      case 'KeyS':
      case 'ArrowDown':
        e.preventDefault();
        this.onAction(GestureType.SWIPE_DOWN);
        break;
      case 'KeyE':
      case 'KeyF':
        e.preventDefault();
        this.onAction('GADGET');
        break;
      case 'Enter':
        e.preventDefault();
        this.onAction(GestureType.TAP);
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (!this.enabled) return;
    if (this.isInteractiveUiElement(e.target)) return;
    // Ignore secondary mouse buttons except right-click for gadget
    if (e.pointerType === 'mouse' && e.button === 2) {
      e.preventDefault();
      this.onAction('GADGET');
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Ignore multi-touch second finger
    if (this.activePointerId !== null) return;

    this.activePointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startTime = performance.now();
    this.swipeConsumed = false;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.enabled) return;
    if (this.activePointerId !== e.pointerId || this.swipeConsumed) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const dist = Math.hypot(dx, dy);
    const threshold = this.getSwipeThresholdPx();

    if (dist >= threshold) {
      this.swipeConsumed = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.onAction(dx > 0 ? GestureType.SWIPE_RIGHT : GestureType.SWIPE_LEFT);
      } else {
        this.onAction(dy > 0 ? GestureType.SWIPE_DOWN : GestureType.SWIPE_UP);
      }
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (this.activePointerId !== e.pointerId) return;
    const wasConsumed = this.swipeConsumed;
    const elapsed = performance.now() - this.startTime;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const dist = Math.hypot(dx, dy);

    this.activePointerId = null;
    this.swipeConsumed = false;

    if (!this.enabled) return;

    if (!wasConsumed && dist < this.getSwipeThresholdPx() && elapsed < 450) {
      this.onAction(GestureType.TAP);
    }
  };

  private handlePointerCancel = (e: PointerEvent): void => {
    if (this.activePointerId === e.pointerId) {
      this.activePointerId = null;
      this.swipeConsumed = false;
    }
  };

  private handleBlur = (): void => {
    this.heldKeys.clear();
    this.activePointerId = null;
    this.swipeConsumed = false;
  };

  private handleContextMenu = (e: MouseEvent): void => {
    if (!this.isInteractiveUiElement(e.target)) {
      e.preventDefault();
    }
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('contextmenu', this.handleContextMenu);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('contextmenu', this.handleContextMenu);
  }
}
