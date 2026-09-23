# ScousGiftCardExchange — production image
# Build:  docker compose build
# Run:    docker compose up -d
#
# The browser part of the app needs the VITE_* values at BUILD time, so they
# are passed in as build arguments (docker-compose.yml wires them from .env).
# Every server-side value (SMTP, service role key) is read at RUN time from the
# environment, so nothing secret is baked into the image.

FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock* bunfig.toml ./
RUN bun install --frozen-lockfile || bun install

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    NODE_ENV=production

RUN bun run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

RUN apk add --no-cache wget && addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/.output ./.output

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/ >/dev/null 2>&1 || exit 1

CMD ["node", ".output/server/index.mjs"]
