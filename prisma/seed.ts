import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import type {
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../src/generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Usuarios de ejemplo (uno por rol + uno extra de agente y de usuario).
const USERS = [
  { key: "admin", name: "Valeria Ríos", email: "admin@example.com", role: "ADMIN", password: "Admin123!" },
  { key: "agent", name: "Diego Paredes", email: "agente@example.com", role: "AGENT", password: "Agente123!" },
  { key: "agent2", name: "Lucía Torres", email: "lucia@example.com", role: "AGENT", password: "Agente123!" },
  { key: "user", name: "María Quispe", email: "usuario@example.com", role: "USER", password: "Usuario123!" },
  { key: "user2", name: "Jorge Huamán", email: "jorge@example.com", role: "USER", password: "Usuario123!" },
] as const satisfies readonly { key: string; name: string; email: string; role: Role; password: string }[];

type UserKey = (typeof USERS)[number]["key"];

type Step =
  | { at: number; by: UserKey; assign: UserKey }
  | { at: number; by: UserKey; status: TicketStatus }
  | { at: number; by: UserKey; priority: TicketPriority }
  | { at: number; by: UserKey; comment: string };

type SampleTicket = {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  author: UserKey;
  /** Días atrás en que se creó. */
  daysAgo: number;
  /** Pasos posteriores; `at` son horas después de la creación. */
  steps: Step[];
};

const TICKETS: SampleTicket[] = [
  {
    title: "No puedo iniciar sesión desde el celular",
    description:
      "Desde ayer, al iniciar sesión en la app móvil (Android 14) la pantalla se queda cargando y vuelve al login. Desde la laptop entro sin problemas.",
    category: "TECHNICAL",
    priority: "MEDIUM",
    author: "user",
    daysAgo: 12,
    steps: [
      { at: 2, by: "admin", assign: "agent" },
      { at: 3, by: "agent", priority: "HIGH" },
      { at: 3, by: "agent", status: "IN_PROGRESS" },
      { at: 4, by: "agent", comment: "Hola María, ¿podrías indicarnos la versión de la app? La encuentras en Ajustes > Acerca de." },
      { at: 6, by: "user", comment: "Es la versión 3.2.1. Ya probé reinstalarla y sigue igual." },
      { at: 7, by: "agent", comment: "Gracias. Reproducimos el error y el equipo móvil ya está trabajando en un parche." },
    ],
  },
  {
    title: "Cobro duplicado en la factura de septiembre",
    description:
      "En mi estado de cuenta aparecen dos cargos de S/ 89.90 con la misma fecha por la suscripción mensual. Adjunto el número de operación: 004512.",
    category: "BILLING",
    priority: "URGENT",
    author: "user",
    daysAgo: 1,
    steps: [],
  },
  {
    title: "¿Cómo cambio el correo de mi cuenta?",
    description:
      "Quiero usar mi correo del trabajo en lugar del personal, pero no encuentro la opción en el perfil.",
    category: "ACCOUNT",
    priority: "LOW",
    author: "user2",
    daysAgo: 20,
    steps: [
      { at: 1, by: "agent2", assign: "agent2" },
      { at: 1, by: "agent2", comment: "Hola Jorge, puedes cambiarlo desde Perfil > Datos personales. Al guardar te enviaremos un correo de confirmación." },
      { at: 2, by: "agent2", status: "RESOLVED" },
      { at: 30, by: "user2", comment: "Listo, ya lo cambié. ¡Gracias!" },
    ],
  },
  {
    title: "Error 500 al exportar reportes en CSV",
    description:
      "Al exportar el reporte mensual de ventas en CSV aparece \"Error interno del servidor\". En PDF sí funciona. Pasa con rangos mayores a 3 meses.",
    category: "TECHNICAL",
    priority: "HIGH",
    author: "user2",
    daysAgo: 3,
    steps: [{ at: 5, by: "admin", assign: "agent" }],
  },
  {
    title: "Sugerencia: modo oscuro en la app móvil",
    description:
      "La versión web ya tiene modo oscuro y sería genial tenerlo también en la app, sobre todo de noche.",
    category: "FEATURE_REQUEST",
    priority: "LOW",
    author: "user",
    daysAgo: 25,
    steps: [
      { at: 10, by: "agent2", assign: "agent2" },
      { at: 11, by: "agent2", comment: "¡Gracias por la idea! La pasamos al equipo de producto y está en el roadmap del próximo trimestre." },
      { at: 11, by: "agent2", status: "CLOSED" },
    ],
  },
  {
    title: "La página de pagos tarda mucho en cargar",
    description:
      "La sección de pagos tarda más de 20 segundos en mostrarse desde hace una semana. El resto del panel carga normal.",
    category: "TECHNICAL",
    priority: "MEDIUM",
    author: "user2",
    daysAgo: 6,
    steps: [
      { at: 3, by: "agent2", assign: "agent2" },
      { at: 4, by: "agent2", status: "IN_PROGRESS" },
      { at: 5, by: "agent2", comment: "Estamos revisando los tiempos de respuesta del servicio de pagos. Te aviso apenas tengamos novedades." },
    ],
  },
  {
    title: "Solicito factura con RUC",
    description:
      "Necesito que las próximas facturas salgan a nombre de mi empresa (RUC 20123456789) en lugar de boleta.",
    category: "BILLING",
    priority: "MEDIUM",
    author: "user",
    daysAgo: 15,
    steps: [
      { at: 2, by: "agent", assign: "agent" },
      { at: 2, by: "agent", status: "IN_PROGRESS" },
      { at: 20, by: "agent", comment: "Actualizamos tus datos de facturación. Desde el próximo ciclo recibirás factura electrónica." },
      { at: 20, by: "agent", status: "RESOLVED" },
    ],
  },
  {
    title: "No llegan los correos de recuperación de contraseña",
    description:
      "Varios usuarios de mi equipo reportan que el correo para restablecer la contraseña nunca llega, ni siquiera a spam.",
    category: "TECHNICAL",
    priority: "HIGH",
    author: "user2",
    daysAgo: 2,
    steps: [
      { at: 1, by: "admin", assign: "agent" },
      { at: 1, by: "admin", priority: "URGENT" },
      { at: 2, by: "agent", status: "IN_PROGRESS" },
      { at: 3, by: "agent", comment: "Detectamos un problema con el proveedor de correo. Estamos migrando los envíos a un servidor alterno." },
    ],
  },
  {
    title: "Quiero eliminar mi cuenta",
    description:
      "Ya no voy a usar el servicio y quiero que eliminen mi cuenta y mis datos personales.",
    category: "ACCOUNT",
    priority: "MEDIUM",
    author: "user",
    daysAgo: 0,
    steps: [],
  },
  {
    title: "Integración con Slack",
    description:
      "¿Tienen pensado integrar las notificaciones con Slack? Nos ayudaría a responder más rápido.",
    category: "FEATURE_REQUEST",
    priority: "LOW",
    author: "user2",
    daysAgo: 4,
    steps: [],
  },
  {
    title: "Duda sobre los planes anuales",
    description:
      "Si paso del plan mensual al anual, ¿se prorratea lo que ya pagué este mes?",
    category: "GENERAL",
    priority: "LOW",
    author: "user",
    daysAgo: 18,
    steps: [
      { at: 4, by: "agent2", assign: "agent2" },
      { at: 4, by: "agent2", comment: "Sí, el monto del mes en curso se descuenta del plan anual automáticamente." },
      { at: 5, by: "agent2", status: "RESOLVED" },
      { at: 50, by: "user", status: "CLOSED" },
    ],
  },
  {
    title: "Los adjuntos no se suben en Safari",
    description:
      "Al adjuntar imágenes desde Safari en macOS la barra de progreso se queda al 99 %. En Chrome funciona bien.",
    category: "TECHNICAL",
    priority: "MEDIUM",
    author: "user2",
    daysAgo: 8,
    steps: [{ at: 6, by: "agent", assign: "agent2" }],
  },
  {
    title: "El cambio de plan no se refleja",
    description:
      "Pagué el upgrade al plan Pro hace dos días pero mi cuenta sigue mostrando el plan Básico.",
    category: "BILLING",
    priority: "HIGH",
    author: "user",
    daysAgo: 9,
    steps: [
      { at: 1, by: "agent", assign: "agent" },
      { at: 1, by: "agent", status: "IN_PROGRESS" },
      { at: 3, by: "agent", comment: "Encontramos el pago y activamos el plan Pro manualmente. Disculpa las molestias." },
      { at: 3, by: "agent", status: "RESOLVED" },
    ],
  },
];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function main() {
  console.log("Creando usuarios...");
  const users = {} as Record<UserKey, { id: string; name: string }>;
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash, active: true },
      create: { name: u.name, email: u.email, role: u.role, passwordHash },
      select: { id: true, name: true },
    });
    users[u.key] = user;
  }

  console.log("Reiniciando tickets...");
  await prisma.$executeRaw`TRUNCATE TABLE "TicketEvent", "Comment", "Ticket" RESTART IDENTITY CASCADE`;

  const now = Date.now();
  // Se crean del más antiguo al más reciente para que la numeración siga el orden.
  const ordered = [...TICKETS].sort((a, b) => b.daysAgo - a.daysAgo);

  for (const [index, t] of ordered.entries()) {
    // Desfase de algunas horas para que no coincidan exactamente.
    const createdAt = new Date(now - t.daysAgo * DAY - (index % 5) * HOUR - 3 * HOUR);
    let status: TicketStatus = "OPEN";
    let priority: TicketPriority = t.priority;
    let assigneeId: string | null = null;
    let updatedAt = createdAt;

    const events: { type: "CREATED" | "STATUS_CHANGED" | "PRIORITY_CHANGED" | "ASSIGNED"; fromValue: string | null; toValue: string | null; actorId: string; createdAt: Date }[] = [
      { type: "CREATED", fromValue: null, toValue: "OPEN", actorId: users[t.author].id, createdAt },
    ];
    const comments: { body: string; authorId: string; createdAt: Date }[] = [];

    for (const step of t.steps) {
      const at = new Date(createdAt.getTime() + step.at * HOUR);
      const actorId = users[step.by].id;
      if (at > updatedAt) updatedAt = at;

      if ("assign" in step) {
        const previous = assigneeId ? Object.values(users).find((u) => u.id === assigneeId)?.name ?? null : null;
        assigneeId = users[step.assign].id;
        events.push({ type: "ASSIGNED", fromValue: previous, toValue: users[step.assign].name, actorId, createdAt: at });
      } else if ("status" in step) {
        events.push({ type: "STATUS_CHANGED", fromValue: status, toValue: step.status, actorId, createdAt: at });
        status = step.status;
      } else if ("priority" in step) {
        events.push({ type: "PRIORITY_CHANGED", fromValue: priority, toValue: step.priority, actorId, createdAt: at });
        priority = step.priority;
      } else {
        comments.push({ body: step.comment, authorId: actorId, createdAt: at });
      }
    }

    await prisma.ticket.create({
      data: {
        title: t.title,
        description: t.description,
        category: t.category,
        priority,
        status,
        authorId: users[t.author].id,
        assigneeId,
        createdAt,
        updatedAt,
        events: { create: events },
        comments: { create: comments },
      },
    });
  }

  console.log(`Listo: ${USERS.length} usuarios y ${TICKETS.length} tickets.`);
  console.table(USERS.map(({ email, password, role }) => ({ email, password, role })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
