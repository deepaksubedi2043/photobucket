---
title: Photo Bucket Nepal
emoji: 📸
colorFrom: red
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 🇳🇵 फोटो Bucket (Photo Bucket Nepal)

Photo Bucket Nepal is an authentic, community-driven social photography and cultural showcase platform celebrating Nepal's 77 districts, Himalayan heritage, food culture, local stories, and verified Nepali businesses.

## 🚀 Continuous Deployment & Automation

This repository includes pre-configured **GitHub Actions CI/CD workflows** that automatically build and deploy whenever you commit and push to your `main` branch on GitHub:

1. **Hugging Face Spaces (`.github/workflows/deploy-huggingface.yml`)**:
   - Automatically synchronizes commits with your Hugging Face Space.
   - Builds and launches via `Dockerfile` on Hugging Face Spaces.

2. **cPanel Hosting (`.github/workflows/deploy-cpanel.yml`)**:
   - Automatically compiles the production bundle (`npm run build`) upon every commit.
   - Synchronizes `dist/` directly to your cPanel hosting directory (`public_html/`) via FTPS/FTP.

For step-by-step secret configuration, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
