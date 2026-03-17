# Backend Scripts

## Database

| Script     | Description                                             |
| ---------- | ------------------------------------------------------- |
| `db:start` | Start the dev database via Docker Compose               |
| `db:stop`  | Stop the dev database container                         |
| `db:wipe`  | Stop the container and delete all volumes (destructive) |
| `db:logs`  | Tail database container logs                            |
| `db:push`  | Push Prisma schema changes to the database              |
| `db:seed`  | Seed the database using Prisma seed script              |

## Prisma

| Script     | Description                            |
| ---------- | -------------------------------------- |
| `studio`   | Open Prisma Studio (visual DB browser) |
| `generate` | Generate Prisma client                 |

## Development

| Script        | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `dev`         | Start DB, generate Prisma client, push schema, then run NestJS in watch mode |
| `start`       | Start the NestJS app                                                         |
| `start:dev`   | Start NestJS in watch mode                                                   |
| `start:debug` | Start NestJS in debug + watch mode                                           |
| `start:prod`  | Run the compiled production build                                            |
| `build`       | Compile the NestJS app                                                       |

## Formatting & Linting

| Script           | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `format`         | Format all files with Prettier                        |
| `format:check`   | Check formatting without writing changes              |
| `format:ci`      | Check formatting with LF line endings (for CI)        |
| `lint`           | Lint and auto-fix TypeScript source files             |
| `lint:ci`        | Lint without auto-fix (for CI)                        |
| `format_lint:ci` | Run both `format:ci` and `lint:ci` (for CI pipelines) |

## Testing

| Script       | Description                                    |
| ------------ | ---------------------------------------------- |
| `test`       | Run all Jest tests                             |
| `test:watch` | Run Jest in watch mode                         |
| `test:cov`   | Run Jest with coverage report                  |
| `test:debug` | Run Jest with Node inspector for debugging     |
| `test:e2e`   | Run end-to-end tests using the e2e Jest config |
