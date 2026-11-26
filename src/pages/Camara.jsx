// XAR Náhuatl (realidad aumentada): apunta la cámara a objetos o animales y Tany te dice cómo
// se llaman en español y en náhuatl. Reconoce varios a la vez. Todo corre en el dispositivo.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Mascota from '../components/Mascota'
import { obtenerDetector, detectar, cambiarACPU, infoDetector, obtenerDetectorRostro, detectarRostros, obtenerClasificador, clasificarZona } from '../services/detectorObjetos'
import { cargarVocabulario, traducirDeteccion, traducirClase } from '../services/vocabularioCamara'
import { crearSeguidor, normalizarCaja } from '../services/seguidorObjetos'
import { ICONO_TIPO, SUGERENCIAS_CAMARA } from '../data/objetosCamara'
import '../styles/camara.css'

const CADA_MS = 70 // ~14 revisiones por segundo
const CLAVE_COLECCION = 'tanextli_xar_coleccion'
const CLAVE_AJUSTES = 'tanextli_xar_ajustes_v3'

// Rápido por defecto (baja latencia); el modelo preciso se activa con el botón 🎯
function leerAjustes() {
  try {
    return { calidad: 'rapida', verPersonas: false, sinFiltro: false, ...JSON.parse(localStorage.getItem(CLAVE_AJUSTES)) }
  } catch {
    return { calidad: 'rapida', verPersonas: false, sinFiltro: false }
  }
}
const MAX_LISTA_PC = 4
const MAX_LISTA_CEL = 2

const MENSAJES_ERROR = {
  permiso: { titulo: 'Necesito permiso para usar la cámara', texto: 'Toca el candado junto a la dirección de la página, permite la cámara y vuelve a intentarlo.' },
  sin_camara: { titulo: 'No encontré una cámara', texto: 'Prueba desde un celular o una computadora con cámara.' },
  inseguro: { titulo: 'La cámara necesita una conexión segura', texto: 'Abre Tanextli desde su dirección con https:// para usar la cámara.' },
  ocupada: { titulo: 'La cámara está ocupada', texto: 'Cierra otras apps o pestañas que la estén usando y vuelve a intentarlo.' },
  modelo: { titulo: 'No pude preparar mis ojos', texto: 'Revisa tu conexión a internet: la primera vez se descargan unos archivos.' },
}

function errorDeCamara(err) {
  if (!window.isSecureContext) return 'inseguro'
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') return 'permiso'
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'sin_camara'
  if (err?.name === 'NotReadableError') return 'ocupada'
  return 'sin_camara'
}

function leerColeccion() {
  try { return JSON.parse(localStorage.getItem(CLAVE_COLECCION)) || [] } catch { return [] }
}
function guardarColeccion(lista) {
  try { localStorage.setItem(CLAVE_COLECCION, JSON.stringify(lista)) } catch { /* sin almacenamiento */ }
}

// ---------- Colocar recuadros y etiquetas sobre la imagen (en píxeles de la pantalla) ----------
// El video se recorta para llenar la pantalla (object-fit: cover): se calcula la misma escala.
function acomodar(objetos, video, visor, espejo, zonas = []) {
  const vw = video?.videoWidth || 0
  const vh = video?.videoHeight || 0
  const dw = visor?.clientWidth || 0
  const dh = visor?.clientHeight || 0
  if (!vw || !vh || !dw || !dh) return []
  const escala = Math.max(dw / vw, dh / vh)
  const ox = (dw - vw * escala) / 2
  const oy = (dh - vh * escala) / 2
  const arriba = 70 // debajo de la barra superior
  const margen = 8
  const abajo = 34 // el panel de Tany tapa un poco la orilla de abajo
  const ocupadas = []
  // Zonas donde no van etiquetas (el rostro con la cámara frontal), con un margen alrededor
  zonas.forEach((z) => {
    let zx = ox + z.x * escala
    if (espejo) zx = dw - zx - z.ancho * escala
    ocupadas.push({ x: zx - 12, y: oy + z.y * escala - 12, w: z.ancho * escala + 24, h: z.alto * escala + 24 })
  })
  const choca = (r) => ocupadas.some((o) => r.x < o.x + o.w + 6 && r.x + r.w + 6 > o.x && r.y < o.y + o.h + 6 && r.y + r.h + 6 > o.y)

  return objetos
    .map((o) => {
      let x = ox + o.caja.x * escala
      const y = oy + o.caja.y * escala
      const w = o.caja.ancho * escala
      const h = o.caja.alto * escala
      if (espejo) x = dw - x - w
      // recortar a lo visible
      const cx = Math.max(margen, x)
      const cy = Math.max(arriba, y)
      const caja = { x: cx, y: cy, w: Math.max(30, Math.min(dw - margen, x + w) - cx), h: Math.max(30, Math.min(dh - margen, y + h) - cy) }
      return { ...o, pantalla: caja }
    })
    .sort((a, b) => a.pantalla.y - b.pantalla.y)
    .map((o) => {
      const t = o.traduccion
      const largo = Math.max((t.nahuatl || '¿?').length * 10.5, t.espanol.length * 7.5)
      const ew = Math.min(dw - margen * 2, largo + 34)
      const eh = 48
      const { x, y, w, h } = o.pantalla
      const ajustarX = (px) => Math.min(Math.max(margen, px), dw - ew - margen)
      const ajustarY = (py) => Math.min(Math.max(arriba, py), dh - eh - abajo)
      const opciones = [
        { x: ajustarX(x), y: ajustarY(y - eh - 8) },   // arriba del recuadro
        { x: ajustarX(x + 8), y: ajustarY(y + 8) },    // dentro, arriba
        { x: ajustarX(x), y: ajustarY(y + h + 8) },    // debajo
        { x: ajustarX(x + 8), y: ajustarY(y + h - eh - 8) }, // dentro, abajo
      ]
      let lugar = opciones.find((p) => !choca({ ...p, w: ew, h: eh }))
      if (!lugar) {
        // Todas chocan: se recorre hacia abajo hasta encontrar espacio
        lugar = { ...opciones[1] }
        for (let i = 0; i < 8 && choca({ ...lugar, w: ew, h: eh }); i += 1) lugar.y = ajustarY(lugar.y + eh + 6)
      }
      ocupadas.push({ ...lugar, w: ew, h: eh })
      return { ...o, etiqueta: { ...lugar, w: ew } }
    })
}

export default function Camara() {
  const navigate = useNavigate()
  const visorRef = useRef(null)
  const videoRef = useRef(null)
  const flujoRef = useRef(null)
  const seguidorRef = useRef(crearSeguidor())
  const nuevaTimerRef = useRef(0)
  const resultadoRef = useRef(null)
  const clasificadorRef = useRef(null)     // se usa en cuanto termina de cargar (no frena la cámara)
  const votosClaseRef = useRef(new Map())  // id del objeto -> votos del clasificador
  const centroRef = useRef({ votos: {}, trad: {} })

  const [estado, setEstado] = useState('cargando') // cargando | lista | error
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [frontal, setFrontal] = useState(false)
  const [pausada, setPausada] = useState(false)
  const [objetos, setObjetos] = useState([])        // objetos estables, ya traducidos y acomodados
  const [sinNadaDesde, setSinNadaDesde] = useState(() => Date.now())
  const [coleccion, setColeccion] = useState(leerColeccion)
  const [nueva, setNueva] = useState(null)          // palabra recién agregada a la colección
  const [vistasSesion, setVistasSesion] = useState([])

  const esPC = typeof window !== 'undefined' && window.matchMedia?.('(min-width: 900px)').matches
  // Ajustes: alta precisión (modelo más grande) y si se muestran las personas
  const [ajustes, setAjustes] = useState(leerAjustes)
  const [cargandoModelo, setCargandoModelo] = useState(false)
  const cambiarAjuste = (clave, valor) => setAjustes((a) => {
    const siguiente = { ...a, [clave]: valor }
    try { localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(siguiente)) } catch { /* nada */ }
    return siguiente
  })
  const { calidad, verPersonas, sinFiltro } = ajustes
  // Prueba sin margen de error: ninguna confianza mínima (ni del modelo ni de la app)
  const minimo = (valor) => (sinFiltro ? 0 : valor)

  // Al cambiar de modo se empieza de cero
  useEffect(() => { seguidorRef.current.limpiar() }, [sinFiltro])

  // El detector de rostro (cámara frontal) carga en segundo plano: nunca detiene la cámara
  const rostroRef = useRef(null)
  useEffect(() => {
    if (frontal && estado === 'lista') obtenerDetectorRostro().then((d) => { rostroRef.current = d })
  }, [frontal, estado])
  const diagnostico = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('diagnostico')
  const [diag, setDiag] = useState({ cuadros: 0, ultimas: '', error: '' })

  const apagarCamara = useCallback(() => {
    flujoRef.current?.getTracks().forEach((t) => t.stop())
    flujoRef.current = null
  }, [])

  // ---------- Encender cámara y preparar el reconocimiento ----------
  useEffect(() => {
    let cancelado = false
    async function encender() {
      setEstado('cargando')
      setError(null)
      setObjetos([])
      seguidorRef.current.limpiar()
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(window.isSecureContext ? 'sin_camara' : 'inseguro')
        setEstado('error')
        return
      }
      try {
        const [flujo] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: frontal ? 'user' : { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          }),
          cargarVocabulario(),
        ])
        if (cancelado) { flujo.getTracks().forEach((t) => t.stop()); return }
        apagarCamara()
        flujoRef.current = flujo
        videoRef.current.srcObject = flujo
        await videoRef.current.play().catch(() => {})
      } catch (err) {
        if (!cancelado) { setError(errorDeCamara(err)); setEstado('error') }
        return
      }
      try {
        await obtenerDetector(calidad)
        if (!cancelado) { setEstado('lista'); setSinNadaDesde(Date.now()) }
        // El clasificador (segundo paso) carga en segundo plano
        obtenerClasificador().then((c) => { clasificadorRef.current = c })
      } catch {
        if (!cancelado) { setError('modelo'); setEstado('error') }
      }
    }
    encender()
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontal, intento, apagarCamara])

  // Al cambiar la precisión se prepara el otro modelo (la primera vez se descarga)
  useEffect(() => {
    if (estado !== 'lista') return
    let cancelado = false
    setCargandoModelo(true)
    seguidorRef.current.limpiar()
    obtenerDetector(calidad)
      .catch(() => {})
      .finally(() => { if (!cancelado) setCargandoModelo(false) })
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calidad])

  useEffect(() => apagarCamara, [apagarCamara])

  // ---------- Revisar lo que ve la cámara ----------
  useEffect(() => {
    if (estado !== 'lista' || pausada) return undefined
    let detenido = false
    let ultimo = 0
    let reloj = 0
    let fallos = 0
    let vacios = 0
    let cuadros = 0
    let habiaAlgo = false
    let rostros = []

    const ciclo = async () => {
      if (detenido) return
      const video = videoRef.current
      const ahora = performance.now()
      // try/finally: pase lo que pase en un cuadro, la revisión del siguiente cuadro SIEMPRE continúa
      try {
      if (video && video.readyState >= 2 && !document.hidden && ahora - ultimo >= CADA_MS) {
        ultimo = ahora
        const detector = await obtenerDetector(calidad)
        if (detenido) return
        let crudas = []
        try {
          crudas = detectar(detector, video, ahora)
          fallos = 0
        } catch (err) {
          fallos += 1
          if (fallos === 1) console.error('[XAR] Error al detectar:', err)
          if (diagnostico) setDiag((d) => ({ ...d, error: String(err?.message || err) }))
          if (fallos === 5) {
            if (infoDetector.motor === 'GPU') { fallos = 0; await cambiarACPU(calidad) }
            else { setError('modelo'); setEstado('error'); return }
          }
        }
        cuadros += 1
        // Vigilante: si el modelo no devuelve NADA durante ~6 s (con un mínimo casi en cero siempre
        // devuelve algo), la tarjeta gráfica está fallando en silencio: se cambia al procesador.
        vacios = crudas.length ? 0 : vacios + 1
        if (vacios === 90 && infoDetector.motor === 'GPU') {
          console.warn('[XAR] La GPU no devuelve resultados: se cambia al procesador')
          if (diagnostico) setDiag((d) => ({ ...d, error: 'La GPU no devolvía resultados: se cambió al procesador' }))
          vacios = 0
          await cambiarACPU(calidad)
        }
        if (diagnostico && cuadros % 8 === 0) {
          setDiag((d) => ({ ...d, cuadros, ultimas: crudas.map((x) => `${x.nombre} ${Math.round(x.confianza * 100)}%`).join(', ') || 'nada' }))
        }

        // Cámara frontal: dónde está el rostro (cada 2 cuadros basta) para no taparlo con etiquetas
        if (frontal && cuadros % 2 === 0) {
          const detRostro = rostroRef.current
          try { rostros = detRostro ? detectarRostros(detRostro, video, ahora + 0.5) : [] } catch { rostros = [] }
        } else if (!frontal) {
          rostros = []
        }

        let estables = seguidorRef.current.actualizar(crudas, { sinFiltro })
        const personaDetectada = rostros.length > 0 || estables.some((o) => o.nombre === 'person')
        // Las personas se ocultan (con la cámara frontal siempre estás detrás del objeto).
        // Si se activan, solo aparecen cuando no hay nada más en la imagen.
        if (!verPersonas || estables.some((o) => o.nombre !== 'person')) estables = estables.filter((o) => o.nombre !== 'person')

        // ----- Segundo paso: conocer cada objeto POR SEPARADO con el clasificador -----
        // Cada cuadro se recorta UN objeto (por turnos) y el clasificador vota qué es exactamente.
        const clasificador = clasificadorRef.current
        const votos = votosClaseRef.current
        const ids = new Set(estables.map((o) => o.id))
        votos.forEach((_, id) => { if (!ids.has(id)) votos.delete(id) })
        const candidatos = estables.filter((o) => o.nombre !== 'person')
        if (clasificador && candidatos.length) {
          const o = candidatos[cuadros % candidatos.length]
          let cats = []
          try { cats = clasificarZona(clasificador, video, o.caja) } catch { /* un cuadro perdido no importa */ }
          const memo = votos.get(o.id) || { votos: {}, trad: {} }
          Object.keys(memo.votos).forEach((k) => { memo.votos[k] *= 0.8 })
          cats.forEach((c) => {
            const t = traducirClase(c.nombre)
            if (!t || c.confianza < minimo(0.12)) return
            memo.votos[t.espanol] = (memo.votos[t.espanol] || 0) + c.confianza
            memo.trad[t.espanol] = t
          })
          votos.set(o.id, memo)
        }
        const traducir = (o) => {
          const memo = votos.get(o.id)
          const mejor = memo && Object.entries(memo.votos).sort((a, b) => b[1] - a[1])[0]
          const delDetector = traducirDeteccion(o.nombre)
          // El nombre del clasificador (más específico) gana si está seguro, salvo que el detector
          // esté muy seguro de que es otro tipo de cosa (por ejemplo, un perro al 80 % no se vuelve "taza")
          if (mejor && mejor[1] > minimo(0.45)) {
            const clase = memo.trad[mejor[0]]
            if (o.confianza < 0.7 || clase.tipo === delDetector.tipo) return { ...clase, fuente: 'clasificador' }
          }
          return delDetector
        }
        const traducidos = estables.map((o) => ({ ...o, traduccion: traducir(o) }))

        // ----- Si el detector no ve nada: el clasificador mira el CENTRO de la imagen -----
        const centro = centroRef.current
        if (traducidos.length === 0 && clasificador && cuadros % 3 === 0) {
          const lado = Math.min(video.videoWidth, video.videoHeight) * 0.62
          const caja = { x: (video.videoWidth - lado) / 2, y: (video.videoHeight - lado) / 2, ancho: lado, alto: lado }
          let cats = []
          try { cats = clasificarZona(clasificador, video, caja) } catch { /* nada */ }
          Object.keys(centro.votos).forEach((k) => { centro.votos[k] *= 0.75 })
          cats.forEach((c) => {
            const t = traducirClase(c.nombre)
            if (!t || c.confianza < minimo(0.15)) return
            centro.votos[t.espanol] = (centro.votos[t.espanol] || 0) + c.confianza
            centro.trad[t.espanol] = t
            centro.ultima = { ...(centro.ultima || {}), [t.espanol]: c.confianza }
          })
          centro.caja = caja
        } else if (traducidos.length > 0) {
          centro.votos = {}
        }
        if (traducidos.length === 0 && centro.caja) {
          const mejor = Object.entries(centro.votos).sort((a, b) => b[1] - a[1])[0]
          // El centro es una adivinanza del clasificador sin recuadro del detector: se exige más.
          // Solo entra a la colección cuando está MUY seguro (evita guardar cosas como "excusado").
          if (mejor && mejor[1] > minimo(1.4) && (centro.ultima?.[mejor[0]] || 0) >= minimo(0.35)) {
            traducidos.push({
              id: 'centro', nombre: 'centro', confianza: centro.ultima?.[mejor[0]] || 0, vistas: mejor[1] >= 2.2 ? 10 : 0,
              caja: centro.caja, traduccion: { ...centro.trad[mejor[0]], fuente: 'centro' },
            })
          }
        }
        setObjetos(acomodar(traducidos, video, visorRef.current, frontal, rostros.map((r) => r.caja)))

        // Resultado en formato estándar para la capa de RA (coordenadas de 0 a 1000)
        resultadoRef.current = {
          camara: frontal ? 'frontal' : 'trasera',
          persona_detectada: personaDetectada,
          objetos: traducidos.map((o) => ({
            etiqueta: o.traduccion.espanol.toLowerCase(),
            nahuatl: o.traduccion.nahuatl,
            confianza: Math.round(o.confianza * 100) / 100,
            caja: normalizarCaja(o.caja, video.videoWidth, video.videoHeight),
          })),
          ...(rostros[0] ? { rostro: normalizarCaja(rostros[0].caja, video.videoWidth, video.videoHeight) } : {}),
        }
        const hayAlgo = traducidos.length > 0
        if (habiaAlgo && !hayAlgo) setSinNadaDesde(Date.now())
        habiaAlgo = hayAlgo
      }
      } catch (err) {
        console.error('[XAR] Error en el cuadro:', err)
        if (diagnostico) setDiag((d) => ({ ...d, error: `Cuadro: ${String(err?.message || err)}` }))
      } finally {
        if (!detenido) reloj = requestAnimationFrame(ciclo)
      }
    }
    reloj = requestAnimationFrame(ciclo)
    return () => { detenido = true; cancelAnimationFrame(reloj) }
  }, [estado, pausada, frontal, diagnostico, calidad, verPersonas, sinFiltro])

  // ---------- Lista ordenada (el más grande primero) ----------
  const lista = useMemo(() => [...objetos]
    .sort((a, b) => (b.pantalla.w * b.pantalla.h) - (a.pantalla.w * a.pantalla.h))
    .filter((o, i, arr) => arr.findIndex((x) => x.traduccion.espanol === o.traduccion.espanol) === i), [objetos])
  const principal = lista[0]
  const firma = lista.map((o) => o.traduccion.espanol).join('|')
  // Para la colección solo cuentan los objetos ya seguros (vistos ~0.5 s): evita guardar un nombre de un instante
  const firmaSegura = lista.filter((o) => o.vistas >= 7).map((o) => o.traduccion.espanol).join('|')

  // ---------- Colección: palabras en náhuatl descubiertas con la cámara ----------
  useEffect(() => {
    if (!firmaSegura) return
    const seguras = lista.filter((o) => o.vistas >= 7)
    const conocidas = seguras.filter((o) => o.traduccion.nahuatl)
    setVistasSesion((prev) => {
      const nuevas = seguras.map((o) => o.traduccion).filter((t) => !prev.some((p) => p.espanol === t.espanol))
      return nuevas.length ? [...nuevas, ...prev].slice(0, 16) : prev
    })
    const nuevas = conocidas.map((o) => o.traduccion).filter((t) => !coleccion.some((p) => p.espanol === t.espanol))
    if (nuevas.length) {
      const siguiente = [...nuevas.map(({ espanol, nahuatl }) => ({ espanol, nahuatl })), ...coleccion]
      guardarColeccion(siguiente)
      setColeccion(siguiente)
      setNueva(nuevas[0])
      clearTimeout(nuevaTimerRef.current)
      nuevaTimerRef.current = setTimeout(() => setNueva(null), 3200)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaSegura])
  useEffect(() => () => clearTimeout(nuevaTimerRef.current), [])

  // Para "¿Qué tienes ahí?" cuando pasa un rato sin ver nada
  const [, setTic] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTic((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const tiempoSinNada = Date.now() - sinNadaDesde

  // ---------- Qué hace y qué dice Tany ----------
  const tany = (() => {
    if (estado === 'error') return { estado: 'error', texto: '¡Ups! Algo pasó con la cámara.' }
    if (estado === 'cargando') return { estado: 'piensa', texto: 'Preparando mis ojos… 👀' }
    if (pausada) return { estado: 'escucha', texto: 'Tómate tu tiempo para leer.' }
    if (nueva) return { estado: 'celebra', texto: <>¡Nueva palabra! <b>{nueva.nahuatl}</b> = {nueva.espanol.toLowerCase()} ✨</> }
    if (!principal) {
      return tiempoSinNada > 9000
        ? { estado: 'curiosa', texto: '¿Qué tienes ahí? Acércame algo a la cámara.' }
        : { estado: 'curiosa', texto: 'Estoy observando… muéstrame un objeto o un animal.' }
    }
    const t = principal.traduccion
    if (lista.length > 1) return { estado: 'emocionada', texto: `¡Veo ${lista.length} cosas! Mira sus nombres.` }
    if (t.nahuatl) return { estado: 'feliz', texto: <>¡Eso es <b>{t.nahuatl}</b>! Así se dice {t.espanol.toLowerCase()}.</> }
    return { estado: 'piensa', texto: <>Mmm… «{t.espanol}» todavía no la sé en náhuatl.</> }
  })()

  const alternarPausa = () => {
    const video = videoRef.current
    if (!video) return
    if (pausada) video.play().catch(() => {})
    else video.pause()
    setPausada((p) => !p)
  }

  const hayDesconocidas = lista.some((o) => !o.traduccion.nahuatl)
  const buscando = estado === 'lista' && !pausada && lista.length === 0

  return (
    <div className="cam-pantalla">
      {/* ================= Imagen de la cámara ================= */}
      <div className={`cam-visor ${buscando ? 'buscando' : ''}`} ref={visorRef}>
        <video ref={videoRef} className={`cam-video ${frontal ? 'espejo' : ''}`} playsInline muted autoPlay />

        {buscando && <div className="cam-escaneo" aria-hidden="true" />}
        <div className={`cam-mira ${lista.length ? 'oculta' : ''}`} aria-hidden="true"><span /><span /><span /><span /></div>

        {/* Recuadros y etiquetas (HTML: letras nítidas que nunca se enciman) */}
        <div className="cam-marcas" aria-hidden="true">
          {objetos.map((o) => {
            const conocida = Boolean(o.traduccion.nahuatl)
            return (
              <div key={o.id} className={`cam-marca ${conocida ? 'conocida' : 'desconocida'}`}>
                <span className="cam-caja" style={{ transform: `translate(${o.pantalla.x}px, ${o.pantalla.y}px)`, width: o.pantalla.w, height: o.pantalla.h }}>
                  <i /><i /><i /><i />
                </span>
                <span className="cam-etiqueta" style={{ transform: `translate(${o.etiqueta.x}px, ${o.etiqueta.y}px)`, maxWidth: o.etiqueta.w }}>
                  <strong>{conocida ? o.traduccion.nahuatl : '¿?'}{sinFiltro && <em className="cam-porcentaje"> {Math.round(o.confianza * 100)}%</em>}</strong>
                  <small>{o.traduccion.espanol}</small>
                </span>
              </div>
            )
          })}
        </div>

        <header className="cam-barra">
          <button type="button" className="cam-boton-redondo" onClick={() => navigate(-1)} aria-label="Regresar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="cam-titulo">
            <strong><span className="cam-punto" data-activo={estado === 'lista' && !pausada} /> XAR Náhuatl</strong>
            <small>{estado === 'lista' ? (pausada ? 'Imagen en pausa' : lista.length ? `${lista.length} ${lista.length === 1 ? 'cosa' : 'cosas'} a la vista` : 'Observando…') : estado === 'error' ? 'Sin cámara' : 'Preparando…'}</small>
          </div>
          <button type="button" className="cam-boton-redondo" onClick={() => setFrontal((f) => !f)}
            aria-label={frontal ? 'Usar cámara trasera' : 'Usar cámara frontal'} title="Cambiar cámara" disabled={estado === 'error'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><path d="M9.5 13.5a2.5 2.5 0 0 0 4.6 1.3M14.5 12.5a2.5 2.5 0 0 0-4.6-1.3" /><path d="M14 15h.5v.5M10 11h-.5v-.5" /></svg>
          </button>
        </header>

        {nueva && (
          <div className="cam-nueva" role="status" key={nueva.espanol}>
            <span className="cam-chispas" aria-hidden="true">✦ ✧ ✦</span>
            <small>¡Nueva palabra en tu colección!</small>
            <strong>{nueva.nahuatl}</strong>
            <span>{nueva.espanol}</span>
          </div>
        )}

        {estado === 'cargando' && (
          <div className="cam-aviso">
            <span className="cam-giro" aria-hidden="true" />
            <p>Preparando la cámara…</p>
            <small>La primera vez tarda unos segundos.</small>
          </div>
        )}
        {estado === 'error' && error && (
          <div className="cam-aviso cam-aviso-error" role="alert">
            <span className="cam-aviso-icono" aria-hidden="true">📷</span>
            <p>{MENSAJES_ERROR[error].titulo}</p>
            <small>{MENSAJES_ERROR[error].texto}</small>
            <button type="button" className="cam-boton" onClick={() => setIntento((n) => n + 1)}>Intentar de nuevo</button>
          </div>
        )}

        {diagnostico && (
          <pre className="cam-diagnostico">
            {`Estado: ${estado}${error ? ` (${error})` : ''}
Motor: ${infoDetector.motor} · Modelo: ${infoDetector.modelo} · Clasificador: ${clasificadorRef.current ? 'listo' : 'cargando…'}
Cuadros: ${diag.cuadros} · Estables: ${objetos.length}
Ve: ${diag.ultimas || '—'}${diag.error ? `\nError: ${diag.error}` : ''}
${resultadoRef.current ? JSON.stringify(resultadoRef.current, null, 1).slice(0, 600) : ''}`}
          </pre>
        )}
      </div>

      {/* ================= Panel de Tany ================= */}
      <section className="cam-panel" aria-live="polite">
        <div className="cam-tany">
          <div className="cam-tany-figura">
            <Mascota estado={tany.estado} tamano={esPC ? 'barra' : 'mini'} dormir={false} disparo={firma || estado} />
          </div>
          <p className="cam-globo" key={typeof tany.texto === 'string' ? tany.texto : firma + (nueva?.espanol || '')}>{tany.texto}</p>
        </div>

        {lista.length === 0 ? (
          <div className="cam-vacio">
            <p>Prueba con:</p>
            <div className="cam-sugerencias">
              {SUGERENCIAS_CAMARA.map((s, i) => <span key={s} style={{ '--i': i }}>{s}</span>)}
            </div>
          </div>
        ) : (
          <ul className="cam-lista">
            {lista.slice(0, esPC ? MAX_LISTA_PC : MAX_LISTA_CEL).map((o, i) => {
              const t = o.traduccion
              return (
                <li key={t.espanol} className={`cam-fila ${t.nahuatl ? 'conocida' : 'desconocida'} ${i === 0 ? 'principal' : ''}`} style={{ '--i': i }}>
                  <span className="cam-fila-icono" aria-hidden="true">{ICONO_TIPO[t.tipo]}</span>
                  <span className="cam-fila-palabra">
                    <small>Español</small>
                    <b>{t.espanol}</b>
                  </span>
                  <span className="cam-fila-flecha" aria-hidden="true">→</span>
                  <span className="cam-fila-palabra cam-fila-nahuatl">
                    <small>Náhuatl</small>
                    <b>{t.nahuatl || 'Desconocido'}</b>
                  </span>
                </li>
              )
            })}
            {lista.length > (esPC ? MAX_LISTA_PC : MAX_LISTA_CEL) && (
              <li className="cam-mas">y {lista.length - (esPC ? MAX_LISTA_PC : MAX_LISTA_CEL)} más en la imagen 👆</li>
            )}
          </ul>
        )}

        {hayDesconocidas && (
          <p className="cam-mensaje">
            🌱 <strong>Las palabras «Desconocido» todavía no están en nuestro vocabulario.</strong> Pronto las agregaremos con ayuda de nuestro hablante de náhuatl.
          </p>
        )}

        <div className="cam-ajustes" role="group" aria-label="Ajustes de la cámara">
          <button type="button" className={`cam-ajuste ${sinFiltro ? 'activo prueba' : ''}`} aria-pressed={sinFiltro}
            onClick={() => cambiarAjuste('sinFiltro', !sinFiltro)}
            title="Prueba: muestra todo lo que el modelo cree ver, sin exigir una confianza mínima">
            <span aria-hidden="true">🧪</span> {sinFiltro ? 'Sin margen de error' : 'Con margen de error'}
          </button>
          <button type="button" className={`cam-ajuste ${calidad === 'alta' ? 'activo' : ''}`} aria-pressed={calidad === 'alta'}
            onClick={() => cambiarAjuste('calidad', calidad === 'alta' ? 'rapida' : 'alta')}
            title="El modelo preciso reconoce mejor, pero es más pesado y lento en celulares">
            <span aria-hidden="true">🎯</span> {cargandoModelo ? 'Cargando…' : 'Alta precisión'}
          </button>
          <button type="button" className={`cam-ajuste ${verPersonas ? 'activo' : ''}`} aria-pressed={verPersonas}
            onClick={() => cambiarAjuste('verPersonas', !verPersonas)}
            title="Con la cámara frontal conviene ocultarlas para que no tapen al objeto">
            <span aria-hidden="true">👤</span> {verPersonas ? 'Personas visibles' : 'Personas ocultas'}
          </button>
        </div>

        <div className="cam-acciones">
          <button type="button" className={`cam-boton ${pausada ? 'activo' : ''}`} onClick={alternarPausa} disabled={estado !== 'lista'}>
            {pausada ? (
              <><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg> Continuar</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> Pausar imagen</>
            )}
          </button>
        </div>

        <div className="cam-coleccion">
          <div className="cam-coleccion-titulo">
            <span>📚 Tu colección</span>
            <b>{coleccion.length} {coleccion.length === 1 ? 'palabra' : 'palabras'} en náhuatl</b>
            {(coleccion.length > 0 || vistasSesion.length > 0) && (
              <button type="button" className="cam-limpiar" onClick={() => { guardarColeccion([]); setColeccion([]); setVistasSesion([]) }}
                title="Empezar la colección de nuevo">Reiniciar</button>
            )}
          </div>
          {vistasSesion.length > 0 && (
            <ul>
              {vistasSesion.map((d) => (
                <li key={d.espanol} className={d.nahuatl ? 'conocida' : ''}>
                  {d.nahuatl ? <><b>{d.nahuatl}</b> {d.espanol}</> : d.espanol}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
