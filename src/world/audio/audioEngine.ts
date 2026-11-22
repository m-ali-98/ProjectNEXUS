/**
 * NEXUS — procedural audio engine.
 *
 * Every sound in the facility is synthesised at runtime with the Web Audio API:
 * filtered noise beds, low drones and short UI transients. No audio files, no
 * autoplay, and full user control over master / music / effects levels.
 */
import type { SectorId } from "@/content/sectors";

type Bed = { gain: GainNode; nodes: AudioNode[] };

const SECTOR_SOUND: Record<SectorId, { notes: number[]; filter: number; noise: number; lfo: number }> = {
  atrium: { notes: [55, 82.4, 110], filter: 420, noise: 0.5, lfo: 0.06 },
  "application-lab": { notes: [110, 164.8, 220], filter: 1400, noise: 0.22, lfo: 0.12 },
  "systems-core": { notes: [73.4, 110, 146.8], filter: 900, noise: 0.3, lfo: 0.18 },
  infrastructure: { notes: [61.7, 92.5, 123.5], filter: 620, noise: 0.85, lfo: 0.05 },
  "network-operations": { notes: [98, 147, 196], filter: 1100, noise: 0.25, lfo: 0.09 },
  "project-archive": { notes: [65.4, 98, 130.8], filter: 520, noise: 0.4, lfo: 0.04 },
  "personal-quarters": { notes: [87.3, 130.8, 174.6], filter: 760, noise: 0.18, lfo: 0.07 },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private bed: Bed | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private sector: SectorId = "atrium";
  private volumes = { master: 0.7, music: 0.45, sfx: 0.7, muted: false };
  ready = false;

  private ensureContext() {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.music = ctx.createGain();
    this.sfx = ctx.createGain();
    this.music.connect(this.master);
    this.sfx.connect(this.master);
    this.master.connect(ctx.destination);
    this.applyVolumes();

    // pink-ish noise buffer, 4 s, reused by every noise source
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    this.noiseBuffer = buffer;
    return ctx;
  }

  async start() {
    const ctx = this.ensureContext();
    if (!ctx) return false;
    try {
      if (ctx.state === "suspended") await ctx.resume();
      this.ready = true;
      this.setSector(this.sector, true);
      return true;
    } catch {
      return false;
    }
  }

  setVolumes(v: Partial<{ master: number; music: number; sfx: number; muted: boolean }>) {
    this.volumes = { ...this.volumes, ...v };
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx || !this.master || !this.music || !this.sfx) return;
    const t = this.ctx.currentTime;
    const mute = this.volumes.muted ? 0 : 1;
    this.master.gain.setTargetAtTime(this.volumes.master * mute, t, 0.05);
    this.music.gain.setTargetAtTime(this.volumes.music, t, 0.05);
    this.sfx.gain.setTargetAtTime(this.volumes.sfx, t, 0.05);
  }

  setSector(sector: SectorId, immediate = false) {
    this.sector = sector;
    if (!this.ready || !this.ctx || !this.music) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (this.bed) {
      const old = this.bed;
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setTargetAtTime(0, now, 0.35);
      window.setTimeout(() => {
        old.nodes.forEach((n) => {
          try {
            (n as OscillatorNode).stop?.();
          } catch {
            /* already stopped */
          }
          n.disconnect();
        });
        old.gain.disconnect();
      }, 2200);
      this.bed = null;
    }

    const cfg = SECTOR_SOUND[sector];
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0;
    bedGain.connect(this.music);

    const nodes: AudioNode[] = [];

    // drone stack
    cfg.notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      const detune = ctx.createOscillator();
      detune.frequency.value = cfg.lfo * (i + 1);
      const detuneGain = ctx.createGain();
      detuneGain.gain.value = 2.2;
      detune.connect(detuneGain);
      detuneGain.connect(osc.detune);
      const oscGain = ctx.createGain();
      oscGain.gain.value = i === 0 ? 0.16 : 0.06;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cfg.filter;
      osc.connect(oscGain);
      oscGain.connect(filter);
      filter.connect(bedGain);
      osc.start();
      detune.start();
      nodes.push(osc, detune, detuneGain, oscGain, filter);
    });

    // environmental noise
    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = sector === "infrastructure" ? 380 : 900;
      bp.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.value = 0.1 * cfg.noise;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.035 * cfg.noise;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      src.connect(bp);
      bp.connect(gain);
      gain.connect(bedGain);
      src.start();
      lfo.start();
      nodes.push(src, bp, gain, lfo, lfoGain);
    }

    if (sector === "infrastructure") {
      // ventilation pulse
      const fan = ctx.createOscillator();
      fan.type = "sawtooth";
      fan.frequency.value = 42;
      const fanFilter = ctx.createBiquadFilter();
      fanFilter.type = "lowpass";
      fanFilter.frequency.value = 150;
      const fanGain = ctx.createGain();
      fanGain.gain.value = 0.05;
      fan.connect(fanFilter);
      fanFilter.connect(fanGain);
      fanGain.connect(bedGain);
      fan.start();
      nodes.push(fan, fanFilter, fanGain);
    }

    bedGain.gain.setTargetAtTime(immediate ? 0.9 : 0, now, immediate ? 0.01 : 0.6);
    if (!immediate) bedGain.gain.setTargetAtTime(0.9, now + 0.5, 0.9);

    this.bed = { gain: bedGain, nodes };
  }

  private transient(freq: number, duration: number, type: OscillatorType, gainPeak: number, sweepTo?: number) {
    const ctx = this.ctx;
    if (!ctx || !this.sfx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.sfx);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private noiseHit(duration: number, freq: number, gainPeak: number) {
    const ctx = this.ctx;
    if (!ctx || !this.sfx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(freq * 2, now);
    filter.frequency.exponentialRampToValueAtTime(freq, now + duration);
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    src.start(now);
    src.stop(now + duration + 0.05);
  }

  play(kind: "focus" | "open" | "close" | "travel" | "discover" | "deny" | "step") {
    if (!this.ready || !this.ctx) return;
    switch (kind) {
      case "focus":
        this.transient(880, 0.08, "sine", 0.035, 1180);
        break;
      case "open":
        this.transient(320, 0.16, "triangle", 0.05, 640);
        this.noiseHit(0.18, 2400, 0.02);
        break;
      case "close":
        this.transient(420, 0.14, "triangle", 0.04, 220);
        break;
      case "travel":
        this.noiseHit(0.9, 420, 0.05);
        this.transient(70, 0.9, "sine", 0.11, 48);
        break;
      case "discover":
        this.transient(660, 0.22, "sine", 0.05);
        window.setTimeout(() => this.transient(990, 0.34, "sine", 0.045), 130);
        break;
      case "deny":
        this.transient(180, 0.18, "square", 0.03, 120);
        break;
      case "step":
        this.noiseHit(0.07, 320, 0.012);
        break;
    }
  }

  setVolumeProxy() {
    return this.volumes;
  }

  dispose() {
    this.bed?.nodes.forEach((n) => {
      try {
        (n as OscillatorNode).stop?.();
      } catch {
        /* noop */
      }
      n.disconnect();
    });
    this.ctx?.close();
    this.ctx = null;
    this.ready = false;
  }
}

let engine: AudioEngine | null = null;
export function getAudio() {
  if (!engine) engine = new AudioEngine();
  return engine;
}
