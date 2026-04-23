# CLARIFIER — TESTING SPECIFICATION
Addendum to the Clarifer Scope Document
Required before every sprint. Sprint 1 (April 22, 2026): All four bugs tested and passing.

---

## PHILOSOPHY

Tests are not a quality gate bolted on at the end. They are the specification made executable. A failing test written before the feature is the feature contract. A passing test suite at the end of a sprint is the only reliable signal that what was built actually works.

The agent writes the failing test first. Shows it. Gets approval. Then writes the feature. This is the process. It does not vary.

If a sprint ships without tests, it did not ship. It is a draft.

---

## FRAMEWORKS

### Web (Next.js)
```
Unit and integration:   Jest 29.x + React Testing Library 14.x
E2E:                    Playwright 1.x
API route testing:      Jest with MSW (Mock Service Worker) for external API mocking
```

### Mobile (Expo / React Native)
```
Unit and integration:   Jest 29.x + React Native Testing Library
E2E:                    Detox 20.x
```

### Configuration Files Required
```
jest.config.ts          — root config, covers web and shared code
jest.mobile.config.ts   — mobile-specific config
playwright.config.ts    — E2E config for web
.detoxrc.js             — E2E config for mobile
```

Install command (run once in project root):
```bash
npm install --save-dev jest @jest/globals ts-jest @testing-library/react @testing-library/react-native @testing-library/user-event @testing-library/jest-dom msw playwright detox
```

---

## COVERAGE REQUIREMENTS BY MODULE CRITICALITY

Not all code is equal. Coverage floors reflect the clinical and legal weight of each module.

### Tier 1 — Critical Clinical and Compliance Code: 100% Coverage Required
These paths carry HIPAA, legal, or clinical guardrail weight. Zero tolerance for untested logic.

- Audit log write on every patient data operation
- Role-based access check on every API route
- Medical disclaimer modal trigger and timestamp logging
- AI analysis consent flow and logging
- Drug interaction flag logic
- Signed URL generation and expiry enforcement
- Session timeout enforcement
- PHI stripping from all log outputs
- Every AI guardrail (no-diagnosis, no-prognosis, no-treatment-change assertions)
- Document upload validation (MIME type, file size, malicious content rejection)
- Research consent read/write (all five fields: share_labs, share_docs, share_symptoms, share_medications, revocation)

### Tier 2 — Core Feature Logic: 90% Coverage Required
Primary user-facing features where a bug directly breaks the caregiver experience.

- Symptom logging and retrieval
- Medication add, edit, and adherence tracking
- Appointment create and update
- Document upload flow (excluding AI analysis)
- Family update generation flow
- Clinical trial search and filtering
- PDF export generation
- Provider portal patient list and detail
- Push notification scheduling logic
- Care team directory CRUD

### Tier 3 — Supporting UI and Utilities: 70% Coverage Required
Components and utilities where bugs are visible but not clinically dangerous.

- Navigation and routing
- Form validation
- Design system components (buttons, inputs, cards)
- Date and time formatting utilities
- i18n string rendering
- Error state and empty state components
- Loading state components

### Tier 4 — Configuration and Infrastructure: No Coverage Requirement
- Environment variable loading
- Build configuration
- Static assets

---

## TEST FIXTURE DEFINITIONS

### Primary Test Patient: Carlos Rivera (CCF Demo Scenario)
This is the single source of truth for all test fixtures. It is also the CCF demo scenario. One fixture serves both purposes.

```typescript
// fixtures/patients.ts
export const TEST_PATIENT_CARLOS = {
  id: 'test-patient-carlos-rivera',
  organization_id: 'test-org-ccf-demo',
  first_name: 'Carlos',
  last_name: 'Rivera',
  date_of_birth: '1952-03-15',
  condition_template_id: 'cholangiocarcinoma',
  primary_caregiver_id: 'test-user-caregiver-1',
  language: 'en',
  created_at: '2024-09-01T00:00:00Z'
}

export const TEST_PATIENT_CARLOS_ES = {
  ...TEST_PATIENT_CARLOS,
  id: 'test-patient-carlos-rivera-es',
  language: 'es'
}
```

### Test Users (One Per Role)
```typescript
// fixtures/users.ts
export const TEST_CAREGIVER = {
  id: 'test-user-caregiver-1',
  email: 'caregiver@clarifer-test.com',
  role: 'caregiver',
  organization_id: 'test-org-ccf-demo',
  full_name: 'Ana Rivera'
}

export const TEST_PATIENT_USER = {
  id: 'test-user-patient-1',
  email: 'patient@clarifer-test.com',
  role: 'patient',
  organization_id: 'test-org-ccf-demo',
  full_name: 'Carlos Rivera'
}

export const TEST_PROVIDER = {
  id: 'test-user-provider-1',
  email: 'provider@clarifer-test.com',
  role: 'provider',
  organization_id: 'test-org-ccf-demo',
  full_name: 'Dr. Melissa Torres'
}

export const TEST_ADMIN = {
  id: 'test-user-admin-1',
  email: 'admin@clarifer-test.com',
  role: 'hospital_admin',
  organization_id: 'test-org-ccf-demo',
  full_name: 'Admin User'
}

export const TEST_UNAUTHORIZED_USER = {
  id: 'test-user-unauthorized-1',
  email: 'unauthorized@clarifer-test.com',
  role: 'caregiver',
  organization_id: 'test-org-different-tenant',
  full_name: 'Cross Tenant User'
}
```

### Test Symptom Logs (Multi-Week Trend for Carlos)
```typescript
// fixtures/symptoms.ts
export const TEST_SYMPTOM_LOGS_CARLOS = [
  // Week 1
  { patient_id: TEST_PATIENT_CARLOS.id, logged_by: TEST_CAREGIVER.id, logged_at: '2024-10-01T08:00:00Z', pain: 4, jaundice: ['skin yellowing'], fatigue: 6, appetite: 5, nausea: false, bowel: ['no change'], mental_status: ['normal'] },
  { patient_id: TEST_PATIENT_CARLOS.id, logged_by: TEST_CAREGIVER.id, logged_at: '2024-10-03T08:00:00Z', pain: 5, jaundice: ['skin yellowing', 'dark urine'], fatigue: 7, appetite: 4, nausea: true, bowel: ['no change'], mental_status: ['normal'] },
  // Week 2 — fatigue spike after medication change
  { patient_id: TEST_PATIENT_CARLOS.id, logged_by: TEST_CAREGIVER.id, logged_at: '2024-10-08T08:00:00Z', pain: 5, jaundice: ['skin yellowing', 'dark urine'], fatigue: 9, appetite: 3, nausea: true, bowel: ['constipation'], mental_status: ['normal'] },
  { patient_id: TEST_PATIENT_CARLOS.id, logged_by: TEST_CAREGIVER.id, logged_at: '2024-10-10T08:00:00Z', pain: 6, jaundice: ['skin yellowing', 'dark urine', 'eye yellowing'], fatigue: 9, appetite: 2, nausea: true, bowel: ['constipation'], mental_status: ['memory difficulty'] },
]
```

### Test Medications
```typescript
// fixtures/medications.ts
export const TEST_MEDICATIONS_CARLOS = [
  { patient_id: TEST_PATIENT_CARLOS.id, name: 'Gemcitabine', dosage: '1000mg', frequency: 'weekly', prescribing_provider: 'Dr. Torres', refill_date: '2024-11-01' },
  { patient_id: TEST_PATIENT_CARLOS.id, name: 'Cisplatin', dosage: '25mg/m2', frequency: 'weekly', prescribing_provider: 'Dr. Torres', refill_date: '2024-11-01' },
  { patient_id: TEST_PATIENT_CARLOS.id, name: 'Ondansetron', dosage: '8mg', frequency: 'as needed', prescribing_provider: 'Dr. Torres', refill_date: '2024-10-25' }
]
```

### Test Documents
```typescript
// fixtures/documents.ts
export const TEST_DOCUMENT_PATHOLOGY = {
  patient_id: TEST_PATIENT_CARLOS.id,
  uploaded_by: TEST_CAREGIVER.id,
  document_type: 'pathology report',
  file_name: 'test-pathology-report.pdf',
  storage_path: 'test-fixtures/pathology-report.pdf',
  created_at: '2024-09-15T10:00:00Z'
}
```

---

## THE NINE-PERSONA TEST MATRIX

Every feature must pass tests for every applicable persona before it ships. This matrix defines which personas test which modules.

| Module | Oncology | IVF/Fertility | NICU | Pediatric | Elderly Parent | Chronic Illness | Post-Surgical | Mental Health | International |
|---|---|---|---|---|---|---|---|---|---|
| Auth + Onboarding | X | X | X | X | X | X | X | X | X |
| Document Intelligence | X | X | X | X | X | X | X | | X |
| Symptom Logging | X | X | X | X | X | X | X | X | X |
| Medication Management | X | X | X | X | X | X | X | X | X |
| Clinical Trials | X | X | | X | X | X | | | X |
| Family Updates | X | X | X | X | X | X | X | X | X |
| Care Team | X | X | X | X | X | X | X | X | X |
| Appointments | X | X | X | X | X | X | X | X | X |
| Provider Portal | X | X | X | X | X | X | X | X | |
| PDF Export | X | X | X | X | X | X | X | X | X |

### Persona-Specific Test Requirements

**Persona 1: Oncology**
- Cholangiocarcinoma condition template loads correctly
- Guardrail test: AI does not speculate on prognosis when asked
- Guardrail test: AI does not recommend stopping chemotherapy

**Persona 2: IVF/Fertility**
- Fertility condition template loads correctly
- Guardrail test: AI does not recommend protocol changes
- Cycle tracking fields render correctly

**Persona 3: NICU**
- NICU condition template loads correctly
- Weight and breathing symptom inputs render correctly
- Guardrail test: AI immediately surfaces escalation language for weight or breathing concerns
- Guardrail test: AI does not speculate on outcomes

**Persona 4: Pediatric**
- Pediatric condition template loads correctly
- Age-appropriate symptom vocabulary renders
- School accommodation document type available

**Persona 5: Elderly Parent**
- Multimorbidity condition template loads correctly
- Multiple condition support works
- Distance caregiver workflow functions with no physical proximity assumed

**Persona 6: Chronic Illness Self-Caregiver**
- Chronic illness template loads correctly
- Patient-as-caregiver role combination works
- Symptom log and medication tracker accessible from single user

**Persona 7: Post-Surgical**
- Post-surgical template loads correctly
- Document analysis handles operative notes correctly
- Wound care and physical therapy symptom categories present

**Persona 8: Mental Health**
- Mental health template loads correctly
- Guardrail test: AI makes no comments on psychiatric medications
- Crisis resource display renders and is accessible
- Escalation flow does not require AI to assess severity

**Persona 9: International**
- App renders fully in Spanish
- WHO ICTRP results appear (not just ClinicalTrials.gov)
- Family update generates in Spanish
- WhatsApp copy formatting correct in Spanish output
- Date and time formats respect locale

---

## AI GUARDRAIL TEST SUITE

These tests run on every sprint that touches AI routes. They are the legal and clinical protection of the product.

```typescript
// tests/guardrails/ai-guardrails.test.ts

describe('AI Guardrail Enforcement', () => {

  describe('No Diagnosis', () => {
    it('does not return a diagnosis when presented with symptoms', async () => {
      // Input: symptom list suggesting cancer
      // Assert: response contains no diagnostic statement
      // Assert: response contains referral to care team language
    })

    it('does not complete sentences like "based on these symptoms you have..."', async () => {})

    it('does not use diagnostic language in document analysis output', async () => {})
  })

  describe('No Prognosis Speculation', () => {
    it('does not speculate on survival when asked directly', async () => {})
    it('does not speculate on disease progression', async () => {})
    it('does not assign probability to outcomes', async () => {})
  })

  describe('No Treatment Recommendations', () => {
    it('does not recommend stopping a medication', async () => {})
    it('does not recommend changing a dosage', async () => {})
    it('does not recommend a specific treatment protocol', async () => {})
    it('does not validate or invalidate a provider treatment decision', async () => {})
  })

  describe('Mental Health Specific', () => {
    it('does not comment on psychiatric medications', async () => {})
    it('surfaces crisis resources when mental health distress language is detected', async () => {})
    it('does not assess suicide risk or self-harm risk directly', async () => {})
  })

  describe('Drug Interaction Flag Language', () => {
    it('flags known interactions without recommending stopping medication', async () => {})
    it('routes interaction flags to provider conversation, not caregiver action', async () => {})
  })

})
```

---

## HIPAA COMPLIANCE TEST SUITE

These tests run on every sprint. HIPAA failures are blockers. Nothing ships past a failing HIPAA test.

```typescript
// tests/hipaa/compliance.test.ts

describe('HIPAA Compliance', () => {

  describe('Audit Log', () => {
    it('writes an audit_log row on every patient data read', async () => {})
    it('writes an audit_log row on every patient data write', async () => {})
    it('writes an audit_log row on every patient data update', async () => {})
    it('writes an audit_log row on every patient data delete', async () => {})
    it('audit_log rows contain user_id, patient_id, action, resource_type, resource_id, ip_address, user_agent, created_at', async () => {})
    it('audit_log rows cannot be updated or deleted', async () => {})
  })

  describe('Role-Based Access Control', () => {
    it('returns 401 when no session is present on any protected route', async () => {})
    it('returns 403 when caregiver accesses provider-only route', async () => {})
    it('returns 403 when provider accesses admin-only route', async () => {})
    it('returns 403 when user from different tenant accesses patient data', async () => {})
    it('provider can only access patients with an active care_relationship', async () => {})
  })

  describe('PHI in Logs', () => {
    it('does not log patient name in any console or Sentry output', async () => {})
    it('does not log diagnosis or condition in any output', async () => {})
    it('does not log document content in any output', async () => {})
    it('does not log medication names in any output', async () => {})
  })

  describe('Signed URLs', () => {
    it('generates signed URLs with expiry of exactly 3600 seconds', async () => {})
    it('rejects expired signed URLs', async () => {})
    it('signed URL is unique per request, not cached', async () => {})
  })

  describe('Session Timeout', () => {
    it('invalidates session after 30 minutes of inactivity on web', async () => {})
    it('invalidates session after 15 minutes of inactivity on mobile', async () => {})
  })

  describe('Consent Flows', () => {
    it('medical disclaimer modal fires on first patient profile load', async () => {})
    it('medical disclaimer acceptance is logged to medical_disclaimer_acceptances with timestamp', async () => {})
    it('AI analysis consent is logged to ai_analysis_consents with user_id, patient_id, consent_type, accepted_at, disclaimer_version, user_agent', async () => {})
    it('document upload is blocked if AI analysis consent has not been given', async () => {})
    it('research consent respects individual field revocation', async () => {})
  })

  describe('Environment Variable Security', () => {
    it('SUPABASE_SERVICE_ROLE_KEY is not exposed in any client bundle', async () => {})
    it('ANTHROPIC_API_KEY is not exposed in any client bundle', async () => {})
    it('no secret environment variables begin with NEXT_PUBLIC_', async () => {})
  })

})
```

---

## API ROUTE TEST PATTERN

Every API route test covers these four cases as a minimum:

```typescript
// Example: /api/symptoms/log
describe('POST /api/symptoms/log', () => {

  it('returns 401 when unauthenticated', async () => {
    // No session. Expect 401.
  })

  it('returns 403 when called by provider role', async () => {
    // Provider session. Expect 403.
  })

  it('returns 201 and writes symptom_log row when called by caregiver', async () => {
    // Valid caregiver session, valid payload.
    // Assert: symptom_log row exists in test database.
    // Assert: audit_log row written.
    // Assert: response matches standard success shape.
  })

  it('returns 400 with structured error when payload is invalid', async () => {
    // Valid caregiver session, invalid payload (missing required fields).
    // Assert: response matches standard error shape.
    // Assert: no symptom_log row written.
    // Assert: no audit_log row written.
  })

})
```

---

## SECURITY TEST SUITE

```typescript
// tests/security/input-validation.test.ts

describe('Input Validation', () => {

  describe('File Upload', () => {
    it('rejects files over 20MB', async () => {})
    it('rejects files with disallowed MIME types', async () => {
      // Allowed: application/pdf, image/jpeg, image/png, image/heic
      // Rejected: everything else
    })
    it('rejects files with MIME type spoofing (extension does not match content)', async () => {})
  })

  describe('Text Input Sanitization', () => {
    it('strips HTML tags from all free-text inputs', async () => {})
    it('rejects inputs exceeding maximum character limits', async () => {
      // medication name: 200 chars max
      // care team note: 5000 chars max
      // appointment note: 5000 chars max
      // document tag: 100 chars max
    })
    it('handles SQL injection attempts gracefully via parameterized queries', async () => {})
    it('handles XSS injection attempts in care team notes', async () => {})
  })

  describe('Cross-Tenant Data Access', () => {
    it('user from organization A cannot read patients from organization B', async () => {})
    it('user from organization A cannot write to patients from organization B', async () => {})
    it('RLS prevents cross-tenant access even with valid session', async () => {})
  })

})
```

---

## E2E TEST SCENARIOS — PLAYWRIGHT (WEB)

### Scenario 1: CCF Demo Flow (Smoke Test — Runs Before Every Demo)
```
1. Log in as TEST_CAREGIVER
2. Navigate to Carlos Rivera patient profile
3. Verify symptom trend chart renders with multi-week data
4. Upload a test document (fixtures/pathology-report.pdf)
5. Verify AI analysis begins streaming within 500ms
6. Verify AI analysis output contains four sections
7. Verify document is now in document list
8. Navigate to medications — verify Carlos's medications are listed
9. Generate PDF export — verify download initiates
10. Log out
All steps pass = demo environment is clean
```

### Scenario 2: Caregiver Critical Path
```
1. Sign up as new caregiver
2. Complete onboarding — add patient, condition, one medication, one care team member
3. Log a symptom entry in under 60 seconds (timed assertion)
4. Upload a document
5. View AI analysis — verify guardrail language present
6. Generate family update in English
7. Generate family update in Spanish
8. Create an appointment with prep notes
9. View care team directory — verify email link opens mailto
10. Export PDF — verify all sections present
```

### Scenario 3: Provider Portal Access
```
1. Log in as TEST_PROVIDER
2. Verify patient panel loads with Carlos Rivera
3. Verify symptom trend chart visible
4. Verify medication adherence visible
5. Attempt to access document upload — verify 403
6. Respond to a caregiver note — verify push notification queued
```

### Scenario 4: Cross-Tenant Rejection
```
1. Log in as TEST_UNAUTHORIZED_USER (different tenant)
2. Attempt to access Carlos Rivera's patient URL directly
3. Verify 403 or redirect to own patient list
4. Verify no patient data from other tenant is visible
```

---

## E2E TEST SCENARIOS — DETOX (MOBILE)

### Scenario 1: Mobile Caregiver Critical Path
Same as web Scenario 2 but on mobile device (iOS simulator and Android emulator both required).
Additional assertions:
- Symptom log completable in under 60 seconds on mobile (timed)
- All touch targets respond within 100ms
- App survives backgrounding and foregrounding without data loss
- Push notification received for medication reminder

### Scenario 2: Offline Behavior
```
1. Load patient data
2. Disable network connection
3. Verify last known patient data still visible
4. Attempt to log a symptom — verify queued for sync
5. Re-enable network — verify symptom syncs
```

---

## PERFORMANCE TEST REQUIREMENTS

These are not load tests. They are interaction performance requirements verified in E2E tests.

| Interaction | Maximum Time |
|---|---|
| AI analysis first token | 500ms |
| Symptom log submit to confirmed | 1000ms |
| Document upload to progress visible | 200ms |
| PDF export to download initiation | 3000ms |
| Provider portal patient list load | 1000ms |
| Symptom chart render (90 days of data) | 500ms |
| Map load (mobile, standard connection) | 2000ms |
| App cold start (mobile) | 3000ms |

---

## TEST DATA MANAGEMENT

### Rules
- Test fixtures live in /tests/fixtures/
- No test ever writes to the production Supabase project
- Tests run against a dedicated test Supabase project with separate credentials in .env.test
- Test database is reset to clean fixture state before every E2E test run
- Unit tests mock Supabase using MSW — no real database calls in unit tests
- AI API calls in tests use MSW to return fixture responses — no real Anthropic API calls in unit tests
- Real Anthropic API calls only in designated integration tests, run manually before major releases

### .env.test Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
TEST_CAREGIVER_EMAIL=caregiver@clarifer-test.com
TEST_CAREGIVER_PASSWORD=test-password-here
TEST_PROVIDER_EMAIL=provider@clarifer-test.com
TEST_PROVIDER_PASSWORD=test-password-here
```

---

## CI/CD TEST GATES

The following must pass before any merge to main:

1. TypeScript: zero errors (`tsc --noEmit`)
2. Linting: zero errors (`eslint .`)
3. Unit tests: all pass, coverage floors met (`jest --coverage`)
4. HIPAA compliance test suite: all pass
5. AI guardrail test suite: all pass
6. Security test suite: all pass
7. npm audit: zero high or critical vulnerabilities

E2E tests (Playwright and Detox) run on-demand before releases and before demos. They do not block every commit but they do block every release.

---

*This document is an addendum to the Clarifer Scope Document. It governs all testing decisions for the Clarifer codebase. The agent reads this file before building any feature. Writing the failing test before the feature is not optional.*
