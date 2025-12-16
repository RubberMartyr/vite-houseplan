import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import useWinResize from '../hooks/useWinResize';
import wallsGround from '../model/wallsGround';

const cameraPosition = { x: 10, y: 8, z: 12 };

const HouseViewer = () => {
  const [width, height] = useWinResize();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<WebGLRenderer>();
  const cameraRef = useRef<PerspectiveCamera>();

  useEffect(() => {
    console.log('DEBUG ACTIVE');
  }, []);

  useEffect(() => {
    if (!mountRef.current || width === 0 || height === 0) return;

    const scene = new Scene();
    // Equivalent to <color attach="background" args={['#b9d7ff']} /> in react-three-fiber.
    scene.background = new Color('#b9d7ff');

    const camera = new PerspectiveCamera(50, width / height || 1, 0.1, 100);
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt(0, 1.3, 0);
    cameraRef.current = camera;

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    const ambient = new AmbientLight(0xffffff, 0.7);
    const sun = new DirectionalLight(0xffffff, 0.6);
    sun.position.set(6, 10, 6);

    scene.add(ambient, sun);

    const debugCube = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: '#ff00ff' })
    );
    debugCube.position.set(2, 1.0, 5);
    scene.add(debugCube);

    // Only render the segmented exterior wall meshes defined in wallsGround.
    // Legacy ring geometry (extrudeWallRing/extWallsGeom) has been removed.
    wallsGround.walls.forEach((mesh) => {
      scene.add(mesh);
    });

    wallsGround.portalPlanes.forEach((mesh) => {
      scene.add(mesh);
    });

    mountRef.current.appendChild(renderer.domElement);

    let frameId: number;
    const renderScene = () => {
      renderer.render(scene, camera);
    };

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderScene();
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [height, width]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (renderer && camera && width > 0 && height > 0) {
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }, [height, width]);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default HouseViewer;
