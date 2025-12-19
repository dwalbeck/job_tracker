FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Create directory and copy built app
RUN mkdir -p /var/www/jobtracker/build
COPY --from=build /app/build /var/www/jobtracker/build

# Copy nginx configuration
COPY docker/portal.jobtracknow.com.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 3000
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
