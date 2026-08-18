# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy full application source
COPY . .

# Build Vite application for production
RUN npm run build

# Stage 2: Production Nginx stage
FROM nginx:alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with COOP/COEP WASM headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8998

CMD ["nginx", "-g", "daemon off;"]
