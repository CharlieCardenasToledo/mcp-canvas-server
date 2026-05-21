import * as dotenv from "dotenv";
import { CanvasClient } from "./src/services/canvas-client.js";

dotenv.config();

const token = process.env.CANVAS_API_TOKEN!;
const domain = process.env.CANVAS_API_DOMAIN!;
const courseId = 35041;

const assignmentHtml = `
<p>Esta actividad práctica te permitirá realizar tu primer <strong>modelado conceptual</strong> basado en un requerimiento de negocio. Te enfocarás en <em>extraer entidades</em> de un texto, <em>clasificar sus atributos</em> técnicos y <em>proponer atributos clave</em> robustos utilizando la notación de Chen.</p>

<p><strong>Escenario: Sistema de Gestión de la UIDE, campus Loja</strong><br>
La universidad requiere un sistema para gestionar sus proyectos de investigación. Se sabe que:
- Cada <strong>Investigador</strong> tiene un número de Cédula, Nombre completo, Correo institucional y puede tener varios números de teléfono de contacto.
- Un <strong>Proyecto</strong> tiene un código único, título, presupuesto y una fecha de inicio.
- Se desea registrar el tiempo de dedicación (en horas) de cada investigador en cada proyecto.</p>

<p><strong>¿Qué realizarás?</strong></p>
<table border="1" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr>
      <th style="width: 22%;">Actividad</th>
      <th style="width: 48%;">Instrucciones específicas</th>
      <th style="width: 30%;">Entregable</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Identificación de Objetos</td>
      <td>Analiza el escenario de la <strong>UIDE, campus Loja</strong> e identifica los objetos del mundo real (Entidades) y sus propiedades (Atributos).</td>
      <td>Lista de entidades identificadas.</td>
    </tr>
    <tr>
      <td>Anatomía de Atributos</td>
      <td>Para las entidades detectadas, clasifica cada dato como Simple, Compuesto, Multivaluado o Derivado.</td>
      <td>Cuadro de clasificación de atributos.</td>
    </tr>
    <tr>
      <td>Definición de Claves</td>
      <td>Determina un Atributo Clave para cada tipo de entidad. Justifica por qué la Cédula es un identificador adecuado en el contexto ecuatoriano.</td>
      <td>Propuesta de atributos clave justificada.</td>
    </tr>
    <tr>
      <td>Diagramación Inicial</td>
      <td>Elabora un diagrama ER básico (entidades y atributos) usando la notación clásica de Chen. Puedes incluir relaciones binarias simples.</td>
      <td>Diagrama ER inicial (.png/.pdf).</td>
    </tr>
  </tbody>
</table>

<p><strong>Información importante</strong></p>
<ul>
  <li><strong>Modalidad:</strong> práctica de experimentación presencial — <strong>2.25 pts</strong>.</li>
  <li><strong>Duración:</strong> 90 minutos.</li>
  <li><strong>Entrega:</strong> documento con lista de objetos, clasificación, claves y diagrama inicial.</li>
</ul>
`;

async function run() {
    const client = new CanvasClient(token, domain);

    try {
        console.log("Listing assignment groups...");
        const groups = await client.getAssignmentGroups(courseId);
        console.log("Available groups:", groups.map(g => `${g.name} (ID: ${g.id})`));

        // Use the first group if no specific one is found, or "Assignments"
        const targetGroup = groups.find(g => g.name.includes("Actividades") || g.name.includes("Tareas")) || groups[0];
        console.log(`Targeting group: ${targetGroup.name} (ID: ${targetGroup.id})`);

        console.log("Creating assignment...");
        const assignment = await client.createAssignment(courseId, {
            name: "Actividad PE-1.3: Taller de Entidades",
            description: assignmentHtml,
            points_possible: 2.25,
            submission_types: ["online_upload"],
            assignment_group_id: targetGroup.id,
            published: true
        });

        console.log("✅ Assignment created successfully!");
        console.log(`ID: ${assignment.id}`);
        console.log(`URL: https://${domain}/courses/${courseId}/assignments/${assignment.id}`);
    } catch (error: any) {
        console.error("❌ Error:", error?.response?.data || error.message);
    }
}

run();
