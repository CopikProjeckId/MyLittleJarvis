# JARVIS 2-Flow Dockerfile
# Production-ready container configuration

FROM node:22-alpine

# Install dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    wget

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install Node dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Create required directories
RUN mkdir -p logs data/memory config && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Set environment
ENV NODE_ENV=production
ENV PORT=18789
ENV OLLAMA_HOST=http://host.docker.internal:11434

# Expose port
EXPOSE 18789

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:18789/health || exit 1

# Start JARVIS (matches package.json main entry)
CMD ["node", "cli.js"]
