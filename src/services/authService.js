const API_URL = import.meta.env.VITE_API_URL || "https://olo.tail0de9ec.ts.net/api";
const TOKEN_KEY = "tanextli_token";
const USER_KEY = "tanextli_user";

async function pedir(endpoint, { method = "GET", body, token } = {}) {
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
    throw new Error("No hay conexión con el servidor. Revisa que el backend esté encendido.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || "Ocurrió un error, intenta de nuevo.");
  return data;
}

function guardarSesion(data) {
  const token = data.token || data.accessToken;
  const usuario = data.usuario || data.user;
  
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (usuario) localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  return usuario;
}

// 1. Registro por correo y contraseña
export async function registrar({ nombre_usuario, correo, password }) {
  const bodyData = {
    nombre_usuario,
    correo,
    email: correo,
    password,
    contrasena: password
  };
  const data = await pedir("/registro", { method: "POST", body: bodyData });
  return guardarSesion(data);
}

// 2. Inicio de sesión por correo y contraseña
export async function iniciarSesion({ correo, password }) {
  const bodyData = {
    correo,
    email: correo,
    password,
    contrasena: password
  };
  const data = await pedir("/login", { method: "POST", body: bodyData });
  return guardarSesion(data);
}

// 3. Función compatible si AuthScreen intenta invocar inicio con Google
export async function iniciarConGoogle() {
  alert("El inicio de sesión con Google no está activo actualmente. Por favor, ingresa con tu correo y contraseña.");
  throw new Error("Inicio con Google deshabilitado temporalmente.");
}

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function obtenerUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export async function verificarSesion() {
  const token = obtenerToken();
  if (!token) return null;
  try {
    const data = await pedir("/perfil", { token });
    const usuario = data.usuario || data.user || data;
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    return usuario;
  } catch {
    cerrarSesion();
    return null;
  }
}

export async function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}