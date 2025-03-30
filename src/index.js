import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCity } from "./city.js";
import { createSkybox } from "./skybox.js";
import { PlaneControls } from "./controls.js";
import { GameUI } from "./ui.js";
import { WeaponSystem } from "./weapons.js";
import { createUFOFleet, animateUFOs } from "./ufo.js";
import { GameStateManager, GAME_STATES } from "./gameState.js";
import { EffectsManager } from "./effects.js";
import { AudioManager } from "./audio.js";
import { CollisionSystem } from "./collisions.js";

// Import control parameters for reference
import { CONTROL_PARAMS } from "./controls.js";

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
// Scene background will be set by skybox

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Position camera to see the detailed city streets
// (initial position, will be controlled by PlaneControls later)
camera.position.set(0, 30, 60);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Initialize game state manager
const gameState = new GameStateManager();

// Initialize audio manager
const audioManager = new AudioManager();

// Create OrbitControls instance (will be used in free camera mode)
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.1;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 200;
// Disable orbit controls initially (plane controls will take over)
orbitControls.enabled = false;

// Add fog to the scene - more distant fog to hide the "infinite" ground edge
scene.fog = new THREE.Fog(0x87ceeb, 300, 1200);

// Add basic lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// Add directional light for shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(100, 200, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 10;
directionalLight.shadow.camera.far = 400;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

// Add a second light source from another angle
const secondaryLight = new THREE.DirectionalLight(0xffffcc, 0.4);
secondaryLight.position.set(-50, 100, -50);
scene.add(secondaryLight);

// Create simple plane model
function createPlane() {
  const planeGroup = new THREE.Group();

  // Fuselage (main body)
  const fuselageGeometry = new THREE.CylinderGeometry(0.5, 0.3, 4, 8);
  const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red color
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
  // Rotate to align with z-axis but orient properly for forward flight
  fuselage.rotation.x = -Math.PI / 2; // Negative to flip orientation
  fuselage.castShadow = true;
  planeGroup.add(fuselage);

  // Wings
  const wingGeometry = new THREE.BoxGeometry(7, 0.1, 1);
  const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red color
  const wing = new THREE.Mesh(wingGeometry, wingMaterial);
  wing.position.y = 0;
  wing.castShadow = true;
  planeGroup.add(wing);

  // Tail section - at the back (now negative Z)
  const tailWingGeometry = new THREE.BoxGeometry(2, 0.1, 0.7);
  const tailWing = new THREE.Mesh(tailWingGeometry, wingMaterial);
  tailWing.position.z = -1.8; // Tail at back (negative Z)
  tailWing.castShadow = true;
  planeGroup.add(tailWing);

  // Vertical stabilizer - at the back with tail
  const verticalStabilizerGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.7);
  const verticalStabilizer = new THREE.Mesh(
    verticalStabilizerGeometry,
    wingMaterial
  );
  verticalStabilizer.position.z = -1.8; // Back with tail
  verticalStabilizer.castShadow = true;
  planeGroup.add(verticalStabilizer);

  // Propeller - at the front (now positive Z)
  const propellerGroup = new THREE.Group();

  // Propeller center
  const propellerCenterGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 8);
  const propellerCenterMaterial = new THREE.MeshPhongMaterial({
    color: 0x111111,
  });
  const propellerCenter = new THREE.Mesh(
    propellerCenterGeometry,
    propellerCenterMaterial
  );
  propellerCenter.rotation.x = -Math.PI / 2; // Align with flipped fuselage
  propellerCenter.position.z = 2.1; // Front (positive Z)
  propellerGroup.add(propellerCenter);

  // Propeller blades - make them more visible
  const bladeGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.1);
  const bladeMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

  const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade1.position.z = 2.1; // Front
  blade1.castShadow = true;
  propellerGroup.add(blade1);

  const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade2.position.z = 2.1; // Front
  blade2.rotation.z = Math.PI / 2;
  blade2.castShadow = true;
  propellerGroup.add(blade2);

  planeGroup.add(propellerGroup);

  // Store propeller reference for animation
  planeGroup.userData.propeller = propellerGroup;

  return planeGroup;
}

// Create and add skybox
const skybox = createSkybox();
scene.add(skybox);

// Create and add city - larger with detailed streets
const city = createCity(100);
scene.add(city);

// Create and add plane - positioned outside city, approaching inward
const plane = createPlane();
// Position the plane at a higher altitude to see more of the city
plane.position.set(0, 100, -180); // Increased height and distance for better view of larger city
// Apply slight nose-down attitude for natural descent
plane.rotation.x = THREE.MathUtils.degToRad(-5); // Less nose-down to see distant city buildings
scene.add(plane);

// Initialize controls
const planeControls = new PlaneControls(plane, camera);

// Set initial camera position directly behind the plane
camera.position.set(0, 105, -195); // Repositioned to match new plane position
camera.lookAt(plane.position);

// Initialize UI
const gameUI = new GameUI(planeControls, gameState);

// Initialize weapon system
const weaponSystem = new WeaponSystem(scene);

// Initialize effects manager
const effectsManager = new EffectsManager(scene);

// Create UFO fleet - more UFOs for the larger city
const ufos = createUFOFleet(scene, 25); // Increased from 15 to 25 for the expanded city
gameState.setTotalUFOs(ufos.length);

// Initialize collision system
const collisionSystem = new CollisionSystem(
  scene,
  gameState,
  effectsManager,
  audioManager
);

// Make sure the UFO counter is set correctly after UI is created
gameUI.updateUFOCount(ufos.length);

// Add pause key listener
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "p") {
    gameState.togglePause();
  }
});

// Add event listener for state changes
gameState.addEventListener("stateChange", (data) => {
  const { oldState, newState } = data;

  // Handle state transitions
  if (newState === GAME_STATES.PLAYING) {
    // Resume game
    if (oldState === GAME_STATES.START) {
      // Starting a new game - play sound
      audioManager.resumeAudioContext();
      audioManager.startMusic();
      audioManager.playButtonSound();
    } else if (oldState === GAME_STATES.PAUSED) {
      // Resuming from pause
      audioManager.playButtonSound();
    }
  } else if (newState === GAME_STATES.PAUSED) {
    // Pause game
    audioManager.playButtonSound();
  } else if (newState === GAME_STATES.VICTORY) {
    // Victory!
    audioManager.playVictorySound();
  } else if (newState === GAME_STATES.DEFEAT) {
    // Defeat
    audioManager.playDefeatSound();
  }
});

// Add event listener for game reset
gameState.addEventListener("gameReset", () => {
  // Reset game state
  resetGame();
});

// Add event listener for volume toggle
document.addEventListener("volumeToggle", (event) => {
  audioManager.setMute(event.detail.muted);
});

// Add event listener for final countdown
document.addEventListener("finalCountdown", (event) => {
  const secondsLeft = event.detail.secondsLeft;

  // Play countdown beep for each second in the final countdown
  if (secondsLeft <= 10 && secondsLeft > 0) {
    audioManager.playCountdownSound();
  }

  // Play alarm at 30, 20, and 10 seconds remaining
  if (secondsLeft === 30 || secondsLeft === 20 || secondsLeft === 10) {
    audioManager.playAlarmSound();
  }
});

// Add event listener for camera shake
document.addEventListener("cameraShake", (event) => {
  const intensity = event.detail.intensity || 1.0;
  const duration = event.detail.duration || 1.0;

  // Create camera shake effect
  effectsManager.createCameraShake(camera, intensity, duration);
});

// Function to reset the game
function resetGame() {
  // Remove all UFOs
  while (ufos.length > 0) {
    const ufo = ufos.pop();
    scene.remove(ufo);
  }

  // Create new UFOs
  const newUfos = createUFOFleet(scene, 25); // Create 25 UFOs (was 15)
  ufos.push(...newUfos);

  // Update game state
  gameState.setTotalUFOs(ufos.length);
  gameUI.updateUFOCount(ufos.length);

  // Reset UI state
  gameUI.reset();

  // Reset plane position
  plane.position.set(0, 100, -180);
  plane.rotation.x = THREE.MathUtils.degToRad(-5);
  plane.visible = true; // Make sure plane is visible again

  // Reset camera
  camera.position.set(0, 105, -195);
  camera.lookAt(plane.position);

  // Reset collision system
  collisionSystem.reset();

  // Start music
  audioManager.stopAll();
  audioManager.startMusic();
}

// Variables for time management
let lastTime = performance.now();

// Animation function
function animate() {
  requestAnimationFrame(animate);

  // Calculate delta time for consistent physics regardless of frame rate
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Limit delta time to avoid physics issues on slow frames
  const limitedDelta = Math.min(deltaTime, 0.1);

  // Update game state
  gameState.updateTime(limitedDelta);

  // Only update game elements when in PLAYING state
  if (gameState.isPlaying()) {
    // Animate propeller - speed based on plane speed
    if (plane.userData.propeller) {
      const propellerSpeed = 0.5 + planeControls.speed / 20;
      plane.userData.propeller.rotation.z += propellerSpeed;
    }

    // Update plane controls
    if (planeControls.cameraMode === "follow") {
      orbitControls.enabled = false;
      planeControls.update(limitedDelta);
    } else {
      orbitControls.enabled = true;
      orbitControls.update();

      // Still update plane position when in orbit mode
      planeControls.updateFlightPhysics(limitedDelta);
      planeControls.updatePlanePosition(limitedDelta);
    }

    // Handle shooting logic
    if (planeControls.inputs.shoot) {
      const bulletPosition = planeControls.getBulletSpawnPosition();
      const bulletDirection = planeControls.getForwardDirection();
      const bullet = weaponSystem.createBullet(bulletPosition, bulletDirection);

      if (bullet) {
        // Play shoot sound
        audioManager.playShootSound();

        // Add muzzle flash
        effectsManager.createMuzzleFlash(bulletPosition, bulletDirection);

        // Add bullet trail
        effectsManager.createBulletTrail(bulletPosition, bulletDirection);
      }
    }

    // Update all bullets
    weaponSystem.update(limitedDelta);

    // Check for collisions between bullets and UFOs
    const hitUFOs = weaponSystem.checkCollisions(ufos);

    // Handle hit UFOs
    for (const ufo of hitUFOs) {
      // Create explosion effect
      effectsManager.createExplosion(ufo.position.clone(), 5, 100, 1.5);

      // Play explosion sound
      audioManager.playExplosionSound();

      // Remove from scene
      scene.remove(ufo);

      // Remove from array
      const index = ufos.indexOf(ufo);
      if (index !== -1) {
        ufos.splice(index, 1);
      }

      // Update game state
      gameState.addUFODestroyed();

      // Update UI with remaining UFOs - ensure this is called with forced visibility
      gameUI.updateUFOCount(ufos.length);

      // Add score update
      gameState.addScore(100);
    }

    // Animate UFOs
    animateUFOs(ufos, limitedDelta);

    // Update effects
    effectsManager.update(limitedDelta);

    // Update engine sound based on speed
    audioManager.playEngineSound(planeControls.speed, CONTROL_PARAMS.MAX_SPEED);

    // Check for collisions
    collisionSystem.update(limitedDelta, plane, planeControls, city, ufos);
  }

  // Update game UI (always update, even when paused)
  gameUI.update();

  // Stats update
  updateStats();

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add FPS stats
const stats = document.createElement("div");
stats.style.position = "absolute";
stats.style.top = "10px";
stats.style.right = "10px";
stats.style.color = "white";
stats.style.backgroundColor = "rgba(0,0,0,0.5)";
stats.style.padding = "10px";
stats.style.borderRadius = "5px";
stats.style.fontFamily = "monospace";
stats.id = "stats";
document.body.appendChild(stats);

// Track FPS
let frameCount = 0;
let fpsLastTime = performance.now();

function updateStats() {
  frameCount++;
  const currentTime = performance.now();
  const elapsedTime = currentTime - fpsLastTime;

  if (elapsedTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / elapsedTime);
    document.getElementById("stats").textContent = `FPS: ${fps}`;
    frameCount = 0;
    fpsLastTime = currentTime;
  }
}

// Start animation loop
animate();
