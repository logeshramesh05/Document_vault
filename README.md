# Document Vault

GraphQL API for organizing documents into collections. Bun + TypeScript (strict) + GraphQL Yoga (schema-first) + PostgreSQL + Prisma.

## Setup

```bash
cp .env.example .env   # set DATABASE_URL to your Neon connection string
bun install
bun run gendb
bun run dev
```

Or run the API in Docker (still points at Neon via `.env`):

```bash
docker compose up -d --build
```

GraphQL endpoint: `http://localhost:4000/graphql`

## Scripts

- `bun run dev` — start the server
- `bun run gendb` — run Prisma migrations + generate client
- `bun run sanity` — lint + typecheck + test
- `bun run test:unit` — resolver unit tests (mocked Prisma)
- `bun run test:integration` — integration tests against Dockerized Postgres

## Design notes

- Schema-first GraphQL: `schema.graphql` is the source of truth, loaded at runtime; resolvers in `src/schema/resolvers.ts` delegate to pure, testable functions in `src/resolvers/*`.
- Cursor pagination fetches `take + 1` rows ordered by `(createdAt desc, id desc)`; the extra row determines `nextCursor` without a separate count query.
- Validation (`src/validation.ts`) throws `GraphQLError`s with `BAD_USER_INPUT` / `NOT_FOUND` extension codes instead of letting Prisma errors surface as 500s.
- All schema changes are real `prisma migrate dev` migrations under `prisma/migrations/`, not hand-edited SQL.
- Auth, RBAC, federation, caching, and deployment are intentionally out of scope per the assignment.

## Extending

- Auth: add a `user` on `Context`, scope `Collection`/`Document` queries by owner, enforce in resolvers rather than at the DB layer initially.
- Full-text search: replace substring `contains` with Postgres `tsvector`/`tsquery` + a GIN index once search volume grows.
- Soft delete: `deleteDocument` currently hard-deletes; swap to a `deletedAt` column if audit history is needed.
- Federation: extract `Collection`/`Document` into a subgraph once a second service needs to reference them.
