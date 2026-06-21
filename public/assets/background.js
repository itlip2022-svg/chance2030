/**
 * Interactive particle-network background.
 *
 * Ported from postyour.art's THREE.js "network animation" (the `co()` factory
 * in its bundle): ~350 points drifting on a sine/cosine field, springing back
 * toward their home position, attracted toward the cursor, and auto-connected
 * by short lines when close enough. Physics constants are kept 1:1 with the
 * original; only the palette/blending is adapted from the site's dark theme to
 * the CHANCE2030 white "paper" background (dark ink points + hairline links).
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

function createNetwork(container, opts = {}) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return () => {};

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Fewer points on small/low-power screens; original uses 350.
  const COUNT = window.innerWidth < 720 ? 180 : 350;
  const SPREAD_X = 180;
  const SPREAD_Y = 80;
  const SPREAD_Z = 40;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const velocities = [];
  const homes = [];
  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * SPREAD_X;
    const y = (Math.random() - 0.5) * SPREAD_Y;
    const z = (Math.random() - 0.5) * SPREAD_Z;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    homes.push(new THREE.Vector3(x, y, z));
    velocities.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04
      )
    );
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    color: opts.particleColor ?? 0x0d0d0d,
    size: opts.particleSize ?? 1.1,
    transparent: true,
    opacity: opts.particleOpacity ?? 0.55,
    blending: THREE.NormalBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, pointsMaterial);
  scene.add(points);

  // Line segments connecting nearby points.
  const lineMaterial = new THREE.LineBasicMaterial({
    color: opts.lineColor ?? 0x0d0d0d,
    transparent: true,
    opacity: opts.lineOpacity ?? 0.12,
    blending: THREE.NormalBlending,
  });
  const MAX_SEGMENTS = COUNT * 5;
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(MAX_SEGMENTS * 3 * 2);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  // Mouse → world point on the z=0 plane (drives the attraction force).
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const target = new THREE.Vector3(0, 0, 0);

  function onMove(e) {
    const r = container.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, target);
  }
  function onLeave() {
    target.set(0, 0, 0);
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseleave', onLeave);

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);

  const CONNECT_DIST = 12;
  function rebuildLines() {
    const pos = points.geometry.attributes.position.array;
    let w = 0;
    for (let j = 0; j < COUNT; j++) {
      let made = 0;
      for (let k = j + 1; k < COUNT && made <= 4; k++) {
        const dx = pos[j * 3] - pos[k * 3];
        const dy = pos[j * 3 + 1] - pos[k * 3 + 1];
        const dz = pos[j * 3 + 2] - pos[k * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < CONNECT_DIST * CONNECT_DIST) {
          linePositions[w++] = pos[j * 3];
          linePositions[w++] = pos[j * 3 + 1];
          linePositions[w++] = pos[j * 3 + 2];
          linePositions[w++] = pos[k * 3];
          linePositions[w++] = pos[k * 3 + 1];
          linePositions[w++] = pos[k * 3 + 2];
          made++;
        }
      }
    }
    lines.geometry.setDrawRange(0, w / 3);
    lines.geometry.attributes.position.needsUpdate = true;
  }

  let raf;
  const clock = new THREE.Clock();
  const tmpToTarget = new THREE.Vector3();
  const tmpToHome = new THREE.Vector3();
  function tick() {
    const t = clock.getElapsedTime();
    const pos = points.geometry.attributes.position.array;
    for (let k = 0; k < COUNT; k++) {
      const j = k * 3;
      const cur = tmpToTarget.set(pos[j], pos[j + 1], pos[j + 2]);
      const vel = velocities[k];

      // Attraction toward the cursor within radius 80.
      const toTarget = new THREE.Vector3().subVectors(target, cur);
      const dist = toTarget.length();
      if (target.length() > 0.1 && dist < 80) {
        const force = (80 - dist) * 0.005;
        vel.add(toTarget.normalize().multiplyScalar(force));
      }

      // Spring back toward home + gentle drift + damping.
      tmpToHome.subVectors(homes[k], cur);
      vel.add(tmpToHome.multiplyScalar(0.001));
      vel.x += Math.sin(t * 0.5 + k) * 0.005;
      vel.y += Math.cos(t * 0.6 + k) * 0.005;
      vel.multiplyScalar(0.85);

      pos[j] += vel.x;
      pos[j + 1] += vel.y;
      pos[j + 2] += vel.z;
    }
    points.geometry.attributes.position.needsUpdate = true;
    rebuildLines();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  // Teardown.
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseleave', onLeave);
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
    pointsMaterial.dispose();
    lineMaterial.dispose();
    geometry.dispose();
    lineGeometry.dispose();
    renderer.dispose();
  };
}

const bg = document.getElementById('bg');
if (bg) {
  try {
    createNetwork(bg, {});
  } catch (err) {
    // THREE failed to load (e.g. offline) — fail silently, the white
    // background simply stays static. Content is unaffected.
    // eslint-disable-next-line no-console
    console.warn('Background animation disabled:', err);
  }
}
