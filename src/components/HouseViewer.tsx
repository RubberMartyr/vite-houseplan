import { Container, Sprite, Stage, useTick } from '@inlet/react-pixi';
import { useEffect, useReducer, useRef } from 'react';
import layoutGround from '../model/layoutGround';
import wallsGround from '../model/wallsGround';
import useWinResize from '../hooks/useWinResize';

let hasLoggedLayout = false;

type ReducerAction = 'update';

interface ReducerInit {
  type: ReducerAction;
  data: {
    x: number;
    y: number;
    rotation: number;
    anchor: number;
  };
}

const reducer: (_: any, payload: ReducerInit) => ReducerInit['data'] = (
  _,
  { data }
) => data;

const mowtwoSpriteUrl = new URL('../favicon.svg', import.meta.url).href;

const Mowtwo = () => {
  const [motion, update] = useReducer(reducer, {
    x: 0,
    y: 0,
    rotation: 0,
    anchor: 0,
  });
  const iter = useRef(0);
  useTick((delta) => {
    const { sin, PI, random } = Math;
    const i = (iter.current += (random() / 4) * delta);
    update({
      type: 'update',
      data: {
        x: sin(i) * 100,
        y: sin(i / 1.5) * 100,
        rotation: sin(i) * PI,
        anchor: sin(i / 2),
      },
    });
  });
  return <Sprite image={mowtwoSpriteUrl} {...motion} />;
};

const HouseViewer = () => {
  const [wW, wH] = useWinResize();

  useEffect(() => {
    if (!hasLoggedLayout) {
      // One-time diagnostic snapshot of the computed ground layout.
      console.log('layoutGround', layoutGround);
      console.log('wallsGround', wallsGround);
      hasLoggedLayout = true;
    }
  }, []);

  return (
    <Stage width={wW} height={wH}>
      <Container x={300} y={300}>
        <Mowtwo />
        <Mowtwo />
        <Mowtwo />
        <Mowtwo />
        <Mowtwo />
        <Mowtwo />
        <Mowtwo />
      </Container>
    </Stage>
  );
};

export default HouseViewer;
