import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uBass;

  // Hash & noise helpers
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Rain droplet layer
  float drops(vec2 uv, float t, float scale) {
    uv *= scale;
    vec2 id = floor(uv);
    vec2 gv = fract(uv) - 0.5;

    float n = hash(id);
    float trigger = step(0.82, n);

    // Drop falls over time, resets
    float fall = fract(t * (0.4 + n * 0.6) + n * 10.0);
    vec2 dropPos = vec2(0.0, 0.5 - fall);

    float d = length(gv - dropPos);
    float drop = smoothstep(0.08, 0.0, d) * trigger;

    // Streak behind the drop
    float streak = smoothstep(0.04, 0.0, abs(gv.x - dropPos.x))
                 * smoothstep(0.5, dropPos.y, gv.y)
                 * trigger * 0.5;

    return drop + streak;
  }

  void main() {
    vec2 uv = vUv;

    // Distort with noise to simulate wet glass
    float n = noise(uv * 8.0 + uTime * 0.05);
    vec2 distorted = uv + vec2(n - 0.5) * 0.02;

    // City silhouette colors (cyan + magenta noir palette)
    vec3 skyTop    = vec3(0.02, 0.01, 0.06);
    vec3 skyBottom = vec3(0.12, 0.02, 0.18);
    vec3 bg = mix(skyBottom, skyTop, distorted.y);

    // Distant neon blobs
    float neonA = smoothstep(0.35, 0.0, length(distorted - vec2(0.3, 0.55)));
    float neonB = smoothstep(0.3, 0.0, length(distorted - vec2(0.72, 0.48)));
    bg += vec3(0.9, 0.2, 0.8) * neonA * 0.45;
    bg += vec3(0.1, 0.8, 1.0) * neonB * 0.55;

    // Bass pulse tints the whole window
    bg += vec3(0.6, 0.1, 0.9) * uBass * 0.25;

    // Multi-scale rain
    float rain = 0.0;
    rain += drops(uv, uTime, 10.0);
    rain += drops(uv + 0.3, uTime * 1.2, 18.0) * 0.7;
    rain += drops(uv - 0.1, uTime * 0.9, 26.0) * 0.5;

    vec3 col = bg + vec3(rain) * 0.6;

    // Vignette
    float vig = smoothstep(1.1, 0.3, length(uv - 0.5));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function RainyWindow({ bassRef, position = [0, 1.2, -3.95], size = [4, 2.5] }) {
  const matRef = useRef();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBass: { value: 0 },
  }), []);

  useFrame((_, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
    matRef.current.uniforms.uBass.value = bassRef.current ?? 0;
  });

  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}
