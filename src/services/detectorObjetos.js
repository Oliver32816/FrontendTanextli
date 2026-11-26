// Detector de objetos con MediaPipe (Google). Corre en el navegador del usuario:
// la imagen de la cámara NUNCA sale del dispositivo y no carga al servidor.
// Se descarga una sola vez y después el navegador lo guarda en caché.
//
// Dos calidades:
//   rapida -> EfficientDet-Lite0 (~7 MB): ligero, ideal para celulares.
//   alta   -> EfficientDet-Lite2 (~12 MB): bastante más preciso, más lento (ideal en computadora).
//
// Archivos (servidos por la propia app, en /public):
//   /mediapipe/                          -> copia de node_modules/@mediapipe/tasks-vision/wasm
//   /modelos/efficientdet_lite0.tflite
//   /modelos/efficientdet_lite2.tflite
// Si faltan, se usan las copias públicas de jsDelivr y Google.

const WASM_LOCAL = '/mediapipe'
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODELOS = {
  rapida: {
    local: '/modelos/efficientdet_lite0.tflite',
    cdn: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
    nombre: 'Lite0',
  },
  alta: {
    local: '/modelos/efficientdet_lite2.tflite',
    cdn: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/1/efficientdet_lite2.tflite',
    nombre: 'Lite2',
  },
}

const promesas = {}
let usarCPU = false
let visionPromesa = null
export const infoDetector = { motor: '—', modelo: '—' }

async function existe(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' })
    const tipo = r.headers.get('content-type') || ''
    // serve -s responde index.html para rutas que no existen: eso no cuenta
    return r.ok && !tipo.includes('text/html')
  } catch {
    return false
  }
}

async function prepararVision() {
  if (!visionPromesa) {
    visionPromesa = (async () => {
      const { FilesetResolver } = await import('@mediapipe/tasks-vision')
      const wasm = (await existe(`${WASM_LOCAL}/vision_wasm_internal.js`)) ? WASM_LOCAL : WASM_CDN
      return FilesetResolver.forVisionTasks(wasm)
    })().catch((err) => { visionPromesa = null; throw err })
  }
  return visionPromesa
}

async function crear(calidad) {
  const { ObjectDetector } = await import('@mediapipe/tasks-vision')
  const vision = await prepararVision()
  const datos = MODELOS[calidad]
  const local = await existe(datos.local)
  const modelo = local ? datos.local : datos.cdn

  const opciones = (delegate) => ({
    baseOptions: { modelAssetPath: modelo, delegate },
    runningMode: 'VIDEO',
    scoreThreshold: 0.05, // casi sin mínimo: la app (seguidorObjetos.js) decide qué tan seguro debe estar
    maxResults: 10,
  })
  let detector
  if (!usarCPU) {
    try {
      detector = await ObjectDetector.createFromOptions(vision, opciones('GPU'))
      infoDetector.motor = 'GPU'
    } catch (err) {
      console.warn('[XAR] La GPU no está disponible, se usa el procesador:', err)
    }
  }
  if (!detector) {
    // Algunos equipos no tienen WebGL suficiente: el procesador también funciona, un poco más lento
    detector = await ObjectDetector.createFromOptions(vision, opciones('CPU'))
    infoDetector.motor = 'CPU'
  }
  infoDetector.modelo = `${datos.nombre} (${local ? 'local' : 'Google'})`
  return detector
}

// Una instancia por calidad (abrir y cerrar la cámara no lo vuelve a descargar).
// Si el modelo de alta precisión no se puede cargar, se usa el rápido.
export function obtenerDetector(calidad = 'rapida') {
  if (!promesas[calidad]) {
    promesas[calidad] = crear(calidad).catch((err) => {
      promesas[calidad] = null
      if (calidad === 'alta') {
        console.warn('[XAR] No se pudo cargar el modelo de alta precisión; se usa el rápido:', err)
        return obtenerDetector('rapida')
      }
      throw err
    })
  }
  return promesas[calidad]
}

// Si la GPU falla al detectar, se vuelven a crear los detectores con el procesador
export async function cambiarACPU(calidad = 'rapida') {
  if (usarCPU) return obtenerDetector(calidad)
  usarCPU = true
  for (const clave of Object.keys(promesas)) {
    const anterior = await promesas[clave]?.catch(() => null)
    try { anterior?.close() } catch { /* nada */ }
    promesas[clave] = null
  }
  return obtenerDetector(calidad)
}

// ---------- Rostro (solo cámara frontal) ----------
// BlazeFace: modelo muy pequeño (~0.2 MB) y rapidísimo. Sirve para que las etiquetas
// nunca tapen la cara de quien sostiene el objeto.
const ROSTRO = {
  local: '/modelos/blaze_face_short_range.tflite',
  cdn: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
}
let rostroPromesa = null
export function obtenerDetectorRostro() {
  if (!rostroPromesa) {
    rostroPromesa = (async () => {
      const { FaceDetector } = await import('@mediapipe/tasks-vision')
      const vision = await prepararVision()
      const modelo = (await existe(ROSTRO.local)) ? ROSTRO.local : ROSTRO.cdn
      return FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: modelo, delegate: 'CPU' }, // pequeñito: el procesador basta
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.6,
      })
    })().catch((err) => {
      console.warn('[XAR] Sin detector de rostro (las etiquetas se acomodan igual):', err)
      return null
    })
  }
  return rostroPromesa
}

export function detectarRostros(detector, video, tiempoMs) {
  const resultado = detector.detectForVideo(video, tiempoMs)
  return (resultado?.detections || []).map((d) => ({
    confianza: d.categories?.[0]?.score || 0,
    caja: { x: d.boundingBox?.originX || 0, y: d.boundingBox?.originY || 0, ancho: d.boundingBox?.width || 0, alto: d.boundingBox?.height || 0 },
  }))
}

// Resultado simplificado: [{ nombre: 'dog', confianza: 0.82, caja: { x, y, ancho, alto } }]
export function detectar(detector, video, tiempoMs) {
  const resultado = detector.detectForVideo(video, tiempoMs)
  return (resultado?.detections || [])
    .map((d) => ({
      nombre: d.categories?.[0]?.categoryName || '',
      confianza: d.categories?.[0]?.score || 0,
      caja: {
        x: d.boundingBox?.originX || 0,
        y: d.boundingBox?.originY || 0,
        ancho: d.boundingBox?.width || 0,
        alto: d.boundingBox?.height || 0,
      },
    }))
    .filter((d) => d.nombre)
}
