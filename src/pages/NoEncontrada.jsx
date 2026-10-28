import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota' // NUEVO
import '../styles/noEncontrada.css'

function NoEncontrada() {
  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido">
        <div className="nf-contenedor">
          <div className="nf-tarjeta">
            {/* NUEVO: la imagen fija quedó comentada (no borrada) */}
            {/* <img src="/mascota.png" alt="Mascota de Tanextli" className="nf-mascota" /> */}
            <div className="nf-mascota">
              <Mascota rutina="noEncontrada" tamano="grande" entrada="rebote" />
            </div>
            <p className="nf-codigo">404</p>
            <h1>Esta página no existe</h1>
            <p className="nf-texto">
              Parece que el camino que buscas no está aquí. Puede que la dirección esté
              mal escrita o que la página se haya movido.
            </p>
            <Link to="/menu" className="nf-boton">Volver al inicio</Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NoEncontrada