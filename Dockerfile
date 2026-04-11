# ── Stage 1: Build ───────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Копируем package.json/lock отдельно для кеширования npm install
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Копируем остальные файлы и собираем
COPY . .
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Копируем только собранный Nitro-output
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000
ENV NITRO_PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
