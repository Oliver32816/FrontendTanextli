// Barra lateral de la app. En computadora queda fija a la izquierda; en celular y tablet se
// convierte en una barra superior con un menú que se desliza.
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cerrarSesion, obtenerUsuarioGuardado } from '../services/authService'
import BotonTema from './BotonTema'
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

// Escudo para el enlace de privacidad
function IconEscudo() {
  return (
    <svg className="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

// Portal oficial de Tanextli (se abre en otra pestaña). Se puede cambiar con VITE_PORTAL_URL en el .env
export const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://olo.tail0de9ec.ts.net/portal/'

// Panel de administración completo (solo superusuarios). Se usa la dirección pública: dentro de
// la red de Tailscale el servidor la manda al panel; fuera de ella muestra "No tienes acceso".
export const PANEL_ADMIN_URL = import.meta.env.VITE_PANEL_ADMIN_URL || 'https://olo.tail0de9ec.ts.net/admin/usuarios/'

// Escudo con estrella para administración
function IconAdmin() {
  return (
    <svg className="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3z" />
      <path d="m12 8 1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 14l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" />
    </svg>
  )
}

const CUENTA = [
  { to: '/perfil', texto: 'Perfil', Icono: IconPerfil },
  { to: '/configuracion', texto: 'Configuración', Icono: IconConfiguracion },
  { to: '/acerca-de', texto: 'Acerca de', Icono: IconInfo },
  { to: '/privacidad', texto: 'Privacidad', Icono: IconEscudo },
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
        <div className="sidebar-movil-acciones">
          <BotonTema />
          <button type="button" className="sidebar-abrir" onClick={() => setAbierto(true)}
            aria-label="Abrir menú" aria-expanded={abierto} aria-controls="sidebar">
            <IconMenuHamburguesa />
          </button>
        </div>
      </header>

      <div className={`sidebar-velo ${abierto ? 'visible' : ''}`} onClick={() => setAbierto(false)} aria-hidden="true" />

      <aside id="sidebar" className={`sidebar ${abierto ? 'abierto' : ''}`}>
        <div className="sidebar-cabecera">
          <NavLink to="/menu" className="sidebar-marca">
            <img src="/logo.svg" alt="" width="40" height="40" />
            <span>Tanextli<small>Aprende náhuatl</small></span>
          </NavLink>
          <BotonTema className="sidebar-tema" />
        </div>

        <p className="sidebar-titulo">Aprender</p>
        <nav className="sidebar-nav" aria-label="Categorías">
          {SECCIONES.map(enlace)}
        </nav>

        <a className="sidebar-portal" href={PORTAL_URL} target="_blank" rel="noreferrer">
          <span className="sidebar-portal-icono" aria-hidden="true">🌐</span>
          <span className="sidebar-portal-texto">
            <strong>Portal oficial</strong>
            <small>Recursos de Tanextli</small>
          </span>
          <span className="sidebar-portal-flecha" aria-hidden="true">↗</span>
        </a>

        <div className="sidebar-abajo">
          <p className="sidebar-titulo">Mi cuenta</p>
          <nav className="sidebar-nav" aria-label="Cuenta">
            {CUENTA.map((e, i) => enlace(e, i + SECCIONES.length))}

            {/* Administradores: vista de usuarios de solo lectura dentro de la app */}
            {usuario?.rol === 'admin' &&
              enlace({ to: '/administracion', texto: 'Administración', Icono: IconAdmin, tono: 'morado' }, SECCIONES.length + CUENTA.length)}

            {/* Superusuarios: panel completo (se abre en otra pestaña) */}
            {usuario?.rol === 'superuser' && (
              <a className="sidebar-link sidebar-tono-morado" href={PANEL_ADMIN_URL} target="_blank" rel="noreferrer"
                style={{ '--i': SECCIONES.length + CUENTA.length }} title="Se abre en otra pestaña (solo dentro de la red de Tailscale)">
                <span className="sidebar-link-icono"><IconAdmin /></span>
                <span>Panel de administración</span>
                <span className="sidebar-externo" aria-hidden="true">↗</span>
              </a>
            )}
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