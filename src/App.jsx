import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import AuthScreen from './pages/Auth/AuthScreen'
import CambiarPassword from './pages/Auth/CambiarPassword'
import VerificarCorreo from './pages/Auth/VerificarCorreo'
import { verificarSesion, cerrarSesion } from './services/authService'
import { sincronizarProgreso } from './services/progreso'
import { EVENTO_SESION_VENCIDA } from './services/api'
import { useLatido } from './services/useLatido'
import { Privacidad, Terminos } from './pages/Legal'
import Menu from './pages/Menu'
import CategoriaIntro from './pages/catInfo'
import Categoria from './pages/Categoria'
import AcercaDe from './pages/AcercaDe'
import Cargando from './components/Cargando'
import NoEncontrada from './pages/NoEncontrada'
import Administracion from './pages/Administracion'
import Onboarding from './pages/Onboarding'
import { onboardingPendiente, marcarOnboardingCompletado } from './services/onboarding'
import Leccion from './pages/Leccion'
import Perfil from './pages/Perfil'
import Configuracion from './pages/Configuracion'
// La cámara carga el reconocimiento de objetos solo cuando se abre (no pesa en el resto de la app)
const Camara = lazy(() => import('./pages/Camara'))
import { aplicarPreferencias } from './services/preferencias'
import { seguirTemaDelDispositivo } from './services/tema'
import './styles/preferencias.css'

// Aplica la letra grande / animaciones guardadas desde que abre la app
aplicarPreferencias()
seguirTemaDelDispositivo()
// Páginas que se ven sin iniciar sesión
const PUBLICAS = { '/privacidad': Privacidad, '/terminos': Terminos }

// Cuentas anteriores a la verificación de correo pueden dejarla "para después" (solo esta visita)
const CLAVE_VERIFICAR_DESPUES = 'tanextli_verificar_despues'
function verificacionPospuesta(usuario) {
  try {
    return sessionStorage.getItem(CLAVE_VERIFICAR_DESPUES) === String(usuario.id)
  } catch {
    return false
  }
}
function posponerVerificacion(usuario) {
  try {
    sessionStorage.setItem(CLAVE_VERIFICAR_DESPUES, String(usuario.id))
  } catch {
    // sin almacenamiento: se vuelve a preguntar al recargar
  }
}

function App() {
  const [usuario, setUsuario] = useState(null)
  const [revisando, setRevisando] = useState(true)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [, setBienvenidaVista] = useState(0)
  const [, setVerificacionVista] = useState(0)

  // Con sesión iniciada, avisa cada minuto que la app sigue abierta ("Ahora" en Administración)
  useLatido(Boolean(usuario))

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

  // Correo sin confirmar: cuenta nueva (false) = obligatorio; cuenta anterior (null) = se puede posponer.
  // Si el servidor todavía no envía el dato (undefined), no se pide nada.
  const correoPendiente = usuario.correo_verificado === false
    || (usuario.correo_verificado === null && !verificacionPospuesta(usuario))
  if (correoPendiente) {
    return (
      <VerificarCorreo
        usuario={usuario}
        obligatoria={usuario.correo_verificado === false}
        onListo={setUsuario}
        onOmitir={() => {
          posponerVerificacion(usuario)
          setVerificacionVista((n) => n + 1)
        }}
        onSalir={salir}
      />
    )
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
      <Route path="/camara" element={<Suspense fallback={<Cargando />}><Camara /></Suspense>} />
      {/* Solo administradores y superusuarios; los demás regresan al inicio */}
      <Route
        path="/administracion"
        element={['admin', 'superuser'].includes(usuario.rol) ? <Administracion usuario={usuario} /> : <Navigate to="/menu" replace />}
      />
      <Route path="/bienvenida" element={<Onboarding onTerminar={() => navigate('/menu')} />} />
      {/* Cualquier otra dirección muestra la página de "no encontrada" */}
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}

export default App