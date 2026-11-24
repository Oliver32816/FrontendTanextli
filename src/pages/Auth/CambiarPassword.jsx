// Aparece después de entrar con una contraseña temporal (el equipo la restableció desde el panel).
import { useState } from 'react'
import { cambiarPassword } from '../../services/authService'
import './AuthScreen.css'

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

  return (
    <div className="auth">
      <div className="auth__card auth__card--sola">
        <main className="auth__right">
          <h2 className="auth__brand">Tanextli</h2>
          <h3 className="auth__form-title">Crea tu nueva contraseña</h3>
          <p className="auth__nota">
            Hola{usuario?.nombre_usuario ? `, ${usuario.nombre_usuario}` : ''}. Entraste con una contraseña temporal.
            Elige una nueva para seguir aprendiendo.
          </p>

          <form onSubmit={enviar} className="auth__form">
            <div className="auth__group">
              <label htmlFor="actual">🔑 Contraseña temporal</label>
              <input id="actual" name="actual" type="password" value={form.actual} onChange={cambiar}
                autoComplete="current-password" required />
            </div>
            <div className="auth__group">
              <label htmlFor="nueva">🔒 Nueva contraseña</label>
              <input id="nueva" name="nueva" type="password" value={form.nueva} onChange={cambiar}
                placeholder="Mínimo 8 caracteres" minLength={8} maxLength={72} autoComplete="new-password" required />
            </div>
            <div className="auth__group">
              <label htmlFor="repetir">🔒 Repite la nueva contraseña</label>
              <input id="repetir" name="repetir" type="password" value={form.repetir} onChange={cambiar}
                minLength={8} maxLength={72} autoComplete="new-password" required />
            </div>
            <button type="submit" className="auth__btn-primary" disabled={cargando}>
              {cargando ? 'Guardando…' : 'Guardar y continuar'}
            </button>
          </form>

          {mensaje && <div className="auth__message auth__message--error" role="alert">{mensaje}</div>}

          <button type="button" className="auth__link-secundario" onClick={onSalir}>Cerrar sesión</button>
        </main>
      </div>
    </div>
  )
}