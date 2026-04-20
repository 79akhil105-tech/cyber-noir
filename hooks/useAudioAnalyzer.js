import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Samples the AnalyserNode each frame and exposes a smoothed
 * "bass" value (0..1) that components can subscribe to.
 */
export function useAudioAnalyzer(getAnalyser) {
  const bassRef = useRef(0);
  const midRef = useRef(0);
  const highRef = useRef(0);
  const dataRef = useRef(null);

  useFrame(() => {
    const analyser = getAnalyser?.();
    if (!analyser) return;

    if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getByteFrequencyData(dataRef.current);

    const data = dataRef.current;
    const len = data.length;

    // Bass: first ~8% of bins (≈20–200Hz at 44.1kHz / fftSize 1024)
    const bassEnd = Math.floor(len * 0.08);
    const midEnd = Math.floor(len * 0.4);

    let bassSum = 0, midSum = 0, highSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += data[i];
    for (let i = bassEnd; i < midEnd; i++) midSum += data[i];
    for (let i = midEnd; i < len; i++) highSum += data[i];

    const bass = (bassSum / bassEnd) / 255;
    const mid = (midSum / (midEnd - bassEnd)) / 255;
    const high = (highSum / (len - midEnd)) / 255;

    // Smooth (exponential easing)
    bassRef.current += (bass - bassRef.current) * 0.25;
    midRef.current  += (mid  - midRef.current)  * 0.2;
    highRef.current += (high - highRef.current) * 0.2;
  });

  return { bassRef, midRef, highRef };
}
