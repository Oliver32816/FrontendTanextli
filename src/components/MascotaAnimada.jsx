import { useEffect, useState } from "react";
import "./Mascota.css";
import "../styles/dormir.css";
import { useDormir, DORMIR_MS } from "./useDormir";

// ---- Capas (todas miden lo mismo y se apilan en el mismo lugar) ----
import cola from "../assets/mascota/capas/cola.webp";
import antebrazo from "../assets/mascota/capas/antebrazo.webp";
import mano from "../assets/mascota/capas/mano.webp";
import cuerpo from "../assets/mascota/capas/cuerpo.webp";
import orejaI from "../assets/mascota/capas/oreja-i.webp";
import orejaD from "../assets/mascota/capas/oreja-d.webp";
import cabeza from "../assets/mascota/capas/cabeza.webp";
import cejaI from "../assets/mascota/capas/ceja-i.webp";
import cejaD from "../assets/mascota/capas/ceja-d.webp";
import ojoFondoI from "../assets/mascota/capas/ojo-fondo-i.webp";
import ojoFondoD from "../assets/mascota/capas/ojo-fondo-d.webp";
import irisI from "../assets/mascota/capas/iris-i.webp";
import irisD from "../assets/mascota/capas/iris-d.webp";
import pestanasI from "../assets/mascota/capas/pestanas-i.webp";
import pestanasD from "../assets/mascota/capas/pestanas-d.webp";
import ojoMascaraI from "../assets/mascota/capas/ojo-mascara-i.webp";
import ojoMascaraD from "../assets/mascota/capas/ojo-mascara-d.webp";
import sonrisa from "../assets/mascota/capas/sonrisa.webp";

// ---- Expresiones ----
import bocaAbierta from "../assets/mascota/expresiones/bocas/boca-abierta.webp";
import bocaGrande from "../assets/mascota/expresiones/bocas/boca-grande.webp";
import bocaTriste from "../assets/mascota/expresiones/bocas/boca-triste.webp";
import bocaSorpresa from "../assets/mascota/expresiones/bocas/boca-sorpresa.webp";
import bocaHmm from "../assets/mascota/expresiones/bocas/boca-hmm.webp";
import ojoCerradoI from "../assets/mascota/expresiones/ojos/ojo-cerrado-i.webp";
import ojoCerradoD from "../assets/mascota/expresiones/ojos/ojo-cerrado-d.webp";
import ojoFelizI from "../assets/mascota/expresiones/ojos/ojo-feliz-i.webp";
import ojoFelizD from "../assets/mascota/expresiones/ojos/ojo-feliz-d.webp";

// ---- Precarga ----
// Tany se arma con ~30 capas. Si se muestra antes de que TODAS lleguen, se ve "a pedazos"
// (por ejemplo, los ojos en blanco porque el fondo del ojo llegó antes que el iris).
// Por eso se descargan y decodifican todas al abrir la app, y Tany aparece cuando están listas.
const TODAS_LAS_CAPAS = [cola, antebrazo, mano, cuerpo, orejaI, orejaD, cabeza, cejaI, cejaD, ojoFondoI, ojoFondoD, irisI, irisD, pestanasI, pestanasD, ojoMascaraI, ojoMascaraD, sonrisa, bocaAbierta, bocaGrande, bocaTriste, bocaSorpresa, bocaHmm, ojoCerradoI, ojoCerradoD, ojoFelizI, ojoFelizD];
const imagenesListas = []; // se guardan para que el navegador no las descarte
let mascotaLista = false;
const promesaMascota = typeof window === "undefined"
  ? Promise.resolve()
  : Promise.all(
      TODAS_LAS_CAPAS.map((src) => {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        imagenesListas.push(img);
        return (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
      })
    ).then(() => {
      mascotaLista = true;
    });

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
// dormir:  true = se duerme (con "zzz") tras 20 s sin actividad; false = nunca se duerme
// dormida: si se pasa true/false, quien la usa decide cuándo duerme (por ejemplo Mascota.jsx)
// onDespertar: se llama cuando despierta después de haberse dormido
export default function MascotaAnimada({
  estado = "reposo",
  mensaje = "",
  tamano = 240,
  espejo = false,
  vida = true,
  mirada = null,
  entrada = null,
  flotar = false,
  dormir = true,
  dormida: dormidaExterna,
  onDespertar,
}) {
  // Tany aparece (con un suave desvanecido) cuando todas sus capas ya están listas
  const [lista, setLista] = useState(mascotaLista);
  useEffect(() => {
    if (lista) return undefined;
    let vigente = true;
    promesaMascota.then(() => { if (vigente) setLista(true); });
    return () => { vigente = false; };
  }, [lista]);

  const controlada = typeof dormidaExterna === "boolean";
  const dormidaPropia = useDormir(dormir && !controlada ? DORMIR_MS : 0, onDespertar);
  const dormida = controlada ? dormidaExterna : dormidaPropia;

  const nombre = dormida ? "sonolienta" : ESTADOS[estado] ? estado : "reposo";
  const cfg = ESTADOS[nombre];
  if (dormida) {
    vida = false;
    mensaje = "";
    mirada = null;
  }

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

      <div className={`mxa-ancla${dormida ? " dormida" : ""}`}>
        {dormida && (
          <div className="mxa-zzz" aria-hidden="true" style={{ "--zzz": `${Math.max(13, Math.round(tamano * 0.11))}px` }}>
            <span>z</span><span>z</span><span>Z</span>
          </div>
        )}
        {mensaje && flotar && (
          <div className="mxa-flota">
            <div className="mxa-globo">{mensaje}</div>
          </div>
        )}

        <div
          className={`mxa${lista ? "" : " mxa-cargando"}`}
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