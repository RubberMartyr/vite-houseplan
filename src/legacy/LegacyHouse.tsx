import React from 'react';

type Props = {
  showBasement: boolean;
  showGround: boolean;
  showFirst: boolean;
  showWindows: boolean;
  wallShellVisible: boolean;
  wallsBasement: any;
  wallsGround: any;
  wallsGroundWithOptionals: any;
  wallsFirst: any;
  wallsFirstWithOptionals: any;
  wallMaterial: any;
  facadeMaterial: any;
  eavesBandMesh: React.ReactNode;
  windowsRear: any;
  windowsFront: any;
  glass: any;
  frame: any;
  leftSideWindows: any;
  rightSideWindows: any;
};

export function LegacyHouse({
  showBasement,
  showGround,
  showFirst,
  showWindows,
  wallShellVisible,
  wallsBasement,
  wallsGround,
  wallsGroundWithOptionals,
  wallsFirst,
  wallsFirstWithOptionals,
  wallMaterial,
  facadeMaterial,
  eavesBandMesh,
  windowsRear,
  windowsFront,
  glass,
  frame,
  leftSideWindows,
  rightSideWindows,
}: Props) {
  return (
    <>
      {showBasement && (
        <mesh
          geometry={wallsBasement.shell.geometry}
          position={wallsBasement.shell.position}
          rotation={wallsBasement.shell.rotation}
          material={wallMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {showGround && (
        <mesh
          geometry={wallsGround.shell.geometry}
          position={wallsGround.shell.position}
          rotation={wallsGround.shell.rotation}
          material={wallMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {showGround &&
        wallsGround.leftFacades?.map((facade: any, index: number) => (
          <mesh
            key={`ground-left-facade-${index}`}
            geometry={facade.geometry}
            position={facade.position}
            rotation={facade.rotation}
            material={facadeMaterial}
            castShadow
            receiveShadow
            visible={wallShellVisible}
          />
        ))}
      {showGround &&
        wallsGround.rightFacades.map((facade: any, index: number) => (
          <mesh
            key={`ground-right-facade-${index}`}
            geometry={facade.geometry}
            position={facade.position}
            rotation={facade.rotation}
            material={facadeMaterial}
            castShadow
            receiveShadow
            visible={wallShellVisible}
          />
        ))}
      {showGround && wallsGroundWithOptionals.extensionRightWall && (
        <mesh
          geometry={wallsGroundWithOptionals.extensionRightWall.geometry}
          position={wallsGroundWithOptionals.extensionRightWall.position}
          rotation={wallsGroundWithOptionals.extensionRightWall.rotation}
          material={facadeMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {showGround && (
        <mesh
          geometry={wallsGround.rearFacade.geometry}
          position={wallsGround.rearFacade.position}
          rotation={wallsGround.rearFacade.rotation}
          material={wallMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {showGround && wallsGroundWithOptionals.frontFacade && (
        <mesh
          geometry={wallsGroundWithOptionals.frontFacade.geometry}
          position={wallsGroundWithOptionals.frontFacade.position}
          rotation={wallsGroundWithOptionals.frontFacade.rotation}
          material={wallMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {showFirst && (
        <mesh
          geometry={wallsFirst.shell.geometry}
          position={wallsFirst.shell.position}
          rotation={wallsFirst.shell.rotation}
          material={wallMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {showFirst &&
        wallsFirst.rightFacades.map((facade: any, index: number) => (
          <mesh
            key={`first-right-facade-${index}`}
            geometry={facade.geometry}
            position={facade.position}
            rotation={facade.rotation}
            material={facadeMaterial}
            castShadow
            receiveShadow
            visible={wallShellVisible}
          />
        ))}
      {showFirst && wallsFirst.leftFacade && (
        <mesh
          geometry={wallsFirst.leftFacade.geometry}
          position={wallsFirst.leftFacade.position}
          rotation={wallsFirst.leftFacade.rotation}
          material={facadeMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {showFirst && (
        <mesh
          geometry={wallsFirst.rearFacade.geometry}
          position={wallsFirst.rearFacade.position}
          rotation={wallsFirst.rearFacade.rotation}
          material={wallMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {showFirst && wallsFirstWithOptionals.frontFacade && (
        <mesh
          geometry={wallsFirstWithOptionals.frontFacade.geometry}
          position={wallsFirstWithOptionals.frontFacade.position}
          rotation={wallsFirstWithOptionals.frontFacade.rotation}
          material={wallMaterial}
          castShadow
          receiveShadow
          visible={wallShellVisible}
        />
      )}
      {eavesBandMesh}
      {showWindows && (
        <>
          <group name="rearWindows" visible={wallShellVisible}>
            {windowsRear.meshes.map((mesh: any) => {
              const isGlass = mesh.id.toLowerCase().includes('_glass');
              const fallbackMaterial = isGlass ? glass : frame;
              const material = mesh.material ?? fallbackMaterial;
              return (
                <mesh
                  key={mesh.id}
                  geometry={mesh.geometry}
                  position={mesh.position}
                  rotation={mesh.rotation}
                  material={material}
                  castShadow={!isGlass}
                  receiveShadow={!isGlass}
                  renderOrder={isGlass ? 10 : undefined}
                />
              );
            })}
          </group>

          {leftSideWindows.meshes.map((m: any) => <primitive object={m} key={m.uuid} />)}
          {rightSideWindows.meshes.map((m: any) => <primitive object={m} key={m.uuid} />)}

          <group name="frontWindows" visible={wallShellVisible}>
            {windowsFront.meshes.map((mesh: any) => {
              const isGlass = mesh.id.toLowerCase().includes('_glass');
              const fallbackMaterial = isGlass ? glass : frame;
              const material = mesh.material ?? fallbackMaterial;
              return (
                <mesh
                  key={mesh.id}
                  geometry={mesh.geometry}
                  position={mesh.position}
                  rotation={mesh.rotation}
                  material={material}
                  castShadow={!isGlass}
                  receiveShadow={!isGlass}
                  renderOrder={isGlass ? 10 : undefined}
                />
              );
            })}
          </group>
        </>
      )}
    </>
  );
}
