# Build stage
FROM node:18-alpine AS builder

# Fix SSL issues and install build dependencies
RUN apk --no-check-certificate update && \
  apk --no-check-certificate upgrade && \
  apk --no-check-certificate add --no-cache ca-certificates g++ make python3 && \
  update-ca-certificates && \
  rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building) with legacy peer deps
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Fix SSL issues and install system dependencies, create user
RUN apk --no-check-certificate update && \
  apk --no-check-certificate upgrade && \
  apk --no-check-certificate add --no-cache ca-certificates dumb-init && \
  update-ca-certificates && \
  rm -rf /var/cache/apk/* && \
  addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001 -G nodejs

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies with legacy peer deps to handle Redis version conflict
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["dumb-init", "node", "dist/main.js"]
