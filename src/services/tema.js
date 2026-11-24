// Tema claro / oscuro, igual que en el portal.
// La primera vez se usa el del dispositivo; si la persona lo cambia, se recuerda su elección.
// index.html aplica el tema antes de pintar la página para que no parpadee.
const CLAVE = 'tanextli_tema'
const consulta = () => window.matchMedia?.('(prefers-color-scheme: dark)')

function guardado() {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function temaActual() {
  return document.documentElement.getAttribute('data-tema') === 'oscuro' ? 'oscuro' : 'claro'
}

function aplicar(tema) {
  document.documentElement.setAttribute('data-tema', tema)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'oscuro' ? '#0c1712' : '#1f5c41')
  window.dispatchEvent(new CustomEvent('tanextli:tema', { detail: tema }))
}

export function cambiarTema(tema) {
  try {
    localStorage.setItem(CLAVE, tema)
  } catch {
    // sin almacenamiento: dura mientras la página siga abierta
  }
  aplicar(tema)
}

// Qué eligió la persona: 'claro', 'oscuro' o 'sistema' (sigue al dispositivo)
export function temaElegido() {
  return guardado() || 'sistema'
}

export function elegirTema(opcion) {
  if (opcion === 'sistema') {
    try {
      localStorage.removeItem(CLAVE)
    } catch {
      // sin almacenamiento
    }
    aplicar(consulta()?.matches ? 'oscuro' : 'claro')
    return
  }
  cambiarTema(opcion)
}

export function alternarTema() {
  cambiarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro')
}

// Si la persona nunca eligió, sigue los cambios del dispositivo (por ejemplo, modo noche automático)
export function seguirTemaDelDispositivo() {
  aplicar(guardado() || (consulta()?.matches ? 'oscuro' : 'claro'))
  const mq = consulta()
  if (!mq) return
  const cambio = (e) => { if (!guardado()) aplicar(e.matches ? 'oscuro' : 'claro') }
  mq.addEventListener?.('change', cambio)
}