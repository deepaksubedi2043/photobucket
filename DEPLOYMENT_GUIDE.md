# 🚀 GitHub Automated Deployment Guide (Hugging Face & cPanel)

Whenever you commit and push changes to GitHub (`git commit -m "..." && git push origin main`), the configured GitHub Actions workflows will automatically trigger and update your target deployment.

---

## 🌟 Option 1: Automatic Deployment to Hugging Face Spaces (100% Free Tier)

### Step 1: Create a Space on Hugging Face
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space Name: e.g. `photobucket-nepal`.
3. Space SDK: Select **Docker** (Blank).
4. **Space Hardware**: Make sure **CPU basic • 2 vCPU • 16 GB • Free** is selected (Do NOT select GPU or CPU Upgrade, which cost money and cause quota pauses).
5. License: Open Source (e.g. MIT).
6. Visibility: **Public** or **Private**.

### ⚠️ Why does Hugging Face say "Space is Paused" or "Quota Finished"?
If your Space is paused or showing a quota warning on a Free account, check these 2 things in Hugging Face:

1. **Hardware Tier (Most Common Cause)**:
   - Go to your Space on Hugging Face ➔ Click **Settings** (tab at the top right) ➔ Scroll down to **"Space hardware"**.
   - If anything other than **"CPU basic (Free)"** is selected (e.g. `CPU upgrade` or `T4 GPU`), it uses paid credits. Once credits run out, Hugging Face pauses the Space and says "Quota finished".
   - **Fix**: Click on **"CPU basic • 2 vCPU • 16 GB • Free"** and click **Switch hardware**. It will immediately unpause and run for free forever!

2. **Inactivity Auto-Sleep (Normal Free Tier Feature)**:
   - On Hugging Face Free Tier, when nobody visits the Space for 48 hours, Hugging Face automatically pauses/sleeps the container to save server resources.
   - **Fix**: Whenever you or any user visits the Space URL or clicks **"Restart Space"**, it automatically wakes up in ~15 seconds. In Space **Settings** ➔ **Space sleep time**, you can set the sleep timer.

---

### Step 2: Generate a Hugging Face Access Token
1. Go to your Hugging Face account **Settings** > **Access Tokens** (`https://huggingface.co/settings/tokens`).
2. Click **Create new token**.
3. Choose Role: **Write** (required to push code).
4. Copy the generated token (e.g., `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`).

### Step 3: Add GitHub Repository Secrets
1. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret** and add:
   - `HF_TOKEN`: Paste your Hugging Face write access token.
   - `HF_SPACE_NAME`: `your-hf-username/your-space-name` (for example, `deepaksubedi/photobucket-nepal`).

### Step 4: Commit and Push
```bash
git add .
git commit -m "Deploy latest build"
git push origin main
```
GitHub Actions will automatically mirror your code to Hugging Face Spaces, where it builds and launches via `Dockerfile`.

---

## 🌐 Option 2: Automatic Deployment to cPanel Hosting

### Step 1: Get cPanel FTP / FTPS Credentials
1. Log in to your **cPanel** dashboard.
2. Go to **FTP Accounts** (or use your primary cPanel FTP login).
3. Note your:
   - **FTP Server / Host**: (e.g., `ftp.yourdomain.com` or server IP address)
   - **FTP Username**: (e.g., `deployer@yourdomain.com` or your cPanel username)
   - **FTP Password**: Your FTP account password
   - **Directory**: Destination directory (usually `public_html/` or `public_html/subdomain/`)

### Step 2: Add GitHub Repository Secrets
In your GitHub repository under **Settings** > **Secrets and variables** > **Actions**, add:
- `CPANEL_FTP_SERVER`: Your FTP server hostname (e.g., `ftp.yourdomain.com` or IP)
- `CPANEL_FTP_USERNAME`: Your FTP username
- `CPANEL_FTP_PASSWORD`: Your FTP account password
- `CPANEL_TARGET_DIR`: (Optional, defaults to `public_html/`)
- `CPANEL_FTP_PROTOCOL`: (Optional, defaults to `ftps`, or set `ftp`)
- `CPANEL_FTP_PORT`: (Optional, defaults to `21`)

### Step 3: Commit and Push
```bash
git add .
git commit -m "Deploy latest build to cPanel"
git push origin main
```
GitHub Actions will automatically run `npm run build` and upload the compiled assets and `.htaccess` file directly to your cPanel hosting.
