---
name: react-frontend-best-practices
description: 'Buenas prácticas para React y TypeScript en frontend con MUI. Úsalo al crear o modificar componentes, hooks, formularios, estado, APIs, navegación, accesibilidad, seguridad, pruebas y diseño UI con la versión estable de Material UI.'
---

# React + TypeScript Frontend - Buenas prácticas

## Cuándo usar

- Crear o modificar componentes, páginas, layouts, formularios o hooks.
- Consumir APIs REST o GraphQL, o integrar estado del servidor.
- Definir rutas, permisos, autenticación o autorización en la interfaz.
- Revisar rendimiento, accesibilidad, UX, seguridad o mantenibilidad.
- Agregar pruebas de componentes, integración o end-to-end.

## Principios generales

- Mantener componentes pequeños, enfocados y con una sola responsabilidad.
- Separar UI, lógica de negocio y acceso a servicios externos.
- Preferir composición sobre herencia y abstracciones simples sobre genéricas.
- Respetar convenciones del proyecto y evitar refactorizaciones no relacionadas.
- No introducir dependencias nuevas si ya existe una solución adecuada.

## TypeScript y arquitectura

- Tipar props, eventos, hooks, clientes HTTP y contratos públicos.
- Evitar `any`; usa `unknown` cuando el tipo aún no sea confiable.
- Validar datos externos antes de usarlos: APIs, params de URL, localStorage, etc.
- Usar tipos literales y uniones discriminadas para representar estados claros.
- No duplicar contratos de backend si ya existen tipos generados o un cliente centralizado.
- Evitar casts innecesarios con `as` sin comprobar la estructura real.

Ejemplo:

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
```

- Organizar el código por funcionalidad o dominio cuando la app crece.
- Mantener cerca componentes, hooks, servicios, tipos y pruebas relacionados.
- Encapsular llamadas HTTP en clientes/servicios dedicados.
- No mezclar renderizado, fetching, validación y reglas de negocio en un mismo componente.

## React y componentes

- Usar componentes funcionales y hooks.
- Mantener cada componente con una responsabilidad clara.
- Nombrar con intención y extraer lógica cuando sea reutilizable o compleja.
- Evitar mutar props, arreglos o objetos directamente.
- Usar keys estables y únicas; nunca el índice cuando haya orden o eliminación.
- Preferir composición con children, slots o subcomponentes sobre abstracciones prematuras.
- Usar fragmentos cuando no necesites un nodo extra en el DOM.
- No meter lógica compleja dentro de JSX.

## Hooks y estado

- Llamar hooks solo en el nivel superior y nunca dentro de condiciones o ciclos.
- Extraer hooks cuando la lógica sea reutilizable o complique la lectura.
- Mantener dependencias correctas en `useEffect`, `useMemo` y `useCallback`.
- Evitar `useEffect` para derivar valores que pueden calcularse durante render.
- Usar efectos únicamente para sincronizar con sistemas externos.
- Limpiar listeners, timers, suscripciones y requests cancelables.
- Mantener el estado lo más cerca posible de donde se usa.
- No convertir todo en estado global; separar local, global y del servidor.
- Usar actualizaciones funcionales cuando el siguiente valor dependa del anterior.
- No duplicar información que ya pueda derivarse de props o datos del servidor.

## APIs y datos

- Centralizar configuración del cliente HTTP.
- Definir tipos para requests y responses.
- Manejar explícitamente estados de `idle`, `loading`, `success`, `error` y `empty`.
- Validar respuestas antes de actualizar UI o caché.
- Ignorar o cancelar respuestas obsoletas cuando la petición pueda quedar desactualizada.
- No hacer fetch directo en componentes de presentación.
- Evitar `catch` vacíos y no ocultar errores del usuario.
- Configurar timeouts y reintentos solo si la operación lo permite.

## Formularios y validación

- Asociar cada campo a una etiqueta visible o accesible.
- Validar en cliente para mejorar UX, pero nunca como sustituto de validación del backend.
- Usar schemas con Zod, Yup o Valibot si el proyecto ya los usa.
- Mostrar errores cerca del campo y un resumen cuando el formulario sea largo.
- Preservar valores capturados cuando falle el envío.
- Evitar envíos duplicados mientras la acción está en curso.
- Diferenciar errores de validación, negocio, autenticación e infraestructura.
- Normalizar datos antes de enviarlos si es necesario.

## Navegación, accesibilidad y UX

- Definir rutas en un lugar central o siguiendo el patrón del framework.
- Proteger rutas sensibles, pero no depender solo del frontend para autorizar.
- Conservar la ruta destino cuando el usuario requiere autenticación.
- Usar enlaces para navegación y botones para acciones.
- Usar HTML semántico antes de roles ARIA.
- Mantener orden lógico de encabezados, foco visible y controles accesibles por teclado.
- Etiquetar inputs, mensajes de error y estados invisibles de forma clara.
- No depender solo del color para comunicar información.
- Considerar `prefers-reduced-motion`, contraste suficiente y diseños responsivos.
- Dar feedback inmediato al usuario y estados de vacío/carga/error claros.

## Seguridad

- No guardar secretos, client secrets, tokens ni credenciales en frontend.
- Tratar como públicas todas las variables que queden en el bundle del navegador.
- No confiar solo en permisos del cliente; el backend debe validar autorización real.
- Evitar renderizar HTML no sanitizado o `dangerouslySetInnerHTML` con contenido externo.
- Validar y restringir URLs externas antes de usarlas en enlaces o redirecciones.
- Usar `rel="noopener noreferrer"` cuando abras un enlace externo en nueva pestaña.
- No registrar tokens, datos personales ni información sensible en consola.
- Evitar guardar tokens sensibles en `localStorage` si la arquitectura permite cookies HttpOnly, Secure y SameSite.

## Interfaz con MUI (versión estable)

- Si el proyecto usa Material UI, seguir la versión estable oficialmente soportada por el repositorio y evitar dependencias beta o pre-release.
- Preferir componentes de MUI y patrones del sistema de diseño existente antes de crear alternativas propias.
- Usar `sx`, `styled`, `ThemeProvider` o tokens del tema cuando el proyecto ya los emplee; no mezclar estrategias de estilos sin una razón clara.
- Mantener consistencia visual con la paleta, tipografía, espaciado y componentes del tema institucional.
- Aprovechar `Stack`, `Grid`, `Box`, `Dialog`, `Tabs`, `Table`, `DataGrid`, `Autocomplete`, `TextField`, `Button`, `LoadingButton` y otros componentes de MUI conforme la necesidad del caso.
- Para los estados de carga, error, vacío y éxito usar la API de MUI y la UX del proyecto, no componentes ad-hoc que rompan la consistencia.
- Evitar reemplazar componentes de MUI por HTML plano cuando el framework ya define el patrón visual y accesible.
- Cuando se personalicen temas o componentes, hacerlo desde el theme o wrappers reutilizables, no modificando cada instancia individualmente.
- Mantener accesibilidad nativa: labels, aria, focus, keyboard navigation, relaciones semánticas y mensajes de error claros.

## Rendimiento y dependencias

- Medir antes de optimizar; no prematuramente.
- Evitar renders costosos y lógica pesada en el render.
- Usar `memo`, `useMemo` y `useCallback` solo cuando haya una mejora real.
- Implementar code splitting o carga diferida para módulos pesados.
- Optimizar imágenes, virtualizar listas largas y aplicar debounce/throttle solo cuando sea apropiado.
- Revisar tamaño del bundle y evitar dependencias pesadas para tareas simples.
- Antes de agregar una dependencia: confirmar si ya existe solución, revisar mantenimiento, tamaño, licencia y compatibilidad.
- Si se usa MUI, verificar la compatibilidad de la versión instalada con React, TypeScript y el resto del stack del proyecto.

## Pruebas y calidad

- Probar comportamientos observables, no detalles internos.
- Priorizar flujos críticos, validaciones, errores y permisos.
- Usar React Testing Library cuando aplique; usar Vitest/Jest o Playwright/Cypress según el proyecto.
- Buscar elementos como los haría un usuario: rol, etiqueta, nombre accesible o texto.
- Evitar selectores frágiles basados solo en clases o estructura DOM.
- Incluir casos de carga, vacío, éxito, error y permisos cuando corresponda.
- No ocultar defectos con pruebas adaptadas a la salida esperada.
- Mantener lint, tipos y tests green antes de cerrar un cambio.

## Checklist rápido

- El componente tiene una responsabilidad clara.
- Props, eventos, servicios y responses están tipeados.
- No se introdujo `any` ni coerciones inseguras.
- Los datos externos se validan antes de usarlos.
- Hay manejo explícito de carga, vacío, éxito y error.
- Formularios y errores son accesibles.
- La interfaz funciona con teclado y foco visible.
- No se exponen secretos ni tokens en frontend.
- La autorización real sigue en el backend.
- No se renderiza HTML no confiable.
- Los efectos limpian listeners, timers y requests.
- Las listas usan keys estables.
- El diseño es responsivo y evita valores mágicos excesivos.
- No se agregaron dependencias innecesarias.
- Los flujos críticos tienen pruebas.
- No quedaron logs, código muerto ni reglas deshabilitadas sin justificación.

## Resumen

Este skill apunta a React + TypeScript con foco en calidad de código, UX, seguridad, accesibilidad y rendimiento. En lugar de enumerar cientos de detalles, prioriza los patrones que más impactan la mantenibilidad y la robustez de una app frontend real.