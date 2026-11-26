// Audios en náhuatl servidos por el SERVIDOR (portal oficial), no por el frontend.
// Las lecciones guardan rutas como "/audios/familia/familia-principal/padre.m4a" y el backend
// publica esa misma carpeta en https://olo.tail0de9ec.ts.net/audios/… (ver media.routes.js).
// Aquí solo se le antepone la dirección del servidor.
//
// Dirección del servidor de audios:
//   VITE_MEDIA_URL (si se define) o, si no, la misma dirección del backend (VITE_API_URL sin /api).
import { API_URL } from './api'

function origenDelBackend() {
  try {
    return new URL(API_URL, window.location.origin).origin
  } catch {
    return 'https://olo.tail0de9ec.ts.net'
  }
}

export const MEDIA_URL = (import.meta.env.VITE_MEDIA_URL || origenDelBackend()).replace(/\/$/, '')

// "/audios/numeros/del-1-5/1.m4a" -> "https://olo.tail0de9ec.ts.net/audios/numeros/del-1-5/1.m4a"
export function urlAudio(ruta) {
  if (!ruta) return ruta
  if (/^(https?:|blob:|data:)/.test(ruta)) return ruta // ya es una dirección completa
  return `${MEDIA_URL}${encodeURI(ruta.startsWith('/') ? ruta : `/${ruta}`)}`
}
