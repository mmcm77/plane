// Audio Manager for the game

export class AudioManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.volume = 0.5;
    this.muted = false;

    // Initialize audio context
    this.context = null;

    // Try to initialize audio context
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
    } catch (e) {
      console.warn("Web Audio API not supported in this browser");
    }

    // Create a gain node for master volume
    if (this.context) {
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.context.destination);
    }

    // Load all sounds
    this.loadSounds();
  }

  // Load all game sounds
  loadSounds() {
    // Define all sounds to preload
    const soundsToLoad = [
      {
        name: "engine",
        url: "https://assets.codepen.io/21542/Helicopter2.mp3",
        loop: true,
      },
      {
        name: "shoot",
        url: "https://assets.codepen.io/21542/gun-shot.mp3",
        loop: false,
      },
      {
        name: "explosion",
        url: "https://assets.codepen.io/21542/Explosion4.mp3",
        loop: false,
      },
      {
        name: "ufo",
        url: "https://assets.codepen.io/21542/spaceEngine_000.mp3",
        loop: true,
      },
      {
        name: "victory",
        url: "https://assets.codepen.io/21542/success-1.mp3",
        loop: false,
      },
      {
        name: "defeat",
        url: "https://assets.codepen.io/21542/negative_beeps.mp3",
        loop: false,
      },
      {
        name: "button",
        url: "https://assets.codepen.io/21542/click_003.mp3",
        loop: false,
      },
      {
        name: "countdown",
        url: "https://assets.codepen.io/21542/lowDown.mp3",
        loop: false,
      },
      {
        name: "alarm",
        url: "https://assets.codepen.io/21542/alarm_loop.mp3",
        loop: false,
      },
      {
        name: "music",
        url: "https://assets.codepen.io/21542/Spy+Glass.mp3",
        loop: true,
      },
      {
        name: "crash",
        url: "sounds/crash.mp3",
        loop: false,
      },
    ];

    // Load each sound
    soundsToLoad.forEach((sound) => {
      this.loadSound(sound.name, sound.url, sound.loop);
    });
  }

  // Load a single sound
  loadSound(name, url, loop = false) {
    if (!this.context) return;

    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => this.context.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        this.sounds[name] = {
          buffer: audioBuffer,
          loop: loop,
          source: null,
        };
      })
      .catch((error) => console.error("Error loading sound:", name, error));
  }

  // Play a sound
  play(name, options = {}) {
    if (!this.context || this.muted) return null;

    const sound = this.sounds[name];
    if (!sound) {
      console.warn(`Sound "${name}" not found`);
      return null;
    }

    // Stop previous source if it exists and we want exclusive playback
    if (options.exclusive && sound.source) {
      this.stop(name);
    }

    // Create a new source
    const source = this.context.createBufferSource();
    source.buffer = sound.buffer;
    source.loop = sound.loop;

    // Create a gain node for this specific sound
    const gainNode = this.context.createGain();
    gainNode.gain.value = options.volume !== undefined ? options.volume : 1;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Store source for later use
    if (sound.loop) {
      sound.source = source;
      sound.gainNode = gainNode;
    }

    // Start playback
    source.start(0);

    // Set up cleanup when non-looping sounds end
    if (!sound.loop) {
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    }

    return {
      source,
      gainNode,
    };
  }

  // Stop a sound
  stop(name) {
    if (!this.context) return;

    const sound = this.sounds[name];
    if (!sound || !sound.source) return;

    try {
      sound.source.stop();
      sound.source.disconnect();
      sound.gainNode.disconnect();
      sound.source = null;
      sound.gainNode = null;
    } catch (e) {
      console.warn(`Error stopping sound "${name}":`, e);
    }
  }

  // Stop all sounds
  stopAll() {
    if (!this.context) return;

    Object.keys(this.sounds).forEach((name) => {
      this.stop(name);
    });
  }

  // Set master volume
  setVolume(volume) {
    if (!this.context) return;

    this.volume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = this.volume;
  }

  // Mute/unmute all sounds
  setMute(muted) {
    if (!this.context) return;

    this.muted = muted;
    this.masterGain.gain.value = muted ? 0 : this.volume;
  }

  // Toggle mute state
  toggleMute() {
    this.setMute(!this.muted);
    return this.muted;
  }

  // Resume audio context if it was suspended (needed for browsers that block autoplay)
  resumeAudioContext() {
    if (this.context && this.context.state === "suspended") {
      this.context.resume();
    }
  }

  // Engine sound with varying pitch based on speed
  playEngineSound(speed, maxSpeed) {
    if (!this.context || this.muted) return;

    const sound = this.sounds["engine"];
    if (!sound) return;

    if (!sound.source) {
      const result = this.play("engine", { volume: 0.4, exclusive: true });
      if (!result) return;
    }

    // Adjust playback rate based on speed
    if (sound.source) {
      // Map speed to a reasonable playback rate range (0.8 to 1.5)
      const normalizedSpeed = speed / maxSpeed;
      const rate = 0.8 + normalizedSpeed * 0.7;
      sound.source.playbackRate.value = rate;
    }
  }

  // Play UI button click sound
  playButtonSound() {
    this.play("button", { volume: 0.5 });
  }

  // Play shooting sound
  playShootSound() {
    this.play("shoot", { volume: 0.3 });
  }

  // Play explosion sound when UFO is destroyed
  playExplosionSound() {
    this.play("explosion", { volume: 0.5 });
  }

  // Play victory sound
  playVictorySound() {
    this.stopAll();
    this.play("victory", { volume: 0.7 });
  }

  // Play defeat sound
  playDefeatSound() {
    this.stopAll();
    this.play("defeat", { volume: 0.7 });
  }

  // Start background music
  startMusic() {
    this.play("music", { volume: 0.3, exclusive: true });
  }

  // Start UFO hovering sound
  startUFOSound() {
    this.play("ufo", { volume: 0.2, exclusive: true });
  }

  // Play countdown beep for timer
  playCountdownSound() {
    this.play("countdown", { volume: 0.6 });
  }

  // Play alarm sound for critical time warning
  playAlarmSound() {
    this.play("alarm", { volume: 0.5 });
  }

  // Play crash sound
  playCrashSound() {
    // Wait for the buffer to load
    if (!this.sounds.crash) {
      setTimeout(() => this.playCrashSound(), 100);
      return;
    }

    // Play the crash sound with high priority
    const source = this.context.createBufferSource();
    source.buffer = this.sounds.crash.buffer;

    // Create a dedicated gain node for this sound
    const crashGain = this.context.createGain();
    crashGain.gain.value = 1.0; // Full volume for crash

    // Connect and play
    source.connect(crashGain);
    crashGain.connect(this.masterGain);
    source.start(0);

    // Stop any other sounds to emphasize crash
    this.stopAll();

    // Return the source in case we need to stop it
    return source;
  }
}
