# Gunakan image Bun resmi versi stabil
FROM oven/bun:1.1.38 AS base

WORKDIR /app

# 1. Install Library C++ (Diperbarui: Menghapus paket libstdc++-12-dev yang tidak ditemukan)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl && \
    rm -rf /var/lib/apt/lists/*

# 2. Copy dependency files
COPY package.json bun.lock* ./

# 3. Install dependencies dengan mode yang lebih aman dan toleran
RUN bun install --frozen-lockfile --ignore-scripts || bun install --no-save

# 4. Copy seluruh kode source (Termasuk folder prisma/)
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