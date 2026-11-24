// Calcula el avance del usuario a partir de lo que ya guarda la app:
// las lecciones de categorias.js, las palabras de lecciones.js y progreso.js.
import { categorias } from '../data/categorias'
import { contenidoLecciones } from '../data/lecciones'
import { cantidadCompletadas } from './progreso'

// Avance de cada categoría (lecciones completadas / total)
export function progresoPorCategoria() {
  return Object.entries(categorias).map(([id, categoria]) => {
    const total = categoria.lecciones.length
    const completadas = Math.min(cantidadCompletadas(id), total)
    return { id, titulo: categoria.titulo, icono: categoria.icono, color: categoria.color, completadas, total }
  })
}

// Palabras de las lecciones ya completadas, agrupadas por categoría
// (sin contar los repasos y sin repetir palabras)
export function obtenerVocabulario() {
  return Object.entries(categorias)
    .map(([id, categoria]) => {
      const vistas = new Map()
      categoria.lecciones.slice(0, cantidadCompletadas(id)).forEach((leccion) => {
        if (leccion.final) return
        contenidoLecciones[id]?.[leccion.id]?.palabras.forEach((p) => {
          if (!vistas.has(p.espanol)) vistas.set(p.espanol, { nahuatl: p.nahuatl, espanol: p.espanol })
        })
      })
      return { id, titulo: categoria.titulo, icono: categoria.icono, color: categoria.color, palabras: [...vistas.values()] }
    })
    .filter((grupo) => grupo.palabras.length > 0)
}

// La primera lección pendiente que ya tiene contenido
export function obtenerSiguienteLeccion() {
  for (const [id, categoria] of Object.entries(categorias)) {
    const completadas = cantidadCompletadas(id)
    const leccion = categoria.lecciones[completadas]
    if (leccion && contenidoLecciones[id]?.[leccion.id]) {
      return {
        categoriaId: id,
        categoria: categoria.titulo,
        icono: categoria.icono,
        color: categoria.color,
        leccionId: leccion.id,
        titulo: leccion.final ? 'Repaso general' : `Lección ${leccion.id}: ${leccion.titulo}`,
      }
    }
  }
  return null
}

// Todo el resumen junto, para el Perfil
export function obtenerResumen() {
  const porCategoria = progresoPorCategoria()
  const vocabulario = obtenerVocabulario()
  const leccionesCompletadas = porCategoria.reduce((suma, c) => suma + c.completadas, 0)
  const leccionesTotales = porCategoria.reduce((suma, c) => suma + c.total, 0)

  return {
    categorias: porCategoria,
    vocabulario,
    leccionesCompletadas,
    leccionesTotales,
    porcentaje: leccionesTotales ? Math.round((leccionesCompletadas / leccionesTotales) * 100) : 0,
    categoriasTerminadas: porCategoria.filter((c) => c.completadas === c.total).length,
    categoriasIniciadas: porCategoria.filter((c) => c.completadas > 0).length,
    palabras: vocabulario.reduce((suma, g) => suma + g.palabras.length, 0),
  }
}

// Insignias: cada una lleva cuánto lleva (actual) y cuánto necesita (meta)
export function obtenerLogros(resumen) {
  const avance = (id) => resumen.categorias.find((c) => c.id === id) || { completadas: 0, total: 1 }
  const familia = avance('familia')
  const colores = avance('colores')
  const numeros = avance('numeros')
  const mitad = Math.ceil(resumen.leccionesTotales / 2)

  const lista = [
    { id: 'primera', icono: '🌱', titulo: 'Primer paso', descripcion: 'Completa tu primera lección', actual: resumen.leccionesCompletadas, meta: 1 },
    { id: 'constante', icono: '🔥', titulo: 'Constante', descripcion: 'Completa 5 lecciones', actual: resumen.leccionesCompletadas, meta: 5 },
    { id: 'dedicado', icono: '⭐', titulo: 'Dedicado', descripcion: 'Completa 10 lecciones', actual: resumen.leccionesCompletadas, meta: 10 },
    { id: 'mitad', icono: '🧭', titulo: 'Mitad del camino', descripcion: 'Completa la mitad de todas las lecciones', actual: resumen.leccionesCompletadas, meta: mitad },
    { id: 'palabras-10', icono: '📖', titulo: 'Primeras palabras', descripcion: 'Aprende 10 palabras', actual: resumen.palabras, meta: 10 },
    { id: 'palabras-25', icono: '📚', titulo: 'Buen vocabulario', descripcion: 'Aprende 25 palabras', actual: resumen.palabras, meta: 25 },
    { id: 'palabras-50', icono: '🏆', titulo: 'Gran hablante', descripcion: 'Aprende 50 palabras', actual: resumen.palabras, meta: 50 },
    { id: 'explorador', icono: '🗺️', titulo: 'Explorador', descripcion: 'Empieza 3 categorías distintas', actual: resumen.categoriasIniciadas, meta: 3 },
    { id: 'familia', icono: '👪', titulo: 'Familia completa', descripcion: 'Termina la sección Familia', actual: familia.completadas, meta: familia.total },
    { id: 'colores', icono: '🎨', titulo: 'Arcoíris', descripcion: 'Termina la sección Colores', actual: colores.completadas, meta: colores.total },
    { id: 'numeros', icono: '🔢', titulo: 'Sé contar hasta 20', descripcion: 'Termina la sección Números', actual: numeros.completadas, meta: numeros.total },
    {
      id: 'maestro',
      icono: '👑',
      titulo: 'Maestro de Tanextli',
      descripcion: 'Termina Familia, Colores y Números',
      actual: familia.completadas + colores.completadas + numeros.completadas,
      meta: familia.total + colores.total + numeros.total,
    },
  ]

  return lista.map((logro) => ({
    ...logro,
    actual: Math.min(logro.actual, logro.meta),
    logrado: logro.actual >= logro.meta,
  }))
}