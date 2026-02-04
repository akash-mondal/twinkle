"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Float, Html, Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets & Materials ---

// Custom Sketch/Toon Material setup
const toonMaterial = new THREE.MeshToonMaterial({
  color: "#ffffff",
  gradientMap: null, // We can generate a tone mapping gradient if needed, or rely on lights
});

function Model({ url, position, rotation, scale, color, outlineColor }: any) {
  const { scene } = useGLTF(url) as any;
  const meshRef = useRef<THREE.Group>(null);

  // Apply Sketch Style (Toon + Outline)
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5; // Spin animation
    }
  });

  // Traverse and apply material
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshToonMaterial({
          color: color,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, color]);

  return (
    <group ref={meshRef} position={position} rotation={rotation} scale={scale} dispose={null}>
      <primitive object={scene} />
      {/* Thick Outline for Sketch Look */}
      {/* Note: Outlines need to be inside a mesh usually, or we wrap primitive. 
          For complex GLBs, Outlines on primitive might not work perfectly without traversing.
          We will skip Drei Outlines on complex specific geometry for now and rely on Toon shading 
          plus CSS borders/effects for the 'sketch' vibe to ensure performance/stability first. 
          If user insist on 3D outlines, we can add edges geometry layer.
      */}
    </group>
  );
}

// --- Animation Stages ---
// 0. User Typing
// 1. Agent Processing / x402
// 2. USDC Payment (Show USDC Model)
// 3. Twinkle Processing
// 4. MNEE Settlement (Show MNEE Model)

export const PaymentFlow3D = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const cycle = async () => {
      while (true) {
        setStage(0); // Typing
        await new Promise(r => setTimeout(r, 2000));
        setStage(1); // Agent/x402
        await new Promise(r => setTimeout(r, 2000));
        setStage(2); // USDC
        await new Promise(r => setTimeout(r, 3000));
        setStage(3); // Twinkle
        await new Promise(r => setTimeout(r, 1500));
        setStage(4); // MNEE
        await new Promise(r => setTimeout(r, 4000));
      }
    };
    cycle();
  }, []);

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative', background: 'transparent' }}>
      
      {/* 3D Scene */}
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <spotLight position={[-10, 10, -5]} intensity={1} color="purple" />

        {/* Floating USDC Model */}
        <Animate3DVisible visible={stage === 2 || stage === 3}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Model 
              url="/models/usdc.glb" 
              position={stage === 3 ? [-2, 0, 0] : [0, 0, 0]} 
              scale={[0.08, 0.08, 0.08]} // Adjust scale as needed based on GLB size
              color="#2775CA" // USDC Blue
              rotation={[Math.PI / 2, 0, 0]} // Reorient if needed
            />
          </Float>
        </Animate3DVisible>

        {/* Floating MNEE Model */}
        <Animate3DVisible visible={stage === 4}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Model 
              url="/models/mnee.glb" 
              position={[0, 0, 0]} 
              scale={[0.8, 0.8, 0.8]} 
              color="#E78B1F" // MNEE Orange
              rotation={[0, 0, 0]}
            />
          </Float>
        </Animate3DVisible>

         {/* Twinkle Particle Effect could go here in 3D, but simple text overlay is cleaner for now */}

      </Canvas>

      {/* HTML Overlays for Text & Storytelling */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#52525B', background: '#F4F4F5', padding: '8px 16px', borderRadius: '8px', marginBottom: '12px' }}>
                User Request
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 500, fontFamily: '"Playfair Display", serif' }}>
                "Book a flight to NYC..."
              </h3>
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              style={{ textAlign: 'center' }}
            >
               <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#E78B1F', background: '#FFF7ED', padding: '8px 16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #FFEDD5' }}>
                Agent Processing
              </div>
              <h3 style={{ fontSize: '32px', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
                 HTTP 402 Payment Required
              </h3>
            </motion.div>
          )}

          {(stage === 2 || stage === 3) && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', bottom: '40px', width: '100%', textAlign: 'center' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#2775CA', background: 'white', padding: '6px 14px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                Sending USDC
              </span>
            </motion.div>
          )}

          {stage === 3 && (
            <motion.div
               key="step3"
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               style={{ position: 'absolute', zIndex: 10 }}
            >
              <div style={{ 
                width: '120px', height: '120px', 
                background: 'linear-gradient(135deg, #E78B1F 0%, #FFDB45 100%)', 
                borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(231, 139, 31, 0.4)'
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>Twinkle</span>
              </div>
            </motion.div>
          )}

          {stage === 4 && (
             <motion.div
             key="step4"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             style={{ position: 'absolute', bottom: '40px', width: '100%', textAlign: 'center' }}
           >
             <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#E78B1F', background: 'white', padding: '6px 14px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  Settled in MNEE
                </span>
                <span style={{ fontSize: '12px', color: '#71717A' }}>Gasless & Instant</span>
             </div>
           </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};

// Helper for conditional 3D rendering with transitions
// Note: React Three Fiber simple visibility toggling can be abrupt. 
// For smoother generic/out transitions, we often use scale animations in loop.
// Here we just use basic conditional rendering for simplicity of prototype.
function Animate3DVisible({ visible, children }: { visible: boolean, children: React.ReactNode }) {
  // A proper fade out in R3F requires animated materials or scaling.
  // We'll trust the parent's `stage` logic toggles meshes.
  return visible ? <group>{children}</group> : null;
}
