import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { StlModelData, GeometryViewOptions } from '../types/geometry';
import type { TemperatureDatasetData, TemperatureViewOptions, InspectedNode } from '../types/temperature';

interface ThreeViewportProps {
  className?: string;
  stlData?: StlModelData | null;
  csvData?: TemperatureDatasetData | null;
  geometryOptions: GeometryViewOptions;
  temperatureOptions: TemperatureViewOptions;
  inspectedNode?: InspectedNode | null;
  onInspectNode?: (node: InspectedNode | null) => void;
  cameraTrigger?: { type: 'fit' | 'top' | 'front' | 'side' | 'iso'; timestamp: number } | null;
}

// Smooth spectral colormap from Blue (coldest) to Red (hottest)
function temperatureToColor(t: number, minT: number, maxT: number): THREE.Color {
  const range = maxT - minT > 1e-6 ? maxT - minT : 1.0;
  const u = Math.min(Math.max((t - minT) / range, 0.0), 1.0);

  // 5-stop gradient: Blue (0.0) -> Cyan (0.25) -> Green (0.5) -> Yellow (0.75) -> Red (1.0)
  let r = 0, g = 0, b = 0;
  if (u < 0.25) {
    const s = u / 0.25;
    r = 0.0;
    g = s;
    b = 1.0;
  } else if (u < 0.5) {
    const s = (u - 0.25) / 0.25;
    r = 0.0;
    g = 1.0;
    b = 1.0 - s;
  } else if (u < 0.75) {
    const s = (u - 0.5) / 0.25;
    r = s;
    g = 1.0;
    b = 0.0;
  } else {
    const s = (u - 0.75) / 0.25;
    r = 1.0;
    g = 1.0 - s * 0.7;
    b = 0.0;
  }

  return new THREE.Color(r, g, b);
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  className,
  stlData,
  csvData,
  geometryOptions,
  temperatureOptions,
  inspectedNode,
  onInspectNode,
  cameraTrigger
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // References to long-lived Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // References to active scene layers
  const stlMeshRef = useRef<THREE.Mesh | null>(null);
  const stlWireframeRef = useRef<THREE.LineSegments | null>(null);
  const pointsMeshRef = useRef<THREE.Points | null>(null);
  const markerMeshRef = useRef<THREE.Mesh | null>(null);

  // 1. Initial Scene, Camera, Lighting, Controls setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth > 0 ? container.clientWidth : 800;
    const height = container.clientHeight > 0 ? container.clientHeight : 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141414);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 100);
    camera.position.set(0.15, 0.15, 0.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0.05, 0.05, 0.025);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(1, 2, 2);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-1, -1, -1);
    scene.add(dirLight2);

    // Reference Grid and Axes
    const grid = new THREE.GridHelper(0.3, 30, 0x00ffff, 0x333333);
    grid.position.set(0.05, 0, 0.05);
    scene.add(grid);

    const axes = new THREE.AxesHelper(0.05);
    scene.add(axes);

    // Selection Marker for inspected node
    const markerGeo = new THREE.SphereGeometry(0.0015, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.visible = false;
    scene.add(marker);
    markerMeshRef.current = marker;

    // Animation Loop
    let animationFrameId: number;
    let isDisposed = false;

    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      controls.dispose();
      renderer.dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      axes.geometry.dispose();
      (axes.material as THREE.Material).dispose();
      markerGeo.dispose();
      markerMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2. STL Geometry Layer Update
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous STL meshes
    if (stlMeshRef.current) {
      scene.remove(stlMeshRef.current);
      stlMeshRef.current.geometry.dispose();
      (stlMeshRef.current.material as THREE.Material).dispose();
      stlMeshRef.current = null;
    }
    if (stlWireframeRef.current) {
      scene.remove(stlWireframeRef.current);
      stlWireframeRef.current.geometry.dispose();
      (stlWireframeRef.current.material as THREE.Material).dispose();
      stlWireframeRef.current = null;
    }

    if (!stlData || stlData.status !== 'ok' || !stlData.positions || stlData.positions.length === 0) {
      return;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(stlData.positions), 3));

    if (stlData.normals && stlData.normals.length === stlData.positions.length) {
      geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(stlData.normals), 3));
    } else {
      geometry.computeVertexNormals();
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x82b1ff,
      roughness: 0.5,
      metalness: 0.1,
      transparent: geometryOptions.opacity < 1.0,
      opacity: geometryOptions.opacity,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = geometryOptions.showSurface;
    scene.add(mesh);
    stlMeshRef.current = mesh;

    // Optional subtle wireframe overlay
    if (geometryOptions.wireframe) {
      const wireframeGeo = new THREE.WireframeGeometry(geometry);
      const wireframeMat = new THREE.LineBasicMaterial({ color: 0x2979ff, linewidth: 1 });
      const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
      scene.add(wireframe);
      stlWireframeRef.current = wireframe;
    }

    // Auto-fit camera if this is the only active layer
    if (!csvData) {
      fitCameraToObject(mesh);
    }
  }, [stlData, geometryOptions.showSurface, geometryOptions.wireframe, geometryOptions.opacity]);

  // 3. Temperature Point Cloud Layer Update
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous points mesh
    if (pointsMeshRef.current) {
      scene.remove(pointsMeshRef.current);
      pointsMeshRef.current.geometry.dispose();
      (pointsMeshRef.current.material as THREE.Material).dispose();
      pointsMeshRef.current = null;
    }

    if (!csvData || csvData.status !== 'ok' || !csvData.positions || csvData.positions.length === 0) {
      return;
    }

    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(csvData.positions);
    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const nodeCount = csvData.node_count ?? csvData.positions.length / 3;
    const minT = csvData.temperature_stats?.min_temperature_C ?? 0;
    const maxT = csvData.temperature_stats?.max_temperature_C ?? 100;

    const colors = new Float32Array(nodeCount * 3);
    const temps = csvData.temperatures_C ?? [];

    for (let i = 0; i < nodeCount; ++i) {
      const t = temps[i] ?? minT;
      const col = temperatureToColor(t, minT, maxT);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Dynamic point size scaled to meters
    const material = new THREE.PointsMaterial({
      size: Math.max(temperatureOptions.pointSize * 0.0015, 0.002),
      vertexColors: true,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.visible = temperatureOptions.showPoints;
    scene.add(points);
    pointsMeshRef.current = points;

    // Auto-fit camera
    fitCameraToObject(points);
  }, [csvData, temperatureOptions.showPoints, temperatureOptions.pointSize]);

  // 4. Inspected Node Marker Update
  useEffect(() => {
    const marker = markerMeshRef.current;
    if (!marker) return;

    if (inspectedNode) {
      marker.position.set(inspectedNode.x, inspectedNode.y, inspectedNode.z);
      marker.visible = true;
    } else {
      marker.visible = false;
    }
  }, [inspectedNode]);

  // 5. Interactive Raycasting for Node Inspection
  useEffect(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    if (!container || !renderer || !camera || !onInspectNode) return;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.004 }; // 4mm pick radius

    const handlePointerDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only left-click
      if (!pointsMeshRef.current || !csvData || !csvData.positions) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(pointsMeshRef.current);

      if (intersects.length > 0 && intersects[0].index !== undefined) {
        const idx = intersects[0].index;
        const nodeId = csvData.node_ids ? csvData.node_ids[idx] : idx + 1;
        const x = csvData.positions[idx * 3];
        const y = csvData.positions[idx * 3 + 1];
        const z = csvData.positions[idx * 3 + 2];
        const temp = csvData.temperatures_C ? csvData.temperatures_C[idx] : 0;

        onInspectNode({ nodeId, x, y, z, temperature: temp });
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handlePointerDown);

    return () => {
      domElement.removeEventListener('click', handlePointerDown);
    };
  }, [csvData, onInspectNode]);

  // 6. Camera Framing Function
  const fitCameraToObject = (object: THREE.Object3D) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const box = new THREE.Box3();
    box.setFromObject(object);

    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = Math.max((maxDim / 2 / Math.tan(fov / 2)) * 1.6, 0.05);

    camera.position.set(center.x + cameraDistance * 0.7, center.y + cameraDistance * 0.7, center.z + cameraDistance * 0.9);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
  };

  // 7. Handle Camera Presets & Fit Signals
  useEffect(() => {
    if (!cameraTrigger) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // Find bounding center of all active objects
    const box = new THREE.Box3();
    if (stlMeshRef.current) box.expandByObject(stlMeshRef.current);
    if (pointsMeshRef.current) box.expandByObject(pointsMeshRef.current);

    const center = box.isEmpty() ? new THREE.Vector3(0.05, 0.05, 0.025) : box.getCenter(new THREE.Vector3());
    const size = box.isEmpty() ? new THREE.Vector3(0.1, 0.1, 0.05) : box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const dist = Math.max((maxDim / 2 / Math.tan(fov / 2)) * 1.6, 0.08);

    controls.target.copy(center);

    switch (cameraTrigger.type) {
      case 'fit':
      case 'iso':
        camera.position.set(center.x + dist * 0.7, center.y + dist * 0.7, center.z + dist * 0.9);
        break;
      case 'top':
        camera.position.set(center.x, center.y + dist * 1.2, center.z);
        break;
      case 'front':
        camera.position.set(center.x, center.y, center.z + dist * 1.2);
        break;
      case 'side':
        camera.position.set(center.x + dist * 1.2, center.y, center.z);
        break;
    }

    camera.lookAt(center);
    controls.update();
  }, [cameraTrigger]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: '350px', position: 'relative', overflow: 'hidden' }}
    />
  );
};
