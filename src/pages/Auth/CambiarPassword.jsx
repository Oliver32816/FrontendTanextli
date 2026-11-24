// Aparece después de entrar con una contraseña temporal (el equipo la restableció desde el panel).
import { useState } from 'react'
import { cambiarPassword } from '../../services/authService'
import BotonTema from '../../components/BotonTema'
import './AuthScreen.css'

const Icono = {
  llave: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2M15 8l3 3M17 6l2 2" /></svg>,
  candado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  alerta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>,
}

export default function CambiarPassword({ usuario, onListo, onSalir }) {
  const [form, setForm] = useState({ actual: '', nueva: '', repetir: '' })
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    setMensaje(null)
    if (form.nueva !== form.repetir) {
      setMensaje('Las contraseñas nuevas no coinciden.')
      return
    }
    if (form.nueva === form.actual) {
      setMensaje('La nueva contraseña debe ser distinta de la temporal.')
      return
    }
    setCargando(true)
    try {
      const actualizado = await cambiarPassword({ actual: form.actual, nueva: form.nueva })
      onListo?.(actualizado)
    } catch (err) {
      setMensaje(err.status === 401 ? 'La contraseña temporal no es correcta.' : err.message)
    } finally {
      setCargando(false)
    }
  }

  const campo = (id, etiqueta, props) => (
    <div className="tx-grupo">
      <label className="tx-etiqueta" htmlFor={id}>{etiqueta}</label>
      <div className="tx-campo-icono">
        {id === 'actual' ? Icono.llave : Icono.candado}
        <input id={id} name={id} className="tx-campo" type="password" value={form[id]} onChange={cambiar} required {...props} />
      </div>
    </div>
  )

  return (
    <div className="auth">
      <div className="tx-fondo-decorativo" aria-hidden="true"><span /><span /><span /></div>
      <BotonTema className="auth-tema" />
      <main className="auth-tarjeta auth-tarjeta--sola tx-aparecer">
        <div className="auth-panel">
          <div className="auth-icono-grande" aria-hidden="true">{Icono.llave}</div>
          <div>
            <h1 className="auth-titulo">Crea tu nueva <span className="tx-degradado">contraseña</span></h1>
            <p className="auth-subtitulo">
              Hola{usuario?.nombre_usuario ? `, ${usuario.nombre_usuario}` : ''}. Entraste con una contraseña temporal.
              Elige una nueva para seguir aprendiendo.
            </p>
          </div>

          <form onSubmit={enviar} className="auth-form">
            {campo('actual', 'Contraseña temporal', { autoComplete: 'current-password' })}
            {campo('nueva', 'Nueva contraseña', { placeholder: 'Mínimo 8 caracteres', minLength: 8, maxLength: 72, autoComplete: 'new-password' })}
            {campo('repetir', 'Repite la nueva contraseña', { minLength: 8, maxLength: 72, autoComplete: 'new-password' })}

            {mensaje && (
              <div className="tx-alerta tx-alerta-error auth-mensaje" role="alert">
                {Icono.alerta}
                <span>{mensaje}</span>
              </div>
            )}

            <button type="submit" className="tx-boton tx-boton-bloque auth-enviar" disabled={cargando}>
              {cargando && <span className="auth-girando" aria-hidden="true" />}
              {cargando ? 'Guardando…' : 'Guardar y continuar'}
            </button>
          </form>

          <button type="button" className="auth-salir" onClick={onSalir}>Cerrar sesión</button>
        </div>
      </main>
    </div>
  )
}