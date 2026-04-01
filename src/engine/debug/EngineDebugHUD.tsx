import { Html } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DerivedHouse } from '../derive/types/DerivedHouse';
import { getEngineDebugStats, setRuntimeFrameStats } from './geometryProfiler';
import type { EngineDebugStats } from './types';

type Props = {
  derived: DerivedHouse;
};

export function buildEngineDebugHudLines(stats: EngineDebugStats): string[] {
  const lines: string[] = [
    'DerivedHouse',
    `slabs: ${stats.derived.slabs}`,
    `walls: ${stats.derived.walls}`,
    `roofs: ${stats.derived.roofs}`,
    `carports: ${stats.derived.carports}`,
    `openings: ${stats.derived.openings}`,
    '',
    'Revisions',
    `slabsRev: ${stats.revisions.slabs}`,
    `wallsRev: ${stats.revisions.walls}`,
    `roofsRev: ${stats.revisions.roofs}`,
    `openingsRev: ${stats.revisions.openings}`,
    '',
    'Rebuild Counters',
    `wallRebuildCount: ${stats.rebuilds.walls}`,
    `roofRebuildCount: ${stats.rebuilds.roofs}`,
    `slabRebuildCount: ${stats.rebuilds.slabs}`,
    '',
    'Cache',
    `walls: ${stats.cache.wallHits} hits / ${stats.cache.wallMisses} misses`,
    `roofs: ${stats.cache.roofHits} hits / ${stats.cache.roofMisses} misses`,
    `slabs: ${stats.cache.slabHits} hits / ${stats.cache.slabMisses} misses`,
    '',
    'Build Times',
    `walls: ${stats.timingsMs.wallBuild.toFixed(1)}ms`,
    `roofs: ${stats.timingsMs.roofBuild.toFixed(1)}ms`,
    `slabs: ${stats.timingsMs.slabBuild.toFixed(1)}ms`,
    '',
    'Triangles',
    `walls: ${stats.geometry.wallTriangles}`,
    `roofs: ${stats.geometry.roofTriangles}`,
    `slabs: ${stats.geometry.slabTriangles}`,
    `total: ${stats.geometry.totalTriangles}`,
    '',
    'Geometry Memory',
    `${(stats.geometry.estimatedMemoryMB ?? 0).toFixed(2)} MB`,
  ];

  if (stats.roof) {
    lines.push(
      '',
      'Roof Diagnostics',
      `seamBases: ${stats.roof.seamBases}`,
      `roofRegions: ${stats.roof.roofRegions}`,
      `hipCaps: ${stats.roof.hipCaps}`,
      `ridgeSegments: ${stats.roof.ridgeSegments}`
    );
  }

  if (stats.walls) {
    lines.push(
      '',
      'Wall Diagnostics',
      `shellSegments: ${stats.walls.shellSegments}`,
      `facadePanels: ${stats.walls.facadePanels}`,
      `openingsCut: ${stats.walls.openingsCut}`
    );
  }

  lines.push('', 'Runtime', `lastChanged: ${stats.runtime.lastChangedSubsystem}`);

  if (typeof stats.runtime.fps === 'number') {
    lines.push(`fps: ${stats.runtime.fps.toFixed(0)}`);
  }

  if (typeof stats.runtime.frameMs === 'number') {
    lines.push(`frame: ${stats.runtime.frameMs.toFixed(1)}ms`);
  }

  return lines;
}

export function EngineDebugHUD({ derived }: Props) {
  const [frameTick, setFrameTick] = useState(0);
  const frameSamples = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let rafId = 0;

    const tick = (now: number) => {
      const lastFrameTime = lastFrameTimeRef.current;
      if (lastFrameTime !== null) {
        const frameMs = now - lastFrameTime;
        frameSamples.current.push(frameMs);
        if (frameSamples.current.length > 30) {
          frameSamples.current.shift();
        }
        const averageFrameMs = frameSamples.current.reduce((sum, sample) => sum + sample, 0) / frameSamples.current.length;
        setRuntimeFrameStats({
          frameMs: averageFrameMs,
          fps: averageFrameMs > 0 ? 1000 / averageFrameMs : undefined,
        });
      }

      lastFrameTimeRef.current = now;
      setFrameTick((value) => value + 1);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const stats = useMemo(
    () => getEngineDebugStats(derived),
    [
      derived,
      derived.revisions.openings,
      derived.revisions.roofs,
      derived.revisions.slabs,
      derived.revisions.walls,
      frameTick,
    ]
  );

  const lines = useMemo(() => buildEngineDebugHudLines(stats), [stats]);

  return (
    <Html prepend>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          whiteSpace: 'pre',
        }}
      >
        {lines.join('\n')}
      </div>
    </Html>
  );
}
