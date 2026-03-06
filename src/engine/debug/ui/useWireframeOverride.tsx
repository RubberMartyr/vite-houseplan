import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  enabled: boolean;
};

export function WireframeOverride({ enabled }: Props) {
  const { scene } = useThree();
  const previousOverrideRef = useRef<THREE.Material | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    previousOverrideRef.current = scene.overrideMaterial;
    const wireframe = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff });
    scene.overrideMaterial = wireframe;

    return () => {
      wireframe.dispose();
      scene.overrideMaterial = previousOverrideRef.current;
      previousOverrideRef.current = null;
    };
  }, [enabled, scene]);

  useEffect(() => {
    if (enabled) {
      return;
    }

    scene.overrideMaterial = previousOverrideRef.current;
    previousOverrideRef.current = null;
  }, [enabled, scene]);

  return null;
}
