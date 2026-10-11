import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural 3D Pet Food Bag
export function PetFoodBag({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, isHovered = false }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.1;
    meshRef.current.rotation.y = rotation[1] + Math.cos(t * 0.8) * 0.15;
  });

  return (
    <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
      {/* Main Bag Body */}
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 1.8, 0.65, 4, 4, 4]} />
        <meshStandardMaterial
          color="#8B5CF6"
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      {/* Bag Top Fold / Seal */}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[1.25, 0.18, 0.12]} />
        <meshStandardMaterial color="#4C1D95" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Front Label Banner */}
      <mesh position={[0, 0.45, 0.34]}>
        <planeGeometry args={[0.9, 1.1]} />
        <meshStandardMaterial
          color="#EDE9FE"
          roughness={0.4}
        />
      </mesh>

      {/* Paw Emblem Badge on Label */}
      <mesh position={[0, 0.65, 0.35]}>
        <circleGeometry args={[0.22, 24]} />
        <meshStandardMaterial color="#7C3AED" />
      </mesh>
      {/* Paw Toe Dots */}
      <mesh position={[-0.12, 0.95, 0.35]}>
        <circleGeometry args={[0.07, 16]} />
        <meshStandardMaterial color="#7C3AED" />
      </mesh>
      <mesh position={[0, 1.02, 0.35]}>
        <circleGeometry args={[0.08, 16]} />
        <meshStandardMaterial color="#7C3AED" />
      </mesh>
      <mesh position={[0.12, 0.95, 0.35]}>
        <circleGeometry args={[0.07, 16]} />
        <meshStandardMaterial color="#7C3AED" />
      </mesh>

      {/* Nutritional Tag Banner */}
      <mesh position={[0, 0.15, 0.35]}>
        <boxGeometry args={[0.75, 0.14, 0.02]} />
        <meshStandardMaterial color="#10B981" />
      </mesh>
    </group>
  );
}

// Procedural 3D Pet Food Bowl with Kibble
export function PetFoodBowl({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.8 + 1) * 0.08;
    groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.6) * 0.1;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Outer Bowl Body */}
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[1.1, 0.75, 0.6, 32, 1, false]} />
        <meshStandardMaterial
          color="#38BDF8"
          metalness={0.7}
          roughness={0.15}
        />
      </mesh>

      {/* Rubber Grip Rim at base */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.12, 32]} />
        <meshStandardMaterial color="#0284C7" roughness={0.6} />
      </mesh>

      {/* Bowl Interior Cavity / Food Mound */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.85, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <meshStandardMaterial color="#78350F" roughness={0.8} />
      </mesh>

      {/* Individual Kibble Pellets */}
      {[
        [-0.3, 0.6, 0.2],
        [0.2, 0.62, 0.25],
        [0.1, 0.65, -0.2],
        [-0.2, 0.61, -0.25],
        [0.35, 0.58, -0.1],
        [-0.05, 0.68, 0.05]
      ].map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#92400E" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// Procedural 3D Pet Shampoo Dispenser Bottle
export function ShampooBottle({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const bottleRef = useRef();

  useFrame((state) => {
    if (!bottleRef.current) return;
    const t = state.clock.getElapsedTime();
    bottleRef.current.position.y = position[1] + Math.cos(t * 1.6 + 2) * 0.09;
    bottleRef.current.rotation.z = Math.sin(t * 1.2) * 0.06;
  });

  return (
    <group ref={bottleRef} position={position} rotation={rotation} scale={scale}>
      {/* Bottle Body */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.42, 0.45, 1.6, 28]} />
        <meshStandardMaterial
          color="#10B981"
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Neck & Shoulder */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.2, 0.42, 0.22, 28]} />
        <meshStandardMaterial color="#059669" roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.88, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.16, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* Pump Head Dispenser */}
      <mesh position={[0.12, 2.05, 0]}>
        <boxGeometry args={[0.45, 0.14, 0.2]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.2} />
      </mesh>
      {/* Dispenser Spout */}
      <mesh position={[0.36, 2.02, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.04, 0.05, 0.15, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Clean Organic Label */}
      <mesh position={[0, 0.8, 0.44]}>
        <planeGeometry args={[0.55, 0.85]} />
        <meshStandardMaterial color="#ECFDF5" roughness={0.3} />
      </mesh>
      {/* Leaf icon mark */}
      <mesh position={[0, 0.95, 0.45]}>
        <circleGeometry args={[0.14, 16]} />
        <meshStandardMaterial color="#047857" />
      </mesh>
    </group>
  );
}

// Procedural 3D Chew Bone Toy
export function ChewBoneToy({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const boneRef = useRef();

  useFrame((state) => {
    if (!boneRef.current) return;
    const t = state.clock.getElapsedTime();
    boneRef.current.position.y = position[1] + Math.sin(t * 2 + 3) * 0.11;
    boneRef.current.rotation.x = rotation[0] + Math.sin(t * 0.9) * 0.2;
    boneRef.current.rotation.y = rotation[1] + t * 0.4;
  });

  return (
    <group ref={boneRef} position={position} rotation={rotation} scale={scale}>
      {/* Central Shaft */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 1.2, 24]} />
        <meshStandardMaterial
          color="#EC4899"
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* Left Knuckle Pair */}
      <mesh castShadow position={[-0.6, 0.14, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#EC4899" roughness={0.35} />
      </mesh>
      <mesh castShadow position={[-0.6, -0.14, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#EC4899" roughness={0.35} />
      </mesh>

      {/* Right Knuckle Pair */}
      <mesh castShadow position={[0.6, 0.14, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#EC4899" roughness={0.35} />
      </mesh>
      <mesh castShadow position={[0.6, -0.14, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#EC4899" roughness={0.35} />
      </mesh>
    </group>
  );
}

// Procedural 3D Tennis Ball Toy
export function TennisBallToy({ position = [0, 0, 0], scale = 1 }) {
  const ballRef = useRef();

  useFrame((state) => {
    if (!ballRef.current) return;
    const t = state.clock.getElapsedTime();
    ballRef.current.position.y = position[1] + Math.sin(t * 2.2 + 0.5) * 0.08;
    ballRef.current.rotation.x = t * 0.5;
    ballRef.current.rotation.z = t * 0.4;
  });

  return (
    <group ref={ballRef} position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.42, 28, 28]} />
        <meshStandardMaterial
          color="#84CC16"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* Ball seam ring */}
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[0.425, 0.025, 12, 36]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Stylized 3D Dog Companion Figurine
export function StylizedDogCompanion({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const dogRef = useRef();
  const tailRef = useRef();
  const headRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 8) * 0.4;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.5) * 0.15;
      headRef.current.rotation.z = Math.cos(t * 1.2) * 0.08;
    }
    if (dogRef.current) {
      dogRef.current.position.y = position[1] + Math.sin(t * 2) * 0.05;
    }
  });

  return (
    <group ref={dogRef} position={position} rotation={rotation} scale={scale}>
      {/* Torso */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.45, 0.52, 0.9, 24]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.4} />
      </mesh>

      {/* Chest Bib Fur patch */}
      <mesh position={[0, 0.65, 0.38]}>
        <cylinderGeometry args={[0.26, 0.32, 0.55, 16]} />
        <meshStandardMaterial color="#FEF3C7" roughness={0.5} />
      </mesh>

      {/* Collar & Golden Tag */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.12, 24]} />
        <meshStandardMaterial color="#7C3AED" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.96, 0.44]}>
        <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
        <meshStandardMaterial color="#FBBF24" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0, 1.45, 0.15]}>
        {/* Head Sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.48, 28, 28]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>

        {/* Snout / Muzzle */}
        <mesh position={[0, -0.08, 0.42]}>
          <cylinderGeometry args={[0.2, 0.28, 0.35, 20]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.5} />
        </mesh>

        {/* Cute Black Nose */}
        <mesh position={[0, 0.06, 0.56]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.1} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.18, 0.12, 0.4]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.05} />
        </mesh>
        <mesh position={[0.18, 0.12, 0.4]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.05} />
        </mesh>

        {/* Left Floppy Ear */}
        <mesh position={[-0.42, 0.2, -0.05]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.18, 0.6, 0.25]} />
          <meshStandardMaterial color="#D97706" roughness={0.45} />
        </mesh>

        {/* Right Floppy Ear */}
        <mesh position={[0.42, 0.2, -0.05]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[0.18, 0.6, 0.25]} />
          <meshStandardMaterial color="#D97706" roughness={0.45} />
        </mesh>
      </group>

      {/* Front Paws */}
      <mesh position={[-0.24, 0.15, 0.25]}>
        <cylinderGeometry args={[0.14, 0.18, 0.35, 16]} />
        <meshStandardMaterial color="#FEF3C7" roughness={0.4} />
      </mesh>
      <mesh position={[0.24, 0.15, 0.25]}>
        <cylinderGeometry args={[0.14, 0.18, 0.35, 16]} />
        <meshStandardMaterial color="#FEF3C7" roughness={0.4} />
      </mesh>

      {/* Wagging Tail */}
      <group position={[0, 0.35, -0.45]}>
        <mesh ref={tailRef} position={[0, 0.25, -0.15]} rotation={[-0.6, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.12, 0.55, 16]} />
          <meshStandardMaterial color="#D97706" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}
