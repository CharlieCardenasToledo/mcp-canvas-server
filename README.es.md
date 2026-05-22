# 🎓 Canvas LMS MCP Server

[![npm version](https://img.shields.io/npm/v/@charlie.act7/canvas-mcp-server)](https://www.npmjs.com/package/@charlie.act7/canvas-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**¡Lleva tu aula virtual de Canvas al siguiente nivel con Inteligencia Artificial!** 🚀

Este proyecto es un servidor de **Model Context Protocol (MCP)** para **Canvas LMS**. En palabras sencillas, funciona como un "traductor" o puente que permite a asistentes de Inteligencia Artificial (como Claude Desktop, Claude Code, Cursor, etc.) comprender y realizar acciones en tus cursos de Canvas mediante instrucciones en lenguaje natural.

---

## 🔍 ¿Cómo funciona?

Cuando utilizas este servidor, la comunicación fluye de la siguiente manera:

```mermaid
graph LR
    User([Usuario]) -->|Instrucción en Lenguaje Natural| AI["Asistente de IA (Claude)"]
    AI -->|Petición MCP| MCP["Canvas MCP Server"]
    MCP -->|API REST (HTTPS)| Canvas["Canvas LMS"]
    Canvas -->|Respuesta| MCP
    MCP -->|Datos procesados| AI
    AI -->|Respuesta amigable| User
```

1. **Tú le pides algo a Claude** (por ejemplo: *"Crea una tarea para el próximo viernes"*).
2. **Claude detecta la intención** y se comunica con el **Canvas MCP Server** enviándole los parámetros necesarios.
3. **El servidor realiza la llamada segura** a la API de Canvas.
4. **Canvas procesa la acción** y devuelve el resultado.
5. **Claude te confirma el éxito de la operación** en lenguaje natural.

---

## 💡 ¿Qué puedes pedirle a tu Asistente?

¡Cualquier tarea administrativa o de consulta que harías manualmente en Canvas! Aquí tienes algunos ejemplos de lo que puedes pedirle:

### 📖 Para Consultar Información
* 💬 *"¿Qué cursos tengo activos este semestre?"*
* 💬 *"Muéstrame las entregas pendientes de calificar para la Tarea 2 en Biología."*
* 💬 *"¿Cuáles son los estudiantes del Grupo B de Química?"*
* 💬 *"¿Qué cuestionarios o exámenes tenemos programados para esta semana?"*

### ✍️ Para Administrar y Crear Contenido
* 💬 *"Crea una nueva tarea llamada 'Ensayo final de Historia' con fecha de entrega para el próximo viernes."*
* 💬 *"Publica un anuncio en el curso de Matemáticas avisando que la clase de mañana será virtual."*
* 💬 *"Crea un nuevo módulo llamado 'Semana 5: Introducción a React' en mi curso."*

### 💯 Para Calificar y Dar Retroalimentación
* 💬 *"Califica el ensayo de María con un 90/100 y agrégale un comentario que diga: 'Excelente análisis crítico, continúa así'."*
* 💬 *"Genera un reporte de las notas actuales de los alumnos del curso de Física."*

---

## 🛠️ Guía de Instalación Paso a Paso

Para conectar tu asistente de IA a Canvas, necesitas configurar **dos cosas**: tus credenciales de Canvas y el cliente de IA (como Claude).

### Paso 1: Obtener tus credenciales de Canvas LMS
Para que el servidor pueda actuar en tu nombre, necesita permiso:
1. Inicia sesión en tu cuenta de **Canvas LMS**.
2. Dirígete a **Cuenta (Account)** ➡️ **Configuración (Settings)** en el menú lateral.
3. Baja hasta la sección **Integraciones Aprobadas (Approved Integrations)** y haz clic en el botón **+ Nuevo token de acceso (+ New Access Token)**.
4. Escribe un propósito (ej. "Asistente Claude") y haz clic en **Generar token**.
5. **Copia el token generado inmediatamente** y guárdalo en un lugar seguro (no podrás volver a verlo después de cerrar la pantalla).

> [!IMPORTANT]
> También necesitarás el dominio de tu Canvas. Es la dirección web de tu escuela/universidad, por ejemplo: `miuniversidad.instructure.com`.

---

### Paso 2: Configurar tu Cliente de IA

#### Opción A: Claude Desktop (Aplicación de Escritorio)
1. Abre tu archivo de configuración de Claude Desktop. En Windows se encuentra en:
   `%APPDATA%\Claude\claude_desktop_config.json`
   *(En macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`)*
2. Agrega la configuración del servidor Canvas bajo `mcpServers`:

```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server"],
      "env": {
        "CANVAS_API_TOKEN": "TU_TOKEN_DE_ACCESO_AQUÍ",
        "CANVAS_API_DOMAIN": "miuniversidad.instructure.com"
      }
    }
  }
}
```
3. Guarda el archivo y reinicia Claude Desktop. Verás un icono de enchufe indicando que el servidor está conectado.

#### Opción B: Claude Code (Terminal)
Si utilizas la herramienta de línea de comandos Claude Code, simplemente instala el plugin ejecutando:
```bash
/plugin install canvas-lms@claude-community
```
Luego, configura tus credenciales de forma interactiva:
```bash
/canvas-lms:config
```

---

## 💻 Configuración Interactiva por Consola (CLI)
Si prefieres configurar las credenciales de manera local e interactiva en tu terminal para desarrollo, puedes ejecutar:
```bash
npx @charlie.act7/canvas-mcp-server config
```
Esto te pedirá el dominio y tu API token paso a paso, guardándolos de forma segura en un archivo de configuración local.

---

<details>
<summary>🛠️ <b>Ver Lista Detallada de Herramientas Soportadas (Técnico)</b></summary>

El servidor expone internamente las siguientes herramientas organizadas por categorías:

| Categoría | Herramientas Incluidas |
|---|---|
| **Cursos (Courses)** | Listar cursos, detalles del curso, configuración básica |
| **Módulos (Modules)** | Listar y gestionar módulos del curso |
| **Páginas (Pages)** | Listar páginas de contenido, leer el HTML de una página |
| **Archivos (Files)** | Listar archivos cargados en el curso |
| **Anuncios (Announcements)** | Listar y crear anuncios para el curso |
| **Tareas (Assignments)** | Listar, crear, actualizar tareas y modificar fechas de entrega masivamente |
| **Entregas (Submissions)** | Ver entregas y archivos adjuntos de alumnos |
| **Calificaciones (Grading)** | Calificar entregas de tareas, auditar notas del curso |
| **Exámenes (Quizzes)** | Listar quizzes, gestionar preguntas y modificar fechas límite |
| **Estudiantes (Students)** | Roster de alumnos, progreso de aprendizaje y detalles |
| **Grupos (Groups)** | Listar y gestionar grupos de estudiantes |
| **Calendario (Calendar)** | Listar y crear eventos o recordatorios en la agenda |
| **Rúbricas (Rubrics)** | Crear y gestionar rúbricas de evaluación |
| **Comunicación (Communication)** | Enviar mensajes directos, gestionar foros y discusiones |

### Recursos MCP Soportados
Para clientes compatibles con recursos directos:
* `canvas://courses/{id}/readme` — Resumen general formateado de un curso.
* `canvas://courses/{id}/pages/{slug}` — Contenido HTML directo de páginas de Canvas.
</details>

---

## 🛠️ Desarrollo Local (Para Programadores)

Si deseas clonar este repositorio y hacer modificaciones:

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```
2. **Compilar el Proyecto (TypeScript a JavaScript):**
   ```bash
   npm run build
   ```
3. **Ejecutar Servidor en Modo Stdio (MCP):**
   ```bash
   npm start
   ```
4. **Ejecutar Servidor HTTP con Documentación Swagger:**
   Si deseas utilizarlo como una acción de GPTs de OpenAI, levanta el servidor web con:
   ```bash
   npm run start:http
   ```
   Si deseas ver la interfaz interactiva de Swagger, visita `http://localhost:3000`.

---

## 📄 Licencia
Este proyecto está bajo la licencia MIT. Creado por [Charlie Cárdenas Toledo](https://github.com/charlie-act7).
