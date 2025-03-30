import * as THREE from "three";

/**
 * Creates a single UFO model
 * @returns {THREE.Group} The UFO model
 */
export function createUFO() {
  const ufoGroup = new THREE.Group();

  // Create materials
  const mainMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888,
    specular: 0x333333,
    shininess: 30,
  });

  const domeMaterial = new THREE.MeshPhongMaterial({
    color: 0x7777aa,
    transparent: true,
    opacity: 0.7,
    specular: 0xffffff,
    shininess: 100,
  });

  const lightMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5,
  });

  // Main disc
  const discGeometry = new THREE.CylinderGeometry(5, 5, 1, 32);
  const disc = new THREE.Mesh(discGeometry, mainMaterial);
  disc.castShadow = true;
  ufoGroup.add(disc);

  // Top dome
  const domeGeometry = new THREE.SphereGeometry(
    3,
    32,
    16,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.position.y = 0.5;
  dome.castShadow = true;
  ufoGroup.add(dome);

  // Bottom rim
  const rimGeometry = new THREE.TorusGeometry(5, 0.5, 16, 32);
  const rim = new THREE.Mesh(rimGeometry, mainMaterial);
  rim.position.y = -0.5;
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  ufoGroup.add(rim);

  // Center hole
  const holeGeometry = new THREE.TorusGeometry(1, 0.4, 16, 32);
  const hole = new THREE.Mesh(holeGeometry, mainMaterial);
  hole.position.y = -0.5;
  hole.rotation.x = Math.PI / 2;
  ufoGroup.add(hole);

  // Add lights around the rim
  const lightCount = 8;
  for (let i = 0; i < lightCount; i++) {
    const angle = (i / lightCount) * Math.PI * 2;
    const x = Math.cos(angle) * 4.5;
    const z = Math.sin(angle) * 4.5;

    const lightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(x, -0.5, z);
    ufoGroup.add(light);
  }

  // Add center light - for beam effect
  const centerLightGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const centerLight = new THREE.Mesh(centerLightGeometry, lightMaterial);
  centerLight.position.y = -0.8;
  ufoGroup.add(centerLight);

  // Add actual light source
  const pointLight = new THREE.PointLight(0x00ff00, 1, 20);
  pointLight.position.y = -0.8;
  ufoGroup.add(pointLight);

  // Store animation properties in userData
  ufoGroup.userData = {
    hoverSpeed: 0.2 + Math.random() * 0.3, // Random hover speed
    hoverHeight: 0.2 + Math.random() * 0.3, // Random hover amplitude
    rotationSpeed: 0.2 + Math.random() * 0.5, // Random rotation speed
    originalY: 0, // Will store original Y position
    time: Math.random() * 1000, // Random start time for animation variation
  };

  return ufoGroup;
}

/**
 * Creates multiple UFOs and positions them over the city
 * @param {THREE.Scene} scene - The scene to add UFOs to
 * @param {number} count - Number of UFOs to create
 * @returns {Array} Array of UFO objects
 */
export function createUFOFleet(scene, count) {
  const ufos = [];

  // Define the area above the city where UFOs should appear
  const areaSizeX = 400; // Increased area size to match larger city (was 200)
  const areaSizeZ = 400; // Increased area size to match larger city (was 200)
  const minHeight = 60;
  const maxHeight = 150; // Increased max height (was 120)

  // Create different distribution patterns based on city zones
  for (let i = 0; i < count; i++) {
    const ufo = createUFO();

    let x, y, z;

    // Determine which zone this UFO should be in
    const zone = Math.random();

    if (zone < 0.4) {
      // Downtown concentration (40% of UFOs)
      const radius = Math.random() * 120; // Downtown radius
      const angle = Math.random() * Math.PI * 2;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = minHeight + 20 + Math.random() * (maxHeight - minHeight - 20); // Higher altitude
    } else if (zone < 0.8) {
      // Midtown distribution (40% of UFOs)
      const radius = 120 + Math.random() * 150; // Midtown ring
      const angle = Math.random() * Math.PI * 2;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = minHeight + Math.random() * (maxHeight - minHeight - 10); // Medium altitude
    } else {
      // Outer suburbs (20% of UFOs)
      x = (Math.random() - 0.5) * areaSizeX;
      z = (Math.random() - 0.5) * areaSizeZ;
      y = minHeight + Math.random() * (maxHeight - minHeight - 30); // Lower altitude
    }

    // Scale UFO based on height (distant UFOs are larger to be visible)
    const scale = 1.0 + Math.random() * 0.5;
    ufo.scale.set(scale, scale, scale);

    ufo.position.set(x, y, z);
    ufo.userData.originalY = y;

    // Random initial rotation
    ufo.rotation.y = Math.random() * Math.PI * 2;

    // Add to scene and array
    scene.add(ufo);
    ufos.push(ufo);
  }

  return ufos;
}

/**
 * Animates UFOs with hovering and rotation effects
 * @param {Array} ufos - Array of UFO objects
 * @param {number} deltaTime - Time since last frame
 */
export function animateUFOs(ufos, deltaTime) {
  for (const ufo of ufos) {
    // Update time
    ufo.userData.time += deltaTime;

    // Hovering effect
    const hoverOffset =
      Math.sin(ufo.userData.time * ufo.userData.hoverSpeed) *
      ufo.userData.hoverHeight;
    ufo.position.y = ufo.userData.originalY + hoverOffset;

    // Rotation effect
    ufo.rotation.y += ufo.userData.rotationSpeed * deltaTime;

    // Optional: Make UFOs move around slightly
    // This creates a small circular motion
    const radius = 5;
    const speed = 0.2;
    const originalX = ufo.position.x;
    const originalZ = ufo.position.z;

    ufo.position.x =
      originalX + Math.sin(ufo.userData.time * speed) * radius * 0.1;
    ufo.position.z =
      originalZ + Math.cos(ufo.userData.time * speed) * radius * 0.1;
  }
}
