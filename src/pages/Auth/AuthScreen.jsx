import { useEffect, useState } from 'react'; // NUEVO: se agregó useEffect
import { registrar, iniciarSesion, iniciarConGoogle } from '../../services/authService';
import MascotaAnimada from '../../components/MascotaAnimada'; // NUEVO
import { useMascota } from '../../components/useMascota'; // NUEVO
import './AuthScreen.css';

export default function AuthScreen({ onLogin }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [form, setForm] = useState({ nombre_usuario: '', correo: '', password: '' });
  const [mensaje, setMensaje] = useState(null); // { texto, tipo: 'success' | 'error' }
  const [cargando, setCargando] = useState(false);

  // NUEVO: mascota animada (el mensaje se llama distinto porque arriba ya existe "mensaje")
  const [mirada, setMirada] = useState(null);
  const { estado, mensaje: mensajeMascota, reaccionar } = useMascota();

  // NUEVO: saluda al abrir la pantalla
  useEffect(() => {
    reaccionar('saludando', '¡Hola! Vamos a aprender náhuatl', 3500);
  }, []);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const alternarModo = () => {
    setEsRegistro(!esRegistro);
    setMensaje(null);
    reaccionar('feliz', esRegistro ? '¡Qué bueno verte de nuevo!' : '¡Crea tu cuenta!', 2500); // NUEVO
  };

  const enviar = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setCargando(true);
    reaccionar('pensando', 'Un momento…', 10000); // NUEVO

    try {
      if (esRegistro) {
        // --- FLUJO DE REGISTRO ---
        await registrar(form);
        reaccionar('celebrando', '¡Cuenta creada!', 2500); // NUEVO
        
        // Al registrarse exitosamente: mandamos al usuario al Login
        setMensaje({ 
          texto: '¡Cuenta creada con éxito! Ahora puedes iniciar sesión con tus credenciales.', 
          tipo: 'success' 
        });
        setEsRegistro(false); // Cambia automáticamente a la vista de Login
      } else {
        // --- FLUJO DE INICIO DE SESIÓN ---
        const usuario = await iniciarSesion(form);
        reaccionar('celebrando', '¡Bienvenido!', 2500); // NUEVO
        onLogin?.(usuario);
      }
    } catch (err) {
      if (!esRegistro) {
        // Si falla el login (usuario no registrado o error de datos)
        setMensaje({ 
          texto: 'No se encontró la cuenta o datos incorrectos. Te redirigimos al Registro.', 
          tipo: 'error' 
        });
        reaccionar('error', 'No encontré tu cuenta', 1800); // NUEVO
        
        // Redirigimos automáticamente a la vista de Registro
        setTimeout(() => {
          setEsRegistro(true);
          reaccionar('feliz', '¡Crea tu cuenta!', 2500); // NUEVO
        }, 1200);
      } else {
        setMensaje({ texto: err.message, tipo: 'error' });
        reaccionar('error', 'Revisa tus datos', 2500); // NUEVO
      }
    } finally {
      setCargando(false);
    }
  };

  const entrarConGoogle = async () => {
    setMensaje(null);
    setCargando(true);
    reaccionar('pensando', 'Un momento…', 10000); // NUEVO
    try {
      const usuario = await iniciarConGoogle();
      reaccionar('celebrando', '¡Bienvenido!', 2500); // NUEVO
      onLogin?.(usuario);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setMensaje({ texto: err.message || 'No se pudo entrar con Google', tipo: 'error' });
        reaccionar('error', 'No se pudo entrar con Google', 2500); // NUEVO
      } else {
        reaccionar('reposo', '', 100); // NUEVO: cerró la ventana de Google, vuelve a lo normal
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        {/* LADO IZQUIERDO */}
        <aside className="auth__left">
          <div className="auth__circle auth__circle--1" />
          <div className="auth__circle auth__circle--2" />

          <span className="auth__subtitle">APRENDE NÁHUATL</span>
          <h1 className="auth__left-title">Tanextli</h1>
          <p className="auth__left-text">
            ¡Bienvenido a Tanextli!<br />
            Conecta con tu lengua,<br />
            nuestra raíz.
          </p>

          {/* NUEVO: la imagen fija quedó comentada (no borrada)
          <div className="auth__mascota">
            <img src="/mascota.png" alt="Mascota de Tanextli" />
          </div>
          */}

          {/* NUEVO: mascota animada en el lugar de la imagen */}
          <div className="auth__mascota-animada">
            <MascotaAnimada estado={estado} mensaje={mensajeMascota} tamano={320} mirada={mirada} entrada="rebote" />
          </div>
        </aside>

        {/* LADO DERECHO */}
        <main className="auth__right">
          <h2 className="auth__brand">Tanextli</h2>
          <p className="auth__tagline">Aprende náhuatl de forma fácil</p>

          <h3 className="auth__form-title">{esRegistro ? 'Crear cuenta' : 'Inicia sesión'}</h3>

          <form
            onSubmit={enviar}
            className="auth__form"
            onFocus={() => { reaccionar('escuchando', '', 4000); setMirada([4, 1]); }} // NUEVO
            onBlur={() => setMirada(null)} // NUEVO
          >
            {esRegistro && (
              <div className="auth__group">
                <label htmlFor="nombre_usuario">👤 Nombre de usuario</label>
                <input
                  id="nombre_usuario"
                  name="nombre_usuario"
                  type="text"
                  placeholder="Ingresa tu nombre de usuario"
                  value={form.nombre_usuario}
                  onChange={cambiar}
                  required
                />
              </div>
            )}

            <div className="auth__group">
              <label htmlFor="correo">✉️ Correo electrónico</label>
              <input
                id="correo"
                name="correo"
                type="email"
                placeholder="Ingresa tu correo electrónico"
                value={form.correo}
                onChange={cambiar}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth__group">
              <label htmlFor="password">🔒 Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder={esRegistro ? 'Mínimo 6 caracteres' : 'Ingresa tu contraseña'}
                value={form.password}
                onChange={cambiar}
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
                minLength={esRegistro ? 6 : undefined}
                required
              />
            </div>

            {!esRegistro && (
              <div className="auth__forgot">
                <a href="#forgot">¿Olvidaste tu contraseña?</a>
              </div>
            )}

            <button type="submit" className="auth__btn-primary" disabled={cargando}>
              {cargando ? 'Cargando…' : esRegistro ? 'Registrarse' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="auth__divider">
            <span /><i /><span />
          </div>

          <button type="button" onClick={entrarConGoogle} className="auth__btn-google" disabled={cargando}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
            <span>Continuar con Google</span>
          </button>

          <p className="auth__toggle">
            {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button type="button" onClick={alternarModo}>
              {esRegistro ? 'Inicia sesión' : 'Crear cuenta'}
            </button>
          </p>

          {mensaje && (
            <div className={`auth__message auth__message--${mensaje.tipo}`} role="alert">
              {mensaje.texto}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}