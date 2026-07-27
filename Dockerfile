# Gunakan image Bun versi terbaru yang mendukung lockfile versi modern
FROM oven/bun:latest AS base

WORKDIR /app

# 1. Install Library C++, Python, dan Make (Wajib untuk kompilasi argon2 & modul native)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

# 2. Copy dependency files
COPY package.json bun.lock* ./

# 3. Install dependencies 
# Menggunakan 'bun install' biasa (tanpa --frozen-lockfile) agar aman jika ada perbedaan versi lockfile
RUN bun install

# 4. Copy seluruh kode source 
COPY . .

# 5. Generate Prisma Client
RUN bunx prisma generate

# 6. Build Next.js
ARG NEXT_PUBLIC_BASE_URL_API
ARG NEXT_PUBLIC_BASE_URL_WEB

ENV NEXT_PUBLIC_BASE_URL_API="https://api.goenakan.tech"
ENV NEXT_PUBLIC_BASE_URL_WEB="https://goenakan.tech"
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# 7. Cleanup
RUN rm -rf .next/cache

# 8. Expose port & Start
EXPOSE 3000
CMD ["bun", "run", "start"]
