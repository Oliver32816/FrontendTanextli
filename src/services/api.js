// Conexión con el backend de Tanextli. Todas las peticiones pasan por aquí:
// agrega el token de la sesión y convierte las respuestas de error en mensajes claros.
export const API_URL = (import.meta.env.VITE_API_URL || 'https://olo.tail0de9ec.ts.net/api').replace(/\/$/, '')

export const TOKEN_KEY = 'tanextli_token'

export function obtenerToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

// Avisa a la app que la sesión venció (App.jsx regresa al login)
export const EVENTO_SESION_VENCIDA = 'tanextli:sesion-vencida'

// Rutas donde un 401 significa "dato incorrecto" y no "sesión vencida"
const RESPUESTA_401_NO_CIERRA = ['/login', '/perfil/password']

export async function pedir(endpoint, { method = 'GET', body, conToken = true } = {}) {
  const token = conToken ? obtenerToken() : null
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    const error = new Error('No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.')
    error.sinConexion = true
    throw error
  }

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || datos.error || 'Ocurrió un error, intenta de nuevo.')
    error.status = respuesta.status
    error.errores = datos.errores
    // Token vencido o inválido en una petición que lo usaba
    // (cambiar la contraseña con la actual equivocada también responde 401, pero la sesión sigue bien)
    if (respuesta.status === 401 && token && !RESPUESTA_401_NO_CIERRA.includes(endpoint)) {
      window.dispatchEvent(new Event(EVENTO_SESION_VENCIDA))
    }
    throw error
  }
  return datos
}