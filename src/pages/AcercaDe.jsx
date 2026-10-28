import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota' // NUEVO
import { IconAltavoz, IconMicrofono, IconDocumento, IconLapiz } from '../components/Icons'
import '../styles/acercaDe.css'

// ====== EDITA AQUÍ LOS DATOS ANTES DE PRESENTAR ======
const VERSION = '0.1 (en desarrollo)'

const equipo = [
  { nombre: 'Daniela Alvarado Isidro', rol: 'Líder de proyecto · Análisis y programación' },
  { nombre: 'Karla Jazmín Calderón Hernández', rol: 'Diseño y programación' },
  { nombre: 'Oliver Macias Fernández', rol: 'Programación' },
  { nombre: 'Roberto Carlos Rojas Valadez', rol: 'Análisis y programación' },
  { nombre: 'Edgar Baez Santamaria', rol: 'Análisis y programación' },
]

const creditos = [
  { titulo: 'Variante del náhuatl', texto: 'Náhuatl de Puebla (variante por confirmar)' },
  { titulo: 'Palabras y traducciones', texto: '[Pendiente: persona o fuente que las proporcionó o revisó]' },
  { titulo: 'Audios de pronunciación', texto: '[Pendiente: quién los grabó]' },
]

const fuentes = [
  {
    texto: 'Instituto Nacional de Estadística y Geografía. (2020). Censo de Población y Vivienda 2020.',
    url: 'https://www.inegi.org.mx/programas/ccpv/2020/',
  },
  {
    texto: 'Instituto Nacional de Lenguas Indígenas. (s.f.). Lenguas en riesgo.',
    url: 'https://site.inali.gob.mx/Micrositios/DILM2019/lenguas_riesgo.html',
  },
]

const funciones = [
  { Icono: IconAltavoz, titulo: 'Escucha', texto: 'Oye cada palabra en náhuatl' },
  { Icono: IconMicrofono, titulo: 'Repite', texto: 'Practica tu pronunciación' },
  { Icono: IconDocumento, titulo: 'Elige', texto: 'Actividades de opción múltiple' },
  { Icono: IconLapiz, titulo: 'Escribe', texto: 'Pon a prueba lo que aprendiste' },
]

function AcercaDe() {
  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido">
        <div className="acerca-contenedor">

          <section className="acerca-hero">
            <span className="acerca-blob acerca-blob-1"></span>
            <span className="acerca-blob acerca-blob-2"></span>
            <div className="acerca-hero-texto">
              <p className="acerca-eyebrow">APRENDE NÁHUATL</p>
              <h1>Tanextli</h1>
              <p className="acerca-lema">Conecta con tu lengua, nuestra raíz.</p>
            </div>
            {/* NUEVO: la imagen fija quedó comentada (no borrada) */}
            {/* <img src="/mascota.png" alt="Mascota de Tanextli" className="acerca-mascota" /> */}
            <div className="acerca-mascota">
              <Mascota rutina="acerca" tamano="pequeno" entrada="zoom" />
            </div>
          </section>

          <section className="acerca-tarjeta">
            <h2>¿Qué es Tanextli?</h2>
            <p>
              Tanextli es una aplicación web gamificada para aprender y preservar el náhuatl.
              Con lecciones por categorías, audios de pronunciación, práctica con el micrófono
              y actividades interactivas, acompaña al usuario paso a paso en su aprendizaje.
            </p>
            <div className="acerca-funciones">
              {funciones.map(({ Icono, titulo, texto }) => (
                <div key={titulo} className="acerca-funcion">
                  <Icono />
                  <p className="acerca-funcion-titulo">{titulo}</p>
                  <p className="acerca-funcion-texto">{texto}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="acerca-tarjeta">
            <h2>¿Por qué el náhuatl?</h2>
            <div className="acerca-dato">
              <div className="acerca-stat">
                <span className="acerca-stat-numero">1,651,958</span>
                <span className="acerca-stat-texto">hablantes de náhuatl en México (INEGI, 2020)</span>
              </div>
              <p>
                Es la lengua indígena con más hablantes del país. Aun así, enfrenta un proceso
                de desplazamiento entre las nuevas generaciones. Tanextli nace para acercar la
                lengua a quienes quieren aprenderla y contribuir a su preservación cultural.
              </p>
            </div>
          </section>

          <section className="acerca-tarjeta">
            <h2>Equipo de desarrollo</h2>
            <div className="acerca-equipo">
              {equipo.map((persona, i) => (
                <div key={persona.nombre} className="acerca-persona">
                  <span className={`acerca-avatar acerca-avatar-${i % 4}`}>
                    {persona.nombre.charAt(0)}
                  </span>
                  <div>
                    <p className="acerca-persona-nombre">{persona.nombre}</p>
                    <p className="acerca-persona-rol">{persona.rol}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="acerca-nota">
              Proyecto integrador de Ingeniería en Sistemas Computacionales, Programación Web
              Avanzada. Instituto Tecnológico Superior de Libres, 2026.
            </p>
          </section>

          <section className="acerca-tarjeta">
            <h2>Créditos del contenido</h2>
            <div className="acerca-creditos">
              {creditos.map((c) => (
                <div key={c.titulo} className="acerca-credito">
                  <p className="acerca-credito-titulo">{c.titulo}</p>
                  <p className="acerca-credito-texto">{c.texto}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="acerca-tarjeta">
            <h2>Fuentes</h2>
            <ul className="acerca-fuentes">
              {fuentes.map((f) => (
                <li key={f.url}>
                  {f.texto}
                  <a className="acerca-enlace" href={f.url} target="_blank" rel="noreferrer">
                    Ver fuente
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="acerca-version">🍃 Tanextli · Versión {VERSION}</p>
        </div>
      </main>
    </div>
  )
}

export default AcercaDe