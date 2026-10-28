import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import AuthScreen from './pages/Auth/AuthScreen'
import { verificarSesion } from './services/authService'
import Menu from './pages/Menu'
import CategoriaIntro from './pages/catInfo'
import Categoria from './pages/Categoria'
import AcercaDe from './pages/acercaDe'
import Cargando from './components/Cargando'
import NoEncontrada from './pages/NoEncontrada'
import Onboarding from './pages/Onboarding'
import { onboardingPendiente, marcarOnboardingCompletado } from './services/onboarding'
import Leccion from './pages/Leccion'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [revisando, setRevisando] = useState(false)
  const navigate = useNavigate()
  const [, setBienvenidaVista] = useState(0)

  // Al abrir la app, revisa si ya había una sesión iniciada
  useEffect(() => {
    verificarSesion().then((u) => {
      setUsuario(u)
      setRevisando(false)
    })
  }, [])

  if (revisando) return <Cargando />

  // Sin sesión: cualquier ruta (/menu, /categoria/...) muestra el login
  if (!usuario) return <AuthScreen onLogin={setUsuario} />
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
      <Route path="/acerca-de" element={<AcercaDe />} />
      <Route path="/bienvenida" element={<Onboarding onTerminar={() => navigate('/menu')} />} />
      <Route path="/categoria/:id/leccion/:leccionId" element={<Leccion />} />
      {/* Rutas que todavía no existen (perfil, configuración...) regresan al menú */}
      <Route path="*" element={<Navigate to="/menu" replace />} />
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}

export default App