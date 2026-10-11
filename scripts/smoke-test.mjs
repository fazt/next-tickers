// Prueba de humo por HTTP contra un servidor en marcha y una base con el seed.
//   npm run build && npm start   (en otra terminal)
//   npm run test:smoke           (BASE_URL=http://localhost:3000 por defecto)
//
// Los formularios de Server Actions se envían como lo haría un navegador sin
// JavaScript (mejora progresiva): se leen los campos ocultos que genera React y
// se hace POST multipart a la misma página.

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const USERS = {
  admin: { email: "admin@example.com", password: "Admin123!" },
  agent: { email: "agente@example.com", password: "Agente123!" },
  user: { email: "usuario@example.com", password: "Usuario123!" },
  user2: { email: "jorge@example.com", password: "Usuario123!" },
};

let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

const decode = (s) =>
  s
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name.replace(/[$]/g, "\\$")}="([^"]*)"`));
  return match ? decode(match[1]) : undefined;
}

class Client {
  cookies = new Map();

  cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  storeCookies(res) {
    for (const raw of res.headers.getSetCookie()) {
      const [pair] = raw.split(";");
      const i = pair.indexOf("=");
      const key = pair.slice(0, i).trim();
      const value = pair.slice(i + 1);
      if (!value || /max-age=0/i.test(raw)) this.cookies.delete(key);
      else this.cookies.set(key, value);
    }
  }

  async fetch(path, init = {}) {
    const res = await fetch(new URL(path, BASE), {
      redirect: "manual",
      ...init,
      headers: { ...init.headers, cookie: this.cookieHeader() },
    });
    this.storeCookies(res);
    return res;
  }

  async login({ email, password }) {
    const { csrfToken } = await (await this.fetch("/api/auth/csrf")).json();
    return this.fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, email, password, json: "true" }),
    });
  }

  async session() {
    return (await this.fetch("/api/auth/session")).json();
  }

  /** Envía el primer <form> de `path` cuyo HTML cumpla `matcher`. */
  async submitForm(path, matcher, fields) {
    const html = await (await this.fetch(path)).text();
    const form = [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map((m) => m[0]).find(matcher);
    if (!form) throw new Error(`No se encontró el formulario en ${path}`);

    const body = new FormData();
    for (const [tag] of form.matchAll(/<input\b[^>]*>/g)) {
      const name = attr(tag, "name");
      if (name && attr(tag, "type") === "hidden") body.append(name, attr(tag, "value") ?? "");
    }
    for (const [key, value] of Object.entries(fields)) body.set(key, value);

    return this.fetch(path, { method: "POST", body, headers: { origin: new URL(BASE).origin } });
  }
}

async function main() {
  console.log(`Prueba de humo contra ${BASE}\n`);

  console.log("Rutas públicas y protegidas sin sesión");
  const anon = new Client();
  check("GET / responde 200", (await anon.fetch("/")).status === 200);
  check("GET /auth/sign-in responde 200", (await anon.fetch("/auth/sign-in")).status === 200);
  for (const path of ["/dashboard", "/dashboard/tickets/new", "/dashboard/users"]) {
    const res = await anon.fetch(path);
    const location = res.headers.get("location") ?? "";
    check(
      `${path} redirige a /auth/sign-in`,
      res.status === 307 && location.includes("/auth/sign-in?callbackUrl="),
      `${res.status} ${location}`,
    );
  }

  console.log("\nInicio de sesión");
  const bad = new Client();
  const badLogin = await bad.login({ email: USERS.user.email, password: "incorrecta" });
  check("Contraseña incorrecta devuelve 401", badLogin.status === 401, String(badLogin.status));
  check("Sin cookie de sesión tras fallo", !(await bad.session()).user);

  const user = new Client();
  const login = await user.login(USERS.user);
  const userSession = await user.session();
  check("Login de usuario@example.com responde 200", login.status === 200, String(login.status));
  check("La sesión incluye el rol USER", userSession.user?.role === "USER", JSON.stringify(userSession));

  const dashboard = await user.fetch("/dashboard");
  const dashboardHtml = await dashboard.text();
  check("GET /dashboard con sesión responde 200", dashboard.status === 200, String(dashboard.status));
  check("El panel saluda al usuario", dashboardHtml.includes("Hola, María"));

  console.log("\nPermisos por rol");
  const usersAsUser = await user.fetch("/dashboard/users");
  check(
    "USER no accede a /dashboard/users (redirige a /dashboard)",
    usersAsUser.status === 307 && new URL(usersAsUser.headers.get("location"), BASE).pathname === "/dashboard",
    `${usersAsUser.status} ${usersAsUser.headers.get("location")}`,
  );

  const agent = new Client();
  await agent.login(USERS.agent);
  const usersAsAgent = await agent.fetch("/dashboard/users");
  check("AGENT tampoco accede a /dashboard/users", usersAsAgent.status === 307, String(usersAsAgent.status));

  const admin = new Client();
  await admin.login(USERS.admin);
  const usersAsAdmin = await admin.fetch("/dashboard/users");
  const usersHtml = await usersAsAdmin.text();
  check("ADMIN accede a /dashboard/users", usersAsAdmin.status === 200, String(usersAsAdmin.status));
  check("El listado de usuarios muestra los emails", usersHtml.includes("usuario@example.com"));

  console.log("\nCreación de tickets (Server Action + zod)");
  const invalid = await user.submitForm("/dashboard/tickets/new", (f) => f.includes('name="title"'), {
    title: "Hey",
    description: "corto",
    category: "TECHNICAL",
    priority: "HIGH",
  });
  const invalidHtml = await invalid.text();
  check("Datos inválidos no crean el ticket", invalid.status === 200, String(invalid.status));
  check("Se muestran los errores de validación", invalidHtml.includes("Mínimo 5 caracteres"));

  const title = `Prueba de humo ${Date.now()}`;
  const created = await user.submitForm("/dashboard/tickets/new", (f) => f.includes('name="title"'), {
    title,
    description: "Ticket creado por scripts/smoke-test.mjs para verificar el flujo completo.",
    category: "TECHNICAL",
    priority: "HIGH",
  });
  const location = created.headers.get("location") ?? "";
  const ticketPath = new URL(location || "/", BASE).pathname;
  check(
    "El ticket se crea y redirige a su detalle",
    created.status === 303 && /^\/dashboard\/tickets\/[a-z0-9]+$/.test(ticketPath),
    `${created.status} ${location}`,
  );

  const detail = await user.fetch(`${ticketPath}?created=1`);
  const detailHtml = await detail.text();
  check("El autor ve el detalle del ticket", detail.status === 200 && detailHtml.includes(title));

  const search = await user.fetch(`/dashboard/tickets?q=${encodeURIComponent(title)}`);
  check("La búsqueda del listado encuentra el ticket", (await search.text()).includes(title));

  const other = new Client();
  await other.login(USERS.user2);
  const foreign = await other.fetch(ticketPath);
  check("Otro USER no puede ver el ticket (404)", foreign.status === 404, String(foreign.status));

  console.log("\nGestión por un agente");
  const agentDetail = await agent.fetch(ticketPath);
  check("El agente ve el panel Gestionar", (await agentDetail.text()).includes("Gestionar"));
  const agentId = (await agent.session()).user.id;
  const updated = await agent.submitForm(ticketPath, (f) => f.includes('name="assigneeId"'), {
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeId: agentId,
  });
  check("La actualización responde 200", updated.status === 200, String(updated.status));
  const afterUpdate = await (await user.fetch(ticketPath)).text();
  check("El historial registra el cambio de estado", afterUpdate.includes("cambió el estado de"));
  check("El historial registra la asignación", afterUpdate.includes("se asignó el ticket"));

  const commented = await user.submitForm(ticketPath, (f) => f.includes('name="body"'), {
    body: "Comentario de la prueba de humo.",
  });
  check("El autor puede comentar", commented.status === 200, String(commented.status));
  check(
    "El comentario aparece en la conversación",
    (await (await agent.fetch(ticketPath)).text()).includes("Comentario de la prueba de humo."),
  );

  console.log("\nPerfil y gestión de usuarios");
  const profile = await user.fetch("/dashboard/profile");
  check(
    "GET /dashboard/profile responde 200",
    profile.status === 200 && (await profile.text()).includes("Cambiar contraseña"),
  );

  const user2Id = (await other.session()).user.id;
  const rowForm = (label) => (f) => f.includes(`value="${user2Id}"`) && f.includes(label);
  const deactivated = await admin.submitForm("/dashboard/users", rowForm("Desactivar"), {});
  check("El admin desactiva una cuenta", deactivated.status === 200, String(deactivated.status));
  const kicked = await other.fetch("/dashboard");
  check(
    "La sesión de la cuenta desactivada deja de valer",
    kicked.status === 307 && (kicked.headers.get("location") ?? "").includes("/auth/sign-in"),
    `${kicked.status} ${kicked.headers.get("location")}`,
  );
  const blocked = await new Client().login(USERS.user2);
  check("Una cuenta desactivada no puede iniciar sesión", blocked.status === 401, String(blocked.status));
  const reactivated = await admin.submitForm("/dashboard/users", rowForm("Activar"), {});
  const back = await new Client().login(USERS.user2);
  check("El admin la reactiva y vuelve a entrar", reactivated.status === 200 && back.status === 200);

  console.log("\nLimpieza");
  const deleted = await admin.submitForm(ticketPath, (f) => f.includes("Eliminar ticket"), {});
  check(
    "El admin elimina el ticket de prueba",
    deleted.status === 303 && (deleted.headers.get("location") ?? "").includes("deleted=1"),
    `${deleted.status} ${deleted.headers.get("location")}`,
  );

  console.log(failures ? `\n${failures} comprobación(es) fallaron.` : "\nTodo OK.");
  process.exitCode = failures ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
