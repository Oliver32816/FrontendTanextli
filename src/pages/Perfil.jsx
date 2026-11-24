import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota'
import { obtenerResumen, obtenerLogros, obtenerSiguienteLeccion } from '../services/estadisticas'
import { useLobita } from '../services/useLobita' // NUEVO
import { exclamar } from '../services/vozLobita' // NUEVO
import '../styles/menu.css'
import '../styles/perfil.css'

// Frases de Lobita (del Excel) según cuánto lleva el usuario
function mensajeDeLobita(porcentaje) {
  if (porcentaje === 0) return 'Seré tu mentora, gusto en conocerte. ¡Empecemos!'
  if (porcentaje < 50) return '¡Tú puedes! Aprendes rápidamente.'
  if (porcentaje < 100) return '¡Has progresado bastante! Falta menos.'
  return '¡Felicidades! Completaste todas las lecciones.'
}

// NUEVO: qué grupo de audios dice Lobita según el avance
function grupoDeVoz(porcentaje) {
  if (porcentaje === 0) return 'perfil0'
  if (porcentaje < 50) return 'perfilPoco'
  if (porcentaje < 100) return 'perfilMedio'
  return 'perfilTodo'
}

// "EDGAR BAEZ SANTAMARIA" -> "Edgar Baez Santamaria"
function formatearNombre(nombre) {
  return (nombre || 'Usuario')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ')
}

function Perfil({ usuario }) {
  const navigate = useNavigate()
  const resumen = obtenerResumen()
  const logros = obtenerLogros(resumen)
  const siguiente = obtenerSiguienteLeccion()
  const logrosGanados = logros.filter((l) => l.logrado).length

  // NUEVO: Lobita habla cada vez que entras al perfil y el globo muestra lo mismo que dice
  const textoLobita = useLobita(grupoDeVoz(resumen.porcentaje), { ms: 6000 })

  const nombre = formatearNombre(usuario?.nombre_usuario)
  const inicial = nombre.charAt(0)
  const rol = usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : 'Estudiante'

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido pf-pagina">
        <h1 className="pf-titulo">Mi perfil</h1>

        {/* Datos del usuario */}
        <section className="pf-tarjeta pf-encabezado">
          <div className="pf-avatar" aria-hidden="true">{inicial}</div>
          <div className="pf-datos">
            <h2>{nombre}</h2>
            <p>{usuario?.correo}</p>
            <span className="pf-etiqueta">{rol}</span>
          </div>
          <div className="pf-mascota">
            <p className="pf-globo">{textoLobita ? exclamar(textoLobita) : mensajeDeLobita(resumen.porcentaje)}</p>
            <div className="pf-mascota-imagen">
              <Mascota rutina="perfil" tamano="pequeno" entrada="deslizar" />
            </div>
          </div>
        </section>

        {/* Números grandes */}
        <section className="pf-resumen" aria-label="Resumen de tu avance">
          <div className="pf-stat">
            <span className="pf-stat-valor">{resumen.leccionesCompletadas}/{resumen.leccionesTotales}</span>
            <span className="pf-stat-texto">Lecciones completadas</span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-valor">{resumen.palabras}</span>
            <span className="pf-stat-texto">Palabras aprendidas</span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-valor">{resumen.categoriasTerminadas}/{resumen.categorias.length}</span>
            <span className="pf-stat-texto">Categorías terminadas</span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-valor">{logrosGanados}/{logros.length}</span>
            <span className="pf-stat-texto">Logros</span>
          </div>
        </section>

        {/* Qué sigue */}
        <section className={`pf-siguiente ${siguiente ? `categoria-${siguiente.color}` : ''}`}>
          {siguiente ? (
            <>
              <span className="pf-siguiente-icono" aria-hidden="true">{siguiente.icono}</span>
              <div className="pf-siguiente-texto">
                <span>Tu siguiente lección · {siguiente.categoria}</span>
                <strong>{siguiente.titulo}</strong>
              </div>
              <button
                type="button"
                className="pf-boton-chico"
                onClick={() => navigate(`/categoria/${siguiente.categoriaId}/leccion/${siguiente.leccionId}`)}
              >
                Continuar
              </button>
            </>
          ) : (
            <div className="pf-siguiente-texto">
              <span>¡Increíble!</span>
              <strong>Completaste todas las lecciones disponibles. Pronto habrá más.</strong>
            </div>
          )}
        </section>

        {/* Insignias */}
        <section className="pf-tarjeta">
          <h3 className="pf-subtitulo">
            Logros <span className="pf-contador">{logrosGanados} de {logros.length}</span>
          </h3>
          <ul className="pf-logros">
            {logros.map((logro) => (
              <li key={logro.id} className={`pf-logro ${logro.logrado ? 'ganado' : ''}`}>
                <span className="pf-logro-icono" aria-hidden="true">{logro.icono}</span>
                <strong>{logro.titulo}</strong>
                <span>{logro.descripcion}</span>
                <div className="pf-logro-barra" aria-hidden="true">
                  <div style={{ width: `${(logro.actual / logro.meta) * 100}%` }}></div>
                </div>
                <span className="pf-logro-avance">
                  {logro.logrado ? '¡Conseguido!' : `${logro.actual}/${logro.meta}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Palabras aprendidas */}
        <section className="pf-tarjeta">
          <h3 className="pf-subtitulo">
            Mi vocabulario <span className="pf-contador">{resumen.palabras} palabras</span>
          </h3>
          {resumen.vocabulario.length === 0 ? (
            <p className="pf-vacio">Completa tu primera lección y aquí aparecerán las palabras que aprendas.</p>
          ) : (
            resumen.vocabulario.map((grupo) => (
              <div key={grupo.id} className="pf-vocab-grupo">
                <h4>
                  <span aria-hidden="true">{grupo.icono}</span> {grupo.titulo}
                </h4>
                <ul className="pf-vocab">
                  {grupo.palabras.map((p) => (
                    <li key={p.espanol} className={`pf-palabra categoria-${grupo.color}`}>
                      <strong>{p.nahuatl}</strong>
                      <span>{p.espanol}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}

export default Perfil