# Complete Deployment Guide: Hostinger VPS + GoDaddy Domain

This guide will walk you through deploying your chess application to a Hostinger VPS and linking it to your GoDaddy domain.

## Prerequisites

- Hostinger VPS access (SSH credentials)
- GoDaddy domain name
- Your VPS IP address (from Hostinger control panel)

---

## Part 1: VPS Setup (Hostinger)

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip-address
# Or if you have a username:
ssh username@your-vps-ip-address
```

### Step 2: Update System Packages

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Step 3: Install Required Software

#### Install Node.js (v18 or higher)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install Python 3.10+ and pip

```bash
sudo apt-get install -y python3 python3-pip python3-venv

# Verify installation
python3 --version
pip3 --version
```

#### Install MongoDB

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

#### Install Nginx

```bash
sudo apt-get install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

#### Install Redis (if needed)

```bash
sudo apt-get install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Install PM2 (Process Manager for Node.js)

```bash
sudo npm install -g pm2
```

### Step 4: Install Stockfish Chess Engine

```bash
sudo apt-get install -y stockfish

# Verify installation
stockfish --version
```

### Step 5: Set Up Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Part 2: Deploy Your Application

### Step 1: Create Application Directory

```bash
# Create directory for your app
sudo mkdir -p /var/www/chessrep
sudo chown -R $USER:$USER /var/www/chessrep
cd /var/www/chessrep
```

### Step 2: Upload Your Code

**⭐ RECOMMENDED: Using Git (Best Practice)**

**First, set up Git repository** (see `GIT_SETUP_GUIDE.md` for detailed instructions):

1. Create a GitHub/GitLab repository
2. Push your code to the repository
3. Then on your VPS:

```bash
# Install Git (if not already installed)
sudo apt-get install -y git

# Clone your repository
cd /var/www
git clone https://github.com/your-username/your-repo.git chessrep
cd chessrep
```

**Benefits of using Git:**
- Easy updates: Just `git pull` to update code
- Version control and rollback capability
- Industry standard practice
- See `GIT_SETUP_GUIDE.md` for complete Git setup instructions

**Alternative: Using SCP (Manual Upload)**

If you prefer not to use Git, you can upload manually:

```powershell
# In PowerShell on your Windows machine
scp -r "C:\Users\Nizar\Desktop\chessrep-main - Copy\chessrep-main\*" root@your-vps-ip:/var/www/chessrep/
```

**Note**: Manual upload makes updates more difficult. Git is strongly recommended.

### Step 3: Install Backend Dependencies

```bash
cd /var/www/chessrep/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r ../requirements.txt

# Install Node.js dependencies (if you have Node.js backend components)
npm install
```

### Step 4: Configure Environment Variables

```bash
# Create .env file for backend
nano /var/www/chessrep/backend/.env
```

Add the following content (adjust values as needed):

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=chessrep

# Server Configuration
ALLOWED_ORIGINS=https://yourdomain.com,http://yourdomain.com
PORT=8001

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Redis (if using)
REDIS_URL=redis://localhost:6379

# Other environment variables your app needs
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 5: Build Frontend

```bash
cd /var/www/chessrep/frontend

# Install dependencies
npm install

# Create .env file for frontend
nano /var/www/chessrep/frontend/.env
```

Add:

```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
```

Save and exit, then build:

```bash
npm run build
```

### Step 6: Start Backend with PM2

```bash
cd /var/www/chessrep/backend

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add:

```javascript
module.exports = {
  apps: [{
    name: 'chessrep-backend',
    script: 'server.py',
    interpreter: '/var/www/chessrep/backend/venv/bin/python3',
    args: '',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false
  }]
}
```

Or if using Node.js backend:

```javascript
module.exports = {
  apps: [{
    name: 'chessrep-backend',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true
  }]
}
```

Create logs directory and start:

```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Part 3: Configure Nginx

### Step 1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/chessrep
```

Add the following configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    location / {
        root /var/www/chessrep/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

Save and exit.

### Step 2: Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/chessrep /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Part 4: Link Domain (GoDaddy to Hostinger)

### Step 1: Get Your VPS IP Address

From your Hostinger control panel, note your VPS IP address (e.g., `123.45.67.89`).

### Step 2: Configure DNS in GoDaddy

1. **Log in to GoDaddy**
   - Go to https://www.godaddy.com
   - Sign in to your account
   - Go to "My Products" → "Domains"

2. **Access DNS Settings**
   - Click on your domain name
   - Click on "DNS" or "Manage DNS"

3. **Update DNS Records**
   
   **For the main domain (A Record):**
   - Find the A record with name `@` (or your domain name)
   - Click "Edit" or the pencil icon
   - Change the "Points to" value to your VPS IP address
   - TTL: 600 (or leave default)
   - Click "Save"

   **For www subdomain (A Record):**
   - Find or create an A record with name `www`
   - Set "Points to" to your VPS IP address
   - TTL: 600
   - Click "Save"

   **Example DNS Records:**
   ```
   Type    Name    Value           TTL
   A       @       123.45.67.89    600
   A       www     123.45.67.89    600
   ```

4. **Save Changes**
   - DNS changes can take 24-48 hours to propagate, but usually work within 1-2 hours
   - You can check propagation status at: https://www.whatsmydns.net

---

## Part 5: Set Up SSL Certificate (HTTPS)

### Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Auto-renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

---

## Part 6: Update Nginx for HTTPS

After SSL is installed, Certbot will automatically update your Nginx config. Verify it:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Your site should now be accessible at `https://yourdomain.com`

---

## Part 7: Final Steps

### 1. Update Frontend Environment Variables

After SSL is set up, update your frontend `.env`:

```bash
nano /var/www/chessrep/frontend/.env
```

Ensure it uses HTTPS:

```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
```

Rebuild frontend:

```bash
cd /var/www/chessrep/frontend
npm run build
```

### 2. Restart Services

```bash
# Restart backend
pm2 restart chessrep-backend

# Restart Nginx
sudo systemctl restart nginx
```

### 3. Verify Everything Works

- Visit `https://yourdomain.com` in your browser
- Check backend API: `https://yourdomain.com/api/status`
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs chessrep-backend`

---

## Troubleshooting

### Check Backend Logs

```bash
pm2 logs chessrep-backend
# Or
tail -f /var/www/chessrep/backend/logs/combined.log
```

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check MongoDB Status

```bash
sudo systemctl status mongod
```

### Test Backend Directly

```bash
curl http://localhost:8001/
```

### Common Issues

1. **502 Bad Gateway**: Backend not running or wrong port
   - Check: `pm2 status`
   - Check: `netstat -tulpn | grep 8001`

2. **DNS not resolving**: Wait for propagation or check DNS settings

3. **SSL certificate issues**: Ensure domain points to VPS before requesting certificate

4. **CORS errors**: Check `ALLOWED_ORIGINS` in backend `.env`

---

## Maintenance Commands

```bash
# View PM2 processes
pm2 list

# Restart backend
pm2 restart chessrep-backend

# Stop backend
pm2 stop chessrep-backend

# View logs
pm2 logs chessrep-backend

# Update code (if using Git - RECOMMENDED)
cd /var/www/chessrep
git pull origin main
cd frontend
npm install  # if package.json changed
npm run build
cd ../backend
source venv/bin/activate
pip install -r ../requirements.txt  # if requirements.txt changed
pm2 restart chessrep-backend

# Or use the update script (if you created one)
/var/www/chessrep/update.sh

# Check disk space
df -h

# Check memory usage
free -h
```

### Quick Update Script

Create an update script for easier deployments:

```bash
nano /var/www/chessrep/update.sh
```

Add:

```bash
#!/bin/bash
set -e
cd /var/www/chessrep
git pull origin main
cd frontend && npm install && npm run build
cd ../backend && source venv/bin/activate && pip install -r ../requirements.txt
pm2 restart chessrep-backend
echo "Update complete!"
```

Make executable:

```bash
chmod +x /var/www/chessrep/update.sh
```

Then update with: `/var/www/chessrep/update.sh`

---

## Security Recommendations

1. **Change SSH port** (optional but recommended)
2. **Set up fail2ban** to prevent brute force attacks
3. **Regular updates**: `sudo apt-get update && sudo apt-get upgrade`
4. **Firewall**: Only open necessary ports
5. **Backup**: Set up regular backups of your database and code

---

## Support

If you encounter issues:
1. Check logs first
2. Verify all services are running
3. Test each component individually
4. Check firewall rules

Good luck with your deployment! 🚀

