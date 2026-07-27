# Gunakan image Bun resmi versi stabil
FROM oven/bun:1.1.38 AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile && bun pm trust argon2

COPY . .

# 5. Generate Prisma Client (Solusi error Prisma)
RUN bunx prisma generate

# 6. Build Next.js
ARG NEXT_PUBLIC_BASE_URL_API
ARG NEXT_PUBLIC_BASE_URL_WEB

ENV NEXT_PUBLIC_BASE_URL_API="https://api.goenakan.tech"
ENV NEXT_PUBLIC_BASE_URL_WEB="https://goenakan.tech"
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# 7. Cleanup (reduce image size)
RUN rm -rf .next/cache

# 8. Expose port & Start
EXPOSE 3000
CMD ["bun", "run", "start"]