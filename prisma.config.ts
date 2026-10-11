import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` no necesita conexión: se permite que falte la variable
    // para que `npm install` funcione en un clon sin .env.
    url: process.env.DATABASE_URL ?? "",
  },
});
