# QA Checklist

## Backend and security

- [ ] Production secrets fail closed when missing.
- [ ] Application input is normalized, bounded, and validated.
- [ ] Free-window enrollment issues one unique code.
- [ ] Paid-window application remains pending until verified Paystack success.
- [ ] Duplicate Paystack webhook references do not duplicate fulfillment.
- [ ] Confirmation email renders with configured links and provider failures are visible.
- [ ] Email-only student lookup cannot reveal access codes.
- [ ] Anonymous schedule data contains no Zoom URL.
- [ ] Zoom URL is returned only after valid code verification and unlock.
- [ ] Attendance cannot be recorded before unlock and is idempotent.
- [ ] Admin login rate limits failures and issues an expiring token.
- [ ] Admin data is escaped before HTML rendering.
- [ ] Cron endpoint requires its production secret and is wired to the selected deployment.

## Frontend

- [ ] Landing-page application form has field-level errors and network recovery.
- [ ] Free-window application routes to confirmation without opening checkout.
- [ ] Paid-window page shows `$2.99 USD` and uses 299 cents for Paystack.
- [ ] Payment pending, success, cancel, and provider-error states are clear.
- [ ] Confirmation page works without a public access-code lookup.
- [ ] Student class-day, locked, live, completed, and post-course states are correct.
- [ ] Post-course attendance is fetched and displayed accurately.
- [ ] Admin overview, sessions, students, attendance, export, and logout work.
- [ ] Mentor names, portraits, alt text, and fallbacks are correct after assets arrive.

## Browser and accessibility

- [ ] 1440x900 desktop layout.
- [ ] 1280x720 desktop layout.
- [ ] 1024x768 tablet layout.
- [ ] 820x1180 tablet layout.
- [ ] 390x844 mobile layout.
- [ ] 375x812 mobile layout.
- [ ] No horizontal overflow below 400px.
- [ ] Keyboard focus is visible and tab order is logical.
- [ ] Buttons and form fields have accessible names.
- [ ] Reduced-motion mode preserves essential information.
- [ ] Browser console has no uncaught errors.
