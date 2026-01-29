# Stage 1: Build environment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create production build
RUN npm run build || true

# Stage 2: Production environment
FROM node:18-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    ca-certificates \
    tzdata

# Copy built application from builder stage
COPY --from=builder /app /app

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create necessary directories
RUN mkdir -p \
    /var/log/nginx \
    /var/log/supervisor \
    /var/cache/nginx \
    /var/run/nginx \
    /var/run/supervisor

# Set permissions
RUN chown -R node:node /app /var/log /var/cache/nginx /var/run

# Switch to non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Expose ports
EXPOSE 3000 80 443

# Start services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]