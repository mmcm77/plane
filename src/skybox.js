import * as THREE from "three";

// Function to create a skybox
export function createSkybox() {
  const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);

  // Create skybox materials for a more accurate sky color
  const skyboxMaterials = [];

  // Top - light blue
  skyboxMaterials.push(
    new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      side: THREE.BackSide,
    })
  );

  // Bottom - match ground color but darker
  skyboxMaterials.push(
    new THREE.MeshBasicMaterial({
      color: 0x2a2a2a,
      side: THREE.BackSide,
    })
  );

  // Four sides - consistent blue color to match screenshot
  for (let i = 0; i < 4; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: 0x87ceeb, // Lighter blue that matches the reference image
      side: THREE.BackSide,
    });
    skyboxMaterials.push(material);
  }

  const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
  return skybox;
}
