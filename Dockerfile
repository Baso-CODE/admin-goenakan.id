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

# 4. Copy sisa kode
COPY . .

# 5. Build Next.js
# Pastikan environment variable production terbaca saat build
ARG NEXT_PUBLIC_BASE_URL_API
ARG NEXT_PUBLIC_BASE_URL_WEB
ENV NEXT_PUBLIC_BASE_URL_API=$NEXT_PUBLIC_BASE_URL_API
ENV NEXT_PUBLIC_BASE_URL_WEB=$NEXT_PUBLIC_BASE_URL_WEB

RUN bun run build

# 6. Expose port & Start
EXPOSE 3000
CMD ["bun", "run", "start"]