import { useEffect, useState } from 'react'
import { decirLobita } from './vozLobita'

// Lobita dice una frase del grupo al abrir la pantalla y devuelve el texto para el globo.
//   grupo:  nombre del grupo en vozLobita.js
//   clave:  cuando cambia, vuelve a hablar (por ejemplo el id de la categoría)
//   ms:     cuánto tiempo se queda el globo después de la última frase
//   activo: false para que no hable
export function useLobita(grupo, { ms = 5000, clave, activo = true } = {}) {
  const [texto, setTexto] = useState(null)

  useEffect(() => {
    if (!activo) return undefined
    let t
    const mostrar = (f) => {
      setTexto(f && f.texto ? f.texto : null)
      clearTimeout(t)
      t = setTimeout(() => setTexto(null), ms)
    }
    mostrar(decirLobita(grupo, { onFrase: mostrar }))
    return () => clearTimeout(t)
  }, [clave, activo]) // eslint-disable-line react-hooks/exhaustive-deps

  return texto
}