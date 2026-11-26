// Seguidor de objetos: hace que la cámara sea rápida, estable y precisa.
// El modelo revisa ~14 cuadros por segundo y cada cuadro puede equivocarse un poco. Aquí:
//  1. Se ignoran clases que casi nunca están frente a la cámara y que el modelo confunde.
//  2. Un objeto NUEVO solo aparece con confianza >= 0.65 (0.75 si es raro en casa).
//     Ya visible, se sigue mientras siga >= 0.40 (así no parpadea si un cuadro sale borroso).
//  3. Sin duplicados: un solo recuadro por objeto aunque el modelo diga dos cosas distintas
//     (se queda la etiqueta más segura) ni recuadros chicos repetidos dentro de uno grande.
//  4. Cada objeto se sigue entre cuadros: recuadro suavizado y nombre decidido por "votos".

const IGNORADAS = new Set([
  'frisbee', 'skis', 'snowboard', 'kite', 'surfboard', 'baseball bat', 'baseball glove',
  'tennis racket', 'parking meter', 'fire hydrant', 'stop sign',
])
const RAROS = new Set([
  'hot dog', 'traffic light', 'airplane', 'train', 'boat', 'elephant', 'bear', 'zebra',
  'giraffe', 'tie', 'skateboard', 'toilet', 'hair drier', 'toaster',
])
const UMBRAL_ENTRAR = 0.65
const UMBRAL_ENTRAR_RARO = 0.75
const UMBRAL_SEGUIR = 0.4
const PARA_APARECER = 2     // cuadros seguidos (~0.15 s) para mostrarlo
const PARA_DESAPARECER = 4  // cuadros perdidos para quitarlo
const SUAVIZADO = 0.55      // 0 = no se mueve, 1 = sigue cada temblor del modelo

function iou(a, b) {
  const inter = interseccion(a, b)
  const union = a.ancho * a.alto + b.ancho * b.alto - inter
  return union > 0 ? inter / union : 0
}
function interseccion(a, b) {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.ancho, b.x + b.ancho)
  const y2 = Math.min(a.y + a.alto, b.y + b.alto)
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
}
// Qué parte del recuadro chico queda dentro del grande (para quitar repetidos anidados)
const dentro = (chico, grande) => interseccion(chico, grande) / (chico.ancho * chico.alto || 1)

const mezclar = (a, b, t) => a + (b - a) * t

export function crearSeguidor() {
  let objetos = []
  let siguienteId = 1

  // sinFiltro: prueba SIN margen de error (no se exige ninguna confianza mínima)
  function actualizar(detecciones, { sinFiltro = false } = {}) {
    const minimo = (valor) => (sinFiltro ? 0 : valor)
    // 1 y 3: filtrar y quitar repetidos (se queda el más seguro)
    const limpias = []
    detecciones
      .filter((d) => !IGNORADAS.has(d.nombre) && d.confianza >= minimo(UMBRAL_SEGUIR))
      .sort((a, b) => b.confianza - a.confianza)
      .forEach((d) => {
        const repetida = limpias.some((k) => iou(k.caja, d.caja) >= 0.5
          || (k.nombre === d.nombre && (dentro(d.caja, k.caja) > 0.85 || dentro(k.caja, d.caja) > 0.85)))
        if (!repetida) limpias.push(d)
      })

    // 4: emparejar con los objetos que ya se seguían
    const usados = new Set()
    limpias.forEach((d) => {
      let mejor = null
      let mejorIou = 0.3
      objetos.forEach((o) => {
        if (usados.has(o.id)) return
        const valor = iou(o.caja, d.caja)
        if (valor > mejorIou) { mejor = o; mejorIou = valor }
      })
      if (mejor) {
        usados.add(mejor.id)
        mejor.caja = {
          x: mezclar(mejor.caja.x, d.caja.x, SUAVIZADO),
          y: mezclar(mejor.caja.y, d.caja.y, SUAVIZADO),
          ancho: mezclar(mejor.caja.ancho, d.caja.ancho, SUAVIZADO),
          alto: mezclar(mejor.caja.alto, d.caja.alto, SUAVIZADO),
        }
        Object.keys(mejor.votos).forEach((k) => { mejor.votos[k] *= 0.8 })
        mejor.votos[d.nombre] = (mejor.votos[d.nombre] || 0) + d.confianza
        mejor.nombre = Object.entries(mejor.votos).sort((a, b) => b[1] - a[1])[0][0]
        mejor.confianza = mezclar(mejor.confianza, d.confianza, 0.4)
        mejor.vistas += 1
        mejor.perdidas = 0
      } else {
        // 2: solo nace un objeto nuevo si el modelo está muy seguro
        const umbral = RAROS.has(d.nombre) ? UMBRAL_ENTRAR_RARO : UMBRAL_ENTRAR
        if (d.confianza < umbral) return
        const nuevo = { id: siguienteId++, nombre: d.nombre, confianza: d.confianza, caja: { ...d.caja }, votos: { [d.nombre]: d.confianza }, vistas: 1, perdidas: 0 }
        objetos.push(nuevo)
        usados.add(nuevo.id)
      }
    })

    objetos.forEach((o) => { if (!usados.has(o.id)) o.perdidas += 1 })
    objetos = objetos.filter((o) => o.perdidas <= PARA_DESAPARECER)

    return objetos
      .filter((o) => o.vistas >= PARA_APARECER && o.perdidas <= 2)
      .map((o) => ({ id: o.id, nombre: o.nombre, confianza: o.confianza, vistas: o.vistas, caja: { ...o.caja } }))
  }

  return { actualizar, limpiar: () => { objetos = [] } }
}

// Formato estándar para la capa de RA: coordenadas normalizadas de 0 a 1000
export function normalizarCaja(caja, ancho, alto) {
  const n = (v, total) => Math.round(Math.min(1000, Math.max(0, (v / (total || 1)) * 1000)))
  return {
    ymin: n(caja.y, alto),
    xmin: n(caja.x, ancho),
    ymax: n(caja.y + caja.alto, alto),
    xmax: n(caja.x + caja.ancho, ancho),
  }
}
