import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const user = process.env['DEV_DB_USER'];
const pass = process.env['DEV_DB_PASS'];
const name = process.env['DEV_DB_NAME'];

const databaseUrl =
  process.env['DATABASE_URL'] ??
  `postgresql://${user}:${pass}@localhost:5432/${name}?schema=public`;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
