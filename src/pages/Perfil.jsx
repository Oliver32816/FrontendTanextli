// Mi perfil: tu avance, tus logros y las palabras que ya aprendiste.
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota'
import { useAncho, tamanoMascota } from '../components/useAncho'
import { useContador } from '../components/useContador'
import { obtenerResumen, obtenerLogros, obtenerSiguienteLeccion } from '../services/estadisticas'
import { useLobita } from '../services/useLobita'
import { exclamar } from '../services/vozLobita'
import '../styles/menu.css'
import '../styles/perfil.css'

// Frases de Lobita según cuánto lleva el usuario
function mensajeDeLobita(porcentaje) {
  if (porcentaje === 0) return 'Seré tu mentora, gusto en conocerte. ¡Empecemos!'
  if (porcentaje < 50) return '¡Tú puedes! Aprendes rápidamente.'
  if (porcentaje < 100) return '¡Has progresado bastante! Falta menos.'
  return '¡Felicidades! Completaste todas las lecciones.'
}

// Qué grupo de audios dice Lobita según el avance
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

const iniciales = (nombre) => nombre.split(' ').slice(0, 2).map((p) => p[0]).join('')

// Anillo grande con el porcentaje total
const RADIO = 52
const CIRC = 2 * Math.PI * RADIO
function AnilloTotal({ porcentaje }) {
  const n = useContador(porcentaje, 1200)
  return (
    <div className="pf-anillo" role="img" aria-label={`${porcentaje}% de avance total`}>
      <svg viewBox="0 0 120 120">
        <defs>
          <linearGradient id="pf-degradado" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd29a" />
            <stop offset="1" stopColor="#5cc489" />
          </linearGradient>
        </defs>
        <circle className="pf-anillo-fondo" cx="60" cy="60" r={RADIO} />
        <circle className="pf-anillo-valor" cx="60" cy="60" r={RADIO}
          strokeDasharray={CIRC} style={{ '--desde': CIRC, '--hasta': CIRC * (1 - porcentaje / 100) }} />
      </svg>
      <div className="pf-anillo-texto"><strong>{n}%</strong><span>avance</span></div>
    </div>
  )
}

function Estadistica({ valor, total, texto, icono, tono, i }) {
  const n = useContador(valor)
  return (
    <div className={`pf-stat pf-tono-${tono}`} style={{ '--i': i }}>
      <span className="pf-stat-icono" aria-hidden="true">{icono}</span>
      <span className="pf-stat-valor">{n}{total !== undefined && <small>/{total}</small>}</span>
      <span className="pf-stat-texto">{texto}</span>
    </div>
  )
}

const TONO_CATEGORIA = { morado: 'morado', azul: 'azul', naranja: 'naranja', verde: 'verde' }

function Perfil({ usuario }) {
  const navigate = useNavigate()
  const resumen = obtenerResumen()
  const logros = obtenerLogros(resumen)
  const siguiente = obtenerSiguienteLeccion()
  const logrosGanados = logros.filter((l) => l.logrado).length
  const textoLobita = useLobita(grupoDeVoz(resumen.porcentaje), { ms: 6000 })
  const [refLobita, medida] = useAncho()
  // Se deja espacio arriba para el globo de Lobita
  const tamano = tamanoMascota({ ancho: medida.ancho, alto: Math.max(0, medida.alto - 52) }, { factor: .8, min: 90, max: 190 })

  const nombre = formatearNombre(usuario?.nombre_usuario)
  const rol = usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : 'Estudiante'

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido pf-pagina">
        {/* ---------- Encabezado ---------- */}
        <section className="pf-hero tx-aparecer">
          <div className="pf-identidad">
            <div className="pf-avatar">
              <span className="pf-avatar-anillo" aria-hidden="true" />
              {usuario?.foto_url
                ? <img src={usuario.foto_url} alt="" referrerPolicy="no-referrer" />
                : <span className="pf-avatar-iniciales">{iniciales(nombre)}</span>}
            </div>
            <div className="pf-datos">
              <span className="pf-saludo">Mi perfil</span>
              <h1>{nombre}</h1>
              <p>{usuario?.correo}</p>
              <span className="pf-rol">⭐ {rol}</span>
            </div>
          </div>

          <AnilloTotal porcentaje={resumen.porcentaje} />

          <div className="pf-lobita" ref={refLobita}>
            <p className="pf-globo">{textoLobita ? exclamar(textoLobita) : mensajeDeLobita(resumen.porcentaje)}</p>
            <div className="pf-lobita-mascota">
              <Mascota rutina="perfil" tamano={tamano} entrada="deslizar" />
            </div>
          </div>
        </section>

        {/* ---------- Números ---------- */}
        <section className="pf-resumen" aria-label="Resumen de tu avance">
          <Estadistica i={0} tono="verde" icono="📘" valor={resumen.leccionesCompletadas} total={resumen.leccionesTotales} texto="Lecciones completadas" />
          <Estadistica i={1} tono="azul" icono="📖" valor={resumen.palabras} texto="Palabras aprendidas" />
          <Estadistica i={2} tono="naranja" icono="🏁" valor={resumen.categoriasTerminadas} total={resumen.categorias.length} texto="Categorías terminadas" />
          <Estadistica i={3} tono="morado" icono="🏆" valor={logrosGanados} total={logros.length} texto="Logros" />
        </section>

        {/* ---------- Qué sigue ---------- */}
        <section className="pf-siguiente tx-aparecer tx-retraso-2">
          {siguiente ? (
            <>
              <span className="pf-siguiente-icono" aria-hidden="true">{siguiente.icono}</span>
              <div className="pf-siguiente-texto">
                <span>Tu siguiente lección · {siguiente.categoria}</span>
                <strong>{siguiente.titulo}</strong>
              </div>
              <button type="button" className="pf-boton"
                onClick={() => navigate(`/categoria/${siguiente.categoriaId}/leccion/${siguiente.leccionId}`)}>
                Continuar <span aria-hidden="true">→</span>
              </button>
            </>
          ) : (
            <>
              <span className="pf-siguiente-icono" aria-hidden="true">🏆</span>
              <div className="pf-siguiente-texto">
                <span>¡Increíble!</span>
                <strong>Completaste todas las lecciones disponibles. Pronto habrá más.</strong>
              </div>
            </>
          )}
        </section>

        {/* ---------- Avance por categoría ---------- */}
        <section className="pf-tarjeta tx-aparecer tx-retraso-2">
          <div className="pf-encabezado">
            <span className="pf-icono-seccion" aria-hidden="true">📊</span>
            <div>
              <h2>Avance por categoría</h2>
              <p>Cuánto llevas en cada sección.</p>
            </div>
          </div>
          <ul className="pf-categorias">
            {resumen.categorias.map((c, i) => {
              const pct = c.total ? Math.round((c.completadas / c.total) * 100) : 0
              return (
                <li key={c.id} className={`pf-tono-${TONO_CATEGORIA[c.color] || 'verde'}`} style={{ '--i': i }}>
                  <span className="pf-categoria-icono" aria-hidden="true">{c.icono}</span>
                  <div className="pf-categoria-info">
                    <div className="pf-categoria-fila">
                      <strong>{c.titulo}</strong>
                      <span>{c.completadas}/{c.total} · {pct}%</span>
                    </div>
                    <div className="pf-barra"><div style={{ '--ancho': `${pct}%` }} /></div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------- Logros ---------- */}
        <section className="pf-tarjeta tx-aparecer tx-retraso-3">
          <div className="pf-encabezado">
            <span className="pf-icono-seccion" aria-hidden="true">🏅</span>
            <div>
              <h2>Logros</h2>
              <p>Insignias que ganas al aprender.</p>
            </div>
            <span className="pf-contador">{logrosGanados} de {logros.length}</span>
          </div>
          <ul className="pf-logros">
            {logros.map((logro, i) => (
              <li key={logro.id} className={`pf-logro ${logro.logrado ? 'ganado' : ''}`} style={{ '--i': i }}>
                {!logro.logrado && <span className="pf-candado" aria-hidden="true">🔒</span>}
                <span className="pf-logro-icono" aria-hidden="true">{logro.icono}</span>
                <strong>{logro.titulo}</strong>
                <span className="pf-logro-desc">{logro.descripcion}</span>
                <div className="pf-barra pf-barra-chica" aria-hidden="true">
                  <div style={{ '--ancho': `${(logro.actual / logro.meta) * 100}%` }} />
                </div>
                <span className="pf-logro-avance">
                  {logro.logrado ? '¡Conseguido!' : `${logro.actual}/${logro.meta}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Vocabulario ---------- */}
        <section className="pf-tarjeta tx-aparecer">
          <div className="pf-encabezado">
            <span className="pf-icono-seccion" aria-hidden="true">🗣️</span>
            <div>
              <h2>Mi vocabulario</h2>
              <p>Palabras en náhuatl que ya conoces.</p>
            </div>
            <span className="pf-contador">{resumen.palabras} palabras</span>
          </div>
          {resumen.vocabulario.length === 0 ? (
            <p className="pf-vacio">🌱 Completa tu primera lección y aquí aparecerán las palabras que aprendas.</p>
          ) : (
            resumen.vocabulario.map((grupo) => (
              <div key={grupo.id} className={`pf-vocab-grupo pf-tono-${TONO_CATEGORIA[grupo.color] || 'verde'}`}>
                <h3><span aria-hidden="true">{grupo.icono}</span> {grupo.titulo}</h3>
                <ul className="pf-vocab">
                  {grupo.palabras.map((p, i) => (
                    <li key={p.espanol} className="pf-palabra" style={{ '--i': i }}>
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