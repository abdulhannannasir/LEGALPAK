import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const GOLD = "#d4af37";
const BRONZE = "#c5a880";
const SAPPHIRE = "#3f5f8a";

function ScaleOfJustice({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const { pointer } = state;
    group.current.rotation.y = pointer.x * 0.25;
    group.current.rotation.x = -pointer.y * 0.1;
  });
  const goldMat = {
    color: GOLD,
    metalness: 0.9,
    roughness: 0.25,
    emissive: GOLD,
    emissiveIntensity: 0.18,
  };
  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.8}>
      <group ref={group} position={position} scale={1.15}>
        {/* Central column */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 1.6, 24]} />
          <meshStandardMaterial {...goldMat} />
        </mesh>
        {/* Base */}
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.32, 0.36, 0.08, 32]} />
          <meshStandardMaterial {...goldMat} />
        </mesh>
        {/* Beam */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[1.5, 0.045, 0.045]} />
          <meshStandardMaterial {...goldMat} />
        </mesh>
        {/* Pan chains */}
        {[-0.68, 0.68].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.15, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.55, 8]} />
              <meshStandardMaterial {...goldMat} />
            </mesh>
            {/* Pan */}
            <mesh position={[x, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.24, 0.02, 32, 1, true]} />
              <meshStandardMaterial {...goldMat} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[x, -0.17, 0]}>
              <circleGeometry args={[0.24, 32]} />
              <meshStandardMaterial {...goldMat} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
        <pointLight color={GOLD} intensity={2.5} distance={3} position={[0, 0.4, 0.6]} />
      </group>
    </Float>
  );
}

function GlowCrystal({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 0.25;
    mesh.current.rotation.x += delta * 0.08;
  });
  return (
    <Float speed={1.1} rotationIntensity={0.4} floatIntensity={1.4}>
      <mesh ref={mesh} position={position} scale={0.8}>
        <icosahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial
          color={SAPPHIRE}
          emissive={SAPPHIRE}
          emissiveIntensity={0.35}
          roughness={0.15}
          metalness={0.1}
          transmission={0.55}
          thickness={1.2}
          clearcoat={1}
        />
      </mesh>
      <pointLight color={SAPPHIRE} intensity={1.8} distance={2.5} position={position} />
    </Float>
  );
}

function Rig() {
  const { camera } = useThree();
  useFrame((state) => {
    camera.position.x += (state.pointer.x * 0.4 - camera.position.x) * 0.03;
    camera.position.y += (state.pointer.y * 0.2 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * Ambient 3D backdrop for the marketing hero — a stylised gold scale of
 * justice on one side, a glowing sapphire crystal on the other, both with
 * subtle mouse-parallax. Kept to primitive geometry only (no imported
 * models/textures) so the bundle and render cost stay small.
 */
export function BackgroundCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 52 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[3, 4, 2]} intensity={0.6} color={BRONZE} />
          <ScaleOfJustice position={[-1.9, -1.4, 0]} />
          <GlowCrystal position={[1.7, 1.6, -0.5]} />
          <Sparkles
            count={40}
            scale={[8, 4, 4]}
            size={1.5}
            speed={0.25}
            color={GOLD}
            opacity={0.35}
          />
          <Rig />
        </Suspense>
      </Canvas>
    </div>
  );
}
