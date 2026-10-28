import { Link } from 'react-router-dom'

function CategoriaCard({ icono, titulo, descripcion, completadas, total, color, ruta }) {
  const porcentaje = Math.round((completadas / total) * 100)

  return (
    <Link to={ruta} className={`categoria-card categoria-${color}`}>
      <div className="categoria-icono">{icono}</div>
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
      <div className="categoria-barra">
        <div className="categoria-barra-relleno" style={{ width: `${porcentaje}%` }}></div>
      </div>
      <span className="categoria-progreso">{completadas}/{total} lecciones</span>
    </Link>
  )
}

export default CategoriaCard