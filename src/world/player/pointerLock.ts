export function getCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector("canvas[data-nexus-canvas='true']") ?? document.querySelector("canvas");
}

export function requestPointerLock() {
  const canvas = getCanvas();
  if (!canvas) return;
  try {
    const result = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch {
    /* pointer lock may be denied; the UI still works with drag-look disabled */
  }
}

export function exitPointerLock() {
  if (typeof document !== "undefined" && document.pointerLockElement) {
    document.exitPointerLock();
  }
}

export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
}
