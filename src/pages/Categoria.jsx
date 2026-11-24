import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { cantidadCompletadas } from '../services/progreso'
import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota' // NUEVO
import { rutinas } from '../data/mascotaAnimaciones' // NUEVO
import { categorias } from '../data/categorias'
import {
  IconFamilia, IconColores, IconFrases, IconNumeros,
  IconBloqueado, IconCasilla, IconCasillaMarcada,
  IconColoresVenn, IconNumeroHash, IconMano, IconConversacion, IconCaraTriste,
} from '../components/Icons'
import '../styles/categoria.css'
import { contenidoLecciones } from '../data/lecciones'
import { useLobita } from '../services/useLobita' // NUEVO

const iconosCategoria = {
  familia: IconFamilia,
  colores: IconColoresVenn,
  frases: IconFrases,
  numeros: IconNumeroHash,
}

// Íconos propios de cada lección (cuando la lección trae "icono" en categorias.js)
const iconosLeccion = {
  mano: IconMano,
  conversacion: IconConversacion,
  triste: IconCaraTriste,
}

// NUEVO: cómo aparece la mascota en cada categoría
const entradaPorCategoria = {
  familia: 'deslizar',
  colores: 'zoom',
  numeros: 'asomar',
  frases: 'aparecer',
}

function Categoria() {
  const { id } = useParams()
  const navigate = useNavigate()
  const categoria = categorias[id]

  // NUEVO: Lobita habla cada vez que entras o regresas a la categoría (y lo muestra en el globo)
  const textoLobita = useLobita('categoria', { clave: id })

  // Lecciones que lleva completadas el usuario (por ahora 0; luego vendrá del backend)
  const leccionesCompletadas = cantidadCompletadas(id)

  if (!categoria) {
    return <Navigate to="/menu" replace />
  }

  const IconoCategoria = iconosCategoria[id]
  const total = categoria.lecciones.length
  const porcentaje = Math.round((leccionesCompletadas / total) * 100)

  // NUEVO: cada categoría tiene su propia rutina; si no existe, usa la general
  const rutinaMascota = rutinas[id] ? id : 'categoria'

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido">
        <Link to={`/categoria/${id}`} className="categoria-volver">← Volver</Link>

        <div className="lec-contenedor">
          <header className="lec-header">
            <div className="lec-header-texto">
              <span className="lec-hojas">🍃</span>
              <div>
                <h1>{categoria.titulo}</h1>
                <p>¿Estás listo para empezar?</p>
              </div>
            </div>
            {/* NUEVO: la imagen fija quedó comentada (no borrada) */}
            {/* <img src="/mascota.png" alt="Mascota de Tanextli" className="lec-mascota" /> */}
            <div className="lec-mascota">
              <Mascota
                key={id}
                rutina={rutinaMascota}
                tamano="pequeno"
                entrada={entradaPorCategoria[id] || 'deslizar'}
                mensaje={textoLobita}
                flotar
              />
            </div>
          </header>

          <section className="lec-progreso">
            <p className="lec-progreso-titulo">Tu progreso en esta sección</p>
            <div className="lec-progreso-fila">
              <div className="lec-barra">
                <div className="lec-barra-relleno" style={{ width: `${porcentaje}%` }}></div>
              </div>
              <span className="lec-porcentaje">{porcentaje}%</span>
            </div>
          </section>

          <div className="lec-lista">
            {categoria.lecciones.map((leccion, index) => {
              const IconoLeccion = iconosLeccion[leccion.icono] || IconoCategoria
              const completada = index < leccionesCompletadas
              const bloqueada = index > leccionesCompletadas
              const etiqueta = leccion.final ? 'Lección final' : `Lección ${leccion.id}`
              const cantidad =
                contenidoLecciones[id] && contenidoLecciones[id][leccion.id]
                  ? contenidoLecciones[id][leccion.id].palabras.length
                  : leccion.palabras

              return (
                <button
                  key={leccion.id}
                  className={`lec-card ${completada ? 'completada' : ''} ${bloqueada ? 'bloqueada' : ''}`}
                  disabled={bloqueada}
                  onClick={() => navigate(`/categoria/${id}/leccion/${leccion.id}`)}
                >
                  <span className="lec-card-icono"><IconoLeccion /></span>
                  <span className="lec-card-texto">
                    <span className="lec-card-etiqueta">{etiqueta}</span>
                    <span className="lec-card-titulo">{leccion.titulo}</span>
                    {!leccion.final && (
                      <span className="lec-card-palabras">{cantidad} palabras</span>
                    )}
                  </span>
                  <span className="lec-card-estado">
                    {bloqueada ? <IconBloqueado /> : completada ? <IconCasillaMarcada /> : <IconCasilla />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Categoria