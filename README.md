# Proyecto Etapa 2

Base de una aplicacion web con React, TypeScript y Material UI, junto con una API Node.js. El navegador se comunica unicamente con la API; la integracion con Microsoft Foundry se implementara del lado del servidor.

## Requisitos

- Node.js 24
- npm 10 o posterior

## Desarrollo

```bash
npm install
npm run dev
```

El comando inicia Vite en `http://localhost:5173` y la API en `http://localhost:3001`. Vite redirige las solicitudes `/api` al servidor local.

La API expone `GET /api/health`. Para configurar el servidor localmente, copia `server/.env.example` a `server/.env`.

## Validacion y ejecucion

```bash
npm run lint
npm run build
npm start
```

El build genera el cliente en `dist/` y compila la API en `server/dist/`. En produccion, la API sirve los archivos estaticos del cliente y atiende las rutas `/api`.

## Estructura

- `src/`: aplicacion React, rutas, tema y acceso tipado a la API.
- `server/src/`: API Express y punto de entrada del servidor.
- `server/.env.example`: variables locales y configuracion reservada para Microsoft Foundry.
