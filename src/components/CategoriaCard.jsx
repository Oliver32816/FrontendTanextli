// Tarjeta de una categoría en el menú: ícono flotante, anillo de progreso y estado.
import { Link } from 'react-router-dom'

const RADIO = 26
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

function CategoriaCard({ icono, titulo, descripcion, completadas, total, color, ruta, indice = 0 }) {
  const porcentaje = total ? Math.round((completadas / total) * 100) : 0
  const terminada = completadas >= total
  const estado = terminada ? '¡Completada!' : completadas > 0 ? 'Continuar' : 'Empezar'

  return (
    <Link to={ruta} className={`categoria-card categoria-${color}`} style={{ '--i': indice }}>
      <span className="categoria-marca-agua" aria-hidden="true">{icono}</span>

      <div className="categoria-cabecera">
        <div className="categoria-icono" aria-hidden="true">{icono}</div>

        <div className="categoria-anillo" role="img" aria-label={`${porcentaje}% completado`}>
          <svg viewBox="0 0 64 64">
            <circle className="categoria-anillo-fondo" cx="32" cy="32" r={RADIO} />
            <circle
              className="categoria-anillo-valor"
              cx="32" cy="32" r={RADIO}
              strokeDasharray={CIRCUNFERENCIA}
              style={{ '--desde': CIRCUNFERENCIA, '--hasta': CIRCUNFERENCIA * (1 - porcentaje / 100) }}
            />
          </svg>
          <span>{porcentaje}%</span>
        </div>
      </div>

      <h3>{titulo}</h3>
      <p>{descripcion}</p>

      <div className="categoria-pie">
        <span className="categoria-progreso">{completadas} de {total} lecciones</span>
        <span className={`categoria-estado ${terminada ? 'terminada' : ''}`}>
          {estado} <span aria-hidden="true">{terminada ? '✓' : '→'}</span>
        </span>
      </div>
    </Link>
  )
}

export default CategoriaCard