# Development Dockerfile for React application
FROM ubuntu/nginx:1.18-22.04_beta

RUN mkdir /var/www/jobtracker

# Set working directory
WORKDIR /var/www/jobtracker

RUN apt update && apt -y install curl \
    nodejs \
    npm \
    vim && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY docker/portal.jobtracker.com.conf /etc/nginx/sites-available/portal.jobtracker.com.conf

# Install all dependencies (including dev dependencies)
RUN npm install && \
    ln -s /etc/nginx/sites-available/portal.jobtracker.com.conf /etc/nginx/sites-enabled/portal.jobtracker.com.conf && \
    rm /etc/nginx/sites-enabled/default && \
    service nginx restart

# Copy source code
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports
EXPOSE 80 3000

# Use entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]