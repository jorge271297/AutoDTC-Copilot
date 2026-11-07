# Proyecto AutoDTC Copilot

## Práctica especializada: Inteligencia Artificial aplicada en diagnóstico automotriz

### Integrante

Jorge Morales Pérez

---

# Resumen Ejecutivo

El proyecto AutoDTC Copilot surge como respuesta a una necesidad real en el diagnóstico automotriz: muchas personas, desde conductores hasta técnicos y estudiantes, reciben códigos OBD-II y no cuentan con una guía clara para interpretar la falla de forma segura, técnica y estructurada. En la práctica, las fallas se resuelven con reemplazos empíricos, sin analizar condiciones reales de operación ni priorizar riesgos de seguridad.

Con el objetivo de reducir esta incertidumbre, se desarrolló un asistente conversacional especialista en diagnóstico automotriz, construido sobre una arquitectura de Microsoft Azure y una aplicación web en Next.js. La solución combina un agente de IA en Azure AI Foundry con un backend seguro y un flujo de interacción simple para el usuario.

La experiencia está enfocada en responder preguntas de forma útil y técnica, orientando al usuario hacia la identificación de la causa probable, el procedimiento de descarte, la criticidad del problema y las recomendaciones de seguridad antes de intervenir en el vehículo.

---

# Descripción del Problema

El diagnóstico vehicular actual presenta varios retos operativos y de seguridad:

- Interpretación errónea de códigos DTC generados por el sistema OBD-II.
- Reemplazo ciego de sensores y componentes sin validación de diagnóstico.
- Dificultad para distinguir entre fallas reales y síntomas secundarios.
- Falta de contexto técnico para realizar pruebas eléctricas o mecánicas adecuadas.
- Riesgo de operación con fallas críticas como misfires, fugas de combustible o problemas de emisiones.
- Carencia de una guía digital accesible para técnicos, estudiantes y usuarios particulares.

Estos problemas afectan la eficiencia del mantenimiento y pueden derivar en costos innecesarios, fallas repetidas o riesgos para la seguridad vial.

---

# Solución Implementada

Se desarrolló una aplicación web enfocada en análisis de diagnóstico automotriz con lenguaje natural. El sistema está diseñado para responder consultas técnicas sobre códigos de error, síntomas, sensores, actuadores, emisiones y procedimientos de diagnóstico.

La solución incluye:

- Chat conversacional orientado a diagnóstico automotriz.
- Soporte para códigos OBD-II y EOBD en series P, B, C y U.
- Respuestas estructuradas con diagnóstico, causas probables, procedimiento de descarte y nivel de criticidad.
- Integración con Azure AI Foundry para procesamiento del agente intelligent.
- Base de conocimiento técnica para apoyar respuestas con contexto automotriz relevante.
- Interfaz web desarrollada con Next.js, React y Material UI.
- Seguridad de backend con credenciales del lado del servidor y sin exposición de secretos al navegador.

---

# Tecnologías Utilizadas

## Desarrollo

- Visual Studio Code
- Node.js 24
- Next.js App Router
- React 19
- TypeScript
- Material UI

## Servicios en Azure

- Azure AI Foundry
- Azure OpenAI
- Azure App Service
- Microsoft Entra ID / Managed Identity
- Azure AI Search (opcional para conocimiento documental)

## Capacidades de IA

- IA generativa
- Procesamiento de lenguaje natural
- Recuperación aumentada por generación (RAG)
- Soporte de consultas en español
- Respuesta técnica contextualizada

---

# Arquitectura de la Solución

La solución se compone de una aplicación web en Next.js que recibe la conversación del usuario y la envía a un endpoint interno del servidor. Desde el backend, se valida la entrada y se integra con el agente de IA configurado en Azure AI Foundry o Azure OpenAI, según la configuración del entorno.

```text
Usuario
  │
  ▼
Navegador / Web App (Next.js)
  │
  ▼
/src/app/api/chat/route.ts
  │
  ▼
src/lib/chat.ts
  │
  ├── Azure AI Foundry Agent
  │   └── Modelo generativo + contexto técnico
  │
  └── Azure OpenAI (si se configura)
  │
  ▼
Respuesta estructurada al usuario
```

La lógica del servidor se encarga de mantener la seguridad de las credenciales y evitar que información sensible o configuraciones privadas se expongan al cliente.

---

# Módulo 1: Asistente Conversacional de Diagnóstico

## Objetivo

Brindar a usuarios y técnicos una ayuda inmediata para interpretar códigos de falla y obtener recomendaciones técnicas de forma clara y segura.

## Funcionalidades

- Consulta por código DTC, por síntomas o por marca/modelo.
- Respuestas con estructura técnica clara.
- Recomendaciones enfocadas en diagnóstico y no en reemplazos improvisados.
- Enfoque en seguridad y procedimientos de descarte.

## Ejemplo de uso

```text
Usuario: ¿Qué significa el código P0301?

Sistema: El código P0301 indica un fallo de encendido en el cilindro 1. Se recomienda verificar:
- chispa
- inyección
- compresión
- sensor CKP/CMP
- posibles fugas de vacuum
```

---

# Módulo 2: Integración con IA y Contexto Técnico

## Objetivo

Asegurar que las respuestas del asistente estén alineadas con el dominio automotriz y no respondan fuera de contexto.

## Implementación

La lógica del agente se estructura con un prompt de dominio específico y con validaciones de entrada. Este enfoque ayuda a mantener el modelo dentro del contexto de diagnóstico automotriz y a evitar respuestas genéricas o inconsistentes.

El sistema puede utilizar:

- Agente de Azure AI Foundry con instrucciones automotrices.
- Azure OpenAI como alternativa directa en algunos escenarios.
- Validación y control del historial de chat del lado del cliente.

--

# Módulo 3: Historial de Conversación y Experiencia de Usuario

## Objetivo

Mantener una experiencia fluida para el usuario sin requerir autenticación ni persistencia centralizada.

## Implementación

El historial de conversaciones se guarda en el navegador mediante almacenamiento local. Esto permite:

- conservar conversaciones por perfil del navegador,
- mantener continuidad entre recargas,
- evitar almacenamiento compartido en el servidor.

La aplicación mantiene un diseño simple, responsivo y preparado para uso web en distintos dispositivos.

---

# Módulo 4: Seguridad y Control de Acceso

## Objetivo

Evitar la exposición de credenciales y mantener la infraestructura segura.

## Medidas implementadas

- Credenciales y tokens del lado del servidor.
- No se usan variables del navegador con prefijo NEXT_PUBLIC_ para secretos.
- Integración con Managed Identity o credenciales de Azure protegidas.
- Validación de entradas del cliente y control de errores explícitos.
- Desacople del frontend y la lógica IA.

Este enfoque asegura que la aplicación se comporte de forma segura tanto en desarrollo como en despliegue.

---

# IA Responsable

La solución incorpora principios de inteligencia artificial responsable para mantener un uso técnico, confiable y seguro.

## 1. Seguridad
El asistente está orientado a diagnóstico, no a decisiones automáticas de riesgo sin revisión humana. Las sugerencias se presentan como apoyo y no como reemplazo del criterio técnico real.

## 2. Transparencia
El sistema responde como un asistente especializado y no pretende sustituir la experiencia del técnico o del mecánico.

## 3. Equidad
Las recomendaciones se basan en información técnica y de diagnóstico, no en perfiles o características personales.

## 4. Privacidad
La app no requiere datos personales del usuario para operar en su flujo principal.

## 5. Responsabilidad
El usuario sigue siendo responsable de verificar la información y validar la reparación en el vehículo.

---

# Beneficios para el Usuario y la Organización

- Reducción del tiempo de interpretación de códigos de falla.
- Mayor claridad en procesos de diagnóstico.
- Menor dependencia de prueba y error mecánica.
- Estructura de respuesta útil y ordenada.
- Acceso rápido desde una interfaz web moderna.
- Base técnica ampliable para nuevas capacidades de diagnóstico.

---

# Resultados Obtenidos

La aplicación permite:

- consultar códigos DTC y obtener orientación técnica;
- mantener conversaciones rápidas y claras;
- operar con un backend seguro y controlado;
- integrar IA generativa con contexto automotriz;
- ofrecer una solución accesible y ligera para uso web.

---

# Conclusiones

El proyecto AutoDTC Copilot demuestra que es factible crear un asistente especializado para diagnóstico automotriz utilizando tecnologías modernas de Microsoft Azure y Next.js. La combinación de IA generativa, validación del lado del servidor y una experiencia de chat enfocada permite apoyar a usuarios y técnicos en la toma de decisiones más informadas.

La solución representa una base sólida para extensiones futuras, incluyendo búsqueda documental más profunda, integración con información de marcas específicas, históricos de diagnósticos y soporte para escenarios más especializados dentro del taller automotriz.

---

# Anexos

## Estructura principal del proyecto

```text
src/
  app/
    api/
      chat/route.ts
      health/route.ts
    layout.tsx
    page.tsx
    not-found.tsx
  features/
    chat/
      ChatPage.tsx
      chat-history.ts
  lib/
    chat.ts
    chat-validation.ts
    http.ts
  services/
    chat.ts
    health.ts
  theme/
    theme.ts
    ThemeRegistry.tsx
```

## Archivos clave

- `src/app/page.tsx`: punto de entrada de la interfaz principal.
- `src/features/chat/ChatPage.tsx`: vista del chat y flujo de interacción del usuario.
- `src/app/api/chat/route.ts`: endpoint para enviar mensajes al backend.
- `src/lib/chat.ts`: lógica de integración con el agente de IA.
- `src/lib/chat-validation.ts`: validación de mensajes y entradas.
- `src/services/chat.ts`: cliente HTTP del frontend.

## Comandos relevantes

```bash
npm run dev
npm run lint
npm run build
npm start
```

La aplicación está lista para ser usada como prototipo funcional de apoyo a diagnóstico automotriz y como base para futuras ampliaciones en el ámbito técnico y de mantenimiento vehicular.