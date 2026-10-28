// ============================================================
// Animaciones de la mascota
// ------------------------------------------------------------
// Aquí se registra qué archivo se muestra en cada estado.
// Quien haga la animación solo tiene que:
//   1. Copiar sus archivos a la carpeta  public/mascota/
//   2. Cambiar la ruta de cada estado en este archivo.
//
// tipo: 'imagen' (png, gif, webp, svg)  o  'video' (webm, mp4)
// Los videos se reproducen en bucle y sin sonido.
//
// NUEVO: tipo 'capas' = mascota animada por capas (brazo, orejas, ojos, boca...).
//   No lleva src: lleva  estado  con uno de los estados de components/MascotaAnimada.jsx:
//   reposo | saludando | hablando | escuchando | pensando | feliz | celebrando | triste |
//   sorprendida | error | bailando | pirueta | emocionada | agradecida | curiosa |
//   timida | orgullosa | sonolienta
//
//   Un estado puede llevar  variantes: ['a', 'b', 'c']  y cada vez que aparece la mascota
//   elige una al azar (sin repetir la anterior). Así las respuestas correctas no se ven siempre igual.
// ============================================================

export const animaciones = {
  // Lo que había antes (imagen fija), por si se quiere volver:
  // reposo:  { tipo: 'imagen', src: '/mascota.png' }, // esperando, sin hablar
  // saludo:  { tipo: 'imagen', src: '/mascota.png' }, // bienvenida y presentación
  // feliz:   { tipo: 'imagen', src: '/mascota.png' }, // respuesta correcta
  // celebra: { tipo: 'imagen', src: '/mascota.png' }, // terminar una lección
  // animo:   { tipo: 'imagen', src: '/mascota.png' }, // cuando se equivoca

  reposo:  { tipo: 'capas', estado: 'reposo' },    // esperando, sin hablar
  saludo:  { tipo: 'capas', estado: 'saludando' }, // bienvenida y presentación

  // Respuesta correcta: cada vez una reacción distinta
  feliz: {
    tipo: 'capas', estado: 'feliz',
    variantes: ['feliz', 'agradecida', 'orgullosa', 'emocionada', 'bailando'],
  },
  // Terminar una lección: festejos más grandes
  celebra: {
    tipo: 'capas', estado: 'celebrando',
    variantes: ['celebrando', 'bailando', 'pirueta', 'emocionada'],
  },
  // Cuando se equivoca: ánimo, cada vez distinto
  animo: {
    tipo: 'capas', estado: 'triste',
    variantes: ['triste', 'timida', 'pensando'],
  },

  habla:    { tipo: 'capas', estado: 'hablando' },
  escucha:  { tipo: 'capas', estado: 'escuchando' },
  piensa:   { tipo: 'capas', estado: 'pensando' },
  sorpresa: { tipo: 'capas', estado: 'sorprendida' },
  error: {
    tipo: 'capas', estado: 'error',
    variantes: ['error', 'triste', 'timida'],
  },

  // NUEVO: estados con movimiento propio (se usan igual:  <Mascota estado="baila" />)
  baila:       { tipo: 'capas', estado: 'bailando' },    // se balancea de lado a lado
  pirueta:     { tipo: 'capas', estado: 'pirueta' },     // salta y da una vuelta completa
  emocionada:  { tipo: 'capas', estado: 'emocionada' },  // rebota sin parar
  agradecida:  { tipo: 'capas', estado: 'agradecida' },  // asiente dando las gracias
  curiosa:     { tipo: 'capas', estado: 'curiosa' },     // se inclina y mira de reojo
  timida:      { tipo: 'capas', estado: 'timida' },      // cabeza baja, mira hacia abajo
  orgullosa:   { tipo: 'capas', estado: 'orgullosa' },   // saca el pecho
  sonolienta:  { tipo: 'capas', estado: 'sonolienta' },  // ojos cerrados, cabecea
}

// ============================================================
// Rutinas
// ------------------------------------------------------------
// Una rutina es una lista de pasos que la mascota repite en bucle.
// Cada pantalla usa la suya, así no todas se mueven igual:
//   <Mascota rutina="menu" tamano="pequeno" />
//
// Cada paso:  { estado: <una clave de "animaciones">, ms: <cuánto dura, en milisegundos> }
// Para crear una rutina nueva basta con agregarla aquí abajo.
//
// Ojo con "mensaje": un paso puede llevar  mensaje: 'texto'  para mostrar un globo. Si lo usas,
// pon también  flotar  en la etiqueta  <Mascota flotar ... />  para que el globo no mueva la pantalla.
// ============================================================
export const rutinas = {
  // Menú: anfitriona. Saluda, invita, se asoma curiosa y presume un poco
  menu: [
    { estado: 'saludo', ms: 3500 },
    { estado: 'habla', ms: 3000 },
    { estado: 'curiosa', ms: 4000 },
    { estado: 'reposo', ms: 6000 },
    { estado: 'orgullosa', ms: 3500 },
    { estado: 'reposo', ms: 7000 },
  ],

  // Categoría: animadora. Rebota, escucha, piensa y se pone a bailar
  categoria: [
    { estado: 'emocionada', ms: 2500 },
    { estado: 'escucha', ms: 4500 },
    { estado: 'piensa', ms: 3000 },
    { estado: 'baila', ms: 2500 },
    { estado: 'reposo', ms: 5000 },
  ],

  // Acerca de: presumida. Saca pecho, se alegra y da una pirueta
  acerca: [
    { estado: 'orgullosa', ms: 4000 },
    { estado: 'feliz', ms: 3000 },
    { estado: 'pirueta', ms: 2500 },
    { estado: 'reposo', ms: 5000 },
    { estado: 'saludo', ms: 3000 },
  ],

  // 404: perdida. Apenada, sorprendida, curiosa y de nuevo con ánimo bajo
  noEncontrada: [
    { estado: 'timida', ms: 4000 },
    { estado: 'sorpresa', ms: 2200 },
    { estado: 'curiosa', ms: 3500 },
    { estado: 'piensa', ms: 3500 },
    { estado: 'animo', ms: 3500 },
  ],

  // Rutinas listas para las pantallas que vienen (Perfil, Configuración, Lección...)
  perfil: [
    { estado: 'saludo', ms: 3000 },
    { estado: 'agradecida', ms: 4000 },
    { estado: 'reposo', ms: 6000 },
    { estado: 'curiosa', ms: 3500 },
    { estado: 'reposo', ms: 5000 },
  ],

  configuracion: [
    { estado: 'piensa', ms: 4500 },
    { estado: 'curiosa', ms: 3500 },
    { estado: 'reposo', ms: 5000 },
    { estado: 'habla', ms: 3000 },
    { estado: 'reposo', ms: 6000 },
  ],

  leccion: [
    { estado: 'escucha', ms: 6000 },
    { estado: 'habla', ms: 3500 },
    { estado: 'piensa', ms: 4000 },
    { estado: 'emocionada', ms: 2500 },
    { estado: 'reposo', ms: 5000 },
  ],

  exito: [
    { estado: 'pirueta', ms: 2500 },
    { estado: 'baila', ms: 3500 },
    { estado: 'agradecida', ms: 3000 },
    { estado: 'orgullosa', ms: 3000 },
  ],

  // Pantallas de espera o carga
  espera: [
    { estado: 'sonolienta', ms: 6000 },
    { estado: 'curiosa', ms: 3000 },
    { estado: 'reposo', ms: 3000 },
  ],
}

// Ejemplo de cómo quedaría con animaciones reales:
//   saludo: { tipo: 'video', src: '/mascota/saludo.webm' },
//   feliz:  { tipo: 'imagen', src: '/mascota/feliz.webp' },