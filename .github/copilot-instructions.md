# Instrucciones de Copilot para este proyecto

## Contexto del proyecto

Este proyecto es una aplicacion web monolitica construida con Node.js 24, React 19, TypeScript, Vite, Material UI, Emotion, React Router y oxlint.

La aplicacion se desarrollara como un ejercicio practico y se publicara en Azure App Service. Funcionara como un cliente de chat, similar a GPT, que consumira desde Azure AI Foundry los servicios de un agente especializado basado en un modelo de lenguaje (LLM). No incluira un modulo de inicio de sesion. Su responsabilidad principal es ofrecer la interfaz para que las personas interactuen con el agente; la logica del agente y las credenciales de los proveedores deben permanecer fuera del cliente.

Prioriza soluciones mantenibles, tipadas, accesibles y consistentes con la arquitectura existente del repositorio.

## Arquitectura y estructura del proyecto

- Mantiene la aplicacion como un monolito modular. Organiza el codigo por funcionalidades y evita agregar microservicios o capas que no sean necesarias.
- Separa la interfaz, el estado propio de cada funcionalidad y el acceso a servicios. Los componentes de interfaz no deben implementar directamente detalles de comunicacion HTTP o del proveedor del LLM.
- Centraliza la comunicacion con el agente en un cliente de API tipado. El backend debe integrarse con Azure AI Foundry; la aplicacion React solo debe comunicarse con el backend y nunca conectarse directamente a Foundry. Define contratos claros para solicitudes, respuestas y errores; implementa streaming solo si el flujo existente lo necesita.
- Implementa el flujo principal como una experiencia de chat: entrada del usuario, envio al agente, presentacion de respuestas y estados de carga y error.
- No agregues pantallas, rutas, proveedores de estado ni dependencias de autenticacion o inicio de sesion. La aplicacion no maneja cuentas de usuario ni vistas privadas.
- Implementa la integracion con Azure AI Foundry en el backend Node.js, como limite seguro para validar solicitudes, autenticar llamadas, gestionar configuracion y comunicarse con el agente. No expongas credenciales ni endpoints sensibles en el codigo que se ejecuta en el navegador.
- Agrega al `package.json` del backend los paquetes oficiales necesarios para la integracion con Microsoft Foundry: `@azure/ai-projects` y `@azure/identity`. Usa versiones compatibles vigentes y registra los cambios en el archivo de bloqueo. No agregues estos paquetes a las dependencias del cliente si solo se usan desde el servidor; consulta la [documentacion oficial de Microsoft Foundry SDK](https://learn.microsoft.com/en-us/azure/foundry/quickstarts/get-started-code?tabs=typescript) si el SDK o la API del agente requieren paquetes adicionales.
- Usa `DefaultAzureCredential` de `@azure/identity` para autenticar el backend con Azure. Esta autenticacion de servicio a servicio no agrega inicio de sesion ni cuentas de usuario a la aplicacion. En Azure App Service, prefiere una identidad administrada con los permisos necesarios para acceder al proyecto de Foundry; en desarrollo local, sigue el flujo de autenticacion de Azure documentado. Guarda el endpoint del proyecto, el nombre o identificador del agente y cualquier configuracion por entorno, sin codificar secretos.
- Conserva las responsabilidades separadas en el backend: rutas y controladores HTTP, logica de negocio e integracion con el agente.
- Evita duplicar el estado de la conversacion. Mantén mensajes, estado de envio y errores en el nivel que corresponda al flujo de la aplicacion.
- Adapta la siguiente estructura a los archivos existentes. Es una guia, no un requisito para crear carpetas vacias ni mover codigo sin necesidad:

```text
.
├── .github/
│   └── copilot-instructions.md
├── public/                       # Recursos estaticos publicos
├── src/
│   ├── app/                      # Arranque, proveedores y configuracion de rutas
│   ├── features/                 # Funcionalidades agrupadas por dominio
│   │   └── chat/                 # Interfaz y estado de conversacion con el agente
│   ├── shared/                   # Componentes y utilidades verdaderamente compartidos
│   ├── services/                 # Cliente API y adaptadores tipados para el agente
│   ├── theme/                    # Tema y personalizacion de Material UI
│   └── main.tsx                  # Punto de entrada de React
├── tests/                        # Pruebas, si el proyecto las incorpora
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

El backend Node.js que integra Azure AI Foundry puede organizarse bajo `server/`, separando rutas/controladores, servicios e integracion con el agente. Manten sus dependencias y configuracion diferenciadas de las del cliente cuando el proyecto lo requiera.

## Principios generales

- Responde y documenta en espanol cuando el usuario escriba en espanol.
- Antes de modificar codigo, revisa el archivo relacionado, sus imports, componentes vecinos y convenciones locales.
- Haz cambios pequenos, enfocados y faciles de revisar.
- No reescribas archivos completos si una modificacion puntual resuelve el problema.
- No introduzcas dependencias nuevas sin una justificacion clara y sin actualizar la documentacion necesaria.
- No elimines codigo, configuracion o estilos existentes salvo que sea necesario para cumplir el requerimiento.
- Conserva el estilo actual del proyecto: nombres, organizacion de carpetas, patrones de componentes y convenciones de TypeScript.

## Stack y comandos

- Usa Node.js 24 como version objetivo.
- Usa `npm` salvo que el repositorio ya incluya otro gestor de paquetes con lockfile.
- Prepara y valida la aplicacion para su publicacion en Azure App Service usando la configuracion existente. No agregues infraestructura, recursos de Azure ni configuracion de despliegue nueva salvo que la tarea lo requiera.
- Comandos principales:
  - `npm run dev` para desarrollo local.
  - `npm run build` para validar TypeScript y generar el build de Vite.
  - `npm run lint` para revisar calidad con oxlint.
  - `npm run preview` para servir el build localmente.
- Despues de cambios relevantes, valida con el comando mas especifico disponible. Si el cambio toca TypeScript, rutas, componentes o configuracion de Vite, ejecuta al menos `npm run build` cuando sea posible.

## TypeScript

- Escribe TypeScript estricto y explicito en contratos publicos: props, parametros, retornos de funciones reutilizables y estructuras compartidas.
- Evita `any`. Si no hay alternativa inmediata, prefiere `unknown` y valida el tipo antes de usarlo.
- Define tipos cerca del codigo que los usa cuando sean locales; mueve tipos a archivos compartidos solo si se reutilizan en mas de un modulo.
- Usa discriminated unions, tipos literales y genericos simples cuando mejoren la seguridad sin agregar complejidad innecesaria.
- No ignores errores de TypeScript con `@ts-ignore` o `@ts-expect-error` salvo que exista una razon documentada y puntual.

## React

- Usa componentes funcionales y hooks modernos.
- Mantiene los componentes pequenos y orientados a una responsabilidad clara.
- Evita estado derivado innecesario; calcula valores desde props o estado existente cuando sea razonable.
- Usa `useEffect` solo para sincronizar con sistemas externos, suscripciones, almacenamiento, red o APIs del navegador.
- No uses `useMemo` o `useCallback` por defecto. Agregalos solo cuando exista una razon concreta de rendimiento o estabilidad referencial.
- Extrae hooks personalizados cuando una pieza de logica de UI se reutilice o cuando mejore claramente la lectura del componente.
- Maneja estados de carga, error, vacio y exito en las interfaces que dependan de datos externos.

## Routing y navegacion

- Usa `react-router-dom` siguiendo los patrones existentes del proyecto.
- Mantiene las rutas centralizadas o consistentes con la estructura actual.
- No agregues proteccion de rutas ni vistas privadas: el alcance actual no incluye autenticacion. Revisa esta instruccion solo si el requerimiento cambia.
- Evita rutas hardcodeadas repetidas; reutiliza constantes o helpers si ya existen.

## UI, accesibilidad y Material UI

- Usa Material UI como sistema principal de componentes cuando aplique.
- Prefiere componentes existentes del proyecto antes de crear variantes nuevas.
- Mantiene consistencia visual en espaciado, tipografia, colores, iconos y estados interactivos.
- Usa componentes semanticos y accesibles: labels asociados a inputs, textos alternativos cuando correspondan, roles solo cuando sean necesarios y navegacion por teclado funcional.
- No dependas solo del color para comunicar estado; incluye texto, iconos o atributos accesibles.
- Cuida disenos responsivos para escritorio y movil.
- Evita textos largos dentro de botones o contenedores pequenos si pueden romper el layout.

## Estilos

- Usa las herramientas ya presentes: Material UI, Emotion y estilos existentes.
- Prefiere `sx`, componentes estilizados o patrones locales ya usados en el repositorio.
- Evita CSS global salvo para estilos base realmente globales.
- No introduzcas una nueva libreria de estilos si Material UI o Emotion resuelven el caso.
- Mantiene nombres de clases y variables claros, descriptivos y consistentes.

## Calidad, seguridad y mantenibilidad

- Valida entradas de usuario antes de usarlas en filtros, formularios, consultas o navegacion.
- No expongas secretos, tokens, credenciales ni URLs sensibles en el cliente.
- No registres datos sensibles en consola.
- Maneja errores de forma explicita y comprensible para el usuario.
- Evita duplicacion significativa; extrae funciones o componentes solo cuando reduzcan complejidad real.
- Mantiene funciones puras para transformaciones de datos siempre que sea posible.
- Prefiere nombres descriptivos sobre abreviaturas.

## Pruebas y validacion

- Si existen pruebas, agrega o actualiza pruebas para cambios con logica de negocio, validaciones o flujos criticos.
- Si no existe infraestructura de pruebas, valida con `npm run lint` y `npm run build`.
- No modifiques snapshots, configuracion de lint o reglas de TypeScript para ocultar errores sin justificarlo.
- Reporta claramente cualquier validacion que no se pudo ejecutar y por que.

## Git y cambios en el repositorio

- No hagas commits ni crees ramas a menos que el usuario lo pida.
- No reviertas cambios ajenos sin autorizacion explicita.
- Evita formateos masivos que mezclen cambios funcionales con ruido de estilo.
- Al finalizar, resume los archivos modificados y las validaciones ejecutadas.

## Preferencias de implementacion

- Corrige la causa raiz antes que aplicar parches superficiales.
- Usa APIs nativas del navegador y del lenguaje cuando sean suficientes.
- Favorece soluciones simples, legibles y evolutivas.
- Cuando haya varias opciones validas, elige la que mejor encaje con el patron actual del proyecto y explica brevemente el motivo.
