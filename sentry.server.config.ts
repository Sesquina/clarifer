import * as Sentry from "@sentry/nextjs";

const MEDICAL_KEYWORDS = /\b(diagnosis|symptom|medication|bilirubin|albumin|cancer|tumor|chemo|oncolog|patient|caregiver|lab.?result|cholangiocarcinoma)\b/i;

Sentry.init({
  dsn: "https://7401b6f7ab878fadcbd51e22c6b281bc@o4511125988900864.ingest.us.sentry.io/4511126003908608",
  tracesSampleRate: 0.2,
  enableLogs: true,
  sendDefaultPii: false,
  beforeSend(event) {
    const message = event.message || "";
    const exceptionValue = event.exception?.values?.[0]?.value || "";
    if (MEDICAL_KEYWORDS.test(message) || MEDICAL_KEYWORDS.test(exceptionValue)) {
      return null;
    }
    // Strip request body data
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }
    return event;
  },
});
