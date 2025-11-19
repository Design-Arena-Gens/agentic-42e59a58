"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './video.module.css';

const BPM = 120; // 120 beats per minute
const SECONDS_PER_BEAT = 60 / BPM; // 0.5s per beat

function useBeatClock(active: boolean) {
  const [beat, setBeat] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const tick = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const elapsed = (t - startRef.current) / 1000;
      const currentBeat = Math.floor(elapsed / SECONDS_PER_BEAT);
      setBeat(currentBeat);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [active]);

  return beat;
}

function createNoiseBuffer(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function scheduleBeatMusic(ctx: AudioContext, master: GainNode) {
  const lookahead = 0.1; // schedule ahead
  const scheduleInterval = 25; // ms
  const spb = 60 / BPM;
  let nextNoteTime = ctx.currentTime + 0.05;
  let beatCount = 0;
  const noiseBuffer = createNoiseBuffer(ctx);

  const interval = setInterval(() => {
    while (nextNoteTime < ctx.currentTime + lookahead) {
      // pattern: 4/4
      const stepInBar = beatCount % 4;

      // KICK on 1 and 3
      if (stepInBar === 0 || stepInBar === 2) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, nextNoteTime);
        osc.frequency.exponentialRampToValueAtTime(55, nextNoteTime + 0.12);
        gain.gain.setValueAtTime(0.9, nextNoteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, nextNoteTime + 0.16);
        osc.connect(gain).connect(master);
        osc.start(nextNoteTime);
        osc.stop(nextNoteTime + 0.2);
      }

      // SNARE on 2 and 4
      if (stepInBar === 1 || stepInBar === 3) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const bp = ctx.createBiquadFilter();
        bp.type = 'highpass';
        bp.frequency.value = 1200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, nextNoteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, nextNoteTime + 0.12);
        noise.connect(bp).connect(gain).connect(master);
        noise.start(nextNoteTime);
        noise.stop(nextNoteTime + 0.2);
      }

      // HIHAT on 8ths
      {
        const hat = ctx.createBufferSource();
        hat.buffer = noiseBuffer;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, nextNoteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, nextNoteTime + 0.05);
        hat.connect(hp).connect(gain).connect(master);
        hat.start(nextNoteTime);
        hat.stop(nextNoteTime + 0.08);

        const hat2 = ctx.createBufferSource();
        hat2.buffer = noiseBuffer;
        const gain2 = ctx.createGain();
        const hp2 = ctx.createBiquadFilter();
        hp2.type = 'highpass';
        hp2.frequency.value = 8000;
        const off = spb / 2;
        gain2.gain.setValueAtTime(0.16, nextNoteTime + off);
        gain2.gain.exponentialRampToValueAtTime(0.0001, nextNoteTime + off + 0.05);
        hat2.connect(hp2).connect(gain2).connect(master);
        hat2.start(nextNoteTime + off);
        hat2.stop(nextNoteTime + off + 0.08);
      }

      beatCount += 1;
      nextNoteTime += spb;
    }
  }, scheduleInterval);

  return () => clearInterval(interval);
}

function SunglassesSVG({ progress }: { progress: number }) {
  const rot = Math.sin(progress * Math.PI * 2) * 12; // gentle oscillation
  return (
    <svg className={styles.glasses} viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="frame" x1="0" x2="1">
          <stop offset="0%" stopColor="#111"/>
          <stop offset="100%" stopColor="#444"/>
        </linearGradient>
        <linearGradient id="lens" x1="0" x2="1">
          <stop offset="0%" stopColor="#001018"/>
          <stop offset="50%" stopColor="#143240"/>
          <stop offset="100%" stopColor="#001018"/>
        </linearGradient>
        <linearGradient id="glare" x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0)"/>
          <stop offset="50%" stopColor="rgba(255,255,255,.5)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <filter id="lensGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(400,150) rotate(${rot}) translate(-400,-150)`}>
        {/* bridge */}
        <rect x="385" y="138" width="30" height="8" rx="4" fill="url(#frame)" />
        {/* left frame */}
        <rect x="140" y="90" width="220" height="140" rx="44" fill="url(#frame)"/>
        <rect x="155" y="105" width="190" height="110" rx="36" fill="url(#lens)" filter="url(#lensGlow)"/>
        {/* right frame */}
        <rect x="440" y="90" width="220" height="140" rx="44" fill="url(#frame)"/>
        <rect x="455" y="105" width="190" height="110" rx="36" fill="url(#lens)" filter="url(#lensGlow)"/>
        {/* temples */}
        <rect x="90" y="120" width="50" height="16" rx="8" fill="url(#frame)"/>
        <rect x="660" y="120" width="50" height="16" rx="8" fill="url(#frame)"/>
        {/* glare sweep */}
        <rect x="145" y="105" width="190" height="110" rx="36" fill="url(#glare)" opacity=".3">
          <animate attributeName="x" from="145" to="335" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="445" y="105" width="190" height="110" rx="36" fill="url(#glare)" opacity=".3">
          <animate attributeName="x" from="445" to="635" dur="3s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}

function CityBackdrop() {
  return (
    <div className={styles.city} aria-hidden>
      <div className={styles.layer} />
      <div className={styles.layer2} />
      <div className={styles.layer3} />
    </div>
  );
}

function BeachBackdrop() {
  return (
    <div className={styles.beach} aria-hidden>
      <div className={styles.sun}></div>
      <div className={styles.wave}></div>
      <div className={styles.wave2}></div>
    </div>
  );
}

export default function VideoShowcase() {
  const [started, setStarted] = useState(false);
  const [scene, setScene] = useState(0); // 0: city, 1: beach, 2: product, 3: end
  const [pulse, setPulse] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<{ ctx: AudioContext; master: GainNode } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const beat = useBeatClock(started);

  // pulse on each beat
  useEffect(() => {
    if (!started) return;
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 100);
    return () => clearTimeout(id);
  }, [beat, started]);

  // scene timeline: city (8 beats) -> beach (8 beats) -> product (16 beats) -> end (hold)
  useEffect(() => {
    if (!started) return;
    const totalBeats = beat;
    if (totalBeats < 8) setScene(0);
    else if (totalBeats < 16) setScene(1);
    else if (totalBeats < 32) setScene(2);
    else setScene(3);
    setProgress(((totalBeats % 8) + 1) / 8);
  }, [beat, started]);

  const onStart = useCallback(async () => {
    if (audioRef.current) return setStarted(true);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.6; // master volume
    master.connect(ctx.destination);
    audioRef.current = { ctx, master };
    cleanupRef.current = scheduleBeatMusic(ctx, master);
    setStarted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (audioRef.current) audioRef.current.ctx.close();
    };
  }, []);

  return (
    <div className={`${styles.wrapper} beat ${pulse ? 'pulse' : ''}`}>
      {/* Scenes */}
      <section className={`${styles.scene} ${scene === 0 ? styles.active : ''}`}>
        <CityBackdrop />
        <div className={`${styles.overlay} zoomIn`}>
          <h1 className={`headline shadow ${styles.title}`}>????? ???? ?? ???????</h1>
        </div>
      </section>

      <section className={`${styles.scene} ${scene === 1 ? styles.active : ''}`}>
        <BeachBackdrop />
        <div className={`${styles.overlay} whip`}>
          <h1 className={`headline shadow ${styles.titleLatin}`}>Luxury or nothing.</h1>
        </div>
      </section>

      <section className={`${styles.scene} ${scene === 2 ? styles.active : ''}`}>
        <div className={styles.productBg} />
        <div className={`glint ${styles.product}`}>
          <SunglassesSVG progress={progress} />
        </div>
      </section>

      <section className={`${styles.scene} ${scene === 3 ? styles.active : ''}`}>
        <div className={styles.endBg} />
        <div className={styles.endOverlay}>
          <div className={styles.brand}>Lunabell</div>
          <div className={styles.tagline}>????? ??? ???? ??.</div>
        </div>
      </section>

      {/* Start CTA */}
      {!started && (
        <div className="cta">
          <button onClick={onStart}>Tap to Play</button>
        </div>
      )}

      {/* Watermark */}
      <div className={styles.watermark}>Lunabell</div>
    </div>
  );
}
