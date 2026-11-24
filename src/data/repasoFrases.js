// ============================================================
// Repaso general de Frases comunes
// ------------------------------------------------------------
// Arma las preguntas del repaso uniendo frases de varias lecciones
// (por ejemplo "Hola" + "¿Cómo estás?"). Las combinaciones están en lecciones.js
// (contenidoLecciones.frases[5].combinaciones).
//
// Tipos de actividad:
//   escuchaArma     Escucha la frase en náhuatl y arma su traducción en español (fichas con palabras)
//   leeArma         Lee la frase en español y arma el náhuatl (fichas con las frases)
//   completaDialogo Completa el diálogo en náhuatl eligiendo la frase que falta
// ============================================================

const NOMBRES = ['Ana', 'Luis', 'Marcos', 'Lucía', 'Pedro', 'Sofía', 'Diego', 'Carla']

function mezclar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

// Para comparar sin fijarse en acentos, mayúsculas ni signos
function normalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’‘ʼ]/g, '')
    .replace(/[¿?¡!.,;:"“”()\-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const terminaEnSigno = (t) => /[?!.]$/.test(t)

// Une las frases con coma (o espacio si la anterior ya cierra con ? ! .). Antes del nombre no lleva coma.
function unirPartes(partes, campo) {
  return partes.reduce((acc, p, i) => {
    if (i === 0) return p[campo]
    const separador = terminaEnSigno(acc) || p.nombre ? ' ' : ', '
    return acc + separador + p[campo]
  }, '')
}

// Convierte una combinación (con "{nombre}" y textos en español) en una pregunta con datos reales
function armarCombo(def, individuales) {
  const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)]
  const partes = def.partes.map((p) => {
    if (p === '{nombre}') return { nahuatl: nombre, espanol: nombre, audio: null, nombre: true }
    const f = individuales.find((x) => x.espanol === p)
    return { nahuatl: f.nahuatl, espanol: f.espanol, audio: f.audio || null, nombre: false }
  })
  return {
    id: def.id,
    espanol: (def.espanol || unirPartes(partes, 'espanol')).replace('{nombre}', nombre),
    nahuatl: unirPartes(partes, 'nahuatl'),
    audios: partes.map((p) => p.audio).filter(Boolean),
    partes,
    nombre,
  }
}

// Palabras sueltas de una frase en español, en minúsculas (el nombre conserva su mayúscula)
function palabrasEs(texto, nombre) {
  return texto
    .split(/\s+/)
    .map((t) => t.replace(/[¿?¡!.,;:"“”()]/g, ''))
    .filter(Boolean)
    .map((t) => (t === nombre ? t : t.toLowerCase()))
}

// Frases en náhuatl de relleno: que no estén en la combinación ni se repitan
function rellenoFrases(combo, individuales, cuantos = 3) {
  const enCombo = new Set(combo.partes.map((p) => normalizar(p.nahuatl)))
  const vistos = new Set()
  const salida = []
  for (const x of mezclar(individuales)) {
    const k = normalizar(x.nahuatl)
    if (enCombo.has(k) || vistos.has(k)) continue
    vistos.add(k)
    salida.push(x.nahuatl)
    if (salida.length === cuantos) break
  }
  return salida
}

// Palabras en español de relleno: una por frase, que no estén en la respuesta
function rellenoPalabras(solucion, individuales, cuantos = 3) {
  const enSolucion = new Set(solucion.map(normalizar))
  const vistos = new Set()
  const salida = []
  for (const x of mezclar(individuales)) {
    for (const t of mezclar(palabrasEs(x.espanol, ''))) {
      const k = normalizar(t)
      if (!k || enSolucion.has(k) || vistos.has(k)) continue
      vistos.add(k)
      salida.push(t)
      break
    }
    if (salida.length === cuantos) break
  }
  return salida
}

const comoFichas = (textos) => mezclar(textos).map((texto, i) => ({ id: `f${i}`, texto }))

function preguntaEscuchaArma(def, individuales) {
  const combo = armarCombo(def, individuales)
  const solucion = palabrasEs(combo.espanol, combo.nombre)
  const fichas = comoFichas([...solucion, ...rellenoPalabras(solucion, individuales)])
  return { palabra: { ...combo, modoArmar: 'escucha', solucion }, partes: [], hueco: 0, opciones: fichas }
}

// Una frase suelta de una lección (Conversación, Expresiones...): suena el náhuatl y se arma la traducción
export function preguntaEscuchaFrase(p, individuales) {
  const solucion = palabrasEs(p.espanol, '')
  const fichas = comoFichas([...solucion, ...rellenoPalabras(solucion, individuales)])
  return {
    palabra: { ...p, audios: p.audio ? [p.audio] : [], modoArmar: 'escucha', solucion },
    partes: [],
    hueco: 0,
    opciones: fichas,
  }
}

function preguntaLeeArma(def, individuales) {
  const combo = armarCombo(def, individuales)
  const solucion = combo.partes.map((p) => p.nahuatl)
  const fichas = comoFichas([...solucion, ...rellenoFrases(combo, individuales)])
  return { palabra: { ...combo, modoArmar: 'lee', solucion }, partes: [], hueco: 0, opciones: fichas }
}

function preguntaCompletaDialogo(def, individuales) {
  const combo = armarCombo(def, individuales)
  const candidatos = combo.partes.map((p, i) => i).filter((i) => !combo.partes[i].nombre)
  const hueco = candidatos[Math.floor(Math.random() * candidatos.length)]
  const ultimo = combo.partes.length - 1
  const partes = combo.partes.map((p, i) => ({
    antes: '',
    texto: p.nahuatl,
    despues: i < ultimo && !terminaEnSigno(p.nahuatl) && !combo.partes[i + 1].nombre ? ',' : '',
  }))
  const opciones = mezclar([partes[hueco].texto, ...rellenoFrases(combo, individuales)])
  return { palabra: combo, partes, hueco, opciones }
}

// Elige las combinaciones de una actividad: las primeras de 2 frases y las demás de 3,
// procurando que entren frases de las 4 lecciones y que no se repitan entre actividades.
function elegirCombinaciones(pool, cantidad, usados) {
  const dos = mezclar(pool.filter((c) => c.partes.length === 2))
  const tres = mezclar(pool.filter((c) => c.partes.length >= 3))
  const cubiertas = new Set()
  const elegidas = []

  const tomar = (lista, cuantas) => {
    const disponibles = [...lista.filter((c) => !usados.has(c.id)), ...lista.filter((c) => usados.has(c.id))]
    for (let k = 0; k < cuantas && disponibles.length; k++) {
      let mejor = 0
      let mejorNuevas = -1
      disponibles.forEach((c, i) => {
        const nuevas = c.lecciones.filter((l) => !cubiertas.has(l)).length
        if (nuevas > mejorNuevas) {
          mejorNuevas = nuevas
          mejor = i
        }
      })
      const [c] = disponibles.splice(mejor, 1)
      c.lecciones.forEach((l) => cubiertas.add(l))
      usados.add(c.id)
      elegidas.push(c)
    }
  }

  const deDos = Math.min(Math.round(cantidad * 0.4), cantidad)
  tomar(dos, deDos)
  tomar(tres, cantidad - elegidas.length)
  if (elegidas.length < cantidad) tomar([...dos, ...tres].filter((c) => !elegidas.includes(c)), cantidad - elegidas.length)
  return elegidas
}

export function armarPreguntasRepaso(tipo, combinaciones, individuales, usados = new Set(), cantidad = 5) {
  const lista = individuales.filter((p) => !String(p.nahuatl).startsWith('(falta)'))
  // Solo combinaciones cuyas frases existan de verdad en las lecciones
  let pool = combinaciones.filter((c) =>
    c.partes.every((p) => p === '{nombre}' || lista.some((x) => x.espanol === p)),
  )
  // En "escucha" se oyen los audios: sin nombres, porque el nombre no tiene audio
  if (tipo === 'escuchaArma') pool = pool.filter((c) => !c.tieneNombre)

  const hacer =
    tipo === 'escuchaArma' ? preguntaEscuchaArma : tipo === 'leeArma' ? preguntaLeeArma : preguntaCompletaDialogo
  return elegirCombinaciones(pool, cantidad, usados).map((def) => hacer(def, lista))
}