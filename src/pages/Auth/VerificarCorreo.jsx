// Pide confirmar el correo con el código de 6 números que llega al registrarse.
// obligatoria = cuenta nueva (no puede saltarlo); si no, es una cuenta anterior y puede dejarlo para después.
import { useState } from 'react'
import { enviarCodigoVerificacion, confirmarCorreo } from '../../services/authService'
import { useCuentaRegresiva } from '../../components/useCuentaRegresiva'
import BotonTema from '../../components/BotonTema'
import './AuthScreen.css'
import './codigos.css'

const ESPERA_REENVIO = 60

const Icono = {
  sobre: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>,
  alerta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
  palomita: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>,
}

const soloNumeros = (texto) => texto.replace(/\D/g, '').slice(0, 6)

export default function VerificarCorreo({ usuario, obligatoria, onListo, onOmitir, onSalir }) {
  // Cuenta nueva: el código ya salió al registrarse. Cuenta anterior: todavía no se ha enviado.
  const [enviado, setEnviado] = useState(obligatoria)
  const [espera, setEspera] = useCuentaRegresiva(obligatoria ? ESPERA_REENVIO : 0)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  const enviar = async () => {
    setError(null)
    setCargando(true)
    try {
      const datos = await enviarCodigoVerificacion()
      if (datos.ya_verificado) {
        onListo?.({ ...usuario, correo_verificado: true })
        return
      }
      setEnviado(true)
      setEspera(ESPERA_REENVIO)
      setAviso('Te enviamos un código nuevo. Revisa también la carpeta de spam.')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const confirmar = async (e) => {
    e.preventDefault()
    setError(null)
    if (codigo.length !== 6) return setError('El código tiene 6 números.')
    setCargando(true)
    try {
      const actualizado = await confirmarCorreo(codigo)
      setListo(true)
      setTimeout(() => onListo?.(actualizado), 1400)
    } catch (err) {
      setError(err.message)
      setCodigo('')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth">
      <div className="tx-fondo-decorativo" aria-hidden="true"><span /><span /><span /></div>
      <BotonTema className="auth-tema" />

      <main className="auth-tarjeta auth-tarjeta--sola tx-aparecer">
        <div className="auth-panel">
          <div className={`auth-icono-grande ${listo ? 'auth-icono-listo' : ''}`} aria-hidden="true">
            {listo ? Icono.palomita : Icono.sobre}
          </div>

          {listo ? (
            <div>
              <h1 className="auth-titulo">¡Correo <span className="tx-degradado">verificado</span>!</h1>
              <p className="auth-subtitulo">Gracias. Si algún día olvidas tu contraseña, podrás recuperarla con tu correo.</p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="auth-titulo">Verifica tu <span className="tx-degradado">correo</span></h1>
                <p className="auth-subtitulo">
                  {enviado
                    ? <>Enviamos un código de 6 números a <strong>{usuario?.correo}</strong>. Escríbelo aquí para confirmar que el correo es tuyo.</>
                    : <>Confirma que <strong>{usuario?.correo}</strong> es tu correo. Así podrás recuperar tu cuenta si olvidas tu contraseña.</>}
                </p>
              </div>

              {!enviado ? (
                <div className="auth-form">
                  {error && <div className="tx-alerta tx-alerta-error auth-mensaje" role="alert">{Icono.alerta}<span>{error}</span></div>}
                  <button type="button" className="tx-boton tx-boton-bloque auth-enviar" onClick={enviar} disabled={cargando}>
                    {cargando && <span className="auth-girando" aria-hidden="true" />}
                    {cargando ? 'Enviando…' : 'Enviarme el código'}
                  </button>
                </div>
              ) : (
                <form onSubmit={confirmar} className="auth-form">
                  {aviso && <div className="tx-alerta tx-alerta-info auth-nota" role="status">{Icono.info}<span>{aviso}</span></div>}

                  <div className="tx-grupo">
                    <label className="tx-etiqueta" htmlFor="verificar-codigo">Código de 6 números</label>
                    <input id="verificar-codigo" className="tx-campo auth-codigo" type="text" inputMode="numeric"
                      autoComplete="one-time-code" placeholder="••••••" value={codigo}
                      onChange={(e) => setCodigo(soloNumeros(e.target.value))} required autoFocus />
                  </div>

                  {error && <div className="tx-alerta tx-alerta-error auth-mensaje" role="alert">{Icono.alerta}<span>{error}</span></div>}

                  <button type="submit" className="tx-boton tx-boton-bloque auth-enviar" disabled={cargando || codigo.length !== 6}>
                    {cargando && <span className="auth-girando" aria-hidden="true" />}
                    {cargando ? 'Verificando…' : 'Verificar correo'}
                  </button>

                  <div className="auth-reenviar">
                    <span>¿No llegó?</span>
                    <button type="button" onClick={enviar} disabled={espera > 0 || cargando}>
                      {espera > 0 ? `Reenviar en ${espera} s` : 'Reenviar código'}
                    </button>
                  </div>
                </form>
              )}

              <div className="auth-reenviar auth-pie-verificar">
                {!obligatoria && <button type="button" onClick={onOmitir}>Ahora no</button>}
                {!obligatoria && <span aria-hidden="true">·</span>}
                <button type="button" onClick={onSalir}>Cerrar sesión</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
