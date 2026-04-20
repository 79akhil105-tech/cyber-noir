import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { useRef } from 'react';

import { RainyWindow } from './RainyWindow';
import { NeonSign } from './NeonSign';
import { Room } from './Room';
import { useSpatialAudio } from '../hooks/useSpatialAudio';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { AudioController } from './AudioController';

// Camera that subtly sways + reacts to bass
function NoirCamera({ bassRef }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const bass = bassRef.current ?? 0;
    ref.current.position.x = Math.sin(t * 0.15) * 0.15;
    ref.current.position.y = 1.6 + Math.cos(t * 0.2) * 0.05 + bass * 0.08;
    ref.current.lookAt(0, 1.5, -4);
  });
  return <PerspectiveCamera ref={ref} makeDefault fov={55} position={[0, 1.6, 2]} />;
}

function SceneContents({ engine }) {
  const { bassRef } = useAudioAnalyzer(engine.getAnalyser);

  return (
    <>
      <NoirCamera bassRef={bassRef} />
      <fog attach="fog" args={['#0a0515', 2, 12]} />

      <Room bassRef={bassRef} />
      <RainyWindow bassRef={bassRef} />
      <NeonSign bassRef={bassRef} text="NOIR" position={[-1.8, 2.4, -3.85]} color="#ff2bd6" />
      <NeonSign bassRef={bassRef} text="2049" position={[1.8, 2.0, -3.85]} color="#00e5ff" />

      <EffectComposer>
        <Bloom intensity={1.4} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        <ChromaticAberration offset={[0.0015, 0.0015]} />
        <Noise opacity={0.04} />
        <Vignette eskil={false} offset={0.2} darkness={0.9} />
      </EffectComposer>
    </>
  );
}

export default function CyberNoirRoom() {
  const engine = useSpatialAudio();

  return (
    <>
      <AudioController engine={engine} />
      <Canvas
        shadows
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
        style={{ position: 'fixed', inset: 0, background: '#05030a' }}
      >
        <SceneContents engine={engine} />
      </Canvas>
    </>
  );
}
