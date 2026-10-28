import { useParams, useNavigate, Navigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { categorias } from '../data/categorias'
import { IconFlechaAtras, IconAltavoz, IconMicrofono, IconDocumento, IconLapiz } from '../components/Icons'
import '../styles/Catinfo.css'

function CategoriaIntro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const categoria = categorias[id]

  if (!categoria) {
    return <Navigate to="/menu" replace />
  }

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido">
        <Link to="/menu" className="categoria-volver">← Volver al inicio</Link>

        <h1 className="intro-titulo">
          <span className="intro-hojas">🍃🍃</span>
          ¿Qué hay en cada lección?
          <span className="intro-hojas">🍃🍃</span>
        </h1>

        <div className="intro-grid">
          <div className="intro-tarjeta">
            <IconAltavoz />
            <h3>Escucha</h3>
            <p>Escucha la palabra en náhuatl</p>
          </div>
          <div className="intro-tarjeta">
            <IconMicrofono />
            <h3>Repite</h3>
            <p>Repite la palabra para tu pronunciación</p>
          </div>
          <div className="intro-tarjeta">
            <IconDocumento />
            <h3>Actividad 1</h3>
            <p>Opción múltiple. Elige la respuesta correcta</p>
          </div>
          <div className="intro-tarjeta">
            <IconLapiz />
            <h3>Actividad 2</h3>
            <p>Escribe la traducción, pon a prueba lo que aprendiste</p>
          </div>
        </div>

        <button className="intro-continuar" onClick={() => navigate(`/categoria/${id}/lecciones`)}>
          Continuar
        </button>
      </main>
    </div>
  )
}

export default CategoriaIntro