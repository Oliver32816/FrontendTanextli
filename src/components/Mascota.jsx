import { useEffect, useMemo, useState } from 'react'
import { animaciones, rutinas } from '../data/mascotaAnimaciones'
import '../styles/mascota.css'
import MascotaAnimada from './MascotaAnimada'

const TAMANOS_CAPAS = { pequeno: 140, mediano: 200, grande: 280 }
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
    medio = (
      <div className="mascota-capas-wrapper">
        <MascotaAnimada
          estado={estadoCapas}
          tamano={TAMANOS_CAPAS[tamano] || 200}
          entrada={entrada}
        />
      </div>
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