# Use Node.js 18-slim for a much smaller image
FROM node:18-slim

# Install build dependencies for sqlite3 (only needed if prebuilt binaries aren't used)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests
COPY package*.json ./

# Install dependencies (ignoring scripts can sometimes skip unnecessary compilation)
RUN npm install

# Copy local code
COPY . .

# Ensure assets directory exists
RUN mkdir -p assets

# Expose port 3000
EXPOSE 3000

# Start the server (seeding DB on startup)
CMD [ "sh", "-c", "node seed.js && npm start" ]
