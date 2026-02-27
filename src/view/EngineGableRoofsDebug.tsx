import React, { useMemo, useRef } from "react";
import { deriveGableRoofGeometries } from "../engine/deriveGableRoofs";
import type { ArchitecturalHouse } from "../engine/architecturalTypes";
import type { MultiPlaneRoofSpec } from "../engine/types";
import { validateMultiPlaneRoof } from "../engine/validation/validateMultiPlaneRoof";
import { RoofValidationOverlay } from "./RoofValidationOverlay";

type Props = {
  arch: ArchitecturalHouse;
  visible?: boolean;
  highlightedRidgeId?: string | null;
};

export function EngineGableRoofsDebug({
  arch,
  visible = true,
  highlightedRidgeId = null,
}: Props) {
  if (!visible) return null;

  const validation = useMemo(
    () =>
      (arch.roofs ?? [])
        .filter((roof): roof is MultiPlaneRoofSpec => roof.type === 'multi-plane')
        .map((roof) => ({ roof, report: validateMultiPlaneRoof(roof) })),
    [arch]
  );

  const hasBlockingErrors = validation.some((entry) => entry.report.errors.length > 0);
  const lastGoodGeometriesRef = useRef<ReturnType<typeof deriveGableRoofGeometries>>([]);
  const geometries = useMemo(() => {
    if (hasBlockingErrors) {
      return lastGoodGeometriesRef.current;
    }

    const next = deriveGableRoofGeometries(arch);
    lastGoodGeometriesRef.current = next;
    return next;
  }, [arch, hasBlockingErrors]);

  return (
    <>
      {geometries.map((geom, i) => (
        <mesh key={i} geometry={geom}>
          <meshStandardMaterial color="black" wireframe />
        </mesh>
      ))}
      {validation.some((entry) => entry.report.errors.length || entry.report.warnings.length) && (
        <RoofValidationOverlay debug={validation} highlightedRidgeId={highlightedRidgeId} />
      )}
    </>
  );
}
