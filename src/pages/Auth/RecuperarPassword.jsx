// "¿Olvidaste tu contraseña?": 1) se pide un código al correo, 2) se escribe el código y la
// contraseña nueva. Al terminar, la persona entra directo a la app.
import { useState } from 'react'
import { pedirCodigoRestablecer, restablecerConCodigo } from '../../services/authService'
import { useCuentaRegresiva } from '../../components/useCuentaRegresiva'
import './codigos.css'

const ESPERA_REENVIO = 60

const Icono = {
  correo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>,
  candado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  alerta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
  flecha: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
}

const soloNumeros = (texto) => texto.replace(/\D/g, '').slice(0, 6)

export default function RecuperarPassword({ correoInicial = '', onLogin, onVolver, reaccionar }) {
  const [paso, setPaso] = useState('correo') // correo | codigo
  const [correo, setCorreo] = useState(correoInicial)
  const [codigo, setCodigo] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [espera, setEspera] = useCuentaRegresiva(0)

  const pedirCodigo = async (e) => {
    e?.preventDefault()
    setError(null)
    setCargando(true)
    reaccionar?.('pensando', 'Buscando tu cuenta…', 8000)
    try {
      await pedirCodigoRestablecer(correo.trim())
      setPaso('codigo')
      setEspera(ESPERA_REENVIO)
      setAviso(`Si ${correo.trim()} tiene una cuenta, ya te llegó un código de 6 números. Revisa también la carpeta de spam.`)
      reaccionar?.('feliz', '¡Revisa tu correo!', 3500)
    } catch (err) {
      setError(err.message)
      reaccionar?.('error', 'Algo salió mal', 3000)
    } finally {
      setCargando(false)
    }
  }

  const cambiar = async (e) => {
    e.preventDefault()
    setError(null)
    if (codigo.length !== 6) return setError('El código tiene 6 números.')
    if (nueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.')
    if (nueva !== repetir) return setError('Las contraseñas no coinciden.')
    setCargando(true)
    reaccionar?.('pensando', 'Un momento…', 8000)
    try {
      const usuario = await restablecerConCodigo({ correo: correo.trim(), codigo, nueva })
      reaccionar?.('celebrando', '¡Listo! Ya puedes entrar', 2500)
      onLogin?.(usuario)
    } catch (err) {
      setError(err.message)
      reaccionar?.('error', 'Revisa el código', 3000)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div key={paso} className="auth-contenido">
      <span className="tx-insignia tx-aparecer">Recuperar cuenta</span>
      <h1 className="auth-titulo tx-aparecer tx-retraso-1">
        {paso === 'correo'
          ? <>¿Olvidaste tu <span className="tx-degradado">contraseña</span>?</>
          : <>Revisa tu <span className="tx-degradado">correo</span></>}
      </h1>
      <p className="auth-subtitulo tx-aparecer tx-retraso-2">
        {paso === 'correo'
          ? 'Escribe el correo de tu cuenta y te enviaremos un código de 6 números para crear una contraseña nueva.'
          : <>Escribe el código que enviamos a <strong>{correo.trim()}</strong> y elige tu contraseña nueva.</>}
      </p>

      {paso === 'correo' ? (
        <form onSubmit={pedirCodigo} className="auth-form tx-aparecer tx-retraso-3">
          <div className="tx-grupo">
            <label className="tx-etiqueta" htmlFor="recuperar-correo">Correo electrónico</label>
            <div className="tx-campo-icono">
              {Icono.correo}
              <input id="recuperar-correo" className="tx-campo" type="email" placeholder="tucorreo@ejemplo.com"
                value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" maxLength={254} required autoFocus />
            </div>
          </div>

          <div className="tx-alerta tx-alerta-info auth-nota" role="note">
            {Icono.info}
            <span><strong>¿Entras con Google?</strong> No necesitas contraseña: usa <em>Continuar con Google</em>.</span>
          </div>

          {error && <div className="tx-alerta tx-alerta-error auth-mensaje" role="alert">{Icono.alerta}<span>{error}</span></div>}

          <button type="submit" className="tx-boton tx-boton-bloque auth-enviar" disabled={cargando}>
            {cargando && <span className="auth-girando" aria-hidden="true" />}
            {cargando ? 'Enviando…' : 'Enviar código'}
            {!cargando && Icono.flecha}
          </button>
        </form>
      ) : (
        <form onSubmit={cambiar} className="auth-form tx-aparecer tx-retraso-3">
          {aviso && <div className="tx-alerta tx-alerta-info auth-nota" role="status">{Icono.info}<span>{aviso}</span></div>}

          <div className="tx-grupo">
            <label className="tx-etiqueta" htmlFor="recuperar-codigo">Código de 6 números</label>
            <input id="recuperar-codigo" className="tx-campo auth-codigo" type="text" inputMode="numeric"
              autoComplete="one-time-code" placeholder="••••••" value={codigo}
              onChange={(e) => setCodigo(soloNumeros(e.target.value))} required autoFocus />
          </div>

          <div className="tx-grupo">
            <label className="tx-etiqueta" htmlFor="recuperar-nueva">Contraseña nueva</label>
            <div className="tx-campo-icono">
              {Icono.candado}
              <input id="recuperar-nueva" className="tx-campo" type="password" placeholder="Mínimo 8 caracteres"
                value={nueva} onChange={(e) => setNueva(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required />
            </div>
          </div>

          <div className="tx-grupo">
            <label className="tx-etiqueta" htmlFor="recuperar-repetir">Repite la contraseña nueva</label>
            <div className="tx-campo-icono">
              {Icono.candado}
              <input id="recuperar-repetir" className="tx-campo" type="password"
                value={repetir} onChange={(e) => setRepetir(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required />
            </div>
          </div>

          {error && <div className="tx-alerta tx-alerta-error auth-mensaje" role="alert">{Icono.alerta}<span>{error}</span></div>}

          <button type="submit" className="tx-boton tx-boton-bloque auth-enviar" disabled={cargando}>
            {cargando && <span className="auth-girando" aria-hidden="true" />}
            {cargando ? 'Guardando…' : 'Cambiar contraseña y entrar'}
            {!cargando && Icono.flecha}
          </button>

          <div className="auth-reenviar">
            <button type="button" onClick={pedirCodigo} disabled={espera > 0 || cargando}>
              {espera > 0 ? `Reenviar código en ${espera} s` : 'Reenviar código'}
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => { setPaso('correo'); setCodigo(''); setError(null) }}>Cambiar correo</button>
          </div>
        </form>
      )}

      <p className="auth-alternar">
        <button type="button" onClick={onVolver}>← Volver a iniciar sesión</button>
      </p>
    </div>
  )
}
