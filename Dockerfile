FROM node:20-alpine AS runner

WORKDIR /app

# Install dependencies needed for sharp and native build tools if required
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build application (Vite + esbuild server bundle)
ENV NODE_ENV=production
RUN npm run build

# Set Hugging Face Spaces environment defaults
ENV PORT=7860
EXPOSE 7860
EXPOSE 3000

# Create and switch to non-root user for Hugging Face Spaces security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1000 appuser && \
    chown -R appuser:nodejs /app

USER appuser

# Start production server
CMD ["node", "dist/server.cjs"]
