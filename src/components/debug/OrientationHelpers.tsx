import React, { useMemo } from 'react';
import * as THREE from 'three';
import { leftX, rightX, frontZ, rearZ, originOffset } from '../../model/houseSpec';
import { Facade, getFacadePlane } from '../../model/orientation';

type LabelSpriteProps = {
  label?: string;
  line1?: string;
  line2?: string;
  position: [number, number, number];
  color?: string;
  scale?: number;
};

const size = 256;

const drawTwoLines = (ctx: CanvasRenderingContext2D, a: string, b: string) => {
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(a, size / 2, size / 2 - 40);
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText(b, size / 2, size / 2 + 40);
};

function useTextSprite({ label, line1, line2, color = '#111', scale = 0.5 }: LabelSpriteProps) {
  const sprite = useMemo(() => {
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
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (line1 && line2) {
        drawTwoLines(ctx, line1, line2);
      } else if (label) {
        ctx.font = 'bold 120px sans-serif';
        ctx.fillText(label, size / 2, size / 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const spriteInstance = new THREE.Sprite(material);
    spriteInstance.scale.set(scale, scale, 1);

    return spriteInstance;
  }, [color, label, line1, line2, scale]);

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

  // Facade labels were showing swapped LEFT/RIGHT in the debug overlay.
  // Keep the underlying geometry untouched and only correct the label placement.
  const facadeMarkers: { facade: Facade; position: [number, number, number] }[] = [
    { facade: 'front', position: [midX, y, frontZ] },
    { facade: 'rear', position: [midX, y, rearZ] },
    // Swap left/right label placement so the debug overlay matches the real-world sides.
    { facade: 'left', position: [rightX, y, midZ] },
    { facade: 'right', position: [leftX, y, midZ] },
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
        const line1 = facade.toUpperCase();
        const line2 = `${plane.axis}=${plane.value.toFixed(2)}`;
        return <LabelSprite key={facade} line1={line1} line2={line2} position={position} />;
      })}
      <LabelSprite label="ORIGIN" position={originMarker} color="#0b6efd" />
      {corners.map((pos, idx) => (
        <LabelSprite key={`corner-${idx}`} label={`C${idx + 1}`} position={pos} color="#6f42c1" />
      ))}
    </group>
  );
}
