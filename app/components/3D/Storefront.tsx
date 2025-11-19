import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  MutableRefObject,
  Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Center, useGLTF, OrbitControls } from '@react-three/drei';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';
import { Await, useAsyncValue } from 'react-router';
import type { CartApiQueryFragment } from 'storefrontapi.generated';

import ProductCardPreview from './ProductCard';
import {
  logoModelURL,
  rowGap,
  globalScale,
  fadeStart,
  fadeEnd,
  backgroundAudioURL,
  speakerModelURL,
  environmentURL
} from './constants';
import { easeOutCubic, easeOutBack } from './utils';
import type { ProductData, ShopifyProduct, SelectedProduct } from './types';
import { useAside } from '~/components/Aside';

import { ShoppingCart, Volume2, VolumeX, Save, ArrowLeft, LayoutGrid, Ruler, ChevronDown } from '~/components/icons';

//================================================================
// Data Transformation
//================================================================
const transformShopifyData = (
  shopifyProducts: ShopifyProduct[],
): ProductData[] => {
  const mappedProducts = shopifyProducts.map((p) => {
    const metaobject = p.mdx_model?.reference;

    // A valid model requires at least a URL from the metaobject.
    if (!metaobject?.url?.value) {
      return null;
    }

    try {
      // Safely parse JSON fields, providing default values if they are missing or invalid.
      const scale = metaobject.scale?.value
        ? JSON.parse(metaobject.scale.value)
        : { x: 1, y: 1, z: 1 };
      const position = metaobject.position?.value
        ? JSON.parse(metaobject.position.value)
        : { x: 0, y: 0, z: 0 };
      const rotation = metaobject.rotation?.value
        ? JSON.parse(metaobject.rotation.value)
        : { x: 0, y: 0, z: 0 };

      return {
        id: p.id,
        modelUrl: metaobject.url.value,
        scale,
        position,
        rotation,
        shopifyProduct: p,
      };
    } catch (error) {
      console.error(
        `Failed to parse 3D metaobject data for product ${p.id}:`,
        error,
      );
      return null;
    }
  });

  return mappedProducts.filter((p): p is ProductData => p !== null);
};

//================================================================
// 3D Components
//================================================================

interface CameraControllerProps {
  selected: SelectedProduct | null;
  introProgress: React.MutableRefObject<number>;
  // REFACTOR: Add worldOffset to adjust camera position based on the scene's offset
  worldOffset: THREE.Vector3;
}

const CameraController: React.FC<CameraControllerProps> = ({
  selected,
  introProgress,
  worldOffset,
}) => {
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  // REFACTOR: Adjust default camera position and target with the world offset
  const defaultPos = useRef(new THREE.Vector3(0.0, 1.8, 8));
  const defaultTarget = useRef(new THREE.Vector3(0, 0, 0));
  const defaultDir = useRef(
    new THREE.Vector3(0.0, 1.8, 8).sub(new THREE.Vector3(0, 0, 0)).normalize(),
  );
  // REFACTOR: Adjust initial camera position with the world offset
  const initialPos = new THREE.Vector3(0, 35, 0);
  const [isIntroAnimationDone, setIntroAnimationDone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const logoHoldTime = useRef(0);
  const logoHoldDuration = 0.2; // Hold logo for 2 seconds before starting animation

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useFrame((_, delta) => {
    if (!isIntroAnimationDone) {
      // First, hold the logo for the specified duration
      if (logoHoldTime.current < logoHoldDuration) {
        logoHoldTime.current += delta;
        // Keep camera in initial position during logo hold
        perspectiveCamera.position.copy(initialPos);
        perspectiveCamera.lookAt(defaultTarget.current);
        return;
      }

      // After logo hold, start the intro animation
      introProgress.current = Math.min(introProgress.current + 0.008, 1);
      const t = easeOutCubic(introProgress.current);
      perspectiveCamera.position.lerpVectors(initialPos, defaultPos.current, t);
      perspectiveCamera.lookAt(defaultTarget.current);
      if (introProgress.current >= 1) {
        setIntroAnimationDone(true);
      }
      return;
    }

    let goalPos = defaultPos.current.clone();
    let lookAt = defaultTarget.current.clone();
    if (selected) {
      const fov = THREE.MathUtils.degToRad(perspectiveCamera.fov);
      const margin = (isMobile ? 1.8 : 1.5);
      const distance = (selected.radius / Math.sin(fov / 2)) * margin;
      goalPos = selected.center
        .clone()
        .add(defaultDir.current.clone().multiplyScalar(distance));
      var targetCenter = selected.center.clone();
      targetCenter.y -= selected.radius * (isMobile ? 0.6 : 0.3);
      goalPos.y -= selected.radius * 0.6;
      lookAt = targetCenter;
    }
    perspectiveCamera.position.lerp(goalPos, 0.05);
    perspectiveCamera.lookAt(lookAt);
  });

  return null;
};

interface ProductProps {
  data: ProductData;
  position: [number, number, number];
  quaternion: THREE.Quaternion;
  onSelect: (sel: SelectedProduct) => void;
  introProgress: MutableRefObject<number>;
  selected: SelectedProduct | null;
  onRegisterRef?: (productId: string, selectFn: () => void) => void;
  hasSelection: boolean;
  animationIndex: number; // Add index for sequential animation
}

const Product: React.FC<ProductProps> = ({
  data,
  position,
  quaternion,
  onSelect,
  introProgress,
  selected,
  onRegisterRef,
  hasSelection,
  animationIndex,
}) => {
  const ref = useRef<THREE.Group>(null);
  const gltf = useGLTF(data.modelUrl) as any;
  const modelScene = gltf?.scene;
  const scaledOffsetY = data.position.y * globalScale;
  const rotationSpeed = useRef(0);
  const isSelected = selected?.id === data.id;
  const [isHovered, setIsHovered] = useState(false);
  const hoverScale = useRef(1);
  const baseY = useRef(position[1]);
  const slideOffset = useRef(-0.25); // Start 0.5 units below
  const hasStartedAnimation = useRef(false);
  const animationStartTime = useRef<number | null>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const elapsedTime = useRef(0);

  const clonedModel = useMemo(() => {
    if (!modelScene) return null;
    const cloned = modelScene.clone(true);
    cloned.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const material = (mesh.material as THREE.Material).clone();
          material.transparent = true;
          material.opacity = 0;
          if ('envMapIntensity' in material) {
            (material as THREE.MeshStandardMaterial).envMapIntensity = 1;
          }
          mesh.material = material;
        }
      }
    });
    return cloned;
  }, [modelScene]);

  // Cache mesh references once to avoid repeated traversals
  useEffect(() => {
    if (clonedModel) {
      const meshes: THREE.Mesh[] = [];
      clonedModel.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child as THREE.Mesh);
        }
      });
      meshRefs.current = meshes;
    }
  }, [clonedModel]);

  // Cleanup: Dispose of cloned materials and geometries to prevent memory leaks
  useEffect(() => {
    return () => {
      if (clonedModel) {
        clonedModel.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) {
              mesh.geometry.dispose();
            }
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material: THREE.Material) => material.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [clonedModel]);

  useFrame((_, delta) => {
    if (!ref.current) return;

    // Start individual product animation when global intro is complete
    const baseIntroComplete = introProgress.current >= 1;
    if (baseIntroComplete && !hasStartedAnimation.current) {
      // Schedule animation start with staggered delay
      const delay = animationIndex * 80; // 80ms between each product (faster)
      setTimeout(() => {
        hasStartedAnimation.current = true;
        elapsedTime.current = 0;
      }, delay);
    }

    // Track elapsed time using delta instead of Date.now()
    if (hasStartedAnimation.current) {
      elapsedTime.current += delta * 1000; // Convert to milliseconds
    }

    // Calculate product fade-in based on elapsed time
    let alpha = 0;
    if (hasStartedAnimation.current) {
      alpha = Math.min(elapsedTime.current / 300, 1); // 300ms fade-in duration (faster)
    }

    // Apply selection-based opacity
    let finalOpacity = alpha;
    if (hasSelection && !isSelected) {
      finalOpacity = alpha * 0.3; // Fade non-selected products to 30%
    }

    // Update opacity using cached mesh references (no traversal needed)
    // The lerp itself provides smooth transitions without needing early exit
    for (let i = 0; i < meshRefs.current.length; i++) {
      const mesh = meshRefs.current[i];
      if (mesh.material) {
        mesh.material.opacity = THREE.MathUtils.lerp(
          mesh.material.opacity || 0,
          finalOpacity,
          0.05 // Smooth transition
        );
      }
    }

    // Slide up animation
    const targetSlideOffset = alpha > 0.1 ? 0 : -0.25;
    slideOffset.current = THREE.MathUtils.lerp(slideOffset.current, targetSlideOffset, 0.12);

    // Hover animations
    const targetScale = isHovered && !hasSelection ? 1.1 : 1;
    hoverScale.current = THREE.MathUtils.lerp(hoverScale.current, targetScale, 0.1);
    ref.current.scale.setScalar(hoverScale.current);

    // Gentle floating effect when hovered + slide animation
    const hoverOffset = isHovered && !hasSelection ? 0.05 : 0;
    const finalY = baseY.current + hoverOffset + slideOffset.current;
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, finalY, 0.1);

    if (rotationSpeed.current !== 0) {
      ref.current.rotation.y += rotationSpeed.current * delta;
    }
  });

  const selectProduct = useCallback(() => {
    if (!ref.current) return;
    const box = new THREE.Box3().setFromObject(ref.current);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    onSelect({
      id: data.id,
      center: sphere.center.clone(),
      radius: sphere.radius,
    });
  }, [data.id, onSelect]);

  const handleClick = (event: THREE.Event) => {
    event.stopPropagation();
    selectProduct();
  };

  // Register this product's select function
  useEffect(() => {
    if (onRegisterRef) {
      onRegisterRef(data.id, selectProduct);
    }
  }, [data.id, selectProduct, onRegisterRef]);

  useEffect(() => {
    if (isSelected) {
      rotationSpeed.current = 0.4;
    } else {
      rotationSpeed.current = 0;
      if (ref.current) {
        ref.current.rotation.y = 0;
      }
    }
  }, [isSelected]);

  if (!clonedModel) {
    return null;
  }

  return (
    <group
      ref={ref}
      position={position}
      quaternion={quaternion}
      onClick={handleClick}
      onPointerEnter={() => !hasSelection && setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <primitive
        object={clonedModel}
        scale={[
          data.scale.x * globalScale,
          data.scale.y * globalScale,
          data.scale.z * globalScale,
        ]}
        position={[0, -scaledOffsetY, 0]}
      />
    </group>
  );
};

type AudioSpeakerProps = {
  audioEnabled: boolean;
  hasSelection: boolean;
  introProgress: MutableRefObject<number>;
};

const AudioSpeaker: React.FC<AudioSpeakerProps> = ({ audioEnabled, hasSelection, introProgress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const audioRef = useRef<THREE.PositionalAudio | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { camera } = useThree();
  const gltfSpeaker = useGLTF(speakerModelURL) as any;
  const speakerModel = gltfSpeaker?.scene;

  const clonedSpeaker = useMemo(() => {
    if (!speakerModel) return null;
    const cloned = speakerModel.clone(true);
    cloned.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0; // Start invisible
        child.material.envMapIntensity = 1;
      }
    });
    return cloned;
  }, [speakerModel]);

  useFrame(() => {
    if (!groupRef.current) return;

    // Calculate intro fade-in alpha (same as products)
    let introAlpha = 0;
    if (introProgress.current > fadeStart) {
      introAlpha = Math.min(
        (introProgress.current - fadeStart) / (fadeEnd - fadeStart),
        1,
      );
    }

    // Apply selection-based opacity modifier
    const selectionOpacity = hasSelection ? 0.8 : 1.0;
    const targetOpacity = introAlpha * selectionOpacity;

    groupRef.current.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (!child.material.transparent) {
          child.material.transparent = true;
        }
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity || 0, targetOpacity, 0.05);
      }
    });
  });

  useEffect(() => {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const positionalAudio = new THREE.PositionalAudio(listener);
    audioRef.current = positionalAudio;

    const loader = new THREE.AudioLoader();
    loader.load(backgroundAudioURL, (buffer) => {
      positionalAudio.setBuffer(buffer);
      positionalAudio.setRefDistance(1);
      positionalAudio.setRolloffFactor(0.3);
      positionalAudio.setDistanceModel('exponential');
      positionalAudio.setLoop(true);
      positionalAudio.setVolume(0.6);

      // Ensure audio context is running before playing
      if (audioEnabled) {
        positionalAudio.play();
      }
    });

    if (groupRef.current) {
      groupRef.current.add(positionalAudio);
    }

    return () => {
      if (audioRef.current?.isPlaying) audioRef.current.stop();
      camera.remove(listener);
    };
  }, [camera, audioEnabled]);

  useEffect(() => {
    if (audioRef.current && audioRef.current.buffer) {
      if (audioEnabled && !audioRef.current.isPlaying) {
        audioRef.current.play();
      } else if (!audioEnabled && audioRef.current.isPlaying) {
        audioRef.current.stop();
      }
    }
  }, [audioEnabled]);

  if (!clonedSpeaker) {
    return null;
  }

  return (
    <group ref={groupRef} position={[0, -1.8, 0]} scale={[0.3, 0.3, 0.3]}>
      <primitive object={clonedSpeaker} />
    </group>
  );
};

interface SceneProps {
  onSelect: (sel: SelectedProduct) => void;
  introProgress: MutableRefObject<number>;
  selected: SelectedProduct | null;
  audioEnabled: boolean;
  productDataList: ProductData[];
  sceneRef: MutableRefObject<THREE.Group | null>;
  onRegisterProductRef: (productId: string, selectFn: () => void) => void;
  // REFACTOR: Add worldOffset to position the main content group
  worldOffset: [number, number, number];
}

const Scene: React.FC<SceneProps> = ({
  onSelect,
  introProgress,
  selected,
  audioEnabled,
  productDataList,
  sceneRef,
  onRegisterProductRef,
  worldOffset,
}) => {
  const lightPulse = useRef(0);
  const controlPoints = useMemo(
    () => [
      new THREE.Vector3(-0.15, -0.25, 1.4),
      new THREE.Vector3(2.2, -0.25, 1.0),
      new THREE.Vector3(3.2, -0.25, -0.3),
    ],
    [],
  );
  const invertedControlPoints = useMemo(
    () => controlPoints.map((p) => new THREE.Vector3(-p.x + 0.35, p.y, -p.z - 0.25)),
    [controlPoints],
  );
  const frontCurve = useMemo(
    () => new THREE.CatmullRomCurve3(controlPoints),
    [controlPoints],
  );
  const backCurve = useMemo(
    () => new THREE.CatmullRomCurve3(invertedControlPoints),
    [invertedControlPoints],
  );

  const front = productDataList.slice(0, 4);
  const back = productDataList.slice(4);

  const sampleRow = (
    items: ProductData[],
    curve: THREE.Curve<THREE.Vector3>,
    zOffset: number,
  ) => {
    return items.map((data, idx) => {
      const t = items.length > 1 ? idx / (items.length - 1) : 0.5;
      const pos = curve.getPoint(t);
      const tan = curve.getTangent(t);
      const dir = new THREE.Vector3(tan.x, 0, tan.z).normalize();
      const baseAngle = Math.atan2(dir.x, dir.z);
      const baseQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        baseAngle,
      );
      const rotEuler = new THREE.Euler(
        THREE.MathUtils.degToRad(data.rotation?.x || 0),
        THREE.MathUtils.degToRad(data.rotation?.y || 0),
        THREE.MathUtils.degToRad(data.rotation?.z || 0),
      );
      const rotQuat = new THREE.Quaternion().setFromEuler(rotEuler);
      const finalQuat = baseQuat.clone().multiply(rotQuat);
      return {
        data,
        position: [pos.x, pos.y, pos.z + zOffset] as [number, number, number],
        quaternion: finalQuat,
      };
    });
  };

  const frontSamples = useMemo(
    () => sampleRow(front, frontCurve, -rowGap),
    [front, frontCurve],
  );
  const backSamples = useMemo(
    () => sampleRow(back, backCurve, rowGap),
    [back, backCurve],
  );

  const gltfRope = useGLTF(logoModelURL) as any;
  const ropeScene = gltfRope?.scene;
  const metallicRope = useMemo(() => {
    if (!ropeScene) return null;
    const scene = ropeScene.clone(true);
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: 0xadd8e6,
          metalness: 1,
          roughness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0,
          reflectivity: 1,
          envMapIntensity: 1,
          transparent: true,
          opacity: 1,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return scene;
  }, [ropeScene]);

  // Add rope opacity control and subtle animation with useFrame
  const ropeRef = useRef<THREE.Object3D>(null);
  const ropeRotation = useRef(0);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const spotLight1Ref = useRef<THREE.SpotLight>(null);
  const spotLight2Ref = useRef<THREE.SpotLight>(null);

  useFrame((state, delta) => {
    if (!ropeRef.current) return;

    // const targetOpacity = selected ? 0.8 : 1.0;
    const targetOpacity = 1.0;
    ropeRef.current.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity || 1, targetOpacity, 0.05);
      }
    });

    // Subtle rotation animation
    ropeRotation.current += delta * 0.1;
    ropeRef.current.rotation.y = Math.sin(ropeRotation.current) * 0.02;

    // Gentle light pulsing
    lightPulse.current += delta * 0.5;
    const pulseFactor = 1 + Math.sin(lightPulse.current) * 0.05;

    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = 2 * pulseFactor;
    }
    if (spotLight1Ref.current) {
      spotLight1Ref.current.intensity = 40 * pulseFactor;
    }
    if (spotLight2Ref.current) {
      spotLight2Ref.current.intensity = 50 * pulseFactor;
    }
  });

  return (
    <Center>
      <group ref={sceneRef}>
        <ambientLight intensity={0.5} />
        <directionalLight
          ref={directionalLightRef}
          position={[worldOffset[0] + 3, worldOffset[1] + 12, worldOffset[2] + 2]}
          intensity={2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={20}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <spotLight ref={spotLight1Ref} position={[worldOffset[0] + -4, worldOffset[1] + -5, worldOffset[2] + 4]} intensity={40} />
        <spotLight ref={spotLight2Ref} position={[worldOffset[0] + 4, worldOffset[1] + 2, worldOffset[2] + 2]} intensity={50} />

        {/* HDR environment map with adjustable rotation/scale and shadow receiver */}
        <Environment
          files={environmentURL}
          background={true}
          blur={0.1}
          backgroundIntensity={0.4}
          environmentIntensity={0.1}
          backgroundRotation={[0, 40, 0]}
          // ground={{ height: 5, radius: 20, scale: 20 }}
        />
        {/* REFACTOR: Adjust the shadow catcher's position to match the world offset */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, worldOffset[1] - 2.0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial transparent opacity={0.1} />
        </mesh>
        
        {/* REFACTOR: This new group is the common parent. Its position can be changed to move all children. */}
        <group position={worldOffset}>
          {metallicRope && <primitive ref={ropeRef} object={metallicRope} position={[0.0, 0.0, 0.0]} />}
          <AudioSpeaker audioEnabled={audioEnabled} hasSelection={!!selected} introProgress={introProgress} />
          {[...frontSamples, ...backSamples].map(({ data, position, quaternion }, index) => (
            <Suspense key={data.id} fallback={null}>
              <Product
                data={data}
                position={position}
                quaternion={quaternion}
                onSelect={onSelect}
                introProgress={introProgress}
                selected={selected}
                onRegisterRef={onRegisterProductRef}
                hasSelection={!!selected}
                animationIndex={index}
              />
            </Suspense>
          ))}
        </group>
      </group>
    </Center>
  );
};

//================================================================
// Main Storefront Component
//================================================================
interface StorefrontProps {
  shopifyProducts: ShopifyProduct[];
  cart: Promise<CartApiQueryFragment | null>;
}

// Updated TopBar component with real Lucide icons
function TopBar({
  selected,
  onBack,
  onExportScene,
  isExporting,
  audioEnabled,
  onToggleAudio,
  introProgress,
}: {
  selected: SelectedProduct | null;
  onBack: () => void;
  onExportScene: () => void;
  isExporting: boolean;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  introProgress: MutableRefObject<number>;
}) {
  const { open } = useAside();
  const cart = useAsyncValue() as CartApiQueryFragment | null;
  const [buttonsVisible, setButtonsVisible] = useState(false);
  
  // Monitor intro progress and trigger button animation
  useEffect(() => {
    const checkIntroProgress = () => {
      if (introProgress.current >= 1 && !buttonsVisible) {
        setButtonsVisible(true);
      }
    };
    
    const interval = setInterval(checkIntroProgress, 50); // Check every 50ms
    return () => clearInterval(interval);
  }, [introProgress, buttonsVisible]);

  const buttonBaseClasses = "backdrop-blur-md rounded-lg h-10 flex items-center justify-center transition-all duration-300";
  const cartButtonClasses = "backdrop-blur-md rounded-lg h-10 px-3 flex items-center justify-center transition-all duration-300";

  return (
    <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
      {/* Wrapper for buttons to enable pointer events */}
      {/* Left side - Back button */}
      <div className="pointer-events-auto">
        {selected && (
          <button
            className={`${buttonBaseClasses} w-10 bg-black/50 text-white hover:bg-black/70`}
            onClick={onBack}
            style={{
              opacity: buttonsVisible ? 1 : 0,
              transform: `translateY(${buttonsVisible ? 0 : -10}px)`
            }}
          >
            <ArrowLeft size={16} />
          </button>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex gap-2 pointer-events-auto">
        {/* <button
          onClick={onExportScene}
          disabled={isExporting}
          className={`${buttonBaseClasses} w-10 bg-blue-500/70 text-white hover:bg-blue-600/70 disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{
            opacity: buttonsVisible ? 1 : 0,
            transform: `translateY(${buttonsVisible ? 0 : -10}px)`,
            transitionDelay: '100ms'
          }}
        >
          <Save size={16} />
        </button> */}

        <button
          onClick={onToggleAudio}
          className={`${buttonBaseClasses} w-10 bg-black/50 text-white hover:bg-black/70`}
          style={{
            opacity: buttonsVisible ? 1 : 0,
            transform: `translateY(${buttonsVisible ? 0 : -10}px)`,
            transitionDelay: '200ms'
          }}
        >
          {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button
          onClick={() => open('cart')}
          className={`${cartButtonClasses} bg-black/50 text-white hover:bg-black/70 text-xs font-bold whitespace-nowrap`}
          style={{
            opacity: buttonsVisible ? 1 : 0,
            transform: `translateY(${buttonsVisible ? 0 : -10}px)`,
            transitionDelay: '300ms'
          }}
        >
          <ShoppingCart size={16} className="mr-1" />
          <span>CART</span>
          {cart && cart.totalQuantity > 0 && <span className="ml-1">({cart.totalQuantity})</span>}
        </button>
      </div>
    </div>
  );
}

export const Storefront: React.FC<StorefrontProps> = ({
  shopifyProducts,
  cart,
}) => {
  const [selected, setSelected] = useState<SelectedProduct | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const introProgress = useRef(0);
  const sceneRef = useRef<THREE.Group | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  // REFACTOR: Define the world offset here. Change this value to move everything.
  const worldOffset = useMemo(() => new THREE.Vector3(0, 2.4, 1.4), []);

  const productDataList = useMemo(
    () => transformShopifyData(shopifyProducts || []),
    [shopifyProducts],
  );

  const productRefsMap = useRef<Map<string, { selectProduct: () => void }>>(new Map());

  const registerProductRef = useCallback((productId: string, selectFn: () => void) => {
    productRefsMap.current.set(productId, { selectProduct: selectFn });
  }, []);

  // Safety check - ensure we have valid product data
  if (!shopifyProducts || shopifyProducts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Products Found</h2>
          <p>Please check your Shopify configuration.</p>
        </div>
      </div>
    );
  }

  // Safety check for valid product data
  if (productDataList.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No 3D Models Found</h2>
          <p>Products need 3D model data to display in the 3D storefront.</p>
        </div>
      </div>
    );
  }

  const selectedShopifyProduct = useMemo(() => {
    if (!selected) return null;
    return productDataList.find((p) => p.id === selected.id)?.shopifyProduct;
  }, [selected, productDataList]);

  const exportScene = async () => {
    if (!sceneRef.current) return;

    setIsExporting(true);
    try {
      const exporter = new GLTFExporter();
      const result = await new Promise<any>((resolve, reject) => {
        exporter.parse(
          sceneRef.current!,
          resolve,
          reject,
          {
            binary: false,
            embedImages: true,
            animations: [],
            includeCustomExtensions: false,
          }
        );
      });

      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json'
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `storefront-scene-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.gltf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export scene:', error);
      alert('Failed to export scene. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const navigateToProduct = (direction: 'next' | 'prev') => {
    if (!selected || productDataList.length === 0) return;

    const currentIndex = productDataList.findIndex(p => p.id === selected.id);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % productDataList.length;
    } else {
      newIndex = (currentIndex - 1 + productDataList.length) % productDataList.length;
    }

    const newProduct = productDataList[newIndex];
    const productRef = productRefsMap.current.get(newProduct.id);

    if (productRef) {
      productRef.selectProduct();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!selected) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!selected || !touchStartRef.current) return;
    const touch = e.touches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!selected || !touchStartRef.current || !touchEndRef.current) return;

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = Math.abs(touchEndRef.current.y - touchStartRef.current.y);
    const minSwipeDistance = 50;

    // Only trigger swipe if horizontal movement is greater than vertical (prevents accidental swipes during scrolling)
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        navigateToProduct('prev'); // Swipe right = previous product
      } else {
        navigateToProduct('next'); // Swipe left = next product
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <div
      className="App w-full h-full relative overflow-hidden"
      style={{ touchAction: selected ? 'none' : 'auto' }}
      onTouchStart={selected ? handleTouchStart : undefined}
      onTouchMove={selected ? handleTouchMove : undefined}
      onTouchEnd={selected ? handleTouchEnd : undefined}
    >
      <Suspense>
        <Await resolve={cart}>
          <TopBar
            selected={selected}
            onBack={() => setSelected(null)}
            onExportScene={exportScene}
            isExporting={isExporting}
            audioEnabled={audioEnabled}
            onToggleAudio={() => setAudioEnabled(!audioEnabled)}
            introProgress={introProgress}
          />
        </Await>
      </Suspense>

      {/* Scroll Down Indicator - only show when no product is selected */}
      {!selected && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none animate-bounce">
          <ChevronDown size={32} className="text-white drop-shadow-lg" strokeWidth={2} />
          <span className="font-mono text-xs uppercase tracking-wider text-white drop-shadow-lg">
            Scroll down to see all products
          </span>
        </div>
      )}

      {selected && selectedShopifyProduct && (
        <>

          <div
            className="product-card-container absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-center pb-safe animate-in slide-in-from-bottom duration-500"
            style={{
              animation: 'slideInFromBottom 0.4s ease-out forwards'
            }}
          >
            <div className="md:hidden mx-3 mb-2 bg-indigo-950/40 text-white rounded-md px-3 py-2 text-xs backdrop-blur-md text-center">
              <div className='text-white'><span>Swipe ← → to browse products</span></div>
            </div>
            <ProductCardPreview
              key={selectedShopifyProduct.id}
              selectedProduct={selectedShopifyProduct}
            />
          </div>

          <style>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translate(-50%, 10px);
                }
                to {
                  opacity: 1;
                  transform: translate(-50%, 0);
                }
              }
              
              @keyframes slideInFromBottom {
                from {
                  opacity: 0;
                  transform: translateY(100%);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
        </>
      )}
      <Canvas
        shadows
        camera={{ position: [0.0, 0.0, 0.0], fov: isMobile ? 84 : 60 }}
        gl={{ preserveDrawingBuffer: true }}
        className="w-full h-full absolute"
        style={{ touchAction: selected ? 'none' : 'pan-y' }}
        legacy={false}
      >
        {/* REFACTOR: Pass the worldOffset to the CameraController */}
        <CameraController selected={selected} introProgress={introProgress} worldOffset={worldOffset} />
        <Scene
          onSelect={setSelected}
          introProgress={introProgress}
          selected={selected}
          audioEnabled={audioEnabled}
          productDataList={productDataList}
          sceneRef={sceneRef}
          onRegisterProductRef={registerProductRef}
          // REFACTOR: Pass the worldOffset to the Scene
          worldOffset={worldOffset.toArray() as [number, number, number]}
        />
        <OrbitControls
          enabled={!isMobile}
          enableZoom={false}
          enablePan={false}
          enableRotate={!selected}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
};
