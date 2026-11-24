// ============================================================
// Actividades de las lecciones
// ------------------------------------------------------------
// Tipos de actividad que existen:
//   escuchar      Escucha y repite (práctica con el micrófono). Es la del inicio.
//   escuchaElige  Escucha la palabra y elige su significado (botones en español)
//   leeElige      Lee la palabra en español y elige cómo se dice (botones en náhuatl)
//   escritura     Escribe la palabra en náhuatl
//   unir          Une cada palabra con su pareja
//   opcion        Escucha la palabra y elige cómo se escribe (botones en náhuatl)
//
// Cada lección tiene la actividad de inicio y hasta 3 actividades distintas.
// ============================================================

import { contenidoLecciones } from './lecciones'

// Texto y ícono de cada actividad (se usa en la pantalla "¿Qué hay en cada lección?")
export const INFO_ACTIVIDADES = {
  unirNumero: {
    titulo: 'Une el número',
    texto: 'Une cada número con su nombre en náhuatl',
    icono: 'documento',
  },
  escuchar: {
    titulo: 'Escucha y repite',
    texto: 'Escucha la palabra en náhuatl y repítela con tu voz',
    icono: 'microfono',
  },
  escuchaElige: {
    titulo: 'Escucha y elige',
    texto: 'Escucha la palabra y elige su significado en español',
    icono: 'altavoz',
  },
  leeElige: {
    titulo: 'Lee y elige',
    texto: 'Lee la palabra en español y elige cómo se dice en náhuatl',
    icono: 'documento',
  },
  escritura: {
    titulo: 'Escribe',
    texto: 'Escribe la palabra en náhuatl',
    icono: 'lapiz',
  },
  unir: {
    titulo: 'Une las parejas',
    texto: 'Une cada palabra con su pareja',
    icono: 'documento',
  },
  completa: {
    titulo: 'Completa la frase',
    texto: 'Elige la palabra que falta para completar la frase',
    icono: 'lapiz',
  },
  escuchaFrase: {
    titulo: 'Escucha y selecciona',
    texto: 'Escucha la frase en náhuatl y arma su traducción en español',
    icono: 'altavoz',
  },
  opcion: {
    titulo: 'Escucha y elige',
    texto: 'Escucha la palabra y elige cómo se escribe en náhuatl',
    icono: 'altavoz',
  },
  escuchaArma: {
    titulo: 'Escucha y selecciona',
    texto: 'Escucha la frase en náhuatl y arma su traducción en español',
    icono: 'altavoz',
  },
  leeArma: {
    titulo: 'Lee y selecciona',
    texto: 'Lee la frase en español y arma cómo se dice en náhuatl',
    icono: 'documento',
  },
  completaDialogo: {
    titulo: 'Completa la frase',
    texto: 'Elige la frase que falta para completar el diálogo',
    icono: 'lapiz',
  },
  miraColor: {
    titulo: 'Mira y elige',
    texto: 'Mira el color y elige cómo se dice en náhuatl',
    icono: 'documento',
  },
  escuchaColor: {
    titulo: 'Escucha y toca el color',
    texto: 'Escucha la palabra en náhuatl y toca el color',
    icono: 'altavoz',
  },
  armaNumero: {
    titulo: 'Arma el número',
    texto: 'Arma el número en náhuatl tocando sus piezas en orden',
    icono: 'lapiz',
  },
  leeNahuatl: {
    titulo: 'Lee y elige',
    texto: 'Lee la palabra en náhuatl y elige su significado en español',
    icono: 'documento',
  },
  completaPalabra: {
    titulo: 'Completa la palabra',
    texto: 'Elige la parte que falta para completar la palabra en náhuatl',
    icono: 'lapiz',
  },
    parejaFamilia: {
    titulo: '¿Cuál es su pareja?',
    texto: 'Elige la pareja de la palabra (abuelo → abuela)',
    icono: 'documento',
  },
  dictadoFamilia: {
    titulo: 'Escucha y arma',
    texto: 'Escucha la palabra en náhuatl y arma con las fichas',
    icono: 'altavoz',
  },
  verdaderoFalso: {
    titulo: 'Verdadero o falso',
    texto: 'Decide si la traducción es verdadera o falsa',
    icono: 'documento',
  },
}

// Actividades con rango de números (repaso general de Números)
INFO_ACTIVIDADES['escritura@1-10'] = {
  ...INFO_ACTIVIDADES.escritura,
  texto: 'Escribe en náhuatl los números del 1 al 10',
}
INFO_ACTIVIDADES['opcion@11-20'] = {
  ...INFO_ACTIVIDADES.opcion,
  texto: 'Escucha el número y elige cómo se dice en náhuatl (del 11 al 20)',
}

// Actividades por categoría: todas sus lecciones (menos el repaso final) usan las mismas.
// Las categorías que no estén aquí usan lo que diga cada lección en lecciones.js.
export const ACTIVIDADES_POR_CATEGORIA = {
  numeros: ['escuchar', 'unirNumero', 'opcion', 'escritura'],
}

// Lecciones que cambian alguna actividad de su categoría (tienen prioridad)
// Números 3 (11 al 15) y 4 (16 al 20): en vez de escribir, arman el número con fichas
export const ACTIVIDADES_POR_LECCION = {
  numeros: {
    3: ['escuchar', 'unirNumero', 'opcion', 'armaNumero'],
    4: ['escuchar', 'unirNumero', 'opcion', 'armaNumero'],
  },
  familia: {
    1: ['escuchar', 'opcion', 'leeNahuatl', 'escritura'],
    2: ['escuchar', 'escuchaElige', 'leeElige', 'unir'],
    3: ['escuchar', 'unir', 'escuchaElige', 'completaPalabra'],
    4: ['escuchar', 'opcion', 'unir', 'escritura'],
  },
}

export const ACTIVIDADES_POR_DEFECTO = ['escuchar', 'opcion', 'escritura']

export function actividadesDe(categoriaId, leccionId, esFinal = false) {
  const propias =
    contenidoLecciones[categoriaId] && contenidoLecciones[categoriaId][leccionId]
      ? contenidoLecciones[categoriaId][leccionId].actividades
      : null
  if (esFinal) return propias || ACTIVIDADES_POR_DEFECTO
  const especial = ACTIVIDADES_POR_LECCION[categoriaId] && ACTIVIDADES_POR_LECCION[categoriaId][leccionId]
  if (especial) return especial
  return ACTIVIDADES_POR_CATEGORIA[categoriaId] || propias || ACTIVIDADES_POR_DEFECTO
}