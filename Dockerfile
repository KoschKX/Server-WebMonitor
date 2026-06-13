FROM fedora:latest

# Install system dependencies for systeminformation
RUN dnf install -y \
    nodejs \
    npm \
    lshw \
    util-linux \
    pciutils \
    usbutils \
    procps-ng \
    sysstat \
    && dnf clean all

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY server.js ./
COPY public ./public

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
