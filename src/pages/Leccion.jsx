import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import Mascota from '../components/Mascota'
import { categorias } from '../data/categorias'
import { contenidoLecciones } from '../data/lecciones'
import { marcarLeccionCompletada } from '../services/progreso'
import { IconAltavoz, IconMicrofono } from '../components/Icons'
import '../styles/leccion.css'

const ACTIVIDADES_POR_DEFECTO = ['escuchar', 'opcion', 'escritura']

// Títulos que aparecen en la barra de resultado (uno al azar)
const TITULOS_ACIERTO = ['¡Excelente!', '¡Muy bien!', '¡Perfecto!', '¡Bien hecho!']
const TITULOS_ERROR = [
  '¡Casi! Inténtalo de nuevo',
  '¡No te preocupes! Inténtalo nuevamente',
  '¡Ánimo! Corrígelo e inténtalo otra vez',
]

/* ---------- Funciones de apoyo ---------- */

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

// Quita mayúsculas, espacios y acentos para comparar lo que escribe el usuario
function normalizar(texto) {
  return texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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
  if (!src) return
  const audio = new Audio(src)
  audio.play().catch(() => {})
}

// Arma la lista de pasos de la lección en el orden que indique "actividades"
function construirFases(palabras, todasLasPalabras, actividades) {
  const puntuables = actividades.filter((a) => a !== 'escuchar')
  const de = puntuables.length
  const numeroDe = (tipo) => puntuables.indexOf(tipo) + 1
  const fases = []

  actividades.forEach((tipo) => {
    if (tipo === 'escuchar') {
      palabras.forEach((p) => fases.push({ tipo, palabra: p }))
    } else if (tipo === 'unir') {
      fases.push({ tipo, palabras, numero: numeroDe(tipo), de })
    } else if (tipo === 'opcion') {
      palabras.forEach((p) => {
        const deLaLeccion = palabras.filter((q) => q.nahuatl !== p.nahuatl)
        const deLaCategoria = todasLasPalabras.filter(
          (q) => q.nahuatl !== p.nahuatl && !deLaLeccion.some((r) => r.nahuatl === q.nahuatl)
        )
                // Sin repetir palabras: Hermano y Hermana se escriben igual (Noikniuj)
        const vistas = new Set([p.nahuatl])
        const distractores = [...mezclar(deLaLeccion), ...mezclar(deLaCategoria)]
          .filter((q) => !vistas.has(q.nahuatl) && vistas.add(q.nahuatl))
          .slice(0, 3)
        fases.push({ tipo, palabra: p, opciones: mezclar([p, ...distractores]), numero: numeroDe(tipo), de })
      })
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

function MascotaPista({ pista }) {
  return (
    <div className="lp-mascota-zona">
      <Mascota estado="reposo" mensaje={pista} tamano="pequeno" globo="arriba" />
    </div>
  )
}

function Muestra({ color }) {
  return <span className="lp-muestra" style={{ background: color }}></span>
}

// Barra que sube desde abajo cuando el usuario comprueba su respuesta
function BarraResultado({ resultado, detalle, textoBoton, onClick }) {
  const correcto = resultado === 'correcto'
  const [titulo] = useState(() => elegir(correcto ? TITULOS_ACIERTO : TITULOS_ERROR))

  return (
    <div className={`lp-barra ${correcto ? 'correcta' : 'incorrecta'}`} role="status">
      <div className="lp-barra-contenido">
        <div className="lp-barra-info">
          <Mascota estado={correcto ? 'feliz' : 'animo'} tamano="pequeno" />
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
  const { reproducir, aviso } = useAudio(palabra.audio)
  const [grabacion, setGrabacion] = useState('inactiva') // inactiva | grabando | lista | error
  const grabadorRef = useRef(null)
  const mantenidoRef = useRef(false)

  async function empezar() {
    mantenidoRef.current = true
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Si el usuario soltó el botón mientras el navegador pedía permiso, no grabamos
      if (!mantenidoRef.current) {
        flujo.getTracks().forEach((t) => t.stop())
        return
      }
      const grabador = new MediaRecorder(flujo)
      grabador.onstop = () => {
        flujo.getTracks().forEach((t) => t.stop())
        setGrabacion('lista')
      }
      grabador.start()
      grabadorRef.current = grabador
      setGrabacion('grabando')
    } catch {
      setGrabacion('error')
    }
  }

  function detener() {
    mantenidoRef.current = false
    const grabador = grabadorRef.current
    if (grabador && grabador.state === 'recording') grabador.stop()
  }

  useEffect(() => {
    return () => {
      const grabador = grabadorRef.current
      if (grabador && grabador.state === 'recording') grabador.stop()
    }
  }, [])

  let estado = 'reposo'
  let mensaje = '¡Escucha con atención y luego repite conmigo!'
  if (grabacion === 'lista') {
    estado = 'feliz'
    mensaje = '¡Muy bien! Ya practicaste esta palabra.'
  } else if (grabacion === 'error') {
    estado = 'animo'
    mensaje = 'No pude usar el micrófono. Revisa el permiso del navegador.'
  }

  const textoMic = {
    inactiva: 'Mantén presionado y repite',
    grabando: 'Grabando... suelta cuando termines',
    lista: 'Listo. Puedes grabar otra vez o continuar.',
    error: 'No se pudo usar el micrófono',
  }[grabacion]

  return (
    <>
      <div className="lp-mascota-zona">
        <Mascota estado={estado} mensaje={mensaje} tamano="pequeno" globo="arriba" />
      </div>

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
          onPointerDown={empezar}
          onPointerUp={detener}
          onPointerLeave={detener}
          onPointerCancel={detener}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Mantén presionado para grabar tu voz"
        >
          <IconMicrofono />
        </button>
        <p className="lp-ayuda">{textoMic}</p>

        <button className="lp-boton-secundario" onClick={reproducir}>Repetir audio</button>

        {(grabacion === 'inactiva' || grabacion === 'error') && (
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

/* ---------- Paso: unir las parejas ---------- */

function PasoUnir({ palabras, numero, de, onSiguiente }) {
  const [izquierda] = useState(() => mezclar(palabras))
  const [derecha] = useState(() => mezclar(palabras))
  const [selIzq, setSelIzq] = useState(null) // palabra en náhuatl elegida
  const [selDer, setSelDer] = useState(null) // traducción elegida
  const [unidas, setUnidas] = useState([]) // palabras en náhuatl ya unidas
  const [fallo, setFallo] = useState(null) // { izq, der } mientras parpadea en rojo
  const [huboError, setHuboError] = useState(false)
  const temporizador = useRef(null)

  useEffect(() => {
    return () => clearTimeout(temporizador.current)
  }, [])

  const completo = unidas.length === palabras.length
  const traduccionesUnidas = palabras.filter((p) => unidas.includes(p.nahuatl)).map((p) => p.espanol)

  function evaluar(izq, der) {
    const palabra = palabras.find((p) => p.nahuatl === izq)
    if (palabra.espanol === der) {
      setUnidas((u) => [...u, izq])
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
    if (fallo || unidas.includes(p.nahuatl)) return
    sonar(p.audio)
    const nuevo = selIzq === p.nahuatl ? null : p.nahuatl
    setSelIzq(nuevo)
    if (nuevo && selDer) evaluar(nuevo, selDer)
  }

  function elegirDerecha(p) {
    if (fallo || traduccionesUnidas.includes(p.espanol)) return
    const nuevo = selDer === p.espanol ? null : p.espanol
    setSelDer(nuevo)
    if (nuevo && selIzq) evaluar(selIzq, nuevo)
  }

  function claseIzquierda(p) {
    let clase = 'lp-par'
    if (unidas.includes(p.nahuatl)) clase += ' unida'
    else if (fallo && fallo.izq === p.nahuatl) clase += ' fallo'
    else if (selIzq === p.nahuatl) clase += ' seleccionada'
    return clase
  }

  function claseDerecha(p) {
    let clase = 'lp-par'
    if (traduccionesUnidas.includes(p.espanol)) clase += ' unida'
    else if (fallo && fallo.der === p.espanol) clase += ' fallo'
    else if (selDer === p.espanol) clase += ' seleccionada'
    return clase
  }

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      <p className="lp-instruccion">Selecciona los pares</p>

      <div className="lp-pares">
        <div className="lp-columna">
          {izquierda.map((p) => (
            <button key={p.nahuatl} className={claseIzquierda(p)} onClick={() => elegirIzquierda(p)}>
              {p.nahuatl}
            </button>
          ))}
        </div>
        <div className="lp-columna">
          {derecha.map((p) => (
            <button key={p.espanol} className={claseDerecha(p)} onClick={() => elegirDerecha(p)}>
              {p.colorHex && <span className="lp-par-muestra" style={{ background: p.colorHex }}></span>}
              {p.espanol}
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

/* ---------- Paso: opción múltiple ---------- */

function PasoOpcionMultiple({ palabra, opciones, numero, de, onSiguiente }) {
  const { reproducir, aviso } = useAudio(palabra.audio)
  const [seleccion, setSeleccion] = useState(null)
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

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>
      {resultado === null && <MascotaPista pista="Escucha el audio y escoge la respuesta correcta" />}

      <button className="lp-audio" onClick={reproducir} aria-label="Escuchar la palabra">
        <IconAltavoz />
      </button>
      {aviso && <p className="lp-aviso">No se pudo reproducir el audio.</p>}
      {!palabra.audio && <p className="lp-ayuda">Significa: {palabra.espanol}</p>}

      <div className="lp-opciones">
        {opciones.map((op) => {
          let clase = 'lp-opcion'
          if (seleccion === op.nahuatl) {
            clase += resultado ? (resultado === 'correcto' ? ' correcta' : ' incorrecta') : ' seleccionada'
          }
          return (
            <button
              key={op.nahuatl}
              className={clase}
              disabled={resultado !== null}
              onClick={() => setSeleccion(op.nahuatl)}
            >
              {op.nahuatl}
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

/* ---------- Paso: escritura ---------- */

function PasoEscritura({ palabra, numero, de, onSiguiente }) {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null) // null | correcto | incorrecto
  const [fallos, setFallos] = useState(0)
  const campoRef = useRef(null)

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

  // Después de dos errores se da una pequeña pista
  const pista = fallos >= 2 ? `Pista: empieza con «${palabra.nahuatl.charAt(0)}»` : null

  return (
    <>
      <h2 className="lp-actividad">Actividad {numero} de {de}</h2>

      <div className="lp-tarjeta">
        {palabra.colorHex && <Muestra color={palabra.colorHex} />}
        <p className="lp-pregunta">¿Cómo se dice {palabra.espanol.toLowerCase()} en náhuatl?</p>
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
      </div>

      {resultado === null && <MascotaPista pista="¡Recuerda cómo lo aprendimos!" />}

      {resultado === null ? (
        <button className="lp-boton" onClick={comprobar} disabled={!texto.trim()}>Comprobar</button>
      ) : (
        <BarraResultado
          resultado={resultado}
          detalle={resultado === 'incorrecto' ? pista : null}
          textoBoton={resultado === 'correcto' ? 'Continuar' : 'Intentar de nuevo'}
          onClick={resultado === 'correcto' ? () => onSiguiente(fallos === 0) : reintentar}
        />
      )}
    </>
  )
}

/* ---------- Pantalla final de la lección ---------- */

function Resumen({ cantidadPalabras, precision, onContinuar, onRepasar }) {
  return (
    <div className="lp-resumen">
      <Mascota estado="celebra" tamano="grande" />
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

/* ---------- Recorrido completo de una lección ---------- */

function ReproductorLeccion({ categoriaId, leccion, palabras, actividades, onRepasar }) {
  const navigate = useNavigate()
  const todasLasPalabras = Object.values(contenidoLecciones[categoriaId] || {}).flatMap((l) => l.palabras)
  const [fases] = useState(() => construirFases(palabras, todasLasPalabras, actividades))
  const [indice, setIndice] = useState(0)
  const [aciertosPrimero, setAciertosPrimero] = useState(0)
  const [terminado, setTerminado] = useState(false)

  const volver = () => navigate(`/categoria/${categoriaId}/lecciones`)
  const total = fases.length
  const fase = fases[indice]
  const puntuables = fases.filter((f) => f.tipo !== 'escuchar').length
  const precision = puntuables ? Math.round((aciertosPrimero / puntuables) * 100) : 100

  useEffect(() => {
    if (terminado) marcarLeccionCompletada(categoriaId, leccion.id)
  }, [terminado, categoriaId, leccion.id])

  // primerIntento: true si el usuario acertó a la primera (se usa para la precisión)
  function avanzar(primerIntento) {
    if (primerIntento) setAciertosPrimero((n) => n + 1)
    if (indice + 1 >= total) {
      setTerminado(true)
    } else {
      setIndice(indice + 1)
    }
  }

  let contenido
  if (terminado) {
    contenido = (
      <Resumen
        cantidadPalabras={palabras.length}
        precision={precision}
        onContinuar={volver}
        onRepasar={onRepasar}
      />
    )
  } else if (fase.tipo === 'escuchar') {
    contenido = <PasoEscuchaRepite palabra={fase.palabra} onContinuar={avanzar} />
  } else if (fase.tipo === 'unir') {
    contenido = <PasoUnir palabras={fase.palabras} numero={fase.numero} de={fase.de} onSiguiente={avanzar} />
  } else if (fase.tipo === 'opcion') {
    contenido = (
      <PasoOpcionMultiple
        palabra={fase.palabra}
        opciones={fase.opciones}
        numero={fase.numero}
        de={fase.de}
        onSiguiente={avanzar}
      />
    )
  } else {
    contenido = <PasoEscritura palabra={fase.palabra} numero={fase.numero} de={fase.de} onSiguiente={avanzar} />
  }

  return (
    <div className="lp-pagina">
      <Cabecera titulo={`Lección ${leccion.id}: ${leccion.titulo}`} onVolver={volver} />
      {!terminado && (
        <div className="lp-progreso">
          <div className="lp-progreso-relleno" style={{ width: `${Math.round((indice / total) * 100)}%` }}></div>
        </div>
      )}
      <main className={`lp-contenido ${indice % 2 === 1 ? 'lado-izquierdo' : ''}`} key={terminado ? 'fin' : indice}>
        {contenido}
      </main>
    </div>
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
            <Mascota estado="reposo" mensaje="Esta lección estará lista muy pronto." tamano="grande" globo="arriba" />
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
      actividades={contenido.actividades || ACTIVIDADES_POR_DEFECTO}
      onRepasar={() => setVuelta((v) => v + 1)}
    />
  )
}

export default Leccion