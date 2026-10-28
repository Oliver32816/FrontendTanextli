import { useState } from 'react'
import Mascota from '../components/Mascota'
import { categorias } from '../data/categorias'
import {
  IconAltavoz, IconMicrofono, IconDocumento, IconLapiz,
  IconBloqueado, IconCasillaMarcada,
} from '../components/Icons'
import '../styles/onboarding.css'

// ¿Habrá recompensas? Cuando el equipo lo decida, cámbialo a true para mostrar ese paso
// (y edita su texto más abajo).
const HAY_RECOMPENSAS = false

// Lista de "lo que vas a aprender": sale de las categorías de data/categorias.js
const itemsCategorias = Object.values(categorias).map((c) => ({
  icono: c.icono,
  titulo: c.titulo,
  texto: c.descripcion,
}))

// Pasos de la bienvenida, en orden. Para cambiar un texto, edítalo aquí.
//   tipo 'bienvenida' y 'cierre': mascota grande al centro
//   tipo 'categorias' y 'tutorial': mascota con globo y una lista de elementos
const pasos = [
  {
    id: 'bienvenida',
    tipo: 'bienvenida',
    estado: 'saludo',
    mensaje: '¡Hola! Te doy la bienvenida a Tanextli',
    subtexto: 'Aprende náhuatl paso a paso. Yo te acompaño.',
  },
  {
    id: 'aprenderas',
    tipo: 'categorias',
    estado: 'feliz',
    mensaje: '¡Esto es todo lo que vas a aprender!',
  },
  {
    id: 'tutorial-menu',
    tipo: 'tutorial',
    estado: 'reposo',
    mensaje: 'Así se usa Tanextli. Primero, elige una categoría.',
    items: [
      { icono: '🏠', titulo: 'Menú principal', texto: 'Toca una de las cuatro categorías para empezar.' },
      { icono: '🧭', titulo: 'Barra lateral', texto: 'Desde la izquierda saltas a cualquier categoría, a Acerca de y más.' },
    ],
  },
  {
    id: 'tutorial-leccion',
    tipo: 'tutorial',
    estado: 'reposo',
    mensaje: 'Cada lección tiene cuatro pasos.',
    items: [
      { icono: <IconAltavoz />, titulo: 'Escucha', texto: 'Oye la palabra en náhuatl.' },
      { icono: <IconMicrofono />, titulo: 'Repite', texto: 'Pronúnciala con el micrófono.' },
      { icono: <IconDocumento />, titulo: 'Actividad 1', texto: 'Elige la respuesta correcta.' },
      { icono: <IconLapiz />, titulo: 'Actividad 2', texto: 'Escribe la traducción.' },
    ],
  },
  {
    id: 'tutorial-progreso',
    tipo: 'tutorial',
    estado: 'reposo',
    mensaje: 'Avanza lección por lección.',
    items: [
      { icono: <IconBloqueado />, titulo: 'Lecciones con candado', texto: 'Completa la anterior para desbloquearlas.' },
      { icono: <IconCasillaMarcada />, titulo: 'Lecciones completadas', texto: 'Se marcan con una casilla para que veas tu avance.' },
      { icono: '📊', titulo: 'Tu progreso', texto: 'La barra de cada categoría muestra cuánto llevas.' },
    ],
  },
  ...(HAY_RECOMPENSAS
    ? [
        {
          id: 'tutorial-recompensas',
          tipo: 'tutorial',
          estado: 'feliz',
          mensaje: '¡Y también hay recompensas!',
          items: [
            // Pendiente: reemplazar por las recompensas reales cuando se definan
            { icono: '⭐', titulo: 'Gana recompensas', texto: 'Completa lecciones para conseguirlas.' },
          ],
        },
      ]
    : []),
  {
    id: 'cierre',
    tipo: 'cierre',
    estado: 'celebra',
    mensaje: '¡Todo listo! Empecemos a aprender.',
  },
]

function Onboarding({ onTerminar }) {
  const [paso, setPaso] = useState(0)
  const actual = pasos[paso]
  const esUltimo = paso === pasos.length - 1
  const porcentaje = Math.round(((paso + 1) / pasos.length) * 100)
  const items = actual.tipo === 'categorias' ? itemsCategorias : actual.items

  function continuar() {
    if (esUltimo) {
      onTerminar()
    } else {
      setPaso(paso + 1)
    }
  }

  return (
    <div className="ob-pagina">
      <header className="ob-barra-superior">
        <button
          className="ob-atras"
          onClick={() => setPaso(paso - 1)}
          disabled={paso === 0}
          aria-label="Paso anterior"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          className="ob-progreso"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={porcentaje}
        >
          <div className="ob-progreso-relleno" style={{ width: `${porcentaje}%` }}></div>
        </div>

        <button className="ob-omitir" onClick={onTerminar}>Omitir</button>
      </header>

      <main className="ob-contenido" key={actual.id}>
        {actual.tipo === 'bienvenida' || actual.tipo === 'cierre' ? (
          <div className="ob-centro">
            <Mascota estado={actual.estado} mensaje={actual.mensaje} tamano="grande" globo="arriba" />
            {actual.subtexto && <p className="ob-subtexto">{actual.subtexto}</p>}
          </div>
        ) : (
          <div className="ob-columna">
            <Mascota estado={actual.estado} mensaje={actual.mensaje} tamano="pequeno" globo="derecha" />
            <ul className="ob-lista">
              {items.map((item) => (
                <li key={item.titulo} className="ob-item">
                  <span className="ob-item-icono">{item.icono}</span>
                  <div>
                    <p className="ob-item-titulo">{item.titulo}</p>
                    <p className="ob-item-texto">{item.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="ob-pie">
        <button className="ob-continuar" onClick={continuar}>
          {esUltimo ? '¡Empezar!' : 'Continuar'}
        </button>
      </footer>
    </div>
  )
}

export default Onboarding