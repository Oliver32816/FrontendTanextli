// "Continuar con Google" para la app móvil (Flutter).
// La app abre esta página en el navegador del celular: aquí Google sí permite su botón, porque es
// la misma página web autorizada de Tanextli. Al elegir la cuenta, el token de Google regresa a la
// app con un enlace "intent://" que solo puede abrir el paquete com.tanextli.tanextli.
// La app manda un "estado" al azar: Google lo firma dentro del token (nonce) y la app lo comprueba.
// La página no inicia sesión en la web ni guarda nada: solo entrega el token a la app.
import { useMemo, useState } from 'react'
import BotonGoogle from '../components/BotonGoogle'
import './Auth/AuthScreen.css'

const PAQUETE_APP = 'com.tanextli.tanextli'
const ESTADO_VALIDO = /^[A-Za-z0-9_-]{16,128}$/

function enlaceApp(credential, estado) {
  const datos = `credential=${encodeURIComponent(credential)}&estado=${encodeURIComponent(estado)}`
  return `intent://google?${datos}#Intent;scheme=tanextli;package=${PAQUETE_APP};end`
}

export default function AppGoogle() {
  const estado = useMemo(() => new URLSearchParams(window.location.search).get('estado') || '', [])
  const [enlace, setEnlace] = useState(null)
  const valido = ESTADO_VALIDO.test(estado)

  const alRecibir = (credential) => {
    if (!credential) return
    const url = enlaceApp(credential, estado)
    setEnlace(url)
    window.location.href = url // regresa a la app (si el navegador lo pide, queda el botón)
  }

  return (
    <div style={estilos.pagina}>
      <div className="tx-fondo-decorativo" aria-hidden="true"><span /><span /><span /></div>
      <main style={estilos.tarjeta}>
        <img src="/logo.svg" alt="" width="64" height="64" />
        <h1 style={estilos.titulo}>Tanextli</h1>
        {!valido ? (
          <p style={estilos.texto}>
            Abre esta página desde el botón <strong>Continuar con Google</strong> de la app de Tanextli.
          </p>
        ) : enlace ? (
          <>
            <p style={estilos.texto}>¡Listo! Regresa a la app para terminar de entrar.</p>
            <a href={enlace} style={estilos.boton}>Volver a Tanextli</a>
          </>
        ) : (
          <>
            <p style={estilos.texto}>Elige tu cuenta de Google para entrar a la app.</p>
            <div style={{ width: '100%' }}>
              <BotonGoogle onCredential={alRecibir} nonce={estado} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

const estilos = {
  pagina: {
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background: 'var(--tx-fondo)',
    position: 'relative',
    overflow: 'hidden',
  },
  tarjeta: {
    position: 'relative',
    width: '100%',
    maxWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    padding: '32px 24px',
    borderRadius: 'var(--tx-radio-l)',
    background: 'var(--tx-superficie)',
    border: '1px solid var(--tx-borde)',
    textAlign: 'center',
  },
  titulo: { margin: 0, fontSize: 26, color: 'var(--tx-primario)' },
  texto: { margin: 0, color: 'var(--tx-texto-suave)', lineHeight: 1.5 },
  boton: {
    marginTop: 6,
    padding: '12px 22px',
    borderRadius: 999,
    background: 'var(--tx-verde-400)',
    color: '#0f2e22',
    fontWeight: 700,
    textDecoration: 'none',
  },
}
