# NextTickets

Sistema de tickets de soporte hecho con Next.js, Prisma y PostgreSQL. Los usuarios abren
tickets, el equipo de soporte (agentes y administradores) los asigna, cambia su estado y
responde, y todos pueden seguir la conversación y el historial de cada solicitud.

## Funcionalidades

- **Registro e inicio de sesión** con email y contraseña (contraseñas con bcrypt, sesión JWT).
- **Roles con permisos coherentes**:

  | Acción                                          | Usuario            | Agente | Admin |
  | ----------------------------------------------- | ------------------ | ------ | ----- |
  | Crear tickets                                   | Sí                 | Sí     | Sí    |
  | Ver tickets                                     | Solo los suyos     | Todos  | Todos |
  | Comentar                                        | En los suyos       | Todos  | Todos |
  | Cambiar estado y prioridad                      | Cerrar o reabrir los suyos | Sí | Sí |
  | Asignar tickets a un agente o admin             | No                 | Sí     | Sí    |
  | Eliminar tickets                                | No                 | No     | Sí    |
  | Gestionar usuarios (rol, activar/desactivar)    | No                 | No     | Sí    |

- **Tickets** con número legible (`#12`), título, descripción, estado (abierto, en progreso,
  resuelto, cerrado), prioridad (baja, media, alta, urgente), categoría, autor y responsable.
- **Listado** con búsqueda por título, descripción o número, filtros por estado, prioridad,
  categoría y responsable, orden y paginación. Los filtros viven en la URL.
- **Detalle** con conversación (comentarios) e historial de cambios de estado, prioridad y
  asignación.
- **Panel de métricas**: tickets por estado, activos por prioridad, por categoría, actividad
  reciente y, para el equipo, tickets sin asignar, asignados a mí y carga por agente.
- **Gestión de usuarios** para admins: búsqueda, cambio de rol y desactivación de cuentas
  (al desactivar o pasar a usuario se liberan sus tickets activos).
- **Perfil editable**: nombre, email y cambio de contraseña.
- **Modo claro/oscuro/sistema** con next-themes.
- Validación con **zod** en todas las Server Actions. Los formularios funcionan también sin
  JavaScript (mejora progresiva).

## Stack

| Pieza              | Versión                                             |
| ------------------ | --------------------------------------------------- |
| Next.js            | 16.4 (App Router, Turbopack, `proxy.ts`)            |
| React              | 19.3                                                |
| TypeScript         | 6.0                                                 |
| Prisma ORM         | 7.10 (`prisma-client` + driver adapter `@prisma/adapter-pg`) |
| PostgreSQL         | 18 (Docker)                                         |
| NextAuth.js        | 4.24 (proveedor de credenciales, sesión JWT)        |
| Tailwind CSS       | 4.3                                                 |
| shadcn/ui          | CLI 4.21, estilo `radix-nova` sobre `radix-ui` 1.7  |
| zod                | 4.6                                                 |
| ESLint             | 9.39 con `eslint-config-next` 16.4 (flat config)    |
| Otros              | next-themes 0.4, lucide-react, sonner, bcryptjs 3   |

## Requisitos

- Node.js 20.19+, 22.12+ o 24+ (lo exige Prisma 7)
- npm 10+
- Docker con Docker Compose

## Puesta en marcha

```bash
# 1. Dependencias (genera también el cliente de Prisma)
npm install

# 2. Variables de entorno
cp .env.example .env
#    y pon un NEXTAUTH_SECRET propio, por ejemplo la salida de:
#    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 3. Base de datos (Postgres 18 en el puerto 5462, contenedor next-tickers-db)
docker compose up -d

# 4. Migraciones y datos de ejemplo
npx prisma migrate dev
npm run db:seed

# 5. Servidor de desarrollo
npm run dev
```

Abre <http://localhost:3000>.

> En Prisma 7, `migrate dev` ya no ejecuta el seed ni `prisma generate` por su cuenta: por eso
> el seed va en un paso aparte y `npm install` genera el cliente (`postinstall`). Si cambias
> `schema.prisma`, ejecuta `npm run db:generate` después de migrar.

### Usuarios de ejemplo

El seed crea estos usuarios (y 13 tickets con comentarios e historial). Se puede ejecutar
varias veces: actualiza los usuarios y reinicia los tickets.

| Rol           | Nombre        | Email                 | Contraseña    |
| ------------- | ------------- | --------------------- | ------------- |
| Administrador | Valeria Ríos  | `admin@example.com`   | `Admin123!`   |
| Agente        | Diego Paredes | `agente@example.com`  | `Agente123!`  |
| Agente        | Lucía Torres  | `lucia@example.com`   | `Agente123!`  |
| Usuario       | María Quispe  | `usuario@example.com` | `Usuario123!` |
| Usuario       | Jorge Huamán  | `jorge@example.com`   | `Usuario123!` |

Las cuentas nuevas que se registran desde `/auth/sign-up` siempre tienen rol **Usuario**; un
admin puede promoverlas a agente desde **Usuarios**.

## Variables de entorno

| Variable          | Obligatoria | Descripción                                                                 | Ejemplo                                                              |
| ----------------- | ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`    | Sí          | Conexión a PostgreSQL. La usan la app, el CLI de Prisma y el seed.          | `postgresql://tickets:tickets@localhost:5462/next_tickers?schema=public` |
| `NEXTAUTH_SECRET` | Sí          | Secreto para firmar y cifrar las sesiones JWT. Debe ser largo y aleatorio.  | 32 bytes aleatorios en base64                                        |
| `NEXTAUTH_URL`    | Sí          | URL pública de la app. En producción, el dominio con `https`.               | `http://localhost:3000`                                              |

## Scripts

| Script               | Qué hace                                                            |
| -------------------- | ------------------------------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo (Turbopack)                                  |
| `npm run build`      | Build de producción (incluye la comprobación de tipos)              |
| `npm start`          | Sirve el build de producción                                        |
| `npm run lint`       | ESLint                                                              |
| `npm run typecheck`  | `tsc --noEmit`                                                      |
| `npm run db:up`      | Levanta Postgres con Docker Compose                                 |
| `npm run db:down`    | Detiene el contenedor (los datos se conservan en el volumen)        |
| `npm run db:generate`| Regenera el cliente de Prisma en `src/generated/prisma`             |
| `npm run db:migrate` | `prisma migrate dev`: aplica y crea migraciones en desarrollo       |
| `npm run db:deploy`  | `prisma migrate deploy`: aplica migraciones en producción           |
| `npm run db:seed`    | Carga los usuarios y tickets de ejemplo                             |
| `npm run db:reset`   | Borra la base (pide confirmación), reaplica migraciones y siembra   |
| `npm run db:studio`  | Prisma Studio                                                       |
| `npm run test:smoke` | Prueba de humo por HTTP contra un servidor en marcha (ver abajo)    |

### Prueba de humo

Con la base sembrada y la app corriendo (`npm run build && npm start`, o `npm run dev`):

```bash
npm run test:smoke                      # usa http://localhost:3000
BASE_URL=http://localhost:3001 npm run test:smoke
```

Comprueba redirecciones sin sesión, login, permisos por rol, creación de tickets con
validación, visibilidad entre usuarios, gestión por un agente, comentarios, perfil y
desactivación de cuentas. Borra el ticket que crea y deja los usuarios como estaban.

## Estructura

```
prisma/
  schema.prisma          # Modelos: User, Ticket, Comment, TicketEvent
  migrations/            # Migraciones SQL
  seed.ts                # Usuarios y tickets de ejemplo
prisma.config.ts         # Config del CLI de Prisma 7 (URL, migraciones, seed)
scripts/smoke-test.mjs   # Prueba de humo HTTP
src/
  proxy.ts               # Next 16 (antes middleware): protege /dashboard
  actions/               # Server Actions: auth, tickets, users, profile
  app/
    page.tsx             # Landing
    auth/                # sign-in, sign-up
    api/auth/[...nextauth]/route.ts
    dashboard/
      page.tsx           # Panel de métricas
      tickets/           # Listado, nuevo y detalle [id]
      users/             # Gestión de usuarios (admin)
      profile/           # Perfil
  components/
    ui/                  # Componentes de shadcn/ui
    tickets/             # Badges y filtros
    dashboard/           # Navegación y menú de usuario
  lib/
    auth.ts              # Configuración de NextAuth
    session.ts           # getCurrentUser / requireUser / requireRole
    permissions.ts       # Reglas de permisos por rol
    validations.ts       # Esquemas zod
    tickets.ts, metrics.ts, prisma.ts, constants.ts, format.ts
  generated/prisma/      # Cliente de Prisma generado (no se versiona)
  types/next-auth.d.ts   # Tipos de sesión con id y rol
```

## Notas de diseño

- **Autorización en dos capas.** `src/proxy.ts` hace una comprobación rápida con el JWT
  (redirige sin sesión y saca a quien no es admin de `/dashboard/users`). La autorización real
  se repite en cada página y Server Action leyendo el usuario de la base de datos, así un
  cambio de rol o una desactivación se aplica al momento aunque el JWT siga vigente.
- **¿Por qué NextAuth 4 y no Auth.js v5?** La 4.24 es la versión estable y declara soporte
  para Next 16 en sus `peerDependencies`; Auth.js v5 sigue en beta. Para credenciales con
  sesión JWT, la 4.24 cubre todo lo necesario.
- **Ids en campos ocultos.** Las acciones de un ticket reciben su id como campo oculto del
  formulario en lugar de `.bind()`: con acciones enlazadas y `useActionState`, el envío sin
  JavaScript dejaba la respuesta colgada en Next 16.4 / React 19.3.
- Las fechas se muestran en la zona horaria `America/Lima` (ver `src/lib/format.ts`).
