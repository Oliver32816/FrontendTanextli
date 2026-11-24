import { useState } from "react";
import Mascota from "./Mascota";
import { useMascota } from "./useMascota";
import contenido from "../data/contenido.json";
import lobita from "../data/lobita.json";

// Página SOLO para comprobar que las palabras y los audios funcionan. No se sube a Git.
export default function PruebaContenido() {
  const { estado, mensaje, reaccionar } = useMascota();
  const [catId, setCatId] = useState(contenido.categorias[0].id);
  const categoria = contenido.categorias.find((c) => c.id === catId);

  // Reproduce un audio (solo funciona después de un clic del usuario)
  const sonar = (ruta) => {
    const audio = new Audio(ruta);
    audio.play().catch((e) => console.error("No se pudo reproducir", ruta, e));
  };

  const decirPalabra = (p) => {
    if (!p.audio) return;
    sonar(p.audio);
    reaccionar("hablando", p.nahuatl ? `${p.espanol}: ${p.nahuatl}` : p.espanol, 2200);
  };

  const decirFrase = (f) => {
    sonar(f.audio);
    reaccionar(f.estadoMascota, f.texto || "", 3500);
  };

  const boton = {
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "#fff",
    color: "#222",
    fontSize: 15,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: 30, display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ minWidth: 300, display: "flex", justifyContent: "center" }}>
        <Mascota estado={estado} mensaje={mensaje} tamano={260} />
      </div>

      <div style={{ maxWidth: 640 }}>
        <h3>Categorías</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {contenido.categorias.map((c) => (
            <button
              key={c.id}
              style={{ ...boton, fontWeight: c.id === catId ? "bold" : "normal" }}
              onClick={() => setCatId(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {!categoria.disponible && (
          <p>Esta categoría aún no está lista (faltan las palabras en el Excel).</p>
        )}

        {categoria.subcategorias.map((sub) => (
          <div key={sub.id}>
            <h4>{sub.nombre} ({sub.palabras.length})</h4>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {sub.palabras.map((p) => (
                <button
                  key={p.id}
                  style={{ ...boton, opacity: p.audio ? 1 : 0.5 }}
                  disabled={!p.audio}
                  onClick={() => decirPalabra(p)}
                >
                  {p.espanol}
                  {p.nahuatl ? ` = ${p.nahuatl}` : ""}
                </button>
              ))}
            </div>
          </div>
        ))}

        <h3>Frases de la mascota</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {lobita.frases.map((f) => (
            <button key={f.id} style={boton} onClick={() => decirFrase(f)}>
              {f.texto || f.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
