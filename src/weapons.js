import * as THREE from "three";

export class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];
    this.bulletSpeed = 100; // Units per second
    this.bulletLifetime = 2; // Seconds before bullet is removed
    this.cooldown = 0.2; // Seconds between shots
    this.timeSinceLastShot = this.cooldown; // Start ready to fire

    // Create bullet material and geometry (reused for all bullets)
    this.bulletGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    this.bulletMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
    });
  }

  /**
   * Creates a new bullet and adds it to the scene
   * @param {THREE.Vector3} position Starting position
   * @param {THREE.Vector3} direction Normalized direction vector
   */
  createBullet(position, direction) {
    // Check if cooldown has elapsed
    if (this.timeSinceLastShot < this.cooldown) {
      return null;
    }

    // Reset cooldown timer
    this.timeSinceLastShot = 0;

    // Create bullet mesh
    const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);

    // Set position and velocity
    bullet.position.copy(position);
    bullet.userData = {
      velocity: direction.clone().multiplyScalar(this.bulletSpeed),
      timeAlive: 0,
    };

    // Add to scene and bullets array
    this.scene.add(bullet);
    this.bullets.push(bullet);

    return bullet;
  }

  /**
   * Update all active bullets
   * @param {number} deltaTime Time since last frame in seconds
   */
  update(deltaTime) {
    // Update cooldown timer
    this.timeSinceLastShot += deltaTime;

    // Update bullet positions and check for expired bullets
    const bulletsToRemove = [];

    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];

      // Move bullet
      const velocity = bullet.userData.velocity
        .clone()
        .multiplyScalar(deltaTime);
      bullet.position.add(velocity);

      // Update lifetime
      bullet.userData.timeAlive += deltaTime;

      // Check if bullet should be removed
      if (bullet.userData.timeAlive >= this.bulletLifetime) {
        bulletsToRemove.push(i);
      }
    }

    // Remove expired bullets (in reverse order to avoid index issues)
    for (let i = bulletsToRemove.length - 1; i >= 0; i--) {
      const index = bulletsToRemove[i];
      const bullet = this.bullets[index];

      // Remove from scene
      this.scene.remove(bullet);

      // Remove from array
      this.bullets.splice(index, 1);
    }
  }

  /**
   * Check for collisions between bullets and targets
   * @param {Array} targets Array of objects to check for collisions
   * @returns {Array} Array of hit targets
   */
  checkCollisions(targets) {
    const hitTargets = [];
    const bulletsToRemove = [];

    // Create a temporary sphere for collision detection
    const bulletBoundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.2);

    // Check each bullet against each target
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      bulletBoundingSphere.center.copy(bullet.position);

      for (const target of targets) {
        // Calculate distance from bullet to target
        const distanceSquared = bullet.position.distanceToSquared(
          target.position
        );

        // Use a simple distance-based collision check (spherical)
        // Adjust the collision radius based on the target's size
        const targetRadius = 5 * Math.max(target.scale.x, target.scale.z);
        const collisionThreshold = targetRadius * targetRadius;

        if (distanceSquared <= collisionThreshold) {
          // Collision detected
          hitTargets.push(target);
          bulletsToRemove.push(i);
          break; // One bullet can only hit one target
        }
      }
    }

    // Remove bullets that hit targets (in reverse order)
    for (let i = bulletsToRemove.length - 1; i >= 0; i--) {
      const index = bulletsToRemove[i];
      const bullet = this.bullets[index];

      // Remove from scene
      this.scene.remove(bullet);

      // Remove from array
      this.bullets.splice(index, 1);
    }

    return hitTargets;
  }
}
