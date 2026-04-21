# Use lightweight Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first (for better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose port (documentation only)
EXPOSE 5000

# Health check — Docker and ECS use this to detect unhealthy containers
# and restart them automatically without manual intervention.
# --interval=30s  check every 30 seconds
# --timeout=10s   fail the check if no response within 10 seconds
# --retries=3     mark as unhealthy after 3 consecutive failures
# --start-period=15s  give the app time to boot before checks begin
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start server
CMD ["node", "server.js"]