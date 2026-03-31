# Stage 1: Build the Angular app
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./
RUN npm install

# Copy the rest of the app and build
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the built app from Stage 1
# Note: For Angular 17+ with the application builder, the output path is usually dist/<project-name>/browser
COPY --from=build /app/dist/formbuilder/browser /usr/share/nginx/html

# Copy a custom nginx proxy config if needed (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
