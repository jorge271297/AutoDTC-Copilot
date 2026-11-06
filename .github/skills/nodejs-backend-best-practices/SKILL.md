---
name: nodejs-backend-best-practices
description: 'Buenas practicas para desarrollo backend en Node.js y TypeScript. Usar al crear o modificar APIs REST, servicios, controladores, repositorios, integraciones con base de datos o manejo de configuracion/secretos en un backend Node.js.'
---

# Node.js Backend - Buenas practicas

## Cuando usar
- Disenar o modificar endpoints REST (o GraphQL), controllers, services o repositories.
- Trabajar con configuracion, variables de entorno o secretos.
- Integrar bases de datos (ORMs/query builders) o migraciones.
- Revisar manejo de errores, logging o arquitectura de un servicio Node.js.

## TypeScript en backend
- Tipar contratos publicos: parametros, retornos de funciones reutilizables, DTOs de entrada/salida de la API.
- Evitar `any`; usar `unknown` y validar con un schema (Zod/Joi) antes de confiar en el dato.
- Discriminated unions y tipos literales para resultados de operaciones (ej. `Result<T, E>`).

## Arquitectura
- Separar en capas: routes -> controllers -> services -> repositories. No mezclar acceso a datos con logica de negocio o con el manejo HTTP.
- Inyeccion de dependencias explicita (constructor o factory) en vez de imports directos de instancias globales cuando afecte testabilidad.
- Funciones puras para transformaciones de datos siempre que sea posible.

## APIs REST
- Contratos consistentes: codigos de estado HTTP correctos, formato de error uniforme, paginacion y versionado cuando aplique.
- Validar el body/query/params de cada request con un schema antes de procesar.
- No exponer detalles internos (stack traces, nombres de tablas) en respuestas de error al cliente.

## Configuracion y secretos
- Variables de entorno para configuracion sensible; nunca hardcodear credenciales, tokens o URLs sensibles en el codigo.
- No registrar (log) secretos, tokens ni datos personales.

## Base de datos
- Usar el ORM/query builder del proyecto de forma consistente; parametrizar siempre las consultas (nunca concatenar strings de usuario en SQL).
- Migraciones versionadas y reproducibles; no editar migraciones ya aplicadas en produccion.

## Manejo de errores y logging
- Middleware centralizado de manejo de errores; no usar `try/catch` silenciosos.
- Logging estructurado con contexto util (request id) sin exponer PII o secretos.
- Diferenciar errores esperados (validacion, negocio) de errores inesperados (bugs, infraestructura).

## Async y procesos
- `async/await` consistente; evitar mezclar callbacks y promesas.
- Cancelacion y timeouts en llamadas externas (HTTP, DB) cuando el caso lo amerite.
- Entender el event loop al usar operaciones bloqueantes o CPU-intensivas (mover a worker threads si es necesario).

## Checklist rapido antes de terminar
1. Inputs validados con schema antes de usarse.
2. Sin secretos ni datos sensibles en logs o respuestas de error.
3. Consultas a base de datos parametrizadas.
4. Errores manejados de forma explicita y consistente con el resto del proyecto.
