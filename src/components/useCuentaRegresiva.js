// Cuenta regresiva en segundos (por ejemplo, para "Reenviar código en 45 s")
import { useEffect, useState } from 'react'

export function useCuentaRegresiva(inicial = 0) {
  const [restante, setRestante] = useState(inicial)
  useEffect(() => {
    if (restante <= 0) return undefined
    const t = setTimeout(() => setRestante((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [restante])
  return [restante, setRestante]
}
