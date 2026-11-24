// Número que sube poco a poco hasta su valor (respeta "reducir movimiento")
import { useEffect, useState } from 'react'

export function useContador(valor, ms = 900) {
  const [actual, setActual] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setActual(valor)
      return undefined
    }
    let marco
    const inicio = performance.now()
    const paso = (t) => {
      const avance = Math.min(1, (t - inicio) / ms)
      setActual(Math.round(valor * (1 - Math.pow(1 - avance, 3))))
      if (avance < 1) marco = requestAnimationFrame(paso)
    }
    marco = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(marco)
  }, [valor, ms])
  return actual
}