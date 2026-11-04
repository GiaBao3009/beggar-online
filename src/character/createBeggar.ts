import * as THREE from "three"
import { createCharacterMaterials, noise, seededRandom } from "./materials"
import type { Mood } from "../Beggar"
import { createHead } from "./head"

type Point = [number, number, number]
type Ring = {
  y: number
  width: number
  depth: number
  x?: number
  z?: number
}
const v = (p: Point) => new THREE.Vector3(...p)
const gaussian = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  sx: number,
  sy: number,
) => Math.exp(-1 * (((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2))

export async function createBeggar() {
  const m = createCharacterMaterials()
  const random = seededRandom(9481)
  const root = new THREE.Group()
  root.name = "StreetBeggar"

  const head = new THREE.Group()
  head.name = "HeadRig"
  head.position.set(0.015, 2.43, 0.025)
  head.rotation.z = -0.035
  head.scale.setScalar(1.05)
  root.add(head)

  const skinColor = new THREE.Color()
  function skinShade(x: number, y: number, z: number, face = false) {
    const variation =
      Math.sin(x * 34 + y * 24) * 0.014 + noise(x * 20, y * 30, z * 25) * 0.018
    const age =
      Math.max(0, noise(Math.floor(x * 145), Math.floor(y * 145), 3) - 0.85) *
      0.35
    const warmth = face ? gaussian(x, y, 0, -0.015, 0.115, 0.15) * 0.06 : 0.01
    return skinColor.setRGB(
      0.45 + variation + warmth - age,
      0.30 + variation - age,
      0.21 + variation - age,
      THREE.LinearSRGBColorSpace,
    )
  }

  function mesh(
    geom: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = root,
  ) {
    geom.computeVertexNormals()
    const object = new THREE.Mesh(geom, material)
    object.castShadow = true
    object.receiveShadow = true
    parent.add(object)
    return object
  }

  function geometry(
    positions: number[],
    indices: number[],
    uvs?: number[],
    colors?: number[],
  ) {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    g.setIndex(indices)
    if (uvs) g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
    if (colors)
      g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
    return g
  }

  function skinColors(g: THREE.BufferGeometry) {
    const p = g.getAttribute("position")
    const colors = []
    for (let i = 0; i < p.count; i++) {
      const c = skinShade(p.getX(i), p.getY(i), p.getZ(i))
      colors.push(c.r, c.g, c.b)
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
    return g
  }

  function thread(
    points: Point[],
    material: THREE.Material,
    radius = 0.003,
    parent: THREE.Object3D = root,
  ) {
    return mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map(v)),
        Math.max(8, points.length * 5),
        radius,
        5,
        false,
      ),
      material,
      parent,
    )
  }

  function nail(
    center: Point,
    width: number,
    length: number,
    back: boolean,
    parent: THREE.Object3D = root,
    rotation = 0,
  ) {
    const positions: number[] = [],
      indices: number[] = []
    for (let r = 0; r <= 5; r++) {
      for (let j = 0; j <= 24; j++) {
        const t = r / 5
        const a = (j / 24) * Math.PI * 2
        positions.push(
          Math.sin(a) * width * t,
          Math.cos(a) * length * t,
          (back ? -1 : 1) * 0.003 * (1 - t * t),
        )
        if (r < 5 && j < 24) {
          const n = r * 25 + j
          if (back) indices.push(n, n + 25, n + 1, n + 1, n + 25, n + 26)
          else indices.push(n, n + 1, n + 25, n + 1, n + 26, n + 25)
        }
      }
    }
    const object = mesh(geometry(positions, indices), m.nail, parent)
    object.position.set(...center)
    object.rotation.z = rotation
  }

  function sweep(
    points: Point[],
    radii: number[],
    material: THREE.Material,
    options: {
      parent?: THREE.Object3D
      depth?: number
      folds?: number
      segments?: number
      radial?: number
      skin?: boolean
    } = {},
  ) {
    const curve = new THREE.CatmullRomCurve3(points.map(v))
    const segments = options.segments ?? 60
    const radial = options.radial ?? 36
    const frames = curve.computeFrenetFrames(segments, false)
    const positions: number[] = [],
      indices: number[] = [],
      uvs: number[] = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const center = curve.getPointAt(t)
      const rIndex = t * (radii.length - 1)
      const ri = Math.min(Math.floor(rIndex), radii.length - 2)
      const radius = THREE.MathUtils.lerp(radii[ri], radii[ri + 1], rIndex - ri)
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2
        const fold =
          (options.folds ?? 0) *
          (Math.sin(a * 7 + t * 19) * 0.35 +
            Math.sin(t * 31 + a * 3) *
              (0.08 + Math.sin(t * Math.PI) ** 8) *
              0.24 +
            Math.sin(a * 11 - t * 8) * 0.2)
        const r = Math.max(0.002, radius + fold)
        const p = center
          .clone()
          .addScaledVector(frames.normals[i], Math.cos(a) * r)
          .addScaledVector(
            frames.binormals[i],
            Math.sin(a) * r * (options.depth ?? 1),
          )
        positions.push(p.x, p.y, p.z)
        uvs.push(j / radial, t)
        if (i < segments && j < radial) {
          const n = i * (radial + 1) + j
          indices.push(
            n,
            n + 1,
            n + radial + 1,
            n + 1,
            n + radial + 2,
            n + radial + 1,
          )
        }
      }
    }
    const g = geometry(positions, indices, uvs)
    if (options.skin) skinColors(g)
    return mesh(g, material, options.parent)
  }

  function loft(
    rings: Ring[],
    material: THREE.Material,
    options: {
      parent?: THREE.Object3D
      folds?: number
      skin?: boolean
      radial?: number
      segments?: number
    } = {},
  ) {
    const segments = options.segments ?? 64
    const radial = options.radial ?? 72
    const positions: number[] = [],
      indices: number[] = [],
      uvs: number[] = []
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * (rings.length - 1)
      const r = Math.min(Math.floor(t), rings.length - 2)
      const k = t - r
      const aRing = rings[r]
      const bRing = rings[r + 1]
      const lerp = (a: number, b: number) => THREE.MathUtils.lerp(a, b, k)
      const y = lerp(aRing.y, bRing.y)
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2
        const sag =
          Math.sin(a * 8 + y * 3) * 0.65 + Math.sin(a * 13 - y * 4) * 0.25
        const folds =
          (options.folds ?? 0) * (sag + Math.sin(y * 31 + a * 4) * 0.24)
        const x =
          Math.sin(a) * (lerp(aRing.width, bRing.width) + folds) +
          lerp(aRing.x ?? 0, bRing.x ?? 0)
        const z =
          Math.cos(a) * (lerp(aRing.depth, bRing.depth) + folds) +
          lerp(aRing.z ?? 0, bRing.z ?? 0)
        positions.push(
          x,
          y + Math.sin(a * 5 + 0.6) * (options.folds ?? 0) * 0.3,
          z,
        )
        uvs.push(j / radial, i / segments)
        if (i < segments && j < radial) {
          const n = i * (radial + 1) + j
          indices.push(
            n,
            n + 1,
            n + radial + 1,
            n + 1,
            n + radial + 2,
            n + radial + 1,
          )
        }
      }
    }
    const g = geometry(positions, indices, uvs)
    if (options.skin) skinColors(g)
    return mesh(g, material, options.parent)
  }

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")
  const textureLoader = new THREE.TextureLoader()
  const [scanned, clothColor, clothNormal, clothRoughness] = await Promise.all([
    createHead(m.skin, m.tear),
    textureLoader.loadAsync(`${basePath}/character/cloth-color.jpg`),
    textureLoader.loadAsync(`${basePath}/character/cloth-normal.jpg`),
    textureLoader.loadAsync(`${basePath}/character/cloth-roughness.jpg`),
  ])

  for (const texture of [clothColor, clothNormal, clothRoughness]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2.5, 2)
    texture.anisotropy = 8
  }
  clothColor.colorSpace = THREE.SRGBColorSpace

  for (const material of [m.coat, m.pants, m.patch]) {
    material.map = clothColor
    material.normalMap = clothNormal
    material.normalScale.set(0.24, 0.24)
    material.bumpScale = 0.001
    material.roughnessMap = clothRoughness
    material.sheen = 0.24
  }

  m.coat.color.set("#525345")
  m.pants.color.set("#40443c")
  m.patch.color.set("#918768")
  m.textures.push(clothColor, clothNormal, clothRoughness)

  const { face, updateTears } = scanned
  head.add(face)
  m.textures.push(...scanned.textures)

  // --- Dignified, Realistic Elderly Hairstyle, Beard & Eyebrows ---
  const hairPositions: number[] = []
  const hairIndices: number[] = []
  const hairColors: number[] = []

  function addStrand(points: Point[], radius: number, gray: number) {
    const curve = new THREE.CatmullRomCurve3(points.map(v))
    const segments = 6
    const sides = 4
    const frames = curve.computeFrenetFrames(segments, false)
    const start = hairPositions.length / 3

    for (let i = 0; i <= segments; i++) {
      const p = curve.getPointAt(i / segments)
      const thickness = radius * (1 - 0.88 * (i / segments) ** 1.5)
      for (let j = 0; j <= sides; j++) {
        const a = (j / sides) * Math.PI * 2
        const q = p
          .clone()
          .addScaledVector(frames.normals[i], Math.cos(a) * thickness)
          .addScaledVector(frames.binormals[i], Math.sin(a) * thickness)
        hairPositions.push(q.x, q.y, q.z)
        hairColors.push(gray * 0.95, gray, gray * 0.92)
        if (i < segments && j < sides) {
          const n = start + i * (sides + 1) + j
          hairIndices.push(
            n,
            n + 1,
            n + sides + 1,
            n + 1,
            n + sides + 2,
            n + sides + 1,
          )
        }
      }
    }
  }

  // 1. Natural Distinguished Elderly Hairstyle (Wisps along sides, crown, temples, and nape)
  // Crown and top hair
  for (let i = 0; i < 110; i++) {
    const side = (i % 2 === 0 ? 1 : -1)
    const x0 = side * (0.01 + random() * 0.13)
    const y0 = 0.49 + Math.sin(random() * Math.PI) * 0.08
    const z0 = 0.12 - random() * 0.25
    const len = 0.05 + random() * 0.06
    const curl = (random() - 0.5) * 0.02
    addStrand(
      [
        [x0, y0, z0],
        [x0 + side * 0.012, y0 + 0.008, z0 - len * 0.3 + curl],
        [x0 + side * 0.018 + curl, y0 - len * 0.25, z0 - len * 0.65],
        [x0 + side * 0.014, y0 - len * 0.55, z0 - len * 0.9],
      ],
      0.0022 + random() * 0.0008,
      0.78 + random() * 0.2,
    )
  }

  // Temples, sideburns, and flowing locks down past ears
  for (let i = 0; i < 180; i++) {
    const side = (i % 2 === 0 ? 1 : -1)
    const t = i / 180
    const angle = 0.4 + t * 2.3
    const rHead = 0.19 + Math.sin(t * Math.PI) * 0.03
    const x0 = Math.sin(angle) * rHead * side
    const z0 = Math.cos(angle) * rHead - 0.02
    const y0 = 0.24 + Math.cos(t * Math.PI) * 0.18

    const length = 0.06 + random() * 0.08
    const curl = (random() - 0.5) * 0.018
    addStrand(
      [
        [x0, y0, z0],
        [x0 + side * 0.012, y0 - length * 0.25, z0 - length * 0.25 + curl],
        [x0 + side * 0.018 + curl, y0 - length * 0.6, z0 - length * 0.5],
        [x0 + side * 0.01, y0 - length * 0.95, z0 - length * 0.75],
      ],
      0.0024 + random() * 0.001,
      0.72 + random() * 0.25,
    )
  }

  // Back of head & nape flowing into collar
  for (let i = 0; i < 90; i++) {
    const x0 = (random() - 0.5) * 0.26
    const y0 = 0.20 + random() * 0.24
    const z0 = -0.15 - random() * 0.08
    const len = 0.07 + random() * 0.07
    addStrand(
      [
        [x0, y0, z0],
        [x0 + (random() - 0.5) * 0.01, y0 - len * 0.35, z0 - 0.01],
        [x0 + (random() - 0.5) * 0.015, y0 - len * 0.7, z0 - 0.015],
        [x0 + (random() - 0.5) * 0.02, y0 - len, z0 - 0.02],
      ],
      0.0022 + random() * 0.0008,
      0.70 + random() * 0.25,
    )
  }

  // 2. Weathered Bushy Eyebrows (Left and Right)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 45; i++) {
      const t = i / 45
      const x0 = side * (0.045 + t * 0.11)
      const y0 = 0.215 + Math.sin(t * Math.PI) * 0.018 + (random() - 0.5) * 0.008
      const z0 = 0.40 - t * 0.04 + (random() - 0.5) * 0.008
      const len = 0.022 + random() * 0.016
      addStrand(
        [
          [x0, y0, z0],
          [x0 + side * len * 0.6, y0 + (random() - 0.3) * 0.012, z0 + 0.012],
          [x0 + side * len, y0 - 0.005, z0 + 0.01],
        ],
        0.0016,
        0.75 + random() * 0.22,
      )
    }
  }

  // 3. Realistic Vietnamese Elderly Mustache (Ria mép rủ cong tự nhiên)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 65; i++) {
      const t = i / 65
      const x0 = side * (0.008 + t * 0.085)
      const y0 = -0.065 - t * 0.04 + (random() - 0.5) * 0.006
      const z0 = 0.46 - t * 0.12 + (random() - 0.5) * 0.008
      const len = 0.045 + t * 0.035 + random() * 0.02
      addStrand(
        [
          [x0, y0, z0],
          [x0 + side * len * 0.35, y0 - len * 0.4, z0 + 0.012],
          [x0 + side * len * 0.75, y0 - len * 0.85, z0 + 0.006],
          [x0 + side * len, y0 - len * 1.2, z0],
        ],
        0.0018,
        0.78 + random() * 0.2,
      )
    }
  }

  // 4. Handsome Goatee / Beard (Chòm râu cằm bạc rủ tự nhiên)
  for (let i = 0; i < 110; i++) {
    const t = i / 110
    const x0 = (random() - 0.5) * 0.09
    const y0 = -0.22 - random() * 0.09
    const z0 = 0.36 + (random() - 0.5) * 0.04
    const len = 0.05 + random() * 0.075
    const sway = (random() - 0.5) * 0.015
    addStrand(
      [
        [x0, y0, z0],
        [x0 + sway * 0.5, y0 - len * 0.4, z0 + 0.008],
        [x0 + sway, y0 - len * 0.8, z0 + 0.004],
        [x0 + sway * 1.2, y0 - len * 1.2, z0 - 0.004],
      ],
      0.0017,
      0.82 + random() * 0.16,
    )
  }

  const strandHair = mesh(
    geometry(hairPositions, hairIndices, undefined, hairColors),
    m.hair,
    head,
  )
  strandHair.name = "ElderlyHairStrands"

  // Base hair cap for solid volume beneath wisps (covering crown and back of head)
  const hairCapGeom = new THREE.SphereGeometry(0.228, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.58)
  hairCapGeom.scale(0.97, 1.05, 1.1)

  // Populate vertex color buffer so it matches m.hair PhysicalMaterial
  const capPos = hairCapGeom.getAttribute("position")
  const capColors: number[] = []
  for (let i = 0; i < capPos.count; i++) {
    const yVal = capPos.getY(i)
    const gray = 0.82 + Math.min(0.14, Math.max(0, yVal * 0.3))
    capColors.push(gray * 0.96, gray, gray * 0.94)
  }
  hairCapGeom.setAttribute("color", new THREE.Float32BufferAttribute(capColors, 3))

  const hairCap = new THREE.Mesh(hairCapGeom, m.hair)
  hairCap.position.set(0, 0.38, -0.04)
  hairCap.rotation.x = -0.1
  head.add(hairCap)

  // --- Natural Seated Body & Weathered Peasant Coat ---
  // The coat flows smoothly from the neck all the way down to the lap and mat, eliminating hollow voids!
  loft(
    [
      { y: 2.08, width: 0.18, depth: 0.17 },
      { y: 2.02, width: 0.42, depth: 0.23, z: -0.01 },
      { y: 1.90, width: 0.58, depth: 0.30, z: -0.01 },
      { y: 1.65, width: 0.62, depth: 0.35, z: 0.01 },
      { y: 1.35, width: 0.65, depth: 0.41, z: 0.03 },
      { y: 1.00, width: 0.70, depth: 0.47, z: 0.05 },
      { y: 0.65, width: 0.78, depth: 0.56, z: 0.09 },
      { y: 0.38, width: 0.86, depth: 0.68, z: 0.15 },
      { y: 0.18, width: 0.94, depth: 0.80, z: 0.22 }, // draped securely onto lap
    ],
    m.coat,
    { folds: 0.032, segments: 72, radial: 64 },
  )

  // Traditional lapels & collar
  function ribbon(points: Point[], widths: number[], material: THREE.Material) {
    const curve = new THREE.CatmullRomCurve3(points.map(v))
    const positions: number[] = []
    const indices: number[] = []
    const uvs: number[] = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const p = curve.getPointAt(t)
      const index = t * (widths.length - 1)
      const n = Math.min(Math.floor(index), widths.length - 2)
      const width = THREE.MathUtils.lerp(widths[n], widths[n + 1], index - n)
      for (let j = 0; j <= 6; j++) {
        const s = j / 6
        positions.push(
          p.x + (s - 0.5) * width,
          p.y,
          p.z + Math.sin(s * Math.PI) * 0.015,
        )
        uvs.push(s, t)
        if (i < 40 && j < 6) {
          const k = i * 7 + j
          indices.push(k, k + 7, k + 1, k + 1, k + 7, k + 8)
        }
      }
    }
    return mesh(geometry(positions, indices, uvs), material)
  }

  for (const side of [-1, 1]) {
    ribbon(
      [
        [side * 0.17, 2.06, 0.20],
        [side * 0.28, 1.90, 0.31],
        [side * 0.18, 1.70, 0.37],
        [side * 0.05, 1.50, 0.40],
      ],
      [0.08, 0.14, 0.12, 0.04],
      m.patch,
    )
  }

  // Worn buttons
  for (let i = 0; i < 4; i++) {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.01, 20),
      m.leather,
    )
    button.rotation.x = Math.PI / 2
    button.position.set(0.04 - i * 0.012, 1.44 - i * 0.22, 0.43 + i * 0.015)
    root.add(button)
  }

  // --- Natural Grounded Cross-legged Trousers (Ngồi xếp bằng trên chiếu) ---
  // Right Leg (Knee folds naturally outward, shin crossing across the front)
  sweep(
    [
      [0.32, 0.65, 0.02],
      [0.82, 0.42, 0.28],
      [0.96, 0.28, 0.52],
      [0.55, 0.18, 0.78],
      [-0.10, 0.16, 0.85],
    ],
    [0.26, 0.28, 0.24, 0.19, 0.14],
    m.pants,
    { folds: 0.028, depth: 0.88, segments: 60, radial: 36 },
  )

  // Left Leg (Knee folds naturally outward, shin tucked beneath crossing over)
  sweep(
    [
      [-0.32, 0.62, 0.04],
      [-0.82, 0.40, 0.30],
      [-0.96, 0.26, 0.56],
      [-0.45, 0.20, 0.82],
      [0.25, 0.14, 0.92],
    ],
    [0.27, 0.28, 0.23, 0.18, 0.13],
    m.pants,
    { folds: 0.028, depth: 0.88, segments: 60, radial: 36 },
  )

  // Worn canvas shoes peeking out naturally at ankles
  for (const side of [-1, 1]) {
    const shoe = new THREE.Group()
    shoe.position.set(
      side * 0.42,
      side > 0 ? 0.15 : 0.12,
      side > 0 ? 0.98 : 0.82,
    )
    shoe.rotation.y = side * -0.55
    root.add(shoe)

    sweep(
      [
        [0, 0.035, -0.15],
        [0, 0.04, -0.02],
        [0, 0.01, 0.16],
        [0, -0.03, 0.28],
      ],
      [0.11, 0.13, 0.12, 0.015],
      m.leather,
      { parent: shoe, depth: 0.65, folds: 0.008, segments: 32, radial: 24 },
    )
  }

  // --- Left Arm & Vintage Beggar Cup (Chiếc ca thiếc) ---
  sweep(
    [
      [0.34, 1.80, -0.03],
      [0.74, 1.56, 0.04],
      [0.86, 1.22, 0.26],
    ],
    [0.24, 0.22, 0.20],
    m.coat,
    { folds: 0.025 },
  )
  sweep(
    [
      [0.86, 1.22, 0.26],
      [0.82, 1.15, 0.50],
      [0.74, 1.20, 0.72],
    ],
    [0.20, 0.18, 0.12],
    m.coat,
    { folds: 0.024 },
  )

  // Left hand gripping the cup
  sweep(
    [
      [0.74, 1.20, 0.70],
      [0.82, 1.22, 0.80],
      [0.83, 1.26, 0.90],
    ],
    [0.08, 0.095, 0.065],
    m.skin,
    { skin: true, depth: 0.7 },
  )

  for (let i = 0; i < 4; i++) {
    const y = 1.33 - i * 0.048
    sweep(
      [
        [0.82, y, 0.82],
        [0.84, y + 0.006, 0.96],
        [0.75, y + 0.006, 1.04],
        [0.64 + i * 0.012, y - 0.006, 1.00],
      ],
      [0.021, 0.022, 0.020, 0.017, 0.015, 0.011, 0.002],
      m.skin,
      { skin: true, radial: 16, segments: 24 },
    )
    nail([0.655 + i * 0.012, y, 1.03], 0.011, 0.017, false, root, Math.PI / 2)
  }

  // Vintage dented tin cup
  const cupProfile = [
    new THREE.Vector2(0.005, -0.215),
    new THREE.Vector2(0.137, -0.215),
    new THREE.Vector2(0.15, -0.2),
    new THREE.Vector2(0.187, 0.195),
    new THREE.Vector2(0.192, 0.212),
    new THREE.Vector2(0.181, 0.217),
    new THREE.Vector2(0.176, 0.195),
    new THREE.Vector2(0.14, -0.19),
    new THREE.Vector2(0.005, -0.19),
  ]
  const cupGeometry = new THREE.LatheGeometry(cupProfile, 48)
  const cupPos = cupGeometry.getAttribute("position")
  for (let i = 0; i < cupPos.count; i++) {
    const x = cupPos.getX(i)
    const y = cupPos.getY(i)
    const z = cupPos.getZ(i)
    const a = Math.atan2(x, z)
    const dent =
      1 - 0.035 * Math.sin(a * 3 + y * 8) - 0.025 * Math.cos(a * 7 - y * 10)
    cupPos.setXYZ(i, x * dent, y, z * dent)
  }
  const cup = mesh(cupGeometry, m.rust)
  cup.position.set(0.65, 1.25, 0.87)
  cup.rotation.z = -0.1

  // Cup handle
  thread(
    [
      [0.46, 1.39, 0.87],
      [0.34, 1.37, 0.87],
      [0.33, 1.16, 0.87],
      [0.47, 1.14, 0.87],
    ],
    m.rust,
    0.02,
  )

  // --- Right Emoting / Waving Arm ---
  sweep(
    [
      [-0.32, 1.81, -0.015],
      [-0.72, 1.75, 0.02],
      [-0.98, 1.58, 0.10],
    ],
    [0.24, 0.22, 0.20],
    m.coat,
    { folds: 0.025 },
  )
  sweep(
    [
      [-0.98, 1.58, 0.10],
      [-1.06, 1.86, 0.18],
      [-1.06, 2.18, 0.22],
    ],
    [0.20, 0.17, 0.11],
    m.coat,
    { folds: 0.024 },
  )

  const waving = new THREE.Group()
  waving.name = "WavingHand"
  waving.position.set(-1.06, 2.18, 0.22)
  root.add(waving)

  // Palm
  loft(
    [
      { y: -0.035, width: 0.065, depth: 0.038 },
      { y: 0.04, width: 0.078, depth: 0.04 },
      { y: 0.13, width: 0.115, depth: 0.037 },
      { y: 0.22, width: 0.103, depth: 0.03 },
      { y: 0.25, width: 0.081, depth: 0.021 },
    ],
    m.skin,
    { parent: waving, skin: true, radial: 36, segments: 24 },
  )

  // Fingers
  for (let i = 0; i < 4; i++) {
    const x = -0.076 + i * 0.051
    const length = [0.175, 0.21, 0.198, 0.155][i]
    const spread = (i - 1.4) * 0.022
    sweep(
      [
        [x, 0.21, 0],
        [x + spread * 0.35, 0.26 + length * 0.25, 0.008],
        [x + spread * 0.8, 0.26 + length * 0.63, 0.004],
        [x + spread, 0.24 + length, -0.012],
      ],
      [0.023, 0.022, 0.020, 0.017, 0.014, 0.002],
      m.skin,
      { parent: waving, skin: true, segments: 24, radial: 16, depth: 0.82 },
    )
  }

  // Thumb
  sweep(
    [
      [0.07, 0.065, 0.005],
      [0.13, 0.105, 0.015],
      [0.18, 0.16, 0.018],
      [0.195, 0.21, 0.005],
    ],
    [0.038, 0.031, 0.025, 0.003],
    m.skin,
    { parent: waving, skin: true, segments: 24, radial: 16, depth: 0.85 },
  )

  // --- Animation & Emotion Update Loop ---
  let currentSadFactor = 0
  let currentHappyFactor = 0
  let currentSurpriseFactor = 0

  return {
    root,
    head,
    update(
      time: number,
      mood: Mood,
      mouseX: number,
      mouseY: number,
      reduced: boolean,
    ) {
      const dt = reduced ? 1 : 0.08
      const isSad = mood === "sad"
      const isRich = mood === "rich"
      const isHappy = mood === "happy" || isRich

      // Target emotion factors
      const targetSad = isSad ? 1.0 : 0.0
      const targetHappy = isHappy ? (isRich ? 1.0 : 0.9) : (mood === "excited" ? 0.45 : 0.08)
      const targetSurprise = isRich ? 0.95 : 0.0

      currentSadFactor = THREE.MathUtils.lerp(currentSadFactor, targetSad, dt)
      currentHappyFactor = THREE.MathUtils.lerp(currentHappyFactor, targetHappy, dt)
      currentSurpriseFactor = THREE.MathUtils.lerp(currentSurpriseFactor, targetSurprise, dt)

      // Apply morph targets to scanned face
      if (face.morphTargetInfluences) {
        face.morphTargetInfluences[0] = currentHappyFactor
        face.morphTargetInfluences[1] = currentSadFactor
        face.morphTargetInfluences[2] = currentSurpriseFactor

        // Natural eye blinks
        const blinkPhase = time % 4.8
        const blink =
          reduced
            ? 0
            : blinkPhase < 0.12
              ? blinkPhase / 0.12
              : blinkPhase < 0.26
                ? 1 - (blinkPhase - 0.12) / 0.14
                : 0
        face.morphTargetInfluences[3] = blink
      }

      // Update 3D animated tears streaming down cheeks
      updateTears(currentSadFactor, time)

      // 1. HAPPY (Laughter & Chuckles Animation):
      // Chuckle pulse: head bobs rhythmically, shoulders bounce, wide friendly wave
      const laughPulse = Math.sin(time * 9.5) * currentHappyFactor
      const chuckleWave = Math.sin(time * 4.5)

      // 2. SAD (Heartbreaking Sobbing Animation):
      // Head droops low in grief, shudders with silent weeping, chest heaves
      const sobHeave = Math.sin(time * 2.8)
      const sobTremble = Math.sin(time * 16) * currentSadFactor * 0.007

      // Head rotations & postures
      head.rotation.x = THREE.MathUtils.lerp(
        head.rotation.x,
        isSad
          ? 0.32 + Math.sin(time * 2.8) * 0.02
          : isRich
            ? -0.15 + laughPulse * 0.03
            : -0.035 + mouseY * 0.8 + (!reduced && isHappy ? laughPulse * 0.035 : 0),
        dt,
      )

      head.rotation.y = THREE.MathUtils.lerp(
        head.rotation.y,
        isSad
          ? 0.08 + sobTremble
          : mouseX * 0.65 - 0.04 + (!reduced && isHappy ? Math.sin(time * 2.5) * 0.02 : 0),
        dt,
      )

      head.rotation.z = THREE.MathUtils.lerp(
        head.rotation.z,
        isSad ? 0.09 + sobTremble : -0.035 + (reduced ? 0 : Math.sin(time * 1.1) * 0.015),
        dt,
      )

      // Head bobbing position (laughter bounce vs sobbing drop)
      head.position.y = THREE.MathUtils.lerp(
        head.position.y,
        isSad
          ? 2.38 - (sobHeave > 0 ? sobHeave * 0.025 : 0)
          : 2.43 + laughPulse * 0.018,
        dt,
      )

      // Waving hand gestures
      waving.rotation.z = THREE.MathUtils.lerp(
        waving.rotation.z,
        isSad
          ? -0.48 + sobTremble * 2
          : isRich
            ? 0.15 + chuckleWave * 0.28
            : isHappy
              ? 0.08 + chuckleWave * 0.18
              : 0.03 + Math.sin(time * 3.2) * 0.11,
        dt,
      )

      waving.rotation.x = reduced
        ? 0.08
        : isSad
          ? 0.28
          : 0.08 + Math.sin(time * 1.8) * 0.04

      // Gentle chest & root breathing
      root.position.y = reduced
        ? 0
        : isSad
          ? (sobHeave > 0 ? sobHeave * 0.015 : 0)
          : Math.sin(time * 1.5) * 0.005 + laughPulse * 0.006
    },
    dispose() {
      m.textures.forEach((texture) => texture.dispose())
    },
  }
}
