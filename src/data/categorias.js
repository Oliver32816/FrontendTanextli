// Lecciones de ejemplo para las categorías que todavía no tienen contenido real

export const categorias = {
  familia: {
    titulo: 'Familia',
    descripcion: 'Aprende los nombres de los miembros de la familia',
    icono: '👪',
    color: 'naranja',
    lecciones: [
      { id: 1, titulo: 'Familia', palabras: 5 },
      { id: 2, titulo: 'Familia extendida', palabras: 5 },
      { id: 3, titulo: 'Más familiares', palabras: 9 },
      { id: 4, titulo: 'Personas', palabras: 10 },
      { id: 5, titulo: 'Repaso', final: true },
    ],
  },
  colores: {
    titulo: 'Colores',
    descripcion: 'Descubre los colores en náhuatl',
    icono: '🎨',
    color: 'morado',
    lecciones: [
      { id: 1, titulo: 'Colores básicos', palabras: 5 },
      { id: 2, titulo: 'Colores secundarios', palabras: 6 },
      { id: 3, titulo: 'Repaso general', final: true },
    ],
  },
  numeros: {
    titulo: 'Números',
    descripcion: 'Aprende a contar en náhuatl',
    icono: '🔢',
    color: 'azul',
    lecciones: [
      { id: 1, titulo: 'Del 1 al 5', palabras: 5 },
      { id: 2, titulo: 'Del 6 al 10', palabras: 5 },
      { id: 3, titulo: 'Del 11 al 15', palabras: 5 }, // el diseño dice 9 palabras; del 11 al 15 son 5 números
      { id: 4, titulo: 'Del 16 al 20', palabras: 5 },
      { id: 5, titulo: 'Repaso general', final: true },
    ],
  },
  frases: {
    titulo: 'Frases',
    descripcion: 'Aprende unas frases en náhuatl',
    icono: '💬',
    color: 'verde',
    // Lecciones de ejemplo: faltan por llegar el diseño y las frases reales
    lecciones: [
      { id: 1, titulo: 'Parte 1', palabras: 5 },
      { id: 2, titulo: 'Parte 2', palabras: 5 },
      { id: 3, titulo: 'Parte 3', palabras: 5 },
      { id: 4, titulo: 'Repaso general', final: true },
    ],
  },
}