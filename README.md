# AI Animation Nexus

A fully automated, serverless masterclass platform designed for the AI Animation Nexus cohort. Built with a stunning dark-glassmorphism aesthetic, seamless Paystack payments, and a zero-touch attendance & Zoom link distribution system.

## 🌟 Features
- **Cinematic UI:** Inspired by premium, state-of-the-art landing pages. Noise overlays, fluid gradients, and space-mono metadata.
- **Serverless Architecture:** 100% Vercel-ready. Uses Vercel KV (Redis) for fast, persistent data and Vercel Cron for automated jobs.
- **Automated Payments:** Paystack v2 Inline integration. Webhooks automatically generate access codes upon successful payment.
- **Zero-Touch Reminders:** Cron jobs automatically check the schedule and email students their reminders exactly 1 hour before class.
- **Secure Dashboard:** Students verify their email and unique access code to unlock the session's Zoom link precisely when the session goes live.

---

## 🔄 How The App Works (The 4-Week Flow)

### 🧑‍🎓 The Student Journey (User Perspective)

#### Phase 1: Onboarding & Payment
1. **Application:** The user visits the landing page, reads the curriculum, and clicks "Apply Now" to fill out the application form.
2. **Payment:** Upon submission, they are directed to the payment page to pay ₦29,900 via the Paystack popup.
3. **Confirmation:** Behind the scenes, the Paystack Webhook triggers. It generates a unique **Access Code** (e.g., `AN-4921-XK`) and sends a Welcome Email.
4. **Community:** The Welcome Email instructs them to save their Access Code and join the private WhatsApp channel.

#### Phase 2: Class Days (Fridays & Saturdays)
1. **The Reminder:** 1 hour before a session (8:00 PM WAT), the system automatically emails the student a reminder that class is starting soon.
2. **The Dashboard:** The student visits the Student Dashboard and logs in using their Email and Access Code.
3. **The Unlock:** 
   - If it is **before** 8:00 PM WAT, the Zoom link remains hidden to prevent early access.
   - At exactly 8:00 PM WAT, the session unlocks. The dashboard reveals the "Join Zoom" button.
4. **Attendance:** The moment the student successfully views the unlocked session, the system silently records their **Attendance** for that specific day.

#### Phase 3: Post-Course
1. **Review:** Students can always log back into the dashboard to see their attendance record across the 8 live sessions.

---

## 👨‍💻 The Operations Journey (Admin Perspective)

#### Phase 1: Pre-Launch Setup
1. **Links & Variables:** The admin sets the `PAYSTACK_KEYS`, `DEFAULT_ZOOM_URL`, and `WHATSAPP_CHANNEL_LINK` in the Vercel dashboard.
2. **Marketing:** The admin drives traffic to the landing page.
3. **Monitoring:** The admin logs into the secure Admin Dashboard (`/admin.html`) using their `ADMIN_PASSWORD` to see real-time stats on paid students and cohort fill rate.

#### Phase 2: Weekly Operations (The 4 Weeks)
1. **Zero-Touch Reminders:** The admin does not need to manually send emails. Vercel Cron automatically checks the database every hour and bulk-sends the Resend email reminders to all paid students exactly once per session.
2. **Managing Zoom Links (Optional):** If the admin uses the same recurring Zoom link for all 4 weeks, no action is required. If there is a unique Zoom link for a specific guest speaker, the admin updates it via the API.
3. **Hosting:** The admin starts the Zoom call at 9:00 PM WAT. Students filter in automatically via their dashboards.

#### Phase 3: Analytics & Tracking
1. **Attendance Matrix:** The admin can pull a full attendance grid to verify who attended all 8 sessions (crucial for honoring the satisfaction guarantee).
2. **Exporting Data:** From the Admin Dashboard, the admin can click "Download CSV" to instantly export a list of all paid students (Name, Email, WhatsApp, Code) to import into a newsletter tool.
