// Tany se duerme si nadie mueve el mouse, toca la pantalla o escribe durante un rato,
// y despierta con cualquier actividad. ms = 0 lo desactiva.
import { useEffect, useRef, useState } from 'react'

export const DORMIR_MS = 20000

const EVENTOS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focusin', 'scroll']

export function useDormir(ms = DORMIR_MS, alDespertar) {
  const [dormida, setDormida] = useState(false)
  const dormidaRef = useRef(false)
  const despertarRef = useRef(alDespertar)
  despertarRef.current = alDespertar

  useEffect(() => {
    if (!ms) return undefined
    let t
    const programar = () => {
      clearTimeout(t)
      t = setTimeout(() => { dormidaRef.current = true; setDormida(true) }, ms)
    }
    const actividad = () => {
      if (dormidaRef.current) {
        dormidaRef.current = false
        setDormida(false)
        despertarRef.current?.()
      }
      programar()
    }
    EVENTOS.forEach((e) => window.addEventListener(e, actividad, { passive: true, capture: true }))
    programar()
    return () => {
      clearTimeout(t)
      EVENTOS.forEach((e) => window.removeEventListener(e, actividad, { capture: true }))
    }
  }, [ms])

  return ms ? dormida : false
}
