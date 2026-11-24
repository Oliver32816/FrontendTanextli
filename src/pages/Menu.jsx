// Menú principal: saludo con Lobita, tu avance, la palabra del día y las categorías.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import CategoriaCard from '../components/CategoriaCard'
import Mascota from '../components/Mascota'
import { useAncho, tamanoMascota } from '../components/useAncho'
import { categorias } from '../data/categorias'
import { contenidoLecciones } from '../data/lecciones'
import { cantidadCompletadas } from '../services/progreso'
import { obtenerResumen, obtenerSiguienteLeccion } from '../services/estadisticas'
import { obtenerNombreSaludo } from '../services/preferencias'
import { useLobita } from '../services/useLobita'
import '../styles/menu.css'

// Orden en que aparecen las categorías
const ORDEN = ['colores', 'numeros', 'familia', 'frases']

function saludoDelDia() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Una palabra distinta cada día (la misma para todos ese día)
function palabraDelDia() {
  const todas = Object.values(contenidoLecciones)
    .flatMap((lecciones) => Object.values(lecciones))
    .flatMap((l) => l.palabras || [])
    .filter((p) => p.nahuatl && p.espanol && p.audio)
  if (todas.length === 0) return null
  const dia = Math.floor(Date.now() / 86400000)
  return todas[dia % todas.length]
}

// Número que sube poco a poco hasta su valor
function useContador(valor, ms = 900) {
  const [actual, setActual] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setActual(valor)
      return undefined
    }
    let marco
    const inicio = performance.now()
    const paso = (t) => {
      const avance = Math.min(1, (t - inicio) / ms)
      setActual(Math.round(valor * (1 - Math.pow(1 - avance, 3))))
      if (avance < 1) marco = requestAnimationFrame(paso)
    }
    marco = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(marco)
  }, [valor, ms])
  return actual
}

function Dato({ valor, sufijo = '', texto, icono }) {
  const n = useContador(valor)
  return (
    <div className="menu-dato">
      <span className="menu-dato-icono" aria-hidden="true">{icono}</span>
      <span className="menu-dato-valor">{n}{sufijo}</span>
      <span className="menu-dato-texto">{texto}</span>
    </div>
  )
}

function PalabraDelDia() {
  const palabra = useMemo(palabraDelDia, [])
  const audio = useRef(null)
  const [sonando, setSonando] = useState(false)
  if (!palabra) return null

  const escuchar = () => {
    if (!palabra.audio) return
    audio.current?.pause()
    audio.current = new Audio(palabra.audio)
    setSonando(true)
    audio.current.onended = () => setSonando(false)
    audio.current.play().catch(() => setSonando(false))
  }

  return (
    <section className="menu-palabra tx-aparecer tx-retraso-2" aria-label="Palabra del día">
      <span className="menu-palabra-etiqueta">✨ Palabra del día</span>
      <p className="menu-palabra-nahuatl">{palabra.nahuatl}</p>
      <p className="menu-palabra-espanol">{palabra.espanol}</p>
      {palabra.audio && (
        <button type="button" className={`menu-palabra-audio ${sonando ? 'sonando' : ''}`} onClick={escuchar}
          aria-label={`Escuchar ${palabra.nahuatl}`}>
          <span className="menu-ondas" aria-hidden="true"><i /><i /><i /><i /></span>
          {sonando ? 'Escuchando…' : 'Escuchar'}
        </button>
      )}
    </section>
  )
}

// Hojas que flotan en el fondo
const HOJAS = [
  { x: 8, d: 0, s: 22, t: 16 }, { x: 22, d: -6, s: 16, t: 19 }, { x: 41, d: -3, s: 26, t: 22 },
  { x: 63, d: -9, s: 18, t: 17 }, { x: 78, d: -12, s: 24, t: 21 }, { x: 92, d: -4, s: 15, t: 18 },
]

function Menu({ usuario }) {
  const nombreUsuario = obtenerNombreSaludo(usuario)
  const textoLobita = useLobita('menu')
  const resumen = useMemo(obtenerResumen, [])
  const siguiente = useMemo(obtenerSiguienteLeccion, [])
  const [refLobita, medidaLobita] = useAncho()
  const tamano = tamanoMascota(medidaLobita, { factor: 0.9, min: 110, max: 240 })

  // Las tarjetas salen de data/categorias.js con el progreso real del usuario
  const tarjetas = ORDEN.map((id) => {
    const cat = categorias[id]
    return {
      id,
      titulo: cat.titulo,
      descripcion: cat.descripcion,
      icono: cat.icono,
      color: cat.color,
      completadas: Math.min(cantidadCompletadas(id), cat.lecciones.length),
      total: cat.lecciones.length,
      ruta: `/categoria/${id}`,
    }
  })

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido menu-inicio">
        <div className="menu-hojas" aria-hidden="true">
          {HOJAS.map((h, i) => (
            <span key={i} style={{ left: `${h.x}%`, animationDelay: `${h.d}s`, animationDuration: `${h.t}s`, fontSize: h.s }}>🍃</span>
          ))}
        </div>

        {/* ---------- Bienvenida ---------- */}
        <section className="menu-hero tx-aparecer">
          <div className="menu-hero-texto">
            <span className="menu-hero-insignia">{saludoDelDia()}</span>
            <h1>
              ¡Hola, <span className="menu-hero-nombre">{nombreUsuario}</span>!
            </h1>
            <p>Tu esfuerzo de hoy te acerca a grandes logros. Sigue aprendiendo náhuatl con Lobita.</p>

            <div className="menu-hero-acciones">
              {siguiente ? (
                <Link className="menu-cta" to={`/categoria/${siguiente.categoriaId}/leccion/${siguiente.leccionId}`}>
                  <span className="menu-cta-icono" aria-hidden="true">{siguiente.icono}</span>
                  <span className="menu-cta-texto">
                    <small>Continuar</small>
                    {siguiente.titulo}
                  </span>
                  <span className="menu-cta-flecha" aria-hidden="true">→</span>
                </Link>
              ) : (
                <span className="menu-cta menu-cta-listo">🏆 ¡Completaste todas las lecciones!</span>
              )}
              <Link className="menu-hero-secundario" to="/perfil">Ver mi progreso</Link>
            </div>
          </div>

          <div className="menu-hero-lobita" ref={refLobita}>
            <div className="menu-hero-orbe" aria-hidden="true" />
            <span className="menu-chispa menu-chispa-1" aria-hidden="true">✦</span>
            <span className="menu-chispa menu-chispa-2" aria-hidden="true">✦</span>
            <span className="menu-chispa menu-chispa-3" aria-hidden="true">✦</span>
            <div className="menu-hero-mascota">
              <Mascota rutina="menu" tamano={tamano} entrada="asomar" mensaje={textoLobita} flotar />
            </div>
          </div>
        </section>

        {/* ---------- Avance y palabra del día ---------- */}
        <div className="menu-fila">
          <section className="menu-datos tx-aparecer tx-retraso-1" aria-label="Tu avance">
            <Dato valor={resumen.porcentaje} sufijo="%" texto="de avance total" icono="📈" />
            <Dato valor={resumen.leccionesCompletadas} texto={`de ${resumen.leccionesTotales} lecciones`} icono="✅" />
            <Dato valor={resumen.palabras} texto="palabras aprendidas" icono="📖" />
          </section>
          <PalabraDelDia />
        </div>

        {/* ---------- Categorías ---------- */}
        <div className="menu-seccion-titulo tx-aparecer tx-retraso-2">
          <h2>Elige qué aprender</h2>
          <p>Cada categoría tiene lecciones cortas y un repaso final.</p>
        </div>

        <div className="categorias-grid">
          {tarjetas.map(({ id, ...cat }, i) => (
            <CategoriaCard key={id} indice={i} {...cat} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default Menu