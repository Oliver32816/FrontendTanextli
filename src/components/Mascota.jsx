import { useEffect, useMemo, useState } from 'react' // NUEVO
import { animaciones, rutinas } from '../data/mascotaAnimaciones' // NUEVO: rutinas
import '../styles/mascota.css'
import MascotaAnimada from './MascotaAnimada' // NUEVO: mascota animada por capas

// Uso:  <Mascota estado="saludo" mensaje="¡Hola!" tamano="grande" globo="arriba" />
//   estado:  reposo | saludo | feliz | celebra | animo | habla | escucha | piensa | sorpresa | error
//            NUEVO: también baila | pirueta | emocionada | agradecida | curiosa | timida | orgullosa | sonolienta
//   mensaje: texto del globo de diálogo (opcional)
//   tamano:  pequeno | mediano | grande
//   globo:   arriba | derecha  (dónde queda el globo respecto a la mascota)
//   NUEVO  rutina:  nombre de una rutina de data/mascotaAnimaciones.js. La mascota va cambiando de
//                   estado sola, con su propio ritmo. Si se pone "rutina", se ignora "estado".
//   NUEVO  entrada: cómo aparece al abrirse la pantalla: rebote | deslizar | asomar | zoom | aparecer
//   NUEVO  flotar:  el globo flota encima de la mascota y NO mueve el resto de la pantalla
//   NUEVO  disparo: cualquier valor que cambie (por ejemplo el número de pregunta) vuelve a elegir
//                   una animación distinta en los estados que tienen variantes
//   Ejemplo:  <Mascota rutina="menu" tamano="pequeno" entrada="asomar" />

// NUEVO: tamaño en píxeles cuando la animación es de tipo 'capas' (súbelos o bájalos aquí)
const TAMANOS_CAPAS = { pequeno: 180, mediano: 260, grande: 340 }

// NUEVO: recuerda la última variante elegida de cada estado, para no repetirla dos veces seguidas
const ultimaVariante = {}

function Mascota({
  estado = 'reposo',
  mensaje,
  tamano = 'mediano',
  globo = 'arriba',
  rutina,
  entrada,
  flotar = false,
  disparo,
}) {
  // NUEVO: si hay rutina, la mascota recorre sus pasos en bucle
  const pasos = rutina ? rutinas[rutina] : null
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    if (!pasos || pasos.length === 0) return undefined
    let i = 0
    let t
    setPaso(0)
    const avanzar = () => {
      t = setTimeout(() => {
        i = (i + 1) % pasos.length
        setPaso(i)
        avanzar()
      }, pasos[i].ms || 4000)
    }
    avanzar()
    return () => clearTimeout(t)
  }, [rutina]) // eslint-disable-line react-hooks/exhaustive-deps

  const actual = pasos && pasos.length > 0 ? pasos[paso] || pasos[0] : null
  const estadoActual = actual ? actual.estado : estado
  const mensajeActual = actual ? actual.mensaje : mensaje

  const animacion = animaciones[estadoActual] || animaciones.reposo

  // NUEVO: si el estado tiene variantes, elige una distinta cada vez
  const estadoCapas = useMemo(() => {
    if (animacion.tipo !== 'capas') return null
    const lista = animacion.variantes
    if (!lista || lista.length === 0) return animacion.estado
    const previa = ultimaVariante[estadoActual]
    const opciones = lista.length > 1 ? lista.filter((v) => v !== previa) : lista
    const elegida = opciones[Math.floor(Math.random() * opciones.length)]
    ultimaVariante[estadoActual] = elegida
    return elegida
  }, [estadoActual, disparo]) // eslint-disable-line react-hooks/exhaustive-deps

  let medio
  if (animacion.tipo === 'capas') {
    // El globo lo sigue dibujando este componente, por eso no se pasa "mensaje"
    medio = (
      <MascotaAnimada
        estado={estadoCapas}
        tamano={TAMANOS_CAPAS[tamano] || 260}
        entrada={entrada}
      />
    )
  } else if (animacion.tipo === 'video') {
    medio = (
      <video
        key={estadoActual}
        className="mascota-medio"
        src={animacion.src}
        autoPlay
        loop
        muted
        playsInline
        aria-label="Mascota de Tanextli"
      />
    )
  } else {
    // Para usar Lottie o Rive: instalar su librería y agregar otro caso aquí.
    medio = (
      <img
        key={estadoActual}
        className="mascota-medio"
        src={animacion.src}
        alt="Mascota de Tanextli"
      />
    )
  }

  return (
    <div className={`mascota mascota-${tamano} mascota-globo-${globo}`}>
      {mensajeActual && !flotar && <div className="mascota-globo" role="status">{mensajeActual}</div>}

      {/* NUEVO: "mxa-ancla" mide justo lo mismo que la mascota; el globo flotante se pega arriba de ella */}
      <div className="mxa-ancla">
        {mensajeActual && flotar && (
          <div className="mxa-flota">
            <div className="mascota-globo" role="status">{mensajeActual}</div>
          </div>
        )}
        {medio}
      </div>
    </div>
  )
}

export default Mascota