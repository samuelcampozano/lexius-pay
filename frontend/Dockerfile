FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1

# Next.js inlines NEXT_PUBLIC_* at build time — must be present during `next build`
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG NEXT_PUBLIC_AI_ORACLE_URL
ARG NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS
ARG NEXT_PUBLIC_STYLUS_RPC_URL
ENV NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID
ENV NEXT_PUBLIC_AI_ORACLE_URL=$NEXT_PUBLIC_AI_ORACLE_URL
ENV NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS=$NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS
ENV NEXT_PUBLIC_STYLUS_RPC_URL=$NEXT_PUBLIC_STYLUS_RPC_URL

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
