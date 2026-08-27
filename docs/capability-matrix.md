# Capability Matrix

| Capability | Available | Required | Action |
|---|---:|---:|---|
| GitHub repository access | Yes | Yes | Use `gh` and Git for branch, commit, merge, and push |
| Sandbox browser | Yes | Yes | Inspect Vercel, run local visual checks, and verify deployed pages |
| Vercel project access | Yes | Yes | Inspect deployment history, environment variables, storage, and deploy settings |
| Redis/KV storage | Team database visible; not yet connected | Yes | Connect the existing Upstash database after code is ready and confirm target environment |
| Mentor image assets | Awaiting user upload | Yes | Integrate supplied images under `assets/mentors/` with semantic filenames |
| Paystack credentials | Present in local environment file; production values must be confirmed | Yes | Use only in Vercel environment configuration; never commit them |
| Transactional email credentials | Present/unknown in local environment file; production values must be confirmed | Yes | Configure Resend/SMTP in Vercel and test delivery |
| Automated reminders | Yes in code after repair | Yes | Use the single shared job and Vercel cron endpoint |
| Responsive screenshot QA | Yes | Yes | Verify desktop and narrow mobile routes in the sandbox browser |
