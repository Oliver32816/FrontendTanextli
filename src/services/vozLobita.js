// Voz de Lobita: reproduce los audios de public/audios/lobita y devuelve el texto para el globo.
import datos from '../data/lobita.json'

const CLAVE_VOZ = 'tanextli_voz_lobita'
const frases = Object.fromEntries(datos.frases.map((f) => [f.id, f]))

// Grupos de frases: cada vez se elige una distinta (sin repetir las últimas)
const GRUPOS = {
  // Pantalla de inicio de sesión (el menú de inicio usa la secuencia "menu", de abajo)
  bienvenida: ['me-encanta-ensenarte', 'estoy-para-ayudarte-en-lo-que-necesites'],
  login: ['me-encanta-ensenarte', 'estoy-para-ayudarte-en-lo-que-necesites'],
  menu: ['que-te-gustaria-aprender-hoy'],
  categoria: ['estas-listo-para-empezar', 'a-divertirnos', 'me-encanta-ensenarte', 'estoy-para-ayudarte-en-lo-que-necesites'],
  inicioLeccion: ['excelente-comencemos', 'a-divertirnos', 'estas-listo-para-empezar'],
  escucha: ['escucha-con-atencion-y-repite-conmigo', 'escucha-atentamente-y-repite-la-respuesta'],
  avance: ['has-progresado', 'aprendes-rapidamente', 'excelente-muy-bien'],
  acierto: ['excelente-muy-bien', 'aprendes-rapidamente', 'has-progresado', 'me-encanta-ensenarte'],
  error: ['estuviste-cerca-vuelve-a-intentarlo', 'no-te-preocupes-intentalo-nuevamente', 'fallar-es-parte-del-proceso'],
  escritura: ['recuerda-como-lo-aprendimos'],
  finLeccion: ['racha-completa', 'has-progresado'],
  finRepaso: ['felicidades-completaste-el-repaso-general'],
  ayuda: ['estoy-para-ayudarte-en-lo-que-necesites'],
  perfil: ['has-progresado', 'aprendes-rapidamente', 'racha-completa'],
    perfil0: ['me-encanta-ensenarte', 'estoy-para-ayudarte-en-lo-que-necesites'],
  perfilPoco: ['aprendes-rapidamente'],
  perfilMedio: ['has-progresado'],
  perfilTodo: ['racha-completa'],
}

// Grupos que Lobita dice una sola vez por lección (se reinician con reiniciarLeccion)
const UNA_VEZ_POR_LECCION = ['escritura']

// Grupos que son una secuencia de dos frases, una después de la otra
const SECUENCIAS = {
  // Al abrir el menú de inicio: primero se presenta (solo la primera vez de la sesión) y luego pregunta
  menu: () => {
    let primera = true
    try { primera = !sessionStorage.getItem('lobita_menu_visto'); sessionStorage.setItem('lobita_menu_visto', '1') } catch { /* sin storage */ }
    return primera
      ? ['bienvenidos-tani', 'que-te-gustaria-aprender-hoy']
      : [elegirId('menu')]
  },
  // Al empezar una lección: saludo y luego la instrucción de escuchar y repetir
  inicioEscucha: () => [elegirId('inicioLeccion'), elegirId('escucha')],
}

/* ---------- Voz encendida o apagada ---------- */

export function vozActiva() {
  try { return localStorage.getItem(CLAVE_VOZ) !== 'no' } catch { return true }
}
export function activarVoz(valor) {
  try { localStorage.setItem(CLAVE_VOZ, valor ? 'si' : 'no') } catch { /* sin storage */ }
  if (!valor) detenerVoz()
}

/* ---------- Audios (se cargan por adelantado para que suenen de inmediato) ---------- */

const audios = {}
function audioDe(f) {
  if (!f || !f.audio) return null
  if (!audios[f.id]) {
    const a = new Audio(f.audio)
    a.preload = 'auto'
    audios[f.id] = a
  }
  return audios[f.id]
}
export function precargarVoz() {
  datos.frases.forEach((f) => audioDe(f))
}
if (typeof window !== 'undefined') setTimeout(precargarVoz, 0)

let turno = 0 // cada vez que se dice algo nuevo, lo anterior se cancela
let sonando = null
let pendiente = null // frase que no pudo sonar por el bloqueo del navegador (suena en el primer clic)

export function detenerVoz() {
  turno += 1
  pendiente = null
  if (sonando) {
    sonando.onended = null
    sonando.pause()
    sonando = null
  }
}

function esperarClic() {
  const alClic = () => {
    document.removeEventListener('pointerdown', alClic, true)
    const f = pendiente
    pendiente = null
    if (f) reproducir(f, turno)
  }
  document.addEventListener('pointerdown', alClic, true)
}

function reproducir(f, miTurno, alTerminar) {
  const a = audioDe(f)
  if (!a) { if (alTerminar) alTerminar(); return }
  a.onended = null
  a.pause()
  try { a.currentTime = 0 } catch { /* aún no carga */ }
  sonando = a
  a.onended = () => { if (turno === miTurno && alTerminar) alTerminar() }
  const p = a.play()
  if (p && p.catch) {
    p.catch(() => {
      // El navegador bloquea el audio hasta que la persona haga clic: suena en el primer clic
      if (turno === miTurno) { pendiente = f; esperarClic() }
    })
  }
}

/* ---------- Elegir frases sin repetir ---------- */

let recientes = []
function elegirId(grupo) {
  const ids = GRUPOS[grupo] || []
  if (ids.length === 0) return null
  let opciones = ids.filter((id) => !recientes.includes(id))
  if (opciones.length === 0) opciones = ids.filter((id) => id !== recientes[recientes.length - 1])
  if (opciones.length === 0) opciones = ids
  const id = opciones[Math.floor(Math.random() * opciones.length)]
  recientes = [...recientes, id].slice(-3)
  return id
}

export function elegirFrase(grupo) {
  const id = elegirId(grupo)
  return id ? frases[id] : null
}

// Pone signos de exclamación si no los trae (para títulos y globos)
export function exclamar(texto) {
  if (!texto) return texto
  return /^[¡¿]/.test(texto) ? texto : `¡${texto}!`
}

/* ---------- Decir ---------- */

export function decir(frase, opciones = {}) {
  if (!frase) return
  detenerVoz()
  if (!vozActiva()) return
  reproducir(frase, turno, opciones.alTerminar)
}

let dichos = new Set() // grupos de "una vez por lección" que ya se dijeron
export function reiniciarLeccion() {
  dichos = new Set()
}

let ultimo = { grupo: null, t: 0, actual: null }

// Dice una frase del grupo y la devuelve (para mostrarla en el globo).
// Con { onFrase } avisa cada vez que empieza una frase de una secuencia.
export function decirLobita(grupo, opciones = {}) {
  const ahora = Date.now()
  // Si se llama dos veces seguidas (React en modo desarrollo), no se repite ni cambia la frase
  if (ultimo.grupo === grupo && ahora - ultimo.t < 900) {
    ultimo.t = ahora
    return ultimo.actual
  }
  if (UNA_VEZ_POR_LECCION.includes(grupo)) {
    if (dichos.has(grupo)) return null
    dichos.add(grupo)
  }

  const ids = SECUENCIAS[grupo] ? SECUENCIAS[grupo]().filter(Boolean) : [elegirId(grupo)]
  const lista = ids.map((id) => frases[id]).filter(Boolean)
  if (lista.length === 0) return null
  ultimo = { grupo, t: ahora, actual: lista[0] }

  detenerVoz()
  const miTurno = turno
  const sonar = (i) => {
    if (turno !== miTurno) return
    const f = lista[i]
    ultimo.actual = f
    if (i > 0 && opciones.onFrase) opciones.onFrase(f)
    if (!vozActiva()) return
    reproducir(f, miTurno, () => { if (i + 1 < lista.length) sonar(i + 1) })
  }
  sonar(0)
  return lista[0]
}