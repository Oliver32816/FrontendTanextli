// Configuración → Seguridad: estado del correo y contraseña.
// Las contraseñas se guardan cifradas (bcrypt): nadie puede verlas, ni el equipo de Tanextli.
// Por eso aquí no hay "ver mi contraseña": se puede CAMBIAR (con la actual) o CREAR UNA NUEVA con un
// código que llega al correo (sirve si no se recuerda o si la cuenta entra con Google).
import { useMemo, useState } from 'react'
import { cambiarPassword, pedirCodigoRestablecer, restablecerConCodigo } from '../services/authService'
import { useCuentaRegresiva } from './useCuentaRegresiva'
import '../styles/seguridad.css'

const ESPERA_REENVIO = 60

const Ojo = ({ abierto }) => (abierto ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
))

// Campo de contraseña con botón para mostrar u ocultar lo que se escribe
function CampoPassword({ id, etiqueta, valor, onCambio, ...props }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="cf-campo">
      <label className="cf-etiqueta" htmlFor={id}>{etiqueta}</label>
      <div className="cf-campo-password">
        <input id={id} className="tx-campo" type={ver ? 'text' : 'password'} value={valor}
          onChange={(e) => onCambio(e.target.value)} maxLength={72} {...props} />
        <button type="button" className="cf-ver" onClick={() => setVer((v) => !v)}
          aria-label={ver ? 'Ocultar lo que escribí' : 'Mostrar lo que escribí'} title={ver ? 'Ocultar' : 'Mostrar'}>
          <Ojo abierto={ver} />
        </button>
      </div>
    </div>
  )
}

// Qué tan segura es la contraseña nueva (solo orienta; el mínimo obligatorio son 8 caracteres)
function evaluar(password) {
  const reglas = [
    { ok: password.length >= 8, texto: '8 caracteres o más' },
    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password), texto: 'Mayúsculas y minúsculas' },
    { ok: /\d/.test(password), texto: 'Al menos un número' },
    { ok: /[^A-Za-z0-9]/.test(password) || password.length >= 12, texto: 'Un símbolo o 12 caracteres' },
  ]
  const puntos = reglas.filter((r) => r.ok).length
  const nivel = !password ? 0 : password.length < 8 ? 1 : puntos <= 2 ? 1 : puntos === 3 ? 2 : 3
  return { reglas, nivel, texto: ['', 'Débil', 'Aceptable', 'Fuerte'][nivel] }
}

function Fuerza({ password }) {
  const { reglas, nivel, texto } = useMemo(() => evaluar(password), [password])
  return (
    <div className="cf-fuerza" aria-live="polite">
      <div className={`cf-fuerza-barra nivel-${nivel}`}><span /><span /><span /></div>
      {password && <strong className={`cf-fuerza-texto nivel-${nivel}`}>{texto}</strong>}
      <ul className="cf-reglas">
        {reglas.map((r) => <li key={r.texto} className={r.ok ? 'ok' : ''}>{r.ok ? '✓' : '•'} {r.texto}</li>)}
      </ul>
    </div>
  )
}

export default function SeguridadCuenta({ usuario, onAviso }) {
  const conGoogle = usuario?.proveedor === 'google'
  const [modo, setModo] = useState(null) // null | 'cambiar' | 'codigo'
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [codigo, setCodigo] = useState('')
  const [codigoEnviado, setCodigoEnviado] = useState(false)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [espera, setEspera] = useCuentaRegresiva(0)

  const limpiar = () => {
    setActual(''); setNueva(''); setRepetir(''); setCodigo(''); setError(null); setCodigoEnviado(false)
  }
  const abrir = (m) => { limpiar(); setModo((actualModo) => (actualModo === m ? null : m)) }

  const validarNueva = () => {
    if (nueva.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.'
    if (nueva !== repetir) return 'Las contraseñas nuevas no coinciden.'
    return null
  }

  const guardarCambio = async (e) => {
    e.preventDefault()
    const problema = validarNueva() || (nueva === actual ? 'La nueva contraseña debe ser distinta de la actual.' : null)
    if (problema) return setError(problema)
    setCargando(true)
    setError(null)
    try {
      await cambiarPassword({ actual, nueva })
      limpiar()
      setModo(null)
      onAviso?.('Contraseña actualizada. Úsala la próxima vez que entres.')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const enviarCodigo = async () => {
    setCargando(true)
    setError(null)
    try {
      await pedirCodigoRestablecer(usuario.correo)
      setCodigoEnviado(true)
      setEspera(ESPERA_REENVIO)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const guardarConCodigo = async (e) => {
    e.preventDefault()
    if (codigo.length !== 6) return setError('El código tiene 6 números.')
    const problema = validarNueva()
    if (problema) return setError(problema)
    setCargando(true)
    setError(null)
    try {
      await restablecerConCodigo({ correo: usuario.correo, codigo, nueva })
      limpiar()
      setModo(null)
      onAviso?.('¡Listo! Tu contraseña nueva ya funciona para entrar con tu correo.')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const verificado = usuario?.correo_verificado === true

  return (
    <>
      {/* ---------- Correo ---------- */}
      <div className="cf-opcion">
        <span className="cf-opcion-icono" aria-hidden="true">✉️</span>
        <div className="cf-texto">
          <span className="cf-etiqueta">Correo</span>
          <p className="cf-correo">{usuario?.correo}</p>
        </div>
        {usuario?.correo_verificado === undefined ? null : verificado ? (
          <span className="cf-estado cf-estado-ok">✓ Verificado</span>
        ) : (
          <button type="button" className="cf-estado cf-estado-pendiente"
            onClick={() => { try { sessionStorage.removeItem('tanextli_verificar_despues') } catch { /* nada */ } window.location.reload() }}
            title="Te enviaremos un código para confirmar que el correo es tuyo">
            Verificar ahora
          </button>
        )}
      </div>

      {/* ---------- Contraseña ---------- */}
      <div className="cf-opcion cf-opcion-columna">
        <div className="cf-opcion-fila">
          <span className="cf-opcion-icono" aria-hidden="true">🔑</span>
          <div className="cf-texto">
            <span className="cf-etiqueta">Contraseña</span>
            <p>
              {conGoogle
                ? 'Entras con Google. Si también quieres entrar con tu correo, crea una contraseña.'
                : <><span className="cf-puntos" aria-hidden="true">••••••••</span> Guardada de forma cifrada.</>}
            </p>
          </div>
        </div>

        <p className="cf-nota">
          🔒 Por tu seguridad nadie puede ver tu contraseña, ni siquiera el equipo de Tanextli: se guarda cifrada.
          Si no la recuerdas, crea una nueva con un código que te llega al correo.
        </p>

        <div className="cf-acciones">
          <button type="button" className={`pf-boton ${modo === 'cambiar' ? '' : 'pf-boton-secundario'}`}
            onClick={() => abrir('cambiar')} aria-expanded={modo === 'cambiar'}>
            Cambiar contraseña
          </button>
          <button type="button" className={`pf-boton ${modo === 'codigo' ? '' : 'pf-boton-secundario'}`}
            onClick={() => abrir('codigo')} aria-expanded={modo === 'codigo'}>
            {conGoogle ? 'Crear contraseña' : 'No la recuerdo'}
          </button>
        </div>

        {modo === 'cambiar' && (
          <form className="cf-formulario" onSubmit={guardarCambio}>
            <CampoPassword id="seg-actual" etiqueta="Contraseña actual" valor={actual} onCambio={setActual}
              autoComplete="current-password" required />
            <CampoPassword id="seg-nueva" etiqueta="Contraseña nueva" valor={nueva} onCambio={setNueva}
              autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
            <Fuerza password={nueva} />
            <CampoPassword id="seg-repetir" etiqueta="Repite la contraseña nueva" valor={repetir} onCambio={setRepetir}
              autoComplete="new-password" required />
            {error && <p className="cf-error" role="alert">⚠️ {error}</p>}
            <div className="cf-acciones">
              <button type="submit" className="pf-boton" disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar contraseña'}</button>
              <button type="button" className="pf-boton pf-boton-secundario" onClick={() => abrir('cambiar')}>Cancelar</button>
            </div>
          </form>
        )}

        {modo === 'codigo' && (
          <form className="cf-formulario" onSubmit={guardarConCodigo}>
            {!codigoEnviado ? (
              <>
                <p className="cf-ayuda">Te enviaremos un código de 6 números a <strong>{usuario?.correo}</strong>. Vence en 15 minutos.</p>
                {error && <p className="cf-error" role="alert">⚠️ {error}</p>}
                <div className="cf-acciones">
                  <button type="button" className="pf-boton" onClick={enviarCodigo} disabled={cargando}>
                    {cargando ? 'Enviando…' : 'Enviarme el código'}
                  </button>
                  <button type="button" className="pf-boton pf-boton-secundario" onClick={() => abrir('codigo')}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <p className="cf-ayuda">Revisa tu correo (también la carpeta de spam) y escribe el código.</p>
                <div className="cf-campo">
                  <label className="cf-etiqueta" htmlFor="seg-codigo">Código de 6 números</label>
                  <input id="seg-codigo" className="tx-campo cf-codigo" type="text" inputMode="numeric" autoComplete="one-time-code"
                    placeholder="••••••" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                </div>
                <CampoPassword id="seg-nueva2" etiqueta="Contraseña nueva" valor={nueva} onCambio={setNueva}
                  autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
                <Fuerza password={nueva} />
                <CampoPassword id="seg-repetir2" etiqueta="Repite la contraseña nueva" valor={repetir} onCambio={setRepetir}
                  autoComplete="new-password" required />
                {error && <p className="cf-error" role="alert">⚠️ {error}</p>}
                <div className="cf-acciones">
                  <button type="submit" className="pf-boton" disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar contraseña'}</button>
                  <button type="button" className="pf-boton pf-boton-secundario" onClick={enviarCodigo} disabled={espera > 0 || cargando}>
                    {espera > 0 ? `Reenviar en ${espera} s` : 'Reenviar código'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </>
  )
}
