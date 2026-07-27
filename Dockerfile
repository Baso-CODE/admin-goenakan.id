FROM oven/bun:1.1.38 AS base

WORKDIR /app

# 1. Install dependencies dasar, C++, dan Node.js 20+ resmi agar Prisma tidak protes
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    build-essential \
    curl \
    gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# 2. Copy dependency files
COPY package.json bun.lock* ./

# 3. Install dependencies (ditambah --ignore-scripts agar tidak error saat build argon2)
RUN bun install --frozen-lockfile --ignore-scripts

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