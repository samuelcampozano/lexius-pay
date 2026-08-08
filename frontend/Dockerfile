FROM node:22-alpine AS builder
WORKDIR /app

# Declare build-time args so Next.js can inline NEXT_PUBLIC_* vars during `next build`
ARG NEXT_PUBLIC_PRIVY_APP_ID=cmsdomun500060dk3xvzqpgoy
ARG NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS
ARG NEXT_PUBLIC_STYLUS_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARG NEXT_PUBLIC_AI_ORACLE_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

# Expose them as ENV so `npm run build` can see them
ENV NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID
ENV NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS=$NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS
ENV NEXT_PUBLIC_STYLUS_RPC_URL=$NEXT_PUBLIC_STYLUS_RPC_URL
ENV NEXT_PUBLIC_AI_ORACLE_URL=$NEXT_PUBLIC_AI_ORACLE_URL
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

COPY package*.json tsconfig.json ./
RUN npm install --frozen-lockfile || npm install
COPY src ./src
COPY public ./public
COPY tailwind.config.ts postcss.config.js next.config.js ./
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
