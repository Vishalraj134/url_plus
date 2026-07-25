@echo off
git add .
git commit -m "Fix Vercel: use /api/ serverless function + static CDN for public files"
git push origin main
