# CLARIFIER
## Building the Caregiver Intelligence Layer
### A Technical and Business White Paper
**Last Updated: April 22, 2026**
**Clarifer Corp Incorporated: April 22, 2026 (Delaware C-Corp)**
**CCF Demo: June 17, 2026**
**ACL Grant Deadline: July 31, 2026**

---

## ABSTRACT

53 million Americans are unpaid family caregivers. They manage medical documents, medications, symptoms, appointments, and care team communication for their loved ones with no dedicated tooling built to the standard their role demands. The healthcare system has invested billions in electronic health record infrastructure that serves the clinical team. It has invested almost nothing in the family that sits between the clinical team and the patient 23 hours a day.

Clarifer is a HIPAA-compliant caregiver intelligence platform that changes this. It uses large language model document analysis, condition-aware symptom tracking, and a real-time provider data bridge to give caregivers the organizational infrastructure their role requires -- and to give clinical teams the longitudinal patient-reported outcome data they cannot generate from episodic appointments alone.

This paper describes what we are building, why it matters clinically and economically, how we are building it, and the technical architecture that makes it enterprise-grade from day one.

---

## THE PROBLEM

### The Caregiver Is the Most Underserved User in Healthcare

When a patient receives a cancer diagnosis, two things happen simultaneously. The clinical team activates a sophisticated system of records, protocols, and coordination infrastructure built over decades. The family caregiver activates a folder, a notes app, and a prayer.

The caregiver is present for conversations the physician does not have time to fully document. She drives to appointments, fills prescriptions, notices the symptom that appeared three days before the scheduled visit, and makes the decision about whether something is serious enough to call about at 11pm. She is the continuous care layer.

She has no tool built for this role.

The tools that exist are either too simple (reminder apps with no clinical intelligence), too clinical (patient portal extensions designed for compliance rather than usability), or too general (notes apps and spreadsheets that require the caregiver to build her own system from scratch under cognitive load that would challenge anyone).

### The Data Inversion Problem

Clinical decisions are made on episodic data. A patient with cholangiocarcinoma sees their oncologist every two to four weeks. In that appointment, the oncologist has 20 minutes and a verbal report from a caregiver who has been managing daily symptoms, medication side effects, and quality-of-life indicators that never make it into the record.

The data that would most improve clinical decision-making -- longitudinal, daily, patient-reported outcomes from the care environment -- does not exist in any structured form. It lives in the caregiver's head. It disappears when the appointment ends.

Clarifer captures this data. Not as a research project. As a daily tool that the caregiver uses because it makes her life easier, and that produces structured longitudinal data as a byproduct.

### The Readmission Problem

Hospital readmissions cost the US healthcare system over $26 billion annually. Medicare penalizes hospitals for excess readmissions under the Hospital Readmissions Reduction Program. A significant portion of preventable readmissions follow discharge gaps: missed medications, unrecognized symptom escalation, inadequate follow-up on discharge instructions.

These are precisely the gaps a well-designed caregiver platform closes. A caregiver who has the discharge summary analyzed in plain language, the medication schedule tracked with reminders, and a symptom log that surfaces escalation patterns to the clinical team is a caregiver who catches the preventable readmission before it happens.

The economics are direct. A hospital paying $200,000 per year for a Clarifer enterprise license that prevents 15 readmissions at $15,000 each pays for itself in the first year with $25,000 remaining. This is not a cost conversation. It is a revenue conversation.

---

## THE SOLUTION

### What Clarifer Does

Clarifer provides a single organized interface for the caregiver role. It does not attempt to replace the clinical record. It complements it -- capturing what the clinical record cannot, and surfacing it back to the clinical team in a form they can use.

**AI-Powered Document Analysis.** Medical documents -- pathology reports, imaging results, discharge summaries, operative notes, lab results -- are dense, technical, and written for clinical audiences. Clarifer processes these documents through a large language model configured specifically for the caregiver context: identifying key findings, extracting medication references, surfacing provider-noted next steps, and generating the questions the caregiver should bring to the next appointment. The system does not diagnose. It translates.

**Condition-Aware Symptom Logging.** Symptom logging interfaces that ask generic questions produce generic data. Clarifer's symptom logging is driven by condition-specific templates that surface the clinically relevant symptom vocabulary for each diagnosis. For a cholangiocarcinoma patient, the relevant categories are pain location and intensity, jaundice indicators, fatigue level, appetite and nausea, bowel changes, and mental status. The logging interface presents these as visual scales and toggles completable in under 60 seconds. The resulting time-series data is clinically meaningful in a way that a general symptom journal is not.

**Medication Management with Interaction Intelligence.** Current medication list, dosage, frequency, prescribing provider, and refill dates in a single view. Drug interaction checking on every add or edit event. Medication reminders and refill alerts. Adherence tracking that feeds directly into the provider portal.

**Clinical Trial Discovery.** Condition and location-filtered trial discovery across ClinicalTrials.gov for domestic patients and the WHO International Clinical Trials Registry Platform for international patients, with eligibility criteria translated into plain language by the AI layer.

**Family Communication.** A structured family update generator that synthesizes the symptom log, medication record, and recent document highlights into a plain-language narrative, generated simultaneously in English and Spanish, formatted for WhatsApp distribution.

**Provider Data Bridge.** The provider portal gives the clinical team real-time access to caregiver-generated data: the symptom time-series, the medication adherence record, and the caregiver notes flagged for clinical attention. A provider who can see that fatigue increased three days after a medication change has actionable information. A provider receiving a verbal report that the patient "seems tired" does not.

**Hospital-Grade Export.** A structured PDF export meeting clinical documentation standards: full medication list, symptom log as both table and chart, care team directory, appointment history with notes. Built to be handed to an ER physician at 2am and be immediately useful.

### What Clarifer Does Not Do

These boundaries are encoded in the platform's AI configuration and tested on every release:

- Clarifer does not diagnose. Under any framing.
- Clarifer does not recommend changing medications or treatment plans.
- Clarifer does not speculate on prognosis or survival.
- Clarifer does not replace the clinical team.

These are not disclaimers. They are architectural constraints with test coverage.

---

## THE TECHNICAL ARCHITECTURE

### Stack Overview

Clarifer is built on a modern, production-grade stack chosen for reliability, HIPAA compliance posture, and developer productivity:

**Web:** Next.js 14 with App Router and TypeScript in strict mode. Deployed on Vercel. Tailwind CSS with a locked design token system.

**Mobile:** Expo with React Native, TypeScript strict, Expo Router. Built for iOS and Android simultaneously. EAS Build for the build and deployment pipeline. Expo Updates for over-the-air bug fixes without App Store review cycles.

**Backend:** Supabase Pro tier for database, authentication, and file storage. Row Level Security enforced at the database layer on every table. Multi-tenant architecture with organization-level data isolation from day one.

**AI:** Anthropic Claude API, server-side only. Document analysis uses the full model for complex reasoning. Family updates, trial eligibility translation, and appointment preparation prompts use the fast model for latency-sensitive interactions. All responses stream with first token delivery under 500 milliseconds.

**Infrastructure:** Upstash Redis for rate limiting on all AI and authentication routes. Sentry for error monitoring. Brevo for email. Vercel Preview Deployments for branch-based testing.

### HIPAA Compliance Architecture

HIPAA compliance is not a checklist item applied at launch. It is the architectural foundation.

**Audit logging** is implemented as a mandatory write on every patient data read, write, update, and delete. The audit log records the user ID, patient ID, action type, resource type, resource ID, IP address, user agent, and timestamp. If the audit write fails, the data operation fails. There is no path to modifying patient data without an audit record.

**Role-based access control** is enforced at the API layer on every route. Not at the UI layer. The check order is authentication first, then authorization by role, then processing. A provider cannot access document upload routes. A caregiver cannot access admin analytics. A hospital administrator cannot access individual patient records. These restrictions are tested in the automated test suite.

**Row Level Security** is enabled on every Supabase table on creation. The RLS policies enforce tenant isolation at the database level, meaning a query from organization A cannot return records from organization B regardless of what the application layer requests.

**Data minimization** is applied to all AI prompts. Patient context is stripped to the minimum necessary before transmission to the Anthropic API. No personally identifying information enters prompts without explicit consent and Business Associate Agreement confirmation.

**Consent architecture** is granular. Document upload requires separate consent logged to a dedicated table with user ID, patient ID, consent type, accepted timestamp, disclaimer version, and user agent. Research data sharing consent is per-patient and per-field, with each data category (labs, documents, symptoms, medications) independently revocable.

### The Condition-Agnostic Architecture

The single most important architectural decision in Clarifer is the condition template system. Nothing disease-specific is hardcoded. A condition_templates database table drives all AI context, symptom vocabulary, clinical trial filters, care team role definitions, and document type classifications.

A patient profile has a condition_template_id. The AI system prompt loads the correct clinical context for that condition. The symptom logging interface renders the correct fields. The trial discovery filter applies the correct criteria.

Adding a new condition to Clarifer is a data insertion. It requires no code change. This is the architectural decision that makes Clarifer condition-agnostic in practice rather than in aspiration, and it is the foundation on which the platform scales from one condition to hundreds.

### The Multi-Tenant Architecture

Clarifer is built multi-tenant from day one. An organizations table serves as the tenancy anchor. Every user-facing table carries a tenant_id. Row Level Security policies enforce tenant isolation at the database level.

This architecture supports three business model requirements simultaneously: the B2C subscription layer where individual caregivers operate in their own organizational context, the hospital licensing layer where an institution deploys a branded instance for their patient population, and the white-label layer where partners deploy Clarifer under their own subdomain and branding.

Retrofitting multi-tenancy onto a single-tenant schema is one of the most expensive engineering mistakes a health tech company can make. It was not made here.

---

## THE BUILD PROCESS

### Agent-Directed Development

Clarifer is being built using Claude Code as the primary development agent, operating against a structured specification document (CLAUDE.md) in the repository root. This approach is not experimental. It is a deliberate architectural decision about how to build a HIPAA-grade platform efficiently with a small founding team.

The specification document encodes the complete architectural contract: the tech stack with exact dependency versions, the non-negotiable HIPAA enforcement rules, the AI guardrails, the database schema, the API route definitions, the design system tokens, and the current sprint specification with explicit acceptance criteria.

The agent builds against this specification. The founder reviews the output, approves or corrects, and advances the sprint. Product decisions, system prompt authoring, SQL migration execution, and App Store submission remain with the founder. The agent builds everything else.

This is not a prototype process. The output is production code with full test coverage. The testing specification requires 100% coverage on Tier 1 critical paths (audit logging, access control, consent flows, guardrails), 90% on core feature logic, and 70% on supporting UI. A CI/CD pipeline enforces TypeScript zero errors, lint zero errors, and all tests passing before any merge to the main branch.

### The Sprint Structure

Development runs in two-day sprints. Day one is build. Day two is review, correction, and commit. The sprint specification is written before any code is produced. The CLAUDE.md current sprint section defines the exact screens being built, the acceptance criteria for each, the Supabase tables being read and written, and the explicit out-of-scope items.

Twenty sprints cover the full feature set from foundation through App Store submission. The sprint sequence is designed to respect dependency order: multi-tenancy before provider portal, streaming AI before any AI feature ships, core caregiver workflow before demo environment, demo environment before the CCF demonstration.

### Quality Standard

The quality bar is defined by three hypothetical reviewers:

A pharmaceutical executive downloading the app in an airport should see a finished, professional, enterprise-grade product and immediately want to license it to their patient population.

A hospital CFO reviewing the readmission math should see a product that pays for itself in year one and generates new Medicare billing revenue.

A HIPAA auditor reviewing the codebase should find audit logs on every data access, encrypted PHI, Business Associate Agreements in place, role-based access enforced at the API layer, and consent flows documented with timestamps.

If any of those three reviewers would not be satisfied, it does not ship.

---

## THE BUSINESS MODEL

### Four Revenue Streams

**B2C Subscription.** $100 per year. Document analysis is available on a limited free tier. Full feature access requires subscription. Target: 100,000 subscribers in three years, generating $10 million in annual recurring revenue. The subscriber base is also the research data asset.

**Hospital Licensing.** $150,000 to $300,000 per hospital system per year. The procurement argument combines cost reduction (readmission prevention) and revenue generation (CPT reimbursement codes 99490 for Chronic Care Management and 99453/99454 for Remote Patient Monitoring). A hospital system that prevents 15 readmissions and generates new billable CCM revenue pays for the license in year one with margin.

**Fertility Clinic Per-Patient Licensing.** $50 to $100 per patient. The IVF caregiver persona represents a distinct market with high willingness to pay, clinical complexity, and frequent document volume. 100 fertility clinic partnerships at 500 patients each generates $3.75 million in annual recurring revenue.

**Research Data Licensing (Series B).** An IRB-governed, opt-in, anonymized dataset of patient-reported outcomes from caregivers managing specific conditions. Pharmaceutical companies running clinical trials need real-world patient-reported outcome data. They currently have limited means to acquire it at scale from the caregiver population. Clarifer generates this data as a byproduct of normal platform use. At Series B, this becomes the primary valuation argument.

### The Competitive Position

Epic Systems is a $50 billion private company that owns the hospital side of the care relationship. The electronic health record, the clinical workflow, the billing infrastructure -- Epic owns all of it.

Clarifer owns the other side. The family. The 53 million caregivers who make daily decisions in the space between clinical appointments. No product currently serves this population at the quality level required by hospital procurement, HIPAA auditors, and caregivers who need it to work at 2am.

The moat is the combination of HIPAA-grade AI document analysis at caregiver-level usability, the provider data bridge that inverts the symptom data flow, and the founding story that no competitor can manufacture.

---

## THE FOUNDING STORY

This platform was built by a caregiver. While caring for her father through stage 4 cholangiocarcinoma, she had the documents, the medications, and the appointments. She had no tool built for what she was doing.

She built one.

The anchor in the Clarifer logo is tied to her father's love of fishing. It is not decorative. It is the reason the platform exists, the reason every design decision is made with warmth rather than clinical efficiency, and the reason the quality bar is as high as it is. When the person who built the tool was the person who needed it, the product requirements are not abstract.

This founding story is the most defensible asset the company has. Every competitor with more capital cannot buy the credibility that comes from building something real for a real reason.

---

## CURRENT STATUS AND NEAR-TERM MILESTONES

**Platform:** Live at clarifer.com. Next.js web application with core caregiver features operational. Deployed on Vercel.

**Mobile:** Expo React Native application in active development, building simultaneously with web.

**Sprint 1 (April 22, 2026):** ✅ COMPLETE. Four production bugs fixed, tested, and committed to main.

**Sprint 2 (April 25 – May 1, 2026):** Streaming AI implementation. All AI routes must show first token under 500ms. Critical path for CCF demo.

**Sprint 3 (May 5 – May 9, 2026):** Multi-tenancy migration. organizations table, tenant_id on all user-facing tables, RLS enforcement.

**CCF Demo (June 17, 2026):** Demonstration for the Cholangiocarcinoma Foundation Chief Patient Officer. Goal: written letter of support for ACL grant application and caregiver introductions from their network.

**ACL Caregiver AI Challenge (Deadline July 31, 2026):** Up to $2.5 million in non-dilutive funding. Primary requirement: 10 real caregivers using the platform with documented feedback.

**Delaware C-Corp Incorporation (Completed April 22, 2026):** Clarifer Corp filed via every.io. EIN arriving within 1-2 weeks. Bank account opens immediately after EIN.

**Series Seed:** Targeted after ACL grant decision and first hospital partnership signal. Target investors include Backstage Capital, Harlem Capital, Cedars-Sinai Accelerator, NIH SBIR, and the Robert Wood Johnson Foundation.

---

## CONCLUSION

The infrastructure gap in caregiving is not a product problem waiting for a clever feature. It is a systems problem that requires clinical intelligence, HIPAA-grade data architecture, and design that treats the caregiver as the professional she is.

Clarifer is built to that standard. The technical architecture is enterprise-grade from day one because the customers who will pay for it require enterprise-grade infrastructure. The design is warm and human because the user is a person in a hospital parking lot who deserves better than a clunky tracker.

The founding story is true. The market is 53 million caregivers. The business model has four revenue streams with an asset that compounds in value every day the platform is live. The build is underway.

---

*Clarifer is a product of Clarifer Corp (Delaware C-Corp, incorporated April 22, 2026).*
*For partnership inquiries: clarifer.com*
