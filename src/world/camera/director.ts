import * as THREE from "three";
import gsap from "gsap";

export type ShotOptions = {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  duration?: number;
  ease?: string;
  onComplete?: () => void;
  /** Keep the camera parked at the destination when the shot ends. */
  hold?: boolean;
};

const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _look = new THREE.Vector3();

/**
 * Cinematic camera director.
 *
 * When active it fully owns the camera; PlayerController yields. Shots animate
 * a scalar through GSAP and derive position/orientation every frame, so the
 * camera always looks at its target instead of slerping blindly through space.
 */
class Director {
  active = false;
  holding = false;
  position = new THREE.Vector3();
  quaternion = new THREE.Quaternion();
  private tween: gsap.core.Tween | null = null;
  private progress = { t: 0 };
  private startPos = new THREE.Vector3();
  private startLook = new THREE.Vector3();
  private endPos = new THREE.Vector3();
  private endLook = new THREE.Vector3();
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  /** Capture the current camera transform as the shot origin. */
  fromCamera(camera: THREE.PerspectiveCamera) {
    this.startPos.copy(camera.position);
    camera.getWorldDirection(_look);
    _look.add(camera.position);
    this.startLook.copy(_look);
  }

  shot(camera: THREE.PerspectiveCamera, options: ShotOptions) {
    const { position, lookAt, duration = 1.1, ease = "power2.inOut", onComplete, hold = true } = options;
    this.cancel(false);
    this.fromCamera(camera);
    this.endPos.copy(position);
    this.endLook.copy(lookAt);
    this.active = true;
    this.holding = hold;
    this.progress.t = 0;
    this.tween = gsap.to(this.progress, {
      t: 1,
      duration,
      ease,
      onUpdate: () => this.apply(),
      onComplete: () => {
        this.holding = hold;
        if (!hold) this.active = false;
        this.tween = null;
        this.emit();
        onComplete?.();
      },
    });
    this.emit();
  }

  private apply() {
    const t = this.progress.t;
    this.position.copy(this.startPos).lerp(this.endPos, t);
    _look.copy(this.startLook).lerp(this.endLook, t);
    _m.lookAt(this.position, _look, UP);
    this.quaternion.setFromRotationMatrix(_m);
  }

  cancel(emit = true) {
    if (this.tween) {
      this.tween.kill();
      this.tween = null;
    }
    this.active = false;
    this.holding = false;
    if (emit) this.emit();
  }

  /** Snap the camera pose without animating (used after a fade cut). */
  snap(position: THREE.Vector3, lookAt: THREE.Vector3) {
    this.position.copy(position);
    _m.lookAt(position, lookAt, UP);
    this.quaternion.setFromRotationMatrix(_m);
  }
}

export const director = new Director();

/** The canvas registers its camera here so non-React systems can drive it. */
export const cameraRef: { camera: THREE.PerspectiveCamera | null } = { camera: null };

export function lookAtQuaternion(
  position: THREE.Vector3,
  target: THREE.Vector3,
  out = new THREE.Quaternion(),
) {
  const mat = new THREE.Matrix4().lookAt(position, target, UP);
  return out.setFromRotationMatrix(mat);
}

/**
 * A camera position for inspecting a world point from the player's current
 * side, never inside geometry: it interpolates 78% of the way to the target
 * and stops short by `standoff` metres.
 */
export function inspectPose(
  target: THREE.Vector3,
  playerPos: THREE.Vector3,
  standoff = 2.2,
  eye = 1.62,
) {
  const dir = new THREE.Vector3().subVectors(playerPos, target);
  dir.y = 0;
  if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
  dir.normalize();
  const position = new THREE.Vector3(
    target.x + dir.x * standoff,
    target.y + (eye - target.y) * 0.55 + 0.18,
    target.z + dir.z * standoff,
  );
  return { position, lookAt: target.clone() };
}
