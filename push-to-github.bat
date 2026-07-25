@echo off
git add .
git commit -m "Fix: include public/ files in Vercel bundle for static serving"
git push origin main
