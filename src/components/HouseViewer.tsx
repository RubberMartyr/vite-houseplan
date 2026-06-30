import React, {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import { EngineHouse } from "../engine/EngineHouse";
import type {
  ArchitecturalHouse,
  LevelSpec,
  SiteSpec,
} from "../engine/architecturalTypes";
import type { DraftHouseModel, HouseViewerProps, PointXZ } from "../types";
import { markFirstFrameRendered } from "../loadingManager";
import type { ValidationLogEntry } from "../engine/debug/ui/tabs/RenderingTab";
import type { VisibilityState } from "../engine/debug/ui/tabs/VisibilityTab";
import {
  type FloorplanValidationResult,
  validateFloorplan,
} from "../engine/validation/validateFloorplan";
import { debugFlags } from "../engine/debug/debugFlags";
import { RoomInfoCard } from "./RoomInfoCard";
import {
  getRenderableGeometrySummary,
  getSiteFootprint,
  getValidLevelFootprints,
  isValidPolygon,
} from "../engine/modelGeometry";
import { archToWorldXZ } from "../engine/spaceMapping";

const DebugButton = lazy(() =>
  import("../engine/debug/ui/DebugButton").then((module) => ({
    default: module.DebugButton,
  })),
);
const DebugDashboard = lazy(() =>
  import("../engine/debug/ui/DebugDashboard").then((module) => ({
    default: module.DebugDashboard,
  })),
);
const WireframeOverride = lazy(() =>
  import("../engine/debug/ui/useWireframeOverride").then((module) => ({
    default: module.WireframeOverride,
  })),
);
const DebugEdges = lazy(() =>
  import("./debug/DebugEdges").then((module) => ({
    default: module.DebugEdges,
  })),
);
const FloorplanValidationOverlay = lazy(() =>
  import("../engine/debug/FloorplanValidationOverlay").then((module) => ({
    default: module.FloorplanValidationOverlay,
  })),
);

function FirstFrameMarker() {
  const firstFrameRef = useRef(false);

  useFrame(() => {
    if (firstFrameRef.current) {
      return;
    }

    firstFrameRef.current = true;
    markFirstFrameRendered();
  });

  return null;
}

type ModelBounds = {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  radius: number;
};

const PRESENTATION_FRAME_PADDING = 1.35;
const DEFAULT_PRESENTATION_VERTICAL_OFFSET = 1;
const DEFAULT_PRESENTATION_CAMERA_DISTANCE_MULTIPLIER = 1.15;
const DEFAULT_PRESENTATION_CAMERA_PITCH_DEGREES = 20;

type PresentationCameraOptions = NonNullable<
  HouseViewerProps["presentationCamera"]
>;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function expandBoundsWithArchPoint(
  bounds: THREE.Box3,
  point: PointXZ,
  minY = 0,
  maxY = 0,
) {
  const worldPoint = archToWorldXZ(point);
  bounds.expandByPoint(new THREE.Vector3(worldPoint.x, minY, worldPoint.z));
  bounds.expandByPoint(new THREE.Vector3(worldPoint.x, maxY, worldPoint.z));
}

function expandBoundsWithPolygon(
  bounds: THREE.Box3,
  polygon: PointXZ[] | undefined,
  minY = 0,
  maxY = 0,
) {
  if (!isValidPolygon(polygon)) {
    return;
  }

  polygon.forEach((point) =>
    expandBoundsWithArchPoint(bounds, point, minY, maxY),
  );
}

function getRenderableModelBounds(
  model: ArchitecturalHouse,
  summary: ReturnType<typeof getRenderableGeometrySummary>,
): ModelBounds | null {
  const bounds = new THREE.Box3();

  expandBoundsWithPolygon(
    bounds,
    summary.siteFootprint ?? undefined,
    model.site?.elevation ?? 0,
    model.site?.elevation ?? 0,
  );
  expandBoundsWithPolygon(
    bounds,
    summary.parcel ?? undefined,
    model.site?.elevation ?? 0,
    model.site?.elevation ?? 0,
  );

  for (const surface of model.site?.surfaces ?? []) {
    const minY = surface.elevation ?? model.site?.elevation ?? 0;
    const maxY = minY + (isFiniteNumber(surface.height) ? surface.height : 0);
    expandBoundsWithPolygon(bounds, surface.polygon, minY, maxY);
  }

  for (const object of model.site?.objects ?? []) {
    if (object.type === "carport") {
      expandBoundsWithPolygon(
        bounds,
        object.footprint.outer,
        model.site?.elevation ?? 0,
        model.site?.elevation ?? 0,
      );
    }
  }

  for (const { level, outer } of summary.levelFootprints) {
    const slabBottom = level.elevation - (level.slab?.thickness ?? 0);
    const levelTop = level.elevation + level.height;
    expandBoundsWithPolygon(bounds, outer, slabBottom, levelTop);
  }

  const levelById = new Map(model.levels.map((level) => [level.id, level]));
  for (const roof of model.roofs ?? []) {
    const baseLevel = levelById.get(roof.baseLevelId);
    if (!baseLevel) {
      continue;
    }

    const roofTop =
      roof.type === "gable"
        ? baseLevel.elevation + roof.ridgeHeight
        : "ridgeSegments" in roof && Array.isArray(roof.ridgeSegments)
          ? baseLevel.elevation +
            Math.max(0, ...roof.ridgeSegments.map((ridge) => ridge.height))
          : baseLevel.elevation +
            baseLevel.height +
            ("thickness" in roof ? (roof.thickness ?? 0) : 0);
    expandBoundsWithPolygon(
      bounds,
      baseLevel.footprint.outer,
      baseLevel.elevation + baseLevel.height,
      roofTop,
    );
  }

  if (bounds.isEmpty()) {
    return null;
  }

  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  return {
    min: bounds.min.clone(),
    max: bounds.max.clone(),
    center,
    size,
    radius: Math.max(size.x, size.y, size.z, 6) * PRESENTATION_FRAME_PADDING,
  };
}

function getPresentationFrameTarget(
  modelBounds: ModelBounds,
  presentationVerticalOffset = DEFAULT_PRESENTATION_VERTICAL_OFFSET,
  presentationCamera?: PresentationCameraOptions,
): THREE.Vector3 {
  const target = modelBounds.center.clone();
  const modelSize = Math.max(
    modelBounds.size.x,
    modelBounds.size.y,
    modelBounds.size.z,
  );
  const baseLift = Math.max(modelBounds.size.y * 0.25, modelSize * 0.08);
  const flatModelLift =
    modelBounds.size.y < modelBounds.radius * 0.12
      ? modelBounds.radius * 0.15
      : 0;

  target.y += (baseLift + flatModelLift) * presentationVerticalOffset;
  target.y += presentationCamera?.targetYOffset ?? 0;

  return target;
}

function getFrameTarget(
  modelBounds: ModelBounds,
  presentationMode: boolean,
  presentationVerticalOffset?: number,
  presentationCamera?: PresentationCameraOptions,
): THREE.Vector3 {
  if (!presentationMode) {
    return modelBounds.center.clone();
  }

  return getPresentationFrameTarget(
    modelBounds,
    presentationVerticalOffset,
    presentationCamera,
  );
}

function getCameraLookAtTarget(
  target: THREE.Vector3,
  modelBounds: ModelBounds,
  presentationMode: boolean,
  presentationCamera?: PresentationCameraOptions,
): THREE.Vector3 {
  const lookAtTarget = target.clone();

  if (!presentationMode) {
    return lookAtTarget;
  }

  // Positive screenYOffset intentionally moves the model up in the rendered
  // frame by aiming the camera lower than the orbit/framing target.
  lookAtTarget.y -=
    (presentationCamera?.screenYOffset ?? 0) * modelBounds.radius;

  return lookAtTarget;
}

function AutoFrameCamera({
  model,
  presentationMode,
  presentationVerticalOffset,
  presentationCamera,
  summary,
}: {
  model: ArchitecturalHouse;
  presentationMode: boolean;
  presentationVerticalOffset?: number;
  presentationCamera?: PresentationCameraOptions;
  summary: ReturnType<typeof getRenderableGeometrySummary>;
}) {
  const { camera, controls, size } = useThree();

  useEffect(() => {
    const modelBounds = getRenderableModelBounds(model, summary);

    if (!modelBounds) {
      return;
    }

    const { center, radius } = modelBounds;
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.degToRad(perspectiveCamera.fov);
    const aspect =
      size.width > 0 && size.height > 0 ? size.width / size.height : 1;
    const fitHeightDistance = radius / (2 * Math.tan(fov / 2));
    const fitWidthDistance = fitHeightDistance / Math.max(aspect, 0.1);
    const distance =
      Math.max(fitHeightDistance, fitWidthDistance) *
      (presentationMode
        ? (presentationCamera?.distanceMultiplier ??
          DEFAULT_PRESENTATION_CAMERA_DISTANCE_MULTIPLIER)
        : 1);
    const fallbackElevation = Math.max(
      radius * 0.42,
      modelBounds.size.y * 1.2,
      3,
    );
    const target = getFrameTarget(
      modelBounds,
      presentationMode,
      presentationVerticalOffset,
      presentationCamera,
    );
    const lookAtTarget = getCameraLookAtTarget(
      target,
      modelBounds,
      presentationMode,
      presentationCamera,
    );

    if (presentationMode) {
      const pitchDegrees =
        presentationCamera?.pitchDegrees ??
        DEFAULT_PRESENTATION_CAMERA_PITCH_DEGREES;
      const pitchRadians = THREE.MathUtils.degToRad(
        THREE.MathUtils.clamp(pitchDegrees, -89, 89),
      );
      const horizontalDistance = Math.max(distance * Math.cos(pitchRadians), 1);
      const elevation = distance * Math.sin(pitchRadians);

      camera.position.set(
        center.x,
        target.y + elevation,
        center.z + horizontalDistance,
      );
    } else {
      camera.position.set(
        center.x,
        target.y + fallbackElevation,
        center.z + distance,
      );
    }

    camera.lookAt(lookAtTarget);
    perspectiveCamera.near = Math.max(0.01, distance - radius * 3);
    perspectiveCamera.far = Math.max(100, distance + radius * 5);
    perspectiveCamera.updateProjectionMatrix();

    const orbitControls = controls as
      | { target?: THREE.Vector3; update?: () => void }
      | undefined;
    orbitControls?.target?.copy(lookAtTarget);
    orbitControls?.update?.();
  }, [
    camera,
    controls,
    model,
    presentationCamera,
    presentationMode,
    presentationVerticalOffset,
    size.height,
    size.width,
    summary,
  ]);

  return null;
}

function PresentationAutoRotate({
  enabled,
  model,
  summary,
  durationMs = DEFAULT_AUTO_ROTATE_DURATION_MS,
  startAngle,
  presentationVerticalOffset,
  presentationCamera,
}: {
  enabled: boolean;
  model: ArchitecturalHouse;
  summary: ReturnType<typeof getRenderableGeometrySummary>;
  durationMs?: number;
  startAngle?: HouseViewerProps["autoRotateStartAngle"];
  presentationVerticalOffset?: number;
  presentationCamera?: PresentationCameraOptions;
}) {
  const { camera, controls } = useThree();
  const disabledByUserRef = useRef(false);
  const elapsedRef = useRef(0);
  const radiusRef = useRef(12);
  const targetRef = useRef(new THREE.Vector3());
  const lookAtTargetRef = useRef(new THREE.Vector3());
  const baseAngleRef = useRef(getStartAngleRadians(startAngle));

  useEffect(() => {
    disabledByUserRef.current = false;
    elapsedRef.current = 0;
    baseAngleRef.current = getStartAngleRadians(startAngle);

    const modelBounds = getRenderableModelBounds(model, summary);

    if (modelBounds) {
      targetRef.current.copy(
        getPresentationFrameTarget(
          modelBounds,
          presentationVerticalOffset,
          presentationCamera,
        ),
      );
      lookAtTargetRef.current.copy(
        getCameraLookAtTarget(
          targetRef.current,
          modelBounds,
          true,
          presentationCamera,
        ),
      );
    } else {
      targetRef.current.set(0, 0, 0);
      lookAtTargetRef.current.set(0, 0, 0);
    }

    const offset = camera.position.clone().sub(targetRef.current);
    radiusRef.current = Math.max(Math.hypot(offset.x, offset.z), 1);
  }, [
    camera,
    model,
    presentationCamera,
    presentationVerticalOffset,
    startAngle,
    summary,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      !controls ||
      typeof (controls as THREE.EventDispatcher).addEventListener !== "function"
    ) {
      return;
    }

    const orbitControls = controls as {
      addEventListener: (type: "start", listener: () => void) => void;
      removeEventListener: (type: "start", listener: () => void) => void;
    };
    const handleManualStart = () => {
      disabledByUserRef.current = true;
    };

    orbitControls.addEventListener("start", handleManualStart);
    return () => {
      orbitControls.removeEventListener("start", handleManualStart);
    };
  }, [controls, enabled]);

  useFrame((_, delta) => {
    if (
      !enabled ||
      disabledByUserRef.current ||
      !summary.hasRenderableGeometry
    ) {
      return;
    }

    const safeDurationMs = Math.max(durationMs, 1000);
    elapsedRef.current += delta * 1000;
    const angle =
      baseAngleRef.current +
      (elapsedRef.current / safeDurationMs) * Math.PI * 2;
    const target = targetRef.current;
    const lookAtTarget = lookAtTargetRef.current;
    const radius = radiusRef.current;

    camera.position.x = target.x + Math.cos(angle) * radius;
    camera.position.z = target.z + Math.sin(angle) * radius;
    camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);

    const orbitControls = controls as
      | { target?: THREE.Vector3; update?: () => void }
      | undefined;
    orbitControls?.target?.copy(lookAtTarget);
    orbitControls?.update?.();
  });

  return null;
}

type RevealOpacity = {
  site: number;
  building: number;
};

const smoothstep = (progress: number) => {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  return t * t * (3 - 2 * t);
};

function useStagedRevealOpacity({
  enabled,
  isRenderable,
  modelKey,
  plotDurationMs,
  baseplateDurationMs,
}: {
  enabled: boolean;
  isRenderable: boolean;
  modelKey: string;
  plotDurationMs: number;
  baseplateDurationMs: number;
}): RevealOpacity {
  const [opacity, setOpacity] = useState<RevealOpacity>({
    site: 1,
    building: 1,
  });
  const revealStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !isRenderable) {
      revealStartRef.current = null;
      setOpacity({ site: 1, building: 1 });
      return;
    }

    revealStartRef.current = performance.now();
    setOpacity({ site: 0.08, building: 0 });
  }, [enabled, isRenderable, modelKey]);

  useFrame(() => {
    if (!enabled || !isRenderable || revealStartRef.current === null) {
      return;
    }

    const elapsed = performance.now() - revealStartRef.current;
    const safePlotDurationMs = Math.max(plotDurationMs, 1);
    const safeBaseplateDurationMs = Math.max(baseplateDurationMs, 1);
    const plotProgress = smoothstep(elapsed / safePlotDurationMs);
    const baseplateProgress = smoothstep(
      (elapsed - safePlotDurationMs) / safeBaseplateDurationMs,
    );
    const nextOpacity = {
      site: THREE.MathUtils.lerp(0.08, 1, plotProgress),
      building: baseplateProgress,
    };

    if (plotProgress >= 1 && baseplateProgress >= 1) {
      revealStartRef.current = null;
      setOpacity({ site: 1, building: 1 });
      return;
    }

    setOpacity(nextOpacity);
  });

  return opacity;
}

function StagedRevealHouse({
  revealEnabled,
  isRenderable,
  modelKey,
  plotDurationMs,
  baseplateDurationMs,
  children,
}: {
  revealEnabled: boolean;
  isRenderable: boolean;
  modelKey: string;
  plotDurationMs: number;
  baseplateDurationMs: number;
  children: (opacity: RevealOpacity) => React.ReactNode;
}) {
  const opacity = useStagedRevealOpacity({
    enabled: revealEnabled,
    isRenderable,
    modelKey,
    plotDurationMs,
    baseplateDurationMs,
  });

  return <>{children(opacity)}</>;
}

function DebugAxes() {
  const { scene } = useThree();
  const helperRef = useRef<THREE.AxesHelper | null>(null);

  useEffect(() => {
    if (!debugFlags.enabled) {
      return;
    }

    const axes = new THREE.AxesHelper(5);
    scene.add(axes);
    helperRef.current = axes;

    return () => {
      if (helperRef.current) {
        scene.remove(helperRef.current);
      }
    };
  }, [scene]);

  return null;
}

type ToggleState = {
  shellVisible: boolean;
  showDebug: boolean;
  visibility: VisibilityState;
};

type SelectedRoomState = {
  id: string;
  name: string;
  levelName?: string;
};

const toolbarStyle: React.CSSProperties = {
  position: "absolute",
  top: 16,
  left: 16,
  zIndex: 11,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  maxWidth: "min(88vw, 760px)",
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(125, 160, 212, 0.24)",
  background: "rgba(7, 13, 24, 0.62)",
  boxShadow: "0 16px 34px rgba(4, 8, 15, 0.35)",
  backdropFilter: "blur(10px)",
};

const noticeStyle: React.CSSProperties = {
  position: "absolute",
  right: 16,
  bottom: 16,
  zIndex: 10,
  maxWidth: 360,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(96, 165, 250, 0.38)",
  background: "rgba(15, 23, 42, 0.78)",
  color: "#e0f2fe",
  fontSize: 13,
  fontWeight: 700,
  boxShadow: "0 14px 28px rgba(15, 23, 42, 0.25)",
  backdropFilter: "blur(10px)",
};

const baseToggleStyle: React.CSSProperties = {
  border: "1px solid rgba(146, 165, 196, 0.4)",
  borderRadius: 999,
  padding: "8px 15px",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.25,
  cursor: "pointer",
  transition: "all 180ms ease",
};

const shellSwitchTrackStyle: React.CSSProperties = {
  position: "relative",
  width: 64,
  height: 34,
  borderRadius: 999,
  border: "none",
  padding: 0,
  cursor: "pointer",
  transition: "background 180ms ease, box-shadow 180ms ease",
};

const shellSwitchKnobStyle: React.CSSProperties = {
  position: "absolute",
  top: 3,
  left: 3,
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#f5fbff",
  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.38)",
  transition: "transform 180ms ease",
};

const DEFAULT_AUTO_ROTATE_DURATION_MS = 60000;
const DEFAULT_PLOT_REVEAL_DURATION_MS = 3000;
const DEFAULT_BASEPLATE_REVEAL_DURATION_MS = 3000;
const DEFAULT_REVEAL_DURATION_MS =
  DEFAULT_PLOT_REVEAL_DURATION_MS + DEFAULT_BASEPLATE_REVEAL_DURATION_MS;

const getStartAngleRadians = (
  angle: HouseViewerProps["autoRotateStartAngle"],
): number => {
  if (typeof angle === "number" && Number.isFinite(angle)) {
    return THREE.MathUtils.degToRad(angle);
  }

  switch (angle) {
    case "front":
      return Math.PI / 2;
    case "left":
      return Math.PI;
    case "back":
      return Math.PI * 1.5;
    case "right":
    default:
      return 0;
  }
};

const EMPTY_ARCHITECTURAL_HOUSE: ArchitecturalHouse = {
  wallThickness: 0.3,
  levels: [],
  openings: [],
  rooms: [],
  roofs: [],
};

const isPointList = (value: unknown): value is PointXZ[] =>
  isValidPolygon(value);

const hasArchitecturalLevels = (model: unknown): model is ArchitecturalHouse =>
  typeof model === "object" &&
  model !== null &&
  Array.isArray((model as ArchitecturalHouse).levels) &&
  typeof (model as ArchitecturalHouse).wallThickness === "number";

const createLevelFromDraft = (
  level: NonNullable<DraftHouseModel["levels"]>[number],
  index: number,
): LevelSpec | null => {
  const outer = level.footprint?.outer;

  if (!isPointList(outer)) {
    return null;
  }

  return {
    id: level.id,
    name: level.name ?? level.id,
    elevation: level.elevation ?? index * (level.height ?? 2.8),
    height: level.height ?? 2.8,
    slab: {
      thickness: level.slab?.thickness ?? 0.25,
      inset: level.slab?.inset ?? 0,
    },
    footprint: {
      id: `${level.id}-footprint`,
      outer,
      edges: [],
      semanticZones: [],
    },
  };
};

const toArchitecturalHouse = (
  model: HouseViewerProps["model"],
): ArchitecturalHouse => {
  if (hasArchitecturalLevels(model)) {
    const validLevelIds = new Set(
      getValidLevelFootprints(model).map(({ level }) => level.id),
    );
    return {
      ...model,
      levels: model.levels.filter((level) => validLevelIds.has(level.id)),
    };
  }

  if (typeof model !== "object" || model === null) {
    return EMPTY_ARCHITECTURAL_HOUSE;
  }

  const draft = model as DraftHouseModel;
  const levels = (draft.levels ?? [])
    .map((level, index) => createLevelFromDraft(level, index))
    .filter((level): level is LevelSpec => level !== null);

  if (levels.length > 0) {
    return {
      wallThickness: draft.walls?.[0]?.thickness ?? 0.3,
      levels,
      openings: [],
      rooms: [],
      roofs: [],
      site: draft.site ? (draft.site as SiteSpec) : undefined,
    };
  }

  return {
    wallThickness: 0.3,
    levels: [],
    openings: [],
    rooms: [],
    roofs: [],
    site: draft.site ? (draft.site as SiteSpec) : undefined,
  };
};

const toSite = (model: HouseViewerProps["model"]): SiteSpec | undefined => {
  if (typeof model !== "object" || model === null) {
    return undefined;
  }

  const draft = model as DraftHouseModel;
  const siteOuter =
    getSiteFootprint(model) ??
    (isPointList(draft.parcel?.outer) ? draft.parcel.outer : null);

  if (siteOuter) {
    return {
      footprint: {
        id: "parcel-footprint",
        outer: siteOuter,
        edges: [],
        semanticZones: [],
      },
      parcel: (draft.site?.parcel ?? draft.parcel) as SiteSpec["parcel"],
      elevation: draft.site?.elevation ?? -0.001,
      color: draft.site?.color ?? "#7dd3fc",
      surfaces: (draft.site as SiteSpec | undefined)?.surfaces ?? [],
      boundaries: {
        fences: (draft.site as SiteSpec | undefined)?.boundaries?.fences ?? [],
        hedges: (draft.site as SiteSpec | undefined)?.boundaries?.hedges ?? [],
        gates: (draft.site as SiteSpec | undefined)?.boundaries?.gates ?? [],
      },
      objects: (draft.site as SiteSpec | undefined)?.objects ?? [],
    };
  }

  if (hasArchitecturalLevels(model) && model.site?.footprint) {
    return model.site;
  }

  return undefined;
};

export default function HouseViewer({
  model = null,
  mode = "solid",
  showHelpers = false,
  className,
  presentationMode = false,
  autoRotate = false,
  autoRotateDurationMs = DEFAULT_AUTO_ROTATE_DURATION_MS,
  autoRotateStartAngle = "right",
  revealOnLoad = false,
  plotRevealDurationMs,
  baseplateRevealDurationMs,
  revealDurationMs,
  presentationVerticalOffset = DEFAULT_PRESENTATION_VERTICAL_OFFSET,
  presentationCamera,
}: HouseViewerProps) {
  const debugEnabled = debugFlags.enabled;
  const [currentModel, setCurrentModel] =
    useState<HouseViewerProps["model"]>(model);
  const resolvedHouse = useMemo(
    () => toArchitecturalHouse(currentModel),
    [currentModel],
  );
  const resolvedSite = useMemo(() => toSite(currentModel), [currentModel]);
  const house = resolvedHouse;
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showWireframe, setShowWireframe] = useState(mode === "wireframe");
  const [showEdges, setShowEdges] = useState(false);
  const [showOpeningEdges, setShowOpeningEdges] = useState(false);
  const [showFloorplanOverlay, setShowFloorplanOverlay] = useState(false);
  const [showValidationIssues, setShowValidationIssues] = useState(false);
  const [validationResult, setValidationResult] =
    useState<FloorplanValidationResult | null>(null);
  const [validationLog, setValidationLog] = useState<ValidationLogEntry[]>([
    {
      level: "info",
      message: 'Use "Run Floorplan Validation" in Debug to run checks.',
    },
  ]);
  const [toggles, setToggles] = useState<ToggleState>({
    shellVisible: true,
    showDebug: debugEnabled,
    visibility: {
      showSlabs: true,
      showWindows: true,
      showWalls: true,
      showRooms: false,
      showRoof: true,
    },
  });
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoomState | null>(
    null,
  );

  useEffect(() => {
    setCurrentModel(model);
  }, [model]);

  useEffect(() => {
    console.log("HouseViewer received model", currentModel);
    console.log("site surfaces count", resolvedSite?.surfaces?.length ?? 0);
    console.log("site objects count", resolvedSite?.objects?.length ?? 0);
    console.log(
      "site fences count",
      resolvedSite?.boundaries?.fences?.length ?? 0,
    );
  }, [currentModel, resolvedSite]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  const roomLevelById = useMemo(
    () => new Map(house.levels.map((level) => [level.id, level.name])),
    [house.levels],
  );

  const showWalls = toggles.visibility.showWalls;
  const showRoof = toggles.visibility.showRoof;
  const showGlass = toggles.visibility.showWindows;
  const showSlabs = toggles.visibility.showSlabs;
  const showRooms = toggles.visibility.showRooms;
  const showRoomInfoCard = showRooms && selectedRoom !== null;

  useEffect(() => {
    setShowWireframe(mode === "wireframe");
  }, [mode]);

  useEffect(() => {
    if (!showRooms) {
      setHoveredRoomId(null);
    }
  }, [showRooms]);

  const houseWithInjectedInteriorWall = useMemo<ArchitecturalHouse>(() => {
    const arch: ArchitecturalHouse = {
      ...house,
    };

    return arch;
  }, [house]);
  const viewerModel = useMemo<ArchitecturalHouse>(
    () => ({
      ...houseWithInjectedInteriorWall,
      site: resolvedSite ?? houseWithInjectedInteriorWall.site,
    }),
    [houseWithInjectedInteriorWall, resolvedSite],
  );

  const initialJson = useMemo(
    () => JSON.stringify(viewerModel, null, 2),
    [viewerModel],
  );
  const renderableGeometrySummary = useMemo(
    () => getRenderableGeometrySummary(viewerModel),
    [viewerModel],
  );
  const presentationAnimationsEnabled =
    presentationMode || autoRotate || revealOnLoad;
  const stagedRevealEnabled = presentationMode && revealOnLoad;
  const resolvedPlotRevealDurationMs =
    plotRevealDurationMs ??
    (revealDurationMs ? revealDurationMs / 2 : DEFAULT_PLOT_REVEAL_DURATION_MS);
  const resolvedBaseplateRevealDurationMs =
    baseplateRevealDurationMs ??
    (revealDurationMs
      ? revealDurationMs / 2
      : DEFAULT_BASEPLATE_REVEAL_DURATION_MS);
  const modelRevealKey = useMemo(() => JSON.stringify(model), [model]);

  const buildValidationEntries = (
    result: FloorplanValidationResult,
    timestamp: string,
  ): ValidationLogEntry[] => {
    const issueCodes = result.issues.reduce<Record<string, number>>(
      (acc, issue) => {
        const key = `${issue.severity}:${issue.code}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const summary = `Summary: rooms=${result.roomCount}, levels=${result.levelCount}, errors=${result.errorCount}, warnings=${result.warningCount}, info=${result.infoCount}.`;
    const codes = Object.entries(issueCodes)
      .map(([code, count]) => `${code}=${count}`)
      .join(", ");

    const entries: ValidationLogEntry[] = [
      { level: "info", message: `[${timestamp}] ${summary}` },
      {
        level: "info",
        message: `[${timestamp}] Issue codes: ${codes || "none"}.`,
      },
    ];

    for (const [levelId, levelData] of Object.entries(result.perLevel)) {
      if (levelData.issues.length === 0) {
        continue;
      }

      entries.push({
        level: "info",
        message: `[${timestamp}] Level ${levelId}: rooms=${levelData.roomCount}, issues=${levelData.issues.length}, uncovered=${levelData.uncoveredPolygons?.length ?? 0}, overlaps=${levelData.overlapPairs?.length ?? 0}.`,
      });
    }

    for (const issue of result.issues) {
      entries.push({
        level:
          issue.severity === "error"
            ? "error"
            : issue.severity === "warning"
              ? "warn"
              : "info",
        message: `[${timestamp}] ${issue.code}${issue.levelId ? ` [${issue.levelId}]` : ""}: ${issue.message}`,
      });
    }

    return entries;
  };

  const runFloorplanValidation = () => {
    const timestamp = new Date().toLocaleTimeString();

    setValidationLog((current) => [
      {
        level: "info",
        message: `[${timestamp}] Running floorplan validation...`,
      },
      ...current,
    ]);

    const result = validateFloorplan(houseWithInjectedInteriorWall);
    setValidationResult(result);
    const summaryMessage = `Summary: rooms=${result.roomCount}, levels=${result.levelCount}, errors=${result.errorCount}, warnings=${result.warningCount}, info=${result.infoCount}`;
    console.info(summaryMessage);
    for (const issue of result.issues) {
      const issueMessage = `${issue.code}${issue.levelId ? ` [${issue.levelId}]` : ""}: ${issue.message}`;
      if (issue.severity === "error") {
        console.error(issueMessage, issue.meta ?? {});
      } else if (issue.severity === "warning") {
        console.warn(issueMessage, issue.meta ?? {});
      } else {
        console.info(issueMessage, issue.meta ?? {});
      }
    }

    if (result.issueCount === 0) {
      setValidationLog((current) => [
        ...buildValidationEntries(result, timestamp),
        {
          level: "info",
          message: `[${timestamp}] Floorplan validation passed.`,
        },
        ...current,
      ]);
      return;
    }

    setValidationLog((current) => [
      ...buildValidationEntries(result, timestamp),
      ...current,
    ]);
  };

  const clearValidationOutput = () => {
    setValidationResult(null);
    setValidationLog([
      { level: "info", message: "Validation output cleared." },
    ]);
  };

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100vh", position: "relative" }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 7, -12], fov: 50 }}
        dpr={1}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={["#f5f7fb"]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          castShadow
          intensity={1}
          position={[10, 20, 10]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={70}
        />
        <Sky distance={450000} sunPosition={[2, 0.6, 2]} turbidity={8} />

        <AutoFrameCamera
          model={viewerModel}
          presentationMode={presentationMode}
          presentationVerticalOffset={presentationVerticalOffset}
          presentationCamera={presentationCamera}
          summary={renderableGeometrySummary}
        />
        <PresentationAutoRotate
          enabled={presentationAnimationsEnabled && autoRotate}
          model={viewerModel}
          summary={renderableGeometrySummary}
          durationMs={autoRotateDurationMs}
          startAngle={autoRotateStartAngle}
          presentationVerticalOffset={presentationVerticalOffset}
          presentationCamera={presentationCamera}
        />

        <StagedRevealHouse
          revealEnabled={stagedRevealEnabled}
          isRenderable={renderableGeometrySummary.hasRenderableGeometry}
          modelKey={modelRevealKey}
          plotDurationMs={resolvedPlotRevealDurationMs}
          baseplateDurationMs={resolvedBaseplateRevealDurationMs}
        >
          {(revealOpacity) => (
            <>
              {renderableGeometrySummary.hasRenderableGeometry && (
                <EngineHouse
                  house={viewerModel}
                  site={viewerModel.site}
                  showWalls={showWalls}
                  showRoof={showRoof}
                  showSlabs={showSlabs}
                  showGlass={showGlass}
                  showRooms={showRooms}
                  showDebug={toggles.showDebug || showHelpers}
                  selectedRoomId={selectedRoom?.id ?? null}
                  hoveredRoomId={hoveredRoomId}
                  onRoomHover={setHoveredRoomId}
                  onRoomSelect={(room) => {
                    setSelectedRoom({
                      id: room.id,
                      name: room.name,
                      levelName:
                        roomLevelById.get(room.levelId) ?? room.levelId,
                    });
                  }}
                  revealOpacity={revealOpacity}
                />
              )}
              <DebugAxes />
              {(toggles.showDebug || showHelpers) && debugEnabled && (
                <Suspense fallback={null}>
                  <DebugEdges
                    showEdges={showEdges}
                    showOpeningEdges={showOpeningEdges}
                  />
                </Suspense>
              )}
              {(toggles.showDebug || showHelpers) && debugEnabled && (
                <Suspense fallback={null}>
                  <FloorplanValidationOverlay
                    architecturalHouse={houseWithInjectedInteriorWall}
                    validationResult={validationResult}
                    showFloorplanOverlay={showFloorplanOverlay}
                    showValidationIssues={showValidationIssues}
                  />
                </Suspense>
              )}
            </>
          )}
        </StagedRevealHouse>

        {(toggles.showDebug || showHelpers) && debugEnabled && (
          <Suspense fallback={null}>
            <WireframeOverride enabled={showWireframe} />
          </Suspense>
        )}

        <OrbitControls makeDefault enableDamping target={[0, 1.2, 0]} />
        <FirstFrameMarker />
      </Canvas>

      {!renderableGeometrySummary.hasRenderableGeometry && (
        <div style={noticeStyle}>No renderable geometry found.</div>
      )}
      {renderableGeometrySummary.mode === "site-only" && (
        <div style={noticeStyle}>
          Site footprint only. No building geometry available.
        </div>
      )}

      <div style={toolbarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{ color: "#e7f0ff", fontWeight: 700, letterSpacing: 0.3 }}
          >
            Shell
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={toggles.shellVisible}
            aria-label="Toggle shell visibility"
            style={{
              ...shellSwitchTrackStyle,
              background: toggles.shellVisible
                ? "linear-gradient(180deg, #40d47e, #1e9f56)"
                : "linear-gradient(180deg, #39465e, #212b3d)",
              boxShadow: toggles.shellVisible
                ? "0 0 0 1px rgba(134, 255, 188, 0.4), 0 0 20px rgba(68, 231, 138, 0.35)"
                : "0 0 0 1px rgba(111, 132, 166, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
            }}
            onClick={() =>
              setToggles((current) => {
                const shellVisible = !current.shellVisible;
                return {
                  ...current,
                  shellVisible,
                  visibility: {
                    ...current.visibility,
                    showWindows: shellVisible,
                    showWalls: shellVisible,
                    showRoof: shellVisible,
                    showRooms: !shellVisible,
                  },
                };
              })
            }
            title={`Shell: ${toggles.shellVisible ? "ON" : "OFF"}`}
          >
            <span
              style={{
                ...shellSwitchKnobStyle,
                transform: toggles.shellVisible
                  ? "translateX(30px)"
                  : "translateX(0)",
              }}
            />
          </button>
          <span style={{ color: "#d2dfee", fontWeight: 700, minWidth: 34 }}>
            {toggles.shellVisible ? "ON" : "OFF"}
          </span>
        </div>
        {debugEnabled && (
          <button
            type="button"
            style={{
              ...baseToggleStyle,
              background: toggles.showDebug
                ? "linear-gradient(180deg, rgba(106, 188, 255, 0.48), rgba(39, 127, 214, 0.46))"
                : "linear-gradient(180deg, rgba(21, 31, 47, 0.9), rgba(13, 20, 31, 0.88))",
              color: toggles.showDebug
                ? "#eff8ff"
                : "rgba(173, 188, 210, 0.72)",
              borderColor: toggles.showDebug
                ? "rgba(156, 218, 255, 0.68)"
                : "rgba(108, 126, 152, 0.42)",
            }}
            onClick={() =>
              setToggles((current) => ({
                ...current,
                showDebug: !current.showDebug,
              }))
            }
          >
            Debug
          </button>
        )}
      </div>

      <RoomInfoCard
        roomName={showRoomInfoCard ? (selectedRoom?.name ?? null) : null}
        levelName={showRoomInfoCard ? (selectedRoom?.levelName ?? null) : null}
      />

      {(toggles.showDebug || showHelpers) && debugEnabled && (
        <>
          <Suspense fallback={null}>
            <DebugButton
              isOpen={isDashboardOpen}
              onClick={() => setIsDashboardOpen((value) => !value)}
            />
            <DebugDashboard
              isOpen={isDashboardOpen}
              onClose={() => setIsDashboardOpen(false)}
              showWireframe={showWireframe}
              onShowWireframeChange={setShowWireframe}
              showEdges={showEdges}
              onShowEdgesChange={setShowEdges}
              showOpeningEdges={showOpeningEdges}
              onShowOpeningEdgesChange={setShowOpeningEdges}
              initialJson={initialJson}
              onApplyArchitecturalHouse={setCurrentModel}
              onRunFloorplanValidation={runFloorplanValidation}
              showFloorplanOverlay={showFloorplanOverlay}
              onShowFloorplanOverlayChange={setShowFloorplanOverlay}
              showValidationIssues={showValidationIssues}
              onShowValidationIssuesChange={setShowValidationIssues}
              onClearValidationOutput={clearValidationOutput}
              validationLog={validationLog}
              visibility={toggles.visibility}
              onVisibilityChange={(visibility) =>
                setToggles((current) => ({
                  ...current,
                  shellVisible:
                    visibility.showWalls &&
                    visibility.showWindows &&
                    visibility.showRoof &&
                    !visibility.showRooms,
                  visibility,
                }))
              }
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
