// Acerca de Tanextli: qué es, por qué el náhuatl, el equipo (en carrusel), créditos y fuentes.
import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota'
import { useAncho, tamanoMascota } from '../components/useAncho'
import { IconAltavoz, IconMicrofono, IconDocumento, IconLapiz } from '../components/Icons'
import '../styles/acercaDe.css'

// ====== EDITA AQUÍ LOS DATOS ANTES DE PRESENTAR ======
const VERSION = '1.0'

const equipo = [
  { nombre: 'Daniela Alvarado Isidro', rol: 'Líder de proyecto, Análisis y Programación', tono: 'daniela' },
  { nombre: 'Karla Jazmín Calderón Hernández', rol: 'Diseño y Programación', tono: 'karla' },
  { nombre: 'Oliver Macias Fernández', rol: 'Programación, Producción y Backend', tono: 'oliver' },
  { nombre: 'Roberto Carlos Rojas Valadez', rol: 'Análisis y Programación', tono: 'roberto' },
  { nombre: 'Edgar Baez Santamaria', rol: 'Análisis y Programación', tono: 'edgar' },
  { nombre: 'Araceli Arenas Castañeda', rol: 'Lingüista, Traducción y Voz de Tany', tono: 'araceli' },
]

const creditos = [  
  { titulo: 'Variante del náhuatl', texto: 'Náhuatl de la Sierra Noreste de Puebla', icono: '🗺️' },
  { titulo: 'Palabras y traducciones', texto: 'Araceli Arenas Castañeda y Daniela Alvarado Isidro', icono: '📝' },
  { titulo: 'Audios de pronunciación', texto: 'Voz de Tany: Araceli Arenas Castañeda', icono: '🎙️' },
]

const fuentes = [
  {
    texto: 'Instituto Nacional de Estadística y Geografía. (2020). Censo de Población y Vivienda 2020.',
    url: 'https://www.inegi.org.mx/programas/ccpv/2020/',
  },
  {
    texto: 'Instituto Nacional de Lenguas Indígenas. (s.f.). Lenguas en riesgo.',
    url: 'https://site.inali.gob.mx/Micrositios/DILM2019/lenguas_riesgo.html',
  },
]

const funciones = [
  { Icono: IconMicrofono, titulo: 'Escucha y repite', texto: 'Practica tu pronunciación', tono: 'verde' },
  { Icono: IconAltavoz, titulo: 'Escucha y elige', texto: 'Elige el significado de lo que oyes', tono: 'azul' },
  { Icono: IconDocumento, titulo: 'Lee y elige', texto: 'Elige cómo se dice en náhuatl', tono: 'morado' },
  { Icono: IconLapiz, titulo: 'Escribe', texto: 'Pon a prueba lo que aprendiste', tono: 'naranja' },
]

const HABLANTES = 1651958
const INTERVALO = 4000 // milisegundos que se muestra cada integrante

const iniciales = (nombre) => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('')
// "Programación, Producción y Backend" → ["Programación", "Producción", "Backend"]
const roles = (texto) => texto.split(/,\s*|\s+y\s+/).map((r) => r.trim()).filter(Boolean)

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Número que sube hasta su valor cuando aparece en pantalla
function Contador({ valor }) {
  const ref = useRef(null)
  const [actual, setActual] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (sinMovimiento() || !('IntersectionObserver' in window)) { setActual(valor); return undefined }
    let marco
    const observador = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observador.disconnect()
      const inicio = performance.now()
      const paso = (t) => {
        const avance = Math.min(1, (t - inicio) / 1600)
        setActual(Math.round(valor * (1 - Math.pow(1 - avance, 4))))
        if (avance < 1) marco = requestAnimationFrame(paso)
      }
      marco = requestAnimationFrame(paso)
    }, { threshold: .4 })
    observador.observe(el)
    return () => { observador.disconnect(); cancelAnimationFrame(marco) }
  }, [valor])
  return <span ref={ref}>{actual.toLocaleString('es-MX')}</span>
}

// Carrusel del equipo: muestra a cada integrante, uno por uno
function Equipo() {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const persona = equipo[indice]

  const ir = useCallback((i) => setIndice((i + equipo.length) % equipo.length), [])

  useEffect(() => {
    if (pausado || sinMovimiento()) return undefined
    const t = setTimeout(() => ir(indice + 1), INTERVALO)
    return () => clearTimeout(t)
  }, [indice, pausado, ir])

  return (
    <section className="ac-tarjeta ac-equipo tx-aparecer" aria-labelledby="ac-equipo-titulo">
      <div className="ac-encabezado">
        <span className="ac-icono-seccion" aria-hidden="true">👥</span>
        <div>
          <h2 id="ac-equipo-titulo">Equipo de desarrollo</h2>
          <p>Las personas que hacen posible Tanextli.</p>
        </div>
      </div>

      <div
        className="ac-escenario"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={() => setPausado(false)}
      >
        <button type="button" className="ac-flecha ac-flecha-izq" onClick={() => ir(indice - 1)} aria-label="Integrante anterior">‹</button>

        <div key={indice} className={`ac-foco ac-tono-${persona.tono}`} aria-live="polite">
          <div className="ac-foco-avatar">
            <span className="ac-foco-anillo" aria-hidden="true" />
            <span className="ac-foco-iniciales">{iniciales(persona.nombre)}</span>
          </div>
          <div className="ac-foco-texto">
            <span className="ac-foco-numero">Integrante {indice + 1} de {equipo.length}</span>
            <h3>{persona.nombre}</h3>
            <ul className="ac-roles" aria-label="Rol en el equipo">
              {roles(persona.rol).map((r, i) => (
                <li key={r} style={{ '--i': i }}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        <button type="button" className="ac-flecha ac-flecha-der" onClick={() => ir(indice + 1)} aria-label="Siguiente integrante">›</button>
      </div>

      {/* Lista de integrantes: el activo se resalta y su barra avanza */}
      <div className="ac-miembros" role="tablist" aria-label="Integrantes">
        {equipo.map((p, i) => (
          <button
            key={p.nombre}
            type="button"
            role="tab"
            aria-selected={i === indice}
            className={`ac-miembro ac-tono-${p.tono} ${i === indice ? 'activo' : ''}`}
            onClick={() => ir(i)}
            title={p.nombre}
          >
            <span className="ac-miembro-avatar">{iniciales(p.nombre)}</span>
            <span className="ac-miembro-nombre">{p.nombre.split(' ')[0]}</span>
            {i === indice && !pausado && (
              <span key={indice} className="ac-miembro-barra" style={{ animationDuration: `${INTERVALO}ms` }} />
            )}
          </button>
        ))}
      </div>

      <p className="ac-nota">
        Proyecto integrador de Ingeniería en Sistemas Computacionales, Programación Web Avanzada.
        Instituto Tecnológico Superior de Libres, 2026.
      </p>
    </section>
  )
}

function AcercaDe() {
  const [refLobita, medida] = useAncho()
  const tamano = tamanoMascota(medida, { factor: .85, min: 110, max: 210 })

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido">
        <div className="ac-contenedor">
          {/* ---------- Encabezado ---------- */}
          <section className="ac-hero tx-aparecer">
            <div className="ac-hero-texto">
              <span className="tx-insignia">Aprende náhuatl</span>
              <h1>Acerca de <span className="tx-degradado">Tanextli</span></h1>
              <p>Conecta con tu lengua, nuestra raíz.</p>
              <span className="ac-version">🍃 Versión {VERSION}</span>
            </div>
            <div className="ac-hero-lobita" ref={refLobita}>
              <div className="ac-hero-orbe" aria-hidden="true" />
              <div className="ac-hero-mascota">
                <Mascota rutina="acerca" tamano={tamano} entrada="zoom" />
              </div>
            </div>
          </section>

          {/* ---------- Qué es ---------- */}
          <section className="ac-tarjeta tx-aparecer tx-retraso-1">
            <div className="ac-encabezado">
              <span className="ac-icono-seccion" aria-hidden="true">🌱</span>
              <div>
                <h2>¿Qué es Tanextli?</h2>
                <p>Una aplicación web gamificada para aprender y preservar el náhuatl.</p>
              </div>
            </div>
            <p className="ac-texto">
              Con lecciones por categorías, audios de pronunciación, práctica con el micrófono y actividades
              interactivas, Tanextli acompaña a cada persona paso a paso en su aprendizaje, con Tany como guía.
            </p>
            <div className="ac-funciones">
              {funciones.map(({ Icono, titulo, texto, tono }, i) => (
                <div key={titulo} className={`ac-funcion ac-tono-${tono}`} style={{ '--i': i }}>
                  <span className="ac-funcion-icono"><Icono /></span>
                  <p className="ac-funcion-titulo">{titulo}</p>
                  <p className="ac-funcion-texto">{texto}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- Por qué el náhuatl ---------- */}
          <section className="ac-tarjeta tx-aparecer tx-retraso-2">
            <div className="ac-encabezado">
              <span className="ac-icono-seccion" aria-hidden="true">🇲🇽</span>
              <div>
                <h2>¿Por qué el náhuatl?</h2>
                <p>La lengua indígena con más hablantes en México.</p>
              </div>
            </div>
            <div className="ac-dato">
              <div className="ac-estadistica">
                <span className="ac-estadistica-numero"><Contador valor={HABLANTES} /></span>
                <span className="ac-estadistica-texto">hablantes de náhuatl en México (INEGI, 2020)</span>
              </div>
              <p className="ac-texto">
                Aun siendo la lengua indígena más hablada del país, enfrenta un proceso de desplazamiento entre las
                nuevas generaciones. Tanextli nace para acercar la lengua a quienes quieren aprenderla y contribuir a
                su preservación cultural.
              </p>
            </div>
          </section>

          <Equipo />

          {/* ---------- Créditos ---------- */}
          <section className="ac-tarjeta tx-aparecer">
            <div className="ac-encabezado">
              <span className="ac-icono-seccion" aria-hidden="true">🙌</span>
              <div>
                <h2>Créditos del contenido</h2>
                <p>Gracias a quienes comparten su lengua.</p>
              </div>
            </div>
            <div className="ac-creditos">
              {creditos.map((c) => (
                <div key={c.titulo} className="ac-credito">
                  <span className="ac-credito-icono" aria-hidden="true">{c.icono}</span>
                  <p className="ac-credito-titulo">{c.titulo}</p>
                  <p className="ac-credito-texto">{c.texto}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- Fuentes ---------- */}
          <section className="ac-tarjeta tx-aparecer">
            <div className="ac-encabezado">
              <span className="ac-icono-seccion" aria-hidden="true">📚</span>
              <div>
                <h2>Fuentes</h2>
                <p>Datos consultados para este proyecto.</p>
              </div>
            </div>
            <ul className="ac-fuentes">
              {fuentes.map((f) => (
                <li key={f.url}>
                  <span>{f.texto}</span>
                  <a className="ac-enlace" href={f.url} target="_blank" rel="noreferrer">Ver fuente ↗</a>
                </li>
              ))}
            </ul>
          </section>

          <p className="ac-pie">🍃 Tanextli · Hecho con cariño en Libres, Puebla · Versión {VERSION}</p>
        </div>
      </main>
    </div>
  )
}

export default AcercaDe