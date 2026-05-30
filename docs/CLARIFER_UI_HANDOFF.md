# CLARIFER UI HANDOFF — v4
# Updated: May 29, 2026
# Read at the start of EVERY build session — every word.
# Source of truth: this file + Figma. Never guess. Never invent.

Figma file:    https://www.figma.com/design/RvUccT5yRPIMLMAYySg8W2/Clarifer-%E2%80%94-Design-System---Screen-Reference
Handoff page:  https://www.figma.com/design/RvUccT5yRPIMLMAYySg8W2/Clarifer-%E2%80%94-Design-System---Screen-Reference?node-id=26-2

Figma pages in this file:
  0:1  — Clarifer — All Screens (main canvas, existing screens)
  26:2 — CLARIFER_UI_HANDOFF (new screens built for Claude Code)
  19:2 — CCF Research Presentation (pitch deck for CCF team — NOT a UI screen, do not reference for code)

---

## TEAM AUTHORITY — WHO WINS ON WHAT

- Dr. Chen Wei:    emotional tone and caregiver-facing copy — her opinion wins
- Amara Osei:      data model, table schema, RLS policy, consent flow — her opinion wins
- Lena Kirchner:   AI system prompts, guardrail behavior, Claude Code session structure — her opinion wins
- Yemi Adeyemi:    definition of done, test coverage, error state requirements — her opinion wins
- James Whitfield: clinical accuracy, emergency card fields — his opinion wins
- Rafael Toro:     Expo/PWA mobile patterns, safe area, offline behavior — his opinion wins

---

## DESIGN TOKENS — LOCKED

### CSS Variables (web — never use hex in components)
```css
--primary:       #2C5F4A   /* dark sage */
--accent:        #C4714A   /* terracotta */
--background:    #F7F2EA   /* warm linen — never pure white */
--card:          #FFFFFF
--text:          #1A1A1A
--muted:         #6B6B6B
--border:        #E8E2D9
--pale-sage:     #F0F5F2
--pale-terra:    #FDF3EE
--severity-high: #E24B4A
--severity-med:  #BA7517
--severity-ok:   #0F6E56
```
Mobile (Expo): `lib/design-tokens.ts` only. Never hex strings in any component.
Exception: `lib/pdf/hospital-grade-export.tsx` may use hex directly.

### Typography
```
Patient name hero:   Playfair Display Bold | 38px mobile | 30px desktop
Page headings H1:    DM Sans SemiBold | 24px | --text
Section headings H2: DM Sans Medium | 18px | --text
Card titles:         DM Sans Medium | 16px | --text
Body text:           DM Sans Regular | 15px | --text | line-height 1.6
Secondary text:      DM Sans Regular | 13px | --muted
Labels/caps:         DM Sans Medium | 11px | UPPERCASE | letter-spacing 0.8px | --muted
Buttons:             DM Sans SemiBold | 15px | white on --primary
Nav labels:          DM Sans Medium | 10px | --muted inactive / --primary active
```

### Spacing
```
Page padding mobile:     24px horizontal
Page padding desktop:    40px horizontal | max-width 1200px centered
Card padding:            16px mobile | 24px desktop
Section gap:             24px mobile | 32px desktop
Input height:            56px mobile | 48px desktop
Button height (primary): 52px mobile | 48px desktop
Button radius:           12px primary | 8px secondary
Card radius:             12px
Touch target minimum:    44×44px (all interactive elements)
Desktop left nav width:  52px
Desktop right sidebar:   280px
Desktop content max:     680px
```

### Transitions (Figma ref: ?node-id=57-2)
```
Buttons/inputs: background-color 120ms ease, border-color 120ms ease
Cards:          background-color 150ms ease, box-shadow 150ms ease
Nav items:      color 100ms ease
Active press:   transform scale(0.98)
```

---

## NAVIGATION

### Desktop (1280px+)
- Left nav rail: 52px fixed | --pale-sage bg | icons only, no labels
  - Items: Home, Log, Docs, Tools (top) | Sign out (bottom)
  - Active: --primary icon | 40×40px --pale-sage pill bg
  - Inactive: --muted icon
  - Hover: --pale-sage bg pill, 150ms
- Header: 52px
  - Logo left (x=68) | "Caring for • [Name]" breadcrumb center | "Ask Clarifer" right (--primary, 36px, 12px radius)
- Right sidebar: 280px | next appointment + CCF card + care team link

### Mobile (390px)
- Bottom nav: 56px | 5 items: Home | Log | Ask (center elevated) | Docs | Tools
  - Ask (center): 44×44px --primary circle, +8px elevation
  - Active indicator: 4px line — NOT 3px (sub-pixel on Android, Rafael Toro)
  - Labels: 10px DM Sans Medium, always visible
- App header: 52px | Logo left | Bell icon right | Name right
- Safe area: all bottom-fixed elements must add `padding-bottom: env(safe-area-inset-bottom)`
  - Expo: `<SafeAreaView>` or `useSafeAreaInsets()`

### PWA
- display: standalone (no browser chrome)
- Status bar: `#2C5F4A`
- See PWA SPECIFICATION section

---

## COMPONENT STATES — REQUIRED FOR EVERY INTERACTIVE ELEMENT

Figma reference: ?node-id=57-2

### Buttons
- Default: --primary bg, white text
- Hover: 10% darker, 120ms
- Active: scale(0.98), 80ms
- Disabled: #B0B0B0 bg, #D0D0D0 text, cursor not-allowed
- Loading: spinner + "Saving..." text, disabled while loading

### Cards (tappable)
- Default: white bg, 1px --border
- Hover: --pale-sage bg, 1px rgba(44,95,74,0.2)
- Active: scale(0.99)
- Selected: --pale-sage bg, 2px --primary border

### Inputs
- Default: white bg, 1px --border
- Focus: 2px --primary border, --pale-sage bg fill
- Error: 2px --severity-high border, #FFF0F0 bg
- Disabled: #F5F5F5 bg, #C0C0C0 text

### API error pattern (all screens)
- Toast above nav: "[Action] failed. Tap to retry."
- Undo any optimistic update immediately
- RETAIN form data — never clear on error
- Log to Sentry

---

## LOADING STATES — EVERY DATA FETCH

Figma reference: ?node-id=57-39

```css
.skeleton {
  background: linear-gradient(90deg, var(--border) 25%, var(--pale-sage) 50%, var(--border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Streaming AI: blinking cursor `▌` at 1s interval while generating.
Document analysis: "Reviewing your document..." + spinner + skeleton lines.
User must see something within 1s of any AI tap — never leave them staring.

---

## EMPTY STATES — EVERY LIST SCREEN

Figma reference: ?node-id=57-72

Rules: name the patient, show the gain, never "No data found", always include a CTA.

| Screen | Copy | CTA |
|---|---|---|
| Documents | "Upload your first document. Clarifer will explain what it means." | + Upload document |
| Medications | "Add Carlos's medications to track adherence and interactions." | + Add medication |
| Care team | "Add your first provider. Keep everyone's contact info in one place." | Invite provider |
| Symptom log | "Nothing logged yet. Tap to record how Carlos is doing today." | + Log symptom |
| Notifications | "You are all caught up." | (none) |
| Clinical trials | "No trials match your filters. Try adjusting the biomarker selections." | Clear filters |
| Family update history | "No updates sent yet. Generate your first update above." | (none) |
| Appointments | "No appointments added. Add your first one to track upcoming visits." | + Add appointment |

---

## COPY RULES — ENFORCED IN EVERY FILE

```bash
grep -r "serious illness" app/ components/   # must return 0
grep -r "—" app/ components/                 # must return 0 (em dashes)
grep -r "Clarifier" app/ components/          # must return 0 (wrong spelling)
grep -r "Cassini" app/ components/            # must return 0
grep -r "profiles" app/api/                   # must return 0 (wrong table name)
```

- NEVER "serious illness" or "seriously ill" — anywhere, including comments
- NEVER illness/disease language in caregiver-facing copy — speak to the caregiving journey
- No em dashes (—) — use commas or restructure
- No exclamation points in professional contexts
- No: "excited to share", "journey", "space", "passionate about", "genuinely", "honestly"
- Patient names: first name only after initial greeting. Never "Carlos Rivera" in UI
- Company: Clarifer (C-L-A-R-I-F-E-R — never "Clarifier")
- Free for caregivers: "Free for caregivers. Always." — exact copy
- CCF card: "Don't know where to start?" — never change
- Infection signs: "Call 911 or go to the emergency room immediately." — exact copy
- Founding story: About page ONLY — not homepage, not emails
- Lighthouse logo: never an anchor, never removed from About page

---

## AI RULES — ALL ANTHROPIC API ROUTES

### Base system prompt (paste into every Anthropic call)
```
You are a caregiver support assistant. You help families understand medical
information and coordinate care for a loved one. You never diagnose. You never
recommend changing medications or dosages. You never speculate on prognosis or
survival. You never comment on psychiatric medications. Always recommend
consulting the care team for clinical decisions. Respond in [USER_LANGUAGE].
```
Replace `[USER_LANGUAGE]` with "English" or "Spanish" from user profile.

### Family update additional prompt (append to base)
```
Generate a plain-language family update in paragraph form only.
No markdown. No headers. No bullet points. No numbered lists. No bold. No italic.
No code blocks. No em dashes. No horizontal rules. Plain paragraphs only.
3-5 paragraphs. Warm, human tone.
Never mention the diagnosis by name. Speak to the caregiving situation.
```

### Client-side output stripping (backup, not primary fix)
Strip before display: `# ## ### * ** _ __ - (line-start) 1. 2. \` \`\`\` > ---`

### Rate limits (Upstash Redis)
```
/api/chat:          4 req/min per user
/api/family-update: 2 req/min per user
/api/analyze:       1 req/document per user
/api/log/trend:     cached 6h (no rate limit)
/api/auth/*:        5 attempts/IP before lockout
```

### Timeouts
```
/api/chat:          30s → error bubble in chat
/api/analyze:       30s → "Analysis unavailable. Try again later."
/api/family-update: 45s → error state, retain form
/api/log/trend:     10s → silent fallback
```

### Streaming
Blinking cursor `▌` at 1s interval while streaming.
User must see something within 1s of tap. Never leave a static button.

---

## HIPAA — 4 CHECKS ON EVERY API ROUTE TOUCHING PHI

```typescript
// 1. Auth
const { data: { user }, error } = await supabase.auth.getUser();
if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// 2. Role
const { data: userRecord } = await supabase.from("users")
  .select("role, organization_id").eq("id", user.id).single();
if (!ALLOWED_ROLES.includes(userRecord.role))
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// 3. Org filter on every query
.eq("organization_id", userRecord.organization_id)

// 4. Audit log — write BEFORE returning
await supabase.from("audit_log").insert({
  user_id: user.id, patient_id, action, resource_type, resource_id,
  organization_id: userRecord.organization_id,
  ip_address, user_agent, timestamp: new Date()
});
```

Additional:
- SUPABASE_SERVICE_ROLE_KEY: API routes only. Never client. Never NEXT_PUBLIC_.
- No patient data in any log, prompt, or NEXT_PUBLIC_ variable
- No console.log of patient objects anywhere
- Session timeout: 30 min inactivity → signOut() → /login
- Every new table: RLS enabled on creation, not as follow-up

---

## PWA SPECIFICATION

PWA ships June 15. Expo native app follows post-launch.

### manifest.json (public/manifest.json)
```json
{
  "name": "Clarifer",
  "short_name": "Clarifer",
  "description": "Caregiver intelligence platform",
  "start_url": "/home",
  "display": "standalone",
  "background_color": "#F7F2EA",
  "theme_color": "#2C5F4A",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-72.png",        "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96.png",        "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128.png",       "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png",       "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png",       "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png",       "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384.png",       "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png",       "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png",  "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
Icon: lighthouse with Rod of Asclepius on sage/linen. Tied to Samira's father's love of fishing — never change.

### Service worker (next-pwa)
```
Static JS/CSS/fonts:  CacheFirst, no expiry
Page shells:          StaleWhileRevalidate
API routes:           NetworkFirst, 5s timeout, cache fallback
/emergency/[token]:   CacheFirst — MUST work offline
Images:               CacheFirst, 30 day expiry
```
Offline fallback: `/offline` — warm copy, show cached emergency card if available.

### Install prompt
- NOT on first load
- Show after 2nd session
- NOT on: symptom add form, chat, family update (focused moments)
- Show on: home (after data loads), documents list
- Copy: "Add Clarifer to your home screen for quick access."

### Web push notifications
- Register opt-in on profile page (not on first load)
- Permission copy: "Get reminders for medications and appointments."
- Triggers: severity ≥ 7, medication overdue 2h, appointment in 24h

---

## EXPO MOBILE — apps/mobile/ RULES

Both PWA and Expo are being built. PWA ships June 15. Expo follows.

Rules for EVERY file in apps/mobile/:
```
NEVER: window, document, localStorage, sessionStorage, next/router, next/link, next/image
NEVER: hex color strings
ALWAYS: lib/design-tokens.ts for all colors
ALWAYS: SafeAreaView or useSafeAreaInsets() for bottom-fixed elements
ALWAYS: KeyboardAvoidingView for screens with text inputs
```

Directory:
```
apps/mobile/
  app/
    (auth)/login.tsx
    (auth)/signup.tsx
    (auth)/forgot-password.tsx
    home.tsx
    chat.tsx
    documents/index.tsx
    documents/[id].tsx
    documents/upload.tsx
    log/index.tsx
    log/add.tsx
    log/[id].tsx
    notifications.tsx
    profile.tsx
    tools/index.tsx
    tools/medications.tsx
    tools/trials.tsx
    patients/[id]/index.tsx
    patients/[id]/family-update.tsx
    patients/[id]/care-team.tsx
    patients/[id]/emergency-card.tsx
  lib/
    design-tokens.ts
```

Scroll: React Native ScrollView — not CSS overflow-y.
Bottom nav indicator: 4px — not 3px (sub-pixel issue on older Android).
Document upload: Supabase resumable upload directly from device — NOT through Vercel.

---

## COMPLETE SCREEN INDEX

Base URL: https://www.figma.com/design/RvUccT5yRPIMLMAYySg8W2/Clarifer-%E2%80%94-Design-System---Screen-Reference

### COMPONENT REFERENCE FRAMES (read before building any interactive element)
| Frame | Node | Link |
|---|---|---|
| hover-states | 57:2 | ?node-id=57-2 |
| loading-skeletons | 57:39 | ?node-id=57-39 |
| empty-states | 57:72 | ?node-id=57-72 |

### AUTH
| Screen | Node | Link | File |
|---|---|---|---|
| login/desktop | 4:24 | ?node-id=4-24 | app/login/page.tsx |
| login/mobile | 4:64 | ?node-id=4-64 | app/login/page.tsx |
| auth/splash | 4:2 | ?node-id=4-2 | app/login/page.tsx |
| forgot-password | 4:256 | ?node-id=4-256 | app/(auth)/forgot-password/page.tsx |
| mfa-challenge | 4:275 | ?node-id=4-275 | app/(auth)/mfa/page.tsx |
| account-locked | 4:300 | ?node-id=4-300 | app/login/page.tsx |
| signup/desktop | 40:2 | ?node-id=40-2 | app/signup/page.tsx |
| signup/mobile | 41:2 | ?node-id=41-2 | app/signup/page.tsx |
| onboarding/desktop | 42:2 | ?node-id=42-2 | app/onboarding/page.tsx |
| onboarding/mobile | 43:2 | ?node-id=43-2 | app/onboarding/page.tsx |

NOTE: Nodes 4:93–4:225 (auth/signup-step-1 through step-5) are the OLD 5-step onboarding.
They are DEPRECATED. Use 40:2 / 41:2 (new 2-field design) instead.

### HOME
| Screen | Node | Link | File |
|---|---|---|---|
| home/desktop | 46:2 | ?node-id=46-2 | components/home/home-client.tsx |
| home/mobile | 2:7 | ?node-id=2-7 | components/home/home-client.tsx |

NOTE: Node 2:75 (home/desktop on main canvas) is superseded by 46:2 on handoff page.

### DOCUMENTS
| Screen | Node | Link | File |
|---|---|---|---|
| documents/list-desktop | 53:2 | ?node-id=53-2 | app/documents/page.tsx |
| documents/list-mobile | 5:274 | ?node-id=5-274 | app/documents/page.tsx |
| documents/upload-mobile | 6:2 | ?node-id=6-2 | app/documents/upload/page.tsx |
| document-detail/desktop | 3:197 | ?node-id=3-197 | app/documents/[id]/page.tsx |
| document-detail/mobile | 3:155 | ?node-id=3-155 | app/documents/[id]/page.tsx |

### CHAT
| Screen | Node | Link | File |
|---|---|---|---|
| chat/desktop | 47:2 | ?node-id=47-2 | app/chat/page.tsx |
| chat/mobile | 6:37 | ?node-id=6-37 | app/chat/page.tsx |

### FAMILY UPDATE
| Screen | Node | Link | File |
|---|---|---|---|
| family-update/desktop | 48:2 | ?node-id=48-2 | app/(app)/patients/[id]/family-update/page.tsx |
| family-update/mobile | 6:84 | ?node-id=6-84 | app/(app)/patients/[id]/family-update/page.tsx |

### SYMPTOM LOG
| Screen | Node | Link | File |
|---|---|---|---|
| symptoms/list-desktop | 55:2 | ?node-id=55-2 | app/log/page.tsx |
| symptoms/list-mobile | 5:2 | ?node-id=5-2 | app/log/page.tsx |
| symptoms/add-desktop | 56:2 | ?node-id=56-2 | app/log/add/page.tsx |
| symptoms/add-mobile | 5:60 | ?node-id=5-60 | app/log/add/page.tsx |
| symptoms/detail-mobile | 5:178 | ?node-id=5-178 | app/log/[id]/page.tsx |
| symptoms/detail-desktop | no design — build from spec | — | app/log/[id]/page.tsx |

### MEDICATIONS
| Screen | Node | Link | File |
|---|---|---|---|
| medications/desktop | 53:32 | ?node-id=53-32 | app/tools/medications/page.tsx |
| medications/mobile | 5:215 | ?node-id=5-215 | app/tools/medications/page.tsx |

### CLINICAL TRIALS
| Screen | Node | Link | File |
|---|---|---|---|
| trials/desktop | 3:82 | ?node-id=3-82 | app/tools/trials/page.tsx |
| trials/mobile | 3:2 | ?node-id=3-2 | app/tools/trials/page.tsx |

### CARE TEAM
| Screen | Node | Link | File |
|---|---|---|---|
| care-team/desktop | 53:68 | ?node-id=53-68 | app/(app)/patients/[id]/care-team/page.tsx |
| care-team/mobile | 6:183 | ?node-id=6-183 | app/(app)/patients/[id]/care-team/page.tsx |

### EMERGENCY CARD
| Screen | Node | Link | File |
|---|---|---|---|
| emergency-card/desktop | 54:2 | ?node-id=54-2 | app/(app)/patients/[id]/emergency-card/page.tsx |
| emergency-card/mobile | 6:128 | ?node-id=6-128 | app/(app)/patients/[id]/emergency-card/page.tsx |
| public/emergency/[token] | NO DESIGN — build from spec | — | app/emergency/[token]/page.tsx |

### NOTIFICATIONS
| Screen | Node | Link | File |
|---|---|---|---|
| notifications/desktop | 54:33 | ?node-id=54-33 | app/notifications/page.tsx |
| notifications/mobile | 55:38 | ?node-id=55-38 | app/notifications/page.tsx |

### PROFILE
| Screen | Node | Link | File |
|---|---|---|---|
| profile/desktop | 54:61 | ?node-id=54-61 | app/profile/page.tsx |
| profile/mobile | 7:2 | ?node-id=7-2 | app/profile/page.tsx |

### TOOLS HUB
| Screen | Node | Link | File |
|---|---|---|---|
| tools/desktop | no design — build from spec | — | app/tools/page.tsx |
| tools/mobile | no design — build from spec | — | apps/mobile/app/tools/index.tsx |

### INTERNATIONAL
| Screen | Node | Link | File |
|---|---|---|---|
| internacional/inicio-mobile | 8:226 | ?node-id=8-226 | apps/mobile/app/internacional/index.tsx |

### LANDING / PUBLIC PAGES
| Screen | Node | Link | File |
|---|---|---|---|
| landing/desktop | 7:57 | ?node-id=7-57 | app/page.tsx |
| landing/mobile | 7:155 | ?node-id=7-155 | app/page.tsx |
| waitlist | no design — build from spec | — | app/waitlist/page.tsx |
| download | no design — build from spec | — | app/download/page.tsx |
| promise | no design — build from spec | — | app/promise/page.tsx |
| about | no design — build from spec | — | app/about/page.tsx |

### PROVIDER
| Screen | Node | Link | File |
|---|---|---|---|
| provider/dashboard | 7:218 | ?node-id=7-218 | app/provider/page.tsx |
| provider/patient-detail | 8:2 | ?node-id=8-2 | app/provider/patients/[id]/page.tsx |

### HOSPITAL ADMIN
| Screen | Node | Link | File |
|---|---|---|---|
| hospital-admin/dashboard | 7:287 | ?node-id=7-287 | app/admin/page.tsx |
| hospital-admin/outcomes | 8:82 | ?node-id=8-82 | app/admin/outcomes/page.tsx |
| hospital-admin/white-label | 8:171 | ?node-id=8-171 | app/admin/white-label/page.tsx |

### CCF DASHBOARD
| Screen | Node | Link | File |
|---|---|---|---|
| ccf-dashboard | NO FIGMA SCREEN — live product only | — | app/ccf-dashboard/page.tsx |

NOTE: The CCF dashboard at clarifer.com/ccf-dashboard exists in the codebase but has no dedicated Figma
UI design. The Figma page 19:2 is a CCF pitch deck (data model + research value prop), NOT a UI screen.
Build the ccf-dashboard UI following the spec in the SCREEN SPECS section below.

---

## SCREEN SPECS

### LANDING PAGE — 7:57 / 7:155

Route: / | Auth: public
Files: app/page.tsx, components/layout/header.tsx

Header desktop: Logo left | Features | For Hospitals | About center | Sign in + Join waitlist + LangToggle right
Header mobile: Logo left | Hamburger right
Hero: "Care is hard enough. We will help you organize it." (Playfair 48px / 32px)
CTAs: "Join the waitlist" (--primary) + "Sign in" (ghost link)

CRITICAL: "Sign in" MUST be in the header — currently missing.
Launch date: read from NEXT_PUBLIC_LAUNCH_DATE env var — never hardcoded.

---

### SIGNUP — 40:2 / 41:2

Route: /signup | Auth: unauthenticated only → redirect /home if authenticated
File: app/signup/page.tsx

Desktop: split — left 40% --primary bg + logo + tagline | right 60% white form
Mobile: centered card on --background

Fields (in order):
1. LangToggle EN/ES — top-right of form, FIRST element
2. "Create your account" Playfair Bold 28px desktop / 24px mobile
3. "Free for caregivers. Always." 14px --muted
4. Your name (56px mobile / 48px desktop)
5. Email address
6. Password + show/hide toggle (8+ chars, 1 upper, 1 lower, 1 number)
7. Terms checkbox | Age (18+) checkbox
8. "Continue with Google" outlined + Google icon (ABOVE form)
9. "or" divider
10. "Create account" --primary 52px, disabled until all valid
11. "Already have an account? Sign in"

MISSING: Google OAuth on /signup — currently only on /login.

Errors:
- Duplicate email → "An account with this email already exists. Sign in instead."
- Rate limit → "Too many attempts. Please wait a moment."
- Generic → "Something went wrong. Please try again." (never raw error)

Post-submit: inline "Check your email" — no redirect.
After link click → /auth/callback → routePostAuth() → /onboarding or /home.

---

### ONBOARDING — 42:2 / 43:2

Route: /onboarding | Auth: required (no session → /login)
File: app/onboarding/page.tsx

Desktop: centered card max 480px. No nav. No header. Logo above.
Mobile: full screen. Logo at top.

ONE QUESTION ONLY. DO NOT ADD BACK:
- Date of birth, biological sex, location, role picker, diagnosis, condition details

Fields:
- "Who are you caring for?" Playfair Bold 28px/24px
- "Their first name is all we need right now." 14px --muted
- "THEIR FIRST NAME" 11px caps
- Patient name input (56px, required, focus: 2px --primary border + --pale-sage bg)
- "LANGUAGE" 11px caps
- EN/ES toggle (44px, active side fills --primary + white text)
- "Take me to my dashboard →" --primary 52px, enabled when name.trim() truthy
- Hint 13px --muted below button

Submit flow:
1. POST /api/patients/create (first_name, language_preference, role: "caregiver")
2. /onboarding/complete
3. DisclaimerModal — MUST await POST /api/users/disclaimer (not fire-and-forget)
4. /home

NOTE: No `profiles` table. User data is in `patients` and `users` tables.

---

### HOME — 46:2 / 2:7

Route: /home | Auth: required
Files: app/home/page.tsx (server), components/home/home-client.tsx (client)

Desktop: left nav 52px | header 52px | content 680px | right sidebar 280px
Mobile: app header 52px | scroll | bottom nav 56px

Content:
- "CARING FOR" 11px caps, 0.8px spacing
- Patient name: Playfair Bold 38px mobile / 30px desktop
- "How has [Name] been feeling lately?" 14px --muted
- Priority card: white, 12px radius, PRIORITY label + appointment or severity
- "Send family update →" full-width --primary 52px
- "CARE TIMELINE" label + 4 rows 52px

Right sidebar (desktop):
- "NEXT APPOINTMENT" + card or "+ Add appointment"
- CCF card (always visible, no condition check)
- "Care team" link

CCF card — exact copy, never change:
- "FROM CCF" 11px caps
- "Don't know where to start?" 16px SemiBold
- "CCF offers a free care kit, a 1:1 advocate meeting, and a resource roadmap for families who need support."
- "Connect with CCF" --primary button

BUGS:
- console.log at app/home/page.tsx:17 logs patient.name + patient.custom_diagnosis — REMOVE
- Patient query must use .eq("organization_id", org_id) not created_by=user.id

---

### DOCUMENTS LIST — 53:2 / 5:274

Route: /documents | Auth: required | File: app/documents/page.tsx

Title: "Documents" H1 | "+ Upload" top-right (outlined --primary)
Subtitle: "Tap any document to get a plain-language summary"

Cards 72px: filename (15px Medium) | category pill (11px, --pale-sage) | date (13px --muted) | AI badge
- AI analyzed: green
- Analyzing: amber
- No badge: uploading or not triggered

Upload path: Direct PUT to Supabase Storage — NOT through Vercel (4.5MB serverless limit).
Max file size: 20MB — enforce client-side AND in Supabase bucket policy.

---

### DOCUMENT DETAIL — 3:197 / 3:155

Route: /documents/[id] | Auth: required | File: app/documents/[id]/page.tsx

AI analysis block (all 3 states required):
1. Loading: "Reviewing your document..." + spinner + skeleton lines
2. Error: "Analysis unavailable. Try again later." (--muted, no retry)
3. Success: "What this document means" H2 | summary | disclaimer | share

Disclaimer (always below summary):
"Clarifer never diagnoses. Always consult your care team for clinical decisions."

CRITICAL BUG: AnalysisTrigger shows error on HTTP 200 with error JSON in body.
Fix: read stream body, check error field, only call router.refresh() on clean success.

---

### CHAT — 47:2 / 6:37

Route: /chat | Auth: required | File: app/chat/page.tsx

DISCLAIMER ABOVE INPUT (Lena Kirchner — enforced):
"Clarifer does not diagnose. For clinical decisions, always consult your care team."
12px --muted, centered, between chat area and input bar. Never below.

Input: paperclip (attach) | "Ask Clarifer anything..." | send --primary
User bubbles: right, --primary bg, white text, 12px radius
AI bubbles: left, white card, --text, 12px radius, timestamp

Mobile: KeyboardAvoidingView + safe-area-inset-bottom
Error bubble: "Something went wrong. Please try again." (left, white card, --muted)
Pass language to /api/chat.

---

### FAMILY UPDATE — 48:2 / 6:84

Route: /patients/[id]/family-update | Auth: required
File: app/(app)/patients/[id]/family-update/page.tsx

NO MARKDOWN IN OUTPUT (Lena Kirchner — enforced).
Strip: `# ## ### * ** _ __ - (line-start) 1. 2. \` \`\`\` > ---`
System prompt must also forbid markdown (not just client-side stripping).

Format toggle: WhatsApp | Email
Language: from user profile
Generate → streaming → blinking cursor ▌ within 1s
Output: white card, plain paragraphs only
Copy: "Copy for WhatsApp" / "Copy for email" (outlined --primary, full width)
History: "View previous updates →"
Rate limit: 2/min | Timeout: 45s → error, retain form

---

### SYMPTOM LOG LIST — 55:2 / 5:2

Route: /log | Auth: required | File: app/log/page.tsx

Title: "How is [Name] doing today?" Playfair Bold 22px/20px
"+ Log symptom" top-right

Cards 72px: left color bar | severity badge | date + time | arrow →
Severity colors:
- Very mild: #63A3D8 (blue)
- Mild: #D4AF2F (yellow)
- Moderate: #BA7517 (--severity-med)
- Significant: #E29DD1 (pink)
- Severe: #E24B4A (--severity-high)

---

### SYMPTOM LOG ADD — 56:2 / 5:60

Route: /log/add | Auth: required | File: app/log/add/page.tsx

ONE LONG SCROLL — not accordion, not expand/collapse.
Autosave: POST /api/log/draft every 30s (upsert). Indicator: "✓ Draft saved 2m ago" top-right.

7 sections:

S1 OVERALL LEVEL (required, blocks submit):
Full-width 56px options, color tinted on selection:
Very mild (blue) | Mild (yellow) | Moderate (amber) | Significant (pink) | Severe (red)

S2 SENSATION (optional):
Chips: Pressure | Burning | Sharp | Throbbing | Deep inside | On the skin

S3 TIMING (optional):
Chips: All day | Morning | After eating | At night | Comes and goes

S4 FUNCTIONAL STATUS (required, blocks submit):
Full-width 56px: Active as usual | Slowing down | Limited but managing | Needs help | Stayed in bed

S5 APPETITE (required):
Chips: Eating normally | Less than usual | Very little | Not eating

S6 INFECTION SIGNS (optional):
Checkboxes: Fever or chills | Swelling/redness at wound or port | Unusual discharge | New/worsening cough | Painful urination
WARNING on ANY check (James Whitfield): "⚠  Call 911 or go to the emergency room immediately."
Style: #FFF0F0 bg, 2px --severity-high border, SemiBold 48px

S7 NOTES (optional): Textarea 120px, "Triggers, medications taken, context..."

Save log: full-width --primary 52px, disabled until S1 AND S4 filled.
On network drop: retain all data, show retry toast.

---

### MEDICATIONS — 53:32 / 5:215

Route: /tools/medications | Auth: required | File: app/tools/medications/page.tsx

"Medications" H1 | "+ Add" top-right
"Tap to mark taken today." 14px --muted

Cards 72px: Name 15px SemiBold | Dose + Freq 13px --muted | "Active" badge
Mark taken: optimistic → POST /api/medications/[id]/taken → revert + toast on failure

Add: desktop modal (480px) / mobile bottom sheet
- Medication name: autocomplete after 2 chars (FDA drug list)
- Dose + Frequency fields
- "Add medication" --primary

Interaction warning (2+ meds with match in drug_interactions table):
Amber banner: "Potential interaction between [Drug A] and [Drug B]. Review with your care team."

Demo: Omeprazole 20mg | Lorazepam 0.5mg | Ondansetron 8mg | Cisplatin 25mg/m² | Gemcitabine 1000mg/m²

---

### CLINICAL TRIALS — 3:82 / 3:2

Route: /tools/trials | Auth: required | File: app/tools/trials/page.tsx

Data source: ClinicalTrials.gov API v2 (real, no API key)

Biomarker filters (chips):
- Tumor location: Not sure | Intrahepatic | Perihilar | Distal
- CA 19-9: Not tested | <100 | 100-1k | 1k-10k | >10k | >100k
- Treatment: Not started | On first | First stopped | Two or more
- FGFR2: Not tested | Positive | Negative
- IDH1: Not tested | Positive | Negative

Inline help (12px --muted):
- FGFR2: "Found in about 15% of cases. Ordered by your oncologist."
- IDH1: "More common in intrahepatic cases. Guides eligibility for ivosidenib trials."

Trial cards: title | NCT ID | status | phase | sponsor | Save | Discuss
Discuss: pre-drafted email to trial contact with patient biomarker profile
Filters persist in URL params.

---

### CARE TEAM — 53:68 / 6:183

Route: /patients/[id]/care-team | Auth: required
File: app/(app)/patients/[id]/care-team/page.tsx

Provider cards:
- Name 16px SemiBold | specialty + role 13px --muted | "Primary" badge
- Phone button: --primary bg, white text, tap to call
- Email button: outlined, tap to compose
- "Quick messages": expands → Request refill | Schedule appointment | Follow up on results
  - Tap copies to clipboard + "Copied" toast 2s

Invite: "+ Invite provider" → POST /api/care-team/invite → pending row + Brevo email
Pending badge on list for unaccepted invites.

---

### EMERGENCY CARD — 54:2 / 6:128

Route: /patients/[id]/emergency-card | Auth: caregiver
File: app/(app)/patients/[id]/emergency-card/page.tsx

Sections:
1. CURRENT MEDICATIONS: name + dose + frequency (not name only — James Whitfield)
2. ALLERGIES
3. BLOOD TYPE
4. PRIMARY CARE: name + phone
5. CAREGIVER: name + phone
6. INSURANCE: plan name

"Works offline. Show this to any nurse or paramedic." 13px --muted
Share → /emergency/[publicToken] → copy or native share + QR code

Public URL /emergency/[token] (app/emergency/[token]/page.tsx — DOES NOT EXIST):
- No auth
- Static render, works offline
- No diagnosis visible
- Service worker must cache for offline

---

### NOTIFICATIONS — 54:33 / 55:38

Route: /notifications | Auth: required | File: app/notifications/page.tsx

Bell icon in header, badge = unread count.
Cards 72px: left bar 3px (--primary unread, transparent read) | title 15px SemiBold | body 13px --muted | timestamp
Unread: --pale-sage bg | Read: white bg
Tap: mark read + navigate
Empty: "You are all caught up."

---

### PROFILE — 54:61 / 7:2

Route: /profile | Auth: required | File: app/profile/page.tsx

1. ACCOUNT: name | email | language toggle (changes UI globally)
2. SECURITY: change password | enable 2FA
3. DATA CONSENT (Amara Osei — legal, not checkbox):
   - "Opt into anonymized data sharing" toggle
   - "This is a genuine value exchange, not a legal checkbox."
   - Writes to data_consent: user_id, org_id, consented_at, consent_version ("2026-05-v1"), ip_address (server-side)
   - Withdrawal always visible → PATCH data_consent SET withdrawn_at = NOW()
   - audit_log on both consent and withdrawal
4. SIGN OUT (outlined, full width)
5. DANGER ZONE: "Download my data" → /api/data/export | "Delete account" → /api/account/delete (cascade 12 tables)

---

### CCF DASHBOARD — no Figma screen

Route: /ccf-dashboard | Auth: required (CCF credentials, NOT caregiver auth)
File: app/ccf-dashboard/page.tsx

ZERO individual patient data. All aggregates. Minimum cohort: n≥5 per data point.

Data shown:
- Total caregivers | Active this month | Avg severity trend
- Top reported symptoms | Medication adherence % | Document upload frequency

Metric cards: 36px number | 13px --muted label | trend arrow | --pale-sage bg
Charts: symptom trend line | caregiver activity heatmap | top conditions bar

CCF credentials required — NOT the same as caregiver auth.
Michael's internal growth view at /hq: growth data only, no PHI.

---

### TOOLS HUB — build from spec

Route: /tools | Auth: required
Files: app/tools/page.tsx, apps/mobile/app/tools/index.tsx

Grid of cards: Medications | Clinical Trials | Emergency Card | Family Update
No new API. Static navigation.

---

### WAITLIST — build from spec

Route: /waitlist | Auth: public | File: app/waitlist/page.tsx

Email input + submit → POST /api/waitlist → Brevo confirmation from team@clarifer.com
Success: "You're on the list. We'll be in touch."
Rate limit: 3/hour per IP.

---

### DOWNLOAD — build from spec

Route: /download | Auth: public | File: app/download/page.tsx

- App Store link (Apple Team ID: PV8B2R8Y22) — placeholder
- Google Play link — placeholder
- "Install as app" PWA section with instructions

---

### PROMISE — build from spec

Route: /promise | Auth: public | File: app/promise/page.tsx

- Caregiver Support Fund: min 5% gross research licensing revenue
- Admin costs capped 10%
- Annual public reporting
- Caregiver Advisory Committee governs
- PBC intent (before institutional financing)
- Data consent value exchange
No "serious illness", no em dashes.

---

### ABOUT — build from spec

Route: /about | Auth: public | File: app/about/page.tsx

Founding story: Samira, her father, cholangiocarcinoma, building Clarifer.
Lighthouse with Rod of Asclepius logo — tied to her father's love of fishing. Above the fold. NEVER removed.
No "serious illness". No Cassini.

---

### PATIENT HUB — no Figma screen (Maya Okonkwo flag)

Route: /patients/[id] | Auth: required
File: app/(app)/patients/[id]/page.tsx

No Figma design exists. Build from this spec.

Sections:
- Insurance waterfall: primary → secondary → Medicaid → out-of-pocket (calculated from profile fields)
- Income cliff alert: if Medicaid income limit within 10% of household income → amber alert banner
- Authorization wallet: procedure | status enum (pending/approved/denied) | date submitted | payer
  - GET/POST/PATCH /api/authorizations | all 4 HIPAA checks | audit_log on all writes

---

### APPOINTMENTS — no Figma screen (Maya Okonkwo flag)

Route: /patients/[id]/appointments | Auth: required
File: app/(app)/patients/[id]/appointments/page.tsx

No Figma design exists. Build from this spec.
List + add form. GET/POST /api/appointments. All 4 HIPAA checks. audit_log on every write.
Fields: provider name | date/time | type | location | notes

---

## AUTH FLOW

```
clarifer.com
  ↓
/signup or /login
  │
  ├── Email/password → supabase.auth.signUp() or signInWithPassword()
  │   "Check your email" screen → user clicks link
  │   → /auth/callback?code=...
  │   → exchangeCodeForSession()
  │   → routePostAuth()
  │   ├── no org or patient → /onboarding
  │   └── has both → /home
  │
  └── Google OAuth → signInWithOAuth({ provider: "google", redirectTo: SITE_URL + "/auth/callback" })
      → /auth/callback → exchangeCodeForSession() → routePostAuth()

/onboarding → POST /api/patients/create
/onboarding/complete → DisclaimerModal → await POST /api/users/disclaimer → /home
```

---

## STATE MATRIX — WHAT HAPPENS WHEN THINGS BREAK

| Screen | API failure | Timeout | Network drop | Optimistic revert |
|---|---|---|---|---|
| Home | Skeleton stays, toast | Skeleton stays | Show cached data | N/A |
| Document upload | "Upload failed. Tap to retry." | "Upload timed out." | Retain file, retry | N/A |
| Document analysis | "Analysis unavailable. Try again later." | Same | Cached summary if exists | N/A |
| Chat | Error bubble: "Something went wrong." | Same | Toast: "No connection." | N/A |
| Family update | Retain form, toast | "Timed out." retain form | Retain form, toast | N/A |
| Symptom log save | Retain all data, toast | Same | Same | N/A |
| Mark med taken | Uncheck + toast | Uncheck + toast | Uncheck + toast | Yes — always |
| Care team invite | Error in modal | Same | Same | N/A |
| Notifications read | Keep unread | Same | Same | Yes |

---

## API ROUTES

| Route | Method | Auth | Description |
|---|---|---|---|
| /api/patients/create | POST | required | Create patient on onboarding |
| /api/log/create | POST | required | Save symptom log |
| /api/log/draft | POST | required | Autosave draft (upsert) |
| /api/log/trend | GET | required | AI trend summary (cached 6h) |
| /api/log/[id]/share | POST | required | Share log entry with care team |
| /api/documents/[id]/analyze | POST | required | Trigger AI analysis |
| /api/documents/[id]/share | POST | required | Share AI summary with care team |
| /api/chat | POST | required | Streaming chat (4/min) |
| /api/family-update | POST | required | Generate family update (2/min) |
| /api/family-update/history | GET | required | List past updates |
| /api/medications | GET/POST | required | List / add medications |
| /api/medications/[id]/taken | POST | required | Mark taken (optimistic) |
| /api/medications/adherence | GET | required | 30-day adherence data |
| /api/medications/refill-alerts | GET | required | Upcoming refill alerts |
| /api/trials | GET | required | Search clinical trials |
| /api/appointments | GET/POST | required | List / create appointments |
| /api/authorizations | GET/POST/PATCH | required | Prior auth tracker |
| /api/care-team/invite | POST | required | Invite provider |
| /api/notifications | GET | required | List notifications |
| /api/notifications/[id]/read | PATCH | required | Mark read |
| /api/emergency-card/[id]/pdf | GET | required | Generate PDF (signed URL) |
| /api/provider/notes | POST | provider | Add provider note |
| /api/search | GET | required | Global search (debounced) |
| /api/users/disclaimer | POST | required | Record disclaimer acceptance |
| /api/data-consent | POST/PATCH | required | Record/withdraw consent |
| /api/data/export | POST | required | GDPR export |
| /api/account/delete | POST | required | Delete account + cascade |
| /api/waitlist | POST | public | Add to waitlist |
| /api/admin/outcomes | GET | admin | Aggregate outcomes |
| /api/admin/branding | PATCH | admin | White-label settings |
| /api/admin/caregivers | GET | admin | Caregiver list (aggregate) |
| /api/admin/export | GET | admin | Outcomes CSV/PDF export |
| /api/ccf/dashboard | GET | ccf | CCF aggregate dashboard data |
| /api/health | GET | public | Health check (n8n monitoring) |

---

## KNOWN BUGS — FIX ORDER

**P0 — Demo blockers (fix before June 3):**
1. ANTHROPIC_API_KEY missing from Vercel Production → document analysis broken
2. AnalysisTrigger: 200 with error JSON treated as success → fix stream reading
3. Family update: markdown in output → fix system prompt + client stripping

**P1 — Launch blockers (fix before June 15):**
4. app/home/page.tsx:17 — console.log of patient.name + custom_diagnosis (HIPAA violation)
5. DisclaimerModal: fire-and-forget → must await and handle error
6. home/page.tsx: queries by created_by not organization_id
7. app/(app)/layout.tsx: missing → patient pages have no desktop chrome
8. Google OAuth on /signup: missing (only on /login)
9. /emergency/[token]: route does not exist
10. Sign in link missing from landing page header
11. EN/ES i18n infrastructure not built — app is English-only
12. Language auto-detection (navigator.language) not implemented
13. 3 failing tests: analyze-document, documents-analyze, patients-create
    (patients-create mock missing .update() method)

**P2 — Post-launch fix:**
14. 2 unapplied Supabase migrations:
    - 20260428000003_who_ictrp_mirror.sql
    - 20260428000004_care_team_directory.sql
15. Lighthouse score not yet verified (target ≥ 90)
16. WHO ICTRP table seeded with sample data only — real API integration pending

---

## DEMO ACCOUNT

Email: demo@clarifer.com | Password: ClariferdDemo2026!
Patient: Carlos Rivera (5fc76836-e2f7-47b6-a394-ddccef619c95)
Org ID: fa731120-304a-48ba-889a-3be6431454f3
Appointments: Oncology follow-up June 18 10:00 | Palliative care June 18 14:00
Medications: Omeprazole 20mg | Lorazepam 0.5mg | Ondansetron 8mg | Cisplatin 25mg/m² | Gemcitabine 1000mg/m²
Care team: Dr. Sarah Chen (Oncology, Primary) | Dr. Marcus Webb (Palliative)
Documents: livertests.pdf (uploaded May 28)

---

## INFRASTRUCTURE

| Service | Detail |
|---|---|
| Supabase | lrhwgswbsctfqtvdjntr |
| Vercel | clarifer.com | auto-deploy on main | preview on sprint branches |
| Anthropic | claude-sonnet-4-6 (all routes — never change this) |
| Upstash Redis | US-East-1 (iad1) |
| Brevo | smtp-relay.brevo.com:587 | aaa008001@smtp-brevo.com | sender: team@clarifer.com |
| PostHog | https://us.i.posthog.com |
| Google Analytics | G-PNWK59ZSJW |
| Hostinger | DNS + email for clarifer.com |
| n8n | HP machine 100.109.75.73 (Tailscale) — monitoring + appointment reminders |

Required Vercel Production env vars:
```
ANTHROPIC_API_KEY              ← CRITICAL — missing = analysis broken
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_SITE_URL           ← must be https://clarifer.com in production
BREVO_API_KEY
NEXT_PUBLIC_LAUNCH_DATE        ← ISO string, not hardcoded
INTERNAL_API_SECRET            ← .env.local + Vercel Production only
```

Git workflow:
- Samira runs all git commands from PowerShell on Windows (not WSL)
- Claude Code: sprint branches only. Never pushes to main.
- Merge: git merge --no-ff from PowerShell
- Vercel: auto-deploys on push to main

---

Last updated: May 29, 2026
Figma file key: RvUccT5yRPIMLMAYySg8W2
Handoff page: 26:2
Version: 4
