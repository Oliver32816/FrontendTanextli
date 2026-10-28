import Sidebar from '../components/Sidebar'
import CategoriaCard from '../components/CategoriaCard'
import {IconCampana } from '../components/Icons'
import Mascota from '../components/Mascota' // NUEVO
import '../styles/menu.css'

const categorias = [
  { titulo: 'Familia', descripcion: 'Aprende los nombres de los miembros de la familia', icono: '👪', color: 'naranja', completadas: 0, total: 15, ruta: '/categoria/familia' },
  { titulo: 'Colores', descripcion: 'Descubre los colores en náhuatl', icono: '🎨', color: 'morado', completadas: 0, total: 15, ruta: '/categoria/colores' },
  { titulo: 'Números', descripcion: 'Aprende a contar en náhuatl', icono: '🔢', color: 'azul', completadas: 0, total: 15, ruta: '/categoria/numeros' },
  { titulo: 'Frases', descripcion: 'Aprende unas frases en náhuatl', icono: '💬', color: 'verde', completadas: 0, total: 15, ruta: '/categoria/frases' },
]

// "EDGAR BÁEZ SANTAMARÍA" -> "Edgar"
function obtenerPrimerNombre(nombreCompleto) {
  const primero = (nombreCompleto || '').trim().split(' ')[0]
  if (!primero) return 'amigo'
  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase()
}

function Menu({ usuario }) {
  const nombreUsuario = obtenerPrimerNombre(usuario?.nombre_usuario)

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido">
        <div className="menu-topbar">
          <button className="icono-boton"><IconCampana /></button>
        </div>

        <section className="bienvenida-card">
          <div>
            <h2>🍃 ¡Hola, {nombreUsuario}! 🍃</h2>
            <p>Tu esfuerzo hoy, te acerca a grandes logros. Sigue aprendiendo náhuatl.</p>
          </div>
          {/* NUEVO: la imagen fija quedó comentada (no borrada) */}
          {/* <img src="/mascota.png" alt="Mascota de Tanextli" className="bienvenida-mascota" /> */}
          <div className="bienvenida-mascota">
            <Mascota rutina="menu" tamano="pequeno" entrada="asomar" />
          </div>
        </section>

        <h3 className="menu-subtitulo">Selecciona una categoría para comenzar</h3>

        <div className="categorias-grid">
          {categorias.map((cat) => (
            <CategoriaCard key={cat.titulo} {...cat} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default Menu