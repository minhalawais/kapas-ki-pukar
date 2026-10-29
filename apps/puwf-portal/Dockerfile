FROM node:24.12.0-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json .npmrc ./
COPY packages ./packages
COPY apps/puwf-portal/package.json ./apps/puwf-portal/package.json
RUN pnpm install --filter @kapas/puwf-portal... --frozen-lockfile
COPY apps/puwf-portal ./apps/puwf-portal
RUN pnpm install --filter @kapas/puwf-portal... --offline --frozen-lockfile
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_ENABLED=true
ARG NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BACKEND_ENABLED=$NEXT_PUBLIC_BACKEND_ENABLED
ENV NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS=$NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS
RUN test -n "$NEXT_PUBLIC_API_URL"
RUN pnpm --filter @kapas/puwf-portal build

FROM node:24.12.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get upgrade --no-install-recommends -y && rm -rf /var/lib/apt/lists/* /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/pnpm /usr/local/bin/pnpx /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=build --chown=node:node /workspace/apps/puwf-portal/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/puwf-portal/.next/static ./apps/puwf-portal/.next/static
COPY --from=build --chown=node:node /workspace/apps/puwf-portal/public ./apps/puwf-portal/public
USER node
EXPOSE 3000
CMD ["node", "apps/puwf-portal/server.js"]
