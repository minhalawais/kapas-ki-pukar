FROM node:24.12.0-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update && apt-get install --no-install-recommends -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json .npmrc ./
COPY packages/domain ./packages/domain
COPY packages/security ./packages/security
COPY packages/database ./packages/database
RUN pnpm install --filter @kapas/database... --frozen-lockfile
RUN pnpm --filter @kapas/database db:generate

FROM node:24.12.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /workspace/packages/database
RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl libssl3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PRISMA_SCHEMA_ENGINE_BINARY=/workspace/node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x
COPY --from=build /workspace/packages/database /workspace/packages/database
COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/package.json /workspace/package.json
COPY --from=build /workspace/pnpm-lock.yaml /workspace/pnpm-lock.yaml
COPY --from=build /workspace/pnpm-workspace.yaml /workspace/pnpm-workspace.yaml
ENV PATH="/workspace/node_modules/.bin:${PATH}"
CMD ["prisma", "migrate", "deploy"]
