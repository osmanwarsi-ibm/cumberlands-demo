# Multi-stage Dockerfile for Cumberland Farms DSD Reconciliation MVP Frontend
# Stage 1: Build stage with Node.js
FROM node:22-slim AS build

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./

# Build production bundle
RUN npm run build

# Stage 2: Nginx runtime
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Set backend host as build arg and environment variable
ARG BACKEND_HOST=backend
ENV BACKEND_HOST=${BACKEND_HOST}

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Expose frontend port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
