import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Mascota from '../components/Mascota' // NUEVO
import {
  leerPreferencias,
  guardarPreferencia,
  restablecerPreferencias,
  obtenerNombreSaludo,
} from '../services/preferencias'
import { reiniciarProgreso } from '../services/progreso'
import { cerrarSesion } from '../services/authService'
import { vozActiva, activarVoz, decirLobita } from '../services/vozLobita' // NUEVO
import { useLobita } from '../services/useLobita' // NUEVO
import '../styles/menu.css'
import '../styles/perfil.css'

// Interruptor de encendido/apagado
function Interruptor({ id, etiqueta, descripcion, activo, onCambiar }) {
  return (
    <div className="cf-opcion">
      <div className="cf-texto">
        <label htmlFor={id}>{etiqueta}</label>
        <p>{descripcion}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={activo}
        className={`cf-switch ${activo ? 'activo' : ''}`}
        onClick={() => onCambiar(!activo)}
      >
        <span className="cf-switch-bolita"></span>
      </button>
    </div>
  )
}

// Una fila de solo lectura (Mi cuenta)
function Dato({ etiqueta, valor }) {
  return (
    <div className="cf-dato">
      <span>{etiqueta}</span>
      <strong>{valor}</strong>
    </div>
  )
}

function Configuracion({ usuario }) {
  const navigate = useNavigate()
  const [preferencias, setPreferencias] = useState(leerPreferencias)
  const [apodo, setApodo] = useState(preferencias.apodo)
  const [aviso, setAviso] = useState({ seccion: '', texto: '' })

  // NUEVO: voz de Lobita (se puede apagar) y frase de ayuda al abrir la pantalla
  const [voz, setVoz] = useState(vozActiva)
  const textoAyuda = useLobita('ayuda', { unaVez: true })

  // NUEVO: reacción momentánea de la mascota (si es null, sigue su rutina)
  const [reaccion, setReaccion] = useState(null)
  const temporizador = useRef(null)
  const reaccionar = (estado) => {
    clearTimeout(temporizador.current)
    setReaccion({ estado, n: Date.now() })
    temporizador.current = setTimeout(() => setReaccion(null), 3500)
  }
  useEffect(() => () => clearTimeout(temporizador.current), [])

  const avisar = (seccion, texto) => setAviso({ seccion, texto })
  const cambiar = (clave, valor) => {
    setPreferencias(guardarPreferencia(clave, valor))
    if (valor) reaccionar('feliz') // NUEVO
  }

  const guardarApodo = () => {
    const limpio = apodo.trim()
    setPreferencias(guardarPreferencia('apodo', limpio))
    setApodo(limpio)
    avisar(
      'personalizacion',
      limpio ? `Listo: Lobita te llamará «${limpio}».` : 'Listo: Lobita usará tu primer nombre.'
    )
    reaccionar('agradecida') // NUEVO
  }

      const reiniciar = async () => {
    if (!window.confirm('¿Seguro que quieres borrar tu progreso? Todas las lecciones volverán a estar bloqueadas.')) return
    try {
      await reiniciarProgreso()
      avisar('cuidado', 'Listo: tu progreso se reinició.')
      reaccionar('animo')
    } catch (err) {
      avisar('cuidado', `No se pudo reiniciar: ${err.message}`)
    }
  }
  const restablecer = () => {
    if (window.confirm('¿Regresar los ajustes a como estaban al principio? Tu progreso no se borra.')) {
      const nuevas = restablecerPreferencias()
      setPreferencias(nuevas)
      setApodo('')
      avisar('cuidado', 'Listo: los ajustes regresaron a como estaban.')
      reaccionar('sorpresa') // NUEVO
    }
  }

  const salir = async () => {
    await cerrarSesion()
    window.location.replace('/')
  }

  const rol = usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : 'Estudiante'

  return (
    <div className="menu-layout">
      <Sidebar />

      <main className="menu-contenido pf-pagina">
        {/* NUEVO: título + mascota */}
        <div className="cf-cabecera">
          <h1 className="pf-titulo">Configuración</h1>
          <div className="cf-mascota">
            {reaccion ? (
              <Mascota estado={reaccion.estado} disparo={reaccion.n} tamano="pequeno" />
            ) : (
              <Mascota rutina="configuracion" tamano="pequeno" entrada="deslizar" mensaje={textoAyuda} flotar />
            )}
          </div>
        </div>

        <div className="cf-grid">
          {/* Personalización */}
          <section className="pf-tarjeta">
            <h3 className="pf-subtitulo">Personalización</h3>

            <div className="cf-campo">
              <label htmlFor="apodo" className="cf-etiqueta">¿Cómo quieres que te llame Lobita?</label>
              <p>Se usa en el saludo del menú. Ahora te dice: «{obtenerNombreSaludo(usuario)}».</p>
              <div className="cf-campo-fila">
                <input
                  id="apodo"
                  type="text"
                  maxLength={20}
                  placeholder="Escribe un apodo"
                  value={apodo}
                  onChange={(e) => setApodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && guardarApodo()}
                />
                <button type="button" className="pf-boton-chico" onClick={guardarApodo}>
                  Guardar
                </button>
              </div>
            </div>

            <Interruptor
              id="letra-grande"
              etiqueta="Letra más grande"
              descripcion="Agranda los textos y botones de toda la app."
              activo={preferencias.letraGrande}
              onCambiar={(v) => cambiar('letraGrande', v)}
            />

            {/* NUEVO: apagar o encender la voz de Lobita */}
            <Interruptor
              id="voz-lobita"
              etiqueta="Voz de Lobita"
              descripcion="Lobita habla al darte la bienvenida, al acertar y al equivocarte."
              activo={voz}
              onCambiar={(v) => {
                setVoz(v)
                activarVoz(v)
                if (v) decirLobita('ayuda')
              }}
            />

            {aviso.seccion === 'personalizacion' && (
              <p className="cf-aviso" role="status">{aviso.texto}</p>
            )}
          </section>

          {/* Mi cuenta */}
          <section className="pf-tarjeta">
            <h3 className="pf-subtitulo">Mi cuenta</h3>
            <Dato etiqueta="Nombre" valor={usuario?.nombre_usuario} />
            <Dato etiqueta="Correo" valor={usuario?.correo} />
            <Dato etiqueta="Tipo de cuenta" valor={rol} />
            <div className="cf-acciones">
              <button type="button" className="pf-boton-chico" onClick={salir}>
                Cerrar sesión
              </button>
            </div>
          </section>

          {/* Ayuda */}
          <section className="pf-tarjeta">
            <h3 className="pf-subtitulo">Ayuda</h3>
            <div className="cf-opcion">
              <div className="cf-texto">
                <span className="cf-etiqueta">Ver la bienvenida otra vez</span>
                <p>Repite el recorrido inicial con Lobita.</p>
              </div>
              <button type="button" className="pf-boton-chico" onClick={() => navigate('/bienvenida')}>
                Ver
              </button>
            </div>
            <div className="cf-opcion">
              <div className="cf-texto">
                <span className="cf-etiqueta">Ver mi avance</span>
                <p>Tus logros, tu siguiente lección y tu vocabulario.</p>
              </div>
              <button type="button" className="pf-boton-chico" onClick={() => navigate('/perfil')}>
                Ir al perfil
              </button>
            </div>
          </section>

          {/* Zona de cuidado */}
          <section className="pf-tarjeta cf-cuidado">
            <h3 className="pf-subtitulo">Zona de cuidado</h3>
            <div className="cf-opcion">
              <div className="cf-texto">
                <span className="cf-etiqueta">Restablecer ajustes</span>
                <p>Quita el apodo y la letra grande. No borra tu progreso.</p>
              </div>
              <button type="button" className="pf-boton-chico" onClick={restablecer}>
                Restablecer
              </button>
            </div>
            <div className="cf-opcion">
              <div className="cf-texto">
                <span className="cf-etiqueta">Reiniciar mi progreso</span>
                <p>Borra las lecciones completadas en este navegador.</p>
              </div>
              <button type="button" className="pf-boton-chico cf-peligro" onClick={reiniciar}>
                Reiniciar
              </button>
            </div>
            {aviso.seccion === 'cuidado' && (
              <p className="cf-aviso" role="status">{aviso.texto}</p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Configuracion