FROM oven/bun:latest AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./

RUN bun install

COPY . .

RUN bunx prisma generate

ENV NEXT_PUBLIC_BASE_URL_API="https://api.goenakan.tech"
ENV NEXT_PUBLIC_BASE_URL_WEB="https://goenakan.tech"
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

RUN rm -rf .next/cache

EXPOSE 3000

CMD ["bun", "run", "start"]