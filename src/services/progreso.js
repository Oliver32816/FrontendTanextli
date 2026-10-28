// Servicio de Progreso conectado al Backend de Tanextli
const API_URL = import.meta.env.VITE_API_URL || "https://olo.tail0de9ec.ts.net/api";
const TOKEN_KEY = "tanextli_token";

function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function pedir(endpoint, { method = "GET", body } = {}) {
  const token = obtenerToken();
  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No hay conexión con el servidor para actualizar el progreso.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || "Error al sincronizar el progreso.");
  return data;
}

// 1. Obtener cuántas lecciones lleva completadas el usuario en una categoría desde el servidor
export async function cantidadCompletadas(categoriaId) {
  try {
    // Asumiendo que tu ruta en el backend es /progreso?categoria_id=X
    const data = await pedir(`/progreso?categoria_id=${categoriaId}`);
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.error("Error al obtener progreso:", error);
    return 0;
  }
}

// 2. Marca una lección como completada enviándola directamente a tu API y base de datos
export async function marcarLeccionCompletada(categoriaId, leccionId) {
  try {
    // Enviamos el registro al backend para que se guarde en PostgreSQL
    await pedir("/progreso", {
      method: "POST",
      body: {
        categoria_id: categoriaId,
        palabra_id: leccionId // O leccion_id, según el campo que reciba tu tabla
      }
    });
  } catch (error) {
    console.error("Error al guardar lección completada en el servidor:", error);
  }
}