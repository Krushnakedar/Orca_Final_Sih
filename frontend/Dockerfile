# Stage 1: Build the React/Vite App
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend code
COPY . .

# Build the app (generates dist/ folder with sw.js)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# 1. Copy your custom nginx.conf (This was missing in your old file!)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. Copy the built app from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]