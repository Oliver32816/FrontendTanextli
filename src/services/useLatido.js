// Latido: mientras la app está abierta y visible, avisa al servidor cada minuto que sigue en uso.
// Así "Ahora" en Administración significa de verdad que la persona tiene la app abierta.
import { useEffect } from 'react'
import { pedir } from './api'

const CADA_MS = 60000

export function useLatido(activo) {
  useEffect(() => {
    if (!activo) return undefined
    let ultimo = 0
    const latir = () => {
      // Solo con la pestaña a la vista y sin repetir en menos de 30 s (por ejemplo al cambiar de pestaña rápido)
      if (document.hidden || Date.now() - ultimo < CADA_MS / 2) return
      ultimo = Date.now()
      pedir('/auth/latido', { method: 'POST' }).catch(() => {
        // Sin conexión o servidor sin esta ruta: se intenta en el siguiente minuto
      })
    }
    latir()
    const reloj = setInterval(latir, CADA_MS)
    const alVolver = () => { if (!document.hidden) latir() }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [activo])
}
