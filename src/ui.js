// User Interface class for the plane game
export class GameUI {
  constructor(planeControls, gameState) {
    this.planeControls = planeControls;
    this.gameState = gameState; // Add reference to game state
    this.container = null;
    this.speedIndicator = null;
    this.speedBar = null;
    this.ufoCounter = null;
    this.ufoCount = 0;
    this.timeDisplay = null;
    this.scoreDisplay = null;
    this.inGameUI = null;
    this.previousSecond = null; // Track previous second for countdown

    this.createUI();

    // Level flight indicator animation timing
    this.levelFlightIndicatorTimer = 0;
    this.levelFlightIndicatorVisible = false;

    // Listen for level flight events
    document.addEventListener("levelFlightActivated", () => {
      this.showLevelFlightIndicator();
    });

    // Listen for time updates from the game state
    if (this.gameState) {
      this.gameState.addEventListener("timeUpdate", (data) => {
        if (this.timeDisplay) {
          this.timeDisplay.textContent = this.formatTime(data.timeRemaining);
        }
      });
    }
  }

  createUI() {
    // Create main UI container
    this.container = document.createElement("div");
    this.container.style.position = "absolute";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.pointerEvents = "none"; // Don't block mouse interaction
    document.body.appendChild(this.container);

    // Create a container for in-game UI elements (will be hidden when not playing)
    this.inGameUI = document.createElement("div");
    this.container.appendChild(this.inGameUI);

    // Create speed indicator
    this.createSpeedIndicator();

    // Create flight instruments (compass and artificial horizon)
    this.createFlightInstruments();

    // Create UFO counter
    this.createUFOCounter();

    // Initialize UFO counter if game state exists
    if (this.gameState) {
      this.updateUFOCount(this.gameState.totalUFOs);
    }

    // Create mission timer
    this.createMissionTimer();

    // Create score display
    this.createScoreDisplay();

    // Create control reference
    this.createControlReference();

    // Add volume control button
    this.createVolumeControl();

    // Create controls info
    this.createControlsInfo();

    // Create start screen
    this.createStartScreen();

    // Create end game screen
    this.createEndGameScreen();

    // Create pause screen
    this.createPauseScreen();

    // Create level flight indicator
    this.createLevelFlightIndicator();
  }

  createSpeedIndicator() {
    const speedContainer = document.createElement("div");
    speedContainer.style.position = "absolute";
    speedContainer.style.top = "20px";
    speedContainer.style.left = "20px";
    speedContainer.style.color = "white";
    speedContainer.style.fontFamily = "Arial, sans-serif";
    speedContainer.style.fontWeight = "bold";

    // Speed indicator title
    const speedTitle = document.createElement("div");
    speedTitle.textContent = "AIRSPEED";
    speedTitle.style.fontSize = "14px";
    speedTitle.style.marginBottom = "5px";
    speedContainer.appendChild(speedTitle);

    // Speed bar background
    const speedBarBg = document.createElement("div");
    speedBarBg.style.width = "150px";
    speedBarBg.style.height = "12px";
    speedBarBg.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    speedBarBg.style.borderRadius = "6px";
    speedBarBg.style.overflow = "hidden";
    speedContainer.appendChild(speedBarBg);

    // Speed bar fill
    this.speedBar = document.createElement("div");
    this.speedBar.style.height = "100%";
    this.speedBar.style.backgroundColor = "#4CAF50"; // Green by default
    this.speedBar.style.width = "60%"; // Default starting speed
    this.speedBar.style.transition = "width 0.2s, background-color 0.2s";
    speedBarBg.appendChild(this.speedBar);

    // Speed value indicator
    this.speedIndicator = document.createElement("div");
    this.speedIndicator.textContent = this.planeControls.speed.toFixed(0);
    this.speedIndicator.style.fontSize = "16px";
    this.speedIndicator.style.marginTop = "5px";
    speedContainer.appendChild(this.speedIndicator);

    this.container.appendChild(speedContainer);
  }

  createFlightInstruments() {
    const instrumentsContainer = document.createElement("div");
    instrumentsContainer.style.position = "fixed";
    instrumentsContainer.style.bottom = "20px";
    instrumentsContainer.style.right = "20px";
    instrumentsContainer.style.display = "flex";
    instrumentsContainer.style.flexDirection = "column";
    instrumentsContainer.style.gap = "10px";
    instrumentsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    instrumentsContainer.style.padding = "15px";
    instrumentsContainer.style.borderRadius = "10px";
    instrumentsContainer.style.border = "2px solid #555";
    instrumentsContainer.style.zIndex = "9998";
    instrumentsContainer.style.color = "white";
    instrumentsContainer.style.fontFamily = "Arial, sans-serif";

    // Heading indicator (compass)
    const headingContainer = document.createElement("div");
    headingContainer.style.display = "flex";
    headingContainer.style.flexDirection = "column";
    headingContainer.style.alignItems = "center";

    const headingLabel = document.createElement("div");
    headingLabel.textContent = "HEADING";
    headingLabel.style.fontSize = "12px";
    headingLabel.style.marginBottom = "5px";
    headingContainer.appendChild(headingLabel);

    const headingValue = document.createElement("div");
    headingValue.style.fontSize = "24px";
    headingValue.style.fontWeight = "bold";
    headingValue.style.fontFamily = "'Courier New', monospace";
    headingValue.textContent = "000°";
    headingContainer.appendChild(headingValue);

    // Bank angle indicator
    const bankContainer = document.createElement("div");
    bankContainer.style.display = "flex";
    bankContainer.style.flexDirection = "column";
    bankContainer.style.alignItems = "center";
    bankContainer.style.marginTop = "10px";

    const bankLabel = document.createElement("div");
    bankLabel.textContent = "BANK ANGLE";
    bankLabel.style.fontSize = "12px";
    bankLabel.style.marginBottom = "5px";
    bankContainer.appendChild(bankLabel);

    const bankValue = document.createElement("div");
    bankValue.style.fontSize = "24px";
    bankValue.style.fontWeight = "bold";
    bankValue.style.fontFamily = "'Courier New', monospace";
    bankValue.textContent = "0°";
    bankContainer.appendChild(bankValue);

    // Pitch angle indicator
    const pitchContainer = document.createElement("div");
    pitchContainer.style.display = "flex";
    pitchContainer.style.flexDirection = "column";
    pitchContainer.style.alignItems = "center";
    pitchContainer.style.marginTop = "10px";

    const pitchLabel = document.createElement("div");
    pitchLabel.textContent = "PITCH ANGLE";
    pitchLabel.style.fontSize = "12px";
    pitchLabel.style.marginBottom = "5px";
    pitchContainer.appendChild(pitchLabel);

    const pitchValue = document.createElement("div");
    pitchValue.style.fontSize = "24px";
    pitchValue.style.fontWeight = "bold";
    pitchValue.style.fontFamily = "'Courier New', monospace";
    pitchValue.textContent = "0°";
    pitchContainer.appendChild(pitchValue);

    // Altitude indicator
    const altContainer = document.createElement("div");
    altContainer.style.display = "flex";
    altContainer.style.flexDirection = "column";
    altContainer.style.alignItems = "center";
    altContainer.style.marginTop = "10px";

    const altLabel = document.createElement("div");
    altLabel.textContent = "ALTITUDE";
    altLabel.style.fontSize = "12px";
    altLabel.style.marginBottom = "5px";
    altContainer.appendChild(altLabel);

    const altValue = document.createElement("div");
    altValue.style.fontSize = "24px";
    altValue.style.fontWeight = "bold";
    altValue.style.fontFamily = "'Courier New', monospace";
    altValue.textContent = "0 M";
    altContainer.appendChild(altValue);

    // Add elements to container
    instrumentsContainer.appendChild(headingContainer);
    instrumentsContainer.appendChild(bankContainer);
    instrumentsContainer.appendChild(pitchContainer);
    instrumentsContainer.appendChild(altContainer);

    // Store references for updates
    this.headingValue = headingValue;
    this.bankValue = bankValue;
    this.pitchValue = pitchValue;
    this.altValue = altValue;

    // Add to body to ensure visibility
    document.body.appendChild(instrumentsContainer);
  }

  createUFOCounter() {
    const ufoContainer = document.createElement("div");
    ufoContainer.style.position = "fixed"; // Use fixed instead of absolute
    ufoContainer.style.top = "20px";
    ufoContainer.style.left = "20px"; // Move to top left corner
    ufoContainer.style.color = "white";
    ufoContainer.style.fontFamily = "Arial, sans-serif";
    ufoContainer.style.fontWeight = "bold";
    ufoContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)"; // Darker background
    ufoContainer.style.padding = "15px"; // Larger padding
    ufoContainer.style.borderRadius = "8px";
    ufoContainer.style.width = "auto"; // Auto width to fit content
    ufoContainer.style.minWidth = "150px"; // Minimum width
    ufoContainer.style.zIndex = "9999"; // Very high z-index to ensure it's on top
    ufoContainer.style.border = "2px solid #FF5555"; // Add border for visibility

    // UFO counter title
    const ufoTitle = document.createElement("div");
    ufoTitle.textContent = "UFOs REMAINING";
    ufoTitle.style.fontSize = "16px";
    ufoTitle.style.marginBottom = "10px";
    ufoTitle.style.textAlign = "center";
    ufoContainer.appendChild(ufoTitle);

    // UFO counter value
    this.ufoCounter = document.createElement("div");
    this.ufoCounter.textContent = "0";
    this.ufoCounter.style.fontSize = "32px"; // Larger font
    this.ufoCounter.style.textAlign = "center";
    this.ufoCounter.style.color = "#FF5555"; // Reddish color
    this.ufoCounter.style.textShadow = "0 0 10px rgba(255, 0, 0, 0.7)"; // Stronger glow
    this.ufoCounter.style.fontWeight = "bold";
    ufoContainer.appendChild(this.ufoCounter);

    // Add directly to body to ensure it's always visible
    document.body.appendChild(ufoContainer);
  }

  createMissionTimer() {
    const timerContainer = document.createElement("div");
    timerContainer.style.position = "fixed"; // Use fixed positioning like UFO counter
    timerContainer.style.top = "20px";
    timerContainer.style.right = "20px"; // Position in top right
    timerContainer.style.color = "white";
    timerContainer.style.fontFamily = "Arial, sans-serif";
    timerContainer.style.fontWeight = "bold";
    timerContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)"; // Darker background
    timerContainer.style.padding = "15px"; // Larger padding
    timerContainer.style.borderRadius = "8px";
    timerContainer.style.zIndex = "9999"; // Ensure it's on top
    timerContainer.style.minWidth = "150px"; // Minimum width
    timerContainer.style.border = "2px solid #4CAF50"; // Green border initially
    timerContainer.style.transition = "border-color 1s, transform 0.3s"; // Smooth transition for color changes

    // Timer title
    const timerTitle = document.createElement("div");
    timerTitle.textContent = "MISSION TIME";
    timerTitle.style.fontSize = "16px";
    timerTitle.style.marginBottom = "10px";
    timerTitle.style.textAlign = "center";
    timerContainer.appendChild(timerTitle);

    // Timer value
    this.timeDisplay = document.createElement("div");
    this.timeDisplay.className = "mission-timer-value"; // Add class for reference
    this.timeDisplay.textContent = this.formatTime(
      this.gameState ? this.gameState.timeRemaining : 450
    ); // Default 450 seconds (7.5 minutes)
    this.timeDisplay.style.fontSize = "32px"; // Larger font
    this.timeDisplay.style.textAlign = "center";
    this.timeDisplay.style.fontFamily = "'Courier New', monospace";
    this.timeDisplay.style.fontWeight = "bold";
    this.timeDisplay.style.textShadow = "0 0 5px rgba(255, 255, 255, 0.5)"; // Add glow effect
    timerContainer.appendChild(this.timeDisplay);

    // Store reference to container for color updates
    this.timerContainer = timerContainer;

    // Add directly to body to ensure it's always visible
    document.body.appendChild(timerContainer);
  }

  createScoreDisplay() {
    const scoreContainer = document.createElement("div");
    scoreContainer.style.position = "absolute";
    scoreContainer.style.top = "20px";
    scoreContainer.style.right = "20px";
    scoreContainer.style.color = "white";
    scoreContainer.style.fontFamily = "Arial, sans-serif";
    scoreContainer.style.fontWeight = "bold";
    scoreContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    scoreContainer.style.padding = "10px";
    scoreContainer.style.borderRadius = "5px";
    scoreContainer.style.textAlign = "center";

    // Score title
    const scoreTitle = document.createElement("div");
    scoreTitle.textContent = "SCORE";
    scoreTitle.style.fontSize = "14px";
    scoreTitle.style.marginBottom = "5px";
    scoreContainer.appendChild(scoreTitle);

    // Score value
    this.scoreDisplay = document.createElement("div");
    this.scoreDisplay.textContent = "0";
    this.scoreDisplay.style.fontSize = "24px";
    scoreContainer.appendChild(this.scoreDisplay);

    this.inGameUI.appendChild(scoreContainer);
  }

  createVolumeControl() {
    const volumeButton = document.createElement("div");
    volumeButton.style.position = "absolute";
    volumeButton.style.top = "20px";
    volumeButton.style.right = "220px";
    volumeButton.style.width = "40px";
    volumeButton.style.height = "40px";
    volumeButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    volumeButton.style.borderRadius = "50%";
    volumeButton.style.display = "flex";
    volumeButton.style.justifyContent = "center";
    volumeButton.style.alignItems = "center";
    volumeButton.style.cursor = "pointer";
    volumeButton.style.pointerEvents = "auto";

    // Volume icon (simple text for now)
    this.volumeIcon = document.createElement("div");
    this.volumeIcon.textContent = "🔊";
    this.volumeIcon.style.fontSize = "20px";
    this.volumeIcon.style.color = "white";
    volumeButton.appendChild(this.volumeIcon);

    // Store muted state
    this.muted = false;

    // Add click handler
    volumeButton.addEventListener("click", () => {
      this.muted = !this.muted;
      this.volumeIcon.textContent = this.muted ? "🔇" : "🔊";

      // Emit an event that can be caught by the audio system
      const event = new CustomEvent("volumeToggle", {
        detail: { muted: this.muted },
      });
      document.dispatchEvent(event);
    });

    this.container.appendChild(volumeButton);
  }

  createControlReference() {
    const controlsContainer = document.createElement("div");
    controlsContainer.style.position = "absolute";
    controlsContainer.style.bottom = "20px";
    controlsContainer.style.left = "20px";
    controlsContainer.style.color = "white";
    controlsContainer.style.fontFamily = "Arial, sans-serif";
    controlsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    controlsContainer.style.padding = "10px";
    controlsContainer.style.borderRadius = "5px";

    // Title
    const title = document.createElement("div");
    title.textContent = "CONTROLS";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    controlsContainer.appendChild(title);

    // Controls list - Updated for enhanced flight model
    const controlsList = [
      { key: "W / S", action: "Pitch up / down (climb/dive)" },
      { key: "A / D", action: "Roll left / right (bank to turn)" },
      { key: "Q / E", action: "Decrease / increase speed" },
      { key: "C", action: "Toggle camera mode" },
      { key: "SPACE", action: "Fire weapons" },
    ];

    // Flight behavior note
    const flightBehaviorNote = document.createElement("div");
    flightBehaviorNote.style.fontSize = "11px";
    flightBehaviorNote.style.color = "#aaffaa";
    flightBehaviorNote.style.marginTop = "10px";
    flightBehaviorNote.style.padding = "5px";
    flightBehaviorNote.style.borderTop = "1px solid #555";
    flightBehaviorNote.textContent = "✓ Bank angle determines turn rate";
    controlsContainer.appendChild(flightBehaviorNote);

    const autoLevelNote = document.createElement("div");
    autoLevelNote.style.fontSize = "11px";
    autoLevelNote.style.color = "#aaaaff";
    autoLevelNote.style.marginTop = "5px";
    autoLevelNote.textContent = "✓ Aircraft maintains heading until banked";
    controlsContainer.appendChild(autoLevelNote);

    const pitchNote = document.createElement("div");
    pitchNote.style.fontSize = "11px";
    pitchNote.style.color = "#ffaaaa";
    pitchNote.style.marginTop = "5px";
    pitchNote.textContent = "✓ Pitch trajectory is maintained until changed";
    controlsContainer.appendChild(pitchNote);

    controlsList.forEach((control) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.marginBottom = "5px";

      const keyElement = document.createElement("div");
      keyElement.textContent = control.key;
      keyElement.style.fontWeight = "bold";
      keyElement.style.width = "70px";
      row.appendChild(keyElement);

      const actionElement = document.createElement("div");
      actionElement.textContent = control.action;
      row.appendChild(actionElement);

      controlsContainer.appendChild(row);
    });

    this.container.appendChild(controlsContainer);
  }

  createControlsInfo() {
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "controls-info";
    controlsContainer.style.position = "absolute";
    controlsContainer.style.bottom = "10px";
    controlsContainer.style.left = "10px";
    controlsContainer.style.color = "white";
    controlsContainer.style.fontFamily = "Arial, sans-serif";
    controlsContainer.style.fontSize = "14px";
    controlsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    controlsContainer.style.padding = "10px";
    controlsContainer.style.borderRadius = "5px";

    const controlsList = [
      { key: "W / S", action: "Pitch up / down" },
      { key: "A / D", action: "Roll right / left" },
      { key: "Q / E", action: "Decrease / Increase speed" },
      { key: "C", action: "Toggle camera" },
      { key: "SPACE", action: "Shoot" },
      { key: "L", action: "Level flight" },
    ];

    const title = document.createElement("div");
    title.textContent = "CONTROLS";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "5px";
    controlsContainer.appendChild(title);

    controlsList.forEach((control) => {
      const controlItem = document.createElement("div");
      controlItem.style.marginBottom = "3px";
      controlItem.textContent = `${control.key}: ${control.action}`;
      controlsContainer.appendChild(controlItem);
    });

    document.body.appendChild(controlsContainer);
  }

  createStartScreen() {
    // Implementation of createStartScreen method
  }

  createEndGameScreen() {
    // Implementation of createEndGameScreen method
  }

  createPauseScreen() {
    // Implementation of createPauseScreen method
  }

  createLevelFlightIndicator() {
    this.levelFlightIndicator = document.createElement("div");
    this.levelFlightIndicator.className = "level-flight-indicator";
    this.levelFlightIndicator.style.position = "absolute";
    this.levelFlightIndicator.style.top = "50%";
    this.levelFlightIndicator.style.left = "50%";
    this.levelFlightIndicator.style.transform = "translate(-50%, -50%)";
    this.levelFlightIndicator.style.color = "white";
    this.levelFlightIndicator.style.fontFamily = "Arial, sans-serif";
    this.levelFlightIndicator.style.fontSize = "20px";
    this.levelFlightIndicator.style.fontWeight = "bold";
    this.levelFlightIndicator.style.backgroundColor = "rgba(0, 128, 0, 0.6)";
    this.levelFlightIndicator.style.padding = "10px 20px";
    this.levelFlightIndicator.style.borderRadius = "5px";
    this.levelFlightIndicator.style.opacity = "0";
    this.levelFlightIndicator.style.transition = "opacity 0.5s ease-in-out";
    this.levelFlightIndicator.textContent = "LEVEL FLIGHT";

    this.container.appendChild(this.levelFlightIndicator);
  }

  showLevelFlightIndicator() {
    this.levelFlightIndicator.style.opacity = "1";
    this.levelFlightIndicatorVisible = true;
    this.levelFlightIndicatorTimer = 0;
  }

  update() {
    // Only update UI if in playing state
    if (this.gameState && !this.gameState.isPlaying()) {
      this.inGameUI.style.display = "none";
      return;
    } else {
      this.inGameUI.style.display = "block";
    }

    // Update speed indicator
    const speed = this.planeControls.speed;
    this.speedIndicator.textContent = speed.toFixed(0);

    // Update speed bar
    const normalizedSpeed = this.planeControls.getNormalizedSpeed();
    const percentage = (normalizedSpeed * 100).toFixed(0);
    this.speedBar.style.width = `${percentage}%`;

    // Color coding for speed
    if (normalizedSpeed < 0.3) {
      // Slow - red (danger of stalling)
      this.speedBar.style.backgroundColor = "#F44336";
    } else if (normalizedSpeed > 0.8) {
      // Fast - orange (danger of overspeeding)
      this.speedBar.style.backgroundColor = "#FF9800";
    } else {
      // Normal - green
      this.speedBar.style.backgroundColor = "#4CAF50";
    }

    // Update flight instruments if they exist
    if (this.planeControls) {
      // Update heading indicator
      if (this.headingValue) {
        const heading = this.planeControls.getHeadingDegrees();
        this.headingValue.textContent = `${heading
          .toString()
          .padStart(3, "0")}°`;

        // Color based on direction (red for north, green for east, etc.)
        if (heading >= 345 || heading < 15) {
          this.headingValue.style.color = "#ff4444"; // North (red)
        } else if (heading >= 75 && heading < 105) {
          this.headingValue.style.color = "#44ff44"; // East (green)
        } else if (heading >= 165 && heading < 195) {
          this.headingValue.style.color = "#4444ff"; // South (blue)
        } else if (heading >= 255 && heading < 285) {
          this.headingValue.style.color = "#ffff44"; // West (yellow)
        } else {
          this.headingValue.style.color = "white"; // Other directions
        }
      }

      // Update bank angle indicator
      if (this.bankValue) {
        const bankAngle = this.planeControls.getBankAngleDegrees();
        const bankText = `${Math.abs(bankAngle).toFixed(0)}° ${
          bankAngle < 0 ? "L" : bankAngle > 0 ? "R" : ""
        }`;
        this.bankValue.textContent = bankText;

        // Change color based on steepness
        const bankAbs = Math.abs(bankAngle);
        if (bankAbs > 45) {
          this.bankValue.style.color = "#ff4444"; // Steep bank (red)
        } else if (bankAbs > 30) {
          this.bankValue.style.color = "#ffaa44"; // Medium bank (orange)
        } else if (bankAbs > 5) {
          this.bankValue.style.color = "#ffff44"; // Gentle bank (yellow)
        } else {
          this.bankValue.style.color = "#44ff44"; // Level (green)
        }
      }

      // Update pitch angle indicator
      if (this.pitchValue) {
        const pitchAngle = this.planeControls.getPitchAngleDegrees();
        const pitchText = `${Math.abs(pitchAngle).toFixed(0)}° ${
          pitchAngle < 0 ? "Down" : pitchAngle > 0 ? "Up" : ""
        }`;
        this.pitchValue.textContent = pitchText;

        // Change color based on steepness
        const pitchAbs = Math.abs(pitchAngle);
        if (pitchAbs > 45) {
          this.pitchValue.style.color = "#ff4444"; // Steep pitch (red)
        } else if (pitchAbs > 30) {
          this.pitchValue.style.color = "#ffaa44"; // Medium pitch (orange)
        } else if (pitchAbs > 5) {
          this.pitchValue.style.color = "#ffff44"; // Gentle pitch (yellow)
        } else {
          this.pitchValue.style.color = "#44ff44"; // Level (green)
        }
      }

      // Update altitude indicator
      if (this.altValue) {
        const altitude = Math.round(this.planeControls.altitude);
        this.altValue.textContent = `${altitude} M`;

        // Change color based on altitude
        if (altitude < 20) {
          this.altValue.style.color = "#ff4444"; // Danger (red)
        } else if (altitude < 50) {
          this.altValue.style.color = "#ffff44"; // Caution (yellow)
        } else {
          this.altValue.style.color = "#44ff44"; // Safe (green)
        }
      }
    }

    // Update timer if game state exists
    if (this.gameState && this.timeDisplay && this.timerContainer) {
      // Always get the latest time from gameState
      const remainingTime = this.gameState.timeRemaining;

      // Update time display with the latest time
      this.timeDisplay.textContent = this.formatTime(remainingTime);

      // Track previous second to detect changes
      if (!this.previousSecond) {
        this.previousSecond = Math.ceil(remainingTime);
      }

      // Current second (rounded up)
      const currentSecond = Math.ceil(remainingTime);

      // Visual effects based on remaining time
      if (remainingTime <= 10) {
        // Critical - fast pulsing red (last 10 seconds)
        const flash = Math.floor(Date.now() / 250) % 2 === 0;
        this.timeDisplay.style.color = flash ? "#ff0000" : "white";
        this.timerContainer.style.border = "3px solid #ff0000";
        this.timerContainer.style.transform = flash
          ? "scale(1.05)"
          : "scale(1)";

        // Dispatch event for countdown sound when second changes
        if (currentSecond !== this.previousSecond && remainingTime > 0) {
          console.log(`Countdown: ${currentSecond} seconds remaining`);
          document.dispatchEvent(
            new CustomEvent("finalCountdown", {
              detail: { secondsLeft: currentSecond },
            })
          );
        }
      } else if (remainingTime <= 30) {
        // Warning - slower pulsing orange (last 30 seconds)
        const flash = Math.floor(Date.now() / 500) % 2 === 0;
        this.timeDisplay.style.color = flash ? "#ff6600" : "white";
        this.timerContainer.style.border = "2px solid #ff6600";
        this.timerContainer.style.transform = "scale(1)";

        // Dispatch event at specific intervals (30, 20 seconds)
        if (
          currentSecond !== this.previousSecond &&
          (currentSecond === 30 || currentSecond === 20)
        ) {
          console.log(`Alarm: ${currentSecond} seconds remaining`);
          document.dispatchEvent(
            new CustomEvent("finalCountdown", {
              detail: { secondsLeft: currentSecond },
            })
          );
        }
      } else if (remainingTime <= 60) {
        // Caution - steady yellow (last 60 seconds)
        this.timeDisplay.style.color = "#ffcc00";
        this.timerContainer.style.border = "2px solid #ffcc00";
        this.timerContainer.style.transform = "scale(1)";
      } else {
        // Normal - white text, green border
        this.timeDisplay.style.color = "white";
        this.timerContainer.style.border = "2px solid #4CAF50";
        this.timerContainer.style.transform = "scale(1)";
      }

      // Update previous second
      this.previousSecond = currentSecond;
    }

    // Update score if game state exists
    if (this.gameState && this.scoreDisplay) {
      this.scoreDisplay.textContent = this.gameState.score.toString();
    }

    // Update level flight indicator
    if (this.levelFlightIndicatorVisible) {
      this.levelFlightIndicatorTimer += 1 / 60; // Assuming 60fps
      if (this.levelFlightIndicatorTimer > 2) {
        // Show for 2 seconds
        this.levelFlightIndicator.style.opacity = "0";
        this.levelFlightIndicatorVisible = false;
      }
    }
  }

  updateUFOCount(count) {
    this.ufoCount = count;
    if (this.ufoCounter) {
      // Store previous value for animation
      const oldValue = parseInt(this.ufoCounter.textContent);

      // Update counter with new value
      this.ufoCounter.textContent = count.toString();

      // Only animate if the value has decreased (UFO destroyed)
      if (count < oldValue) {
        // More dramatic animation
        this.ufoCounter.style.transform = "scale(1.5)";
        this.ufoCounter.style.color = "#FF0000";
        this.ufoCounter.style.transition = "transform 0.3s, color 0.3s";

        // Reset after animation
        setTimeout(() => {
          this.ufoCounter.style.transform = "scale(1)";
          this.ufoCounter.style.color = "#FF5555";
        }, 300);
      }
    }
  }

  // Format time as MM:SS
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // Reset UI state
  reset() {
    // Reset countdown tracking
    this.previousSecond = null;

    // Reset level flight indicator
    this.levelFlightIndicatorVisible = false;
    this.levelFlightIndicatorTimer = 0;
    if (this.levelFlightIndicator) {
      this.levelFlightIndicator.style.opacity = "0";
    }
  }
}
