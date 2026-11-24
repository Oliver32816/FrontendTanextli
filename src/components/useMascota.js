import { useEffect, useRef, useState } from "react";

// Manejo sencillo de la mascota desde cualquier pantalla:
//   const { estado, mensaje, setEstado, reaccionar, hablar } = useMascota();
//   <Mascota estado={estado} mensaje={mensaje} />
export function useMascota(estadoBase = "reposo") {
  const [estado, setEstado] = useState(estadoBase);
  const [mensaje, setMensaje] = useState("");
  const timer = useRef(null);

  // Cambia a un estado un rato y luego vuelve al base
  //   reaccionar("celebrando", "¡Muy bien!", 2500)
  const reaccionar = (nuevo, texto = "", ms = 2000) => {
    clearTimeout(timer.current);
    setEstado(nuevo);
    setMensaje(texto);
    timer.current = setTimeout(() => {
      setEstado(estadoBase);
      setMensaje("");
    }, ms);
  };

  // Habla en español y mueve la boca mientras dura la voz
  //   hablar("Hola, vamos a empezar")
  const hablar = (texto) => {
    clearTimeout(timer.current);
    setMensaje(texto);

    // si el navegador no tiene voz, solo anima la boca un momento
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      reaccionar("hablando", texto, 2500);
      return;
    }

    window.speechSynthesis.cancel();
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = "es-MX";
    voz.onstart = () => setEstado("hablando");
    voz.onend = () => { setEstado(estadoBase); setMensaje(""); };
    voz.onerror = () => { setEstado(estadoBase); setMensaje(""); };
    window.speechSynthesis.speak(voz);
  };

  useEffect(() => () => {
    clearTimeout(timer.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { estado, mensaje, setEstado, reaccionar, hablar };
}
