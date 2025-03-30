// Game State Manager

// Game state constants
export const GAME_STATES = {
  START: "start",
  PLAYING: "playing",
  PAUSED: "paused",
  VICTORY: "victory",
  DEFEAT: "defeat",
};

export class GameStateManager {
  constructor() {
    this.currentState = GAME_STATES.START;
    this.score = 0;
    this.maxTime = 450; // 7.5 minutes in seconds (increased from 300 for larger city)
    this.timeRemaining = this.maxTime;
    this.totalUFOs = 0;
    this.destroyedUFOs = 0;
    this.listeners = {};

    // DOM elements for different screens
    this.screens = {};

    this.initScreens();
  }

  initScreens() {
    // Create container for all UI screens
    const screenContainer = document.createElement("div");
    screenContainer.style.position = "absolute";
    screenContainer.style.top = "0";
    screenContainer.style.left = "0";
    screenContainer.style.width = "100%";
    screenContainer.style.height = "100%";
    screenContainer.style.pointerEvents = "none";
    document.body.appendChild(screenContainer);

    // Create start screen
    this.screens.start = this.createStartScreen(screenContainer);

    // Create victory screen
    this.screens.victory = this.createVictoryScreen(screenContainer);

    // Create defeat screen
    this.screens.defeat = this.createDefeatScreen(screenContainer);

    // Create pause screen
    this.screens.paused = this.createPauseScreen(screenContainer);

    // Initially show only start screen
    this.updateScreens();
  }

  createStartScreen(container) {
    const screen = document.createElement("div");
    screen.style.position = "absolute";
    screen.style.top = "0";
    screen.style.left = "0";
    screen.style.width = "100%";
    screen.style.height = "100%";
    screen.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    screen.style.display = "flex";
    screen.style.flexDirection = "column";
    screen.style.justifyContent = "center";
    screen.style.alignItems = "center";
    screen.style.pointerEvents = "auto";

    // Game title
    const title = document.createElement("h1");
    title.textContent = "UFO HUNTER";
    title.style.fontSize = "4rem";
    title.style.fontFamily = "Arial, sans-serif";
    title.style.color = "white";
    title.style.marginBottom = "2rem";
    title.style.textShadow = "0 0 10px #00ff00, 0 0 20px #00ff00";
    screen.appendChild(title);

    // Game description
    const description = document.createElement("p");
    description.textContent =
      "Pilot your plane and shoot down the alien invasion!";
    description.style.fontSize = "1.5rem";
    description.style.fontFamily = "Arial, sans-serif";
    description.style.color = "white";
    description.style.marginBottom = "3rem";
    screen.appendChild(description);

    // Start button
    const startButton = document.createElement("button");
    startButton.textContent = "START MISSION";
    startButton.style.padding = "1rem 2rem";
    startButton.style.fontSize = "1.5rem";
    startButton.style.backgroundColor = "#00cc00";
    startButton.style.color = "white";
    startButton.style.border = "none";
    startButton.style.borderRadius = "5px";
    startButton.style.cursor = "pointer";
    startButton.style.transition = "all 0.2s";
    startButton.style.fontFamily = "Arial, sans-serif";
    startButton.style.fontWeight = "bold";
    startButton.style.boxShadow = "0 0 10px #00ff00";

    startButton.addEventListener("mouseover", () => {
      startButton.style.backgroundColor = "#00ff00";
      startButton.style.transform = "scale(1.05)";
    });

    startButton.addEventListener("mouseout", () => {
      startButton.style.backgroundColor = "#00cc00";
      startButton.style.transform = "scale(1)";
    });

    startButton.addEventListener("click", () => {
      this.setState(GAME_STATES.PLAYING);
    });

    screen.appendChild(startButton);

    // Controls section
    const controlsTitle = document.createElement("h2");
    controlsTitle.textContent = "CONTROLS";
    controlsTitle.style.fontSize = "1.5rem";
    controlsTitle.style.fontFamily = "Arial, sans-serif";
    controlsTitle.style.color = "white";
    controlsTitle.style.marginTop = "3rem";
    controlsTitle.style.marginBottom = "1rem";
    screen.appendChild(controlsTitle);

    const controlsList = [
      { key: "W / S", action: "Pitch up / down" },
      { key: "A / D", action: "Roll right / left" },
      { key: "Q / E", action: "Decrease / increase speed" },
      { key: "SPACE", action: "Fire weapons" },
      { key: "C", action: "Toggle camera mode" },
      { key: "P", action: "Pause game" },
    ];

    const controlsContainer = document.createElement("div");
    controlsContainer.style.display = "flex";
    controlsContainer.style.flexDirection = "column";
    controlsContainer.style.alignItems = "flex-start";
    controlsContainer.style.padding = "1rem";
    controlsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    controlsContainer.style.borderRadius = "5px";

    controlsList.forEach((control) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.marginBottom = "0.5rem";
      row.style.color = "white";
      row.style.fontFamily = "Arial, sans-serif";

      const keyElement = document.createElement("div");
      keyElement.textContent = control.key;
      keyElement.style.width = "120px";
      keyElement.style.fontWeight = "bold";
      keyElement.style.color = "#00ff00";
      row.appendChild(keyElement);

      const actionElement = document.createElement("div");
      actionElement.textContent = control.action;
      row.appendChild(actionElement);

      controlsContainer.appendChild(row);
    });

    screen.appendChild(controlsContainer);

    container.appendChild(screen);
    return screen;
  }

  createVictoryScreen(container) {
    const screen = document.createElement("div");
    screen.style.position = "absolute";
    screen.style.top = "0";
    screen.style.left = "0";
    screen.style.width = "100%";
    screen.style.height = "100%";
    screen.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    screen.style.display = "flex";
    screen.style.flexDirection = "column";
    screen.style.justifyContent = "center";
    screen.style.alignItems = "center";
    screen.style.pointerEvents = "auto";
    screen.style.display = "none"; // Initially hidden

    // Victory title
    const title = document.createElement("h1");
    title.textContent = "MISSION ACCOMPLISHED!";
    title.style.fontSize = "4rem";
    title.style.fontFamily = "Arial, sans-serif";
    title.style.color = "#00ff00";
    title.style.marginBottom = "2rem";
    title.style.textShadow = "0 0 10px #00ff00, 0 0 20px #00ff00";
    screen.appendChild(title);

    // Score display
    const scoreDisplay = document.createElement("div");
    scoreDisplay.style.fontSize = "2rem";
    scoreDisplay.style.fontFamily = "Arial, sans-serif";
    scoreDisplay.style.color = "white";
    scoreDisplay.style.marginBottom = "1rem";
    screen.appendChild(scoreDisplay);

    // Time bonus display
    const timeDisplay = document.createElement("div");
    timeDisplay.style.fontSize = "1.5rem";
    timeDisplay.style.fontFamily = "Arial, sans-serif";
    timeDisplay.style.color = "white";
    timeDisplay.style.marginBottom = "2rem";
    screen.appendChild(timeDisplay);

    // Total score
    const totalDisplay = document.createElement("div");
    totalDisplay.style.fontSize = "3rem";
    totalDisplay.style.fontFamily = "Arial, sans-serif";
    totalDisplay.style.color = "white";
    totalDisplay.style.marginBottom = "3rem";
    totalDisplay.style.fontWeight = "bold";
    screen.appendChild(totalDisplay);

    // Update score displays
    this.updateVictoryStats = () => {
      const ufoScore = this.destroyedUFOs * 100;
      const timeBonus = Math.round(this.timeRemaining * 10);
      const totalScore = ufoScore + timeBonus;

      scoreDisplay.textContent = `UFOs Destroyed: ${this.destroyedUFOs} × 100 = ${ufoScore} pts`;
      timeDisplay.textContent = `Time Bonus: ${this.timeRemaining.toFixed(
        1
      )}s × 10 = ${timeBonus} pts`;
      totalDisplay.textContent = `TOTAL SCORE: ${totalScore} pts`;
    };

    // Play again button
    const restartButton = document.createElement("button");
    restartButton.textContent = "PLAY AGAIN";
    restartButton.style.padding = "1rem 2rem";
    restartButton.style.fontSize = "1.5rem";
    restartButton.style.backgroundColor = "#00cc00";
    restartButton.style.color = "white";
    restartButton.style.border = "none";
    restartButton.style.borderRadius = "5px";
    restartButton.style.cursor = "pointer";
    restartButton.style.transition = "all 0.2s";
    restartButton.style.fontFamily = "Arial, sans-serif";
    restartButton.style.fontWeight = "bold";
    restartButton.style.boxShadow = "0 0 10px #00ff00";
    restartButton.style.marginBottom = "1rem";

    restartButton.addEventListener("mouseover", () => {
      restartButton.style.backgroundColor = "#00ff00";
      restartButton.style.transform = "scale(1.05)";
    });

    restartButton.addEventListener("mouseout", () => {
      restartButton.style.backgroundColor = "#00cc00";
      restartButton.style.transform = "scale(1)";
    });

    restartButton.addEventListener("click", () => {
      this.resetGame();
      this.setState(GAME_STATES.PLAYING);
    });

    screen.appendChild(restartButton);

    container.appendChild(screen);
    return screen;
  }

  createDefeatScreen(container) {
    const screen = document.createElement("div");
    screen.style.position = "absolute";
    screen.style.top = "0";
    screen.style.left = "0";
    screen.style.width = "100%";
    screen.style.height = "100%";
    screen.style.backgroundColor = "rgba(0, 0, 0, 0.85)"; // Darker background
    screen.style.display = "flex";
    screen.style.flexDirection = "column";
    screen.style.justifyContent = "center";
    screen.style.alignItems = "center";
    screen.style.pointerEvents = "auto";
    screen.style.display = "none"; // Initially hidden

    // Defeat title
    const title = document.createElement("h1");
    title.textContent = "MISSION FAILED";
    title.style.fontSize = "4rem";
    title.style.fontFamily = "Arial, sans-serif";
    title.style.color = "#ff3333";
    title.style.marginBottom = "1.5rem";
    title.style.textShadow = "0 0 10px #ff0000, 0 0 20px #ff0000";
    screen.appendChild(title);

    // Reason message (time expired or other)
    const reasonMessage = document.createElement("div");
    reasonMessage.style.fontSize = "1.5rem";
    reasonMessage.style.fontFamily = "Arial, sans-serif";
    reasonMessage.style.color = "#ff9999";
    reasonMessage.style.marginBottom = "2rem";
    reasonMessage.style.textAlign = "center";
    screen.appendChild(reasonMessage);

    // Score value
    const scoreValue = document.createElement("div");
    scoreValue.style.fontSize = "2.5rem";
    scoreValue.style.fontFamily = "Arial, sans-serif";
    scoreValue.style.color = "white";
    scoreValue.style.marginBottom = "1rem";
    scoreValue.style.fontWeight = "bold";
    screen.appendChild(scoreValue);

    // UFO stats
    const ufoStats = document.createElement("div");
    ufoStats.style.fontSize = "2rem";
    ufoStats.style.fontFamily = "Arial, sans-serif";
    ufoStats.style.color = "white";
    ufoStats.style.marginBottom = "3rem";
    screen.appendChild(ufoStats);

    // Update defeat stats
    this.updateDefeatStats = () => {
      // Check if time expired
      const timeExpired = this.timeRemaining <= 0;

      // Set appropriate message
      if (timeExpired) {
        reasonMessage.textContent = "TIME EXPIRED";
        // Flash the message
        let opacity = 1;
        const flashInterval = setInterval(() => {
          opacity = opacity === 1 ? 0.3 : 1;
          reasonMessage.style.opacity = opacity;
        }, 500);

        // Clear interval after 5 seconds
        setTimeout(() => clearInterval(flashInterval), 5000);
      } else {
        reasonMessage.textContent = "Mission objectives not completed";
        reasonMessage.style.opacity = 1;
      }

      // Update score and UFO stats
      scoreValue.textContent = `SCORE: ${this.score}`;
      ufoStats.textContent = `UFOs Destroyed: ${this.destroyedUFOs} / ${this.totalUFOs}`;
    };

    // Button container for better layout
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "column";
    buttonContainer.style.gap = "15px";
    buttonContainer.style.alignItems = "center";
    screen.appendChild(buttonContainer);

    // Try again button
    const restartButton = document.createElement("button");
    restartButton.textContent = "TRY AGAIN";
    restartButton.style.padding = "1rem 2rem";
    restartButton.style.fontSize = "1.5rem";
    restartButton.style.backgroundColor = "#cc3333";
    restartButton.style.color = "white";
    restartButton.style.border = "none";
    restartButton.style.borderRadius = "5px";
    restartButton.style.cursor = "pointer";
    restartButton.style.transition = "all 0.2s";
    restartButton.style.fontFamily = "Arial, sans-serif";
    restartButton.style.fontWeight = "bold";
    restartButton.style.boxShadow = "0 0 10px #ff0000";
    restartButton.style.width = "250px";

    restartButton.addEventListener("mouseover", () => {
      restartButton.style.backgroundColor = "#ff3333";
      restartButton.style.transform = "scale(1.05)";
    });

    restartButton.addEventListener("mouseout", () => {
      restartButton.style.backgroundColor = "#cc3333";
      restartButton.style.transform = "scale(1)";
    });

    restartButton.addEventListener("click", () => {
      this.resetGame();
      this.setState(GAME_STATES.PLAYING);
    });

    buttonContainer.appendChild(restartButton);

    // Return to main menu button
    const mainMenuButton = document.createElement("button");
    mainMenuButton.textContent = "MAIN MENU";
    mainMenuButton.style.padding = "0.8rem 2rem";
    mainMenuButton.style.fontSize = "1.3rem";
    mainMenuButton.style.backgroundColor = "#555555";
    mainMenuButton.style.color = "white";
    mainMenuButton.style.border = "none";
    mainMenuButton.style.borderRadius = "5px";
    mainMenuButton.style.cursor = "pointer";
    mainMenuButton.style.transition = "all 0.2s";
    mainMenuButton.style.fontFamily = "Arial, sans-serif";
    mainMenuButton.style.fontWeight = "bold";
    mainMenuButton.style.width = "250px";

    mainMenuButton.addEventListener("mouseover", () => {
      mainMenuButton.style.backgroundColor = "#777777";
      mainMenuButton.style.transform = "scale(1.05)";
    });

    mainMenuButton.addEventListener("mouseout", () => {
      mainMenuButton.style.backgroundColor = "#555555";
      mainMenuButton.style.transform = "scale(1)";
    });

    mainMenuButton.addEventListener("click", () => {
      this.resetGame();
      this.setState(GAME_STATES.START);
    });

    buttonContainer.appendChild(mainMenuButton);

    container.appendChild(screen);
    return screen;
  }

  createPauseScreen(container) {
    const screen = document.createElement("div");
    screen.style.position = "absolute";
    screen.style.top = "0";
    screen.style.left = "0";
    screen.style.width = "100%";
    screen.style.height = "100%";
    screen.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    screen.style.display = "flex";
    screen.style.flexDirection = "column";
    screen.style.justifyContent = "center";
    screen.style.alignItems = "center";
    screen.style.pointerEvents = "auto";
    screen.style.display = "none"; // Initially hidden

    // Pause title
    const title = document.createElement("h1");
    title.textContent = "PAUSED";
    title.style.fontSize = "4rem";
    title.style.fontFamily = "Arial, sans-serif";
    title.style.color = "white";
    title.style.marginBottom = "3rem";
    screen.appendChild(title);

    // Resume button
    const resumeButton = document.createElement("button");
    resumeButton.textContent = "RESUME";
    resumeButton.style.padding = "1rem 2rem";
    resumeButton.style.fontSize = "1.5rem";
    resumeButton.style.backgroundColor = "#00cc00";
    resumeButton.style.color = "white";
    resumeButton.style.border = "none";
    resumeButton.style.borderRadius = "5px";
    resumeButton.style.cursor = "pointer";
    resumeButton.style.transition = "all 0.2s";
    resumeButton.style.fontFamily = "Arial, sans-serif";
    resumeButton.style.fontWeight = "bold";
    resumeButton.style.boxShadow = "0 0 10px #00ff00";
    resumeButton.style.marginBottom = "1rem";

    resumeButton.addEventListener("mouseover", () => {
      resumeButton.style.backgroundColor = "#00ff00";
      resumeButton.style.transform = "scale(1.05)";
    });

    resumeButton.addEventListener("mouseout", () => {
      resumeButton.style.backgroundColor = "#00cc00";
      resumeButton.style.transform = "scale(1)";
    });

    resumeButton.addEventListener("click", () => {
      this.setState(GAME_STATES.PLAYING);
    });

    screen.appendChild(resumeButton);

    // Restart button
    const restartButton = document.createElement("button");
    restartButton.textContent = "RESTART";
    restartButton.style.padding = "1rem 2rem";
    restartButton.style.fontSize = "1.5rem";
    restartButton.style.backgroundColor = "#cccc00";
    restartButton.style.color = "white";
    restartButton.style.border = "none";
    restartButton.style.borderRadius = "5px";
    restartButton.style.cursor = "pointer";
    restartButton.style.transition = "all 0.2s";
    restartButton.style.fontFamily = "Arial, sans-serif";
    restartButton.style.fontWeight = "bold";
    restartButton.style.boxShadow = "0 0 10px #ffff00";
    restartButton.style.marginBottom = "1rem";

    restartButton.addEventListener("mouseover", () => {
      restartButton.style.backgroundColor = "#ffff00";
      restartButton.style.color = "black";
      restartButton.style.transform = "scale(1.05)";
    });

    restartButton.addEventListener("mouseout", () => {
      restartButton.style.backgroundColor = "#cccc00";
      restartButton.style.color = "white";
      restartButton.style.transform = "scale(1)";
    });

    restartButton.addEventListener("click", () => {
      this.resetGame();
      this.setState(GAME_STATES.PLAYING);
    });

    screen.appendChild(restartButton);

    container.appendChild(screen);
    return screen;
  }

  updateScreens() {
    // Hide all screens first
    Object.values(this.screens).forEach((screen) => {
      screen.style.display = "none";
    });

    // Show the appropriate screen based on game state
    switch (this.currentState) {
      case GAME_STATES.START:
        this.screens.start.style.display = "flex";
        break;
      case GAME_STATES.VICTORY:
        this.updateVictoryStats();
        this.screens.victory.style.display = "flex";
        break;
      case GAME_STATES.DEFEAT:
        this.updateDefeatStats();
        this.screens.defeat.style.display = "flex";
        break;
      case GAME_STATES.PAUSED:
        this.screens.paused.style.display = "flex";
        break;
      default:
        // No screens shown during PLAYING state
        break;
    }
  }

  setState(newState) {
    if (this.currentState === newState) return;

    const oldState = this.currentState;
    this.currentState = newState;

    // Update screens based on new state
    this.updateScreens();

    // Notify listeners about state change
    this.notifyListeners("stateChange", { oldState, newState });
  }

  resetGame() {
    this.score = 0;
    this.timeRemaining = this.maxTime;
    this.destroyedUFOs = 0;

    // Notify listeners about game reset
    this.notifyListeners("gameReset", {});
  }

  updateTime(deltaTime) {
    if (this.currentState !== GAME_STATES.PLAYING) return;

    this.timeRemaining -= deltaTime;

    // Check for time-out defeat condition
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.setState(GAME_STATES.DEFEAT);
    }

    // Notify listeners
    this.notifyListeners("timeUpdate", { timeRemaining: this.timeRemaining });
  }

  addUFODestroyed() {
    this.destroyedUFOs++;
    this.score += 100; // Base score for UFO destruction

    // Check for victory condition
    if (this.destroyedUFOs >= this.totalUFOs) {
      this.setState(GAME_STATES.VICTORY);
    }

    // Notify listeners
    this.notifyListeners("scoreUpdate", {
      score: this.score,
      destroyedUFOs: this.destroyedUFOs,
    });
  }

  // Dedicated method to add score with optional points parameter
  addScore(points = 100) {
    this.score += points;

    // Notify listeners
    this.notifyListeners("scoreUpdate", {
      score: this.score,
      destroyedUFOs: this.destroyedUFOs,
    });
  }

  setTotalUFOs(count) {
    this.totalUFOs = count;
  }

  isPlaying() {
    return this.currentState === GAME_STATES.PLAYING;
  }

  isPaused() {
    return this.currentState === GAME_STATES.PAUSED;
  }

  togglePause() {
    if (this.currentState === GAME_STATES.PLAYING) {
      this.setState(GAME_STATES.PAUSED);
    } else if (this.currentState === GAME_STATES.PAUSED) {
      this.setState(GAME_STATES.PLAYING);
    }
  }

  // Event listener system
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  notifyListeners(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(data));
  }
}
