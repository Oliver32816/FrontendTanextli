# Tanextli

Aplicación web gamificada para aprender y preservar el náhuatl.
Proyecto integrador del ITSL.

## Tecnologías

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Autenticación:** correo y contraseña (JWT) y Google (Firebase)

## Estructura

```
proyecto-tanextli/
├── Backend/
│   ├── server.js            ← arranca el servidor
│   ├── data/                ← datos guardados (se crea solo, no se sube)
│   └── src/
│       ├── config/          ← Firebase Admin
│       ├── controllers/     ← lógica de registro e inicio de sesión
│       ├── middlewares/     ← protección de rutas con token
│       ├── models/          ← guardado de usuarios
│       ├── routes/          ← rutas de la API
│       └── utils/           ← funciones de apoyo
│
└── Frontend/interfaz/
    ├── public/              ← imágenes (mascota)
    └── src/
        ├── pages/           ← pantallas de la app
        ├── services/        ← conexión con el backend y Firebase
        ├── App.jsx
        └── main.jsx
```

## Requisitos

- [Node.js](https://nodejs.org/) versión 20 o superior
- Git

## Cómo correrlo

### 1. Clonar el repositorio

```bash
git clone https://github.com/danny1800/proyecto-tanextli.git
cd proyecto-tanextli
```

### 2. Configurar el Backend

```bash
cd Backend
npm install
cp .env.example .env
```

Abre `Backend/.env` y cambia `JWT_SECRET` por un texto largo inventado.

### 3. Configurar el Frontend

```bash
cd ../Frontend/interfaz
npm install
cp .env.example .env
```

### 4. Encender la app

Se necesitan **dos terminales abiertas al mismo tiempo**.

**Terminal 1 – Backend**
```bash
cd Backend
npm run dev
```
Debe decir: `Servidor de Tanextli en http://localhost:5000`

**Terminal 2 – Frontend**
```bash
cd Frontend/interfaz
npm run dev
```
Debe decir: `Local: http://localhost:5173/`

Abre **http://localhost:5173** en el navegador.

## API de autenticación

| Método | Ruta | Qué hace |
|--------|------|----------|
| POST | `/api/registro` | Crea una cuenta con nombre, correo y contraseña |
| POST | `/api/login` | Inicia sesión con correo y contraseña |
| POST | `/api/google-login` | Inicia sesión con Google |
| GET | `/api/perfil` | Devuelve el usuario con sesión iniciada (requiere token) |

## Importante

- **No subir** los archivos `.env` ni las carpetas `node_modules` y `Backend/data`.
  El `.gitignore` ya los excluye.
- Una cuenta creada con Google no tiene contraseña: debe entrar siempre con
  **Continuar con Google**.
- Por ahora los usuarios se guardan en archivos JSON dentro de `Backend/data`.
  Para pasar a MySQL solo se modifica `Backend/src/models/usuario.model.js`.