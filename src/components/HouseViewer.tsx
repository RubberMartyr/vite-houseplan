import { Container, Graphics, Stage, Text as PixiText } from '@inlet/react-pixi';
import { useCallback, useEffect, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import useWinResize from '../hooks/useWinResize';
import houseSpec from '../model/houseSpec';
import createGroundLayout from '../model/layoutGround';

const palette = {
  background: 0xf8fafc,
  outline: 0x111827,
  interiorOutline: 0x334155,
  zoneLine: 0x0f766e,
  partitionLine: 0x475569,
  label: '#0f172a',
};

const HouseViewer = () => {
  const [width, height] = useWinResize();

  const layout = useMemo(
    () =>
      createGroundLayout(houseSpec, {
        maxWidth: Math.max(width - 180, 200),
        maxDepth: Math.max(height - 220, 200),
      }),
    [width, height]
  );

  useEffect(() => {
    const logLines = layout.partitions.map(
      (p) => `${p.label}: ${p.range[0]}-${p.range[1]} (len ${p.depth})`
    );
    console.info('[Ground layout]', {
      scale: layout.scale.toFixed(2),
      zones: {
        a: layout.zones.a.raw,
        b: layout.zones.b.raw,
      },
      zPartitions: logLines,
      interior: {
        width: layout.interior.width,
        depth: layout.interior.depth,
      },
    });
  }, [layout]);

  const drawPlan = useCallback(
    (g: PIXI.Graphics) => {
      const padX = 60;
      const padY = 40;

      g.clear();

      g.lineStyle(3, palette.outline, 1);
      g.beginFill(palette.background, 1);
      g.drawRect(padX, padY, layout.footprint.scaledWidth, layout.footprint.scaledDepth);
      g.endFill();

      g.lineStyle(2, palette.interiorOutline, 1);
      g.drawRect(
        padX + layout.interior.scaledOffsetX,
        padY + layout.interior.scaledOffsetZ,
        layout.interior.scaledWidth,
        layout.interior.scaledDepth
      );

      const zoneDividerX = padX + layout.zones.a.scaled[1];
      g.lineStyle(2, palette.zoneLine, 1);
      g.moveTo(zoneDividerX, padY + layout.interior.scaledOffsetZ);
      g.lineTo(zoneDividerX, padY + layout.interior.scaledOffsetZ + layout.interior.scaledDepth);

      g.lineStyle(1.5, palette.partitionLine, 0.9);
      layout.partitions.forEach((partition, idx) => {
        if (idx === layout.partitions.length - 1) return;
        const z = padY + partition.scaledRange[1];
        g.moveTo(padX + layout.interior.scaledOffsetX, z);
        g.lineTo(padX + layout.interior.scaledOffsetX + layout.interior.scaledWidth, z);
      });
    },
    [layout]
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Stage width={width} height={height} options={{ backgroundColor: 0xffffff }}>
        <Container>
          <Graphics draw={drawPlan} />
          {layout.partitions.map((partition) => {
            const centerZ = partition.scaledRange[0] + partition.depth * layout.scale * 0.5;
            const centerX = layout.zones.a.scaled[0] + layout.zones.a.scaledLength * 0.5;
            return (
              <PixiText
                key={partition.key}
                text={partition.label}
                x={60 + centerX}
                y={40 + centerZ}
                anchor={0.5}
                style={{ fill: palette.label, fontSize: 14 }}
              />
            );
          })}
        </Container>
      </Stage>
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          padding: '10px 12px',
          borderRadius: 8,
          fontFamily: 'monospace',
          color: '#0f172a',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div>Scale: {layout.scale.toFixed(2)}x</div>
        <div>
          Interior: {layout.interior.width} × {layout.interior.depth}
        </div>
        <div>
          Zone A x: {layout.zones.a.raw[0]} → {layout.zones.a.raw[1]}
        </div>
        <div>
          Zone B x: {layout.zones.b.raw[0]} → {layout.zones.b.raw[1]}
        </div>
        <div>Partitions (z):</div>
        <ul style={{ margin: '4px 0 0 12px', padding: 0 }}>
          {layout.partitions.map((p) => (
            <li key={p.key} style={{ listStyle: 'disc' }}>
              {p.label}: {p.range[0]}→{p.range[1]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HouseViewer;
