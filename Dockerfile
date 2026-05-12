# Build Stage
FROM oven/bun:latest as builder

WORKDIR /app

# Salin package files
COPY package.json bun.lock ./

# Install dependensi
RUN bun install --frozen-lockfile

# Salin seluruh kode
COPY . .

# Build aplikasi (Nitro preset: cloudrun sudah diatur di vite.config.ts)
RUN bun run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Nitro output ada di .output
COPY --from=builder /app/.output ./.output

# Port default Cloud Run adalah 8080
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Jalankan server Nitro
CMD ["node", ".output/server/index.mjs"]
