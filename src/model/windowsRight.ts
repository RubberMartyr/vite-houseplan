import * as THREE from 'three';

export type SideWindowMesh = {
  id:string;
  meshes:THREE.Object3D[];
};

type SideWindowSpec = {
  id:string;
  kind:'small';
  zCenter:number;
  width:number;
  groundY0:number;
  groundY1:number;
  firstY0:number;
  firstY1:number;
};

// RIGHT side is FLAT
const RIGHT_FACADE_X = -4.8;

const FRAME_DEPTH = 0.08;
const GLASS_INSET = 0.01;
const EPS = 0.001;

const wallThickness = { exterior:0.3 };

// 🔥 YOUR RIGHT WINDOWS
const rightSideWindowSpecs:SideWindowSpec[] = [
  {
    id:'SIDE_R_DOOR',
    kind:'small',
    zCenter:5.5,
    width:1.0,
    groundY0:0.0,
    groundY1:2.15,
    firstY0:0,
    firstY1:0,
  },
  {
    id:'SIDE_R_WIN',
    kind:'small',
    zCenter:5.5,
    width:0.9,
    groundY0:0,
    groundY1:0,
    firstY0:4.1,
    firstY1:5.0,
  },
];

function makeSimpleWindow({
  id,width,y0,y1,zCenter
}:{
  id:string;
  width:number;
  y0:number;
  y1:number;
  zCenter:number;
}):SideWindowMesh{

  const outward = new THREE.Vector3(-1,0,0);
  const interiorDir = 1;

  const xOuterReveal = RIGHT_FACADE_X;
  const xInnerReveal = xOuterReveal + interiorDir * wallThickness.exterior;
  const xOuterPlane = xOuterReveal + outward.x * EPS;

  const frameX = xOuterPlane - outward.x * (FRAME_DEPTH/2);
  const glassX = frameX + interiorDir * GLASS_INSET;

  const height = y1-y0;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(FRAME_DEPTH,height,width),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );

  frame.position.set(frameX,y0+height/2,zCenter);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.02,height-0.05,width-0.05),
    new THREE.MeshPhysicalMaterial({
      color:0xff0000,
      transmission:0.9,
      transparent:true,
      opacity:1,
      roughness:0.05,
      metalness:0,
      thickness:0.01
    })
  );

  glass.position.set(glassX,y0+height/2,zCenter);

  return { id, meshes:[frame,glass] };
}

const meshes:SideWindowMesh[] =
rightSideWindowSpecs.flatMap(spec=>{

  const list:SideWindowMesh[]=[];

  if(spec.groundY1>spec.groundY0){
    list.push(makeSimpleWindow({
      id:spec.id+'_GROUND',
      width:spec.width,
      y0:spec.groundY0,
      y1:spec.groundY1,
      zCenter:spec.zCenter
    }));
  }

  if(spec.firstY1>spec.firstY0){
    list.push(makeSimpleWindow({
      id:spec.id+'_FIRST',
      width:spec.width,
      y0:spec.firstY0,
      y1:spec.firstY1,
      zCenter:spec.zCenter
    }));
  }

  return list;
});

export const windowsRight = { meshes };
