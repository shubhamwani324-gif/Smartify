import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  PetFoodBag,
  PetFoodBowl,
  ShampooBottle,
  ChewBoneToy,
  TennisBallToy,
  StylizedDogCompanion
} from './PetProductModels';
import { Sparkles, Package, Bone, Award, RefreshCw } from 'lucide-react';

// Mouse Parallax Controller inside Canvas
function ParallaxRig({ children }) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;
    const { x, y } = state.pointer;
    // Smooth interpolation towards cursor coordinates
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.25, 0.05);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.15, 0.05);
  });

  return <group ref={group}>{children}</group>;
}

// 3D Scene Assembly
function SceneContents() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[6, 8, 6]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-bias={-0.0001}
      />
      {/* Lavender Rim Light */}
      <pointLight position={[-6, 4, -4]} intensity={1.8} color="#C4B5FD" />
      {/* Mint Accent Glow */}
      <pointLight position={[5, -2, -2]} intensity={1.5} color="#6EE7B7" />

      <ParallaxRig>
        {/* Floating Pet Food Bag (Center-Left) */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <PetFoodBag position={[-1.7, 0.3, 0.2]} rotation={[0.1, 0.35, -0.05]} scale={1.15} />
        </Float>

        {/* Food Bowl with kibble (Bottom-Center) */}
        <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.4}>
          <PetFoodBowl position={[0, -1.0, 0.8]} rotation={[0.15, 0.1, 0]} scale={1.05} />
        </Float>

        {/* Shampoo Dispenser Bottle (Right) */}
        <Float speed={2.2} rotationIntensity={0.25} floatIntensity={0.6}>
          <ShampooBottle position={[1.8, 0.2, -0.2]} rotation={[-0.1, -0.4, 0.05]} scale={1.05} />
        </Float>

        {/* Chew Bone Toy (Top-Right Floating) */}
        <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.7}>
          <ChewBoneToy position={[1.4, 1.4, 0.5]} rotation={[0.4, 0.2, 0.3]} scale={0.9} />
        </Float>

        {/* Tennis Ball (Bottom-Left Floating) */}
        <Float speed={2.8} rotationIntensity={0.5} floatIntensity={0.6}>
          <TennisBallToy position={[-1.8, -1.1, 1.0]} scale={0.85} />
        </Float>

        {/* Stylized Dog Companion Figurine (Center Hero) */}
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
          <StylizedDogCompanion position={[0, 0.2, -0.4]} rotation={[0, 0, 0]} scale={1.0} />
        </Float>

        {/* Soft Contact Floor Shadow */}
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
          color="#4C1D95"
        />
      </ParallaxRig>
    </>
  );
}

// 2D Elegant Fallback for non-WebGL devices or low-performance toggle
export function HeroFallback() {
  return (
    <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500/10 via-mint-500/10 to-brand-700/15 border border-brand-200/40 dark:border-white/10 backdrop-blur-md">
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-mint-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Stylized Product Array Badges */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 max-w-md">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-md border border-brand-100 dark:border-slate-700 flex flex-col items-center gap-2 transform hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold">Premium Kibble</span>
          <span className="text-[10px] text-brand-600 font-medium">Bestseller</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-md border border-mint-100 dark:border-slate-700 flex flex-col items-center gap-2 transform hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-xl bg-mint-100 dark:bg-mint-900/50 text-mint-600 dark:text-mint-300 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold">Herbal Shampoo</span>
          <span className="text-[10px] text-mint-600 font-medium">High Margin</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-md border border-purple-100 dark:border-slate-700 flex flex-col items-center gap-2 transform hover:-translate-y-1 transition-all col-span-2 sm:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center">
            <Bone className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold">Dental Chew Bone</span>
          <span className="text-[10px] text-purple-600 font-medium">+22% Surge</span>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-sm border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
        <Award className="w-4 h-4 text-brand-500" />
        <span>Optimized Canvas Fallback Mode Active</span>
      </div>
    </div>
  );
}

// Error Boundary for WebGL Support
class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('WebGL render error caught gracefully:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <HeroFallback />;
    }
    return this.props.children;
  }
}

// Main Exported Hero Scene Canvas
export default function HeroSceneCanvas({ lowSpec = false }) {
  const [isSupported, setIsSupported] = useState(true);
  const [allowRotate, setAllowRotate] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setIsSupported(false);
      }
    } catch (e) {
      setIsSupported(false);
    }
  }, []);

  if (!isSupported || lowSpec) {
    return <HeroFallback />;
  }

  return (
    <div className="w-full h-full min-h-[460px] lg:min-h-[520px] relative select-none">
      <WebGLErrorBoundary>
        <Canvas
          shadows
          camera={{ position: [0, 0.8, 5.2], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            <SceneContents />
            {allowRotate && (
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                maxPolarAngle={Math.PI / 2 + 0.15}
                minPolarAngle={Math.PI / 3}
                maxAzimuthAngle={Math.PI / 4}
                minAzimuthAngle={-Math.PI / 4}
                dampingFactor={0.05}
              />
            )}
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>

      {/* Floating 3D Interaction Badge */}
      <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/40 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>Interactive 3D • Drag to rotate</span>
      </div>
    </div>
  );
}
