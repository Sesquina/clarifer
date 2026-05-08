# CLARIFER DESIGN SYSTEM
## Version 1.0 — Locked April 30, 2026
## Read this before writing a single line of UI code. No exceptions.

---

## FOUNDATIONAL RULES — THESE NEVER BREAK

1. No em dashes. Ever. In any copy, component, AI response, error message, label, or comment.
2. No hex strings in components. CSS variables only.
3. No dark backgrounds on AI content. White card always.
4. No broken touch targets. 48px minimum. 52px preferred.
5. No empty states without a warm message and a clear action.
6. No error messages that blame the user.
7. No condition names on the home screen. They live in the backend.
8. No death countdowns. No "Day 187 of care." Just the date.
9. No alert triangles for appointments. Appointments are not emergencies.
10. WCAG AAA minimum. 7:1 contrast for body text. 4.5:1 for large text. Full ADA compliance. Not legal minimums. Actual compliance.

---

## BRAND IDENTITY

Clarifer is a knowledgeable companion for families navigating serious illness.

Voice: warm, direct, honest, actionable. Never clinical without explanation. Never hedging into uselessness. Never cold.

Visual identity: calm, human, trustworthy. Warm linen everywhere. It should feel like a hand on the shoulder at 2am in a hospital parking lot.

The founding story lives in every design decision. A caregiver opening this at their worst moment should feel seen, not processed.

---

## COLORS

### Core palette — CSS variables

```
--background:   #F7F2EA   Warm linen. Every page background. Never changes.
--primary:      #2C5F4A   Dark sage. Headers, nav, primary buttons, active states.
--accent:       #C4714A   Terracotta. CTAs, highlights, brand moments.
--card:         #FFFFFF   Pure white. Card backgrounds only.
--text:         #1A1A1A   Near black. All body text. 7:1 contrast on linen.
--muted:        #4A4A4A   Dark gray. Secondary text. Minimum 7:1 on white.
--border:       #C8C2B9   Warm gray. All dividers and card borders. AAA compliant.
--pale-sage:    #D4EBD8   Light green. Success state backgrounds.
--pale-terra:   #F5DDD0   Light orange. Warning state backgrounds.
```

### Lab value colors — universal red yellow green system

Lab values override brand palette. Status must be instantly readable without interpretation.

```
Critical (red):
  background:   #FDECEA
  text:         #8B1A1A   (7:1 on background)
  value color:  #8B1A1A
  border:       #E57373

Flagged (yellow):
  background:   #FEF8E1
  text:         #5C3D00   (7:1 on background)
  value color:  #7A4F00
  border:       #F4C842

Normal (green):
  background:   #E8F5E9
  text:         #1B5E20   (7:1 on background)
  value color:  #1B5E20
  border:       #66BB6A
```

### Role accent colors

```
Caregiver and patient:    --primary (#2C5F4A) throughout
Provider:                 #3D3591   Deep purple. AAA compliant on white.
Hospital administrator:   #7A2010   Deep coral. AAA compliant on white.
Foundation administrator: #7A2010   Same as hospital admin.
Family view-only:         --primary (#2C5F4A) same as caregiver.
```

Role accents apply to: top accent bar on cards, active nav items, primary action buttons on role dashboards, role badge backgrounds.

### Semantic colors

```
Success:  background #E8F5E9, text #1B5E20
Warning:  background #FEF8E1, text #5C3D00
Danger:   background #FDECEA, text #8B1A1A
Info:     background #E3F2FD, text #0D3B6E
```

All semantic color pairs meet 7:1 contrast ratio.

---

## TYPOGRAPHY

### Fonts

```
Display / titles:  Georgia or Playfair Display — weights 400, 600, 700
Body / UI:         System UI stack: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
Mono (rare):       System monospace — for MRNs, lab codes, FHIR IDs only
```

### Type scale — mobile first

```
Hero:       26px / 700 / Display   — greeting on home screen only
Title:      22px / 600 / Display   — page titles
Subtitle:   18px / 500 / Body      — section headers
Body:       16px / 400 / Body      — all reading text
Body med:   16px / 500 / Body      — labels, emphasized text
Small:      14px / 400 / Body      — secondary info, metadata
Micro:      13px / 400 / Body      — timestamps, helper text
Label:      11px / 500 / Body      — section labels, uppercase, tracking 0.06em
```

Desktop (768px+):
```
Hero:   32px
Title:  26px
All others unchanged.
```

### Type rules

- No em dashes. Use plain sentences. Use colons where a pause is needed.
- No ALL CAPS except section labels (--label style only).
- Line height: 1.6 for body text, 1.3 for titles, 1.8 for clinical explanations.
- Maximum line length: 680px. Never wider for reading text.
- Sixth-grade reading level for all patient-facing content.
- One clinical term per explanation maximum. Always followed by plain-language parenthetical.

---

## SPACING — 8px base grid

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
```

Page padding mobile:    20px horizontal
Page padding tablet:    24px horizontal
Page padding desktop:   32px horizontal, max-width 1280px centered
Section spacing:        32px between major sections
Card internal padding:  20px mobile, 24px desktop

---

## BORDER RADIUS

```
--radius-sm:   6px    chips, badges, small elements
--radius-md:   10px   inputs, buttons, small cards
--radius-lg:   14px   cards, modals, panels
--radius-xl:   20px   full-width cards, hero sections
--radius-pill: 999px  pill buttons, tags, status indicators
```

---

## SHADOWS — subtle only

```
--shadow-card:   0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-raised: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)
--shadow-modal:  0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)
```

No dramatic shadows. No glow. No blur.

---

## BREAKPOINTS

```
Mobile:   0 to 767px      Base. All styles written here first.
Tablet:   768 to 1023px   Provider flows. iPad-optimized.
Desktop:  1024px and up   Admin dashboards. Full layouts.
```

---

## TOUCH TARGETS — non-negotiable

Minimum: 48px height and width on all tappable elements.
Preferred: 52px height.
Input fields: 52px on mobile, 44px on desktop.
Bottom nav items: 64px height.
This is a medical app. Caregivers are stressed, exhausted, and sometimes have shaking hands. Small tap targets are a patient safety issue.

---

## MOTION AND ANIMATION — functional only

### Permitted

Loading skeleton pulse: opacity 0.6 to 1.0, 1.5s ease-in-out infinite
Success checkmark draw: stroke-dashoffset 100 to 0, 0.4s ease-out
Toast slide in: translateY(16px) to 0 + opacity 0 to 1, 0.25s ease-out
Toast slide out: translateY(0) to 16px + opacity 1 to 0, 0.2s ease-in
Page transition: opacity 0 to 1, 0.15s ease-out

### Document upload animation sequence (critical)

The user must never see a frozen screen during upload and analysis. This sequence communicates that work is happening.

```
State 1 — File selected:
  Message: "Uploading your document..."
  UI: Progress bar fills from left to right, tied to actual upload progress.
  Animation: Smooth linear fill.

State 2 — Upload complete, analysis starting:
  Message: "Uploaded. Reading the document now..."
  UI: Progress bar complete. Lighthouse icon pulses gently.
  Animation: Pulse opacity 0.7 to 1.0, 1.2s ease-in-out infinite.

State 3 — Analysis in progress:
  Message: "This can take up to 30 seconds for longer documents."
  UI: Skeleton placeholder in the shape of the results card.
  Animation: Skeleton shimmer left to right, 1.5s.

State 4 — Results ready:
  Message: (results appear)
  UI: Success checkmark draws, results card fades in.
  Animation: Checkmark 0.4s, card opacity 0 to 1 over 0.3s.

State 5 — Error:
  Message: "We could not read that document right now. Try again."
  UI: Warm error toast slides in from bottom.
  Retry button visible immediately.
```

### Forbidden

Spin loaders. Bounce effects. Scale transforms for decoration. Parallax. Auto-playing media. Anything that moves without user intent.

All animations wrapped in: @media (prefers-reduced-motion: no-preference)

---

## COMPONENTS

### Button

```
Primary:    bg --primary, text #fff, radius --radius-md, 52px height mobile
Secondary:  bg transparent, border 1.5px --primary, text --primary, 52px height
Danger:     bg #8B1A1A, text #fff
Ghost:      bg transparent, no border, text --primary
Disabled:   opacity 0.5, cursor not-allowed, no hover state
Loading:    spinner replaces label, width unchanged
Icon+label: icon left, 8px gap, icon 20px
```

Full-width on mobile always. Auto-width on desktop, minimum 140px.

All buttons meet 7:1 contrast ratio in every state.

### Input

```
Height:      52px mobile, 44px desktop
Border:      1.5px --border, radius --radius-md
Focus:       border 1.5px --primary, outline 3px --primary at 30% opacity (AAA focus indicator)
Error:       border 1.5px #8B1A1A, error message below in 13px #8B1A1A
Placeholder: --muted color, never use placeholder as a label
Label:       always above input, 14px, #4A4A4A
```

### Card

```
Background:  #fff
Border:      0.5px --border
Radius:      --radius-lg
Shadow:      --shadow-card
Padding:     20px mobile, 24px desktop
```

Never nest cards more than one level deep.

### Lab value card

```
Container:   white card, left border 4px in status color (red/yellow/green)
Status pill: top right, status color background and text
Value:       32px / 700, status color
Unit:        14px / 400, --muted, inline after value
Name:        15px / 600, --text
Description: 11px / 400, --muted
Explanation: 13px / 400, --text, light background section below value
Trend:       separate section, dot + date + value + bar, all three status colors used
```

### Evidence pill (integrative content)

```
Good evidence:    background #E8F5E9, text #1B5E20
Preclinical only: background #FEF8E1, text #5C3D00
No evidence:      background #F0EDE8, text #4A4A4A
```

### Badge / Pill

```
Height:   24px
Padding:  4px 10px
Radius:   --radius-pill
Font:     13px / 500
```

Use semantic colors only. Never arbitrary colors for decoration.

### Toast notification

```
Position:  bottom center, 16px from bottom, max-width 380px
Duration:  4s for info and success, 8s for errors, persistent for critical
Types:     success, warning, error, info (semantic colors)
Dismiss:   always has X button. Never auto-dismiss critical alerts.
Animation: slides in from bottom, slides out to bottom
```

### Modal

```
Backdrop:   rgba(0,0,0,0.45), tap outside to dismiss except destructive modals
Container:  white, --radius-xl, --shadow-modal, max-width 560px, centered
Header:     title 18px/500 + X button (minimum 44px target)
Body:       scrollable if content exceeds 60vh
Footer:     action buttons right-aligned, destructive left-aligned
```

### Loading skeleton

```
Shape:      matches exact shape of content it replaces
Animation:  shimmer left to right, 1.5s ease-in-out
Color:      #E8E2D9 to #F7F2EA gradient shimmer
Never:      blank white screen, never a spinning circle
```

### Navigation — mobile bottom tab bar

```
Height:       64px total including safe area
Items:        Home, Log, Chat (center, elevated), Docs, Trials
Center item:  circular button elevated above nav bar, --primary background, white icon
Active:       icon filled, label in --primary
Inactive:     icon outline, label in --muted
Background:   white, top border 0.5px --border
Safe area:    always respect iOS home indicator padding
```

Center button is Chat because it is the most important feature. The thing a caregiver reaches for at 2am. It earns the center position.

### Navigation — tablet and desktop sidebar

```
Width:    240px
Items:    same as mobile plus role-specific additions
Active:   role accent color background, white text
Provider adds: Patients, Notes
Admin adds:    Population, Reports, Settings
```

---

## ROLE-SPECIFIC DESIGN

### Caregiver and patient

Mobile-first. Every screen works at 375px width.
Max two taps from home to any feature.
Human language always. Never condition names on the home screen.
Never "Day N of care." Just the date and the patient's name.
Appointments get calendar cards. Not alert triangles.
Recent symptoms described in words. Not color names.
Empty states are encouraging and always include a next action.

Home screen order:
1. Date and patient name ("Caring for Andres")
2. Appointment card if today (calendar icon, not warning icon)
3. Section label "What do you need?"
4. Quick action grid (Upload, Log, Find trials, View docs)
5. Family update button (outlined, not filled, opens modal)
6. Section label "Recent"
7. Recent activity in plain words with status pills

### Provider

Tablet-optimized. Clinical density. No hand-holding.
Patient list with search. Risk flags visible immediately.
Biomarker values shown with status colors.
Last caregiver log visible per patient. Connects caregiver voice to provider view.
One-tap export generates FHIR JSON and PDF simultaneously.
Role accent (deep purple) on active states.

### Hospital administrator

Desktop-first. Dashboard layout.
Population view: active patients, symptom trends, risk flags.
ROI panel: readmissions prevented estimate, CPT billing opportunity.
Department filtering.
Role accent (deep coral) throughout.

### Foundation administrator (CCF)

Desktop-first. Community intelligence layout.
Hero metric: active caregivers this month.
Supporting metrics: symptom logs, trials saved, documents analyzed, logging frequency.
Symptom trend chart: horizontal bars, all in plain language.
Most saved trials: ranked by saves, with phase and recruiting status.
AI insight summary: what caregivers are asking, summarized weekly.
Bidirectional layer: send trial alerts to matched caregivers, send resources to new members. Opt-in only.

All data aggregated and anonymized. Minimum 5 patients per data point shown. No individual patients ever visible.

### Family view-only

Read-only shareable link, no account required, 7-day expiry.
Full view-only account for ongoing access.
Sees: patient summary, recent logs, upcoming appointments, family updates.
Cannot: edit anything, upload, log symptoms.
Simple warm layout. Not the full app.

---

## FEATURE DESIGN STANDARDS

### Document upload

Seven-state animation sequence. User never sees frozen screen.
After analysis: headline + key findings (lab cards) + full summary + question for care team + symptom connection if available.
Document types: Lab results, Imaging, Discharge summary, Pathology, Operative note, Other.
Max file size: 50MB. Accepted types: PDF, JPG, PNG, HEIC, TXT, CSV.

### Lab result display

Red yellow green always. Instant comprehension without reading.
Single biomarker view: status pill, large value in status color, visual scale where applicable, plain-language explanation.
Trend view: dot + date + value + horizontal bar for each prior result.
Full panel view: table with name, value, unit, status pill per row.
Trend is shown whenever more than one result exists for the same marker.

### Integrative and complementary care section

Always present after lab results and in the AI chat.
Sections: Nutrition, Movement, Integrative approaches, Questions to ask.
Evidence pills on every integrative claim: good evidence, preclinical only, no evidence.
Honest about what exists and what does not. No false reassurance. No false alarm.
Ivermectin, curcumin, and other commonly searched topics addressed directly and accurately.
Always ends with questions to bring to the care team.
Never recommends a specific supplement, dose, or protocol.

### Symptom logger

Title: "How is [name] doing today?" for caregiver. "How are you feeling today?" for patient.
Sub: "Take your time. There are no wrong answers."

Sections in order:
1. Color scale (required): Blue, Yellow, Orange, Red, Dark red. Maps to 1-5.
2. Sensation type (optional, multi-select): 9 chips in 3-column grid.
3. Timing (optional, multi-select): 5 chips.
4. Functional status (required): 5 options from moving normally to stayed in bed.
5. Appetite (required for CCA and similar): 5 options.
6. Condition-specific symptoms: loaded from condition_template.symptom_schema.
7. Notes (optional): free text, "A word or nothing at all."

Alert rules:
Functional "needs help" or "stayed in bed": warm banner, consider calling care team.
Appetite "barely eating" two days in a row: warm banner, worth a call.
Any infection sign: immediate alert, go to ER if two or more present.

Color names never appear in the home screen recent activity. Plain words only.

### Clinical trials

CCA-specific filters: tumor location, CA 19-9 level, treatment line, FGFR2, IDH1.
Trial card: title, phase badge, recruiting badge, location, 2-line AI summary.
One-click apply: generates pre-filled mailto to trial coordinator, oncologist CC option.
Saved trials tab: all saved trials with notes field.

### Family update

Pulls from: symptom logs, medications, appointments for selected date range.
Language toggle: English and Spanish. Both generated simultaneously.
Output in editable textarea. No asterisks visible. Rendered or stripped.
Share: copy to clipboard, share sheet, WhatsApp direct link.
Shareable link: read-only, no account required, 7-day expiry, first name only.

### Provider export

PDF and FHIR R4 JSON generated simultaneously on one tap.
PDF: Clarifer header, patient name and DOB, condition, medications, symptom log 30 days, documents list, care team, appointments. DM Sans 10pt.
FHIR: Patient, Condition, Observation, MedicationStatement, DocumentReference, Appointment resources. Exported as .json download.
Audit log written on every export.

### Chat (AI companion)

AI bubble: white card, --border border, --text color. Never dark background.
User bubble: --primary background, white text.
AI avatar: lighthouse PNG 28px, border-radius 50%, object-fit contain.
Typing indicator: three-dot pulse while AI responds.
File attachment: shows filename and "Uploaded. Analyzing..." state.
After analysis: summary card inline in chat.
Error: warm message and retry. Never blank.

### Emergency card

Loads in under 2 seconds. Works offline (cached on device).
Content: patient name, DOB, condition, medications, allergies, emergency contacts, care team with phones, insurance.
Print-optimized. One page.
Available without authentication for 24 hours after last login.

---

## EMPTY STATES

Every empty state has three elements:
1. Warm icon or illustration
2. Human message explaining why it is empty
3. Clear action to fill it

Examples:
Symptoms: "Nothing logged yet. How is [name] feeling today?" + Log symptoms button.
Documents: "No documents yet. Upload a discharge summary or lab result." + Upload button.
Trials: "No trials found for this search. Try removing a filter." + Clear filters button.
Appointments: "Nothing scheduled. Add an upcoming appointment." + Add button.

Never: "No data", "Nothing here", "Empty", generic error icons.

---

## ERROR STATES

Every error message:
1. Says what happened in plain language
2. Says what to do next
3. Offers retry where applicable
4. Never blames the user

Examples:
Upload failed: "We could not upload that file. Check your connection and try again." + Retry.
Analysis failed: "We could not read that document right now. Try again in a moment." + Retry.
Offline: "You appear to be offline. Clarifer will sync when you reconnect."
Session expired: "You have been signed out for security. Sign in again to continue."

---

## ACCESSIBILITY — WCAG AAA

7:1 contrast ratio minimum for body text.
4.5:1 minimum for large text (18px bold or 24px regular).
All color pairs in this system have been chosen to meet 7:1.

Focus states: visible 3px outline in --primary at full opacity on all interactive elements. Never hidden. Never styled away.

Screen reader: all images have descriptive alt text. All icons have aria-labels. All forms have associated labels. All modals have role="dialog" and aria-labelledby.

Touch targets: 48px minimum on all tappable elements. 52px preferred.

No information conveyed by color alone. Status always paired with text label (Normal, Flagged, Critical) in addition to color.

Reduced motion: all animations wrapped in prefers-reduced-motion: no-preference.

Keyboard navigation: all features reachable and operable by keyboard alone. Tab order follows visual reading order.

Language: lang attribute set correctly. Spanish content marked with lang="es".

---

## HIPAA DISPLAY RULES

Patient full name: visible to caregiver, provider, admin. Never in URLs. Never in push notification body.
Patient MRN: visible to provider and admin only.
Lab values: visible to caregiver, patient, provider. Never in notification body.
Diagnosis: visible to all authenticated roles. Never in email subject lines. Never on caregiver home screen.
Medications: visible to caregiver, patient, provider. Never in notification body.

Push notifications: condition-agnostic text only.
Correct:   "Clarifer: Your document summary is ready."
Incorrect: "Clarifer: His CA 19-9 results are ready."

---

## WHAT CLAUDE CODE DOES WITH THIS DOCUMENT

Read this document in full before writing any UI code.

Every component matches the specifications here.
Any deviation is flagged as DECISION REQUIRED and stopped.

Checklist before every commit:
- No em dashes anywhere in copy or comments
- No hex strings in components, CSS variables only
- No dark backgrounds on AI responses
- No broken touch targets, 48px minimum
- No empty states without warm message and action
- No error states that blame the user
- No condition names visible on home screen
- Lab values use red yellow green system
- All color pairs meet 7:1 contrast ratio
- Focus states visible on all interactive elements
- Animations wrapped in prefers-reduced-motion

This document supersedes all previous design decisions.
When in doubt: warm, human, clear, actionable, accessible.
