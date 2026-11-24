# Tanextli · Frontend

Aplicación web gamificada para aprender y preservar el náhuatl, con Lobita como guía.
Proyecto de servicio social del Instituto Tecnológico Superior de Libres.

El backend (API, base de datos y audios) vive en su propio repositorio:
[BackendTanextli](https://github.com/Oliver32816/BackendTanextli).

## Tecnologías

- React 19 + Vite
- React Router
- Backend propio (Express + PostgreSQL) con sesión JWT y "Continuar con Google"

## Requisitos

- Node.js 20 o superior

## Configuración

```bash
cp .env.example .env     # en Windows: copy .env.example .env
npm install
```

| Variable | Uso |
|---|---|
| `VITE_API_URL` | Dirección del backend, sin `/` al final |
| `VITE_GOOGLE_CLIENT_ID` | ID de cliente web de Google (vacío desactiva el botón) |
| `VITE_CORREO_CONTACTO` | Correo del aviso de privacidad |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Compila la versión de producción en `dist/` |
| `npm run preview` | Sirve la compilación para revisarla |
| `npm run lint` | Revisa el código con oxlint |

## Estructura

```
src/
├── assets/       imágenes de Lobita
├── components/   piezas reutilizables (Sidebar, Mascota, tarjetas)
├── data/         categorías, lecciones y actividades
├── pages/        pantallas de la app
├── services/     sesión, progreso, preferencias y voz de Lobita
└── styles/       estilos por pantalla
public/           archivos que se sirven tal cual
```

## Producción

La compilación se hace en el servidor (`npm ci && npm run build`); la carpeta `dist/` nunca se sube al repositorio.