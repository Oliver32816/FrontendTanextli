import '../styles/cargando.css'

function Cargando({ mensaje = 'Cargando...' }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <div className="cargando-spinner">
        <div className="cargando-anillo"></div>
        <span className="cargando-hoja">🍃</span>
      </div>
      <p>{mensaje}</p>
    </div>
  )
}

export default Cargando