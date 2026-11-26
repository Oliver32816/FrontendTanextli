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

// ---------- Precarga: que el audio suene AL INSTANTE al tocar el botón ----------
// Cada audio se descarga una sola vez y se reutiliza (el navegador lo deja listo en memoria).
const cache = new Map()

function crear(url) {
  const audio = new Audio(url)
  audio.preload = 'auto'
  cache.set(url, audio)
  return audio
}

// Devuelve el audio listo para reproducir (desde el principio). Reemplaza a `new Audio(ruta)`.
export function audioPara(ruta) {
  const url = urlAudio(ruta)
  const audio = cache.get(url)
  if (!audio) return crear(url)
  audio.pause()
  audio.onended = null
  audio.onerror = null
  try { audio.currentTime = 0 } catch { /* aún no cargaba */ }
  return audio
}

// Empieza a descargar audios en segundo plano (por ejemplo, todos los de una lección al entrar)
export function precargarAudios(rutas = []) {
  ;[...new Set(rutas.filter(Boolean))].forEach((ruta) => {
    const url = urlAudio(ruta)
    if (!cache.has(url)) crear(url).load()
  })
}

// Busca todas las rutas "/audios/…" dentro de unos datos (palabras, frases, combinaciones…)
export function rutasDeAudio(datos, lista = []) {
  if (typeof datos === 'string') {
    if (datos.startsWith('/audios/')) lista.push(datos)
  } else if (Array.isArray(datos)) {
    datos.forEach((d) => rutasDeAudio(d, lista))
  } else if (datos && typeof datos === 'object') {
    Object.values(datos).forEach((d) => rutasDeAudio(d, lista))
  }
  return lista
}
