# 3D Plane Game

A browser-based 3D game where players pilot a plane to shoot down UFOs that are hovering over a city.

## Play the Game

You can play the game online at: [https://yourusername.github.io/plane/](https://yourusername.github.io/plane/)

## Requirements

- 3D environment with city landscape
- Controllable plane with realistic flight physics
- Enemy UFOs with basic AI behavior
- Shooting mechanics with visual effects
- Collision detection and explosion effects
- Game states (start, play, win, lose)
- Sound effects and background music
- Mobile and desktop controls
- Score tracking

## Tech Stack

- **Three.js** - 3D rendering library
- **JavaScript/TypeScript** - Core programming language
- **HTML5/CSS** - Basic structure and styling
- **Webpack/Vite** - Build tools
- **Web Audio API** - Audio handling

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser at the URL shown in the terminal (usually http://localhost:5173)

## Deployment

To deploy the game to GitHub Pages:

1. Build the project:
   ```
   npm run build
   ```
2. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```

This will publish the game to https://yourusername.github.io/plane/

## Controls

- **W/S**: Pitch control (up/down)
- **A/D**: Roll control (left/right)
- **Q/E**: Speed control (decrease/increase)
- **C**: Toggle camera mode between follow-cam and free orbit
- **SPACE**: Fire weapons at UFOs
- **P**: Pause game
- **L**: Quick level flight

## Current Progress

- ✅ Milestone 1: Created basic plane model with propeller animation
- ✅ Milestone 2: Built city environment with skybox and performance optimizations
- ✅ Milestone 3: Implemented flight controls, physics, and camera system
- ✅ Milestone 4: Added UFOs, shooting mechanics, and collision detection
- ✅ Milestone 5: Added game states, effects, sounds, and scoring system
- ✅ Milestone 6: Redesigned city layout with proper road networks
- ✅ Milestone 7: Added realistic collision physics for plane crashes

## Milestones

### 1. Create Plane Model

- Set up basic Three.js scene in Next.js
- Import or create low-poly plane model
- Implement basic camera following the plane
- Add simple lighting effects

### 2. Build City Environment

- Create procedurally generated city with buildings and streets
- Add windows to buildings for visual detail
- Implement skybox for atmospheric effects
- Add performance monitoring and fog for distance culling

### 3. Set Up Plane Controls

- Implemented quaternion-based flight physics for realistic movement
- Added keyboard controls (W/S for pitch, A/D for roll, Q/E for speed)
- Created bank-proportional turning with auto-leveling system
- Implemented follow camera with smooth transitions
- Added UI with speed indicator and control reference
- Added camera toggle between follow and free orbit modes

### 4. Add UFOs, Shooting, and Explosions

- Created UFO models with hovering and rotation animation
- Implemented shooting mechanics from the plane using space bar
- Added bullet physics and collision detection with UFOs
- Created UFO tracking system to show remaining targets
- Implemented bullet cooldown system for balanced gameplay

### 5. Add Polish and Game States

- Implemented start screen with instructions and title
- Added victory and defeat conditions/screens with score display
- Integrated background music and sound effects including:
  - Engine sounds that vary with plane speed
  - Weapon firing sounds
  - Explosion effects
  - UI button sounds
- Created visual effects for enhanced gameplay:
  - Explosion particle effects
  - Bullet trails
  - Muzzle flash effects
- Added mission timer with time bonus scoring
- Implemented game state management system
- Added pause functionality
- Added volume control

### 6. Improved City Layout

- Redesigned city with wider spread between buildings
- Implemented proper road network with main avenues and side streets
- Created detailed intersections with crosswalks
- Varied building density with downtown and suburb areas
- Improved sidewalks and building placement
- Enhanced camera view to better showcase the city
- Increased number of UFOs to match larger city size
- Extended mission time for the larger play area

### 7. Added Collision Physics

- Implemented detection for three collision types:
  - Ground collisions with terrain
  - Building collisions with city structures
  - UFO collisions with enemy aircraft
- Created realistic crash effects:
  - Plane debris with physics simulation
  - Explosion particles and lighting
  - Camera shake effect on impact
- Added crash sound effects
- Game state transitions to defeat on collision
- Reset mechanism to restore plane after crash
