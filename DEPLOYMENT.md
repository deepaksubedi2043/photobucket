# 🚀 CI/CD Automated Deployment Guide (Hugging Face Spaces & cPanel)

Whenever you commit or push code to your GitHub repository (`git push origin main`), GitHub Actions will automatically package, build, and deploy your application.

---

## 🌟 1. Setting Up Hugging Face Spaces Auto-Deploy

### Step 1: Create a Space on Hugging Face
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **"Create new Space"**.
2. Set Space Name (e.g., `username/photo-bucket`).
3. Select **Space SDK**: Choose **Docker** (Blank / Custom Docker).
4. Set Space Hardware / Visibility (Public or Private).

### Step 2: Get Hugging Face Access Token
1. Go to **Hugging Face Settings** -> **Access Tokens** (`https://huggingface.co/settings/tokens`).
2. Create a new token with **Write** permissions.
3. Copy the token.

### Step 3: Add GitHub Secrets
In your GitHub Repository, navigate to **Settings** -> **Secrets and variables** -> **Actions** -> click **"New repository secret"**:

| Secret Name | Description / Example Value |
|---|---|
| `HF_TOKEN` | Your Hugging Face Write Token (e.g. `hf_xxxxxxxxxxxxxxxxxxx`) |
| `HF_SPACE_NAME` | Your Space username/slug (e.g. `your-hf-username/photo-bucket`) |

✅ **Done!** Every commit to `main` will now sync directly to your Hugging Face Space.

---

## 🌐 2. Setting Up cPanel Auto-Deploy

### Option A: Automated FTP/FTPS Upload via GitHub Actions (Recommended)

In your GitHub repository, add the following secrets in **Settings** -> **Secrets and variables** -> **Actions**:

| Secret Name | Description | Example |
|---|---|---|
| `CPANEL_FTP_SERVER` | Your cPanel FTP host / domain | `ftp.yourdomain.com` or server IP |
| `CPANEL_FTP_USERNAME` | Your cPanel FTP username | `deploy@yourdomain.com` or `cpaneluser` |
| `CPANEL_FTP_PASSWORD` | Your FTP password | `your-secure-ftp-password` |
| `CPANEL_TARGET_DIR` *(optional)* | Remote directory to upload to | `public_html/` or `public_html/subfolder/` |
| `CPANEL_FTP_PROTOCOL` *(optional)* | FTP protocol | `ftps` (default) or `ftp` |

---

### Option B: Direct cPanel Git Version Control

If your cPanel has the **Git™ Version Control** tool enabled:
1. In cPanel, open **Git™ Version Control**.
2. Click **Create** and clone your GitHub Repository URL.
3. The repository already includes `.cpanel.yml` which automatically copies the built files and `.htaccess` to your `public_html/` folder upon pulling.

---

## 📦 What Files Were Configured?

- `.github/workflows/deploy.yml`: Unified CI/CD workflow triggering builds and parallel deployments.
- `.github/workflows/sync-huggingface.yml`: Dedicated Hugging Face Spaces synchronization action.
- `.github/workflows/deploy-cpanel.yml`: Dedicated cPanel deployment action.
- `Dockerfile`: Multi-stage Docker container configured for Hugging Face Spaces & Node hosting.
- `.htaccess`: Apache web server configuration for Single Page Application (SPA) routing, HTTPS redirect, caching, and compression.
- `.cpanel.yml`: Native cPanel Git deployment script.
- `README.md`: Includes Hugging Face Space metadata headers.
