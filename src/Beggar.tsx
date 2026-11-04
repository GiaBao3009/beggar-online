import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { createBeggar } from "./character/createBeggar"

export type Mood = "wave" | "happy" | "rich" | "sad" | "excited"

interface BeggarProps {
  mood: Mood
  onInteract?: (type: "head" | "body" | "bowl") => void
}

export default function Beggar({ mood, onInteract }: BeggarProps) {
  const host = useRef<HTMLDivElement>(null)
  const currentMood = useRef(mood)
  const onInteractRef = useRef(onInteract)
  const [failure, setFailure] = useState("")

  useEffect(() => {
    currentMood.current = mood
  }, [mood])

  useEffect(() => {
    onInteractRef.current = onInteract
  }, [onInteract])

  useEffect(() => {
    if (!host.current) return
    const container = host.current
    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      setFailure("Trình duyệt cần WebGL để gặp ông.")
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.set(0, 3.3, 9.7)
    camera.lookAt(0, 1.8, 0)

    const environment = new RoomEnvironment()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environmentMap = pmrem.fromScene(environment, 0.06)
    scene.environment = environmentMap.texture
    scene.environmentIntensity = 0.32
    environment.dispose()
    pmrem.dispose()

    scene.add(new THREE.HemisphereLight(0xe1d6bd, 0x32372b, 1.0))
    const key = new THREE.DirectionalLight(0xffddb0, 3.6)
    key.position.set(-3, 7, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -5
    key.shadow.camera.right = 5
    key.shadow.camera.top = 6
    key.shadow.camera.bottom = -4
    key.shadow.normalBias = 0.012
    key.shadow.bias = -0.0001
    key.shadow.radius = 4
    scene.add(key)

    const rim = new THREE.DirectionalLight(0xd6d9cb, 2.1)
    rim.position.set(4, 4, -3)
    scene.add(rim)

    const fill = new THREE.DirectionalLight(0xc6c9bb, 0.45)
    fill.position.set(2, 3, 5)
    scene.add(fill)

    let active = true
    let dirty = true
    let character: Awaited<ReturnType<typeof createBeggar>> | undefined
    container.dataset.character = "loading"

    const disposeMeshes = (parent: THREE.Object3D) => {
      const materials = new Set<THREE.Material>()
      parent.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material]
          list.forEach((material) => materials.add(material))
        }
      })
      materials.forEach((material) => material.dispose())
    }

    void createBeggar()
      .then((value) => {
        if (!active) {
          value.dispose()
          disposeMeshes(value.root)
          return
        }
        character = value
        scene.add(character.root)
        dirty = true
        container.dataset.character = "ready"
      })
      .catch((err) => {
        console.error("Failed to create beggar:", err)
        if (active) {
          container.dataset.character = "error"
          setFailure("Không tải được nhân vật. Con thử tải lại trang nhé.")
        }
      })

    const mat = (color: string, roughness = 0.85) =>
      new THREE.MeshStandardMaterial({ color, roughness })

    function line(
      points: number[][],
      material: THREE.Material,
      radius = 0.003,
    ) {
      const curve = new THREE.CatmullRomCurve3(
        points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
      )
      const object = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 20, radius, 6, false),
        material,
      )
      scene.add(object)
    }

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.035, 2.6),
      mat("#967246"),
    )
    board.position.set(0, 0.035, 0.1)
    board.rotation.y = -0.13
    board.receiveShadow = true
    scene.add(board)

    for (let i = 0; i < 12; i++) {
      line(
        [
          [-1.7, 0.058, -1 + i * 0.2],
          [1.65, 0.058, -1 + i * 0.2],
        ],
        mat("#84643e"),
      )
    }

    const cupMaterial = new THREE.MeshStandardMaterial({
      color: "#837967",
      metalness: 0.65,
      roughness: 0.47,
    })

    const bowl = new THREE.Mesh(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.27, 0.015),
          new THREE.Vector2(0.39, 0.1),
          new THREE.Vector2(0.46, 0.31),
          new THREE.Vector2(0.43, 0.32),
          new THREE.Vector2(0.35, 0.12),
          new THREE.Vector2(0.1, 0.06),
        ],
        48,
      ),
      cupMaterial,
    )
    bowl.position.set(0.15, 0.08, 1.4)
    bowl.castShadow = true
    scene.add(bowl)

    for (let i = 0; i < 7; i++) {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.012, 20),
        mat(i % 2 ? "#99834c" : "#b5a572", 0.4),
      )
      coin.position.set(
        -0.8 + Math.sin(i * 13) * 1.1,
        0.075,
        0.7 + Math.cos(i * 7) * 0.7,
      )
      scene.add(coin)
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.5 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const occlusionCanvas = document.createElement("canvas")
    occlusionCanvas.width = occlusionCanvas.height = 128
    const ctx = occlusionCanvas.getContext("2d")!
    const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
    gradient.addColorStop(0, "rgba(15,18,11,0.65)")
    gradient.addColorStop(0.5, "rgba(15,18,11,0.32)")
    gradient.addColorStop(1, "rgba(15,18,11,0)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    const occlusionTexture = new THREE.CanvasTexture(occlusionCanvas)

    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.1),
      new THREE.MeshBasicMaterial({
        map: occlusionTexture,
        transparent: true,
        depthWrite: false,
      }),
    )
    contact.rotation.x = -Math.PI / 2
    contact.position.set(0, 0.061, 0.35)
    scene.add(contact)

    let mouseX = 0
    let mouseY = 0
    const onMove = (event: PointerEvent) => {
      const r = container.getBoundingClientRect()
      mouseX = ((event.clientX - r.left) / r.width - 0.5) * 0.2
      mouseY = ((event.clientY - r.top) / r.height - 0.5) * 0.1
      dirty = true
    }
    container.addEventListener("pointermove", onMove)

    // Raycaster for direct touch / click interaction: "CHẠM MỘT CÁI, ÔNG DIỄN LIỀN!"
    const raycaster = new THREE.Raycaster()
    const mouseCoord = new THREE.Vector2()

    const onClick = (event: MouseEvent) => {
      if (!character) return
      const r = container.getBoundingClientRect()
      mouseCoord.x = ((event.clientX - r.left) / r.width) * 2 - 1
      mouseCoord.y = -((event.clientY - r.top) / r.height) * 2 + 1
      raycaster.setFromCamera(mouseCoord, camera)

      const intersects = raycaster.intersectObjects([character.root, bowl], true)
      if (intersects.length > 0) {
        const hit = intersects[0].object
        let type: "head" | "body" | "bowl" = "body"
        if (hit === bowl) {
          type = "bowl"
        } else {
          let cur: THREE.Object3D | null = hit
          while (cur && cur !== character.root) {
            if (cur === character.head || cur.name === "HeadRig" || cur.name === "ElderlyFace") {
              type = "head"
              break
            }
            cur = cur.parent
          }
        }
        onInteractRef.current?.(type)
      }
    }
    container.addEventListener("click", onClick)

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      dirty = true
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const clock = new THREE.Clock()
    let frame = 0
    let visible = true
    let lastMood: Mood | undefined

    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { rootMargin: "150px" },
    )
    visibility.observe(container)

    const render = () => {
      frame = requestAnimationFrame(render)
      if (!visible || document.hidden) return
      if (reduced && !dirty && lastMood === currentMood.current) return
      dirty = false
      lastMood = currentMood.current

      character?.update(
        clock.getElapsedTime(),
        currentMood.current,
        mouseX,
        mouseY,
        reduced,
      )
      renderer.render(scene, camera)
    }
    render()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      container.removeEventListener("pointermove", onMove)
      container.removeEventListener("click", onClick)
      active = false
      character?.dispose()
      occlusionTexture.dispose()
      environmentMap.dispose()
      key.shadow.dispose()
      disposeMeshes(scene)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div
      ref={host}
      className={`beggar-canvas mood-${mood}`}
      role="img"
      aria-label={`Ông già 3D ngồi trên bìa carton, ${
        mood === "sad" ? "đang buồn khóc" : mood === "happy" ? "đang cười tươi roi rói" : "vẫy tay và cầm ca xin tiền"
      }`}
      style={{ cursor: "pointer" }}
    >
      {failure && (
        <div className="canvas-fallback">
          Ông đang nghỉ chân...
          <br />
          {failure}
        </div>
      )}
    </div>
  )
}
