import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import Mascota from '../components/Mascota'
import { categorias } from '../data/categorias'
import { contenidoLecciones } from '../data/lecciones'
import { marcarLeccionCompletada } from '../services/progreso'
import { IconAltavoz, IconMicrofono } from '../components/Icons'
import '../styles/leccion.css'
import { actividadesDe } from '../data/actividades'
import { armarPreguntasRepaso, preguntaEscuchaFrase } from '../data/repasoFrases'
import { rutinas } from '../data/mascotaAnimaciones'
import { armarPreguntasFamilia } from '../data/repasoFamilia'
import { decir, elegirFrase, detenerVoz, decirLobita, exclamar, reiniciarLeccion } from '../services/vozLobita'
import { useLobita } from '../services/useLobita'

// La rutina de la mascota cambia según la categoría (familia, colores, numeros, frases)
// "saludo" es la frase con la que Lobita abre la lección y "primero" indica si es el primer paso
const RutinaContext = createContext({ rutina: 'leccion', saludo: null, primero: false })

// El repaso general muestra ayuda cuando se falla varias veces
const RepasoContext = createContext(false)
const AYUDA_REPASO_DESDE = 3 // intentos fallidos para que aparezca la ayuda

// Lugar de la pantalla donde se dibuja la mascota. Está FUERA del bloque que se escala,
// así la mascota conserva su tamaño y no se achica junto con la actividad.
const DestinoMascotaContext = createContext(null)

// Títulos de respaldo para la barra de resultado (solo se usan si la frase de Lobita no trae texto)
const TITULOS_ACIERTO = ['¡Excelente!', '¡Muy bien!', '¡Perfecto!', '¡Bien hecho!', '¡Así se hace!', '¡Genial!', '¡Lo lograste!', '¡Correcto!']
const TITULOS_ERROR = [
  '¡Casi! Inténtalo de nuevo',
  '¡No te preocupes! Inténtalo nuevamente',
  '¡Ánimo! Corrígelo e inténtalo otra vez',
  '¡Sigue intentando!',
  '¡Ups! Revísalo con calma',
]

/* ---------- Funciones de apoyo ---------- */

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

// Quita mayúsculas, acentos, signos y espacios de más para comparar lo que escribe el usuario
function normalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’‘ʼ]/g, '')
    .replace(/[¿?¡!.,;:"“”()\-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mezclar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temporal = copia[i]
    copia[i] = copia[j]
    copia[j] = temporal
  }
  return copia
}

function sonar(src) {
  detenerVoz() // si Lobita está hablando, se calla para que se oiga la palabra
  if (!src) return
  const audio = new Audio(src)
  audio.play().catch(() => { })
}

// Separa una frase en palabras, dejando aparte los signos (¿ ? ¡ ! , .) para que no den pistas
function palabrasDeFrase(frase) {
  return frase
    .trim()
    .split(/\s+/)
    .map((token) => {
      const m = token.match(/^([¿¡"“(]*)(.*?)([?!.,;:"”)]*)$/)
      return { antes: m[1], texto: m[2], despues: m[3] }
    })
}

// Prepara una pregunta de "completa la frase": tapa una palabra y busca 3 opciones equivocadas
function armarHueco(p, palabras, todasLasPalabras, campo = 'nahuatl') {
  const partes = palabrasDeFrase(p[campo])
  const clave = (t) => normalizar(t)

  // Cuántas frases de la lección usan cada palabra: se tapa la que menos se repite
  const frecuencia = {}
  palabras.forEach((q) => {
    new Set(palabrasDeFrase(q[campo]).map((x) => clave(x.texto))).forEach((k) => {
      frecuencia[k] = (frecuencia[k] || 0) + 1
    })
  })
  const candidatos = partes.map((x, i) => i).filter((i) => partes[i].texto)
  const minimo = Math.min(...candidatos.map((i) => frecuencia[clave(partes[i].texto)] || 1))
  const posibles = candidatos.filter((i) => (frecuencia[clave(partes[i].texto)] || 1) === minimo)
  const hueco = posibles[Math.floor(Math.random() * posibles.length)]
  const correcta = partes[hueco].texto

  // Opciones equivocadas: palabras de otras frases que no aparezcan en esta
  const enLaFrase = new Set(partes.map((x) => clave(x.texto)))
  const vistos = new Set()
  const distractores = []
  for (const q of [...mezclar(palabras), ...mezclar(todasLasPalabras)]) {
    if (q.nahuatl.startsWith('(falta)')) continue
    for (const x of mezclar(palabrasDeFrase(q[campo]))) {
      const k = clave(x.texto)
      if (!x.texto || enLaFrase.has(k) || vistos.has(k)) continue
      vistos.add(k)
      distractores.push(x.texto)
      break // una palabra por frase, para que haya variedad
    }
    if (distractores.length === 3) break
  }
  return { partes, hueco, opciones: mezclar([correcta, ...distractores]) }
}

// Los números en español, del 1 al 20, para saber qué número es cada palabra
const NUMEROS_EN_ESPANOL = [
  'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho',
  'diecinueve', 'veinte',
]

// Devuelve el número (1 a 20) de una palabra, o null si no es un número.
// Si la palabra trae el campo "numero" en lecciones.js, se usa ese.
function numeralDe(palabra) {
  if (palabra.numero) return palabra.numero
  const i = NUMEROS_EN_ESPANOL.indexOf(normalizar(palabra.espanol))
  return i === -1 ? null : i + 1
}

// Elige 3 opciones equivocadas distintas (que no repitan el texto que va en los botones)
function elegirDistractores(p, palabras, todasLasPalabras, campo) {
  const vistos = new Set([p[campo]])
  const elegidas = []
  for (const q of [...mezclar(palabras), ...mezclar(todasLasPalabras)]) {
    if (elegidas.length === 3) break
    if (q.nahuatl === p.nahuatl) continue // misma palabra en náhuatl: también sería correcta
    if (vistos.has(q[campo])) continue
    vistos.add(q[campo])
    elegidas.push(q)
  }
  return elegidas
}

// Elige colores para una actividad del repaso: primero los que aún no han salido
function elegirColores(palabras, cantidad, usados) {
  const nuevos = mezclar(palabras.filter((p) => !usados.has(p.nahuatl)))
  const elegidos = nuevos.slice(0, cantidad)
  if (elegidos.length < cantidad) {
    const resto = mezclar(palabras.filter((p) => !elegidos.includes(p)))
    elegidos.push(...resto.slice(0, cantidad - elegidos.length))
  }
  elegidos.forEach((p) => usados.add(p.nahuatl))
  return mezclar(elegidos)
}

// Arma el número: fichas con las piezas del número en náhuatl + 3 piezas de otros números
function armarNumero(p, palabras, todasLasPalabras) {
  const piezas = p.nahuatl.trim().split(/\s+/)
  const enNumero = new Set(piezas.map(normalizar))
  const vistas = new Set()
  const equivocadas = []
  for (const q of [...mezclar(palabras), ...mezclar(todasLasPalabras)]) {
    for (const t of q.nahuatl.trim().split(/\s+/)) {
      const k = normalizar(t)
      if (enNumero.has(k) || vistas.has(k)) continue
      vistas.add(k)
      equivocadas.push(t)
    }
    if (equivocadas.length >= 3) break
  }
  const fichas = [
    ...piezas.map((t, i) => ({ id: `n${i}`, texto: t })),
    ...equivocadas.slice(0, 3).map((t, i) => ({ id: `x${i}`, texto: t })),
  ]
  return { palabra: { ...p, modoArmar: 'numero', audios: [], solucion: piezas }, opciones: mezclar(fichas) }
}

// Mezcla los números de modo que ninguno quede junto a su anterior o siguiente (7 y 8, 12 y 13...)
function mezclarSinConsecutivos(lista) {
  let ultima = mezclar(lista)
  for (let intento = 0; intento < 300; intento++) {
    const prueba = mezclar(lista)
    const bien = prueba.every(
      (p, i) => i === 0 || Math.abs((numeralDe(p) || 0) - (numeralDe(prueba[i - 1]) || 0)) !== 1,
    )
    if (bien) return prueba
    ultima = prueba
  }
  return ultima
}

// "1-10" → solo los números del 1 al 10, revueltos
function palabrasDelRango(palabras, rango) {
  const [desde, hasta] = rango.split('-').map(Number)
  return mezclarSinConsecutivos(
    palabras.filter((p) => {
      const n = numeralDe(p)
      return n >= desde && n <= hasta
    }),
  )
}

// Arma la lista de pasos de la lección en el orden que indique "actividades"
function construirFases(palabrasLeccion, todasLasPalabras, actividades) {
  const puntuables = actividades.filter((a) => a !== 'escuchar')
  const de = puntuables.length
  const numeroDe = (tipo) => puntuables.indexOf(tipo) + 1
  const fases = []
  const usadosRepaso = new Set() // combinaciones ya usadas (para no repetirlas entre actividades)
  const usadosColor = new Set() // colores ya preguntados (para que entren los 11 en el repaso)

  actividades.forEach((entrada) => {
    // "escritura@1-10" = la actividad "escritura" solo con los números del 1 al 10
    const [tipo, rango] = entrada.split('@')
    const palabras = rango ? palabrasDelRango(palabrasLeccion, rango) : palabrasLeccion
    const numeroDe = () => puntuables.indexOf(entrada) + 1
    if (tipo === 'escuchar') {
      palabras.forEach((p) => fases.push({ tipo, palabra: { ...p, audio: p.audioCompleto || p.audio } }))
    } else if (tipo === 'unir' || tipo === 'unirNumero') {
      fases.push({ tipo, palabras, numero: numeroDe(tipo), de })
    } else if (tipo === 'opcion' || tipo === 'escuchaElige' || tipo === 'leeElige' || tipo === 'leeNahuatl') {
      // Los botones llevan la palabra en español en "escuchaElige" y "leeNahuatl"
      const campo = tipo === 'escuchaElige' || tipo === 'leeNahuatl' ? 'espanol' : 'nahuatl'
      palabras.forEach((p) => {
        const opciones = mezclar([p, ...elegirDistractores(p, palabras, todasLasPalabras, campo)])
        // En "opcion" suena la palabra en español (si existe) y se elige el náhuatl
        const palabraConAudio = tipo === 'opcion' ? { ...p, audio: p.audioEspanol || p.audio } : p
        fases.push({ tipo, palabra: palabraConAudio, opciones, numero: numeroDe(tipo), de })
      })
    } else if (tipo === 'completa' || tipo === 'completaEs' || tipo === 'completaPalabra') {
      // 'completa': frase en náhuatl (con la traducción arriba)
      // 'completaEs': escucha el náhuatl y completa la frase en español
      const campo = tipo === 'completaEs' ? 'espanol' : 'nahuatl'
      palabras
        .filter((p) => !p.nahuatl.startsWith('(falta)') && palabrasDeFrase(p[campo]).filter((x) => x.texto).length >= 2)
        .forEach((p) => {
          const hueco = armarHueco(p, palabras, todasLasPalabras, campo)
          if (hueco.opciones.length >= 3) {
            fases.push({
              tipo: 'completa', // el reproductor usa el mismo paso para las dos
              palabra:
                tipo === 'completaEs'
                  ? { ...p, modoCompleta: 'espanol' }
                  : tipo === 'completaPalabra'
                    ? { ...p, modoCompleta: 'palabra' }
                    : p,
              ...hueco,
              numero: numeroDe(tipo),
              de,
            })
          }
        })
    } else if (tipo === 'miraColor' || tipo === 'escuchaColor') {
      // Repaso de Colores: 10 preguntas por actividad con los colores revueltos, y las 10 opciones
      const modoColor = tipo === 'miraColor' ? 'mira' : 'escucha'
      elegirColores(palabras, 10, usadosColor).forEach((p) => {
        const opciones = mezclar([p, ...mezclar(palabras.filter((q) => q.nahuatl !== p.nahuatl)).slice(0, 5)])
        fases.push({ tipo: 'completa', palabra: { ...p, modoColor }, partes: [], hueco: 0, opciones, numero: numeroDe(tipo), de })
      })
    } else if (tipo === 'escuchaFrase') {
      // Escucha la frase en náhuatl y arma su traducción en español con fichas (todas las frases de la lección)
      palabras
        .filter((p) => !p.nahuatl.startsWith('(falta)'))
        .forEach((p) =>
          fases.push({ tipo: 'completa', ...preguntaEscuchaFrase(p, [...palabras, ...todasLasPalabras]), numero: numeroDe(tipo), de }),
        )
    } else if (tipo === 'escuchaArma' || tipo === 'leeArma' || tipo === 'completaDialogo') {
      // Repaso general de Frases: las combinaciones salen de lecciones.js (campo "combinaciones")
      const combinaciones = Object.values(contenidoLecciones).flatMap((c) => Object.values(c)).flatMap((l) => l.combinaciones || [])
      armarPreguntasRepaso(tipo, combinaciones, palabras, usadosRepaso, 10).forEach((q) =>
        fases.push({ tipo: 'completa', ...q, numero: numeroDe(tipo), de }),
      )
    } else if (tipo === 'parejaFamilia' || tipo === 'dictadoFamilia' || tipo === 'verdaderoFalso') {
      // Repaso general de Familia: 10 preguntas al azar por actividad
      armarPreguntasFamilia(tipo, palabras).forEach((q) =>
        fases.push({ tipo: 'completa', ...q, numero: numeroDe(tipo), de }),
      )
    } else if (tipo === 'armaNumero') {
      palabras.forEach((p) =>
        fases.push({ tipo: 'completa', ...armarNumero(p, palabras, todasLasPalabras), numero: numeroDe(tipo), de }),
      )
    } else if (tipo === 'escritura') {
      palabras.forEach((p) => fases.push({ tipo, palabra: p, numero: numeroDe(tipo), de }))
    }
  })

  return fases
}

// Reproduce el audio de una palabra
function useAudio(src) {
  const audioRef = useRef(null)
  const [aviso, setAviso] = useState(false)

  function reproducir() {
    detenerVoz()
    setAviso(false)
    if (!src) {
      setAviso(true)
      return
    }
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(src)
    audioRef.current = audio
    audio.play().catch(() => setAviso(true))
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  return { reproducir, aviso }
}

/* ---------- Piezas de la pantalla ---------- */

function Cabecera({ titulo, onVolver }) {
  return (
    <header className="lp-cabecera">
      <button className="lp-volver" onClick={onVolver} aria-label="Volver">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="lp-cabecera-titulo">{titulo}</h1>
    </header>
  )
}

// Dibuja a la mascota en el "destino" (fuera del bloque escalado de la actividad).
// "grande" se usa en la pantalla final del repaso general, donde la mascota se ve más grande.
function ZonaMascota({ children, grande }) {
  const destino = useContext(DestinoMascotaContext)
  if (!destino) return null
  return createPortal(
    <div className={`lp-mascota-zona ${grande ? 'grande' : ''}`}>{children}</div>,
    destino,
  )
}

// Usa la rutina de la categoría; durante los primeros segundos muestra la frase de inicio de Lobita
function MascotaPista({ pista }) {
  const { rutina, saludo } = useContext(RutinaContext)
  return (
    <ZonaMascota>
      <Mascota rutina={rutina} mensaje={saludo || pista} tamano="pequeno" globo="derecha" />
    </ZonaMascota>
  )
}

function Muestra({ color }) {
  return <span className="lp-muestra" style={{ background: color }}></span>
}

// Reacciones de la mascota que van rotando, para que no sea siempre la misma
const ESTADOS_ACIERTO = ['feliz', 'emocionada', 'agradecida', 'orgullosa', 'celebra', 'baila']
const ESTADOS_ERROR = ['animo', 'timida', 'piensa']
let turnoAcierto = Math.floor(Math.random() * ESTADOS_ACIERTO.length)
let turnoError = Math.floor(Math.random() * ESTADOS_ERROR.length)

// Barra que sube desde abajo cuando el usuario comprueba su respuesta
function BarraResultado({ resultado, detalle, textoBoton, onClick }) {
  const correcto = resultado === 'correcto'
  // Lobita habla siempre (acierto o error), con una frase distinta cada vez
  const [frase] = useState(() => elegirFrase(correcto ? 'acierto' : 'error'))
  // El título es lo mismo que dice Lobita (si la voz falla, uno de los títulos escritos)
  const [titulo] = useState(() =>
    frase && frase.texto
      ? (correcto ? exclamar(frase.texto) : frase.texto)
      : elegir(correcto ? TITULOS_ACIERTO : TITULOS_ERROR)
  )
  const [estadoMascota] = useState(() =>
    correcto
      ? ESTADOS_ACIERTO[turnoAcierto++ % ESTADOS_ACIERTO.length]
      : ESTADOS_ERROR[turnoError++ % ESTADOS_ERROR.length]
  )
  useEffect(() => { decir(frase) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`lp-barra ${correcto ? 'correcta' : 'incorrecta'}`} role="status">
      <div className="lp-barra-contenido">
        <div className="lp-barra-info">
          <Mascota estado={estadoMascota} tamano="barra" entrada={correcto ? 'zoom' : 'aparecer'} />
          <div>
            <p className="lp-barra-titulo">{titulo}</p>
            {detalle && <p className="lp-barra-detalle">{detalle}</p>}
          </div>
        </div>
        <button className="lp-boton lp-boton-barra" onClick={onClick}>{textoBoton}</button>
      </div>
    </div>
  )
}

/* ---------- Paso: escuchar y repetir ---------- */

function PasoEscuchaRepite({ palabra, onContinuar }) {
  const { saludo, primero } = useContext(RutinaContext)
  // En la primera palabra ya habló el inicio de la lección; en las demás da la instrucción
  const textoEscucha = useLobita('escucha', { activo: !primero })
  const { reproducir, aviso } = useAudio(palabra.audio)
  const huboGrabacionRef = useRef(false)
  // inactiva | grabando | lista | error | permitido
  const [grabacion, setGrabacion] = useState('inactiva')
  const [modoToque, setModoToque] = useState(false) // true si el usuario tocó en vez de mantener presionado
  const grabadorRef = useRef(null)
  const quiereGrabarRef = useRef(false) // el usuario quiere que se esté grabando
  const modoToqueRef = useRef(false)
  const inicioPulsoRef = useRef(0)

  async function iniciar() {
    quiereGrabarRef.current = true
    const antes = Date.now()
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
      // El usuario ya soltó el botón mientras el navegador pedía el permiso
      if (!quiereGrabarRef.current) {
        flujo.getTracks().forEach((t) => t.stop())
        if (Date.now() - antes > 600) setGrabacion('permitido') // acaba de dar el permiso
        return
      }
      const grabador = new MediaRecorder(flujo)
      grabador.onstop = () => {
        flujo.getTracks().forEach((t) => t.stop())
        huboGrabacionRef.current = true
        setGrabacion('lista')
      }
      grabador.start()
      grabadorRef.current = grabador
      setGrabacion('grabando')
    } catch {
      quiereGrabarRef.current = false
      setGrabacion('error')
    }
  }

  function terminar() {
    quiereGrabarRef.current = false
    modoToqueRef.current = false
    setModoToque(false)
    const grabador = grabadorRef.current
    if (grabador && grabador.state === 'recording') grabador.stop()
  }

  function alPresionar(e) {
    // Mantiene el seguimiento del cursor aunque se salga del botón
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId)
    const grabando = grabadorRef.current && grabadorRef.current.state === 'recording'
    // Si ya está grabando (porque tocó antes), este toque termina la grabación
    if (modoToqueRef.current || grabando) {
      terminar()
      return
    }
    inicioPulsoRef.current = Date.now()
    iniciar()
  }

  function alSoltar() {
    if (!quiereGrabarRef.current || modoToqueRef.current) return
    if (Date.now() - inicioPulsoRef.current < 400) {
      // Fue un toque corto: sigue grabando hasta que vuelva a tocar el micrófono
      modoToqueRef.current = true
      setModoToque(true)
    } else {
      terminar()
    }
  }

  // Al terminar de grabar, Lobita felicita
  useEffect(() => {
    if (grabacion === 'lista' && huboGrabacionRef.current) decirLobita('avance')
  }, [grabacion])

  useEffect(() => {
    return () => {
      quiereGrabarRef.current = false
      const grabador = grabadorRef.current
      if (grabador && grabador.state === 'recording') grabador.stop()
    }
  }, [])

  let estado = 'reposo'
  let mensaje = '¡Escucha con atención y luego repite conmigo!'
  if (grabacion === 'lista') {
    estado = 'feliz'
    mensaje = '¡Muy bien! Ya practicaste esta palabra.'
  } else if (grabacion === 'permitido') {
    estado = 'feliz'
    mensaje = '¡Listo! Ya puedes usar el micrófono. Inténtalo otra vez.'
  } else if (grabacion === 'error') {
    estado = 'animo'
    mensaje = 'No pude usar el micrófono. Revisa el permiso del navegador.'
  }

  const textoMic = {
    inactiva: 'Mantén presionado y repite (o toca para empezar y toca para terminar)',
    grabando: modoToque
      ? 'Grabando... toca de nuevo para terminar'
      : 'Grabando... suelta o toca de nuevo para terminar',
    lista: 'Listo. Puedes grabar otra vez o continuar.',
    permitido: 'Micrófono permitido. Mantén presionado y repite.',
    error: 'No se pudo usar el micrófono',
  }[grabacion]

  return (
    <>
      <ZonaMascota>
        <Mascota
          estado={estado}
          mensaje={grabacion === 'inactiva' ? (saludo || textoEscucha || mensaje) : mensaje}
          tamano="pequeno"
          globo="derecha"
        />
      </ZonaMascota>

      <div className="lp-tarjeta">
        {palabra.colorHex && <Muestra color={palabra.colorHex} />}
        {palabra.imagen && <img className="lp-imagen" src={palabra.imagen} alt={palabra.espanol} />}
        <h2 className="lp-palabra">{palabra.nahuatl}</h2>
        <p className="lp-traduccion">{palabra.espanol}</p>

        <button className="lp-audio" onClick={reproducir} aria-label="Escuchar la palabra">
          <IconAltavoz />
        </button>
        {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}

        <button
          className={`lp-mic ${grabacion === 'grabando' ? 'grabando' : ''}`}
          onPointerDown={alPresionar}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Mantén presionado o toca para grabar tu voz"
        >
          <IconMicrofono />
        </button>
        <p className="lp-ayuda">{textoMic}</p>
        {grabacion === 'error' && (
          <p className="lp-aviso">
            Haz clic en el ícono junto a la dirección de la página, permite el micrófono y recarga.
          </p>
        )}

        <button className="lp-boton-secundario" onClick={reproducir}>Repetir audio</button>

        {(grabacion === 'inactiva' || grabacion === 'error' || grabacion === 'permitido') && (
          <button className="lp-enlace" onClick={() => setGrabacion('lista')}>
            No puedo usar el micrófono ahora
          </button>
        )}
      </div>

      <button className="lp-boton" onClick={() => onContinuar(false)} disabled={grabacion !== 'lista'}>
        Continuar
      </button>
    </>
  )
}

// La "imagen" de un número: el número y, debajo, puntos que muestran la cantidad.
// Si la palabra trae el campo "imagen" en lecciones.js, se usa esa imagen.
function ImagenNumero({ palabra }) {
  if (palabra.imagen) {
    return <img className="lp-mini-imagen" src={palabra.imagen} alt="" />
  }
  const n = numeralDe(palabra)
  if (!n) return <span>{palabra.espanol}</span>
  return (
    <>
      <span className="lp-mini-numero">{n}</span>
      <span className="lp-mini-cantidad" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="lp-mini-punto"></span>
        ))}
      </span>
    </>
  )
}

/* ---------- Paso: unir las parejas ---------- */

// modo 'palabras': une cada palabra en náhuatl con su traducción en español
// modo 'numeros':  une la imagen de cada número con su palabra en náhuatl
function PasoUnir({ modo = 'palabras', palabras, numero, de, onSiguiente }) {
  const [izquierda] = useState(() => mezclar(palabras))
  const [derecha] = useState(() => mezclar(palabras))
  const [selIzq, setSelIzq] = useState(null) // id del elemento elegido a la izquierda
  const [selDer, setSelDer] = useState(null) // elemento elegido a la derecha
  const [unidas, setUnidas] = useState([]) // parejas ya unidas: { izq, der }
  const [fallo, setFallo] = useState(null) // { izq, der } mientras parpadea en rojo
  const [huboError, setHuboError] = useState(false)
  const temporizador = useRef(null)

  useEffect(() => {
    return () => clearTimeout(temporizador.current)
  }, [])

  const esNumeros = modo === 'numeros'
  // Cada botón de la izquierda tiene su propio id (primo y prima se escriben igual en náhuatl)
  const idIzq = (p) => `${p.nahuatl}|${p.espanol}`
  // Qué valor identifica a cada elemento de la derecha
  const valorDerecha = (p) => (esNumeros ? p.nahuatl : p.espanol)
  const completo = unidas.length === palabras.length
  const izqUnidas = unidas.map((u) => u.izq)
  const derUnidas = unidas.map((u) => u.der)

  function evaluar(izq, der) {
    const palabra = palabras.find((p) => idIzq(p) === izq)
    // Si dos palabras se escriben igual en náhuatl, cualquiera de sus traducciones es válida
    const acierta = palabras.some((q) => q.nahuatl === palabra.nahuatl && valorDerecha(q) === der)
    if (acierta) {
      setUnidas((u) => [...u, { izq, der }])
      setSelIzq(null)
      setSelDer(null)
    } else {
      setHuboError(true)
      setFallo({ izq, der })
      temporizador.current = setTimeout(() => {
        setFallo(null)
        setSelIzq(null)
        setSelDer(null)
      }, 700)
    }
  }

  function elegirIzquierda(p) {
    if (fallo || izqUnidas.includes(idIzq(p))) return
    if (!esNumeros) sonar(p.audio)
    else sonar(p.audioEspanol) // el número suena en español ("dos")
    const nuevo = selIzq === idIzq(p) ? null : idIzq(p)
    setSelIzq(nuevo)
    if (nuevo && selDer) evaluar(nuevo, selDer)
  }

  function elegirDerecha(p) {
    if (fallo || derUnidas.includes(valorDerecha(p))) return
    if (esNumeros) sonar(p.audio)
    else if (p.audioEspanol) sonar(p.audioEspanol) // la palabra en español suena en español
    const nuevo = selDer === valorDerecha(p) ? null : valorDerecha(p)
    setSelDer(nuevo)
    if (nuevo && selIzq) evaluar(selIzq, nuevo)
  }

  function claseIzquierda(p) {
    let clase = 'lp-par'
    if (esNumeros) clase += ' imagen'
    if (izqUnidas.includes(idIzq(p))) clase += ' unida'
    else if (fallo && fallo.izq === idIzq(p)) clase += ' fallo'
    else if (selIzq === idIzq(p)) clase += ' seleccionada'
    return clase
  }

  function claseDerecha(p) {
    let clase = 'lp-par'
    if (derUnidas.includes(valorDerecha(p))) clase += ' unida'
    else if (fallo && fallo.der === valorDerecha(p)) clase += ' fallo'
    else if (selDer === valorDerecha(p)) clase += ' seleccionada'
    return clase
  }

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      <p className="lp-instruccion">
        {esNumeros ? 'Une cada número con su nombre en náhuatl' : 'Selecciona los pares'}
      </p>
      {/* Esta actividad también tiene mascota */}
      {!completo && (
        <MascotaPista pista={esNumeros ? 'Une cada número con su nombre en náhuatl' : 'Une cada palabra con su traducción'} />
      )}

      <div className="lp-pares">
        <div className="lp-columna">
          {izquierda.map((p) => (
            <button key={idIzq(p)} className={claseIzquierda(p)} onClick={() => elegirIzquierda(p)}>
              {esNumeros ? <ImagenNumero palabra={p} /> : p.nahuatl}
            </button>
          ))}
        </div>
        <div className="lp-columna">
          {derecha.map((p) => (
            <button key={valorDerecha(p)} className={claseDerecha(p)} onClick={() => elegirDerecha(p)}>
              {!esNumeros && p.colorHex && (
                <span className="lp-par-muestra" style={{ background: p.colorHex }}></span>
              )}
              {valorDerecha(p)}
            </button>
          ))}
        </div>
      </div>

      {completo && (
        <BarraResultado
          resultado="correcto"
          textoBoton="Continuar"
          onClick={() => onSiguiente(!huboError)}
        />
      )}
    </>
  )
}

// modo 'opcion':       escucha el audio y elige la palabra en náhuatl
// modo 'escuchaElige': escucha el audio y elige su significado en español
// modo 'leeElige':     lee la palabra en español y elige cómo se dice en náhuatl
function PasoOpcionMultiple({ modo, palabra, opciones, numero, de, onSiguiente }) {
  const { reproducir, aviso } = useAudio(palabra.audio)
  const [seleccion, setSeleccion] = useState(null)
  const [resultado, setResultado] = useState(null) // null | correcto | incorrecto
  const [fallos, setFallos] = useState(0)

  const idDe = (op) => `${op.nahuatl}|${op.espanol}`
  const textoBoton = (op) => (modo === 'escuchaElige' || modo === 'leeNahuatl' ? op.espanol : op.nahuatl)
  const pistas = {
    opcion: 'Escucha el audio y escoge la respuesta correcta',
    escuchaElige: 'Escucha la palabra y elige su significado en español',
    leeElige: 'Lee la palabra y elige cómo se dice en náhuatl',
    leeNahuatl: 'Lee la palabra en náhuatl y elige su significado en español',
  }

  // Texto fijo que explica en qué consiste la actividad (se ve arriba del audio)
  const instrucciones = {
    opcion: palabra.audioEspanol
      ? 'Escucha la palabra en español y elige cómo se dice en náhuatl'
      : 'Escucha la palabra y elige cómo se escribe en náhuatl',
    escuchaElige: 'Escucha la palabra en náhuatl y elige su significado en español',
    leeElige: 'Lee la palabra en español y elige cómo se dice en náhuatl',
    numeroElige: 'Mira el número y elige cómo se dice en náhuatl',
    leeNahuatl: 'Lee la palabra en náhuatl y elige su significado en español',
  }

  function comprobar() {
    const acierto = seleccion === idDe(palabra)
    if (!acierto) setFallos((f) => f + 1)
    setResultado(acierto ? 'correcto' : 'incorrecto')
  }

  function reintentar() {
    setSeleccion(null)
    setResultado(null)
  }

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      <p className="lp-instruccion">{instrucciones[modo]}</p>
      {resultado === null && <MascotaPista pista={pistas[modo]} />}

      {modo === 'leeElige' || modo === 'leeNahuatl' ? (
        <div className="lp-tarjeta">
          <p className="lp-traduccion">Lee la palabra</p>
          <h2 className="lp-palabra">{modo === 'leeNahuatl' ? palabra.nahuatl : palabra.espanol}</h2>
        </div>
      ) : (
        <>
          <button className="lp-audio" onClick={reproducir} aria-label="Escuchar la palabra">
            <IconAltavoz />
          </button>
          {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}
          {!palabra.audio && (
            <p className="lp-ayuda">
              {modo === 'escuchaElige' ? `Dice: ${palabra.nahuatl}` : `Significa: ${palabra.espanol}`}
            </p>
          )}
        </>
      )}
      {resultado !== 'correcto' && (
        <AyudaRepaso
          fallos={fallos}
          nahuatl={modo === 'opcion' || modo === 'escuchaElige' ? palabra.nahuatl : undefined}
          espanol={modo === 'opcion' || modo === 'escuchaElige' ? palabra.espanol : undefined}
          respuesta={textoBoton(palabra)}
          onSaltar={() => onSiguiente(false)}
        />
      )}
      <div className="lp-opciones">
        {opciones.map((op) => {
          const id = idDe(op)
          let clase = 'lp-opcion'
          if (seleccion === id) {
            clase += resultado ? (resultado === 'correcto' ? ' correcta' : ' incorrecta') : ' seleccionada'
          }
          return (
            <button
              key={id}
              className={clase}
              disabled={resultado !== null}
              onClick={() => setSeleccion(id)}
            >
              {textoBoton(op)}
            </button>
          )
        })}
      </div>

      {resultado === null ? (
        <button className="lp-boton" onClick={comprobar} disabled={!seleccion}>Comprobar</button>
      ) : (
        <BarraResultado
          resultado={resultado}
          textoBoton={resultado === 'correcto' ? 'Continuar' : 'Intentar de nuevo'}
          onClick={resultado === 'correcto' ? () => onSiguiente(fallos === 0) : reintentar}
        />
      )}
    </>
  )
}

/* ---------- Paso: completa la frase ---------- */

function PasoCompletaHueco({ palabra, partes, hueco, opciones, numero, de, onSiguiente }) {
  const escucha = palabra.modoCompleta === 'espanol' // escucha el náhuatl y completa en español
  const { reproducir, aviso } = useAudio(palabra.audio)
  const [seleccion, setSeleccion] = useState(null)
  const [resultado, setResultado] = useState(null) // null | correcto | incorrecto
  const [fallos, setFallos] = useState(0)
  const correcta = partes[hueco].texto

  function comprobar() {
    const acierto = seleccion === correcta
    if (!acierto) setFallos((f) => f + 1)
    setResultado(acierto ? 'correcto' : 'incorrecto')
  }

  function reintentar() {
    setSeleccion(null)
    setResultado(null)
  }

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      <p className="lp-instruccion">
        {escucha
          ? 'Escucha y completa la frase en español'
          : palabra.modoCompleta === 'palabra'
            ? 'Completa la palabra en náhuatl'
            : 'Completa la frase'}
      </p>
      {resultado === null && (
        <MascotaPista pista={escucha ? 'Escucha la frase y elige la palabra que falta en español' : 'Elige la palabra que falta'} />
      )}

      {escucha && (
        <>
          <button className="lp-audio" onClick={reproducir} aria-label="Escuchar la frase">
            <IconAltavoz />
          </button>
          {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}
          {!palabra.audio && <p className="lp-ayuda">Dice: {palabra.nahuatl}</p>}
        </>
      )}

      <div className="lp-tarjeta">
        {!escucha && <p className="lp-traduccion">{palabra.espanol}</p>}
        <p className="lp-frase">
          {partes.map((parte, i) => (
            <span key={i} className="lp-token">
              {parte.antes}
              {i === hueco ? (
                <button
                  className={`lp-hueco ${seleccion ? 'lleno' : ''} ${resultado === 'correcto' ? 'correcta' : resultado === 'incorrecto' ? 'incorrecta' : ''}`}
                  disabled={!seleccion || resultado !== null}
                  onClick={() => setSeleccion(null)}
                  aria-label="Espacio en blanco"
                >
                  {seleccion || '\u00A0'}
                </button>
              ) : (
                parte.texto
              )}
              {parte.despues}
            </span>
          ))}
        </p>
      </div>
      {resultado !== 'correcto' && (
        <AyudaRepaso
          fallos={fallos}
          respuesta={partes.map((x) => x.antes + x.texto + x.despues).join(' ')}
          onSaltar={() => onSiguiente(false)}
        />
      )}
      <div className="lp-fichas">
        {opciones.map((op) => (
          <button
            key={op}
            className={`lp-ficha ${seleccion === op ? 'usada' : ''}`}
            disabled={resultado !== null || seleccion === op}
            onClick={() => setSeleccion(op)}
          >
            {op}
          </button>
        ))}
      </div>

      {resultado === null ? (
        <button className="lp-boton" onClick={comprobar} disabled={!seleccion}>Comprobar</button>
      ) : (
        <BarraResultado
          resultado={resultado}
          textoBoton={resultado === 'correcto' ? 'Continuar' : 'Intentar de nuevo'}
          onClick={resultado === 'correcto' ? () => onSiguiente(fallos === 0) : reintentar}
        />
      )}
    </>
  )
}

/* ---------- Paso: arma la frase con fichas (repaso de Frases) ---------- */

// modo 'escucha': suena la frase en náhuatl y se arma la traducción en español (fichas con palabras)
// modo 'lee':     se lee la frase en español y se arma el náhuatl (fichas con frases)
function PasoArmar({ palabra, opciones, numero, de, onSiguiente }) {
  const esDictado = palabra.modoArmar === 'dictado'
  const escucha = palabra.modoArmar === 'escucha' || esDictado
  const esNumero = palabra.modoArmar === 'numero'
  const [elegidas, setElegidas] = useState([]) // ids de las fichas, en el orden en que se tocaron
  const [resultado, setResultado] = useState(null) // null | correcto | incorrecto
  const [fallos, setFallos] = useState(0)
  const [aviso, setAviso] = useState(false)
  const audioRef = useRef(null)

  const textoDe = (id) => opciones.find((o) => o.id === id).texto

  function detener() {
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.pause()
    }
  }

  // Reproduce los audios de las frases uno tras otro (la frase del repaso une varias)
  function reproducir() {
    detener()
    if (!palabra.audios.length) {
      setAviso(true)
      return
    }
    setAviso(false)
    let i = 0
    const siguiente = () => {
      if (i >= palabra.audios.length) return
      const audio = new Audio(palabra.audios[i])
      i += 1
      audioRef.current = audio
      audio.onended = siguiente
      audio.onerror = () => setAviso(true)
      audio.play().catch(() => setAviso(true))
    }
    siguiente()
  }

  useEffect(() => detener, [])

  function tocarFicha(id) {
    if (resultado !== null) return
    setElegidas((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))
  }

  function comprobar() {
    const armada = elegidas.map((id) => normalizar(textoDe(id))).join(' ')
    const buscada = palabra.solucion.map(normalizar).join(' ')
    const acierto = armada === buscada
    if (!acierto) setFallos((f) => f + 1)
    setResultado(acierto ? 'correcto' : 'incorrecto')
  }

  function reintentar() {
    setElegidas([])
    setResultado(null)
  }

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      <p className="lp-instruccion">
        {esDictado
          ? 'Escucha y arma la palabra en náhuatl'
          : escucha
            ? 'Escucha y selecciona las palabras'
            : esNumero
              ? 'Arma el número en náhuatl'
              : 'Lee y selecciona las frases en náhuatl'}
      </p>
      {resultado === null && (
        <MascotaPista
          pista={
            esDictado
              ? 'Escucha con atención y arma la palabra con las fichas'
              : escucha
                ? 'Escucha y arma la frase en español'
                : esNumero
                  ? 'Toca las piezas en orden para armar el número'
                  : 'Arma la frase en náhuatl, en orden'
          }
        />
      )}

      {escucha ? (
        <>
          <button className="lp-audio" onClick={reproducir} aria-label="Escuchar la frase">
            <IconAltavoz />
          </button>
          {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}
        </>
      ) : (
        <div className="lp-tarjeta">
          {esNumero ? (
            <>
              <p className="lp-traduccion">Arma este número</p>
              <h2 className="lp-palabra">{numeralDe(palabra)}</h2>
              <p className="lp-traduccion">{palabra.espanol}</p>
            </>
          ) : (
            <>
              <p className="lp-traduccion">Lee la frase</p>
              <h2 className="lp-palabra">{palabra.espanol}</h2>
            </>
          )}
        </div>
      )}
      {resultado !== 'correcto' && (
        <AyudaRepaso
          fallos={fallos}
          nahuatl={escucha ? palabra.nahuatl : undefined}
          espanol={escucha ? palabra.espanol : undefined}
          respuesta={palabra.solucion.join(' ')}
          onSaltar={() => onSiguiente(false)}
        />
      )}
      <div className={`lp-armado ${resultado === 'correcto' ? 'correcta' : resultado === 'incorrecto' ? 'incorrecta' : ''}`}>
        {elegidas.length === 0 && <span className="lp-armado-vacio">Toca las fichas para armar la frase</span>}
        {elegidas.map((id) => (
          <button key={id} className="lp-ficha" disabled={resultado !== null} onClick={() => tocarFicha(id)}>
            {textoDe(id)}
          </button>
        ))}
      </div>

      <div className="lp-fichas">
        {opciones.map((op) => (
          <button
            key={op.id}
            className={`lp-ficha ${elegidas.includes(op.id) ? 'usada' : ''}`}
            disabled={resultado !== null || elegidas.includes(op.id)}
            onClick={() => tocarFicha(op.id)}
          >
            {op.texto}
          </button>
        ))}
      </div>

      {resultado === 'correcto' && escucha && (
        <p className="lp-ayuda">{esDictado ? `Significa: ${palabra.espanol}` : `Se dice: ${palabra.nahuatl}`}</p>
      )}

      {resultado === null ? (
        <button className="lp-boton" onClick={comprobar} disabled={elegidas.length === 0}>Comprobar</button>
      ) : (
        <BarraResultado
          resultado={resultado}
          textoBoton={resultado === 'correcto' ? 'Continuar' : 'Intentar de nuevo'}
          onClick={resultado === 'correcto' ? () => onSiguiente(fallos === 0) : reintentar}
        />
      )}
    </>
  )
}

// El reproductor sigue usando "PasoCompleta": este paso elige cuál de los dos se muestra
function PasoCompleta(props) {
  if (props.palabra.modoPareja) return <PasoPareja {...props} />
  if (props.palabra.modoVF) return <PasoVerdaderoFalso {...props} />
  if (props.palabra.modoColor) return <PasoColor {...props} />
  return props.palabra.modoArmar ? <PasoArmar {...props} /> : <PasoCompletaHueco {...props} />
}

/* ---------- Pasos del repaso de Familia ---------- */

// ¿Cuál es su pareja? (abuelo → abuela)
function PasoPareja({ palabra, opciones, numero, de, onSiguiente }) {
  const { reproducir, aviso } = useAudio(palabra.audio)
  const [seleccion, setSeleccion] = useState(null) // texto en náhuatl de la opción elegida
  const [resultado, setResultado] = useState(null) // null | correcto | incorrecto
  const [fallos, setFallos] = useState(0)

  function comprobar() {
    const acierto = seleccion === palabra.pareja.nahuatl
    if (!acierto) setFallos((f) => f + 1)
    setResultado(acierto ? 'correcto' : 'incorrecto')
  }

  function reintentar() {
    setSeleccion(null)
    setResultado(null)
  }

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      <p className="lp-instruccion">Elige la pareja de esta palabra en náhuatl</p>
      {resultado === null && <MascotaPista pista="Piensa en su versión femenina o masculina" />}

      <div className="lp-tarjeta">
        <p className="lp-traduccion">¿Cuál es la pareja de…?</p>
        <h2 className="lp-palabra">{palabra.nahuatl}</h2>
        <p className="lp-traduccion">{palabra.espanol}</p>
        <button className="lp-audio" onClick={reproducir} aria-label="Escuchar la palabra">
          <IconAltavoz />
        </button>
        {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}
      </div>
      {resultado !== 'correcto' && (
        <AyudaRepaso
          fallos={fallos}
          respuesta={palabra.pareja.nahuatl}
          onSaltar={() => onSiguiente(false)}
        />
      )}
      <div className="lp-opciones">
        {opciones.map((op) => {
          let clase = 'lp-opcion'
          if (seleccion === op) {
            clase += resultado ? (resultado === 'correcto' ? ' correcta' : ' incorrecta') : ' seleccionada'
          }
          return (
            <button key={op} className={clase} disabled={resultado !== null} onClick={() => setSeleccion(op)}>
              {op}
            </button>
          )
        })}
      </div>

      {resultado === null ? (
        <button className="lp-boton" onClick={comprobar} disabled={!seleccion}>Comprobar</button>
      ) : (
        <BarraResultado
          resultado={resultado}
          detalle={resultado === 'correcto' ? `${palabra.pareja.nahuatl} significa ${palabra.pareja.espanol}` : null}
          textoBoton={resultado === 'correcto' ? 'Continuar' : 'Intentar de nuevo'}
          onClick={resultado === 'correcto' ? () => onSiguiente(fallos === 0) : reintentar}
        />
      )}
    </>
  )
}

// Verdadero o falso: «Tatatsin» significa «Abuela»
function PasoVerdaderoFalso({ palabra, numero, de, onSiguiente }) {
  const { reproducir, aviso } = useAudio(palabra.audio)
  const [seleccion, setSeleccion] = useState(null) // 'verdadero' | 'falso'
  const [resultado, setResultado] = useState(null) // null | correcto | incorrecto
  const [fallos, setFallos] = useState(0)

  function comprobar() {
    const acierto = (seleccion === 'verdadero') === palabra.esVerdad
    if (!acierto) setFallos((f) => f + 1)
    setResultado(acierto ? 'correcto' : 'incorrecto')
  }

  function reintentar() {
    setSeleccion(null)
    setResultado(null)
  }

  const claseDe = (valor) => {
    let clase = 'lp-opcion'
    if (seleccion === valor) {
      clase += resultado ? (resultado === 'correcto' ? ' correcta' : ' incorrecta') : ' seleccionada'
    }
    return clase
  }

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      <p className="lp-instruccion">¿Es verdadera esta afirmación?</p>
      {resultado === null && <MascotaPista pista="Lee con atención: ¿esa es su traducción?" />}

      <div className="lp-tarjeta">
        <h2 className="lp-palabra">{palabra.nahuatl}</h2>
        <p className="lp-traduccion">significa</p>
        <h2 className="lp-palabra">{palabra.afirmacion}</h2>
        <button className="lp-audio" onClick={reproducir} aria-label="Escuchar la palabra">
          <IconAltavoz />
        </button>
        {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}
      </div>

      <div className="lp-opciones">
        <button className={claseDe('verdadero')} disabled={resultado !== null} onClick={() => setSeleccion('verdadero')}>
          Verdadero
        </button>
        <button className={claseDe('falso')} disabled={resultado !== null} onClick={() => setSeleccion('falso')}>
          Falso
        </button>
      </div>

      {resultado === null ? (
        <button className="lp-boton" onClick={comprobar} disabled={!seleccion}>Comprobar</button>
      ) : (
        <BarraResultado
          resultado={resultado}
          detalle={resultado === 'correcto' && !palabra.esVerdad ? `${palabra.nahuatl} significa ${palabra.espanol}` : null}
          textoBoton={resultado === 'correcto' ? 'Continuar' : 'Intentar de nuevo'}
          onClick={resultado === 'correcto' ? () => onSiguiente(fallos === 0) : reintentar}
        />
      )}
    </>
  )
}

/* ---------- Paso: repaso de Colores ---------- */

// modo 'mira':    se ve un círculo de color y se elige cómo se dice en náhuatl (6 botones)
// modo 'escucha': suena la palabra en náhuatl y se toca el círculo del color (6 círculos)
function PasoColor({ palabra, opciones, numero, de, onSiguiente }) {
  const escucha = palabra.modoColor === 'escucha'
  const { reproducir, aviso } = useAudio(palabra.audio)
  const [seleccion, setSeleccion] = useState(null) // náhuatl de la opción elegida
  const [resultado, setResultado] = useState(null) // null | correcto | incorrecto
  const [fallos, setFallos] = useState(0)

  function comprobar() {
    const acierto = seleccion === palabra.nahuatl
    if (!acierto) setFallos((f) => f + 1)
    setResultado(acierto ? 'correcto' : 'incorrecto')
  }

  function reintentar() {
    setSeleccion(null)
    setResultado(null)
  }

  const claseDe = (base, op) => {
    let clase = base
    if (seleccion === op.nahuatl) {
      clase += resultado ? (resultado === 'correcto' ? ' correcta' : ' incorrecta') : ' seleccionada'
    }
    return clase
  }
  const ayuda = resultado !== 'correcto' && (
    <AyudaRepaso
      fallos={fallos}
      nahuatl={escucha ? palabra.nahuatl : undefined}
      espanol={escucha ? palabra.espanol : undefined}
      respuesta={`${palabra.nahuatl} (${palabra.espanol})`}
      onSaltar={() => onSiguiente(false)}
    />
  )
  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      <p className="lp-instruccion">
        {escucha ? 'Escucha la palabra en náhuatl y toca el color' : 'Mira el color y elige cómo se dice en náhuatl'}
      </p>
      {resultado === null && (
        <MascotaPista pista={escucha ? 'Escucha con atención y toca el color correcto' : 'Mira el color y elige su nombre'} />
      )}

      {escucha ? (
        <>
          <button className="lp-audio" onClick={reproducir} aria-label="Escuchar la palabra">
            <IconAltavoz />
          </button>
          {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}
          <div className="lp-colores-grid">
            {opciones.map((op) => (
              <div key={op.nahuatl} className="lp-color-item">
                <button
                  className={claseDe('lp-color-opcion', op)}
                  style={{ background: op.colorHex }}
                  disabled={resultado !== null}
                  onClick={() => setSeleccion(op.nahuatl)}
                  aria-label={op.espanol}
                />
                <span className="lp-color-nombre">{op.espanol}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="lp-color-grande" style={{ background: palabra.colorHex }} aria-label="Color" />
          <div className="lp-opciones lp-opciones-seis">
            {opciones.map((op) => (
              <button
                key={op.nahuatl}
                className={claseDe('lp-opcion', op)}
                disabled={resultado !== null}
                onClick={() => setSeleccion(op.nahuatl)}
              >
                {op.nahuatl}
              </button>
            ))}
          </div>
        </>
      )}

      {resultado === null ? (
        <button className="lp-boton" onClick={comprobar} disabled={!seleccion}>Comprobar</button>
      ) : (
        <BarraResultado
          resultado={resultado}
          textoBoton={resultado === 'correcto' ? 'Continuar' : 'Intentar de nuevo'}
          onClick={resultado === 'correcto' ? () => onSiguiente(fallos === 0) : reintentar}
        />
      )}
    </>
  )
}

/* ---------- Paso: escritura ---------- */

// Después de cuántos errores aparece la ayuda para recordar cómo se escribe
const AYUDA_DESDE = 2

function PasoEscritura({ palabra, numero, de, onSiguiente }) {
  const { reproducir, aviso } = useAudio(palabra.audio)
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null) // null | correcto | incorrecto
  const [fallos, setFallos] = useState(0)
  const [verRespuesta, setVerRespuesta] = useState(false)
  const campoRef = useRef(null)
  useLobita('escritura') // "Recuerda cómo lo aprendimos" (una vez por lección)

  useEffect(() => {
    if (resultado === null && campoRef.current) campoRef.current.focus()
  }, [resultado])

  function comprobar() {
    if (!texto.trim()) return
    const acierto = normalizar(texto) === normalizar(palabra.nahuatl)
    if (!acierto) setFallos((f) => f + 1)
    setResultado(acierto ? 'correcto' : 'incorrecto')
  }

  function reintentar() {
    setTexto('')
    setResultado(null)
  }

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>

      {/* La mascota va arriba (antes estaba debajo de la tarjeta y había que bajar para verla) */}
      {resultado === null && <MascotaPista pista="¡Recuerda cómo lo aprendimos!" />}

      <div className="lp-tarjeta">
        {palabra.colorHex && <Muestra color={palabra.colorHex} />}
        <p className="lp-pregunta">
          ¿Cómo se dice «{palabra.espanol.replace(/^[¿¡\s]+|[?!.\s]+$/g, '').toLowerCase()}» en náhuatl?
        </p>
        <input
          ref={campoRef}
          className={`lp-input ${resultado === 'correcto' ? 'correcta' : resultado === 'incorrecto' ? 'incorrecta' : ''}`}
          type="text"
          placeholder="Escribe aquí..."
          value={texto}
          disabled={resultado !== null}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && resultado === null && comprobar()}
        />

        {fallos >= AYUDA_DESDE && resultado !== 'correcto' && (
          <div className="lp-ayuda-escritura">
            <p className="lp-ayuda-titulo">¿No recuerdas cómo se escribe?</p>
            {verRespuesta ? (
              <p className="lp-respuesta">
                Se escribe: <strong>{palabra.nahuatl}</strong>
              </p>
            ) : (
              <button className="lp-enlace" onClick={() => setVerRespuesta(true)}>
                Ver cómo se escribe
              </button>
            )}
            {palabra.audio && (
              <button className="lp-enlace" onClick={reproducir}>
                Escuchar la palabra
              </button>
            )}
            {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}
          </div>
        )}
      </div>
      {resultado !== 'correcto' && (
        <AyudaRepaso
          fallos={fallos}
          respuesta={palabra.nahuatl}
          onSaltar={() => onSiguiente(false)}
        />
      )}

      {resultado === null ? (
        <button className="lp-boton" onClick={comprobar} disabled={!texto.trim()}>Comprobar</button>
      ) : (
        <BarraResultado
          resultado={resultado}
          textoBoton={resultado === 'correcto' ? 'Continuar' : 'Intentar de nuevo'}
          onClick={resultado === 'correcto' ? () => onSiguiente(fallos === 0) : reintentar}
        />
      )}
    </>
  )
}

/* ---------- Pantalla final de la lección ---------- */

// (esta pantalla queda como estaba: mascota arriba del título, con su globo flotante)
function Resumen({ cantidadPalabras, precision, final, onContinuar, onRepasar }) {
  const textoFinal = useLobita(final ? 'finRepaso' : 'finLeccion', { ms: 6000 })
  return (
    <div className="lp-resumen">
      <Mascota estado="celebra" tamano="resumen" entrada="zoom" mensaje={textoFinal} flotar />
      <h2 className="lp-resumen-titulo">¡Completaste la lección!</h2>
      <div className="lp-stats">
        <div className="lp-stat naranja">
          <p className="lp-stat-cab">PALABRAS</p>
          <p className="lp-stat-valor">{cantidadPalabras}</p>
        </div>
        <div className="lp-stat verde">
          <p className="lp-stat-cab">PRECISIÓN</p>
          <p className="lp-stat-valor">{precision}%</p>
        </div>
      </div>
      <div className="lp-resumen-botones">
        <button className="lp-boton-secundario" onClick={onRepasar}>Repasar lección</button>
        <button className="lp-boton" onClick={onContinuar}>Continuar</button>
      </div>
    </div>
  )
}

/* ---------- Repaso general: pantalla de inicio y de resultados ---------- */

const TITULOS_REPASO = {
  miraColor: 'Mira y elige',
  escuchaColor: 'Escucha y toca el color',
  escuchaArma: 'Escucha y selecciona',
  leeArma: 'Lee y selecciona',
  completaDialogo: 'Completa la frase',
  unir: 'Une las parejas',
  unirNumero: 'Une número y nombre',
  opcion: 'Escucha y elige',
  escuchaElige: 'Escucha y selecciona',
  leeElige: 'Lee y selecciona',
  completa: 'Completa la frase',
  completaEs: 'Escucha y completa',
  escuchaFrase: 'Escucha y arma la frase',
  escritura: 'Escribe en náhuatl',
  leeNahuatl: 'Lee y selecciona',
  completaPalabra: 'Completa la palabra',
  parejaFamilia: '¿Cuál es su pareja?',
  dictadoFamilia: 'Escucha y arma',
  verdaderoFalso: 'Verdadero o falso',
}

const plural = (n) => `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`

// Colores de las tarjetas, en orden: verde, morado, naranja, azul
const ESTILO_REPASO = ['verde', 'morado', 'naranja', 'azul']

// Qué ícono lleva cada tipo de actividad
const ICONO_REPASO = {
  miraColor: 'doc', leeArma: 'doc', leeElige: 'doc',
  escuchaColor: 'audio', escuchaArma: 'audio', escuchaFrase: 'audio', escuchaElige: 'audio', opcion: 'audio',
  completaDialogo: 'lapiz', completa: 'lapiz', completaEs: 'lapiz', escritura: 'lapiz',
  parejaFamilia: 'doc', dictadoFamilia: 'audio', verdaderoFalso: 'lapiz',
}

function IconoRepaso({ tipo }) {
  const icono = ICONO_REPASO[tipo] || 'doc'
  if (icono === 'audio') return <IconAltavoz />
  if (icono === 'lapiz') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm1.5 9h9v2h-9v-2zm0 4h9v2h-9v-2zm0-8h5v2h-5V7z" />
    </svg>
  )
}

function AyudaRepaso({ fallos, nahuatl, espanol, respuesta, onSaltar }) {
  const esRepaso = useContext(RepasoContext)
  const [ver, setVer] = useState(null) // null | escribe | significa | respuesta

  if (!esRepaso || fallos < AYUDA_REPASO_DESDE) return null

  return (
    <div className="lp-ayuda-repaso">
      <p className="lp-ayuda-titulo">¿Necesitas ayuda?</p>
      {ver === 'respuesta' ? (
        <>
          <p className="lp-respuesta">
            La respuesta era: <strong>{respuesta}</strong>
          </p>
          <button className="lp-boton" onClick={onSaltar}>Continuar</button>
        </>
      ) : (
        <>
          {ver === 'escribe' && (
            <p className="lp-respuesta">
              Se escribe: <strong>{nahuatl}</strong>
            </p>
          )}
          {ver === 'significa' && (
            <p className="lp-respuesta">
              Significa: <strong>{espanol}</strong>
            </p>
          )}
          <div className="lp-ayuda-botones">
            {nahuatl && <button className="lp-enlace" onClick={() => setVer('escribe')}>Ver cómo se escribe</button>}
            {espanol && <button className="lp-enlace" onClick={() => setVer('significa')}>Ver qué significa</button>}
            <button className="lp-enlace" onClick={() => setVer('respuesta')}>Saltar pregunta</button>
          </div>
        </>
      )}
    </div>
  )
}

function ResumenRepaso({ actividades, aciertos, porcentaje, onContinuar, onInicio, onProgreso, onRepasarLecciones }) {
  const [oculta, setOculta] = useState(false)
  const textoFinal = useLobita('finRepaso', { ms: 6000 }) // Lobita felicita por terminar el repaso
  return (
    <div className="lp-repaso lp-repaso-final">
      {/* Solo en el repaso general: la mascota va grande al costado (en pantallas anchas) */}
      <ZonaMascota grande>
        <Mascota estado="celebra" tamano="mediano" entrada="zoom" mensaje={textoFinal} globo="derecha" />
      </ZonaMascota>
      <h2 className="lp-repaso-titulo">¡Felicidades!</h2>
      <p className="lp-repaso-sub">Has completado el repaso general</p>

      <div className="lp-repaso-desempeno">
        <p className="lp-repaso-desempeno-titulo">Desempeño por actividad</p>
        {actividades.map((a) => (
          <div key={a.numero} className="lp-repaso-fila">
            <div className="lp-repaso-fila-texto">
              <span className="lp-repaso-fila-num">Actividad {a.numero}</span>
              <strong className="lp-repaso-fila-nombre">{TITULOS_REPASO[a.tipo] || a.tipo}</strong>
            </div>
            <strong className="lp-repaso-fila-nota">{aciertos[a.numero] || 0}/{a.total}</strong>
          </div>
        ))}
      </div>

      {porcentaje < 70 && !oculta && (
        <div className="lp-sugerencia">
          <p className="lp-sugerencia-titulo">Sacaste {porcentaje}%</p>
          <p className="lp-sugerencia-texto">
            Te recomendamos repasar las lecciones de este tema para reforzar lo aprendido. Es opcional.
          </p>
          <div className="lp-sugerencia-botones">
            <button className="lp-boton-secundario" onClick={onRepasarLecciones}>Repasar lecciones</button>
            <button className="lp-enlace" onClick={() => setOculta(true)}>Ahora no</button>
          </div>
        </div>
      )}

      <div className="lp-repaso-botones">
        <button className="lp-boton" onClick={onContinuar}>Continuar</button>
        <button className="lp-boton-secundario" onClick={onInicio}>Volver al inicio</button>
        <button className="lp-boton-secundario" onClick={onProgreso}>Ver mi progreso</button>
      </div>
    </div>
  )
}

function IntroRepaso({ actividades, hechas, aciertos, onEmpezar }) {
  return (
    <div className="lp-repaso lp-repaso-intro">
      {/* La mascota también acompaña la pantalla de inicio del repaso */}
      <MascotaPista pista="Elige una actividad para empezar" />
      <p className="lp-repaso-sub">Pon a prueba tus conocimientos con las actividades de repaso</p>

      <div className="lp-rlista">
        {actividades.map((a, i) => {
          const hecha = hechas.includes(a.numero)
          return (
            <button
              key={a.numero}
              className={`lp-rcard ${ESTILO_REPASO[i % ESTILO_REPASO.length]} ${hecha ? 'hecha' : ''}`}
              onClick={() => onEmpezar(a.numero)}
            >
              <span className="lp-rcard-icono"><IconoRepaso tipo={a.tipo} /></span>
              <span className="lp-rcard-texto">
                <span className="lp-rcard-num">Actividad {a.numero}</span>
                <strong className="lp-rcard-nombre">{TITULOS_REPASO[a.tipo] || a.tipo}</strong>
                <span className="lp-rcard-pastilla">
                  {hecha ? `✓ ${aciertos[a.numero] || 0}/${a.total}` : plural(a.total)}
                </span>
              </span>
              <svg className="lp-rcard-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M10.5 8.5l3.5 3.5-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Recorrido completo de una lección ---------- */

function ReproductorLeccion({ categoriaId, leccion, palabras, actividades, onRepasar }) {
  const navigate = useNavigate()
  const todasLasPalabras = Object.values(contenidoLecciones[categoriaId] || {}).flatMap((l) => l.palabras)
  const [fases] = useState(() => construirFases(palabras, todasLasPalabras, actividades))
  const [indice, setIndice] = useState(0)
  const [aciertosPrimero, setAciertosPrimero] = useState(0)
  const [aciertosPorActividad, setAciertosPorActividad] = useState({})
  const [terminado, setTerminado] = useState(false)
  const esRepaso = !!leccion.final
  const [activa, setActiva] = useState(null) // repaso: número de la actividad en curso (null = tarjetas)
  const [hechas, setHechas] = useState([]) // repaso: actividades ya terminadas
  // Al empezar, Lobita saluda y (si la lección empieza escuchando) da la instrucción de repetir
  const textoInicio = useLobita(fases[0] && fases[0].tipo === 'escuchar' ? 'inicioEscucha' : 'inicioLeccion', { ms: 7000 })
  useEffect(() => { reiniciarLeccion() }, [])

  // Referencias para ajustar el tamaño de la actividad a la pantalla
  const [destinoMascota, setDestinoMascota] = useState(null)
  const contenidoRef = useRef(null)
  const ajusteRef = useRef(null)

  const volver = () => navigate(`/categoria/${categoriaId}/lecciones`)
  const rutinaMascota = rutinas[categoriaId] ? categoriaId : 'leccion'
  const total = fases.length
  const fase = fases[indice]
  const puntuables = fases.filter((f) => f.tipo !== 'escuchar').length
  const precision = puntuables ? Math.round((aciertosPrimero / puntuables) * 100) : 100

  const resumenActividades = actividades
    .filter((a) => a !== 'escuchar')
    .map((entrada, i) => ({ tipo: entrada.split('@')[0], numero: i + 1, total: fases.filter((f) => f.numero === i + 1).length }))

  const totalPreguntas = resumenActividades.reduce((s, a) => s + a.total, 0)
  const totalAciertos = Object.values(aciertosPorActividad).reduce((s, n) => s + n, 0)
  const porcentaje = totalPreguntas ? Math.round((totalAciertos / totalPreguntas) * 100) : 100
  const enIntro = esRepaso && activa === null && !terminado

  // Progreso: en el repaso se mide solo dentro de la actividad en curso
  let progreso = Math.round((indice / total) * 100)
  if (esRepaso && activa !== null) {
    const inicio = fases.findIndex((f) => f.numero === activa)
    const cantidad = fases.filter((f) => f.numero === activa).length
    progreso = Math.round(((indice - inicio) / cantidad) * 100)
  }

  // Al terminar: se guarda en el servidor con los aciertos de cada actividad
  useEffect(() => {
    if (!terminado) return
    marcarLeccionCompletada(categoriaId, leccion.id, {
      actividades: resumenActividades.map((a) => ({
        tipo: a.tipo,
        aciertos: aciertosPorActividad[a.numero] || 0,
        total: a.total,
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminado, categoriaId, leccion.id])

  function empezarActividad(numero) {
    setAciertosPorActividad((a) => ({ ...a, [numero]: 0 })) // si la repite, empieza de cero
    setIndice(fases.findIndex((f) => f.numero === numero))
    setActiva(numero)
  }

  // primerIntento: true si el usuario acertó a la primera (se usa para la precisión)
  function avanzar(primerIntento) {
    if (primerIntento) {
      setAciertosPrimero((n) => n + 1)
      if (fase.numero) {
        setAciertosPorActividad((a) => ({ ...a, [fase.numero]: (a[fase.numero] || 0) + 1 }))
      }
    }

    // Repaso: al acabar una actividad se regresa a las tarjetas
    const siguiente = fases[indice + 1]
    if (esRepaso && (!siguiente || siguiente.numero !== fase.numero)) {
      const nuevas = hechas.includes(fase.numero) ? hechas : [...hechas, fase.numero]
      setHechas(nuevas)
      setActiva(null)
      if (nuevas.length >= resumenActividades.length) setTerminado(true)
      return
    }

    if (indice + 1 >= total) {
      setTerminado(true)
    } else {
      setIndice(indice + 1)
    }
  }

  let contenido
  if (enIntro) {
    contenido = (
      <IntroRepaso
        actividades={resumenActividades}
        hechas={hechas}
        aciertos={aciertosPorActividad}
        onEmpezar={empezarActividad}
      />
    )
  } else if (terminado && esRepaso) {
    contenido = (
      <ResumenRepaso
        actividades={resumenActividades}
        aciertos={aciertosPorActividad}
        onContinuar={volver}
        onInicio={() => navigate('/menu')}
        onProgreso={() => navigate('/perfil')}
        porcentaje={porcentaje}
        onRepasarLecciones={volver}
      />
    )
  } else if (terminado) {
    contenido = (
      <Resumen
        cantidadPalabras={palabras.length}
        precision={precision}
        final={leccion.final}
        onContinuar={volver}
        onRepasar={onRepasar}
      />
    )
  } else if (fase.tipo === 'escuchar') {
    contenido = <PasoEscuchaRepite palabra={fase.palabra} onContinuar={avanzar} />
  } else if (fase.tipo === 'unir' || fase.tipo === 'unirNumero') {
    contenido = (
      <PasoUnir
        modo={fase.tipo === 'unirNumero' ? 'numeros' : 'palabras'}
        palabras={fase.palabras}
        numero={fase.numero}
        de={fase.de}
        onSiguiente={avanzar}
      />
    )
  } else if (fase.tipo === 'opcion' || fase.tipo === 'escuchaElige' || fase.tipo === 'leeElige' || fase.tipo === 'leeNahuatl') {
    contenido = (
      <PasoOpcionMultiple
        modo={fase.tipo}
        palabra={fase.palabra}
        opciones={fase.opciones}
        numero={fase.numero}
        de={fase.de}
        onSiguiente={avanzar}
      />
    )
  } else if (fase.tipo === 'completa') {
    contenido = (
      <PasoCompleta
        palabra={fase.palabra}
        partes={fase.partes}
        hueco={fase.hueco}
        opciones={fase.opciones}
        numero={fase.numero}
        de={fase.de}
        onSiguiente={avanzar}
      />
    )
  } else {
    contenido = <PasoEscritura palabra={fase.palabra} numero={fase.numero} de={fase.de} onSiguiente={avanzar} />
  }

  // Escala la actividad para que llene justo la pantalla (sin scroll y sin sobrepasar).
  // Deja abajo el espacio de la barra de resultado (solo en las actividades que la usan).
  const claveAjuste = enIntro ? 'inicio' : terminado ? 'fin' : indice
  const reservaAbajo = enIntro || terminado || (fase && fase.tipo === 'escuchar') ? 24 : 175
  useLayoutEffect(() => {
    const principal = contenidoRef.current
    const ajuste = ajusteRef.current
    if (!principal || !ajuste) return undefined
    let midiendo = false

    function ajustar() {
      if (midiendo) return
      midiendo = true
      principal.style.setProperty('--lp-reserva', `${reservaAbajo}px`)
      principal.style.setProperty('--lp-zoom', '1')
      const estilo = getComputedStyle(principal)
      let alto = principal.clientHeight - parseFloat(estilo.paddingTop) - reservaAbajo
      const ancho = principal.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight)
      // en pantallas angostas la mascota va en una fila arriba y le quita espacio a la actividad
      if (destinoMascota && getComputedStyle(destinoMascota).position !== 'absolute') {
        const altoMascota = destinoMascota.offsetHeight
        if (altoMascota > 0) alto -= altoMascota + (parseFloat(estilo.rowGap) || 18)
      }
      const porAlto = alto / ajuste.offsetHeight
      const porAncho = ancho / ajuste.offsetWidth
      const zoom = Math.max(0.35, Math.min(porAlto, porAncho, 1.15))
      principal.style.setProperty('--lp-zoom', zoom.toFixed(3))
      // la barra de resultado no se achica: se le aplica el zoom contrario
      principal.style.setProperty('--lp-inv', (1 / zoom).toFixed(3))
      midiendo = false
    }

    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(principal)
    observador.observe(ajuste)
    if (destinoMascota) observador.observe(destinoMascota)
    principal.addEventListener('load', ajustar, true) // carga de imágenes
    const t1 = setTimeout(ajustar, 150)
    const t2 = setTimeout(ajustar, 600)
    return () => {
      observador.disconnect()
      principal.removeEventListener('load', ajustar, true)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [claveAjuste, destinoMascota, reservaAbajo])

  return (
    <RutinaContext.Provider value={{ rutina: rutinaMascota, saludo: indice === 0 ? textoInicio : null, primero: indice === 0 }}>
      <RepasoContext.Provider value={esRepaso}>
        <DestinoMascotaContext.Provider value={destinoMascota}>
          <div className="lp-pagina">
            <Cabecera
              titulo={`Lección ${leccion.id}: ${leccion.titulo}`}
              onVolver={esRepaso && activa !== null ? () => setActiva(null) : volver}
            />
            {!enIntro && !terminado && (
              <div className="lp-progreso">
                <div className="lp-progreso-relleno" style={{ width: `${progreso}%` }}></div>
              </div>
            )}
            <main
              className={`lp-contenido ${indice % 2 === 1 ? 'lado-izquierdo' : ''} ${esRepaso ? 'en-repaso' : ''}`}
              key={enIntro ? 'inicio' : terminado ? 'fin' : indice}
              ref={contenidoRef}
            >
              {/* Aquí se dibuja la mascota (no se escala) */}
              <div className="lp-destino-mascota" ref={setDestinoMascota}></div>
              {/* La actividad se escala para llenar justo la pantalla */}
              <div className="lp-ajuste" ref={ajusteRef}>
                {contenido}
              </div>
            </main>
          </div>
        </DestinoMascotaContext.Provider>
      </RepasoContext.Provider>
    </RutinaContext.Provider>
  )
}

/* ---------- Pantalla que se abre desde la lista de lecciones ---------- */

function Leccion() {
  const { id, leccionId } = useParams()
  const navigate = useNavigate()
  const [vuelta, setVuelta] = useState(0) // sube al repasar la lección, para empezarla de nuevo
  const categoria = categorias[id]
  const leccion = categoria ? categoria.lecciones.find((l) => String(l.id) === leccionId) : null

  if (!categoria || !leccion) {
    return <Navigate to="/menu" replace />
  }

  const contenido = contenidoLecciones[id] && contenidoLecciones[id][leccion.id]

  // Lecciones que todavía no tienen contenido (y los repasos finales)
  if (!contenido) {
    return (
      <div className="lp-pagina">
        <Cabecera
          titulo={`Lección ${leccion.id}: ${leccion.titulo}`}
          onVolver={() => navigate(`/categoria/${id}/lecciones`)}
        />
        <main className="lp-contenido">
          <div className="lp-fin">
            <Mascota estado="timida" mensaje="Esta lección estará lista muy pronto." tamano="resumen" globo="arriba" />
            <button className="lp-boton" onClick={() => navigate(`/categoria/${id}/lecciones`)}>
              Volver a las lecciones
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <ReproductorLeccion
      key={`${id}-${leccion.id}-${vuelta}`}
      categoriaId={id}
      leccion={leccion}
      palabras={contenido.palabras}
      actividades={actividadesDe(id, leccion.id, leccion.final)}
      onRepasar={() => setVuelta((v) => v + 1)}
    />
  )
}

export default Leccion