import { useRef, useCallback, useEffect } from 'react';

/**
 * Layered 8D Spatial Audio Engine
 * - Each track gets its own PannerNode orbiting the listener.
 * - Master chain feeds an AnalyserNode so visuals can react.
 */
export function useSpatialAudio() {
  const ctxRef = useRef(null);
  const tracksRef = useRef(new Map());      // id -> { source, panner, gain, buffer, startTime, offset }
  const masterGainRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  // --- Initialize audio graph on first user gesture ---
  const init = useCallback(async () => {
    if (ctxRef.current) return ctxRef.current;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;

    // Master bus
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;

    // Analyser for bass-reactive visuals
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;

    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    masterGainRef.current = masterGain;
    analyserRef.current = analyser;

    // Listener orientation (facing -Z, up +Y)
    const listener = ctx.listener;
    if (listener.forwardX) {
      listener.forwardX.value = 0;
      listener.forwardY.value = 0;
      listener.forwardZ.value = -1;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }

    return ctx;
  }, []);

  // --- Load & register a track ---
  const loadTrack = useCallback(async (id, url, options = {}) => {
    const ctx = await init();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);

    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';        // 🎧 The magic of "8D"
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;

    const gain = ctx.createGain();
    gain.gain.value = options.volume ?? 1;

    panner.connect(gain);
    gain.connect(masterGainRef.current);

    tracksRef.current.set(id, {
      buffer,
      panner,
      gain,
      source: null,
      isPlaying: false,
      orbit: {
        enabled: options.orbit ?? true,
        radius: options.radius ?? 3,
        speed: options.speed ?? 0.4,
        phase: options.phase ?? Math.random() * Math.PI * 2,
        height: options.height ?? 0,
      },
    });

    return id;
  }, [init]);

  // --- Play / stop a single track (looping) ---
  const play = useCallback((id) => {
    const ctx = ctxRef.current;
    const track = tracksRef.current.get(id);
    if (!ctx || !track || track.isPlaying) return;

    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = track.buffer;
    source.loop = true;
    source.connect(track.panner);
    source.start(0);

    track.source = source;
    track.isPlaying = true;
  }, []);

  const stop = useCallback((id) => {
    const track = tracksRef.current.get(id);
    if (!track || !track.source) return;
    try { track.source.stop(); } catch (_) {}
    track.source.disconnect();
    track.source = null;
    track.isPlaying = false;
  }, []);

  const setVolume = useCallback((id, value) => {
    const track = tracksRef.current.get(id);
    if (!track) return;
    track.gain.gain.linearRampToValueAtTime(
      value,
      ctxRef.current.currentTime + 0.05
    );
  }, []);

  const setMasterVolume = useCallback((value) => {
    if (!masterGainRef.current) return;
    masterGainRef.current.gain.linearRampToValueAtTime(
      value,
      ctxRef.current.currentTime + 0.05
    );
  }, []);

  // --- Orbit loop: gives tracks the 8D "rotating around your head" feel ---
  useEffect(() => {
    const tick = () => {
      const ctx = ctxRef.current;
      if (ctx) {
        const t = ctx.currentTime;
        tracksRef.current.forEach((track) => {
          if (!track.orbit.enabled) return;
          const { radius, speed, phase, height } = track.orbit;
          const angle = t * speed + phase;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          if (track.panner.positionX) {
            track.panner.positionX.linearRampToValueAtTime(x, t + 0.02);
            track.panner.positionY.linearRampToValueAtTime(height, t + 0.02);
            track.panner.positionZ.linearRampToValueAtTime(z, t + 0.02);
          } else {
            track.panner.setPosition(x, height, z);
          }
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return { init, loadTrack, play, stop, setVolume, setMasterVolume, getAnalyser };
}
