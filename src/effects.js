import * as THREE from "three";

// Class to manage visual effects
export class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.effects = [];

    // Initialize particle textures
    this.particleTexture = new THREE.TextureLoader().load(
      "https://threejs.org/examples/textures/sprites/spark1.png"
    );
  }

  // Update all active effects
  update(deltaTime) {
    const effectsToRemove = [];

    // Update each effect
    for (let i = 0; i < this.effects.length; i++) {
      const effect = this.effects[i];

      if (effect.update(deltaTime)) {
        // Effect is complete, mark for removal
        effectsToRemove.push(i);
      }
    }

    // Remove completed effects (in reverse order to avoid index issues)
    for (let i = effectsToRemove.length - 1; i >= 0; i--) {
      const index = effectsToRemove[i];
      const effect = this.effects[index];

      // Clean up effect
      effect.destroy();

      // Remove from array
      this.effects.splice(index, 1);
    }
  }

  // Create an explosion effect at the given position
  createExplosion(position, radius = 5, particleCount = 100, duration = 1.5) {
    const explosion = new ExplosionEffect(
      this.scene,
      position,
      radius,
      particleCount,
      duration,
      this.particleTexture
    );

    this.effects.push(explosion);
    return explosion;
  }

  // Create a bullet trail effect
  createBulletTrail(position, direction, length = 5, duration = 0.3) {
    const trail = new BulletTrailEffect(
      this.scene,
      position,
      direction,
      length,
      duration,
      this.particleTexture
    );

    this.effects.push(trail);
    return trail;
  }

  // Create muzzle flash effect
  createMuzzleFlash(position, direction, duration = 0.1) {
    const flash = new MuzzleFlashEffect(
      this.scene,
      position,
      direction,
      duration,
      this.particleTexture
    );

    this.effects.push(flash);
    return flash;
  }

  // Add camera shake effect
  createCameraShake(camera, intensity = 1.0, duration = 1.0) {
    const shakeEffect = new CameraShakeEffect(
      this.scene,
      camera,
      intensity,
      duration
    );

    this.effects.push(shakeEffect);
    return shakeEffect;
  }
}

// Base class for all effects
class Effect {
  constructor(scene, duration) {
    this.scene = scene;
    this.duration = duration;
    this.timeAlive = 0;
    this.isComplete = false;
  }

  // Update effect - returns true when effect is complete
  update(deltaTime) {
    if (this.isComplete) return true;

    this.timeAlive += deltaTime;

    // Check if effect has expired
    if (this.timeAlive >= this.duration) {
      this.isComplete = true;
      return true;
    }

    return false;
  }

  // Clean up effect resources
  destroy() {
    // Override in subclasses
  }
}

// Explosion effect
class ExplosionEffect extends Effect {
  constructor(scene, position, radius, particleCount, duration, texture) {
    super(scene, duration);

    this.position = position.clone();
    this.radius = radius;
    this.particleCount = particleCount;

    // Create particle system
    this.particles = [];
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // Particle material with additive blending for glow effect
    this.particleMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0xff9500,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
    });

    // Create particles with random velocities
    for (let i = 0; i < particleCount; i++) {
      // Create a particle
      const particle = new THREE.Sprite(this.particleMaterial);

      // Initial size between 1 and 3
      const size = 1 + Math.random() * 2;
      particle.scale.set(size, size, 1);

      // Position at center
      particle.position.copy(this.position);

      // Random velocity in sphere
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      velocity.normalize().multiplyScalar(radius * (0.3 + Math.random() * 0.7));

      // Store particle data
      this.particles.push({
        sprite: particle,
        velocity: velocity,
        initialScale: size,
        rotationSpeed: (Math.random() - 0.5) * 2,
      });

      // Add to group
      this.particleGroup.add(particle);
    }

    // Add point light for illumination
    this.light = new THREE.PointLight(0xff7700, 2, radius * 3);
    this.light.position.copy(this.position);
    this.scene.add(this.light);
  }

  update(deltaTime) {
    // Call parent update to track lifetime
    const isComplete = super.update(deltaTime);

    // Update particles
    const progress = this.timeAlive / this.duration;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      // Move particle based on velocity
      particle.sprite.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );

      // Rotate particle
      particle.sprite.material.rotation += particle.rotationSpeed * deltaTime;

      // Fade out based on lifetime
      if (progress > 0.3) {
        const fadeProgress = (progress - 0.3) / 0.7;
        particle.sprite.material.opacity = 1 - fadeProgress;
      }

      // Shrink particle
      const scale = particle.initialScale * (1 - progress * 0.5);
      particle.sprite.scale.set(scale, scale, 1);
    }

    // Update light intensity
    if (this.light) {
      this.light.intensity = 2 * (1 - progress);
    }

    return isComplete;
  }

  destroy() {
    // Remove all particles
    for (let i = 0; i < this.particles.length; i++) {
      this.particleGroup.remove(this.particles[i].sprite);
    }

    // Remove particle group
    this.scene.remove(this.particleGroup);

    // Remove light
    if (this.light) {
      this.scene.remove(this.light);
    }

    // Clear references
    this.particles = null;
    this.particleGroup = null;
    this.light = null;
  }
}

// Bullet trail effect
class BulletTrailEffect extends Effect {
  constructor(scene, position, direction, length, duration, texture) {
    super(scene, duration);

    this.position = position.clone();
    this.direction = direction.clone().normalize();
    this.length = length;

    // Create trail geometry
    const geometry = new THREE.BufferGeometry();

    // Create two points for line
    const startPoint = this.position.clone();
    const endPoint = this.position
      .clone()
      .add(this.direction.clone().multiplyScalar(-length));

    // Add vertices
    const vertices = new Float32Array([
      startPoint.x,
      startPoint.y,
      startPoint.z,
      endPoint.x,
      endPoint.y,
      endPoint.z,
    ]);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    // Material with glow effect
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    // Create line
    this.line = new THREE.Line(geometry, material);
    this.scene.add(this.line);
  }

  update(deltaTime) {
    // Call parent update to track lifetime
    const isComplete = super.update(deltaTime);

    // Fade out based on lifetime
    const progress = this.timeAlive / this.duration;
    this.line.material.opacity = 0.7 * (1 - progress);

    return isComplete;
  }

  destroy() {
    // Remove line
    this.scene.remove(this.line);

    // Dispose geometry and material
    this.line.geometry.dispose();
    this.line.material.dispose();

    // Clear references
    this.line = null;
  }
}

// Muzzle flash effect
class MuzzleFlashEffect extends Effect {
  constructor(scene, position, direction, duration, texture) {
    super(scene, duration);

    this.position = position.clone();
    this.direction = direction.clone().normalize();

    // Create a point light for the flash
    this.light = new THREE.PointLight(0xff3300, 3, 5);
    this.light.position.copy(this.position);
    this.scene.add(this.light);

    // Create a sprite for the flash
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xff5500,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 1,
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.position.copy(this.position);
    this.sprite.position.add(this.direction.clone().multiplyScalar(0.5));
    this.sprite.scale.set(2, 2, 1);

    // Rotate sprite to face direction
    const upVector = new THREE.Vector3(0, 1, 0);
    const rightVector = new THREE.Vector3()
      .crossVectors(this.direction, upVector)
      .normalize();

    this.scene.add(this.sprite);
  }

  update(deltaTime) {
    // Call parent update to track lifetime
    const isComplete = super.update(deltaTime);

    // Fade out based on lifetime
    const progress = this.timeAlive / this.duration;

    // Quickly reach full brightness then fade
    let opacity;
    let scale;

    if (progress < 0.2) {
      // Quickly reach full brightness
      opacity = progress / 0.2;
      scale = 1 + progress * 2;
    } else {
      // Fade out
      opacity = 1 - (progress - 0.2) / 0.8;
      scale = 3 - (progress - 0.2) / 0.8;
    }

    // Update sprite
    this.sprite.material.opacity = opacity;
    this.sprite.scale.set(scale, scale, 1);

    // Update light
    this.light.intensity = 3 * opacity;

    return isComplete;
  }

  destroy() {
    // Remove sprite and light
    this.scene.remove(this.sprite);
    this.scene.remove(this.light);

    // Dispose material
    this.sprite.material.dispose();

    // Clear references
    this.sprite = null;
    this.light = null;
  }
}

// Camera shake effect
class CameraShakeEffect extends Effect {
  constructor(scene, camera, intensity, duration) {
    super(scene, duration);

    this.camera = camera;
    this.intensity = intensity;

    // Store original camera position
    this.originalPosition = camera.position.clone();

    // Track last applied offset for smooth transitions
    this.lastOffset = new THREE.Vector3();
  }

  update(deltaTime) {
    // Call parent update to track lifetime
    const isComplete = super.update(deltaTime);

    if (!isComplete) {
      // Calculate remaining percentage of shake
      const remainingPercent = 1 - this.timeAlive / this.duration;

      // Apply decreasing intensity over time with some easing
      const currentIntensity =
        this.intensity * remainingPercent * remainingPercent;

      // Generate new random offset
      const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetZ = (Math.random() - 0.5) * 2 * currentIntensity;

      // Smooth transition between shake positions
      this.lastOffset.lerp(new THREE.Vector3(offsetX, offsetY, offsetZ), 0.6);

      // Apply offset to camera
      this.camera.position.copy(this.originalPosition).add(this.lastOffset);
    } else {
      // Reset camera position when done
      this.camera.position.copy(this.originalPosition);
    }

    return isComplete;
  }

  destroy() {
    // Reset camera position
    this.camera.position.copy(this.originalPosition);
  }
}
