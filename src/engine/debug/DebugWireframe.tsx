import { Edges } from '@react-three/drei';
import { isDebugEnabled } from './debugFlags';

export function DebugWireframe() {
  if (!isDebugEnabled()) return null;

  return <Edges scale={1.001} threshold={15} color="black" />;
}
