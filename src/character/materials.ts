import * as THREE from "three"

export function seededRandom(seed = 731) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 0) / 4294967296
  }
}

export function noise(x: number, y: number, z = 0) {
  return (Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453) % 1
}

export function createCharacterMaterials() {
  const random = seededRandom()
  const textures: THREE.Texture[] = []

  const makeTexture = (kind: "cloth" | "skin" | "rust") => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 512
    const context = canvas.getContext("2d")!
    const image = context.createImageData(512, 512)
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4
        const grain = random()
        if (kind === "cloth") {
          const weave = (x % 4 === 0 ? -9 : 0) + (y % 4 === 0 ? 6 : 0)
          const dirt = Math.sin(x * 0.031) * Math.sin(y * 0.024) * 9
          const value = 160 + weave + dirt + grain * 38
          image.data[i] = value
          image.data[i + 1] = value
          image.data[i + 2] = value
        } else if (kind === "skin") {
          const value = grain > 0.95 ? 120 : 175 + grain * 60
          image.data[i] = value + 10 // warmer reddish undertone
          image.data[i + 1] = value
          image.data[i + 2] = value - 15
        } else {
          const oxidized =
            Math.sin(x * 0.12 + Math.sin(y * 0.04) * 3) *
              Math.cos(y * 0.07 + Math.cos(x * 0.07)) +
            grain * 0.65
          const rusty = oxidized > 0.12
          image.data[i] = rusty ? 95 + grain * 65 : 115 + grain * 35
          image.data[i + 1] = rusty ? 42 + grain * 30 : 112 + grain * 30
          image.data[i + 2] = rusty ? 22 + grain * 18 : 94 + grain * 27
        }
        image.data[i + 3] = 255
      }
    }
    context.putImageData(image, 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    if (kind === "cloth") texture.repeat.set(6, 4)
    if (kind === "skin") texture.repeat.set(3, 2)
    texture.anisotropy = 4
    textures.push(texture)
    return texture
  }

  const clothMap = makeTexture("cloth")
  const skinMap = makeTexture("skin")
  const rustMap = makeTexture("rust")
  rustMap.colorSpace = THREE.SRGBColorSpace

  const coat = new THREE.MeshPhysicalMaterial({
    color: "#4e4d40",
    map: clothMap,
    bumpMap: clothMap,
    bumpScale: 0.003,
    roughness: 0.94,
    sheen: 0.6,
    sheenColor: new THREE.Color("#afa788"),
    sheenRoughness: 0.9,
    side: THREE.DoubleSide,
  })

  const pants = coat.clone()
  pants.color.set("#3c4038")

  const patch = coat.clone()
  patch.color.set("#887c5e")

  // Lifelike warm skin with subsurface scattering approximation
  const skin = new THREE.MeshPhysicalMaterial({
    color: "#f5e8db",
    vertexColors: true,
    roughness: 0.72,
    bumpMap: skinMap,
    bumpScale: 0.0035,
    specularIntensity: 0.32,
    specularColor: new THREE.Color("#ffd8c2"),
  })

  skin.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `float skinWrap = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.4);
       outgoingLight += diffuseColor.rgb * vec3(0.18, 0.065, 0.035) * skinWrap;
       #include <opaque_fragment>`,
    )
  }

  // Soft gray/white hair with realistic sheen
  const hair = new THREE.MeshPhysicalMaterial({
    color: "#e8e5dc",
    vertexColors: true,
    roughness: 0.55,
    sheen: 0.9,
    sheenColor: new THREE.Color("#f8f7f0"),
    sheenRoughness: 0.4,
    side: THREE.DoubleSide,
  })

  const rust = new THREE.MeshStandardMaterial({
    map: rustMap,
    bumpMap: rustMap,
    bumpScale: 0.012,
    color: "#b8a88e",
    metalness: 0.62,
    roughness: 0.86,
    side: THREE.DoubleSide,
  })

  const leather = new THREE.MeshStandardMaterial({
    color: "#3a3026",
    roughness: 0.88,
    bumpMap: clothMap,
    bumpScale: 0.006,
  })

  const thread = new THREE.MeshStandardMaterial({
    color: "#b5a882",
    roughness: 0.95,
  })

  const seam = new THREE.MeshStandardMaterial({
    color: "#2f3328",
    roughness: 0.95,
  })

  const lips = new THREE.MeshStandardMaterial({
    color: "#8b5f4f",
    roughness: 0.82,
  })

  const nail = new THREE.MeshPhysicalMaterial({
    color: "#c2b099",
    roughness: 0.52,
  })

  // Translucent 3D tears material
  const tear = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.92,
    ior: 1.333,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })

  return {
    coat,
    pants,
    patch,
    skin,
    hair,
    rust,
    leather,
    thread,
    seam,
    lips,
    nail,
    tear,
    textures,
  }
}
