// Configuración: apariencia, Lobita, cuenta, ayuda y zona de cuidado.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota'
import {
  leerPreferencias,
  guardarPreferencia,
  restablecerPreferencias,
  obtenerNombreSaludo,
} from '../services/preferencias'
import { reiniciarProgreso } from '../services/progreso'
import { cerrarSesion } from '../services/authService'
import { vozActiva, activarVoz, decirLobita } from '../services/vozLobita'
import { useLobita } from '../services/useLobita'
import { temaElegido, elegirTema } from '../services/tema'
import '../styles/menu.css'
import '../styles/perfil.css'

const TEMAS = [
  { valor: 'claro', texto: 'Claro', icono: '☀️' },
  { valor: 'oscuro', texto: 'Oscuro', icono: '🌙' },
  { valor: 'sistema', texto: 'Automático', icono: '💻' },
]

// Interruptor de encendido/apagado
function Interruptor({ id, etiqueta, descripcion, icono, activo, onCambiar }) {
  return (
    <div className="cf-opcion">
      <span className="cf-opcion-icono" aria-hidden="true">{icono}</span>
      <div className="cf-texto">
        <label htmlFor={id}>{etiqueta}</label>
        <p>{descripcion}</p>
      </div>
      <button id={id} type="button" role="switch" aria-checked={activo}
        className={`cf-switch ${activo ? 'activo' : ''}`} onClick={() => onCambiar(!activo)}>
        <span className="cf-switch-bolita" />
      </button>
    </div>
  )
}

function Encabezado({ icono, titulo, texto }) {
  return (
    <div className="pf-encabezado">
      <span className="pf-icono-seccion" aria-hidden="true">{icono}</span>
      <div>
        <h2>{titulo}</h2>
        <p>{texto}</p>
      </div>
    </div>
  )
}

function Aviso({ texto }) {
  return texto ? <p className="cf-aviso" role="status">✓ {texto}</p> : null
}

const iniciales = (nombre = '') => nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'T'

function Configuracion({ usuario }) {
  const navigate = useNavigate()
  const [preferencias, setPreferencias] = useState(leerPreferencias)
  const [apodo, setApodo] = useState(preferencias.apodo)
  const [aviso, setAviso] = useState({ seccion: '', texto: '', n: 0 })
  const [tema, setTema] = useState(temaElegido)
  const [voz, setVoz] = useState(vozActiva)
  const textoAyuda = useLobita('ayuda')

  // Reacción momentánea de Lobita (si es null, sigue su rutina)
  const [reaccion, setReaccion] = useState(null)
  const temporizador = useRef(null)
  const reaccionar = (estado) => {
    clearTimeout(temporizador.current)
    setReaccion({ estado, n: Date.now() })
    temporizador.current = setTimeout(() => setReaccion(null), 3500)
  }
  useEffect(() => () => clearTimeout(temporizador.current), [])

  const avisar = (seccion, texto) => setAviso({ seccion, texto, n: Date.now() })
  const cambiar = (clave, valor) => {
    setPreferencias(guardarPreferencia(clave, valor))
    if (valor) reaccionar('feliz')
  }

  const cambiarTema = (valor) => {
    setTema(valor)
    elegirTema(valor)
    avisar('apariencia', valor === 'sistema' ? 'El tema seguirá al de tu dispositivo.' : `Tema ${valor} activado.`)
    reaccionar('feliz')
  }

  const guardarApodo = () => {
    const limpio = apodo.trim()
    setPreferencias(guardarPreferencia('apodo', limpio))
    setApodo(limpio)
    avisar('lobita', limpio ? `Lobita te llamará «${limpio}».` : 'Lobita usará tu primer nombre.')
    reaccionar('agradecida')
  }

  const reiniciar = async () => {
    if (!window.confirm('¿Seguro que quieres borrar tu progreso? Todas las lecciones volverán a estar bloqueadas.')) return
    try {
      await reiniciarProgreso()
      avisar('cuidado', 'Tu progreso se reinició.')
      reaccionar('animo')
    } catch (err) {
      avisar('cuidado', `No se pudo reiniciar: ${err.message}`)
    }
  }

  const restablecer = () => {
    if (!window.confirm('¿Regresar los ajustes a como estaban al principio? Tu progreso no se borra.')) return
    const nuevas = restablecerPreferencias()
    setPreferencias(nuevas)
    setApodo('')
    cambiarTema('sistema')
    avisar('cuidado', 'Los ajustes regresaron a como estaban.')
    reaccionar('sorpresa')
  }

  const salir = async () => {
    await cerrarSesion()
    window.location.replace('/')
  }

  const rol = usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : 'Estudiante'
  const avisoDe = (seccion) => (aviso.seccion === seccion ? <Aviso key={aviso.n} texto={aviso.texto} /> : null)

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido pf-pagina">
        {/* ---------- Encabezado ---------- */}
        <section className="cf-hero tx-aparecer">
          <div>
            <span className="tx-insignia">Ajustes</span>
            <h1>Configu<span className="tx-degradado">ración</span></h1>
            <p>Haz que Tanextli se adapte a ti: apariencia, Lobita y tu cuenta.</p>
          </div>
          <div className="cf-mascota">
            {reaccion ? (
              <Mascota estado={reaccion.estado} disparo={reaccion.n} tamano="pequeno" />
            ) : (
              <Mascota rutina="configuracion" tamano="pequeno" entrada="deslizar" mensaje={textoAyuda} flotar />
            )}
          </div>
        </section>

        <div className="cf-grid">
          {/* ---------- Apariencia ---------- */}
          <section className="pf-tarjeta tx-aparecer tx-retraso-1">
            <Encabezado icono="🎨" titulo="Apariencia" texto="Cómo se ve la app." />
            <div className="cf-bloque">
              <span className="cf-etiqueta">Tema</span>
              <div className="cf-segmentos" role="radiogroup" aria-label="Tema">
                {TEMAS.map((t) => (
                  <button key={t.valor} type="button" role="radio" aria-checked={tema === t.valor}
                    className={`cf-segmento ${tema === t.valor ? 'activo' : ''}`} onClick={() => cambiarTema(t.valor)}>
                    <span aria-hidden="true">{t.icono}</span> {t.texto}
                  </button>
                ))}
              </div>
            </div>
            <Interruptor id="letra-grande" icono="🔠" etiqueta="Letra más grande"
              descripcion="Agranda los textos y botones de toda la app."
              activo={preferencias.letraGrande} onCambiar={(v) => cambiar('letraGrande', v)} />
            {avisoDe('apariencia')}
          </section>

          {/* ---------- Lobita ---------- */}
          <section className="pf-tarjeta tx-aparecer tx-retraso-2">
            <Encabezado icono="🐺" titulo="Lobita" texto="Tu guía en cada lección." />
            <div className="cf-bloque">
              <label htmlFor="apodo" className="cf-etiqueta">¿Cómo quieres que te llame?</label>
              <p className="cf-ayuda">Ahora te dice: <strong>«{obtenerNombreSaludo(usuario)}»</strong></p>
              <div className="cf-campo-fila">
                <input id="apodo" className="tx-campo" type="text" maxLength={20} placeholder="Escribe un apodo"
                  value={apodo} onChange={(e) => setApodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && guardarApodo()} />
                <button type="button" className="pf-boton" onClick={guardarApodo}>Guardar</button>
              </div>
            </div>
            <Interruptor id="voz-lobita" icono="🔊" etiqueta="Voz de Lobita"
              descripcion="Habla al darte la bienvenida, al acertar y al equivocarte."
              activo={voz} onCambiar={(v) => { setVoz(v); activarVoz(v); if (v) decirLobita('ayuda') }} />
            {avisoDe('lobita')}
          </section>

          {/* ---------- Mi cuenta ---------- */}
          <section className="pf-tarjeta tx-aparecer tx-retraso-3">
            <Encabezado icono="👤" titulo="Mi cuenta" texto="Tus datos en Tanextli." />
            <div className="cf-cuenta">
              {usuario?.foto_url
                ? <img className="cf-avatar" src={usuario.foto_url} alt="" referrerPolicy="no-referrer" />
                : <span className="cf-avatar">{iniciales(usuario?.nombre_usuario)}</span>}
              <div className="cf-cuenta-datos">
                <strong>{usuario?.nombre_usuario}</strong>
                <span>{usuario?.correo}</span>
                <span className="cf-rol">{rol}</span>
              </div>
            </div>
            <button type="button" className="pf-boton pf-boton-secundario cf-salir" onClick={salir}>
              <span aria-hidden="true">↪</span> Cerrar sesión
            </button>
          </section>

          {/* ---------- Ayuda ---------- */}
          <section className="pf-tarjeta tx-aparecer tx-retraso-3">
            <Encabezado icono="💡" titulo="Ayuda" texto="Atajos útiles." />
            <button type="button" className="cf-accion" onClick={() => navigate('/bienvenida')}>
              <span className="cf-opcion-icono" aria-hidden="true">👋</span>
              <span className="cf-texto"><strong>Ver la bienvenida otra vez</strong><span>Repite el recorrido inicial con Lobita.</span></span>
              <span className="cf-flecha" aria-hidden="true">→</span>
            </button>
            <button type="button" className="cf-accion" onClick={() => navigate('/perfil')}>
              <span className="cf-opcion-icono" aria-hidden="true">📈</span>
              <span className="cf-texto"><strong>Ver mi avance</strong><span>Tus logros, tu siguiente lección y tu vocabulario.</span></span>
              <span className="cf-flecha" aria-hidden="true">→</span>
            </button>
            <button type="button" className="cf-accion" onClick={() => navigate('/privacidad')}>
              <span className="cf-opcion-icono" aria-hidden="true">🛡️</span>
              <span className="cf-texto"><strong>Aviso de privacidad</strong><span>Qué datos usamos y cómo los cuidamos.</span></span>
              <span className="cf-flecha" aria-hidden="true">→</span>
            </button>
          </section>

          {/* ---------- Zona de cuidado ---------- */}
          <section className="pf-tarjeta cf-cuidado tx-aparecer">
            <Encabezado icono="⚠️" titulo="Zona de cuidado" texto="Acciones que no se pueden deshacer." />
            <div className="cf-opcion">
              <span className="cf-opcion-icono" aria-hidden="true">↺</span>
              <div className="cf-texto">
                <span className="cf-etiqueta">Restablecer ajustes</span>
                <p>Quita el apodo, la letra grande y vuelve al tema automático. No borra tu progreso.</p>
              </div>
              <button type="button" className="pf-boton pf-boton-secundario" onClick={restablecer}>Restablecer</button>
            </div>
            <div className="cf-opcion">
              <span className="cf-opcion-icono" aria-hidden="true">🗑️</span>
              <div className="cf-texto">
                <span className="cf-etiqueta">Reiniciar mi progreso</span>
                <p>Borra tus lecciones completadas en todos tus dispositivos.</p>
              </div>
              <button type="button" className="pf-boton cf-peligro" onClick={reiniciar}>Reiniciar</button>
            </div>
            {avisoDe('cuidado')}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Configuracion