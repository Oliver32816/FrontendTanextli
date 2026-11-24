// Inicio de sesión y registro. Mismo diseño que el portal de Tanextli:
// fondo animado, tarjeta de vidrio, Lobita sobre una forma que se transforma y palabras flotando.
import { useCallback, useEffect, useState } from 'react'
import { registrar, iniciarSesion, iniciarConGoogle } from '../../services/authService'
import MascotaAnimada from '../../components/MascotaAnimada'
import { useMascota } from '../../components/useMascota'
import BotonGoogle from '../../components/BotonGoogle'
import { useAncho, tamanoMascota } from '../../components/useAncho'
import './AuthScreen.css'

// Palabras que flotan alrededor de Lobita (del contenido de las lecciones)
const PALABRAS = [
  { nahuatl: 'Cenchan', espanol: 'Familia' },
  { nahuatl: 'Maman', espanol: 'Madre' },
  { nahuatl: 'Papan', espanol: 'Padre' },
]

const Icono = {
  usuario: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>,
  correo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>,
  candado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  ojo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  ojoCerrado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>,
  flecha: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  alerta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
}

export default function AuthScreen({ onLogin }) {
  const [esRegistro, setEsRegistro] = useState(false)
  const [form, setForm] = useState({ nombre_usuario: '', correo: '', password: '' })
  const [verPassword, setVerPassword] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [ayudaPassword, setAyudaPassword] = useState(false)

  const [mirada, setMirada] = useState(null)
  const { estado, mensaje: mensajeMascota, reaccionar } = useMascota()
  const [refEscena, medidaEscena] = useAncho()
  const tamano = tamanoMascota(medidaEscena, { max: 280 })

  // Al abrir la pantalla Lobita saluda solo con un globo (sin voz)
  useEffect(() => {
    reaccionar('saludando', '¡Hola! Inicia sesión para seguir aprendiendo náhuatl', 5000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const alternarModo = () => {
    setEsRegistro(!esRegistro)
    setMensaje(null)
    setAyudaPassword(false)
    reaccionar('feliz', esRegistro ? '¡Qué bueno verte de nuevo!' : '¡Crea tu cuenta!', 2500)
  }

  const enviar = async (e) => {
    e.preventDefault()
    setMensaje(null)
    setCargando(true)
    reaccionar('pensando', 'Un momento…', 10000)
    try {
      const usuario = esRegistro ? await registrar(form) : await iniciarSesion(form)
      reaccionar('celebrando', esRegistro ? '¡Cuenta creada!' : '¡Bienvenido!', 2500)
      onLogin?.(usuario)
    } catch (err) {
      if (esRegistro && err.status === 409) {
        setMensaje('Ese correo ya tiene una cuenta. Inicia sesión o entra con Google.')
      } else if (!esRegistro && (err.status === 401 || err.status === 404)) {
        setMensaje('Correo o contraseña incorrectos. Si aún no tienes cuenta, crea una.')
      } else {
        setMensaje(err.message)
      }
      reaccionar('error', esRegistro ? 'Revisa tus datos' : 'No encontré tu cuenta', 4000)
    } finally {
      setCargando(false)
    }
  }

  // El botón de Google entrega el credential; el servidor registra la cuenta si es nueva
  const entrarConGoogle = useCallback(async (credential) => {
    setMensaje(null)
    setCargando(true)
    reaccionar('pensando', 'Un momento…', 10000)
    try {
      const usuario = await iniciarConGoogle(credential)
      reaccionar('celebrando', '¡Bienvenido!', 2500)
      onLogin?.(usuario)
    } catch (err) {
      setMensaje(err.message || 'No se pudo entrar con Google')
      reaccionar('error', 'No se pudo entrar con Google', 2500)
    } finally {
      setCargando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLogin])

  return (
    <div className="auth">
      <div className="tx-fondo-decorativo" aria-hidden="true"><span /><span /><span /></div>

      <div className="auth-tarjeta tx-aparecer">
        {/* ---------- Lado de Lobita ---------- */}
        <aside className="auth-escena" aria-hidden="true">
          <div className="auth-escena-texto">
            <span className="auth-escena-eyebrow">Aprende náhuatl</span>
            <p>Conecta con tu lengua,<br />nuestra raíz.</p>
          </div>

          <div className="auth-ilustracion" ref={refEscena}>
            <div className="auth-orbe" />
            {PALABRAS.map((p, i) => (
              <div key={p.nahuatl} className={`auth-burbuja auth-burbuja-${i + 1}`}>
                <strong>{p.nahuatl}</strong>
                <small>{p.espanol}</small>
              </div>
            ))}
            <div className="auth-lobita">
              <MascotaAnimada estado={estado} mensaje={mensajeMascota} tamano={tamano} mirada={mirada} entrada="rebote" flotar />
            </div>
          </div>
        </aside>

        {/* ---------- Formulario ---------- */}
        <main className="auth-panel">
          <a className="tx-marca auth-marca" href="/">
            <img src="/logo.svg" alt="" width="38" height="38" />
            <span>Tanextli<small>Aprende náhuatl</small></span>
          </a>

          <div key={esRegistro ? 'registro' : 'login'} className="auth-contenido">
            <span className="tx-insignia tx-aparecer">{esRegistro ? 'Cuenta nueva' : 'Bienvenido de vuelta'}</span>
            <h1 className="auth-titulo tx-aparecer tx-retraso-1">
              {esRegistro ? <>Crea tu <span className="tx-degradado">cuenta</span></> : <>Inicia <span className="tx-degradado">sesión</span></>}
            </h1>
            <p className="auth-subtitulo tx-aparecer tx-retraso-2">
              {esRegistro ? 'Guarda tu avance y aprende a tu ritmo.' : 'Tu progreso te espera donde lo dejaste.'}
            </p>

            <form
              onSubmit={enviar}
              className="auth-form tx-aparecer tx-retraso-3"
              onFocus={() => { reaccionar('escuchando', '', 4000); setMirada([4, 1]) }}
              onBlur={() => setMirada(null)}
            >
              {esRegistro && (
                <div className="tx-grupo">
                  <label className="tx-etiqueta" htmlFor="nombre_usuario">Nombre de usuario</label>
                  <div className="tx-campo-icono">
                    {Icono.usuario}
                    <input id="nombre_usuario" name="nombre_usuario" className="tx-campo" type="text"
                      placeholder="¿Cómo te llamas?" value={form.nombre_usuario} onChange={cambiar}
                      autoComplete="nickname" maxLength={80} required />
                  </div>
                </div>
              )}

              <div className="tx-grupo">
                <label className="tx-etiqueta" htmlFor="correo">Correo electrónico</label>
                <div className="tx-campo-icono">
                  {Icono.correo}
                  <input id="correo" name="correo" className="tx-campo" type="email"
                    placeholder="tucorreo@ejemplo.com" value={form.correo} onChange={cambiar}
                    autoComplete="email" maxLength={254} required />
                </div>
              </div>

              <div className="tx-grupo">
                <div className="auth-fila-etiqueta">
                  <label className="tx-etiqueta" htmlFor="password">Contraseña</label>
                  {!esRegistro && (
                    <button type="button" className="auth-enlace" onClick={() => setAyudaPassword((v) => !v)} aria-expanded={ayudaPassword}>
                      ¿La olvidaste?
                    </button>
                  )}
                </div>
                <div className="tx-campo-icono">
                  {Icono.candado}
                  <input id="password" name="password" className="tx-campo auth-campo-password"
                    type={verPassword ? 'text' : 'password'}
                    placeholder={esRegistro ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                    value={form.password} onChange={cambiar}
                    autoComplete={esRegistro ? 'new-password' : 'current-password'}
                    minLength={esRegistro ? 8 : undefined} maxLength={72} required />
                  <button type="button" className="auth-ver" onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {verPassword ? Icono.ojoCerrado : Icono.ojo}
                  </button>
                </div>
              </div>

              {!esRegistro && ayudaPassword && (
                <div className="tx-alerta tx-alerta-info auth-ayuda" role="note">
                  {Icono.info}
                  <span>
                    <strong>¿Usas Gmail?</strong> Entra con <em>Continuar con Google</em> usando el mismo correo:
                    tu cuenta y tu progreso se conservan. Si no, pide a tu maestro o al equipo de Tanextli una
                    contraseña temporal; la app te pedirá cambiarla al entrar.
                  </span>
                </div>
              )}

              {mensaje && (
                <div className="tx-alerta tx-alerta-error auth-mensaje" role="alert">
                  {Icono.alerta}
                  <span>{mensaje}</span>
                </div>
              )}

              <button type="submit" className="tx-boton tx-boton-bloque auth-enviar" disabled={cargando}>
                {cargando ? <span className="auth-girando" aria-hidden="true" /> : null}
                {cargando ? 'Un momento…' : esRegistro ? 'Crear mi cuenta' : 'Entrar'}
                {!cargando && Icono.flecha}
              </button>
            </form>

            <div className="auth-separador tx-aparecer tx-retraso-4"><span>o</span></div>

            <div className="tx-aparecer tx-retraso-4">
              <BotonGoogle onCredential={entrarConGoogle} deshabilitado={cargando} texto={esRegistro ? 'signup_with' : 'continue_with'} />
            </div>

            <p className="auth-alternar">
              {esRegistro ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
              <button type="button" onClick={alternarModo}>{esRegistro ? 'Inicia sesión' : 'Crea una gratis'}</button>
            </p>
          </div>

          <p className="auth-legal">
            Al continuar aceptas los <a href="/terminos" target="_blank" rel="noreferrer">términos</a> y
            el <a href="/privacidad" target="_blank" rel="noreferrer">aviso de privacidad</a>.
          </p>
        </main>
      </div>
    </div>
  )
}