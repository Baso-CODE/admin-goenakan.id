# Gunakan image resmi Bun (sudah berbasis Debian, jadi support apt-get)
FROM oven/bun:latest

WORKDIR /app

# 1. Install Library C++ & Python (Wajib untuk Argon2 di NextAuth)
# Sama persis seperti di backend agar tidak error "libstdc++"
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    libstdc++-12-dev

# 2. Copy dependency definition
# Pastikan nama file lock kamu 'bun.lock' (sesuai backend tadi)
COPY package.json bun.lock ./

# 3. Install dependencies (Jauh lebih cepat pakai Bun)
RUN bun install

# 4. Copy seluruh kode source
COPY . .

# 5. Build Next.js untuk production
# Ini akan menjalankan perintah "next build" via Bun
RUN bun run build

# 6. Expose Port (Next.js default 3000)
EXPOSE 3000

# 7. Jalankan Aplikasi
CMD ["bun", "run", "start"]