import React from 'react';
import type { ArchitecturalHouse } from './architecturalTypes';
import type { DerivedSlab } from './derive/deriveSlabs';
import { EngineFlatRoofsDebug } from '../view/EngineFlatRoofsDebug';
import { EngineGableRoofsDebug } from '../view/EngineGableRoofsDebug';
import { EngineSlabsDebug } from '../view/EngineSlabsDebug';
import { EngineWallShellsDebug } from '../view/EngineWallShellsDebug';

type Props = {
  debugEngineWalls: boolean;
  architecturalHouse: ArchitecturalHouse;
  derivedSlabs: DerivedSlab[];
  roofRevision: number;
};

export function EngineHouse({ debugEngineWalls, architecturalHouse, derivedSlabs, roofRevision }: Props) {
  return (
    <>
      <EngineWallShellsDebug visible={debugEngineWalls} arch={architecturalHouse} />
      <EngineSlabsDebug visible={debugEngineWalls} slabs={derivedSlabs} />
      <EngineFlatRoofsDebug arch={architecturalHouse} roofRevision={roofRevision} />
      <EngineGableRoofsDebug arch={architecturalHouse} roofRevision={roofRevision} />
    </>
  );
}
