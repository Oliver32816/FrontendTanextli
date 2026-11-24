// Barra lateral de la app. En computadora queda fija a la izquierda; en celular y tablet se
// convierte en una barra superior con un menú que se desliza.
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cerrarSesion, obtenerUsuarioGuardado } from '../services/authService'
import {
  IconInicio, IconFamilia, IconColores, IconFrases, IconMenuHamburguesa,
  IconNumeros, IconPerfil, IconConfiguracion, IconSalir, IconInfo,
} from './Icons'

const SECCIONES = [
  { to: '/menu', texto: 'Inicio', Icono: IconInicio, tono: 'verde', end: true },
  { to: '/categoria/colores', texto: 'Colores', Icono: IconColores, tono: 'morado' },
  { to: '/categoria/numeros', texto: 'Números', Icono: IconNumeros, tono: 'azul' },
  { to: '/categoria/familia', texto: 'Familia', Icono: IconFamilia, tono: 'naranja' },
  { to: '/categoria/frases', texto: 'Frases', Icono: IconFrases, tono: 'verde' },
]

const CUENTA = [
  { to: '/perfil', texto: 'Perfil', Icono: IconPerfil },
  { to: '/configuracion', texto: 'Configuración', Icono: IconConfiguracion },
  { to: '/acerca-de', texto: 'Acerca de', Icono: IconInfo },
]

const iniciales = (nombre = '') =>
  nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'T'

function Sidebar() {
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()
  const usuario = obtenerUsuarioGuardado()

  // Al cambiar de página se cierra el menú del celular
  useEffect(() => { setAbierto(false) }, [pathname])

  // Con el menú abierto, la tecla Esc lo cierra
  useEffect(() => {
    if (!abierto) return undefined
    const tecla = (e) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [abierto])

  // Borra la sesión y recarga la app en "/" para que aparezca el login
  const salir = async () => {
    await cerrarSesion()
    window.location.replace('/')
  }

  const enlace = ({ to, texto, Icono, tono, end }, i) => (
    <NavLink key={to} to={to} end={end} className={`sidebar-link ${tono ? `sidebar-tono-${tono}` : ''}`}
      style={{ '--i': i }}>
      <span className="sidebar-link-icono"><Icono /></span>
      <span>{texto}</span>
    </NavLink>
  )

  return (
    <>
      {/* Barra superior (solo celular y tablet) */}
      <header className="sidebar-movil">
        <NavLink to="/menu" className="sidebar-marca">
          <img src="/logo.svg" alt="" width="34" height="34" />
          <span>Tanextli</span>
        </NavLink>
        <button type="button" className="sidebar-abrir" onClick={() => setAbierto(true)}
          aria-label="Abrir menú" aria-expanded={abierto} aria-controls="sidebar">
          <IconMenuHamburguesa />
        </button>
      </header>

      <div className={`sidebar-velo ${abierto ? 'visible' : ''}`} onClick={() => setAbierto(false)} aria-hidden="true" />

      <aside id="sidebar" className={`sidebar ${abierto ? 'abierto' : ''}`}>
        <NavLink to="/menu" className="sidebar-marca sidebar-marca-grande">
          <img src="/logo.svg" alt="" width="40" height="40" />
          <span>Tanextli<small>Aprende náhuatl</small></span>
        </NavLink>

        <p className="sidebar-titulo">Aprender</p>
        <nav className="sidebar-nav" aria-label="Categorías">
          {SECCIONES.map(enlace)}
        </nav>

        <div className="sidebar-abajo">
          <p className="sidebar-titulo">Mi cuenta</p>
          <nav className="sidebar-nav" aria-label="Cuenta">
            {CUENTA.map((e, i) => enlace(e, i + SECCIONES.length))}
          </nav>

          <div className="sidebar-usuario">
            {usuario?.foto_url
              ? <img className="sidebar-avatar" src={usuario.foto_url} alt="" referrerPolicy="no-referrer" />
              : <span className="sidebar-avatar">{iniciales(usuario?.nombre_usuario)}</span>}
            <div className="sidebar-usuario-texto">
              <strong>{usuario?.nombre_usuario || 'Estudiante'}</strong>
              <small>{usuario?.correo}</small>
            </div>
            <button type="button" className="sidebar-salir" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
              <IconSalir />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar