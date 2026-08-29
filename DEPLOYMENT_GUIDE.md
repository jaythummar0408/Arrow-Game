# Deployment Guide

Complete guide for deploying APMC Khetivadi backend to production.

## 🚀 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, Linode)
### Option 2: Platform-as-a-Service (Heroku, Render, Railway)
### Option 3: Container-based (Docker, Kubernetes)

---

## 📋 Pre-Deployment Checklist

- [ ] MongoDB instance ready (Atlas or self-hosted)
- [ ] Data.gov.in API key obtained
- [ ] Domain name configured (optional)
- [ ] SSL certificate ready (for HTTPS)
- [ ] Environment variables prepared
- [ ] Database backup strategy planned
- [ ] Monitoring tools selected

---

## 🌐 Option 1: VPS Deployment (Ubuntu 22.04)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

### Step 2: Application Setup

```bash
# Create app directory
sudo mkdir -p /var/www/apmc-khetivadi
cd /var/www/apmc-khetivadi

# Clone or upload your code
git clone <your-repo-url> .
# OR upload via SCP/SFTP

# Install dependencies
npm install --production

# Create environment file
nano .env
```

**Production `.env` file:**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/APMC
DB_NAME=APMC
DATA_GOV_API_KEY=your_api_key_here
DATA_GOV_BASE_URL=https://api.data.gov.in/resource
JWT_SECRET=your_secure_random_secret_here
API_VERSION=v1
```

### Step 3: PM2 Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'apmc-khetivadi',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

Start application:
```bash
# Create logs directory
mkdir logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup
# Run the command it outputs

# Monitor
pm2 monit
```

### Step 4: Nginx Configuration

Create `/etc/nginx/sites-available/apmc-khetivadi`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/apmc-khetivadi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is automatic
sudo certbot renew --dry-run
```

### Step 6: Initial Data Sync

```bash
# Sync last 30 days data
npm run sync:30days

# Or use cron for daily sync
crontab -e
```

Add to crontab:
```cron
# Sync yesterday's data daily at 1 AM
0 1 * * * cd /var/www/apmc-khetivadi && /usr/bin/node scripts/syncYesterday.js >> logs/sync.log 2>&1
```

---

## ☁️ Option 2: MongoDB Atlas + Render

### Step 1: MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Setup database user
4. Whitelist IP: `0.0.0.0/0` (all IPs)
5. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/APMC
   ```

### Step 2: Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect GitHub repo
5. Configure:
   - **Name:** apmc-khetivadi
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     ```
     NODE_ENV=production
     MONGO_URI=mongodb+srv://...
     DATA_GOV_API_KEY=your_key
     DATA_GOV_BASE_URL=https://api.data.gov.in/resource
     JWT_SECRET=random_secret
     ```

6. Deploy!

---

## 🐳 Option 3: Docker Deployment

### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/APMC
      - DATA_GOV_API_KEY=${DATA_GOV_API_KEY}
      - DATA_GOV_BASE_URL=https://api.data.gov.in/resource
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

### Deploy with Docker

```bash
# Build image
docker build -t apmc-khetivadi .

# Run with compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env file
echo ".env" >> .gitignore

# Use strong secrets
openssl rand -base64 32  # Generate random secret
```

### 2. MongoDB Security
```javascript
// Use authentication
MONGO_URI=mongodb://username:password@localhost:27017/APMC?authSource=admin

// IP whitelisting
// Only allow your server IP in MongoDB Atlas
```

### 3. Rate Limiting
```javascript
// Install express-rate-limit
npm install express-rate-limit

// Add to server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. Helmet for Security Headers
```javascript
npm install helmet

const helmet = require('helmet');
app.use(helmet());
```

### 5. CORS Configuration
```javascript
// In production, specify allowed origins
app.use(cors({
  origin: ['https://your-frontend.com'],
  credentials: true
}));
```

---

## 📊 Monitoring & Logging

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs

# Check status
pm2 status

# Restart
pm2 restart apmc-khetivadi
```

### Application Logging
```javascript
// Install winston
npm install winston

// Create logger
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## 🔄 Automated Sync Scheduling

### Create Sync Script

Create `scripts/syncYesterday.js`:
```javascript
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function syncYesterday() {
  try {
    console.log(`[${new Date().toISOString()}] Starting yesterday sync...`);
    
    const response = await axios.post(`${BASE_URL}/api/v1/sync/yesterday`);
    
    console.log(`[${new Date().toISOString()}] Sync completed:`, {
      inserted: response.data.inserted,
      updated: response.data.updated,
      errors: response.data.errors
    });
    
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Sync failed:`, error.message);
    process.exit(1);
  }
}

syncYesterday();
```

### Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily sync at 1 AM
0 1 * * * cd /var/www/apmc-khetivadi && /usr/bin/node scripts/syncYesterday.js >> logs/sync.log 2>&1

# OR use PM2 cron
pm2 start scripts/syncYesterday.js --cron "0 1 * * *" --no-autorestart
```

---

## 🧪 Production Testing

### Health Check
```bash
curl https://your-domain.com/health
```

### Sync Status
```bash
curl https://your-domain.com/api/v1/sync/status
```

### Query API
```bash
curl "https://your-domain.com/api/v1/market-prices?days=7&limit=5"
```

### Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API
ab -n 1000 -c 10 https://your-domain.com/api/v1/market-prices
```

---

## 🔧 Troubleshooting

### Issue: Port 5000 already in use
```bash
# Find process
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

### Issue: MongoDB connection failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Issue: PM2 not starting
```bash
# Delete PM2 process
pm2 delete apmc-khetivadi

# Clear PM2 logs
pm2 flush

# Restart
pm2 start ecosystem.config.js
```

### Issue: High memory usage
```bash
# Check memory
free -h

# Restart app
pm2 restart apmc-khetivadi

# Set memory limit in ecosystem.config.js
max_memory_restart: '500M'
```

---

## 📈 Performance Optimization

### 1. Enable Gzip Compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. MongoDB Indexes
```bash
# Connect to MongoDB
mongosh

# Check indexes
use APMC
db.marketprices.getIndexes()

# Create missing indexes
db.marketprices.createIndex({ arrival_date: -1 })
db.marketprices.createIndex({ modal_price: 1 })
```

### 3. Response Caching
```javascript
const mcache = require('memory-cache');

// Cache middleware
const cache = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url;
    let cachedBody = mcache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

// Use on routes
app.get('/api/v1/market-prices', cache(60), getMarketPrices);
```

---

## 📱 Mobile-Friendly API Response

For mobile apps, add response compression:
```javascript
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));
```

---

## ✅ Post-Deployment Checklist

- [ ] Application running on PM2
- [ ] Nginx configured with SSL
- [ ] MongoDB secured with authentication
- [ ] Environment variables set correctly
- [ ] Automated sync cron job configured
- [ ] Monitoring and logging enabled
- [ ] Database backups scheduled
- [ ] API endpoints tested
- [ ] Documentation updated with production URL
- [ ] Error tracking setup (optional: Sentry)

---

## 🎉 You're Live!

Your APMC Khetivadi backend is now deployed and ready for production use!

**Next Steps:**
1. Monitor application logs
2. Setup database backups
3. Configure error tracking
4. Integrate with frontend
5. Setup CI/CD pipeline

---

**Need Help?** Check documentation or review server logs for detailed error messages.
