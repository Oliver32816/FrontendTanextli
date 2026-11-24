// Aviso de privacidad y términos de uso (mismo diseño que el portal).
// Son públicas, sin iniciar sesión: Google las pide así para publicar "Continuar con Google".
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BotonTema from '../components/BotonTema'
import '../styles/legal.css'

export const CORREO_CONTACTO = import.meta.env.VITE_CORREO_CONTACTO || 'tanextlpro7a@gmail.com'

const IconInicio = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11 12 4l9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
)
const IconEscudo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3z" /><path d="m9 12 2 2 4-4" />
  </svg>
)
const IconDocumento = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
)

// Resalta en el índice la sección que se está leyendo
function useSeccionActiva(ids) {
  const [activa, setActiva] = useState(ids[0])
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => e.isIntersecting && setActiva(e.target.id))
    }, { rootMargin: '-30% 0px -60% 0px' })
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observador.observe(el) })
    return () => observador.disconnect()
  }, [ids])
  return activa
}

function Pagina({ insignia, titulo, lead, secciones, children }) {
  const { pathname } = useLocation()
  const ids = secciones.map((s) => s.id)
  const activa = useSeccionActiva(ids)
  const actual = (ruta) => (pathname === ruta ? 'page' : undefined)

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const irA = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
            <Link to="/"><IconInicio /><span>Inicio</span></Link>
            <Link to="/privacidad" aria-current={actual('/privacidad')}><IconEscudo /><span>Privacidad</span></Link>
            <Link to="/terminos" aria-current={actual('/terminos')}><IconDocumento /><span>Términos</span></Link>
          </nav>
          <BotonTema />
        </div>
      </header>

      <section className="legal-hero">
        <span className="tx-insignia tx-aparecer">{insignia}</span>
        <h1 className="tx-aparecer tx-retraso-1">{titulo}</h1>
        <p className="legal-lead tx-aparecer tx-retraso-2">{lead}</p>
      </section>

      <div className="legal-documento">
        <nav className="legal-indice tx-aparecer tx-retraso-2" aria-label="Contenido">
          {secciones.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => irA(e, s.id)} className={activa === s.id ? 'activo' : ''}>
              {i + 1}. {s.titulo}
            </a>
          ))}
        </nav>
        <article className="legal-prosa tx-tarjeta tx-aparecer tx-retraso-3">{children}</article>
      </div>
    </div>
  )
}

const SECCIONES_PRIVACIDAD = [
  { id: 'responsable', titulo: 'Responsable' },
  { id: 'datos', titulo: 'Datos que recabamos' },
  { id: 'finalidades', titulo: 'Para qué los usamos' },
  { id: 'menores', titulo: 'Niñas, niños y adolescentes' },
  { id: 'terceros', titulo: 'Terceros y transferencias' },
  { id: 'arco', titulo: 'Derechos ARCO' },
  { id: 'seguridad', titulo: 'Seguridad' },
  { id: 'conservacion', titulo: 'Conservación' },
  { id: 'almacenamiento', titulo: 'Almacenamiento en el dispositivo' },
  { id: 'cambios', titulo: 'Cambios al aviso' },
]

export function Privacidad() {
  return (
    <Pagina
      insignia="Aviso de privacidad integral"
      titulo={<>Tu privacidad <span className="tx-degradado">es primero</span></>}
      lead={<>Explicamos con palabras claras qué datos usa Tanextli, para qué y cómo los cuidamos. Última actualización: <time dateTime="2026-11-22">22 de noviembre de 2026</time>.</>}
      secciones={SECCIONES_PRIVACIDAD}
    >
      <p className="legal-nota"><strong>Borrador para revisión.</strong> Este texto debe revisarlo el equipo junto con la institución responsable del servicio social antes de publicarse como versión definitiva. Los datos entre corchetes deben completarse.</p>

      <h2 id="responsable">1. Responsable</h2>
      <p><strong>El equipo de desarrollo de Tanextli</strong>, a través de esta App web, con domicilio en <strong>Camino Real s/n, Barrio de Tetela, C.P. 73780, Libres, Puebla</strong>, es responsable del tratamiento de los datos personales que nos proporciones, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y demás normativa aplicable.</p>
      <p>Contacto de privacidad: <a href={`mailto:${CORREO_CONTACTO}`}><strong>{CORREO_CONTACTO}</strong></a>.</p>

      <h2 id="datos">2. Datos que recabamos</h2>
      <ul>
        <li><strong>Cuenta:</strong> nombre de usuario, correo electrónico y contraseña (la contraseña se guarda cifrada con un algoritmo de un solo sentido; nadie puede verla).</li>
        <li><strong>Aprendizaje:</strong> lecciones completadas, palabras practicadas, puntajes y fechas de práctica.</li>
        <li><strong>Práctica de pronunciación (próximamente):</strong> el texto que el reconocedor de voz de tu dispositivo entendió y qué tan parecido fue a la palabra correcta. <strong>No guardamos grabaciones de voz.</strong></li>
        <li><strong>Técnicos:</strong> registros del servidor (fecha, hora y dirección IP) necesarios para la seguridad y el funcionamiento del servicio.</li>
      </ul>
      <p>No solicitamos datos sensibles, de ubicación precisa, ni información financiera.</p>

      <h2 id="finalidades">3. Para qué los usamos</h2>
      <p><strong>Finalidades necesarias:</strong></p>
      <ul>
        <li>Crear y proteger tu cuenta, e iniciar sesión.</li>
        <li>Guardar tu avance para que continúes donde te quedaste en la web o en el celular.</li>
        <li>Evaluar la pronunciación y darte retroalimentación.</li>
      </ul>
      <p><strong>Finalidades adicionales</strong> (puedes oponerte escribiendo al contacto de privacidad, sin que afecte tu acceso):</p>
      <ul>
        <li>Generar estadísticas <strong>agregadas y anónimas</strong> para mejorar las lecciones, por ejemplo, saber qué palabras cuestan más trabajo.</li>
      </ul>

      <h2 id="menores">4. Niñas, niños y adolescentes</h2>
      <p>Tanextli está pensado para el aprendizaje de personas de todas las edades, incluidas niñas y niños. Cuando la persona usuaria sea menor de edad, <strong>su madre, padre o tutor debe otorgar el consentimiento</strong> para crear la cuenta y para el tratamiento de sus datos. Recabamos solo los datos mínimos necesarios y nunca los usamos con fines publicitarios.</p>

      <h2 id="terceros">5. Terceros y transferencias</h2>
      <ul>
        <li><strong>No vendemos ni rentamos datos personales.</strong></li>
        <li>El reconocimiento de voz lo realiza el sistema de tu dispositivo (Google en Android, Apple en iOS), conforme a sus propias políticas de privacidad. Tanextli solo recibe el texto resultante.</li>
        <li>Si inicias sesión con Google, Google nos comparte tu nombre y correo, según tu autorización.</li>
        <li>Podremos compartir información cuando lo exija una autoridad competente, conforme a la ley.</li>
      </ul>

      <h2 id="arco">6. Derechos ARCO</h2>
      <p>Tienes derecho a <strong>Acceder</strong> a tus datos, <strong>Rectificarlos</strong>, <strong>Cancelarlos</strong> u <strong>Oponerte</strong> a su uso, así como a revocar tu consentimiento. Envía tu solicitud a <a href={`mailto:${CORREO_CONTACTO}`}><strong>{CORREO_CONTACTO}</strong></a> indicando tu nombre, el correo de tu cuenta, el derecho que deseas ejercer y, en su caso, el documento que acredite la representación del menor. Responderemos en un plazo máximo de 20 días hábiles.</p>

      <h2 id="seguridad">7. Seguridad</h2>
      <ul>
        <li>Conexiones cifradas (HTTPS) en todo el servicio.</li>
        <li>Contraseñas cifradas con algoritmos de un solo sentido.</li>
        <li>Base de datos sin acceso desde internet y con usuarios de mínimos privilegios.</li>
        <li>Herramientas de administración disponibles únicamente en una red privada.</li>
        <li>Respaldos periódicos y registros de seguridad.</li>
      </ul>

      <h2 id="conservacion">8. Conservación</h2>
      <p>Conservamos los datos mientras tu cuenta esté activa. Si solicitas la cancelación, eliminaremos o anonimizaremos tus datos, salvo los que debamos conservar por obligación legal.</p>

      <h2 id="almacenamiento">9. Almacenamiento en el dispositivo</h2>
      <p>No usamos cookies de publicidad ni de rastreo. La app puede guardar en tu navegador o dispositivo preferencias como el tema claro u oscuro y tu sesión iniciada.</p>

      <h2 id="cambios">10. Cambios al aviso</h2>
      <p>Cualquier cambio a este aviso se publicará en esta misma página con su fecha de actualización.</p>
    </Pagina>
  )
}

const SECCIONES_TERMINOS = [
  { id: 'que-es', titulo: 'Qué es Tanextli' },
  { id: 'cuenta', titulo: 'Tu cuenta' },
  { id: 'contenido', titulo: 'El contenido' },
  { id: 'disponibilidad', titulo: 'Disponibilidad' },
  { id: 'privacidad', titulo: 'Privacidad' },
  { id: 'contacto', titulo: 'Contacto' },
]

export function Terminos() {
  return (
    <Pagina
      insignia="Términos de uso"
      titulo={<>Reglas <span className="tx-degradado">claras</span></>}
      lead={<>Al usar Tanextli aceptas estos términos. Si no estás de acuerdo, por favor no uses la aplicación. Última actualización: <time dateTime="2026-11-23">23 de noviembre de 2026</time>.</>}
      secciones={SECCIONES_TERMINOS}
    >
      <h2 id="que-es">1. Qué es Tanextli</h2>
      <p>Una aplicación gratuita y educativa para aprender náhuatl, creada como proyecto de servicio social. Las palabras y los audios fueron grabados por un hablante de la lengua.</p>

      <h2 id="cuenta">2. Tu cuenta</h2>
      <ul>
        <li>Usa datos verdaderos y cuida tu contraseña.</li>
        <li>Cada cuenta es personal.</li>
        <li>Podemos suspender cuentas que se usen para dañar la aplicación o a otras personas.</li>
      </ul>

      <h2 id="contenido">3. El contenido</h2>
      <p>Las lecciones, los audios y las imágenes son del proyecto Tanextli y de sus colaboradores. Puedes usarlos para aprender; no los copies ni los vendas sin permiso.</p>

      <h2 id="disponibilidad">4. Disponibilidad</h2>
      <p>Hacemos lo posible por que la aplicación funcione siempre, pero puede haber interrupciones o cambios. Tanextli se ofrece «tal cual», sin garantías.</p>

      <h2 id="privacidad">5. Privacidad</h2>
      <p>El uso de tus datos se explica en el <Link to="/privacidad">aviso de privacidad</Link>.</p>

      <h2 id="contacto">6. Contacto</h2>
      <p>Para cualquier duda escribe a <a href={`mailto:${CORREO_CONTACTO}`}><strong>{CORREO_CONTACTO}</strong></a>.</p>
    </Pagina>
  )
}