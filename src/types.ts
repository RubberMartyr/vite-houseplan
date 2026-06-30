export type PointXZ = {
  x: number;
  z: number;
};

export type DraftHouseModel = {
  site?: {
    color?: string;
    elevation?: number;
    footprint?: {
      outer?: PointXZ[];
    };
    parcel?: {
      outer?: PointXZ[];
      source?: "official-api" | "manual" | "unknown" | string;
    };
    surfaces?: unknown[];
    objects?: unknown[];
    boundaries?: unknown;
  };

  parcel?: {
    outer: PointXZ[];
    source?: "official-api" | "manual" | "unknown";
  };

  levels?: DraftHouseLevel[];

  walls?: DraftWall[];

  roof?: unknown;

  openings?: unknown[];

  rooms?: unknown[];

  diagnostics?: {
    stage?: string;
    warnings?: string[];
    confidence?: number;
  };
};

export type DraftHouseLevel = {
  id: string;
  name?: string;
  elevation?: number;
  height?: number;
  slab?: {
    thickness?: number;
    inset?: number;
  };
  footprint?: {
    outer: PointXZ[];
    confidence?: number;
  };
};

export type DraftWall = {
  id: string;
  levelId?: string;
  start: PointXZ;
  end: PointXZ;
  height?: number;
  thickness?: number;
};

export type HouseviewerJson = any;

export type HouseViewerProps = {
  model?: DraftHouseModel | HouseviewerJson | null;
  mode?: "wireframe" | "solid";
  showHelpers?: boolean;
  className?: string;
  presentationMode?: boolean;
  /**
   * Legacy presentation-only multiplier for the vertical camera target lift.
   * Prefer presentationCamera.targetYOffset for explicit camera framing.
   */
  presentationVerticalOffset?: number;
  /**
   * Presentation camera framing controls.
   * - distanceMultiplier: larger values move the camera farther away.
   * - targetYOffset: world-space Y offset for the orbit/framing target; positive is up.
   * - screenYOffset: normalized vertical screen offset; positive moves the model up in the frame.
   * - pitchDegrees: camera pitch above the horizontal plane; positive looks downward from above.
   */
  presentationCamera?: {
    distanceMultiplier?: number;
    targetYOffset?: number;
    screenYOffset?: number;
    pitchDegrees?: number;
  };
  autoRotate?: boolean;
  autoRotateDurationMs?: number;
  autoRotateStartAngle?: "right" | "front" | "left" | "back" | number;
  revealOnLoad?: boolean;
  plotRevealDurationMs?: number;
  baseplateRevealDurationMs?: number;
  revealDurationMs?: number;
};
