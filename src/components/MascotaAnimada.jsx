import { useEffect, useState } from "react";
import "./Mascota.css";

// ---- Capas (todas miden lo mismo y se apilan en el mismo lugar) ----
import cola from "../assets/mascota/capas/cola.png";
import antebrazo from "../assets/mascota/capas/antebrazo.png";
import mano from "../assets/mascota/capas/mano.png";
import cuerpo from "../assets/mascota/capas/cuerpo.png";
import orejaI from "../assets/mascota/capas/oreja-i.png";
import orejaD from "../assets/mascota/capas/oreja-d.png";
import cabeza from "../assets/mascota/capas/cabeza.png";
import cejaI from "../assets/mascota/capas/ceja-i.png";
import cejaD from "../assets/mascota/capas/ceja-d.png";
import ojoFondoI from "../assets/mascota/capas/ojo-fondo-i.png";
import ojoFondoD from "../assets/mascota/capas/ojo-fondo-d.png";
import irisI from "../assets/mascota/capas/iris-i.png";
import irisD from "../assets/mascota/capas/iris-d.png";
import pestanasI from "../assets/mascota/capas/pestanas-i.png";
import pestanasD from "../assets/mascota/capas/pestanas-d.png";
import ojoMascaraI from "../assets/mascota/capas/ojo-mascara-i.png";
import ojoMascaraD from "../assets/mascota/capas/ojo-mascara-d.png";
import sonrisa from "../assets/mascota/capas/sonrisa.png";

// ---- Expresiones ----
import bocaAbierta from "../assets/mascota/expresiones/bocas/boca-abierta.png";
import bocaGrande from "../assets/mascota/expresiones/bocas/boca-grande.png";
import bocaTriste from "../assets/mascota/expresiones/bocas/boca-triste.png";
import bocaSorpresa from "../assets/mascota/expresiones/bocas/boca-sorpresa.png";
import bocaHmm from "../assets/mascota/expresiones/bocas/boca-hmm.png";
import ojoCerradoI from "../assets/mascota/expresiones/ojos/ojo-cerrado-i.png";
import ojoCerradoD from "../assets/mascota/expresiones/ojos/ojo-cerrado-d.png";
import ojoFelizI from "../assets/mascota/expresiones/ojos/ojo-feliz-i.png";
import ojoFelizD from "../assets/mascota/expresiones/ojos/ojo-feliz-d.png";

// ---- Estados ----
// boca:   sonrisa | hablando | grande | triste | sorpresa | hmm
// ojos:   abiertos | felices | cerrados
// mirada: hacia dónde miran las pupilas [x, y] (x: -8 izquierda ... 4 derecha · y: -3 arriba ... 6 abajo)
// vivo:   si es true, de vez en cuando mira a los lados y mueve una oreja por su cuenta
// Los movimientos (brazo, mano, orejas, cola, cabeza, cuerpo) de cada estado están en Mascota.css
export const ESTADOS = {
  reposo:      { boca: "sonrisa",  ojos: "abiertos", mirada: [0, 0],   vivo: true  },
  saludando:   { boca: "sonrisa",  ojos: "abiertos", mirada: [0, 0],   vivo: false },
  hablando:    { boca: "hablando", ojos: "abiertos", mirada: [0, 0],   vivo: true  },
  escuchando:  { boca: "sonrisa",  ojos: "abiertos", mirada: [0, 0],   vivo: true  },
  pensando:    { boca: "hmm",      ojos: "abiertos", mirada: [-7, -3], vivo: false },
  feliz:       { boca: "sonrisa",  ojos: "felices",  mirada: [0, 0],   vivo: false },
  celebrando:  { boca: "grande",   ojos: "felices",  mirada: [0, 0],   vivo: false },
  triste:      { boca: "triste",   ojos: "abiertos", mirada: [-2, 6],  vivo: false },
  sorprendida: { boca: "sorpresa", ojos: "abiertos", mirada: [0, -3],  vivo: false },
  error:       { boca: "triste",   ojos: "abiertos", mirada: [-4, 5],  vivo: false },
  // NUEVOS: cada uno tiene su propio movimiento de cuerpo
  bailando:    { boca: "grande",   ojos: "felices",  mirada: [0, 0],   vivo: false },
  pirueta:     { boca: "grande",   ojos: "felices",  mirada: [0, 0],   vivo: false },
  emocionada:  { boca: "grande",   ojos: "abiertos", mirada: [0, -2],  vivo: false },
  agradecida:  { boca: "sonrisa",  ojos: "felices",  mirada: [0, 0],   vivo: false },
  curiosa:     { boca: "sonrisa",  ojos: "abiertos", mirada: [-8, -1], vivo: true  },
  timida:      { boca: "sonrisa",  ojos: "abiertos", mirada: [-8, 5],  vivo: false },
  orgullosa:   { boca: "sonrisa",  ojos: "abiertos", mirada: [3, -3],  vivo: false },
  sonolienta:  { boca: "sonrisa",  ojos: "cerrados", mirada: [0, 0],   vivo: false },
};

// Miradas "al azar" cuando está viva (en unidades del lienzo de 640 px)
const MIRADAS_AL_AZAR = [[-8, 0], [-5, -2], [3, 0], [0, 3], [-6, 3], [2, -2]];

function Ojo({ lado, fondo, iris, pestanas, mascara }) {
  const mask = `url("${mascara}")`;
  return (
    <div className={`m-ojo m-ojo-${lado}`}>
      <img className="m-capa" src={fondo} alt="" draggable="false" />
      {/* El iris se mueve, pero solo se ve dentro del ojo */}
      <div className="m-iris-clip" style={{ WebkitMaskImage: mask, maskImage: mask }}>
        <div className="m-iris-mov">
          <img className="m-capa" src={iris} alt="" draggable="false" />
        </div>
      </div>
      <img className="m-capa" src={pestanas} alt="" draggable="false" />
    </div>
  );
}

// espejo:  voltea a la mascota (para que mire hacia el lado donde esté el formulario o el contenido)
// vida:    true = parpadea, mira a los lados y mueve las orejas sola; false = solo hace lo del estado
// mirada:  [x, y] para forzar hacia dónde mira (si no se pone, usa la del estado)
// entrada: cómo aparece al abrirse la pantalla: "rebote" | "deslizar" | "asomar" | "zoom" | "aparecer"
// flotar:  true = el globo de texto flota encima de la mascota SIN mover el resto de la pantalla
export default function MascotaAnimada({
  estado = "reposo",
  mensaje = "",
  tamano = 240,
  espejo = false,
  vida = true,
  mirada = null,
  entrada = null,
  flotar = false,
}) {
  const nombre = ESTADOS[estado] ? estado : "reposo";
  const cfg = ESTADOS[nombre];

  const [azar, setAzar] = useState(null);   // mirada al azar
  const [mueve, setMueve] = useState(null); // oreja que se mueve: "i" | "d" | null

  // Mira a los lados de vez en cuando
  useEffect(() => {
    if (!vida || !cfg.vivo) {
      setAzar(null);
      return undefined;
    }
    let t;
    const siguiente = () => {
      t = setTimeout(() => {
        setAzar(MIRADAS_AL_AZAR[Math.floor(Math.random() * MIRADAS_AL_AZAR.length)]);
        t = setTimeout(() => {
          setAzar(null);
          siguiente();
        }, 900 + Math.random() * 1200);
      }, 1800 + Math.random() * 3200);
    };
    siguiente();
    return () => clearTimeout(t);
  }, [vida, cfg.vivo]);

  // Mueve una oreja de vez en cuando
  useEffect(() => {
    if (!vida) return undefined;
    let t;
    let t2;
    const siguiente = () => {
      t = setTimeout(() => {
        setMueve(Math.random() < 0.5 ? "i" : "d");
        t2 = setTimeout(() => setMueve(null), 700);
        siguiente();
      }, 4000 + Math.random() * 6000);
    };
    siguiente();
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [vida]);

    const [mx, my] = mirada || azar || cfg.mirada;

  return (
    <div className="mxa-contenedor">
      {mensaje && !flotar && <div className="mxa-globo">{mensaje}</div>}

      <div className="mxa-ancla">
        {mensaje && flotar && (
          <div className="mxa-flota">
            <div className="mxa-globo">{mensaje}</div>
          </div>
        )}

        <div
          className="mxa"
          role="img"
          aria-label="Mascota de Tanextli"
          data-estado={nombre}
          data-boca={cfg.boca}
          data-ojos={cfg.ojos}
          style={{
            "--u": `${tamano / 640}px`,
            "--mx": mx,
            "--my": my,
            transform: espejo ? "scaleX(-1)" : undefined,
          }}
        >
          <div className="mxa-lienzo">
            <div className={`m-entrada${entrada ? ` m-entrada-${entrada}` : ""}`}>
              <div className="m-todo">
                {/* Detrás del cuerpo */}
                <img className="m-capa m-cola" src={cola} alt="" draggable="false" />

                {/* Brazo: gira desde el hombro; la mano gira además desde la muñeca */}
                <div className="m-brazo">
                  <div className="m-mano-g">
                    <img className="m-capa" src={mano} alt="" draggable="false" />
                  </div>
                  <img className="m-capa" src={antebrazo} alt="" draggable="false" />
                </div>

                <img className="m-capa" src={cuerpo} alt="" draggable="false" />

                {/* Cabeza y todo lo de la cara se mueven juntos */}
                <div className="m-cabeza-pose">
                  <div className="m-cabeza-anim">
                    <div className={`m-oreja m-oreja-i${mueve === "i" ? " mueve" : ""}`}>
                      <img className="m-capa" src={orejaI} alt="" draggable="false" />
                    </div>
                    <div className={`m-oreja m-oreja-d${mueve === "d" ? " mueve" : ""}`}>
                      <img className="m-capa" src={orejaD} alt="" draggable="false" />
                    </div>

                    <img className="m-capa" src={cabeza} alt="" draggable="false" />

                    <img className="m-capa m-ceja-i" src={cejaI} alt="" draggable="false" />
                    <img className="m-capa m-ceja-d" src={cejaD} alt="" draggable="false" />

                    {/* Ojos abiertos (con pupilas que se mueven) */}
                    <div className="m-ojos m-ojos-abiertos">
                      <div className="m-pestaneo-abre">
                        <Ojo lado="i" fondo={ojoFondoI} iris={irisI} pestanas={pestanasI} mascara={ojoMascaraI} />
                        <Ojo lado="d" fondo={ojoFondoD} iris={irisD} pestanas={pestanasD} mascara={ojoMascaraD} />
                      </div>
                    </div>
                    {/* Ojos cerrados que aparecen un instante al parpadear */}
                    <div className="m-ojos m-ojos-pestaneo">
                      <div className="m-pestaneo-cierra">
                        <img className="m-capa" src={ojoCerradoI} alt="" draggable="false" />
                        <img className="m-capa" src={ojoCerradoD} alt="" draggable="false" />
                      </div>
                    </div>
                    <div className="m-ojos m-ojos-felices">
                      <img className="m-capa" src={ojoFelizI} alt="" draggable="false" />
                      <img className="m-capa" src={ojoFelizD} alt="" draggable="false" />
                    </div>
                    <div className="m-ojos m-ojos-cerrados">
                      <img className="m-capa" src={ojoCerradoI} alt="" draggable="false" />
                      <img className="m-capa" src={ojoCerradoD} alt="" draggable="false" />
                    </div>

                    {/* Bocas */}
                    <img className="m-capa m-boca m-boca-sonrisa" src={sonrisa} alt="" draggable="false" />
                    <img className="m-capa m-boca m-boca-abierta" src={bocaAbierta} alt="" draggable="false" />
                    <img className="m-capa m-boca m-boca-grande" src={bocaGrande} alt="" draggable="false" />
                    <img className="m-capa m-boca m-boca-triste" src={bocaTriste} alt="" draggable="false" />
                    <img className="m-capa m-boca m-boca-sorpresa" src={bocaSorpresa} alt="" draggable="false" />
                    <img className="m-capa m-boca m-boca-hmm" src={bocaHmm} alt="" draggable="false" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}