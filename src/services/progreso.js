// Guarda qué lecciones completó el usuario en cada categoría.
// Por ahora se guarda en el navegador (localStorage). Cuando se conecte con el backend
// (las rutas de progreso), solo hay que cambiar estas funciones.

const CLAVE = 'tanextli_progreso'

function leer() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || {}
  } catch {
    return {}
  }
}

// Cuántas lecciones lleva completadas el usuario en una categoría
export function cantidadCompletadas(categoriaId) {
  return (leer()[categoriaId] || []).length
}

// Marca una lección como completada (si ya estaba marcada, no la repite)
export function marcarLeccionCompletada(categoriaId, leccionId) {
  try {
    const datos = leer()
    const lista = datos[categoriaId] || []
    if (!lista.includes(leccionId)) {
      lista.push(leccionId)
    }
    datos[categoriaId] = lista
    localStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    // sin almacenamiento: el avance no se guarda
  }
}

// Borra todo el avance guardado (se usa en Configuración)
export function reiniciarProgreso() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // sin almacenamiento: no hay nada que borrar
  }
}