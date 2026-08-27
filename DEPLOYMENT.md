# Deployment Guide & Checklist

This document explains how to configure and deploy the AI Animation Nexus platform to Vercel after the production-repair branch is merged. The deployment uses one Express serverless entry point at `api/index.js` so it remains within the Vercel Hobby function limit. Redis persistence is provided by Upstash REST.

---

## 1. Critical pre-launch checklist

Before accepting real customers, add live Paystack credentials, a verified email sender, and a production admin password in Vercel. The repaired code never embeds the Paystack public key in `payment.html`; it is delivered by `/api/config`, and the backend never marks a student paid until a valid Paystack webhook is received.

The application window is controlled by `PAYMENT_WINDOW_START`, `PAYMENT_FREE_DAYS=20`, and `PAYMENT_PAID_DAYS=10`. Until a start timestamp is configured, the safe default is free enrollment. Set `PAYMENT_MODE=paid` only when intentionally testing the paid flow, and remove that override for the automatic window.

---

## 🚀 2. Deploying to Vercel

The app is 100% serverless and ready for Vercel. Follow these steps:

### Step A: Push to GitHub (or use Vercel CLI)
You can deploy directly using the Vercel CLI from your terminal:
```bash
npm install -g vercel
vercel
```
Follow the prompts to link the project. When asked if you want to modify default settings, press `No`.

### Step B: Connect Upstash Redis
The app stores students, attendance, sessions, reminder deduplication, and processed webhook references in Upstash Redis.
1. Open the existing Upstash database for this project.
2. Copy its REST URL and token without committing them to Git.
3. In Vercel, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Production, Preview, and Development as appropriate.
4. Confirm the deployed `/api/config` and `/api/health` endpoints after redeploying. If Vercel’s Storage connection wizard reports that the resource must be reinstalled, use the direct REST variables instead.

### Step C: Add Your Environment Variables
In your Vercel Dashboard, go to **Settings → Environment Variables** and add the following:

| Variable Name | Value |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token; mark Secret |
| `PAYSTACK_PUBLIC_KEY` | Paystack Live Public Key |
| `PAYSTACK_SECRET_KEY` | Paystack Live Secret Key; mark Secret |
| `RESEND_API_KEY` | Resend API key; mark Secret |
| `EMAIL_FROM` | Verified sender, for example `AI Animation Nexus <noreply@example.com>` |
| `ADMIN_PASSWORD` | Strong password of at least 12 characters; mark Secret |
| `CRON_SECRET` | Long random secret for the reminder endpoint; mark Secret |
| `PAYMENT_CURRENCY` | `USD` |
| `PAYMENT_AMOUNT_MAJOR` | `2.99` |
| `PAYMENT_AMOUNT_MINOR` | `299` |
| `PAYMENT_FREE_DAYS` | `20` |
| `PAYMENT_PAID_DAYS` | `10` |
| `PAYMENT_WINDOW_START` | RFC3339 timestamp for the opening day |
| `PAYMENT_MODE` | Leave empty for automatic timing; use `free`, `paid`, or `closed` only as an explicit override |
| `WHATSAPP_CHANNEL_LINK` | WhatsApp community link |
| `DEFAULT_ZOOM_URL` | Recurring Zoom meeting link |
| `BASE_URL` | `https://ai-animation-nexus.vercel.app` or the verified custom domain |

*(After adding these, you will need to trigger a new deployment in Vercel so they take effect).*

---

## 🟡 3. Setting Up the Paystack Webhook

For the app to know when a student has successfully paid (so it can generate their Access Code and email them), Paystack needs to send a signal to your Vercel app.

1. Go to your Paystack Dashboard **Settings → API Keys & Webhooks**.
2. Under **Live Webhook URL**, paste your Vercel domain followed by `/api/paystack/webhook`.
   - *Example:* `https://your-vercel-domain.vercel.app/api/paystack/webhook`
3. Save changes.

---

## ✅ 4. Final Testing

Once deployed and configured, run a test to ensure everything is wired correctly:
1. Go to your live URL.
2. Fill out the application form.
3. In Preview, use Paystack test keys and confirm the amount is `$2.99 USD` / 299 minor units. Do not place test keys in Production.
4. Check your email to see if you received the Welcome Email with the Access Code.
5. Log into `/admin.html` with the admin password and confirm the student status, attendance, and CSV export. Admin credentials are exchanged for an expiring bearer token; the raw password is never stored in browser storage.
