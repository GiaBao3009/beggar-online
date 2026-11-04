import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

const gaussian = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  sx: number,
  sy: number,
) => Math.exp(-1 * (((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2))

export async function createHead(
  baseMaterial: THREE.MeshPhysicalMaterial,
  tearMaterial: THREE.MeshPhysicalMaterial,
) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")
  const loader = new THREE.TextureLoader()
  const [gltf, albedo, normal, age] = await Promise.all([
    new GLTFLoader().loadAsync(`${basePath}/character/head.glb`),
    loader.loadAsync(`${basePath}/character/head-aged.jpg`),
    loader.loadAsync(`${basePath}/character/head-normal.jpg`),
    loader.loadAsync(`${basePath}/character/head-age-height.jpg`),
  ])

  const source = gltf.scene.getObjectByName("LeePerrySmith") as THREE.Mesh
  const geometry = source.geometry.clone()
  source.geometry.dispose()
  const sourceMaterials = Array.isArray(source.material)
    ? source.material
    : [source.material]
  sourceMaterials.forEach((material) => material.dispose())

  geometry.scale(0.2, 0.2, 0.2)
  geometry.translate(0, -0.2, 0)
  const positions = geometry.getAttribute("position")

  const happy: number[] = []
  const sad: number[] = []
  const surprise: number[] = []
  const blink: number[] = []

  // Create highly emotive, realistic facial morph targets
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const absX = Math.abs(x)
    const facing = THREE.MathUtils.smoothstep(z, 0.12, 0.32)

    // Structural elderly adjustments (sunken temples, slight cheek sag, weathered brow)
    const hollow = gaussian(absX, y, 0.19, -0.04, 0.06, 0.12) * 0.016 * facing
    const jowl = gaussian(absX, y, 0.18, -0.28, 0.08, 0.08) * 0.014 * facing
    const agedY = y - gaussian(absX, y, 0.16, -0.18, 0.1, 0.13) * 0.014 * facing
    positions.setXYZ(i, x, agedY, z - hollow + jowl)

    // Key facial regions for expression
    const mouthCorner = gaussian(absX, y, 0.10, -0.135, 0.05, 0.045) * facing
    const mouthCenter = gaussian(x, y, 0, -0.135, 0.065, 0.045) * facing
    const cheek = gaussian(absX, y, 0.15, -0.02, 0.075, 0.065) * facing
    const lowerLid = gaussian(absX, y, 0.105, 0.125, 0.055, 0.035) * facing
    const upperLid = gaussian(absX, y, 0.105, 0.16, 0.055, 0.035) * facing
    const innerBrow = gaussian(absX, y, 0.055, 0.22, 0.055, 0.045) * facing
    const outerBrow = gaussian(absX, y, 0.15, 0.20, 0.065, 0.045) * facing
    const chin = gaussian(x, y, 0, -0.29, 0.085, 0.065) * facing

    // 1. HAPPY (Joyful elderly smile / laughter):
    // Corners lift and widen, mouth opens with lower lip dropping, cheeks puff high and round, eyes crinkle warmly
    const happyX = Math.sign(x) * mouthCorner * 0.032 + Math.sign(x) * cheek * 0.012
    const happyY =
      mouthCorner * 0.065 -
      mouthCenter * 0.042 +
      cheek * 0.04 +
      lowerLid * 0.028 +
      innerBrow * 0.022 +
      outerBrow * 0.015
    const happyZ = -mouthCorner * 0.016 + cheek * 0.036 + chin * 0.012
    happy.push(happyX, happyY, happyZ)

    // 2. SAD (Heartbreaking weeping / sobbing):
    // Inner eyebrows pull high up and inward, mouth corners pull down into a deep frown, lower lip pouts, chin crinkles up
    const sadX = -Math.sign(x) * mouthCorner * 0.014 - Math.sign(x) * innerBrow * 0.012
    const sadY =
      -mouthCorner * 0.065 +
      innerBrow * 0.075 -
      outerBrow * 0.04 +
      chin * 0.038 -
      mouthCenter * 0.015 -
      cheek * 0.02
    const sadZ = chin * 0.028 + mouthCenter * 0.022 - cheek * 0.015
    sad.push(sadX, sadY, sadZ)

    // 3. SURPRISE (Shocked / 100k donation astonishment):
    // Jaw drops wide open, eyebrows arch high up, eyes open wide
    const surpriseX = 0
    const surpriseY =
      -mouthCenter * 0.075 -
      chin * 0.06 +
      innerBrow * 0.07 +
      outerBrow * 0.065 -
      lowerLid * 0.025 +
      upperLid * 0.025
    const surpriseZ = -mouthCenter * 0.035
    surprise.push(surpriseX, surpriseY, surpriseZ)

    // 4. BLINK:
    // Upper lids glide down over eyeballs
    blink.push(0, -upperLid * 0.048, 0)
  }

  const index = geometry.getIndex()!
  const cropped: number[] = []
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i)
    const b = index.getX(i + 1)
    const c = index.getX(i + 2)
    if (
      Math.min(positions.getY(a), positions.getY(b), positions.getY(c)) > -0.42
    ) {
      cropped.push(a, b, c)
    }
  }
  geometry.setIndex(cropped)
  geometry.morphTargetsRelative = true
  geometry.morphAttributes.position = [happy, sad, surprise, blink].map(
    (p) => new THREE.Float32BufferAttribute(p, 3),
  )
  geometry.computeVertexNormals()

  const skin = baseMaterial.clone()
  skin.vertexColors = false
  skin.color.set("#d8cbbe")
  skin.map = albedo
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.anisotropy = 8
  skin.normalMap = normal
  skin.normalScale.set(0.65, 0.65)
  skin.bumpMap = age
  skin.bumpScale = 0.009
  skin.roughness = 0.76
  skin.specularIntensity = 0.28
  skin.onBeforeCompile = baseMaterial.onBeforeCompile

  const face = new THREE.Mesh(geometry, skin)
  face.name = "ElderlyFace"
  face.castShadow = face.receiveShadow = true

  // --- Real 3D Animated Tears System ---
  const tearsGroup = new THREE.Group()
  tearsGroup.name = "TearsGroup"

  // Create curved tear paths along cheeks
  const leftTearCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.095, 0.11, 0.33),
    new THREE.Vector3(-0.11, 0.03, 0.355),
    new THREE.Vector3(-0.12, -0.06, 0.345),
    new THREE.Vector3(-0.115, -0.15, 0.305),
    new THREE.Vector3(-0.08, -0.24, 0.34),
  ])

  const rightTearCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.095, 0.11, 0.33),
    new THREE.Vector3(0.11, 0.03, 0.355),
    new THREE.Vector3(0.12, -0.06, 0.345),
    new THREE.Vector3(0.115, -0.15, 0.305),
    new THREE.Vector3(0.08, -0.24, 0.34),
  ])

  // Wet trails on cheeks
  const leftTrailGeom = new THREE.TubeGeometry(leftTearCurve, 24, 0.0025, 6, false)
  const rightTrailGeom = new THREE.TubeGeometry(rightTearCurve, 24, 0.0025, 6, false)
  const leftTrail = new THREE.Mesh(leftTrailGeom, tearMaterial)
  const rightTrail = new THREE.Mesh(rightTrailGeom, tearMaterial)
  tearsGroup.add(leftTrail, rightTrail)

  // Animated tear droplets
  const dropGeom = new THREE.SphereGeometry(0.0075, 12, 12)
  dropGeom.scale(1, 1.4, 0.8)

  const leftDrop1 = new THREE.Mesh(dropGeom, tearMaterial)
  const leftDrop2 = new THREE.Mesh(dropGeom, tearMaterial)
  const rightDrop1 = new THREE.Mesh(dropGeom, tearMaterial)
  const rightDrop2 = new THREE.Mesh(dropGeom, tearMaterial)
  tearsGroup.add(leftDrop1, leftDrop2, rightDrop1, rightDrop2)

  face.add(tearsGroup)

  function updateTears(sadFactor: number, time: number) {
    tearMaterial.opacity = THREE.MathUtils.lerp(tearMaterial.opacity, sadFactor * 0.92, 0.1)
    if (tearMaterial.opacity < 0.02) {
      tearsGroup.visible = false
      return
    }
    tearsGroup.visible = true

    // Animate tear drops sliding down the cheek curves
    const t1 = (time * 0.6) % 1
    const t2 = (time * 0.6 + 0.5) % 1

    const pL1 = leftTearCurve.getPointAt(t1)
    const pL2 = leftTearCurve.getPointAt(t2)
    const pR1 = rightTearCurve.getPointAt((time * 0.55 + 0.2) % 1)
    const pR2 = rightTearCurve.getPointAt((time * 0.55 + 0.7) % 1)

    leftDrop1.position.copy(pL1)
    leftDrop2.position.copy(pL2)
    rightDrop1.position.copy(pR1)
    rightDrop2.position.copy(pR2)

    // Scale droplets as they form and fall
    const s1 = Math.sin(t1 * Math.PI) * 1.2
    const s2 = Math.sin(t2 * Math.PI) * 1.1
    leftDrop1.scale.set(s1, s1 * 1.4, s1 * 0.8)
    leftDrop2.scale.set(s2, s2 * 1.4, s2 * 0.8)
    rightDrop1.scale.set(s1, s1 * 1.4, s1 * 0.8)
    rightDrop2.scale.set(s2, s2 * 1.4, s2 * 0.8)
  }

  // UV-space lookup attaches individual facial hairs directly to the scanned skin
  const uvBuckets = new Map<string, number[]>()
  const uv = geometry.getAttribute("uv")
  for (let i = 0; i < positions.count; i++) {
    const key = `${Math.floor(uv.getX(i) * 64)},${Math.floor(uv.getY(i) * 64)}`
    const bucket = uvBuckets.get(key) ?? []
    bucket.push(i)
    uvBuckets.set(key, bucket)
  }

  function pointAtUV(u: number, v: number) {
    const bx = Math.floor(u * 64)
    const by = Math.floor(v * 64)
    const neighbors: { index: number; distance: number }[] = []
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        for (const index of uvBuckets.get(`${bx + dx},${by + dy}`) ?? []) {
          neighbors.push({
            index,
            distance: (uv.getX(index) - u) ** 2 + (uv.getY(index) - v) ** 2,
          })
        }
      }
    }
    neighbors.sort((a, b) => a.distance - b.distance)
    const result = new THREE.Vector3()
    let total = 0
    for (const { index, distance } of neighbors.slice(0, 4)) {
      const weight = 1 / Math.max(0.000001, distance)
      result.addScaledVector(
        new THREE.Vector3().fromBufferAttribute(positions, index),
        weight,
      )
      total += weight
    }
    return result.divideScalar(total || 1)
  }

  return {
    face,
    positions,
    pointAtUV,
    updateTears,
    textures: [albedo, normal, age],
  }
}
