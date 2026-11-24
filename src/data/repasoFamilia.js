// Repaso general de Familia: tres actividades con 10 preguntas al azar cada una
//   parejaFamilia      ¿Cuál es su pareja?   (abuelo → abuela)
//   dictadoFamilia     Escucha y arma        (suena el náhuatl y se arma con fichas)
//   verdaderoFalso     Verdadero o falso     («Papan» significa «Padre»)

// Parejas masculino / femenino (en español, como están en lecciones.js)
const PAREJAS = [
  ['Padre', 'Madre'],
  ['Abuelo', 'Abuela'],
  ['Tío', 'Tía'],
  ['Primo', 'Prima'],
  ['Hermano', 'Hermana'],
  ['Nieto', 'Nieta'],
  ['Sobrino', 'Sobrina'],
  ['Cuñado', 'Cuñada'],
  ['Suegro', 'Suegra'],
  ['Señor', 'Señora'],
  ['Niño', 'Niña'],
  ['Hombre', 'Mujer'],
]

function normalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function mezclar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temporal = copia[i]
    copia[i] = copia[j]
    copia[j] = temporal
  }
  return copia
}

const piezasDe = (p) => p.nahuatl.trim().split(/\s+/)

// Parejas que existen en las palabras del repaso: [[abuelo, abuela], ...]
function parejasDe(palabras) {
  const buscar = (espanol) => palabras.find((p) => normalizar(p.espanol) === normalizar(espanol))
  return PAREJAS.map(([a, b]) => [buscar(a), buscar(b)]).filter(([a, b]) => a && b)
}

// ¿Cuál es su pareja? Una pregunta por pareja (sin repetir), con 4 opciones en náhuatl
function preguntasPareja(palabras, cantidad) {
  return mezclar(parejasDe(palabras))
    .slice(0, cantidad)
    .map(([a, b]) => {
      const [p, pareja] = Math.random() < 0.5 ? [a, b] : [b, a]
      const vistos = new Set([normalizar(p.nahuatl), normalizar(pareja.nahuatl)])
      const equivocadas = []
      for (const q of mezclar(palabras)) {
        const k = normalizar(q.nahuatl)
        if (vistos.has(k)) continue
        vistos.add(k)
        equivocadas.push(q.nahuatl)
        if (equivocadas.length === 3) break
      }
      return {
        palabra: { ...p, modoPareja: true, pareja },
        opciones: mezclar([pareja.nahuatl, ...equivocadas]),
      }
    })
}

// Escucha y arma: solo palabras de 2 o más partes (Noikniuj takat...), con fichas
function preguntasDictado(palabras, cantidad) {
  const compuestas = palabras.filter((p) => p.audio && piezasDe(p).length >= 2)
  return mezclar(compuestas)
    .slice(0, cantidad)
    .map((p) => {
      const piezas = piezasDe(p)
      const vistos = new Set(piezas.map(normalizar))
      const equivocadas = []
      for (const q of mezclar(palabras)) {
        for (const t of piezasDe(q)) {
          const k = normalizar(t)
          if (vistos.has(k)) continue
          vistos.add(k)
          equivocadas.push(t)
        }
        if (equivocadas.length >= 3) break
      }
      const fichas = [
        ...piezas.map((t, i) => ({ id: `n${i}`, texto: t })),
        ...equivocadas.slice(0, 3).map((t, i) => ({ id: `x${i}`, texto: t })),
      ]
      return {
        palabra: { ...p, modoArmar: 'dictado', audios: [p.audio], solucion: piezas },
        opciones: mezclar(fichas),
      }
    })
}

// Verdadero o falso: la mitad de las afirmaciones son ciertas y la otra mitad no
function preguntasVerdaderoFalso(palabras, cantidad) {
  const pareja = new Map()
  parejasDe(palabras).forEach(([a, b]) => {
    pareja.set(a, b)
    pareja.set(b, a)
  })
  const elegidas = mezclar(palabras).slice(0, cantidad)
  const verdades = mezclar(elegidas.map((_, i) => i % 2 === 0))
  return elegidas.map((p, i) => {
    const esVerdad = verdades[i]
    let mostrada = p
    if (!esVerdad) {
      const otras = palabras.filter(
        (q) => normalizar(q.espanol) !== normalizar(p.espanol) && normalizar(q.nahuatl) !== normalizar(p.nahuatl),
      )
      const suPareja = pareja.get(p)
      // A veces la falsa usa a su pareja (Tatatsin = Abuela), que es la más engañosa
      mostrada = suPareja && Math.random() < 0.5 ? suPareja : mezclar(otras)[0]
    }
    return { palabra: { ...p, modoVF: true, afirmacion: mostrada.espanol, esVerdad } }
  })
}

export function armarPreguntasFamilia(tipo, palabras, cantidad = 10) {
  if (tipo === 'parejaFamilia') return preguntasPareja(palabras, cantidad)
  if (tipo === 'dictadoFamilia') return preguntasDictado(palabras, cantidad)
  return preguntasVerdaderoFalso(palabras, cantidad)
}