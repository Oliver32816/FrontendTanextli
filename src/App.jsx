import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import AuthScreen from './pages/Auth/AuthScreen'
import CambiarPassword from './pages/Auth/CambiarPassword'
import { verificarSesion, cerrarSesion } from './services/authService'
import { sincronizarProgreso } from './services/progreso'
import { EVENTO_SESION_VENCIDA } from './services/api'
import { Privacidad, Terminos } from './pages/Legal'
import Menu from './pages/Menu'
import CategoriaIntro from './pages/catInfo'
import Categoria from './pages/Categoria'
import AcercaDe from './pages/AcercaDe'
import Cargando from './components/Cargando'
import NoEncontrada from './pages/NoEncontrada'
import Onboarding from './pages/Onboarding'
import { onboardingPendiente, marcarOnboardingCompletado } from './services/onboarding'
import Leccion from './pages/Leccion'
import Perfil from './pages/Perfil'
import Configuracion from './pages/Configuracion'
import { aplicarPreferencias } from './services/preferencias'
import './styles/preferencias.css'

// Aplica la letra grande / animaciones guardadas desde que abre la app
aplicarPreferencias()

// Páginas que se ven sin iniciar sesión
const PUBLICAS = { '/privacidad': Privacidad, '/terminos': Terminos }

function App() {
  const [usuario, setUsuario] = useState(null)
  const [revisando, setRevisando] = useState(true)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [, setBienvenidaVista] = useState(0)

  // Al abrir la app: revisa la sesión guardada y trae el progreso del servidor
  useEffect(() => {
    let activo = true
    verificarSesion()
      .then(async (u) => {
        if (u) await sincronizarProgreso()
        if (activo) setUsuario(u)
      })
      .finally(() => activo && setRevisando(false))
    return () => { activo = false }
  }, [])

  // Si el servidor rechaza el token (venció a los 7 días), regresa al login
  useEffect(() => {
    const vencida = () => {
      cerrarSesion()
      setUsuario(null)
    }
    window.addEventListener(EVENTO_SESION_VENCIDA, vencida)
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, vencida)
  }, [])

  // Después de iniciar sesión (correo o Google): primero el progreso, luego la app
  const entrar = async (u) => {
    setRevisando(true)
    await sincronizarProgreso()
    setUsuario(u)
    setRevisando(false)
  }

  const salir = async () => {
    await cerrarSesion()
    setUsuario(null)
    navigate('/', { replace: true })
  }

  const Publica = PUBLICAS[pathname]
  if (Publica) return <Publica />

  if (revisando) return <Cargando />

  // Sin sesión: cualquier ruta (/menu, /categoria/...) muestra el login
  if (!usuario) return <AuthScreen onLogin={entrar} />

  // Entró con una contraseña temporal: debe elegir una nueva
  if (usuario.debe_cambiar_password) {
    return <CambiarPassword usuario={usuario} onListo={setUsuario} onSalir={salir} />
  }

  if (onboardingPendiente(usuario)) {
    return (
      <Onboarding
        onTerminar={() => {
          marcarOnboardingCompletado(usuario)
          setBienvenidaVista((n) => n + 1)
        }}
      />
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/menu" replace />} />
      <Route path="/menu" element={<Menu usuario={usuario} />} />
      <Route path="/categoria/:id" element={<CategoriaIntro />} />
      <Route path="/categoria/:id/lecciones" element={<Categoria />} />
      <Route path="/categoria/:id/leccion/:leccionId" element={<Leccion />} />
      <Route path="/perfil" element={<Perfil usuario={usuario} />} />
      <Route path="/configuracion" element={<Configuracion usuario={usuario} />} />
      <Route path="/acerca-de" element={<AcercaDe />} />
      <Route path="/bienvenida" element={<Onboarding onTerminar={() => navigate('/menu')} />} />
      {/* Cualquier otra dirección muestra la página de "no encontrada" */}
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}

export default App