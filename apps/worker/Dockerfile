FROM node:24.12.0-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update && apt-get install --no-install-recommends -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json .npmrc ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
COPY apps/worker/package.json ./apps/worker/package.json
RUN pnpm install --filter @kapas/api... --filter @kapas/worker... --frozen-lockfile
COPY apps/worker ./apps/worker
RUN pnpm install --filter @kapas/worker... --offline --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @kapas/worker build
RUN pnpm --filter @kapas/worker deploy --prod /runtime

FROM node:24.12.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update \
  && apt-get upgrade --no-install-recommends -y \
  && rm -rf /var/lib/apt/lists/* \
    /usr/local/lib/node_modules/npm \
    /usr/local/lib/node_modules/corepack \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/pnpm /usr/local/bin/pnpx /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=build --chown=node:node /runtime/package.json ./package.json
COPY --from=build --chown=node:node /runtime/node_modules ./node_modules
COPY --from=build --chown=node:node /runtime/dist ./dist
USER node
CMD ["node", "dist/main.js"]
