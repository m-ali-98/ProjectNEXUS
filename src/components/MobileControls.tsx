"use client";

import { useEffect, useRef, useState } from "react";
import { useNexusStore } from "@/stores/nexusStore";
import { input, playerState } from "@/world/player/playerState";
import { isTouchDevice } from "@/world/player/pointerLock";
import { cameraRef } from "@/world/camera/director";
import { activateInteraction } from "@/world/camera/cinematics";

/**
 * Touch fallback: virtual stick for movement, drag anywhere on the right for
 * look, plus the primary action. The desktop pointer-lock path is untouched.
 */
export function MobileControls() {
  const [touch, setTouch] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const active = useRef<"move" | "look" | null>(null);
  const last = useRef({ x: 0, y: 0 });
  const focused = useNexusStore((s) => s.focused);
  const paused = useNexusStore((s) => s.paused);
  const panel = useNexusStore((s) => s.panel);
  const phase = useNexusStore((s) => s.phase);

  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);

  if (!touch) return null;
  const blocked = paused || !!panel || phase !== "ready";

  const onPointerDown = (e: React.PointerEvent) => {
    if (blocked) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const isMoveZone = x < rect.width * 0.42 && y > rect.height * 0.52;
    active.current = isMoveZone ? "move" : "look";
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!active.current) return;
    if (active.current === "look") {
      input.lookX += (e.clientX - last.current.x) * 1.4;
      input.lookY += (e.clientY - last.current.y) * 1.4;
      last.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const max = 62;
    const dx = Math.max(-max, Math.min(max, e.clientX - last.current.x + stick.x * max));
    const dy = Math.max(-max, Math.min(max, e.clientY - last.current.y + stick.y * max));
    const nx = dx / max;
    const ny = dy / max;
    setStick({ x: nx, y: ny });
    input.right = nx;
    input.forward = -ny;
  };

  const end = () => {
    active.current = null;
    setStick({ x: 0, y: 0 });
    input.forward = 0;
    input.right = 0;
  };

  return (
    <div className="fixed inset-0 z-[25]">
      <div
        className="absolute inset-0"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      />
      {/* stick */}
      <div className="pointer-events-none absolute bottom-24 left-6 h-32 w-32 rounded-full border border-accent/30 bg-black/30">
        <div
          className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-accent/60 bg-accent/20"
          style={{ transform: `translate(calc(-50% + ${stick.x * 38}px), calc(-50% + ${stick.y * 38}px))` }}
        />
        <div className="absolute inset-x-0 -top-5 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-ink-faint">
          move
        </div>
      </div>

      {/* actions */}
      <div className="absolute bottom-24 right-5 flex flex-col items-end gap-2">
        <button
          onClick={() => {
            const store = useNexusStore.getState();
            store.setOverlay("map");
            store.setPaused(true);
          }}
          className="nx-btn px-3 py-2 text-[10px]"
        >
          Map
        </button>
        <button
          onClick={() => {
            const store = useNexusStore.getState();
            store.setOverlay("pause");
            store.setPaused(true);
          }}
          className="nx-btn px-3 py-2 text-[10px]"
        >
          Menu
        </button>
        <button
          onClick={() => {
            if (!focused) return;
            activateInteraction(focused.id, cameraRef.camera);
          }}
          disabled={!focused || blocked}
          className="nx-btn nx-btn-primary h-20 w-20 rounded-full text-[11px] disabled:opacity-30"
        >
          {focused ? focused.verb.split(" ")[0] : "—"}
        </button>
      </div>

      <div className="absolute bottom-3 right-4 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-faint">
        drag to look · stick to move
      </div>
      <div className="absolute bottom-3 left-4 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-faint">
        {playerState.sector.replace("-", " ")}
      </div>
    </div>
  );
}
