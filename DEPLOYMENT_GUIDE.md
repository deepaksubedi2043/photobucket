# 🚀 GitHub Automated Deployment Guide (GitHub Pages, Hugging Face & cPanel)

Whenever you commit and push changes to GitHub (`git commit -m "..." && git push origin main`), GitHub Actions will automatically trigger and update your deployments.

---

## 🌐 1. Public Live URL on GitHub Pages (100% Free, Permanent & Instant)

GitHub provides free web hosting for repositories with **GitHub Pages**, giving you a permanent public URL: `https://<your-username>.github.io/<your-repo-name>/`.

### How to Enable in 1 Click:
1. Open your repository on GitHub.
2. Click **Settings** (tab at the top).
3. In the left sidebar under the *Code and automation* section, click **Pages**.
4. Under **Build and deployment** ➔ **Source**, select **`GitHub Actions`**.
5. That's all! The next time you push code (or manually trigger the action under the **Actions** tab ➔ **Deploy to GitHub Pages** ➔ **Run workflow**), your live public URL will be live within seconds.

---

## 🌟 2. Automatic Deployment to Hugging Face Spaces (Free Tier)

### Step 1: Create a Space on Hugging Face
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space Name: e.g. `photobucket-nepal`.
3. Space SDK: Select **Docker** (Blank).
4. **Space Hardware**: Make sure **CPU basic • 2 vCPU • 16 GB • Free** is selected.
5. Visibility: **Public** or **Private**.

### Step 2: Add GitHub Repository Secrets
1. Go to your Hugging Face account **Settings** > **Access Tokens** (`https://huggingface.co/settings/tokens`) and generate a token with **Write** permission.
2. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add:
   - `HF_TOKEN`: Your Hugging Face write access token (`hf_...`).
   - `HF_SPACE_NAME`: `your-hf-username/your-space-name` (e.g., `deepaksubedi/photobucket-nepal`).

---

## 📁 3. Automatic Deployment to cPanel Hosting (FTP/FTPS)

In your GitHub repository under **Settings** > **Secrets and variables** > **Actions**, add:
- `CPANEL_FTP_SERVER`: Your FTP server hostname (e.g., `ftp.yourdomain.com` or IP)
- `CPANEL_FTP_USERNAME`: Your FTP username
- `CPANEL_FTP_PASSWORD`: Your FTP account password
- `CPANEL_TARGET_DIR`: (Optional, defaults to `public_html/`)
- `CPANEL_FTP_PROTOCOL`: (Optional, defaults to `ftps`, or set `ftp`)

---

## 🚀 Pushing Code to Deploy Everything
```bash
git add .
git commit -m "Update site and deploy"
git push origin main
```
All configured workflows will run automatically.
