"use client";

import { useState } from "react";
import { chatMockup } from "@/content/lab";

/**
 * Illustrative reconstruction of the React Native messaging client.
 * Authored for NEXUS — not a screenshot of the original application.
 */
export function ChatMockup({ interactive = true }: { interactive?: boolean }) {
  const [screenRaw, setScreen] = useState("thread");
  const [selected, setSelected] = useState<string | null>(null);
  const screen = interactive ? screenRaw : "thread";

  return (
    <div className="h-[620px] w-[300px] select-text overflow-hidden rounded-[26px] border border-[#2a3a44] bg-[#05090d] font-sans text-[13px] text-[#dbe7ef] shadow-[0_0_60px_rgba(70,230,255,0.18)]">
      <div className="flex items-center justify-between border-b border-[#16232c] bg-[#071017] px-3 py-1.5 text-[9px] tracking-[0.2em] text-[#5d7b8c]">
        <span>{chatMockup.device.model}</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5cf2a8]" /> LIVE
        </span>
      </div>

      <div className="flex items-center gap-2 border-b border-[#16232c] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2f8fa3] bg-[#0d222a] text-[10px] font-semibold text-[#7fe6f8]">
          OC
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[10px] tracking-[0.18em] text-[#cfe8f2]">
            {chatMockup.contact.name}
          </div>
          <div className="text-[9px] text-[#5d7b8c]">simulated presence · illustrative</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[#16232c] px-2 py-1.5">
        {chatMockup.screens.map((s) => (
          <button
            key={s.id}
            onClick={() => interactive && setScreen(s.id)}
            tabIndex={interactive ? 0 : -1}
            className={`rounded px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.16em] transition ${
              screen === s.id
                ? "bg-[#123039] text-[#8ff0ff]"
                : "text-[#5d7b8c] hover:bg-[#0d1a20] hover:text-[#9db4c2]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="h-[440px] overflow-y-auto px-3 py-3 nx-scroll">
        {screen === "thread" && (
          <div className="space-y-2.5">
            {chatMockup.messages.map((m) => (
              <div key={m.id} className={m.from === "local" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[82%] rounded-lg border px-2.5 py-2 text-[11.5px] leading-snug ${
                    m.from === "local"
                      ? "border-[#1d5f6e] bg-[#0f2b33] text-[#d9f6ff]"
                      : "border-[#1e2c35] bg-[#0b141a] text-[#c6d6e0]"
                  }`}
                >
                  <div className="mb-1 font-mono text-[8px] tracking-[0.16em] text-[#6d8998]">
                    {m.sender} · {m.time}
                  </div>
                  {m.text}
                  <div className="mt-1 flex justify-end font-mono text-[8px] uppercase tracking-[0.14em] text-[#5f8090]">
                    {m.state}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-1 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-[#3d5563]">
              media + voice queue simulated
            </div>
          </div>
        )}

        {screen === "list" && (
          <div className="space-y-1.5">
            {["OPS CHANNEL", "FIELD UNIT 02", "ARCHIVE RELAY"].map((name, i) => (
              <button
                key={name}
                onClick={() => interactive && setSelected(name)}
                tabIndex={interactive ? 0 : -1}
                className={`w-full rounded border px-2.5 py-2 text-left transition ${
                  selected === name
                    ? "border-[#2f8fa3] bg-[#0f2b33]"
                    : "border-[#16232c] bg-[#080f14] hover:border-[#24505c]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9.5px] tracking-[0.16em] text-[#cfe8f2]">{name}</span>
                  <span className="font-mono text-[8px] text-[#4f6b7a]">0{i + 1}</span>
                </div>
                <div className="mt-1 text-[10px] text-[#6d8998]">
                  {i === 0 ? "Buffered attachment awaiting reconnect" : "Illustrative thread preview"}
                </div>
              </button>
            ))}
            <p className="pt-2 text-[9px] leading-relaxed text-[#4f6b7a]">
              Threads are derived from normalised conversation state — the list and the thread share one
              entity.
            </p>
          </div>
        )}

        {screen === "media" && (
          <div className="space-y-2">
            <div className="flex h-32 items-center justify-center rounded border border-dashed border-[#24505c] bg-[#07131a]">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5f8090]">
                camera preview
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["VIDEO", "VOICE"].map((cap) => (
                <div key={cap} className="rounded border border-[#16232c] bg-[#080f14] p-2">
                  <div className="font-mono text-[8px] tracking-[0.16em] text-[#5f8090]">{cap}</div>
                  <div className="mt-2 h-1 w-full rounded bg-[#123039]">
                    <div className="h-1 w-2/3 rounded bg-[#46e6ff]" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] leading-relaxed text-[#4f6b7a]">
              Capture is wrapped in a module that owns permissions, temporary artefacts and cleanup.
            </p>
          </div>
        )}

        {screen === "state" && (
          <div className="space-y-2">
            {chatMockup.stateFlow.map((step, i) => (
              <div key={step.id} className="rounded border border-[#16232c] bg-[#080f14] px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[8px] text-[#46e6ff]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#cfe8f2]">
                    {step.label}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-[#7f97a5]">{step.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#16232c] bg-[#071017] px-3 py-2.5">
        <div className="flex items-center gap-2 rounded border border-[#16232c] bg-[#04090d] px-2 py-1.5">
          <span className="flex-1 text-[10px] text-[#40596a]">Message…</span>
          <span className="rounded bg-[#123039] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[#8ff0ff]">
            send
          </span>
        </div>
        <div className="mt-1.5 text-center font-mono text-[7.5px] uppercase tracking-[0.18em] text-[#334b59]">
          illustrative reconstruction · not a real screenshot
        </div>
      </div>
    </div>
  );
}
