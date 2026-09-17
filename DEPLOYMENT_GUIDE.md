# 🚀 GitHub Automated Deployment Guide (Hugging Face & cPanel)

Whenever you commit and push changes to GitHub (`git commit -m "..." && git push origin main`), the configured GitHub Actions workflows will automatically trigger and update your target deployment.

---

## 🌟 Option 1: Automatic Deployment to Hugging Face Spaces

### Step 1: Create a Space on Hugging Face
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space Name: e.g. `photobucket-nepal`.
3. Space SDK: Select **Docker** (Blank).
4. License: Open Source (e.g. MIT or Apache 2.0).
5. Visibility: **Public** or **Private**.

### Step 2: Generate a Hugging Face Access Token
1. Go to your Hugging Face account **Settings** > **Access Tokens** (`https://huggingface.co/settings/tokens`).
2. Click **Create new token**.
3. Choose Role: **Write** (required to push code).
4. Copy the generated token (e.g., `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`).

### Step 3: Add GitHub Repository Secrets
1. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret** and add the following:
   - `HF_TOKEN`: Paste your Hugging Face write access token.
   - `HF_SPACE_REPO`: `your-hf-username/your-space-name` (for example, `deepaksubedi/photobucket-nepal`).

### Step 4: Commit and Push
Every time you push to `main` on GitHub:
```bash
git add .
git commit -m "Updated new features"
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
- `CPANEL_REMOTE_DIR`: (Optional, defaults to `public_html/`)
- `CPANEL_FTP_PROTOCOL`: (Optional, defaults to `ftps`, or set `ftp`)
- `CPANEL_FTP_PORT`: (Optional, defaults to `21`)

### Step 3: Commit and Push
Every time you push to `main` on GitHub:
```bash
git add .
git commit -m "Deploy latest build to cPanel"
git push origin main
```
GitHub Actions will automatically run `npm run build` and upload the compiled assets and `.htaccess` file directly to your cPanel hosting.
