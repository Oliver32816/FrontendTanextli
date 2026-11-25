// Presencia: mientras la app está abierta y visible, avisa al servidor cada 30 s que sigue en uso.
// Al ocultar la pestaña, bloquear el celular, cerrar la app o cerrar sesión avisa la salida al instante.
// Así "Ahora" en Administración significa de verdad que la persona tiene la app abierta.
import { useEffect } from 'react'
import { pedir, avisarSalida } from './api'

const CADA_MS = 30000

export function useLatido(activo) {
  useEffect(() => {
    if (!activo) return undefined
    let ultimo = 0
    const latir = () => {
      // Solo con la pestaña a la vista y sin repetir en menos de 10 s (al cambiar de pestaña rápido)
      if (document.hidden || Date.now() - ultimo < 10000) return
      ultimo = Date.now()
      pedir('/auth/latido', { method: 'POST' }).catch(() => {
        // Sin conexión o servidor sin esta ruta: se intenta en el siguiente latido
      })
    }
    const salir = () => {
      ultimo = 0
      avisarSalida()
    }
    const alCambiar = () => (document.hidden ? salir() : latir())

    latir()
    const reloj = setInterval(latir, CADA_MS)
    document.addEventListener('visibilitychange', alCambiar)
    window.addEventListener('pagehide', salir)
    return () => {
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', alCambiar)
      window.removeEventListener('pagehide', salir)
    }
  }, [activo])
}
