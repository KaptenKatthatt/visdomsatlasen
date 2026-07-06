# Beroenden (inkl. native-bygge av better-sqlite3), som newsAggs deps-steg.
FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Bygg SPA:t (dist/).
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Körsteg: Node-servern levererar både dist/ och /api.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_URL=/app/data/visdomsatlasen.db
ENV STATIC_DIR=/app/dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/data/fixtures ./data/fixtures
COPY --from=build /app/package.json /app/tsconfig.json /app/tsconfig.server.json ./
EXPOSE 8080
CMD ["node_modules/.bin/tsx", "server/index.ts"]
