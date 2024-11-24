FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src/app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


FROM base AS builder
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm run build

FROM base AS runner
USER node
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/package.json ./
COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma
EXPOSE 3001
CMD ["/bin/sh", "-c", "node_modules/.bin/prisma migrate deploy && pnpm run start"]

