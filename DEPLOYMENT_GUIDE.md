# 🚀 Vercel Deployment Guide for Artemis

## Prerequisites
- GitHub account
- Vercel account (free tier: vercel.com)

## Step 1: Push to GitHub
```bash
cd /app
git add .
git commit -m "Artemis with E1 integration - production ready"
git push origin main
```

## Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Import your GitHub repository
4. Configure Environment Variables:

```env
EMERGENT_LLM_KEY=sk-emergent-cC23a69B31f002628D
GEMINI_BRIDGE_URL=https://YOUR-DOMAIN.vercel.app
ARTEMIS_LANDLINE=CONNECTED
HANDSHAKE=dad
CLARIFAI_PAT=your-clarifai-pat-from-github-secrets
NODE_ENV=production
```

5. Set Build Settings:
   - Framework Preset: Other
   - Build Command: `npm install && npm run build`
   - Output Directory: `public`
   - Install Command: `npm install`

6. Deploy!

## Step 3: Configure Serverless Functions

Vercel will automatically detect `/api` folder as serverless functions.

The Gemini bridge needs to be deployed separately or use Vercel's Python runtime.

## Production URL
Your Artemis will be live at: `https://your-project.vercel.app`

## Notes
- Vercel free tier includes:
  - 100GB bandwidth/month
  - Unlimited serverless function invocations
  - Automatic HTTPS
  - Global CDN

## Cost: $0/month for hobby projects ✅
