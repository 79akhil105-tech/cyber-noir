import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function NeonSign({ bassRef, text = 'NOIR', position = [1.8, 2.2, -3.8], color = '#ff2bd6' }) {
  const textRef = useRef();
  const lightRef = useRef();
  const baseIntensity = 2.5;

  useFrame(() => {
    const bass = bassRef.current ?? 0;
    const pulse = baseIntensity + bass * 8;
    if (textRef.current) {
      textRef.current.material.emissiveIntensity = pulse;
      textRef.current.scale.setScalar(1 + bass * 0.08);
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + bass * 6;
    }
  });

  return (
    <group position={position}>
      <pointLight ref={lightRef} color={color} distance={6} decay={2} />
      <Text
        ref={textRef}
        fontSize={0.55}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
      >
        {text}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={baseIntensity}
          toneMapped={false}
        />
      </Text>
    </group>
  );
}
