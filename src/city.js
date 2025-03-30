import * as THREE from "three";

// Function to create a city with spread out buildings and road networks
export function createCity(size = 100) {
  const cityGroup = new THREE.Group();

  // Parameters for city generation
  const maxHeight = 25; // Maximum building height (increased from 20)
  const minHeight = 5; // Minimum building height
  const citySize = size; // Size of the city (increased from 50 to 100)
  const blockSize = 8; // Size of each block (increased from 6 to 8)
  const mainRoadWidth = 2.5; // Width of main roads (increased from 2)
  const sideRoadWidth = 1.5; // Width of side roads
  const buildingDensity = 0.6; // Building density within blocks (reduced from 0.7 for more spread)

  // City layout structure
  const gridSpacing = blockSize + mainRoadWidth;
  const blocksPerSide = Math.floor(citySize / gridSpacing);

  // Materials
  const buildingMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    flatShading: true,
  });

  const mainRoadMaterial = new THREE.MeshPhongMaterial({
    color: 0x222222, // Darker for main roads
    flatShading: true,
  });

  const sideRoadMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333, // Medium gray for side roads
    flatShading: true,
  });

  const sidewalkMaterial = new THREE.MeshPhongMaterial({
    color: 0x555555, // Lighter gray for sidewalks
    flatShading: true,
  });

  // Create "infinite" ground plane
  const groundSize = 20000; // Increased from 10000 for larger playable area
  const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x3a5f0b, // Dark green
    flatShading: true,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1; // Slightly below the street grid
  ground.receiveShadow = true;
  cityGroup.add(ground);

  // First create the road network
  createRoadNetwork(
    cityGroup,
    citySize,
    blocksPerSide,
    blockSize,
    mainRoadWidth,
    sideRoadWidth,
    mainRoadMaterial,
    sideRoadMaterial
  );

  // Building types for variation
  const buildingTypes = [];

  // Create several building types with different dimensions
  for (let i = 0; i < 5; i++) {
    const width = 0.6 + i * 0.15;
    const depth = 0.6 + i * 0.15;
    const buildingGeometry = new THREE.BoxGeometry(
      (blockSize * width) / 3,
      maxHeight,
      (blockSize * depth) / 3
    );
    buildingTypes.push(buildingGeometry);
  }

  // Generate building blocks
  for (let blockX = 0; blockX < blocksPerSide; blockX++) {
    for (let blockZ = 0; blockZ < blocksPerSide; blockZ++) {
      // Calculate block center position
      const blockCenterX =
        (blockX - blocksPerSide / 2) * gridSpacing + gridSpacing / 2;
      const blockCenterZ =
        (blockZ - blocksPerSide / 2) * gridSpacing + gridSpacing / 2;

      // Create buildings in this block
      createBuildingsInBlock(
        cityGroup,
        blockCenterX,
        blockCenterZ,
        blockSize,
        buildingTypes,
        buildingMaterial,
        buildingDensity,
        minHeight,
        maxHeight
      );

      // Create sidewalks around the block
      createSidewalk(
        cityGroup,
        blockCenterX,
        blockCenterZ,
        blockSize,
        sidewalkMaterial
      );
    }
  }

  return cityGroup;
}

// Create building cluster within a block
function createBuildingsInBlock(
  cityGroup,
  blockCenterX,
  blockCenterZ,
  blockSize,
  buildingTypes,
  buildingMaterial,
  density,
  minHeight,
  maxHeight
) {
  // Calculate distance from center to create zones (downtown, midtown, suburbs)
  const distFromCenter = Math.sqrt(
    blockCenterX * blockCenterX + blockCenterZ * blockCenterZ
  );
  const maxDist =
    Math.sqrt(2) * ((blockSize * Math.floor(100 / (blockSize + 2.5))) / 2);
  const normalizedDist = distFromCenter / maxDist;

  // Downtown: center area (0-0.3), Midtown: middle ring (0.3-0.6), Suburbs: outer ring (0.6-1.0)
  const isDowntown = normalizedDist < 0.3;
  const isMidtown = normalizedDist >= 0.3 && normalizedDist < 0.6;
  const isSuburbs = normalizedDist >= 0.6;

  // Set building count and height based on district
  let buildingCount, blockMinHeight, blockMaxHeight;

  if (isDowntown) {
    // Downtown: Many tall buildings
    buildingCount = Math.floor(Math.random() * 3) + 4; // 4-6 buildings
    blockMinHeight = minHeight * 2;
    blockMaxHeight = maxHeight;
  } else if (isMidtown) {
    // Midtown: Medium density, medium height
    buildingCount = Math.floor(Math.random() * 3) + 2; // 2-4 buildings
    blockMinHeight = minHeight * 1.5;
    blockMaxHeight = maxHeight * 0.8;
  } else {
    // Suburbs: Low density, shorter buildings
    buildingCount = Math.floor(Math.random() * 2) + 1; // 1-2 buildings
    blockMinHeight = minHeight;
    blockMaxHeight = maxHeight * 0.5;

    // Skip some blocks in suburbs entirely for parks/open spaces
    if (Math.random() < 0.3) return;
  }

  // Calculate usable area (smaller than full block to leave space near edges)
  const usableSize = blockSize * 0.85;

  // Place buildings within the block
  for (let i = 0; i < buildingCount; i++) {
    // Apply density threshold - skip some buildings based on district
    if (
      Math.random() >
      (isDowntown ? density + 0.1 : isMidtown ? density : density - 0.1)
    )
      continue;

    // Calculate position with random offset within the block
    const offsetX = (Math.random() - 0.5) * usableSize;
    const offsetZ = (Math.random() - 0.5) * usableSize;
    const posX = blockCenterX + offsetX;
    const posZ = blockCenterZ + offsetZ;

    // Select random building type
    const typeIndex = Math.floor(Math.random() * buildingTypes.length);
    const buildingGeometry = buildingTypes[typeIndex].clone();

    // Randomize building height
    const buildingHeight =
      Math.random() * (blockMaxHeight - blockMinHeight) + blockMinHeight;

    // Create the building
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial.clone());

    // Randomize color slightly based on district
    let colorBase = 0.2;
    if (isDowntown) {
      // Downtown: darker, more modern glass buildings
      colorBase = 0.15;
    } else if (isMidtown) {
      // Midtown: medium gray
      colorBase = 0.25;
    } else {
      // Suburbs: lighter colored buildings
      colorBase = 0.3;
    }

    const colorVariation = Math.random() * 0.2 - 0.1; // -0.1 to 0.1
    building.material.color.setRGB(
      colorBase + colorVariation,
      colorBase + colorVariation,
      colorBase + colorVariation
    );

    // Position and scale
    building.position.set(posX, buildingHeight / 2, posZ);
    building.scale.y = buildingHeight / maxHeight;

    // Random rotation for more natural look
    building.rotation.y = Math.random() * Math.PI * 2;

    // Add shadow casting
    building.castShadow = true;
    building.receiveShadow = true;

    cityGroup.add(building);

    // Add windows to the building
    addWindowsToBuilding(building, buildingHeight);
  }
}

// Create a network of roads with main roads and side streets
function createRoadNetwork(
  cityGroup,
  citySize,
  blocksPerSide,
  blockSize,
  mainRoadWidth,
  sideRoadWidth,
  mainRoadMaterial,
  sideRoadMaterial
) {
  const gridSpacing = blockSize + mainRoadWidth;
  const totalSize = blocksPerSide * gridSpacing;

  // Create main road grid as a base layer
  const roadBase = new THREE.Mesh(
    new THREE.PlaneGeometry(totalSize, totalSize),
    mainRoadMaterial
  );
  roadBase.rotation.x = -Math.PI / 2;
  roadBase.position.y = 0.01; // Slightly above ground
  roadBase.receiveShadow = true;
  cityGroup.add(roadBase);

  // Create horizontal main roads
  for (let i = 0; i <= blocksPerSide; i++) {
    const posZ = (i - blocksPerSide / 2) * gridSpacing;

    // Main road
    const roadWidth = mainRoadWidth;
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(totalSize, roadWidth),
      mainRoadMaterial
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, posZ);
    road.receiveShadow = true;
    cityGroup.add(road);

    // Road markings (center line)
    const centerLine = new THREE.Mesh(
      new THREE.PlaneGeometry(totalSize, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.03, posZ);
    cityGroup.add(centerLine);

    // Add dashed lane markings
    const dashCount = Math.floor(totalSize / 2);
    for (let d = 0; d < dashCount; d++) {
      if (d % 2 === 0) {
        // Only add every other dash for spacing
        const dashX = (d - dashCount / 2) * 2 + 1;

        // Lane markers on each side
        for (const offset of [mainRoadWidth * 0.25, -mainRoadWidth * 0.25]) {
          const dash = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 0.1),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(dashX, 0.03, posZ + offset);
          cityGroup.add(dash);
        }
      }
    }
  }

  // Create vertical main roads
  for (let i = 0; i <= blocksPerSide; i++) {
    const posX = (i - blocksPerSide / 2) * gridSpacing;

    // Main road
    const roadWidth = mainRoadWidth;
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, totalSize),
      mainRoadMaterial
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(posX, 0.02, 0);
    road.receiveShadow = true;
    cityGroup.add(road);

    // Road markings (center line)
    const centerLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, totalSize),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(posX, 0.03, 0);
    cityGroup.add(centerLine);

    // Add dashed lane markings
    const dashCount = Math.floor(totalSize / 2);
    for (let d = 0; d < dashCount; d++) {
      if (d % 2 === 0) {
        // Only add every other dash for spacing
        const dashZ = (d - dashCount / 2) * 2 + 1;

        // Lane markers on each side
        for (const offset of [mainRoadWidth * 0.25, -mainRoadWidth * 0.25]) {
          const dash = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 1),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(posX + offset, 0.03, dashZ);
          cityGroup.add(dash);
        }
      }
    }
  }

  // Create intersection markers (crosswalks)
  for (let x = 0; x <= blocksPerSide; x++) {
    for (let z = 0; z <= blocksPerSide; z++) {
      const posX = (x - blocksPerSide / 2) * gridSpacing;
      const posZ = (z - blocksPerSide / 2) * gridSpacing;

      createIntersection(cityGroup, posX, posZ, mainRoadWidth);
    }
  }
}

// Create an intersection with crosswalks
function createIntersection(cityGroup, posX, posZ, roadWidth) {
  // Create crosswalk lines
  const crosswalkLineCount = 6;
  const lineWidth = 0.3;
  const lineLength = roadWidth * 0.7;
  const spacing = lineLength / crosswalkLineCount;

  // Create north crosswalk
  for (let i = 0; i < crosswalkLineCount; i++) {
    const lineZ = posZ + roadWidth * 0.35 - i * spacing;
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(lineWidth, lineLength),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(posX, 0.03, lineZ);
    cityGroup.add(line);
  }

  // Create south crosswalk
  for (let i = 0; i < crosswalkLineCount; i++) {
    const lineZ = posZ - roadWidth * 0.35 + i * spacing;
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(lineWidth, lineLength),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(posX, 0.03, lineZ);
    cityGroup.add(line);
  }

  // Create east crosswalk
  for (let i = 0; i < crosswalkLineCount; i++) {
    const lineX = posX + roadWidth * 0.35 - i * spacing;
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(lineLength, lineWidth),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(lineX, 0.03, posZ);
    cityGroup.add(line);
  }

  // Create west crosswalk
  for (let i = 0; i < crosswalkLineCount; i++) {
    const lineX = posX - roadWidth * 0.35 + i * spacing;
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(lineLength, lineWidth),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(lineX, 0.03, posZ);
    cityGroup.add(line);
  }
}

// Create sidewalks around a block
function createSidewalk(
  cityGroup,
  blockCenterX,
  blockCenterZ,
  blockSize,
  material
) {
  const sidewalkWidth = 0.4;
  const sidewalkHeight = 0.1;
  const innerBlockSize = blockSize - sidewalkWidth * 2;

  // Outer sidewalk (elevated from road)
  const outerSidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(blockSize, sidewalkHeight, blockSize),
    material
  );
  outerSidewalk.position.set(blockCenterX, sidewalkHeight / 2, blockCenterZ);
  outerSidewalk.receiveShadow = true;
  cityGroup.add(outerSidewalk);

  // Inner building area (slightly different color)
  const innerArea = new THREE.Mesh(
    new THREE.BoxGeometry(
      innerBlockSize,
      sidewalkHeight + 0.01,
      innerBlockSize
    ),
    new THREE.MeshPhongMaterial({ color: 0x444444 })
  );
  innerArea.position.set(blockCenterX, sidewalkHeight / 2, blockCenterZ);
  innerArea.receiveShadow = true;
  cityGroup.add(innerArea);
}

// Add windows to a building
function addWindowsToBuilding(building, buildingHeight) {
  // Get building dimensions from its geometry
  const width = building.geometry.parameters.width;
  const height = buildingHeight;
  const depth = building.geometry.parameters.depth;

  // Calculate window position based on building size
  const windowRows = Math.ceil(height / 2);
  const windowColsWidth = Math.ceil(width * 3);
  const windowColsDepth = Math.ceil(depth * 3);

  // Window dimensions
  const windowSize = 0.15;
  const windowSpacing = 0.05;
  const windowDepth = 0.05;

  // Window material (glowing at night)
  const windowMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffcc,
    emissive: 0xffffcc,
    emissiveIntensity: Math.random() * 0.3 + 0.1,
  });

  // Add windows to front and back faces
  for (let row = 0; row < windowRows; row++) {
    // Every other window might be off (variation)
    const rowLitChance = Math.random() * 0.7 + 0.3; // 30-100% windows lit

    for (let col = 0; col < windowColsWidth; col++) {
      // Skip some windows
      if (Math.random() > 0.7) continue;

      // Window lit based on row chance
      const isLit = Math.random() < rowLitChance;
      const thisMaterial = isLit
        ? windowMaterial
        : new THREE.MeshPhongMaterial({ color: 0x111111 });

      // Calculate window position
      const windowX = -width / 2 + (width / windowColsWidth) * (col + 0.5);
      const windowY = -height / 2 + (height / windowRows) * (row + 0.5);
      const windowZ = depth / 2 + 0.01; // Slightly outside the building

      // Create window on front
      createWindowPane(
        building,
        windowX,
        windowY,
        windowZ,
        windowSize,
        thisMaterial,
        0
      );

      // Create window on back
      createWindowPane(
        building,
        windowX,
        windowY,
        -windowZ,
        windowSize,
        thisMaterial,
        1
      );
    }
  }

  // Add windows to left and right faces
  for (let row = 0; row < windowRows; row++) {
    const rowLitChance = Math.random() * 0.7 + 0.3; // 30-100% windows lit

    for (let col = 0; col < windowColsDepth; col++) {
      // Skip some windows
      if (Math.random() > 0.7) continue;

      // Window lit based on row chance
      const isLit = Math.random() < rowLitChance;
      const thisMaterial = isLit
        ? windowMaterial
        : new THREE.MeshPhongMaterial({ color: 0x111111 });

      // Calculate window position
      const windowZ = -depth / 2 + (depth / windowColsDepth) * (col + 0.5);
      const windowY = -height / 2 + (height / windowRows) * (row + 0.5);
      const windowX = width / 2 + 0.01; // Slightly outside the building

      // Create window on right side
      createWindowPane(
        building,
        windowX,
        windowY,
        windowZ,
        windowSize,
        thisMaterial,
        2
      );

      // Create window on left side
      createWindowPane(
        building,
        -windowX,
        windowY,
        windowZ,
        windowSize,
        thisMaterial,
        3
      );
    }
  }
}

// Create a window pane with the right orientation
function createWindowPane(building, x, y, z, size, material, orientation) {
  // Skip some windows randomly for variation
  if (Math.random() > 0.8) return;

  const windowGeometry = new THREE.PlaneGeometry(size, size);
  const window = new THREE.Mesh(windowGeometry, material);

  // Position window
  window.position.set(x, y, z);

  // Orient based on face
  if (orientation === 0) {
    // Front face (looking along +z)
    window.rotation.y = 0;
  } else if (orientation === 1) {
    // Back face (looking along -z)
    window.rotation.y = Math.PI;
  } else if (orientation === 2) {
    // Right face (looking along +x)
    window.rotation.y = -Math.PI / 2;
  } else if (orientation === 3) {
    // Left face (looking along -x)
    window.rotation.y = Math.PI / 2;
  }

  building.add(window);
}
