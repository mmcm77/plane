import * as THREE from "three";

export class CollisionSystem {
  constructor(scene, gameState, effectsManager, audioManager) {
    this.scene = scene;
    this.gameState = gameState;
    this.effectsManager = effectsManager;
    this.audioManager = audioManager;

    // Collision detection helpers
    this.raycaster = new THREE.Raycaster();
    this.planeBox = new THREE.Box3();

    // Track collision state
    this.hasCollided = false;

    // Collision thresholds
    this.GROUND_LEVEL = 0.5; // Minimum altitude before ground collision
    this.MIN_IMPACT_VELOCITY = 10; // Minimum velocity for hard crash
  }

  // Update the plane's bounding box
  updatePlaneBoundingBox(plane) {
    this.planeBox.setFromObject(plane);
  }

  // Check for ground collision
  checkGroundCollision(plane, planeControls) {
    if (this.hasCollided) return false;

    // Get plane's current altitude
    const altitude = plane.position.y;

    // Check if plane is too close to ground
    if (altitude <= this.GROUND_LEVEL) {
      // Calculate impact velocity (vertical component)
      const verticalSpeed = planeControls.getVerticalSpeed();
      const impactSeverity = Math.abs(verticalSpeed);

      // Determine if this is a hard crash or a rough landing
      const isHardCrash = impactSeverity > this.MIN_IMPACT_VELOCITY;

      return {
        type: "ground",
        position: new THREE.Vector3(plane.position.x, 0, plane.position.z),
        severity: isHardCrash ? "high" : "low",
        velocity: verticalSpeed,
      };
    }

    return false;
  }

  // Check for building collisions
  checkBuildingCollisions(plane, city) {
    if (this.hasCollided) return false;

    // Update plane bounding box
    this.updatePlaneBoundingBox(plane);

    // Get all buildings in the city
    const buildings = [];
    city.traverse((child) => {
      if (child.userData && child.userData.type === "building") {
        buildings.push(child);
      }
    });

    // Check intersection with each building
    for (const building of buildings) {
      const buildingBox = new THREE.Box3().setFromObject(building);

      if (this.planeBox.intersectsBox(buildingBox)) {
        return {
          type: "building",
          position: plane.position.clone(),
          object: building,
          severity: "high",
        };
      }
    }

    return false;
  }

  // Check for UFO collisions
  checkUFOCollisions(plane, ufos) {
    if (this.hasCollided) return false;

    // Update plane bounding box
    this.updatePlaneBoundingBox(plane);

    // Check intersection with each UFO
    for (const ufo of ufos) {
      const ufoBox = new THREE.Box3().setFromObject(ufo);

      if (this.planeBox.intersectsBox(ufoBox)) {
        return {
          type: "ufo",
          position: plane.position.clone(),
          object: ufo,
          severity: "high",
        };
      }
    }

    return false;
  }

  // Handle a collision
  handleCollision(collision, plane, planeControls) {
    if (this.hasCollided) return;

    // Mark as collided to prevent multiple collisions
    this.hasCollided = true;

    // Create explosion effect at collision point
    const explosionSize = collision.severity === "high" ? 8 : 4;
    const particleCount = collision.severity === "high" ? 150 : 75;
    const duration = collision.severity === "high" ? 2.0 : 1.5;

    this.effectsManager.createExplosion(
      collision.position,
      explosionSize,
      particleCount,
      duration
    );

    // Play crash sound
    this.audioManager.playCrashSound();

    // Create plane debris
    this.createPlaneDebris(plane, collision);

    // Update game state
    this.gameState.endGame(false, "Plane Crashed");

    // Create camera shake effect
    if (this.gameState.isPlaying()) {
      document.dispatchEvent(
        new CustomEvent("cameraShake", {
          detail: { intensity: collision.severity === "high" ? 2.0 : 1.0 },
        })
      );
    }

    // Hide the original plane
    plane.visible = false;

    return true;
  }

  // Create debris from plane crash
  createPlaneDebris(plane, collision) {
    // Number of debris pieces
    const debrisCount = collision.severity === "high" ? 15 : 8;

    // Create debris group
    const debrisGroup = new THREE.Group();
    this.scene.add(debrisGroup);

    // Materials for debris
    const materials = [
      new THREE.MeshPhongMaterial({ color: 0xff0000 }), // Red (plane color)
      new THREE.MeshPhongMaterial({ color: 0x333333 }), // Dark gray (metal)
      new THREE.MeshPhongMaterial({ color: 0x111111 }), // Black (burnt)
    ];

    // Create debris pieces
    for (let i = 0; i < debrisCount; i++) {
      // Random size for debris
      const size = Math.random() * 0.5 + 0.2;

      // Random geometry type
      let geometry;
      const geoType = Math.floor(Math.random() * 3);

      if (geoType === 0) {
        geometry = new THREE.BoxGeometry(size, size, size);
      } else if (geoType === 1) {
        geometry = new THREE.ConeGeometry(size / 2, size, 6);
      } else {
        geometry = new THREE.TetrahedronGeometry(size / 2);
      }

      // Create mesh with random material
      const material = materials[Math.floor(Math.random() * materials.length)];
      const debris = new THREE.Mesh(geometry, material);

      // Position at collision point with slight randomization
      debris.position.copy(collision.position);
      debris.position.x += (Math.random() - 0.5) * 2;
      debris.position.y += (Math.random() - 0.5) * 2;
      debris.position.z += (Math.random() - 0.5) * 2;

      // Random rotation
      debris.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      // Add physics properties to userData
      debris.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 5 + 5,
        (Math.random() - 0.5) * 10
      );

      debris.userData.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );

      debris.userData.gravity = 9.8;
      debris.userData.lifespan = Math.random() * 2 + 3; // 3-5 seconds
      debris.userData.age = 0;

      // Add to debris group
      debrisGroup.add(debris);
    }

    // Store reference to debris group
    this.debris = debrisGroup;
  }

  // Update debris physics
  updateDebris(deltaTime) {
    if (!this.debris) return;

    let allDebrisGone = true;

    this.debris.children.forEach((debris, index) => {
      // Update age
      debris.userData.age += deltaTime;

      // Apply gravity to velocity
      debris.userData.velocity.y -= debris.userData.gravity * deltaTime;

      // Update position based on velocity
      debris.position.x += debris.userData.velocity.x * deltaTime;
      debris.position.y += debris.userData.velocity.y * deltaTime;
      debris.position.z += debris.userData.velocity.z * deltaTime;

      // Update rotation
      debris.rotation.x += debris.userData.rotationSpeed.x;
      debris.rotation.y += debris.userData.rotationSpeed.y;
      debris.rotation.z += debris.userData.rotationSpeed.z;

      // Check if debris hit the ground
      if (debris.position.y < 0) {
        debris.position.y = 0;
        debris.userData.velocity.y *= -0.3; // Bounce with damping
        debris.userData.velocity.x *= 0.8; // Friction
        debris.userData.velocity.z *= 0.8; // Friction

        // If barely moving, just stop
        if (Math.abs(debris.userData.velocity.y) < 1) {
          debris.userData.velocity.y = 0;
        }
      }

      // Check if debris should be removed based on age
      if (debris.userData.age < debris.userData.lifespan) {
        allDebrisGone = false;
      } else {
        // Fade out debris that's reached its lifespan
        debris.material.opacity = Math.max(
          0,
          1 - (debris.userData.age - debris.userData.lifespan)
        );
        debris.material.transparent = true;

        // Remove completely faded debris
        if (debris.material.opacity <= 0.01) {
          this.debris.remove(debris);
        } else {
          allDebrisGone = false;
        }
      }
    });

    // Remove the entire debris group if all pieces are gone
    if (allDebrisGone && this.debris.children.length === 0) {
      this.scene.remove(this.debris);
      this.debris = null;
    }
  }

  // Reset collision system for a new game
  reset() {
    this.hasCollided = false;

    // Clean up any existing debris
    if (this.debris) {
      this.scene.remove(this.debris);
      this.debris = null;
    }
  }

  // Main update loop
  update(deltaTime, plane, planeControls, city, ufos) {
    // Skip if we've already collided
    if (this.hasCollided) {
      // Just update debris physics
      this.updateDebris(deltaTime);
      return;
    }

    // Check for ground collision
    const groundCollision = this.checkGroundCollision(plane, planeControls);
    if (groundCollision) {
      this.handleCollision(groundCollision, plane, planeControls);
      return;
    }

    // Check for building collisions
    const buildingCollision = this.checkBuildingCollisions(plane, city);
    if (buildingCollision) {
      this.handleCollision(buildingCollision, plane, planeControls);
      return;
    }

    // Check for UFO collisions
    const ufoCollision = this.checkUFOCollisions(plane, ufos);
    if (ufoCollision) {
      this.handleCollision(ufoCollision, plane, planeControls);
      return;
    }

    // Update debris if we have any
    this.updateDebris(deltaTime);
  }
}
