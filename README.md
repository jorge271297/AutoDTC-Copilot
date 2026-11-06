# AutoDTC-Copilot

Aplicacion monolitica con Next.js App Router, React, TypeScript y Material UI. La interfaz web y las API se ejecutan desde un solo servidor Next.js, sin servicios adicionales para la aplicacion.

La aplicacion se enfoca unicamente en un chat de orientacion para diagnostico automotriz. Las conversaciones se conservan en el almacenamiento local del navegador y el chat se integra con un agente de Microsoft Foundry desde el servidor, sin exponer credenciales al navegador.

## Requisitos

- Node.js 24 (la version del proyecto esta indicada en `.nvmrc`).
- npm 10 o posterior.
- Para usar el chat localmente: Azure CLI, una cuenta con permisos al proyecto de Foundry y el agente ya creado.

## Inicio rapido

En PowerShell, desde la raiz del proyecto:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). `npm run dev` inicia un solo servidor de desarrollo Next.js.

Para probar el chat, completa las variables de `.env.local` descritas abajo y autentica tu cuenta con:

```powershell
az login
```

No agregues secretos a archivos versionados ni a variables con prefijo `NEXT_PUBLIC_`; ese prefijo hace que Next.js exponga el valor al navegador.

## Configuracion del agente de IA

Completa `.env.local` en desarrollo o configura las mismas variables como **Application settings** en Azure App Service:

| Variable | Descripcion |
| --- | --- |
| `AZURE_AI_PROJECT_ENDPOINT` | Endpoint del proyecto de Microsoft Foundry. |
| `AZURE_AI_AGENT_NAME` | Nombre de un agente existente en ese proyecto, asociado al modelo que se desea probar. |

La plantilla versionada es [.env.example](./.env.example). La autenticacion se realiza con Microsoft Entra ID a traves de `DefaultAzureCredential`:

- **Desarrollo local:** Azure CLI y `az login` con una cuenta autorizada para el proyecto.
- **App Service:** habilita una identidad administrada para la aplicacion y otorga a esa identidad los permisos necesarios en el proyecto de Foundry. No guardes credenciales de Azure en `.env.local` ni en el codigo.

Las instrucciones del agente estan en `src/lib/chat.ts`: orientan las respuestas a codigos DTC/OBD-II, solicitan contexto del vehiculo cuando hace falta y priorizan recomendaciones de seguridad. Si el proveedor no esta configurado o falla, la API responde con un error controlado; no envia los detalles de configuracion al usuario.

## Recorrido de las solicitudes

### Chat

1. La interfaz de `src/features/chat/ChatPage.tsx` recoge los mensajes.
2. `src/services/chat.ts` los envia como JSON a `POST /api/chat`.
3. `src/app/api/chat/route.ts` limita el tamano de la solicitud, valida el contrato y maneja los errores HTTP.
4. `src/lib/chat-validation.ts` verifica los mensajes; `src/lib/chat.ts` consulta Microsoft Foundry usando las credenciales del servidor.
5. La API devuelve `{ "answer": "..." }`. El cliente muestra la respuesta como texto, sin insertar HTML proporcionado por el modelo.

Ejemplo de solicitud:

```json
{
  "messages": [
    { "role": "user", "content": "Que significa el codigo P0301?" }
  ]
}
```

### Historial de conversaciones

El historial se guarda en `localStorage` del navegador y se valida al cargar. Cada perfil de navegador conserva sus propias conversaciones y estas sobreviven a recargas, reinicios y nuevos despliegues de App Service. No se sincronizan entre dispositivos ni se comparten con el servidor.

No se usa SQLite en App Service: la aplicacion no tiene cuentas de usuario para asociar historiales y un archivo SQLite local no es una base compartida y duradera para instancias que pueden reiniciarse o escalarse. Si se requiere historial centralizado o entre dispositivos, se debe agregar autenticacion y una base administrada de Azure.

## Apariencia

El chat ofrece temas claro y oscuro, además de la opción **Sistema (del dispositivo)**, que sigue los cambios de apariencia del sistema operativo. La preferencia se conserva en el navegador.

## Rutas

| Ruta | Metodo | Funcion |
| --- | --- | --- |
| `/` | `GET` | Chat OBD-II. |
| `/api/health` | `GET` | Comprueba que la aplicacion responde; devuelve `{ "status": "ok" }`. |
| `/api/chat` | `POST` | Valida el historial reciente y consulta el agente configurado. |

Las interfaces HTTP se definen en `src/app/**/route.ts`, segun la convencion de Route Handlers de Next.js.

## Estructura del proyecto

```text
src/
  app/
    api/
      chat/route.ts          Endpoint de conversacion con el agente
      health/route.ts        Endpoint de estado
    layout.tsx               Layout HTML y metadatos de Next.js
    page.tsx                 Pagina de inicio
    not-found.tsx            Pagina 404
  features/
    chat/ChatPage.tsx        Interfaz interactiva del chat
    chat/chat-history.ts     Validacion y almacenamiento local del historial
  lib/
    chat.ts                  Cliente de Microsoft Foundry e instrucciones OBD-II
    chat-validation.ts       Validacion de mensajes de chat
    http.ts                  Lectura acotada y validacion basica de JSON
  services/
    chat.ts                  Cliente HTTP del chat
    health.ts                Cliente HTTP del estado de la API
  theme/
    theme.ts                 Tema Material UI
    ThemeRegistry.tsx        Integracion de Material UI con App Router
```

`src/app` define la pagina y los endpoints; `src/features` contiene la interfaz del chat y su historial local; `src/services` encapsula llamadas HTTP del navegador; `src/lib` concentra logica que corre en el servidor. El modulo de Foundry importa `server-only` para evitar que sus dependencias o credenciales se incluyan en el bundle del navegador.

## Comandos

```bash
npm run dev    # Servidor local Next.js con Webpack
npm run lint   # Analisis estatico de src/
npm run build  # Compilacion optimizada para produccion
npm start      # Inicia el build de produccion
```

Webpack esta seleccionado explicitamente en desarrollo y compilacion para evitar un problema de resolucion de una dependencia de Azure con Turbopack en Windows.

## Despliegue en Azure App Service

Next.js requiere un servidor Node.js porque la aplicacion usa Route Handlers y autenticacion del lado del servidor. En App Service:

1. Usa Node.js 24 y despliega el repositorio con su `package-lock.json`.
2. Instala dependencias con `npm ci` y compila con `npm run build`.
3. Configura `npm start` como comando de inicio. Next.js escucha el puerto que le proporciona App Service.
4. En **Configuration → Application settings**, agrega `AZURE_AI_PROJECT_ENDPOINT` y `AZURE_AI_AGENT_NAME`.
5. Habilita la identidad administrada del App Service y dale acceso al proyecto de Microsoft Foundry.

El servidor Next.js atiende la web y las rutas `/api` en el mismo proceso. El historial permanece en el navegador; App Service no necesita un volumen SQLite ni almacenamiento local para conservarlo.
