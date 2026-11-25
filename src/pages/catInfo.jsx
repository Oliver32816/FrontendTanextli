import { useLayoutEffect, useRef } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota' // NUEVO
import { rutinas } from '../data/mascotaAnimaciones' // NUEVO
import { useLobita } from '../services/useLobita' // NUEVO
import { categorias } from '../data/categorias'
import { actividadesDe, INFO_ACTIVIDADES } from '../data/actividades'
import { IconAltavoz, IconMicrofono, IconDocumento, IconLapiz } from '../components/Icons'
import '../styles/Catinfo.css'

const ICONOS = {
  microfono: IconMicrofono,
  altavoz: IconAltavoz,
  documento: IconDocumento,
  lapiz: IconLapiz,
}

// NUEVO: cómo aparece la mascota en cada categoría
const entradaPorCategoria = {
  familia: 'deslizar',
  colores: 'zoom',
  numeros: 'asomar',
  frases: 'aparecer',
}

function CategoriaIntro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const categoria = categorias[id]
  const paginaRef = useRef(null)
  const contenidoRef = useRef(null)

  // NUEVO: Lobita habla cada vez que entras o regresas, y lo muestra en un globo
  const textoLobita = useLobita('categoria', { clave: id })

  // NUEVO: escala todo el bloque para que llene justo la pantalla (sin scroll y sin sobrar espacio)
  useLayoutEffect(() => {
    const pagina = paginaRef.current
    const contenido = contenidoRef.current
    if (!pagina || !contenido) return undefined

    function ajustar() {
      // se mide el bloque a su tamaño natural (zoom 1) y luego se calcula cuánto agrandarlo o achicarlo
      contenido.style.setProperty('--intro-zoom', '1')
      const estilo = getComputedStyle(pagina)
      const alto =
        pagina.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom) - 8
      const ancho =
        pagina.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight)
      const porAlto = alto / contenido.offsetHeight
      const porAncho = ancho / contenido.offsetWidth
      const zoom = Math.max(0.3, Math.min(porAlto, porAncho, 1.6))
      contenido.style.setProperty('--intro-zoom', zoom.toFixed(3))
    }

    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(pagina)
    pagina.addEventListener('load', ajustar, true) // carga de la imagen de la mascota
    const t1 = setTimeout(ajustar, 150)
    const t2 = setTimeout(ajustar, 600)
    const t3 = setTimeout(ajustar, 1500)
    return () => {
      observador.disconnect()
      pagina.removeEventListener('load', ajustar, true)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [id, textoLobita])

  if (!categoria) {
    return <Navigate to="/menu" replace />
  }

  // Las actividades que tiene cada lección de esta categoría (la de inicio y hasta 3 más)
  let numero = 0
  const tarjetas = actividadesDe(id, 1).map((tipo) => {
    const info = INFO_ACTIVIDADES[tipo]
    if (tipo !== 'escuchar') numero += 1
    return {
      tipo,
      icono: info.icono,
      texto: info.texto,
      titulo: tipo === 'escuchar' ? info.titulo : `Actividad ${numero}: ${info.titulo}`,
    }
  })

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido intro-pagina" ref={paginaRef}>
        {/* NUEVO: "Volver" queda fuera del bloque, fijo en la esquina superior izquierda */}
        <Link to="/menu" className="categoria-volver intro-volver">← Volver al inicio</Link>

        {/* NUEVO: todo va dentro de "intro-contenido", que se escala para llenar la pantalla */}
        <div className="intro-contenido" ref={contenidoRef}>
          <h1 className="intro-titulo">
            <span className="intro-hojas">🍃🍃</span>
            ¿Qué hay en cada lección?
            <span className="intro-hojas">🍃🍃</span>
          </h1>

          {/* NUEVO: la mascota va debajo del título y su globo queda a un lado (no tapa nada) */}
          <div className="intro-mascota">
            <Mascota
              key={id}
              rutina={rutinas[id] ? id : 'categoria'}
              tamano="pequeno"
              entrada={entradaPorCategoria[id] || 'deslizar'}
              mensaje={textoLobita}
              globo="derecha"
            />
          </div>

          <div className="intro-grid">
            {tarjetas.map((t) => {
              const Icono = ICONOS[t.icono]
              return (
                <div key={t.tipo} className="intro-tarjeta">
                  <Icono />
                  <h3>{t.titulo}</h3>
                  <p>{t.texto}</p>
                </div>
              )
            })}
          </div>

          <button className="intro-continuar" onClick={() => navigate(`/categoria/${id}/lecciones`)}>
            Continuar
          </button>
        </div>
      </main>
    </div>
  )
}

export default CategoriaIntro