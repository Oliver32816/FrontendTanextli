// Administración de solo lectura (rol admin): cuántas cuentas hay, quién está activo y cuándo
// fue su último acceso. No hay botones para cambiar nada; los cambios se hacen en el panel
// completo, que solo usan los superusuarios dentro de la red de Tailscale.
import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar, { PORTAL_URL } from '../components/Sidebar'
import BotonTema from '../components/BotonTema'
import { listarUsuariosEquipo } from '../services/authService'
import '../styles/menu.css'
import '../styles/administracion.css'

const EN_LINEA_MIN = 5          // "En línea" si entró hace menos de 5 minutos
const ACTUALIZAR_MS = 60000     // la lista se refresca sola cada minuto

const FILTROS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'usuario', texto: 'Estudiantes' },
  { valor: 'admin', texto: 'Admin' },
  { valor: 'superuser', texto: 'Superusuario' },
]

const ROL_TEXTO = { usuario: 'estudiante', admin: 'admin', superuser: 'superuser' }

const minutosDesde = (fecha) => (fecha ? (Date.now() - new Date(fecha).getTime()) / 60000 : Infinity)

const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
function haceCuanto(fecha) {
  if (!fecha) return 'Nunca'
  const min = minutosDesde(fecha)
  if (min < EN_LINEA_MIN) return 'Ahora'
  if (min < 60) return relativo.format(-Math.round(min), 'minute')
  if (min < 60 * 24) return relativo.format(-Math.round(min / 60), 'hour')
  if (min < 60 * 24 * 30) return relativo.format(-Math.round(min / 1440), 'day')
  return relativo.format(-Math.round(min / 43200), 'month')
}

const fechaCorta = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
const fechaLarga = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

const iniciales = (nombre = '') =>
  nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?'

function Estadistica({ valor, texto, icono, tono, i }) {
  return (
    <div className={`ad-stat ad-tono-${tono}`} style={{ '--i': i }}>
      <span className="ad-stat-icono" aria-hidden="true">{icono}</span>
      <strong>{valor}</strong>
      <span>{texto}</span>
    </div>
  )
}

export default function Administracion({ usuario }) {
  const [usuarios, setUsuarios] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [actualizado, setActualizado] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [soloActivos, setSoloActivos] = useState(false)
  const [, setReloj] = useState(0)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      setUsuarios(await listarUsuariosEquipo())
      setError(null)
      setActualizado(new Date())
    } catch (err) {
      if (err.status === 404) setError('Esta vista estará disponible en cuanto se actualice el servidor.')
      else if (err.status === 403) setError('Esta sección es solo para administradores.')
      else setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, ACTUALIZAR_MS)
    // Los "hace 3 minutos" se recalculan aunque no lleguen datos nuevos
    const r = setInterval(() => setReloj((n) => n + 1), 30000)
    return () => { clearInterval(t); clearInterval(r) }
  }, [cargar])

  const resumen = useMemo(() => {
    const lista = usuarios || []
    return {
      total: lista.length,
      estudiantes: lista.filter((u) => u.rol === 'usuario').length,
      hoy: lista.filter((u) => minutosDesde(u.ultimo_acceso) < 60 * 24).length,
      enLinea: lista.filter((u) => minutosDesde(u.ultimo_acceso) < EN_LINEA_MIN).length,
    }
  }, [usuarios])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (usuarios || [])
      .filter((u) => filtro === 'todos' || u.rol === filtro)
      .filter((u) => !soloActivos || minutosDesde(u.ultimo_acceso) < 60 * 24 * 7)
      .filter((u) => !texto || `${u.nombre_usuario} ${u.correo}`.toLowerCase().includes(texto))
      // Los más recientes primero; los que nunca han entrado, al final
      .sort((a, b) => minutosDesde(a.ultimo_acceso) - minutosDesde(b.ultimo_acceso))
  }, [usuarios, busqueda, filtro, soloActivos])

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido ad-pagina">
        {/* ---------- Encabezado con las mismas secciones que el panel ---------- */}
        <header className="ad-cabecera tx-aparecer">
          <div className="ad-marca">
            <span className="ad-marca-icono" aria-hidden="true">🛡️</span>
            <div>
              <h1>Administración</h1>
              <p>Hola{usuario?.nombre_usuario ? `, ${usuario.nombre_usuario.split(' ')[0]}` : ''}. Aquí ves quién usa Tanextli.</p>
            </div>
            <span className="ad-insignia">Solo lectura</span>
          </div>

          <nav className="ad-nav" aria-label="Secciones de administración">
            <span className="ad-nav-item activo" aria-current="page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.4 3.6 5.2" /></svg>
              Usuarios
            </span>
            <span className="ad-nav-item deshabilitado" title="Muy pronto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></svg>
              Analítica <small>Pronto</small>
            </span>
            <a className="ad-nav-item" href={PORTAL_URL} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
              Portal
            </a>
            <BotonTema className="ad-tema" />
          </nav>
        </header>

        {/* ---------- Números ---------- */}
        <section className="ad-resumen" aria-label="Resumen">
          <Estadistica i={0} tono="verde" icono="👥" valor={resumen.total} texto="Cuentas en total" />
          <Estadistica i={1} tono="azul" icono="📘" valor={resumen.estudiantes} texto="Estudiantes" />
          <Estadistica i={2} tono="naranja" icono="📅" valor={resumen.hoy} texto="Activos hoy" />
          <Estadistica i={3} tono="morado" icono="🟢" valor={resumen.enLinea} texto="En línea ahora" />
        </section>

        {/* ---------- Búsqueda y filtros ---------- */}
        <section className="ad-herramientas tx-aparecer tx-retraso-1">
          <label className="ad-buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" placeholder="Buscar por nombre o correo…" value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar usuarios" />
          </label>
          <span className="ad-contador">{visibles.length} de {resumen.total}</span>
          <div className="ad-filtros" role="group" aria-label="Filtrar por rol">
            {FILTROS.map((f) => (
              <button key={f.valor} type="button" className={`ad-chip ${filtro === f.valor ? 'activo' : ''}`}
                onClick={() => setFiltro(f.valor)} aria-pressed={filtro === f.valor}>
                {f.texto}
              </button>
            ))}
            <button type="button" className={`ad-chip ad-chip-activos ${soloActivos ? 'activo' : ''}`}
              onClick={() => setSoloActivos((v) => !v)} aria-pressed={soloActivos} title="Entraron en los últimos 7 días">
              Activos (7 días)
            </button>
          </div>
        </section>

        {/* ---------- Tabla (sin acciones) ---------- */}
        <section className="ad-tabla tx-aparecer tx-retraso-2">
          <div className="ad-fila ad-fila-titulos" role="row">
            <span>Persona</span><span>Rol</span><span>Registro</span><span>Último acceso</span>
          </div>

          {error && <p className="ad-vacio ad-error" role="alert">⚠️ {error}</p>}
          {!error && usuarios === null && <p className="ad-vacio">Cargando usuarios…</p>}
          {!error && usuarios && visibles.length === 0 && <p className="ad-vacio">No hay usuarios con esos filtros.</p>}

          {!error && visibles.map((u, i) => {
            const enLinea = minutosDesde(u.ultimo_acceso) < EN_LINEA_MIN
            return (
              <div key={u.id} className="ad-fila" role="row" style={{ '--i': Math.min(i, 12) }}>
                <span className="ad-persona">
                  {u.foto_url
                    ? <img className="ad-avatar" src={u.foto_url} alt="" referrerPolicy="no-referrer" />
                    : <span className="ad-avatar">{iniciales(u.nombre_usuario)}</span>}
                  <span className="ad-persona-texto">
                    <strong>{u.nombre_usuario}</strong>
                    <small>{u.correo}</small>
                  </span>
                </span>
                <span><span className={`ad-rol ad-rol-${u.rol}`}>{ROL_TEXTO[u.rol] || u.rol}</span></span>
                <span className="ad-fecha" data-titulo="Registro">{u.creado_en ? fechaCorta.format(new Date(u.creado_en)) : '—'}</span>
                <span className={`ad-acceso ${enLinea ? 'en-linea' : u.ultimo_acceso ? '' : 'nunca'}`} data-titulo="Último acceso"
                  title={u.ultimo_acceso ? fechaLarga.format(new Date(u.ultimo_acceso)) : 'Todavía no entra a la app'}>
                  <i aria-hidden="true" />
                  {haceCuanto(u.ultimo_acceso)}
                </span>
              </div>
            )
          })}
        </section>

        <footer className="ad-pie">
          <span>🔒 Vista de solo lectura: aquí no se puede cambiar nada. Para cambios, pide ayuda a un superusuario.</span>
          <button type="button" className="ad-actualizar" onClick={cargar} disabled={cargando}>
            {cargando ? 'Actualizando…' : '↻ Actualizar'}
          </button>
          {actualizado && <small>Actualizado {haceCuanto(actualizado) === 'Ahora' ? 'hace un momento' : haceCuanto(actualizado)}</small>}
        </footer>
      </main>
    </div>
  )
}
