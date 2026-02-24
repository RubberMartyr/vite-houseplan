import React from 'react';

type Props = {
  showLegacy: boolean;
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
  showLegacy,
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
      {showLegacy && showBasement && (
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
      {showLegacy && showGround && (
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
      {showLegacy &&
        showGround &&
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
      {showLegacy &&
        showGround &&
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
      {showLegacy && showGround && wallsGroundWithOptionals.extensionRightWall && (
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
      {showLegacy && showGround && (
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
      {showLegacy && showGround && wallsGroundWithOptionals.frontFacade && (
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
      {showLegacy && showFirst && (
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
      {showLegacy &&
        showFirst &&
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
      {showLegacy && showFirst && wallsFirst.leftFacade && (
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
      {showLegacy && showFirst && (
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
      {showLegacy && showFirst && wallsFirstWithOptionals.frontFacade && (
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
      {showLegacy && eavesBandMesh}
      {showLegacy && showWindows && (
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
