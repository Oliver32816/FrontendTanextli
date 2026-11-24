// Mide el tamaño disponible de un contenedor y lo actualiza cuando cambia la pantalla.
// Sirve para que Lobita (que se dibuja en píxeles) nunca sea más grande que su espacio.
import { useEffect, useRef, useState } from 'react'

export function useAncho() {
  const ref = useRef(null)
  const [medida, setMedida] = useState({ ancho: 0, alto: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const medir = () => setMedida({ ancho: Math.floor(el.clientWidth), alto: Math.floor(el.clientHeight) })
    medir()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medir)
      return () => window.removeEventListener('resize', medir)
    }
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return [ref, medida]
}

// Lobita mide de alto 1.37 veces su ancho. Se calcula el ancho que cabe en el espacio
// (por ancho y por alto) sin pasar de los límites.
export function tamanoMascota({ ancho, alto }, { factor = 0.75, min = 90, max = 320 } = {}) {
  if (!ancho) return min
  const porAlto = alto ? (alto * 0.92) / 1.37 : Infinity
  return Math.round(Math.max(min, Math.min(max, ancho * factor, porAlto)))
}