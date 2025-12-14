# Use official Node.js image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy app source and database
# Note: SQLite data will be lost on container restart unless using a volume
COPY . .

# Expose port (Cloud Run sets PORT env var)
ENV PORT 8080
EXPOSE 8080

# Start server
CMD [ "node", "index.js" ]
