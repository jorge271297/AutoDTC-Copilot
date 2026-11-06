# Instrucciones del proyecto

## Contexto y alcance

- Aplicacion monolitica con Node.js 24, Next.js App Router, React 19, TypeScript y Material UI 9; se despliega en Azure App Service.
- La unica funcionalidad de producto es el chat de orientacion automotriz y diagnostico OBD-II. No agregar registro de clientes, inicio de sesion ni nuevas secciones sin solicitud explicita.
- El chat consulta un agente de Microsoft Foundry desde el servidor Next.js. Nunca expongas credenciales, tokens ni configuracion privada al navegador.
- Responde y documenta en espanol cuando el usuario escriba en espanol.

## Arquitectura actual

- `src/app/page.tsx` renderiza la pagina principal; `src/features/chat/` contiene la interfaz y el historial de conversaciones; `src/services/` encapsula las llamadas del navegador.
- `src/app/api/chat/route.ts` valida solicitudes y llama a `src/lib/chat.ts`, que integra Foundry con `DefaultAzureCredential`. Mantener esta integracion del lado servidor.
- `src/app/api/health/route.ts` expone el estado de la aplicacion.
- Usar Server Components por defecto. Añadir `"use client"` solo para estado interactivo, efectos o APIs del navegador.
- El historial actual se guarda por perfil de navegador. Sin autenticacion, no guardarlo en un almacén compartido del servidor. SQLite local no es el almacenamiento recomendado para App Service cuando se requiere durabilidad o escalado; en ese caso se debe evaluar una base administrada de Azure.
- Mantener la validacion de entradas, errores HTTP explicitos y los limites actuales del contrato de chat. Mostrar las respuestas del modelo como texto, nunca como HTML sin sanitizar.

## Desarrollo

- Lee los archivos cercanos y las instrucciones vigentes en `node_modules/next/dist/docs/` antes de cambiar APIs de Next.js.
- Usa componentes funcionales, hooks solo cuando sean necesarios y tipos explicitos; evita `any`.
- Reutiliza Material UI, Emotion y el tema de `src/theme/`. Cuida accesibilidad, teclado y diseno adaptable.
- No agregues dependencias, rutas o capas innecesarias. No hagas cambios ajenos al requerimiento ni reviertas cambios previos del usuario.
- Mantener secretos fuera del repositorio y de variables `NEXT_PUBLIC_*`. En App Service, usar configuracion de aplicacion e identidad administrada para Foundry.

## Validacion

- `npm run lint`: ejecuta oxlint sobre `src/`.
- `npm run build`: valida y compila Next.js para produccion.
- El proyecto no declara actualmente un script de pruebas automatizadas.
