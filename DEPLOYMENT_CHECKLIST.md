# Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Have Hostinger VPS access (SSH credentials)
- [ ] Have GoDaddy domain name
- [ ] Know your VPS IP address
- [ ] Have your code ready to deploy

## VPS Setup

- [ ] Connected to VPS via SSH
- [ ] Updated system packages (`sudo apt-get update && sudo apt-get upgrade`)
- [ ] Installed Node.js 18+ (`node --version`)
- [ ] Installed Python 3.10+ (`python3 --version`)
- [ ] Installed MongoDB (`sudo systemctl status mongod`)
- [ ] Installed Nginx (`sudo systemctl status nginx`)
- [ ] Installed Redis (if needed)
- [ ] Installed Stockfish (`stockfish --version`)
- [ ] Installed PM2 (`pm2 --version`)
- [ ] Installed Certbot (`certbot --version`)
- [ ] Configured firewall (ports 22, 80, 443 open)

## Application Deployment

- [ ] Created application directory (`/var/www/chessrep`)
- [ ] Uploaded code to VPS
- [ ] Installed backend dependencies (Python and/or Node.js)
- [ ] Created backend `.env` file with correct values
- [ ] Installed frontend dependencies (`npm install`)
- [ ] Created frontend `.env` file
- [ ] Built frontend (`npm run build`)
- [ ] Created PM2 ecosystem config
- [ ] Started backend with PM2 (`pm2 start`)
- [ ] Saved PM2 configuration (`pm2 save`)

## Nginx Configuration

- [ ] Created Nginx config file (`/etc/nginx/sites-available/chessrep`)
- [ ] Configured frontend static file serving
- [ ] Configured backend API proxy (`/api`)
- [ ] Configured WebSocket proxy (`/ws`)
- [ ] Enabled site (`sudo ln -s`)
- [ ] Tested Nginx config (`sudo nginx -t`)
- [ ] Reloaded Nginx (`sudo systemctl reload nginx`)

## DNS Configuration (GoDaddy)

- [ ] Logged into GoDaddy account
- [ ] Accessed DNS management for domain
- [ ] Updated A record for `@` (main domain) to VPS IP
- [ ] Updated/created A record for `www` to VPS IP
- [ ] Saved DNS changes
- [ ] Verified DNS records are correct

## SSL Certificate

- [ ] Waited for DNS propagation (check with whatsmydns.net)
- [ ] Verified domain resolves to VPS IP
- [ ] Obtained SSL certificate (`sudo certbot --nginx`)
- [ ] Tested SSL certificate renewal (`sudo certbot renew --dry-run`)
- [ ] Verified HTTPS works (`https://yourdomain.com`)

## Final Verification

- [ ] Website loads at `https://yourdomain.com`
- [ ] Frontend displays correctly
- [ ] Backend API responds (`https://yourdomain.com/api/status`)
- [ ] WebSocket connections work (if applicable)
- [ ] PM2 shows backend running (`pm2 status`)
- [ ] Nginx is running (`sudo systemctl status nginx`)
- [ ] MongoDB is running (`sudo systemctl status mongod`)
- [ ] No errors in logs (`pm2 logs`, `sudo tail -f /var/log/nginx/error.log`)

## Post-Deployment

- [ ] Set up automatic backups
- [ ] Configured monitoring (optional)
- [ ] Documented any custom configurations
- [ ] Tested all major features
- [ ] Verified security settings

---

## Quick Commands Reference

```bash
# Check services
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod

# View logs
pm2 logs chessrep-backend
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart chessrep-backend
sudo systemctl restart nginx

# Check DNS
nslookup yourdomain.com
dig yourdomain.com

# Test backend directly
curl http://localhost:8001/
```

---

## Troubleshooting Checklist

If something doesn't work:

- [ ] Check PM2 logs: `pm2 logs chessrep-backend`
- [ ] Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] Verify backend is running: `pm2 status`
- [ ] Test backend directly: `curl http://localhost:8001/`
- [ ] Check firewall: `sudo ufw status`
- [ ] Verify DNS: `nslookup yourdomain.com`
- [ ] Check Nginx config: `sudo nginx -t`
- [ ] Verify environment variables are set correctly
- [ ] Check MongoDB connection
- [ ] Review error messages carefully

---

## Notes

- DNS propagation can take 1-48 hours (usually 1-2 hours)
- Always test locally on VPS before checking from outside
- Keep your `.env` files secure and never commit them
- Regular backups are essential
- Monitor logs regularly for errors

---

**Good luck with your deployment!** 🚀

For detailed instructions, see:
- `HOSTINGER_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `GODADDY_DNS_SETUP.md` - DNS configuration details

