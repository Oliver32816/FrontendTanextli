// Controla si al usuario ya se le mostró la bienvenida (primer inicio de sesión).
// Por ahora se guarda en el navegador (localStorage). Cuando el backend tenga la marca
// "onboardingCompletado" en el usuario, solo hay que cambiar estas dos funciones.

const PREFIJO = 'tanextli_onboarding_'

function clave(usuario) {
  return PREFIJO + (usuario?.id || usuario?.correo || 'anonimo')
}

export function onboardingPendiente(usuario) {
  try {
    return localStorage.getItem(clave(usuario)) !== 'listo'
  } catch {
    return false // si el navegador bloquea el almacenamiento, no estorbamos al usuario
  }
}

export function marcarOnboardingCompletado(usuario) {
  try {
    localStorage.setItem(clave(usuario), 'listo')
  } catch {
    // sin almacenamiento: la bienvenida simplemente se volverá a mostrar
  }
}