import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <canvas id="farm-canvas"></canvas>
  <section class="hud">
    <div class="hud__header">
      <h1>Granjita interactiva</h1>
      <p class="status" data-status>Haz clic en el caballo para montarlo.</p>
    </div>
    <p data-tip>Usa el mouse para explorar. Presiona <kbd>Esc</kbd> para bajar del caballo.</p>
    <ul class="actions">
      <li><strong>W / ↑</strong> Avanza</li>
      <li><strong>S / ↓</strong> Retrocede suave</li>
      <li><strong>A / ←</strong> Gira a la izquierda</li>
      <li><strong>D / →</strong> Gira a la derecha</li>
      <li><strong>Espacio</strong> Galope más rápido</li>
    </ul>
  </section>
`

const canvas = document.getElementById('farm-canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)
scene.fog = new THREE.Fog(0x87ceeb, 45, 160)

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  400
)
camera.position.set(25, 18, 25)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 2, 0)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI / 2.1

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x2f7a0b, 0.85)
scene.add(hemiLight)

const sun = new THREE.DirectionalLight(0xfff4c1, 1.1)
sun.position.set(35, 50, 20)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -60
sun.shadow.camera.right = 60
sun.shadow.camera.top = 60
sun.shadow.camera.bottom = -60
scene.add(sun)

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x6ab04c })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const dirtPath = new THREE.Mesh(
  new THREE.BoxGeometry(60, 0.2, 6),
  new THREE.MeshStandardMaterial({ color: 0xc49b63 })
)
dirtPath.position.set(0, 0.05, 0)
dirtPath.receiveShadow = true
scene.add(dirtPath)

const addField = (x, z, color) => {
  const field = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.4, 16),
    new THREE.MeshStandardMaterial({ color })
  )
  field.position.set(x, 0.2, z)
  field.receiveShadow = true
  scene.add(field)
}

addField(-18, -18, 0xa66a2c)
addField(-5, -18, 0xc97c38)
addField(8, -18, 0xa66a2c)

const addTree = (x, z) => {
  const tree = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.8, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  )
  trunk.position.y = 2
  trunk.castShadow = true
  trunk.receiveShadow = true

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
  )
  leaves.position.y = 4.3
  leaves.castShadow = true

  tree.add(trunk)
  tree.add(leaves)
  tree.position.set(x, 0, z)
  scene.add(tree)
}

;[
  [-25, 10],
  [-30, -5],
  [30, 5],
  [22, -12],
  [28, -25],
  [-15, 25]
].forEach(([x, z]) => addTree(x, z))

const createFence = (size = 40) => {
  const fenceGroup = new THREE.Group()
  const postGeometry = new THREE.BoxGeometry(0.4, 2.8, 0.4)
  const railGeometry = new THREE.BoxGeometry(size * 2, 0.25, 0.25)
  const material = new THREE.MeshStandardMaterial({ color: 0xe1c699 })

  for (let i = -size; i <= size; i += 4) {
    const postFront = new THREE.Mesh(postGeometry, material)
    postFront.position.set(i, 1.4, size)
    postFront.castShadow = true
    fenceGroup.add(postFront)

    const postBack = postFront.clone()
    postBack.position.z = -size
    fenceGroup.add(postBack)

    if (i === -size || i === size) {
      const postLeft = postFront.clone()
      postLeft.position.set(size, 1.4, i)
      fenceGroup.add(postLeft)

      const postRight = postFront.clone()
      postRight.position.set(-size, 1.4, i)
      fenceGroup.add(postRight)
    }
  }

  const frontRail = new THREE.Mesh(railGeometry, material)
  frontRail.position.set(0, 2.1, size)
  frontRail.castShadow = true
  fenceGroup.add(frontRail)

  const backRail = frontRail.clone()
  backRail.position.z = -size
  fenceGroup.add(backRail)

  const sideRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, size * 2),
    material
  )
  sideRail.position.set(size, 2.1, 0)
  sideRail.castShadow = true
  fenceGroup.add(sideRail)

  const sideRailOpp = sideRail.clone()
  sideRailOpp.position.x = -size
  fenceGroup.add(sideRailOpp)

  scene.add(fenceGroup)
}

createFence(32)

const createAnimal = ({ bodyColor, accentColor, scale }) => {
  const group = new THREE.Group()
  const matBody = new THREE.MeshStandardMaterial({ color: bodyColor })
  const matAccent = new THREE.MeshStandardMaterial({
    color: accentColor ?? bodyColor
  })

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1, 1).scale(scale, scale, scale),
    matBody
  )
  body.position.y = 0.9 * scale
  body.castShadow = true
  group.add(body)

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.8).scale(scale, scale, scale),
    matBody
  )
  head.position.set(1.2 * scale, 1.3 * scale, 0)
  head.castShadow = true
  group.add(head)

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.4, 0.5).scale(scale, scale, scale),
    matAccent
  )
  snout.position.set(1.55 * scale, 1.1 * scale, 0)
  snout.castShadow = true
  group.add(snout)

  const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3).scale(
    scale,
    scale,
    scale
  )
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2f1b })
  const legOffsets = [
    [-0.6, 0, -0.3],
    [0.6, 0, -0.3],
    [-0.6, 0, 0.3],
    [0.6, 0, 0.3]
  ]

  legOffsets.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial)
    leg.position.set(x * scale, 0.4 * scale, z * scale)
    leg.castShadow = true
    group.add(leg)
  })

  return group
}

const animals = [
  { bodyColor: 0xffffff, accentColor: 0xffc0cb, scale: 1, position: [-10, -6] },
  { bodyColor: 0xf8a5c2, accentColor: 0xffd1dc, scale: 0.9, position: [-6, -9] },
  { bodyColor: 0xf9f7cf, accentColor: 0xf6e58d, scale: 0.6, position: [4, -5] },
  { bodyColor: 0xc7ecee, accentColor: 0x95afc0, scale: 0.85, position: [7, -8] }
]

animals.forEach((config) => {
  const animal = createAnimal(config)
  animal.position.set(config.position[0], 0, config.position[1])
  scene.add(animal)
})

const createHorse = () => {
  const group = new THREE.Group()
  const coat = new THREE.MeshStandardMaterial({ color: 0x8d5524 })
  const maneMat = new THREE.MeshStandardMaterial({ color: 0x2f1b0c })
  const saddleMat = new THREE.MeshStandardMaterial({ color: 0x3c3b3d })

  const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 0.9), coat)
  body.position.y = 1.7
  body.castShadow = true
  group.add(body)

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.7), coat)
  neck.position.set(1.7, 2.2, 0)
  neck.rotation.z = -0.2
  neck.castShadow = true
  group.add(neck)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.6), coat)
  head.position.set(2.4, 2.5, 0)
  head.castShadow = true
  group.add(head)

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), saddleMat)
  muzzle.position.set(2.8, 2.3, 0)
  muzzle.castShadow = true
  group.add(muzzle)

  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.8), maneMat)
  mane.position.set(1.1, 2.5, 0)
  mane.castShadow = true
  group.add(mane)

  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.4, 2, 8),
    maneMat
  )
  tail.position.set(-1.5, 1.4, 0)
  tail.rotation.x = Math.PI / 10
  tail.castShadow = true
  group.add(tail)

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.9), saddleMat)
  saddle.position.set(0.2, 2.4, 0)
  saddle.castShadow = true
  group.add(saddle)

  const stirrupGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 12)
  const stirrupMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ea })
  const stirrupL = new THREE.Mesh(stirrupGeo, stirrupMat)
  stirrupL.rotation.x = Math.PI / 2
  stirrupL.position.set(0.4, 1.7, 0.55)
  group.add(stirrupL)
  const stirrupR = stirrupL.clone()
  stirrupR.position.z = -0.55
  group.add(stirrupR)

  const legGeometry = new THREE.BoxGeometry(0.35, 1.6, 0.35)
  const legPositions = [
    [1, 0.8, 0.3],
    [-0.8, 0.8, 0.3],
    [1, 0.8, -0.3],
    [-0.8, 0.8, -0.3]
  ]

  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, coat)
    leg.position.set(x, y, z)
    leg.castShadow = true
    group.add(leg)
  })

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = child.receiveShadow ?? false
    }
  })

  return group
}

const horse = createHorse()
horse.position.set(-4, 0, 4)
scene.add(horse)

const statusLabel = document.querySelector('[data-status]')
const tipLabel = document.querySelector('[data-tip]')

let isMounted = false
const pressedKeys = new Set()
const clock = new THREE.Clock()
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const upAxis = new THREE.Vector3(0, 1, 0)
const cameraOffset = new THREE.Vector3(0, 4, 8)
const lookOffset = new THREE.Vector3(0, 2, 0)

const updateStatusText = () => {
  if (!statusLabel) return
  if (isMounted) {
    statusLabel.textContent = '¡Estás montando! Usa WASD o las flechas para cabalgar.'
    statusLabel.classList.add('status--mounted')
  } else {
    statusLabel.textContent = 'Haz clic en el caballo para montarlo.'
    statusLabel.classList.remove('status--mounted')
  }
}

const mountHorse = () => {
  if (isMounted) return
  isMounted = true
  document.body.classList.add('mounted')
  controls.enabled = false
  updateStatusText()
  if (tipLabel) tipLabel.textContent = 'Mantén presionado espacio para galopar. Presiona Esc para bajar.'
}

const dismountHorse = () => {
  if (!isMounted) return
  isMounted = false
  document.body.classList.remove('mounted')
  controls.enabled = true
  updateStatusText()
  if (tipLabel) {
    tipLabel.textContent =
      'Explora libremente con el mouse o vuelve a subirte haciendo clic en el caballo.'
  }
}

updateStatusText()

const clampPosition = (vector, limit = 30) => {
  vector.x = THREE.MathUtils.clamp(vector.x, -limit, limit)
  vector.z = THREE.MathUtils.clamp(vector.z, -limit, limit)
}

const handlePointerDown = (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObject(horse, true)

  if (intersects.length > 0) {
    mountHorse()
  }
}

canvas.addEventListener('pointerdown', handlePointerDown)

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase()
  if (key === 'escape') {
    dismountHorse()
    return
  }

  const controlKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']
  if (controlKeys.includes(key)) {
    event.preventDefault()
  }
  pressedKeys.add(key)
})

window.addEventListener('keyup', (event) => {
  pressedKeys.delete(event.key.toLowerCase())
})

const animateHorse = (delta) => {
  if (!isMounted) return

  const turnSpeed = 2.2
  const walkSpeed = 6
  const gallopSpeed = 12

  const left = pressedKeys.has('a') || pressedKeys.has('arrowleft')
  const right = pressedKeys.has('d') || pressedKeys.has('arrowright')
  const forward = pressedKeys.has('w') || pressedKeys.has('arrowup')
  const backward = pressedKeys.has('s') || pressedKeys.has('arrowdown')
  const gallop = pressedKeys.has(' ')

  if (left) {
    horse.rotation.y += turnSpeed * delta
  } else if (right) {
    horse.rotation.y -= turnSpeed * delta
  }

  let moveFactor = 0
  if (forward) moveFactor += 1
  if (backward) moveFactor -= 0.5

  if (moveFactor !== 0) {
    const speed = gallop ? gallopSpeed : walkSpeed
    const direction = new THREE.Vector3(
      Math.sin(horse.rotation.y),
      0,
      Math.cos(horse.rotation.y)
    )
    direction.multiplyScalar(moveFactor * speed * delta)
    horse.position.add(direction)
    clampPosition(horse.position, 28)
  }

  const desiredCamera = horse.position
    .clone()
    .add(cameraOffset.clone().applyAxisAngle(upAxis, horse.rotation.y))

  camera.position.lerp(desiredCamera, 1 - Math.pow(0.001, delta))
  const lookTarget = horse.position.clone().add(lookOffset)
  camera.lookAt(lookTarget)
}

const animate = () => {
  const delta = clock.getDelta()
  requestAnimationFrame(animate)
  animateHorse(delta)

  if (!isMounted) {
    controls.update()
  }

  renderer.render(scene, camera)
}

animate()

const handleResize = () => {
  const { innerWidth, innerHeight } = window
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
}

window.addEventListener('resize', handleResize)
