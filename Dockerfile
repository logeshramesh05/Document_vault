FROM oven/bun:1

WORKDIR /app

# Copy dependency files
COPY package.json bun.lockb* bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN bunx prisma generate

# Copy application source
COPY . .

EXPOSE 10000

# Apply migrations and start GraphQL server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/index.ts"]
