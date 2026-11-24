// Aviso de privacidad y términos de uso. Se ven sin iniciar sesión porque Google los pide
// públicos para publicar "Continuar con Google".
import { Link, useLocation } from 'react-router-dom'
import '../styles/legal.css'

// Correo al que las personas escriben para dudas o para pedir que se borre su cuenta
export const CORREO_CONTACTO = import.meta.env.VITE_CORREO_CONTACTO || 'CORREO_DEL_PROYECTO@gmail.com'
const ACTUALIZADO = '23 de noviembre de 2026'

function Pagina({ titulo, etiqueta, children }) {
  const { pathname } = useLocation()
  const actual = (ruta) => (pathname === ruta ? 'page' : undefined)
  return (
    <div className="legal">
      <div className="tx-fondo-decorativo" aria-hidden="true"><span /><span /><span /></div>
      <header className="legal-cabecera">
        <div className="legal-cabecera-interior">
          <Link to="/" className="tx-marca">
            <img src="/logo.svg" alt="" width="38" height="38" />
            <span className="legal-marca-texto">Tanextli<small>Aprende náhuatl</small></span>
          </Link>
          <nav className="legal-nav">
            <Link to="/privacidad" aria-current={actual('/privacidad')}>Privacidad</Link>
            <Link to="/terminos" aria-current={actual('/terminos')}>Términos</Link>
          </nav>
        </div>
      </header>
      <section className="legal-hero">
        <span className="tx-insignia tx-aparecer">{etiqueta}</span>
        <h1 className="tx-aparecer tx-retraso-1">{titulo}</h1>
        <p className="legal-fecha tx-aparecer tx-retraso-2">Última actualización: {ACTUALIZADO}</p>
      </section>
      <main className="legal-contenido tx-tarjeta tx-aparecer tx-retraso-3">
        {children}
        <p className="legal-volver"><Link to="/">← Volver a Tanextli</Link></p>
      </main>
    </div>
  )
}
export function Privacidad() {
  return (
        <Pagina titulo={<>Aviso de <span className="tx-degradado">privacidad</span></>} etiqueta="Tus datos, cuidados">
      <p>
        Tanextli es una aplicación educativa para aprender náhuatl, desarrollada como proyecto de servicio social.
        Este aviso explica qué datos guardamos, para qué los usamos y cómo puedes pedir que se borren.
      </p>

      <h2>Datos que guardamos</h2>
      <ul>
        <li><strong>Datos de tu cuenta:</strong> nombre de usuario y correo electrónico.</li>
        <li>
          <strong>Si entras con Google:</strong> tu nombre, correo y foto de perfil de Google, y un identificador de tu
          cuenta de Google. No recibimos ni guardamos tu contraseña de Google.
        </li>
        <li><strong>Si creas una contraseña:</strong> se guarda cifrada; nadie del equipo puede verla.</li>
        <li><strong>Tu avance:</strong> lecciones completadas, resultados de las actividades y la fecha de tu último acceso.</li>
        <li>
          <strong>Ajustes en tu dispositivo:</strong> tu apodo y preferencias (letra grande, animaciones, voz) se guardan
          solo en tu navegador.
        </li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Identificarte e iniciar tu sesión.</li>
        <li>Guardar tu progreso para que sea el mismo en la web y en el celular.</li>
        <li>Mejorar las lecciones con estadísticas generales de uso.</li>
      </ul>
      <p>
        Las grabaciones de tu voz en la actividad «Escucha y repite» se usan solo en tu dispositivo durante la lección;
        no se envían ni se guardan en nuestro servidor.
      </p>

      <h2>Con quién los compartimos</h2>
      <p>
        <strong>Con nadie.</strong> No vendemos, rentamos ni compartimos tus datos con terceros, ni los usamos para
        publicidad. Solo el equipo de Tanextli puede consultarlos, desde una red privada protegida.
      </p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>Mientras tu cuenta exista. Si la borras, se eliminan tu cuenta y todo tu progreso.</p>

      <h2>Tus derechos</h2>
      <p>
        Puedes pedir ver, corregir o borrar tus datos, o eliminar tu cuenta, escribiendo
        a <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>. También puedes reiniciar tu progreso
        en cualquier momento desde Configuración.
      </p>

      <h2>Menores de edad</h2>
      <p>
        Tanextli puede ser usada por niñas y niños con el acompañamiento de su madre, padre, tutor o maestro, quienes
        pueden pedir en cualquier momento la consulta o el borrado de la cuenta.
      </p>

      <h2>Cambios a este aviso</h2>
      <p>Si cambiamos este aviso, publicaremos aquí la nueva versión con su fecha.</p>
    </Pagina>
  )
}

export function Terminos() {
  return (
        <Pagina titulo={<>Términos de <span className="tx-degradado">uso</span></>} etiqueta="Reglas claras">
      <p>Al usar Tanextli aceptas estos términos. Si no estás de acuerdo, por favor no uses la aplicación.</p>

      <h2>Qué es Tanextli</h2>
      <p>
        Una aplicación gratuita y educativa para aprender náhuatl, creada como proyecto de servicio social. Las
        palabras y los audios fueron grabados por un hablante de la lengua.
      </p>

      <h2>Tu cuenta</h2>
      <ul>
        <li>Usa datos verdaderos y cuida tu contraseña.</li>
        <li>Cada cuenta es personal.</li>
        <li>Podemos suspender cuentas que se usen para dañar la aplicación o a otras personas.</li>
      </ul>

      <h2>El contenido</h2>
      <p>
        Las lecciones, los audios y las imágenes son del proyecto Tanextli y de sus colaboradores. Puedes usarlos para
        aprender; no los copies ni los vendas sin permiso.
      </p>

      <h2>Disponibilidad</h2>
      <p>
        Hacemos lo posible por que la aplicación funcione siempre, pero puede haber interrupciones o cambios. Tanextli
        se ofrece «tal cual», sin garantías.
      </p>

      <h2>Privacidad</h2>
      <p>El uso de tus datos se explica en el <Link to="/privacidad">aviso de privacidad</Link>.</p>

      <h2>Contacto</h2>
      <p>Para cualquier duda escribe a <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>.</p>
    </Pagina>
  )
}