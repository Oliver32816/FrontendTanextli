// Cuenta del usuario: registro, inicio de sesión (correo o Google), sesión guardada y contraseña.
import { pedir, obtenerToken, TOKEN_KEY } from './api'
import { olvidarProgreso } from './progreso'

const USER_KEY = 'tanextli_user'

export { obtenerToken }

function guardarSesion(datos) {
  try {
    if (datos.token) localStorage.setItem(TOKEN_KEY, datos.token)
    if (datos.usuario) localStorage.setItem(USER_KEY, JSON.stringify(datos.usuario))
  } catch {
    // sin almacenamiento: la sesión dura mientras la página siga abierta
  }
  return datos.usuario
}

export function actualizarUsuarioGuardado(cambios) {
  const usuario = { ...obtenerUsuarioGuardado(), ...cambios }
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(usuario))
  } catch {
    // sin almacenamiento
  }
  return usuario
}

// Registro con correo y contraseña. Después de crear la cuenta inicia sesión sola.
export async function registrar({ nombre_usuario, correo, password }) {
  await pedir('/registro', { method: 'POST', body: { nombre_usuario, correo, password }, conToken: false })
  return iniciarSesion({ correo, password })
}

export async function iniciarSesion({ correo, password }) {
  const datos = await pedir('/login', { method: 'POST', body: { correo, password }, conToken: false })
  return guardarSesion(datos)
}

// "Continuar con Google": credential es el token que entrega el botón de Google.
// El servidor crea la cuenta si es la primera vez o entra a la que ya existe.
export async function iniciarConGoogle(credential) {
  const datos = await pedir('/auth/google', { method: 'POST', body: { credential }, conToken: false })
  return guardarSesion(datos)
}

export async function cambiarPassword({ actual, nueva }) {
  await pedir('/perfil/password', { method: 'PUT', body: { password_actual: actual, password_nueva: nueva } })
  return actualizarUsuarioGuardado({ debe_cambiar_password: false })
}

// ---- Verificar el correo (código de 6 números enviado al correo de la cuenta) ----
export function enviarCodigoVerificacion() {
  return pedir('/auth/verificacion/enviar', { method: 'POST', body: {} })
}

export async function confirmarCorreo(codigo) {
  const { usuario } = await pedir('/auth/verificacion/confirmar', { method: 'POST', body: { codigo } })
  return actualizarUsuarioGuardado({ ...usuario, correo_verificado: true })
}

// ---- Olvidé mi contraseña: código al correo y luego la contraseña nueva ----
export function pedirCodigoRestablecer(correo) {
  return pedir('/auth/password/olvide', { method: 'POST', body: { correo }, conToken: false })
}

// Cambia la contraseña con el código e inicia sesión
export async function restablecerConCodigo({ correo, codigo, nueva }) {
  const datos = await pedir('/auth/password/restablecer', {
    method: 'POST',
    body: { correo, codigo, password_nueva: nueva },
    conToken: false,
  })
  return guardarSesion(datos)
}

export function obtenerUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

// Al abrir la app: si hay token, pregunta al servidor quién es el usuario.
// Sin internet se usa el usuario guardado para no sacar a la persona de la app.
export async function verificarSesion() {
  if (!obtenerToken()) return null
  try {
    const { usuario } = await pedir('/perfil')
    return guardarSesion({ usuario })
  } catch (err) {
    if (err.sinConexion) return obtenerUsuarioGuardado()
    cerrarSesion()
    return null
  }
}

export async function cerrarSesion() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // sin almacenamiento: no hay nada que borrar
  }
  olvidarProgreso()
}


// Administración (solo lectura, para admin y superuser): lista de cuentas con su último acceso
export async function listarUsuariosEquipo() {
  const { usuarios } = await pedir('/equipo/usuarios')
  return usuarios || []
}