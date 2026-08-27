# AI Animation Nexus User Flows

| Flow | User goal | Entry | Steps | Success | Failure/recovery | Priority |
|---|---|---|---|---|---|---|
| Application during free window | Enroll without a charge | Landing page form | Submit validated details; server issues code; confirmation page displays code | Student can open dashboard | Show validation or service error and allow retry | P0 |
| Application during paid window | Reserve a seat and pay $2.99 | Landing page form | Submit details; open Paystack; return with reference; wait for webhook confirmation | Paid record, unique code, welcome email | Show pending state; allow email/support recovery | P0 |
| Student class access | Obtain the current Zoom link | Dashboard | Enter email + access code; server selects current/next session; reveal only after unlock | Correct session link and one attendance record | Invalid code, locked state, or no current session is explicit | P0 |
| Post-course attendance | Review attendance | Dashboard after final session | Verify email + code; server returns that student’s records | Attended/not-recorded state per session | Retry verification; never expose code through email-only lookup | P1 |
| Admin operations | Manage cohort | Admin page | Sign in; inspect stats; update Zoom/unlock; inspect students/attendance; export CSV; sign out | All actions succeed with expiring token | Expiry, permission, validation, and provider errors are visible | P0 |
| Reminder automation | Notify enrolled students | Scheduled job | Find today’s session; find active students; skip durable sent records; send remaining reminders | At most one reminder per student/session | Failed sends remain retryable and are logged | P0 |

## Required states

The product must represent loading, empty, validation error, provider error, offline/retry, success, access denied, session locked, session live, payment pending, payment failed, closed application, and expired admin session. No state should silently look successful when the server has not confirmed the underlying action.
