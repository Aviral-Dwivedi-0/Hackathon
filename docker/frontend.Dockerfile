FROM node:16-alpine

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy application
COPY frontend/ .

# Start development server
CMD ["npm", "start"]
