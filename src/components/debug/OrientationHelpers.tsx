import React, { useMemo } from 'react';
import * as THREE from 'three';
import { leftX, rightX, frontZ, rearZ, originOffset } from '../../model/houseSpec';
import { Facade, getFacadePlane } from '../../model/orientation';

type LabelSpriteProps = {
  label: string;
  position: [number, number, number];
  color?: string;
  scale?: number;
};

function useTextSprite({ label, color = '#111', scale = 0.5 }: LabelSpriteProps) {
  const sprite = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, size, size);
      ctx.fillStyle = color;
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, size / 2, size / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const spriteInstance = new THREE.Sprite(material);
    spriteInstance.scale.set(scale, scale, 1);

    return spriteInstance;
  }, [color, label, scale]);

  return sprite;
}

function LabelSprite(props: LabelSpriteProps) {
  const sprite = useTextSprite(props);
  return <primitive object={sprite} position={props.position} />;
}

export function OrientationHelpers({ visible = false }: { visible?: boolean }) {
  const axes = useMemo(() => new THREE.AxesHelper(3), []);
  const midX = (leftX + rightX) / 2;
  const midZ = (frontZ + rearZ) / 2;
  const y = 0.05;

  const facadeMarkers: { facade: Facade; position: [number, number, number] }[] = [
    { facade: 'front', position: [midX, y, frontZ] },
    { facade: 'rear', position: [midX, y, rearZ] },
    { facade: 'left', position: [leftX, y, midZ] },
    { facade: 'right', position: [rightX, y, midZ] },
  ];

  const corners: [number, number, number][] = [
    [leftX, y, frontZ],
    [rightX, y, frontZ],
    [leftX, y, rearZ],
    [rightX, y, rearZ],
  ];

  const originMarker: [number, number, number] = [0, y, 0];

  if (!visible) return null;

  return (
    <group position={[originOffset.x, 0, originOffset.z]}>
      <primitive object={axes} />
      {facadeMarkers.map(({ facade, position }) => {
        const plane = getFacadePlane(facade);
        const label = `${facade.toUpperCase()} (${plane.axis}=${plane.value.toFixed(2)})`;
        return <LabelSprite key={facade} label={label} position={position} />;
      })}
      <LabelSprite label="ORIGIN" position={originMarker} color="#0b6efd" />
      {corners.map((pos, idx) => (
        <LabelSprite key={`corner-${idx}`} label={`CORNER ${idx + 1}`} position={pos} color="#6f42c1" />
      ))}
    </group>
  );
}
