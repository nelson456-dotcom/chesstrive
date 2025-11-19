# Deployment Instructions

## Overview

This document provides step-by-step instructions for deploying the Chess Analysis Board application to production.

## Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- Stockfish chess engine
- Syzygy tablebase files (optional)
- A server with at least 4GB RAM and 2 CPU cores

## Environment Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

Create `.env` files in both backend and frontend directories:

**backend/.env:**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/chess-analysis
STOCKFISH_PATH=/usr/local/bin/stockfish
TABLEBASE_PATH=/path/to/syzygy/tablebase
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**frontend/.env:**
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id
```

## Backend Deployment

### 1. Install Stockfish

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install stockfish
```

**CentOS/RHEL:**
```bash
sudo yum install stockfish
```

**macOS:**
```bash
brew install stockfish
```

**From Source:**
```bash
git clone https://github.com/official-stockfish/Stockfish.git
cd Stockfish/src
make -j$(nproc)
sudo make install
```

### 2. Install Syzygy Tablebase (Optional)

```bash
# Download tablebase files (requires significant disk space)
wget https://tablebase.lichess.ovh/tables/standard/3-4-5/3-4-5-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/3-4-5/3-4-5-piece.rtbz
wget https://tablebase.lichess.ovh/tables/standard/6/6-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/6/6-piece.rtbz
wget https://tablebase.lichess.ovh/tables/standard/7/7-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/7/7-piece.rtbz

# Place in tablebase directory
sudo mkdir -p /opt/chess/tablebase
sudo mv *.rtb* /opt/chess/tablebase/
```

### 3. Configure MongoDB

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
use chess-analysis
db.createUser({
  user: "chess-user",
  pwd: "your-password",
  roles: ["readWrite"]
})
```

### 4. Build and Start Backend

```bash
cd backend
npm run build
npm start
```

### 5. Set up Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'chess-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Frontend Deployment

### 1. Build for Production

```bash
cd frontend
npm run build
```

### 2. Serve with Nginx

**Install Nginx:**
```bash
sudo apt-get install nginx
```

**Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/chess-analysis
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/chess-analysis/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/chess-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker Deployment

### 1. Create Dockerfile

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Stockfish
RUN apk add --no-cache stockfish

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: chess-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    container_name: chess-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/chess-analysis?authSource=admin
      STOCKFISH_PATH: /usr/bin/stockfish
    depends_on:
      - mongodb
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    container_name: chess-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: http://localhost:3001/api
    ports:
      - "80:80"

volumes:
  mongodb_data:
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Monitoring and Logging

### 1. Set up Logging

```bash
# Create log directory
sudo mkdir -p /var/log/chess-analysis
sudo chown -R $USER:$USER /var/log/chess-analysis

# Configure logrotate
sudo nano /etc/logrotate.d/chess-analysis
```

```
/var/log/chess-analysis/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 2. Set up Monitoring

**Install monitoring tools:**
```bash
# Install htop for system monitoring
sudo apt-get install htop

# Install monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h /)"
echo "=== Chess Services ==="
echo "Backend: $(pm2 status chess-backend)"
echo "MongoDB: $(systemctl is-active mongod)"
echo "Nginx: $(systemctl is-active nginx)"
EOF

chmod +x monitor.sh
```

### 3. Set up Alerts

```bash
# Install mailutils for email alerts
sudo apt-get install mailutils

# Create alert script
cat > alert.sh << 'EOF'
#!/bin/bash
if ! pm2 status chess-backend | grep -q "online"; then
    echo "Chess backend is down!" | mail -s "Chess Backend Alert" admin@yourdomain.com
fi
EOF

chmod +x alert.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /path/to/alert.sh
```

## Performance Optimization

### 1. Database Optimization

```javascript
// Create indexes for better performance
db.openingmoves.createIndex({ "fen": 1 })
db.openingmoves.createIndex({ "total": -1 })
db.games.createIndex({ "userId": 1, "createdAt": -1 })
```

### 2. Caching

```bash
# Install Redis for caching
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru
```

### 3. CDN Setup

Use a CDN like CloudFlare or AWS CloudFront to serve static assets:

1. Upload built frontend files to CDN
2. Configure CDN to cache static assets
3. Update DNS to point to CDN

## Security Considerations

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3001   # Block direct access to backend
```

### 2. SSL/TLS Configuration

```nginx
# Add to Nginx config
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### 3. Rate Limiting

```javascript
// Add to backend
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db chess-analysis --out /backup/chess-analysis-$DATE
tar -czf /backup/chess-analysis-$DATE.tar.gz /backup/chess-analysis-$DATE
rm -rf /backup/chess-analysis-$DATE
find /backup -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 2. Application Backup

```bash
# Backup application files
tar -czf /backup/chess-analysis-app-$(date +%Y%m%d).tar.gz /path/to/chess-analysis
```

## Troubleshooting

### Common Issues

1. **Stockfish not found**: Ensure Stockfish is installed and in PATH
2. **MongoDB connection failed**: Check MongoDB service and connection string
3. **Memory issues**: Increase server RAM or optimize application
4. **SSL certificate issues**: Check certificate validity and renewal

### Log Locations

- Backend logs: `/var/log/chess-analysis/`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `/var/log/mongodb/`
- PM2 logs: `~/.pm2/logs/`

### Performance Monitoring

```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Monitor MongoDB
mongostat

# Monitor Nginx
nginx -t
```

## Scaling

### Horizontal Scaling

1. Use load balancer (HAProxy, Nginx)
2. Deploy multiple backend instances
3. Use MongoDB replica set
4. Implement Redis clustering

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Implement caching strategies
4. Use CDN for static assets

## Maintenance

### Regular Tasks

1. **Daily**: Check service status and logs
2. **Weekly**: Review performance metrics
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Review and optimize database

### Update Procedure

```bash
# Update application
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart chess-backend
sudo systemctl reload nginx
```

This deployment guide provides a comprehensive approach to deploying the Chess Analysis Board application in production. Adjust the configuration based on your specific requirements and infrastructure.

## Overview

This document provides step-by-step instructions for deploying the Chess Analysis Board application to production.

## Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- Stockfish chess engine
- Syzygy tablebase files (optional)
- A server with at least 4GB RAM and 2 CPU cores

## Environment Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

Create `.env` files in both backend and frontend directories:

**backend/.env:**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/chess-analysis
STOCKFISH_PATH=/usr/local/bin/stockfish
TABLEBASE_PATH=/path/to/syzygy/tablebase
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**frontend/.env:**
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id
```

## Backend Deployment

### 1. Install Stockfish

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install stockfish
```

**CentOS/RHEL:**
```bash
sudo yum install stockfish
```

**macOS:**
```bash
brew install stockfish
```

**From Source:**
```bash
git clone https://github.com/official-stockfish/Stockfish.git
cd Stockfish/src
make -j$(nproc)
sudo make install
```

### 2. Install Syzygy Tablebase (Optional)

```bash
# Download tablebase files (requires significant disk space)
wget https://tablebase.lichess.ovh/tables/standard/3-4-5/3-4-5-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/3-4-5/3-4-5-piece.rtbz
wget https://tablebase.lichess.ovh/tables/standard/6/6-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/6/6-piece.rtbz
wget https://tablebase.lichess.ovh/tables/standard/7/7-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/7/7-piece.rtbz

# Place in tablebase directory
sudo mkdir -p /opt/chess/tablebase
sudo mv *.rtb* /opt/chess/tablebase/
```

### 3. Configure MongoDB

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
use chess-analysis
db.createUser({
  user: "chess-user",
  pwd: "your-password",
  roles: ["readWrite"]
})
```

### 4. Build and Start Backend

```bash
cd backend
npm run build
npm start
```

### 5. Set up Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'chess-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Frontend Deployment

### 1. Build for Production

```bash
cd frontend
npm run build
```

### 2. Serve with Nginx

**Install Nginx:**
```bash
sudo apt-get install nginx
```

**Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/chess-analysis
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/chess-analysis/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/chess-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker Deployment

### 1. Create Dockerfile

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Stockfish
RUN apk add --no-cache stockfish

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: chess-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    container_name: chess-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/chess-analysis?authSource=admin
      STOCKFISH_PATH: /usr/bin/stockfish
    depends_on:
      - mongodb
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    container_name: chess-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: http://localhost:3001/api
    ports:
      - "80:80"

volumes:
  mongodb_data:
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Monitoring and Logging

### 1. Set up Logging

```bash
# Create log directory
sudo mkdir -p /var/log/chess-analysis
sudo chown -R $USER:$USER /var/log/chess-analysis

# Configure logrotate
sudo nano /etc/logrotate.d/chess-analysis
```

```
/var/log/chess-analysis/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 2. Set up Monitoring

**Install monitoring tools:**
```bash
# Install htop for system monitoring
sudo apt-get install htop

# Install monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h /)"
echo "=== Chess Services ==="
echo "Backend: $(pm2 status chess-backend)"
echo "MongoDB: $(systemctl is-active mongod)"
echo "Nginx: $(systemctl is-active nginx)"
EOF

chmod +x monitor.sh
```

### 3. Set up Alerts

```bash
# Install mailutils for email alerts
sudo apt-get install mailutils

# Create alert script
cat > alert.sh << 'EOF'
#!/bin/bash
if ! pm2 status chess-backend | grep -q "online"; then
    echo "Chess backend is down!" | mail -s "Chess Backend Alert" admin@yourdomain.com
fi
EOF

chmod +x alert.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /path/to/alert.sh
```

## Performance Optimization

### 1. Database Optimization

```javascript
// Create indexes for better performance
db.openingmoves.createIndex({ "fen": 1 })
db.openingmoves.createIndex({ "total": -1 })
db.games.createIndex({ "userId": 1, "createdAt": -1 })
```

### 2. Caching

```bash
# Install Redis for caching
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru
```

### 3. CDN Setup

Use a CDN like CloudFlare or AWS CloudFront to serve static assets:

1. Upload built frontend files to CDN
2. Configure CDN to cache static assets
3. Update DNS to point to CDN

## Security Considerations

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3001   # Block direct access to backend
```

### 2. SSL/TLS Configuration

```nginx
# Add to Nginx config
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### 3. Rate Limiting

```javascript
// Add to backend
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db chess-analysis --out /backup/chess-analysis-$DATE
tar -czf /backup/chess-analysis-$DATE.tar.gz /backup/chess-analysis-$DATE
rm -rf /backup/chess-analysis-$DATE
find /backup -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 2. Application Backup

```bash
# Backup application files
tar -czf /backup/chess-analysis-app-$(date +%Y%m%d).tar.gz /path/to/chess-analysis
```

## Troubleshooting

### Common Issues

1. **Stockfish not found**: Ensure Stockfish is installed and in PATH
2. **MongoDB connection failed**: Check MongoDB service and connection string
3. **Memory issues**: Increase server RAM or optimize application
4. **SSL certificate issues**: Check certificate validity and renewal

### Log Locations

- Backend logs: `/var/log/chess-analysis/`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `/var/log/mongodb/`
- PM2 logs: `~/.pm2/logs/`

### Performance Monitoring

```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Monitor MongoDB
mongostat

# Monitor Nginx
nginx -t
```

## Scaling

### Horizontal Scaling

1. Use load balancer (HAProxy, Nginx)
2. Deploy multiple backend instances
3. Use MongoDB replica set
4. Implement Redis clustering

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Implement caching strategies
4. Use CDN for static assets

## Maintenance

### Regular Tasks

1. **Daily**: Check service status and logs
2. **Weekly**: Review performance metrics
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Review and optimize database

### Update Procedure

```bash
# Update application
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart chess-backend
sudo systemctl reload nginx
```

This deployment guide provides a comprehensive approach to deploying the Chess Analysis Board application in production. Adjust the configuration based on your specific requirements and infrastructure.

## Overview

This document provides step-by-step instructions for deploying the Chess Analysis Board application to production.

## Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- Stockfish chess engine
- Syzygy tablebase files (optional)
- A server with at least 4GB RAM and 2 CPU cores

## Environment Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

Create `.env` files in both backend and frontend directories:

**backend/.env:**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/chess-analysis
STOCKFISH_PATH=/usr/local/bin/stockfish
TABLEBASE_PATH=/path/to/syzygy/tablebase
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**frontend/.env:**
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id
```

## Backend Deployment

### 1. Install Stockfish

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install stockfish
```

**CentOS/RHEL:**
```bash
sudo yum install stockfish
```

**macOS:**
```bash
brew install stockfish
```

**From Source:**
```bash
git clone https://github.com/official-stockfish/Stockfish.git
cd Stockfish/src
make -j$(nproc)
sudo make install
```

### 2. Install Syzygy Tablebase (Optional)

```bash
# Download tablebase files (requires significant disk space)
wget https://tablebase.lichess.ovh/tables/standard/3-4-5/3-4-5-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/3-4-5/3-4-5-piece.rtbz
wget https://tablebase.lichess.ovh/tables/standard/6/6-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/6/6-piece.rtbz
wget https://tablebase.lichess.ovh/tables/standard/7/7-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/7/7-piece.rtbz

# Place in tablebase directory
sudo mkdir -p /opt/chess/tablebase
sudo mv *.rtb* /opt/chess/tablebase/
```

### 3. Configure MongoDB

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
use chess-analysis
db.createUser({
  user: "chess-user",
  pwd: "your-password",
  roles: ["readWrite"]
})
```

### 4. Build and Start Backend

```bash
cd backend
npm run build
npm start
```

### 5. Set up Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'chess-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Frontend Deployment

### 1. Build for Production

```bash
cd frontend
npm run build
```

### 2. Serve with Nginx

**Install Nginx:**
```bash
sudo apt-get install nginx
```

**Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/chess-analysis
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/chess-analysis/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/chess-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker Deployment

### 1. Create Dockerfile

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Stockfish
RUN apk add --no-cache stockfish

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: chess-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    container_name: chess-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/chess-analysis?authSource=admin
      STOCKFISH_PATH: /usr/bin/stockfish
    depends_on:
      - mongodb
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    container_name: chess-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: http://localhost:3001/api
    ports:
      - "80:80"

volumes:
  mongodb_data:
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Monitoring and Logging

### 1. Set up Logging

```bash
# Create log directory
sudo mkdir -p /var/log/chess-analysis
sudo chown -R $USER:$USER /var/log/chess-analysis

# Configure logrotate
sudo nano /etc/logrotate.d/chess-analysis
```

```
/var/log/chess-analysis/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 2. Set up Monitoring

**Install monitoring tools:**
```bash
# Install htop for system monitoring
sudo apt-get install htop

# Install monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h /)"
echo "=== Chess Services ==="
echo "Backend: $(pm2 status chess-backend)"
echo "MongoDB: $(systemctl is-active mongod)"
echo "Nginx: $(systemctl is-active nginx)"
EOF

chmod +x monitor.sh
```

### 3. Set up Alerts

```bash
# Install mailutils for email alerts
sudo apt-get install mailutils

# Create alert script
cat > alert.sh << 'EOF'
#!/bin/bash
if ! pm2 status chess-backend | grep -q "online"; then
    echo "Chess backend is down!" | mail -s "Chess Backend Alert" admin@yourdomain.com
fi
EOF

chmod +x alert.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /path/to/alert.sh
```

## Performance Optimization

### 1. Database Optimization

```javascript
// Create indexes for better performance
db.openingmoves.createIndex({ "fen": 1 })
db.openingmoves.createIndex({ "total": -1 })
db.games.createIndex({ "userId": 1, "createdAt": -1 })
```

### 2. Caching

```bash
# Install Redis for caching
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru
```

### 3. CDN Setup

Use a CDN like CloudFlare or AWS CloudFront to serve static assets:

1. Upload built frontend files to CDN
2. Configure CDN to cache static assets
3. Update DNS to point to CDN

## Security Considerations

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3001   # Block direct access to backend
```

### 2. SSL/TLS Configuration

```nginx
# Add to Nginx config
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### 3. Rate Limiting

```javascript
// Add to backend
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db chess-analysis --out /backup/chess-analysis-$DATE
tar -czf /backup/chess-analysis-$DATE.tar.gz /backup/chess-analysis-$DATE
rm -rf /backup/chess-analysis-$DATE
find /backup -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 2. Application Backup

```bash
# Backup application files
tar -czf /backup/chess-analysis-app-$(date +%Y%m%d).tar.gz /path/to/chess-analysis
```

## Troubleshooting

### Common Issues

1. **Stockfish not found**: Ensure Stockfish is installed and in PATH
2. **MongoDB connection failed**: Check MongoDB service and connection string
3. **Memory issues**: Increase server RAM or optimize application
4. **SSL certificate issues**: Check certificate validity and renewal

### Log Locations

- Backend logs: `/var/log/chess-analysis/`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `/var/log/mongodb/`
- PM2 logs: `~/.pm2/logs/`

### Performance Monitoring

```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Monitor MongoDB
mongostat

# Monitor Nginx
nginx -t
```

## Scaling

### Horizontal Scaling

1. Use load balancer (HAProxy, Nginx)
2. Deploy multiple backend instances
3. Use MongoDB replica set
4. Implement Redis clustering

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Implement caching strategies
4. Use CDN for static assets

## Maintenance

### Regular Tasks

1. **Daily**: Check service status and logs
2. **Weekly**: Review performance metrics
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Review and optimize database

### Update Procedure

```bash
# Update application
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart chess-backend
sudo systemctl reload nginx
```

This deployment guide provides a comprehensive approach to deploying the Chess Analysis Board application in production. Adjust the configuration based on your specific requirements and infrastructure.

## Overview

This document provides step-by-step instructions for deploying the Chess Analysis Board application to production.

## Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- Stockfish chess engine
- Syzygy tablebase files (optional)
- A server with at least 4GB RAM and 2 CPU cores

## Environment Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

Create `.env` files in both backend and frontend directories:

**backend/.env:**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/chess-analysis
STOCKFISH_PATH=/usr/local/bin/stockfish
TABLEBASE_PATH=/path/to/syzygy/tablebase
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**frontend/.env:**
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id
```

## Backend Deployment

### 1. Install Stockfish

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install stockfish
```

**CentOS/RHEL:**
```bash
sudo yum install stockfish
```

**macOS:**
```bash
brew install stockfish
```

**From Source:**
```bash
git clone https://github.com/official-stockfish/Stockfish.git
cd Stockfish/src
make -j$(nproc)
sudo make install
```

### 2. Install Syzygy Tablebase (Optional)

```bash
# Download tablebase files (requires significant disk space)
wget https://tablebase.lichess.ovh/tables/standard/3-4-5/3-4-5-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/3-4-5/3-4-5-piece.rtbz
wget https://tablebase.lichess.ovh/tables/standard/6/6-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/6/6-piece.rtbz
wget https://tablebase.lichess.ovh/tables/standard/7/7-piece.rtbw
wget https://tablebase.lichess.ovh/tables/standard/7/7-piece.rtbz

# Place in tablebase directory
sudo mkdir -p /opt/chess/tablebase
sudo mv *.rtb* /opt/chess/tablebase/
```

### 3. Configure MongoDB

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
use chess-analysis
db.createUser({
  user: "chess-user",
  pwd: "your-password",
  roles: ["readWrite"]
})
```

### 4. Build and Start Backend

```bash
cd backend
npm run build
npm start
```

### 5. Set up Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'chess-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Frontend Deployment

### 1. Build for Production

```bash
cd frontend
npm run build
```

### 2. Serve with Nginx

**Install Nginx:**
```bash
sudo apt-get install nginx
```

**Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/chess-analysis
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/chess-analysis/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/chess-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker Deployment

### 1. Create Dockerfile

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Stockfish
RUN apk add --no-cache stockfish

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: chess-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    container_name: chess-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/chess-analysis?authSource=admin
      STOCKFISH_PATH: /usr/bin/stockfish
    depends_on:
      - mongodb
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    container_name: chess-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: http://localhost:3001/api
    ports:
      - "80:80"

volumes:
  mongodb_data:
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Monitoring and Logging

### 1. Set up Logging

```bash
# Create log directory
sudo mkdir -p /var/log/chess-analysis
sudo chown -R $USER:$USER /var/log/chess-analysis

# Configure logrotate
sudo nano /etc/logrotate.d/chess-analysis
```

```
/var/log/chess-analysis/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 2. Set up Monitoring

**Install monitoring tools:**
```bash
# Install htop for system monitoring
sudo apt-get install htop

# Install monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h /)"
echo "=== Chess Services ==="
echo "Backend: $(pm2 status chess-backend)"
echo "MongoDB: $(systemctl is-active mongod)"
echo "Nginx: $(systemctl is-active nginx)"
EOF

chmod +x monitor.sh
```

### 3. Set up Alerts

```bash
# Install mailutils for email alerts
sudo apt-get install mailutils

# Create alert script
cat > alert.sh << 'EOF'
#!/bin/bash
if ! pm2 status chess-backend | grep -q "online"; then
    echo "Chess backend is down!" | mail -s "Chess Backend Alert" admin@yourdomain.com
fi
EOF

chmod +x alert.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /path/to/alert.sh
```

## Performance Optimization

### 1. Database Optimization

```javascript
// Create indexes for better performance
db.openingmoves.createIndex({ "fen": 1 })
db.openingmoves.createIndex({ "total": -1 })
db.games.createIndex({ "userId": 1, "createdAt": -1 })
```

### 2. Caching

```bash
# Install Redis for caching
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru
```

### 3. CDN Setup

Use a CDN like CloudFlare or AWS CloudFront to serve static assets:

1. Upload built frontend files to CDN
2. Configure CDN to cache static assets
3. Update DNS to point to CDN

## Security Considerations

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3001   # Block direct access to backend
```

### 2. SSL/TLS Configuration

```nginx
# Add to Nginx config
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### 3. Rate Limiting

```javascript
// Add to backend
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db chess-analysis --out /backup/chess-analysis-$DATE
tar -czf /backup/chess-analysis-$DATE.tar.gz /backup/chess-analysis-$DATE
rm -rf /backup/chess-analysis-$DATE
find /backup -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 2. Application Backup

```bash
# Backup application files
tar -czf /backup/chess-analysis-app-$(date +%Y%m%d).tar.gz /path/to/chess-analysis
```

## Troubleshooting

### Common Issues

1. **Stockfish not found**: Ensure Stockfish is installed and in PATH
2. **MongoDB connection failed**: Check MongoDB service and connection string
3. **Memory issues**: Increase server RAM or optimize application
4. **SSL certificate issues**: Check certificate validity and renewal

### Log Locations

- Backend logs: `/var/log/chess-analysis/`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `/var/log/mongodb/`
- PM2 logs: `~/.pm2/logs/`

### Performance Monitoring

```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Monitor MongoDB
mongostat

# Monitor Nginx
nginx -t
```

## Scaling

### Horizontal Scaling

1. Use load balancer (HAProxy, Nginx)
2. Deploy multiple backend instances
3. Use MongoDB replica set
4. Implement Redis clustering

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Implement caching strategies
4. Use CDN for static assets

## Maintenance

### Regular Tasks

1. **Daily**: Check service status and logs
2. **Weekly**: Review performance metrics
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Review and optimize database

### Update Procedure

```bash
# Update application
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart chess-backend
sudo systemctl reload nginx
```

This deployment guide provides a comprehensive approach to deploying the Chess Analysis Board application in production. Adjust the configuration based on your specific requirements and infrastructure.




































































