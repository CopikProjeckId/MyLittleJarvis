# JARVIS 2-Flow Dockerfile

FROM node:22-alpine

# Install dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install --production

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs data/memory

# Set environment
ENV NODE_ENV=production
ENV PORT=18789

# Expose port
EXPOSE 18789

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:18789/health || exit 1

# Start JARVIS
CMD ["node", "src/index.js"]
