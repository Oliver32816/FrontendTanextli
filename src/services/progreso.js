// Progreso del usuario guardado en el servidor, para que sea el mismo en la web y en el celular.
// Las pantallas leen una copia local (lectura inmediata); cada lección terminada se envía al
// servidor. Si no hay internet, queda pendiente y se envía en la siguiente sincronización.
import { pedir } from './api'

const CLAVE = 'tanextli_progreso'
const CLAVE_PENDIENTES = 'tanextli_progreso_pendiente'

function leer(clave, vacio) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || vacio
  } catch {
    return vacio
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // sin almacenamiento: el avance solo vive en el servidor
  }
}

// Cuántas lecciones lleva completadas el usuario en una categoría
export function cantidadCompletadas(categoriaId) {
  return (leer(CLAVE, {})[categoriaId] || []).length
}

export function leccionesCompletadas(categoriaId) {
  return leer(CLAVE, {})[categoriaId] || []
}

function agregarLocal(categoriaId, leccionId) {
  const datos = leer(CLAVE, {})
  const lista = datos[categoriaId] || []
  if (!lista.includes(leccionId)) lista.push(leccionId)
  datos[categoriaId] = lista.sort((a, b) => a - b)
  escribir(CLAVE, datos)
}

// Tipos de actividad de la app → tipos que guarda el servidor
const TIPO_SERVIDOR = {
  escritura: 'escritura',
  completaPalabra: 'escritura',
  armaNumero: 'escritura',
  escuchar: 'pronunciacion',
}

// [{ tipo: 'opcion', aciertos: 3, total: 5 }, ...] → agrupado por tipo del servidor
export function resumirActividades(actividades = []) {
  const grupos = {}
  actividades.forEach(({ tipo, aciertos, total }) => {
    if (!total) return
    const clave = TIPO_SERVIDOR[tipo] || 'opcion_multiple'
    grupos[clave] ||= { tipo: clave, aciertos: 0, total: 0 }
    grupos[clave].aciertos += Math.min(aciertos, total)
    grupos[clave].total += total
  })
  return Object.values(grupos)
}

async function enviar(registro) {
  return pedir('/progreso/lecciones', { method: 'POST', body: registro })
}

// Marca una lección como completada: se ve al instante y se envía al servidor
export async function marcarLeccionCompletada(categoriaId, leccionId, { actividades = [] } = {}) {
  agregarLocal(categoriaId, leccionId)
  const registro = { categoria: categoriaId, leccion: leccionId, actividades: resumirActividades(actividades) }
  try {
    await enviar(registro)
  } catch (err) {
    // Solo se reintenta si fue por falta de conexión o un error del servidor
    if (err.sinConexion || err.status >= 500) {
      escribir(CLAVE_PENDIENTES, [...leer(CLAVE_PENDIENTES, []), registro])
    }
  }
}

// Al iniciar sesión (y al abrir la app): envía lo pendiente y trae el avance del servidor
export async function sincronizarProgreso() {
  const pendientes = leer(CLAVE_PENDIENTES, [])
  const quedan = []
  for (const registro of pendientes) {
    try {
      await enviar(registro)
    } catch (err) {
      if (err.sinConexion || err.status >= 500) quedan.push(registro)
    }
  }
  escribir(CLAVE_PENDIENTES, quedan)

  try {
    const { progreso } = await pedir('/progreso/yo/lecciones')
    // Se conserva lo que aún no llega al servidor
    const datos = { ...(progreso || {}) }
    quedan.forEach(({ categoria, leccion }) => {
      datos[categoria] = [...new Set([...(datos[categoria] || []), leccion])].sort((a, b) => a - b)
    })
    escribir(CLAVE, datos)
    return true
  } catch {
    return false // sin conexión: se usa la copia local
  }
}

// Borra todo el avance (Configuración). Lanza error si el servidor no lo pudo borrar.
export async function reiniciarProgreso() {
  await pedir('/progreso/yo', { method: 'DELETE' })
  escribir(CLAVE, {})
  escribir(CLAVE_PENDIENTES, [])
}

// Al cerrar sesión: la copia local pertenece a esa cuenta
export function olvidarProgreso() {
  try {
    localStorage.removeItem(CLAVE)
    localStorage.removeItem(CLAVE_PENDIENTES)
  } catch {
    // sin almacenamiento
  }
}