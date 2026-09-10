FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_WHATSAPP_ORDER_PHONE=""
ENV NEXT_PUBLIC_WHATSAPP_ORDER_PHONE=$NEXT_PUBLIC_WHATSAPP_ORDER_PHONE
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    UPLOADS_DIR=/app/public/uploads
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/db/migrations ./db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts/init-db.mjs /app/scripts/create-local-admin.mjs /app/scripts/start-container.sh ./scripts/
COPY --from=builder --chown=nextjs:nodejs /app/lib/auth/security.mjs ./lib/auth/security.mjs
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads && chmod +x /app/scripts/start-container.sh
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/scripts/start-container.sh"]
