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

Para probar el chat, completa en `.env.local` las variables del proveedor que elegiste, descritas abajo. Solo si usas el agente de Foundry (`AZURE_AI_PROVIDER=foundry`), autentica localmente la cuenta con:

```powershell
az login
```

Con `AZURE_AI_PROVIDER=azure-openai`, configura las variables `AZURE_OPENAI_*`; no necesitas ejecutar `az login` para autenticar esa conexión.

No agregues secretos a archivos versionados ni a variables con prefijo `NEXT_PUBLIC_`; ese prefijo hace que Next.js exponga el valor al navegador.

## Configuracion del agente de IA

Selecciona el proveedor con `AZURE_AI_PROVIDER` en `.env.local` o en **Application settings** de Azure App Service. Si no defines la variable, se conserva la integracion actual (`foundry`).

### Opcion actual: agente de Microsoft Foundry

Usa `AZURE_AI_PROVIDER=foundry` y configura:

| Variable | Descripcion |
| --- | --- |
| `AZURE_AI_PROJECT_ENDPOINT` | Endpoint del proyecto de Microsoft Foundry. |
| `AZURE_AI_AGENT_NAME` | Nombre de un agente existente en ese proyecto, asociado al modelo que se desea probar. |

El codigo recomendado que muestra Foundry usa Python (`azure-ai-projects` y `azure-identity`). Esta aplicacion esta escrita en TypeScript y usa los SDK equivalentes de JavaScript ya incluidos en `package.json`: `@azure/ai-projects` y `@azure/identity`. No es necesario instalar los paquetes de Python.

La integracion en `src/lib/chat.ts` sigue el mismo flujo del ejemplo de Foundry: crea un `AIProjectClient` para el endpoint del proyecto con `DefaultAzureCredential`, obtiene el cliente OpenAI del proyecto, crea una conversacion, envia los mensajes al agente existente con `agent_reference` y elimina la conversacion temporal al terminar. Foundry requiere una conversacion para cada turno de estos agentes. El cliente se autentica desde el servidor; el navegador no recibe credenciales.

En desarrollo, la autenticacion se realiza con Microsoft Entra ID a traves de `DefaultAzureCredential`:

- **Desarrollo local:** Azure CLI y `az login` con una cuenta autorizada para el proyecto.
- **App Service:** habilita una identidad administrada para la aplicacion y otorga a esa identidad los permisos necesarios en el proyecto de Foundry. No guardes credenciales de Azure en `.env.local` ni en el codigo.

Si `az login` ya se realizo pero la llamada falla, confirma que Azure CLI usa el tenant y la suscripcion que contienen el proyecto y que la cuenta tiene el rol/permisos requeridos en Foundry. Reinicia `npm run dev` despues de cambiar `.env.local`.

### Opcion alterna: Azure OpenAI con clave

Usa `AZURE_AI_PROVIDER=azure-openai` para llamar desde el servidor a un deployment de Azure OpenAI mediante Chat Completions. Esta opcion autentica la solicitud con una clave y no requiere que el usuario inicie sesion en Microsoft Entra ID:

Esta opcion llama directamente al deployment del modelo; no ejecuta el agente existente de Foundry ni sus herramientas. Conserva las instrucciones automotrices de esta aplicacion y puede agregar contexto de Azure AI Search con las variables opcionales de abajo.

| Variable | Descripcion |
| --- | --- |
| `AZURE_OPENAI_ENDPOINT` | Endpoint HTTPS del recurso de Azure OpenAI. |
| `AZURE_OPENAI_API_KEY` | Clave de API; solo se lee en el servidor. |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Nombre del deployment del modelo. |
| `AZURE_OPENAI_API_VERSION` | Version de la API de Azure OpenAI. |

Azure AI Search es opcional. Para usarlo, configura las tres variables; si alguna falta, el servidor reporta que la configuracion esta incompleta:

| Variable | Descripcion |
| --- | --- |
| `AZURE_SEARCH_ENDPOINT` | Endpoint HTTPS del servicio Azure AI Search. |
| `AZURE_SEARCH_KEY` | Clave de consulta de Search. |
| `AZURE_SEARCH_INDEX` | Nombre del indice conectado al conocimiento. |

La plantilla versionada es [.env.example](./.env.example). Mantén las claves en `.env.local` o en la configuracion protegida del hosting; nunca uses el prefijo `NEXT_PUBLIC_` para ellas. La ruta `/api/chat` es accesible desde el navegador sin inicio de sesion, por lo que un despliegue publico puede consumir cuota de Azure: agrega controles de uso en el hosting si necesitas limitar abuso.

Las instrucciones del agente estan en `src/lib/chat.ts`: orientan las respuestas a codigos DTC/OBD-II, solicitan contexto del vehiculo cuando hace falta y priorizan recomendaciones de seguridad. Si el proveedor no esta configurado o falla, la API responde con un error controlado; no envia los detalles de configuracion al usuario.

## Recorrido de las solicitudes

### Chat

1. La interfaz de `src/features/chat/ChatPage.tsx` recoge los mensajes.
2. `src/services/chat.ts` los envia como JSON a `POST /api/chat`.
3. `src/app/api/chat/route.ts` limita el tamano de la solicitud, valida el contrato y maneja los errores HTTP.
4. `src/lib/chat-validation.ts` verifica los mensajes; `src/lib/chat.ts` selecciona el proveedor configurado y, para Foundry, crea una conversacion temporal y llama al agente desde el servidor.
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
4. En **Configuration → Application settings**, configura las variables del proveedor elegido (ver abajo) y guarda los cambios.
5. Si eliges `foundry`, configura la identidad administrada siguiendo los pasos de la siguiente seccion. Si eliges `azure-openai`, configura su clave como ajuste protegido; esa opcion no usa la identidad administrada para autenticarse.

El servidor Next.js atiende la web y las rutas `/api` en el mismo proceso. El historial permanece en el navegador; App Service no necesita un volumen SQLite ni almacenamiento local para conservarlo.

### Autenticacion de Foundry desde App Service

En produccion, `DefaultAzureCredential` usa la identidad administrada del App Service. No configures `az login`, `AZURE_CLIENT_SECRET` ni credenciales de usuario en el sitio.

1. En Azure Portal, abre tu **App Service** y ve a **Identity → System assigned**.
2. Cambia **Status** a **On** y selecciona **Save**. Confirma la habilitacion y, si hace falta, copia el **Object (principal) ID** que muestra la pagina.
3. Abre el recurso del proyecto de Foundry indicado por `AZURE_AI_PROJECT_ENDPOINT`. En **Access control (IAM)**, selecciona **Add → Add role assignment**.
4. Selecciona el rol de datos **Azure AI User** (o el rol equivalente minimo que permita ejecutar el agente en tu configuracion de Foundry). En **Members**, elige **Managed identity**, selecciona tu suscripcion y el App Service; confirma que el principal corresponde al Object ID del paso anterior y completa la asignacion.
5. En **App Service → Configuration → Application settings**, configura:

   | Nombre | Valor |
   | --- | --- |
   | `AZURE_AI_PROVIDER` | `foundry` |
   | `AZURE_AI_PROJECT_ENDPOINT` | Endpoint del proyecto de Foundry, con formato `https://<recurso>.services.ai.azure.com/api/projects/<proyecto>`. |
   | `AZURE_AI_AGENT_NAME` | Nombre exacto del agente existente. |

6. Guarda los ajustes y reinicia el App Service para que la aplicacion cargue la configuracion. Luego prueba el chat y revisa **Monitoring → Log stream** si falla.

La asignacion de rol puede tardar unos minutos en propagarse. Asegurate de asignarla al recurso del proyecto de Foundry y a la identidad del App Service correcto, no a tu cuenta personal. No agregues `AZURE_OPENAI_API_KEY` para este flujo.

Para usar en cambio el proveedor directo `azure-openai`, configura `AZURE_AI_PROVIDER=azure-openai` y los ajustes `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT_NAME` y `AZURE_OPENAI_API_VERSION`. Guarda la clave como ajuste de aplicacion protegido y reinicia el sitio; esta opcion llama al modelo directamente, no al agente de Foundry.
