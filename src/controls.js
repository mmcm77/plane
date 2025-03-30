import * as THREE from "three";

// Flight control parameters
export const CONTROL_PARAMS = {
  PITCH_SENSITIVITY: 1.0,
  ROLL_SENSITIVITY: 3.0,
  TURN_SENSITIVITY: 2.5,
  YAW_COUPLING: 0.8,

  MAX_PITCH: THREE.MathUtils.degToRad(75),
  MAX_ROLL: THREE.MathUtils.degToRad(75),

  MIN_SPEED: 10,
  MAX_SPEED: 50,
  DEFAULT_SPEED: 30,
  SPEED_INCREMENT: 5,

  AUTO_LEVEL_RATE: 0.002,
  AUTO_LEVEL_DELAY: 5.0,
  INPUT_SMOOTHING: 0.2,
  CAMERA_SMOOTHING: 0.05,

  TURN_RATE_FACTOR: 1.2,
  GRAVITY_FACTOR: 0.5,
  CLIMB_FACTOR: 0.8,
  DRAG_FACTOR: 0.05,
};

// Main controls class
export class PlaneControls {
  constructor(plane, camera) {
    this.plane = plane;
    this.camera = camera;

    // Movement state
    this.speed = CONTROL_PARAMS.DEFAULT_SPEED;
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ"); // YXZ order for aircraft-like movement
    this.quaternion = new THREE.Quaternion();

    // Flight dynamics state
    this.velocity = new THREE.Vector3(0, 0, this.speed); // Current velocity vector
    this.heading = 0; // Current heading in radians
    this.altitude = plane.position.y; // Current altitude
    this.verticalSpeed = 0; // Current vertical speed
    this.timeSinceInput = 0; // Time tracker for auto-leveling

    // Control inputs
    this.inputs = {
      pitch: 0, // W/S: Forward/back (-1 to 1)
      roll: 0, // A/D: Left/right (-1 to 1)
      throttle: 0, // Q/E: Speed control
      cameraToggle: false, // C: Toggle camera
      shoot: false, // Space: Shoot
    };

    // Previous inputs for detecting changes
    this.prevInputs = {
      pitch: 0,
      roll: 0,
    };

    // Actual flight control values (after smoothing)
    this.controlValues = {
      pitch: 0,
      roll: 0,
      yaw: 0,
    };

    // Camera settings
    this.cameraMode = "follow"; // "follow" or "orbit"
    this.cameraOffset = new THREE.Vector3(0, 3, 15); // Increased distance for better view
    this.cameraTarget = new THREE.Vector3();
    this.cameraLookAt = new THREE.Vector3();

    this.initEventListeners();
  }

  initEventListeners() {
    // Keyboard event listeners
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.handleKeyUp(event));
  }

  handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
      case "w":
        this.inputs.pitch = 1;
        this.timeSinceInput = 0; // Reset auto-level timer
        break;
      case "s":
        this.inputs.pitch = -1;
        this.timeSinceInput = 0; // Reset auto-level timer
        break;
      case "a":
        this.inputs.roll = 1;
        this.timeSinceInput = 0; // Reset auto-level timer
        break;
      case "d":
        this.inputs.roll = -1;
        this.timeSinceInput = 0; // Reset auto-level timer
        break;
      case "q":
        if (this.speed > CONTROL_PARAMS.MIN_SPEED) {
          this.speed -= CONTROL_PARAMS.SPEED_INCREMENT;
        }
        break;
      case "e":
        if (this.speed < CONTROL_PARAMS.MAX_SPEED) {
          this.speed += CONTROL_PARAMS.SPEED_INCREMENT;
        }
        break;
      case "c":
        if (!this.inputs.cameraToggle) {
          this.cameraMode = this.cameraMode === "follow" ? "orbit" : "follow";
          this.inputs.cameraToggle = true;
        }
        break;
      case " ": // Space bar for shooting
        this.inputs.shoot = true;
        break;
      case "l": // Quick level flight
        // This provides a way for the player to quickly return to level flight
        this.levelFlight();
        break;
    }
  }

  handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
      case "w":
      case "s":
        this.inputs.pitch = 0;
        break;
      case "a":
      case "d":
        this.inputs.roll = 0;
        break;
      case "c":
        this.inputs.cameraToggle = false;
        break;
      case " ": // Space bar
        this.inputs.shoot = false;
        break;
    }
  }

  update(deltaTime) {
    this.updateFlightPhysics(deltaTime);
    this.updatePlanePosition(deltaTime);

    if (this.cameraMode === "follow") {
      this.updateFollowCamera(deltaTime);
    }

    // Store current inputs for next frame
    this.prevInputs.pitch = this.inputs.pitch;
    this.prevInputs.roll = this.inputs.roll;
  }

  updateFlightPhysics(deltaTime) {
    // Track time since last input for auto-leveling
    if (Math.abs(this.inputs.roll) < 0.1 && Math.abs(this.inputs.pitch) < 0.1) {
      this.timeSinceInput += deltaTime;
    } else {
      this.timeSinceInput = 0;
    }

    // Smooth control inputs for more natural movement
    // Use reduced smoothing factor for pitch to make it more stable and maintain trajectory
    this.controlValues.pitch +=
      (this.inputs.pitch * CONTROL_PARAMS.PITCH_SENSITIVITY -
        this.controlValues.pitch) *
      CONTROL_PARAMS.INPUT_SMOOTHING *
      0.25; // Reduced further from 0.5 to 0.25

    this.controlValues.roll +=
      (this.inputs.roll * CONTROL_PARAMS.ROLL_SENSITIVITY -
        this.controlValues.roll) *
      CONTROL_PARAMS.INPUT_SMOOTHING;

    // Calculate bank-proportional turn rate (realistic aircraft turning)
    // Banking causes turning in the direction of the bank
    const bankAngle = this.controlValues.roll;
    const turnRate = bankAngle * CONTROL_PARAMS.TURN_RATE_FACTOR * deltaTime;

    // Apply the turn to the yaw based on bank angle
    // More bank = faster turn rate
    this.controlValues.yaw = turnRate;

    // Apply banking-induced yaw (realistic coordinated turns)
    const yawAmount =
      this.controlValues.roll * CONTROL_PARAMS.YAW_COUPLING * deltaTime;
    this.rotation.y += yawAmount;

    // Only apply auto-leveling after delay time has passed and only to roll
    // We no longer auto-level pitch to maintain trajectory
    if (this.timeSinceInput > CONTROL_PARAMS.AUTO_LEVEL_DELAY) {
      // Calculate auto-level rate based on control values
      const levelRate = CONTROL_PARAMS.AUTO_LEVEL_RATE;

      // Apply auto-leveling when no roll input and after delay
      // Only apply to roll axis, completely removed for pitch
      if (Math.abs(this.inputs.roll) < 0.1) {
        this.controlValues.roll *= 1 - levelRate;
      }

      // No auto-leveling for pitch - this ensures pitch trajectory
      // is maintained indefinitely until actively changed by the player
    }

    // Limit pitch and roll to maximum values
    this.controlValues.pitch = THREE.MathUtils.clamp(
      this.controlValues.pitch,
      -CONTROL_PARAMS.MAX_PITCH,
      CONTROL_PARAMS.MAX_PITCH
    );

    this.controlValues.roll = THREE.MathUtils.clamp(
      this.controlValues.roll,
      -CONTROL_PARAMS.MAX_ROLL,
      CONTROL_PARAMS.MAX_ROLL
    );

    // Calculate vertical speed based on pitch angle
    // Positive pitch should cause ascent, negative causes descent
    this.verticalSpeed =
      this.controlValues.pitch * CONTROL_PARAMS.CLIMB_FACTOR * this.speed;

    // Update plane rotation using quaternions
    this.rotation.x = this.controlValues.pitch;
    // Flip the sign of roll to match visual feedback to controls
    this.rotation.z = -this.controlValues.roll;

    // Apply the rotation to the plane
    this.quaternion.setFromEuler(this.rotation);
    this.plane.quaternion.copy(this.quaternion);

    // Update heading based on bank angle (more realistic turning)
    this.heading += turnRate;
  }

  updatePlanePosition(deltaTime) {
    // Calculate forward movement vector based on plane's orientation and heading
    const forwardVector = new THREE.Vector3(0, 0, 1);
    forwardVector.applyQuaternion(this.plane.quaternion);

    // Apply speed with drag factor (more drag during maneuvers)
    const currentSpeed =
      this.speed *
      (1 - Math.abs(this.controlValues.roll) * CONTROL_PARAMS.DRAG_FACTOR);

    // Calculate movement vector
    const movement = forwardVector
      .clone()
      .multiplyScalar(currentSpeed * deltaTime);

    // Apply vertical movement based on pitch
    const verticalMovement = this.verticalSpeed * deltaTime;

    // Update position
    this.plane.position.add(movement);
    this.plane.position.y += verticalMovement;

    // Update altitude
    this.altitude = this.plane.position.y;

    // Ensure minimum altitude (prevent crashing into ground)
    const minAltitude = 5;
    if (this.plane.position.y < minAltitude) {
      this.plane.position.y = minAltitude;
      this.verticalSpeed = Math.max(0, this.verticalSpeed);
    }
  }

  updateFollowCamera(deltaTime) {
    // Get the plane's backward direction vector (opposite of forward)
    const backwardVector = new THREE.Vector3(0, 0, -1);
    backwardVector.applyQuaternion(this.plane.quaternion);

    // Get the plane's up vector
    const upVector = new THREE.Vector3(0, 1, 0);
    upVector.applyQuaternion(this.plane.quaternion);

    // Create a camera position that's directly behind and higher above the plane
    const cameraPosition = this.plane.position.clone();

    // Move camera backwards
    backwardVector.multiplyScalar(this.cameraOffset.z);
    cameraPosition.add(backwardVector);

    // Move camera upwards
    upVector.multiplyScalar(this.cameraOffset.y);
    cameraPosition.add(upVector);

    // Smoothly move the camera to this position
    this.camera.position.lerp(cameraPosition, CONTROL_PARAMS.CAMERA_SMOOTHING);

    // Look ahead of the plane for better visibility
    const lookAheadVector = new THREE.Vector3(0, 0, 30); // Increased look ahead distance
    lookAheadVector.applyQuaternion(this.plane.quaternion);

    const lookAtPosition = this.plane.position.clone().add(lookAheadVector);
    this.camera.lookAt(lookAtPosition);
  }

  // Get the plane's forward direction for shooting
  getForwardDirection() {
    const forwardVector = new THREE.Vector3(0, 0, 1);
    forwardVector.applyQuaternion(this.plane.quaternion);
    return forwardVector.normalize();
  }

  // Get the bullet spawn position (front of the plane)
  getBulletSpawnPosition() {
    const forwardOffset = new THREE.Vector3(0, 0, 2.5); // Position in front of propeller
    forwardOffset.applyQuaternion(this.plane.quaternion);
    return this.plane.position.clone().add(forwardOffset);
  }

  // Get normalized speed value (0 to 1) for UI
  getNormalizedSpeed() {
    return (
      (this.speed - CONTROL_PARAMS.MIN_SPEED) /
      (CONTROL_PARAMS.MAX_SPEED - CONTROL_PARAMS.MIN_SPEED)
    );
  }

  // Get current bank angle in degrees (for UI)
  getBankAngleDegrees() {
    // Return the negative of the roll value to match the visual representation
    return -THREE.MathUtils.radToDeg(this.controlValues.roll);
  }

  // Get pitch angle in degrees (for UI)
  getPitchAngleDegrees() {
    return THREE.MathUtils.radToDeg(this.controlValues.pitch);
  }

  // Get heading in degrees (for UI)
  getHeadingDegrees() {
    // Convert heading to degrees and normalize to 0-360
    let heading = THREE.MathUtils.radToDeg(this.heading) % 360;
    if (heading < 0) heading += 360;
    return Math.round(heading);
  }

  // Get vertical speed for UI (positive = climbing, negative = diving)
  getVerticalSpeed() {
    return this.verticalSpeed;
  }

  // Helper function to quickly return to level flight
  levelFlight() {
    // Gradually return to level flight
    this.controlValues.pitch *= 0.3; // Reduce pitch by 70%
    this.controlValues.roll *= 0.3; // Reduce roll by 70%

    // Trigger UI indicator if it exists
    const event = new CustomEvent("levelFlightActivated");
    document.dispatchEvent(event);
  }
}
