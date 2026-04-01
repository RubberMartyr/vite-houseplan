import { Edges } from '@react-three/drei';
import { debugFlags } from './debugFlags';

type Props = {
  forceVisible?: boolean;
};

export function shouldShowDebugWireframe(forceVisible = false): boolean {
  return forceVisible || (debugFlags.enabled && debugFlags.showWireframe);
}

export function DebugWireframe({ forceVisible = false }: Props) {
  if (!shouldShowDebugWireframe(forceVisible)) {
    return null;
  }

  return <Edges scale={1.001} threshold={15} color="black" />;
}
