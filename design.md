# AI Animation Nexus Design System

## Product position
AI Animation Nexus is a focused live-learning intensive for creators exploring AI animation and motion design. The interface should feel editorial, cinematic, and trustworthy while making payment, access, class timing, and attendance states unmistakable.

## Design movement
The visual language is **dark editorial glass**: near-black surfaces, restrained translucent panels, lime-mint action color, serif display typography, and monospaced operational metadata. Decorative atmosphere supports the course story but never competes with a user’s next action.

## Tokens

| Token | Value | Use |
|---|---|---|
| Background | `#0A0A0C` | Page background |
| Surface | `rgba(255,255,255,0.05)` | Cards and panels |
| Border | `rgba(255,255,255,0.10)` | Default separation |
| Mint | `#6DFFBA` | Primary action, success, live state |
| Muted text | `#8C8C94` | Secondary metadata |
| Primary text | `#F2F2F2` | Main content |
| Error | `#FF6B6B` | Failure and validation |
| Display type | Libre Caslon Text | Hero and major headings |
| Body type | Inter | Paragraphs and controls |
| Metadata type | Space Mono | Dates, statuses, labels, access codes |

Spacing uses an 8px base scale. Cards use 12–20px radii for product surfaces and 4–12px radii for editorial form controls. Shadows remain soft and directional; blur is used only on fixed navigation and glass surfaces.

## Icon and imagery rules
Conventional controls use the existing Material Symbols Outlined family consistently. No emoji or platform-dependent glyphs are used for required actions. Mentor imagery is user-provided, displayed with a consistent crop, `object-fit: cover`, descriptive alt text, and a neutral fallback when an image is missing. Image filenames are semantic and stored under `assets/mentors/`.

## Component states
Buttons support default, hover, focus-visible, pressed, disabled, loading, success, and failure states. Forms show field-level errors adjacent to the relevant field and page-level recovery text for network/provider failures. Payment shows distinct free-window, paid-window, closed, pending, success, and failed states. Student access shows pre-class, live/unlocked, locked, completed, invalid-code, and session-expired states. Admin tables show loading, empty, error, and success feedback.

## Motion
Ambient motion is slow and low contrast. Normal controls use 150–300ms transitions; section entrances use 500–900ms only where they clarify hierarchy. All essential content and actions remain available with `prefers-reduced-motion: reduce`.

## Responsive behavior
The landing page retains its editorial composition on desktop and becomes a single-column story on small screens. Dashboard tables become stacked cards below 700px where needed. Touch targets remain at least 44px, focus indicators remain visible, and no essential information is hover-only.

## Content voice
Copy is direct, calm, and creator-focused. Operational copy states the current status and next action plainly. The product does not use fabricated testimonials, urgency claims, or unsupported outcome promises.
