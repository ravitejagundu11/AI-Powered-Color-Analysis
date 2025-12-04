# Stage 1: Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set the API URL as a build argument and environment variable
ARG VITE_API_BASE_URL=http://35.226.154.58:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application with production environment
RUN npm run build

# Stage 2: Production stage with nginx
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
