import '../styles/cargando.css'

function Cargando({ mensaje = 'Cargando…' }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <div className="tx-fondo-decorativo" aria-hidden="true"><span /><span /><span /></div>
      <div className="cargando-logo">
        <span className="cargando-anillo" aria-hidden="true" />
        <img src="/logo.svg" alt="" width="56" height="56" />
      </div>
      <p>{mensaje}</p>
    </div>
  )
}

export default Cargando