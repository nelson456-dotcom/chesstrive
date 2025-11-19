# GoDaddy DNS Configuration Guide

This guide will help you configure your GoDaddy domain to point to your Hostinger VPS.

## Prerequisites

- GoDaddy account with your domain
- Your VPS IP address from Hostinger (e.g., `123.45.67.89`)

---

## Step-by-Step Instructions

### Step 1: Access GoDaddy DNS Management

1. Go to [https://www.godaddy.com](https://www.godaddy.com)
2. Click **"Sign In"** (top right)
3. Enter your credentials and sign in
4. Click **"My Products"** in the top menu
5. Find your domain in the list and click on it
6. Scroll down and click on **"DNS"** or **"Manage DNS"**

### Step 2: Find Your VPS IP Address

From your Hostinger control panel:
- Log in to Hostinger
- Go to your VPS dashboard
- Find your **IP Address** (it will look like `123.45.67.89`)
- Copy this IP address

### Step 3: Update A Records

You need to update/create two A records:

#### A Record for Main Domain (@)

1. In the DNS management page, find the **A record** with:
   - **Name**: `@` (or your domain name without www)
   - **Type**: `A`

2. Click the **pencil icon** (Edit) or the **Edit** button

3. Update the following:
   - **Points to**: Enter your VPS IP address (e.g., `123.45.67.89`)
   - **TTL**: `600` (or leave default)
   
4. Click **"Save"**

#### A Record for www Subdomain

1. Look for an **A record** with:
   - **Name**: `www`
   - **Type**: `A`

2. If it exists, click **Edit**. If it doesn't exist, click **"Add"** to create a new record

3. Set the following:
   - **Type**: `A`
   - **Name**: `www`
   - **Points to**: Enter your VPS IP address (same as above)
   - **TTL**: `600`

4. Click **"Save"**

### Step 4: Verify DNS Records

Your DNS records should look like this:

```
Type    Name    Value           TTL
A       @       123.45.67.89    600
A       www     123.45.67.89    600
```

**Note**: Replace `123.45.67.89` with your actual VPS IP address.

### Step 5: Remove Unnecessary Records (Optional)

If you see CNAME records pointing to GoDaddy parking pages or other services, you can remove them:
- Look for CNAME records with names like `www` pointing to `@` or other values
- If you've set up A records, you can remove conflicting CNAME records

---

## DNS Propagation

### What is DNS Propagation?

DNS changes don't take effect immediately. It can take anywhere from a few minutes to 48 hours for changes to propagate worldwide.

### Check DNS Propagation

1. **Using Online Tools:**
   - Visit [https://www.whatsmydns.net](https://www.whatsmydns.net)
   - Enter your domain name
   - Select "A" record type
   - Check if your IP address appears in different locations

2. **Using Command Line (from your local machine):**
   ```bash
   # Windows PowerShell
   nslookup yourdomain.com
   
   # Linux/Mac
   dig yourdomain.com
   ```

3. **Expected Result:**
   ```
   Name:    yourdomain.com
   Address: 123.45.67.89  (your VPS IP)
   ```

### Typical Propagation Times

- **Local DNS**: 5-30 minutes
- **Regional DNS**: 1-4 hours
- **Global DNS**: 24-48 hours

---

## Troubleshooting

### Issue: DNS not updating

**Solutions:**
1. **Wait longer**: Sometimes it takes up to 48 hours
2. **Clear DNS cache** on your local machine:
   ```powershell
   # Windows PowerShell (as Administrator)
   ipconfig /flushdns
   ```
3. **Use different DNS servers**: Try using Google DNS (8.8.8.8) or Cloudflare DNS (1.1.1.1)
4. **Check GoDaddy**: Verify the records are saved correctly in GoDaddy

### Issue: Domain resolves but website doesn't load

**Possible causes:**
1. Nginx not configured correctly on VPS
2. Backend not running
3. Firewall blocking connections
4. SSL certificate not set up

**Check on VPS:**
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if backend is running
pm2 status

# Check firewall
sudo ufw status
```

### Issue: "This site can't be reached"

**Possible causes:**
1. DNS not propagated yet
2. Wrong IP address in DNS records
3. VPS firewall blocking connections

**Solutions:**
1. Verify IP address is correct in GoDaddy
2. Check VPS firewall allows ports 80 and 443
3. Wait for DNS propagation

---

## Advanced: Using Cloudflare (Optional)

If you want faster DNS propagation and additional features, you can use Cloudflare:

1. Sign up for free Cloudflare account
2. Add your domain to Cloudflare
3. Update nameservers in GoDaddy to point to Cloudflare
4. Configure DNS records in Cloudflare instead

---

## Quick Reference

| Record Type | Name | Value | Purpose |
|------------|------|-------|---------|
| A | @ | Your VPS IP | Main domain |
| A | www | Your VPS IP | www subdomain |

---

## Need Help?

If you're still having issues:
1. Double-check your VPS IP address
2. Verify records are saved in GoDaddy
3. Wait 24 hours for full propagation
4. Check VPS logs and services

---

**Remember**: After updating DNS, you need to:
1. Wait for propagation (usually 1-2 hours)
2. Configure Nginx on your VPS
3. Set up SSL certificate
4. Ensure your backend is running

See `HOSTINGER_DEPLOYMENT_GUIDE.md` for complete deployment instructions.

