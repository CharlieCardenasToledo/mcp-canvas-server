# Plan de modernización profesional de Canvas MCP Server

## Propósito de este documento

Este archivo es el relevo técnico para continuar el trabajo en otra sesión de Codex. Documenta:

- el análisis realizado;
- los cambios ya aplicados;
- el estado exacto y las incidencias actuales;
- el plan de implementación pendiente, en orden;
- las validaciones que deben cerrar cada etapa;
- el diseño propuesto para releases automáticos mediante GitHub Actions.

No se realizó ningún commit, push, tag, release ni publicación en npm.

## Actualización de continuidad — 1 de agosto de 2026

Esta sección sustituye el estado operativo descrito más abajo, que se conserva como historial del relevo anterior.

- **Etapa 1 completada:** resources reparados, registro único, annotations y perfiles seguros cubiertos por tests.
- **Etapa 2 completada:** `src/index.ts` usa la fábrica MCP, la versión de `package.json` y renovación de token opt-in.
- **Etapa 3 completada:** `serve-http` ofrece MCP Streamable HTTP real en `/mcp`; `serve-rest` queda separado.
- MCP HTTP usa loopback por defecto, sesiones aisladas, Bearer para binds remotos, Host/Origin allowlists, límites de cuerpo y sesiones, rate limiting, expiración, `/healthz` y graceful shutdown.
- REST usa loopback por defecto, exige `REST_AUTH_TOKEN` fuera de loopback, identifica correctamente su API y ya no contiene una ruta personal de auditoría.
- Se añadieron 14 tests para registry, perfiles, annotations, resources, metadata, factory MCP y seguridad/ciclo de sesión HTTP.
- `npm run check` pasa completo: formato, ESLint, typecheck de fuentes/tests, 14 tests y build limpio.
- `npm audit --audit-level=high` informa 0 vulnerabilidades.
- `npm run package:smoke` pasa en Windows; se corrigió el manejo de rutas con espacios sin `shell: true`.
- `git diff --check` pasa; solo muestra advertencias informativas de normalización LF/CRLF.
- No se realizó commit, push, tag, release ni publicación.

**Siguiente bloque recomendado:** comenzar la Etapa 4 (endurecimiento de `CanvasClient`) y sus tests HTTP con mocks.

## Estado actual del repositorio

- Rama: `main`, originalmente sincronizada con `origin/main` en `v1.2.3`.
- Node local validado: `v24.16.0`.
- Hay archivos académicos sin seguimiento que pertenecen al usuario y no deben modificarse:
    - `paper_ticec2026.md`
    - `ticec-track-cientifico-snapshot.md`
    - `ticec2026_latex/`
- El mecanismo nativo `apply_patch` de la sesión anterior falló por `windows sandbox: helper_unknown_error`.
  Los cambios se aplicaron mediante diffs controlados con `git apply` fuera del helper.
- La última corrección de resources fue interrumpida por el usuario y **no se aplicó**.
- El proyecto **no compila en este instante** por tres líneas desplazadas en los resources. La reparación exacta está en la siguiente sección.

## Reparación inmediata obligatoria

Antes de continuar cualquier otra etapa, corregir estos dos archivos:

1. En `src/common/tool-model.ts`, `templates` debe quedar dentro de `ResourceManager`:

```ts
export interface ResourceManager {
    list: Resource[];
    templates: ResourceTemplate[];
    read: (uri: URL, client: CanvasClient) => Promise<ReadResourceResult>;
}
```

Eliminar la línea suelta `templates: ResourceTemplate[];` que actualmente está después de la llave de cierre.

2. En `src/resources/canvas-resources.ts`, el bloque de `pageId` debe validarse antes de llamar al cliente:

```ts
if (subResource === "pages") {
    const pageId = pathParts[3];
    if (!pageId) {
        throw new Error("Missing Canvas page ID");
    }
    const page = await client.getPage(courseId, pageId);
    return {
        contents: [
            {
                uri: uri.toString(),
                mimeType: "text/html",
                text: page.body || ""
            }
        ]
    };
}
```

Y el export final debe ser:

```ts
export const canvasResources: ResourceManager = {
    list: resources,
    templates,
    read: readResource
};
```

Después ejecutar:

```bash
npm run typecheck
```

## Trabajo completado

### 1. Línea base y auditoría

Se inspeccionaron estructura, fuentes, configuración, dependencias, Docker, workflows, publicación, recursos MCP y cliente Canvas.

Hallazgos principales:

- 125 declaraciones de tools y 121 nombres únicos.
- Cuatro tools duplicadas entre `quiz-tools.ts` y `quiz-question-tools.ts`:
    - `canvas_list_quiz_questions`
    - `canvas_create_quiz_question`
    - `canvas_update_quiz_question`
    - `canvas_delete_quiz_question`
- `uniqueTools()` ocultaba silenciosamente los duplicados.
- README, descripción de GitHub y runtime informaban cantidades/versiones distintas.
- `package.json` estaba en `1.2.3`, pero CLI y servidor declaraban `1.2.0`.
- `serve-http` era realmente una API REST Fastify sin autenticación, enlazada a `0.0.0.0`; no era Streamable HTTP MCP.
- `/chat` y `/audit` podían exponer todas las tools; `/audit` contenía una ruta personal predeterminada.
- Las tools de configuración y access tokens permitían persistir, crear, regenerar y devolver credenciales al modelo.
- Las tools de archivos aceptaban rutas locales arbitrarias.
- No había confirmación humana ni `dry_run` consistente para operaciones de alto impacto.
- Resolución de cursos/estudiantes por coincidencia parcial usaba el primer resultado, incluso con ambigüedad.
- `CanvasClient` no tenía timeout, retry/backoff, límite de paginación ni validación same-origin de links siguientes.
- Los resources usaban un URI con placeholders como resource concreto; además se interpretaba mal `URL.hostname`.
- No había tests, lint, formatter, lockfile ni limpieza de `dist`.
- `package-lock.json` estaba explícitamente ignorado.
- Docker usaba Node 18, incompatible con la base profesional propuesta y desactualizado para Fastify 5.
- CI solo compilaba en Ubuntu/Node 20 mediante `npm install`.
- Publish usaba `NPM_TOKEN` de larga duración y no validaba tag, versión, tarball o procedencia.
- No existían CodeQL ni Dependabot.
- El branch `main` no tenía protección observada.
- El build anterior dejaba artefactos obsoletos dentro de `dist`.

### 2. Dependencias y reproducibilidad

Cambios ya aplicados en `package.json`:

- Node mínimo: `>=22.14.0`.
- MCP SDK: `^1.30.0`.
- Axios: `^1.19.0`.
- Fastify: `^5.11.0`.
- Swagger UI: `^6.1.1`.
- TypeScript: `^5.9.3`.
- Se añadieron ESLint 9, typescript-eslint y Prettier.
- Se añadieron scripts `clean`, `typecheck`, `lint`, `format`, `format:check`, `test`, `check`, `package:smoke` y `release:check`.
- `build` ahora limpia `dist` antes de compilar.
- `files` publica `dist`, documentación y licencia.
- Se añadió `mcpName: io.github.charliecardenastoledo/canvas-lms` para metadata de registro MCP.
- Se eliminó `package-lock.json` de `.gitignore`.
- Se generó un nuevo `package-lock.json` mediante `npm install`.

Validaciones ya realizadas:

- `npm run typecheck` pasó después de actualizar dependencias y antes del cambio incompleto de resources.
- El audit inicial tenía 19 vulnerabilidades.
- Después de actualizar dependencias y ejecutar correcciones compatibles: `npm audit` terminó con **0 vulnerabilidades**.

### 3. Archivos de calidad creados

- `.prettierrc.json`: 4 espacios, semicolon, comillas dobles, LF.
- `.prettierignore`: excluye build, dependencias y los archivos académicos del usuario.
- `eslint.config.js`: configuración flat para TypeScript.
- `scripts/clean.mjs`: elimina únicamente `dist`.
- `scripts/release-check.mjs`: valida metadata y concordancia `RELEASE_TAG`/versión.
- `scripts/package-smoke.mjs`: crea el tarball, lo instala en un directorio temporal y valida la versión instalada.

Nota: estos scripts aún no han sido ejecutados como conjunto. Deben verificarse después de reparar resources.

### 4. Registro MCP y fábrica del servidor

Archivos creados:

- `src/version.ts`
    - Obtiene nombre y versión desde `package.json` para evitar versiones hardcoded.
- `src/common/tool-registry.ts`
    - Centraliza todas las familias de tools.
    - Conserva `quiz-tools.ts` como implementación canónica del CRUD de preguntas.
    - Toma únicamente `canvas_create_quiz_group` del módulo legacy de preguntas.
    - Falla explícitamente si aparece cualquier nombre duplicado.
    - Añade `title` y annotations MCP:
        - `readOnlyHint`
        - `destructiveHint`
        - `idempotentHint`
        - `openWorldHint`
    - Implementa perfil seguro por defecto:
        - `CANVAS_READ_ONLY=true` por defecto.
        - credenciales desactivadas salvo `CANVAS_ENABLE_CREDENTIAL_TOOLS=true`.
        - archivos desactivados salvo `CANVAS_ENABLE_FILE_TOOLS=true`.
- `src/server-factory.ts`
    - Crea una instancia MCP independiente.
    - Registra tools, prompts, resources y resource templates.
    - Redacta posibles valores Bearer en errores.
    - Evita que HTTP reutilice una sola instancia de `Server` entre sesiones.

Estos archivos aún no están conectados a `src/index.ts`.

### 5. Resources MCP iniciados

Se inició la migración a `ResourceTemplate` para:

- `canvas://courses/{course_id}/readme`
- `canvas://courses/{course_id}/pages/{page_id}`

También se corrigió el concepto de routing para incluir `uri.hostname` (`courses`) y validar el `course_id`.

La edición quedó sintácticamente incompleta; aplicar primero la reparación inmediata descrita arriba.

## Plan pendiente de implementación

### Etapa 1 — estabilizar la base actual (completada el 1 de agosto de 2026)

1. Reparar los resources.
2. Ejecutar `npm run typecheck`.
3. Ejecutar `npm audit --json` y confirmar total 0.
4. Revisar `git diff --check`.
5. Añadir tests iniciales para:
    - unicidad de tools;
    - filtros read-only/credentials/files;
    - annotations;
    - parsing de resources;
    - versión tomada desde `package.json`.

Criterio de cierre: TypeScript y tests pasan sin editar `dist` manualmente.

### Etapa 2 — integrar la fábrica en stdio (completada el 1 de agosto de 2026)

1. Simplificar `src/index.ts`:
    - importar `packageMetadata`, `getConfiguredTools` y `createMcpServer`;
    - eliminar imports/aggregaciones duplicadas de tools;
    - eliminar `uniqueTools()` silencioso;
    - usar la versión de `package.json` en Commander y MCP;
    - crear stdio con `createMcpServer(client, getConfiguredTools())`.
2. Cambiar auto-renovación de Canvas token a opt-in:
    - `CANVAS_TOKEN_AUTO_RENEW=true` para habilitarla;
    - por defecto `false`.
3. Mantener el comando interactivo `config`, pero no ofrecer tools de credenciales al modelo salvo opt-in explícito.

Validaciones:

- build limpio;
- smoke stdio mediante cliente MCP;
- `tools/list`, `resources/list`, `resources/templates/list`, `prompts/list`;
- verificar que el perfil por defecto no contiene escrituras, paths locales ni access tokens.

### Etapa 3 — Streamable HTTP MCP real (completada el 1 de agosto de 2026)

1. Crear `src/mcp-http-server.ts` con `StreamableHTTPServerTransport` del SDK 1.30.
2. Endpoint MCP único: `/mcp` para `POST`, `GET` y `DELETE` según el protocolo.
3. Una instancia `Server` y un transport por sesión; mapa con límites y limpieza.
4. Default host `127.0.0.1`.
5. Exigir `MCP_HTTP_AUTH_TOKEN` para cualquier bind no loopback.
6. Validar Bearer en tiempo constante.
7. Validar `Host` y `Origin` mediante allowlists:
    - `MCP_HTTP_ALLOWED_HOSTS`
    - `MCP_HTTP_ALLOWED_ORIGINS`
8. Añadir límites:
    - tamaño máximo del body;
    - máximo de sesiones;
    - timeout de sesión;
    - rate limit por IP/token.
9. Añadir `/healthz` sin datos sensibles.
10. Graceful shutdown en `SIGINT`/`SIGTERM`.
11. `serve-http` debe arrancar este MCP real.

La API Fastify existente debe renombrarse a `serve-rest` y documentarse como integración separada para GPT Actions. También debe usar loopback por defecto y Bearer obligatorio fuera de loopback. No llamarla MCP.

Validaciones:

- initialize + tools/list mediante Streamable HTTP;
- rechazos 401, 403, 404 y 413;
- Origin/Host maliciosos;
- sesión inválida y DELETE de sesión;
- dos sesiones simultáneas sin compartir estado;
- cierre ordenado.

### Etapa 4 — endurecer CanvasClient

1. Normalizar dominio con `URL` y HTTPS por defecto.
2. Rechazar dominios con path, credenciales embebidas o esquemas inseguros salvo opt-in documentado para Canvas self-hosted.
3. Timeout configurable, por ejemplo `CANVAS_REQUEST_TIMEOUT_MS=30000`.
4. Retry acotado solo para operaciones idempotentes:
    - 429;
    - 502, 503, 504;
    - respetar `Retry-After`;
    - backoff con jitter.
5. Respetar headers de throttling de Canvas y emitir logs sin tokens.
6. Límite de páginas/items en paginación.
7. Validar que cada link `next` conserve el origin del Canvas configurado.
8. Soportar `AbortSignal`/cancelación cuando sea viable.
9. Clasificar errores de Canvas en tipos estables y sanitizados.
10. Añadir tests HTTP con mocks para retry, 429, timeout, paginación y link same-origin.

### Etapa 5 — seguridad de operaciones de alto impacto

1. Todas las operaciones masivas deben usar `dry_run: true` por defecto.
2. Añadir flujo preview/confirmación para:
    - calificación múltiple;
    - cambio masivo de fechas;
    - borrados;
    - regeneración de tokens;
    - matrículas/retiros;
    - envíos y comunicaciones.
3. Resolver ambigüedad de curso/estudiante:
    - cero coincidencias: error claro;
    - más de una: devolver candidatos y no actuar;
    - coincidencia exacta o ID: continuar.
4. Access token tools:
    - desactivadas por defecto;
    - no devolver secretos completos al modelo;
    - regeneración solo con confirmación explícita;
    - auto-renovación desactivada por defecto.
5. File tools:
    - exigir `CANVAS_FILE_ROOT`;
    - `realpath` y confinamiento tras resolver symlinks;
    - tamaño máximo configurable;
    - bloquear rutas fuera del root;
    - habilitación mediante opt-in.
6. Eliminar la ruta personal predeterminada de `AUDIT_SKILL_PATH`; exigir configuración explícita.

### Etapa 6 — mejorar contratos MCP

1. Añadir `outputSchema` y `structuredContent` en tools prioritarias.
2. Evitar mantener Zod y JSON Schema manuales divergentes; generar schema desde una sola fuente cuando sea viable.
3. Añadir ejemplos y descripciones de permisos/efectos.
4. Incluir paginación/cursor en resultados grandes.
5. Revisar el auditor para no considerar una entrega futura como faltante.
6. Eliminar N+1 en auditorías y operaciones de grading.
7. Evaluar separar toolsets por rol: `read`, `teacher`, `admin`, `files`, `credentials`.

### Etapa 7 — tests y quality gate

Suite mínima:

- unit tests de helpers, config, registry, resources y sanitización;
- CanvasClient con servidor HTTP simulado;
- tool handlers críticos con cliente falso;
- smoke stdio real;
- smoke Streamable HTTP real;
- package tarball install smoke;
- tests de seguridad para auth, origin, host, paths y secret redaction.

Quality gate final local:

```bash
npm ci
npm run format
npm run check
npm audit --audit-level=high
npm run package:smoke
git diff --check
```

### Etapa 8 — CI, CodeQL y Dependabot

Reemplazar CI por una matriz:

- sistemas: Ubuntu, Windows, macOS;
- Node: 22 y 24;
- instalación: `npm ci`;
- `npm run check`;
- `npm audit --audit-level=high` al menos en Ubuntu;
- package smoke en Ubuntu;
- concurrency con cancelación de ejecuciones obsoletas;
- permisos mínimos `contents: read`.

Añadir:

- `.github/workflows/codeql.yml` para JavaScript/TypeScript;
- `.github/dependabot.yml` para npm y GitHub Actions;
- protección de `main` con CI requerida, revisión y bloqueo de force-push.

### Etapa 9 — releases automáticos detectando GitHub Actions

Diseño recomendado: Release Please + npm Trusted Publishing OIDC.

Archivos:

- `.github/workflows/release.yml`
- `release-please-config.json`
- `.release-please-manifest.json`, inicialmente `{ ".": "1.2.3" }`

Flujo:

1. Push a `main` activa `googleapis/release-please-action@v4`.
2. Release Please detecta Conventional Commits y crea/actualiza un release PR.
3. Al fusionar ese PR, actualiza versión/changelog y crea el GitHub Release.
4. En el **mismo workflow**, un job `publish` condicionado a `release_created`:
    - checkout del tag generado;
    - Node 24;
    - npm suficientemente reciente para Trusted Publishing;
    - `npm ci`;
    - `npm run check`;
    - `RELEASE_TAG=<tag> npm run release:check`;
    - `npm run package:smoke`;
    - comprobar si la versión ya existe en npm;
    - `npm publish --access public --provenance` solo si no existe.

Permisos del job publish:

```yaml
permissions:
    contents: read
    id-token: write
```

Importante: publicar en el mismo workflow evita depender de un evento `release` secundario que puede no dispararse cuando el release fue creado con `GITHUB_TOKEN`.

Configuración única requerida en npmjs.com:

- paquete `@charlie.act7/canvas-mcp-server`;
- Trusted Publisher de GitHub Actions;
- owner: `CharlieCardenasToledo`;
- repo: `mcp-canvas-server`;
- workflow: `release.yml`;
- environment opcional: `npm` con aprobación manual si se desea.

Eliminar el workflow actual basado en `NPM_TOKEN` cuando OIDC esté probado. No guardar tokens npm permanentes.

Validaciones del release:

- YAML válido;
- acciones fijadas a versiones estables;
- dry run del tarball;
- tag coincide con `package.json`;
- release commit pertenece a `main`;
- publicación idempotente;
- provenance visible en npm;
- prueba primero con `workflow_dispatch` o release prerelease controlado.

### Etapa 10 — Docker y documentación

1. Docker multi-stage con Node 24 Alpine.
2. `npm ci`, build limpio y runtime solo con dependencias productivas.
3. Usuario no root.
4. `.dockerignore` amplio para `.git`, tests, docs locales y archivos académicos.
5. Healthcheck contra `/healthz`.
6. Compose separado para stdio, MCP HTTP y REST si se conservan ambos.
7. Actualizar README:
    - arquitectura;
    - transportes reales;
    - variables de entorno;
    - perfil read-only por defecto;
    - riesgos y permisos Canvas;
    - OAuth recomendado para despliegues multiusuario;
    - ejemplos Claude/Codex/Gemini/HTTP;
    - desarrollo, tests y release.
8. Añadir `SECURITY.md`, `CONTRIBUTING.md`, documentación de release y configuración.
9. Sincronizar cantidad de tools automáticamente, no escribir un número manual propenso a quedar obsoleto.
10. Añadir `server.json` para el MCP Registry cuando se decida publicar allí y validar que `mcpName` coincida.

## Criterios de aceptación globales

- `npm ci` reproducible desde cero.
- `npm audit` sin vulnerabilidades high/critical.
- CI verde en Node 22/24 y tres sistemas.
- stdio y Streamable HTTP pasan smokes reales.
- REST no se presenta como MCP.
- HTTP remoto no arranca sin autenticación segura.
- perfil por defecto read-only y sin tools de credenciales/archivos.
- no existen nombres de tools duplicados.
- `dist` no contiene archivos obsoletos.
- secrets nunca aparecen en logs, errors o tool results.
- operaciones masivas tienen preview/dry-run y confirmación.
- Docker corre como usuario no root.
- release automático usa OIDC, valida versión/tag/tarball y es idempotente.
- README, package metadata, runtime y GitHub Release muestran la misma versión.

## Secuencia recomendada para la siguiente sesión

1. Leer este documento y `AGENTS.md`.
2. Ejecutar `git status --short` y preservar los tres artefactos académicos.
3. Reparar inmediatamente los resources.
4. Ejecutar `npm run typecheck` y `npm audit --json`.
5. Revisar los archivos nuevos de registry/factory antes de conectarlos.
6. Completar etapas 2 y 3; validar transportes antes de tocar CanvasClient.
7. Completar seguridad del cliente y tools de alto impacto.
8. Añadir tests, ejecutar quality gate y solo entonces crear workflows.
9. Actualizar Docker/documentación.
10. Revisar `git diff`, no incluir archivos académicos, y entregar resultados sin publicar ni hacer push salvo autorización expresa.
