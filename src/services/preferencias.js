// Preferencias de la app (Configuración). Se guardan en el navegador.
const CLAVE = 'tanextli_preferencias'

const PREDETERMINADAS = {
  letraGrande: false,
  apodo: '', // cómo quiere que Lobita lo salude; vacío = su primer nombre
}

export function leerPreferencias() {
  try {
    return { ...PREDETERMINADAS, ...JSON.parse(localStorage.getItem(CLAVE)) }
  } catch {
    return { ...PREDETERMINADAS }
  }
}

// Pone o quita la clase en <html> que usa styles/preferencias.css
export function aplicarPreferencias(preferencias = leerPreferencias()) {
  document.documentElement.classList.toggle('pref-letra-grande', preferencias.letraGrande)
}

export function guardarPreferencia(clave, valor) {
  const nuevas = { ...leerPreferencias(), [clave]: valor }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevas))
  } catch {
    // sin almacenamiento: se aplica solo mientras la página esté abierta
  }
  aplicarPreferencias(nuevas)
  return nuevas
}

// Regresa todo a como estaba al principio
export function restablecerPreferencias() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // sin almacenamiento
  }
  aplicarPreferencias(PREDETERMINADAS)
  return { ...PREDETERMINADAS }
}

// Nombre con el que se saluda en el menú:
// el apodo si lo puso, si no su primer nombre ("EDGAR BÁEZ" -> "Edgar")
export function obtenerNombreSaludo(usuario) {
  const apodo = leerPreferencias().apodo.trim()
  if (apodo) return apodo
  const primero = (usuario?.nombre_usuario || '').trim().split(' ')[0]
  if (!primero) return 'amigo'
  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase()
}