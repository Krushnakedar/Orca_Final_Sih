# Stage 1: Build the React/Vite App
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of your frontend code
COPY . .

# Build the app (this generates your dist/ folder with sw.js inside)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# 1. Copy your custom nginx.conf into the container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. Copy the built React app from Stage 1 into the Nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]