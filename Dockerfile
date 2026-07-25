# Gunakan image Bun resmi
FROM oven/bun:latest

WORKDIR /app

# 1. Install Library C++ & Node.js/npm (Wajib untuk Argon2/NextAuth & NPM install fallback)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    nodejs \
    npm \
    libstdc++-12-dev && \
    rm -rf /var/lib/apt/lists/*  # 🔥 Clear apt cache

# 2. Copy dependency files
COPY package.json bun.lock* ./

# 3. Install dependencies using npm to bypass Bun tarball extraction bugs on overlayfs
RUN npm install --no-audit --no-fund

# 4. Copy seluruh kode source (Termasuk folder prisma/)
COPY . .

# 5. Generate Prisma Client (Solusi error Prisma)
RUN bunx prisma generate

# 6. Build Next.js
# Tangkap ARG dari platform deployment (Dokploy/Docker)
ARG NEXT_PUBLIC_BASE_URL_API
ARG NEXT_PUBLIC_BASE_URL_WEB

# Jadikan ARG sebagai ENV agar Next.js bisa membacanya saat build
ENV NEXT_PUBLIC_BASE_URL_API="https://api.goenakan.tech"
ENV NEXT_PUBLIC_BASE_URL_WEB="https://goenakan.tech"
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# 7. Cleanup (reduce image size)
RUN rm -rf .next/cache

# 8. Expose port & Start
EXPOSE 3000
CMD ["bun", "run", "start"]