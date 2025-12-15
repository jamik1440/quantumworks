import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Fix for missing IntrinsicElements types in this environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      octahedronGeometry: any;
      icosahedronGeometry: any;
      torusGeometry: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshPhongMaterial: any;
      meshBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
      // Allow any other elements (div, span, svg elements, etc.) to prevent errors
      [elemName: string]: any;
    }
  }
}

// A "Quantum Core" representing data transfer and global connectivity
const QuantumCore = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (coreRef.current) {
      // Pulse the core
      const scale = 1 + Math.sin(time * 2) * 0.1;
      coreRef.current.scale.set(scale, scale, scale);
      coreRef.current.rotation.y += 0.01;
      coreRef.current.rotation.z += 0.01;
    }

    // Rotate rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.5;
      ring1Ref.current.rotation.y = time * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = time * 0.4 + 1; // Offset
      ring2Ref.current.rotation.y = -time * 0.5;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -time * 0.6;
      ring3Ref.current.rotation.z = time * 0.2;
    }
  });

  return (
    <group scale={1.8}>
      {/* Central Nucleus */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial 
          color="#00F2FF" 
          emissive="#00F2FF" 
          emissiveIntensity={1.5} 
          wireframe 
          transparent 
          opacity={0.9} 
        />
      </mesh>
      
      {/* Inner Glow Sphere */}
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color="#FF007A" />
      </mesh>

      {/* Orbit Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.6, 0.02, 16, 100]} />
        <meshBasicMaterial color="#00F2FF" transparent opacity={0.6} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.0, 0.03, 16, 100]} />
        <meshBasicMaterial color="#FF007A" transparent opacity={0.4} />
      </mesh>
      
      <mesh ref={ring3Ref} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.4, 0.02, 16, 100]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

const ThreeScene = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00F2FF" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#FF007A" />
        
        <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={0.5} />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <QuantumCore />
        </Float>
      </Canvas>
    </div>
  );
};

export default ThreeScene;