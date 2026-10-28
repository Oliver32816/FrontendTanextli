import { NavLink } from 'react-router-dom'
import { cerrarSesion } from '../services/authService'
import {
  IconInicio, IconFamilia, IconColores, IconFrases,
  IconNumeros, IconPerfil, IconConfiguracion, IconSalir, IconInfo,
} from './Icons'

function Sidebar() {
  // Borra la sesión y recarga la app en "/" para que aparezca el login
  const salir = async () => {
    await cerrarSesion()
    window.location.replace('/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">🍃 Tanextli</div>

      <nav className="sidebar-nav">
        <NavLink to="/menu" end className="sidebar-link">
          <IconInicio /> Inicio
        </NavLink>
        <NavLink to="/categoria/familia" className="sidebar-link">
          <IconFamilia /> Familia
        </NavLink>
        <NavLink to="/categoria/colores" className="sidebar-link">
          <IconColores /> Colores
        </NavLink>
        <NavLink to="/categoria/frases" className="sidebar-link">
          <IconFrases /> Frases
        </NavLink>
        <NavLink to="/categoria/numeros" className="sidebar-link">
          <IconNumeros /> Números
        </NavLink>
      </nav>

      <div className="sidebar-nav sidebar-nav-abajo">
        <NavLink to="/perfil" className="sidebar-link">
          <IconPerfil /> Perfil
        </NavLink>
        <NavLink to="/configuracion" className="sidebar-link">
          <IconConfiguracion /> Configuración
        </NavLink>
        <NavLink to="/acerca-de" className="sidebar-link">
          <IconInfo /> Acerca de
        </NavLink>
        <button type="button" className="sidebar-link sidebar-salir" onClick={salir}>
          <IconSalir /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar