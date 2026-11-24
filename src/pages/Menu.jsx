import Sidebar from '../components/Sidebar'
import CategoriaCard from '../components/CategoriaCard'
import { IconCampana } from '../components/Icons'
import Mascota from '../components/Mascota'
import { categorias } from '../data/categorias'
import { cantidadCompletadas } from '../services/progreso'
import { obtenerNombreSaludo } from '../services/preferencias'
import { useLobita } from '../services/useLobita' // NUEVO
import '../styles/menu.css'

// Orden en que aparecen las categorías
const ORDEN = ['colores', 'numeros', 'familia', 'frases']

function Menu({ usuario }) {
  // El apodo de Configuración, o su primer nombre
  const nombreUsuario = obtenerNombreSaludo(usuario)

  // NUEVO: Lobita pregunta "¿Qué te gustaría aprender hoy?" y lo muestra en un globo
  const textoLobita = useLobita('menu', { unaVez: true, esperar: true })

  // Las tarjetas salen de data/categorias.js con el progreso real del usuario
  const tarjetas = ORDEN.map((id) => [id, categorias[id]]).map(([id, cat]) => ({
    id,
    titulo: cat.titulo,
    descripcion: cat.descripcion,
    icono: cat.icono,
    color: cat.color,
    completadas: Math.min(cantidadCompletadas(id), cat.lecciones.length),
    total: cat.lecciones.length,
    ruta: `/categoria/${id}`,
  }))

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido">
        <div className="menu-topbar">
          <button className="icono-boton" aria-label="Notificaciones"><IconCampana /></button>
        </div>

        <section className="bienvenida-card">
          <div>
            <h2>🍃 ¡Hola, {nombreUsuario}! 🍃</h2>
            <p>Tu esfuerzo hoy, te acerca a grandes logros. Sigue aprendiendo náhuatl.</p>
          </div>
          <div className="bienvenida-mascota">
            <Mascota rutina="menu" tamano="pequeno" entrada="asomar" mensaje={textoLobita} flotar />
          </div>
        </section>

        <h3 className="menu-subtitulo">Selecciona una categoría para comenzar</h3>

        <div className="categorias-grid">
          {tarjetas.map(({ id, ...cat }) => (
            <CategoriaCard key={id} {...cat} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default Menu