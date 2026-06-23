# Deployment Guide & Checklist

This document explains what is left to do, how to configure the environment, and the exact steps to deploy the AI Animation Nexus platform to Vercel.

---

## 🔴 1. Critical Pre-Launch Checklist

Before you can officially launch, you **must** complete the following tasks:

### [ ] Switch Paystack to Live Mode
Currently, the codebase uses your `pk_test` and `sk_test` keys. To accept real money:
1. Log into your [Paystack Dashboard](https://dashboard.paystack.com/).
2. Go to **Settings → API Keys & Webhooks**.
3. Copy your **Live Public Key** and **Live Secret Key**.
4. In the codebase, open `payment.html` and replace `pk_test_...` with your Live Public Key.
5. Save your Live Secret Key to add to Vercel in Step 2.

### [ ] Get a Resend API Key (For Emails)
The app uses Resend to send automated emails.
1. Create a free account at [Resend.com](https://resend.com) (gives you 3,000 free emails/month).
2. Go to **API Keys** and generate a new key.
3. Keep this key safe for Step 2.

### [ ] Choose a Strong Admin Password
You need a secure password to access `/admin.html`. Think of one now (e.g., `Nexus2026Admin!`).

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

### Step B: Provision the Vercel KV Database
Because Vercel is serverless, the app uses **Vercel KV (Redis)** to store students, attendance, and sessions persistently.
1. Go to your Vercel Dashboard → Select your project.
2. Click on the **Storage** tab.
3. Click **Create Database** and select **KV** (Redis).
4. Accept the defaults and attach it to your project. Vercel will automatically inject the database connection strings into your environment variables.

### Step C: Add Your Environment Variables
In your Vercel Dashboard, go to **Settings → Environment Variables** and add the following:

| Variable Name | Value |
|---------------|-------|
| `PAYSTACK_SECRET_KEY` | Your Paystack Live Secret Key |
| `RESEND_API_KEY` | Your Resend API Key |
| `EMAIL_FROM` | e.g., `noreply@aianimationnexus.com` |
| `ADMIN_PASSWORD` | The secure password you chose |
| `WHATSAPP_CHANNEL_LINK` | The link to your WhatsApp community |
| `DEFAULT_ZOOM_URL` | Your recurring Zoom meeting link |
| `BASE_URL` | Your production URL (e.g., `https://aianimationnexus.com`) |

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
3. Complete a payment (you can temporarily lower the price to ₦100 in `api/paystack.js` and `payment.html` for testing, or use Paystack's test mode if you didn't switch the keys yet).
4. Check your email to see if you received the Welcome Email with the Access Code.
5. Log into `/admin.html` to confirm you appear as a paid student.
