# Gunakan image Bun resmi
FROM oven/bun:latest

WORKDIR /app

# 1. Install Library C++ (Wajib untuk Argon2/NextAuth)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    libstdc++-12-dev

# 2. Copy dependency files
COPY package.json bun.lock* ./

# 3. Install dependencies
RUN bun install

# 4. Copy seluruh kode source (Termasuk folder prisma/)
COPY . .

# === PERBAIKAN UTAMA DI SINI ===
# 5. Generate Prisma Client
# Ini wajib dijalankan sebelum "bun run build" agar Next.js mengenali Prisma
RUN bunx prisma generate
# ===============================

# 6. Build Next.js
# Pastikan environment variable production terbaca saat build
ARG NEXT_PUBLIC_BASE_URL_API
ARG NEXT_PUBLIC_BASE_URL_WEB
ENV NEXT_PUBLIC_BASE_URL_API=$NEXT_PUBLIC_BASE_URL_API
ENV NEXT_PUBLIC_BASE_URL_WEB=$NEXT_PUBLIC_BASE_URL_WEB

# (Opsional) Matikan telemetry Next.js agar log lebih bersih
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# 7. Expose port & Start
EXPOSE 3000
CMD ["bun", "run", "start"]