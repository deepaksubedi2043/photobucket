# Multi-stage lightweight build optimized for Hugging Face Spaces Free Tier (CPU Basic)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* bun.lock* ./

# Install all dependencies (including dev for building)
RUN npm install

# Copy source files
COPY . .

# Build Vite frontend & bundle Express server
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Ultra-lightweight Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Install production dependencies only
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy build artifacts and static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.html ./index.html

# Expose default Hugging Face Spaces web port
EXPOSE 7860

# Hugging Face Spaces non-root user requirement (UID 1000)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1000 appuser && \
    chown -R appuser:nodejs /app

USER appuser

# Start production server
CMD ["node", "dist/server.cjs"]
