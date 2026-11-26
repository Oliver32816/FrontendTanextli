// Traduce lo que ve la cámara usando NUESTRO vocabulario.
// 1) Pide las palabras al servidor (GET /palabras: solo las que ya tienen náhuatl).
// 2) Si no hay conexión, usa las palabras de las lecciones que vienen con la app.
// La búsqueda ignora mayúsculas, acentos y artículos ("La silla" = "silla").
import { pedir } from './api'
import { contenidoLecciones } from '../data/lecciones'
import { OBJETOS_CAMARA } from '../data/objetosCamara'
import { claseEnEspanol } from '../data/clasesImagenet'

export const normalizar = (texto = '') => texto
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/^(el|la|los|las|un|una|mi)\s+/, '')
  .replace(/[¡!¿?.,]/g, '')
  .trim()

let diccionario = null // Map: español normalizado -> { espanol, nahuatl }
let cargando = null

function agregar(mapa, espanol, nahuatl) {
  const clave = normalizar(espanol)
  if (!clave || !nahuatl || mapa.has(clave)) return
  mapa.set(clave, { espanol, nahuatl })
}

function palabrasDeLasLecciones(mapa) {
  Object.values(contenidoLecciones).forEach((categoria) => {
    Object.values(categoria).forEach((leccion) => {
      leccion.palabras?.forEach((p) => agregar(mapa, p.espanol, p.nahuatl))
    })
  })
}

export function cargarVocabulario() {
  if (diccionario) return Promise.resolve(diccionario)
  if (cargando) return cargando
  cargando = (async () => {
    const mapa = new Map()
    try {
      const datos = await pedir('/palabras')
      datos.palabras?.forEach((p) => agregar(mapa, p.espanol, p.nahuatl))
    } catch {
      // sin conexión: solo las palabras de las lecciones
    }
    palabrasDeLasLecciones(mapa)
    diccionario = mapa
    return mapa
  })()
  return cargando
}

// Regla: primero se RECONOCE el objeto (en inglés, por el modelo), luego se TRADUCE al español
// y al final se busca en NUESTRO vocabulario. Siempre hay respuesta: si la palabra no está,
// nahuatl = null ("Desconocido"); si ni siquiera hay traducción al español, se muestra en inglés.
function buscarEnVocabulario(opciones, tipo) {
  const espanol = opciones[0]
  for (const opcion of opciones) {
    const encontrada = diccionario?.get(normalizar(opcion))
    if (encontrada) return { espanol, nahuatl: encontrada.nahuatl, tipo }
  }
  return { espanol, nahuatl: null, tipo }
}

const enIngles = (nombre) => ({ espanol: nombre.charAt(0).toUpperCase() + nombre.slice(1), nahuatl: null, tipo: 'objeto', enIngles: true })

// Detector (80 cosas): "dog" -> { espanol: 'Perro', nahuatl: 'Itzcuintli', tipo: 'animal' }
export function traducirDeteccion(nombreIngles) {
  const objeto = OBJETOS_CAMARA[nombreIngles]
  return objeto ? buscarEnVocabulario(objeto.es, objeto.tipo) : enIngles(nombreIngles)
}

// Clasificador (~1000 cosas): "coffee mug" -> { espanol: 'Taza', … } · null si no hay traducción
export function traducirClase(nombreIngles) {
  const clase = claseEnEspanol(nombreIngles)
  return clase ? buscarEnVocabulario(clase.es, clase.tipo) : null
}
